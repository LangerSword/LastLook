import type { ReviewerResult, ApplicationMemory, EvidenceBank } from '../schemas';
import { callLLM, type LLMConfig } from '../lib/llm';

const SYSTEM_PROMPT = `You are an evidence reviewer.

Check whether claims in the application answer are backed by concrete evidence from the applicant's memory.

Input provides:
- answer: the application text
- memory: saved projects, achievements, and personal details
- evidenceBank: extracted evidence relevant to the answer

Return ONLY valid JSON matching this schema:
{
  "score": number (0-100),
  "verdict": string (one sentence verdict),
  "specificFindings": string[] (2-4 findings with specific evidence references),
  "fixes": string[] (2-4 fixes)
}

Rules:
- Reference specific project names, achievements, or metrics from memory
- Identify claims that lack supporting evidence
- Note which saved evidence was used vs unused
- No markdown. JSON only.`;

interface EvidenceReviewerInput {
  answer: string;
  memory: ApplicationMemory | null;
  evidenceBank: EvidenceBank;
}

interface EvidenceReviewerOutput {
  result: ReviewerResult;
  provider: string;
  model: string;
  durationMs: number;
  success: boolean;
  error?: string;
}

export async function evidenceReviewerAgent(
  input: EvidenceReviewerInput,
  llmConfig: LLMConfig
): Promise<EvidenceReviewerOutput> {
  const start = Date.now();
  const projects = input.memory?.projects || [];
  const achievements = input.memory?.achievements || [];

  const context = {
    savedProjects: projects.map((p) => ({ name: p.name, oneLiner: p.oneLiner })),
    savedAchievements: achievements.map((a) => ({ title: a.title, description: a.description })),
    evidenceInAnswer: {
      projects: input.evidenceBank.projects.slice(0, 5),
      achievements: input.evidenceBank.achievements.slice(0, 5),
    },
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
        verdict: parsed.verdict || 'Evidence assessment unavailable',
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
        verdict: 'Evidence review could not complete',
        specificFindings: [`Saved projects: ${projects.map((p) => p.name).join(', ') || 'none'}`],
        fixes: ['Review evidence manually'],
      },
      provider: llmConfig.provider,
      model: llmConfig.model || 'fallback',
      durationMs: Date.now() - start,
      success: false,
      error: String(err),
    };
  }
}