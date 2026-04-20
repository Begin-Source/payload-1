import type { GlobalConfig } from 'payload'

import { adminGroups } from '@/constants/adminGroups'
import { isSuperAdminLikeUser } from '@/utilities/isSuperAdminLikeUser'
import { superAdminPasses } from '@/utilities/superAdminPasses'

export const AdminBranding: GlobalConfig = {
  slug: 'admin-branding',
  label: '白标与外观',
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
      name: 'brandName',
      type: 'text',
      label: 'Product / brand name',
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'primaryColor',
      type: 'text',
      label: 'Primary color (hex)',
      admin: { description: 'e.g. #0f172a' },
    },
    {
      name: 'supportEmail',
      type: 'email',
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
}
