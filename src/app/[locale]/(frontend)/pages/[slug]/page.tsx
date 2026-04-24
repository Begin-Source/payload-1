import { headers } from 'next/headers.js'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import { hreflangXDefaultUrl, isAppLocale } from '@/i18n/config'
import { lexicalStateToHtml } from '@/utilities/lexicalToHtml'
import { getPublicBaseUrlFromHeaders, seoMetaForDocument } from '@/utilities/seoDocumentMeta'
import { getPublicSiteContext } from '@/utilities/publicLandingTheme'
import { getPageBySlugForSite } from '@/utilities/publicSiteQueries'

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale: loc, slug: raw } = await props.params
  if (!isAppLocale(loc)) return { title: 'Not found' }
  const locale = loc
  const slug = decodeURIComponent(raw)
  const headersList = await headers()
  const { site, theme } = await getPublicSiteContext(headersList)
  if (!site) return { title: theme.browserTitle }
  const page = await getPageBySlugForSite(site.id, slug, locale)
  if (!page) return { title: theme.browserTitle }
  const baseUrl = getPublicBaseUrlFromHeaders(headersList)
  const enc = encodeURIComponent(slug)

  const pZh = await getPageBySlugForSite(site.id, slug, 'zh')
  const pEn = await getPageBySlugForSite(site.id, slug, 'en')
  const alternateLanguages: Record<string, string> = {}
  if (pZh) alternateLanguages['zh-CN'] = `${baseUrl}/zh/pages/${enc}`
  if (pEn) alternateLanguages.en = `${baseUrl}/en/pages/${enc}`
  const xDefault = hreflangXDefaultUrl(baseUrl, `pages/${enc}`, Boolean(pZh), Boolean(pEn))
  if (xDefault) alternateLanguages['x-default'] = xDefault

  return seoMetaForDocument(page, {
    siteName: theme.siteName,
    fallbackTitle: theme.browserTitle,
    path: `/${locale}/pages/${enc}`,
    baseUrl,
    alternateLanguages,
  })
}

export default async function StaticPage(props: Props) {
  const { locale: loc, slug: raw } = await props.params
  if (!isAppLocale(loc)) notFound()
  const locale = loc
  const slug = decodeURIComponent(raw)
  const headersList = await headers()
  const { site } = await getPublicSiteContext(headersList)
  if (!site) notFound()
  const page = await getPageBySlugForSite(site.id, slug, locale)
  if (!page) notFound()

  const html = lexicalStateToHtml(page.body)

  return (
    <article className="blogArticle">
      <h1>{page.title}</h1>
      <div className="blogArticleBody" dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  )
}
