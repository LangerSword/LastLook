import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface Props {
  stages: string[];
  currentIdx: number;
}

export default function ReviewerProgress({ stages, currentIdx }: Props) {
  return (
    <div className="rounded-2xl border border-edge bg-surface p-5 shadow-soft">
      <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">reviewer agents</span>
      <div className="mt-4 space-y-3">
        {stages.map((stage, idx) => {
          const isDone = idx < currentIdx;
          const isActive = idx === currentIdx;
          return (
            <div key={stage} className="flex items-center gap-3">
              <div className="w-5 h-5 flex items-center justify-center">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-ok" />
                ) : (
                  <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-yc' : 'bg-ink-muted'}`} />
                )}
              </div>
              <div className="flex-1">
                <div className={`text-[13px] ${isActive ? 'text-ink font-medium' : 'text-ink-secondary'}`}>
                  {stage}
                </div>
                {isActive && (
                  <motion.div
                    className="h-1 rounded-full bg-yc/40 mt-2"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.2 }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
