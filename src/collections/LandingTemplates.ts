import type { CollectionConfig } from 'payload'

import { blogChromeTemplateFields } from '@/collections/shared/blogPublicFields'
import { adminGroups } from '@/constants/adminGroups'
import { superAdminPasses } from '@/utilities/superAdminPasses'

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

/** Reusable site theme presets; sites pick one via `Sites.landingTemplate`. */
export const LandingTemplates: CollectionConfig = {
  slug: 'landing-templates',
  labels: { singular: '站点模版', plural: '站点模版' },
  admin: {
    group: adminGroups.website,
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'previewUrl', 'updatedAt'],
    description: '站点前台预设主题与配文；在「设计」中可微调。',
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
    ...landingPresetFields,
    {
      type: 'collapsible',
      label: '博客前台 · 壳层与侧栏',
      admin: { initCollapsed: true },
      fields: blogChromeTemplateFields,
    },
  ],
}
