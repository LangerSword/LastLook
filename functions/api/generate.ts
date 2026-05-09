import { callLLM } from '../lib/callLLM';
import { GENERATE_SYSTEM } from '../lib/prompts';

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

    if (!body.question || typeof body.question !== 'string') {
      return new Response(JSON.stringify({ error: 'question is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userMsg = `Memory: ${JSON.stringify(body.memory || {})}
  Brief Analysis: ${JSON.stringify(body.briefAnalysis || {})}
  Question: ${body.question}
  Application Type: ${body.applicationType || 'General'}
  Review Strictness: ${body.reviewStrictness || 'Balanced'}
  Tone: ${body.tone || 'Confident'}
  Target Length: ${body.targetLength || '150 words'}

  Generate a tailored answer draft.`;

    const { content: raw, provider, model } = await callLLM(
      [
        { role: 'system', content: GENERATE_SYSTEM },
        { role: 'user', content: userMsg },
      ],
      context.env
    );

    const usageErrorResponse = await checkAndLogUsage(user, 'generate', context.env, provider, model);
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
        draft: raw,
        whyItWorks: ['Could not parse AI response — using raw output'],
        customize: [],
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
