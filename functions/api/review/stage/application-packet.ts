import { verifyUserWithReason } from '../../../lib/auth';
import { buildApplicationPacket } from '../../../lib/engine';
import type { StageResponse, StagePacket, WorkflowContext } from '../../../lib/stages';

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const start = Date.now();
  const stage = "application-packet" as const;

  try {
    const auth = await verifyUserWithReason(context.request, context.env);
    if (auth.error === 'server_not_configured') {
      return new Response(JSON.stringify({
        ok: true, stage, durationMs: Date.now() - start, resultMode: 'deterministic_stage',
        data: defaultPacket(),
      } as StageResponse<StagePacket>), { headers: { 'Content-Type': 'application/json' } });
    }
    if (auth.error === 'no_token' || auth.error === 'invalid_token') {
      return new Response(JSON.stringify({
        ok: false, stage, durationMs: Date.now() - start, resultMode: 'mock_demo',
        error: { code: 'AUTH_REQUIRED', message: 'Sign in required' },
      } as StageResponse), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await context.request.json() as WorkflowContext & {
      readinessReport?: any;
      nextBestEdit?: any;
      improvedAnswer?: any;
    };

    const result = buildApplicationPacket(
      body.programName || 'Application',
      body.applicationType || 'Fellowship',
      body.reviewStrictness || 'balanced',
      body.readinessReport as any,
      body.nextBestEdit as any,
      body.improvedAnswer as any
    );

    return new Response(JSON.stringify({
      ok: true, stage, durationMs: Date.now() - start, resultMode: 'deterministic_stage',
      data: result,
    } as StageResponse<StagePacket>), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({
      ok: false, stage, durationMs: Date.now() - start, resultMode: 'fallback_stage',
      error: { code: 'INTERNAL', message: String(err) },
    } as StageResponse), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

function defaultPacket(): StagePacket {
  return {
    programName: 'Application', applicationType: 'Fellowship',
    overallScore: 50, status: 'unknown',
    requiredLinks: [], submissionChecklist: [], exportMarkdown: '',
  };
}

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
};
