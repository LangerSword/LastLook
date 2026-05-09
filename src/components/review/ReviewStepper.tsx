import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface Step {
  title: string;
  description: string;
}

interface Props {
  steps: Step[];
  activeStep: number;
}

export default function ReviewStepper({ steps, activeStep }: Props) {
  return (
    <div className="relative rounded-2xl border border-edge bg-surface p-5 sm:p-6 shadow-soft overflow-hidden">
      {/* Festivent-style colored accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--accent)] via-[var(--accent-2)] to-[var(--accent)]" />
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-5">
        {steps.map((step, idx) => {
          const isActive = idx === activeStep;
          const isDone = idx < activeStep;
          return (
            <div key={step.title} className="relative group">
              {/* Connector line */}
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute top-5 left-1/2 -translate-x-1/2 w-full h-0.5 bg-edge -z-10" />
              )}
              
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <motion.div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-[14px] font-bold shadow-sm ${
                      isDone
                        ? 'bg-ok text-white'
                        : isActive
                        ? 'bg-[var(--accent)] text-white shadow-lg'
                        : 'bg-surface-muted text-ink-muted'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    {isDone ? <Check className="w-5 h-5" /> : idx + 1}
                  </motion.div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-[14px] font-bold truncate ${isActive ? 'text-ink' : isDone ? 'text-ok' : 'text-ink-secondary'}`}>
                    {step.title}
                  </div>
                  <div className={`text-[12px] ${isActive ? 'text-ink-muted' : 'text-ink-faint'}`}>{step.description}</div>
                  {isActive && (
                    <motion.div
                      className="h-1.5 bg-[var(--accent)]/40 rounded-full mt-3 overflow-hidden"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
