import { isPipelineUnauthorized, requirePipelineJson } from '@/app/api/pipeline/lib/auth'

export const dynamic = 'force-dynamic'
const PATH = '/api/pipeline/meta-ab-optimize'

/**
 * 钉子 5：产出 2–3 组 title/description 候选写入 `articles.metaVariants`（占位 JSON）。
 * 边缘随机与 GSC 择优在 `meta-ab-pick`。
 */
export async function POST(request: Request): Promise<Response> {
  const g = requirePipelineJson(request, PATH)
  if (isPipelineUnauthorized(g)) {
    return g.response
  }
  const body = (await request.json().catch(() => ({}))) as { articleId?: string; title?: string }
  const variants = [
    { id: 'a', title: `${body.title ?? 'Page'} — A`, description: 'Variant A description (placeholder).' },
    { id: 'b', title: `${body.title ?? 'Page'} — B`, description: 'Variant B description (placeholder).' },
    { id: 'c', title: `${body.title ?? 'Page'} — C`, description: 'Variant C description (placeholder).' },
  ]
  return Response.json({
    ok: true,
    placeholder: true,
    articleId: body.articleId ?? null,
    metaVariants: { startedAt: new Date().toISOString(), variants, experimentDays: 14 },
    handoff: {
      status: 'DONE',
      objective: 'Meta A/B candidates generated (placeholder)',
      recommendedNextSkill: 'performance-reporter',
    },
  })
}
