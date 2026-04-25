import type { CollectionConfig } from 'payload'

import { template1SiteFields } from '@/collections/shared/template1SiteFields'
import { loggedInSuperAdminAccessFor } from '@/collections/shared/loggedInSuperAdminAccess'
import { adminGroups } from '@/constants/adminGroups'

/**
 * Template1 per-site copy stored **outside** `sites` so Cloudflare D1’s 100 columns/table cap
 * on `sites` is not exceeded. One row per site (`site` is unique).
 */
export const SiteT1Locales: CollectionConfig = {
  slug: 'site-t1-locales',
  labels: { singular: '站点 Template1 文案', plural: '站点 Template1 文案' },
  admin: {
    group: adminGroups.website,
    useAsTitle: 'id',
    defaultColumns: ['site', 'updatedAt'],
    description: '每站点一条；与「站点」中全站版式 Template1 配套。无记录则前台用代码默认文案。',
  },
  access: loggedInSuperAdminAccessFor('site-t1-locales'),
  fields: [
    {
      name: 'site',
      type: 'relationship',
      relationTo: 'sites',
      required: true,
      unique: true,
      index: true,
      admin: { description: '一个站点仅一条 Template1 文案记录。' },
    },
    ...template1SiteFields,
  ],
}
