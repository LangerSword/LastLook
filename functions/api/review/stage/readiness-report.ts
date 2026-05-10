import { verifyUserWithReason } from '../../../lib/auth';
import { buildReadinessReport } from '../../../lib/engine';
import type { StageResponse, WorkflowContext } from '../../../lib/stages';
import type { ReadinessReportOutput } from '../../../lib/engine';

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const start = Date.now();
  const stage = "readiness-report" as const;

  try {
    const auth = await verifyUserWithReason(context.request, context.env);
    if (auth.error === 'server_not_configured') {
      return new Response(JSON.stringify({
        ok: true, stage, durationMs: Date.now() - start, resultMode: 'deterministic_stage',
        data: defaultReadinessReport(),
      } as StageResponse<ReadinessReport>), { headers: { 'Content-Type': 'application/json' } });
    }
    if (auth.error === 'no_token' || auth.error === 'invalid_token') {
      return new Response(JSON.stringify({
        ok: false, stage, durationMs: Date.now() - start, resultMode: 'mock_demo',
        error: { code: 'AUTH_REQUIRED', message: 'Sign in required' },
      } as StageResponse), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await context.request.json() as WorkflowContext & {
      reviewerPanel?: any;
      coverage?: any;
      deterministicChecks?: any;
      nextBestEdit?: any;
      fixPlan?: any;
      score?: number;
      status?: string;
    };

    const score = body.score || 50;
    const status = body.status || 'unknown';
    const nextBestEdit = body.nextBestEdit || { action: 'Unknown', why: '', expectedImpact: 'medium' as const };
    const fixPlan = body.fixPlan || [];

    const result = buildReadinessReport(
      score, status, nextBestEdit, fixPlan,
      (body.coverage as any)?.items || [],
      body.reviewerPanel as any,
      body.deterministicChecks as any
    );

    return new Response(JSON.stringify({
      ok: true, stage, durationMs: Date.now() - start, resultMode: 'deterministic_stage',
      data: result,
    } as StageResponse<ReadinessReport>), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({
      ok: false, stage, durationMs: Date.now() - start, resultMode: 'fallback_stage',
      error: { code: 'INTERNAL', message: String(err) },
    } as StageResponse), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

function defaultReadinessReport(): ReadinessReport {
  return {
    score: 50, status: 'unknown', verdict: 'Unknown',
    nextBestEdit: { action: 'Unknown', why: '', expectedImpact: 'medium' },
    criticalIssues: [], warnings: [], strongPoints: [], fixPlan: [],
    wordCount: 0, speakingTimeSeconds: 0,
  };
}

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
};
