import type { CollectionConfig } from 'payload'

import { adminGroups } from '@/constants/adminGroups'
import {
  requireSiteOnCreate,
  siteScopedSiteField,
} from '@/collections/shared/siteScopedSiteField'
import { loggedInSuperAdminAccessFor } from '@/collections/shared/loggedInSuperAdminAccess'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: '分类', plural: '分类' },
  admin: {
    group: adminGroups.website,
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'site', 'categorySlotsWorkflowStatus', 'updatedAt'],
    components: {
      beforeListTable: ['./components/ArticleCsvImportExport#CsvImportExportPanel'],
      listMenuItems: ['./components/ArticleCsvImportExport#CsvImportExportListMenuItem'],
      views: {
        list: {
          actions: ['./components/CollectionQuickActions#CategoryListQuickAction'],
        },
      },
    },
  },
  hooks: {
    beforeChange: [requireSiteOnCreate],
  },
  access: loggedInSuperAdminAccessFor('categories'),
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
      name: 'kind',
      type: 'select',
      defaultValue: 'article',
      index: true,
      options: [
        { label: '通用 / 文章', value: 'article' },
        { label: '指南 (Guides)', value: 'guide' },
      ],
      admin: {
        position: 'sidebar',
        description: 'amz-template-1：Guides 顶部 chip 只用 kind=指南 的分类；Reviews/首页仍用全部分类。',
      },
    },
    siteScopedSiteField,
    {
      name: 'slotIndex',
      type: 'number',
      label: '槽位序号',
      min: 1,
      max: 5,
      admin: {
        position: 'sidebar',
        description:
          '可选。1–5 由「快捷操作 · 生成分类槽位」管理；留空表示手工分类。',
      },
    },
    {
      name: 'categorySlotsWorkflowStatus',
      type: 'text',
      label: '分类槽位流程状态',
      defaultValue: 'idle',
      admin: {
        readOnly: true,
        description:
          '由「快捷操作 · 生成分类槽位」直接写入本分类（idle / running / done / error）。同站点下各分类通常一致。',
        listView: {
          label: '槽位流程',
        },
        components: {
          Cell: './components/CategorySlotsWorkflowStatusCell#CategorySlotsWorkflowStatusCell',
        },
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
  ],
}
