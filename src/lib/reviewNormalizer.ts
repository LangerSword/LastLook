import type { BriefAnalysis, CheckResult, GeneratedAnswer, RequirementCoverageItem, ReviewerPanel } from './types';
import type { ReviewSession } from './reviewStore';
import { buildTailoredDashboardSummary, type DashboardSummary } from './dashboardSummary';

export interface NormalizedReview {
  reviewId: string;
  title: string;
  applicationType: string;
  briefAnalysis: BriefAnalysis;
  generatedAnswer: GeneratedAnswer;
  readinessReport: CheckResult;
  reviewerPanel: ReviewerPanel;
  requirementCoverage: RequirementCoverageItem[];
  dashboardSummary: DashboardSummary;
}

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const tokensFromRequirement = (requirement: string) =>
  requirement
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 3);

const findCoverage = (requirements: string[], answer: string): RequirementCoverageItem[] => {
  const lower = answer.toLowerCase();
  return requirements.map((requirement) => {
    const tokens = tokensFromRequirement(requirement);
    const matches = tokens.filter((token) => lower.includes(token));
    let status: RequirementCoverageItem['status'] = 'missing';
    if (matches.length >= Math.min(3, tokens.length)) status = 'covered';
    else if (matches.length > 0) status = 'partial';

    const note =
      status === 'covered'
        ? `Covered with mentions of ${matches.slice(0, 2).join(', ') || 'core requirement'}.`
        : status === 'partial'
        ? `Partially addressed. Add a direct line about ${tokens[0] || 'this requirement'}.`
        : `No direct mention found. Add one sentence that answers this explicitly.`;

    return { requirement, status, note };
  });
};

const extractConcreteDetail = (brief: BriefAnalysis, question: string, answer: string) => {
  if (brief.explicitRequirements?.length) return brief.explicitRequirements[0];
  if (question) return question.split(/\s+/).slice(0, 10).join(' ');
  return answer.split(/\s+/).slice(0, 10).join(' ');
};

const buildReviewerPanel = (report: CheckResult, brief: BriefAnalysis, question: string, answer: string): ReviewerPanel => {
  const detail = extractConcreteDetail(brief, question, answer);
  const critical = report.criticalIssues || [];
  const warnings = report.warnings || [];
  const strong = report.strongPoints || [];

  const requirementsScore = clamp(report.score - critical.length * 8 - warnings.length * 3);
  const fitScore = clamp(report.score - warnings.length * 4);
  const clarityScore = clamp(report.score - warnings.length * 6);
  const lengthScore = clamp(report.score - Math.abs((report.wordCount || 0) - 160) / 3);
  const voiceScore = clamp(report.score - warnings.length * 2);
  const riskScore = clamp(report.score - critical.length * 10);

  const formatFindings = (primary: string[], fallback: string[]): string[] => {
    const base = primary.length ? primary : fallback;
    return base.slice(0, 3);
  };

  return {
    requirements: {
      score: requirementsScore,
      summary: `Checklist fit for: ${detail}`,
      findings: formatFindings(critical, [
        `Explicitly address: ${detail}`,
        'Add a direct response to every required prompt.',
      ]),
    },
    fit: {
      score: fitScore,
      summary: `Opportunity alignment check`,
      findings: formatFindings(warnings, [
        `Connect your experience to ${detail}.`,
        'Add one sentence on why this opportunity fits now.',
      ]),
    },
    clarity: {
      score: clarityScore,
      summary: `Structure and clarity pass`,
      findings: formatFindings(warnings, [
        `Open with a plain-language sentence about ${detail}.`,
        'Break long sentences into two shorter ones.',
      ]),
    },
    length: {
      score: lengthScore,
      summary: `Length and pacing check`,
      findings: [
        `Current length: ${report.wordCount} words (~${report.speakingTimeSeconds}s).`,
        'Trim or expand to match the stated target.',
      ],
    },
    voice: {
      score: voiceScore,
      summary: `Voice consistency`,
      findings: formatFindings(strong, [
        'Keep tone consistent across all sentences.',
        `Add one concrete detail tied to ${detail}.`,
      ]),
    },
    risk: {
      score: riskScore,
      summary: `Submission risk scan`,
      findings: formatFindings(critical, [
        'Verify required links or assets are included.',
        `Avoid vague claims about ${detail}.`,
      ]),
    },
  };
};

export function normalizeReviewSession(session: ReviewSession): NormalizedReview {
  const answer = session.finalAnswer || session.generatedDraft || '';
  const briefAnalysis = session.briefAnalysis || {
    explicitRequirements: [],
    impliedCriteria: [],
    submissionRisks: [],
    suggestedAngles: [],
    summary: '',
  };
  const readinessReport = session.readinessReport || {
    score: 0,
    status: 'Unknown',
    criticalIssues: [],
    warnings: [],
    strongPoints: [],
    fixOrder: [],
    wordCount: 0,
    speakingTimeSeconds: 0,
  };
  const summary = session.dashboardSummary ||
    buildTailoredDashboardSummary({
      briefAnalysis,
      generatedAnswer: session.generatedDraft
        ? { draft: session.generatedDraft, whyItWorks: [], customize: [] }
        : undefined,
      readinessReport,
      question: session.question,
      finalAnswer: session.finalAnswer,
    });

  const applicationType = summary.applicationType || session.applicationType || 'Other';

  return {
    reviewId: session.id,
    title: summary.programName || session.title,
    applicationType,
    briefAnalysis,
    generatedAnswer: {
      draft: session.generatedDraft || session.finalAnswer || '',
      whyItWorks: [],
      customize: [],
    },
    readinessReport,
    reviewerPanel: buildReviewerPanel(readinessReport, briefAnalysis, session.question || '', answer),
    requirementCoverage: findCoverage(briefAnalysis.explicitRequirements || [], answer),
    dashboardSummary: summary,
  };
}
