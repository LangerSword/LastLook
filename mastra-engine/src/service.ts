import { runFullReviewWorkflow, createMockLLMConfig, createNvidiaLLMConfig } from 'lastlook-mastra';
import type { WorkflowInput } from 'lastlook-mastra';
import type { LLMConfig } from 'lastlook-mastra';

export interface WorkflowEvent {
  type: 'stage_started' | 'stage_completed' | 'stage_failed' | 'stage_skipped' | 'final_result';
  stage: string;
  durationMs?: number;
  summary?: string;
  error?: string;
  data?: unknown;
}

function getLLMConfig(env: Record<string, string | undefined>): LLMConfig {
  if (env.NVIDIA_API_KEY) {
    return createNvidiaLLMConfig(env.NVIDIA_API_KEY, env.NVIDIA_MODEL);
  }
  return createMockLLMConfig();
}

export async function runStreamingReview(
  input: WorkflowInput,
  env: Record<string, string | undefined>,
  onEvent: (event: WorkflowEvent) => void
): Promise<unknown> {
  const llmConfig = getLLMConfig(env);
  const result = await runFullReviewWorkflow(input, llmConfig, (event) => {
    onEvent({
      type: event.type,
      stage: event.stage,
      durationMs: event.durationMs,
      summary: event.summary,
      error: event.error,
    });
  });
  return result;
}

export type { WorkflowInput, LLMConfig };