import type { StageTiming } from '../tools/index';
import {
  RequirementReviewer,
  type RequirementReviewerInput,
} from '../reviewers/requirementReviewer';
import { FitReviewer, type FitReviewerInput } from '../reviewers/fitReviewer';
import { ClarityReviewer, type ClarityReviewerInput } from '../reviewers/clarityReviewer';
import { EvidenceReviewer, type EvidenceReviewerInput } from '../reviewers/evidenceReviewer';
import { LengthReviewer, type LengthReviewerInput } from '../reviewers/lengthReviewer';
import { VoiceReviewer, type VoiceReviewerInput } from '../reviewers/voiceReviewer';
import { RiskReviewer, type RiskReviewerInput } from '../reviewers/riskReviewer';
import { computeReadinessScore } from '../tools/computeReadinessScore';
import { buildApplicationPacket } from '../tools/buildApplicationPacket';
import { wordCount } from '../tools/wordCount';
import { estimateSpeakingTime } from '../tools/speakingTime';
import { detectDeadlineUrgency } from '../tools/detectDeadlineUrgency';

export type ResultMode = 'ai_full' | 'cached' | 'deterministic_fallback' | 'mock_demo';

export interface WorkflowInput {
  brief: string;
  answer: string;
  memory: {
    profile?: { name?: string; bio?: string; currentFocus?: string; preferredTone?: string };
    projects?: { name?: string; oneLiner?: string; longerExplanation?: string; bestUseCase?: string }[];
    achievements?: { title?: string; description?: string; proofLink?: string }[];
    linkVault?: { github?: string; linkedin?: string; portfolio?: string; demoVideo?: string };
  };
  opportunity: {
    programName?: string;
    applicationType?: string;
    targetFormat?: string;
    targetWords?: number;
    targetSeconds?: number;
    strictness?: string;
    deadline?: string;
  };
}

export interface WorkflowResult {
  resultMode: ResultMode;
  inputHash: string;
  score: number;
  status: string;
  componentScores: Record<string, number>;
  stagesCompleted: string[];
  timings: StageTiming[];
  nextBestEdit: { action: string; suggestedText: string };
  requirementCoverage: { requirement: string; status: string }[];
  fixPlan: { step: number; title: string; effort: string; impact: string }[];
  applicationPacket: ReturnType<typeof buildApplicationPacket>;
  deadlineMode: ReturnType<typeof detectDeadlineUrgency>;
}

export function runToolBasedReview(input: WorkflowInput, startTime: number): WorkflowResult {
  const timings: StageTiming[] = [];

  function addTiming(stage: string, status: StageTiming['status'], error?: string) {
    timings.push(trackTiming(stage, startTime, status, error));
  }

  let currentTime = Date.now();

  addTiming('normalizeInput', 'completed');

  const briefAnalysis = parseBrief(input.brief);
  currentTime = Date.now();
  addTiming('parseBrief', 'completed');

  const evidenceBank = buildEvidenceBankForWorkflow(input.memory, input.answer, briefAnalysis);
  currentTime = Date.now();
  addTiming('buildEvidenceBank', 'completed');

  const reqInput: RequirementReviewerInput = {
    briefAnalysis,
    answer: input.answer,
    memoryLinks: input.memory.linkVault,
  };
  const requirementResult = RequirementReviewer(reqInput);
  currentTime = Date.now();
  addTiming('requirementCoverage', 'completed');

  const fitInput: FitReviewerInput = {
    answer: input.answer,
    memory: input.memory,
    opportunity: input.opportunity,
  };
  const fitResult = FitReviewer(fitInput);
  currentTime = Date.now();

  const clarityInput: ClarityReviewerInput = {
    answer: input.answer,
    projects: input.memory.projects || [],
  };
  const clarityResult = ClarityReviewer(clarityInput);
  currentTime = Date.now();

  const evidenceInput: EvidenceReviewerInput = {
    answer: input.answer,
    memory: input.memory,
  };
  const evidenceResult = EvidenceReviewer(evidenceInput);
  currentTime = Date.now();

  const lengthInput: LengthReviewerInput = {
    answer: input.answer,
    targetLength: input.opportunity.targetSeconds
      ? { minSeconds: 60, maxSeconds: 90 }
      : input.opportunity.targetWords
        ? { minWords: 100, maxWords: 200 }
        : undefined,
  };
  const lengthResult = LengthReviewer(lengthInput);
  currentTime = Date.now();

  const voiceInput: VoiceReviewerInput = {
    answer: input.answer,
    preferredTone: input.memory.profile?.preferredTone,
  };
  const voiceResult = VoiceReviewer(voiceInput);
  currentTime = Date.now();

  const riskInput: RiskReviewerInput = {
    answer: input.answer,
    briefAnalysis,
    deadline: input.opportunity.deadline,
  };
  const riskResult = RiskReviewer(riskInput);
  currentTime = Date.now();
  addTiming('reviewerPanel', 'completed');

  const componentScores = {
    requirements: requirementResult.score,
    fit: fitResult.score,
    clarity: clarityResult.score,
    evidence: evidenceResult.score,
    length: lengthResult.score,
    voice: voiceResult.score,
    risk: riskResult.score,
  };

  const readiness = computeReadinessScore(componentScores);
  currentTime = Date.now();
  addTiming('scoreReview', 'completed');

  const nextBestEdit = determineNextBestEdit(requirementResult, fitResult, riskResult, evidenceResult);
  currentTime = Date.now();
  addTiming('nextBestEdit', 'completed');

  const fixPlan = buildFixPlanFromResults(requirementResult, fitResult, riskResult, evidenceResult);
  currentTime = Date.now();
  addTiming('fixPlan', 'completed');

  const wordCountResult = wordCount(input.answer);
  const speakingTime = estimateSpeakingTime(input.answer);
  const deadlineMode = detectDeadlineUrgency(input.opportunity.deadline);
  currentTime = Date.now();
  addTiming('improveAnswer', 'completed');

  const applicationPacket = buildApplicationPacket(
    input.opportunity.programName || 'Untitled',
    input.answer,
    { overallScore: readiness.totalScore, status: readiness.status, requirementCoverage: requirementResult.details.coverage.items.map(i => ({ requirement: i.requirement, status: i.status })), nextBestEdit },
    input.opportunity.applicationType || 'Other'
  );
  currentTime = Date.now();
  addTiming('buildPacket', 'completed');

  addTiming('total', 'completed');

  const stagesCompleted = timings.map(t => t.stage);

  return {
    resultMode: 'ai_full',
    inputHash: '',
    score: readiness.totalScore,
    status: readiness.status,
    componentScores,
    stagesCompleted,
    timings,
    nextBestEdit,
    requirementCoverage: requirementResult.details.coverage.items.map(i => ({ requirement: i.requirement, status: i.status })),
    fixPlan,
    applicationPacket,
    deadlineMode,
  };
}

function trackTiming(stage: string, startTime: number, status: StageTiming['status'], error?: string): StageTiming {
  return { stage, startTime, endTime: Date.now(), durationMs: Date.now() - startTime, status, error };
}

function parseBrief(brief: string): { explicitRequirements: string[]; requiredLinks: { type: string; required: boolean }[] } {
  const explicitRequirements: string[] = [];
  const requiredLinks: { type: string; required: boolean }[] = [];

  if (/link|url|website|portfolio/i.test(brief)) {
    requiredLinks.push({ type: 'publicLink', required: true });
  }
  if (/video|demo/i.test(brief)) {
    requiredLinks.push({ type: 'video', required: true });
  }
  if (/github|code/i.test(brief)) {
    requiredLinks.push({ type: 'github', required: true });
  }

  if (/tell.*yourself|introduce/i.test(brief)) explicitRequirements.push('Tell us about yourself');
  if (/what.*building|what.*working/i.test(brief)) explicitRequirements.push('What are you building');
  if (/why.*fit/i.test(brief)) explicitRequirements.push('Why this fits you');
  if (/60.*90.*second/i.test(brief)) explicitRequirements.push('60-90 second video');

  return { explicitRequirements, requiredLinks };
}

function buildEvidenceBankForWorkflow(memory: WorkflowInput['memory'], answer: string, briefAnalysis: ReturnType<typeof parseBrief>) {
  return { projects: [], achievements: [], links: [], personalAngles: [], reusableSnippets: [], missingEvidence: [] };
}

function determineNextBestEdit(
  req: ReturnType<typeof RequirementReviewer>,
  fit: ReturnType<typeof FitReviewer>,
  risk: ReturnType<typeof RiskReviewer>,
  evidence: ReturnType<typeof EvidenceReviewer>
) {
  if (req.details.linkStatus.missing.length > 0) {
    return { action: 'Add required public link', suggestedText: 'Add your portfolio or project link' };
  }
  if (req.details.coverage.missing > 0) {
    return { action: 'Address missing requirements', suggestedText: req.details.coverage.items.find(i => i.status === 'missing')?.whatToAdd || 'Add missing content' };
  }
  if (fit.findings.some(f => f.includes('Generic'))) {
    return { action: 'Replace generic fit phrasing', suggestedText: 'Connect your current work to the opportunity' };
  }
  return { action: 'Add project evidence', suggestedText: 'Explain your projects with one-liners' };
}

function buildFixPlanFromResults(
  req: ReturnType<typeof RequirementReviewer>,
  fit: ReturnType<typeof FitReviewer>,
  risk: ReturnType<typeof RiskReviewer>,
  evidence: ReturnType<typeof EvidenceReviewer>
) {
  const steps: { step: number; title: string; effort: string; impact: string }[] = [];
  let step = 1;

  if (req.details.linkStatus.missing.length > 0) {
    steps.push({ step: step++, title: 'Add required link', effort: '1 min', impact: 'high' });
  }
  if (req.details.coverage.missing > 0) {
    const firstMissing = req.details.coverage.items.find(i => i.status === 'missing');
    if (firstMissing) {
      steps.push({ step: step++, title: `Cover: ${firstMissing.requirement}`, effort: '2 min', impact: 'high' });
    }
  }
  if (fit.findings.some(f => f.includes('Generic'))) {
    steps.push({ step: step++, title: 'Replace generic phrasing', effort: '2 min', impact: 'medium' });
  }
  if (evidence.findings.some(f => f.includes('without explanation'))) {
    steps.push({ step: step++, title: 'Explain mentioned projects', effort: '1 min', impact: 'high' });
  }

  return steps.slice(0, 5);
}