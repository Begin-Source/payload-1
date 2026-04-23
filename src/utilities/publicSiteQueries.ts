import { cache } from 'react'

import { getPayload } from 'payload'

import config from '@/payload.config'
import type { Article, Category, Page } from '@/payload-types'

export const getNavCategoriesForSite = cache(async (siteId: number): Promise<Category[]> => {
  const payload = await getPayload({ config: await config })
  const res = await payload.find({
    collection: 'categories',
    where: { site: { equals: siteId } },
    limit: 8,
    sort: 'name',
    depth: 0,
    overrideAccess: true,
  })
  return res.docs as Category[]
})

export const getPublishedArticlesForSite = cache(
  async (siteId: number, locale: string, limit = 24): Promise<Article[]> => {
    const payload = await getPayload({ config: await config })
    const res = await payload.find({
      collection: 'articles',
      where: {
        and: [
          { status: { equals: 'published' } },
          { site: { equals: siteId } },
          { locale: { equals: locale } },
        ],
      },
      sort: '-publishedAt',
      limit,
      depth: 2,
      overrideAccess: true,
    })
    return res.docs as Article[]
  },
)

export const getPublishedArticlesForSiteAndCategory = cache(
  async (siteId: number, categoryId: number, locale: string, limit = 24): Promise<Article[]> => {
    const payload = await getPayload({ config: await config })
    const res = await payload.find({
      collection: 'articles',
      where: {
        and: [
          { status: { equals: 'published' } },
          { site: { equals: siteId } },
          { locale: { equals: locale } },
          { categories: { contains: categoryId } },
        ],
      },
      sort: '-publishedAt',
      limit,
      depth: 2,
      overrideAccess: true,
    })
    return res.docs as Article[]
  },
)

export const getCategoryBySlugForSite = cache(
  async (siteId: number, slug: string): Promise<Category | null> => {
    const payload = await getPayload({ config: await config })
    const res = await payload.find({
      collection: 'categories',
      where: {
        and: [{ site: { equals: siteId } }, { slug: { equals: slug } }],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    return (res.docs[0] as Category | undefined) ?? null
  },
)

/**
 * Related posts: same site + locale, exclude current. Prefer any shared category, then
 * backfill with latest published on the same site.
 */
export const getRelatedArticlesForSite = cache(
  async (
    siteId: number,
    locale: string,
    args: { excludeId: number; categoryIds: number[]; limit?: number },
  ): Promise<Article[]> => {
    const limit = args.limit ?? 3
    const payload = await getPayload({ config: await config })
    const base = [
      { status: { equals: 'published' } },
      { site: { equals: siteId } },
      { locale: { equals: locale } },
      { id: { not_equals: args.excludeId } },
    ] as const

    const seen = new Set<number>([args.excludeId])
    const out: Article[] = []

    if (args.categoryIds.length > 0) {
      const orConds = args.categoryIds.map((id) => ({ categories: { contains: id } }))
      const res = await payload.find({
        collection: 'articles',
        where: { and: [...base, { or: orConds }] },
        sort: '-publishedAt',
        limit: 24,
        depth: 2,
        overrideAccess: true,
      })
      for (const doc of res.docs as Article[]) {
        if (seen.has(doc.id)) continue
        seen.add(doc.id)
        out.push(doc)
        if (out.length >= limit) return out
      }
    }

    const res2 = await payload.find({
      collection: 'articles',
      where: { and: [...base] },
      sort: '-publishedAt',
      limit: 24,
      depth: 2,
      overrideAccess: true,
    })
    for (const doc of res2.docs as Article[]) {
      if (seen.has(doc.id)) continue
      seen.add(doc.id)
      out.push(doc)
      if (out.length >= limit) break
    }
    return out
  },
)

export const getArticleBySlugForSite = cache(
  async (siteId: number, slug: string, locale: string): Promise<Article | null> => {
    const payload = await getPayload({ config: await config })
    const res = await payload.find({
      collection: 'articles',
      where: {
        and: [
          { status: { equals: 'published' } },
          { site: { equals: siteId } },
          { slug: { equals: slug } },
          { locale: { equals: locale } },
        ],
      },
      limit: 1,
      depth: 2,
      overrideAccess: true,
    })
    return (res.docs[0] as Article | undefined) ?? null
  },
)

export const getPageBySlugForSite = cache(
  async (siteId: number, slug: string, locale: string): Promise<Page | null> => {
    const payload = await getPayload({ config: await config })
    const res = await payload.find({
      collection: 'pages',
      where: {
        and: [
          { status: { equals: 'published' } },
          { site: { equals: siteId } },
          { slug: { equals: slug } },
          { locale: { equals: locale } },
        ],
      },
      limit: 1,
      depth: 2,
      overrideAccess: true,
    })
    return (res.docs[0] as Page | undefined) ?? null
  },
)
