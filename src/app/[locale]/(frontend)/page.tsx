import { headers as getHeaders } from 'next/headers.js'
import { notFound } from 'next/navigation'
import React from 'react'

import { AboutSidebar } from '@/components/blog/AboutSidebar'
import { PostList } from '@/components/blog/PostList'
import { isAppLocale } from '@/i18n/config'
import { getPublicSiteContext } from '@/utilities/publicLandingTheme'
import { getPublishedArticlesForSite } from '@/utilities/publicSiteQueries'

type Props = { params: Promise<{ locale: string }> }

export default async function HomePage(props: Props) {
  const { locale: localeParam } = await props.params
  if (!isAppLocale(localeParam)) notFound()
  const locale = localeParam

  const headers = await getHeaders()
  const { site, theme } = await getPublicSiteContext(headers)

  if (!site) {
    return (
      <div className="blogRow">
        <div>
          <h1 className="blogPageTitle">{theme.siteName}</h1>
          <p style={{ color: 'var(--blog-body)', lineHeight: 1.6 }}>
            No site resolved for this host. On localhost, open{' '}
            <code style={{ fontSize: '0.9em' }}>?site=your-site-slug</code> or set{' '}
            <code style={{ fontSize: '0.9em' }}>NEXT_PUBLIC_DEFAULT_SITE_SLUG</code>.
          </p>
        </div>
        <AboutSidebar theme={theme} />
      </div>
    )
  }

  const articles = await getPublishedArticlesForSite(site.id, locale)

  return (
    <div className="blogRow">
      <div>
        <h1 className="blogPageTitle">Latest posts</h1>
        <PostList articles={articles} locale={locale} />
      </div>
      <AboutSidebar theme={theme} />
    </div>
  )
}
