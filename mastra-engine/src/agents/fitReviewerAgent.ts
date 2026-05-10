import type { ReviewerResult, ApplicationMemory } from '../schemas';
import { callLLM, type LLMConfig } from '../lib/llm';
import { genericPhraseDetectorTool } from '../tools/genericPhraseDetector';
import { evidenceBankTool } from '../tools/evidenceBank';

const SYSTEM_PROMPT = `You are an opportunity fit reviewer.

Evaluate whether the application answer shows specific alignment with the opportunity rather than generic enthusiasm.

Input provides:
- answer: the application text
- memory: saved applicant profile, projects, achievements
- applicationType: type of opportunity (Fellowship, Hackathon, etc.)
- briefAnalysis: what the opportunity asks for
- genericPhrases: detected generic phrases from the answer
- evidenceBank: relevant evidence from saved memory

Return ONLY valid JSON matching this schema:
{
  "score": number (0-100),
  "verdict": string (one sentence verdict),
  "specificFindings": string[] (2-4 findings with concrete details from the input),
  "fixes": string[] (2-4 fixes)
}

Rules:
- Quote or reference at least one specific detail from memory, projects, or the answer
- Identify generic phrases and explain why they fail the fit test
- Connect the answer to specific application type evaluation criteria
- No markdown. JSON only.`;

interface FitReviewerInput {
  answer: string;
  memory: ApplicationMemory | null;
  applicationType: string;
  briefAnalysis: { summary: string; explicitRequirements: string[] };
  evidenceBank: { projects: string[]; personalAngles: string[] };
}

interface FitReviewerOutput {
  result: ReviewerResult;
  provider: string;
  model: string;
  durationMs: number;
  success: boolean;
  error?: string;
}

export async function fitReviewerAgent(
  input: FitReviewerInput,
  llmConfig: LLMConfig
): Promise<FitReviewerOutput> {
  const start = Date.now();

  const genericPhrases = genericPhraseDetectorTool({ answer: input.answer });
  const evidence = input.evidenceBank || evidenceBankTool({ memory: input.memory, answer: input.answer, briefAnalysis: input.briefAnalysis });

  const context = {
    applicationType: input.applicationType,
    briefSummary: input.briefAnalysis.summary,
    briefRequirements: input.briefAnalysis.explicitRequirements.slice(0, 5),
    genericPhrases: genericPhrases.phrases.map((g) => g.phrase),
    evidence: {
      projects: evidence.projects.slice(0, 3),
      personalAngles: evidence.personalAngles.slice(0, 2),
    },
    profile: input.memory?.profile ? {
      name: input.memory.profile.name,
      currentFocus: input.memory.profile.currentFocus,
      preferredTone: input.memory.profile.preferredTone,
    } : null,
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
        verdict: parsed.verdict || 'Fit assessment unavailable',
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
        verdict: 'Fit review could not complete',
        specificFindings: ['Fit review failed with fallback data'],
        fixes: ['Review fit manually'],
      },
      provider: llmConfig.provider,
      model: llmConfig.model || 'fallback',
      durationMs: Date.now() - start,
      success: false,
      error: String(err),
    };
  }
}