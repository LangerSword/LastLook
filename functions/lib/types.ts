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

export type ApplicationType = 'Fellowship' | 'Hackathon' | 'Internship' | 'Accelerator' | 'Scholarship' | 'Club/community' | 'Grant' | 'Other';
export type ReviewStrictness = 'Gentle' | 'Balanced' | 'Brutal';