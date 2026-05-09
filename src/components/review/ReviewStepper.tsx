import { motion } from 'framer-motion';

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
    <div className="rounded-2xl border border-edge bg-surface p-4 sm:p-5 shadow-soft">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {steps.map((step, idx) => {
          const isActive = idx === activeStep;
          const isDone = idx < activeStep;
          return (
            <div key={step.title} className="flex items-start gap-3">
              <div className="mt-0.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-[12px] font-semibold ${
                    isDone
                      ? 'bg-ok-soft text-ok'
                      : isActive
                      ? 'bg-yc-soft text-yc'
                      : 'bg-surface-muted text-ink-muted'
                  }`}
                >
                  {idx + 1}
                </div>
              </div>
              <div>
                <div className={`text-[13px] font-semibold ${isActive ? 'text-ink' : 'text-ink-secondary'}`}>
                  {step.title}
                </div>
                <div className="text-[12px] text-ink-muted">{step.description}</div>
                {isActive && (
                  <motion.div
                    className="h-1 bg-yc/30 rounded-full mt-2 overflow-hidden"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.6 }}
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
