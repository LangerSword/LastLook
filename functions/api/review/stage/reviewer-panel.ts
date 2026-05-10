import { verifyUserWithReason } from '../../../lib/auth';
import { buildReviewerPanel } from '../../../lib/engine';
import type { StageResponse, StageReviewerPanel, WorkflowContext } from '../../../lib/stages';

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const start = Date.now();
  const stage = "reviewer-panel" as const;

  try {
    const auth = await verifyUserWithReason(context.request, context.env);
    if (auth.error === 'server_not_configured') {
      return new Response(JSON.stringify({
        ok: true, stage, durationMs: Date.now() - start, resultMode: 'deterministic_stage',
        data: defaultReviewerPanel(),
      } as StageResponse<StageReviewerPanel>), { headers: { 'Content-Type': 'application/json' } });
    }
    if (auth.error === 'no_token' || auth.error === 'invalid_token') {
      return new Response(JSON.stringify({
        ok: false, stage, durationMs: Date.now() - start, resultMode: 'mock_demo',
        error: { code: 'AUTH_REQUIRED', message: 'Sign in required' },
      } as StageResponse), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await context.request.json() as WorkflowContext & {
      briefAnalysis?: any;
      evidenceBank?: any;
      deterministicChecks?: any;
      requirementCoverage?: any;
    };

    const result = buildReviewerPanel(
      body.briefAnalysis as any,
      body.answer || '',
      body.evidenceBank as any,
      body.deterministicChecks as any,
      (body.requirementCoverage as any)?.items || [],
      body.applicationType || 'fellowship',
      body.reviewStrictness || 'balanced'
    );
    return new Response(JSON.stringify({
      ok: true, stage, durationMs: Date.now() - start, resultMode: 'deterministic_stage',
      data: result,
    } as StageResponse<StageReviewerPanel>), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({
      ok: false, stage, durationMs: Date.now() - start, resultMode: 'fallback_stage',
      error: { code: 'INTERNAL', message: String(err) },
    } as StageResponse), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

function defaultReviewerPanel(): StageReviewerPanel {
  const zero = { score: 50, verdict: 'Unknown', specificFindings: [], fixes: [] };
  return { requirements: zero, fit: zero, clarity: zero, evidence: zero, length: zero, voice: zero, risk: zero };
}

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
};
