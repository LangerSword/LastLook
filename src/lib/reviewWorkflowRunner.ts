import type {
  StageName,
  ResultMode,
  StageResponse,
  WorkflowContext,
} from '../../functions/lib/stages';

export interface StageState {
  stage: StageName;
  status: 'pending' | 'running' | 'done' | 'error';
  durationMs?: number;
  resultMode?: ResultMode;
  provider?: string;
  model?: string;
  error?: string;
  data?: unknown;
}

export interface WorkflowResult {
  inputHash: string;
  totalDurationMs: number;
  resultMode: ResultMode;
  stages: StageState[];
  final?: unknown;
  error?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE = `${API_BASE_URL}/api`;

const STAGE_ORDER: StageName[] = [
  'parse-brief',
  'evidence-bank',
  'deterministic-checks',
  'requirement-coverage',
  'reviewer-panel',
  'score',
  'readiness-report',
  'application-packet',
  'save',
];

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const stored = localStorage.getItem('sb-access-token');
  if (stored) headers.Authorization = `Bearer ${stored}`;
  return headers;
}

async function callStage(
  stage: StageName,
  context: WorkflowContext,
  onStage?: (state: StageState) => void
): Promise<StageState> {
  const state: StageState = { stage, status: 'running' };
  onStage?.(state);

  const headers = await getAuthHeaders();

  try {
    const res = await fetch(`${API_BASE}/review/stage/${stage}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(context),
    });

    if (!res.ok) {
      state.status = 'error';
      state.error = `HTTP ${res.status}`;
      onStage?.(state);
      return state;
    }

    const data: StageResponse = await res.json();

    state.status = data.ok ? 'done' : 'error';
    state.durationMs = data.durationMs;
    state.resultMode = data.resultMode;
    state.provider = data.provider;
    state.model = data.model;
    state.data = data.data;
    state.error = data.error?.message;

    onStage?.(state);
    return state;
  } catch (err) {
    state.status = 'error';
    state.error = String(err);
    onStage?.(state);
    return state;
  }
}

export interface RunWorkflowOptions {
  brief: string;
  question: string;
  answer: string;
  memory: unknown;
  programName?: string;
  applicationType?: string;
  reviewStrictness?: string;
  targetLength?: string;
  deadline?: string;
  forceRerun?: boolean;
  onStage?: (state: StageState) => void;
}

export async function runWorkflow(
  options: RunWorkflowOptions
): Promise<WorkflowResult> {
  const start = Date.now();

  const stages: StageState[] = STAGE_ORDER.map(s => ({
    stage: s,
    status: 'pending' as const,
  }));

  const context: WorkflowContext = {
    brief: options.brief,
    question: options.question,
    answer: options.answer,
    memory: options.memory,
    programName: options.programName || 'Untitled opportunity',
    applicationType: options.applicationType || 'fellowship',
    reviewStrictness: options.reviewStrictness || 'balanced',
    targetLength: options.targetLength || '150 words',
    deadline: options.deadline,
    stagesCompleted: [],
    quotaConsumed: false,
  };

  let overallMode: ResultMode = 'ai_full';

  for (let i = 0; i < STAGE_ORDER.length; i++) {
    const stageName = STAGE_ORDER[i];
    const state = await callStage(stageName, context, options.onStage);

    context.stagesCompleted.push(`${stageName}_${state.status}`);

    if (state.resultMode === 'deterministic_stage' || state.resultMode === 'fallback_stage') {
      overallMode = state.resultMode;
    }

    if (state.data) {
      const key = stageNameToContextKey(stageName);
      if (key) {
        (context as unknown as Record<string, unknown>)[key] = state.data;
      }
    }

    if (state.status === 'error' && !context.byok) {
      break;
    }
  }

  const final = (context as unknown as Record<string, unknown>).applicationPacket || (context as unknown as Record<string, unknown>).readinessReport;

  return {
    inputHash: context.inputHash || '',
    totalDurationMs: Date.now() - start,
    resultMode: overallMode,
    stages,
    final,
  };
}

function stageNameToContextKey(stage: StageName): string | null {
  const map: Record<string, string> = {
    'parse-brief': 'briefAnalysis',
    'evidence-bank': 'evidenceBank',
    'deterministic-checks': 'deterministicChecks',
    'requirement-coverage': 'requirementCoverage',
    'reviewer-panel': 'reviewerPanel',
    'score': 'score',
    'readiness-report': 'readinessReport',
    'application-packet': 'applicationPacket',
    'save': 'save',
  };
  return map[stage] || null;
}
