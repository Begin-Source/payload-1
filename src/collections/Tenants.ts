import type { CollectionConfig } from 'payload'

import { adminGroups } from '@/constants/adminGroups'
import { userHasAllTenantAccess } from '@/utilities/superAdmin'

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  labels: { singular: '租户', plural: '租户' },
  admin: {
    group: adminGroups.platformAndTenants,
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'domain'],
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => userHasAllTenantAccess(user),
    update: ({ req: { user } }) => userHasAllTenantAccess(user),
    delete: ({ req: { user } }) => userHasAllTenantAccess(user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'domain',
      type: 'text',
      required: true,
    },
  ],
}
