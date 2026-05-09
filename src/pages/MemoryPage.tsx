import { useEffect, useState } from 'react';
import type { ApplicationMemory } from '../lib/types';
import { createEmptyMemory, getMemory } from '../lib/memoryStore';
import AnimatedSection from '../components/motion/AnimatedSection';
import MemoryPanel from '../components/MemoryPanel';
import { Brain, Terminal, Database, ShieldCheck, Info } from 'lucide-react';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block font-mono text-[11px] text-[var(--accent)] font-bold uppercase tracking-[0.2em] mb-4 bg-[var(--accent-soft)] px-3 py-1 rounded-md">
      {children}
    </span>
  );
}

export default function MemoryPage() {
  const [memory, setMemory] = useState<ApplicationMemory | null>(null);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const snapshot = await getMemory();
      setMemory(snapshot.memory);
      setWarning(snapshot.warning ?? null);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="pb-24 animate-fade-in">
      
      {/* ─── MEMORY HERO ─────────────────────────────────────────── */}
      <section className="relative py-16 px-6 bg-[var(--surface)] border-b-2 border-[var(--border)] overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(var(--accent-rgb),0.12),transparent_70%)] blur-3xl -translate-y-1/2 translate-x-1/4" />
        </div>

        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="max-w-3xl space-y-6">
              <SectionLabel>Application Knowledge Base</SectionLabel>
              <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-black uppercase tracking-tighter text-ink leading-[0.9] font-display">
                Your Personal<br />Memory Vault.
              </h1>
              <p className="text-[18px] text-ink-secondary font-medium leading-relaxed">
                Manage the context LastLook uses to tailor every review. Keep your projects, evidence, and reusable lines in one place so the agents can explain your work instead of guessing.
              </p>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="card p-6 bg-[var(--surface-2)] border-2 border-[var(--border)] flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--success-soft)] flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-[var(--success)]" />
                </div>
                <div>
                  <div className="text-[11px] font-black uppercase tracking-widest text-ink-secondary">Storage Status</div>
                  <div className="text-[14px] font-bold text-ink">Cloud Sync Active</div>
                </div>
              </div>
              <div className="card p-6 bg-[var(--surface-3)] border-2 border-[var(--border)] flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center">
                  <Database className="w-6 h-6 text-[var(--accent)]" />
                </div>
                <div>
                  <div className="text-[11px] font-black uppercase tracking-widest text-ink-secondary">Memory Version</div>
                  <div className="text-[14px] font-bold text-ink">lastlook_memory_v1</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-[1400px] mx-auto p-6 md:p-12">
        {warning && (
          <div className="mb-8 rounded-2xl border-2 border-[var(--warning)]/20 bg-[var(--warning-soft)] p-6 flex items-start gap-4">
            <Info className="w-6 h-6 text-[var(--warning)] shrink-0" />
            <p className="text-[14px] font-bold text-[var(--warning)]">{warning}</p>
          </div>
        )}

        <div className="card bg-[var(--surface)] border-2 border-[var(--border)] shadow-lift overflow-hidden">
          {loading ? (
            <div className="p-20 text-center">
              <div className="w-12 h-12 rounded-xl bg-[var(--accent)] flex items-center justify-center mx-auto mb-4 animate-spin">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <p className="text-[14px] font-black uppercase tracking-tighter">Loading Knowledge Base...</p>
            </div>
          ) : (
            <MemoryPanel memory={memory ?? createEmptyMemory()} onMemoryChange={setMemory} />
          )}
        </div>
      </main>

    </div>
  );
}
