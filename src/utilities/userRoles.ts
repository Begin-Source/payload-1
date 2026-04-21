import type { User } from '@/payload-types'

/** Values stored on `users.roles` (kebab-case). */
export const APP_USER_ROLES = [
  'user',
  'super-admin',
  'finance',
  'ops-manager',
  'team-lead',
  'site-manager',
] as const

export type AppUserRole = (typeof APP_USER_ROLES)[number]

export function getUserRoles(user: User | null | undefined): string[] {
  const roles = user?.roles
  if (!Array.isArray(roles)) return []
  return roles.map((r) => String(r))
}

export function userHasRole(user: User | null | undefined, role: AppUserRole | string): boolean {
  return getUserRoles(user).includes(role)
}
