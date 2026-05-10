import type { ReviewerResult, ApplicationMemory } from '../schemas';
import { callLLM, type LLMConfig } from '../lib/llm';
import { genericPhraseDetectorTool } from '../tools/genericPhraseDetector';

const SYSTEM_PROMPT = `You are a voice and tone reviewer.

Evaluate whether the application answer sounds human, authentic, and consistent with the applicant's saved identity.

Input provides:
- answer: the application text
- savedPreferredTone: the applicant's preferred tone from memory
- genericPhrases: detected generic phrases that sound corporate or fake
- profileName: the applicant's name if available
- projects: saved project names

Return ONLY valid JSON matching this schema:
{
  "score": number (0-100),
  "verdict": string (one sentence verdict),
  "specificFindings": string[] (2-4 findings with specific phrases or tone observations),
  "fixes": string[] (2-4 fixes)
}

Rules:
- Reference specific phrases from the answer
- Compare against saved preferred tone
- Identify generic or corporate-sounding language
- No markdown. JSON only.`;

interface VoiceReviewerInput {
  answer: string;
  memory: ApplicationMemory | null;
  genericPhrases: { phrase: string; replacementSuggestion: string }[];
}

interface VoiceReviewerOutput {
  result: ReviewerResult;
  provider: string;
  model: string;
  durationMs: number;
  success: boolean;
  error?: string;
}

export async function voiceReviewerAgent(
  input: VoiceReviewerInput,
  llmConfig: LLMConfig
): Promise<VoiceReviewerOutput> {
  const start = Date.now();
  const preferredTone = input.memory?.profile?.preferredTone || 'not set';
  const name = input.memory?.profile?.name || 'the applicant';
  const projectNames = (input.memory?.projects || []).map((p) => p.name);

  const context = {
    preferredTone,
    profileName: name,
    projectNames,
    genericPhrases: input.genericPhrases.map((g) => g.phrase),
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
        verdict: parsed.verdict || 'Voice assessment unavailable',
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
        score: 65,
        verdict: 'Voice review could not complete',
        specificFindings: [`Preferred tone: ${preferredTone}`, `Generic phrases: ${input.genericPhrases.map((g) => g.phrase).join(', ') || 'none detected'}`],
        fixes: ['Review voice manually'],
      },
      provider: llmConfig.provider,
      model: llmConfig.model || 'fallback',
      durationMs: Date.now() - start,
      success: false,
      error: String(err),
    };
  }
}