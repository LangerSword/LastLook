import type {
  RequirementCoverageItem,
  DeterministicChecks,
  EvidenceBank,
  ApplicationPacket,
  PacketLink,
  PacketChecklistItem,
} from "../types";

export function buildApplicationPacket(
  title: string,
  finalAnswer: string,
  requirementCoverage: RequirementCoverageItem[],
  deterministicChecks: DeterministicChecks,
  evidenceBank: EvidenceBank
): ApplicationPacket {
  const requiredLinks: PacketLink[] = [];
  const submissionChecklist: PacketChecklistItem[] = [];

  const requiredTypes = [
    { type: "publicLink", label: "Public Link" },
    { type: "video", label: "Video/Demo" },
    { type: "github", label: "GitHub/Code" },
    { type: "portfolio", label: "Portfolio" },
    { type: "resume", label: "Resume" },
  ];

  for (const req of requiredTypes) {
    const isMissing = deterministicChecks.links.requiredLinksMissing.includes(req.type);
    const isFound = deterministicChecks.links.urlsFound.length > 0;
    const inVault = deterministicChecks.links.savedLinksAvailable.length > 0;

    let status: "included" | "missing" | "availableInVault" = "missing";
    let value: string | undefined;
    let note: string | undefined;

    if (isFound) {
      status = "included";
      value = deterministicChecks.links.urlsFound[0];
    } else if (inVault) {
      status = "availableInVault";
      value = deterministicChecks.links.savedLinksAvailable[0];
      note = "Available in your link vault";
    }

    requiredLinks.push({
      label: req.label,
      status,
      value,
      note,
    });
  }

  for (const req of requirementCoverage) {
    submissionChecklist.push({
      item: req.requirement,
      status: req.status === "covered" ? "done" : req.status === "missing" ? "missing" : "review",
      note: req.gap || req.evidenceFound,
    });
  }

  submissionChecklist.push({
    item: "Proofread once aloud",
    status: "review",
    note: "Read your answer out loud before submitting",
  });

  const exportMarkdown = buildExportMarkdown(
    title,
    finalAnswer,
    requirementCoverage,
    requiredLinks,
    submissionChecklist,
    deterministicChecks
  );

  return {
    title,
    finalAnswer,
    requiredLinks,
    submissionChecklist,
    exportMarkdown,
  };
}

function buildExportMarkdown(
  title: string,
  finalAnswer: string,
  requirementCoverage: RequirementCoverageItem[],
  requiredLinks: PacketLink[],
  submissionChecklist: PacketChecklistItem[],
  deterministicChecks: DeterministicChecks
): string {
  const lines: string[] = [];

  lines.push(`# ${title}`);
  lines.push("");
  lines.push("## Your Answer");
  lines.push("");
  lines.push(finalAnswer);
  lines.push("");

  lines.push("## Requirement Checklist");
  lines.push("");
  for (const item of requirementCoverage) {
    const check = item.status === "covered" ? "[x]" : item.status === "partial" ? "[~]" : "[ ]";
    lines.push(`${check} ${item.requirement}`);
    if (item.evidenceFound) {
      lines.push(`   ${item.evidenceFound}`);
    }
    if (item.whatToAdd && item.status !== "covered") {
      lines.push(`   → ${item.whatToAdd}`);
    }
  }
  lines.push("");

  lines.push("## Required Links");
  lines.push("");
  for (const link of requiredLinks) {
    const status = link.status === "included" ? "✓" : link.status === "availableInVault" ? "~" : "✗";
    lines.push(`- ${status} ${link.label}: ${link.value || "(missing)"}`);
  }
  lines.push("");

  lines.push("## Submission Checklist");
  lines.push("");
  for (const item of submissionChecklist) {
    const check = item.status === "done" ? "✓" : item.status === "review" ? "~" : "✗";
    lines.push(`- ${check} ${item.item}`);
  }
  lines.push("");

  lines.push("## Stats");
  lines.push(`- ${deterministicChecks.wordCount} words (~${deterministicChecks.speakingTimeSeconds}s at 145 wpm)`);

  return lines.join("\n");
}

export function parseMarkdownExport(markdown: string): {
  title: string;
  answer: string;
  checklist: string[];
} {
  const lines = markdown.split("\n");
  let title = "";
  let answer = "";
  let checklist: string[] = [];
  let inAnswer = false;
  let inChecklist = false;

  for (const line of lines) {
    if (line.startsWith("# ") && !title) {
      title = line.slice(2);
    }
    if (line === "## Your Answer" || line === "## Answer") {
      inAnswer = true;
      continue;
    }
    if (line.startsWith("## ")) {
      inAnswer = false;
    }
    if (inAnswer && line.trim()) {
      answer += line + "\n";
    }
    if (line.includes("Checklist")) {
      inChecklist = true;
      continue;
    }
    if (inChecklist && line.startsWith("- ")) {
      checklist.push(line);
    }
  }

  return {
    title: title || "Application",
    answer: answer.trim(),
    checklist,
  };
}