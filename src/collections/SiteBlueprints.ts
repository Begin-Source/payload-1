import type { CollectionConfig } from 'payload'

import { adminGroups } from '@/constants/adminGroups'
import {
  requireSiteOnCreate,
  siteScopedSiteField,
} from '@/collections/shared/siteScopedSiteField'
import { isSuperAdminLikeUser } from '@/utilities/isSuperAdminLikeUser'
import { superAdminPasses } from '@/utilities/superAdminPasses'

export const SiteBlueprints: CollectionConfig = {
  slug: 'site-blueprints',
  labels: { singular: '设计', plural: '设计' },
  admin: {
    group: adminGroups.website,
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'site', 'updatedAt'],
    hidden: ({ user }) => !isSuperAdminLikeUser(user),
    components: {
      beforeListTable: ['./components/ArticleCsvImportExport#CsvImportExportPanel'],
      listMenuItems: ['./components/ArticleCsvImportExport#CsvImportExportListMenuItem'],
      views: {
        list: {
          actions: ['./components/CollectionQuickActions#DesignListQuickAction'],
        },
      },
    },
  },
  hooks: {
    beforeChange: [requireSiteOnCreate],
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
    siteScopedSiteField,
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
