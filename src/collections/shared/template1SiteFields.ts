import type { Field } from 'payload'

/**
 * Template1 shell copy (en/zh), stored as **one JSON field** (`t1LocaleJson`) so Cloudflare D1
 * stays under the 100 columns/table cap. Used by `landing-templates` as the base layer and
 * `site-t1-locales` as the per-site override layer. See `publicLandingTemplate1.ts` for key names.
 */
export const template1SiteFields: Field[] = [
  {
    name: 't1LocaleJson',
    type: 'json',
    label: 'Template1 文案 (en/zh)',
    defaultValue: {},
    admin: {
      description:
        'JSON 对象：键与历史独立字段一致（如 t1NavAllReviewsEn、t1HomeTitleZh、t1NavUsePageTitleForAbout 等）。整站模版作为基础层，站点 Template1 文案作为覆盖层；留空则用下一层或代码默认。可粘贴 `scripts/seed-dev-data.ts` 中 `SEED_ALPHA_TEMPLATE1_DEMO` 结构作参考。',
    },
  },
]
