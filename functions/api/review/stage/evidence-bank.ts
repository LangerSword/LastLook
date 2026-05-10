import { verifyUserWithReason } from '../../../lib/auth';
import { buildEvidenceBank } from '../../../lib/engine';
import type { StageResponse, StageEvidenceBank, WorkflowContext } from '../../../lib/stages';

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const start = Date.now();
  const stage = "evidence-bank" as const;

  try {
    const auth = await verifyUserWithReason(context.request, context.env);
    if (auth.error === 'server_not_configured') {
      return new Response(JSON.stringify({
        ok: true, stage, durationMs: Date.now() - start, resultMode: 'deterministic_stage',
        data: { identity: [], projects: [], achievements: [], links: [], reusableSnippets: [], missingEvidence: ['No memory'] },
      } as StageResponse<StageEvidenceBank>), { headers: { 'Content-Type': 'application/json' } });
    }
    if (auth.error === 'no_token' || auth.error === 'invalid_token') {
      return new Response(JSON.stringify({
        ok: false, stage, durationMs: Date.now() - start, resultMode: 'mock_demo',
        error: { code: 'AUTH_REQUIRED', message: 'Sign in required' },
      } as StageResponse), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await context.request.json() as WorkflowContext;
    const memory = body.memory as any;
    const answer = body.answer || '';
    const briefAnalysis = body.briefAnalysis as any;

    const result = buildEvidenceBank(memory, answer, briefAnalysis);
    return new Response(JSON.stringify({
      ok: true, stage, durationMs: Date.now() - start, resultMode: 'deterministic_stage',
      data: result,
    } as StageResponse<StageEvidenceBank>), { headers: { 'Content-Type': 'application/json' } });
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
