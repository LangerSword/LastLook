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
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
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

    const raw = await callLLM(
      [
        { role: 'system', content: GENERATE_SYSTEM },
        { role: 'user', content: userMsg },
      ],
      context.env
    );

    try {
      const cleanRaw = raw.replace(/^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/s, '$1').trim();
      const parsed = JSON.parse(cleanRaw);
      return new Response(JSON.stringify(parsed), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      return new Response(JSON.stringify({
        draft: raw,
        whyItWorks: ['Generated from AI but response format was unexpected'],
        customize: ['Review and edit the raw draft above'],
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
