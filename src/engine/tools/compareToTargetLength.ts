export interface LengthComparisonResult {
  current: number;
  target: string;
  status: 'too_short' | 'too_long' | 'fits';
  deviation: number;
  suggestion: string;
}

export function compareToTargetLength(
  wordCount: number,
  targetLength?: { minWords?: number; maxWords?: number; minSeconds?: number; maxSeconds?: number }
): LengthComparisonResult {
  if (!targetLength) {
    if (wordCount < 50) return { current: wordCount, target: '80-150 words', status: 'too_short', deviation: -50, suggestion: 'Add more content' };
    if (wordCount > 250) return { current: wordCount, target: '80-150 words', status: 'too_long', deviation: 100, suggestion: 'Trim content' };
    return { current: wordCount, target: '80-150 words', status: 'fits', deviation: 0, suggestion: 'Good length' };
  }

  const { minWords, maxWords, minSeconds, maxSeconds } = targetLength;

  if (minSeconds && maxSeconds) {
    const targetWords = Math.round(((minSeconds + maxSeconds) / 2 / 60) * 145);
    const deviation = wordCount - targetWords;

    if (wordCount < targetWords * 0.8) {
      return { current: wordCount, target: `${minSeconds}-${maxSeconds}s`, status: 'too_short', deviation, suggestion: 'Add ~50 words' };
    }
    if (wordCount > targetWords * 1.3) {
      return { current: wordCount, target: `${minSeconds}-${maxSeconds}s`, status: 'too_long', deviation, suggestion: 'Trim ~30 words' };
    }
    return { current: wordCount, target: `${minSeconds}-${maxSeconds}s`, status: 'fits', deviation, suggestion: 'Good length' };
  }

  if (minWords && maxWords) {
    const deviation = wordCount - ((minWords + maxWords) / 2);

    if (wordCount < minWords) {
      return { current: wordCount, target: `${minWords}-${maxWords} words`, status: 'too_short', deviation, suggestion: `Add ${minWords - wordCount} words` };
    }
    if (wordCount > maxWords) {
      return { current: wordCount, target: `${minWords}-${maxWords} words`, status: 'too_long', deviation, suggestion: `Trim ${wordCount - maxWords} words` };
    }
    return { current: wordCount, target: `${minWords}-${maxWords} words`, status: 'fits', deviation, suggestion: 'Good length' };
  }

  return { current: wordCount, target: 'flexible', status: 'fits', deviation: 0, suggestion: 'Length is acceptable' };
}