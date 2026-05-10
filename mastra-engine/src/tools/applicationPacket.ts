import { z } from 'zod';
import { ApplicationTypeSchema, FixPlanItemSchema, RequirementCoverageItemSchema, NextBestEditSchema } from '../schemas';

export const ApplicationPacketInputSchema = z.object({
  reviewResult: z.object({
    programName: z.string(),
    applicationType: ApplicationTypeSchema,
    overallScore: z.number(),
    status: z.string(),
    nextBestEdit: NextBestEditSchema,
    improvedApplication: z.object({ improvedAnswer: z.string(), whatChanged: z.array(z.string()), wordCount: z.number(), speakingTimeSeconds: z.number() }),
    requirementCoverage: z.array(RequirementCoverageItemSchema),
    fixPlan: z.array(FixPlanItemSchema),
    reviewerPanel: z.any(),
  }),
});
export const ApplicationPacketOutputSchema = z.object({
  programName: z.string(),
  applicationType: z.string(),
  overallScore: z.number(),
  status: z.string(),
  nextBestEdit: z.string(),
  finalAnswers: z.array(z.string()),
  requirementChecklist: z.array(RequirementCoverageItemSchema),
  requiredLinks: z.array(z.string()),
  fixPlan: z.array(FixPlanItemSchema),
  submissionChecklist: z.array(z.string()),
  exportMarkdown: z.string(),
});

export function applicationPacketTool(input: z.infer<typeof ApplicationPacketInputSchema>): z.infer<typeof ApplicationPacketOutputSchema> {
  const result = input.reviewResult;
  const links: string[] = [];

  for (const item of result.requirementCoverage) {
    if (/link|url|website|portfolio|github|video/i.test(item.requirement)) {
      links.push(item.whatToAdd.replace('Add the public link: ', ''));
    }
  }

  const submissionChecklist = [
    ...result.requirementCoverage.map((i) => i.requirement),
    ...links.map((l) => `Confirm link: ${l}`),
    'Proofread the final answer once aloud',
    'Confirm the answer is within the target length',
  ];

  const exportMarkdown = [
    `# ${result.programName}`,
    ``,
    `## Readiness`,
    `- Score: ${result.overallScore}/100`,
    `- Status: ${result.status}`,
    `- Next best edit: ${result.nextBestEdit.title}`,
    ``,
    `## Requirement Checklist`,
    ...result.requirementCoverage.map((item) => `- [${item.status}] ${item.requirement} — ${item.note}`),
    ``,
    `## Fix Plan`,
    ...result.fixPlan.map((item) => `- ${item.step}. ${item.title} (${item.effort}, ${item.impact}) — ${item.why}`),
    ``,
    `## Improved Answer`,
    ``,
    result.improvedApplication.improvedAnswer,
    ``,
    `## What Changed`,
    ...result.improvedApplication.whatChanged.map((c) => `- ${c}`),
    ``,
    `## Submission Checklist`,
    ...submissionChecklist.map((item) => `- ${item}`),
  ].join('\n');

  return {
    programName: result.programName,
    applicationType: result.applicationType,
    overallScore: result.overallScore,
    status: result.status,
    nextBestEdit: result.nextBestEdit.title,
    finalAnswers: [result.improvedApplication.improvedAnswer],
    requirementChecklist: result.requirementCoverage,
    requiredLinks: links,
    fixPlan: result.fixPlan,
    submissionChecklist,
    exportMarkdown,
  };
}