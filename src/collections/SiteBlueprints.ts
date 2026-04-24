import type { CollectionConfig } from 'payload'

import { blogChromeDesignFields } from '@/collections/shared/blogPublicFields'
import type { User } from '@/payload-types'
import { adminGroups } from '@/constants/adminGroups'
import {
  requireSiteOnCreate,
  siteScopedSiteField,
} from '@/collections/shared/siteScopedSiteField'
import { denyPortalAndFinanceCollection } from '@/utilities/userAccessTiers'
import { isSystemConfigNavVisible } from '@/utilities/isSuperAdminLikeUser'
import { superAdminOrTenantGMPasses } from '@/utilities/superAdminPasses'
import { userHasTenantGeneralManagerRole } from '@/utilities/userRoles'

export const SiteBlueprints: CollectionConfig = {
  slug: 'site-blueprints',
  labels: { singular: '设计', plural: '设计' },
  admin: {
    group: adminGroups.website,
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'site', 'updatedAt'],
    hidden: ({ user }) =>
      !isSystemConfigNavVisible(user) && !userHasTenantGeneralManagerRole(user as User),
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
    read: denyPortalAndFinanceCollection('site-blueprints', superAdminOrTenantGMPasses(() => false)),
    create: denyPortalAndFinanceCollection('site-blueprints', superAdminOrTenantGMPasses(() => false)),
    update: denyPortalAndFinanceCollection('site-blueprints', superAdminOrTenantGMPasses(() => false)),
    delete: denyPortalAndFinanceCollection('site-blueprints', superAdminOrTenantGMPasses(() => false)),
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
    {
      type: 'collapsible',
      label: '落地页 · 设计微调',
      admin: {
        description: '覆盖站点所选模版与全局兜底；不能更换模版（模版仅在站点选择）。',
        initCollapsed: false,
      },
      fields: [
        {
          name: 'designBrowserTitle',
          type: 'text',
          label: '浏览器标签标题',
        },
        {
          name: 'designSiteName',
          type: 'text',
          label: '主标题（未登录）',
        },
        {
          name: 'designTagline',
          type: 'text',
          label: '副标题（未登录）',
        },
        {
          name: 'designLoggedInTitle',
          type: 'text',
          label: '主标题（已登录）',
        },
        {
          name: 'designLoggedInSubtitle',
          type: 'textarea',
          label: '副标题（已登录）',
        },
        {
          name: 'designFooterLine',
          type: 'textarea',
          label: '页脚一行',
        },
        {
          name: 'designCtaLabel',
          type: 'text',
          label: '管理后台按钮',
        },
        {
          name: 'designBgColor',
          type: 'text',
          label: '背景色',
        },
        {
          name: 'designTextColor',
          type: 'text',
          label: '主文字色',
        },
        {
          name: 'designMutedColor',
          type: 'text',
          label: '次要文字色',
        },
        {
          name: 'designCtaBgColor',
          type: 'text',
          label: '主按钮背景色',
        },
        {
          name: 'designCtaTextColor',
          type: 'text',
          label: '主按钮文字色',
        },
        {
          name: 'designFontPreset',
          type: 'select',
          label: '字体',
          options: [
            { label: '（沿用下层）', value: '' },
            { label: '系统无衬线', value: 'system' },
            { label: '衬线（Georgia）', value: 'serif' },
            { label: '思源黑体 Noto Sans SC', value: 'noto_sans_sc' },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: '博客前台 · 设计微调',
      admin: { description: '覆盖模版中的博客壳与侧栏。', initCollapsed: true },
      fields: blogChromeDesignFields,
    },
    {
      name: 'trustAssetsTemplate',
      type: 'json',
      label: 'Trust 页种子',
      admin: { description: 'Lexical or JSON template for /about, /affiliate-disclosure, etc.' },
    },
    { name: 'mainNavTemplate', type: 'json' },
    { name: 'footerTemplate', type: 'json' },
    { name: 'showBreadcrumb', type: 'checkbox', defaultValue: true },
  ],
}
