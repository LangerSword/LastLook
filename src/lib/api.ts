import type { BriefAnalysis, GeneratedAnswer, CheckResult } from './types';
import {
  normalizeAnalyzeResponse,
  normalizeGenerateResponse,
  normalizeCheckResponse,
} from './parseAiResponse';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE = `${API_BASE_URL}/api`;

async function post(path: string, body: unknown): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new Error('Could not reach the AI backend. Run npm run pages:dev for full local testing.');
  }

  if (!res.ok) {
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
  if (onProgress) onProgress(1);
  const briefAnalysis = await analyzeBrief(params.brief);

  if (onProgress) onProgress(2);
  const generatedAnswer = await generateAnswer({
    memory: params.memory,
    briefAnalysis,
    question: params.question,
    tone: params.tone,
    targetLength: params.targetLength,
    applicationType: params.applicationType,
    reviewStrictness: params.reviewStrictness,
  });

  if (onProgress) onProgress(3);
  const finalAnswerText = params.finalAnswer?.trim() || generatedAnswer.draft;
  const wordCount = finalAnswerText.split(/\s+/).filter(Boolean).length;
  const speakingTimeSeconds = Math.round((wordCount / 145) * 60);

  const readinessReport = await checkAnswer({
    briefAnalysis,
    question: params.question,
    finalAnswer: finalAnswerText,
    target: params.target || 'general',
    wordCount,
    speakingTimeSeconds,
    applicationType: params.applicationType,
    reviewStrictness: params.reviewStrictness,
  });

  if (onProgress) onProgress(4);

  return {
    briefAnalysis,
    generatedAnswer,
    readinessReport,
  };
}
