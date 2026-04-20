import type { CollectionConfig } from 'payload'

import type { User } from '@/payload-types'
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
        if (!userHasAllTenantAccess(req.user as User | undefined)) {
          data.roles = roles.filter((r: string) => r !== 'super-admin')
          if (!data.roles.length) {
            data.roles = ['user']
          }
        }
        return data
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
        update: ({ req: { user } }) => userHasAllTenantAccess(user as User | undefined),
      },
      admin: {
        description:
          'Super Admin can access every tenant and all tenant-scoped content. Only Super Admins can grant this role.',
      },
    },
  ],
}
