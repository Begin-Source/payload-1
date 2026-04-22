/** URL segment + stored `locale` on articles/pages (short codes). */
export const locales = ['zh', 'en'] as const

export type AppLocale = (typeof locales)[number]

export const defaultLocale: AppLocale = 'zh'

export function isAppLocale(value: string): value is AppLocale {
  return (locales as readonly string[]).includes(value)
}

export function htmlLangForLocale(locale: AppLocale): string {
  return locale === 'zh' ? 'zh-CN' : 'en'
}
