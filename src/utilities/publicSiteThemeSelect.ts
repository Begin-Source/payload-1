/**
 * `payload.find` / `findByID` on `sites` for public landing: narrow SELECT so D1 does not
 * hit max result width. Excludes e.g. `operators` (hasMany users) which adds `sites_rels` aggregation.
 *
 * Template1 copy lives in **`site-t1-locales`** (separate table); do not add columns to `sites`.
 *
 * Kept in sync with merge sources in:
 * - `mergeLandingLayers` / `mergeBlogChromeLayers` in `publicLandingTheme.ts`
 * - `mergeTemplate1FromSite` / `siteT1FromLocaleJson` in `publicLandingTemplate1.ts`
 */
export const publicSiteThemeSelectWithoutT1 = {
  id: true,
  name: true,
  slug: true,
  primaryDomain: true,
  status: true,
  siteLayout: true,
  blueprint: true,
  landingTemplate: true,
  landingBrowserTitle: true,
  landingSiteName: true,
  landingTagline: true,
  landingLoggedInTitle: true,
  landingLoggedInSubtitle: true,
  landingFooterLine: true,
  landingCtaLabel: true,
  landingBgColor: true,
  landingTextColor: true,
  landingMutedColor: true,
  landingCtaBgColor: true,
  landingCtaTextColor: true,
  landingFontPreset: true,
  reviewHubTagline: true,
  affiliateDisclosureLine: true,
  footerResourceLinks: true,
  landingBlogPrimaryColor: true,
  landingBlogAccentColor: true,
  landingBlogContentBgColor: true,
  landingBlogCardBgColor: true,
  landingBlogHeaderTextColor: true,
  landingBlogHeadingColor: true,
  landingBlogBodyColor: true,
  landingAboutTitle: true,
  landingAboutBio: true,
  landingAboutImage: true,
  landingAboutCtaLabel: true,
  landingAboutCtaHref: true,
} as const
