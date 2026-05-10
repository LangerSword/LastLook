import type { FullReviewPacket } from './types';
import { isSupabaseConfigured, supabase } from './supabase';

const CACHE_KEY = 'lastlook_review_cache_v1';
const CACHE_INDEX_KEY = 'lastlook_review_hash_list_v1';

interface CachedReview {
  inputHash: string;
  result: FullReviewPacket;
  timestamp: number;
}

interface CacheStorage {
  version: string;
  reviews: Record<string, CachedReview>;
}

export function hasCachedReview(inputHash: string): boolean {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) return false;
    const cache: CacheStorage = JSON.parse(stored);
    return inputHash in cache.reviews;
  } catch {
    return false;
  }
}

export function getCachedReview(inputHash: string): FullReviewPacket | null {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) return null;
    const cache: CacheStorage = JSON.parse(stored);
    const cached = cache.reviews[inputHash];
    if (!cached) return null;
    return cached.result;
  } catch {
    return null;
  }
}

export function saveCachedReview(inputHash: string, result: FullReviewPacket): void {
  try {
    let cache: CacheStorage;
    const stored = localStorage.getItem(CACHE_KEY);
    if (stored) {
      cache = JSON.parse(stored);
    } else {
      cache = { version: 'v1', reviews: {} };
    }

    cache.reviews[inputHash] = {
      inputHash,
      result,
      timestamp: Date.now(),
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

    const hashList = localStorage.getItem(CACHE_INDEX_KEY);
    const hashes: string[] = hashList ? JSON.parse(hashList) : [];
    if (!hashes.includes(inputHash)) {
      hashes.push(inputHash);
      localStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(hashes));
    }

    if (isSupabaseConfigured && supabase) {
      saveToSupabase(inputHash, result).catch(() => {});
    }
  } catch (e) {
    console.warn('Failed to save review to cache:', e);
  }
}

async function saveToSupabase(inputHash: string, result: FullReviewPacket): Promise<void> {
  if (!supabase || !isSupabaseConfigured) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const reviewSession = {
      user_id: user.id,
      input_hash: inputHash,
      program_name: result.programName,
      application_type: result.applicationType,
      score: result.readinessReport?.score ?? result.applicationPacket?.overallScore,
      status: result.readinessReport?.status ?? result.applicationPacket?.status,
      result_json: JSON.stringify(result),
      created_at: new Date().toISOString(),
    };

    await supabase
      .from('review_sessions')
      .upsert([reviewSession], { onConflict: 'user_id,input_hash' });
  } catch (e) {
    console.warn('Failed to save to Supabase:', e);
  }
}

export function clearReviewCache(): void {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_INDEX_KEY);
}

export function getCacheIndex(): string[] {
  try {
    const stored = localStorage.getItem(CACHE_INDEX_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export interface CachedResultInfo {
  inputHash: string;
  programName: string;
  score: number;
  timestamp: number;
}

export function getCachedReviewInfo(inputHash: string): CachedResultInfo | null {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) return null;
    const cache: CacheStorage = JSON.parse(stored);
    const cached = cache.reviews[inputHash];
    if (!cached) return null;
    return {
      inputHash: cached.inputHash,
      programName: cached.result.programName,
      score: cached.result.readinessReport?.score ?? cached.result.applicationPacket?.overallScore ?? 0,
      timestamp: cached.timestamp,
    };
  } catch {
    return null;
  }
}