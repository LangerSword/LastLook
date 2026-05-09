import { callLLM } from '../lib/callLLM';
import { CHECK_SYSTEM } from '../lib/prompts';

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
  ADMIN_EMAILS?: string;
}

import { verifyUser } from '../lib/auth';
import { checkAndLogUsage } from '../lib/usage';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const user = await verifyUser(context.request, context.env);
    if (!user) {
      return new Response(JSON.stringify({
        error: 'auth_required',
        message: 'Sign in to run a real LastLook review. You can still try the sample demo.'
      }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await context.request.json() as any;

    if (!body.finalAnswer || typeof body.finalAnswer !== 'string') {
      return new Response(JSON.stringify({ error: 'finalAnswer is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userMsg = `Brief Analysis: ${JSON.stringify(body.briefAnalysis || {})}
  Question: ${body.question || ''}
  Final Answer: ${body.finalAnswer}
  Application Type: ${body.applicationType || 'General'}
  Review Strictness: ${body.reviewStrictness || 'Balanced'}
  Target: ${body.target || 'general application'}
  Word Count: ${body.wordCount || 0}
  Speaking Time (seconds): ${body.speakingTimeSeconds || 0}

  Evaluate this answer and return a score with detailed feedback.`;

    const { content: raw, provider, model } = await callLLM(
      [
        { role: 'system', content: CHECK_SYSTEM },
        { role: 'user', content: userMsg },
      ],
      context.env
    );

    const usageErrorResponse = await checkAndLogUsage(user, 'check', context.env, provider, model);
    if (usageErrorResponse) {
      return usageErrorResponse;
    }

    try {
      const cleanRaw = raw.replace(/^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/s, '$1').trim();
      const parsed = JSON.parse(cleanRaw);
      // Ensure wordCount and speakingTimeSeconds are passed through
      parsed.wordCount = body.wordCount || parsed.wordCount || 0;
      parsed.speakingTimeSeconds = body.speakingTimeSeconds || parsed.speakingTimeSeconds || 0;
      return new Response(JSON.stringify(parsed), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      return new Response(JSON.stringify({
        score: 50,
        status: 'Needs fixes',
        criticalIssues: ['Could not parse AI response'],
        warnings: [raw],
        strongPoints: [],
        fixOrder: ['Retry the check'],
        wordCount: body.wordCount || 0,
        speakingTimeSeconds: body.speakingTimeSeconds || 0,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
