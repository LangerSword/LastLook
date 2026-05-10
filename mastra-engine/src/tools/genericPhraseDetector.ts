import { z } from 'zod';
import { GenericPhraseDetectorInputSchema, GenericPhraseDetectorOutputSchema } from '../schemas';

const GENERIC_PHRASES = [
  { phrase: 'smart people', replacementSuggestion: 'Replace with the specific person, mentor, or builder you want to learn from' },
  { phrase: 'learn from mentors', replacementSuggestion: 'Describe what specific skill or insight you want to gain' },
  { phrase: 'exciting opportunity', replacementSuggestion: 'Name the specific thing that excites you and why' },
  { phrase: 'passionate about technology', replacementSuggestion: 'Describe what you actually build or have built' },
  { phrase: 'make an impact', replacementSuggestion: 'Describe the specific problem you want to solve' },
  { phrase: 'i want to grow', replacementSuggestion: 'Describe the specific capability you want to develop' },
  { phrase: 'this program is a great fit', replacementSuggestion: 'Explain the specific alignment between your work and their focus' },
  { phrase: 'i am interested in', replacementSuggestion: 'Replace with "I build" or "I am building" to show action' },
  { phrase: 'i love building', replacementSuggestion: 'Describe what you have built and the outcome' },
  { phrase: 'passionate builder', replacementSuggestion: 'Show your builder identity through your projects and what they do' },
  { phrase: 'learn a lot', replacementSuggestion: 'Describe the specific knowledge or skills you want to gain' },
  { phrase: 'great opportunity', replacementSuggestion: 'Name the specific aspect of the program that matters to you' },
];

export const GenericPhraseDetectorInputSchema = z.object({
  answer: z.string(),
  memory: z.any().optional(),
});
export const GenericPhraseDetectorOutputSchema = z.object({
  phrases: z.array(z.object({ phrase: z.string(), replacementSuggestion: z.string() })),
});

export function genericPhraseDetectorTool(input: z.infer<typeof GenericPhraseDetectorInputSchema>): z.infer<typeof GenericPhraseDetectorOutputSchema> {
  const lower = input.answer.toLowerCase();
  const found: { phrase: string; replacementSuggestion: string }[] = [];

  for (const gp of GENERIC_PHRASES) {
    if (lower.includes(gp.phrase.toLowerCase())) {
      found.push(gp);
    }
  }

  return { phrases: found };
}