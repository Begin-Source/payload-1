import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Config } from '@/payload-types'
import { isUsersCollection } from '@/utilities/announcementAccess'
import { escapeCsvCell } from '@/utilities/csv'
import { combineTenantWhere, getTenantScopeForStats } from '@/utilities/tenantScope'

export const dynamic = 'force-dynamic'

const CSV_HEADER = 'id,name,slug,description,tenant_id'

function docTenantId(doc: { tenant?: number | { id: number } | null }): string {
  const t = doc.tenant
  if (t == null) return ''
  return String(typeof t === 'object' ? t.id : t)
}

export async function GET(_request: Request): Promise<Response> {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: _request.headers })
  if (!user || !isUsersCollection(user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const scope = getTenantScopeForStats(user)
  const where = combineTenantWhere(scope) ?? { id: { equals: 0 } }
  const userArg = user as Config['user'] & { collection: 'users' }

  const lines: string[] = [CSV_HEADER]
  const limit = 100
  let page = 1

  while (true) {
    const result = await payload.find({
      collection: 'categories',
      where,
      limit,
      page,
      depth: 0,
      user: userArg,
      overrideAccess: false,
    })

    for (const doc of result.docs) {
      const row = [
        String(doc.id),
        escapeCsvCell(doc.name ?? ''),
        escapeCsvCell(doc.slug ?? ''),
        escapeCsvCell(doc.description == null ? '' : String(doc.description)),
        escapeCsvCell(docTenantId(doc)),
      ].join(',')
      lines.push(row)
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
      'Content-Disposition': `attachment; filename="categories-${stamp}.csv"`,
    },
  })
}
