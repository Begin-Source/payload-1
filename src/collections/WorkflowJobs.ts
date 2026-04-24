import type { CollectionConfig } from 'payload'

import { adminGroups } from '@/constants/adminGroups'
import { loggedInSuperAdminAccessFor } from '@/collections/shared/loggedInSuperAdminAccess'

export const WorkflowJobs: CollectionConfig = {
  slug: 'workflow-jobs',
  labels: { singular: '工作流任务', plural: '工作流任务' },
  admin: {
    group: adminGroups.operations,
    useAsTitle: 'label',
    defaultColumns: ['label', 'jobType', 'status', 'site', 'updatedAt'],
  },
  access: loggedInSuperAdminAccessFor('workflow-jobs'),
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
        { label: 'Keyword discover', value: 'keyword_discover' },
        { label: 'SERP audit', value: 'serp_audit' },
        { label: 'Brief generate', value: 'brief_generate' },
        { label: 'Draft skeleton', value: 'draft_skeleton' },
        { label: 'Draft section', value: 'draft_section' },
        { label: 'Draft finalize', value: 'draft_finalize' },
        { label: 'Image generate', value: 'image_generate' },
        { label: 'Amazon sync', value: 'amazon_sync' },
        { label: 'Backlink scan', value: 'backlink_scan' },
        { label: 'Rank track', value: 'rank_track' },
        { label: 'Alert eval', value: 'alert_eval' },
        { label: 'Triage', value: 'triage' },
        { label: 'Content audit', value: 'content_audit' },
        { label: 'Content refresh', value: 'content_refresh' },
        { label: 'Content merge', value: 'content_merge' },
        { label: 'Content archive', value: 'content_archive' },
        { label: 'Meta A/B optimize', value: 'meta_ab_optimize' },
        { label: 'Internal link inject', value: 'internal_link_inject' },
        { label: 'Internal link rewrite', value: 'internal_link_rewrite' },
        { label: 'Internal link reinforce', value: 'internal_link_reinforce' },
        { label: 'Anchor rewrite', value: 'anchor_rewrite' },
        { label: 'Competitor gap', value: 'competitor_gap' },
        { label: 'Domain audit', value: 'domain_audit' },
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
        { label: 'Needs input', value: 'needs_input' },
        { label: 'Failed partial', value: 'failed_partial' },
      ],
    },
    {
      name: 'parentJob',
      type: 'relationship',
      relationTo: 'workflow-jobs',
      label: 'Parent job (chain)',
    },
    { name: 'skillId', type: 'text' },
    {
      name: 'contentBrief',
      type: 'relationship',
      relationTo: 'content-briefs',
    },
    {
      name: 'pipelineKeyword',
      type: 'relationship',
      relationTo: 'keywords',
    },
    {
      name: 'handoff',
      type: 'json',
      admin: {
        description: 'Handoff: status, objective, keyFindings, evidence, openLoops, recommendedNextSkill, capApplied, scores…',
      },
    },
    {
      name: 'site',
      type: 'relationship',
      relationTo: 'sites',
    },
    {
      name: 'article',
      type: 'relationship',
      relationTo: 'articles',
      admin: {
        description: 'Optional target article for publish/AI jobs.',
      },
    },
    {
      name: 'page',
      type: 'relationship',
      relationTo: 'pages',
      admin: {
        description: 'Optional target page for publish/AI jobs.',
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
