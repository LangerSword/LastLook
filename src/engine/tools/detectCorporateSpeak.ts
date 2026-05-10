export interface CorporateSpeakResult {
  detected: string[];
  score: number;
  isCorporate: boolean;
}

const CORPORATE_PHRASES = [
  'circle back',
  'move the needle',
  'low-hanging fruit',
  'think outside the box',
  'drill down',
  'take offline',
  'deep dive',
  'synergy',
  'best practice',
  'value add',
  'game changer',
  'mission critical',
  'strategic',
  'actionable',
  'holistic',
];

export function detectCorporateSpeak(answer: string): CorporateSpeakResult {
  const lowerAnswer = answer.toLowerCase();
  const detected: string[] = [];

  for (const phrase of CORPORATE_PHRASES) {
    if (lowerAnswer.includes(phrase)) {
      detected.push(phrase);
    }
  }

  const score = Math.max(0, 100 - detected.length * 20);
  const isCorporate = detected.length > 0;

  return { detected, score, isCorporate };
}