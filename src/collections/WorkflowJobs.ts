import type { CollectionConfig } from 'payload'

import { adminGroups } from '@/constants/adminGroups'
import { superAdminPasses } from '@/utilities/superAdminPasses'

export const WorkflowJobs: CollectionConfig = {
  slug: 'workflow-jobs',
  labels: { singular: '工作流任务', plural: '工作流任务' },
  admin: {
    group: adminGroups.tasksAndAutomation,
    useAsTitle: 'label',
    defaultColumns: ['label', 'jobType', 'status', 'site', 'updatedAt'],
  },
  access: {
    read: superAdminPasses(({ req: { user } }) => Boolean(user)),
    create: superAdminPasses(({ req: { user } }) => Boolean(user)),
    update: superAdminPasses(({ req: { user } }) => Boolean(user)),
    delete: superAdminPasses(({ req: { user } }) => Boolean(user)),
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
    },
    {
      name: 'jobType',
      type: 'select',
      required: true,
      defaultValue: 'custom',
      options: [
        { label: 'Publish', value: 'publish' },
        { label: 'Sync', value: 'sync' },
        { label: 'AI generate', value: 'ai_generate' },
        { label: 'Custom', value: 'custom' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Running', value: 'running' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' },
      ],
    },
    {
      name: 'site',
      type: 'relationship',
      relationTo: 'sites',
    },
    {
      name: 'post',
      type: 'relationship',
      relationTo: 'posts',
      admin: {
        description: 'Optional target post for publish/AI jobs.',
      },
    },
    {
      name: 'input',
      type: 'json',
      label: 'Input payload',
    },
    {
      name: 'output',
      type: 'json',
      label: 'Output / result',
    },
    {
      name: 'startedAt',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'completedAt',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'errorMessage',
      type: 'textarea',
    },
  ],
}
