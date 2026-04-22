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
