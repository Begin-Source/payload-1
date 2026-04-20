import type { CollectionConfig } from 'payload'

import { userHasAllTenantAccess } from '@/utilities/superAdmin'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
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
      name: 'roles',
      type: 'select',
      hasMany: true,
      defaultValue: ['user'],
      required: true,
      options: [
        { label: 'User', value: 'user' },
        { label: 'Super Admin', value: 'super-admin' },
      ],
      access: {
        update: ({ req: { user } }) => userHasAllTenantAccess(user),
      },
      admin: {
        description:
          'Super Admin can access every tenant and all tenant-scoped content. Only Super Admins can grant this role.',
      },
    },
  ],
}
