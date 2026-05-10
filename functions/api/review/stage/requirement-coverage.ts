import { verifyUserWithReason } from '../../../lib/auth';
import { computeRequirementCoverage } from '../../../lib/engine';
import type { StageResponse, StageRequirementCoverage, WorkflowContext } from '../../../lib/stages';

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const start = Date.now();
  const stage = "requirement-coverage" as const;

  try {
    const auth = await verifyUserWithReason(context.request, context.env);
    if (auth.error === 'server_not_configured') {
      return new Response(JSON.stringify({
        ok: true, stage, durationMs: Date.now() - start, resultMode: 'deterministic_stage',
        data: { items: [] },
      } as StageResponse<StageRequirementCoverage>), { headers: { 'Content-Type': 'application/json' } });
    }
    if (auth.error === 'no_token' || auth.error === 'invalid_token') {
      return new Response(JSON.stringify({
        ok: false, stage, durationMs: Date.now() - start, resultMode: 'mock_demo',
        error: { code: 'AUTH_REQUIRED', message: 'Sign in required' },
      } as StageResponse), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await context.request.json() as WorkflowContext & { briefAnalysis?: any; deterministicChecks?: any };
    const briefAnalysis = body.briefAnalysis as any;
    const deterministicChecks = body.deterministicChecks as any;
    const answer = body.answer || '';

    const result = computeRequirementCoverage(briefAnalysis, answer, deterministicChecks);
    return new Response(JSON.stringify({
      ok: true, stage, durationMs: Date.now() - start, resultMode: 'deterministic_stage',
      data: result,
    } as StageResponse<StageRequirementCoverage>), { headers: { 'Content-Type': 'application/json' } });
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
