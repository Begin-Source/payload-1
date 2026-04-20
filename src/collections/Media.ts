import type { CollectionConfig } from 'payload'

import { adminGroups } from '@/constants/adminGroups'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: '媒体', plural: '媒体库' },
  admin: {
    group: adminGroups.mediaAssets,
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: {
    // These are not supported on Workers yet due to lack of sharp
    crop: false,
    focalPoint: false,
  },
}
