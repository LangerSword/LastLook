import type { BriefAnalysis } from '../schemas';
import { callLLM } from '../lib/llm';
import type { LLMConfig } from '../lib/llm';

const SYSTEM_PROMPT = `You are an application brief analyzer.

Given an application brief, extract:
- explicitRequirements: what the brief explicitly asks for (video, link, essay, etc.)
- impliedCriteria: what evaluators likely look for beyond stated requirements
- submissionRisks: common mistakes applicants make with this type of brief
- suggestedAngles: strong approaches for this type of application
- summary: 1-2 sentence overview of what the evaluator wants to see

Return ONLY valid JSON matching this schema:
{
  "explicitRequirements": string[],
  "impliedCriteria": string[],
  "submissionRisks": string[],
  "suggestedAngles": string[],
  "summary": string
}

No markdown. No explanation. JSON only.`;

export interface ParseBriefInput {
  brief: string;
  question: string;
}

export interface ParseBriefOutput {
  briefAnalysis: BriefAnalysis;
  provider: string;
  model: string;
  durationMs: number;
  success: boolean;
  error?: string;
}

export async function parseBriefAgent(
  input: ParseBriefInput,
  llmConfig: LLMConfig
): Promise<ParseBriefOutput> {
  const start = Date.now();
  const fullText = `Brief: ${input.brief}\n\nQuestion: ${input.question}`;

  try {
    const result = await callLLM(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: fullText },
      ],
      llmConfig,
      { temperature: 0, maxTokens: 1024, topP: 1 }
    );

    const analysis = JSON.parse(result.content) as BriefAnalysis;
    return {
      briefAnalysis: analysis,
      provider: result.provider,
      model: result.model,
      durationMs: Date.now() - start,
      success: true,
    };
  } catch (err) {
    return {
      briefAnalysis: buildFallback(input.brief),
      provider: llmConfig.provider,
      model: llmConfig.model || 'fallback',
      durationMs: Date.now() - start,
      success: false,
      error: String(err),
    };
  }
}

function buildFallback(brief: string): BriefAnalysis {
  const explicitRequirements: string[] = [];
  const impliedCriteria: string[] = [];
  const submissionRisks: string[] = [];

  if (/link|url|website|portfolio|github/i.test(brief)) {
    explicitRequirements.push('Public link must be included');
    submissionRisks.push('Missing required link can disqualify submission');
  }
  if (/video|pitch|60.*second|90.*second/i.test(brief)) {
    explicitRequirements.push('60-90 second video');
    impliedCriteria.push('Clear verbal delivery');
  }
  if (/why.*fit|fit.*fellowship|why.*this/i.test(brief)) {
    explicitRequirements.push('Explain why this opportunity fits you');
  }

  return {
    explicitRequirements,
    impliedCriteria,
    submissionRisks,
    suggestedAngles: [],
    summary: 'Analyzed: ' + brief.slice(0, 80),
  };
}