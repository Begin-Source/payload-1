'use client'

import { Button, PopupList } from '@payloadcms/ui'
import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

import {
  getCsvPanelOpen,
  setCsvPanelOpen,
  subscribeCsvPanelOpen,
} from '@/components/csvPanelOpenStore'

type SiteOption = {
  id: number
  name: string
  slug: string
  primaryDomain: string
}

const CSV_COLLECTION_SLUGS = [
  'articles',
  'keywords',
  'media',
  'pages',
  'categories',
  'site-blueprints',
] as const

type CsvCollection = (typeof CSV_COLLECTION_SLUGS)[number]

function isCsvCollectionSlug(s: string): s is CsvCollection {
  return (CSV_COLLECTION_SLUGS as readonly string[]).includes(s)
}

const boxStyle: React.CSSProperties = {
  padding: '0.5rem 0.65rem',
  borderRadius: 4,
  border: '1px solid var(--theme-elevation-150)',
  background: 'var(--theme-elevation-50)',
  color: 'inherit',
  fontSize: '0.875rem',
}

function formatSiteLine(s: SiteOption): string {
  return `${s.name} (${s.slug}) ${s.primaryDomain}`
}

function resolveCsvSlug(collectionSlug: string | undefined): CsvCollection {
  if (collectionSlug && isCsvCollectionSlug(collectionSlug)) {
    return collectionSlug
  }
  return 'articles'
}

function csvApiBase(slug: CsvCollection): string {
  return `/api/admin/${slug}`
}

/** 站点下拉 + 按站点导出/导入（与文章一致） */
function csvNeedsSite(slug: CsvCollection): boolean {
  return slug === 'articles' || slug === 'keywords' || slug === 'pages'
}

/** 导出全部 URL 带 ?all=1（仅站点级集合） */
function csvExportAllUsesAllParam(slug: CsvCollection): boolean {
  return slug === 'articles' || slug === 'keywords' || slug === 'pages'
}

export type CsvImportExportSlotProps = {
  collectionSlug?: string
}

/**
 * 三点菜单：切换「CSV 导入/导出」面板（与查找替换一致）。
 */
export function CsvImportExportListMenuItem(props: CsvImportExportSlotProps): React.ReactElement {
  const slug = resolveCsvSlug(props.collectionSlug)
  const open = useSyncExternalStore(
    (onChange) => subscribeCsvPanelOpen(slug, onChange),
    () => getCsvPanelOpen(slug),
    () => false,
  )
  return (
    <PopupList.Button
      id={`csv-panel-menu-${slug}`}
      onClick={() => setCsvPanelOpen(slug, !open)}
    >
      {open ? '关闭 CSV 导入/导出' : 'CSV 导入/导出'}
    </PopupList.Button>
  )
}

/**
 * 搜索栏下：CSV 面板（站点筛选 + 导出所选 / 导出全部 + 导入）。
 */
export function CsvImportExportPanel(props: CsvImportExportSlotProps): React.ReactElement | null {
  const slug = resolveCsvSlug(props.collectionSlug)
  const needsSite = csvNeedsSite(slug)

  const expanded = useSyncExternalStore(
    (onChange) => subscribeCsvPanelOpen(slug, onChange),
    () => getCsvPanelOpen(slug),
    () => false,
  )

  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null)
  const [siteQuery, setSiteQuery] = useState('')
  const [sites, setSites] = useState<SiteOption[]>([])
  const [sitesLoading, setSitesLoading] = useState(false)
  const [siteMenuOpen, setSiteMenuOpen] = useState(false)
  const siteWrapRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const loadSites = useCallback(async (q: string) => {
    setSitesLoading(true)
    try {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      const res = await fetch(`/api/admin/article-quick-action/options?${params}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('加载站点失败')
      const data = (await res.json()) as { sites: SiteOption[] }
      setSites(data.sites ?? [])
    } catch {
      setSites([])
    } finally {
      setSitesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!expanded || !needsSite || !siteMenuOpen) return
    const t = window.setTimeout((): void => {
      void loadSites(siteQuery)
    }, 300)
    return (): void => {
      window.clearTimeout(t)
    }
  }, [expanded, needsSite, siteMenuOpen, siteQuery, loadSites])

  useEffect(() => {
    if (!siteMenuOpen) return
    const onDown = (e: MouseEvent): void => {
      const el = siteWrapRef.current
      if (el && !el.contains(e.target as Node)) setSiteMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return (): void => {
      document.removeEventListener('mousedown', onDown)
    }
  }, [siteMenuOpen])

  useEffect(() => {
    if (!expanded || !needsSite) return
    void loadSites('')
  }, [expanded, needsSite, loadSites])

  const closePanel = (): void => {
    setCsvPanelOpen(slug, false)
  }

  const downloadBlob = (res: Response, fallbackName: string): void => {
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

  const runExportSelected = async (): Promise<void> => {
    if (!needsSite || selectedSiteId == null) {
      window.alert('请先选择站点')
      return
    }
    const base = csvApiBase(slug)
    try {
      const u = new URL(`${base}/csv-export`, window.location.origin)
      u.searchParams.set('siteId', String(selectedSiteId))
      const res = await fetch(u.toString(), { credentials: 'include' })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(typeof err.error === 'string' ? err.error : '导出失败')
      }
      downloadBlob(res, `${slug}-export.csv`)
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '导出失败')
    }
  }

  const runExportAll = async (): Promise<void> => {
    const base = csvApiBase(slug)
    try {
      const u = new URL(`${base}/csv-export`, window.location.origin)
      if (csvExportAllUsesAllParam(slug)) {
        u.searchParams.set('all', '1')
      }
      const res = await fetch(u.toString(), { credentials: 'include' })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(typeof err.error === 'string' ? err.error : '导出失败')
      }
      downloadBlob(res, `${slug}-all.csv`)
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '导出失败')
    }
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (needsSite && selectedSiteId == null) {
      window.alert('请先选择站点')
      return
    }
    const base = csvApiBase(slug)
    const fd = new FormData()
    fd.append('file', file)
    if (needsSite && selectedSiteId != null) {
      fd.append('siteId', String(selectedSiteId))
    }
    try {
      const res = await fetch(`${base}/csv-import`, {
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
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '导入失败')
    }
  }

  const hint =
    slug === 'articles'
      ? '列：id, slug, title, excerpt, status, publishedAt, body_json。不含分类与头图。'
      : slug === 'pages'
        ? '列：id, slug, title, excerpt, status, publishedAt, body_json。不含分类与头图。'
        : slug === 'keywords'
          ? '列：id, term, slug, notes, status, site_id。'
          : slug === 'media'
            ? '列：id, alt, filename, mimeType, filesize。导入仅更新 alt（需已有 id）。'
            : slug === 'categories'
              ? '列：id, name, slug, description, tenant_id。新建无 id 时需 tenant_id（多租户）或单租户自动归属。'
              : '列：id, name, slug, description, templateConfig_json, tenant_id。新建无 id 时需 tenant_id（多租户）或单租户自动归属。'

  if (!expanded) {
    return null
  }

  const selected = sites.find((s) => s.id === selectedSiteId)
  const selectedLabel =
    selectedSiteId == null ? '' : selected ? formatSiteLine(selected) : `#${selectedSiteId}`

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
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>CSV 导入/导出</span>
          <Button buttonStyle="transparent" onClick={closePanel} size="small" type="button">
            关闭 CSV 导入/导出
          </Button>
        </div>

        {needsSite ? (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '0.75rem',
              width: '100%',
              marginBottom: '0.65rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flex: '0 1 auto',
                minWidth: 0,
                maxWidth: 'min(100%, 28rem)',
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  opacity: 0.8,
                  whiteSpace: 'nowrap',
                }}
              >
                站点
              </span>
              <div ref={siteWrapRef} style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                <button
                  aria-expanded={siteMenuOpen}
                  style={{
                    ...boxStyle,
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  type="button"
                  onClick={() => {
                    setSiteMenuOpen((prev) => {
                      const next = !prev
                      if (next) void loadSites(siteQuery)
                      return next
                    })
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedSiteId == null
                      ? '输入名称、slug 或域名筛选…（选择站点后导出/导入）'
                      : selectedLabel}
                  </span>
                  <span aria-hidden style={{ opacity: 0.6, fontSize: '0.65rem' }}>
                    {siteMenuOpen ? '▲' : '▼'}
                  </span>
                </button>
                {siteMenuOpen ? (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: '100%',
                      marginTop: 4,
                      zIndex: 20,
                      borderRadius: 6,
                      border: '1px solid var(--theme-elevation-150)',
                      background: 'var(--theme-elevation-0)',
                      padding: '0.5rem',
                      maxHeight: 240,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    }}
                  >
                    <input
                      placeholder="输入名称、slug 或域名筛选…"
                      style={{ ...boxStyle, width: '100%', marginBottom: 8 }}
                      type="search"
                      value={siteQuery}
                      onChange={(e) => setSiteQuery(e.target.value)}
                    />
                    <div style={{ maxHeight: 160, overflow: 'auto' }}>
                      <button
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.35rem',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                        }}
                        type="button"
                        onClick={() => {
                          setSelectedSiteId(null)
                          setSiteQuery('')
                        }}
                      >
                        清空
                      </button>
                      {sitesLoading ? (
                        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>加载中…</span>
                      ) : (
                        sites.map((s) => (
                          <button
                            key={s.id}
                            style={{
                              display: 'block',
                              width: '100%',
                              textAlign: 'left',
                              padding: '0.35rem',
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                            }}
                            type="button"
                            onClick={() => {
                              setSelectedSiteId(s.id)
                              setSiteMenuOpen(false)
                              setSiteQuery('')
                            }}
                          >
                            {formatSiteLine(s)}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '0.5rem',
                flexShrink: 0,
                marginLeft: 'auto',
              }}
            >
              <Button
                buttonStyle="secondary"
                disabled={selectedSiteId == null}
                onClick={() => void runExportSelected()}
                size="small"
                type="button"
              >
                导出所选站点
              </Button>
              <Button onClick={() => void runExportAll()} size="small" type="button">
                导出全部
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
                disabled={selectedSiteId == null}
                onClick={() => fileRef.current?.click()}
                size="small"
                type="button"
              >
                选择文件…
              </Button>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.5rem',
              marginBottom: '0.65rem',
            }}
          >
            <Button onClick={() => void runExportAll()} size="small" type="button">
              导出全部
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
        )}

        <p style={{ fontSize: '0.7rem', opacity: 0.65, margin: '0.5rem 0 0' }}>{hint}</p>
      </div>
    </div>
  )
}
