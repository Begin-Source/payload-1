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

/** D1: max SQL statement ~100KB; keep merchantRaw well under to avoid insert failures. */
export const MERCHANT_RAW_MAX_UTF8_BYTES = 48 * 1024

export function merchantRawUtf8Bytes(obj: unknown): number {
  return new TextEncoder().encode(JSON.stringify(obj)).length
}

function jsonUtf8Bytes(obj: unknown): number {
  return merchantRawUtf8Bytes(obj)
}

/**
 * Second-line guard before DB insert: if something still exceeds the cap, strip bulky keys (keeps `image_url`).
 */
export function clampMerchantRawDocument(raw: unknown): Record<string, unknown> {
  if (raw === null || raw === undefined) return {}
  if (typeof raw !== 'object' || Array.isArray(raw)) return {}
  let o = { ...(raw as Record<string, unknown>) }
  while (jsonUtf8Bytes(o) > MERCHANT_RAW_MAX_UTF8_BYTES) {
    if (Array.isArray(o.features) && o.features.length) {
      o.features = (o.features as unknown[]).slice(0, Math.max(0, (o.features as unknown[]).length - 2))
      continue
    }
    if (Array.isArray(o.product_images_list) && o.product_images_list.length) {
      o.product_images_list = (o.product_images_list as unknown[]).slice(
        0,
        Math.max(1, (o.product_images_list as unknown[]).length - 2),
      )
      continue
    }
    delete o.features
    delete o.product_images_list
    if (typeof o.title === 'string')
      o.title = truncateStr(o.title, 80)
    if (jsonUtf8Bytes(o) <= MERCHANT_RAW_MAX_UTF8_BYTES) break
    delete o.delivery_info
    o._clamped_for_d1 = true
    break
  }
  return o
}

function truncateStr(s: string, max: number): string {
  if (s.length <= max) return s
  return `${s.slice(0, Math.max(0, max - 1))}…`
}

/** Drop tracking query strings; keep https host+path for CDN image URLs. */
function shortenUrlForStorage(u: string, maxLen: number): string {
  const t = String(u ?? '').trim()
  if (!t) return ''
  try {
    const url = new URL(t)
    const base = `${url.origin}${url.pathname}`
    return base.length > maxLen ? `${base.slice(0, maxLen - 1)}…` : base
  } catch {
    return truncateStr(t, Math.min(maxLen, 800))
  }
}

function shortAmazonProductUrl(asin: string): string {
  const a = String(asin ?? '').trim().toUpperCase()
  return a ? `https://www.amazon.com/dp/${a}` : ''
}

type DfsRankMeta = { votes: number; bought_past_month: number; match_ratio: number }

/**
 * Slim copy of DFS item for `amazon_merchant_raw`: avoids D1 100KB statement limits from huge `url` query strings.
 * Preserves image_url and up to 8 extra gallery URLs (shortened, no query junk).
 */
export function sanitizeMerchantRawForStorage(
  item: Record<string, unknown>,
  dfsRank: DfsRankMeta,
): Record<string, unknown> {
  const asin = String(item.asin ?? item.data_asin ?? '').trim()

  const mainImg = String(item.image_url ?? '').trim()
  const gallery: string[] = []
  if (mainImg) gallery.push(shortenUrlForStorage(mainImg, 1800))
  const rawList = Array.isArray(item.product_images_list) ? item.product_images_list : []
  for (let i = 0; i < Math.min(8, rawList.length); i++) {
    const u = String(rawList[i] ?? '').trim()
    if (u) gallery.push(shortenUrlForStorage(u, 1800))
  }
  const uniqueGallery = [...new Set(gallery)].slice(0, 10)

  const rating = item.rating
  const price = item.price
  const delivery = item.delivery_info

  const out: Record<string, unknown> = {
    type: item.type,
    title: truncateStr(String(item.title ?? ''), 450),
    data_asin: item.data_asin ?? asin,
    asin: asin || undefined,
    image_url: mainImg ? shortenUrlForStorage(mainImg, 1800) : undefined,
    product_images_list: uniqueGallery.length > 1 ? uniqueGallery : uniqueGallery.length ? uniqueGallery : undefined,
    url: shortAmazonProductUrl(asin) || shortenUrlForStorage(String(item.url ?? ''), 600),
    bought_past_month: item.bought_past_month,
    price_from: item.price_from,
    price_to: item.price_to,
    currency: item.currency,
    rank_group: item.rank_group,
    rank_absolute: item.rank_absolute,
    is_amazon_choice: item.is_amazon_choice,
    is_best_seller: item.is_best_seller,
    rating:
      rating && typeof rating === 'object'
        ? {
            type: (rating as { type?: string }).type,
            value: (rating as { value?: number }).value,
            votes_count: (rating as { votes_count?: number }).votes_count,
            rating_max: (rating as { rating_max?: number }).rating_max,
          }
        : rating,
    price:
      price && typeof price === 'object'
        ? {
            current: (price as { current?: unknown }).current,
            display_price: (price as { display_price?: unknown }).display_price,
          }
        : price,
    delivery_info:
      delivery && typeof delivery === 'object'
        ? {
            delivery_message: truncateStr(
              String((delivery as { delivery_message?: string }).delivery_message ?? ''),
              400,
            ),
            delivery_price: (delivery as { delivery_price?: unknown }).delivery_price,
          }
        : undefined,
    features: toFeatures(item).map((f) => truncateStr(f, 280)).slice(0, 12),
    dfs_rank: dfsRank,
  }

  for (const k of Object.keys(out)) {
    if (out[k] === undefined) delete out[k]
  }

  if (jsonUtf8Bytes(out) <= MERCHANT_RAW_MAX_UTF8_BYTES) return out

  const lean: Record<string, unknown> = { ...out }
  lean.features = (lean.features as string[])?.slice(0, 4) ?? []
  lean.title = truncateStr(String(lean.title ?? ''), 200)
  lean.delivery_info =
    lean.delivery_info && typeof lean.delivery_info === 'object'
      ? {
          delivery_message: truncateStr(
            String((lean.delivery_info as { delivery_message?: string }).delivery_message ?? ''),
            120,
          ),
        }
      : undefined
  if (jsonUtf8Bytes(lean) > MERCHANT_RAW_MAX_UTF8_BYTES && Array.isArray(lean.product_images_list)) {
    const imgs = lean.product_images_list as string[]
    lean.product_images_list = imgs.slice(0, 3)
    lean.image_url = imgs[0] ? shortenUrlForStorage(imgs[0], 1200) : lean.image_url
  }
  let bytes = jsonUtf8Bytes(lean)
  while (bytes > MERCHANT_RAW_MAX_UTF8_BYTES && Array.isArray(lean.features) && (lean.features as string[]).length > 0) {
    ;(lean.features as string[]).pop()
    bytes = jsonUtf8Bytes(lean)
  }
  if (bytes > MERCHANT_RAW_MAX_UTF8_BYTES) {
    lean._storage_note = 'truncated_for_d1_row_size'
    delete lean.features
    delete lean.product_images_list
    lean.image_url = mainImg ? shortenUrlForStorage(mainImg, 800) : lean.image_url
  }
  return lean
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
        merchantRaw: sanitizeMerchantRawForStorage(item, {
          votes: entry.votes,
          bought_past_month: entry.bought,
          match_ratio: entry.matchRatio,
        }),
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
