import { ReactNode } from 'react';

interface ResultCardProps {
  title: string;
  items: string[];
  icon?: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  children?: ReactNode;
}

const styles = {
  default: 'border-edge bg-surface',
  success: 'border-ok/25 bg-ok-soft/40',
  warning: 'border-warn/25 bg-warn-soft/40',
  danger: 'border-err/25 bg-err-soft/40',
};

const dots = {
  default: 'bg-ink-muted',
  success: 'bg-ok',
  warning: 'bg-warn',
  danger: 'bg-err',
};

export default function ResultCard({ title, items, icon, variant = 'default', children }: ResultCardProps) {
  if (items.length === 0 && !children) return null;
  return (
    <div className={`rounded-2xl border p-4 shadow-soft ${styles[variant]} animate-fade-in`}>
      <h4 className="text-[13px] font-semibold text-ink mb-2.5 flex items-center gap-2">
        {icon && <span className="text-ink-secondary">{icon}</span>}
        {title}
        <span className="text-[11px] font-normal text-ink-muted">({items.length})</span>
      </h4>
      {items.length > 0 && (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[13px] text-ink-secondary leading-relaxed">
              <span className={`mt-[7px] w-1.5 h-1.5 rounded-full flex-shrink-0 ${dots[variant]}`} />
              {item}
            </li>
          ))}
        </ul>
      )}
      {children}
    </div>
  );
}
