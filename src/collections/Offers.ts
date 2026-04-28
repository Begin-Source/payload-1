import type { CollectionConfig } from 'payload'

import { loggedInSuperAdminAccessFor } from '@/collections/shared/loggedInSuperAdminAccess'
import { adminGroups } from '@/constants/adminGroups'

export const Offers: CollectionConfig = {
  slug: 'offers',
  labels: { singular: 'Offer', plural: 'Offer' },
  admin: {
    group: adminGroups.business,
    useAsTitle: 'title',
    defaultColumns: ['title', 'network', 'status', 'updatedAt'],
  },
  access: loggedInSuperAdminAccessFor('offers'),
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      index: true,
    },
    {
      name: 'network',
      type: 'relationship',
      relationTo: 'affiliate-networks',
      required: true,
    },
    {
      name: 'sites',
      type: 'relationship',
      relationTo: 'sites',
      hasMany: true,
      admin: { description: 'Sites allowed to promote this offer (optional).' },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: {
        description: '用于 /products 与 /categories/[slug] 中按分类展示。',
      },
      filterOptions: ({ data }) => {
        const raw = data?.sites
        const ids = Array.isArray(raw)
          ? raw.map((s) => (typeof s === 'number' ? s : (s as { id?: number }).id)).filter(Boolean)
          : []
        return ids.length ? { site: { in: ids } } : true
      },
    },
    {
      name: 'featuredOnHomeForSites',
      type: 'relationship',
      relationTo: 'sites',
      hasMany: true,
      admin: {
        description: '勾选的站点会在首页 Featured 区展示该 offer。',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
      ],
    },
    {
      name: 'externalId',
      type: 'text',
      label: 'External / network offer ID',
    },
    {
      name: 'targetUrl',
      type: 'text',
      label: 'Tracking or landing URL',
    },
    {
      name: 'commissionNotes',
      type: 'textarea',
      label: 'Commission terms (free text)',
    },
    {
      type: 'group',
      name: 'amazon',
      label: 'Amazon / merchant',
      fields: [
        { name: 'asin', type: 'text', index: true },
        { name: 'priceCents', type: 'number' },
        { name: 'currency', type: 'text', defaultValue: 'USD' },
        { name: 'ratingAvg', type: 'number' },
        { name: 'reviewCount', type: 'number' },
        { name: 'imageUrl', type: 'text' },
        { name: 'primeEligible', type: 'checkbox', defaultValue: false },
        { name: 'merchantLastSyncedAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
        { name: 'merchantRaw', type: 'json' },
      ],
    },
  ],
}
