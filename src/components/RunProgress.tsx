import { Loader2, CheckCircle2 } from 'lucide-react';

interface Props {
  step: number; // 0 = idle, 1 = read, 2 = draft, 3 = check, 4 = done
  error?: string | null;
}

export default function RunProgress({ step, error }: Props) {
  if (step === 0) return null;

  const steps = [
    { num: 1, text: 'Reading brief...' },
    { num: 2, text: 'Drafting tailored answer...' },
    { num: 3, text: 'Checking readiness...' },
    { num: 4, text: 'Building dashboard...' },
  ];

  return (
    <div className="rounded-2xl border border-edge bg-surface p-6 shadow-soft animate-slide-up w-full max-w-[500px] mx-auto mt-8">
      <div className="space-y-4">
        {steps.map((s) => {
          const isPast = step > s.num || step === 4;
          const isCurrent = step === s.num && !error && step !== 4;
          const isPending = step < s.num;
          
          return (
            <div key={s.num} className={`flex items-center gap-3 transition-all duration-300 ${isPending ? 'opacity-40 translate-y-1' : 'opacity-100 translate-y-0'}`}>
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                {isPast ? (
                  <CheckCircle2 className="w-5 h-5 text-ok animate-fade-in" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 text-yc animate-spin" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-ink-muted" />
                )}
              </div>
              <span className={`text-[13px] ${isCurrent ? 'text-ink font-medium' : 'text-ink-secondary'}`}>
                {s.text}
              </span>
            </div>
          );
        })}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-err-soft text-err text-[13px] border border-err/20 animate-fade-in">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
