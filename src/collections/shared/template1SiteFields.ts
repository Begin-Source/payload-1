import type { Field } from 'payload'

/**
 * Per-site Template1 shell copy (en/zh), as **one JSON field** on `site-t1-locales` (`t1LocaleJson`)
 * so Cloudflare D1 stays under the 100 columns/table cap. Merged in `mergeTemplate1FromSite` with
 * code defaults when keys are empty. See `publicLandingTemplate1.ts` for key names.
 */
export const template1SiteFields: Field[] = [
  {
    name: 't1LocaleJson',
    type: 'json',
    label: 'Template1 文案 (en/zh)',
    defaultValue: {},
    admin: {
      description:
        'JSON 对象：键与历史独立字段一致（如 t1NavAllReviewsEn、t1HomeTitleZh、t1NavUsePageTitleForAbout 等）。留空则整段用代码默认。可粘贴 `scripts/seed-dev-data.ts` 中 `SEED_ALPHA_TEMPLATE1_DEMO` 结构作参考。',
    },
  },
]
