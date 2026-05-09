import type { ReviewSession } from '../../lib/reviewStore';

interface Props {
  items: ReviewSession[];
  onOpen: (session: ReviewSession) => void;
}

export default function ReviewHistoryTable({ items, onOpen }: Props) {
  return (
    <div className="rounded-3xl border border-edge bg-surface shadow-soft overflow-hidden">
      <div className="px-6 py-5 border-b border-edge">
        <h3 className="text-[14px] font-semibold text-ink">Latest reviews</h3>
        <p className="text-[12px] text-ink-secondary">Open a review to see the full dashboard.</p>
      </div>
      <div className="divide-y divide-edge">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onOpen(item)}
            className="w-full text-left px-6 py-4 hover:bg-surface-muted transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[13px] font-semibold text-ink">{item.title}</div>
                <div className="text-[11px] text-ink-muted">{new Date(item.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="text-[12px] text-ink-secondary">{item.readinessReport?.score ?? 0}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
