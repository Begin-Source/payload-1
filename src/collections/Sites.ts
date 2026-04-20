import type { CollectionConfig } from 'payload'

import { adminGroups } from '@/constants/adminGroups'
import { superAdminPasses } from '@/utilities/superAdminPasses'

export const Sites: CollectionConfig = {
  slug: 'sites',
  labels: { singular: '站点', plural: '站点' },
  admin: {
    group: adminGroups.sites,
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'status', 'primaryDomain', 'updatedAt'],
  },
  access: {
    read: superAdminPasses(({ req: { user } }) => Boolean(user)),
    create: superAdminPasses(({ req: { user } }) => Boolean(user)),
    update: superAdminPasses(({ req: { user } }) => Boolean(user)),
    delete: superAdminPasses(({ req: { user } }) => Boolean(user)),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'URL-safe key; pair with tenant for uniqueness in your workflows.',
      },
    },
    {
      name: 'primaryDomain',
      type: 'text',
      label: 'Primary domain',
      required: true,
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
      name: 'blueprint',
      type: 'relationship',
      relationTo: 'site-blueprints',
      admin: {
        description: 'Optional layout/template blueprint for this site.',
      },
    },
    {
      name: 'operators',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      admin: {
        description: 'Users who operate this site (optional; tenant scoping still applies).',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
}
