import type { MetadataRoute } from 'next'
import { headers } from 'next/headers.js'
import { getPayload } from 'payload'

import { locales } from '@/i18n/config'
import config from '@/payload.config'
import { getPublicSiteContext } from '@/utilities/publicLandingTheme'
import { getPublicBaseUrlFromHeaders } from '@/utilities/seoDocumentMeta'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers()
  const { site } = await getPublicSiteContext(headersList)
  const baseUrl = getPublicBaseUrlFromHeaders(headersList)
  if (!site || !baseUrl) return []

  const payload = await getPayload({ config: await config })
  const entries: MetadataRoute.Sitemap = []

  for (const locale of locales) {
    entries.push({ url: `${baseUrl}/${locale}/`, lastModified: new Date() })

    const articles = await payload.find({
      collection: 'articles',
      where: {
        and: [
          { site: { equals: site.id } },
          { status: { equals: 'published' } },
          { locale: { equals: locale } },
        ],
      },
      limit: 500,
      depth: 0,
      overrideAccess: true,
    })
    for (const a of articles.docs) {
      const slug = typeof a.slug === 'string' ? a.slug.trim() : ''
      if (!slug) continue
      entries.push({
        url: `${baseUrl}/${locale}/posts/${encodeURIComponent(slug)}`,
        lastModified: new Date((a as { updatedAt?: string }).updatedAt ?? Date.now()),
      })
    }

    const pages = await payload.find({
      collection: 'pages',
      where: {
        and: [
          { site: { equals: site.id } },
          { status: { equals: 'published' } },
          { locale: { equals: locale } },
        ],
      },
      limit: 500,
      depth: 0,
      overrideAccess: true,
    })
    for (const p of pages.docs) {
      const slug = typeof p.slug === 'string' ? p.slug.trim() : ''
      if (!slug) continue
      entries.push({
        url: `${baseUrl}/${locale}/pages/${encodeURIComponent(slug)}`,
        lastModified: new Date((p as { updatedAt?: string }).updatedAt ?? Date.now()),
      })
    }

    const categories = await payload.find({
      collection: 'categories',
      where: { site: { equals: site.id } },
      limit: 500,
      depth: 0,
      overrideAccess: true,
    })
    for (const c of categories.docs) {
      const slug = typeof c.slug === 'string' ? c.slug.trim() : ''
      if (!slug) continue
      entries.push({
        url: `${baseUrl}/${locale}/categories/${encodeURIComponent(slug)}`,
        lastModified: new Date((c as { updatedAt?: string }).updatedAt ?? Date.now()),
      })
    }
  }

  return entries
}
