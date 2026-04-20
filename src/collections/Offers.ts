import type { CollectionConfig } from 'payload'

import { adminGroups } from '@/constants/adminGroups'
import { superAdminPasses } from '@/utilities/superAdminPasses'

export const Offers: CollectionConfig = {
  slug: 'offers',
  labels: { singular: 'Offer', plural: 'Offer' },
  admin: {
    group: adminGroups.businessPartnerships,
    useAsTitle: 'title',
    defaultColumns: ['title', 'network', 'status', 'updatedAt'],
  },
  access: {
    read: superAdminPasses(({ req: { user } }) => Boolean(user)),
    create: superAdminPasses(({ req: { user } }) => Boolean(user)),
    update: superAdminPasses(({ req: { user } }) => Boolean(user)),
    delete: superAdminPasses(({ req: { user } }) => Boolean(user)),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      index: true,
    },
    {
      name: 'network',
      type: 'relationship',
      relationTo: 'affiliate-networks',
      required: true,
    },
    {
      name: 'sites',
      type: 'relationship',
      relationTo: 'sites',
      hasMany: true,
      admin: { description: 'Sites allowed to promote this offer (optional).' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
      ],
    },
    {
      name: 'externalId',
      type: 'text',
      label: 'External / network offer ID',
    },
    {
      name: 'targetUrl',
      type: 'text',
      label: 'Tracking or landing URL',
    },
    {
      name: 'commissionNotes',
      type: 'textarea',
      label: 'Commission terms (free text)',
    },
  ],
}
