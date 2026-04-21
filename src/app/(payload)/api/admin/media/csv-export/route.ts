import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Config } from '@/payload-types'
import { isUsersCollection } from '@/utilities/announcementAccess'
import { escapeCsvCell } from '@/utilities/csv'
import { combineTenantWhere, getTenantScopeForStats } from '@/utilities/tenantScope'

export const dynamic = 'force-dynamic'

const CSV_HEADER = 'id,alt,filename,mimeType,filesize'

export async function GET(request: Request): Promise<Response> {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })
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
      collection: 'media',
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
        escapeCsvCell(doc.alt ?? ''),
        escapeCsvCell(doc.filename == null ? '' : String(doc.filename)),
        escapeCsvCell(doc.mimeType == null ? '' : String(doc.mimeType)),
        doc.filesize == null ? '' : String(doc.filesize),
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
      'Content-Disposition': `attachment; filename="media-${stamp}.csv"`,
    },
  })
}
