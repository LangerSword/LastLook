import { z } from 'zod';
import { DeterministicChecksSchema } from '../schemas';
import { wordCountTool } from './wordCount';
import { speakingTimeTool } from './speakingTime';
import { urlDetectorTool } from './urlDetector';
import { requiredLinkDetectorTool } from './requiredLinkDetector';
import { genericPhraseDetectorTool } from './genericPhraseDetector';
import { projectExplanationCheckTool } from './projectExplanationCheck';

export const DeterministicChecksInputSchema = z.object({
  briefAnalysis: z.any(),
  answer: z.string(),
  memory: z.any().nullable(),
});
export const DeterministicChecksOutputSchema = DeterministicChecksSchema;

export function deterministicChecksTool(input: z.infer<typeof DeterministicChecksInputSchema>) {
  const wordCountResult = wordCountTool({ text: input.answer });
  const speakingTime = speakingTimeTool({ text: input.answer });
  const urls = urlDetectorTool({ text: input.answer });

  const brief = input.briefAnalysis;
  const memory = input.memory;

  const linkResult = requiredLinkDetectorTool({
    briefAnalysis: brief,
    answer: input.answer,
    memoryLinks: memory?.linkVault || null,
  });

  const genericPhrases = genericPhraseDetectorTool({ answer: input.answer });

  const projectWarnings = projectExplanationCheckTool({
    answer: input.answer,
    memoryProjects: memory?.projects || [],
  });

  let lengthStatus: 'tooShort' | 'tooLong' | 'fits' | 'unknown' = 'unknown';
  let lengthNote = 'Target length not specified.';
  const wc = wordCountResult.wordCount;

  if (brief?.explicitRequirements) {
    const isVideoBrief = brief.explicitRequirements.some((r: string) => /video|60.*second|90.*second/i.test(r));
    if (isVideoBrief) {
      if (wc < 100) { lengthStatus = 'tooShort'; lengthNote = `${wc} words (~${speakingTime.seconds}s) is too short for 60-90 second video (need ~145-220 words).`; }
      else if (wc > 220) { lengthStatus = 'tooLong'; lengthNote = `${wc} words (~${speakingTime.seconds}s) is too long for 60-90 second video.`; }
      else { lengthStatus = 'fits'; lengthNote = `${wc} words (~${speakingTime.seconds}s) fits the 60-90 second window.`; }
    } else {
      if (wc < 80) { lengthStatus = 'tooShort'; lengthNote = `${wc} words is shorter than typical application answers.`; }
      else if (wc > 300) { lengthStatus = 'tooLong'; lengthNote = `${wc} words exceeds typical application limits.`; }
      else { lengthStatus = 'fits'; lengthNote = `${wc} words is within a reasonable range.`; }
    }
  }

  const mentionedProjects = memory?.projects
    ? memory.projects.filter((p: any) => input.answer.toLowerCase().includes(p.name.toLowerCase())).map((p: any) => p.name)
    : [];
  const unusedProjects = memory?.projects
    ? memory.projects.filter((p: any) => !input.answer.toLowerCase().includes(p.name.toLowerCase()) && brief?.explicitRequirements?.some((r: string) => /project|work|building/i.test(r))).map((p: any) => p.name)
    : [];

  return {
    wordCount: wc,
    speakingTimeSeconds: speakingTime.seconds,
    lengthFit: { status: lengthStatus, note: lengthNote },
    links: linkResult,
    genericPhrases: genericPhrases.phrases,
    projectExplanationWarnings: projectWarnings.warnings,
    memoryUsage: {
      usedProjects: mentionedProjects,
      unusedRelevantProjects: unusedProjects,
      note: mentionedProjects.length > 0 ? `Used ${mentionedProjects.length} saved project(s).` : 'No saved projects mentioned in answer.',
    },
    formattingIssues: [],
  };
}