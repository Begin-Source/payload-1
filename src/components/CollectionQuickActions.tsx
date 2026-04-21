'use client'

import { Button } from '@payloadcms/ui'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import type { WorkflowQuickKind } from '@/utilities/workflowQuickCreate'

type SiteOption = {
  id: number
  name: string
  slug: string
  primaryDomain: string
}

type CategoryOption = {
  id: number
  name: string
  slug: string
  description: string | null
}

function formatSiteLine(s: SiteOption): string {
  return `${s.name} (${s.slug}) ${s.primaryDomain}`
}

const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 10000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
  background: 'rgba(0, 0, 0, 0.45)',
}

const panelStyle: React.CSSProperties = {
  width: 'min(32rem, 100%)',
  maxHeight: '90vh',
  overflow: 'auto',
  borderRadius: 8,
  border: '1px solid var(--theme-elevation-150)',
  background: 'var(--theme-elevation-0)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  padding: '1.25rem 1.5rem',
}

const fieldLabel: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  marginBottom: '0.35rem',
  opacity: 0.85,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.65rem',
  borderRadius: 4,
  border: '1px solid var(--theme-elevation-150)',
  background: 'var(--theme-elevation-50)',
  color: 'inherit',
  fontSize: '0.875rem',
}

const UI: Record<
  WorkflowQuickKind,
  {
    buttonText: string
    title: string
    description: string
    topicLabel: string
    topicPlaceholder: string
    submitLabel: string
    showCategories: boolean
  }
> = {
  articles: {
    buttonText: '快捷操作 · 文章',
    title: '快捷操作 · 文章',
    description: '选定站点与可选分类后，发起「生成文章」工作流；主题会与分类说明合并传给后端。',
    topicLabel: '文章主题 / 要点（可选）',
    topicPlaceholder: '留空则由系统选题',
    submitLabel: '写文章（生成文章工作流）',
    showCategories: true,
  },
  pages: {
    buttonText: '快捷操作 · 页面',
    title: '快捷操作 · 页面',
    description: '选定站点与可选分类后，发起「生成页面」工作流；主题会与分类说明合并传给后端。',
    topicLabel: '页面主题 / 要点（可选）',
    topicPlaceholder: '留空则由系统选题',
    submitLabel: '生成页面（工作流）',
    showCategories: true,
  },
  categories: {
    buttonText: '快捷操作 · 分类',
    title: '快捷操作 · 分类',
    description: '选定站点与可选分类后，发起与分类相关的工作流；要点会与分类说明合并传给后端。',
    topicLabel: '说明 / 要点（可选）',
    topicPlaceholder: '留空则由系统根据上下文处理',
    submitLabel: '发起分类工作流',
    showCategories: true,
  },
  keywords: {
    buttonText: '快捷操作 · 关键词',
    title: '快捷操作 · 关键词',
    description: '选定站点后，发起关键词相关的工作流；可填写种子词或要点。',
    topicLabel: '要点 / 种子词（可选）',
    topicPlaceholder: '留空则由系统拓展',
    submitLabel: '发起关键词工作流',
    showCategories: false,
  },
  'site-blueprints': {
    buttonText: '快捷操作 · 设计',
    title: '快捷操作 · 设计',
    description:
      '选定站点与可选分类后，发起与设计 / 站点蓝图相关的工作流；要点会与分类说明合并传给后端。',
    topicLabel: '设计说明 / 要点（可选）',
    topicPlaceholder: '留空则由系统根据上下文处理',
    submitLabel: '发起设计工作流',
    showCategories: true,
  },
  media: {
    buttonText: '快捷操作 · 媒体库',
    title: '快捷操作 · 媒体库',
    description: '选定站点后，发起与媒体处理相关的工作流；可填写要点或说明。',
    topicLabel: '要点 / 说明（可选）',
    topicPlaceholder: '留空则由系统处理',
    submitLabel: '发起媒体工作流',
    showCategories: false,
  },
}

function WorkflowQuickActionModal({ kind }: { kind: WorkflowQuickKind }): React.ReactElement {
  const ui = UI[kind]
  const [open, setOpen] = useState(false)
  const [siteQuery, setSiteQuery] = useState('')
  const [sites, setSites] = useState<SiteOption[]>([])
  const [sitesLoading, setSitesLoading] = useState(false)
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null)
  const [selectedSiteLabel, setSelectedSiteLabel] = useState('')
  const [siteMenuOpen, setSiteMenuOpen] = useState(false)
  const siteComboboxRef = useRef<HTMLDivElement>(null)
  const skipSiteQueryDebounceRef = useRef(false)

  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])

  const [topic, setTopic] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadSites = useCallback(async (q: string) => {
    setSitesLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      const res = await fetch(`/api/admin/article-quick-action/options?${params}`, {
        credentials: 'include',
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: unknown }
        throw new Error(typeof err.error === 'string' ? err.error : '加载站点失败')
      }
      const data = (await res.json()) as { sites: SiteOption[] }
      setSites(data.sites ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载站点失败')
      setSites([])
    } finally {
      setSitesLoading(false)
    }
  }, [])

  const loadCategories = useCallback(async (siteId: number) => {
    setCategoriesLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/admin/article-quick-action/options?siteId=${encodeURIComponent(String(siteId))}`,
        { credentials: 'include' },
      )
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: unknown }
        throw new Error(typeof err.error === 'string' ? err.error : '加载分类失败')
      }
      const data = (await res.json()) as { categories: CategoryOption[] }
      setCategories(data.categories ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载分类失败')
      setCategories([])
    } finally {
      setCategoriesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open || !siteMenuOpen) return
    if (skipSiteQueryDebounceRef.current) {
      skipSiteQueryDebounceRef.current = false
      return
    }
    const t = window.setTimeout(() => {
      void loadSites(siteQuery)
    }, 300)
    return () => window.clearTimeout(t)
  }, [open, siteMenuOpen, siteQuery, loadSites])

  useEffect(() => {
    if (!ui.showCategories) {
      setCategories([])
      setSelectedCategoryIds([])
      return
    }
    if (selectedSiteId == null) {
      setCategories([])
      setSelectedCategoryIds([])
      return
    }
    void loadCategories(selectedSiteId)
    setSelectedCategoryIds([])
  }, [selectedSiteId, loadCategories, ui.showCategories])

  useEffect(() => {
    if (!siteMenuOpen) return
    const onDocMouseDown = (e: MouseEvent): void => {
      const root = siteComboboxRef.current
      if (root && !root.contains(e.target as Node)) {
        setSiteMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [siteMenuOpen])

  useEffect(() => {
    if (!siteMenuOpen) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setSiteMenuOpen(false)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [siteMenuOpen])

  const close = (): void => {
    setOpen(false)
    setSiteQuery('')
    setSites([])
    setSelectedSiteId(null)
    setSelectedSiteLabel('')
    setSiteMenuOpen(false)
    setCategories([])
    setSelectedCategoryIds([])
    setTopic('')
    setError(null)
    setSuccess(null)
  }

  const pickSite = (s: SiteOption): void => {
    setSelectedSiteId(s.id)
    setSelectedSiteLabel(formatSiteLine(s))
    setSiteQuery('')
    setSiteMenuOpen(false)
  }

  const clearSiteSelection = (): void => {
    setSelectedSiteId(null)
    setSelectedSiteLabel('')
    setSiteQuery('')
    void loadSites('')
  }

  const toggleCategory = (id: number): void => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const submit = async (): Promise<void> => {
    if (selectedSiteId == null) {
      setError('请选择站点')
      return
    }
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/admin/workflow-quick-action', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          siteId: selectedSiteId,
          categoryIds:
            ui.showCategories && selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
          topic: topic.trim() || undefined,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string; id?: number }
      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : '提交失败')
      }
      setSuccess(`已创建工作流任务 #${data.id ?? ''}`)
      window.setTimeout(() => {
        close()
      }, 1200)
    } catch (e) {
      setError(e instanceof Error ? e.message : '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  const titleId = `quick-action-title-${kind}`

  return (
    <>
      <Button buttonStyle="secondary" onClick={() => setOpen(true)} size="small">
        {ui.buttonText}
      </Button>

      {open ? (
        <div aria-modal aria-labelledby={titleId} role="dialog" style={backdropStyle}>
          <button
            aria-label="关闭"
            style={{
              position: 'absolute',
              inset: 0,
              border: 'none',
              padding: 0,
              margin: 0,
              cursor: 'default',
              background: 'transparent',
            }}
            type="button"
            onClick={close}
          />
          <div style={{ ...panelStyle, position: 'relative', zIndex: 1 }}>
            <h2 id={titleId} style={{ margin: '0 0 0.75rem', fontSize: '1.125rem', fontWeight: 600 }}>
              {ui.title}
            </h2>
            <p style={{ margin: '0 0 1rem', fontSize: '0.8125rem', opacity: 0.85, lineHeight: 1.5 }}>
              {ui.description}
            </p>

            {error ? (
              <p style={{ color: 'var(--theme-error-500)', fontSize: '0.8125rem', marginBottom: '0.75rem' }}>
                {error}
              </p>
            ) : null}
            {success ? (
              <p style={{ color: 'var(--theme-success-500)', fontSize: '0.8125rem', marginBottom: '0.75rem' }}>
                {success}
              </p>
            ) : null}

            <div ref={siteComboboxRef} style={{ marginBottom: '1rem', position: 'relative' }}>
              <span style={fieldLabel} id={`${kind}-site-label`}>
                站点
              </span>
              <button
                aria-expanded={siteMenuOpen}
                aria-haspopup="listbox"
                aria-labelledby={`${kind}-site-label`}
                style={{
                  ...inputStyle,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  width: '100%',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                type="button"
                onClick={() => {
                  setSiteMenuOpen((prev) => {
                    const next = !prev
                    if (next) {
                      skipSiteQueryDebounceRef.current = true
                      void loadSites(siteQuery)
                    }
                    return next
                  })
                }}
              >
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                    opacity: selectedSiteId == null ? 0.55 : 1,
                  }}
                >
                  {selectedSiteId == null ? '请选择站点' : selectedSiteLabel}
                </span>
                <span aria-hidden style={{ flexShrink: 0, opacity: 0.65, fontSize: '0.65rem' }}>
                  {siteMenuOpen ? '▲' : '▼'}
                </span>
              </button>

              {siteMenuOpen ? (
                <div
                  role="listbox"
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: '100%',
                    marginTop: 4,
                    zIndex: 5,
                    borderRadius: 6,
                    border: '1px solid var(--theme-elevation-150)',
                    background: 'var(--theme-elevation-50)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                    padding: '0.5rem',
                    maxHeight: 280,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <input
                    aria-label="筛选站点"
                    autoComplete="off"
                    placeholder="输入名称、slug 或域名筛选…"
                    style={inputStyle}
                    type="search"
                    value={siteQuery}
                    onChange={(e) => setSiteQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div style={{ maxHeight: 200, overflow: 'auto', margin: '0 -0.25rem' }}>
                    <button
                      aria-selected={false}
                      role="option"
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.45rem 0.5rem',
                        border: 'none',
                        borderRadius: 4,
                        background: 'transparent',
                        color: 'inherit',
                        cursor: 'pointer',
                        fontSize: '0.8125rem',
                        opacity: 0.9,
                      }}
                      type="button"
                      onClick={() => clearSiteSelection()}
                    >
                      清空选择
                    </button>
                    {sitesLoading ? (
                      <span style={{ fontSize: '0.75rem', opacity: 0.7, padding: '0.25rem 0.5rem' }}>
                        加载中…
                      </span>
                    ) : (
                      sites.map((s) => (
                        <button
                          key={s.id}
                          role="option"
                          aria-selected={selectedSiteId === s.id}
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            padding: '0.45rem 0.5rem',
                            border: 'none',
                            borderRadius: 4,
                            background:
                              selectedSiteId === s.id
                                ? 'var(--theme-elevation-100)'
                                : 'transparent',
                            color: 'inherit',
                            cursor: 'pointer',
                            fontSize: '0.8125rem',
                          }}
                          type="button"
                          onClick={() => pickSite(s)}
                        >
                          {formatSiteLine(s)}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {ui.showCategories ? (
              <div style={{ marginBottom: '1rem' }}>
                <span style={fieldLabel}>分类（可选）</span>
                {selectedSiteId == null ? (
                  <div style={{ ...inputStyle, opacity: 0.6 }}>请先选择站点</div>
                ) : categoriesLoading ? (
                  <div style={inputStyle}>加载中…</div>
                ) : categories.length === 0 ? (
                  <div style={{ ...inputStyle, opacity: 0.75 }}>暂无分类</div>
                ) : (
                  <div
                    style={{
                      ...inputStyle,
                      maxHeight: 160,
                      overflow: 'auto',
                      padding: '0.35rem',
                    }}
                  >
                    {categories.map((c) => (
                      <label
                        key={c.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.5rem',
                          padding: '0.25rem 0',
                          cursor: 'pointer',
                          fontSize: '0.8125rem',
                        }}
                      >
                        <input
                          checked={selectedCategoryIds.includes(c.id)}
                          type="checkbox"
                          onChange={() => toggleCategory(c.id)}
                        />
                        <span>
                          {c.name}
                          <span style={{ opacity: 0.65 }}> ({c.slug})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            <div style={{ marginBottom: '1.25rem' }}>
              <span style={fieldLabel}>{ui.topicLabel}</span>
              <textarea
                placeholder={ui.topicPlaceholder}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Button buttonStyle="secondary" disabled={submitting} onClick={close}>
                关闭
              </Button>
              <Button disabled={submitting || selectedSiteId == null} onClick={() => void submit()}>
                {ui.submitLabel}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export function ArticleListQuickAction(): React.ReactElement {
  return <WorkflowQuickActionModal kind="articles" />
}

export function PageListQuickAction(): React.ReactElement {
  return <WorkflowQuickActionModal kind="pages" />
}

export function CategoryListQuickAction(): React.ReactElement {
  return <WorkflowQuickActionModal kind="categories" />
}

export function KeywordListQuickAction(): React.ReactElement {
  return <WorkflowQuickActionModal kind="keywords" />
}

export function DesignListQuickAction(): React.ReactElement {
  return <WorkflowQuickActionModal kind="site-blueprints" />
}

export function MediaListQuickAction(): React.ReactElement {
  return <WorkflowQuickActionModal kind="media" />
}
