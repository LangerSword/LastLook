import { useEffect, useMemo, useRef, useState } from 'react';
import { Copy, Download, Plus, Save, Trash2, Upload, UserRound } from 'lucide-react';
import type {
  ApplicationMemory,
  AnswerLibrarySnippet,
  MemoryAchievement,
  MemoryProject,
} from '../lib/types';
import {
  clearMemory,
  createEmptyMemory,
  exportMemory,
  getStorageMode,
  importMemory,
  saveMemory,
} from '../lib/memoryStore';
import { sampleProfile } from '../lib/sampleData';

interface MemoryPanelProps {
  memory: ApplicationMemory | null;
  onMemoryChange?: (m: ApplicationMemory | null) => void;
  onUpdate?: (m: ApplicationMemory | null) => void;
  compact?: boolean;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const emptyProject = (): MemoryProject => ({
  name: '',
  oneLiner: '',
  longerExplanation: '',
  tags: [],
  links: [],
  proof: '',
  bestUseCase: '',
});

const emptyAchievement = (): MemoryAchievement => ({
  title: '',
  description: '',
  proof: '',
  category: '',
});

const emptySnippet = (): AnswerLibrarySnippet => ({
  title: '',
  body: '',
  tags: [],
});

const toLines = (value: string[]) => value.join('\n');
const fromLines = (value: string) => value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);

function CopyValueButton({ value }: { value: string }) {
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(value)}
      className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-lg border border-edge text-ink-secondary hover:text-ink"
    >
      <Copy className="w-3 h-3" /> Copy
    </button>
  );
}

export default function MemoryPanel({ memory, onMemoryChange, onUpdate, compact }: MemoryPanelProps) {
  // Support both onUpdate and onMemoryChange prop names
  const handleUpdate = onUpdate ?? onMemoryChange;
  const [form, setForm] = useState<ApplicationMemory>(memory ?? createEmptyMemory());
  const [status, setStatus] = useState<SaveState>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [storageMode, setStorageMode] = useState<'cloud' | 'local' | 'demo' | 'cloud-fallback'>('local');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(memory?.updatedAt ?? null);
  const [isDirty, setIsDirty] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (memory) {
      setForm(memory);
      setLastSavedAt(memory.updatedAt ?? null);
      setIsDirty(false);
    }
  }, [memory]);

  useEffect(() => {
    void (async () => {
      const mode = await getStorageMode();
      if (typeof mode === 'string') setStorageMode(mode);
    })();
  }, []);

  const badge = useMemo(() => {
    if (status === 'saving') return 'Saving...';
    if (status === 'saved') {
      if (storageMode === 'cloud') return 'Synced to account';
      if (storageMode === 'cloud-fallback') return 'Saved locally';
      return 'Saved locally';
    }
    if (status === 'error') return 'Save failed';
    if (storageMode === 'cloud') return 'Cloud sync on';
    if (storageMode === 'demo') return 'Local demo mode';
    if (storageMode === 'cloud-fallback') return 'Cloud save failed, saved locally';
    return 'Local mode';
  }, [status, storageMode]);

  const flash = (message: string, nextStatus: SaveState = 'saved') => {
    setStatus(nextStatus);
    setStatusMessage(message);
    window.setTimeout(() => {
      setStatus((current) => (current === nextStatus ? 'idle' : current));
      setStatusMessage('');
    }, 2800);
  };

  const updateProfile = (key: keyof ApplicationMemory['profile'], value: string) => {
    setForm((previous) => ({
      ...previous,
      profile: { ...previous.profile, [key]: value },
    }));
    setIsDirty(true);
  };

  const updatePreferences = (key: keyof ApplicationMemory['preferences'], value: string) => {
    setForm((previous) => ({
      ...previous,
      preferences: {
        ...previous.preferences,
        [key]: key === 'preferredApplicationTypes' ? fromLines(value) : value,
      },
    }));
    setIsDirty(true);
  };

  const updateLinkVault = (key: keyof ApplicationMemory['linkVault'], value: string) => {
    setForm((previous) => ({
      ...previous,
      linkVault: { ...previous.linkVault, [key]: key === 'projectLinks' || key === 'otherLinks' ? fromLines(value) : value },
    }));
    setIsDirty(true);
  };

  const updateProject = (index: number, key: keyof MemoryProject, value: string) => {
    setForm((previous) => ({
      ...previous,
      projects: previous.projects.map((project, projectIndex) => {
        if (projectIndex !== index) return project;
        return {
          ...project,
          [key]: key === 'tags' || key === 'links' ? fromLines(value) : value,
        } as MemoryProject;
      }),
    }));
    setIsDirty(true);
  };

  const updateAchievement = (index: number, key: keyof MemoryAchievement, value: string) => {
    setForm((previous) => ({
      ...previous,
      achievements: previous.achievements.map((achievement, achievementIndex) => {
        if (achievementIndex !== index) return achievement;
        return { ...achievement, [key]: value };
      }),
    }));
    setIsDirty(true);
  };

  const updateSnippet = (index: number, key: keyof AnswerLibrarySnippet, value: string) => {
    setForm((previous) => ({
      ...previous,
      answerLibrary: previous.answerLibrary.map((snippet, snippetIndex) => {
        if (snippetIndex !== index) return snippet;
        return {
          ...snippet,
          [key]: key === 'tags' ? fromLines(value) : value,
        } as AnswerLibrarySnippet;
      }),
    }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    setStatus('saving');
    try {
      const result = await saveMemory(form);
      handleUpdate?.(result.memory);
      setForm(result.memory);
      setStorageMode(result.mode);
      setLastSavedAt(result.memory.updatedAt ?? new Date().toISOString());
      setIsDirty(false);
      flash(result.warning || 'Memory saved.', 'saved');
    } catch (error) {
      setStatus('error');
      setStatusMessage(error instanceof Error ? error.message : 'Save failed');
    }
  };

  const handleSample = async () => {
    setForm(sampleProfile);
    const result = await saveMemory(sampleProfile);
    handleUpdate?.(result.memory);
    setStorageMode(result.mode);
    setLastSavedAt(result.memory.updatedAt ?? new Date().toISOString());
    setIsDirty(false);
    flash('Sample memory loaded.', 'saved');
  };

  const handleClear = async () => {
    await clearMemory();
    const empty = createEmptyMemory();
    setForm(empty);
    handleUpdate?.(empty);
    setLastSavedAt(null);
    setIsDirty(false);
    flash('Memory cleared.', 'saved');
  };

  const handleExport = async () => {
    const data = await exportMemory();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lastlook-memory.json';
    link.click();
    URL.revokeObjectURL(url);
    flash('Exported JSON.', 'saved');
  };

  const handleImport = async () => {
    fileRef.current?.click();
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const imported = await importMemory(text);
    if (!imported) {
      flash('Import failed. Check the JSON format.', 'error');
      return;
    }
    handleUpdate?.(imported.memory);
    setForm(imported.memory);
    setStorageMode(imported.mode);
    setLastSavedAt(imported.memory.updatedAt ?? new Date().toISOString());
    setIsDirty(false);
    flash('Memory imported.', 'saved');
    event.target.value = '';
  };

  const addProject = () => {
    setForm((previous) => ({ ...previous, projects: [...previous.projects, emptyProject()] }));
    setIsDirty(true);
  };

  const addAchievement = () => {
    setForm((previous) => ({ ...previous, achievements: [...previous.achievements, emptyAchievement()] }));
    setIsDirty(true);
  };

  const addSnippet = () => {
    setForm((previous) => ({ ...previous, answerLibrary: [...previous.answerLibrary, emptySnippet()] }));
    setIsDirty(true);
  };

  const removeProject = (index: number) => {
    setForm((previous) => ({ ...previous, projects: previous.projects.filter((_, projectIndex) => projectIndex !== index) }));
    setIsDirty(true);
  };

  const removeAchievement = (index: number) => {
    setForm((previous) => ({ ...previous, achievements: previous.achievements.filter((_, achievementIndex) => achievementIndex !== index) }));
    setIsDirty(true);
  };

  const removeSnippet = (index: number) => {
    setForm((previous) => ({ ...previous, answerLibrary: previous.answerLibrary.filter((_, snippetIndex) => snippetIndex !== index) }));
    setIsDirty(true);
  };

  const sectionClass = 'rounded-2xl border border-edge bg-surface p-5 shadow-soft';
  const inputClass = 'w-full rounded-xl border border-edge bg-surface-muted px-3 py-2.5 text-[13px] text-ink placeholder:text-ink-muted outline-none transition-all focus:border-yc focus:ring-1 focus:ring-yc/20';

  return (
    <section id="memory-panel" className="space-y-5">
      <div className="rounded-3xl border border-edge bg-surface p-5 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">memory workspace</div>
            <h2 className="mt-2 text-[22px] font-semibold text-ink">LastLook uses this memory to make reviews specific to you.</h2>
            <p className="mt-2 text-[13px] text-ink-secondary max-w-2xl">Profile, projects, evidence, and links all feed the review engine so it can explain your work instead of just naming it.</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="inline-flex items-center rounded-full border border-edge bg-surface-muted px-3 py-1 text-[11px] font-medium text-ink-secondary">
              {badge}
            </span>
            <span className={`text-[11px] font-mono ${isDirty ? 'text-warn' : 'text-ink-muted'}`}>
              {isDirty ? 'Unsaved changes' : lastSavedAt ? `Last saved ${new Date(lastSavedAt).toLocaleString()}` : 'No saved memory yet'}
            </span>
          </div>
        </div>

        {statusMessage && (
          <div className={`mt-4 rounded-xl border px-3 py-2 text-[12px] ${status === 'error' ? 'border-err/20 bg-err-soft text-err' : 'border-edge bg-surface-muted text-ink-secondary'}`}>
            {statusMessage}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={handleSave} className="inline-flex items-center gap-2 rounded-xl bg-yc px-4 py-2.5 text-[13px] font-semibold text-[var(--button-text)] transition-colors hover:bg-yc-hover">
            <Save className="w-4 h-4" /> Save memory
          </button>
          <button onClick={handleSample} className="inline-flex items-center gap-2 rounded-xl border border-edge bg-surface px-4 py-2.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-muted">
            <UserRound className="w-4 h-4" /> Load sample
          </button>
          <button onClick={handleExport} className="inline-flex items-center gap-2 rounded-xl border border-edge bg-surface px-4 py-2.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-muted">
            <Download className="w-4 h-4" /> Export JSON
          </button>
          <button onClick={handleImport} className="inline-flex items-center gap-2 rounded-xl border border-edge bg-surface px-4 py-2.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-muted">
            <Upload className="w-4 h-4" /> Import JSON
          </button>
          <button onClick={handleClear} className="inline-flex items-center gap-2 rounded-xl border border-edge px-4 py-2.5 text-[13px] font-medium text-err transition-colors hover:bg-err-soft">
            <Trash2 className="w-4 h-4" /> Clear memory
          </button>
          <input ref={fileRef} type="file" accept="application/json" onChange={handleFile} className="hidden" />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={sectionClass}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[13px] font-semibold text-ink">Profile</h3>
            <CopyValueButton value={[form.profile.name, form.profile.shortBio, form.profile.currentFocus].filter(Boolean).join('\n')} />
          </div>
          <div className="mt-4 grid gap-4">
            <input value={form.profile.name} onChange={(event) => updateProfile('name', event.target.value)} placeholder="Name" className={inputClass} />
            <textarea value={form.profile.shortBio} onChange={(event) => updateProfile('shortBio', event.target.value)} placeholder="Short bio" rows={3} className={`${inputClass} resize-none`} />
            <textarea value={form.profile.currentFocus} onChange={(event) => updateProfile('currentFocus', event.target.value)} placeholder="Current focus" rows={2} className={`${inputClass} resize-none`} />
            <input value={form.profile.preferredTone} onChange={(event) => updateProfile('preferredTone', event.target.value)} placeholder="Preferred tone" className={inputClass} />
            <input value={form.profile.locationTimezone || ''} onChange={(event) => updateProfile('locationTimezone', event.target.value)} placeholder="Location / timezone optional" className={inputClass} />
          </div>
        </section>

        <section className={sectionClass}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[13px] font-semibold text-ink">Link Vault</h3>
            <CopyValueButton value={[form.linkVault.github, form.linkVault.linkedin, form.linkVault.portfolio, form.linkVault.resume, form.linkVault.demoVideo, ...form.linkVault.projectLinks, ...form.linkVault.otherLinks].filter(Boolean).join('\n')} />
          </div>
          <div className="mt-4 grid gap-4">
            <input value={form.linkVault.github} onChange={(event) => updateLinkVault('github', event.target.value)} placeholder="GitHub" className={inputClass} />
            <input value={form.linkVault.linkedin} onChange={(event) => updateLinkVault('linkedin', event.target.value)} placeholder="LinkedIn" className={inputClass} />
            <input value={form.linkVault.portfolio} onChange={(event) => updateLinkVault('portfolio', event.target.value)} placeholder="Portfolio" className={inputClass} />
            <input value={form.linkVault.resume} onChange={(event) => updateLinkVault('resume', event.target.value)} placeholder="Resume" className={inputClass} />
            <input value={form.linkVault.demoVideo} onChange={(event) => updateLinkVault('demoVideo', event.target.value)} placeholder="Demo video" className={inputClass} />
            <textarea value={toLines(form.linkVault.projectLinks)} onChange={(event) => updateLinkVault('projectLinks', event.target.value)} rows={3} placeholder="Project links, one per line" className={`${inputClass} resize-none`} />
            <textarea value={toLines(form.linkVault.otherLinks)} onChange={(event) => updateLinkVault('otherLinks', event.target.value)} rows={3} placeholder="Other links, one per line" className={`${inputClass} resize-none`} />
          </div>
        </section>
      </div>

      <section className={sectionClass}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[13px] font-semibold text-ink">Projects</h3>
          <button onClick={addProject} className="inline-flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-[12px] font-medium text-ink transition-colors hover:bg-surface-muted">
            <Plus className="w-3.5 h-3.5" /> Add project
          </button>
        </div>
        <div className="mt-4 grid gap-4">
          {form.projects.length === 0 && <p className="text-[13px] text-ink-secondary">Add projects so LastLook can explain them instead of naming them blindly.</p>}
          {form.projects.map((project, index) => (
            <div key={`${project.name || 'project'}-${index}`} className="rounded-2xl border border-edge bg-surface-muted p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[12px] font-medium text-ink-secondary">Project {index + 1}</div>
                <button onClick={() => removeProject(index)} className="inline-flex items-center gap-1 rounded-lg border border-edge px-2 py-1 text-[11px] text-err hover:bg-err-soft">
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              </div>
              <div className="mt-3 grid gap-3">
                <input value={project.name} onChange={(event) => updateProject(index, 'name', event.target.value)} placeholder="Project name" className={inputClass} />
                <textarea value={project.oneLiner} onChange={(event) => updateProject(index, 'oneLiner', event.target.value)} placeholder="One-line explanation" rows={2} className={`${inputClass} resize-none`} />
                <textarea value={project.longerExplanation} onChange={(event) => updateProject(index, 'longerExplanation', event.target.value)} placeholder="Longer explanation" rows={2} className={`${inputClass} resize-none`} />
                <textarea value={toLines(project.tags)} onChange={(event) => updateProject(index, 'tags', event.target.value)} placeholder="Tags, one per line" rows={2} className={`${inputClass} resize-none`} />
                <textarea value={toLines(project.links)} onChange={(event) => updateProject(index, 'links', event.target.value)} placeholder="Project links, one per line" rows={2} className={`${inputClass} resize-none`} />
                <textarea value={project.proof} onChange={(event) => updateProject(index, 'proof', event.target.value)} placeholder="Proof or evidence" rows={2} className={`${inputClass} resize-none`} />
                <textarea value={project.bestUseCase} onChange={(event) => updateProject(index, 'bestUseCase', event.target.value)} placeholder="Best use case in applications" rows={2} className={`${inputClass} resize-none`} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={sectionClass}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[13px] font-semibold text-ink">Achievements</h3>
            <button onClick={addAchievement} className="inline-flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-[12px] font-medium text-ink transition-colors hover:bg-surface-muted">
              <Plus className="w-3.5 h-3.5" /> Add achievement
            </button>
          </div>
          <div className="mt-4 grid gap-4">
            {form.achievements.length === 0 && <p className="text-[13px] text-ink-secondary">Add achievements with proof when you have them.</p>}
            {form.achievements.map((achievement, index) => (
              <div key={`${achievement.title || 'achievement'}-${index}`} className="rounded-2xl border border-edge bg-surface-muted p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[12px] font-medium text-ink-secondary">Achievement {index + 1}</div>
                  <button onClick={() => removeAchievement(index)} className="inline-flex items-center gap-1 rounded-lg border border-edge px-2 py-1 text-[11px] text-err hover:bg-err-soft">
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                </div>
                <div className="mt-3 grid gap-3">
                  <input value={achievement.title} onChange={(event) => updateAchievement(index, 'title', event.target.value)} placeholder="Title" className={inputClass} />
                  <textarea value={achievement.description} onChange={(event) => updateAchievement(index, 'description', event.target.value)} placeholder="Description" rows={2} className={`${inputClass} resize-none`} />
                  <textarea value={achievement.proof} onChange={(event) => updateAchievement(index, 'proof', event.target.value)} placeholder="Proof" rows={2} className={`${inputClass} resize-none`} />
                  <input value={achievement.category} onChange={(event) => updateAchievement(index, 'category', event.target.value)} placeholder="Category" className={inputClass} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={sectionClass}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[13px] font-semibold text-ink">Answer Library</h3>
            <button onClick={addSnippet} className="inline-flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-[12px] font-medium text-ink transition-colors hover:bg-surface-muted">
              <Plus className="w-3.5 h-3.5" /> Add snippet
            </button>
          </div>
          <div className="mt-4 grid gap-4">
            {form.answerLibrary.length === 0 && <p className="text-[13px] text-ink-secondary">Save reusable lines for intros, fit, and project explanations.</p>}
            {form.answerLibrary.map((snippet, index) => (
              <div key={`${snippet.title || 'snippet'}-${index}`} className="rounded-2xl border border-edge bg-surface-muted p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[12px] font-medium text-ink-secondary">Snippet {index + 1}</div>
                  <button onClick={() => removeSnippet(index)} className="inline-flex items-center gap-1 rounded-lg border border-edge px-2 py-1 text-[11px] text-err hover:bg-err-soft">
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                </div>
                <div className="mt-3 grid gap-3">
                  <input value={snippet.title} onChange={(event) => updateSnippet(index, 'title', event.target.value)} placeholder="Title" className={inputClass} />
                  <textarea value={snippet.body} onChange={(event) => updateSnippet(index, 'body', event.target.value)} placeholder="Reusable text" rows={3} className={`${inputClass} resize-none`} />
                  <textarea value={toLines(snippet.tags)} onChange={(event) => updateSnippet(index, 'tags', event.target.value)} placeholder="Tags, one per line" rows={2} className={`${inputClass} resize-none`} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className={sectionClass}>
        <h3 className="text-[13px] font-semibold text-ink">Preferences</h3>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <input value={form.preferences.preferredTone} onChange={(event) => updatePreferences('preferredTone', event.target.value)} placeholder="Preferred tone" className={inputClass} />
          <input value={form.preferences.timezone || ''} onChange={(event) => updatePreferences('timezone', event.target.value)} placeholder="Timezone optional" className={inputClass} />
          <textarea value={toLines(form.preferences.preferredApplicationTypes)} onChange={(event) => updatePreferences('preferredApplicationTypes', event.target.value)} rows={2} placeholder="Preferred application types, one per line" className={`${inputClass} resize-none`} />
          <input value={form.preferences.notes || ''} onChange={(event) => updatePreferences('notes', event.target.value)} placeholder="Notes" className={inputClass} />
        </div>
      </section>
    </section>
  );
}
