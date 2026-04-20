/**
 * Works for `ClientUser` (admin.hidden) and server `User` — only uses `email` + `roles`.
 */
export function isSuperAdminLikeUser(
  user: { email?: string | null; roles?: unknown } | null | undefined,
): boolean {
  if (!user?.email) return false
  const fromEnv = (process.env.PAYLOAD_SUPER_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  if (fromEnv.includes(user.email.toLowerCase())) return true
  const roles = user.roles
  return Array.isArray(roles) && roles.includes('super-admin')
}
