import type { CollectionConfig } from 'payload'

import { adminGroups } from '@/constants/adminGroups'
import { denyFinanceOnlyUnlessWhitelisted } from '@/utilities/financeRoleAccess'
import { isSuperAdminLikeUser } from '@/utilities/isSuperAdminLikeUser'
import { superAdminPasses } from '@/utilities/superAdminPasses'

export const SiteQuotas: CollectionConfig = {
  slug: 'site-quotas',
  labels: { singular: '站点配额', plural: '站点配额' },
  admin: {
    group: adminGroups.operations,
    useAsTitle: 'name',
    defaultColumns: ['name', 'site', 'updatedAt'],
    hidden: ({ user }) => !isSuperAdminLikeUser(user),
  },
  access: {
    read: denyFinanceOnlyUnlessWhitelisted('site-quotas', superAdminPasses(() => false)),
    create: denyFinanceOnlyUnlessWhitelisted('site-quotas', superAdminPasses(() => false)),
    update: denyFinanceOnlyUnlessWhitelisted('site-quotas', superAdminPasses(() => false)),
    delete: denyFinanceOnlyUnlessWhitelisted('site-quotas', superAdminPasses(() => false)),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'site',
      type: 'relationship',
      relationTo: 'sites',
      required: true,
    },
    {
      name: 'maxPublishedPages',
      type: 'number',
      admin: { description: 'Cap on published pages for this site (0 = unlimited).' },
      defaultValue: 0,
    },
    {
      name: 'maxMonthlyAiRuns',
      type: 'number',
      admin: { description: 'Cap on automated/AI job runs per month (0 = unlimited).' },
      defaultValue: 0,
    },
    {
      name: 'dailyPostCap',
      type: 'number',
      defaultValue: 3,
      admin: { description: 'Max new posts per day (content calendar).' },
    },
    { name: 'monthlyTokenBudgetUsd', type: 'number', defaultValue: 50 },
    { name: 'monthlyImagesBudgetUsd', type: 'number', defaultValue: 30 },
    { name: 'monthlyDfsCreditBudget', type: 'number', defaultValue: 100 },
    { name: 'usageYtd', type: 'json', admin: { description: 'Optional counters: dfs, tavily, openrouter, images' } },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
}
