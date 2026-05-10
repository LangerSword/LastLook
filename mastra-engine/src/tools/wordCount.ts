import { z } from 'zod';
import { WordCountInputSchema, WordCountOutputSchema, type WordCountOutput } from '../schemas';

export function wordCountTool(input: z.infer<typeof WordCountInputSchema>): WordCountOutput {
  const words = input.text.trim().split(/\s+/).filter(Boolean);
  return { wordCount: words.length };
}

export const WordCountInputSchema = z.object({ text: z.string() });
export const WordCountOutputSchema = z.object({ wordCount: z.number() });