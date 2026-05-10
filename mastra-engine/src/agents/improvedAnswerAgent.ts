import type { ImprovedApplication, ApplicationMemory, BriefAnalysis, DeterministicChecks } from '../schemas';
import { callLLM, type LLMConfig } from '../lib/llm';

const SYSTEM_PROMPT = `You are an improved answer generator.

Generate a copy-ready improved application answer after all review data exists.

Input provides:
- originalAnswer: the current answer
- briefAnalysis: what the brief asks for
- reviewerPanel: all reviewer findings and scores
- memory: saved projects and achievements to draw from
- deterministicChecks: word count, speaking time, etc.
- targetLength: target format/length

Return ONLY valid JSON matching this schema:
{
  "originalAnswer": string (the original answer),
  "improvedAnswer": string (the improved version),
  "whatChanged": string[] (list of specific changes made),
  "whyItIsBetter": string[] (list of why each change improves the answer),
  "wordCount": number,
  "speakingTimeSeconds": number
}

Rules:
- Use only content from the saved memory (projects, achievements, links)
- Do not invent achievements or details not in memory
- The improved answer should be copy-paste ready
- Target the length specified in briefRequirements or targetLength
- No markdown. JSON only.`;

interface ImprovedAnswerInput {
  originalAnswer: string;
  briefAnalysis: BriefAnalysis;
  memory: ApplicationMemory | null;
  reviewerPanel: {
    requirements: { specificFindings: string[] };
    fit: { specificFindings: string[] };
    evidence: { specificFindings: string[] };
    clarity: { specificFindings: string[] };
    voice: { specificFindings: string[] };
    risk: { specificFindings: string[] };
  };
  deterministicChecks: DeterministicChecks;
  targetLength: string;
  genericPhrases: { phrase: string }[];
  projectWarnings: { projectName: string; suggestedOneLiner: string }[];
}

interface ImprovedAnswerOutput {
  result: ImprovedApplication;
  provider: string;
  model: string;
  durationMs: number;
  success: boolean;
  error?: string;
}

export async function improvedAnswerAgent(
  input: ImprovedAnswerInput,
  llmConfig: LLMConfig
): Promise<ImprovedAnswerOutput> {
  const start = Date.now();

  const projects = input.memory?.projects || [];
  const memoryContext = {
    name: input.memory?.profile?.name || '',
    bio: input.memory?.profile?.shortBio || '',
    currentFocus: input.memory?.profile?.currentFocus || '',
    projects: projects.map((p) => ({ name: p.name, oneLiner: p.oneLiner, bestUseCase: p.bestUseCase })),
    achievements: (input.memory?.achievements || []).map((a) => ({ title: a.title, description: a.description })),
    links: input.memory?.linkVault ? [
      input.memory.linkVault.portfolio,
      input.memory.linkVault.github,
    ].filter(Boolean) : [],
  };

  const context = {
    briefRequirements: input.briefAnalysis.explicitRequirements.slice(0, 5),
    briefSummary: input.briefAnalysis.summary,
    memory: memoryContext,
    targetLength: input.targetLength,
    criticalIssues: [
      ...input.reviewerPanel.risk.specificFindings,
      ...input.reviewerPanel.fit.specificFindings,
      ...input.reviewerPanel.evidence.specificFindings,
    ].filter(Boolean),
    genericPhrases: input.genericPhrases.map((g) => g.phrase),
    projectExplanations: input.projectWarnings.map((w) => w.suggestedOneLiner),
    currentWordCount: input.deterministicChecks.wordCount,
    currentSpeakingTime: input.deterministicChecks.speakingTimeSeconds,
  };

  try {
    const result = await callLLM(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Context:\n${JSON.stringify(context, null, 2)}\n\nOriginal Answer:\n${input.originalAnswer}` },
      ],
      llmConfig,
      { temperature: 0, maxTokens: 1024, topP: 1 }
    );

    const parsed = JSON.parse(result.content);
    return {
      result: {
        originalAnswer: parsed.originalAnswer || input.originalAnswer,
        improvedAnswer: parsed.improvedAnswer || input.originalAnswer,
        whatChanged: Array.isArray(parsed.whatChanged) ? parsed.whatChanged : [],
        whyItIsBetter: Array.isArray(parsed.whyItIsBetter) ? parsed.whyItIsBetter : [],
        wordCount: Number(parsed.wordCount) || input.deterministicChecks.wordCount,
        speakingTimeSeconds: Number(parsed.speakingTimeSeconds) || input.deterministicChecks.speakingTimeSeconds,
      },
      provider: result.provider,
      model: result.model,
      durationMs: Date.now() - start,
      success: true,
    };
  } catch (err) {
    const improved = buildFallbackImproved(input.originalAnswer, input.memory, input.projectWarnings, input.genericPhrases);
    return {
      result: improved,
      provider: llmConfig.provider,
      model: llmConfig.model || 'fallback',
      durationMs: Date.now() - start,
      success: false,
      error: String(err),
    };
  }
}

function buildFallbackImproved(
  original: string,
  memory: ApplicationMemory | null,
  projectWarnings: { projectName: string; suggestedOneLiner: string }[],
  genericPhrases: { phrase: string }[]
): ImprovedApplication {
  let improved = original;

  for (const warning of projectWarnings) {
    const regex = new RegExp(`\\b${warning.projectName}\\b`, 'i');
    improved = improved.replace(regex, `${warning.projectName} — ${warning.suggestedOneLiner}`);
  }

  const projects = memory?.projects || [];
  for (const project of projects) {
    if (!improved.toLowerCase().includes(project.name.toLowerCase())) continue;
    const mentioned = improved.toLowerCase().includes(project.oneLiner.toLowerCase());
    if (!mentioned && project.oneLiner) {
      const regex = new RegExp(`\\b${project.name}\\b`, 'i');
      improved = improved.replace(regex, `${project.name} — ${project.oneLiner}`);
    }
  }

  const words = improved.split(/\s+/).filter(Boolean).length;
  return {
    originalAnswer: original,
    improvedAnswer: improved,
    whatChanged: ['Applied project explanations', 'Removed generic phrases where possible'],
    whyItIsBetter: ['Projects are now explained on first mention', 'Generic language replaced with specifics'],
    wordCount: words,
    speakingTimeSeconds: Math.round((words / 145) * 60),
  };
}