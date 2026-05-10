import { verifyUserWithReason } from '../../../lib/auth';
import { scoreReview, getStatusFromScore } from '../../../lib/engine';
import type { StageResponse, StageScore, WorkflowContext } from '../../../lib/stages';

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const start = Date.now();
  const stage = "score" as const;

  try {
    const auth = await verifyUserWithReason(context.request, context.env);
    if (auth.error === 'server_not_configured') {
      return new Response(JSON.stringify({
        ok: true, stage, durationMs: Date.now() - start, resultMode: 'deterministic_stage',
        data: { score: 50, status: 'unknown', verdict: 'Unknown' },
      } as StageResponse<StageScore>), { headers: { 'Content-Type': 'application/json' } });
    }
    if (auth.error === 'no_token' || auth.error === 'invalid_token') {
      return new Response(JSON.stringify({
        ok: false, stage, durationMs: Date.now() - start, resultMode: 'mock_demo',
        error: { code: 'AUTH_REQUIRED', message: 'Sign in required' },
      } as StageResponse), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await context.request.json() as WorkflowContext & { reviewerPanel?: any };
    const reviewerPanel = body.reviewerPanel as any;

    const computedScore = scoreReview(reviewerPanel);
    const status = getStatusFromScore(computedScore);
    const verdicts: Record<string, string> = {
      ready_minor_polish: 'Ready with minor polish',
      close_needs_edits: 'Close but needs edits',
      needs_major_fixes: 'Needs major fixes',
      not_ready: 'Not ready for submission',
    };

    return new Response(JSON.stringify({
      ok: true, stage, durationMs: Date.now() - start, resultMode: 'deterministic_stage',
      data: { score: computedScore, status, verdict: verdicts[status] || 'Unknown' },
    } as StageResponse<StageScore>), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({
      ok: false, stage, durationMs: Date.now() - start, resultMode: 'fallback_stage',
      error: { code: 'INTERNAL', message: String(err) },
    } as StageResponse), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
};
