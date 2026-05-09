export interface UserMemory {
  name: string;
  bio: string;
  focus: string;
  projects: string;
  achievements: string;
  links: string;
  snippets: string;
  tone: string;
}

export interface MemoryProfile {
  name: string;
  shortBio: string;
  currentFocus: string;
  preferredTone: string;
  locationTimezone?: string;
}

export interface MemoryProject {
  name: string;
  oneLiner: string;
  longerExplanation: string;
  tags: string[];
  links: string[];
  proof: string;
  bestUseCase: string;
}

export interface MemoryAchievement {
  title: string;
  description: string;
  proof: string;
  category: string;
}

export interface AnswerLibrarySnippet {
  title: string;
  body: string;
  tags: string[];
}

export interface LinkVault {
  github: string;
  linkedin: string;
  portfolio: string;
  resume: string;
  demoVideo: string;
  projectLinks: string[];
  otherLinks: string[];
}

export interface MemoryPreferences {
  preferredTone: string;
  preferredApplicationTypes: ApplicationType[];
  timezone?: string;
  notes?: string;
}

export interface ApplicationMemory {
  profile: MemoryProfile;
  projects: MemoryProject[];
  achievements: MemoryAchievement[];
  answerLibrary: AnswerLibrarySnippet[];
  linkVault: LinkVault;
  preferences: MemoryPreferences;
  updatedAt?: string;
}

export interface BriefAnalysis {
  explicitRequirements: string[];
  impliedCriteria: string[];
  submissionRisks: string[];
  suggestedAngles: string[];
  summary: string;
}

export interface GeneratedAnswer {
  draft: string;
  whyItWorks: string[];
  customize: string[];
}

export interface CheckResult {
  score: number;
  status: string;
  criticalIssues: string[];
  warnings: string[];
  strongPoints: string[];
  fixOrder: string[];
  wordCount: number;
  speakingTimeSeconds: number;
}

export type ToneOption = 'Confident' | 'Warm' | 'Technical' | 'Founder-like' | 'Concise';
export type LengthOption = '100 words' | '150 words' | '200 words' | '60-90 sec video';

export type ApplicationType =
  | 'Fellowship'
  | 'Hackathon'
  | 'Internship'
  | 'Accelerator'
  | 'Scholarship'
  | 'Club/community'
  | 'Grant'
  | 'Other';

export type ReviewStrictness = 'Gentle' | 'Balanced' | 'Brutal';

export interface ReviewerSummary {
  score: number;
  summary: string;
  findings: string[];
}

export interface ReviewerPanel {
  requirements: ReviewerSummary;
  fit: ReviewerSummary;
  clarity: ReviewerSummary;
  length: ReviewerSummary;
  voice: ReviewerSummary;
  risk: ReviewerSummary;
}

export interface RequirementCoverageItem {
  requirement: string;
  status: 'covered' | 'partial' | 'missing';
  note: string;
}

export interface ReviewerPanelItem {
  score: number;
  verdict: string;
  specificFindings: string[];
  fixes: string[];
}

export interface BriefAnalysisV2 {
  summary: string;
  explicitRequirements: string[];
  hiddenRequirements: string[];
  deliverables: string[];
  requiredLinks: string[];
  answerTopics: string[];
  evaluationCriteria: string[];
  deadlineConstraints: string[];
  formatConstraints: string[];
  submissionRisks: string[];
}

export interface EvidenceBank {
  projects: string[];
  achievements: string[];
  links: string[];
  personalAngles: string[];
  reusableSnippets: string[];
  answerSnippets: string[];
}

export interface NextBestEdit {
  title: string;
  reason: string;
  suggestedText: string;
}

export interface FixPlanItem {
  step: number;
  title: string;
  why: string;
  effort: string;
  impact: 'high' | 'medium' | 'low';
  suggestedText: string;
}

export interface ImprovedAnswerVariant {
  originalAnswer: string;
  improvedAnswer: string;
  whatChanged: string[];
  whyItIsBetter: string[];
  wordCount: number;
  speakingTimeSeconds?: number;
}

export interface ApplicationPacket {
  programName: string;
  applicationType: ApplicationType;
  overallScore: number;
  status: string;
  nextBestEdit: string;
  finalAnswers: string[];
  requirementChecklist: RequirementCoverageItem[];
  requiredLinks: string[];
  fixPlan: FixPlanItem[];
  submissionChecklist: string[];
  exportMarkdown: string;
}

export interface FullReviewPacket {
  reviewId: string;
  programName: string;
  applicationType: ApplicationType;
  deadlineMode: {
    mode: 'careful' | 'fast' | 'emergency';
    timeRemaining: string;
    recommendation: string;
  };
  briefAnalysis: BriefAnalysisV2;
  evidenceBank: EvidenceBank;
  requirementCoverage: RequirementCoverageItem[];
  reviewerPanel: {
    requirements: ReviewerPanelItem;
    fit: ReviewerPanelItem;
    clarity: ReviewerPanelItem;
    evidence: ReviewerPanelItem;
    length: ReviewerPanelItem;
    voice: ReviewerPanelItem;
    risk: ReviewerPanelItem;
  };
  readinessReport: CheckResult;
  nextBestEdit: NextBestEdit;
  fixPlan: FixPlanItem[];
  improvedApplication: ImprovedAnswerVariant;
  applicationPacket: ApplicationPacket;
}
