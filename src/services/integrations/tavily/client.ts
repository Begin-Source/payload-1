const DEFAULT_BASE = 'https://api.tavily.com'

export type TavilySearchParams = {
  query: string
  topic?: 'general' | 'news' | 'finance'
  search_depth?: 'basic' | 'advanced'
  include_raw_content?: boolean
  max_results?: number
}

export async function tavilySearch(
  params: TavilySearchParams,
  init?: { signal?: AbortSignal },
): Promise<unknown> {
  const key = process.env.TAVILY_API_KEY?.trim()
  if (!key) {
    throw new Error('TAVILY_API_KEY is not set')
  }
  const base = (process.env.TAVILY_BASE_URL || DEFAULT_BASE).replace(/\/$/, '')
  const res = await fetch(`${base}/search`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      api_key: key,
      query: params.query,
      topic: params.topic || 'general',
      search_depth: params.search_depth || 'advanced',
      include_raw_content: params.include_raw_content ?? true,
      max_results: params.max_results ?? 12,
    }),
    signal: init?.signal,
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`Tavily ${res.status}: ${t.slice(0, 500)}`)
  }
  return res.json()
}
