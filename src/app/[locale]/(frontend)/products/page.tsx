import { headers as getHeaders } from 'next/headers.js'
import { notFound } from 'next/navigation'
import React from 'react'

import { AmzProductsPage } from '@/components/amz-template-1/AmzProductsPage'
import { isAppLocale } from '@/i18n/config'
import { getPublicSiteContext, isAmzTemplateLayout } from '@/utilities/publicLandingTheme'
import {
  getActiveOffersForSite,
  getCategoryBySlugForSite,
  getNavCategoriesForSite,
} from '@/utilities/publicSiteQueries'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ category?: string | string[] }>
}

export default async function ProductsPage(props: Props) {
  const { locale: localeParam } = await props.params
  if (!isAppLocale(localeParam)) notFound()
  const locale = localeParam

  const sp = await props.searchParams
  const rawCat = sp.category
  const raw = (Array.isArray(rawCat) ? rawCat[0] : rawCat)?.trim() || ''
  const slug = raw ? decodeURIComponent(raw) : ''

  const headers = await getHeaders()
  const { site, theme } = await getPublicSiteContext(headers)
  if (!site) notFound()
  if (!isAmzTemplateLayout(theme.siteLayout) || !theme.amzSiteConfig) notFound()

  const categoryDoc = slug ? await getCategoryBySlugForSite(site.id, slug) : null
  const categoryId = categoryDoc?.id

  const [offers, categories] = await Promise.all([
    getActiveOffersForSite(site.id, 120, categoryId),
    getNavCategoriesForSite(site.id, 48),
  ])

  return (
    <AmzProductsPage
      locale={locale}
      config={theme.amzSiteConfig}
      offers={offers}
      categories={categories}
      activeCategorySlug={slug || null}
    />
  )
}
