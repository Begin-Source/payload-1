import type { CollectionConfig } from 'payload'

import { adminGroups } from '@/constants/adminGroups'
import { isSuperAdminLikeUser } from '@/utilities/isSuperAdminLikeUser'
import { superAdminPasses } from '@/utilities/superAdminPasses'

export const SiteBlueprints: CollectionConfig = {
  slug: 'site-blueprints',
  labels: { singular: '站点蓝图', plural: '站点蓝图' },
  admin: {
    group: adminGroups.system,
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'updatedAt'],
    hidden: ({ user }) => !isSuperAdminLikeUser(user),
  },
  access: {
    read: superAdminPasses(() => false),
    create: superAdminPasses(() => false),
    update: superAdminPasses(() => false),
    delete: superAdminPasses(() => false),
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
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'templateConfig',
      type: 'json',
      admin: {
        description: 'Arbitrary JSON for themes, sections, or generator defaults.',
      },
    },
  ],
}
