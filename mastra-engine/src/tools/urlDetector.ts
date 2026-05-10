import { z } from 'zod';
import { UrlDetectorInputSchema, UrlDetectorOutputSchema } from '../schemas';

export const UrlDetectorInputSchema = z.object({ text: z.string() });
export const UrlDetectorOutputSchema = z.object({ urls: z.array(z.string()) });

export function urlDetectorTool(input: z.infer<typeof UrlDetectorInputSchema>): z.infer<typeof UrlDetectorOutputSchema> {
  const matches = input.text.match(/https?:\/\/[^\s)\]]+/gi) || [];
  const unique = Array.from(new Set(matches));
  return { urls: unique };
}