import type { ReviewerResult, BriefAnalysis } from '../schemas';
import { callLLM, type LLMConfig } from '../lib/llm';
import { requiredLinkDetectorTool } from '../tools/requiredLinkDetector';
import { projectExplanationCheckTool } from '../tools/projectExplanationCheck';
import { genericPhraseDetectorTool } from '../tools/genericPhraseDetector';

const SYSTEM_PROMPT = `You are a risk reviewer.

Identify submission blockers and high-risk issues in an application.

Input provides:
- answer: the application text
- briefAnalysis: extracted requirements and risks from the brief
- requiredLinksMissing: links the brief requires but the answer lacks
- projectWarnings: projects mentioned without explanation
- genericPhrases: generic phrases that weaken the application

Return ONLY valid JSON matching this schema:
{
  "score": number (0-100),
  "verdict": string (one sentence verdict),
  "specificFindings": string[] (2-4 blocker/risk findings),
  "fixes": string[] (2-4 fixes ordered by priority)
}

Rules:
- Prioritize blocking issues (missing links, wrong length, incomplete requirements)
- Reference specific risks from briefAnalysis.submissionRisks
- Be direct about what could disqualify the submission
- No markdown. JSON only.`;

interface RiskReviewerInput {
  answer: string;
  briefAnalysis: BriefAnalysis;
  memory: import('../schemas').ApplicationMemory | null;
}

interface RiskReviewerOutput {
  result: ReviewerResult;
  provider: string;
  model: string;
  durationMs: number;
  success: boolean;
  error?: string;
}

export async function riskReviewerAgent(
  input: RiskReviewerInput,
  llmConfig: LLMConfig
): Promise<RiskReviewerOutput> {
  const start = Date.now();

  const linkResult = requiredLinkDetectorTool({
    briefAnalysis: input.briefAnalysis,
    answer: input.answer,
    memoryLinks: input.memory?.linkVault || null,
  });

  const projectWarnings = projectExplanationCheckTool({
    answer: input.answer,
    memoryProjects: input.memory?.projects || [],
  });

  const genericPhrases = genericPhraseDetectorTool({ answer: input.answer });

  const context = {
    briefSubmissionRisks: input.briefAnalysis.submissionRisks.slice(0, 4),
    requiredLinksMissing: linkResult.requiredLinksMissing,
    savedLinksAvailable: linkResult.savedLinksAvailable,
    projectWarnings: projectWarnings.warnings.slice(0, 3),
    genericPhrases: genericPhrases.phrases.map((g) => g.phrase),
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
        verdict: parsed.verdict || 'Risk assessment unavailable',
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
        score: 40,
        verdict: 'Risk review could not complete',
        specificFindings: [
          `Missing links: ${linkResult.requiredLinksMissing.join(', ') || 'none'}`,
          `Project warnings: ${projectWarnings.warnings.length}`,
        ],
        fixes: ['Review risks manually'],
      },
      provider: llmConfig.provider,
      model: llmConfig.model || 'fallback',
      durationMs: Date.now() - start,
      success: false,
      error: String(err),
    };
  }
}