import { isPipelineUnauthorized, requirePipelineJson } from '@/app/api/pipeline/lib/auth'

export const dynamic = 'force-dynamic'
const PATH = '/api/pipeline/meta-ab-pick'

/** 钉子 5：14 天后按 GSC CTR 占位择优（未接 GSC 时默认保留 A）。 */
export async function POST(request: Request): Promise<Response> {
  const g = requirePipelineJson(request, PATH)
  if (isPipelineUnauthorized(g)) {
    return g.response
  }
  const body = (await request.json().catch(() => ({}))) as { articleId?: string }
  return Response.json({
    ok: true,
    placeholder: true,
    articleId: body.articleId ?? null,
    winnerVariantId: 'a',
    note: 'Connect Search Console CTR; compare variants over experimentDays window.',
    handoff: { status: 'DONE', recommendedNextSkill: '' },
  })
}
