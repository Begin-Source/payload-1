/**
 * Ports n8n `PB | Build Product Creates` for Payload `offers`.
 * Ranks/dedupes DFS Merchant raw_items and returns create payloads + summary.
 */

export type MerchantOfferSlotBuildContext = {
  categoryId: number
  /** Category name for token match (n8n `category` / keyword display). */
  category: string
  seedInput: string
  fetchAsinLimit: number
  /** From category summary (n8n `seed_status`): when `fetched`, skip creates unless forced. */
  seedStatusLower: string
  ready: boolean
  rawItems: unknown[]
  /** Offers already tied to site + category; ASIN dedupe source. */
  existingOffers: ReadonlyArray<{
    amazon?: { asin?: string | null } | null
  } | null | undefined>
  /** When true, ignore seedStatusLower === `fetched` early exit. */
  force?: boolean
}

export type MerchantOfferCreatePatch = {
  title: string
  slug?: string | null
  status: 'active'
  amazon: {
    asin?: string | null
    priceCents?: number | null
    currency?: string | null
    ratingAvg?: number | null
    reviewCount?: number | null
    imageUrl?: string | null
    merchantRaw?: unknown
    merchantLastSyncedAt?: string
  }
}

export type MerchantSlotBuildOutcome = MerchantOfferSlotBuildContext & {
  limit: number
  existing_for_category: number
  candidate_pool_size: number
  create_items: MerchantOfferCreatePatch[]
  create_count: number
  total_for_category: number
  mark_fetched: boolean
  reason:
    | 'already_fetched'
    | 'task_not_ready'
    | 'ok'
    | 'insufficient_candidates'
    | 'no_products'
}

function normalize(v: unknown): string {
  return String(v ?? '').toLowerCase()
}

function toFeatures(item: Record<string, unknown>): string[] {
  const out: string[] = []
  const description = String(item?.description ?? '').trim()
  if (description) out.push(description)
  const info = Array.isArray(item?.product_information) ? item.product_information : []
  for (const section of info) {
    const sec = section as { body?: Record<string, unknown> }
    if (sec?.body && typeof sec.body === 'object') {
      for (const [k, val] of Object.entries(sec.body)) {
        const value = String(val ?? '').trim()
        if (!value) continue
        out.push(`${k}: ${value}`)
      }
    }
  }
  return out.slice(0, 20)
}

function moneyToCents(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value))
    return Math.round(value * 100)
  const n = Number(value)
  if (Number.isFinite(n)) return Math.round(n * 100)
  return undefined
}

function resolvePriceMajor(item: Record<string, unknown>): number | undefined {
  const price = item.price as Record<string, unknown> | undefined
  const cand =
    price?.current ?? price?.display_price ?? (item.price_from as unknown) ?? (item.price as unknown)
  const n =
    typeof cand === 'number' && Number.isFinite(cand)
      ? cand
      : Number(
          typeof cand === 'string' ? cand.replace(/[^0-9.]/g, '') : cand ?? NaN,
        )
  return Number.isFinite(n) ? n : undefined
}

/**
 * Ranking, dedupe, and limit logic from DataForSEO + n8n reference workflow.
 */
export function buildMerchantOffersFromRawItems(
  ctx: MerchantOfferSlotBuildContext,
): MerchantSlotBuildOutcome {
  const limit = Math.max(1, Math.min(20, Number(ctx.fetchAsinLimit || 5)))

  const existingAsinSet = new Set<string>()
  for (const row of ctx.existingOffers) {
    const asin = String(row?.amazon?.asin ?? '').trim()
    if (asin) existingAsinSet.add(asin)
  }
  const existingForCategory = ctx.existingOffers.length

  if (!ctx.force && normalize(ctx.seedStatusLower) === 'fetched') {
    return {
      ...ctx,
      limit,
      existing_for_category: existingForCategory,
      candidate_pool_size: 0,
      create_items: [],
      create_count: 0,
      total_for_category: existingForCategory,
      mark_fetched: true,
      reason: 'already_fetched',
    }
  }

  if (!ctx.ready) {
    return {
      ...ctx,
      limit,
      existing_for_category: existingForCategory,
      candidate_pool_size: 0,
      create_items: [],
      create_count: 0,
      total_for_category: existingForCategory,
      mark_fetched: false,
      reason: 'task_not_ready',
    }
  }

  const items = Array.isArray(ctx.rawItems) ? ctx.rawItems : []
  const seedTokens = normalize(ctx.seedInput || ctx.category || '')
    .split(/[^a-z0-9]+/g)
    .filter((t) => t.length > 2)

  type Ranked = {
    item: Record<string, unknown>
    idx: number
    asin: string
    rating: number
    votes: number
    bought: number
    matchRatio: number
  }

  const withRank: Ranked[] = items.map((raw, i) => {
    const item = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<
      string,
      unknown
    >
    const title = String(item?.title ?? '')
    const titleNorm = normalize(title)
    const matched = seedTokens.filter((t) => titleNorm.includes(t)).length
    const matchRatio = seedTokens.length ? matched / seedTokens.length : 0
    const ratingObj = item.rating as { value?: unknown; votes_count?: unknown } | undefined
    const rating = Number((ratingObj?.value as number) || 0)
    const votes = Number((ratingObj?.votes_count as number) || 0)
    const bought = Number(item?.bought_past_month ?? 0)
    const asin = String(item?.asin ?? item?.data_asin ?? '').trim()
    return { item, idx: i, asin, rating, votes, bought, matchRatio }
  })

  withRank.sort((a, b) => {
    if (a.rating !== b.rating) return b.rating - a.rating
    if (a.votes !== b.votes) return b.votes - a.votes
    if (a.bought !== b.bought) return b.bought - a.bought
    if (a.matchRatio !== b.matchRatio) return b.matchRatio - a.matchRatio
    return a.idx - b.idx
  })

  const candidatePool = withRank.slice(0, Math.min(withRank.length, 100))
  const need = Math.max(0, limit - existingForCategory)
  const createItems: MerchantOfferCreatePatch[] = []
  const localSeen = new Set<string>()

  for (const entry of candidatePool) {
    if (createItems.length >= need) break
    const asin = entry.asin
    if (!asin) continue
    if (existingAsinSet.has(asin)) continue
    if (localSeen.has(asin)) continue
    localSeen.add(asin)

    const item = entry.item
    const primaryImage =
      (item.image_url as string) ||
      (Array.isArray(item.product_images_list)
        ? (item.product_images_list[0] as string)
        : '') ||
      ''

    const priceMajor = resolvePriceMajor(item)
    const now = new Date().toISOString()
    createItems.push({
      title: String(item.title || `Amazon ${asin}`),
      slug: `amazon-${asin.toLowerCase()}`,
      status: 'active',
      amazon: {
        asin,
        currency: 'USD',
        ratingAvg:
          entry.rating > 0 ? entry.rating : undefined,
        reviewCount:
          entry.votes > 0 ? Math.round(entry.votes) : undefined,
        priceCents: priceMajor !== undefined ? moneyToCents(priceMajor) : undefined,
        imageUrl: primaryImage || undefined,
        merchantRaw: {
          ...item,
          features: toFeatures(item),
          dfs_rank: {
            votes: entry.votes,
            bought_past_month: entry.bought,
            match_ratio: entry.matchRatio,
          },
        },
        merchantLastSyncedAt: now,
      },
    })
  }

  const totalForCategory = existingForCategory + createItems.length
  const markFetched = totalForCategory >= limit
  let reason: MerchantSlotBuildOutcome['reason'] = 'ok'
  if (markFetched) reason = 'ok'
  else if (candidatePool.length) reason = 'insufficient_candidates'
  else reason = 'no_products'

  return {
    ...ctx,
    limit,
    existing_for_category: existingForCategory,
    candidate_pool_size: candidatePool.length,
    create_items: createItems,
    create_count: createItems.length,
    total_for_category: totalForCategory,
    mark_fetched: markFetched,
    reason,
  }
}
