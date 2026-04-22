/**
 * 本地开发库灌入测试数据（幂等：固定 slug/email，已存在则跳过）。
 * 双租户：seed-alpha（联盟/评测）与 seed-beta（B2B 线索/白皮书）。
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

const EMAILS = {
  superadmin: 'seed.superadmin@local.test',
  finance: 'seed.finance@local.test',
  ops: 'seed.ops@local.test',
  lead: 'seed.lead@local.test',
  sitemgr: 'seed.sitemgr@local.test',
  betaSitemgr: 'seed.beta.sitemgr@local.test',
} as const

type SeedUserDoc = User & { id: number }

type SiteSpec = { slug: string; name: string; primaryDomain: string }

type TenantProfile = {
  slug: string
  name: string
  rootDomain: string
  sites: [SiteSpec, SiteSpec]
  network: { slug: string; name: string; websiteUrl: string }
  offers: Array<{ slug: string; title: string; targetUrl: string }>
  /** [siteIndex, category index 0|1 per site] */
  categories: [{ slug: string; name: string; siteIndex: 0 | 1 }, { slug: string; name: string; siteIndex: 0 | 1 }]
  articles: Array<{
    slug: string
    title: string
    siteIndex: 0 | 1
    catKey: 0 | 1
    locale?: 'zh' | 'en'
    excerpt?: string
  }>
  pages: Array<{
    slug: string
    title: string
    siteIndex: 0 | 1
    catKey: 0 | 1
    locale?: 'zh' | 'en'
    excerpt?: string
  }>
  keyword: { slug: string; term: string; siteIndex: 0 | 1 }
  ranking: { searchQuery: string; serpPosition: number }
  workflowLabel: string
  workflowJobType: 'publish' | 'sync' | 'ai_generate' | 'custom'
  socialPlatformSlug: string
  socialPlatformName: string
  socialHandle: string
  knowledge: { slug: string; title: string; siteIndex: 0 | 1; catKey: 0 | 1 }
  announcementTitle: string
  announcementBody: string
  clickDestinationUrl: string
  commissionNotes: string
}

const TENANT_PROFILES: [TenantProfile, TenantProfile] = [
  {
    slug: 'seed-alpha',
    name: 'Seed Alpha 租户',
    rootDomain: 'seed-alpha.local.test',
    sites: [
      {
        slug: 'seed-site-a',
        name: 'Alpha 主站 · 评测与落地',
        primaryDomain: 'site-a.seed.local.test',
      },
      {
        slug: 'seed-site-b',
        name: 'Alpha 子站 · 垂直转化',
        primaryDomain: 'site-b.seed.local.test',
      },
    ],
    network: {
      slug: 'seed-network',
      name: 'Alpha 联盟计划',
      websiteUrl: 'https://example.com/alpha-program',
    },
    offers: [
      {
        slug: 'seed-offer-1',
        title: 'Alpha 主推 Offer · 路由器联盟',
        targetUrl: 'https://example.com/alpha-offer-main',
      },
      {
        slug: 'seed-offer-2',
        title: 'Alpha 备用 Offer · 季节性活动',
        targetUrl: 'https://example.com/alpha-offer-alt',
      },
    ],
    categories: [
      { slug: 'seed-cat-a', name: '评测对比', siteIndex: 0 },
      { slug: 'seed-cat-b', name: '优惠活动', siteIndex: 1 },
    ],
    articles: [
      {
        slug: 'seed-article-a',
        title: '2025 家用路由器横评：性能与联盟链接策略',
        siteIndex: 0,
        catKey: 0,
        excerpt: '中文示例：列表摘要，分类「评测对比」。',
      },
      {
        slug: 'seed-article-a',
        title: '2025 Home Wi‑Fi Router Roundup (English demo)',
        siteIndex: 0,
        catKey: 0,
        locale: 'en',
        excerpt: 'Same slug as Chinese version; use header EN / 中文 to compare.',
      },
      {
        slug: 'seed-article-b',
        title: '黑五大促落地：追踪参数与转化复盘',
        siteIndex: 1,
        catKey: 1,
        excerpt: '中文示例：第二站点 seed-site-b。',
      },
      {
        slug: 'seed-article-b',
        title: 'Black Friday promo: tracking & conversion (EN)',
        siteIndex: 1,
        catKey: 1,
        locale: 'en',
        excerpt: 'English article on seed-site-b.',
      },
    ],
    pages: [
      {
        slug: 'seed-page-a',
        title: '限时优惠落地页 · Alpha',
        siteIndex: 0,
        catKey: 0,
        excerpt: '独立页面（中文）→ /zh/pages/seed-page-a',
      },
      {
        slug: 'seed-page-a',
        title: 'Limited-time offer landing (EN)',
        siteIndex: 0,
        catKey: 0,
        locale: 'en',
        excerpt: 'English page → /en/pages/seed-page-a',
      },
    ],
    keyword: { slug: 'seed-keyword-1', term: 'best wifi router 2025', siteIndex: 0 },
    ranking: { searchQuery: 'alpha router review serp', serpPosition: 4 },
    workflowLabel: 'Alpha · 发布队列（种子）',
    workflowJobType: 'publish',
    socialPlatformSlug: 'seed-platform',
    socialPlatformName: 'Seed Platform (Alpha)',
    socialHandle: 'alpha_seed_social',
    knowledge: {
      slug: 'alpha-kb-playbook',
      title: '联盟运营手册（Alpha）',
      siteIndex: 0,
      catKey: 0,
    },
    announcementTitle: '【测试】系统公告',
    announcementBody: '这是一条种子系统公告（Seed Alpha），用于本地与多租户测试。',
    clickDestinationUrl: 'https://seed-track.local/alpha-click-1',
    commissionNotes: 'seed:commission-alpha-1',
  },
  {
    slug: 'seed-beta',
    name: 'Seed Beta 租户',
    rootDomain: 'seed-beta.local.test',
    sites: [
      {
        slug: 'beta-saas-main',
        name: 'Beta B2B 工具主站',
        primaryDomain: 'saas.beta.local.test',
      },
      {
        slug: 'beta-whitepaper',
        name: 'Beta 白皮书落地站',
        primaryDomain: 'whitepaper.beta.local.test',
      },
    ],
    network: {
      slug: 'seed-network-beta',
      name: 'Beta Partner Hub',
      websiteUrl: 'https://example.com/beta-partners',
    },
    offers: [
      {
        slug: 'beta-offer-main',
        title: '企业版试用 · SaaS 注册转化',
        targetUrl: 'https://example.com/beta-trial',
      },
      {
        slug: 'beta-offer-lead',
        title: '白皮书下载 · 线索收集',
        targetUrl: 'https://example.com/beta-whitepaper',
      },
    ],
    categories: [
      { slug: 'beta-cat-product', name: '产品功能', siteIndex: 0 },
      { slug: 'beta-cat-lead', name: '线索内容', siteIndex: 1 },
    ],
    articles: [
      {
        slug: 'beta-article-crm',
        title: '中小企业 CRM 选型：从线索到成交',
        siteIndex: 0,
        catKey: 0,
        excerpt: 'Beta 中文；预览加 ?site=beta-saas-main',
      },
      {
        slug: 'beta-article-crm',
        title: 'SMB CRM selection: lead to close (EN)',
        siteIndex: 0,
        catKey: 0,
        locale: 'en',
        excerpt: 'Beta English mirror for hreflang.',
      },
      {
        slug: 'beta-article-whitepaper',
        title: '2025 B2B 内容营销白皮书导读',
        siteIndex: 1,
        catKey: 1,
      },
      {
        slug: 'beta-article-whitepaper',
        title: '2025 B2B content marketing whitepaper (EN)',
        siteIndex: 1,
        catKey: 1,
        locale: 'en',
      },
    ],
    pages: [
      {
        slug: 'beta-page-demo',
        title: '预约演示落地页',
        siteIndex: 0,
        catKey: 0,
      },
      {
        slug: 'beta-page-demo',
        title: 'Book a demo (EN)',
        siteIndex: 0,
        catKey: 0,
        locale: 'en',
      },
    ],
    keyword: { slug: 'beta-keyword-main', term: 'b2b crm comparison', siteIndex: 0 },
    ranking: { searchQuery: 'beta saas crm serp', serpPosition: 7 },
    workflowLabel: 'Beta · 线索同步（种子）',
    workflowJobType: 'sync',
    socialPlatformSlug: 'seed-platform-beta',
    socialPlatformName: 'Seed Platform (Beta)',
    socialHandle: 'beta_seed_social',
    knowledge: {
      slug: 'beta-kb-onboarding',
      title: 'B2B 线索入库流程（Beta）',
      siteIndex: 0,
      catKey: 0,
    },
    announcementTitle: '【Beta】B2B 线索租户上线说明',
    announcementBody: '本租户用于 B2B 工具线索、白皮书与落地页测试数据。',
    clickDestinationUrl: 'https://seed-track.local/beta-click-1',
    commissionNotes: 'seed:commission-beta-1',
  },
]

/** `landing-templates.slug` — unique per tenant. */
const BLOG_DEFAULT_LANDING_TEMPLATE_SLUG = 'blog-default'

/** Align with `BLOG_DEFAULTS` in src/utilities/publicLandingTheme.ts; keep in sync manually. */
/** Dev-only preview links; tenant slug → URL (site must use blog-default template). */
const BLOG_DEFAULT_PREVIEW_URL_BY_TENANT: Record<string, string> = {
  'seed-alpha': 'http://localhost:3000/zh/?site=seed-site-a',
  'seed-beta': 'http://localhost:3000/zh/?site=beta-saas-main',
}

const BLOG_DEFAULT_LANDING_TEMPLATE_BASE = {
  name: '整站博客 · 默认',
  slug: BLOG_DEFAULT_LANDING_TEMPLATE_SLUG,
  description:
    '与当前工程默认整站博客一致：文章列表 + 顶栏 + About 侧栏；色板与 publicLandingTheme BLOG_DEFAULTS 对齐。',
  landingBrowserTitle: '',
  landingSiteName: '',
  landingTagline: '',
  landingLoggedInTitle: '',
  landingLoggedInSubtitle: '',
  landingFooterLine: '© 种子数据 · 整站博客模版演示',
  landingCtaLabel: '前往管理后台',
  landingBgColor: '#f0f0f0',
  landingTextColor: '#333333',
  landingMutedColor: '#888888',
  landingCtaBgColor: '#2d8659',
  landingCtaTextColor: '#ffffff',
  landingFontPreset: 'noto_sans_sc' as const,
  blogPrimaryColor: '#2d8659',
  blogAccentColor: '#e6c84a',
  blogContentBgColor: '#f0f0f0',
  blogCardBgColor: '#ffffff',
  blogHeaderTextColor: '#ffffff',
  blogHeadingColor: '#333333',
  blogBodyColor: '#444444',
  aboutTitle: 'About Me',
  aboutBio: '',
  aboutCtaLabel: 'Learn more',
  aboutCtaHref: '#',
}

function superReq(user: SeedUserDoc): { req: Partial<PayloadRequest> } {
  return {
    req: {
      user: { ...user, collection: 'users' },
    },
  }
}

function whereTenantSlug(slug: string) {
  return { slug: { equals: slug } }
}

function whereTenantAndSlug(tenantId: number, slug: string) {
  return { and: [{ slug: { equals: slug } }, { tenant: { equals: tenantId } }] }
}

function whereTenantSlugLocale(tenantId: number, slug: string, locale: string) {
  return {
    and: [
      { slug: { equals: slug } },
      { tenant: { equals: tenantId } },
      { locale: { equals: locale } },
    ],
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
  process.env.PAYLOAD_SUPER_ADMIN_EMAILS = [
    process.env.PAYLOAD_SUPER_ADMIN_EMAILS,
    EMAILS.superadmin,
  ]
    .filter(Boolean)
    .join(',')

  const payload = await getPayload({ config })

  console.info('[seed:dev] Starting…')
  await ensureSiteScopeColumns(payload)

  const tenantIds: number[] = []
  const tenantBySlug = new Map<string, { id: number }>()

  for (const p of TENANT_PROFILES) {
    const list = await payload.find({
      collection: 'tenants',
      where: whereTenantSlug(p.slug),
      limit: 1,
      overrideAccess: true,
    })
    let doc = list.docs[0]
    if (!doc) {
      doc = await payload.create({
        collection: 'tenants',
        data: {
          name: p.name,
          slug: p.slug,
          domain: p.rootDomain,
        },
        overrideAccess: true,
      })
      console.info('[seed:dev] Created tenant', doc.id, doc.slug)
    } else {
      console.info('[seed:dev] Tenant exists', doc.id, doc.slug)
    }
    tenantIds.push(doc.id as number)
    tenantBySlug.set(p.slug, { id: doc.id as number })
  }

  const alphaId = tenantBySlug.get('seed-alpha')!.id
  const betaId = tenantBySlug.get('seed-beta')!.id

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
        tenants: [{ tenant: alphaId }, { tenant: betaId }],
      },
    })) as SeedUserDoc
    console.info('[seed:dev] Created super admin', superUser.email)
  } else {
    await payload.update({
      collection: 'users',
      id: superUser.id,
      data: {
        tenants: [{ tenant: alphaId }, { tenant: betaId }],
      },
      overrideAccess: true,
    })
    console.info('[seed:dev] Super admin exists', superUser.email, '(tenants synced to Alpha+Beta)')
  }

  const superForReq = (await payload.findByID({
    collection: 'users',
    id: superUser.id,
    overrideAccess: true,
  })) as SeedUserDoc

  const reqOpts = superReq(superForReq)

  const roleSeeds: { email: string; roles: SeedUserDoc['roles']; tenantId: number }[] = [
    { email: EMAILS.finance, roles: ['user', 'finance'], tenantId: alphaId },
    { email: EMAILS.ops, roles: ['user', 'ops-manager'], tenantId: alphaId },
    { email: EMAILS.lead, roles: ['user', 'team-lead'], tenantId: alphaId },
    { email: EMAILS.sitemgr, roles: ['user', 'site-manager'], tenantId: alphaId },
    { email: EMAILS.betaSitemgr, roles: ['user', 'site-manager'], tenantId: betaId },
  ]

  for (const { email, roles, tenantId } of roleSeeds) {
    const ex = await payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      limit: 1,
      overrideAccess: true,
    })
    if (ex.docs[0]) {
      await payload.update({
        collection: 'users',
        id: ex.docs[0].id,
        data: {
          tenants: [{ tenant: tenantId }],
        },
        overrideAccess: true,
      })
      console.info('[seed:dev] User exists', email, '(tenant assignment refreshed)')
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

  for (const p of TENANT_PROFILES) {
    const tenantId = tenantBySlug.get(p.slug)!.id
    console.info('[seed:dev] --- Seeding tenant', p.slug, '---')

    async function ensureBlogLandingTemplate(): Promise<{ id: number }> {
      const found = await payload.find({
        collection: 'landing-templates',
        where: {
          and: [
            { slug: { equals: BLOG_DEFAULT_LANDING_TEMPLATE_SLUG } },
            { tenant: { equals: tenantId } },
          ],
        },
        limit: 1,
        overrideAccess: true,
      })
      if (found.docs[0]) {
        const existing = found.docs[0] as { id: number; previewUrl?: string | null }
        const desiredPreview = BLOG_DEFAULT_PREVIEW_URL_BY_TENANT[p.slug] ?? ''
        if (
          desiredPreview &&
          (existing.previewUrl == null || String(existing.previewUrl).trim() === '')
        ) {
          await payload.update({
            collection: 'landing-templates',
            id: existing.id,
            ...reqOpts,
            data: { previewUrl: desiredPreview },
            overrideAccess: true,
          })
          console.info('[seed:dev] Set previewUrl on landing template', existing.id)
        }
        return { id: existing.id as number }
      }
      const doc = await payload.create({
        collection: 'landing-templates',
        ...reqOpts,
        data: {
          ...BLOG_DEFAULT_LANDING_TEMPLATE_BASE,
          previewUrl: BLOG_DEFAULT_PREVIEW_URL_BY_TENANT[p.slug] ?? '',
          tenant: tenantId,
        },
        overrideAccess: true,
      })
      console.info('[seed:dev] Created landing template', BLOG_DEFAULT_LANDING_TEMPLATE_SLUG)
      return { id: doc.id as number }
    }

    const blogLandingTemplate = await ensureBlogLandingTemplate()

    async function ensureSite(spec: SiteSpec) {
      const found = await payload.find({
        collection: 'sites',
        where: whereTenantAndSlug(tenantId, spec.slug),
        limit: 1,
        overrideAccess: true,
      })
      if (found.docs[0]) {
        const row = found.docs[0] as {
          id: number
          landingTemplate?: number | { id: number } | null
        }
        if (row.landingTemplate == null) {
          await payload.update({
            collection: 'sites',
            id: row.id,
            ...reqOpts,
            data: { landingTemplate: blogLandingTemplate.id },
            overrideAccess: true,
          })
          console.info('[seed:dev] Linked landing template → site', spec.slug)
        }
        const refreshed = await payload.findByID({
          collection: 'sites',
          id: row.id,
          overrideAccess: true,
        })
        if (!refreshed) {
          throw new Error(`[seed:dev] site id ${row.id} missing after landingTemplate link`)
        }
        return refreshed
      }
      return payload.create({
        collection: 'sites',
        ...reqOpts,
        data: {
          name: spec.name,
          slug: spec.slug,
          primaryDomain: spec.primaryDomain,
          status: 'active',
          tenant: tenantId,
          landingTemplate: blogLandingTemplate.id,
        },
        overrideAccess: true,
      })
    }

    const site0 = await ensureSite(p.sites[0])
    const site1 = await ensureSite(p.sites[1])
    const sites = [site0, site1] as [{ id: number }, { id: number }]
    console.info('[seed:dev] Sites', site0.id, site1.id)

    const blueprintSlug = `${p.slug}-blueprint-default`
    const bpFound = await payload.find({
      collection: 'site-blueprints',
      where: whereTenantAndSlug(tenantId, blueprintSlug),
      limit: 1,
      overrideAccess: true,
    })
    if (!bpFound.docs[0]) {
      await payload.create({
        collection: 'site-blueprints',
        ...reqOpts,
        data: {
          name: `${p.name} 默认模板`,
          slug: blueprintSlug,
          site: site0.id,
          tenant: tenantId,
          description: '种子设计模板',
        },
        overrideAccess: true,
      })
      console.info('[seed:dev] Created site blueprint', blueprintSlug)
    }

    const bpRow = (
      await payload.find({
        collection: 'site-blueprints',
        where: whereTenantAndSlug(tenantId, blueprintSlug),
        limit: 1,
        overrideAccess: true,
      })
    ).docs[0] as { id: number } | undefined
    if (bpRow) {
      for (const siteRow of [site0, site1]) {
        const s = siteRow as {
          id: number
          blueprint?: number | { id: number } | null
        }
        if (s.blueprint == null) {
          await payload.update({
            collection: 'sites',
            id: s.id,
            ...reqOpts,
            data: { blueprint: bpRow.id },
            overrideAccess: true,
          })
          console.info('[seed:dev] Linked blueprint → site id', s.id)
        }
      }
    }

    async function ensureCategory(slug: string, name: string, siteId: number) {
      const found = await payload.find({
        collection: 'categories',
        where: {
          and: [
            { slug: { equals: slug } },
            { tenant: { equals: tenantId } },
            { site: { equals: siteId } },
          ],
        },
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
          description: `Seed category · ${p.slug}`,
        },
        overrideAccess: true,
      })
    }

    const cat0 = (await ensureCategory(
      p.categories[0].slug,
      p.categories[0].name,
      sites[p.categories[0].siteIndex].id,
    )) as { id: number }
    const cat1 = (await ensureCategory(
      p.categories[1].slug,
      p.categories[1].name,
      sites[p.categories[1].siteIndex].id,
    )) as { id: number }
    const cats = [cat0, cat1] as const

    const netList = await payload.find({
      collection: 'affiliate-networks',
      where: whereTenantAndSlug(tenantId, p.network.slug),
      limit: 1,
      overrideAccess: true,
    })
    let network = netList.docs[0]
    if (!network) {
      network = await payload.create({
        collection: 'affiliate-networks',
        ...reqOpts,
        data: {
          name: p.network.name,
          slug: p.network.slug,
          websiteUrl: p.network.websiteUrl,
          status: 'active',
          tenant: tenantId,
        },
        overrideAccess: true,
      })
      console.info('[seed:dev] Created affiliate network', network.id)
    }

    for (const off of p.offers) {
      const offerExists = await payload.find({
        collection: 'offers',
        where: whereTenantAndSlug(tenantId, off.slug),
        limit: 1,
        overrideAccess: true,
      })
      if (offerExists.docs[0]) continue
      await payload.create({
        collection: 'offers',
        ...reqOpts,
        data: {
          title: off.title,
          slug: off.slug,
          network: network.id as number,
          status: 'active',
          sites: [site0.id as number, site1.id as number],
          targetUrl: off.targetUrl,
          tenant: tenantId,
        },
        overrideAccess: true,
      })
      console.info('[seed:dev] Created offer', off.slug)
    }

    async function ensureArticle(
      slug: string,
      title: string,
      siteId: number,
      categoryIds: number[],
      locale: 'zh' | 'en' = 'zh',
      excerpt?: string,
    ) {
      const found = await payload.find({
        collection: 'articles',
        where: whereTenantSlugLocale(tenantId, slug, locale),
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
          locale,
          excerpt: excerpt ?? undefined,
          site: siteId,
          categories: categoryIds,
          status: 'published',
          publishedAt: new Date().toISOString(),
          tenant: tenantId,
        },
        overrideAccess: true,
      })
      console.info('[seed:dev] Created article', slug, locale)
    }

    async function ensurePage(
      slug: string,
      title: string,
      siteId: number,
      categoryIds: number[],
      locale: 'zh' | 'en' = 'zh',
      excerpt?: string,
    ) {
      const found = await payload.find({
        collection: 'pages',
        where: whereTenantSlugLocale(tenantId, slug, locale),
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
          locale,
          excerpt: excerpt ?? undefined,
          site: siteId,
          categories: categoryIds,
          status: 'published',
          publishedAt: new Date().toISOString(),
          tenant: tenantId,
        },
        overrideAccess: true,
      })
      console.info('[seed:dev] Created page', slug, locale)
    }

    for (const a of p.articles) {
      const catId = cats[a.catKey].id
      const loc = a.locale ?? 'zh'
      await ensureArticle(
        a.slug,
        a.title,
        sites[a.siteIndex].id as number,
        [catId],
        loc,
        a.excerpt,
      )
    }
    for (const pg of p.pages) {
      const catId = cats[pg.catKey].id
      const loc = pg.locale ?? 'zh'
      await ensurePage(
        pg.slug,
        pg.title,
        sites[pg.siteIndex].id as number,
        [catId],
        loc,
        pg.excerpt,
      )
    }

    async function ensureKeyword() {
      const kwSlug = p.keyword.slug
      const found = await payload.find({
        collection: 'keywords',
        where: whereTenantAndSlug(tenantId, kwSlug),
        limit: 1,
        overrideAccess: true,
      })
      if (found.docs[0]) return found.docs[0]
      return payload.create({
        collection: 'keywords',
        ...reqOpts,
        data: {
          term: p.keyword.term,
          slug: kwSlug,
          site: sites[p.keyword.siteIndex].id,
          status: 'active',
          tenant: tenantId,
        },
        overrideAccess: true,
      })
    }

    const keywordDoc = await ensureKeyword()

    const rankFound = await payload.find({
      collection: 'rankings',
      where: {
        and: [
          { tenant: { equals: tenantId } },
          { searchQuery: { equals: p.ranking.searchQuery } },
        ],
      },
      limit: 1,
      overrideAccess: true,
    })
    if (!rankFound.docs[0]) {
      await payload.create({
        collection: 'rankings',
        ...reqOpts,
        data: {
          keyword: keywordDoc.id as number,
          site: sites[p.keyword.siteIndex].id,
          searchQuery: p.ranking.searchQuery,
          serpPosition: p.ranking.serpPosition,
          capturedAt: new Date('2026-04-01T12:00:00.000Z').toISOString(),
          notes: `Seed ${p.slug}`,
          tenant: tenantId,
        },
        overrideAccess: true,
      })
      console.info('[seed:dev] Created ranking', p.ranking.searchQuery)
    }

    const wj = await payload.find({
      collection: 'workflow-jobs',
      where: {
        and: [
          { tenant: { equals: tenantId } },
          { label: { equals: p.workflowLabel } },
        ],
      },
      limit: 1,
      overrideAccess: true,
    })
    if (!wj.docs[0]) {
      await payload.create({
        collection: 'workflow-jobs',
        ...reqOpts,
        data: {
          label: p.workflowLabel,
          jobType: p.workflowJobType,
          status: 'pending',
          site: site0.id,
          input: { note: 'seed', tenant: p.slug },
          tenant: tenantId,
        },
        overrideAccess: true,
      })
      console.info('[seed:dev] Created workflow job', p.workflowLabel)
    }

    let platList = await payload.find({
      collection: 'social-platforms',
      where: whereTenantAndSlug(tenantId, p.socialPlatformSlug),
      limit: 1,
      overrideAccess: true,
    })
    let platform = platList.docs[0]
    if (!platform) {
      platform = await payload.create({
        collection: 'social-platforms',
        ...reqOpts,
        data: {
          name: p.socialPlatformName,
          slug: p.socialPlatformSlug,
          status: 'active',
          tenant: tenantId,
        },
        overrideAccess: true,
      })
    }

    const sa = await payload.find({
      collection: 'social-accounts',
      where: {
        and: [
          { tenant: { equals: tenantId } },
          { handle: { equals: p.socialHandle } },
        ],
      },
      limit: 1,
      overrideAccess: true,
    })
    if (!sa.docs[0]) {
      await payload.create({
        collection: 'social-accounts',
        ...reqOpts,
        data: {
          platform: platform.id as number,
          site: site0.id,
          handle: p.socialHandle,
          status: 'active',
          tenant: tenantId,
        },
        overrideAccess: true,
      })
      console.info('[seed:dev] Created social account', p.socialHandle)
    }

    const kbSlug = p.knowledge.slug
    const kbFound = await payload.find({
      collection: 'knowledge-base',
      where: whereTenantAndSlug(tenantId, kbSlug),
      limit: 1,
      overrideAccess: true,
    })
    if (!kbFound.docs[0]) {
      await payload.create({
        collection: 'knowledge-base',
        ...reqOpts,
        data: {
          title: p.knowledge.title,
          slug: kbSlug,
          site: sites[p.knowledge.siteIndex].id,
          categories: [cats[p.knowledge.catKey].id as number],
          status: 'published',
          notes: `Seed KB · ${p.slug}`,
          tenant: tenantId,
        },
        overrideAccess: true,
      })
      console.info('[seed:dev] Created knowledge base', kbSlug)
    }

    const ann = await payload.find({
      collection: 'announcements',
      where: {
        and: [
          { tenant: { equals: tenantId } },
          { title: { equals: p.announcementTitle } },
        ],
      },
      limit: 1,
      overrideAccess: true,
    })
    if (!ann.docs[0]) {
      await payload.create({
        collection: 'announcements',
        ...superReq(superForReq),
        user: { ...superForReq, collection: 'users' },
        data: {
          kind: 'system',
          tenant: tenantId,
          title: p.announcementTitle,
          body: p.announcementBody,
          isActive: true,
        },
        overrideAccess: true,
      })
      console.info('[seed:dev] Created announcement', p.announcementTitle)
    }

    const firstOffer = await payload.find({
      collection: 'offers',
      where: whereTenantAndSlug(tenantId, p.offers[0].slug),
      limit: 1,
      overrideAccess: true,
    })
    const offer0 = firstOffer.docs[0]
    if (offer0) {
      const clickFound = await payload.find({
        collection: 'click-events',
        where: {
          and: [
            { tenant: { equals: tenantId } },
            { destinationUrl: { equals: p.clickDestinationUrl } },
          ],
        },
        limit: 1,
        overrideAccess: true,
      })
      if (!clickFound.docs[0]) {
        await payload.create({
          collection: 'click-events',
          ...reqOpts,
          data: {
            occurredAt: new Date('2026-04-15T10:30:00.000Z').toISOString(),
            eventType: 'click',
            site: site0.id,
            offer: offer0.id as number,
            destinationUrl: p.clickDestinationUrl,
            referrer: 'https://example.com/referrer',
            metadata: { seed: true, tenant: p.slug },
            tenant: tenantId,
          },
          overrideAccess: true,
        })
        console.info('[seed:dev] Created click event', p.clickDestinationUrl)
      }

      const commFound = await payload.find({
        collection: 'commissions',
        where: {
          and: [
            { tenant: { equals: tenantId } },
            { notes: { equals: p.commissionNotes } },
          ],
        },
        limit: 1,
        overrideAccess: true,
      })
      if (!commFound.docs[0]) {
        await payload.create({
          collection: 'commissions',
          ...reqOpts,
          data: {
            amount: p.slug === 'seed-alpha' ? 42.5 : 128,
            currency: 'USD',
            status: 'pending',
            recipient: superForReq.id,
            offer: offer0.id as number,
            site: site0.id,
            periodStart: new Date('2026-04-01T00:00:00.000Z').toISOString(),
            periodEnd: new Date('2026-04-30T00:00:00.000Z').toISOString(),
            notes: p.commissionNotes,
            tenant: tenantId,
          },
          overrideAccess: true,
        })
        console.info('[seed:dev] Created commission', p.commissionNotes)
      }
    }
  }

  console.info('[seed:dev] Done.')
  console.info('[seed:dev] Tenants:', TENANT_PROFILES.map((x) => x.slug).join(', '))
  console.info('[seed:dev] Login (super admin):', EMAILS.superadmin, '/', PASSWORD)
  console.info('[seed:dev] Beta site-manager only:', EMAILS.betaSitemgr, '/', PASSWORD)
  console.info('')
  console.info('[seed:dev] Blog template preview (after pnpm dev):')
  console.info('  Set NEXT_PUBLIC_DEFAULT_SITE_SLUG=seed-site-a in .env, then open http://localhost:3000/zh/')
  console.info('  Or: http://localhost:3000/zh/?site=seed-site-a  |  second site: ?site=seed-site-b')
  console.info('  Beta tenant: ?site=beta-saas-main')
}

main().catch((err) => {
  console.error('[seed:dev] Failed:', err)
  process.exit(1)
})
