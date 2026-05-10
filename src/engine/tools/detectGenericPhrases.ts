export interface GenericPhraseResult {
  phrases: { phrase: string; replacement: string }[];
  count: number;
  isGeneric: boolean;
}

const GENERIC_PHRASES: Record<string, string> = {
  'learn from smart people': 'Connect to specific feedback or people',
  'exciting opportunity': 'Name what makes it exciting for YOUR work',
  'build faster': 'Say what you want to ship',
  'make an impact': 'Say what impact or who benefits',
  'passionate about technology': 'Show what you built that shows passion',
  'grow as a person': 'Say what skill or perspective you want to gain',
  'great fit': 'Connect to your specific trajectory',
  'useful tools': 'Name the tools and what problem they solve',
  'i want to learn': 'Say what you want to learn and why now',
  'i am excited to apply': 'Say what excites you about the specific work',
  'smart people': 'Name specific people or mentors',
  'make a difference': 'Say what difference you want to make',
  'change the world': 'Say what specific change you want',
};

export function detectGenericPhrases(answer: string, memory?: { profile?: { currentFocus?: string } }): GenericPhraseResult {
  const lower = answer.toLowerCase();
  const phrases: { phrase: string; replacement: string }[] = [];

  for (const [phrase, replacement] of Object.entries(GENERIC_PHRASES)) {
    if (lower.includes(phrase)) {
      phrases.push({ phrase, replacement });
    }
  }

  const count = phrases.length;
  const isGeneric = count > 0;

  return { phrases, count, isGeneric };
}