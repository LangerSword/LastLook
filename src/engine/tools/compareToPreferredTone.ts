export interface ToneComparisonResult {
  preferred: string;
  actual: string;
  match: boolean;
  score: number;
  suggestions: string[];
}

const TONE_KEYWORDS: Record<string, string[]> = {
  confident: ['i built', 'i created', 'shipped', 'delivered', 'launched', 'solved'],
  warm: ['passionate', 'excited', 'love', 'care about', 'helped', 'connected'],
  technical: ['api', 'infrastructure', 'system', 'algorithm', 'implemented', 'optimized'],
  'founder-like': ['vision', 'product', 'market', 'users', 'growth', 'impact'],
  concise: [],
};

export function compareToPreferredTone(answer: string, preferredTone?: string): ToneComparisonResult {
  const preferred = preferredTone || 'confident';
  const lowerAnswer = answer.toLowerCase();

  const toneKeywords = TONE_KEYWORDS[preferred.toLowerCase()] || TONE_KEYWORDS.confident;
  let matches = 0;

  for (const keyword of toneKeywords) {
    if (lowerAnswer.includes(keyword)) matches++;
  }

  const score = toneKeywords.length > 0 ? Math.min(100, (matches / toneKeywords.length) * 100) : 70;

  const suggestions: string[] = [];
  if (preferred === 'confident' && score < 60) {
    suggestions.push('Use active verbs like "built", "shipped", "created"');
  }
  if (preferred === 'technical' && score < 60) {
    suggestions.push('Include specific technical details');
  }

  return {
    preferred,
    actual: score > 70 ? preferred : 'mixed',
    match: score >= 60,
    score,
    suggestions,
  };
}