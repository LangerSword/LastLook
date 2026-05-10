export interface WordCountResult {
  count: number;
  averageSentenceLength: number;
  sentences: string[];
}

export function wordCount(text: string): WordCountResult {
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  const words = text.split(/\s+/).filter(Boolean);
  const count = words.length;
  const averageSentenceLength = sentences.length ? Math.round(count / sentences.length) : count;

  return { count, averageSentenceLength, sentences };
}