import { detectRequiredLinks, type RequiredLinkResult } from '../tools/detectRequiredLinks';
import { detectSubmissionBlockers, type SubmissionBlockerResult } from '../tools/detectSubmissionBlockers';
import { detectDeadlineUrgency, type DeadlineUrgencyResult } from '../tools/detectDeadlineUrgency';
import type { ReviewerResult } from './index';

export interface RiskReviewerInput {
  answer: string;
  briefAnalysis: { explicitRequirements?: string[]; requiredLinks?: { type: string; required: boolean }[] };
  deadline?: string;
}

export function RiskReviewer(input: RiskReviewerInput): ReviewerResult {
  const linkStatus = detectRequiredLinks(input.briefAnalysis, input.answer);
  const blockers = detectSubmissionBlockers(input.answer, linkStatus.found, linkStatus.missing);
  const deadlineUrgency = detectDeadlineUrgency(input.deadline);

  const findings: string[] = [];
  const suggestions: string[] = [];

  if (blockers.hasBlockers) {
    for (const blocker of blockers.blockers) {
      findings.push(`[${blocker.severity.toUpperCase()}] ${blocker.message}`);
      if (blocker.severity === 'critical') {
        suggestions.push('FIX IMMEDIATELY: ' + blocker.message);
      }
    }
  } else {
    findings.push('No submission blockers detected');
  }

  if (linkStatus.missing.length > 0) {
    suggestions.push(`Add required links: ${linkStatus.missing.join(', ')}`);
  }

  findings.push(`Deadline: ${deadlineUrgency.mode} (${deadlineUrgency.urgency} urgency)`);
  suggestions.push(deadlineUrgency.recommendation);

  const hasBlockers = blockers.blockers.some(b => b.severity === 'critical');
  const score = hasBlockers ? 30 : blockers.blockers.length > 0 ? 50 : 90;

  return {
    score,
    status: score >= 80 ? 'pass' : score >= 50 ? 'warning' : 'fail',
    findings,
    suggestions,
  };
}