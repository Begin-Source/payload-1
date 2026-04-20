import type { CollectionConfig } from 'payload'

import { adminGroups } from '@/constants/adminGroups'
import { superAdminPasses } from '@/utilities/superAdminPasses'

export const ClickEvents: CollectionConfig = {
  slug: 'click-events',
  labels: { singular: '点击事件', plural: '点击事件' },
  admin: {
    group: adminGroups.operations,
    useAsTitle: 'id',
    defaultColumns: ['occurredAt', 'eventType', 'site', 'offer', 'updatedAt'],
  },
  access: {
    read: superAdminPasses(({ req: { user } }) => Boolean(user)),
    create: superAdminPasses(({ req: { user } }) => Boolean(user)),
    update: superAdminPasses(({ req: { user } }) => Boolean(user)),
    delete: superAdminPasses(({ req: { user } }) => Boolean(user)),
  },
  fields: [
    {
      name: 'occurredAt',
      type: 'date',
      required: true,
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'eventType',
      type: 'select',
      required: true,
      defaultValue: 'click',
      options: [
        { label: 'Click', value: 'click' },
        { label: 'Impression', value: 'impression' },
      ],
    },
    {
      name: 'site',
      type: 'relationship',
      relationTo: 'sites',
    },
    {
      name: 'offer',
      type: 'relationship',
      relationTo: 'offers',
    },
    {
      name: 'destinationUrl',
      type: 'text',
    },
    {
      name: 'referrer',
      type: 'text',
    },
    {
      name: 'metadata',
      type: 'json',
      label: 'Extra (device, campaign id, etc.)',
    },
  ],
}
