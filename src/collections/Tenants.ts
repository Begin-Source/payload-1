import type { CollectionConfig } from 'payload'

import { adminGroups } from '@/constants/adminGroups'
import { superAdminPasses } from '@/utilities/superAdminPasses'

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  labels: { singular: '租户', plural: '租户' },
  admin: {
    group: adminGroups.platformAndTenants,
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'domain'],
  },
  access: {
    read: superAdminPasses(({ req: { user } }) => Boolean(user)),
    create: superAdminPasses(() => false),
    update: superAdminPasses(() => false),
    delete: superAdminPasses(() => false),
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
