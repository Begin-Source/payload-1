import type { Access } from 'payload'

import { userHasAllTenantAccess } from '@/utilities/superAdmin'

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
