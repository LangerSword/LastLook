import { getProviderStatus } from '../lib/callLLM';

interface Env {
  NVIDIA_API_KEY?: string;
  NVIDIA_BASE_URL?: string;
  NVIDIA_MODEL?: string;
  CLOUDFLARE_AI_TOKEN?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_AI_MODEL?: string;
  AI?: any;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const providers = getProviderStatus(context.env);

  return new Response(JSON.stringify({
    ok: true,
    providers
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
