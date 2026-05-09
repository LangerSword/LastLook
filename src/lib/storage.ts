import type { UserMemory } from './types';

const STORAGE_KEY = 'lastlook_memory';

export function saveMemory(memory: UserMemory): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
}

export function loadMemory(): UserMemory | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserMemory;
  } catch {
    return null;
  }
}

export function clearMemory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasMemory(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export function exportMemoryJSON(): string {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw || JSON.stringify({});
}

export function importMemoryJSON(json: string): UserMemory | null {
  try {
    const parsed = JSON.parse(json) as UserMemory;
    if (parsed && typeof parsed.name === 'string') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
