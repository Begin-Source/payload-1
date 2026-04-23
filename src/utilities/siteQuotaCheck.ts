import type { Payload } from 'payload'

/**
 * Hard cap check for per-site token budget (YTD in usageYtd or monthly).
 */
export async function assertSiteTokenBudget(
  _payload: Payload,
  _siteId: string | number,
  _incrementUsd: number,
): Promise<void> {
  // Enforce with SiteQuotas + PipelineSettings in production; stub for first pass
}
