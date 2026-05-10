export type StageName =
  | "parse-brief"
  | "evidence-bank"
  | "deterministic-checks"
  | "requirement-coverage"
  | "reviewer-panel"
  | "score"
  | "readiness-report"
  | "application-packet"
  | "save";

export type ResultMode =
  | "ai_full"
  | "partial_ai"
  | "deterministic_fallback"
  | "cached"
  | "mock_demo"
  | "fallback_stage"
  | "ai_stage"
  | "deterministic_stage";

export interface StageResponse<T = unknown> {
  ok: boolean;
  stage: StageName;
  durationMs: number;
  resultMode: ResultMode;
  provider?: string;
  model?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface WorkflowContext {
  inputHash?: string;
  brief: string;
  question: string;
  answer: string;
  memory: unknown;
  programName: string;
  applicationType: string;
  reviewStrictness: string;
  targetLength: string;
  deadline?: string;
  userId?: string;
  byok?: boolean;
  seed?: number;
  stagesCompleted: string[];
  quotaConsumed: boolean;
  briefAnalysis?: StageBriefAnalysis;
  evidenceBank?: StageEvidenceBank;
  deterministicChecks?: StageDeterministicChecks;
  requirementCoverage?: StageRequirementCoverage;
  reviewerPanel?: StageReviewerPanel;
  score?: StageScore;
  readinessReport?: unknown;
  applicationPacket?: StagePacket;
}

export interface StageBriefAnalysis {
  summary: string;
  explicitRequirements: {
    id: string;
    text: string;
    type: string;
    priority: string;
    sourceQuote?: string;
  }[];
  hiddenRequirements: {
    id: string;
    text: string;
    whyItMatters: string;
    priority: string;
  }[];
  evaluationCriteria: string[];
  requiredLinks: {
    type: string;
    required: boolean;
    foundInBrief: boolean;
    note: string;
  }[];
  targetLength?: {
    minWords?: number;
    maxWords?: number;
    minSeconds?: number;
    maxSeconds?: number;
  };
  risks: string[];
}

export interface StageEvidenceBank {
  identity: string[];
  projects: {
    name: string;
    oneLiner: string;
    mentionedInAnswer: boolean;
    explainedInAnswer: boolean;
    relevanceToBrief: string;
    suggestedUse: string;
  }[];
  achievements: {
    title: string;
    relevanceToBrief: string;
    suggestedUse: string;
  }[];
  links: {
    label: string;
    url: string;
    type: string;
    relevantRequirementIds: string[];
  }[];
  reusableSnippets: {
    title: string;
    text: string;
    relevance: string;
  }[];
  missingEvidence: string[];
}

export interface StageDeterministicChecks {
  wordCount: number;
  speakingTimeSeconds: number;
  lengthFit: {
    status: string;
    note: string;
  };
  links: {
    urlsFound: string[];
    requiredLinksMissing: string[];
    savedLinksAvailable: string[];
  };
  genericPhrases: {
    phrase: string;
    replacementSuggestion: string;
  }[];
  projectExplanationWarnings: {
    projectName: string;
    issue: string;
    suggestedOneLiner: string;
  }[];
  memoryUsage: {
    usedProjects: string[];
    unusedRelevantProjects: string[];
    note: string;
  };
  formattingIssues: string[];
}

export interface StageRequirementCoverage {
  items: {
    requirementId: string;
    requirement: string;
    status: string;
    evidenceFound: string;
    gap: string;
    whatToAdd: string;
    priority: string;
  }[];
}

export interface StageReviewerResult {
  score: number;
  verdict: string;
  specificFindings: string[];
  fixes: string[];
}

export interface StageReviewerPanel {
  requirements: StageReviewerResult;
  fit: StageReviewerResult;
  clarity: StageReviewerResult;
  evidence: StageReviewerResult;
  length: StageReviewerResult;
  voice: StageReviewerResult;
  risk: StageReviewerResult;
}

export interface StageNextBestEdit {
  action: string;
  why: string;
  suggestedText?: string;
  expectedImpact: string;
}

export interface StageFixPlan {
  items: {
    step: number;
    title: string;
    why: string;
    effort: string;
    impact: string;
    suggestedText?: string;
  }[];
}

export interface StageImprovedAnswer {
  improvedAnswer: string;
  whatChanged: string[];
  whyItIsBetter: string[];
  wordCount: number;
  speakingTimeSeconds: number;
}

export interface StageScore {
  score: number;
  status: string;
  verdict: string;
}

export interface StagePacket {
  programName: string;
  applicationType: string;
  overallScore: number;
  status: string;
  requiredLinks: {
    label: string;
    status: string;
    value?: string;
    note?: string;
  }[];
  submissionChecklist: {
    item: string;
    status: string;
    note?: string;
  }[];
  exportMarkdown: string;
}

export interface StageSave {
  reviewId: string;
  savedAt: string;
}
