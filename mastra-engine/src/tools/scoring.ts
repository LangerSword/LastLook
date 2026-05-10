import { z } from 'zod';
import { ReviewerResultSchema, DeterministicChecksSchema } from '../schemas';

export const ScoringInputSchema = z.object({
  requirementCoverage: z.array(z.object({ status: z.enum(['covered', 'partial', 'missing']), priority: z.enum(['high', 'medium', 'low']) })),
  reviewerPanel: z.object({
    requirements: ReviewerResultSchema,
    fit: ReviewerResultSchema,
    clarity: ReviewerResultSchema,
    evidence: ReviewerResultSchema,
    length: ReviewerResultSchema,
    voice: ReviewerResultSchema,
    risk: ReviewerResultSchema,
  }),
  deterministicChecks: DeterministicChecksSchema.optional(),
});
export const ScoringOutputSchema = z.object({
  score: z.number(),
  status: z.string(),
  componentScores: z.record(z.string(), z.number()),
});

const WEIGHTS = {
  requirements: 0.35,
  fit: 0.20,
  evidence: 0.15,
  clarity: 0.10,
  length: 0.10,
  risk: 0.10,
};

export function scoringTool(input: z.infer<typeof ScoringInputSchema>): z.infer<typeof ScoringOutputSchema> {
  const panel = input.reviewerPanel;
  const coverage = input.requirementCoverage;

  let coverageScore = 100;
  for (const item of coverage) {
    if (item.status === 'missing') coverageScore -= 15;
    else if (item.status === 'partial') coverageScore -= 7;
  }

  const panelScores = {
    requirements: Math.max(0, Math.min(100, panel.requirements.score)),
    fit: Math.max(0, Math.min(100, panel.fit.score)),
    clarity: Math.max(0, Math.min(100, panel.clarity.score)),
    evidence: Math.max(0, Math.min(100, panel.evidence.score)),
    length: Math.max(0, Math.min(100, panel.length.score)),
    voice: Math.max(0, Math.min(100, panel.voice.score)),
    risk: Math.max(0, Math.min(100, panel.risk.score)),
  };

  const overall = Math.round(
    panelScores.requirements * WEIGHTS.requirements +
    panelScores.fit * WEIGHTS.fit +
    panelScores.evidence * WEIGHTS.evidence +
    panelScores.clarity * WEIGHTS.clarity +
    panelScores.length * WEIGHTS.length +
    panelScores.risk * WEIGHTS.risk
  );

  const score = Math.max(0, Math.min(100, overall));

  let status: string;
  if (score >= 85) status = 'ready_minor_polish';
  else if (score >= 70) status = 'close_needs_edits';
  else if (score >= 50) status = 'needs_major_fixes';
  else status = 'not_ready';

  return {
    score,
    status,
    componentScores: panelScores,
  };
}