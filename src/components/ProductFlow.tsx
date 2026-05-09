import { motion } from 'framer-motion';
import { ClipboardList, Brain, ScanSearch, FileCheck, Sparkles } from 'lucide-react';

interface FlowStep {
  label: string;
  sublabel: string;
  icon: React.ElementType;
  accent: string;
  description: string;
}

const STEPS: FlowStep[] = [
  { 
    label: 'Brief', 
    sublabel: 'Paste your brief', 
    icon: ClipboardList, 
    accent: 'var(--accent)',
    description: 'Your application requirements, all in one place'
  },
  { 
    label: 'Agents', 
    sublabel: '6 specialist reviewers', 
    icon: Brain, 
    accent: 'var(--accent)',
    description: 'Requirement, Fit, Clarity, Length, Voice, Risk'
  },
  { 
    label: 'Dashboard', 
    sublabel: 'Readiness score', 
    icon: ScanSearch, 
    accent: 'var(--success)',
    description: 'Score, verdict, next best edit, fix plan'
  },
  { 
    label: 'Packet', 
    sublabel: 'Export & submit', 
    icon: FileCheck, 
    accent: 'var(--accent)',
    description: 'All answers, requirements, submission checklist'
  },
];

export default function ProductFlow() {
  const stepVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.15,
        duration: 0.5,
        ease: [0.25, 0.4, 0.25, 1] as const,
      },
    }),
  };

  const lineVariants = {
    hidden: { scaleX: 0 },
    visible: {
      scaleX: 1,
      transition: {
        delay: 0.6,
        duration: 0.8,
        ease: [0.25, 0.4, 0.25, 1] as const,
      },
    },
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto">
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        initial="hidden"
        animate="visible"
      >
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.label}
              custom={i}
              variants={stepVariants}
              className="relative"
            >
              <div className="group">
                <div className="card p-5 sm:p-6 text-center h-full flex flex-col items-center gap-3 relative overflow-hidden">
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle at center, ${step.accent}08 0%, transparent 70%)`,
                    }}
                  />
                  
                  <div className="relative z-10">
                    <motion.div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2"
                      style={{ 
                        background: `color-mix(in srgb, ${step.accent} 12%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${step.accent} 20%, transparent)`,
                        boxShadow: `0 0 20px color-mix(in srgb, ${step.accent} 15%, transparent)`,
                      }}
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      <Icon className="w-6 h-6" style={{ color: step.accent }} />
                    </motion.div>
                    
                    <div className="font-bold text-[15px] text-ink">{step.label}</div>
                    <div className="text-[11px] text-ink-muted mt-1">{step.sublabel}</div>
                  </div>

                  <p className="text-[11px] text-ink-secondary leading-relaxed mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {step.description}
                  </p>
                </div>

                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 z-20">
                    <motion.div 
                      className="relative"
                      initial="hidden"
                      animate="visible"
                      variants={lineVariants}
                    >
                      <div className="flex items-center">
                        <motion.div 
                          className="w-8 h-0.5 rounded-full"
                          style={{ 
                            background: 'linear-gradient(90deg, var(--accent), var(--success))',
                            boxShadow: '0 0 8px var(--accent)',
                          }}
                        />
                        <motion.div
                          className="w-2 h-2 rounded-full"
                          style={{ 
                            background: 'var(--accent)',
                            boxShadow: '0 0 10px var(--accent)',
                          }}
                          animate={{ 
                            boxShadow: ['0 0 10px var(--accent)', '0 0 20px var(--accent)', '0 0 10px var(--accent)']
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </div>
                    </motion.div>
                  </div>
                )}
              </div>

              {i === STEPS.length - 1 && (
                <motion.div
                  className="absolute -right-2 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-2"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 }}
                >
                  <div className="px-3 py-1.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-[10px] font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    Ready
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div 
        className="mt-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <p className="text-[13px] text-ink-secondary">
          From chaos to confidence in minutes — not hours.
        </p>
      </motion.div>
    </div>
  );
}