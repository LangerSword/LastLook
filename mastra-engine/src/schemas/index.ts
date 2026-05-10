import { z } from 'zod';

export const ApplicationTypeSchema = z.enum([
  'Fellowship',
  'Hackathon',
  'Internship',
  'Accelerator',
  'Scholarship',
  'Club/community',
  'Grant',
  'Other',
]);
export type ApplicationType = z.infer<typeof ApplicationTypeSchema>;

export const ReviewStrictnessSchema = z.enum(['Gentle', 'Balanced', 'Brutal']);
export type ReviewStrictness = z.infer<typeof ReviewStrictnessSchema>;

export const MemoryProfileSchema = z.object({
  name: z.string(),
  shortBio: z.string(),
  currentFocus: z.string(),
  preferredTone: z.string(),
  locationTimezone: z.string().optional(),
});
export type MemoryProfile = z.infer<typeof MemoryProfileSchema>;

export const MemoryProjectSchema = z.object({
  name: z.string(),
  oneLiner: z.string(),
  longerExplanation: z.string(),
  tags: z.array(z.string()),
  links: z.array(z.string()),
  proof: z.string(),
  bestUseCase: z.string(),
});
export type MemoryProject = z.infer<typeof MemoryProjectSchema>;

export const MemoryAchievementSchema = z.object({
  title: z.string(),
  description: z.string(),
  proof: z.string(),
  category: z.string(),
});
export type MemoryAchievement = z.infer<typeof MemoryAchievementSchema>;

export const LinkVaultSchema = z.object({
  github: z.string(),
  linkedin: z.string(),
  portfolio: z.string(),
  resume: z.string(),
  demoVideo: z.string(),
  projectLinks: z.array(z.string()),
  otherLinks: z.array(z.string()),
});
export type LinkVault = z.infer<typeof LinkVaultSchema>;

export const ApplicationMemorySchema = z.object({
  profile: MemoryProfileSchema,
  projects: z.array(MemoryProjectSchema),
  achievements: z.array(MemoryAchievementSchema),
  linkVault: LinkVaultSchema,
  preferences: z.object({ preferredTone: z.string(), preferredApplicationTypes: z.array(z.string()), timezone: z.string().optional(), notes: z.string().optional() }),
  updatedAt: z.string().optional(),
});
export type ApplicationMemory = z.infer<typeof ApplicationMemorySchema>;

export const BriefAnalysisSchema = z.object({
  explicitRequirements: z.array(z.string()),
  impliedCriteria: z.array(z.string()),
  submissionRisks: z.array(z.string()),
  suggestedAngles: z.array(z.string()),
  summary: z.string(),
});
export type BriefAnalysis = z.infer<typeof BriefAnalysisSchema>;

export const EvidenceBankSchema = z.object({
  projects: z.array(z.string()),
  achievements: z.array(z.string()),
  links: z.array(z.string()),
  personalAngles: z.array(z.string()),
  reusableSnippets: z.array(z.string()),
  answerSnippets: z.array(z.string()),
});
export type EvidenceBank = z.infer<typeof EvidenceBankSchema>;

export const DeterministicChecksSchema = z.object({
  wordCount: z.number(),
  speakingTimeSeconds: z.number(),
  lengthFit: z.object({ status: z.enum(['tooShort', 'tooLong', 'fits', 'unknown']), note: z.string() }),
  links: z.object({ urlsFound: z.array(z.string()), requiredLinksMissing: z.array(z.string()), savedLinksAvailable: z.array(z.string()) }),
  genericPhrases: z.array(z.object({ phrase: z.string(), replacementSuggestion: z.string() })),
  projectExplanationWarnings: z.array(z.object({ projectName: z.string(), issue: z.string(), suggestedOneLiner: z.string() })),
  memoryUsage: z.object({ usedProjects: z.array(z.string()), unusedRelevantProjects: z.array(z.string()), note: z.string() }),
  formattingIssues: z.array(z.string()),
});
export type DeterministicChecks = z.infer<typeof DeterministicChecksSchema>;

export const RequirementCoverageItemSchema = z.object({
  requirement: z.string(),
  status: z.enum(['covered', 'partial', 'missing']),
  note: z.string(),
  evidenceFound: z.string(),
  whatToAdd: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
});
export type RequirementCoverageItem = z.infer<typeof RequirementCoverageItemSchema>;

export const ReviewerResultSchema = z.object({
  score: z.number(),
  verdict: z.string(),
  specificFindings: z.array(z.string()),
  fixes: z.array(z.string()),
});
export type ReviewerResult = z.infer<typeof ReviewerResultSchema>;

export const NextBestEditSchema = z.object({
  title: z.string(),
  reason: z.string(),
  suggestedText: z.string(),
});
export type NextBestEdit = z.infer<typeof NextBestEditSchema>;

export const FixPlanItemSchema = z.object({
  step: z.number(),
  title: z.string(),
  why: z.string(),
  effort: z.string(),
  impact: z.enum(['high', 'medium', 'low']),
  suggestedText: z.string(),
});
export type FixPlanItem = z.infer<typeof FixPlanItemSchema>;

export const ImprovedApplicationSchema = z.object({
  originalAnswer: z.string(),
  improvedAnswer: z.string(),
  whatChanged: z.array(z.string()),
  whyItIsBetter: z.array(z.string()),
  wordCount: z.number(),
  speakingTimeSeconds: z.number(),
});
export type ImprovedApplication = z.infer<typeof ImprovedApplicationSchema>;

export const WorkflowInputSchema = z.object({
  brief: z.string(),
  question: z.string(),
  answer: z.string(),
  memory: ApplicationMemorySchema.nullable(),
  programName: z.string(),
  applicationType: ApplicationTypeSchema,
  reviewStrictness: ReviewStrictnessSchema,
  targetLength: z.string(),
  deadline: z.string().optional(),
});
export type WorkflowInput = z.infer<typeof WorkflowInputSchema>;

export const StageTimingSchema = z.object({
  stage: z.string(),
  startTime: z.number(),
  endTime: z.number(),
  durationMs: z.number(),
  status: z.enum(['completed', 'failed', 'fallback', 'skipped']),
  error: z.string().optional(),
});
export type StageTiming = z.infer<typeof StageTimingSchema>;

export const DebugInfoSchema = z.object({
  engineVersion: z.string(),
  resultMode: z.enum(['ai_full', 'cached', 'deterministic_fallback', 'mock_demo']),
  cacheHit: z.boolean(),
  providerUsed: z.string().optional(),
  fallbackUsed: z.boolean(),
  stagesCompleted: z.array(z.string()),
  timings: z.array(StageTimingSchema),
  totalDurationMs: z.number(),
});
export type DebugInfo = z.infer<typeof DebugInfoSchema>;

export const FullReviewResultSchema = z.object({
  reviewId: z.string(),
  programName: z.string(),
  applicationType: ApplicationTypeSchema,
  briefAnalysis: BriefAnalysisSchema,
  evidenceBank: EvidenceBankSchema,
  deterministicChecks: DeterministicChecksSchema,
  requirementCoverage: z.array(RequirementCoverageItemSchema),
  reviewerPanel: z.object({
    requirements: ReviewerResultSchema,
    fit: ReviewerResultSchema,
    clarity: ReviewerResultSchema,
    evidence: ReviewerResultSchema,
    length: ReviewerResultSchema,
    voice: ReviewerResultSchema,
    risk: ReviewerResultSchema,
  }),
  nextBestEdit: NextBestEditSchema,
  fixPlan: z.array(FixPlanItemSchema),
  improvedApplication: ImprovedApplicationSchema,
  debug: DebugInfoSchema,
});
export type FullReviewResult = z.infer<typeof FullReviewResultSchema>;

export const WorkflowOutputSchema = z.object({
  result: FullReviewResultSchema.nullable(),
  error: z.string().optional(),
  debug: DebugInfoSchema,
});
export type WorkflowOutput = z.infer<typeof WorkflowOutputSchema>;