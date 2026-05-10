import type { ReviewerResult, MemoryProject } from '../schemas';
import { callLLM, type LLMConfig } from '../lib/llm';
import { projectExplanationCheckTool } from '../tools/projectExplanationCheck';

const SYSTEM_PROMPT = `You are a clarity and structure reviewer.

Evaluate the clarity, structure, and explanation quality of an application answer.

Input provides:
- answer: the application text
- memoryProjects: saved projects with one-liners and descriptions
- projectWarnings: tool-detected projects mentioned without explanation

Return ONLY valid JSON matching this schema:
{
  "score": number (0-100),
  "verdict": string (one sentence verdict),
  "specificFindings": string[] (2-4 findings referencing specific sentences or phrases),
  "fixes": string[] (2-4 fixes)
}

Rules:
- Reference at least one specific sentence or phrase from the answer
- Identify unclear or unexplained references
- Assess whether the structure flows logically
- No markdown. JSON only.`;

interface ClarityReviewerInput {
  answer: string;
  memoryProjects: MemoryProject[];
  projectWarnings: { projectName: string; issue: string; suggestedOneLiner: string }[];
}

interface ClarityReviewerOutput {
  result: ReviewerResult;
  provider: string;
  model: string;
  durationMs: number;
  success: boolean;
  error?: string;
}

export async function clarityReviewerAgent(
  input: ClarityReviewerInput,
  llmConfig: LLMConfig
): Promise<ClarityReviewerOutput> {
  const start = Date.now();
  const wordCount = input.answer.split(/\s+/).filter(Boolean).length;
  const sentences = input.answer.split(/[.!?]+/).filter(Boolean);
  const avgSentenceLen = sentences.length ? Math.round(wordCount / sentences.length) : wordCount;

  const context = {
    wordCount,
    sentenceCount: sentences.length,
    avgSentenceLength: avgSentenceLen,
    projectWarnings: input.projectWarnings.slice(0, 3),
  };

  try {
    const result = await callLLM(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Context:\n${JSON.stringify(context, null, 2)}\n\nAnswer:\n${input.answer}` },
      ],
      llmConfig,
      { temperature: 0, maxTokens: 512, topP: 1 }
    );

    const parsed = JSON.parse(result.content);
    return {
      result: {
        score: Number(parsed.score) || 0,
        verdict: parsed.verdict || 'Clarity assessment unavailable',
        specificFindings: Array.isArray(parsed.specificFindings) ? parsed.specificFindings : [],
        fixes: Array.isArray(parsed.fixes) ? parsed.fixes : [],
      },
      provider: result.provider,
      model: result.model,
      durationMs: Date.now() - start,
      success: true,
    };
  } catch (err) {
    return {
      result: {
        score: 60,
        verdict: 'Clarity review could not complete',
        specificFindings: [`Answer has ${sentences.length} sentences, avg ${avgSentenceLen} words/sentence`],
        fixes: ['Review clarity manually'],
      },
      provider: llmConfig.provider,
      model: llmConfig.model || 'fallback',
      durationMs: Date.now() - start,
      success: false,
      error: String(err),
    };
  }
}