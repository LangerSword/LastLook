interface Props {
  items: string[];
}

export default function FixPlan({ items }: Props) {
  if (!items.length) {
    return <div className="text-[13px] text-ink-secondary">No fixes required.</div>;
  }

  return (
    <ol className="space-y-3">
      {items.map((item, idx) => (
        <li key={`${item}-${idx}`} className={`rounded-2xl border border-edge p-4 ${idx === 0 ? 'bg-yc/10' : 'bg-surface'}`}>
          <div className="text-[11px] font-mono text-ink-muted uppercase tracking-widest">Fix {idx + 1}</div>
          <p className="text-[13px] text-ink-secondary mt-2">{item}</p>
        </li>
      ))}
    </ol>
  );
}
