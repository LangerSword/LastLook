import { detectProjectNamesWithoutExplanation, type ProjectNameResult } from '../tools/detectProjectNames';
import { checkAnswerStructure, type AnswerStructureResult } from '../tools/checkAnswerStructure';
import { suggestPlainLanguageRewrite, type RewriteSuggestion } from '../tools/suggestPlainLanguage';
import type { ReviewerResult } from './index';

export interface ClarityReviewerInput {
  answer: string;
  projects: { name?: string; oneLiner?: string; longerExplanation?: string }[];
}

export function ClarityReviewer(input: ClarityReviewerInput): ReviewerResult {
  const projects = input.projects.map(p => ({ name: p.name || '', oneLiner: p.oneLiner || '', longerExplanation: p.longerExplanation || '' }));
  const projectStatus = detectProjectNamesWithoutExplanation(input.answer, projects);
  const structure = checkAnswerStructure(input.answer);
  const rewrites = suggestPlainLanguageRewrite(input.answer);

  const findings: string[] = [];
  const suggestions: string[] = [];

  if (projectStatus.unexplainedCount > 0) {
    const unexplained = projectStatus.projects.filter(p => p.mentioned && !p.explained).map(p => p.name);
    findings.push(`Projects without explanation: ${unexplained.join(', ')}`);
    for (const p of projectStatus.projects.filter(p => p.suggestion)) {
      suggestions.push(p.suggestion!);
    }
  } else {
    findings.push('All mentioned projects are explained');
  }

  if (!structure.hasOpening) {
    findings.push('No clear opening with identity');
    suggestions.push('Start with "I am [name] and I build..."');
  }

  if (structure.issues.length > 0) {
    findings.push(...structure.issues);
  }

  if (rewrites.length > 0) {
    findings.push(`Simplify ${rewrites.length} phrases`);
    suggestions.push(...rewrites.map(r => `Replace "${r.original}" with "${r.suggestion}"`));
  }

  const score = projectStatus.unexplainedCount === 0 && structure.issues.length === 0 ? 90 :
                projectStatus.unexplainedCount <= 1 && structure.issues.length <= 1 ? 70 : 50;

  return {
    score,
    status: score >= 80 ? 'pass' : score >= 50 ? 'warning' : 'fail',
    findings,
    suggestions,
  };
}