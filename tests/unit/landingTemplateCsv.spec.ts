import { describe, expect, it } from 'vitest'

import {
  landingTemplateDataFromRow,
  landingTemplateDocToRow,
  LANDING_TEMPLATE_CSV_HEADER,
} from '@/utilities/landingTemplateCsv'

const HEADER = LANDING_TEMPLATE_CSV_HEADER.split(',').map((h) => h.toLowerCase())

function rowFor(values: Record<string, string>): string[] {
  return HEADER.map((h) => values[h] ?? '')
}

describe('landingTemplateDataFromRow', () => {
  it('should map snake_case row to Payload field data', () => {
    const row = rowFor({
      name: 'T1',
      slug: 't1',
      description: 'd',
      preview_url: 'https://x.test/a',
      landing_font_preset: 'system',
      about_image_id: '42',
    })
    const { data, error } = landingTemplateDataFromRow(HEADER, row)
    expect(error).toBeUndefined()
    expect(data.name).toBe('T1')
    expect(data.slug).toBe('t1')
    expect(data.description).toBe('d')
    expect(data.previewUrl).toBe('https://x.test/a')
    expect(data.landingFontPreset).toBe('system')
    expect(data.aboutImage).toBe(42)
  })

  it('should map full-site template fields from CSV', () => {
    const row = rowFor({
      name: 'Template1',
      slug: 'template1',
      site_layout: 'template1',
      footer_resource_links_json: '[{"label":"Privacy","href":"/en/privacy"}]',
      t1_locale_json: '{"t1HomeTitleEn":"Best gear","t1NavUsePageTitleForAbout":true}',
    })
    const { data, error } = landingTemplateDataFromRow(HEADER, row)
    expect(error).toBeUndefined()
    expect(data.siteLayout).toBe('template1')
    expect(data.footerResourceLinks).toEqual([{ label: 'Privacy', href: '/en/privacy' }])
    expect(data.t1LocaleJson).toEqual({
      t1HomeTitleEn: 'Best gear',
      t1NavUsePageTitleForAbout: true,
    })
  })

  it('should export full-site template fields to CSV', () => {
    const row = landingTemplateDocToRow({
      id: 1,
      name: 'Template1',
      slug: 'template1',
      siteLayout: 'template1',
      footerResourceLinks: [{ label: 'Privacy', href: '/en/privacy' }],
      t1LocaleJson: { t1HomeTitleEn: 'Best gear' },
      updatedAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
    } as never)
    expect(row).toContain('template1')
    expect(row).toContain('"[{""label"":""Privacy"",""href"":""/en/privacy""}]"')
    expect(row).toContain('"{""t1HomeTitleEn"":""Best gear""}"')
  })

  it('should return error when landing_font_preset is invalid', () => {
    const row = rowFor({
      name: 'T',
      slug: 't',
      landing_font_preset: 'comic_sans',
    })
    const { error } = landingTemplateDataFromRow(HEADER, row)
    expect(error).toBe('invalid landing_font_preset')
  })

  it('should return error when site_layout is invalid', () => {
    const row = rowFor({
      name: 'T',
      slug: 't',
      site_layout: 'magazine',
    })
    const { error } = landingTemplateDataFromRow(HEADER, row)
    expect(error).toBe('invalid site_layout')
  })

  it('should return error when footer_resource_links_json is not an array', () => {
    const row = rowFor({
      name: 'T',
      slug: 't',
      footer_resource_links_json: '{"label":"Privacy"}',
    })
    const { error } = landingTemplateDataFromRow(HEADER, row)
    expect(error).toBe('footer_resource_links_json must be a JSON array')
  })

  it('should return error when t1_locale_json is not an object', () => {
    const row = rowFor({
      name: 'T',
      slug: 't',
      t1_locale_json: '[]',
    })
    const { error } = landingTemplateDataFromRow(HEADER, row)
    expect(error).toBe('t1_locale_json must be a JSON object')
  })

  it('should return error when about_image_id is not a number', () => {
    const row = rowFor({
      name: 'T',
      slug: 't',
      landing_font_preset: '',
      about_image_id: 'nope',
    })
    const { error } = landingTemplateDataFromRow(HEADER, row)
    expect(error).toBe('invalid about_image_id')
  })

  it('should set landingFontPreset and aboutImage to null when empty', () => {
    const row = rowFor({
      name: 'T',
      slug: 't',
      landing_font_preset: '',
      about_image_id: '',
    })
    const { data, error } = landingTemplateDataFromRow(HEADER, row)
    expect(error).toBeUndefined()
    expect(data.landingFontPreset).toBeNull()
    expect(data.aboutImage).toBeNull()
  })
})
