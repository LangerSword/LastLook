import type { BriefAnalysis, GeneratedAnswer, CheckResult } from './types';
import {
  normalizeAnalyzeResponse,
  normalizeGenerateResponse,
  normalizeCheckResponse,
} from './parseAiResponse';
import { supabase } from './supabase';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE = `${API_BASE_URL}/api`;

/**
 * Helper to intercept calls in Demo Mode.
 * Unauthenticated users or users actively choosing demo mode should NOT hit the real backend,
 * saving quota and returning mock data instantly.
 */
function isLocalDemoMode(): boolean {
  return localStorage.getItem('lastlook_demo_mode') === 'true' || !import.meta.env.VITE_SUPABASE_URL;
}

async function getAuthToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

async function post(path: string, body: unknown): Promise<unknown> {
  const token = await getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

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
      throw new Error('auth_required: Sign in to run a real LastLook review. You can still try the sample demo.');
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
        "60-90 second intro video",
        "Tell about yourself and what you're building",
        "Explain why the fellowship is a good fit"
      ],
      impliedCriteria: ["Clarity of communication", "Genuine passion"],
      submissionRisks: ["Video too short or too long"],
      suggestedAngles: ["Lead with a concrete builder identity"],
      summary: "This brief asks for a short video introduction. The evaluator wants to see who you are."
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
      draft: "I'm a builder. I'm working on several projects that sit at the intersection of AI and systems.",
      whyItWorks: ["Opens with a clear builder identity", "Projects are explained"],
      customize: ["Add a specific fellowship program name"]
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
      score: 42,
      status: "Not ready",
      criticalIssues: ["Too short for 60-90 second video"],
      warnings: ["Weak builder identity"],
      strongPoints: ["Mentions concrete project names"],
      fixOrder: ["Expand to 145-220 words"]
    }, params.wordCount, params.speakingTimeSeconds);
  }
  const data = await post('/check', params);
  return normalizeCheckResponse(data, params.wordCount, params.speakingTimeSeconds);
}

export async function getHealth(): Promise<{ status: string }> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) {
      if (res.status === 502 || res.status === 504 || res.status === 404) {
        throw new Error('Could not reach the AI backend. Run npm run pages:dev for full local testing.');
      }
      return { status: 'error' };
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
  },
  onProgress?: (step: number) => void
): Promise<FullRunResult> {
  if (isLocalDemoMode()) {
    if (onProgress) onProgress(1);
    const briefAnalysis = await analyzeBrief(params.brief);
    if (onProgress) onProgress(2);
    const generatedAnswer = await generateAnswer({ ...params, briefAnalysis });
    if (onProgress) onProgress(3);
    const readinessReport = await checkAnswer({ 
      ...params, 
      target: params.target || 'general',
      briefAnalysis,
      finalAnswer: params.finalAnswer || generatedAnswer.draft,
      wordCount: 150,
      speakingTimeSeconds: 60
    });
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
