import type { GlobalConfig } from 'payload'

import { adminGroups } from '@/constants/adminGroups'
import { isSuperAdminLikeUser } from '@/utilities/isSuperAdminLikeUser'
import { superAdminPasses } from '@/utilities/superAdminPasses'

export const CommissionRules: GlobalConfig = {
  slug: 'commission-rules',
  label: '佣金规则',
  admin: {
    group: adminGroups.financeAndCommissions,
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
        description: 'JSON for default splits, floors, approval policy, etc.',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
}
