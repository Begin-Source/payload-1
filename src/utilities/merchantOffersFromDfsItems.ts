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

/** D1: max SQL statement ~100KB for entire INSERT; merchantRaw must leave headroom for other columns + escaping. */
export const MERCHANT_RAW_MAX_UTF8_BYTES = 28 * 1024

const IMAGE_URL_MAX_LEN = 512

export function merchantRawUtf8Bytes(obj: unknown): number {
  return new TextEncoder().encode(JSON.stringify(obj)).length
}

function jsonUtf8Bytes(obj: unknown): number {
  return merchantRawUtf8Bytes(obj)
}

/** `/dp/B0ABCDEF123` or `/gp/product/B0ABCDEF123` on any amazon.* host */
const AMAZON_ASIN_PATH_RE =
  /\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:\/|$|[\/?&#])/i

function tryCanonicalAmazonDpUrl(u: string): string | null {
  const t = String(u ?? '').trim()
  if (!t) return null
  try {
    const url = new URL(t)
    if (!url.hostname.toLowerCase().includes('amazon.')) return null
    const pathAndQuery = `${url.pathname}${url.search}`
    const m = pathAndQuery.match(AMAZON_ASIN_PATH_RE) ?? url.pathname.match(/\/dp\/([A-Z0-9]{10})/i)
    if (!m?.[1]) return null
    const a = m[1].toUpperCase()
    return /^[A-Z0-9]{10}$/.test(a) ? `https://www.amazon.com/dp/${a}` : null
  } catch {
    return null
  }
}

function truncateStr(s: string, max: number): string {
  if (s.length <= max) return s
  return `${s.slice(0, Math.max(0, max - 1))}…`
}

/**
 * CDN / product URLs: normalize Amazon shopping links to short `/dp/{ASIN}`;
 * otherwise cap `origin + pathname + search` (sponsored paths can be huge without a query).
 */
function shortenUrlForStorage(u: string, maxLen: number): string {
  const canon = tryCanonicalAmazonDpUrl(u)
  if (canon) return canon

  const t = String(u ?? '').trim()
  if (!t) return ''
  try {
    const url = new URL(t)
    let base = `${url.origin}${url.pathname}${url.search}`
    if (base.length > maxLen) base = truncateStr(base, maxLen)
    return base
  } catch {
    return truncateStr(t, Math.min(maxLen, 320))
  }
}

/**
 * Second-line guard before DB insert: trim `features` / `title` / `price` before dropping `image_url`.
 */
export function clampMerchantRawDocument(raw: unknown): Record<string, unknown> {
  if (raw === null || raw === undefined) return {}
  if (typeof raw !== 'object' || Array.isArray(raw)) return {}
  const o = { ...(raw as Record<string, unknown>) }

  while (jsonUtf8Bytes(o) > MERCHANT_RAW_MAX_UTF8_BYTES) {
    if (typeof o.image_url === 'string' && o.image_url.length > IMAGE_URL_MAX_LEN) {
      o.image_url = shortenUrlForStorage(o.image_url, IMAGE_URL_MAX_LEN)
      continue
    }
    if (Array.isArray(o.features) && o.features.length) {
      o.features = (o.features as unknown[]).slice(0, Math.max(0, (o.features as unknown[]).length - 2))
      continue
    }
    if (typeof o.title === 'string' && o.title.length > 160) {
      o.title = truncateStr(o.title, 160)
      continue
    }
    if (o.price != null && typeof o.price === 'object' && !Array.isArray(o.price)) {
      delete o.price
      continue
    }
    delete o.features
    if (typeof o.title === 'string')
      o.title = truncateStr(o.title, 80)
    if (jsonUtf8Bytes(o) <= MERCHANT_RAW_MAX_UTF8_BYTES) break
    delete o.image_url
    o._clamped_for_d1 = true
    break
  }
  return o
}

/**
 * Whitelist for `amazon_merchant_raw`: title, ASIN, main `image_url`, `features`, `price` snapshot.
 */
export function sanitizeMerchantRawForStorage(item: Record<string, unknown>): Record<string, unknown> {
  const asin = String(item.asin ?? item.data_asin ?? '').trim()

  const mainImg = String(item.image_url ?? '').trim()
  const priceSrc = item.price as Record<string, unknown> | undefined

  const price: Record<string, unknown> = {}
  if (priceSrc && typeof priceSrc === 'object') {
    if (priceSrc.current !== undefined) price.current = priceSrc.current
    if (priceSrc.display_price !== undefined) price.display_price = priceSrc.display_price
  }
  const cur = item.currency
  if (cur !== undefined && cur !== null && String(cur).trim() !== '')
    price.currency = cur

  const out: Record<string, unknown> = {
    title: truncateStr(String(item.title ?? ''), 450),
    asin: asin || undefined,
    image_url: mainImg ? shortenUrlForStorage(mainImg, IMAGE_URL_MAX_LEN) : undefined,
    features: toFeatures(item).map((f) => truncateStr(f, 280)).slice(0, 12),
    price: Object.keys(price).length ? price : undefined,
  }

  for (const k of Object.keys(out)) {
    if (out[k] === undefined) delete out[k]
  }

  if (jsonUtf8Bytes(out) <= MERCHANT_RAW_MAX_UTF8_BYTES) return out

  const lean: Record<string, unknown> = { ...out }
  lean.features = (lean.features as string[])?.slice(0, 4) ?? []
  lean.title = truncateStr(String(lean.title ?? ''), 200)
  let bytes = jsonUtf8Bytes(lean)
  while (bytes > MERCHANT_RAW_MAX_UTF8_BYTES && Array.isArray(lean.features) && (lean.features as string[]).length > 0) {
    ;(lean.features as string[]).pop()
    bytes = jsonUtf8Bytes(lean)
  }
  if (bytes > MERCHANT_RAW_MAX_UTF8_BYTES) {
    lean._storage_note = 'truncated_for_d1_row_size'
    delete lean.features
    lean.image_url = mainImg ? shortenUrlForStorage(mainImg, IMAGE_URL_MAX_LEN) : lean.image_url
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
        merchantRaw: sanitizeMerchantRawForStorage(item),
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
