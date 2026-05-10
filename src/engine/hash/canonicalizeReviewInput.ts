export function canonicalizeAnswer(answer: string): string {
  return answer.trim();
}

export function canonicalizeString(value: string | undefined | null): string {
  if (value === undefined || value === null) return '';
  return String(value).trim().replace(/\s+/g, ' ');
}

export function canonicalizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    const value = obj[key];
    if (value === undefined || value === null) continue;
    if (typeof value === 'string') {
      result[key] = canonicalizeString(value);
    } else if (Array.isArray(value)) {
      result[key] = canonicalizeArray(value);
    } else if (value && typeof value === 'object') {
      result[key] = canonicalizeObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function canonicalizeArray(arr: unknown[]): unknown[] {
  return arr.map((item) => {
    if (typeof item === 'string') return canonicalizeString(item);
    if (Array.isArray(item)) return canonicalizeArray(item);
    if (item && typeof item === 'object') {
      return canonicalizeObject(item as Record<string, unknown>);
    }
    return item;
  });
}

export function canonicalizeMemory(memory: unknown): string {
  if (!memory) return '';
  try {
    const normalized = canonicalizeObject(memory as Record<string, unknown>);
    return JSON.stringify(normalized);
  } catch {
    return JSON.stringify(memory);
  }
}

export interface ReviewInputForCanonicalize {
  opportunity: {
    programName?: string;
    applicationType?: string;
    deadline?: string;
    targetFormat?: string;
    targetWords?: number;
    targetSeconds?: number;
    strictness?: string;
  };
  brief?: string;
  answer?: string;
  questions?: { id?: string; question?: string; answer?: string }[];
  memory?: unknown;
  targetLength?: string;
}

export function canonicalizeForDeterminism(input: ReviewInputForCanonicalize): string {
  const canonical = {
    programName: canonicalizeString(input.opportunity?.programName),
    applicationType: canonicalizeString(input.opportunity?.applicationType),
    deadline: canonicalizeString(input.opportunity?.deadline),
    targetFormat: canonicalizeString(input.opportunity?.targetFormat),
    targetWords: input.opportunity?.targetWords,
    targetSeconds: input.opportunity?.targetSeconds,
    strictness: canonicalizeString(input.opportunity?.strictness),
    brief: canonicalizeString(input.brief),
    answer: canonicalizeAnswer(input.answer || ''),
    targetLength: canonicalizeString(input.targetLength),
    memory: canonicalizeMemory(input.memory),
  };

  return JSON.stringify(canonical);
}