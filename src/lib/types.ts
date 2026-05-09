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
