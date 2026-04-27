'use client'

import React from 'react'

/** Payload list Cell props (subset; aligns with admin.components.Cell). */
type DomainWorkflowStatusCellProps = {
  cellData?: unknown
  rowData?: unknown
  className?: string
}

type WorkflowStatus = 'idle' | 'running' | 'done' | 'error'

const LABEL: Record<WorkflowStatus, string> = {
  idle: '空闲',
  running: '运行中',
  done: '已完成',
  error: '错误',
}

const STYLE: Record<
  WorkflowStatus,
  { background: string; color: string; border: string }
> = {
  idle: {
    background: 'var(--theme-elevation-100)',
    color: 'var(--theme-elevation-800)',
    border: '1px solid var(--theme-elevation-150)',
  },
  running: {
    background: '#ca8a04',
    color: '#ffffff',
    border: '1px solid #a16207',
  },
  done: {
    background: '#16a34a',
    color: '#ffffff',
    border: '1px solid #15803d',
  },
  error: {
    background: '#dc2626',
    color: '#ffffff',
    border: '1px solid #b91c1c',
  },
}

function normalizeStatus(raw: unknown): WorkflowStatus {
  const s = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  if (s === 'running' || s === 'done' || s === 'error' || s === 'idle') return s
  return 'idle'
}

export function DomainWorkflowStatusCell(props: DomainWorkflowStatusCellProps): React.ReactElement {
  const row = props.rowData as Record<string, unknown> | undefined
  const fromCell = props.cellData
  const fromRow = row?.domainWorkflowStatus
  const status = normalizeStatus(fromCell !== undefined && fromCell !== null ? fromCell : fromRow)
  const label = LABEL[status]
  const st = STYLE[status]

  return (
    <span
      className={props.className}
      style={{
        display: 'inline-block',
        padding: '0.2rem 0.55rem',
        borderRadius: 6,
        fontSize: '0.8125rem',
        fontWeight: 600,
        lineHeight: 1.35,
        ...st,
      }}
    >
      {label}
    </span>
  )
}
