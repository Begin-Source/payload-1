import type { CollectionConfig } from 'payload'

import { adminGroups } from '@/constants/adminGroups'
import { postLikeFields } from '@/collections/shared/postLikeFields'
import { superAdminPasses } from '@/utilities/superAdminPasses'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: '页面', plural: '页面' },
  admin: {
    group: adminGroups.website,
    useAsTitle: 'title',
    defaultColumns: ['title', 'site', 'status', 'updatedAt'],
  },
  access: {
    read: superAdminPasses(({ req: { user } }) => Boolean(user)),
    create: superAdminPasses(({ req: { user } }) => Boolean(user)),
    update: superAdminPasses(({ req: { user } }) => Boolean(user)),
    delete: superAdminPasses(({ req: { user } }) => Boolean(user)),
  },
  fields: postLikeFields,
}
