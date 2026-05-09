import { FileText, CheckCircle, Wrench } from 'lucide-react';
import type { GeneratedAnswer } from '../lib/types';
import ResultCard from './ResultCard';
import CopyButton from './CopyButton';

interface Props {
  generated: GeneratedAnswer | null;
}

export default function DraftResults({ generated }: Props) {
  return (
    <section className="rounded-2xl border border-edge bg-surface p-6 shadow-soft animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">draft output</span>
        {generated && <span className="text-[11px] text-ink-muted font-mono">ready</span>}
      </div>

      {!generated && <p className="mt-4 text-[13px] text-ink-secondary">Draft an answer using your saved memory.</p>}

      {generated && (
        <div className="mt-4 space-y-4">
          <div className="rounded-2xl border border-edge bg-surface-muted p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[13px] font-semibold text-ink flex items-center gap-2">
                <FileText className="w-4 h-4 text-ink-secondary" /> Draft
              </h4>
              <CopyButton text={generated.draft} />
            </div>
            <p className="text-[13px] text-ink-secondary whitespace-pre-wrap leading-relaxed">{generated.draft}</p>
          </div>
          <ResultCard title="Already working" items={generated.whyItWorks} icon={<CheckCircle className="w-4 h-4" />} variant="success" />
          <ResultCard title="Customize further" items={generated.customize} icon={<Wrench className="w-4 h-4" />} />
        </div>
      )}
    </section>
  );
}
