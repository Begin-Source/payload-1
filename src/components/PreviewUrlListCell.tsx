'use client'

import React from 'react'

type Props = {
  cellData?: unknown
}

/**
 * List view cell for `landing-templates.previewUrl`.
 * Payload passes `cellData` via `renderCell` clientProps (not `useCellProps` context).
 */
export function PreviewUrlListCell({ cellData }: Props) {
  const raw = cellData
  const href = typeof raw === 'string' ? raw.trim() : ''
  const ok = /^https?:\/\//i.test(href)

  if (!href) {
    return <span className="no-data">—</span>
  }

  if (!ok) {
    return <span title={href}>{href}</span>
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      title={href}
    >
      打开预览
    </a>
  )
}
