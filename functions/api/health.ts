import { getProviderStatus } from '../lib/callLLM';
import { LIMITS } from '../lib/usage';

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

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const supabaseServer = context.env.SUPABASE_URL && context.env.SUPABASE_ANON_KEY 
    ? 'configured' 
    : 'missing';

  return new Response(JSON.stringify({
    ok: true,
    providers: getProviderStatus(context.env),
    supabase: {
      frontendExpected: true,
      server: supabaseServer,
    },
    authRequiredForAi: true,
    limits: LIMITS,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
