import type { ReviewerResult } from '../schemas';
import { callLLM, type LLMConfig } from '../lib/llm';
import { wordCountTool } from '../tools/wordCount';
import { speakingTimeTool } from '../tools/speakingTime';

const SYSTEM_PROMPT = `You are a length and format reviewer.

Evaluate whether the application answer fits the target length and format.

Input provides:
- answer: the application text
- wordCount: deterministic word count
- speakingTimeSeconds: estimated speaking time at 145 wpm
- targetLength: the brief's target (e.g., "60-90 second video", "150 words")
- briefRequirements: explicit requirements from brief

Return ONLY valid JSON matching this schema:
{
  "score": number (0-100),
  "verdict": string (one sentence verdict),
  "specificFindings": string[] (2-4 findings referencing the actual metrics),
  "fixes": string[] (2-4 fixes)
}

Rules:
- Use the specific word count and time metrics in findings
- Compare against target from briefRequirements
- No markdown. JSON only.`;

interface LengthReviewerInput {
  answer: string;
  targetLength: string;
  briefRequirements: string[];
}

interface LengthReviewerOutput {
  result: ReviewerResult;
  provider: string;
  model: string;
  durationMs: number;
  success: boolean;
  error?: string;
}

export async function lengthReviewerAgent(
  input: LengthReviewerInput,
  llmConfig: LLMConfig
): Promise<LengthReviewerOutput> {
  const start = Date.now();
  const wc = wordCountTool({ text: input.answer });
  const time = speakingTimeTool({ text: input.answer, wordsPerMinute: 145 });

  let targetWords = 150;
  let targetSeconds = 0;
  const isVideo = input.briefRequirements.some((r) => /video|60.*second|90.*second/i.test(r));
  if (isVideo) {
    targetWords = 170;
    targetSeconds = 70;
  }

  const context = {
    wordCount: wc.wordCount,
    speakingTimeSeconds: time.seconds,
    targetWords,
    targetSeconds,
    isVideoBrief: isVideo,
    targetLength: input.targetLength,
    briefRequirements: input.briefRequirements,
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
        verdict: parsed.verdict || 'Length assessment unavailable',
        specificFindings: Array.isArray(parsed.specificFindings) ? parsed.specificFindings : [],
        fixes: Array.isArray(parsed.fixes) ? parsed.fixes : [],
      },
      provider: result.provider,
      model: result.model,
      durationMs: Date.now() - start,
      success: true,
    };
  } catch (err) {
    let score = 70;
    if (isVideo) {
      if (wc.wordCount < 100) score = 20;
      else if (wc.wordCount > 220) score = 40;
      else score = 75;
    }

    return {
      result: {
        score,
        verdict: 'Length review could not complete',
        specificFindings: [`${wc.wordCount} words (~${time.seconds}s at 145 wpm). Target: ~${targetWords} words.`],
        fixes: ['Review length manually against target'],
      },
      provider: llmConfig.provider,
      model: llmConfig.model || 'fallback',
      durationMs: Date.now() - start,
      success: false,
      error: String(err),
    };
  }
}