import type { GlobalConfig } from 'payload'

import { adminGroups } from '@/constants/adminGroups'
import { isSuperAdminLikeUser } from '@/utilities/isSuperAdminLikeUser'
import { superAdminPasses } from '@/utilities/superAdminPasses'

export const QuotaRules: GlobalConfig = {
  slug: 'quota-rules',
  label: '配额规则',
  admin: {
    group: adminGroups.systemSettings,
    hidden: ({ user }) => !isSuperAdminLikeUser(user),
  },
  access: {
    read: superAdminPasses(() => false),
    update: superAdminPasses(() => false),
  },
  fields: [
    {
      name: 'rules',
      type: 'json',
      label: '规则配置',
      admin: {
        description: 'JSON for default per-site caps and tenant-wide limits.',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
}
