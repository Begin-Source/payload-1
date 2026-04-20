import type { CollectionConfig } from 'payload'

import { adminGroups } from '@/constants/adminGroups'
import { isSuperAdminLikeUser } from '@/utilities/isSuperAdminLikeUser'
import { superAdminPasses } from '@/utilities/superAdminPasses'

export const SiteQuotas: CollectionConfig = {
  slug: 'site-quotas',
  labels: { singular: '站点配额', plural: '站点配额' },
  admin: {
    group: adminGroups.operations,
    useAsTitle: 'name',
    defaultColumns: ['name', 'site', 'updatedAt'],
    hidden: ({ user }) => !isSuperAdminLikeUser(user),
  },
  access: {
    read: superAdminPasses(() => false),
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
      name: 'site',
      type: 'relationship',
      relationTo: 'sites',
      required: true,
    },
    {
      name: 'maxPublishedPages',
      type: 'number',
      admin: { description: 'Cap on published pages for this site (0 = unlimited).' },
      defaultValue: 0,
    },
    {
      name: 'maxMonthlyAiRuns',
      type: 'number',
      admin: { description: 'Cap on automated/AI job runs per month (0 = unlimited).' },
      defaultValue: 0,
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
}
