import Link from 'next/link'
import React from 'react'

import type { AmzSiteConfig } from '@/amz-template-1/defaultSiteConfig'
import { firstCategoryFromArticle } from '@/components/blog/articleHelpers'
import type { AppLocale } from '@/i18n/config'
import type { Article, Category, Media } from '@/payload-types'

function mediaUrl(featured: Article['featuredImage']): string | null {
  if (featured == null) return null
  if (typeof featured === 'object' && featured !== null && 'url' in featured) {
    const u = (featured as Media).url
    return typeof u === 'string' ? u : null
  }
  return null
}

function articlePath(locale: AppLocale, a: Article): string {
  const slug = a.slug?.trim()
  if (slug) return `/${locale}/posts/${encodeURIComponent(slug)}`
  return `/${locale}/posts/id-${a.id}`
}

export type AmzTemplateHomePageProps = {
  locale: AppLocale
  config: AmzSiteConfig
  articles: Article[]
  categories: Category[]
}

export function AmzTemplateHomePage(props: AmzTemplateHomePageProps) {
  const { locale, config, articles, categories } = props
  const hero = config.homepage.hero
  const listTitle = config.homepage.featuredProducts.title
  const listSubtitle = config.homepage.featuredProducts.subtitle
  const catTitle = config.homepage.categories.title
  const catSubtitle = config.homepage.categories.subtitle

  return (
    <div className="container mx-auto px-4 py-10">
      <section className="mb-12 border-b border-border pb-10 text-center md:text-left">
        <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {hero.title}
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{hero.subtitle}</p>
      </section>

      {categories.length > 0 ? (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground">{catTitle}</h2>
          <p className="mt-1 text-muted-foreground">{catSubtitle}</p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/${locale}/categories/${encodeURIComponent(c.slug ?? String(c.id))}`}
                  className="inline-flex rounded-full border border-border bg-card px-3 py-1 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="text-2xl font-semibold text-foreground">{listTitle}</h2>
        <p className="mt-1 text-muted-foreground">{listSubtitle}</p>

        {articles.length === 0 ? (
          <p className="mt-6 text-muted-foreground">No published posts yet.</p>
        ) : (
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => {
              const href = articlePath(locale, article)
              const img = mediaUrl(article.featuredImage)
              const category = firstCategoryFromArticle(article)
              return (
                <li key={article.id}>
                  <article className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
                    <Link href={href} className="block aspect-video w-full overflow-hidden bg-muted">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </Link>
                    <div className="flex flex-1 flex-col p-4">
                      {category ? (
                        <span className="text-xs font-medium uppercase tracking-wide text-primary">
                          {category.title}
                        </span>
                      ) : null}
                      <Link href={href} className="mt-2 block">
                        <h3 className="text-lg font-semibold text-foreground hover:text-primary">
                          {article.title}
                        </h3>
                      </Link>
                      {(() => {
                        const excerpt = article.excerpt?.trim()
                        const metaDesc =
                          typeof article.meta === 'object' &&
                          article.meta !== null &&
                          'description' in article.meta
                            ? String(
                                (article.meta as { description?: string | null }).description ?? '',
                              ).trim()
                            : ''
                        const blurb = excerpt || metaDesc
                        return blurb ? (
                          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{blurb}</p>
                        ) : null
                      })()}
                      <Link
                        href={href}
                        className="mt-auto pt-4 text-sm font-medium text-primary hover:underline"
                      >
                        Read more →
                      </Link>
                    </div>
                  </article>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
