import type { CollectionConfig } from 'payload'

import { adminGroups } from '@/constants/adminGroups'
import { superAdminPasses } from '@/utilities/superAdminPasses'

export const Keywords: CollectionConfig = {
  slug: 'keywords',
  labels: { singular: '关键词', plural: '关键词' },
  admin: {
    group: adminGroups.website,
    useAsTitle: 'term',
    defaultColumns: ['term', 'site', 'status', 'updatedAt'],
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
          actions: ['./components/CollectionQuickActions#KeywordListQuickAction'],
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
  fields: [
    {
      name: 'term',
      type: 'text',
      required: true,
      label: 'Keyword',
    },
    {
      name: 'slug',
      type: 'text',
      index: true,
    },
    {
      name: 'site',
      type: 'relationship',
      relationTo: 'sites',
      admin: {
        description: 'Optional: scope this keyword to one site.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Active', value: 'active' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
}
