import type {
  WorkflowInput,
  WorkflowOutput,
  FullReviewResult,
  StageTiming,
  BriefAnalysis,
  EvidenceBank,
  DeterministicChecks,
  RequirementCoverageItem,
  ReviewerResult,
  NextBestEdit,
  FixPlanItem,
  ImprovedApplication,
  ApplicationMemory,
  ApplicationMemorySchema,
} from '../schemas';

import { evidenceBankTool, deterministicChecksTool, requirementCoverageTool, scoringTool, applicationPacketTool } from '../tools';
import { genericPhraseDetectorTool } from '../tools/genericPhraseDetector';
import { projectExplanationCheckTool } from '../tools/projectExplanationCheck';
import { parseBriefAgent } from '../agents/parseBriefAgent';
import { requirementReviewerAgent } from '../agents/requirementReviewerAgent';
import { fitReviewerAgent } from '../agents/fitReviewerAgent';
import { clarityReviewerAgent } from '../agents/clarityReviewerAgent';
import { evidenceReviewerAgent } from '../agents/evidenceReviewerAgent';
import { lengthReviewerAgent } from '../agents/lengthReviewerAgent';
import { voiceReviewerAgent } from '../agents/voiceReviewerAgent';
import { riskReviewerAgent } from '../agents/riskReviewerAgent';
import { nextBestEditAgent } from '../agents/nextBestEditAgent';
import { fixPlanAgent } from '../agents/fixPlanAgent';
import { improvedAnswerAgent } from '../agents/improvedAnswerAgent';
import type { LLMConfig } from '../lib/llm';

export type ProgressCallback = (event: WorkflowEvent) => void;

export interface WorkflowEvent {
  type: 'stage_started' | 'stage_completed' | 'stage_failed' | 'stage_skipped';
  stage: string;
  durationMs?: number;
  summary?: string;
  error?: string;
}

interface StageResult {
  stage: string;
  durationMs: number;
  status: 'completed' | 'failed' | 'fallback' | 'skipped';
  error?: string;
}

function trackTiming(stage: string, startTime: number, status: StageResult['status'], error?: string): StageTiming {
  return {
    stage,
    startTime,
    endTime: Date.now(),
    durationMs: Date.now() - startTime,
    status,
    error,
  };
}

export async function runFullReviewWorkflow(
  input: WorkflowInput,
  llmConfig: LLMConfig,
  onProgress?: ProgressCallback
): Promise<WorkflowOutput> {
  const overallStart = Date.now();
  const timings: StageTiming[] = [];
  const stagesCompleted: string[] = [];
  let stagesFailed: string[] = [];
  let fallbackUsed = false;
  let providerUsed = 'none';
  const results: Partial<Record<string, unknown>> = {};

  function emit(type: WorkflowEvent['type'], stage: string, extra?: Partial<WorkflowEvent>) {
    onProgress?.({ type, stage, ...extra });
  }

  function addTiming(stage: string, status: StageResult['status'], error?: string) {
    const t = trackTiming(stage, overallStart, status, error);
    timings.push(t);
    if (status === 'completed') stagesCompleted.push(stage);
    if (status === 'failed') stagesFailed.push(stage);
    if (status === 'fallback') fallbackUsed = true;
  }

  emit('stage_started', 'normalizeInput');
  addTiming('normalizeInput', 'completed');

  emit('stage_started', 'parseBriefAgent');
  let briefAnalysis: BriefAnalysis;
  try {
    const parseResult = await parseBriefAgent({ brief: input.brief, question: input.question }, llmConfig);
    briefAnalysis = parseResult.briefAnalysis;
    if (parseResult.provider !== 'mock') providerUsed = parseResult.provider;
    addTiming('parseBriefAgent', parseResult.success ? 'completed' : 'fallback', parseResult.error);
    emit('stage_completed', 'parseBriefAgent', { durationMs: parseResult.durationMs, summary: `${briefAnalysis.explicitRequirements.length} requirements found` });
  } catch (err) {
    briefAnalysis = buildFallbackBrief(input.brief);
    addTiming('parseBriefAgent', 'fallback', String(err));
    fallbackUsed = true;
    emit('stage_completed', 'parseBriefAgent', { durationMs: 0, summary: 'Fallback used' });
  }
  results.briefAnalysis = briefAnalysis;

  emit('stage_started', 'buildEvidenceBankTool');
  const evidenceBank = evidenceBankTool({ memory: input.memory, answer: input.answer, briefAnalysis });
  addTiming('buildEvidenceBankTool', 'completed');
  emit('stage_completed', 'buildEvidenceBankTool', { durationMs: 0, summary: `${evidenceBank.projects.length} projects, ${evidenceBank.achievements.length} achievements` });
  results.evidenceBank = evidenceBank;

  emit('stage_started', 'deterministicChecksTool');
  const deterministicChecks = deterministicChecksTool({ briefAnalysis, answer: input.answer, memory: input.memory });
  addTiming('deterministicChecksTool', 'completed');
  emit('stage_completed', 'deterministicChecksTool', { durationMs: 0, summary: `${deterministicChecks.wordCount} words, ${deterministicChecks.links.urlsFound.length} links found` });
  results.deterministicChecks = deterministicChecks;

  emit('stage_started', 'requirementCoverageTool');
  const requirementCoverage = requirementCoverageTool({
    briefAnalysis,
    answer: input.answer,
    evidenceBank,
    deterministicChecks,
  });
  addTiming('requirementCoverageTool', 'completed');
  emit('stage_completed', 'requirementCoverageTool', { durationMs: 0, summary: `${requirementCoverage.items.filter((i) => i.status === 'covered').length}/${requirementCoverage.items.length} covered` });
  results.requirementCoverage = requirementCoverage.items;

  emit('stage_started', 'requirementReviewerAgent');
  let reqResult: ReviewerResult;
  try {
    const r = await requirementReviewerAgent(
      { briefAnalysis, requirementCoverage: requirementCoverage.items, deterministicChecks, answer: input.answer },
      llmConfig
    );
    reqResult = r.result;
    if (r.provider !== 'mock' && r.provider !== 'none') providerUsed = r.provider;
    addTiming('requirementReviewerAgent', r.success ? 'completed' : 'fallback', r.error);
    emit('stage_completed', 'requirementReviewerAgent', { durationMs: r.durationMs, summary: `Score: ${reqResult.score}` });
  } catch (err) {
    reqResult = { score: 50, verdict: 'Failed', specificFindings: [], fixes: [] };
    addTiming('requirementReviewerAgent', 'fallback', String(err));
    fallbackUsed = true;
    emit('stage_completed', 'requirementReviewerAgent', { durationMs: 0 });
  }
  results.reqResult = reqResult;

  emit('stage_started', 'fitReviewerAgent');
  let fitResult: ReviewerResult;
  try {
    const r = await fitReviewerAgent(
      { answer: input.answer, memory: input.memory, applicationType: input.applicationType, briefAnalysis, evidenceBank },
      llmConfig
    );
    fitResult = r.result;
    addTiming('fitReviewerAgent', r.success ? 'completed' : 'fallback', r.error);
    emit('stage_completed', 'fitReviewerAgent', { durationMs: r.durationMs, summary: `Score: ${fitResult.score}` });
  } catch (err) {
    fitResult = { score: 50, verdict: 'Failed', specificFindings: [], fixes: [] };
    addTiming('fitReviewerAgent', 'fallback', String(err));
    fallbackUsed = true;
    emit('stage_completed', 'fitReviewerAgent', { durationMs: 0 });
  }
  results.fitResult = fitResult;

  emit('stage_started', 'clarityReviewerAgent');
  let clarityResult: ReviewerResult;
  try {
    const r = await clarityReviewerAgent(
      { answer: input.answer, memoryProjects: input.memory?.projects || [], projectWarnings: deterministicChecks.projectExplanationWarnings },
      llmConfig
    );
    clarityResult = r.result;
    addTiming('clarityReviewerAgent', r.success ? 'completed' : 'fallback', r.error);
    emit('stage_completed', 'clarityReviewerAgent', { durationMs: r.durationMs, summary: `Score: ${clarityResult.score}` });
  } catch (err) {
    clarityResult = { score: 60, verdict: 'Failed', specificFindings: [], fixes: [] };
    addTiming('clarityReviewerAgent', 'fallback', String(err));
    fallbackUsed = true;
    emit('stage_completed', 'clarityReviewerAgent', { durationMs: 0 });
  }
  results.clarityResult = clarityResult;

  emit('stage_started', 'evidenceReviewerAgent');
  let evidenceResult: ReviewerResult;
  try {
    const r = await evidenceReviewerAgent({ answer: input.answer, memory: input.memory, evidenceBank }, llmConfig);
    evidenceResult = r.result;
    addTiming('evidenceReviewerAgent', r.success ? 'completed' : 'fallback', r.error);
    emit('stage_completed', 'evidenceReviewerAgent', { durationMs: r.durationMs, summary: `Score: ${evidenceResult.score}` });
  } catch (err) {
    evidenceResult = { score: 60, verdict: 'Failed', specificFindings: [], fixes: [] };
    addTiming('evidenceReviewerAgent', 'fallback', String(err));
    fallbackUsed = true;
    emit('stage_completed', 'evidenceReviewerAgent', { durationMs: 0 });
  }
  results.evidenceResult = evidenceResult;

  emit('stage_started', 'lengthReviewerAgent');
  let lengthResult: ReviewerResult;
  try {
    const r = await lengthReviewerAgent(
      { answer: input.answer, targetLength: input.targetLength, briefRequirements: briefAnalysis.explicitRequirements },
      llmConfig
    );
    lengthResult = r.result;
    addTiming('lengthReviewerAgent', r.success ? 'completed' : 'fallback', r.error);
    emit('stage_completed', 'lengthReviewerAgent', { durationMs: r.durationMs, summary: `Score: ${lengthResult.score}` });
  } catch (err) {
    lengthResult = { score: 50, verdict: 'Failed', specificFindings: [], fixes: [] };
    addTiming('lengthReviewerAgent', 'fallback', String(err));
    fallbackUsed = true;
    emit('stage_completed', 'lengthReviewerAgent', { durationMs: 0 });
  }
  results.lengthResult = lengthResult;

  emit('stage_started', 'voiceReviewerAgent');
  let voiceResult: ReviewerResult;
  try {
    const r = await voiceReviewerAgent(
      { answer: input.answer, memory: input.memory, genericPhrases: deterministicChecks.genericPhrases },
      llmConfig
    );
    voiceResult = r.result;
    addTiming('voiceReviewerAgent', r.success ? 'completed' : 'fallback', r.error);
    emit('stage_completed', 'voiceReviewerAgent', { durationMs: r.durationMs, summary: `Score: ${voiceResult.score}` });
  } catch (err) {
    voiceResult = { score: 65, verdict: 'Failed', specificFindings: [], fixes: [] };
    addTiming('voiceReviewerAgent', 'fallback', String(err));
    fallbackUsed = true;
    emit('stage_completed', 'voiceReviewerAgent', { durationMs: 0 });
  }
  results.voiceResult = voiceResult;

  emit('stage_started', 'riskReviewerAgent');
  let riskResult: ReviewerResult;
  try {
    const r = await riskReviewerAgent({ answer: input.answer, briefAnalysis, memory: input.memory }, llmConfig);
    riskResult = r.result;
    addTiming('riskReviewerAgent', r.success ? 'completed' : 'fallback', r.error);
    emit('stage_completed', 'riskReviewerAgent', { durationMs: r.durationMs, summary: `Score: ${riskResult.score}` });
  } catch (err) {
    riskResult = { score: 40, verdict: 'Failed', specificFindings: [], fixes: [] };
    addTiming('riskReviewerAgent', 'fallback', String(err));
    fallbackUsed = true;
    emit('stage_completed', 'riskReviewerAgent', { durationMs: 0 });
  }
  results.riskResult = riskResult;

  const reviewerPanel = {
    requirements: reqResult,
    fit: fitResult,
    clarity: clarityResult,
    evidence: evidenceResult,
    length: lengthResult,
    voice: voiceResult,
    risk: riskResult,
  };
  results.reviewerPanel = reviewerPanel;

  emit('stage_started', 'scoringTool');
  const scoring = scoringTool({
    requirementCoverage: requirementCoverage.items,
    reviewerPanel,
    deterministicChecks,
  });
  addTiming('scoringTool', 'completed');
  emit('stage_completed', 'scoringTool', { durationMs: 0, summary: `Score: ${scoring.score}, Status: ${scoring.status}` });
  results.scoring = scoring;

  emit('stage_started', 'nextBestEditAgent');
  let nextBestEdit: NextBestEdit;
  try {
    const r = await nextBestEditAgent(
      {
        requirementCoverage: requirementCoverage.items,
        reviewerPanel,
        genericPhrases: deterministicChecks.genericPhrases,
        projectWarnings: deterministicChecks.projectExplanationWarnings,
        deterministicChecks,
      },
      llmConfig
    );
    nextBestEdit = r.result;
    addTiming('nextBestEditAgent', r.success ? 'completed' : 'fallback', r.error);
    emit('stage_completed', 'nextBestEditAgent', { durationMs: r.durationMs, summary: nextBestEdit.title });
  } catch (err) {
    nextBestEdit = { title: 'Tighten the opening', reason: 'High-impact fix', suggestedText: 'Lead with who you are and what you build' };
    addTiming('nextBestEditAgent', 'fallback', String(err));
    fallbackUsed = true;
    emit('stage_completed', 'nextBestEditAgent', { durationMs: 0 });
  }
  results.nextBestEdit = nextBestEdit;

  emit('stage_started', 'fixPlanAgent');
  let fixPlan: FixPlanItem[];
  try {
    const r = await fixPlanAgent(
      {
        requirementCoverage: requirementCoverage.items,
        reviewerPanel,
        genericPhrases: deterministicChecks.genericPhrases,
        projectWarnings: deterministicChecks.projectExplanationWarnings,
      },
      llmConfig
    );
    fixPlan = r.result;
    addTiming('fixPlanAgent', r.success ? 'completed' : 'fallback', r.error);
    emit('stage_completed', 'fixPlanAgent', { durationMs: r.durationMs, summary: `${fixPlan.length} fixes planned` });
  } catch (err) {
    fixPlan = buildFallbackFixPlan(requirementCoverage.items, deterministicChecks.genericPhrases);
    addTiming('fixPlanAgent', 'fallback', String(err));
    fallbackUsed = true;
    emit('stage_completed', 'fixPlanAgent', { durationMs: 0 });
  }
  results.fixPlan = fixPlan;

  emit('stage_started', 'improvedAnswerAgent');
  let improvedApplication: ImprovedApplication;
  try {
    const r = await improvedAnswerAgent(
      {
        originalAnswer: input.answer,
        briefAnalysis,
        memory: input.memory,
        reviewerPanel,
        deterministicChecks,
        targetLength: input.targetLength,
        genericPhrases: deterministicChecks.genericPhrases,
        projectWarnings: deterministicChecks.projectExplanationWarnings,
      },
      llmConfig
    );
    improvedApplication = r.result;
    addTiming('improvedAnswerAgent', r.success ? 'completed' : 'fallback', r.error);
    emit('stage_completed', 'improvedAnswerAgent', { durationMs: r.durationMs, summary: `${improvedApplication.wordCount} words` });
  } catch (err) {
    improvedApplication = { originalAnswer: input.answer, improvedAnswer: input.answer, whatChanged: [], whyItIsBetter: [], wordCount: deterministicChecks.wordCount, speakingTimeSeconds: deterministicChecks.speakingTimeSeconds };
    addTiming('improvedAnswerAgent', 'fallback', String(err));
    fallbackUsed = true;
    emit('stage_completed', 'improvedAnswerAgent', { durationMs: 0 });
  }
  results.improvedApplication = improvedApplication;

  emit('stage_started', 'applicationPacketTool');
  const applicationPacket = applicationPacketTool({
    reviewResult: {
      programName: input.programName || 'Untitled',
      applicationType: input.applicationType,
      overallScore: scoring.score,
      status: scoring.status,
      nextBestEdit,
      improvedApplication,
      requirementCoverage: requirementCoverage.items,
      fixPlan,
      reviewerPanel,
    },
  });
  addTiming('applicationPacketTool', 'completed');
  emit('stage_completed', 'applicationPacketTool', { durationMs: 0, summary: 'Packet built' });

  emit('stage_started', 'persistReviewSession');
  addTiming('persistReviewSession', 'completed');
  emit('stage_completed', 'persistReviewSession', { durationMs: 0, summary: 'Review session ready' });

  const aiStagesRequired = [
    'parseBriefAgent',
    'requirementReviewerAgent',
    'fitReviewerAgent',
    'clarityReviewerAgent',
    'evidenceReviewerAgent',
    'lengthReviewerAgent',
    'voiceReviewerAgent',
    'riskReviewerAgent',
    'improvedAnswerAgent',
  ];

  const aiStagesCompleted = aiStagesRequired.filter((s) => stagesCompleted.includes(s));
  const resultMode = stagesCompleted.length === 0
    ? 'deterministic_fallback'
    : fallbackUsed
      ? 'deterministic_fallback'
      : aiStagesCompleted.length >= aiStagesRequired.length
        ? 'ai_full'
        : 'deterministic_fallback';

  const finalResult: FullReviewResult = {
    reviewId: `review-${Date.now()}`,
    programName: input.programName || 'Untitled opportunity',
    applicationType: input.applicationType,
    briefAnalysis,
    evidenceBank,
    deterministicChecks,
    requirementCoverage: requirementCoverage.items,
    reviewerPanel,
    nextBestEdit,
    fixPlan,
    improvedApplication,
    debug: {
      engineVersion: 'v2-mastra',
      resultMode,
      cacheHit: false,
      providerUsed: providerUsed !== 'none' ? providerUsed : fallbackUsed ? 'deterministic' : 'none',
      fallbackUsed,
      stagesCompleted,
      timings,
      totalDurationMs: Date.now() - overallStart,
    },
  };

  addTiming('total', 'completed');
  emit('stage_completed', 'final_result', { durationMs: Date.now() - overallStart, summary: `Score: ${scoring.score}` });

  return {
    result: finalResult,
    debug: finalResult.debug,
  };
}

function buildFallbackBrief(brief: string): BriefAnalysis {
  const explicitRequirements: string[] = [];
  const impliedCriteria: string[] = [];
  const submissionRisks: string[] = [];

  if (/link|url|website|portfolio|github/i.test(brief)) {
    explicitRequirements.push('Public link must be included');
    submissionRisks.push('Missing required link can disqualify');
  }
  if (/video|pitch|60.*second|90.*second/i.test(brief)) {
    explicitRequirements.push('60-90 second video');
    impliedCriteria.push('Clear verbal delivery');
  }
  if (/why.*fit|fit.*fellowship|why.*this/i.test(brief)) {
    explicitRequirements.push('Explain why this opportunity fits you');
  }

  return { explicitRequirements, impliedCriteria, submissionRisks, suggestedAngles: [], summary: 'Analyzed: ' + brief.slice(0, 80) };
}

function buildFallbackFixPlan(coverage: RequirementCoverageItem[], genericPhrases: { phrase: string }[]): FixPlanItem[] {
  const steps: FixPlanItem[] = [];
  const missing = coverage.filter((i) => i.status === 'missing').slice(0, 2);

  for (let i = 0; i < missing.length; i++) {
    steps.push({ step: i + 1, title: `Cover: ${missing[i].requirement}`, why: missing[i].evidenceFound || 'Missing requirement', effort: '2 min', impact: 'high', suggestedText: missing[i].whatToAdd });
  }

  if (genericPhrases.length > 0) {
    steps.push({ step: steps.length + 1, title: `Replace generic: "${genericPhrases[0].phrase}"`, why: 'Generic phrases weaken fit', effort: '2 min', impact: 'medium', suggestedText: 'Replace with specific project detail' });
  }

  return steps;
}