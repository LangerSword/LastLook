import { callLLM } from '../lib/callLLM';
import { ANALYZE_SYSTEM } from '../lib/prompts';

interface Env {
  NVIDIA_API_KEY?: string;
  NVIDIA_BASE_URL?: string;
  NVIDIA_MODEL?: string;
  CLOUDFLARE_AI_TOKEN?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_AI_MODEL?: string;
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

    const body = await context.request.json() as { brief?: string };

    if (!body.brief || typeof body.brief !== 'string' || !body.brief.trim()) {
      return new Response(JSON.stringify({ error: 'brief is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { content: raw, provider, model } = await callLLM(
      [
        { role: 'system', content: ANALYZE_SYSTEM },
        { role: 'user', content: `Analyze this application brief:\n\n${body.brief}` },
      ],
      context.env
    );

    const usageErrorResponse = await checkAndLogUsage(user, 'analyze', context.env, provider, model);
    if (usageErrorResponse) {
      return usageErrorResponse;
    }

    try {
      const cleanRaw = raw.replace(/^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/s, '$1').trim();
      const parsed = JSON.parse(cleanRaw);
      return new Response(JSON.stringify(parsed), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      return new Response(JSON.stringify({
        explicitRequirements: ['Could not parse AI response — using raw output'],
        impliedCriteria: [],
        submissionRisks: [],
        suggestedAngles: [],
        summary: raw,
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
