import { z } from 'zod';
import { BriefAnalysisSchema } from '../schemas';
import { urlDetectorTool } from './urlDetector';

export const RequiredLinkDetectorInputSchema = z.object({
  briefAnalysis: BriefAnalysisSchema,
  answer: z.string(),
  memoryLinks: z.object({
    github: z.string(),
    linkedin: z.string(),
    portfolio: z.string(),
    resume: z.string(),
    demoVideo: z.string(),
  }).nullable(),
});
export const RequiredLinkDetectorOutputSchema = z.object({
  requiredLinksMissing: z.array(z.string()),
  savedLinksAvailable: z.array(z.string()),
  urlsFound: z.array(z.string()),
});

export function requiredLinkDetectorTool(input: z.infer<typeof RequiredLinkDetectorInputSchema>) {
  const brief = input.briefAnalysis.summary + ' ' + input.briefAnalysis.explicitRequirements.join(' ');
  const requiresLink = /link|url|website|portfolio|github|video|demo|file/i.test(brief);
  const urls = urlDetectorTool({ text: input.answer });
  const savedLinks: string[] = [];

  if (input.memoryLinks) {
    if (input.memoryLinks.github) savedLinks.push(input.memoryLinks.github);
    if (input.memoryLinks.linkedin) savedLinks.push(input.memoryLinks.linkedin);
    if (input.memoryLinks.portfolio) savedLinks.push(input.memoryLinks.portfolio);
    if (input.memoryLinks.resume) savedLinks.push(input.memoryLinks.resume);
    if (input.memoryLinks.demoVideo) savedLinks.push(input.memoryLinks.demoVideo);
  }

  const required: string[] = [];
  if (requiresLink && savedLinks.length > 0) {
    required.push('public_link');
  }
  if (/github|code/i.test(brief)) {
    required.push('github');
  }
  if (/video|demo/i.test(brief)) {
    required.push('video_demos');
  }
  if (/resume|cv/i.test(brief)) {
    required.push('resume');
  }

  const missing = required.filter((r) => {
    if (r === 'public_link' && urls.urls.length > 0) return false;
    if (r === 'github' && urls.urls.some((u) => u.includes('github'))) return false;
    if (r === 'video_demos' && urls.urls.some((u) => /youtube|vimeo|demo|watch/i.test(u))) return false;
    return true;
  });

  return {
    requiredLinksMissing: missing,
    savedLinksAvailable: savedLinks,
    urlsFound: urls.urls,
  };
}