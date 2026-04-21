/** Plain-text fields per collection (shared with API + admin UI). `media` is tenant-scoped only (no site). */
export const FIND_REPLACE_COLLECTION_FIELDS = {
  articles: ['title', 'slug', 'excerpt'],
  pages: ['title', 'slug', 'excerpt'],
  'knowledge-base': ['title', 'slug', 'notes'],
  keywords: ['term', 'slug', 'notes'],
  media: ['alt'],
} as const

export type FindReplaceCollectionSlug = keyof typeof FIND_REPLACE_COLLECTION_FIELDS

export function isFindReplaceCollectionSlug(s: string): s is FindReplaceCollectionSlug {
  return Object.prototype.hasOwnProperty.call(FIND_REPLACE_COLLECTION_FIELDS, s)
}

/** 媒体库无 site 字段，按租户筛选；其余集合需选择站点。 */
export function findReplaceRequiresSite(slug: FindReplaceCollectionSlug): boolean {
  return slug !== 'media'
}

export const FIND_REPLACE_FIELD_LABELS: Record<
  string,
  Record<string, string>
> = {
  articles: {
    title: '标题',
    slug: 'URL 别名',
    excerpt: '摘要',
  },
  pages: {
    title: '标题',
    slug: 'URL 别名',
    excerpt: '摘要',
  },
  'knowledge-base': {
    title: '标题',
    slug: 'URL 别名',
    notes: '备注',
  },
  keywords: {
    term: '关键词',
    slug: 'URL 别名',
    notes: '备注',
  },
  media: {
    alt: '替代文本',
  },
}
