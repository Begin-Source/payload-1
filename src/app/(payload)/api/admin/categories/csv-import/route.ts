import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Config } from '@/payload-types'
import { isUsersCollection } from '@/utilities/announcementAccess'
import { parseCsvRows } from '@/utilities/csv'
import { getTenantScopeForStats } from '@/utilities/tenantScope'

export const dynamic = 'force-dynamic'

const MAX_ROWS = 500

function resolveTenantForCreate(
  scope: ReturnType<typeof getTenantScopeForStats>,
  rowTenantId: number | null,
): number | null {
  if (scope.mode === 'all') {
    return rowTenantId
  }
  if (scope.mode === 'none') return null
  if (scope.tenantIds.length === 1) return scope.tenantIds[0]
  if (rowTenantId != null && scope.tenantIds.includes(rowTenantId)) return rowTenantId
  return null
}

export async function POST(request: Request): Promise<Response> {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user || !isUsersCollection(user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const form = await request.formData()
  const file = form.get('file')

  if (!(file instanceof Blob)) {
    return Response.json({ error: 'file is required' }, { status: 400 })
  }

  const rows = parseCsvRows(await file.text())
  if (rows.length < 2) {
    return Response.json({ error: 'CSV has no data rows' }, { status: 400 })
  }

  const headerCells = rows[0].map((h) => h.trim().toLowerCase())
  const dataRows = rows.slice(1).filter((r) => r.some((c) => c.trim() !== ''))
  if (dataRows.length > MAX_ROWS) {
    return Response.json({ error: `At most ${MAX_ROWS} data rows` }, { status: 400 })
  }

  const scope = getTenantScopeForStats(user)
  const userArg = user as Config['user'] & { collection: 'users' }

  let created = 0
  let updated = 0
  const errors: { row: number; message: string }[] = []

  const col = (name: string, row: string[]): string => {
    const idx = headerCells.indexOf(name)
    if (idx < 0) return ''
    return row[idx] ?? ''
  }

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]
    const lineNum = i + 2
    while (row.length < headerCells.length) {
      row.push('')
    }

    const name = col('name', row).trim()
    const slug = col('slug', row).trim()
    if (!name || !slug) {
      errors.push({ row: lineNum, message: 'name and slug are required' })
      continue
    }

    const description = col('description', row)
    const idStr = col('id', row).trim()
    const tenantIdRaw = col('tenant_id', row).trim()
    const rowTenantId = tenantIdRaw ? Number(tenantIdRaw) : null
    const rowTenantOk = rowTenantId != null && Number.isFinite(rowTenantId)

    try {
      if (idStr) {
        const id = Number(idStr)
        if (!Number.isFinite(id)) {
          errors.push({ row: lineNum, message: 'invalid id' })
          continue
        }

        const existing = await payload.findByID({
          collection: 'categories',
          id,
          depth: 0,
          user: userArg,
          overrideAccess: false,
        })
        if (!existing) {
          errors.push({ row: lineNum, message: 'document not found' })
          continue
        }

        await payload.update({
          collection: 'categories',
          id,
          data: { name, slug, description },
          user: userArg,
          overrideAccess: false,
        })
        updated++
      } else {
        const tenantForCreate = resolveTenantForCreate(scope, rowTenantOk ? rowTenantId : null)
        if (tenantForCreate == null) {
          errors.push({
            row: lineNum,
            message:
              'tenant_id required (multi-tenant user) or invalid; super-admin must set tenant_id per row',
          })
          continue
        }

        await payload.create({
          collection: 'categories',
          data: {
            name,
            slug,
            description,
            tenant: tenantForCreate,
          } as never,
          user: userArg,
          overrideAccess: false,
        })
        created++
      }
    } catch (e) {
      errors.push({
        row: lineNum,
        message: e instanceof Error ? e.message : 'save failed',
      })
    }
  }

  return Response.json({ created, updated, errors })
}
