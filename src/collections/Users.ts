import type { CollectionConfig } from 'payload'

import { adminGroups } from '@/constants/adminGroups'
import { userHasAllTenantAccess } from '@/utilities/superAdmin'
import { superAdminPasses } from '@/utilities/superAdminPasses'

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
      if (userHasAllTenantAccess(user)) return true
      return !user
    },
    read: superAdminPasses(({ req: { user } }) => Boolean(user)),
    update: superAdminPasses(({ req: { user } }) => Boolean(user)),
    delete: superAdminPasses(() => false),
    unlock: superAdminPasses(() => false),
  },
  hooks: {
    beforeChange: [
      ({ data, req }) => {
        const roles = data.roles
        if (!Array.isArray(roles) || !roles.includes('super-admin')) {
          return data
        }
        if (userHasAllTenantAccess(req.user)) {
          return data
        }
        const withoutSuperAdmin = roles.filter((r: string) => r !== 'super-admin')
        const nextRoles = withoutSuperAdmin.length > 0 ? withoutSuperAdmin : ['user']
        return { ...data, roles: nextRoles }
      },
    ],
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
        update: ({ req: { user } }) => userHasAllTenantAccess(user),
      },
      admin: {
        description:
          'Super Admin：全租户。仅 Super Admin 可修改本字段。其它角色（财务 / 运营 / 组长 / 站长）的具体权限在代码与各集合 access 中逐步收紧。',
      },
    },
  ],
}
