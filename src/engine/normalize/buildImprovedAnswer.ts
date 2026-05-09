import type { ApplicationMemory, BriefAnalysis, DeterministicChecks, ImprovedApplication, TargetFormat } from "../types";

const GENERIC_REPLACEMENTS: Record<string, string> = {
  "learn from smart people": "Connect this to specific feedback or mentors",
  "exciting opportunity": "Name what makes this specific to your work",
  "build faster": "Say what specific tools will speed up your work",
  "make an impact": "Say who benefits or what outcome you want",
  "passionate about technology": "Show specific projects that demonstrate this",
  "grow as a person": "Name the specific skill or perspective you want",
  "great fit": "Connect to your specific trajectory",
  "i want to learn": "Say what you specifically want to learn",
};

function replaceGenericPhrases(
  text: string,
  memory: ApplicationMemory | null
): string {
  let result = text;
  
  for (const [phrase, replacement] of Object.entries(GENERIC_REPLACEMENTS)) {
    const regex = new RegExp(phrase, "gi");
    result = result.replace(regex, replacement);
  }
  
  if (memory?.profile?.currentFocus && result.toLowerCase().includes("current")) {
    result = result.replace(
      /what (you're|you are) (building|working|focused)/gi,
      memory.profile.currentFocus
    );
  }
  
  return result;
}

function explainProjects(text: string, projects: { name: string; oneLiner: string }[]): string {
  let result = text;
  
  for (const project of projects) {
    if (!project.name || !project.oneLiner) continue;
    
    if (result.toLowerCase().includes(project.name.toLowerCase())) {
      const mentionRegex = new RegExp(`\\b${project.name}\\b`, "gi");
      const hasOneLiner = result.toLowerCase().includes(project.oneLiner.toLowerCase());
      if (!hasOneLiner) {
        result = result.replace(mentionRegex, `${project.name} — ${project.oneLiner}`);
      }
    }
  }
  
  return result;
}

function adjustLength(
  text: string,
  targetFormat: TargetFormat,
  checks: DeterministicChecks
): string {
  const currentWords = checks.wordCount;
  const targetSeconds = checks.lengthFit;
  let result = text;
  
  if (targetFormat === "videoScript") {
    const targetMin = 60;
    const targetMax = 90;
    const currentSeconds = checks.speakingTimeSeconds;
    
    if (currentSeconds < targetMin) {
      const deficit = targetMin - currentSeconds;
      const wordsToAdd = Math.round((deficit / 60) * 145);
      result = result + ` ${getExpansionText(wordsToAdd)}`;
    } else if (currentSeconds > targetMax) {
      const excess = currentSeconds - targetMax;
      const wordsToCut = Math.round((excess / 60) * 145);
      result = cutToLength(result, wordsToCut);
    }
  }
  
  return result;
}

function getExpansionText(words: number): string {
  if (words < 15) return "";
  if (words < 30) return "This opportunity aligns with what I'm already building.";
  if (words < 50) return "I'm focused on shipping tools that solve real problems, and this program accelerates that work.";
  return "I've been building practical tools for AI infrastructure, and this program offers the specific feedback and network to go further.";
}

function cutToLength(text: string, wordsToCut: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= wordsToCut) return text;
  return words.slice(0, words.length - wordsToCut).join(" ");
}

function normalizeOutput(text: string): string {
  return text.replace(/\s+/g, " ").replace(/\s([.!?])/g, "$1").trim();
}

export function buildImprovedAnswer(
  answer: string,
  memory: ApplicationMemory | null | undefined,
  briefAnalysis: BriefAnalysis,
  checks: DeterministicChecks,
  targetFormat: TargetFormat
): ImprovedApplication {
  const changes: string[] = [];
  const whyBetter: string[] = [];
  
  let result = answer;
  const originalLength = result.length;
  
  result = replaceGenericPhrases(result, memory || null);
  if (result !== answer) {
    changes.push("Replaced generic phrases");
    whyBetter.push("Answer now uses specific details instead of generic claims");
  }
  
  const projects = memory?.projects || [];
  const beforeProjects = result;
  result = explainProjects(result, projects);
  if (result !== beforeProjects) {
    changes.push("Added project explanations");
    whyBetter.push("Projects are now explained with one-liners");
  }
  
  const beforeLength = result.length;
  result = adjustLength(result, targetFormat, checks);
  if (Math.abs(result.length - beforeLength) > 10) {
    changes.push("Adjusted length to target");
    whyBetter.push("Answer now fits the target format");
  }
  
  result = normalizeOutput(result);
  
  const wordCount = result.split(/\s+/).filter(Boolean).length;
  const speakingTimeSeconds = Math.round((wordCount / 145) * 60);
  
  if (changes.length === 0) {
    changes.push("Answer already well-formed");
    whyBetter.push("No major changes needed");
  }
  
  return {
    improvedAnswer: result,
    whatChanged: changes,
    whyBetter,
    wordCount,
    speakingTimeSeconds,
  };
}