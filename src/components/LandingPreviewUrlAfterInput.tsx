'use client'

import { ExternalLinkIcon } from '@payloadcms/ui'
import { useField } from '@payloadcms/ui/forms/useField'
import React from 'react'

/** Renders under `landing-templates.previewUrl` — opens stored public URL in a new tab. */
export function LandingPreviewUrlAfterInput() {
  const { value } = useField<string>({})
  const trimmed = typeof value === 'string' ? value.trim() : ''
  const canOpen = /^https?:\/\//i.test(trimmed)

  if (!trimmed) {
    return (
      <p
        style={{
          margin: '0.5rem 0 0',
          fontSize: '0.875rem',
          color: 'var(--theme-elevation-500)',
        }}
      >
        填写完整前台 URL 后，可在此打开预览（须为已选用本模版的站点页面）。
      </p>
    )
  }

  if (!canOpen) {
    return (
      <p
        style={{
          margin: '0.5rem 0 0',
          fontSize: '0.875rem',
          color: 'var(--theme-error-500)',
        }}
      >
        请以 http:// 或 https:// 开头。
      </p>
    )
  }

  return (
    <p style={{ margin: '0.5rem 0 0' }}>
      <a
        href={trimmed}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
      >
        <ExternalLinkIcon />
        在新标签页打开预览
      </a>
    </p>
  )
}
