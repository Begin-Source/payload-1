'use client'

import React from 'react'

import {
  WorkflowStatusBadge,
  normalizeWorkflowStatus,
} from '@/components/workflowStatusBadge'

type DesignWorkflowStatusCellProps = {
  cellData?: unknown
  rowData?: unknown
  className?: string
}

export function DesignWorkflowStatusCell(props: DesignWorkflowStatusCellProps): React.ReactElement {
  const row = props.rowData as Record<string, unknown> | undefined
  const fromCell = props.cellData
  const fromRow = row?.designWorkflowStatus
  const status = normalizeWorkflowStatus(
    fromCell !== undefined && fromCell !== null ? fromCell : fromRow,
  )

  return <WorkflowStatusBadge className={props.className} status={status} />
}
