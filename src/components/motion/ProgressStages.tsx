import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface Props {
  stages: string[];
  currentIdx: number;
  className?: string;
}

export default function ProgressStages({ stages, currentIdx, className = '' }: Props) {
  const shouldReduceMotion = useReducedMotion();
  const safeIdx = Math.max(0, Math.min(currentIdx, stages.length - 1));
  const progress = stages.length <= 1 ? 100 : ((safeIdx + 1) / stages.length) * 100;

  const rail = (
    <div className="h-1.5 w-full bg-surface-muted rounded-full overflow-hidden">
      {shouldReduceMotion ? (
        <div className="h-full bg-yc/50" style={{ width: `${progress}%` }} />
      ) : (
        <motion.div
          className="h-full bg-yc/50"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      )}
    </div>
  );

  const list = stages.map((stage, idx) => {
    const isPast = safeIdx > idx;
    const isCurrent = safeIdx === idx;
    const isPending = safeIdx < idx;

    return (
      <div
        key={`${stage}-${idx}`}
        className={`flex items-start gap-3 ${isPending ? 'opacity-40' : 'opacity-100'}`}
      >
        <div className="mt-0.5 shrink-0">
          {isPast ? (
            <CheckCircle2 className="w-4 h-4 text-yc" />
          ) : (
            <div
              className={`w-2.5 h-2.5 rounded-full ${isCurrent ? 'bg-yc' : 'bg-ink-faint'}`}
            />
          )}
        </div>
        <span className={`text-[13px] ${isCurrent ? 'text-ink font-medium' : 'text-ink-secondary'}`}>
          {stage}
        </span>
      </div>
    );
  });

  if (shouldReduceMotion) {
    return (
      <div className={`space-y-4 ${className}`}>
        {rail}
        <div className="space-y-3">{list}</div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {rail}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: {
            transition: {
              staggerChildren: 0.08,
            },
          },
        }}
        className="space-y-3"
      >
        {list.map((node, idx) => (
          <motion.div
            key={`stage-${idx}`}
            variants={{
              hidden: { opacity: 0, y: 6 },
              show: { opacity: 1, y: 0 },
            }}
          >
            {node}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
