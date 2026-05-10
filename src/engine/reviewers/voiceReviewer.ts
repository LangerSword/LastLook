import { compareToPreferredTone, type ToneComparisonResult } from '../tools/compareToPreferredTone';
import { detectCorporateSpeak, type CorporateSpeakResult } from '../tools/detectCorporateSpeak';
import type { ReviewerResult } from './index';

export interface VoiceReviewerInput {
  answer: string;
  preferredTone?: string;
}

export function VoiceReviewer(input: VoiceReviewerInput): ReviewerResult {
  const toneMatch = compareToPreferredTone(input.answer, input.preferredTone);
  const corporateSpeak = detectCorporateSpeak(input.answer);

  const findings: string[] = [];
  const suggestions: string[] = [];

  if (toneMatch.match) {
    findings.push(`Tone matches preference: ${toneMatch.preferred}`);
  } else {
    findings.push(`Tone differs from ${toneMatch.preferred}`);
    suggestions.push(...toneMatch.suggestions);
  }

  findings.push(`Voice score: ${toneMatch.score}/100`);

  if (corporateSpeak.isCorporate) {
    findings.push(`Corporate speak detected: ${corporateSpeak.detected.join(', ')}`);
    suggestions.push('Use plain, direct language instead');
  }

  const score = toneMatch.score - (corporateSpeak.isCorporate ? 20 : 0);

  return {
    score,
    status: score >= 80 ? 'pass' : score >= 50 ? 'warning' : 'fail',
    findings,
    suggestions,
  };
}