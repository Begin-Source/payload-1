const DEFAULT_BASE = 'https://openrouter.ai/api/v1'

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export async function openrouterChat(
  model: string,
  messages: ChatMessage[],
  init?: { signal?: AbortSignal; responseFormatJson?: boolean },
): Promise<string> {
  const key = process.env.OPENAI_API_KEY?.trim() || process.env.OPENROUTER_API_KEY?.trim()
  if (!key) {
    throw new Error('Set OPENAI_API_KEY or OPENROUTER_API_KEY for OpenRouter')
  }
  const base = (process.env.OPENAI_BASE_URL || process.env.OPENROUTER_BASE_URL || DEFAULT_BASE).replace(
    /\/$/,
    '',
  )
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      ...(init?.responseFormatJson
        ? { response_format: { type: 'json_object' } }
        : {}),
    }),
    signal: init?.signal,
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`OpenRouter ${res.status}: ${t.slice(0, 500)}`)
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const text = data.choices?.[0]?.message?.content
  if (!text) {
    throw new Error('OpenRouter: empty response')
  }
  return text
}
