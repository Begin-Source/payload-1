'use client'

import { Button, useSelection } from '@payloadcms/ui'
import React, { useRef, useSyncExternalStore } from 'react'

import {
  getCsvPanelOpen,
  setCsvPanelOpen,
  subscribeCsvPanelOpen,
} from '@/components/csvPanelOpenStore'

const SLUG = 'landing-templates'

const LANDING_HINT =
  '列：id, name, slug, description, preview_url, tenant_id, site_layout, 落地页/博客/侧栏字段, ReviewHub 字段, footer_resource_links_json, t1_locale_json。无站点；在列表勾选后点「导出」仅导出已选行，不勾选则导出当前可访问租户内全部整站模版。导入依赖左上角租户或请求 tenantId；新建写入该租户，有 id 则更新同租户下记录。'

function downloadBlob(res: Response, fallbackName: string): void {
  const blob = res.blob()
  void blob.then((b) => {
    const cd = res.headers.get('Content-Disposition')
    const match = cd?.match(/filename="([^"]+)"/)
    const name = match?.[1] ?? fallbackName
    const a = document.createElement('a')
    a.href = URL.createObjectURL(b)
    a.download = name
    a.click()
    URL.revokeObjectURL(a.href)
  })
}

function selectedIdsNumeric(getSelectedIds: () => (number | string)[]): number[] {
  const raw = getSelectedIds()
  const out: number[] = []
  const seen = new Set<number>()
  for (const id of raw) {
    const n = typeof id === 'number' ? id : Number(id)
    if (Number.isFinite(n) && !seen.has(n)) {
      seen.add(n)
      out.push(n)
    }
  }
  return out
}

/**
 * 站点模版 CSV：位于 `afterListTable`，以便在 `SelectionProvider` 内使用 `useSelection`（按勾选导出）。
 */
export function LandingTemplatesCsvAfterTable(): React.ReactElement | null {
  const { getSelectedIds } = useSelection()
  const expanded = useSyncExternalStore(
    (onChange) => subscribeCsvPanelOpen(SLUG, onChange),
    () => getCsvPanelOpen(SLUG),
    () => false,
  )

  const fileRef = useRef<HTMLInputElement>(null)

  const closePanel = (): void => {
    setCsvPanelOpen(SLUG, false)
  }

  const runExport = async (): Promise<void> => {
    const base = `/api/admin/${SLUG}/csv-export`
    const u = new URL(base, window.location.origin)
    const ids = selectedIdsNumeric(getSelectedIds)
    if (ids.length > 0) {
      u.searchParams.set('ids', ids.join(','))
    }
    try {
      const res = await fetch(u.toString(), { credentials: 'include' })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(typeof err.error === 'string' ? err.error : '导出失败')
      }
      downloadBlob(res, `${SLUG}-export.csv`)
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '导出失败')
    }
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const base = `/api/admin/${SLUG}/csv-import`
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch(base, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      })
      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        created?: number
        updated?: number
        errors?: { row: number; message: string }[]
      }
      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : '导入失败')
      }
      const errs = data.errors ?? []
      const parts: string[] = []
      if (data.created != null) parts.push(`创建 ${data.created} 条`)
      if (data.updated != null) parts.push(`更新 ${data.updated} 条`)
      const msg = `${parts.join('，')}${
        errs.length > 0
          ? `\n\n部分行失败：\n${errs.map((x) => `第 ${x.row} 行: ${x.message}`).join('\n')}`
          : ''
      }`
      window.alert(msg || '完成')
    } catch (err) {
      window.alert(err instanceof Error ? err.message : '导入失败')
    }
  }

  if (!expanded) {
    return null
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div
        style={{
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: 8,
          padding: '0.75rem 1rem',
          background: 'var(--theme-elevation-50)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.65rem',
            gap: '0.5rem',
          }}
        >
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>整站模版 CSV 导入/导出</span>
          <Button buttonStyle="transparent" onClick={closePanel} size="small" type="button">
            关闭 CSV 导入/导出
          </Button>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '0.5rem',
            width: '100%',
            marginBottom: '0.65rem',
          }}
        >
          <span style={{ fontSize: '0.75rem', opacity: 0.85, marginRight: 4 }}>
            不选行则导出当前可访问租户内全部；勾选多行后导出仅含选中的行。
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
            <Button
              buttonStyle="secondary"
              onClick={() => void runExport()}
              size="small"
              type="button"
            >
              导出
            </Button>
            <span style={{ fontSize: '0.8125rem', opacity: 0.85 }}>导入</span>
            <input
              ref={fileRef}
              accept=".csv,text/csv"
              style={{ display: 'none' }}
              type="file"
              onChange={(e) => void onFile(e)}
            />
            <Button
              buttonStyle="secondary"
              onClick={() => fileRef.current?.click()}
              size="small"
              type="button"
            >
              选择文件…
            </Button>
          </div>
        </div>

        <p style={{ fontSize: '0.7rem', opacity: 0.65, margin: '0.5rem 0 0' }}>{LANDING_HINT}</p>
      </div>
    </div>
  )
}
