import { callLLM } from './callLLM';
import type { ResultMode } from './stages';

export interface ModelCallOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  seed?: number;
}

export interface ModelCallResult<T = unknown> {
  ok: boolean;
  provider?: string;
  model?: string;
  durationMs: number;
  resultMode: ResultMode;
  parsed?: T;
  raw?: string;
  error?: {
    code: string;
    message: string;
  };
}

export async function callModel<T = unknown>(
  stage: string,
  messages: { role: string; content: string }[],
  schema: string,
  byok: boolean,
  env: Record<string, unknown>,
  options: ModelCallOptions = {}
): Promise<ModelCallResult<T>> {
  const start = Date.now();
  const { temperature = 0, maxTokens = 1024, topP = 1, seed } = options;

  const systemWithSchema = `${messages.find(m => m.role === 'system')?.content || ''}

Return ONLY valid JSON matching this schema. No markdown, no explanation, no extra text:
${schema}`;

  const filteredMessages = messages.filter(m => m.role !== 'system');
  if (filteredMessages.length === 0) {
    return {
      ok: false,
      durationMs: Date.now() - start,
      resultMode: 'mock_demo',
      error: { code: 'EMPTY_MESSAGES', message: 'No messages provided' },
    };
  }

  const finalMessages = [
    { role: 'system' as const, content: systemWithSchema },
    ...filteredMessages,
  ];

  try {
    const result = await callLLM(finalMessages, env as any, { temperature, maxTokens, topP, seed });
    const durationMs = Date.now() - start;

    const raw = result.content;
    const clean = raw.replace(/^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/s, '$1').trim();

    try {
      const parsed = JSON.parse(clean) as T;
      console.log(`[callModel] ${stage} → ok (${durationMs}ms, ${result.provider}/${result.model})`);
      return {
        ok: true,
        provider: result.provider,
        model: result.model,
        durationMs,
        resultMode: 'ai_stage',
        parsed,
        raw,
      };
    } catch {
      return {
        ok: false,
        provider: result.provider,
        model: result.model,
        durationMs,
        resultMode: 'fallback_stage',
        error: { code: 'PARSE_ERROR', message: 'Model response was not valid JSON' },
        raw,
      };
    }
  } catch (err) {
    const durationMs = Date.now() - start;
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[callModel] ${stage} → error (${durationMs}ms): ${msg}`);
    return {
      ok: false,
      durationMs,
      resultMode: 'fallback_stage',
      error: { code: 'MODEL_CALL_FAILED', message: msg },
    };
  }
}

export function buildModelResult<T>(
  result: ModelCallResult<T>,
  stage: string,
  data?: T
): { ok: boolean; resultMode: ResultMode; provider?: string; model?: string; durationMs: number; data?: T; error?: { code: string; message: string } } {
  if (result.ok && result.parsed !== undefined) {
    return {
      ok: true,
      resultMode: result.resultMode,
      provider: result.provider,
      model: result.model,
      durationMs: result.durationMs,
      data: result.parsed,
    };
  }
  return {
    ok: false,
    resultMode: result.resultMode,
    durationMs: result.durationMs,
    data,
    error: result.error || { code: 'UNKNOWN', message: 'Model call failed' },
  };
}
