export interface SubmissionBlockerResult {
  blockers: { type: string; severity: 'critical' | 'high' | 'medium'; message: string }[];
  hasBlockers: boolean;
}

export function detectSubmissionBlockers(
  answer: string,
  requiredLinks: string[],
  missingLinks: string[]
): SubmissionBlockerResult {
  const blockers: SubmissionBlockerResult['blockers'] = [];

  if (missingLinks.length > 0) {
    blockers.push({
      type: 'missing_link',
      severity: 'critical',
      message: `Required links missing: ${missingLinks.join(', ')}`,
    });
  }

  if (requiredLinks.length > 0 && answer.length < 50) {
    blockers.push({
      type: 'too_short',
      severity: 'high',
      message: 'Answer too short for submission',
    });
  }

  if (!answer.trim()) {
    blockers.push({
      type: 'empty',
      severity: 'critical',
      message: 'Answer is empty',
    });
  }

  return {
    blockers,
    hasBlockers: blockers.length > 0,
  };
}