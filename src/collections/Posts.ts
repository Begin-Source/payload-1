import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

import { adminGroups } from '@/constants/adminGroups'
import { superAdminPasses } from '@/utilities/superAdminPasses'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: '文章', plural: '文章' },
  admin: {
    group: adminGroups.contentCreation,
    useAsTitle: 'title',
    defaultColumns: ['title', 'postType', 'site', 'status', 'updatedAt'],
  },
  access: {
    read: superAdminPasses(({ req: { user } }) => Boolean(user)),
    create: superAdminPasses(({ req: { user } }) => Boolean(user)),
    update: superAdminPasses(({ req: { user } }) => Boolean(user)),
    delete: superAdminPasses(({ req: { user } }) => Boolean(user)),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      index: true,
    },
    {
      name: 'postType',
      type: 'select',
      required: true,
      defaultValue: 'article',
      label: 'Type',
      options: [
        { label: 'Article', value: 'article' },
        { label: 'Page', value: 'page' },
      ],
      admin: {
        description: 'Use Page for static landers; Article for blog-style content.',
      },
    },
    {
      name: 'site',
      type: 'relationship',
      relationTo: 'sites',
      admin: {
        description: 'Owning site (optional while migrating legacy content).',
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'body',
      type: 'richText',
      editor: lexicalEditor(),
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
    {
      name: 'publishedAt',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'excerpt',
      type: 'textarea',
    },
  ],
}
