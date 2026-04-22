import type { GenerationModel } from '@ai-stack/payloadcms/types'

type OpenRouterModelItem = {
  id: string
  name?: string
}

type OpenRouterModelsResponse = {
  data?: OpenRouterModelItem[]
}

const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models'
const TARGET_MODEL_IDS = new Set(['Oai-text', 'Oai-object'])

export type OpenRouterModelOption = { label: string; value: string }

type FetchArgs = {
  /** Next.js production build — skip. */
  isNextBuild: boolean
  /** Payload/CLI (migrate, generate:types) — skip network. */
  isCli: boolean
}

/**
 * When `OPENAI_BASE_URL` points at OpenRouter, fetches the public model list (same key as
 * `OPENAI_API_KEY` — your OpenRouter key). Used to populate Payload AI plugin text model selects.
 */
export async function fetchOpenRouterModelOptions(
  args: FetchArgs,
): Promise<OpenRouterModelOption[] | null> {
  if (args.isNextBuild || args.isCli) {
    return null
  }
  const base = process.env.OPENAI_BASE_URL?.trim().toLowerCase() ?? ''
  if (!base.includes('openrouter')) {
    return null
  }
  const key = process.env.OPENAI_API_KEY?.trim()
  if (!key) {
    return null
  }

  try {
    const res = await fetch(OPENROUTER_MODELS_URL, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) {
      console.warn(
        `[openRouter] OpenRouter /models returned ${res.status} ${res.statusText}; using plugin default model lists.`,
      )
      return null
    }
    const json = (await res.json()) as OpenRouterModelsResponse
    const list = json.data
    if (!list?.length) {
      return null
    }
    return list
      .map((m) => ({
        value: m.id,
        label: m.name?.trim() || m.id,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'en'))
  } catch (e) {
    console.warn('[openRouter] Failed to fetch OpenRouter model list; using plugin defaults.', e)
    return null
  }
}

type SelectLikeField = {
  name?: string
  type?: string
  defaultValue?: string
  options?: unknown
  fields?: SelectLikeField[]
}

function isModelSelectField(f: SelectLikeField): boolean {
  return f.type === 'select' && f.name === 'model'
}

function mapFieldsReplaceModelSelect(
  fields: SelectLikeField[] | undefined,
  options: OpenRouterModelOption[],
): SelectLikeField[] | undefined {
  if (!fields) return fields
  const values = options.map((o) => o.value)
  const first = values[0]
  return fields.map((field) => {
    if (isModelSelectField(field)) {
      const current = field.defaultValue
      const nextDefault =
        current && values.includes(String(current)) ? String(current) : (first ?? 'gpt-4o-mini')
      return {
        ...field,
        options: options.map((o) => ({ label: o.label, value: o.value })),
        defaultValue: nextDefault,
      }
    }
    if (field.type === 'row' && field.fields) {
      return { ...field, fields: mapFieldsReplaceModelSelect(field.fields, options) ?? field.fields }
    }
    return field
  })
}

/**
 * Injects OpenRouter `model` select options for OpenAI text + richText JSON models only.
 * Does not mutate the original `defaults` array (handlers preserved).
 */
export function applyOpenRouterToGenerationModels(
  defaults: GenerationModel[],
  openRouterOptions: OpenRouterModelOption[] | null,
): GenerationModel[] {
  if (!openRouterOptions?.length) {
    return defaults
  }
  return defaults.map((m) => {
    if (!TARGET_MODEL_IDS.has(m.id)) {
      return m
    }
    const settings = m.settings
    if (!settings || settings.type !== 'group' || !('fields' in settings)) {
      return m
    }
    const group = settings as { type: 'group'; fields: SelectLikeField[]; [k: string]: unknown }
    const nextFields = mapFieldsReplaceModelSelect(group.fields, openRouterOptions)
    if (!nextFields) {
      return m
    }
    return {
      ...m,
      settings: {
        ...group,
        fields: nextFields,
      },
    } as GenerationModel
  })
}
