import { ReactNode } from 'react';

interface Props {
  label: string;
  value: string | number;
  helper?: string;
  icon?: ReactNode;
  accent?: 'ok' | 'warn' | 'err' | 'accent';
}

const accentClass = (accent?: Props['accent']) => {
  if (accent === 'ok') return 'bg-ok-soft text-ok';
  if (accent === 'warn') return 'bg-warn-soft text-warn';
  if (accent === 'err') return 'bg-err-soft text-err';
  if (accent === 'accent') return 'bg-yc-soft text-yc';
  return 'bg-surface-muted text-ink';
};

export default function MetricCard({ label, value, helper, icon, accent }: Props) {
  return (
    <div className="rounded-2xl border border-edge bg-surface p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-ink-muted">{label}</div>
          <div className="text-[26px] font-semibold text-ink mt-2">{value}</div>
          {helper && <div className="text-[12px] text-ink-secondary mt-1">{helper}</div>}
        </div>
        {icon && <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accentClass(accent)}`}>{icon}</div>}
      </div>
    </div>
  );
}
