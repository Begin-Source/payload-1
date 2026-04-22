import type { CollectionConfig } from 'payload'

import { lexicalEditorWithAi } from '@/utilities/lexicalEditorWithAi'

import { adminGroups } from '@/constants/adminGroups'
import { superAdminPasses } from '@/utilities/superAdminPasses'

export const KnowledgeBase: CollectionConfig = {
  slug: 'knowledge-base',
  labels: { singular: '知识库文档', plural: '知识库文档' },
  admin: {
    group: adminGroups.knowledge,
    useAsTitle: 'title',
    defaultColumns: ['title', 'site', 'status', 'updatedAt'],
    components: {
      beforeListTable: ['./components/ArticleFindReplacePanel#FindReplacePanel'],
      listMenuItems: ['./components/ArticleFindReplacePanel#FindReplaceListMenuItem'],
    },
  },
  access: {
    read: superAdminPasses(({ req: { user } }) => Boolean(user)),
    create: superAdminPasses(({ req: { user } }) => Boolean(user)),
    update: superAdminPasses(({ req: { user } }) => Boolean(user)),
    delete: superAdminPasses(({ req: { user } }) => Boolean(user)),
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', index: true },
    {
      name: 'site',
      type: 'relationship',
      relationTo: 'sites',
      admin: { description: 'Optional scope to one site.' },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
    },
    {
      name: 'body',
      type: 'richText',
      editor: lexicalEditorWithAi(),
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    { name: 'notes', type: 'textarea' },
  ],
}
