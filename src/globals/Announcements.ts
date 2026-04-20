import type { GlobalConfig } from 'payload'

import { adminGroups } from '@/constants/adminGroups'
import { superAdminPasses } from '@/utilities/superAdminPasses'

export const Announcements: GlobalConfig = {
  slug: 'announcements',
  label: '通知公告',
  admin: {
    group: adminGroups.home,
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    update: superAdminPasses(() => false),
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'body',
      type: 'textarea',
      required: true,
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'startsAt',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'endsAt',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
  ],
}
