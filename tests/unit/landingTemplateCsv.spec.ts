import { describe, expect, it } from 'vitest'

import { landingTemplateDataFromRow, LANDING_TEMPLATE_CSV_HEADER } from '@/utilities/landingTemplateCsv'

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

  it('should return error when landing_font_preset is invalid', () => {
    const row = rowFor({
      name: 'T',
      slug: 't',
      landing_font_preset: 'comic_sans',
    })
    const { error } = landingTemplateDataFromRow(HEADER, row)
    expect(error).toBe('invalid landing_font_preset')
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
