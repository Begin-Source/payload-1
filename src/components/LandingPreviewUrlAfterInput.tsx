'use client'

import { ExternalLinkIcon, useField } from '@payloadcms/ui'
import React from 'react'

type Props = {
  /** Injected by Payload `renderField` clientProps for `afterInput`. */
  path?: string
}

/**
 * Renders under `landing-templates.previewUrl` — opens stored public URL in a new tab.
 * Import `useField` from the main `@payloadcms/ui` barrel so the same `RootConfigContext`
 * instance as the Admin shell is used (deep `@payloadcms/ui/forms/useField` can duplicate
 * the context module and make `useConfig()` undefined).
 */
export function LandingPreviewUrlAfterInput({ path: pathProp }: Props) {
  const { value } = useField<string>({ path: pathProp ?? 'previewUrl' })
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
