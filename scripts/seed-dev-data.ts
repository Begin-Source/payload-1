/**
 * 本地开发库灌入测试数据（幂等：固定 slug/email，已存在则跳过）。
 * Usage: pnpm seed:dev
 */
import 'dotenv/config'

import type { Payload } from 'payload'
import type { PayloadRequest } from 'payload'
import { getPayload } from 'payload'
import type { SQLiteAdapter } from '@payloadcms/db-d1-sqlite'
import type { User } from '../src/payload-types.js'
import config from '../src/payload.config.js'

const PASSWORD = 'SeedTest123!'

const TENANT_SLUG = 'seed-alpha'

const EMAILS = {
  superadmin: 'seed.superadmin@local.test',
  finance: 'seed.finance@local.test',
  ops: 'seed.ops@local.test',
  lead: 'seed.lead@local.test',
  sitemgr: 'seed.sitemgr@local.test',
} as const

type SeedUserDoc = User & { id: number }

function superReq(user: SeedUserDoc): { req: Partial<PayloadRequest> } {
  return {
    req: {
      user: { ...user, collection: 'users' },
    },
  }
}

/**
 * Dev DBs sometimes have schema from `push` without migration `20260421_210000` columns.
 * Apply the same ALTERs as that migration when missing so Local API inserts succeed.
 */
async function ensureSiteScopeColumns(payload: Payload): Promise<void> {
  const db = payload.db as unknown as SQLiteAdapter
  const client = db.client
  if (!client?.prepare) return

  const tableHasColumn = async (table: string, column: string): Promise<boolean> => {
    const res = await client.prepare(`PRAGMA table_info(\`${table}\`)`).all<{ name: string }>()
    const rows = res.results ?? []
    return rows.some((row: { name: string }) => row.name === column)
  }

  if (!(await tableHasColumn('categories', 'site_id'))) {
    console.info('[seed:dev] Patching schema: categories.site_id')
    await client.exec(
      'ALTER TABLE `categories` ADD `site_id` integer REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE set null;',
    )
    await client.exec('CREATE INDEX IF NOT EXISTS `categories_site_idx` ON `categories` (`site_id`);')
  }

  if (!(await tableHasColumn('media', 'site_id'))) {
    console.info('[seed:dev] Patching schema: media.site_id')
    await client.exec(
      'ALTER TABLE `media` ADD `site_id` integer REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE set null;',
    )
    await client.exec('CREATE INDEX IF NOT EXISTS `media_site_idx` ON `media` (`site_id`);')
  }

  if (!(await tableHasColumn('site_blueprints', 'site_id'))) {
    console.info('[seed:dev] Patching schema: site_blueprints.site_id')
    await client.exec(
      'ALTER TABLE `site_blueprints` ADD `site_id` integer REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE set null;',
    )
    await client.exec(
      'CREATE INDEX IF NOT EXISTS `site_blueprints_site_idx` ON `site_blueprints` (`site_id`);',
    )
  }
}

async function main(): Promise<void> {
  /**
   * Users.beforeChange only allows assigning `super-admin` when `userHasAllTenantAccess(req.user)` is true.
   * First-time seed creates the super user without `req.user`, so the role may be stripped; matching email here
   * makes `userHasAllTenantAccess` true for that user so hooks (and role repair) work.
   */
  process.env.PAYLOAD_SUPER_ADMIN_EMAILS = [
    process.env.PAYLOAD_SUPER_ADMIN_EMAILS,
    EMAILS.superadmin,
  ]
    .filter(Boolean)
    .join(',')

  const payload = await getPayload({ config })

  console.info('[seed:dev] Starting…')
  await ensureSiteScopeColumns(payload)

  let tenantList = await payload.find({
    collection: 'tenants',
    where: { slug: { equals: TENANT_SLUG } },
    limit: 1,
    overrideAccess: true,
  })
  let tenant = tenantList.docs[0]
  if (!tenant) {
    tenant = await payload.create({
      collection: 'tenants',
      data: {
        name: 'Seed Alpha 租户',
        slug: TENANT_SLUG,
        domain: 'seed-alpha.local.test',
      },
      overrideAccess: true,
    })
    console.info('[seed:dev] Created tenant', tenant.id, tenant.slug)
  } else {
    console.info('[seed:dev] Tenant exists', tenant.id, tenant.slug)
  }

  const tenantId = tenant.id

  let superList = await payload.find({
    collection: 'users',
    where: { email: { equals: EMAILS.superadmin } },
    limit: 1,
    overrideAccess: true,
  })
  let superUser = superList.docs[0] as SeedUserDoc | undefined
  if (!superUser) {
    superUser = (await payload.create({
      collection: 'users',
      data: {
        email: EMAILS.superadmin,
        password: PASSWORD,
        roles: ['super-admin'],
        tenants: [{ tenant: tenantId }],
      },
    })) as SeedUserDoc
    console.info('[seed:dev] Created super admin', superUser.email)
  } else {
    console.info('[seed:dev] Super admin exists', superUser.email)
  }

  /**
   * Full user doc for `req.user` (Announcements hooks, etc.). We do not `update` the user to add
   * `super-admin` here: Users.beforeChange may have stripped that role on first create, but
   * `PAYLOAD_SUPER_ADMIN_EMAILS` (set above) makes `userHasAllTenantAccess` true for this email.
   */
  const superForReq = (await payload.findByID({
    collection: 'users',
    id: superUser.id,
    overrideAccess: true,
  })) as SeedUserDoc

  const reqOpts = superReq(superForReq)

  const roleSeeds: { email: string; roles: SeedUserDoc['roles'] }[] = [
    { email: EMAILS.finance, roles: ['user', 'finance'] },
    { email: EMAILS.ops, roles: ['user', 'ops-manager'] },
    { email: EMAILS.lead, roles: ['user', 'team-lead'] },
    { email: EMAILS.sitemgr, roles: ['user', 'site-manager'] },
  ]

  for (const { email, roles } of roleSeeds) {
    const ex = await payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      limit: 1,
      overrideAccess: true,
    })
    if (ex.docs[0]) {
      console.info('[seed:dev] User exists', email)
      continue
    }
    await payload.create({
      collection: 'users',
      data: {
        email,
        password: PASSWORD,
        roles,
        tenants: [{ tenant: tenantId }],
      },
    })
    console.info('[seed:dev] Created user', email)
  }

  async function ensureSite(slug: string, name: string, domain: string) {
    const found = await payload.find({
      collection: 'sites',
      where: { and: [{ slug: { equals: slug } }, { tenant: { equals: tenantId } }] },
      limit: 1,
      overrideAccess: true,
    })
    if (found.docs[0]) return found.docs[0]
    return payload.create({
      collection: 'sites',
      ...reqOpts,
      data: {
        name,
        slug,
        primaryDomain: domain,
        status: 'active',
        tenant: tenantId,
      },
      overrideAccess: true,
    })
  }

  const siteA = await ensureSite('seed-site-a', 'Seed Site A', 'site-a.seed.local.test')
  const siteB = await ensureSite('seed-site-b', 'Seed Site B', 'site-b.seed.local.test')
  console.info('[seed:dev] Sites', siteA.id, siteB.id)

  async function ensureCategory(slug: string, name: string, siteId: number) {
    const found = await payload.find({
      collection: 'categories',
      where: { slug: { equals: slug } },
      limit: 1,
      overrideAccess: true,
    })
    if (found.docs[0]) return found.docs[0]
    return payload.create({
      collection: 'categories',
      ...reqOpts,
      data: {
        name,
        slug,
        site: siteId,
        tenant: tenantId,
        description: 'Seed category',
      },
      overrideAccess: true,
    })
  }

  const catA = await ensureCategory('seed-cat-a', '分类 A', siteA.id as number)
  const catB = await ensureCategory('seed-cat-b', '分类 B', siteB.id as number)

  let netList = await payload.find({
    collection: 'affiliate-networks',
    where: { slug: { equals: 'seed-network' } },
    limit: 1,
    overrideAccess: true,
  })
  let network = netList.docs[0]
  if (!network) {
    network = await payload.create({
      collection: 'affiliate-networks',
      ...reqOpts,
      data: {
        name: 'Seed Network',
        slug: 'seed-network',
        websiteUrl: 'https://example.com/program',
        status: 'active',
        tenant: tenantId,
      },
      overrideAccess: true,
    })
    console.info('[seed:dev] Created affiliate network', network.id)
  }

  const offerExists = await payload.find({
    collection: 'offers',
    where: { slug: { equals: 'seed-offer-1' } },
    limit: 1,
    overrideAccess: true,
  })
  if (!offerExists.docs[0]) {
    await payload.create({
      collection: 'offers',
      ...reqOpts,
      data: {
        title: 'Seed Offer',
        slug: 'seed-offer-1',
        network: network.id as number,
        status: 'active',
        sites: [siteA.id as number, siteB.id as number],
        targetUrl: 'https://example.com/offer',
        tenant: tenantId,
      },
      overrideAccess: true,
    })
    console.info('[seed:dev] Created offer')
  }

  async function ensureArticle(slug: string, title: string, siteId: number, categoryIds: number[]) {
    const found = await payload.find({
      collection: 'articles',
      where: { slug: { equals: slug } },
      limit: 1,
      overrideAccess: true,
    })
    if (found.docs[0]) return
    await payload.create({
      collection: 'articles',
      ...reqOpts,
      data: {
        title,
        slug,
        site: siteId,
        categories: categoryIds,
        status: 'published',
        tenant: tenantId,
      },
      overrideAccess: true,
    })
  }

  async function ensurePage(slug: string, title: string, siteId: number, categoryIds: number[]) {
    const found = await payload.find({
      collection: 'pages',
      where: { slug: { equals: slug } },
      limit: 1,
      overrideAccess: true,
    })
    if (found.docs[0]) return
    await payload.create({
      collection: 'pages',
      ...reqOpts,
      data: {
        title,
        slug,
        site: siteId,
        categories: categoryIds,
        status: 'published',
        tenant: tenantId,
      },
      overrideAccess: true,
    })
  }

  await ensureArticle('seed-article-a', 'Seed 文章 A', siteA.id as number, [catA.id as number])
  await ensurePage('seed-page-a', 'Seed 页面 A', siteA.id as number, [catA.id as number])
  await ensureArticle('seed-article-b', 'Seed 文章 B', siteB.id as number, [catB.id as number])

  const kwExists = await payload.find({
    collection: 'keywords',
    where: { slug: { equals: 'seed-keyword-1' } },
    limit: 1,
    overrideAccess: true,
  })
  if (!kwExists.docs[0]) {
    await payload.create({
      collection: 'keywords',
      ...reqOpts,
      data: {
        term: 'seed keyword',
        slug: 'seed-keyword-1',
        site: siteA.id,
        status: 'active',
        tenant: tenantId,
      },
      overrideAccess: true,
    })
  }

  const wj = await payload.find({
    collection: 'workflow-jobs',
    where: { label: { equals: 'Seed workflow job' } },
    limit: 1,
    overrideAccess: true,
  })
  if (!wj.docs[0]) {
    await payload.create({
      collection: 'workflow-jobs',
      ...reqOpts,
      data: {
        label: 'Seed workflow job',
        jobType: 'custom',
        status: 'pending',
        site: siteA.id,
        input: { note: 'seed' },
        tenant: tenantId,
      },
      overrideAccess: true,
    })
  }

  let platList = await payload.find({
    collection: 'social-platforms',
    where: { slug: { equals: 'seed-platform' } },
    limit: 1,
    overrideAccess: true,
  })
  let platform = platList.docs[0]
  if (!platform) {
    platform = await payload.create({
      collection: 'social-platforms',
      ...reqOpts,
      data: {
        name: 'Seed Platform',
        slug: 'seed-platform',
        status: 'active',
        tenant: tenantId,
      },
      overrideAccess: true,
    })
  }

  const sa = await payload.find({
    collection: 'social-accounts',
    where: { handle: { equals: 'seed_account' } },
    limit: 1,
    overrideAccess: true,
  })
  if (!sa.docs[0]) {
    await payload.create({
      collection: 'social-accounts',
      ...reqOpts,
      data: {
        platform: platform.id as number,
        site: siteA.id,
        handle: 'seed_account',
        status: 'active',
        tenant: tenantId,
      },
      overrideAccess: true,
    })
  }

  const ann = await payload.find({
    collection: 'announcements',
    where: { title: { equals: '【测试】系统公告' } },
    limit: 1,
    overrideAccess: true,
  })
  if (!ann.docs[0]) {
    await payload.create({
      collection: 'announcements',
      ...superReq(superForReq),
      /** Top-level `user` is merged into `req` by `createLocalReq` (see Payload Local API). */
      user: { ...superForReq, collection: 'users' },
      data: {
        kind: 'system',
        tenant: tenantId,
        title: '【测试】系统公告',
        body: '这是一条种子系统公告，用于本地测试。',
        isActive: true,
      },
      overrideAccess: true,
    })
    console.info('[seed:dev] Created system announcement')
  }

  console.info('[seed:dev] Done.')
  console.info('[seed:dev] Login (super admin):', EMAILS.superadmin, '/', PASSWORD)
}

main().catch((err) => {
  console.error('[seed:dev] Failed:', err)
  process.exit(1)
})
