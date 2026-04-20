import type { CollectionConfig } from 'payload'

import { adminGroups } from '@/constants/adminGroups'
import { superAdminPasses } from '@/utilities/superAdminPasses'

export const Commissions: CollectionConfig = {
  slug: 'commissions',
  labels: { singular: '佣金记录', plural: '佣金记录' },
  admin: {
    group: adminGroups.financeAndCommissions,
    useAsTitle: 'id',
    defaultColumns: ['amount', 'currency', 'status', 'offer', 'updatedAt'],
  },
  access: {
    read: superAdminPasses(({ req: { user } }) => Boolean(user)),
    create: superAdminPasses(({ req: { user } }) => Boolean(user)),
    update: superAdminPasses(({ req: { user } }) => Boolean(user)),
    delete: superAdminPasses(({ req: { user } }) => Boolean(user)),
  },
  fields: [
    {
      name: 'amount',
      type: 'number',
      required: true,
      admin: { step: 0.01 },
    },
    {
      name: 'currency',
      type: 'text',
      required: true,
      defaultValue: 'USD',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Paid', value: 'paid' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
    {
      name: 'offer',
      type: 'relationship',
      relationTo: 'offers',
    },
    {
      name: 'site',
      type: 'relationship',
      relationTo: 'sites',
    },
    {
      name: 'periodStart',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'periodEnd',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'paidAt',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
}
