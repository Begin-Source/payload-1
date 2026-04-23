import type { CollectionConfig } from 'payload'

import { adminGroups } from '@/constants/adminGroups'
import { superAdminPasses } from '@/utilities/superAdminPasses'

export const SerpSnapshots: CollectionConfig = {
  slug: 'serp-snapshots',
  labels: { singular: 'SERP 快照', plural: 'SERP 快照' },
  admin: {
    group: adminGroups.operations,
    useAsTitle: 'searchQuery',
    defaultColumns: ['searchQuery', 'keyword', 'engine', 'capturedAt'],
  },
  access: {
    read: superAdminPasses(({ req: { user } }) => Boolean(user)),
    create: superAdminPasses(({ req: { user } }) => Boolean(user)),
    update: superAdminPasses(({ req: { user } }) => Boolean(user)),
    delete: superAdminPasses(({ req: { user } }) => Boolean(user)),
  },
  fields: [
    { name: 'searchQuery', type: 'text', label: 'Query' },
    { name: 'keyword', type: 'relationship', relationTo: 'keywords' },
    { name: 'site', type: 'relationship', relationTo: 'sites' },
    {
      name: 'engine',
      type: 'select',
      defaultValue: 'google',
      options: [
        { label: 'Google', value: 'google' },
        { label: 'Bing', value: 'bing' },
      ],
    },
    { name: 'location', type: 'text' },
    {
      name: 'device',
      type: 'select',
      defaultValue: 'desktop',
      options: [
        { label: 'Desktop', value: 'desktop' },
        { label: 'Mobile', value: 'mobile' },
      ],
    },
    { name: 'capturedAt', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'raw', type: 'json', admin: { description: 'DataForSEO raw (optionally zstd+base64)' } },
  ],
}
