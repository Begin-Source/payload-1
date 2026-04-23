import { isPipelineUnauthorized, requirePipelineJson } from '@/app/api/pipeline/lib/auth'
import { dataForSeoPost, keywordDataLocationAndLanguage } from '@/services/integrations/dataforseo/client'

export const dynamic = 'force-dynamic'
const PATH = '/api/pipeline/rank-track'

export async function POST(request: Request): Promise<Response> {
  const g = requirePipelineJson(request, PATH)
  if (isPipelineUnauthorized(g)) {
    return g.response
  }
  const body = (await request.json().catch(() => ({}))) as { keyword?: string }
  const loc = await keywordDataLocationAndLanguage()
  if (!body.keyword) {
    return Response.json({ error: 'keyword required' }, { status: 400 })
  }
  try {
    const r = await dataForSeoPost('/v3/serp/google/organic/live/regular', [
      {
        language_code: loc.language_code,
        location_code: loc.location_code,
        keyword: body.keyword,
        depth: 10,
      },
    ])
    return Response.json({
      ok: true,
      r,
      /** 钉子 7：首次 SERP 拉取后建议进入 alert-manager 写基线（占位）。 */
      handoff: {
        status: 'DONE',
        objective: 'Rank snapshot recorded',
        recommendedNextSkill: 'alert-manager',
        keyFindings: 'Wire persistence to `rankings` + baseline thresholds in alert_eval.',
      },
    })
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : String(e) })
  }
}
