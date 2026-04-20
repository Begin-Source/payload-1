import type { GlobalConfig } from 'payload'

import { adminGroups } from '@/constants/adminGroups'
import { isSuperAdminLikeUser } from '@/utilities/isSuperAdminLikeUser'
import { superAdminPasses } from '@/utilities/superAdminPasses'

export const PromptLibrary: GlobalConfig = {
  slug: 'prompt-library',
  label: '提示词库',
  admin: {
    group: adminGroups.operations,
    hidden: ({ user }) => !isSuperAdminLikeUser(user),
  },
  access: {
    read: superAdminPasses(() => false),
    update: superAdminPasses(() => false),
  },
  fields: [
    {
      name: 'entries',
      type: 'array',
      labels: { singular: 'Entry', plural: 'Entries' },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'body',
          type: 'textarea',
          required: true,
        },
      ],
    },
  ],
}
