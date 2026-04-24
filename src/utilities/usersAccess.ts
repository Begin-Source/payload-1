import type { Where } from 'payload'

import type { Config } from '@/payload-types'
import { isUsersCollection } from '@/utilities/announcementAccess'
import { userHasAllTenantAccess } from '@/utilities/superAdmin'
import { getTenantIdsForUser } from '@/utilities/tenantScope'

/**
 * Non–super-admin: self + users who share at least one assigned tenant (`users.tenants[].tenant`).
 */
export function usersReadWhere(user: Config['user'] | null | undefined): boolean | Where {
  if (!isUsersCollection(user)) return false
  if (userHasAllTenantAccess(user)) return true
  const tenantIds = getTenantIdsForUser(user)
  if (tenantIds.length === 0) return { id: { equals: user.id } }
  return {
    or: [{ id: { equals: user.id } }, ...tenantIds.map((tid) => ({ 'tenants.tenant': { equals: tid } }))],
  }
}

export function usersUpdateWhere(user: Config['user'] | null | undefined): boolean | Where {
  return usersReadWhere(user)
}
