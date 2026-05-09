export type ApplicationType =
  | "fellowship"
  | "hackathon"
  | "internship"
  | "accelerator"
  | "scholarship"
  | "grant"
  | "club"
  | "other";

export type TargetFormat =
  | "written"
  | "shortEssay"
  | "longEssay"
  | "videoScript"
  | "formAnswers"
  | "other";

export type Strictness = "gentle" | "balanced" | "brutal";

export interface OpportunityInput {
  programName: string;
  applicationType: ApplicationType;
  deadline?: string;
  targetFormat: TargetFormat;
  targetWords?: number;
  targetSeconds?: number;
  strictness: Strictness;
}

export interface ReviewInput {
  opportunity: OpportunityInput;
  brief: string;
  answer: string;
  questions?: QuestionInput[];
  memory: ApplicationMemory;
}

export interface QuestionInput {
  id: string;
  question: string;
  answer: string;
}

export interface ApplicationMemoryProfile {
  name?: string;
  bio?: string;
  currentFocus?: string;
  preferredTone?: string;
}

export interface MemoryProject {
  name: string;
  oneLiner: string;
  description?: string;
  tags?: string[];
  links?: string[];
  evidence?: string[];
}

export interface MemoryAchievement {
  title: string;
  description: string;
  proofLink?: string;
}

export interface MemorySnippet {
  title: string;
  text: string;
  tags?: string[];
}

export interface ApplicationMemory {
  profile: ApplicationMemoryProfile;
  projects: MemoryProject[];
  achievements: MemoryAchievement[];
  links: Record<string, string>;
  snippets: MemorySnippet[];
}

export interface BriefRequirement {
  id: string;
  text: string;
  type: "topic" | "format" | "length" | "link" | "deadline" | "file" | "question" | "other";
  priority: "high" | "medium" | "low";
  sourceQuote?: string;
}

export interface HiddenRequirement {
  id: string;
  text: string;
  whyItMatters: string;
  priority: "high" | "medium" | "low";
}

export interface RequiredLink {
  type: "video" | "github" | "portfolio" | "resume" | "publicLink" | "other";
  required: boolean;
  foundInBrief: boolean;
  note: string;
}

export interface TargetLength {
  minWords?: number;
  maxWords?: number;
  minSeconds?: number;
  maxSeconds?: number;
}

export interface BriefAnalysis {
  summary: string;
  explicitRequirements: BriefRequirement[];
  hiddenRequirements: HiddenRequirement[];
  evaluationCriteria: string[];
  requiredLinks: RequiredLink[];
  targetLength?: TargetLength;
  risks: string[];
}

export interface EvidenceProject {
  name: string;
  oneLiner: string;
  mentionedInAnswer: boolean;
  explainedInAnswer: boolean;
  relevanceToBrief: "high" | "medium" | "low";
  suggestedUse: string;
}

export interface EvidenceAchievement {
  title: string;
  relevanceToBrief: "high" | "medium" | "low";
  suggestedUse: string;
}

export interface EvidenceLink {
  label: string;
  url: string;
  type: string;
  relevantRequirementIds: string[];
}

export interface EvidenceSnippet {
  title: string;
  text: string;
  relevance: "high" | "medium" | "low";
}

export interface EvidenceBank {
  identity: string[];
  projects: EvidenceProject[];
  achievements: EvidenceAchievement[];
  links: EvidenceLink[];
  reusableSnippets: EvidenceSnippet[];
  missingEvidence: string[];
}

export interface DeterministicChecks {
  wordCount: number;
  speakingTimeSeconds: number;
  lengthFit: {
    status: "tooShort" | "tooLong" | "fits" | "unknown";
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

export interface RequirementCoverageItem {
  requirementId: string;
  requirement: string;
  status: "covered" | "partial" | "missing";
  evidenceFound: string;
  gap: string;
  whatToAdd: string;
  priority: "high" | "medium" | "low";
}

export interface ReviewerResult {
  score: number;
  verdict: string;
  specificFindings: string[];
  fixes: string[];
}

export interface ReviewerPanel {
  requirements: ReviewerResult;
  fit: ReviewerResult;
  clarity: ReviewerResult;
  evidence: ReviewerResult;
  length: ReviewerResult;
  voice: ReviewerResult;
  risk: ReviewerResult;
}

export type ReadinessStatus =
  | "not_ready"
  | "needs_major_fixes"
  | "close_needs_edits"
  | "ready_minor_polish";

export interface NextBestEdit {
  action: string;
  why: string;
  suggestedText?: string;
  expectedImpact: "high" | "medium" | "low";
}

export interface FixPlanItem {
  step: number;
  title: string;
  why: string;
  effort: "1 min" | "3 min" | "5 min" | "10 min";
  impact: "high" | "medium" | "low";
  suggestedText?: string;
}

export interface ReadinessReport {
  score: number;
  status: ReadinessStatus;
  verdict: string;
  nextBestEdit: NextBestEdit;
  criticalIssues: string[];
  warnings: string[];
  strongPoints: string[];
  fixPlan: FixPlanItem[];
  wordCount: number;
  speakingTimeSeconds: number;
}

export interface ImprovedApplication {
  improvedAnswer: string;
  whatChanged: string[];
  whyBetter: string[];
  wordCount: number;
  speakingTimeSeconds: number;
}

export interface PacketLink {
  label: string;
  status: "included" | "missing" | "availableInVault";
  value?: string;
  note?: string;
}

export interface PacketChecklistItem {
  item: string;
  status: "done" | "missing" | "review";
  note?: string;
}

export interface ApplicationPacket {
  title: string;
  finalAnswer: string;
  requiredLinks: PacketLink[];
  submissionChecklist: PacketChecklistItem[];
  exportMarkdown: string;
}

export interface InputSummary {
  programName: string;
  applicationType: ApplicationType;
  targetFormat: TargetFormat;
  strictness: Strictness;
}

export interface DebugInfo {
  engineVersion: "v2";
  stagesCompleted: string[];
  providerUsed?: string;
  fallbackUsed?: boolean;
}

export interface FullReviewResult {
  id: string;
  inputSummary: InputSummary;
  briefAnalysis: BriefAnalysis;
  evidenceBank: EvidenceBank;
  deterministicChecks: DeterministicChecks;
  requirementCoverage: RequirementCoverageItem[];
  reviewerPanel: ReviewerPanel;
  readinessReport: ReadinessReport;
  improvedApplication: ImprovedApplication;
  applicationPacket: ApplicationPacket;
  debug?: DebugInfo;
}

export interface TweakInput {
  tool:
    | "strengthenFit"
    | "explainProject"
    | "makeLessGeneric"
    | "addEvidence"
    | "shorten"
    | "expand"
    | "videoScript"
    | "improveOpening"
    | "improveClosing"
    | "fixTone";
  text: string;
  context: FullReviewResult;
  memory: ApplicationMemory;
  options?: {
    tone?: string;
    targetWords?: number;
    targetSeconds?: number;
  };
}

export interface TweakResult {
  updatedText: string;
  whatChanged: string[];
  whyItHelps: string[];
  wordCount: number;
  speakingTimeSeconds: number;
}

export function createDefaultMemory(): ApplicationMemory {
  return {
    profile: {
      name: "",
      bio: "",
      currentFocus: "",
      preferredTone: "confident",
    },
    projects: [],
    achievements: [],
    links: {},
    snippets: [],
  };
}

export function createDefaultBriefAnalysis(): BriefAnalysis {
  return {
    summary: "",
    explicitRequirements: [],
    hiddenRequirements: [],
    evaluationCriteria: [],
    requiredLinks: [],
    targetLength: undefined,
    risks: [],
  };
}