import type { User } from '@/payload-types'

function superAdminEmails(): string[] {
  return (process.env.PAYLOAD_SUPER_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * Super admins bypass tenant scoping (all tenants, all tenant-scoped documents).
 * Assign via Users → roles → "Super Admin", and/or set PAYLOAD_SUPER_ADMIN_EMAILS (comma-separated).
 */
export function userHasAllTenantAccess(user: User | null | undefined): boolean {
  if (!user?.email) return false
  if (superAdminEmails().includes(user.email.toLowerCase())) return true
  const roles = user.roles
  return Array.isArray(roles) && roles.includes('super-admin')
}
