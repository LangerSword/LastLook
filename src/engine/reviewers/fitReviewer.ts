import { detectGenericPhrases, type GenericPhraseResult } from '../tools/detectGenericPhrases';
import { buildEvidenceBank, type EvidenceBankResult } from '../tools/buildEvidenceBank';
import { mapMemoryToOpportunity, type MemoryOpportunityMapping } from '../tools/mapMemoryToOpportunity';
import type { ReviewerResult } from './index';

export interface FitReviewerInput {
  answer: string;
  memory: { profile?: { currentFocus?: string }; projects?: { name?: string; oneLiner?: string }[] };
  opportunity: { programName?: string; applicationType?: string; brief?: string };
}

export function FitReviewer(input: FitReviewerInput): ReviewerResult {
  const genericPhrases = detectGenericPhrases(input.answer, input.memory);
  const evidenceBank = buildEvidenceBank(input.memory, input.answer);
  const alignment = mapMemoryToOpportunity(input.memory.profile || {}, input.opportunity);

  const findings: string[] = [];
  const suggestions: string[] = [];

  if (genericPhrases.isGeneric) {
    findings.push(`Generic phrases detected: ${genericPhrases.phrases.map(p => p.phrase).join(', ')}`);
    for (const p of genericPhrases.phrases) {
      suggestions.push(`Replace "${p.phrase}" with specific evidence`);
    }
  } else {
    findings.push('No generic fit phrases detected');
  }

  findings.push(`Alignment: ${alignment.alignment}`);

  if (alignment.gaps.length > 0) {
    findings.push(...alignment.gaps);
    suggestions.push('Connect your current focus to the opportunity');
  }

  const hasProjectEvidence = evidenceBank.projects.some(p => p.mentioned && p.explained);
  if (!hasProjectEvidence) {
    findings.push('No project evidence connected to opportunity');
    suggestions.push('Show how your projects relate to this opportunity');
  }

  const score = genericPhrases.count === 0 && alignment.score >= 60 && hasProjectEvidence ? 85 :
                genericPhrases.count <= 2 && alignment.score >= 40 ? 65 : 40;

  return {
    score,
    status: score >= 80 ? 'pass' : score >= 50 ? 'warning' : 'fail',
    findings,
    suggestions,
  };
}