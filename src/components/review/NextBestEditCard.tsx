interface Props {
  verdict: string;
  nextBestEdit: string;
  topFix: string;
}

export default function NextBestEditCard({ verdict, nextBestEdit, topFix }: Props) {
  return (
    <div className="rounded-3xl border border-edge bg-surface p-6 shadow-soft">
      <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">next best edit</span>
      <h2 className="text-[20px] font-semibold text-ink mt-3">{nextBestEdit}</h2>
      <p className="text-[13px] text-ink-secondary mt-2">{verdict}</p>
      <div className="mt-5 rounded-2xl border border-edge bg-surface-muted p-4">
        <div className="text-[11px] font-mono text-ink-muted uppercase tracking-widest">Top fix first</div>
        <p className="text-[13px] text-ink-secondary mt-2">{topFix}</p>
      </div>
    </div>
  );
}
