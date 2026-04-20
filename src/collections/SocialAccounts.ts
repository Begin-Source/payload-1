import type { CollectionConfig } from 'payload'

import { adminGroups } from '@/constants/adminGroups'
import { superAdminPasses } from '@/utilities/superAdminPasses'

export const SocialAccounts: CollectionConfig = {
  slug: 'social-accounts',
  labels: { singular: '社交账号', plural: '社交账号' },
  admin: {
    group: adminGroups.social,
    useAsTitle: 'handle',
    defaultColumns: ['handle', 'platform', 'site', 'status', 'updatedAt'],
  },
  access: {
    read: superAdminPasses(({ req: { user } }) => Boolean(user)),
    create: superAdminPasses(({ req: { user } }) => Boolean(user)),
    update: superAdminPasses(({ req: { user } }) => Boolean(user)),
    delete: superAdminPasses(({ req: { user } }) => Boolean(user)),
  },
  fields: [
    {
      name: 'platform',
      type: 'relationship',
      relationTo: 'social-platforms',
      required: true,
    },
    {
      name: 'site',
      type: 'relationship',
      relationTo: 'sites',
    },
    { name: 'handle', type: 'text', required: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Disconnected', value: 'disconnected' },
      ],
    },
    { name: 'notes', type: 'textarea' },
  ],
}
