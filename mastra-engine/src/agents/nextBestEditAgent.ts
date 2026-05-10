import type { NextBestEdit } from '../schemas';
import { callLLM, type LLMConfig } from '../lib/llm';

const SYSTEM_PROMPT = `You are a next-best-edit advisor.

Identify the single highest-impact next edit for an application.

Input provides:
- requirementCoverage: requirement status list (covered, partial, missing)
- fitScore: opportunity fit score
- evidenceScore: evidence backing score
- riskScore: submission risk score
- genericPhrases: detected generic phrases
- projectWarnings: projects mentioned without explanation
- nextPriorityFix: the top priority fix from the requirement coverage

Return ONLY valid JSON matching this schema:
{
  "title": string (short action title),
  "reason": string (why this is the highest-impact fix),
  "suggestedText": string (concrete suggested edit)
}

Rules:
- Choose the fix that will have the most impact on the evaluator
- Reference specific content from the input
- Make the suggested text concrete and copy-paste ready
- No markdown. JSON only.`;

interface NextBestEditInput {
  requirementCoverage: { requirement: string; status: string; whatToAdd: string }[];
  reviewerPanel: {
    fit: { score: number };
    evidence: { score: number };
    risk: { score: number };
  };
  genericPhrases: { phrase: string }[];
  projectWarnings: { projectName: string; suggestedOneLiner: string }[];
  deterministicChecks: {
    links: { requiredLinksMissing: string[] };
    lengthFit: { status: string; note: string };
  };
}

interface NextBestEditOutput {
  result: NextBestEdit;
  provider: string;
  model: string;
  durationMs: number;
  success: boolean;
  error?: string;
}

export async function nextBestEditAgent(
  input: NextBestEditInput,
  llmConfig: LLMConfig
): Promise<NextBestEditOutput> {
  const start = Date.now();

  const context = JSON.stringify({
    topPriorityFix: input.requirementCoverage.find((i) => i.status === 'missing') || input.requirementCoverage.find((i) => i.status === 'partial'),
    scores: input.reviewerPanel,
    missingLinks: input.deterministicChecks.links.requiredLinksMissing,
    lengthStatus: input.deterministicChecks.lengthFit.status,
    genericPhrases: input.genericPhrases.map((g) => g.phrase),
    projectWarnings: input.projectWarnings.slice(0, 2),
  }, null, 2);

  try {
    const result = await callLLM(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: context },
      ],
      llmConfig,
      { temperature: 0, maxTokens: 512, topP: 1 }
    );

    const parsed = JSON.parse(result.content);
    return {
      result: {
        title: parsed.title || 'Tighten the opening',
        reason: parsed.reason || 'High-impact fix identified',
        suggestedText: parsed.suggestedText || '',
      },
      provider: result.provider,
      model: result.model,
      durationMs: Date.now() - start,
      success: true,
    };
  } catch (err) {
    const missingReq = input.requirementCoverage.find((i) => i.status === 'missing');
    return {
      result: {
        title: 'Address missing requirement',
        reason: 'Highest-impact fix identified',
        suggestedText: missingReq?.whatToAdd || 'Add missing content',
      },
      provider: llmConfig.provider,
      model: llmConfig.model || 'fallback',
      durationMs: Date.now() - start,
      success: false,
      error: String(err),
    };
  }
}