import { wordCount } from '../tools/wordCount';
import { estimateSpeakingTime } from '../tools/speakingTime';
import { compareToTargetLength, type LengthComparisonResult } from '../tools/compareToTargetLength';
import type { ReviewerResult } from './index';

export interface LengthReviewerInput {
  answer: string;
  targetLength?: { minWords?: number; maxWords?: number; minSeconds?: number; maxSeconds?: number };
}

export function LengthReviewer(input: LengthReviewerInput): ReviewerResult {
  const wordCountResult = wordCount(input.answer);
  const speakingTime = estimateSpeakingTime(input.answer);
  const comparison = compareToTargetLength(wordCountResult.count, input.targetLength);

  const findings: string[] = [];
  const suggestions: string[] = [];

  findings.push(`Word count: ${wordCountResult.count}`);
  findings.push(`Speaking time: ~${speakingTime.seconds}s (${speakingTime.range})`);
  findings.push(`Target status: ${comparison.status}`);

  if (comparison.status === 'too_short') {
    suggestions.push(comparison.suggestion);
  } else if (comparison.status === 'too_long') {
    suggestions.push(comparison.suggestion);
  } else {
    findings.push('Length is appropriate for the target');
  }

  if (wordCountResult.averageSentenceLength > 22) {
    findings.push(`Average sentence length (${wordCountResult.averageSentenceLength}) is high`);
    suggestions.push('Break long sentences into shorter ones');
  }

  const score = comparison.status === 'fits' ? 95 :
                comparison.status === 'too_long' ? 75 : 60;

  return {
    score,
    status: score >= 80 ? 'pass' : score >= 50 ? 'warning' : 'fail',
    findings,
    suggestions,
  };
}