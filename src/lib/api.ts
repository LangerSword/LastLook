import type { BriefAnalysis, GeneratedAnswer, CheckResult, ApplicationMemory, ApplicationType, ReviewStrictness } from './types';
import {
  normalizeAnalyzeResponse,
  normalizeGenerateResponse,
  normalizeCheckResponse,
} from './parseAiResponse';
import { supabase, isSupabaseConfigured } from './supabase';
import { buildFullReviewPacket } from './reviewEngine';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE = `${API_BASE_URL}/api`;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (supabase && isSupabaseConfigured) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
}

function isLocalDemoMode(): boolean {
  if (!isSupabaseConfigured) {
    return true;
  }
  return localStorage.getItem('lastlook_demo_mode') === 'true';
}

async function post(path: string, body: unknown): Promise<unknown> {
  const headers = await getAuthHeaders();

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new Error('Could not reach the AI backend. Run npm run pages:dev for full local testing.');
  }

  if (!res.ok) {
    if (res.status === 401) {
      let errMsg = 'Sign in to run a real LastLook review. You can still try the sample demo.';
      try {
        const parsed = await res.json();
        if (parsed.message) {
          errMsg = parsed.message;
        } else if (parsed.error) {
          errMsg = parsed.error === 'supabase_server_not_configured' 
            ? 'Server auth is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY to your environment.'
            : parsed.error;
        }
      } catch {}
      
      const fullError = `auth_required: ${errMsg}`;
      if (import.meta.env.DEV && supabase && isSupabaseConfigured) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data.session?.access_token) {
            throw new Error(`${fullError}\n\nDebug hint: Your session exists, but the API did not receive it. Check Authorization header in src/lib/api.ts.`);
          }
        } catch {}
      }
      throw new Error(fullError);
    }
    if (res.status === 429) {
      const errMsg = await res.json().catch(() => ({}));
      throw new Error(`daily_limit_reached: ${errMsg.message || 'You’ve used today’s free review limit.'}`);
    }
    if (res.status === 502 || res.status === 504 || res.status === 404) {
      throw new Error('Could not reach the AI backend. Run npm run pages:dev for full local testing.');
    }

    let errMsg = await res.text().catch(() => 'Unknown error');
    try {
      const parsed = JSON.parse(errMsg);
      if (parsed.error) errMsg = parsed.error;
    } catch {
      // not json
    }

    throw new Error(`Backend reachable, but analysis failed: ${errMsg}`);
  }

  // Use text instead of JSON in case backend returns malformed JSON or raw strings
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function analyzeBrief(brief: string): Promise<BriefAnalysis> {
  if (isLocalDemoMode()) {
    return normalizeAnalyzeResponse({
      explicitRequirements: [
        '60-90 second intro video',
        'Tell us about yourself and what you are building right now',
        'Explain why this fellowship feels like a good fit',
        'Ensure the link is publicly accessible'
      ],
      impliedCriteria: ['Clarity of communication', 'Builder identity', 'Specific fit', 'Public link accessibility'],
      submissionRisks: ['Video too short for the time window', 'Project names without explanations', 'Missing public link'],
      suggestedAngles: ['Lead with a concrete builder identity', 'Explain each project in one line', 'Connect your work to the fellowship'],
      summary: 'This brief asks for a short public intro video that should sound specific, human, and easy to evaluate.'
    });
  }
  const data = await post('/analyze', { brief });
  return normalizeAnalyzeResponse(data);
}

export async function generateAnswer(params: {
  memory: unknown;
  briefAnalysis: unknown;
  question: string;
  tone: string;
  targetLength: string;
  applicationType?: string;
  reviewStrictness?: string;
}): Promise<GeneratedAnswer> {
  if (isLocalDemoMode()) {
    return normalizeGenerateResponse({
      draft: "I’m Lakshaya, and I build practical AI and systems tools. Right now I’m working on Regenera, which reconstructs deleted data from traces, and AgentMesh, which helps AI agents use APIs and MCPs without brittle browser automation. This fellowship feels useful because I want sharper feedback from people who are already shipping ambitious products, and I want to keep building tools that solve real problems.",
      whyItWorks: ['Opens with a clear builder identity', 'Explains the named projects', 'Connects the work to the fellowship'],
      customize: ['Add the public link', 'Trim or expand to match the target time window']
    });
  }
  const data = await post('/generate', params);
  return normalizeGenerateResponse(data);
}

export async function checkAnswer(params: {
  briefAnalysis: unknown;
  question: string;
  finalAnswer: string;
  target: string;
  wordCount: number;
  speakingTimeSeconds: number;
  applicationType?: string;
  reviewStrictness?: string;
}): Promise<CheckResult> {
  if (isLocalDemoMode()) {
    return normalizeCheckResponse({
      score: 44,
      status: 'Not ready',
      criticalIssues: ['Missing the required public link', 'Regenera and AgentMesh are named but not explained'],
      warnings: ['The fit line is generic instead of specific to this fellowship', 'The answer is too short for 60-90 seconds'],
      strongPoints: ['Builder identity is clear', 'The answer references real projects'],
      fixOrder: ['Add the public link', 'Explain AgentMesh in one sentence', 'Add one sentence showing why this fellowship fits the current work']
    }, params.wordCount, params.speakingTimeSeconds);
  }
  const data = await post('/check', params);
  return normalizeCheckResponse(data, params.wordCount, params.speakingTimeSeconds);
}

interface StreamEvent {
  type: string;
  stage?: string;
  durationMs?: number;
  summary?: string;
  error?: string;
  resultMode?: string;
  briefAnalysis?: unknown;
  readinessReport?: unknown;
  reviewerPanel?: unknown;
  nextBestEdit?: unknown;
  fixPlan?: unknown;
  improvedApplication?: unknown;
  debug?: unknown;
}

export async function runStreamingReview(
  params: Record<string, unknown>,
  onStage?: (event: StreamEvent) => void
): Promise<FullRunResult> {
  const headers = await getAuthHeaders();

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
  } catch (err) {
    throw new Error('Could not reach the AI backend. Run npm run pages:dev for full local testing.');
  }

  if (!res.ok) {
    throw new Error(`Backend error: ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  let briefAnalysisData: unknown = null;
  let readinessReportData: unknown = null;
  let reviewerPanelData: unknown = null;
  let nextBestEditData: unknown = null;
  let fixPlanData: unknown = null;
  let improvedApplicationData: unknown = null;
  let debugData: unknown = null;
  let finalResultMode = 'unknown';

  const stagesCompleted: string[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event: StreamEvent = JSON.parse(line);

        if (event.type === 'stream_started') {
          finalResultMode = event.resultMode || 'unknown';
          onStage?.(event);
        } else if (event.type === 'stage_started' && event.stage) {
          onStage?.(event);
        } else if (event.type === 'stage_completed' && event.stage) {
          stagesCompleted.push(event.stage);
          onStage?.(event);
        } else if (event.type === 'stage_failed' && event.stage) {
          stagesCompleted.push(`${event.stage}_failed`);
          onStage?.(event);
        } else if (event.type === 'final_result') {
          if (event.briefAnalysis) briefAnalysisData = event.briefAnalysis;
          if (event.readinessReport) readinessReportData = event.readinessReport;
          if (event.reviewerPanel) reviewerPanelData = event.reviewerPanel;
          if (event.nextBestEdit) nextBestEditData = event.nextBestEdit;
          if (event.fixPlan) fixPlanData = event.fixPlan;
          if (event.improvedApplication) improvedApplicationData = event.improvedApplication;
          if (event.debug) debugData = event.debug;
          if (event.resultMode) finalResultMode = event.resultMode;
          onStage?.(event);
        } else if (event.type === 'error') {
          throw new Error(`Stream error: ${event.error}`);
        }
      } catch (e) {
        // skip malformed lines
      }
    }
  }

  const debugInfo = (debugData || {}) as Record<string, unknown>;

  return {
    briefAnalysis: briefAnalysisData ? normalizeAnalyzeResponse(briefAnalysisData) : {
      explicitRequirements: [], impliedCriteria: [], submissionRisks: [], suggestedAngles: [], summary: '',
    },
    generatedAnswer: improvedApplicationData ? normalizeGenerateResponse({
      draft: (improvedApplicationData as { improvedAnswer?: string; originalAnswer?: string }).originalAnswer || '',
      whyItWorks: [], customize: [],
    }) : { draft: '', whyItWorks: [], customize: [] },
    readinessReport: readinessReportData ? normalizeCheckResponse(
      readinessReportData as Parameters<typeof normalizeCheckResponse>[0],
      150, 60
    ) : {
      score: 0, status: 'Unknown', criticalIssues: [], warnings: [], strongPoints: [], fixOrder: [],
      wordCount: 0, speakingTimeSeconds: 0,
    },
    debug: {
      inputHash: (params.inputHash as string) || '',
      cacheHit: false,
      providerUsed: (debugInfo.providerUsed as string) || finalResultMode,
      stagesCompleted,
      timings: [],
      totalDurationMs: (debugInfo.totalDurationMs as number) || 0,
    },
    reviewerPanel: reviewerPanelData,
    nextBestEdit: nextBestEditData,
    fixPlan: fixPlanData,
    improvedApplication: improvedApplicationData,
    requirementCoverage: [],
    debugFull: debugData,
  };
}

export interface HealthResponse {
  ok: boolean;
  providers: Record<string, unknown>;
  supabase?: {
    frontendExpected: boolean;
    server: string;
  };
  authRequiredForAi?: boolean;
  limits?: Record<string, unknown>;
}

export async function getHealth(): Promise<HealthResponse> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) {
      if (res.status === 502 || res.status === 504 || res.status === 404) {
        throw new Error('Could not reach the AI backend. Run npm run pages:dev for full local testing.');
      }
      return { ok: false, providers: {} };
    }
    return res.json();
  } catch (err) {
    throw new Error('Could not reach the AI backend. Run npm run pages:dev for full local testing.');
  }
}

export interface FullRunResult {
  briefAnalysis: BriefAnalysis;
  generatedAnswer: GeneratedAnswer;
  readinessReport: CheckResult;
  debug?: {
    inputHash: string;
    cacheHit: boolean;
    providerUsed?: string;
    fallbackUsed?: boolean;
    isRealAI?: boolean;
    temperature?: number;
    topP?: number;
    providerResponseTimeMs?: number;
    totalDurationMs?: number;
    apiDurationMs?: number;
    stagesCompleted?: string[];
    timings?: {
      stage: string;
      startTime: number;
      endTime: number;
      durationMs: number;
      status: string;
      error?: string;
    }[];
  };
  reviewerPanel?: unknown;
  nextBestEdit?: unknown;
  fixPlan?: unknown;
  improvedApplication?: unknown;
  requirementCoverage?: unknown;
  debugFull?: unknown;
}

export async function runFullLastLook(
  params: {
    brief: string;
    memory: unknown;
    question: string;
    tone: string;
    targetLength: string;
    finalAnswer?: string;
    target?: string;
    applicationType?: string;
    reviewStrictness?: string;
    programName?: string;
    deadline?: string;
    forceRerun?: boolean;
  },
  onProgress?: (step: number) => void
): Promise<FullRunResult> {
  const { hashReviewInput } = await import('../engine/hash/hashReviewInput');
  const { getCachedReview, saveCachedReview, hasCachedReview } = await import('./reviewCache');

  const inputForHash = {
    opportunity: {
      programName: params.programName,
      applicationType: params.applicationType,
      deadline: params.deadline,
      targetFormat: params.target || 'written',
      strictness: params.reviewStrictness || 'Balanced',
    },
    brief: params.brief,
    answer: params.finalAnswer || '',
    targetLength: params.targetLength,
    memory: params.memory as ApplicationMemory | null,
  };

  const inputHash = await hashReviewInput(inputForHash);
  const cacheHit = !params.forceRerun && hasCachedReview(inputHash);

  if (cacheHit) {
    const cached = getCachedReview(inputHash);
    if (cached) {
      return {
        briefAnalysis: {
          explicitRequirements: cached.briefAnalysis?.explicitRequirements || [],
          impliedCriteria: cached.briefAnalysis?.hiddenRequirements || [],
          submissionRisks: cached.briefAnalysis?.submissionRisks || [],
          suggestedAngles: [],
          summary: cached.briefAnalysis?.summary || '',
        },
        generatedAnswer: {
          draft: cached.improvedApplication?.originalAnswer || '',
          whyItWorks: [],
          customize: [],
        },
        readinessReport: {
          score: cached.readinessReport?.score || cached.applicationPacket?.overallScore || 0,
          status: cached.readinessReport?.status || cached.applicationPacket?.status || 'Unknown',
          criticalIssues: cached.readinessReport?.criticalIssues || [],
          warnings: cached.readinessReport?.warnings || [],
          strongPoints: cached.readinessReport?.strongPoints || [],
          fixOrder: cached.readinessReport?.fixOrder || [],
          wordCount: cached.readinessReport?.wordCount || 0,
          speakingTimeSeconds: cached.readinessReport?.speakingTimeSeconds || 0,
        },
        debug: {
          inputHash,
          cacheHit: true,
          providerUsed: 'cache',
        },
      };
    }
  }

  if (isLocalDemoMode()) {
    const startTime = Date.now();

    if (onProgress) onProgress(1);
    const stage1Start = Date.now();
    const briefAnalysis = await analyzeBrief(params.brief);
    const stage1Duration = Date.now() - stage1Start;

    if (onProgress) onProgress(2);
    const stage2Start = Date.now();
    const generatedAnswer = await generateAnswer({ ...params, briefAnalysis });
    const stage2Duration = Date.now() - stage2Start;

    if (onProgress) onProgress(3);
    const stage3Start = Date.now();
    const finalAnswerText = params.finalAnswer || generatedAnswer.draft;
    const wordCount = finalAnswerText.split(/\s+/).filter(Boolean).length;
    const speakingTimeSeconds = Math.round((wordCount / 145) * 60);

    const packet = buildFullReviewPacket({
      briefAnalysis,
      answer: finalAnswerText,
      question: params.question,
      memory: params.memory as ApplicationMemory | null | undefined,
      applicationType: (params.applicationType as ApplicationType) || 'Fellowship',
      reviewStrictness: (params.reviewStrictness as ReviewStrictness) || 'Balanced',
      programName: params.programName,
      deadline: params.deadline,
      generatedAnswer,
      targetLength: params.targetLength,
    });
    const stage3Duration = Date.now() - stage3Start;
    const totalDuration = Date.now() - startTime;

    const readinessReport: CheckResult = {
      ...packet.readinessReport,
      wordCount,
      speakingTimeSeconds,
    };

    saveCachedReview(inputHash, packet);

    if (onProgress) onProgress(4);

    console.warn('[runFullLastLook] WARNING: Running in LOCAL DEMO mode (no real AI). Set Supabase env vars for real AI.');

    return {
      briefAnalysis,
      generatedAnswer,
      readinessReport,
      debug: {
        inputHash,
        cacheHit: false,
        providerUsed: 'demo',
        fallbackUsed: true,
        isRealAI: false,
        temperature: 0,
        topP: 1,
        stagesCompleted: ['parseBrief', 'generateAnswer', 'buildFullReviewPacket'],
        timings: [
          { stage: 'parseBrief', startTime: stage1Start, endTime: stage1Start + stage1Duration, durationMs: stage1Duration, status: 'completed' },
          { stage: 'generateAnswer', startTime: stage2Start, endTime: stage2Start + stage2Duration, durationMs: stage2Duration, status: 'completed' },
          { stage: 'buildFullReviewPacket', startTime: stage3Start, endTime: stage3Start + stage3Duration, durationMs: stage3Duration, status: 'completed' },
        ],
        totalDurationMs: totalDuration,
        apiDurationMs: totalDuration,
      },
    };
  }

  if (onProgress) onProgress(1);
  const startTime = Date.now();

  const stagesMap: Record<string, number> = {
    normalizeInput: 0,
    parseBriefAgent: 1,
    buildEvidenceBankTool: 1,
    deterministicChecksTool: 1,
    requirementCoverageTool: 2,
    requirementReviewerAgent: 3,
    fitReviewerAgent: 3,
    clarityReviewerAgent: 3,
    evidenceReviewerAgent: 3,
    lengthReviewerAgent: 3,
    voiceReviewerAgent: 3,
    riskReviewerAgent: 3,
    scoringTool: 4,
    nextBestEditAgent: 4,
    fixPlanAgent: 4,
    improvedAnswerAgent: 5,
    applicationPacketTool: 5,
    persistReviewSession: 6,
    final_result: 6,
  };

  const apiParams = {
    ...params,
    inputHash,
  };

  const data = await post('/full', apiParams) as any;
  const apiDuration = Date.now() - startTime;

  const debugInfo = data.debug || {};
  const resultMode = debugInfo.resultMode || 'unknown';
  const stagesCompleted = debugInfo.stagesCompleted || [];
  const stagesMapLocal: Record<string, number> = {
    normalizeInput: 0, parseBriefAgent: 1, buildEvidenceBankTool: 1, deterministicChecksTool: 1,
    requirementCoverageTool: 2, requirementReviewerAgent: 3, fitReviewerAgent: 3, clarityReviewerAgent: 3,
    evidenceReviewerAgent: 3, lengthReviewerAgent: 3, voiceReviewerAgent: 3, riskReviewerAgent: 3,
    scoringTool: 4, nextBestEditAgent: 4, fixPlanAgent: 4, improvedAnswerAgent: 5, applicationPacketTool: 5,
    persistReviewSession: 6, final_result: 6,
  };
  const maxStep = stagesCompleted.reduce((max: number, s: string) => Math.max(max, stagesMapLocal[s] ?? 0), 0);
  if (onProgress) onProgress(Math.min(maxStep + 2, 7));

  const readinessReport = normalizeCheckResponse(data.readinessReport, data.wordCount || 150, data.speakingTimeSeconds || 60);

  if (data.briefAnalysis && data.readinessReport && resultMode !== 'mock_demo' && resultMode !== 'deterministic_fallback') {
    const packet = {
      reviewId: data.reviewId || resultMode,
      programName: data.programName || '',
      applicationType: (data.applicationType || 'Fellowship') as ApplicationType,
      briefAnalysis: data.briefAnalysis,
      reviewerPanel: data.reviewerPanel || {},
      readinessReport,
      nextBestEdit: data.nextBestEdit || {},
      fixPlan: data.fixPlan || [],
      improvedApplication: data.improvedApplication || { originalAnswer: '', improvedAnswer: '', whatChanged: [], whyItIsBetter: [], wordCount: 0, speakingTimeSeconds: 0 },
      requirementCoverage: data.requirementCoverage || [],
      evidenceBank: data.evidenceBank || {},
      deadlineMode: data.deadlineMode || { mode: 'careful' as const, timeRemaining: 'N/A', recommendation: '' },
      applicationPacket: data.applicationPacket || { programName: '', applicationType: 'Fellowship' as ApplicationType, overallScore: 0, status: '', nextBestEdit: '', finalAnswers: [], requirementChecklist: [], requiredLinks: [], fixPlan: [], submissionChecklist: [], exportMarkdown: '' },
    };
    try { saveCachedReview(inputHash, packet as any); } catch {}
  }

  const isFallback = debugInfo.fallbackUsed === true || debugInfo.providerUsed === 'mock';
  const isRealAI = debugInfo.providerUsed && !['mock', 'demo', 'cache'].includes(debugInfo.providerUsed);

  if (isFallback) {
    console.warn('[runFullLastLook] WARNING: Using fallback/deterministic mode. Real AI may have failed.');
  }

  return {
    briefAnalysis: normalizeAnalyzeResponse(data.briefAnalysis),
    generatedAnswer: normalizeGenerateResponse(data.improvedApplication?.originalAnswer ? { draft: data.improvedApplication.originalAnswer, whyItWorks: [], customize: [] } : data.generatedAnswer || {}),
    readinessReport,
    debug: {
      inputHash,
      cacheHit: false,
      providerUsed: debugInfo.providerUsed || 'unknown',
      fallbackUsed: isFallback,
      isRealAI,
      stagesCompleted,
      timings: debugInfo.timings || [],
      totalDurationMs: debugInfo.totalDurationMs || apiDuration,
      apiDurationMs: apiDuration,
    },
  };
}
