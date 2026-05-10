export interface UrlDetectionResult {
  urls: string[];
  hasPublicLink: boolean;
  hasGithub: boolean;
  hasLinkedIn: boolean;
  hasPortfolio: boolean;
  hasVideo: boolean;
}

export function detectUrls(text: string): UrlDetectionResult {
  const urlRegex = /https?:\/\/[^\s)\]]+/gi;
  const urls = [...new Set(text.match(urlRegex) || [])];

  const hasPublicLink = urls.some(u => !u.includes('github') && !u.includes('linkedin'));
  const hasGithub = urls.some(u => u.includes('github'));
  const hasLinkedIn = urls.some(u => u.includes('linkedin'));
  const hasPortfolio = urls.some(u => u.includes('portfolio') || u.includes('vercel') || u.includes('netlify'));
  const hasVideo = urls.some(u => u.includes('youtube') || u.includes('vimeo') || u.includes('demo'));

  return { urls, hasPublicLink, hasGithub, hasLinkedIn, hasPortfolio, hasVideo };
}