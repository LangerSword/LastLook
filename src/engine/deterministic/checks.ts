import type {
  ReviewInput,
  DeterministicChecks,
  TargetLength,
} from "../types";

const GENERIC_PHRASES: Record<string, string> = {
  "learn from smart people": "Connect this to specific feedback or people you want to learn from",
  "exciting opportunity": "Name what makes it exciting for YOUR work",
  "build faster": "Say what you want to ship or speed up",
  "make an impact": "Say what impact or who benefits",
  "passionate about technology": "Show what you've built that shows passion",
  "grow as a person": "Say what skill or perspective you want to gain",
  "great fit": "Connect to your specific trajectory",
  "useful tools": "Name the tools and what problem they solve",
  "i want to learn": "Say what you want to learn and why now",
  "i am excited to apply": "Say what excites you about the specific work",
};

const SPEAKING_RATE_WPM = 145;

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export function calculateSpeakingTime(wordCount: number): number {
  return Math.round((wordCount / SPEAKING_RATE_WPM) * 60);
}

export function detectUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s)\]]+/gi) || [];
  return [...new Set(matches)];
}

export function detectGenericPhrases(
  text: string
): { phrase: string; replacementSuggestion: string }[] {
  const lower = text.toLowerCase();
  const results: { phrase: string; replacementSuggestion: string }[] = [];

  for (const [phrase, suggestion] of Object.entries(GENERIC_PHRASES)) {
    if (lower.includes(phrase)) {
      results.push({ phrase, replacementSuggestion: suggestion });
    }
  }

  return results;
}

export function checkProjectExplanations(
  answer: string,
  projects: { name: string; oneLiner: string }[]
): { projectName: string; issue: string; suggestedOneLiner: string }[] {
  const warnings: { projectName: string; issue: string; suggestedOneLiner: string }[] = [];
  const lowerAnswer = answer.toLowerCase();

  for (const project of projects) {
    if (!project.name) continue;

    if (lowerAnswer.includes(project.name.toLowerCase())) {
      const explained = project.oneLiner && lowerAnswer.includes(project.oneLiner.toLowerCase());
      if (!explained && project.oneLiner) {
        warnings.push({
          projectName: project.name,
          issue: `"${project.name}" is mentioned but not explained`,
          suggestedOneLiner: project.oneLiner,
        });
      }
    }
  }

  return warnings;
}

export function checkMemoryUsage(
  answer: string,
  projects: { name: string }[],
  relevantProjects: { name: string }[]
): {
  usedProjects: string[];
  unusedRelevantProjects: string[];
  note: string;
} {
  const lowerAnswer = answer.toLowerCase();
  const used: string[] = [];
  const unused: string[] = [];

  for (const project of relevantProjects) {
    if (!project.name) continue;
    if (lowerAnswer.includes(project.name.toLowerCase())) {
      used.push(project.name);
    } else {
      unused.push(project.name);
    }
  }

  return {
    usedProjects: used,
    unusedRelevantProjects: unused,
    note: unused.length > 0
      ? `${unused.length} relevant project(s) not mentioned in answer`
      : "All relevant projects mentioned",
  };
}

export function checkLengthFit(
  wordCount: number,
  targetFormat: string,
  targetLength?: TargetLength
): { status: "tooShort" | "tooLong" | "fits" | "unknown"; note: string } {
  const isVideoScript = targetFormat === "videoScript";

  if (targetLength) {
    if (targetLength.minWords && wordCount < targetLength.minWords) {
      return {
        status: "tooShort",
        note: `${wordCount} words, target min is ${targetLength.minWords}`,
      };
    }
    if (targetLength.maxWords && wordCount > targetLength.maxWords) {
      return {
        status: "tooLong",
        note: `${wordCount} words, target max is ${targetLength.maxWords}`,
      };
    }
    if (targetLength.minSeconds && targetLength.maxSeconds) {
      const timeSeconds = calculateSpeakingTime(wordCount);
      if (timeSeconds < targetLength.minSeconds) {
        return {
          status: "tooShort",
          note: `${timeSeconds}s, target is ${targetLength.minSeconds}-${targetLength.maxSeconds}s`,
        };
      }
      if (timeSeconds > targetLength.maxSeconds) {
        return {
          status: "tooLong",
          note: `${timeSeconds}s, target is ${targetLength.minSeconds}-${targetLength.maxSeconds}s`,
        };
      }
    }
    return { status: "fits", note: `${wordCount} words fits target` };
  }

  if (isVideoScript) {
    const time = calculateSpeakingTime(wordCount);
    if (time < 45) {
      return { status: "tooShort", note: `${wordCount} words (~${time}s) is too short for video` };
    }
    if (time > 120) {
      return { status: "tooLong", note: `${wordCount} words (~${time}s) is too long for video` };
    }
    return { status: "fits", note: `${wordCount} words (~${time}s) fits video` };
  }

  if (wordCount < 50) {
    return { status: "tooShort", note: `${wordCount} words is very short` };
  }
  if (wordCount > 400) {
    return { status: "tooLong", note: `${wordCount} words is very long` };
  }

  return { status: "fits", note: `${wordCount} words in reasonable range` };
}

export function runDeterministicChecks(
  input: ReviewInput & { briefAnalysis?: { targetLength?: TargetLength; requiredLinks?: { type: string; required: boolean }[] } }
): DeterministicChecks {
  const answer = input.answer;
  const memory = input.memory;
  const targetFormat = input.opportunity.targetFormat;
  const targetLength = input.briefAnalysis?.targetLength;

  const wordCount = countWords(answer);
  const speakingTimeSeconds = calculateSpeakingTime(wordCount);
  const urlsFound = detectUrls(answer);
  const genericPhrases = detectGenericPhrases(answer);

  const memoryProjects = memory?.projects || [];
  const relevantProjects = memoryProjects.filter(
    (p) => p.name && p.oneLiner
  );
  const projectWarnings = checkProjectExplanations(answer, memoryProjects);
  const memoryUsage = checkMemoryUsage(answer, memoryProjects, relevantProjects);

  const savedLinks = Object.entries(memory?.links || {})
    .filter(([, v]) => v)
    .map(([label, url]) => url);

  const linksMissing: string[] = [];
  if (input.briefAnalysis?.requiredLinks) {
    for (const req of input.briefAnalysis.requiredLinks) {
      if (req.required && req.type !== "other") {
        const hasLink = urlsFound.some((url) => {
          const isVideo = req.type === "video" && url.includes("video");
          const isGitHub = req.type === "github" && url.includes("github");
          const isPortfolio =
            req.type === "portfolio" && url.includes("portfolio");
          const isResume = req.type === "resume" && url.includes("resume");
          return isVideo || isGitHub || isPortfolio || isResume;
        });
        if (!hasLink) {
          linksMissing.push(req.type);
        }
      }
    }
  }

  const lengthFit = checkLengthFit(wordCount, targetFormat, targetLength);

  return {
    wordCount,
    speakingTimeSeconds,
    lengthFit,
    links: {
      urlsFound,
      requiredLinksMissing: linksMissing,
      savedLinksAvailable: savedLinks,
    },
    genericPhrases,
    projectExplanationWarnings: projectWarnings,
    memoryUsage,
    formattingIssues: [],
  };
}