import fs from 'fs'
import path from 'path'
import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import type { PayloadLogger } from 'payload'
import { fileURLToPath } from 'url'
import { CloudflareContext, getCloudflareContext } from '@opennextjs/cloudflare'
import { GetPlatformProxyOptions } from 'wrangler'
import { r2Storage } from '@payloadcms/storage-r2'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Tenants } from './collections/Tenants'
import { Sites } from './collections/Sites'
import { SiteQuotas } from './collections/SiteQuotas'
import { SiteBlueprints } from './collections/SiteBlueprints'
import type { Config } from './payload-types'
import { expandMcpAccessForSuperAdmin } from './utilities/mcpSuperAdminAccess'
import { userHasAllTenantAccess } from './utilities/superAdmin'

/** Collections exposed via MCP (camelCase keys on API key docs must match these slugs). */
const mcpCollectionSlugs = ['tenants', 'users', 'media', 'sites'] as const

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
} as unknown as PayloadLogger

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
  collections: [Tenants, SiteBlueprints, Sites, Users, Media, SiteQuotas],
  editor: lexicalEditor(),
  secret: payloadSecret,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteD1Adapter({ binding: cloudflare.env.D1 }),
  logger: isProduction ? cloudflareLogger : undefined,
  plugins: [
    multiTenantPlugin<Config>({
      /**
       * When true (default), plugin wraps tenants `read` so users with zero assigned
       * tenants get no access — Admin hides Tenants + tenant-scoped collections from nav.
       * We keep collection-level rules in Tenants.ts (read: any logged-in user; writes: super-admin).
       */
      useTenantsCollectionAccess: false,
      collections: {
        sites: {},
        'site-quotas': {},
        'site-blueprints': {},
        /**
         * When tenant access wrapping is on, users with no `tenants[]` assignment cannot `read`
         * media — sidebar entry disappears. Disable wrapping so Media uses collection `access` only.
         */
        media: { useTenantAccess: false },
      },
      userHasAccessToAllTenants: (user) => userHasAllTenantAccess(user),
    }),
    r2Storage({
      bucket: cloudflare.env.R2,
      collections: { media: true },
    }),
    mcpPlugin({
      collections: {
        tenants: {
          enabled: true,
          description:
            'Tenant records (name, slug, domain). Super-admin API keys receive full MCP CRUD; others follow API key checkboxes.',
        },
        users: {
          enabled: true,
          description:
            'Admin users (email, roles, tenant assignments). Super-admin keys get full MCP CRUD; redact secrets in responses as needed.',
        },
        media: {
          enabled: true,
          description: 'Uploads in R2 (alt text and file metadata).',
        },
        sites: {
          enabled: true,
          description:
            'Affiliate / rank-and-rent sites (domain, status, blueprint). Super-admin API keys receive full MCP CRUD.',
        },
      },
      overrideAuth: async (_req, getDefaultMcpAccessSettings) => {
        const settings = await getDefaultMcpAccessSettings()
        if (!userHasAllTenantAccess(settings.user)) {
          return settings
        }
        return expandMcpAccessForSuperAdmin(settings, mcpCollectionSlugs)
      },
      mcp: {
        handlerOptions: {
          verboseLogs: true,
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
