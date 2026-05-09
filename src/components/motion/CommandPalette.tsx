import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Zap, Play, Download, LayoutDashboard, X } from 'lucide-react';

interface Command {
  icon: typeof Zap;
  label: string;
  shortcut: string;
  onClick: () => void;
}

interface CommandPaletteProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const COMMANDS: Command[] = [
  {
    icon: Zap,
    label: 'Generate answers',
    shortcut: 'G',
    onClick: () => console.log('Generate answers'),
  },
  {
    icon: Play,
    label: 'Run LastLook',
    shortcut: 'R',
    onClick: () => console.log('Run LastLook'),
  },
  {
    icon: Download,
    label: 'Export packet',
    shortcut: 'E',
    onClick: () => console.log('Export packet'),
  },
  {
    icon: LayoutDashboard,
    label: 'Open dashboard',
    shortcut: 'D',
    onClick: () => console.log('Open dashboard'),
  },
];

export default function CommandPalette({ isOpen = true, onClose }: CommandPaletteProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-lift)] p-2 min-w-[220px] flex flex-col gap-1"
            initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.85, y: 12 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.85, y: 12 }}
            transition={{ duration: 0.22, ease: 'backOut' }}
            style={{ backdropFilter: 'blur(16px)' }}
          >
            <div className="flex items-center justify-between px-3 py-2 mb-1">
              <span className="text-[11px] font-mono-tel text-[var(--text-soft)] uppercase tracking-widest">
                Commands
              </span>
              {onClose && (
                <button
                  onClick={onClose}
                  className="w-5 h-5 rounded flex items-center justify-center text-[var(--text-faint)] hover:text-[var(--text-muted)] hover:bg-[var(--surface-muted)] transition-colors"
                  aria-label="Close"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {COMMANDS.map((cmd, idx) => {
              const Icon = cmd.icon;
              return (
                <motion.button
                  key={cmd.label}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--surface-muted)] transition-colors group text-left w-full"
                  initial={shouldReduceMotion ? undefined : { opacity: 0, x: -10 }}
                  animate={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
                  transition={
                    shouldReduceMotion
                      ? undefined
                      : { delay: idx * 0.04, duration: 0.18 }
                  }
                  onClick={cmd.onClick}
                >
                  <div className="w-7 h-7 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center group-hover:bg-yc/20 transition-colors">
                    <Icon className="w-3.5 h-3.5 text-yc" />
                  </div>
                  <span className="text-[13px] text-[var(--text)] font-medium flex-1">
                    {cmd.label}
                  </span>
                  <kbd className="text-[10px] font-mono-tel text-[var(--text-faint)] bg-[var(--surface-muted)] border border-[var(--border)] rounded px-1.5 py-0.5 group-hover:border-[var(--accent)] group-hover:text-yc transition-colors">
                    {cmd.shortcut}
                  </kbd>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        className="w-12 h-12 rounded-full bg-yc text-white flex items-center justify-center shadow-[0_4px_20px_rgba(255,90,31,0.4)] hover:bg-[var(--accent-hover)] active:scale-95 transition-all"
        whileHover={shouldReduceMotion ? {} : { scale: 1.08 }}
        whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
        onClick={onClose ? (isOpen ? onClose : undefined) : undefined}
        aria-label="Command palette"
      >
        <Zap className="w-5 h-5" />
      </motion.button>
    </div>
  );
}