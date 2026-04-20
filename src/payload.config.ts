import fs from 'fs'
import path from 'path'
import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import { CloudflareContext, getCloudflareContext } from '@opennextjs/cloudflare'
import { GetPlatformProxyOptions } from 'wrangler'
import { r2Storage } from '@payloadcms/storage-r2'
import { mcpPlugin } from '@payloadcms/plugin-mcp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const realpath = (value: string) => (fs.existsSync(value) ? fs.realpathSync(value) : undefined)

const isCLI = process.argv.some((value) => realpath(value).endsWith(path.join('payload', 'bin.js')))
const isProduction = process.env.NODE_ENV === 'production'
/** Do not require Worker secrets during Next.js production build. */
const isNextBuild =
  process.env.npm_lifecycle_event === 'build' ||
  process.env.NEXT_PHASE === 'phase-production-build'

const createLog =
  (level: string, fn: typeof console.log) => (objOrMsg: object | string, msg?: string) => {
    if (typeof objOrMsg === 'string') {
      fn(JSON.stringify({ level, msg: objOrMsg }))
    } else {
      fn(JSON.stringify({ level, ...objOrMsg, msg: msg ?? (objOrMsg as { msg?: string }).msg }))
    }
  }

const cloudflareLogger = {
  level: process.env.PAYLOAD_LOG_LEVEL || 'info',
  trace: createLog('trace', console.debug),
  debug: createLog('debug', console.debug),
  info: createLog('info', console.log),
  warn: createLog('warn', console.warn),
  error: createLog('error', console.error),
  fatal: createLog('fatal', console.error),
  silent: () => {},
} as any // Use PayloadLogger type when it's exported

/** During `next build`, use local Miniflare bindings (same pattern as Payload Cloudflare template + OpenNext). */
const cloudflare =
  isCLI || !isProduction || isNextBuild
    ? await getCloudflareContextFromWrangler()
    : await getCloudflareContext({ async: true })

const payloadSecretFromBinding = (cloudflare.env as Cloudflare.Env).PAYLOAD_SECRET
const payloadSecret =
  process.env.PAYLOAD_SECRET?.trim() ||
  (typeof payloadSecretFromBinding === 'string' ? payloadSecretFromBinding.trim() : '') ||
  ''

if (isProduction && !isNextBuild && !isCLI && !payloadSecret) {
  throw new Error(
    'PAYLOAD_SECRET is required in production. Set a Worker secret (e.g. wrangler secret put PAYLOAD_SECRET) or Variables in the Cloudflare dashboard. The value used only for CI migrate is not available to the deployed Worker.',
  )
}

const serverURLFromEnv = (cloudflare.env as Cloudflare.Env).PAYLOAD_PUBLIC_SERVER_URL
const serverURL =
  isProduction && !isNextBuild
    ? (process.env.PAYLOAD_PUBLIC_SERVER_URL?.trim() ||
        (typeof serverURLFromEnv === 'string' ? serverURLFromEnv.trim() : '') ||
        '')
    : ''

export default buildConfig({
  serverURL,
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media],
  editor: lexicalEditor(),
  secret: payloadSecret,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteD1Adapter({ binding: cloudflare.env.D1 }),
  logger: isProduction ? cloudflareLogger : undefined,
  plugins: [
    r2Storage({
      bucket: cloudflare.env.R2,
      collections: { media: true },
    }),
    mcpPlugin({
      collections: {
        users: {
          enabled: { find: true },
          description: 'Authenticated admin users (read-only via MCP; tighten per API key in admin).',
        },
        media: {
          enabled: true,
          description: 'Uploads stored in R2 (alt text and file metadata).',
        },
      },
    }),
  ],
})

// Adapted from https://github.com/opennextjs/opennextjs-cloudflare/blob/d00b3a13e42e65aad76fba41774815726422cc39/packages/cloudflare/src/api/cloudflare-context.ts#L328C36-L328C46
function getCloudflareContextFromWrangler(): Promise<CloudflareContext> {
  return import(/* webpackIgnore: true */ `${'__wrangler'.replaceAll('_', '')}`).then(
    ({ getPlatformProxy }) =>
      getPlatformProxy({
        environment: process.env.CLOUDFLARE_ENV,
        remoteBindings: isProduction && !isNextBuild,
      } satisfies GetPlatformProxyOptions),
  )
}
