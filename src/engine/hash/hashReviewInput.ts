import { canonicalizeForDeterminism, type ReviewInputForCanonicalize } from './canonicalizeReviewInput';

export interface ReviewInputForHash {
  opportunity: {
    programName?: string;
    applicationType?: string;
    deadline?: string;
    targetFormat?: string;
    strictness?: string;
  };
  brief?: string;
  answer?: string;
  memory?: unknown;
  targetLength?: string;
}

let hashCache: Map<string, string> = new Map();

export function clearHashCache(): void {
  hashCache.clear();
}

export async function hashReviewInput(input: ReviewInputForHash): Promise<string> {
  const canonical = canonicalizeForDeterminism(input as ReviewInputForCanonicalize);

  if (hashCache.has(canonical)) {
    return hashCache.get(canonical)!;
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(canonical);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  const inputHash = hashHex.slice(0, 16);

  hashCache.set(canonical, inputHash);
  return inputHash;
}

export function deriveSeedFromHash(inputHash: string): number {
  let hash = 0;
  for (let i = 0; i < inputHash.length; i++) {
    const char = inputHash.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function stableSeededRandom(seed: number): () => number {
  let state = seed;
  return function () {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}