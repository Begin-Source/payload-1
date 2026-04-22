import { headers } from 'next/headers.js'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import type { Media } from '@/payload-types'
import { isAppLocale } from '@/i18n/config'
import { lexicalStateToHtml } from '@/utilities/lexicalToHtml'
import { getPublicBaseUrlFromHeaders, seoMetaForDocument } from '@/utilities/seoDocumentMeta'
import { getPublicSiteContext } from '@/utilities/publicLandingTheme'
import { getArticleBySlugForSite } from '@/utilities/publicSiteQueries'

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale: loc, slug: raw } = await props.params
  if (!isAppLocale(loc)) return { title: 'Not found' }
  const locale = loc
  const slug = decodeURIComponent(raw)
  const headersList = await headers()
  const { site, theme } = await getPublicSiteContext(headersList)
  if (!site) return { title: theme.browserTitle }
  const article = await getArticleBySlugForSite(site.id, slug, locale)
  if (!article) return { title: theme.browserTitle }
  const baseUrl = getPublicBaseUrlFromHeaders(headersList)
  const enc = encodeURIComponent(slug)

  const altZh = await getArticleBySlugForSite(site.id, slug, 'zh')
  const altEn = await getArticleBySlugForSite(site.id, slug, 'en')
  const alternateLanguages: Record<string, string> = {}
  if (altZh) alternateLanguages['zh-CN'] = `${baseUrl}/zh/posts/${enc}`
  if (altEn) alternateLanguages.en = `${baseUrl}/en/posts/${enc}`
  if (altZh || altEn) {
    alternateLanguages['x-default'] = `${baseUrl}/zh/posts/${enc}`
  }

  return seoMetaForDocument(article, {
    siteName: theme.siteName,
    fallbackTitle: theme.browserTitle,
    path: `/${locale}/posts/${enc}`,
    baseUrl,
    alternateLanguages,
  })
}

export default async function PostPage(props: Props) {
  const { locale: loc, slug: raw } = await props.params
  if (!isAppLocale(loc)) notFound()
  const locale = loc
  const slug = decodeURIComponent(raw)
  const headersList = await headers()
  const { site } = await getPublicSiteContext(headersList)
  if (!site) notFound()
  const article = await getArticleBySlugForSite(site.id, slug, locale)
  if (!article) notFound()

  const html = lexicalStateToHtml(article.body)
  const img =
    article.featuredImage != null &&
    typeof article.featuredImage === 'object' &&
    'url' in article.featuredImage &&
    typeof (article.featuredImage as Media).url === 'string'
      ? (article.featuredImage as Media).url
      : null
  const date =
    article.publishedAt != null
      ? new Date(article.publishedAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : null

  return (
    <article className="blogArticle">
      <h1>{article.title}</h1>
      {date ? (
        <p style={{ color: 'var(--blog-muted)', fontSize: '0.9rem', marginTop: '-0.5rem' }}>{date}</p>
      ) : null}
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt="" style={{ width: '100%', borderRadius: 6, marginBottom: '1.5rem' }} />
      ) : null}
      <div className="blogArticleBody" dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  )
}
