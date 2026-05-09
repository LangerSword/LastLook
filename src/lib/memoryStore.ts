import type {
  ApplicationMemory,
  AnswerLibrarySnippet,
  LinkVault,
  MemoryAchievement,
  MemoryPreferences,
  MemoryProfile,
  MemoryProject,
} from './types';
import { supabase, isSupabaseConfigured } from './supabase';
import { getSessionUser } from './auth';

const LOCAL_MEMORY_KEY = 'lastlook_memory_v1';

export type MemoryStorageMode = 'cloud' | 'local' | 'demo' | 'cloud-fallback';

export interface MemoryStoreResult {
  memory: ApplicationMemory;
  mode: MemoryStorageMode;
  hasStoredMemory: boolean;
  warning?: string;
}

export interface MemorySaveResult extends MemoryStoreResult {}

const defaultProfile = (): MemoryProfile => ({
  name: '',
  shortBio: '',
  currentFocus: '',
  preferredTone: 'confident, direct, builder-like',
  locationTimezone: '',
});

const defaultLinkVault = (): LinkVault => ({
  github: '',
  linkedin: '',
  portfolio: '',
  resume: '',
  demoVideo: '',
  projectLinks: [],
  otherLinks: [],
});

const defaultPreferences = (): MemoryPreferences => ({
  preferredTone: 'confident, direct, builder-like',
  preferredApplicationTypes: [],
  timezone: '',
  notes: '',
});

const defaultMemory = (): ApplicationMemory => ({
  profile: defaultProfile(),
  projects: [],
  achievements: [],
  answerLibrary: [],
  linkVault: defaultLinkVault(),
  preferences: defaultPreferences(),
});

function readLocalMemory(): ApplicationMemory | null {
  const raw = localStorage.getItem(LOCAL_MEMORY_KEY);
  if (!raw) return null;

  try {
    return normalizeMemory(JSON.parse(raw) as Partial<ApplicationMemory>);
  } catch {
    return null;
  }
}

export function getLocalMemorySnapshot(): ApplicationMemory | null {
  return readLocalMemory();
}

export async function getCloudMemorySnapshot(userId: string): Promise<ApplicationMemory | null> {
  return loadCloudMemory(userId);
}

function writeLocalMemory(memory: ApplicationMemory): void {
  localStorage.setItem(LOCAL_MEMORY_KEY, JSON.stringify({ ...memory, updatedAt: new Date().toISOString() }));
}

function isMeaningfullyEmpty(memory: ApplicationMemory): boolean {
  return (
    !memory.profile.name &&
    !memory.profile.shortBio &&
    !memory.profile.currentFocus &&
    memory.projects.length === 0 &&
    memory.achievements.length === 0 &&
    memory.answerLibrary.length === 0 &&
    !memory.linkVault.github &&
    !memory.linkVault.linkedin &&
    !memory.linkVault.portfolio &&
    !memory.linkVault.resume &&
    !memory.linkVault.demoVideo &&
    memory.linkVault.projectLinks.length === 0 &&
    memory.linkVault.otherLinks.length === 0
  );
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => (typeof item === 'string' ? item : String(item))).map((item) => item.trim()).filter(Boolean);
}

function toObjects<T>(value: unknown, mapFn: (item: Partial<T>) => T): T[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Partial<T> => Boolean(item) && typeof item === 'object')
    .map((item) => mapFn(item));
}

export function normalizeMemory(input: Partial<ApplicationMemory> | null | undefined): ApplicationMemory {
  const memory = input ?? {};
  return {
    profile: {
      ...defaultProfile(),
      ...(memory.profile ?? {}),
      preferredTone: memory.profile?.preferredTone || memory.preferences?.preferredTone || defaultProfile().preferredTone,
    },
    projects: toObjects<MemoryProject>(memory.projects, (item) => ({
      name: typeof item.name === 'string' ? item.name : '',
      oneLiner: typeof item.oneLiner === 'string' ? item.oneLiner : '',
      longerExplanation: typeof item.longerExplanation === 'string' ? item.longerExplanation : '',
      tags: toStringArray(item.tags),
      links: toStringArray(item.links),
      proof: typeof item.proof === 'string' ? item.proof : '',
      bestUseCase: typeof item.bestUseCase === 'string' ? item.bestUseCase : '',
    })),
    achievements: toObjects<MemoryAchievement>(memory.achievements, (item) => ({
      title: typeof item.title === 'string' ? item.title : '',
      description: typeof item.description === 'string' ? item.description : '',
      proof: typeof item.proof === 'string' ? item.proof : '',
      category: typeof item.category === 'string' ? item.category : '',
    })),
    answerLibrary: toObjects<AnswerLibrarySnippet>(memory.answerLibrary, (item) => ({
      title: typeof item.title === 'string' ? item.title : '',
      body: typeof item.body === 'string' ? item.body : '',
      tags: toStringArray(item.tags),
    })),
    linkVault: {
      ...defaultLinkVault(),
      ...(memory.linkVault ?? {}),
      projectLinks: toStringArray(memory.linkVault?.projectLinks),
      otherLinks: toStringArray(memory.linkVault?.otherLinks),
    },
    preferences: {
      ...defaultPreferences(),
      ...(memory.preferences ?? {}),
      preferredTone: typeof memory.preferences?.preferredTone === 'string'
        ? memory.preferences.preferredTone
        : typeof memory.profile?.preferredTone === 'string'
          ? memory.profile.preferredTone
          : defaultPreferences().preferredTone,
      preferredApplicationTypes: Array.isArray(memory.preferences?.preferredApplicationTypes)
        ? memory.preferences.preferredApplicationTypes.filter((item): item is MemoryPreferences['preferredApplicationTypes'][number] => typeof item === 'string')
        : [],
      timezone: typeof memory.preferences?.timezone === 'string' ? memory.preferences.timezone : memory.profile?.locationTimezone || '',
    },
    updatedAt: typeof memory.updatedAt === 'string' ? memory.updatedAt : undefined,
  };
}

export function createEmptyMemory(): ApplicationMemory {
  return defaultMemory();
}

export function getStorageMode(): Promise<MemoryStorageMode> | MemoryStorageMode {
  if (!isSupabaseConfigured || localStorage.getItem('lastlook_demo_mode') === 'true') {
    return isSupabaseConfigured ? 'demo' : 'local';
  }
  return 'cloud';
}

async function loadCloudMemory(userId: string): Promise<ApplicationMemory | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('user_memory')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return normalizeMemory({
    profile: data.profile,
    projects: data.projects,
    achievements: data.achievements,
    answerLibrary: data.answer_library,
    linkVault: data.link_vault,
    preferences: data.preferences,
    updatedAt: data.updated_at,
  });
}

async function saveCloudMemory(userId: string, memory: ApplicationMemory): Promise<{ ok: boolean; warning?: string }> {
  if (!supabase) return { ok: false, warning: 'Supabase is not configured.' };

  const payload = {
    user_id: userId,
    profile: memory.profile,
    projects: memory.projects,
    achievements: memory.achievements,
    answer_library: memory.answerLibrary,
    link_vault: memory.linkVault,
    preferences: memory.preferences,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('user_memory').upsert(payload, { onConflict: 'user_id' });
  if (error) {
    return { ok: false, warning: error.message };
  }

  return { ok: true };
}

export async function getMemory(): Promise<MemoryStoreResult> {
  const user = await getSessionUser();
  const localMemory = readLocalMemory();

  if (user && !user.isDemo && supabase) {
    const cloudMemory = await loadCloudMemory(user.id);
    if (cloudMemory) {
      return {
        memory: cloudMemory,
        mode: 'cloud',
        hasStoredMemory: !isMeaningfullyEmpty(cloudMemory),
      };
    }

    if (localMemory) {
      return {
        memory: localMemory,
        mode: 'cloud-fallback',
        hasStoredMemory: !isMeaningfullyEmpty(localMemory),
        warning: 'Cloud memory was unavailable, so LastLook is using the local copy in this browser.',
      };
    }
  }

  if (localMemory) {
    return {
      memory: localMemory,
      mode: user?.isDemo ? 'demo' : 'local',
      hasStoredMemory: !isMeaningfullyEmpty(localMemory),
    };
  }

  return {
    memory: defaultMemory(),
    mode: user?.isDemo ? 'demo' : (isSupabaseConfigured ? 'cloud' : 'local'),
    hasStoredMemory: false,
  };
}

export async function saveMemory(memory: ApplicationMemory): Promise<MemorySaveResult> {
  const normalized = normalizeMemory(memory);
  const user = await getSessionUser();

  if (user && !user.isDemo && supabase) {
    const cloudResult = await saveCloudMemory(user.id, normalized);
    if (cloudResult.ok) {
      return {
        memory: normalized,
        mode: 'cloud',
        hasStoredMemory: !isMeaningfullyEmpty(normalized),
      };
    }

    writeLocalMemory(normalized);
    return {
      memory: normalized,
      mode: 'cloud-fallback',
      hasStoredMemory: !isMeaningfullyEmpty(normalized),
      warning: `Cloud save failed. Memory was saved locally in this browser.${cloudResult.warning ? ` ${cloudResult.warning}` : ''}`,
    };
  }

  writeLocalMemory(normalized);
  return {
    memory: normalized,
    mode: user?.isDemo ? 'demo' : 'local',
    hasStoredMemory: !isMeaningfullyEmpty(normalized),
  };
}

export async function updateMemory(partialMemory: Partial<ApplicationMemory>): Promise<MemorySaveResult> {
  const current = await getMemory();
  return saveMemory({
    ...current.memory,
    ...partialMemory,
    profile: {
      ...current.memory.profile,
      ...(partialMemory.profile ?? {}),
    },
    linkVault: {
      ...current.memory.linkVault,
      ...(partialMemory.linkVault ?? {}),
    },
    preferences: {
      ...current.memory.preferences,
      ...(partialMemory.preferences ?? {}),
    },
  });
}

export async function clearMemory(): Promise<void> {
  localStorage.removeItem(LOCAL_MEMORY_KEY);

  const user = await getSessionUser();
  if (user && !user.isDemo && supabase) {
    await supabase.from('user_memory').delete().eq('user_id', user.id);
  }
}

export function clearLocalMemoryOnly(): void {
  localStorage.removeItem(LOCAL_MEMORY_KEY);
}

export async function exportMemory(): Promise<string> {
  const snapshot = await getMemory();
  return JSON.stringify(snapshot.memory, null, 2);
}

export async function importMemory(json: string): Promise<MemorySaveResult | null> {
  try {
    const parsed = JSON.parse(json) as Partial<ApplicationMemory>;
    return await saveMemory(normalizeMemory(parsed));
  } catch {
    return null;
  }
}

export function buildMemoryEvidence(memory: ApplicationMemory) {
  const projects = memory.projects.flatMap((project) => {
    const lines = [project.name, project.oneLiner, project.longerExplanation, project.bestUseCase].filter(Boolean);
    return lines;
  });

  const achievements = memory.achievements.flatMap((achievement) => {
    const lines = [achievement.title, achievement.description, achievement.proof].filter(Boolean);
    return lines;
  });

  const links = [
    memory.linkVault.github,
    memory.linkVault.linkedin,
    memory.linkVault.portfolio,
    memory.linkVault.resume,
    memory.linkVault.demoVideo,
    ...memory.linkVault.projectLinks,
    ...memory.linkVault.otherLinks,
  ].filter(Boolean);

  const personalAngles = [
    memory.profile.shortBio,
    memory.profile.currentFocus,
    memory.preferences.notes || '',
  ].filter(Boolean);

  const reusableSnippets = memory.answerLibrary.map((snippet) => `${snippet.title}: ${snippet.body}`);

  return {
    projects,
    achievements,
    links,
    personalAngles,
    reusableSnippets,
    answerSnippets: memory.answerLibrary.map((snippet) => snippet.body),
  };
}
