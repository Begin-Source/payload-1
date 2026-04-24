import type { Access } from 'payload'

import { denyFinanceOnlyUnlessWhitelisted } from '@/utilities/financeRoleAccess'
import { superAdminPasses } from '@/utilities/superAdminPasses'

const loggedIn: Access = ({ req: { user } }) => Boolean(user)

/** `superAdminPasses(loggedIn)` with finance-only collection whitelist. */
export function loggedInSuperAdminAccessFor(collectionSlug: string) {
  return {
    read: denyFinanceOnlyUnlessWhitelisted(collectionSlug, superAdminPasses(loggedIn)),
    create: denyFinanceOnlyUnlessWhitelisted(collectionSlug, superAdminPasses(loggedIn)),
    update: denyFinanceOnlyUnlessWhitelisted(collectionSlug, superAdminPasses(loggedIn)),
    delete: denyFinanceOnlyUnlessWhitelisted(collectionSlug, superAdminPasses(loggedIn)),
  }
}
