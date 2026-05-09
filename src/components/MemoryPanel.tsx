import { useState, useEffect, useRef } from 'react';
import { Save, UserRound, Trash2, Download, Upload } from 'lucide-react';
import type { UserMemory } from '../lib/types';
import { saveMemory, clearMemory, exportMemoryJSON, importMemoryJSON } from '../lib/storage';
import { sampleProfile } from '../lib/sampleData';

interface MemoryPanelProps {
  memory: UserMemory | null;
  onMemoryChange: (m: UserMemory | null) => void;
}

const emptyMemory: UserMemory = { name: '', bio: '', focus: '', projects: '', achievements: '', links: '', snippets: '', tone: '' };

export default function MemoryPanel({ memory, onMemoryChange }: MemoryPanelProps) {
  const [form, setForm] = useState<UserMemory>(memory ?? emptyMemory);
  const [status, setStatus] = useState<string | null>(null);
  const [statusOk, setStatusOk] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (memory) setForm({ ...emptyMemory, ...memory }); }, [memory]);

  const flash = (msg: string, ok = true) => { setStatus(msg); setStatusOk(ok); setTimeout(() => setStatus(null), 3000); };
  const update = (k: keyof UserMemory, v: string) => { setForm(p => ({ ...p, [k]: v })); setStatus(null); };

  const handleSave = () => { saveMemory(form); onMemoryChange(form); flash('Saved locally in this browser.'); };
  const handleSample = () => { setForm(sampleProfile); saveMemory(sampleProfile); onMemoryChange(sampleProfile); flash('Sample loaded.'); };
  const handleClear = () => { setForm(emptyMemory); clearMemory(); onMemoryChange(null); flash('Cleared.'); };
  const handleExport = () => {
    const b = new Blob([exportMemoryJSON()], { type: 'application/json' });
    const u = URL.createObjectURL(b); const a = document.createElement('a');
    a.href = u; a.download = 'lastlook-memory.json'; a.click(); URL.revokeObjectURL(u);
    flash('Exported.');
  };
  const handleImport = () => fileRef.current?.click();
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { const m = importMemoryJSON(r.result as string); if (m) { setForm(m); onMemoryChange(m); flash('Imported.'); } else flash('Invalid file.', false); };
    r.readAsText(f); e.target.value = '';
  };

  const fields: { key: keyof UserMemory; label: string; ph: string; multi?: boolean }[] = [
    { key: 'name', label: 'Name', ph: 'Your name' },
    { key: 'bio', label: 'Bio', ph: 'One-line bio', multi: true },
    { key: 'focus', label: 'Focus', ph: 'What are you working on?' },
    { key: 'projects', label: 'Projects', ph: 'List your key projects (one per line)', multi: true },
    { key: 'achievements', label: 'Achievements', ph: 'Key achievements' },
    { key: 'links', label: 'Links', ph: 'Portfolio, GitHub, demo links', multi: true },
    { key: 'snippets', label: 'Reusable snippets', ph: 'Short lines you reuse often', multi: true },
    { key: 'tone', label: 'Tone', ph: 'e.g. confident, direct, builder-like' },
  ];

  const inputCls = "w-full bg-surface border border-edge rounded-xl px-3 py-2.5 text-[13px] text-ink placeholder:text-ink-muted focus:border-yc focus:ring-1 focus:ring-yc/20 transition-all duration-200 outline-none";

  return (
    <section id="memory-panel" className="rounded-2xl border border-edge bg-surface p-6 shadow-soft animate-fade-in">
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">01 / memory</span>
        {status && <span className={`text-[11px] font-medium font-mono px-2 py-0.5 rounded-full ${statusOk ? 'text-ok bg-ok-soft' : 'text-err bg-err-soft'}`}>{status}</span>}
      </div>
      <p className="text-[13px] text-ink-secondary mb-5">Saved locally on this device. No account needed.</p>

      <div className="space-y-4">
        {fields.map(({ key, label, ph, multi }) => (
          <div key={key}>
            <label htmlFor={`memory-${key}`} className="block text-[11px] font-medium text-ink-secondary mb-1.5 uppercase tracking-wider">{label}</label>
            {multi ? <textarea id={`memory-${key}`} rows={key === 'projects' ? 4 : 2} value={form[key]} onChange={e => update(key, e.target.value)} placeholder={ph} className={`${inputCls} resize-none`} />
              : <input id={`memory-${key}`} type="text" value={form[key]} onChange={e => update(key, e.target.value)} placeholder={ph} className={inputCls} />}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mt-6">
        <button id="btn-save-memory" onClick={handleSave}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-yc hover:bg-yc-hover text-[var(--button-text)] text-[13px] font-semibold rounded-xl transition-all duration-200 cursor-pointer shadow-sm shadow-yc/10">
          <Save className="w-4 h-4" /> Save locally
        </button>
        <button id="btn-load-sample" onClick={handleSample}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-surface hover:bg-surface-muted text-ink text-[13px] font-medium rounded-xl border border-edge transition-all duration-200 cursor-pointer">
          <UserRound className="w-4 h-4" /> Load sample
        </button>
        <button id="btn-clear-memory" onClick={handleClear}
          className="inline-flex items-center gap-1.5 px-3 py-2.5 text-ink-secondary hover:text-err text-[13px] font-medium rounded-xl border border-transparent hover:border-err/30 transition-all duration-200 cursor-pointer">
          <Trash2 className="w-4 h-4" /> Clear
        </button>
      </div>
      <div className="flex gap-3 mt-3">
        <button id="btn-export-memory" onClick={handleExport} className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono font-medium rounded-lg text-ink-secondary hover:text-ink border border-edge transition-all duration-200 cursor-pointer">
          <Download className="w-3 h-3" /> export
        </button>
        <button id="btn-import-memory" onClick={handleImport} className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono font-medium rounded-lg text-ink-secondary hover:text-ink border border-edge transition-all duration-200 cursor-pointer">
          <Upload className="w-3 h-3" /> import
        </button>
        <input ref={fileRef} type="file" accept=".json" onChange={handleFile} className="hidden" />
      </div>
    </section>
  );
}
