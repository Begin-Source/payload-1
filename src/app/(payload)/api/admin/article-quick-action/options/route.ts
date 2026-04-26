import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { isUsersCollection } from '@/utilities/announcementAccess'
import {
  combineTenantWhere,
  getTenantScopeForStats,
  type TenantScope,
} from '@/utilities/tenantScope'

export const dynamic = 'force-dynamic'

type SiteOption = {
  id: number
  name: string
  slug: string
  primaryDomain: string
  mainProduct?: string | null
}

type CategoryOption = {
  id: number
  name: string
  slug: string
  description: string | null
}

function tenantIdFromRelation(
  tenant: number | { id: number } | null | undefined,
): number | null {
  if (tenant == null || tenant === undefined) return null
  if (typeof tenant === 'number') return tenant
  if (typeof tenant === 'object' && typeof tenant.id === 'number') return tenant.id
  return null
}

function siteAccessible(scope: TenantScope, siteTenantId: number | null): boolean {
  if (scope.mode === 'all') return true
  if (scope.mode === 'none') return false
  if (siteTenantId == null) return false
  return scope.tenantIds.includes(siteTenantId)
}

/**
 * GET ?q= — search sites (tenant-scoped).
 * GET ?siteId= — list categories for that site's tenant (tenant-scoped).
 */
export async function GET(request: Request): Promise<Response> {
  const payload = await getPayload({
    config: configPromise,
  })

  const { user } = await payload.auth({ headers: request.headers })
  if (!user || !isUsersCollection(user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const scope = getTenantScopeForStats(user)
  const url = new URL(request.url)
  const siteIdParam = url.searchParams.get('siteId')

  if (siteIdParam !== null && siteIdParam !== '') {
    const siteId = Number(siteIdParam)
    if (!Number.isFinite(siteId)) {
      return Response.json({ error: 'Invalid siteId' }, { status: 400 })
    }

    const site = await payload.findByID({
      collection: 'sites',
      id: siteId,
      depth: 0,
    })

    if (!site) {
      return Response.json({ error: 'Site not found' }, { status: 404 })
    }

    const siteTenantId = tenantIdFromRelation(site.tenant)
    if (!siteAccessible(scope, siteTenantId)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (siteTenantId == null) {
      return Response.json({ categories: [] as CategoryOption[] })
    }

    const where = combineTenantWhere(scope, {
      tenant: { equals: siteTenantId },
    })

    const result = await payload.find({
      collection: 'categories',
      limit: 200,
      sort: 'name',
      ...(where ? { where } : {}),
    })

    const categories: CategoryOption[] = result.docs.map((doc) => ({
      id: doc.id,
      name: doc.name,
      slug: doc.slug,
      description: doc.description ?? null,
    }))

    return Response.json({ categories })
  }

  const q = (url.searchParams.get('q') ?? '').trim()
  const searchWhere =
    q.length > 0
      ? {
          or: [
            { name: { contains: q } },
            { slug: { contains: q } },
            { primaryDomain: { contains: q } },
          ],
        }
      : undefined

  const where = combineTenantWhere(scope, searchWhere)

  const result = await payload.find({
    collection: 'sites',
    limit: 50,
    sort: 'name',
    ...(where ? { where } : {}),
  })

  const sites: SiteOption[] = result.docs.map((doc) => {
    const row = doc as typeof doc & { mainProduct?: string | null }
    return {
      id: doc.id,
      name: doc.name,
      slug: doc.slug,
      primaryDomain: doc.primaryDomain,
      mainProduct: row.mainProduct ?? null,
    }
  })

  return Response.json({ sites })
}
