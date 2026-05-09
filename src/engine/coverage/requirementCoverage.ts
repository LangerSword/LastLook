import type {
  BriefAnalysis,
  RequirementCoverageItem,
  EvidenceBank,
  DeterministicChecks,
} from "../types";

export function buildRequirementCoverage(
  briefAnalysis: BriefAnalysis,
  answer: string,
  evidenceBank: EvidenceBank,
  deterministicChecks: DeterministicChecks,
  requiredByBrief: string[]
): RequirementCoverageItem[] {
  const coverage: RequirementCoverageItem[] = [];
  const lowerAnswer = answer.toLowerCase();
  const sentences = answer.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);

  for (const req of briefAnalysis.explicitRequirements) {
    const reqText = req.text.toLowerCase();
    const tokens = reqText
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2);

    let matchedTokens: string[] = [];
    for (const token of tokens) {
      if (lowerAnswer.includes(token)) {
        matchedTokens.push(token);
      }
    }

    const reqIsLink = /link|url|website|portfolio|github|video|demo/i.test(reqText);
    const hasUrl = deterministicChecks.links.urlsFound.length > 0;

    let status: "covered" | "partial" | "missing";
    let evidenceFound = "";
    let gap = "";
    let whatToAdd = "";

    if (reqIsLink) {
      if (hasUrl) {
        status = "covered";
        evidenceFound = `URL found: ${deterministicChecks.links.urlsFound[0]}`;
        gap = "";
      } else if (deterministicChecks.links.savedLinksAvailable.length > 0) {
        status = "partial";
        evidenceFound = "Link exists in memory but not in answer";
        gap = "Link not visible in answer";
        whatToAdd = `Add the required link: ${deterministicChecks.links.savedLinksAvailable[0]}`;
      } else {
        status = "missing";
        gap = "No URL found and no link in memory";
        whatToAdd = "Add a public link to your work";
      }
    } else if (matchedTokens.length >= tokens.length * 0.6) {
      status = "covered";
      const matchedSentence = sentences.find((s) =>
        matchedTokens.some((t) => s.toLowerCase().includes(t))
      );
      evidenceFound = matchedSentence
        ? `Answer contains: "${matchedSentence.slice(0, 80)}..."`
        : `Keywords matched: ${matchedTokens.slice(0, 3).join(", ")}`;
      gap = "";
    } else if (matchedTokens.length > 0) {
      status = "partial";
      evidenceFound = `Partial match: ${matchedTokens.join(", ")}`;
      gap = "Requirement partially addressed";
      whatToAdd = `Add more detail about: ${req.text}`;
    } else {
      status = "missing";
      gap = "No coverage found";
      whatToAdd = `Add content that directly addresses: ${req.text}`;
    }

    coverage.push({
      requirementId: req.id,
      requirement: req.text,
      status,
      evidenceFound,
      gap,
      whatToAdd,
      priority: req.priority,
    });
  }

  if (briefAnalysis.hiddenRequirements) {
    for (const hidden of briefAnalysis.hiddenRequirements) {
      const hiddenText = hidden.text.toLowerCase();
      const hasMention = evidenceBank.identity.some((i) =>
        hiddenText.includes(i.toLowerCase())
      );

      coverage.push({
        requirementId: hidden.id,
        requirement: hidden.text,
        status: hasMention ? "covered" : "partial",
        evidenceFound: hasMention ? "Implied requirement found in memory" : "",
        gap: hasMention ? "" : "May need explicit mention",
        whatToAdd: hasMention ? "" : `Consider addressing: ${hidden.text}`,
        priority: hidden.priority,
      });
    }
  }

  return coverage;
}

export function calculateCoverageScore(
  coverage: RequirementCoverageItem[]
): number {
  if (coverage.length === 0) return 70;

  const covered = coverage.filter((c) => c.status === "covered").length;
  const partial = coverage.filter((c) => c.status === "partial").length;
  const missing = coverage.filter((c) => c.status === "missing").length;

  const total = coverage.length;
  const score = (covered * 100 + partial * 50 - missing * 20) / total;

  return Math.max(0, Math.min(100, Math.round(score)));
}