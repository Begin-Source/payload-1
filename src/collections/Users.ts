import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { adminGroups } from '@/constants/adminGroups'
import { isUsersCollection } from '@/utilities/announcementAccess'
import { financeOnlyBlocksCollection } from '@/utilities/financeRoleAccess'
import { userHasAllTenantAccess } from '@/utilities/superAdmin'
import { superAdminPasses } from '@/utilities/superAdminPasses'
import { getTenantIdsForUser } from '@/utilities/tenantScope'
import { userHasRole } from '@/utilities/userRoles'
import { usersReadWhere, usersUpdateWhere } from '@/utilities/usersAccess'

function tenantIdsFromIncomingTenants(data: Record<string, unknown>): number[] {
  const rows = data.tenants
  if (!Array.isArray(rows)) return []
  const ids: number[] = []
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue
    const t = (row as { tenant?: unknown }).tenant
    const id =
      typeof t === 'object' && t !== null && 'id' in t
        ? Number((t as { id: unknown }).id)
        : typeof t === 'number'
          ? t
          : null
    if (typeof id === 'number' && Number.isFinite(id)) ids.push(id)
  }
  return ids
}

const enforceUserTenantAndRoles: CollectionBeforeChangeHook = ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  let next = { ...data }
  const roles = next.roles
  if (Array.isArray(roles) && roles.includes('super-admin') && !userHasAllTenantAccess(req.user)) {
    const withoutSuperAdmin = roles.filter((r: string) => r !== 'super-admin')
    next = { ...next, roles: withoutSuperAdmin.length > 0 ? withoutSuperAdmin : ['user'] }
  }

  if (!isUsersCollection(req.user)) return next

  if (operation === 'update' && originalDoc && Array.isArray((originalDoc as { roles?: unknown }).roles)) {
    const origRoles = (originalDoc as { roles: string[] }).roles
    if (origRoles.includes('super-admin') && !userHasAllTenantAccess(req.user)) {
      throw new Error('不能修改超级管理员账户')
    }
  }

  if (userHasRole(req.user, 'ops-manager') && !userHasAllTenantAccess(req.user)) {
    const allowed = new Set(getTenantIdsForUser(req.user))
    const incoming = tenantIdsFromIncomingTenants(next as Record<string, unknown>)
    if (incoming.length === 0 && operation === 'create') {
      throw new Error('新建用户必须分配至少一个所属租户')
    }
    for (const tid of incoming) {
      if (!allowed.has(tid)) {
        throw new Error('只能将用户分配到您已拥有的租户')
      }
    }
  }

  return next
}

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: '用户', plural: '用户' },
  admin: {
    group: adminGroups.team,
    useAsTitle: 'email',
  },
  auth: true,
  access: {
    admin: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => {
      if (financeOnlyBlocksCollection(user, 'users')) return false
      if (userHasAllTenantAccess(user)) return true
      if (!user) return true
      if (isUsersCollection(user) && userHasRole(user, 'ops-manager')) return true
      return false
    },
    read: (args) => {
      if (financeOnlyBlocksCollection(args.req.user, 'users')) return false
      return superAdminPasses(({ req: { user } }) => usersReadWhere(user))(args)
    },
    update: (args) => {
      if (financeOnlyBlocksCollection(args.req.user, 'users')) return false
      return superAdminPasses(({ req: { user } }) => usersUpdateWhere(user))(args)
    },
    delete: superAdminPasses(() => false),
    unlock: superAdminPasses(() => false),
  },
  hooks: {
    beforeChange: [enforceUserTenantAndRoles],
  },
  fields: [
    {
      name: 'teamLead',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description:
          'Optional team lead for commission / reporting (same tenant; refine access in PRD as needed).',
      },
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      defaultValue: ['user'],
      required: true,
      options: [
        { label: 'User', value: 'user' },
        { label: 'Super Admin', value: 'super-admin' },
        { label: '财务经理', value: 'finance' },
        { label: '运营经理', value: 'ops-manager' },
        { label: '组长', value: 'team-lead' },
        { label: '站长', value: 'site-manager' },
      ],
      access: {
        update: ({ req: { user } }) =>
          userHasAllTenantAccess(user) ||
          (isUsersCollection(user) && userHasRole(user, 'ops-manager')),
      },
      admin: {
        description:
          'Super Admin：全租户。仅 Super Admin 可修改本字段。其它角色（财务 / 运营 / 组长 / 站长）的具体权限在代码与各集合 access 中逐步收紧。',
      },
    },
  ],
}
