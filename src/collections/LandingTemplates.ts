import type { CollectionConfig } from 'payload'

import { loggedInSuperAdminAccessFor } from '@/collections/shared/loggedInSuperAdminAccess'
import { blogChromeTemplateFields } from '@/collections/shared/blogPublicFields'
import { template1SiteFields } from '@/collections/shared/template1SiteFields'
import { adminGroups } from '@/constants/adminGroups'

const landingPresetFields: CollectionConfig['fields'] = [
  {
    name: 'landingBrowserTitle',
    type: 'text',
    label: '浏览器标签标题',
    admin: { description: '留空则使用站点名称或全局兜底。' },
  },
  {
    name: 'landingSiteName',
    type: 'text',
    label: '主标题（未登录）',
  },
  {
    name: 'landingTagline',
    type: 'text',
    label: '副标题（未登录）',
  },
  {
    name: 'landingLoggedInTitle',
    type: 'text',
    label: '主标题（已登录）',
  },
  {
    name: 'landingLoggedInSubtitle',
    type: 'textarea',
    label: '副标题（已登录）',
  },
  {
    name: 'landingFooterLine',
    type: 'textarea',
    label: '页脚一行',
  },
  {
    name: 'landingCtaLabel',
    type: 'text',
    label: '管理后台按钮',
  },
  {
    name: 'landingBgColor',
    type: 'text',
    label: '背景色',
  },
  {
    name: 'landingTextColor',
    type: 'text',
    label: '主文字色',
  },
  {
    name: 'landingMutedColor',
    type: 'text',
    label: '次要文字色',
  },
  {
    name: 'landingCtaBgColor',
    type: 'text',
    label: '主按钮背景色',
  },
  {
    name: 'landingCtaTextColor',
    type: 'text',
    label: '主按钮文字色',
  },
  {
    name: 'landingFontPreset',
    type: 'select',
    label: '字体',
    options: [
      { label: '（使用全局兜底）', value: '' },
      { label: '系统无衬线', value: 'system' },
      { label: '衬线（Georgia）', value: 'serif' },
      { label: '思源黑体 Noto Sans SC', value: 'noto_sans_sc' },
    ],
  },
]

const siteLayoutOptions = [
  { label: '标准（与历史一致）', value: 'default' },
  { label: '宽版内容区', value: 'wide' },
  { label: '联盟测评站（BBF 风格壳 + 首页）', value: 'affiliate_reviews' },
  { label: 'Template1（整站顶栏 + 主从栏 + 页脚）', value: 'template1' },
] as const

/** Reusable whole-site theme presets; sites pick one via `Sites.landingTemplate`. */
export const LandingTemplates: CollectionConfig = {
  slug: 'landing-templates',
  labels: { singular: '整站模版', plural: '整站模版' },
  admin: {
    group: adminGroups.website,
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'siteLayout', 'previewUrl', 'updatedAt'],
    description: '整站前台版式、首页文案、博客配色、导航/页脚与 Template1/ReviewHub 配置源。',
    components: {
      afterListTable: ['./components/LandingTemplatesCsvAfterTable#LandingTemplatesCsvAfterTable'],
      listMenuItems: ['./components/ArticleCsvImportExport#CsvImportExportListMenuItem'],
    },
  },
  access: loggedInSuperAdminAccessFor('landing-templates'),
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
        description: 'URL-safe key; unique per tenant with `slug`.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: '说明',
    },
    {
      name: 'previewUrl',
      type: 'text',
      label: '预览链接',
      admin: {
        description:
          '完整可访问的前台 URL，且对应站点须已选用本模版（本地示例：http://localhost:3000/zh/?site=站点 slug）。',
        components: {
          afterInput: ['./components/LandingPreviewUrlAfterInput#LandingPreviewUrlAfterInput'],
          Cell: './components/PreviewUrlListCell#PreviewUrlListCell',
        },
      },
      validate: (value: string | null | undefined) => {
        if (value == null || String(value).trim() === '') return true
        try {
          const u = new URL(String(value).trim())
          if (u.protocol !== 'http:' && u.protocol !== 'https:') {
            return '请使用 http:// 或 https:// 开头的完整链接'
          }
        } catch {
          return '请输入合法 URL'
        }
        return true
      },
    },
    {
      name: 'siteLayout',
      type: 'select',
      label: '整站版式',
      defaultValue: 'default',
      admin: {
        description: '作为引用此模版的站点默认版式；站点自身「全站版式」留空时生效。',
      },
      options: [...siteLayoutOptions],
    },
    ...landingPresetFields,
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
            description: '整站版式为「联盟测评站」时，首页大标题下展示；站点可覆盖。',
          },
        },
        {
          name: 'affiliateDisclosureLine',
          type: 'textarea',
          label: '联盟声明（页脚上方）',
          admin: {
            description: '灰条说明文案；站点可覆盖；留空则使用系统默认英文短句。',
          },
        },
        {
          name: 'footerResourceLinks',
          type: 'json',
          label: 'Resources 链接（JSON 数组）',
          admin: {
            description:
              '例: [{"label":"Privacy","href":"/en/pages/privacy"}]；href 可为相对路径。站点可覆盖。',
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: '博客前台 · 壳层与侧栏',
      admin: { initCollapsed: true },
      fields: blogChromeTemplateFields,
    },
    {
      type: 'collapsible',
      label: 'Template1 · 导航 / 首页 / 页脚文案',
      admin: { initCollapsed: true },
      fields: template1SiteFields,
    },
  ],
}
