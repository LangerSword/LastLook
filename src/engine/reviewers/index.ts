export { RequirementReviewer } from './requirementReviewer';
export { FitReviewer } from './fitReviewer';
export { ClarityReviewer } from './clarityReviewer';
export { EvidenceReviewer } from './evidenceReviewer';
export { LengthReviewer } from './lengthReviewer';
export { VoiceReviewer } from './voiceReviewer';
export { RiskReviewer } from './riskReviewer';

export interface ReviewerResult {
  score: number;
  status: 'pass' | 'warning' | 'fail';
  findings: string[];
  suggestions: string[];
}