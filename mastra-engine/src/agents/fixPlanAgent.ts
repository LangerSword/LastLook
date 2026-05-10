import type { FixPlanItem } from '../schemas';
import { callLLM, type LLMConfig } from '../lib/llm';

const SYSTEM_PROMPT = `You are a fix plan advisor.

Create an ordered practical fix plan for an application.

Input provides:
- requirementCoverage: all requirements with status
- reviewerPanel: all reviewer scores and findings
- riskScore: risk score
- genericPhrases: detected generic phrases
- projectWarnings: projects without explanation

Return ONLY valid JSON matching this schema:
[
  {
    "step": number,
    "title": string,
    "why": string,
    "effort": string ("1 min" | "2 min" | "5 min" | "10 min"),
    "impact": string ("high" | "medium" | "low"),
    "suggestedText": string
  }
]

Return an array of 3-5 fix items, ordered by priority. Do not include more than 5 items.

Rules:
- Order by impact: blockers first, then quality improvements
- Effort estimates should be realistic
- suggestedText should be concrete and copy-paste ready
- No markdown. JSON only.`;

interface FixPlanInput {
  requirementCoverage: { requirement: string; status: string; whatToAdd: string; priority: string }[];
  reviewerPanel: {
    requirements: { score: number };
    fit: { score: number };
    evidence: { score: number };
    clarity: { score: number };
    length: { score: number };
    voice: { score: number };
    risk: { score: number };
  };
  genericPhrases: { phrase: string }[];
  projectWarnings: { projectName: string; issue: string; suggestedOneLiner: string }[];
}

interface FixPlanOutput {
  result: FixPlanItem[];
  provider: string;
  model: string;
  durationMs: number;
  success: boolean;
  error?: string;
}

export async function fixPlanAgent(
  input: FixPlanInput,
  llmConfig: LLMConfig
): Promise<FixPlanOutput> {
  const start = Date.now();
  const context = JSON.stringify({
    requirementCoverage: input.requirementCoverage.slice(0, 5),
    scores: input.reviewerPanel,
    genericPhrases: input.genericPhrases.map((g) => g.phrase),
    projectWarnings: input.projectWarnings.slice(0, 3),
  }, null, 2);

  try {
    const result = await callLLM(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: context },
      ],
      llmConfig,
      { temperature: 0, maxTokens: 768, topP: 1 }
    );

    const parsed = JSON.parse(result.content);
    const items: FixPlanItem[] = Array.isArray(parsed) ? parsed.slice(0, 5).map((item: any, idx: number) => ({
      step: idx + 1,
      title: item.title || 'Fix item',
      why: item.why || '',
      effort: item.effort || '2 min',
      impact: (item.impact === 'high' || item.impact === 'medium' || item.impact === 'low') ? item.impact : 'medium' as const,
      suggestedText: item.suggestedText || '',
    })) : [];

    return {
      result: items,
      provider: result.provider,
      model: result.model,
      durationMs: Date.now() - start,
      success: true,
    };
  } catch (err) {
    const fallback: FixPlanItem[] = [];
    const missing = input.requirementCoverage.filter((i) => i.status === 'missing').slice(0, 2);
    for (let i = 0; i < missing.length; i++) {
      fallback.push({ step: i + 1, title: `Cover: ${missing[i].requirement}`, why: 'Missing requirement', effort: '2 min', impact: 'high', suggestedText: missing[i].whatToAdd });
    }
    if (input.genericPhrases.length > 0) {
      fallback.push({ step: fallback.length + 1, title: 'Replace generic phrasing', why: 'Generic phrases weaken fit', effort: '2 min', impact: 'medium', suggestedText: 'Replace with specific details from your projects' });
    }

    return {
      result: fallback,
      provider: llmConfig.provider,
      model: llmConfig.model || 'fallback',
      durationMs: Date.now() - start,
      success: false,
      error: String(err),
    };
  }
}