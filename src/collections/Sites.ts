import type { CollectionConfig } from 'payload'

import { siteTrustPagesInstantiate } from '@/collections/hooks/siteTrustPagesInstantiate'
import { blogChromeSiteFields } from '@/collections/shared/blogPublicFields'
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
      name: 'landingTemplate',
      type: 'relationship',
      relationTo: 'landing-templates',
      label: '整站模版',
      admin: {
        description: '整站前台版式、文案、配色、导航/页脚等配置源；站点字段留空时使用此模版。',
      },
    },
    {
      name: 'siteLayout',
      type: 'select',
      label: '全站版式',
      options: [
        { label: '（使用整站模版）', value: '' },
        { label: '标准（与历史一致）', value: 'default' },
        { label: '宽版内容区', value: 'wide' },
        { label: '联盟测评站（BBF 风格壳 + 首页）', value: 'affiliate_reviews' },
        { label: 'Template1（整站顶栏 + 主从栏 + 页脚）', value: 'template1' },
      ],
      admin: {
        description:
          '站点级覆盖。留空则使用「整站模版」中的版式；选 Template1 时，站点 Template1 文案可继续作为覆盖层。',
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
    {
      name: 'landingBrowserTitle',
      type: 'text',
      label: '落地页 · 浏览器标签标题',
      admin: { description: '留空则使用全局兜底或站点名称。' },
    },
    {
      name: 'landingSiteName',
      type: 'text',
      label: '落地页 · 主标题（未登录）',
    },
    {
      name: 'landingTagline',
      type: 'text',
      label: '落地页 · 副标题（未登录）',
    },
    {
      name: 'landingLoggedInTitle',
      type: 'text',
      label: '落地页 · 主标题（已登录）',
    },
    {
      name: 'landingLoggedInSubtitle',
      type: 'textarea',
      label: '落地页 · 副标题（已登录）',
    },
    {
      name: 'landingFooterLine',
      type: 'textarea',
      label: '落地页 · 页脚一行',
    },
    {
      name: 'landingCtaLabel',
      type: 'text',
      label: '落地页 · 管理后台按钮',
    },
    {
      name: 'landingBgColor',
      type: 'text',
      label: '落地页 · 背景色',
    },
    {
      name: 'landingTextColor',
      type: 'text',
      label: '落地页 · 主文字色',
    },
    {
      name: 'landingMutedColor',
      type: 'text',
      label: '落地页 · 次要文字色',
    },
    {
      name: 'landingCtaBgColor',
      type: 'text',
      label: '落地页 · 主按钮背景色',
    },
    {
      name: 'landingCtaTextColor',
      type: 'text',
      label: '落地页 · 主按钮文字色',
    },
    {
      name: 'landingFontPreset',
      type: 'select',
      label: '落地页 · 字体',
      options: [
        { label: '（使用全局兜底）', value: '' },
        { label: '系统无衬线', value: 'system' },
        { label: '衬线（Georgia）', value: 'serif' },
        { label: '思源黑体 Noto Sans SC', value: 'noto_sans_sc' },
      ],
    },
    {
      type: 'collapsible',
      label: '联盟测评站 · 前台',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'reviewHubTagline',
          type: 'text',
          label: '测评站首页副标题',
          admin: {
            description: '站点级覆盖；留空则使用整站模版或落地页副标题。',
          },
        },
        {
          name: 'affiliateDisclosureLine',
          type: 'textarea',
          label: '联盟声明（页脚上方）',
          admin: {
            description: '站点级覆盖；留空则使用整站模版或默认英文短句。',
          },
        },
        {
          name: 'footerResourceLinks',
          type: 'json',
          label: 'Resources 链接（JSON 数组）',
          admin: {
            description:
              '站点级覆盖；留空则使用整站模版。例: [{"label":"Privacy","href":"/en/pages/privacy"}]。',
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: '博客前台 · 覆盖',
      admin: { initCollapsed: true },
      fields: blogChromeSiteFields,
    },
  ],
}
