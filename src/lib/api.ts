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
  },
  onProgress?: (step: number) => void
): Promise<FullRunResult> {
  if (isLocalDemoMode()) {
    if (onProgress) onProgress(1);
    const briefAnalysis = await analyzeBrief(params.brief);
    if (onProgress) onProgress(2);
    const generatedAnswer = await generateAnswer({ ...params, briefAnalysis });
    if (onProgress) onProgress(3);
    const finalAnswerText = params.finalAnswer || generatedAnswer.draft;
    const wordCount = finalAnswerText.split(/\s+/).filter(Boolean).length;
    const speakingTimeSeconds = Math.round((wordCount / 145) * 60);

    // Use deterministic engine for tailored demo output
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

    const readinessReport: CheckResult = {
      ...packet.readinessReport,
      wordCount,
      speakingTimeSeconds,
    };

    if (onProgress) onProgress(4);
    return { briefAnalysis, generatedAnswer, readinessReport };
  }

  // Real API call via orchestrated /api/full endpoint
  if (onProgress) onProgress(1);
  const data = await post('/full', params) as any;
  if (onProgress) onProgress(4);

  return {
    briefAnalysis: normalizeAnalyzeResponse(data.briefAnalysis),
    generatedAnswer: normalizeGenerateResponse(data.generatedAnswer),
    readinessReport: normalizeCheckResponse(
      data.readinessReport, 
      data.wordCount || 150, 
      data.speakingTimeSeconds || 60
    ),
  };
}
