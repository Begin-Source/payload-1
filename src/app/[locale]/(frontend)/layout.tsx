import { Noto_Sans_SC } from 'next/font/google'
import type { Metadata } from 'next'
import { headers } from 'next/headers.js'
import { notFound } from 'next/navigation'
import React from 'react'

import { BlogHeader } from '@/components/blog/BlogHeader'
import config from '@/payload.config'
import { htmlLangForLocale, isAppLocale } from '@/i18n/config'
import { getNavCategoriesForSite } from '@/utilities/publicSiteQueries'
import { getPublicSiteContext, getPublicSiteTheme } from '@/utilities/publicLandingTheme'

import '@/components/blog/blog.css'
import './styles.css'

const notoSansSc = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
})

type LayoutProps = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const theme = await getPublicSiteTheme(headersList)
  return {
    title: theme.browserTitle,
    description: theme.tagline,
  }
}

export default async function LocaleFrontendLayout(props: LayoutProps) {
  const { children, params } = props
  const { locale: localeParam } = await params
  if (!isAppLocale(localeParam)) notFound()
  const locale = localeParam

  const headersList = await headers()
  const payloadConfig = await config
  const { site, theme } = await getPublicSiteContext(headersList)
  const categories = site ? await getNavCategoriesForSite(site.id) : []

  const bodyStyle: React.CSSProperties = {
    backgroundColor: theme.blogContentBgColor,
    color: theme.blogBodyColor,
  }
  if (theme.fontPreset === 'serif') {
    bodyStyle.fontFamily = 'Georgia, "Times New Roman", serif'
  } else if (theme.fontPreset === 'system') {
    bodyStyle.fontFamily = 'system-ui, sans-serif'
  }

  const htmlStyle = {
    backgroundColor: theme.blogContentBgColor,
    '--landing-bg': theme.bgColor,
    '--landing-text': theme.textColor,
    '--landing-muted': theme.mutedColor,
    '--landing-cta-bg': theme.ctaBgColor,
    '--landing-cta-text': theme.ctaTextColor,
    '--blog-primary': theme.blogPrimaryColor,
    '--blog-accent': theme.blogAccentColor,
    '--blog-card-bg': theme.blogCardBgColor,
    '--blog-header-text': theme.blogHeaderTextColor,
    '--blog-heading': theme.blogHeadingColor,
    '--blog-body': theme.blogBodyColor,
    '--blog-muted': 'rgba(0,0,0,0.45)',
  } as React.CSSProperties

  return (
    <html lang={htmlLangForLocale(locale)} style={htmlStyle}>
      <body
        className={theme.fontPreset === 'noto_sans_sc' ? notoSansSc.className : undefined}
        style={bodyStyle}
      >
        <div className="blogShell">
          <BlogHeader
            adminHref={payloadConfig.routes.admin}
            categories={categories}
            locale={locale}
            theme={theme}
          />
          <main className="blogMain">{children}</main>
          {theme.footerLine ? (
            <footer className="blogFooter">
              <p>{theme.footerLine}</p>
            </footer>
          ) : null}
        </div>
      </body>
    </html>
  )
}
