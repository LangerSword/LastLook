import { runFullReviewWorkflow, type WorkflowEvent, type ProgressCallback } from './workflows/fullReviewWorkflow';
import type { WorkflowInput, WorkflowOutput } from './schemas';
import type { LLMConfig } from './lib/llm';

export { runFullReviewWorkflow };
export type { WorkflowInput, WorkflowOutput, WorkflowEvent, ProgressCallback };

export async function runReview(
  input: WorkflowInput,
  llmConfig: LLMConfig,
  onProgress?: ProgressCallback
): Promise<WorkflowOutput> {
  return runFullReviewWorkflow(input, llmConfig, onProgress);
}

export async function runReviewWithEvents(
  input: WorkflowInput,
  llmConfig: LLMConfig
): Promise<{ result: WorkflowOutput; events: WorkflowEvent[] }> {
  const events: WorkflowEvent[] = [];
  const result = await runFullReviewWorkflow(input, llmConfig, (event) => {
    events.push(event);
  });
  return { result, events };
}

export function createMockLLMConfig(): LLMConfig {
  return {
    provider: 'mock',
    apiKey: undefined,
    model: 'mock',
  };
}

export function createNvidiaLLMConfig(apiKey: string, model?: string): LLMConfig {
  return {
    provider: 'nvidia',
    apiKey,
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    model: model || 'meta/llama-3.1-8b-instruct',
  };
}

export type { LLMConfig } from './lib/llm';
export { callLLM, getProviderStatus } from './lib/llm';
export * from './schemas';
export * from './tools';
export * from './agents';