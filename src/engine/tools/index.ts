export interface ToolResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  durationMs: number;
}

export interface StageTiming {
  stage: string;
  startTime: number;
  endTime: number;
  durationMs: number;
  status: 'completed' | 'failed' | 'fallback' | 'skipped';
  error?: string;
}

export function createToolResult<T>(data: T, durationMs: number): ToolResult<T> {
  return { success: true, data, durationMs };
}

export function createToolError<T>(error: string, durationMs: number): ToolResult<T> {
  return { success: false, error, durationMs };
}

export function trackTiming(stage: string, startTime: number, status: StageTiming['status'], error?: string): StageTiming {
  return {
    stage,
    startTime,
    endTime: Date.now(),
    durationMs: Date.now() - startTime,
    status,
    error,
  };
}

export { wordCount } from './wordCount';
export { estimateSpeakingTime } from './speakingTime';
export { detectUrls } from './detectUrls';
export { detectRequiredLinks } from './detectRequiredLinks';
export { detectGenericPhrases } from './detectGenericPhrases';
export { detectProjectNamesWithoutExplanation } from './detectProjectNames';
export { buildEvidenceBank } from './buildEvidenceBank';
export { matchRequirementCoverage } from './matchRequirementCoverage';
export { scoreRequirementCoverage } from './scoreRequirementCoverage';
export { computeReadinessScore } from './computeReadinessScore';
export { buildApplicationPacket } from './buildApplicationPacket';
export { mapMemoryToOpportunity } from './mapMemoryToOpportunity';
export { checkAnswerStructure } from './checkAnswerStructure';
export { suggestPlainLanguageRewrite } from './suggestPlainLanguage';
export { findUnsupportedClaims } from './findUnsupportedClaims';
export { suggestEvidenceInsertion } from './suggestEvidenceInsertion';
export { compareToTargetLength } from './compareToTargetLength';
export { compareToPreferredTone } from './compareToPreferredTone';
export { detectCorporateSpeak } from './detectCorporateSpeak';
export { detectSubmissionBlockers } from './detectSubmissionBlockers';
export { detectDeadlineUrgency } from './detectDeadlineUrgency';