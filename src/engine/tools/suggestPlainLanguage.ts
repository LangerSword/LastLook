export interface RewriteSuggestion {
  original: string;
  suggestion: string;
  reason: string;
}

export function suggestPlainLanguageRewrite(answer: string): RewriteSuggestion[] {
  const suggestions: RewriteSuggestion[] = [];
  const lower = answer.toLowerCase();

  if (lower.includes('leverage')) {
    suggestions.push({
      original: 'leverage',
      suggestion: 'use',
      reason: '"Use" is clearer than "leverage"',
    });
  }
  if (lower.includes('synergy')) {
    suggestions.push({
      original: 'synergy',
      suggestion: 'working together',
      reason: 'Simpler language preferred',
    });
  }
  if (lower.includes('optimize')) {
    suggestions.push({
      original: 'optimize',
      suggestion: 'improve',
      reason: '"Improve" is more direct',
    });
  }
  if (lower.includes('utilize')) {
    suggestions.push({
      original: 'utilize',
      suggestion: 'use',
      reason: '"Use" is simpler than "utilize"',
    });
  }
  if (lower.includes('paradigm')) {
    suggestions.push({
      original: 'paradigm',
      suggestion: 'approach',
      reason: '"Approach" is clearer',
    });
  }
  if (lower.includes('deliverables')) {
    suggestions.push({
      original: 'deliverables',
      suggestion: 'results',
      reason: '"Results" is more concrete',
    });
  }

  return suggestions;
}