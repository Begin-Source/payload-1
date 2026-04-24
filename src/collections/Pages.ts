import type { CollectionConfig } from 'payload'

import { adminGroups } from '@/constants/adminGroups'
import { postLikeFields } from '@/collections/shared/postLikeFields'
import { validateSlugLocaleUnique } from '@/collections/shared/validateSlugLocaleUnique'
import { validateCategoriesMatchSite } from '@/collections/shared/validateCategoriesMatchSite'
import { pageLinkGraphSync } from '@/collections/hooks/pageLinkGraphSync'
import { loggedInSuperAdminAccessFor } from '@/collections/shared/loggedInSuperAdminAccess'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: '页面', plural: '页面' },
  admin: {
    group: adminGroups.website,
    useAsTitle: 'title',
    defaultColumns: ['title', 'site', 'status', 'updatedAt'],
    components: {
      beforeListTable: [
        './components/ArticleFindReplacePanel#FindReplacePanel',
        './components/ArticleCsvImportExport#CsvImportExportPanel',
      ],
      listMenuItems: [
        './components/ArticleFindReplacePanel#FindReplaceListMenuItem',
        './components/ArticleCsvImportExport#CsvImportExportListMenuItem',
      ],
      views: {
        list: {
          actions: ['./components/CollectionQuickActions#PageListQuickAction'],
        },
      },
    },
  },
  hooks: {
    beforeChange: [validateCategoriesMatchSite, validateSlugLocaleUnique('pages')],
    afterChange: [pageLinkGraphSync],
  },
  access: loggedInSuperAdminAccessFor('pages'),
  fields: postLikeFields,
}
