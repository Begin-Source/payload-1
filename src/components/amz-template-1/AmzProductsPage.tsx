import React from 'react'

import { AmzLink } from '@/amz-template-1/AmzLink'
import { amzNavHref } from '@/amz-template-1/amzNavHref'
import type { AmzSiteConfig } from '@/amz-template-1/defaultSiteConfig'
import type { AppLocale } from '@/i18n/config'
import type { Category, Offer } from '@/payload-types'

import { buildAmzCategoryCards } from './categoryCards'
import { AmzOfferCard } from './AmzOfferCard'

export function AmzProductsPage({
  locale,
  config,
  offers,
  categories,
  activeCategorySlug,
}: {
  locale: AppLocale
  config: AmzSiteConfig
  offers: Offer[]
  categories: Category[]
  /** ?category= 当前选中的分类 slug（高亮 chip） */
  activeCategorySlug?: string | null
}) {
  const p = config.pages.products
  const catCards = buildAmzCategoryCards(config, categories)
  const productsBase = amzNavHref(locale, '/products')

  return (
    <div className="container mx-auto px-4 py-10">
      <header className="mx-auto max-w-3xl text-center">
        <h1 className="text-balance text-3xl font-bold text-foreground md:text-4xl">{p.title}</h1>
        <p className="mt-4 text-balance text-lg text-muted-foreground">{p.description}</p>
        {p.indexNote?.trim() ? (
          <p className="mt-2 text-balance text-sm text-muted-foreground">{p.indexNote.trim()}</p>
        ) : null}
      </header>

      {catCards.length > 0 ? (
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          <AmzLink
            href={productsBase}
            className={`rounded-full border px-4 py-2 text-sm font-medium ${
              !activeCategorySlug?.trim()
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-foreground hover:border-primary'
            }`}
          >
            All products
          </AmzLink>
          {catCards.map((c) => {
            const active = activeCategorySlug?.trim() === c.slug.trim()
            return (
              <AmzLink
                key={c.slug}
                href={`${productsBase}?category=${encodeURIComponent(c.slug.trim())}`}
                className={`rounded-full border px-4 py-2 text-sm font-medium ${
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-foreground hover:border-primary'
                }`}
              >
                {c.title}
              </AmzLink>
            )
          })}
        </div>
      ) : null}

      {offers.length === 0 ? (
        <p className="mt-12 text-center text-muted-foreground">No active offers yet for this site.</p>
      ) : (
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((o) => (
            <li key={o.id}>
              <AmzOfferCard offer={o} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
