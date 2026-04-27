import type { CollectionConfig } from 'payload'

import { fillSitesOptionalDbFields } from '@/collections/hooks/fillSitesOptionalDbFields'
import { auditSitesMatrixChange } from '@/collections/hooks/sitesMatrixAudit'
import { siteTrustPagesInstantiate } from '@/collections/hooks/siteTrustPagesInstantiate'
import { enforceSitesMatrixQuota } from '@/collections/hooks/sitesMatrixQuota'
import { loggedInSuperAdminAccessFor } from '@/collections/shared/loggedInSuperAdminAccess'
import { adminGroups } from '@/constants/adminGroups'

export const Sites: CollectionConfig = {
  slug: 'sites',
  labels: { singular: '站点', plural: '站点' },
  admin: {
    group: adminGroups.website,
    useAsTitle: 'name',
    defaultColumns: [
      'name',
      'slug',
      'portfolio',
      'status',
      'domainWorkflowStatus',
      'primaryDomain',
      'updatedAt',
    ],
    components: {
      views: {
        list: {
          actions: ['./components/CollectionQuickActions#SiteListQuickAction'],
        },
      },
    },
  },
  access: loggedInSuperAdminAccessFor('sites'),
  hooks: {
    beforeChange: [fillSitesOptionalDbFields, enforceSitesMatrixQuota],
    afterChange: [siteTrustPagesInstantiate, auditSitesMatrixChange],
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
      index: true,
      admin: {
        description:
          'URL-safe key; pair with tenant for uniqueness in your workflows. 列表「快捷操作 · 生成域名」在写回主域名时会将 slug 同步为小写并把域名中的点替换为连字符。新建时若留空，会按名称自动生成占位 slug。',
      },
    },
    {
      name: 'primaryDomain',
      type: 'text',
      label: 'Primary domain',
      admin: {
        description: '可留空；入库前会存为空字符串，稍后可由域名生成流程或手工补全。',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      admin: {
        description: '可留空；未选择时按 draft 写入数据库。',
      },
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Active', value: 'active' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      name: 'portfolio',
      type: 'relationship',
      relationTo: 'site-portfolios',
      label: '站点组合',
      admin: {
        description: 'SEO 矩阵：项目/批次分组，便于筛选与批量运营。',
      },
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
      type: 'collapsible',
      label: '域名生成 / AI（n8n Generate Domain 等价）',
      admin: {
        description:
          '由 POST /api/sites/generate-domain（x-internal-token）写入；含 OpenRouter 建议与 Spaceship 可查结果。',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'mainProduct',
          type: 'text',
          label: '主品 / Main product',
          admin: { description: '用于域名与受众提示词（对应原 n8n main_product）。' },
        },
        {
          name: 'nicheData',
          type: 'json',
          label: '细分数据 niche_data',
          admin: {
            description: 'JSON：建议含 niche、target_audience；流程会清理临时域名建议键。',
          },
        },
        {
          name: 'domainWorkflowStatus',
          type: 'select',
          label: '域名流程状态',
          defaultValue: 'idle',
          options: [
            { label: '空闲', value: 'idle' },
            { label: '运行中', value: 'running' },
            { label: '已完成', value: 'done' },
            { label: '错误', value: 'error' },
          ],
        },
        {
          name: 'domainCheckStatus',
          type: 'text',
          label: '可查状态 domain_check_status',
          admin: { description: 'available | unavailable | error（多由 API 写入）。' },
        },
        {
          name: 'domainCheckAvailable',
          type: 'checkbox',
          label: '标准价可用',
          defaultValue: false,
          admin: { description: '由 Spaceship 批量可查结果写入。' },
        },
        {
          name: 'domainCheckAt',
          type: 'date',
          label: '可查时间',
          admin: { date: { pickerAppearance: 'dayAndTime' } },
        },
        {
          name: 'domainCheckMessage',
          type: 'textarea',
          label: '可查说明',
        },
        {
          name: 'domainGenerationLog',
          type: 'textarea',
          label: '域名生成日志',
          admin: {
            description: '追加日志，末尾截断约 12000 字符（与 n8n 一致）。',
          },
        },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
}
