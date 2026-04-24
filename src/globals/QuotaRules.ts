import type { GlobalConfig } from 'payload'

import { adminGroups } from '@/constants/adminGroups'
import { financeOnlyBlocksGlobal } from '@/utilities/financeRoleAccess'
import { isSuperAdminLikeUser } from '@/utilities/isSuperAdminLikeUser'
import { superAdminPasses } from '@/utilities/superAdminPasses'

export const QuotaRules: GlobalConfig = {
  slug: 'quota-rules',
  label: '配额规则',
  admin: {
    group: adminGroups.system,
    hidden: ({ user }) => !isSuperAdminLikeUser(user),
  },
  access: {
    read: (args) => {
      if (financeOnlyBlocksGlobal(args.req.user, 'quota-rules')) return false
      return superAdminPasses(() => false)(args)
    },
    update: (args) => {
      if (financeOnlyBlocksGlobal(args.req.user, 'quota-rules')) return false
      return superAdminPasses(() => false)(args)
    },
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
