import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Config } from '@/payload-types'
import { isUsersCollection } from '@/utilities/announcementAccess'
import { parseCsvRows } from '@/utilities/csv'
import { landingTemplateDataFromRow } from '@/utilities/landingTemplateCsv'
import { resolveTenantIdForCsvCreate } from '@/utilities/resolveTenantIdForCsvCreate'
import { getTenantScopeForStats } from '@/utilities/tenantScope'

export const dynamic = 'force-dynamic'

const MAX_ROWS = 500

function tenantIdFromRelation(
  tenant: number | { id: number } | null | undefined,
): number | null {
  if (tenant == null || tenant === undefined) return null
  if (typeof tenant === 'number') return tenant
  if (typeof tenant === 'object' && typeof tenant.id === 'number') return tenant.id
  return null
}

function docTenantId(
  doc: { tenant?: number | { id: number } | null } | null | undefined,
): number | null {
  if (doc == null) return null
  return tenantIdFromRelation(doc.tenant)
}

export async function POST(request: Request): Promise<Response> {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user || !isUsersCollection(user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const form = await request.formData()
  const file = form.get('file')
  const tenantIdFromForm = form.get('tenantId')
  const formTenantIdStr = typeof tenantIdFromForm === 'string' ? tenantIdFromForm : null

  if (!(file instanceof Blob)) {
    return Response.json({ error: 'file is required' }, { status: 400 })
  }

  const scope = getTenantScopeForStats(user)
  if (scope.mode === 'none') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const createTenantId = await resolveTenantIdForCsvCreate(
    payload,
    user as Config['user'] & { collection: 'users' },
    scope,
    formTenantIdStr,
  )
  if (createTenantId == null) {
    return Response.json(
      {
        error:
          '无法确定目标租户。请在管理后台左上角先选择租户，或请求里附带 tenantId；超管无绑定时需库中至少存在一条租户。',
      },
      { status: 400 },
    )
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

  const userArg = user as Config['user'] & { collection: 'users' }

  let created = 0
  let updated = 0
  const errors: { row: number; message: string }[] = []

  const col = (name: string, r: string[]): string => {
    const idx = headerCells.indexOf(name)
    if (idx < 0) return ''
    return r[idx] ?? ''
  }

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]
    const lineNum = i + 2
    while (row.length < headerCells.length) {
      row.push('')
    }

    const idStr = col('id', row).trim()
    const parsed = landingTemplateDataFromRow(headerCells, row)
    if (parsed.error) {
      errors.push({ row: lineNum, message: parsed.error })
      continue
    }
    const { data: fieldData } = parsed

    const name = (fieldData.name as string) || ''
    const slug = (fieldData.slug as string) || ''
    if (!name || !slug) {
      errors.push({ row: lineNum, message: 'name and slug are required' })
      continue
    }

    try {
      if (idStr) {
        const id = Number(idStr)
        if (!Number.isFinite(id)) {
          errors.push({ row: lineNum, message: 'invalid id' })
          continue
        }

        const existing = await payload.findByID({
          collection: 'landing-templates',
          id,
          depth: 0,
          user: userArg,
          overrideAccess: false,
        })
        if (!existing) {
          errors.push({ row: lineNum, message: 'document not found' })
          continue
        }
        if (docTenantId(existing) !== createTenantId) {
          errors.push({ row: lineNum, message: 'document does not belong to resolved target tenant' })
          continue
        }

        await payload.update({
          collection: 'landing-templates',
          id,
          data: { ...fieldData } as never,
          user: userArg,
          overrideAccess: false,
        })
        updated++
      } else {
        await payload.create({
          collection: 'landing-templates',
          data: { ...fieldData, tenant: createTenantId } as never,
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
