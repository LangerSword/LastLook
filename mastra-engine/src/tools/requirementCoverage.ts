import { z } from 'zod';
import { BriefAnalysisSchema, RequirementCoverageItemSchema, DeterministicChecksSchema } from '../schemas';

export const RequirementCoverageInputSchema = z.object({
  briefAnalysis: BriefAnalysisSchema,
  answer: z.string(),
  evidenceBank: z.any(),
  deterministicChecks: z.any(),
});
export const RequirementCoverageOutputSchema = z.object({
  items: z.array(RequirementCoverageItemSchema),
});

export function requirementCoverageTool(input: z.infer<typeof RequirementCoverageInputSchema>): z.infer<typeof RequirementCoverageOutputSchema> {
  const answer = input.answer.toLowerCase();
  const evidenceText = (input.evidenceBank?.projects || []).concat(
    input.evidenceBank?.achievements || [],
    input.evidenceBank?.personalAngles || []
  ).join('\n').toLowerCase();

  const checks = input.deterministicChecks || {};
  const urlsFound = checks.links?.urlsFound || [];

  const items = input.briefAnalysis.explicitRequirements.map((req: string) => {
    const reqLower = req.toLowerCase();
    const tokens = reqLower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w: string) => w.length > 3);
    const matchedTokens = tokens.filter((token: string) => answer.includes(token) || evidenceText.includes(token));
    const score = tokens.length === 0 ? 0 : matchedTokens.length / tokens.length;

    const isLinkReq = /link|url|website|portfolio|github|video|demo/i.test(reqLower);
    const hasRequiredLink = isLinkReq && urlsFound.length > 0;
    const hasEvidence = score >= 0.6 || matchedTokens.length > 0;

    let status: 'covered' | 'partial' | 'missing';
    if (isLinkReq) {
      status = hasRequiredLink ? 'covered' : 'missing';
    } else {
      status = hasEvidence && score >= 0.6 ? 'covered' : score > 0.15 ? 'partial' : 'missing';
    }

    let note = '';
    let whatToAdd = '';
    if (status === 'covered') {
      note = `Covered by: ${matchedTokens.slice(0, 2).join(', ') || 'answer content'}`;
      whatToAdd = 'Already covered. Add one more concrete detail.';
    } else if (status === 'partial') {
      note = `Partial coverage. Tokens found: ${matchedTokens.join(', ') || 'none'}.`;
      whatToAdd = `Strengthen with one more specific detail about: "${req}".`;
    } else {
      note = `Missing from the answer.`;
      whatToAdd = `Add one sentence that directly answers: "${req}".`;
    }

    return {
      requirement: req,
      status,
      note: `[AI Review] ${note}`,
      evidenceFound: matchedTokens.length > 0
        ? `Matched tokens: ${matchedTokens.slice(0, 3).join(', ')}`
        : 'No direct evidence found in answer or memory.',
      whatToAdd,
      priority: status === 'missing' ? 'high' : status === 'partial' ? 'medium' : 'low' as const,
    };
  });

  return { items };
}