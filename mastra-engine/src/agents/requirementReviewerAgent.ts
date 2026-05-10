import type { BriefAnalysis, RequirementCoverageItem, ReviewerResult } from '../schemas';
import { callLLM, type LLMConfig } from '../lib/llm';

const SYSTEM_PROMPT = `You are a requirement coverage reviewer.

Judge whether an application answer satisfies the requirements from the brief.

Input provides:
- briefAnalysis: the extracted requirements from the brief
- requirementCoverage: deterministic coverage analysis from tools
- deterministicChecks: word count, links, generic phrases found
- answer: the application answer text

Return ONLY valid JSON matching this schema:
{
  "score": number (0-100),
  "verdict": string (one sentence verdict),
  "specificFindings": string[] (2-4 concrete findings referencing specific content),
  "fixes": string[] (2-4 specific fixes)
}

Rules:
- Reference at least one specific detail from the brief or answer
- Do not invent achievements or details not in the input
- Score based on how many explicit requirements are addressed
- No markdown, no explanation. JSON only.`;

interface RequirementReviewerInput {
  briefAnalysis: BriefAnalysis;
  requirementCoverage: RequirementCoverageItem[];
  deterministicChecks: {
    wordCount: number;
    speakingTimeSeconds: number;
    lengthFit: { status: string; note: string };
    links: { urlsFound: string[]; requiredLinksMissing: string[] };
    genericPhrases: { phrase: string }[];
  };
  answer: string;
}

interface RequirementReviewerOutput {
  result: ReviewerResult;
  provider: string;
  model: string;
  durationMs: number;
  success: boolean;
  error?: string;
}

export async function requirementReviewerAgent(
  input: RequirementReviewerInput,
  llmConfig: LLMConfig
): Promise<RequirementReviewerOutput> {
  const start = Date.now();
  const context = JSON.stringify({
    briefRequirements: input.briefAnalysis.explicitRequirements,
    briefSummary: input.briefAnalysis.summary,
    requirementCoverage: input.requirementCoverage.map((i) => ({
      requirement: i.requirement,
      status: i.status,
      note: i.note,
    })),
    wordCount: input.deterministicChecks.wordCount,
    lengthFit: input.deterministicChecks.lengthFit,
    requiredLinksMissing: input.deterministicChecks.links.requiredLinksMissing,
    urlsFound: input.deterministicChecks.links.urlsFound,
    genericPhrases: input.deterministicChecks.genericPhrases.map((g) => g.phrase),
  }, null, 2);

  try {
    const result = await callLLM(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Context:\n${context}\n\nAnswer:\n${input.answer}` },
      ],
      llmConfig,
      { temperature: 0, maxTokens: 512, topP: 1 }
    );

    const parsed = JSON.parse(result.content);
    return {
      result: {
        score: Number(parsed.score) || 0,
        verdict: parsed.verdict || 'Assessment unavailable',
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
        score: 50,
        verdict: 'Could not complete AI review',
        specificFindings: ['Requirement review failed', 'Review completed with fallback data'],
        fixes: ['Check requirement coverage manually'],
      },
      provider: llmConfig.provider,
      model: llmConfig.model || 'fallback',
      durationMs: Date.now() - start,
      success: false,
      error: String(err),
    };
  }
}