import type { RequirementCoverageItem } from '../../lib/types';

interface Props {
  items: RequirementCoverageItem[];
}

export default function RequirementCoverage({ items }: Props) {
  if (!items.length) {
    return <div className="text-[13px] text-ink-secondary">No requirement coverage available yet.</div>;
  }

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={`${item.requirement}-${idx}`} className="rounded-2xl border border-edge bg-surface p-4">
          <div className="flex items-center justify-between">
            <div className="text-[13px] font-semibold text-ink">{item.requirement}</div>
            <span
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                item.status === 'covered'
                  ? 'bg-ok-soft text-ok'
                  : item.status === 'partial'
                  ? 'bg-warn-soft text-warn'
                  : 'bg-err-soft text-err'
              }`}
            >
              {item.status}
            </span>
          </div>
          <p className="text-[12px] text-ink-secondary mt-2">{item.note}</p>
        </div>
      ))}
    </div>
  );
}
