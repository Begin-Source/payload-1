import type { CollectionConfig } from 'payload'

import { adminGroups } from '@/constants/adminGroups'
import { isUsersCollection } from '@/utilities/announcementAccess'
import { financeOnlyBlocksCollection } from '@/utilities/financeRoleAccess'
import { userHasAllTenantAccess } from '@/utilities/superAdmin'
import { superAdminPasses } from '@/utilities/superAdminPasses'
import { getTenantIdsForUser } from '@/utilities/tenantScope'

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  labels: { singular: '租户', plural: '租户' },
  admin: {
    group: adminGroups.system,
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'domain'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (financeOnlyBlocksCollection(user, 'tenants')) return false
      if (userHasAllTenantAccess(user)) return true
      if (!isUsersCollection(user)) return false
      const ids = getTenantIdsForUser(user)
      if (ids.length === 0) return false
      return { id: { in: ids } }
    },
    create: superAdminPasses(() => false),
    update: superAdminPasses(() => false),
    delete: superAdminPasses(() => false),
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
      unique: true,
      index: true,
    },
    {
      name: 'domain',
      type: 'text',
      required: true,
    },
  ],
}
