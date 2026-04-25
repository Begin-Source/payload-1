import configPromise from '@payload-config'
import type { Where } from 'payload'
import { getPayload } from 'payload'

import type { Config } from '@/payload-types'
import { isUsersCollection } from '@/utilities/announcementAccess'
import {
  LANDING_TEMPLATE_CSV_HEADER,
  landingTemplateDocToRow,
} from '@/utilities/landingTemplateCsv'
import { combineTenantWhere, getTenantScopeForStats } from '@/utilities/tenantScope'

export const dynamic = 'force-dynamic'

/**
 * 导出「当前用户可访问租户」内全部站点模版。
 * 超管（scope all）：不限租户；`combineTenantWhere` 为 `undefined` 时用空 where 表示全量。
 */
function whereForFullLandingTemplatesExport(
  scope: ReturnType<typeof getTenantScopeForStats>,
): Where {
  const combined = combineTenantWhere(scope)
  if (combined !== undefined) return combined
  if (scope.mode === 'all') return {}
  return { id: { equals: 0 } }
}

function parseIdsParam(url: URL): number[] {
  const raw = url.searchParams.get('ids')?.trim()
  if (raw == null || raw === '') return []
  const out: number[] = []
  const seen = new Set<number>()
  for (const part of raw.split(',')) {
    const n = Number(part.trim())
    if (Number.isFinite(n) && !seen.has(n)) {
      seen.add(n)
      out.push(n)
    }
  }
  return out
}

export async function GET(request: Request): Promise<Response> {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user || !isUsersCollection(user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const idList = parseIdsParam(url)
  const scope = getTenantScopeForStats(user)

  let where: Where

  if (idList.length > 0) {
    const withIds = combineTenantWhere(scope, { id: { in: idList } })
    if (withIds === undefined) {
      where = { id: { in: idList } }
    } else {
      where = withIds
    }
  } else {
    where = whereForFullLandingTemplatesExport(scope)
  }

  const userArg = user as Config['user'] & { collection: 'users' }

  const lines: string[] = [LANDING_TEMPLATE_CSV_HEADER]
  const limit = 100
  let page = 1

  while (true) {
    const result = await payload.find({
      collection: 'landing-templates',
      where,
      limit,
      page,
      depth: 0,
      user: userArg,
      overrideAccess: false,
    })

    for (const doc of result.docs) {
      lines.push(landingTemplateDocToRow(doc))
    }

    if (result.docs.length < limit) break
    page++
  }

  const csv = '\uFEFF' + lines.join('\r\n')
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="landing-templates-${stamp}.csv"`,
    },
  })
}
