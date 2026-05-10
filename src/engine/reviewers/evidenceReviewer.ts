import { buildEvidenceBank, type EvidenceBankResult } from '../tools/buildEvidenceBank';
import { findUnsupportedClaims, type UnsupportedClaim } from '../tools/findUnsupportedClaims';
import { suggestEvidenceInsertion, type EvidenceSuggestion } from '../tools/suggestEvidenceInsertion';
import type { ReviewerResult } from './index';

export interface EvidenceReviewerInput {
  answer: string;
  memory: {
    profile?: { name?: string; bio?: string; currentFocus?: string };
    projects?: { name?: string; oneLiner?: string; description?: string; evidence?: string[] }[];
    achievements?: { title?: string; description?: string; proofLink?: string }[];
    linkVault?: { github?: string; linkedin?: string; portfolio?: string; demoVideo?: string };
  };
}

export function EvidenceReviewer(input: EvidenceReviewerInput): ReviewerResult {
  const evidenceBank = buildEvidenceBank(input.memory, input.answer);
  const unsupportedClaims = findUnsupportedClaims(input.answer, evidenceBank);
  const suggestions = suggestEvidenceInsertion(input.answer, evidenceBank);

  const findings: string[] = [];
  const resultSuggestions: string[] = [];

  if (evidenceBank.missingEvidence.length > 0) {
    findings.push(...evidenceBank.missingEvidence);
  }

  const mentionedProjects = evidenceBank.projects.filter(p => p.mentioned).length;
  if (mentionedProjects === 0) {
    findings.push('No projects from memory mentioned in answer');
    resultSuggestions.push('Mention at least one project from your memory');
  } else {
    findings.push(`${mentionedProjects} projects mentioned`);
  }

  if (unsupportedClaims.length > 0) {
    findings.push(`${unsupportedClaims.length} claims without evidence`);
    for (const claim of unsupportedClaims) {
      resultSuggestions.push(claim.suggestion);
    }
  }

  if (suggestions.length > 0) {
    resultSuggestions.push(...suggestions.map(s => s.insertThis));
  }

  const hasEvidence = mentionedProjects > 0 && unsupportedClaims.length === 0;
  const score = hasEvidence ? 85 : evidenceBank.projects.some(p => p.mentioned) ? 65 : 40;

  return {
    score,
    status: score >= 80 ? 'pass' : score >= 50 ? 'warning' : 'fail',
    findings,
    suggestions: resultSuggestions,
  };
}