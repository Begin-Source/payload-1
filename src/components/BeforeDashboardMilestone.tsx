'use client'

import React from 'react'

/**
 * Placeholder for future 财务看板 / 运营看板 widgets. Replace with charts when PRD is ready.
 */
export function BeforeDashboardMilestone(): React.ReactElement {
  return (
    <div
      style={{
        marginBottom: '1.5rem',
        padding: '1rem 1.25rem',
        borderRadius: 6,
        border: '1px solid var(--theme-elevation-150)',
        background: 'var(--theme-elevation-50)',
      }}
    >
      <strong>首页里程碑</strong>
      <p style={{ margin: '0.5rem 0 0', opacity: 0.85 }}>
        财务看板与运营看板将在此区域扩展；通知公告请在侧栏「首页」→「通知公告」中维护（系统公告与团队公告）。
      </p>
    </div>
  )
}
