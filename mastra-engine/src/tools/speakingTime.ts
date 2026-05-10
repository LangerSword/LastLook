import { z } from 'zod';
import { SpeakingTimeInputSchema, SpeakingTimeOutputSchema } from '../schemas';

export const SpeakingTimeInputSchema = z.object({
  text: z.string(),
  wordsPerMinute: z.number().optional().default(145),
});
export const SpeakingTimeOutputSchema = z.object({
  seconds: z.number(),
  wordsPerMinute: z.number(),
});

export function speakingTimeTool(input: z.infer<typeof SpeakingTimeInputSchema>): z.infer<typeof SpeakingTimeOutputSchema> {
  const words = input.text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const wpm = input.wordsPerMinute ?? 145;
  const seconds = Math.round((wordCount / wpm) * 60);
  return { seconds, wordsPerMinute: wpm };
}