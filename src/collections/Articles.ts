import type { CollectionConfig } from 'payload'

import { adminGroups } from '@/constants/adminGroups'
import { postLikeFields } from '@/collections/shared/postLikeFields'
import { superAdminPasses } from '@/utilities/superAdminPasses'

export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: { singular: '文章', plural: '文章' },
  admin: {
    group: adminGroups.website,
    useAsTitle: 'title',
    defaultColumns: ['title', 'site', 'status', 'updatedAt'],
    components: {
      views: {
        list: {
          actions: ['./components/CollectionQuickActions#ArticleListQuickAction'],
        },
      },
    },
  },
  access: {
    read: superAdminPasses(({ req: { user } }) => Boolean(user)),
    create: superAdminPasses(({ req: { user } }) => Boolean(user)),
    update: superAdminPasses(({ req: { user } }) => Boolean(user)),
    delete: superAdminPasses(({ req: { user } }) => Boolean(user)),
  },
  fields: postLikeFields,
}
