import { useEffect, useState } from 'react';
import { Download, Upload, Trash2, Save } from 'lucide-react';
import type { UserMemory } from '../lib/types';
import { exportMemoryJSON, importMemoryJSON, loadMemory, saveMemory, clearMemory } from '../lib/storage';
import AnimatedSection from '../components/motion/AnimatedSection';

const emptyMemory: UserMemory = {
  name: '',
  bio: '',
  focus: '',
  projects: '',
  achievements: '',
  links: '',
  snippets: '',
  tone: '',
};

export default function MemoryPage() {
  const [memory, setMemory] = useState<UserMemory>(emptyMemory);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const stored = loadMemory();
    if (stored) setMemory({ ...emptyMemory, ...stored });
  }, []);

  const handleSave = () => {
    saveMemory(memory);
    setMessage('Saved locally.');
  };

  const handleExport = () => {
    const data = exportMemoryJSON();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lastlook-memory.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = importMemoryJSON(text);
    if (parsed) {
      setMemory(parsed);
      setMessage('Memory imported.');
    } else {
      setMessage('Import failed. Check JSON format.');
    }
  };

  const handleClear = () => {
    clearMemory();
    setMemory(emptyMemory);
    setMessage('Memory cleared.');
  };

  return (
    <div className="space-y-6">
      <AnimatedSection>
        <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">memory</span>
        <h1 className="text-2xl font-semibold text-ink mt-2">Profile memory</h1>
        <p className="text-[13px] text-ink-secondary mt-2">Store reusable details so reviewers can reference them.</p>
      </AnimatedSection>

      <div className="rounded-3xl border border-edge bg-surface p-6 shadow-soft space-y-4">
        {([
          { label: 'Name', key: 'name' },
          { label: 'Bio', key: 'bio' },
          { label: 'Current focus', key: 'focus' },
          { label: 'Projects', key: 'projects' },
          { label: 'Achievements', key: 'achievements' },
          { label: 'Links', key: 'links' },
          { label: 'Reusable snippets', key: 'snippets' },
          { label: 'Preferred tone', key: 'tone' },
        ] as const).map((field) => (
          <label key={field.key} className="text-[12px] text-ink-secondary">
            {field.label}
            <textarea
              value={memory[field.key]}
              onChange={(e) => setMemory((prev) => ({ ...prev, [field.key]: e.target.value }))}
              className="mt-2 w-full min-h-[80px] rounded-xl border border-edge bg-surface-muted px-3 py-2 text-[13px] text-ink"
            />
          </label>
        ))}
        <div className="flex flex-wrap gap-2">
          <button onClick={handleSave} className="inline-flex items-center gap-2 px-4 py-2 bg-yc text-[var(--button-text)] rounded-xl text-[12px] font-semibold">
            <Save className="w-4 h-4" /> Save
          </button>
          <button onClick={handleExport} className="inline-flex items-center gap-2 px-4 py-2 bg-surface-muted border border-edge rounded-xl text-[12px] font-semibold text-ink">
            <Download className="w-4 h-4" /> Export JSON
          </button>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-surface-muted border border-edge rounded-xl text-[12px] font-semibold text-ink cursor-pointer">
            <Upload className="w-4 h-4" /> Import JSON
            <input type="file" accept="application/json" onChange={handleImport} className="hidden" />
          </label>
          <button onClick={handleClear} className="inline-flex items-center gap-2 px-4 py-2 border border-edge rounded-xl text-[12px] font-semibold text-err">
            <Trash2 className="w-4 h-4" /> Clear
          </button>
        </div>
        {message && <div className="text-[12px] text-ink-secondary">{message}</div>}
      </div>
    </div>
  );
}
