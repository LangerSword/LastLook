import { verifyUserWithReason } from '../../../lib/auth';
import { parseBrief } from '../../../lib/engine';

interface Env {
  NVIDIA_API_KEY?: string;
  NVIDIA_BASE_URL?: string;
  NVIDIA_MODEL?: string;
  CLOUDFLARE_AI_TOKEN?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_AI_MODEL?: string;
  AI?: any;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const start = Date.now();
  const stage = "parse-brief" as const;

  try {
    const auth = await verifyUserWithReason(context.request, context.env);
    if (auth.error === 'no_token' || auth.error === 'invalid_token') {
      return new Response(JSON.stringify({
        ok: false, stage, durationMs: Date.now() - start, resultMode: 'mock_demo',
        error: { code: 'AUTH_REQUIRED', message: 'Sign in required' },
      } as StageResponse), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    if (auth.error === 'server_not_configured') {
      const fallback = parseBriefFallback(context.request);
      return new Response(JSON.stringify({
        ok: true, stage, durationMs: Date.now() - start, resultMode: 'deterministic_stage',
        data: fallback,
      } as StageResponse<StageBriefAnalysis>), { headers: { 'Content-Type': 'application/json' } });
    }

    const body = await context.request.json() as WorkflowContext;
    const brief = body.brief || '';
    const appType = body.applicationType || 'fellowship';

    const result = parseBrief(brief, appType);
    return new Response(JSON.stringify({
      ok: true, stage, durationMs: Date.now() - start, resultMode: 'deterministic_stage',
      data: result,
    } as StageResponse<StageBriefAnalysis>), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({
      ok: false, stage, durationMs: Date.now() - start, resultMode: 'fallback_stage',
      error: { code: 'INTERNAL', message: String(err) },
    } as StageResponse), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

function parseBriefFallback(req: Request): StageBriefAnalysis {
  return {
    summary: 'Parse brief fallback',
    explicitRequirements: [],
    hiddenRequirements: [],
    evaluationCriteria: [],
    requiredLinks: [],
    risks: [],
  };
}

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
};
