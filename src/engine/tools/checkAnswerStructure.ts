export interface AnswerStructureResult {
  hasOpening: boolean;
  hasBody: boolean;
  hasClosing: boolean;
  sentences: number;
  averageSentenceLength: number;
  structure: string;
  issues: string[];
}

export function checkAnswerStructure(answer: string): AnswerStructureResult {
  const sentences = answer.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  const sentencesCount = sentences.length;
  const words = answer.split(/\s+/).filter(Boolean);
  const avgLength = sentencesCount ? Math.round(words.length / sentencesCount) : words.length;

  const hasOpening = sentencesCount > 0 && (
    sentences[0].toLowerCase().startsWith('i ') ||
    sentences[0].toLowerCase().startsWith('i\'m') ||
    sentences[0].toLowerCase().includes('builder') ||
    sentences[0].toLowerCase().includes('building')
  );

  const hasBody = sentencesCount > 2;
  const hasClosing = sentencesCount > 1 && (
    sentences[sentencesCount - 1].toLowerCase().includes('thank') ||
    sentences[sentencesCount - 1].toLowerCase().includes('opportunity') ||
    sentences[sentencesCount - 1].toLowerCase().includes('fit')
  );

  const issues: string[] = [];
  if (!hasOpening) issues.push('No clear opening with identity');
  if (avgLength > 22) issues.push('Average sentence length too long');
  if (sentencesCount < 3) issues.push('Answer too short');

  return {
    hasOpening,
    hasBody,
    hasClosing,
    sentences: sentencesCount,
    averageSentenceLength: avgLength,
    structure: hasOpening && hasBody && hasClosing ? 'good' : 'needs_work',
    issues,
  };
}