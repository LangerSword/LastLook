import { useEffect, useState } from 'react';
import type { ApplicationMemory } from '../lib/types';
import { createEmptyMemory, getMemory } from '../lib/memoryStore';
import AnimatedSection from '../components/motion/AnimatedSection';
import MemoryPanel from '../components/MemoryPanel';

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
    <div className="space-y-6">
      <AnimatedSection>
        <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">memory workspace</span>
        <h1 className="text-2xl font-semibold text-ink mt-2">Manage the memory LastLook uses to tailor every review</h1>
        <p className="text-[13px] text-ink-secondary mt-2">Keep your projects, evidence, and reusable lines in one place so the review engine can explain your work instead of guessing.</p>
      </AnimatedSection>

      {warning && (
        <div className="rounded-2xl border border-warn/20 bg-warn-soft px-4 py-3 text-[13px] text-warn">
          {warning}
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-edge bg-surface p-10 text-center text-ink-secondary shadow-soft">Loading memory...</div>
      ) : (
        <MemoryPanel memory={memory ?? createEmptyMemory()} onMemoryChange={setMemory} />
      )}
    </div>
  );
}
