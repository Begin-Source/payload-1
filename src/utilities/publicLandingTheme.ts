import { cache } from 'react'

import { getPayload } from 'payload'

import config from '@/payload.config'
import type { LandingTemplate, PublicLanding, Site, SiteBlueprint } from '@/payload-types'
import { getRequestHost } from '@/utilities/normalizeRequestHost'
import { resolveSiteForLanding } from '@/utilities/resolveSiteForLanding'

export type LandingFontPreset = 'system' | 'serif' | 'noto_sans_sc'

export type LandingTheme = {
  browserTitle: string
  siteName: string
  tagline: string
  loggedInTitle: string
  loggedInSubtitle: string
  footerLine: string
  ctaLabel: string
  bgColor: string
  textColor: string
  mutedColor: string
  ctaBgColor: string
  ctaTextColor: string
  fontPreset: LandingFontPreset
}

export type BlogChromeTheme = {
  blogPrimaryColor: string
  blogAccentColor: string
  blogContentBgColor: string
  blogCardBgColor: string
  blogHeaderTextColor: string
  blogHeadingColor: string
  blogBodyColor: string
  aboutTitle: string
  aboutBio: string
  aboutImageId: number | null
  aboutCtaLabel: string
  aboutCtaHref: string
}

export type PublicSiteTheme = LandingTheme & BlogChromeTheme

const BLOG_DEFAULTS: BlogChromeTheme = {
  blogPrimaryColor: '#2d8659',
  blogAccentColor: '#e6c84a',
  blogContentBgColor: '#f0f0f0',
  blogCardBgColor: '#ffffff',
  blogHeaderTextColor: '#ffffff',
  blogHeadingColor: '#333333',
  blogBodyColor: '#444444',
  aboutTitle: 'About Me',
  aboutBio: '',
  aboutImageId: null,
  aboutCtaLabel: 'Learn more',
  aboutCtaHref: '#',
}

function firstNonEmpty(...values: (string | null | undefined)[]): string | undefined {
  for (const v of values) {
    if (v == null) continue
    const t = String(v).trim()
    if (t) return t
  }
  return undefined
}

export function relationId(value: unknown): number | null {
  if (value == null) return null
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id: unknown }).id
    if (typeof id === 'number' && !Number.isNaN(id)) return id
  }
  return null
}

function pickFontPreset(
  global: PublicLanding,
  template: LandingTemplate | null,
  design: SiteBlueprint | null,
  site: Site | null,
): LandingFontPreset {
  const order = [
    site?.landingFontPreset,
    design?.designFontPreset,
    template?.landingFontPreset,
    global.fontPreset,
  ] as const
  for (const v of order) {
    if (v === 'system' || v === 'serif' || v === 'noto_sans_sc') return v
  }
  return 'system'
}

/**
 * Merge: **站点 landing*** → **设计 design*** → **模版 landing*** → **全局 public-landing**（每层空则下沉）。
 */
export function mergeLandingLayers(
  global: PublicLanding,
  template: LandingTemplate | null,
  design: SiteBlueprint | null,
  site: Site | null,
): LandingTheme {
  const g = global
  const t = template
  const d = design
  const s = site

  const siteName = firstNonEmpty(
    s?.landingSiteName,
    s?.name,
    d?.designSiteName,
    t?.landingSiteName,
    g.siteName,
  ) ?? '基源科技'
  const browserTitle =
    firstNonEmpty(
      s?.landingBrowserTitle,
      s?.name,
      s?.landingSiteName,
      d?.designBrowserTitle,
      t?.landingBrowserTitle,
      g.browserTitle,
      siteName,
    ) ?? siteName
  const tagline = firstNonEmpty(s?.landingTagline, d?.designTagline, t?.landingTagline, g.tagline) ?? ''
  const loggedInTitle =
    firstNonEmpty(s?.landingLoggedInTitle, d?.designLoggedInTitle, t?.landingLoggedInTitle, g.loggedInTitle) ?? ''
  const loggedInSubtitle =
    firstNonEmpty(
      s?.landingLoggedInSubtitle,
      d?.designLoggedInSubtitle,
      t?.landingLoggedInSubtitle,
      g.loggedInSubtitle,
    ) ?? ''
  const footerLine =
    firstNonEmpty(s?.landingFooterLine, d?.designFooterLine, t?.landingFooterLine, g.footerLine) ?? ''
  const ctaLabel =
    firstNonEmpty(s?.landingCtaLabel, d?.designCtaLabel, t?.landingCtaLabel, g.adminCtaLabel) ?? ''
  const bgColor =
    firstNonEmpty(s?.landingBgColor, d?.designBgColor, t?.landingBgColor, g.backgroundColor) ?? '#000000'
  const textColor =
    firstNonEmpty(s?.landingTextColor, d?.designTextColor, t?.landingTextColor, g.textColor) ?? '#ffffff'
  const mutedColor =
    firstNonEmpty(s?.landingMutedColor, d?.designMutedColor, t?.landingMutedColor, g.mutedTextColor) ??
    'rgba(255, 255, 255, 0.55)'
  const ctaBgColor =
    firstNonEmpty(
      s?.landingCtaBgColor,
      d?.designCtaBgColor,
      t?.landingCtaBgColor,
      g.ctaBackgroundColor,
    ) ?? '#ffffff'
  const ctaTextColor =
    firstNonEmpty(s?.landingCtaTextColor, d?.designCtaTextColor, t?.landingCtaTextColor, g.ctaTextColor) ??
    '#000000'
  const fontPreset = pickFontPreset(g, t, d, s)

  return {
    browserTitle,
    siteName,
    tagline,
    loggedInTitle,
    loggedInSubtitle,
    footerLine,
    ctaLabel,
    bgColor,
    textColor,
    mutedColor,
    ctaBgColor,
    ctaTextColor,
    fontPreset,
  }
}

/** 站点 landing* → 设计 design* → 模版 → 全局 public-landing（博客壳与 About）。 */
export function mergeBlogChromeLayers(
  global: PublicLanding,
  template: LandingTemplate | null,
  design: SiteBlueprint | null,
  site: Site | null,
): BlogChromeTheme {
  const g = global
  const t = template
  const d = design
  const s = site

  const aboutImageId =
    relationId(s?.landingAboutImage) ??
    relationId(d?.designAboutImage) ??
    relationId(t?.aboutImage) ??
    relationId(g.aboutImage)

  return {
    blogPrimaryColor:
      firstNonEmpty(
        s?.landingBlogPrimaryColor,
        d?.designBlogPrimaryColor,
        t?.blogPrimaryColor,
        g.blogPrimaryColor,
        BLOG_DEFAULTS.blogPrimaryColor,
      ) ?? BLOG_DEFAULTS.blogPrimaryColor,
    blogAccentColor:
      firstNonEmpty(
        s?.landingBlogAccentColor,
        d?.designBlogAccentColor,
        t?.blogAccentColor,
        g.blogAccentColor,
        BLOG_DEFAULTS.blogAccentColor,
      ) ?? BLOG_DEFAULTS.blogAccentColor,
    blogContentBgColor:
      firstNonEmpty(
        s?.landingBlogContentBgColor,
        d?.designBlogContentBgColor,
        t?.blogContentBgColor,
        g.blogContentBgColor,
        BLOG_DEFAULTS.blogContentBgColor,
      ) ?? BLOG_DEFAULTS.blogContentBgColor,
    blogCardBgColor:
      firstNonEmpty(
        s?.landingBlogCardBgColor,
        d?.designBlogCardBgColor,
        t?.blogCardBgColor,
        g.blogCardBgColor,
        BLOG_DEFAULTS.blogCardBgColor,
      ) ?? BLOG_DEFAULTS.blogCardBgColor,
    blogHeaderTextColor:
      firstNonEmpty(
        s?.landingBlogHeaderTextColor,
        d?.designBlogHeaderTextColor,
        t?.blogHeaderTextColor,
        g.blogHeaderTextColor,
        BLOG_DEFAULTS.blogHeaderTextColor,
      ) ?? BLOG_DEFAULTS.blogHeaderTextColor,
    blogHeadingColor:
      firstNonEmpty(
        s?.landingBlogHeadingColor,
        d?.designBlogHeadingColor,
        t?.blogHeadingColor,
        g.blogHeadingColor,
        BLOG_DEFAULTS.blogHeadingColor,
      ) ?? BLOG_DEFAULTS.blogHeadingColor,
    blogBodyColor:
      firstNonEmpty(
        s?.landingBlogBodyColor,
        d?.designBlogBodyColor,
        t?.blogBodyColor,
        g.blogBodyColor,
        BLOG_DEFAULTS.blogBodyColor,
      ) ?? BLOG_DEFAULTS.blogBodyColor,
    aboutTitle:
      firstNonEmpty(s?.landingAboutTitle, d?.designAboutTitle, t?.aboutTitle, g.aboutTitle, BLOG_DEFAULTS.aboutTitle) ??
      BLOG_DEFAULTS.aboutTitle,
    aboutBio: firstNonEmpty(s?.landingAboutBio, d?.designAboutBio, t?.aboutBio, g.aboutBio) ?? '',
    aboutImageId,
    aboutCtaLabel:
      firstNonEmpty(
        s?.landingAboutCtaLabel,
        d?.designAboutCtaLabel,
        t?.aboutCtaLabel,
        g.aboutCtaLabel,
        BLOG_DEFAULTS.aboutCtaLabel,
      ) ?? BLOG_DEFAULTS.aboutCtaLabel,
    aboutCtaHref:
      firstNonEmpty(
        s?.landingAboutCtaHref,
        d?.designAboutCtaHref,
        t?.aboutCtaHref,
        g.aboutCtaHref,
        BLOG_DEFAULTS.aboutCtaHref,
      ) ?? BLOG_DEFAULTS.aboutCtaHref,
  }
}

export function mergePublicSiteTheme(
  global: PublicLanding,
  template: LandingTemplate | null,
  design: SiteBlueprint | null,
  site: Site | null,
): PublicSiteTheme {
  return {
    ...mergeLandingLayers(global, template, design, site),
    ...mergeBlogChromeLayers(global, template, design, site),
  }
}

type PublicSiteBundle = {
  site: Site | null
  globalDoc: PublicLanding
  template: LandingTemplate | null
  blueprint: SiteBlueprint | null
}

const loadPublicSiteBundle = cache(async (rawHostKey: string, siteSlugKey: string): Promise<PublicSiteBundle> => {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const globalDoc = (await payload.findGlobal({
    slug: 'public-landing',
    depth: 0,
  })) as PublicLanding

  const site = await resolveSiteForLanding(payload, {
    rawHost: rawHostKey,
    siteSlugFromHeader: siteSlugKey,
  })

  let template: LandingTemplate | null = null
  const templateId = relationId(site?.landingTemplate)
  if (templateId) {
    try {
      template = (await payload.findByID({
        collection: 'landing-templates',
        id: templateId,
        depth: 0,
        overrideAccess: true,
      })) as LandingTemplate
    } catch {
      template = null
    }
  }

  let blueprint: SiteBlueprint | null = null
  const blueprintId = relationId(site?.blueprint)
  if (blueprintId) {
    try {
      blueprint = (await payload.findByID({
        collection: 'site-blueprints',
        id: blueprintId,
        depth: 0,
        overrideAccess: true,
      })) as SiteBlueprint
    } catch {
      blueprint = null
    }
  }

  return { site, globalDoc, template, blueprint }
})

const loadPublicSiteTheme = cache(async (rawHostKey: string, siteSlugKey: string): Promise<PublicSiteTheme> => {
  const { site, globalDoc, template, blueprint } = await loadPublicSiteBundle(rawHostKey, siteSlugKey)
  return mergePublicSiteTheme(globalDoc, template, blueprint, site)
})

/**
 * Cached per request: theme + resolved site + raw layers (for callers that need `site.id` without extra resolve).
 */
export async function getPublicSiteContext(headers: Headers): Promise<{
  site: Site | null
  theme: PublicSiteTheme
}> {
  const rawHost = getRequestHost(headers) ?? ''
  const siteSlug = headers.get('x-site-slug')?.trim() ?? ''
  const bundle = await loadPublicSiteBundle(rawHost, siteSlug)
  const theme = mergePublicSiteTheme(bundle.globalDoc, bundle.template, bundle.blueprint, bundle.site)
  return { site: bundle.site, theme }
}

/**
 * Full public theme (landing + blog chrome) for metadata and layout.
 */
export async function getPublicSiteTheme(headers: Headers): Promise<PublicSiteTheme> {
  const rawHost = getRequestHost(headers) ?? ''
  const siteSlug = headers.get('x-site-slug')?.trim() ?? ''
  return loadPublicSiteTheme(rawHost, siteSlug)
}

/** @deprecated Use `getPublicSiteTheme`; kept for gradual migration. */
export async function getLandingThemeForRequest(headers: Headers): Promise<PublicSiteTheme> {
  return getPublicSiteTheme(headers)
}
