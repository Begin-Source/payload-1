import type { Access } from 'payload'

import { userHasAllTenantAccess } from '@/utilities/superAdmin'
import { userHasTenantGeneralManagerRole } from '@/utilities/userRoles'

/**
 * Super admins (`super-admin` role or `PAYLOAD_SUPER_ADMIN_EMAILS`) get full `true` for this operation.
 * Everyone else uses `otherwise` (must return boolean / Where per Payload).
 */
export function superAdminPasses(otherwise: Access): Access {
  return (args) => {
    if (userHasAllTenantAccess(args.req.user)) return true
    return otherwise(args)
  }
}

/**
 * 全租户超管或「总经理」：后者用于插件已做租户隔离的集合 / 不泄露全站数据的 access。
 * 不要用于 `users` 读等需显式 `where` 的场景。
 */
export function superAdminOrTenantGMPasses(otherwise: Access): Access {
  return (args) => {
    if (userHasAllTenantAccess(args.req.user)) return true
    if (userHasTenantGeneralManagerRole(args.req.user)) return true
    return otherwise(args)
  }
}
