import type { CollectionConfig } from 'payload'

import { adminGroups } from '@/constants/adminGroups'
import { articleSeoFields } from '@/collections/shared/articleSeoFields'
import { postLikeFields } from '@/collections/shared/postLikeFields'
import { validateSlugLocaleUnique } from '@/collections/shared/validateSlugLocaleUnique'
import { articleAfterChangeWorkflow } from '@/collections/hooks/articleAfterChangeWorkflow'
import { articleBeforeReadAffiliate } from '@/collections/hooks/articleBeforeReadAffiliate'
import { articleLinkBudget } from '@/collections/hooks/articleLinkBudget'
import { pageLinkGraphSync } from '@/collections/hooks/pageLinkGraphSync'
import { articleLifecycleOnPublish } from '@/collections/hooks/articleLifecycleOnPublish'
import { articlePublishGate } from '@/collections/hooks/articlePublishGate'
import { validateCategoriesMatchSite } from '@/collections/shared/validateCategoriesMatchSite'
import { superAdminPasses } from '@/utilities/superAdminPasses'

export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: { singular: '文章', plural: '文章' },
  admin: {
    group: adminGroups.website,
    useAsTitle: 'title',
    defaultColumns: ['title', 'site', 'status', 'lifecycleStage', 'updatedAt'],
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
          actions: ['./components/CollectionQuickActions#ArticleListQuickAction'],
        },
      },
    },
  },
  hooks: {
    beforeValidate: [articleLinkBudget],
    beforeChange: [
      validateCategoriesMatchSite,
      validateSlugLocaleUnique('articles'),
      articleLifecycleOnPublish,
      articlePublishGate,
    ],
    beforeRead: [articleBeforeReadAffiliate],
    afterChange: [articleAfterChangeWorkflow, pageLinkGraphSync],
  },
  access: {
    read: superAdminPasses(({ req: { user } }) => Boolean(user)),
    create: superAdminPasses(({ req: { user } }) => Boolean(user)),
    update: superAdminPasses(({ req: { user } }) => Boolean(user)),
    delete: superAdminPasses(({ req: { user } }) => Boolean(user)),
  },
  fields: [...postLikeFields, ...articleSeoFields],
}
