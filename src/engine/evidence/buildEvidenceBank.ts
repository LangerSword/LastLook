import type {
  ApplicationMemory,
  BriefAnalysis,
  EvidenceBank,
  EvidenceProject,
  EvidenceAchievement,
  EvidenceLink,
  EvidenceSnippet,
} from "../types";

export function buildEvidenceBank(
  memory: ApplicationMemory | null | undefined,
  answer: string,
  briefAnalysis?: BriefAnalysis
): EvidenceBank {
  const identity: string[] = [];
  const projects: EvidenceProject[] = [];
  const achievements: EvidenceAchievement[] = [];
  const links: EvidenceLink[] = [];
  const reusableSnippets: EvidenceSnippet[] = [];
  const missingEvidence: string[] = [];

  if (!memory) {
    return {
      identity,
      projects,
      achievements,
      links,
      reusableSnippets,
      missingEvidence: ["No memory provided"],
    };
  }

  if (memory.profile.name) {
    identity.push(memory.profile.name);
  }
  if (memory.profile.bio) {
    identity.push(memory.profile.bio);
  }
  if (memory.profile.currentFocus) {
    identity.push(memory.profile.currentFocus);
  }

  const lowerAnswer = answer.toLowerCase();

  for (const project of memory.projects || []) {
    if (!project.name) continue;

    const mentioned = lowerAnswer.includes(project.name.toLowerCase());
    const explained =
      mentioned &&
      project.oneLiner &&
      lowerAnswer.includes(project.oneLiner.toLowerCase());

    let relevance: "high" | "medium" | "low" = "low";
    if (briefAnalysis?.explicitRequirements) {
      const briefText = Object.values(briefAnalysis)
        .map((r) => (typeof r === "string" ? r : ""))
        .join(" ")
        .toLowerCase();
      if (
        project.tags?.some((t) => briefText.includes(t.toLowerCase())) ||
        project.name.toLowerCase().includes("ai") ||
        project.name.toLowerCase().includes("agent")
      ) {
        relevance = "high";
      } else if (project.description?.toLowerCase().includes("system")) {
        relevance = "medium";
      }
    }

    projects.push({
      name: project.name,
      oneLiner: project.oneLiner || "",
      mentionedInAnswer: !!mentioned,
      explainedInAnswer: !!explained,
      relevanceToBrief: relevance,
      suggestedUse: project.oneLiner || "",
    });
  }

  for (const achievement of memory.achievements || []) {
    if (!achievement.title) continue;

    let relevance: "high" | "medium" | "low" = "low";
    if (briefAnalysis?.explicitRequirements) {
      const briefText = Object.values(briefAnalysis)
        .map((r) => (typeof r === "string" ? r : ""))
        .join(" ")
        .toLowerCase();
      if (achievement.title.toLowerCase().includes("winner")) {
        relevance = "high";
      } else if (
        achievement.title.toLowerCase().includes("built") ||
        achievement.title.toLowerCase().includes("shipped")
      ) {
        relevance = "medium";
      }
    }

    achievements.push({
      title: achievement.title,
      relevanceToBrief: relevance,
      suggestedUse: achievement.description || "",
    });
  }

  for (const [label, url] of Object.entries(memory.links || {})) {
    if (!url) continue;

    let type = "other";
    if (url.includes("github")) type = "github";
    else if (url.includes("linkedin")) type = "linkedin";
    else if (url.includes("video")) type = "video";
    else if (url.includes("portfolio")) type = "portfolio";
    else if (url.includes("resume")) type = "resume";

    const relevantRequirementIds: string[] = [];
    if (briefAnalysis?.requiredLinks) {
      for (const req of briefAnalysis.requiredLinks) {
        if (req.type === type && req.required) {
          relevantRequirementIds.push(req.type);
        }
      }
    }

    links.push({
      label,
      url,
      type,
      relevantRequirementIds,
    });
  }

  for (const snippet of memory.snippets || []) {
    if (!snippet.text) continue;

    let relevance: "high" | "medium" | "low" = "low";
    if (briefAnalysis?.explicitRequirements) {
      const briefText = Object.values(briefAnalysis)
        .map((r) => (typeof r === "string" ? r : ""))
        .join(" ")
        .toLowerCase();
      if (snippet.tags?.some((t) => briefText.includes(t.toLowerCase()))) {
        relevance = "high";
      } else {
        relevance = "medium";
      }
    }

    reusableSnippets.push({
      title: snippet.title,
      text: snippet.text,
      relevance,
    });
  }

  if (briefAnalysis?.explicitRequirements) {
    for (const req of briefAnalysis.explicitRequirements) {
      if (req.type === "link" && links.length === 0) {
        missingEvidence.push(`Required ${req.type} not found in memory`);
      }
    }
  }

  if (memory.projects && memory.projects.length > 0 && projects.length === 0) {
    missingEvidence.push("No projects mentioned in answer");
  }

  return {
    identity,
    projects,
    achievements,
    links,
    reusableSnippets,
    missingEvidence,
  };
}