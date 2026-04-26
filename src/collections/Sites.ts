import type { CollectionConfig } from 'payload'

import { siteTrustPagesInstantiate } from '@/collections/hooks/siteTrustPagesInstantiate'
import { loggedInSuperAdminAccessFor } from '@/collections/shared/loggedInSuperAdminAccess'
import { adminGroups } from '@/constants/adminGroups'

export const Sites: CollectionConfig = {
  slug: 'sites',
  labels: { singular: '站点', plural: '站点' },
  admin: {
    group: adminGroups.website,
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'status', 'primaryDomain', 'updatedAt'],
  },
  access: loggedInSuperAdminAccessFor('sites'),
  hooks: {
    afterChange: [siteTrustPagesInstantiate],
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
      name: 'siteLayout',
      type: 'select',
      label: '站点布局',
      options: [
        { label: '（默认标准）', value: '' },
        { label: '标准（与历史一致）', value: 'default' },
        { label: '宽版内容区', value: 'wide' },
        { label: '联盟测评站（BBF 风格壳 + 首页）', value: 'affiliate_reviews' },
        { label: 'Template1（整站顶栏 + 主从栏 + 页脚）', value: 'template1' },
        {
          label: 'Template2（同结构 · 第二套主题；文案 t2LocaleJson）',
          value: 'template2',
        },
      ],
      admin: {
        description:
          '站点级壳层。留空则按 `default`。各选项的说明与「预览链接」见侧栏「网站」→「站点布局」。落地页/博客/联盟测评的文案与配色在关联的「设计」中配置；Template1/2 导航/首页/页脚在「设计」的 t1LocaleJson / t2LocaleJson。',
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
