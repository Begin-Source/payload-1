import type { CollectionConfig } from 'payload'

import { adminGroups } from '@/constants/adminGroups'
import { superAdminPasses } from '@/utilities/superAdminPasses'

export const AffiliateNetworks: CollectionConfig = {
  slug: 'affiliate-networks',
  labels: { singular: '联盟', plural: '联盟' },
  admin: {
    group: adminGroups.businessPartnerships,
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'status', 'updatedAt'],
  },
  access: {
    read: superAdminPasses(({ req: { user } }) => Boolean(user)),
    create: superAdminPasses(({ req: { user } }) => Boolean(user)),
    update: superAdminPasses(({ req: { user } }) => Boolean(user)),
    delete: superAdminPasses(({ req: { user } }) => Boolean(user)),
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
      index: true,
    },
    {
      name: 'websiteUrl',
      type: 'text',
      label: 'Program URL',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
}
