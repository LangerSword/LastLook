import { verifyUserWithReason } from '../../../lib/auth';
import { runDeterministicChecks } from '../../../lib/engine';
import type { StageResponse, StageDeterministicChecks, WorkflowContext } from '../../../lib/stages';

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const start = Date.now();
  const stage = "deterministic-checks" as const;

  try {
    const auth = await verifyUserWithReason(context.request, context.env);
    if (auth.error === 'server_not_configured') {
      return new Response(JSON.stringify({
        ok: true, stage, durationMs: Date.now() - start, resultMode: 'deterministic_stage',
        data: { wordCount: 0, speakingTimeSeconds: 0, lengthFit: { status: 'unknown', note: '' }, links: { urlsFound: [], requiredLinksMissing: [], savedLinksAvailable: [] }, genericPhrases: [], projectExplanationWarnings: [], memoryUsage: { usedProjects: [], unusedRelevantProjects: [], note: '' }, formattingIssues: [] },
      } as StageResponse<StageDeterministicChecks>), { headers: { 'Content-Type': 'application/json' } });
    }
    if (auth.error === 'no_token' || auth.error === 'invalid_token') {
      return new Response(JSON.stringify({
        ok: false, stage, durationMs: Date.now() - start, resultMode: 'mock_demo',
        error: { code: 'AUTH_REQUIRED', message: 'Sign in required' },
      } as StageResponse), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await context.request.json() as WorkflowContext & { briefAnalysis?: any; evidenceBank?: any };
    const answer = body.answer || '';
    const briefAnalysis = body.briefAnalysis as any;
    const evidenceBank = body.evidenceBank as any;

    const result = runDeterministicChecks(answer, briefAnalysis, evidenceBank);
    return new Response(JSON.stringify({
      ok: true, stage, durationMs: Date.now() - start, resultMode: 'deterministic_stage',
      data: result,
    } as StageResponse<StageDeterministicChecks>), { headers: { 'Content-Type': 'application/json' } });
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
