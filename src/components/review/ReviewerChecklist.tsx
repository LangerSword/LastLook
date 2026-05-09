import { CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';

interface Item {
  label: string;
  status: 'covered' | 'partial' | 'missing';
  note?: string;
}

interface Props {
  items: Item[];
}

export default function ReviewerChecklist({ items }: Props) {
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const Icon = item.status === 'covered' ? CheckCircle2 : item.status === 'partial' ? AlertTriangle : AlertOctagon;
        const tone = item.status === 'covered' ? 'text-ok' : item.status === 'partial' ? 'text-warn' : 'text-err';
        return (
          <div key={item.label} className="rounded-2xl border border-edge bg-surface p-4">
            <div className="flex items-start gap-3">
              <Icon className={`w-4 h-4 mt-0.5 ${tone}`} />
              <div>
                <div className="text-[13px] font-semibold text-ink">{item.label}</div>
                {item.note && <div className="text-[12px] text-ink-secondary mt-1">{item.note}</div>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
