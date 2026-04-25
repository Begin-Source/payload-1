import type { LandingTemplate } from '@/payload-types'
import { escapeCsvCell } from '@/utilities/csv'

/** snake_case 列与 Payload 文档字段一一对应（含 tenant_id、about_image_id） */
export const LANDING_TEMPLATE_CSV_HEADER = [
  'id',
  'name',
  'slug',
  'description',
  'preview_url',
  'tenant_id',
  'landing_browser_title',
  'landing_site_name',
  'landing_tagline',
  'landing_logged_in_title',
  'landing_logged_in_subtitle',
  'landing_footer_line',
  'landing_cta_label',
  'landing_bg_color',
  'landing_text_color',
  'landing_muted_color',
  'landing_cta_bg_color',
  'landing_cta_text_color',
  'landing_font_preset',
  'blog_primary_color',
  'blog_accent_color',
  'blog_content_bg_color',
  'blog_card_bg_color',
  'blog_header_text_color',
  'blog_heading_color',
  'blog_body_color',
  'about_title',
  'about_bio',
  'about_image_id',
  'about_cta_label',
  'about_cta_href',
].join(',')

const FONT_PRESET = new Set(['', 'system', 'serif', 'noto_sans_sc'])

function docTenantIdNum(doc: { tenant?: number | { id: number } | null }): number | null {
  const t = doc.tenant
  if (t == null) return null
  if (typeof t === 'object') return t.id
  if (typeof t === 'number') return t
  return null
}

function aboutImageId(
  m: number | { id: number } | null | undefined,
): string {
  if (m == null) return ''
  if (typeof m === 'number') return String(m)
  return String(m.id)
}

export function landingTemplateDocToRow(doc: LandingTemplate): string {
  const tid = docTenantIdNum(doc)
  return [
    String(doc.id),
    escapeCsvCell(doc.name ?? ''),
    escapeCsvCell(doc.slug ?? ''),
    escapeCsvCell(doc.description == null ? '' : String(doc.description)),
    escapeCsvCell(doc.previewUrl == null ? '' : String(doc.previewUrl)),
    escapeCsvCell(tid == null ? '' : String(tid)),
    escapeCsvCell(doc.landingBrowserTitle == null ? '' : String(doc.landingBrowserTitle)),
    escapeCsvCell(doc.landingSiteName == null ? '' : String(doc.landingSiteName)),
    escapeCsvCell(doc.landingTagline == null ? '' : String(doc.landingTagline)),
    escapeCsvCell(doc.landingLoggedInTitle == null ? '' : String(doc.landingLoggedInTitle)),
    escapeCsvCell(doc.landingLoggedInSubtitle == null ? '' : String(doc.landingLoggedInSubtitle)),
    escapeCsvCell(doc.landingFooterLine == null ? '' : String(doc.landingFooterLine)),
    escapeCsvCell(doc.landingCtaLabel == null ? '' : String(doc.landingCtaLabel)),
    escapeCsvCell(doc.landingBgColor == null ? '' : String(doc.landingBgColor)),
    escapeCsvCell(doc.landingTextColor == null ? '' : String(doc.landingTextColor)),
    escapeCsvCell(doc.landingMutedColor == null ? '' : String(doc.landingMutedColor)),
    escapeCsvCell(doc.landingCtaBgColor == null ? '' : String(doc.landingCtaBgColor)),
    escapeCsvCell(doc.landingCtaTextColor == null ? '' : String(doc.landingCtaTextColor)),
    escapeCsvCell(
      doc.landingFontPreset == null || doc.landingFontPreset === undefined
        ? ''
        : String(doc.landingFontPreset),
    ),
    escapeCsvCell(doc.blogPrimaryColor == null ? '' : String(doc.blogPrimaryColor)),
    escapeCsvCell(doc.blogAccentColor == null ? '' : String(doc.blogAccentColor)),
    escapeCsvCell(doc.blogContentBgColor == null ? '' : String(doc.blogContentBgColor)),
    escapeCsvCell(doc.blogCardBgColor == null ? '' : String(doc.blogCardBgColor)),
    escapeCsvCell(doc.blogHeaderTextColor == null ? '' : String(doc.blogHeaderTextColor)),
    escapeCsvCell(doc.blogHeadingColor == null ? '' : String(doc.blogHeadingColor)),
    escapeCsvCell(doc.blogBodyColor == null ? '' : String(doc.blogBodyColor)),
    escapeCsvCell(doc.aboutTitle == null ? '' : String(doc.aboutTitle)),
    escapeCsvCell(doc.aboutBio == null ? '' : String(doc.aboutBio)),
    escapeCsvCell(aboutImageId(doc.aboutImage)),
    escapeCsvCell(doc.aboutCtaLabel == null ? '' : String(doc.aboutCtaLabel)),
    escapeCsvCell(doc.aboutCtaHref == null ? '' : String(doc.aboutCtaHref)),
  ].join(',')
}

function col(headerCells: string[], row: string[], name: string): string {
  const idx = headerCells.indexOf(name)
  if (idx < 0) return ''
  return row[idx] ?? ''
}

/**
 * 从数据行建立写入 Payload 的 data（新建或更新用）。
 * 不含 name/slug/tenant 的校验，由路由完成。
 */
export function landingTemplateDataFromRow(
  headerCells: string[],
  row: string[],
): { data: Record<string, unknown>; error?: string } {
  const c = (n: string) => col(headerCells, row, n)
  const data: Record<string, unknown> = {
    name: c('name').trim(),
    slug: c('slug').trim(),
    description: c('description').trim() || null,
    previewUrl: c('preview_url').trim() || null,
    landingBrowserTitle: c('landing_browser_title').trim() || null,
    landingSiteName: c('landing_site_name').trim() || null,
    landingTagline: c('landing_tagline').trim() || null,
    landingLoggedInTitle: c('landing_logged_in_title').trim() || null,
    landingLoggedInSubtitle: c('landing_logged_in_subtitle').trim() || null,
    landingFooterLine: c('landing_footer_line').trim() || null,
    landingCtaLabel: c('landing_cta_label').trim() || null,
    landingBgColor: c('landing_bg_color').trim() || null,
    landingTextColor: c('landing_text_color').trim() || null,
    landingMutedColor: c('landing_muted_color').trim() || null,
    landingCtaBgColor: c('landing_cta_bg_color').trim() || null,
    landingCtaTextColor: c('landing_cta_text_color').trim() || null,
    blogPrimaryColor: c('blog_primary_color').trim() || null,
    blogAccentColor: c('blog_accent_color').trim() || null,
    blogContentBgColor: c('blog_content_bg_color').trim() || null,
    blogCardBgColor: c('blog_card_bg_color').trim() || null,
    blogHeaderTextColor: c('blog_header_text_color').trim() || null,
    blogHeadingColor: c('blog_heading_color').trim() || null,
    blogBodyColor: c('blog_body_color').trim() || null,
    aboutTitle: c('about_title').trim() || null,
    aboutBio: c('about_bio').trim() || null,
    aboutCtaLabel: c('about_cta_label').trim() || null,
    aboutCtaHref: c('about_cta_href').trim() || null,
  }
  const fp = c('landing_font_preset').trim()
  if (!FONT_PRESET.has(fp)) {
    return { data: {}, error: 'invalid landing_font_preset' }
  }
  data.landingFontPreset = fp === '' ? null : fp

  const aid = c('about_image_id').trim()
  if (aid === '') {
    data.aboutImage = null
  } else {
    const n = Number(aid)
    if (!Number.isFinite(n)) {
      return { data: {}, error: 'invalid about_image_id' }
    }
    data.aboutImage = n
  }
  return { data }
}
