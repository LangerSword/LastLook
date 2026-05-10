export interface RequiredLinkResult {
  required: string[];
  missing: string[];
  found: string[];
}

export interface BriefAnalysisForLinks {
  requiredLinks?: { type: string; required: boolean }[];
  explicitRequirements?: string[];
}

export function detectRequiredLinks(
  briefAnalysis: BriefAnalysisForLinks,
  answer: string,
  memoryLinks?: { github?: string; linkedin?: string; portfolio?: string; demoVideo?: string }
): RequiredLinkResult {
  const required: string[] = [];
  const missing: string[] = [];
  const found: string[] = [];

  const briefRequirements = briefAnalysis.explicitRequirements || [];
  const linkTypes = briefAnalysis.requiredLinks || [];

  if (briefRequirements.some(r => /link|url|website|portfolio|github/i.test(r))) {
    required.push('publicLink');
  }
  if (briefRequirements.some(r => /video|demo/i.test(r))) {
    required.push('video');
  }
  if (briefRequirements.some(r => /github|code/i.test(r))) {
    required.push('github');
  }
  if (briefRequirements.some(r => /linkedin/i.test(r))) {
    required.push('linkedin');
  }
  if (briefRequirements.some(r => /resume|cv/i.test(r))) {
    required.push('resume');
  }

  for (const req of linkTypes) {
    if (req.required && !required.includes(req.type)) {
      required.push(req.type);
    }
  }

  const urlRegex = /https?:\/\/[^\s)\]]+/gi;
  const answerUrls = answer.match(urlRegex) || [];

  for (const type of required) {
    const hasInAnswer = answerUrls.some(url => {
      if (type === 'github') return url.includes('github');
      if (type === 'linkedin') return url.includes('linkedin');
      if (type === 'video') return url.includes('youtube') || url.includes('vimeo') || url.includes('demo');
      if (type === 'portfolio') return url.includes('portfolio') || url.includes('vercel') || url.includes('netlify');
      if (type === 'publicLink') return !url.includes('github') && !url.includes('linkedin');
      return false;
    });

    if (hasInAnswer) {
      found.push(type);
    } else {
      missing.push(type);
    }
  }

  return { required, missing, found };
}