import configPromise from '@payload-config'
import { gunzipSync } from 'node:zlib'
import { getPayload } from 'payload'

import { normalizeDataForSeoMerchantPostback } from '@/utilities/dataForSeoMerchantPostback'
import { buildMerchantOffersFromRawItems } from '@/utilities/merchantOffersFromDfsItems'
import { parseMerchantSlotTag } from '@/utilities/merchantSlotTag'
import { parseRelationshipId } from '@/utilities/parseRelationshipId'
import {
  parseStoredSummaryRecord,
  stringifySummaryRecord,
} from '@/collections/shared/sanitizeMerchantJsonFields'
import { resolveDefaultAmazonAffiliateNetworkId } from '@/utilities/resolveDefaultAmazonAffiliateNetwork'

export const dynamic = 'force-dynamic'

async function parseJsonBody(request: Request): Promise<unknown> {
  const buf = Buffer.from(await request.arrayBuffer())
  const enc = request.headers.get('content-encoding') ?? ''
  const utf8 =
    /\bgzip\b/i.test(enc) || (buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b)
      ? gunzipSync(buf).toString('utf8')
      : buf.toString('utf8')
  try {
    return JSON.parse(utf8) as unknown
  } catch {
    throw new Error('Postback JSON parse failed')
  }
}

function readSummarySeedStatus(raw: unknown): string {
  if (raw && typeof raw === 'object' && 'seedStatus' in raw) {
    return String((raw as { seedStatus?: string }).seedStatus ?? '').toLowerCase()
  }
  return ''
}

function readFetchLimit(raw: unknown, fallback = 5): number {
  if (raw && typeof raw === 'object' && 'fetchAsinLimit' in raw) {
    const n = Number((raw as { fetchAsinLimit?: unknown }).fetchAsinLimit)
    return Number.isFinite(n) ? n : fallback
  }
  return fallback
}

/**
 * DataForSEO Amazon Products postback (`postback_data: advanced`): creates/updates Payload offers for a category tag.
 *
 * Tag format: `payload:category:<id>:<batchUuid>` (see `formatMerchantSlotTag`).
 * Auth: `OFFER_MERCHANT_POSTBACK_SECRET` query `?token=` (default aligns with legacy `dfs_postback_v1`).
 */
export async function POST(request: Request): Promise<Response> {
  const payload = await getPayload({ config: configPromise })

  let body: unknown
  try {
    body = await parseJsonBody(request)
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : 'invalid body' },
      { status: 400 },
    )
  }

  const url = new URL(request.url)
  let normalized: ReturnType<typeof normalizeDataForSeoMerchantPostback>
  try {
    normalized = normalizeDataForSeoMerchantPostback(body, request.headers, url)
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : 'validate failed' },
      { status: 401 },
    )
  }

  const parsed = parseMerchantSlotTag(normalized.tag)
  if (!parsed) {
    return Response.json(
      { ok: false, error: 'Unsupported tag (expected payload:category:<id>:<uuid>)' },
      { status: 400 },
    )
  }

  const { categoryId, batchUuid } = parsed

  let category: Awaited<ReturnType<typeof payload.findByID>>
  try {
    category = await payload.findByID({
      collection: 'categories',
      id: categoryId,
      depth: 0,
      overrideAccess: true,
    })
  } catch {
    category = null
  }
  if (!category) {
    return Response.json({ ok: false, error: 'Category not found' }, { status: 404 })
  }

  const siteId = parseRelationshipId(
    (category as { site?: unknown }).site,
  )
  if (siteId == null) {
    return Response.json({ ok: false, error: 'Category has no site' }, { status: 400 })
  }

  const catRow = category as typeof category & {
    name?: string
    merchantOfferFetchLastSummary?: unknown
  }
  const summary = parseStoredSummaryRecord(catRow.merchantOfferFetchLastSummary)
  const seedStatus = readSummarySeedStatus(summary)
  const fetchAsinLimit = readFetchLimit(summary, 5)

  if (!normalized.ready) {
    const now = new Date().toISOString()
    await payload.update({
      collection: 'categories',
      id: categoryId,
      data: {
        merchantOfferFetchWorkflowStatus: 'error',
        merchantOfferFetchWorkflowLog:
          `DFS ${normalized.status_code}: ${normalized.status_message}`.slice(0, 2000),
        merchantOfferFetchLastSummary: stringifySummaryRecord({
          ...summary,
          dfsErrorAt: now,
          status_code: normalized.status_code,
          status_message: normalized.status_message,
        }),
      },
      overrideAccess: true,
    })
    return Response.json({
      ok: false,
      error: normalized.status_message,
      dfs_status_code: normalized.status_code,
    })
  }

  const existing = await payload.find({
    collection: 'offers',
    where: {
      and: [{ sites: { contains: siteId } }, { categories: { contains: categoryId } }],
    },
    limit: 500,
    depth: 0,
    overrideAccess: true,
  })

  let networkId: number
  try {
    networkId = await resolveDefaultAmazonAffiliateNetworkId(payload)
  } catch (e) {
    await payload.update({
      collection: 'categories',
      id: categoryId,
      data: {
        merchantOfferFetchWorkflowStatus: 'error',
        merchantOfferFetchWorkflowLog: `Affiliate network: ${e instanceof Error ? e.message : String(e)}`,
      },
      overrideAccess: true,
    })
    return Response.json({ ok: false, error: 'Affiliate network not configured' }, { status: 500 })
  }

  const build = buildMerchantOffersFromRawItems({
    categoryId,
    category: String(catRow.name ?? ''),
    seedInput: String(catRow.name ?? ''),
    fetchAsinLimit,
    seedStatusLower: seedStatus,
    ready: normalized.ready,
    rawItems: normalized.raw_items,
    existingOffers: existing.docs.map((d) => ({
      amazon:
        typeof d === 'object' && d && 'amazon' in d
          ? (d as { amazon?: { asin?: string | null } | null }).amazon
          : null,
    })),
    force: false,
  })

  if (build.reason === 'already_fetched' || build.reason === 'task_not_ready') {
    const now = new Date().toISOString()
    await payload.update({
      collection: 'categories',
      id: categoryId,
      data: {
        merchantOfferFetchWorkflowStatus: 'done',
        merchantOfferFetchWorkflowLog: `Skipped: ${build.reason}`,
        merchantOfferFetchLastSummary: stringifySummaryRecord({
          ...summary,
          seedStatus: build.reason === 'already_fetched' ? 'fetched' : seedStatus,
          reason: build.reason,
          task_id: normalized.task_id,
          batchId: batchUuid,
          updatedAt: now,
        }),
      },
      overrideAccess: true,
    })
    return Response.json({
      ok: true,
      skipped: build.reason,
      categoryId,
      batchId: batchUuid,
    })
  }

  const createdIds: number[] = []
  const now = new Date().toISOString()

  for (const patch of build.create_items) {
    try {
      const doc = await payload.create({
        collection: 'offers',
        data: {
          title: patch.title,
          slug: patch.slug ?? undefined,
          status: patch.status,
          network: networkId,
          sites: [siteId],
          categories: [categoryId],
          targetUrl:
            patch.amazon?.asin ?
              `https://www.amazon.com/dp/${String(patch.amazon.asin)}`
            : undefined,
          amazon: patch.amazon ?? {},
          merchantSlot: {
            merchantSlotWorkflowStatus: 'done',
            merchantBatchId: batchUuid,
            merchantSlotSourceCategory: categoryId,
            merchantSlotWorkflowUpdatedAt: now,
            merchantSlotWorkflowLog: `DFS task ${normalized.task_id ?? '—'} · ${normalized.status_message}`,
          },
        },
        overrideAccess: true,
      })
      createdIds.push(doc.id as number)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      await payload.update({
        collection: 'categories',
        id: categoryId,
        data: {
          merchantOfferFetchWorkflowStatus: 'error',
          merchantOfferFetchWorkflowLog: `Offer create: ${msg.slice(0, 500)}`,
          merchantOfferFetchLastSummary: stringifySummaryRecord({
            ...summary,
            reason: build.reason,
            create_count: build.create_count,
            task_id: normalized.task_id,
            batchId: batchUuid,
            seedStatus: normalized.ready && build.mark_fetched ? 'fetched' : 'approved',
            updatedAt: now,
          }),
        },
        overrideAccess: true,
      })
      return Response.json(
        { ok: false, error: msg.slice(0, 200), created_partial: createdIds },
        { status: 500 },
      )
    }
  }

  const nextSeed: 'fetched' | 'approved' =
    normalized.ready && build.mark_fetched ? 'fetched' : 'approved'

  await payload.update({
    collection: 'categories',
    id: categoryId,
    data: {
      merchantOfferFetchWorkflowStatus: 'done',
      merchantOfferFetchWorkflowLog: [
        normalized.task_id ? `task ${normalized.task_id}` : '',
        `${build.create_count} offer(s), reason=${build.reason}`,
      ]
        .filter(Boolean)
        .join(' · '),
      merchantOfferFetchLastSummary: stringifySummaryRecord({
        ...summary,
        seedStatus: nextSeed,
        fetchAsinLimit,
        batchId: batchUuid,
        create_count: build.create_count,
        task_id: normalized.task_id,
        status_code: normalized.status_code,
        reason: build.reason,
        updatedAt: now,
      }),
    },
    overrideAccess: true,
  })

  return Response.json({
    ok: true,
    categoryId,
    batchId: batchUuid,
    create_count: build.create_count,
    reason: build.reason,
    offer_ids: createdIds,
  })
}
