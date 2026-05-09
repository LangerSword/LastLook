import type {
  ReviewerPanel,
  ReviewerResult,
  ReadinessStatus,
  ReadinessReport,
  NextBestEdit,
  FixPlanItem,
  RequirementCoverageItem,
  DeterministicChecks,
  BriefAnalysis,
  EvidenceBank,
  ApplicationType,
  TargetFormat,
} from "../types";

function reviewerResult(
  score: number,
  verdict: string,
  findings: string[],
  fixes: string[]
): ReviewerResult {
  return {
    score: Math.max(0, Math.min(100, score)),
    verdict,
    specificFindings: findings.slice(0, 5),
    fixes: fixes.slice(0, 3),
  };
}

const SCORE_WEIGHTS = {
  requirements: 0.35,
  fit: 0.2,
  evidence: 0.15,
  clarity: 0.1,
  length: 0.1,
  risk: 0.1,
};

export function buildReviewerPanel(
  briefAnalysis: BriefAnalysis,
  answer: string,
  evidenceBank: EvidenceBank,
  deterministicChecks: DeterministicChecks,
  coverage: RequirementCoverageItem[],
  applicationType: ApplicationType,
  strictness: string
): ReviewerPanel {
  const genericPhrases = deterministicChecks.genericPhrases;
  const projectWarnings = deterministicChecks.projectExplanationWarnings;
  const links = deterministicChecks.links;
  const wordCount = deterministicChecks.wordCount;
  const sentences = answer.split(/[.!?]+/).filter(Boolean);
  const avgSentenceLen = sentences.length
    ? Math.round(wordCount / sentences.length)
    : wordCount;

  const missingCount = coverage.filter((c) => c.status === "missing").length;
  const partialCount = coverage.filter((c) => c.status === "partial").length;
  const coveredCount = coverage.filter((c) => c.status === "covered").length;

  const requirementScore = Math.max(
    0,
    100 - missingCount * 15 - partialCount * 7
  );

  const fitScore = Math.max(
    0,
    90 - genericPhrases.length * 10 - missingCount * 5
  );

  const evidenceScore = Math.max(
    0,
    95 -
      projectWarnings.length * 12 -
      (links.requiredLinksMissing.length > 0 ? 15 : 0) -
      (evidenceBank.projects.filter((p) => p.mentionedInAnswer).length === 0 &&
        evidenceBank.projects.length > 0
        ? 10
        : 0)
  );

  const clarityScore = Math.max(
    0,
    95 - Math.max(0, avgSentenceLen > 22 ? avgSentenceLen - 22 : 0) * 2
  );

  const isVideo =
    briefAnalysis.targetLength?.minSeconds &&
    briefAnalysis.targetLength?.minSeconds > 0;
  const lengthScore = isVideo
    ? 100 -
      Math.abs(
        deterministicChecks.speakingTimeSeconds -
          ((briefAnalysis.targetLength?.minSeconds || 60) +
            (briefAnalysis.targetLength?.maxSeconds || 90)) /
            2
      ) /
        10
    : 100 - Math.abs(wordCount - 150) / 3;

  const voiceScore = Math.max(
    0,
    92 -
      (strictness === "brutal" ? 5 : 0) -
      genericPhrases.length * 6 -
      projectWarnings.length * 4
  );

  const riskScore = Math.max(
    0,
    95 -
      (links.requiredLinksMissing.length > 0 ? 20 : 0) -
      missingCount * 10 -
      genericPhrases.length * 5
  );

  const firstGeneric = genericPhrases[0]?.phrase || "";
  const firstProjectWarning = projectWarnings[0];
  const firstMissing = coverage.find((c) => c.status === "missing");

  return {
    requirements: reviewerResult(
      requirementScore,
      requirementScore >= 80
        ? "Requirements largely covered"
        : "Requirements need attention",
      [
        `${coveredCount} of ${coverage.length} requirements covered`,
        missingCount > 0
          ? `Missing: ${firstMissing?.requirement?.slice(0, 40)}`
          : "All explicit requirements addressed",
        partialCount > 0 ? `${partialCount} partial coverage` : "",
      ].filter(Boolean),
      [
        "Address all missing requirements first",
        "Add missing deliverables before tone",
      ]
    ),
    fit: reviewerResult(
      fitScore,
      fitScore >= 80 ? "Fit feels specific" : "Fit feels generic",
      [
        firstGeneric
          ? `Generic phrase: "${firstGeneric}" - replace with specific alignment`
          : "No common generic phrases detected",
        `Application type: ${applicationType}`,
        evidenceBank.identity[0]
          ? `Identity anchor: "${evidenceBank.identity[0]}"`
          : "Add identity anchor from memory",
      ],
      firstGeneric
        ? [
            `Replace "${firstGeneric}" with specific connection to your work`,
            "Connect opportunity to your current trajectory",
          ]
        : []
    ),
    clarity: reviewerResult(
      clarityScore,
      clarityScore >= 80 ? "Readable and direct" : "Structure needs work",
      [
        `${sentences.length} sentences, avg ${avgSentenceLen} words`,
        avgSentenceLen > 22 ? "Consider breaking longer sentences" : "Good sentence length",
      ],
      avgSentenceLen > 22 ? ["Break sentences over 22 words"] : []
    ),
    evidence: reviewerResult(
      evidenceScore,
      evidenceScore >= 80 ? "Evidence is solid" : "Evidence needs work",
      [
        projectWarnings.length > 0
          ? `${projectWarnings.length} project(s) named but not explained`
          : "All named projects are explained",
        links.requiredLinksMissing.length > 0
          ? `Missing ${links.requiredLinksMissing.length} required link(s)`
          : "Required links present",
        `${evidenceBank.projects.filter((p) => p.mentionedInAnswer).length} projects mentioned`,
      ],
      projectWarnings.length > 0
        ? [
            `Add explanation for: ${firstProjectWarning?.projectName}`,
            "Use one-liner when first mentioning a project",
          ]
        : []
    ),
    length: reviewerResult(
      lengthScore,
      lengthScore >= 80 ? "Length is in range" : "Length needs adjustment",
      [
        `${wordCount} words (~${deterministicChecks.speakingTimeSeconds}s at 145 wpm)`,
        deterministicChecks.lengthFit.note,
      ],
      deterministicChecks.lengthFit.status === "tooShort"
        ? ["Add content to reach target length"]
        : deterministicChecks.lengthFit.status === "tooLong"
        ? ["Trim excess to fit target"]
        : []
    ),
    voice: reviewerResult(
      voiceScore,
      voiceScore >= 80 ? "Voice feels human" : "Voice needs personality",
      [
        genericPhrases.length > 0
          ? `Generic phrases: ${genericPhrases.map((g) => g.phrase).join(", ")}`
          : "Voice is original",
        projectWarnings.length > 0
          ? "Project explanations add personality"
          : "Consider adding project voice",
      ],
      genericPhrases.length > 0
        ? ["Replace generic phrases with specific details"]
        : []
    ),
    risk: reviewerResult(
      riskScore,
      riskScore >= 80 ? "Low submission risk" : "Risk factors present",
      [
        links.requiredLinksMissing.length > 0
          ? `MISSING: Required ${links.requiredLinksMissing.join(", ")} link`
          : "No missing required links",
        missingCount > 0 ? `${missingCount} missing requirement(s)` : "All requirements addressed",
        genericPhrases.length > 0 ? "Generic phrasing may hurt fit" : "",
      ],
      links.requiredLinksMissing.length > 0
        ? ["Add required link immediately"]
        : missingCount > 0
        ? ["Complete missing requirements"]
        : []
    ),
  };
}

export function scoreReview(reviewerPanel: ReviewerPanel): number {
  const score =
    reviewerPanel.requirements.score * SCORE_WEIGHTS.requirements +
    reviewerPanel.fit.score * SCORE_WEIGHTS.fit +
    reviewerPanel.evidence.score * SCORE_WEIGHTS.evidence +
    reviewerPanel.clarity.score * SCORE_WEIGHTS.clarity +
    reviewerPanel.length.score * SCORE_WEIGHTS.length +
    reviewerPanel.risk.score * SCORE_WEIGHTS.risk;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getStatusFromScore(score: number): ReadinessStatus {
  if (score >= 85) return "ready_minor_polish";
  if (score >= 70) return "close_needs_edits";
  if (score >= 50) return "needs_major_fixes";
  return "not_ready";
}

export function buildNextBestEdit(
  coverage: RequirementCoverageItem[],
  reviewerPanel: ReviewerPanel,
  evidenceBank: EvidenceBank,
  deterministicChecks: DeterministicChecks,
  applicationType: ApplicationType
): NextBestEdit {
  const firstMissing = coverage.find(
    (c) => c.status === "missing" && c.priority === "high"
  );
  const firstProjectWarning = deterministicChecks.projectExplanationWarnings[0];
  const missingLink =
    deterministicChecks.links.requiredLinksMissing.length > 0;
  const firstGeneric = deterministicChecks.genericPhrases[0];

  // Prioritize project explanation when both link AND project warnings exist
  if (firstProjectWarning && !missingLink) {
    return {
      action: `Explain ${firstProjectWarning.projectName}`,
      why: firstProjectWarning.issue,
      suggestedText: `${firstProjectWarning.projectName} — ${firstProjectWarning.suggestedOneLiner}`,
      expectedImpact: "high",
    };
  }

  if (firstProjectWarning && firstGeneric) {
    return {
      action: `Explain ${firstProjectWarning.projectName}`,
      why: firstProjectWarning.issue,
      suggestedText: `${firstProjectWarning.projectName} — ${firstProjectWarning.suggestedOneLiner}`,
      expectedImpact: "high",
    };
  }

  if (missingLink) {
    return {
      action: "Add the required public link",
      why: "The brief explicitly requires a publicly accessible link",
      suggestedText: `Add your ${deterministicChecks.links.savedLinksAvailable[0] || "public link"} to the answer`,
      expectedImpact: "high",
    };
  }

  if (firstMissing) {
    return {
      action: `Address: ${firstMissing.requirement.slice(0, 30)}`,
      why: firstMissing.gap,
      suggestedText: firstMissing.whatToAdd,
      expectedImpact: "high",
    };
  }

  if (firstGeneric) {
    const project = evidenceBank.projects.find((p) => p.oneLiner);
    return {
      action: `Replace "${firstGeneric.phrase}"`,
      why: "Generic phrasing doesn't show specific fit",
      suggestedText: project
        ? `${project.name} — ${project.oneLiner}`
        : "Replace with a specific detail about your work",
      expectedImpact: "medium",
    };
  }

  if (reviewerPanel.length.score < 80) {
    return {
      action: "Adjust length to target",
      why: deterministicChecks.lengthFit.note,
      suggestedText:
        deterministicChecks.lengthFit.status === "tooShort"
          ? "Add a concrete example or project detail"
          : "Trim excess content",
      expectedImpact: "medium",
    };
  }

  return {
    action: "Polish the opening",
    why: "First impressions matter",
    suggestedText: "Lead with your identity and current work",
    expectedImpact: "low",
  };
}

export function buildFixPlan(
  coverage: RequirementCoverageItem[],
  reviewerPanel: ReviewerPanel,
  deterministicChecks: DeterministicChecks,
  applicationType: ApplicationType
): FixPlanItem[] {
  const items: FixPlanItem[] = [];
  const added = new Set<string>();

  const addIfNotExists = (item: FixPlanItem) => {
    if (!added.has(item.title)) {
      items.push({ ...item, step: items.length + 1 });
      added.add(item.title);
    }
  };

  if (deterministicChecks.links.requiredLinksMissing.length > 0) {
    addIfNotExists({
      step: 0,
      title: "Add required public link",
      why: "Brief explicitly requires a publicly accessible link",
      effort: "1 min",
      impact: "high",
      suggestedText: `Add: ${deterministicChecks.links.savedLinksAvailable[0] || "[your public link]"}`,
    });
  }

  for (const warning of deterministicChecks.projectExplanationWarnings.slice(0, 1)) {
    addIfNotExists({
      step: 0,
      title: `Explain ${warning.projectName}`,
      why: warning.issue,
      effort: "1 min",
      impact: "high",
      suggestedText: `${warning.projectName} — ${warning.suggestedOneLiner}`,
    });
  }

  for (const missing of coverage.filter((c) => c.status === "missing").slice(0, 2)) {
    addIfNotExists({
      step: 0,
      title: `Cover: ${missing.requirement.slice(0, 30)}`,
      why: missing.gap,
      effort: "3 min",
      impact: "high",
      suggestedText: missing.whatToAdd,
    });
  }

  for (const generic of deterministicChecks.genericPhrases.slice(0, 1)) {
    addIfNotExists({
      step: 0,
      title: `Replace "${generic.phrase}"`,
      why: "Generic doesn't show specific fit",
      effort: "3 min",
      impact: "medium",
      suggestedText: generic.replacementSuggestion,
    });
  }

  if (reviewerPanel.length.score < 80) {
    addIfNotExists({
      step: 0,
      title: "Adjust to target length",
      why: deterministicChecks.lengthFit.note,
      effort: "3 min",
      impact: "medium",
      suggestedText:
        deterministicChecks.lengthFit.status === "tooShort"
          ? "Add project or achievement detail"
          : "Trim filler sentences",
    });
  }

  for (const partial of coverage.filter((c) => c.status === "partial").slice(0, 1)) {
    addIfNotExists({
      step: 0,
      title: `Strengthen: ${partial.requirement.slice(0, 30)}`,
      why: partial.gap || "Partial coverage",
      effort: "3 min",
      impact: "medium",
      suggestedText: partial.whatToAdd || `Add more detail about ${partial.requirement}`,
    });
  }

  return items.slice(0, 5);
}

export function buildReadinessReport(
  score: number,
  status: ReadinessStatus,
  nextBestEdit: NextBestEdit,
  fixPlan: FixPlanItem[],
  coverage: RequirementCoverageItem[],
  reviewerPanel: ReviewerPanel,
  deterministicChecks: DeterministicChecks
): ReadinessReport {
  const criticalIssues: string[] = [];
  const warnings: string[] = [];
  const strongPoints: string[] = [];

  const missing = coverage.filter((c) => c.status === "missing");
  if (missing.length > 0) {
    criticalIssues.push(`${missing.length} requirement(s) missing`);
  }

  if (deterministicChecks.links.requiredLinksMissing.length > 0) {
    criticalIssues.push(
      `MISSING Link: ${deterministicChecks.links.requiredLinksMissing.join(", ")}`
    );
  }

  if (deterministicChecks.lengthFit.status === "tooShort") {
    criticalIssues.push(`Too short: ${deterministicChecks.lengthFit.note}`);
  }

  if (deterministicChecks.genericPhrases.length > 0) {
    warnings.push(
      `Generic: ${deterministicChecks.genericPhrases.map((g) => g.phrase).join(", ")}`
    );
  }

  const partial = coverage.filter((c) => c.status === "partial");
  if (partial.length > 0) {
    warnings.push(`${partial.length} partial coverage`);
  }

  if (coverage.filter((c) => c.status === "covered").length >= coverage.length * 0.7) {
    strongPoints.push("Most requirements covered");
  }

  if (deterministicChecks.links.urlsFound.length > 0) {
    strongPoints.push("Link(s) present");
  }

  const verdict =
    status === "ready_minor_polish"
      ? "Ready with minor edits"
      : status === "close_needs_edits"
      ? "Close but needs edits"
      : status === "needs_major_fixes"
      ? "Needs major fixes"
      : "Not ready for submission";

  return {
    score,
    status,
    verdict,
    nextBestEdit,
    criticalIssues,
    warnings,
    strongPoints,
    fixPlan,
    wordCount: deterministicChecks.wordCount,
    speakingTimeSeconds: deterministicChecks.speakingTimeSeconds,
  };
}