import CopyButton from '../CopyButton';

interface Props {
  original: string;
  draft?: string | null;
  whyItWorks?: string[];
}

export default function AnswerComparison({ original, draft, whyItWorks = [] }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-edge bg-surface p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">original answer</span>
          <CopyButton text={original} />
        </div>
        <p className="mt-4 text-[13px] text-ink-secondary whitespace-pre-wrap leading-relaxed">{original}</p>
      </div>
      <div className="rounded-2xl border border-edge bg-surface p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">draft + notes</span>
          {draft && <CopyButton text={draft} />}
        </div>
        <p className="mt-4 text-[13px] text-ink-secondary whitespace-pre-wrap leading-relaxed">
          {draft || 'No generated draft saved yet.'}
        </p>
        {whyItWorks.length > 0 && (
          <div className="mt-4 rounded-xl border border-edge bg-surface-muted p-3">
            <div className="text-[11px] font-mono text-ink-muted uppercase tracking-widest">what changed</div>
            <ul className="mt-2 space-y-1 text-[12px] text-ink-secondary">
              {whyItWorks.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
