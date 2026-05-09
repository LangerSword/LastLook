import type { ReviewInput, BriefAnalysis } from "./types";

function detectTargetLength(brief: string): { minWords?: number; maxWords?: number; minSeconds?: number; maxSeconds?: number } | undefined {
  const lower = brief.toLowerCase();
  
  const isVideo = /video|pitch|intro/i.test(brief);
  const is60_90 = /60.*90|90.*60|one.*minute/i.test(brief);
  const isShort = /short|brief|one.*minute/i.test(brief);
  
  if (isVideo || is60_90) {
    return { minWords: 145, maxWords: 220, minSeconds: 60, maxSeconds: 90 };
  }
  if (isShort) {
    return { minWords: 80, maxWords: 150 };
  }
  
  const wordMatch = brief.match(/(\d+)\s*-\s*(\d+)\s*words?/i);
  if (wordMatch) {
    return { 
      minWords: parseInt(wordMatch[1]), 
      maxWords: parseInt(wordMatch[2]) 
    };
  }
  
  return undefined;
}

function detectRequiredLinks(brief: string): { type: string; required: boolean; foundInBrief: boolean; note: string }[] {
  const links: { type: string; required: boolean; foundInBrief: boolean; note: string }[] = [];
  const lower = brief.toLowerCase();
  
  if (/link|url|website| publicly/i.test(brief)) {
    links.push({ 
      type: "publicLink", 
      required: true, 
      foundInBrief: true,
      note: "Public link required"
    });
  }
  
  if (/video|demo/i.test(brief)) {
    links.push({ 
      type: "video", 
      required: true, 
      foundInBrief: true, 
      note: "Video or demo required"
    });
  }
  
  if (/github|code/i.test(brief)) {
    links.push({ 
      type: "github", 
      required: true, 
      foundInBrief: true, 
      note: "GitHub or code required"
    });
  }
  
  if (/portfolio|work sample/i.test(brief)) {
    links.push({ 
      type: "portfolio", 
      required: true, 
      foundInBrief: true, 
      note: "Portfolio required"
    });
  }
  
  if (/resume|cv/i.test(brief)) {
    links.push({ 
      type: "resume", 
      required: true, 
      foundInBrief: true, 
      note: "Resume required"
    });
  }
  
  return links;
}

function detectExplicitRequirements(brief: string): { id: string; text: string; type: string; priority: string; sourceQuote?: string }[] {
  const requirements: { id: string; text: string; type: string; priority: string; sourceQuote?: string }[] = [];
  
  const patterns: { regex: RegExp; type: string; priority: string; base: string }[] = [
    { regex: /tell us about yourself|introduce yourself|who are you/i, type: "topic", priority: "high", base: "Tell us about yourself" },
    { regex: /what are you (building|working|excited)/i, type: "topic", priority: "high", base: "What you're building" },
    { regex: /why (this|fit|good fit)/i, type: "topic", priority: "high", base: "Why this fits you" },
    { regex: /60.*90.*second|video/i, type: "format", priority: "high", base: "60-90 second video" },
    { regex: /public.*link|accessible.*link/i, type: "link", priority: "high", base: "Public link" },
    { regex: /github|code.*sample/i, type: "link", priority: "medium", base: "GitHub or code" },
    { regex: /resume|cv/i, type: "file", priority: "medium", base: "Resume or CV" },
    { regex: /portfolio|work.*sample/i, type: "link", priority: "medium", base: "Portfolio" },
  ];
  
  for (const p of patterns) {
    if (p.regex.test(brief)) {
      requirements.push({
        id: `req_${requirements.length + 1}`,
        text: p.base,
        type: p.type,
        priority: p.priority,
        sourceQuote: brief.slice(0, 100),
      });
    }
  }
  
  const questionMatch = brief.match(/[^?.]*\?/g);
  if (questionMatch) {
    for (const q of questionMatch.slice(0, 3)) {
      const text = q.trim();
      if (text && text.length > 10 && !requirements.find(r => r.text === text)) {
        requirements.push({
          id: `req_${requirements.length + 1}`,
          text: text.length > 80 ? text.slice(0, 80) : text,
          type: "question",
          priority: "high",
          sourceQuote: text,
        });
      }
    }
  }
  
  return requirements;
}

function detectHiddenRequirements(brief: string, applicationType: string): { id: string; text: string; whyItMatters: string; priority: string }[] {
  const hidden: { id: string; text: string; whyItMatters: string; priority: string }[] = [];
  
  if (/fellowship|accelerator/i.test(brief)) {
    hidden.push({
      id: "hidden_fit",
      text: "Show specific alignment with program values",
      whyItMatters: "Evaluators want to see why this specifically fits your trajectory",
      priority: "high",
    });
  }
  
  if (applicationType === "fellowship") {
    hidden.push({
      id: "hidden_builder",
      text: "Demonstrate builder identity",
      whyItMatters: "Fellowships want builders who ship",
      priority: "high",
    });
  }
  
  hidden.push({
    id: "hidden_specificity",
    text: "Use specific details, not generic claims",
    whyItMatters: "Generic answers are easily forgotten",
    priority: "medium",
  });
  
  return hidden;
}

export function parseBrief(brief: string, applicationType: string): BriefAnalysis {
  const summary = brief.length > 50 ? brief.slice(0, 100) + "..." : brief;
  
  const explicitRequirements = detectExplicitRequirements(brief) as any;
  const hiddenRequirements = detectHiddenRequirements(brief, applicationType) as any;
  const requiredLinks = detectRequiredLinks(brief) as any;
  const targetLength = detectTargetLength(brief);
  
  const evaluationCriteria: string[] = [];
  if (/fit/i.test(brief)) evaluationCriteria.push("Fit with program");
  if (/video|pitch/i.test(brief)) evaluationCriteria.push("Video delivery");
  if (/build/i.test(brief)) evaluationCriteria.push("Builder identity");
  
  const risks: string[] = [];
  if (!explicitRequirements.find((r: any) => r.type === "link") && requiredLinks.length === 0) {
    risks.push("May miss required link");
  }
  if (targetLength?.minSeconds && targetLength.maxSeconds) {
    risks.push("Video must be within time window");
  }
  
  return {
    summary,
    explicitRequirements,
    hiddenRequirements,
    evaluationCriteria,
    requiredLinks,
    targetLength,
    risks,
  };
}

export function normalizeInput(input: ReviewInput): { 
  input: ReviewInput; 
  briefAnalysis: BriefAnalysis; 
} {
  const briefAnalysis = parseBrief(input.brief, input.opportunity.applicationType);
  
  return {
    input,
    briefAnalysis,
  };
}