import { matchRequirementCoverage, type CoverageResult } from '../tools/matchRequirementCoverage';
import { detectRequiredLinks, type RequiredLinkResult } from '../tools/detectRequiredLinks';
import { scoreRequirementCoverage, type CoverageScoreResult } from '../tools/scoreRequirementCoverage';
import type { ReviewerResult } from './index';

export interface RequirementReviewerInput {
  briefAnalysis: { explicitRequirements?: string[]; requiredLinks?: { type: string; required: boolean }[] };
  answer: string;
  memoryLinks?: { github?: string; linkedin?: string; portfolio?: string; demoVideo?: string };
}

export interface RequirementReviewerOutput {
  coverage: CoverageResult;
  linkStatus: RequiredLinkResult;
  score: CoverageScoreResult;
}

export function RequirementReviewer(input: RequirementReviewerInput): ReviewerResult & { details: RequirementReviewerOutput } {
  const linkStatus = detectRequiredLinks(input.briefAnalysis, input.answer, input.memoryLinks);
  const coverage = matchRequirementCoverage(input.briefAnalysis, input.answer, { projects: [], achievements: [], links: [] }, { links: linkStatus });
  const score = scoreRequirementCoverage({ covered: coverage.covered, partial: coverage.partial, missing: coverage.missing });

  const findings: string[] = [];
  const suggestions: string[] = [];

  if (linkStatus.missing.length > 0) {
    findings.push(`MISSING required links: ${linkStatus.missing.join(', ')}`);
    suggestions.push('Add required public links');
  }

  if (coverage.missing > 0) {
    findings.push(`${coverage.missing} requirements not addressed`);
    suggestions.push('Add one sentence per missing requirement');
  }

  if (coverage.partial > 0) {
    findings.push(`${coverage.partial} requirements partially covered`);
  }

  findings.push(`${coverage.covered}/${coverage.items.length} requirements fully covered`);

  return {
    score: score.score,
    status: score.score >= 80 ? 'pass' : score.score >= 50 ? 'warning' : 'fail',
    findings,
    suggestions,
    details: { coverage, linkStatus, score },
  };
}