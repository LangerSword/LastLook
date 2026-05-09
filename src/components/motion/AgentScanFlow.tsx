import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Scan, UserCheck } from 'lucide-react';

interface AgentScanFlowProps {
  brief?: string;
  isScanning?: boolean;
  completedAgents?: number;
}

const AGENT_COUNT = 6;

const AGENT_LABELS = [
  'Relevance',
  'Clarity',
  'Bias',
  'Depth',
  'Impact',
  'Edge',
];

const RADIUS = 130;
const CENTER = 160;

function computeAgentPosition(index: number) {
  const angle = (index / AGENT_COUNT) * 360 - 90;
  const rad = (angle * Math.PI) / 180;
  return {
    x: CENTER + Math.cos(rad) * RADIUS,
    y: CENTER + Math.sin(rad) * RADIUS,
  };
}

function AgentNode({
  index,
  isActive,
  isCompleted,
  label,
}: {
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  label: string;
}) {
  const { x, y } = computeAgentPosition(index);
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="absolute flex flex-col items-center gap-1"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
      }}
      initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.6 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: 'backOut' }}
    >
      <motion.div
        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
          isCompleted
            ? 'bg-yc border-yc text-white'
            : isActive
            ? 'border-yc bg-yc/10 text-yc'
            : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-faint)]'
        }`}
        animate={
          isActive && !shouldReduceMotion
            ? {
                boxShadow: [
                  '0 0 8px rgba(255, 90, 31, 0.3)',
                  '0 0 24px rgba(255, 90, 31, 0.6)',
                  '0 0 8px rgba(255, 90, 31, 0.3)',
                ],
              }
            : { boxShadow: '0 0 0px transparent' }
        }
        transition={{ duration: 0.8, repeat: isActive ? Infinity : 0 }}
      >
        <UserCheck className="w-4 h-4" />
      </motion.div>
      <span
        className={`text-[10px] font-mono-tel whitespace-nowrap ${
          isActive || isCompleted ? 'text-yc' : 'text-[var(--text-faint)]'
        }`}
      >
        {label}
      </span>
    </motion.div>
  );
}

export default function AgentScanFlow({
  brief = 'Brief',
  isScanning = false,
  completedAgents = 0,
}: AgentScanFlowProps) {
  const shouldReduceMotion = useReducedMotion();
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isScanning || shouldReduceMotion) return;
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, [isScanning, shouldReduceMotion]);

  const linePairs = Array.from({ length: AGENT_COUNT }, (_, i) => {
    const next = (i + 1) % AGENT_COUNT;
    return { from: computeAgentPosition(i), to: computeAgentPosition(next) };
  });

  return (
    <div className="relative flex flex-col items-center gap-6 py-8">
      <div className="relative" style={{ width: 320, height: 320 }}>
        <svg
          className="absolute inset-0"
          viewBox="0 0 320 320"
          style={{ overflow: 'visible' }}
        >
          {linePairs.map(({ from, to }, i) => {
            const isLit = i < completedAgents;
            return (
              <motion.line
                key={`line-${i}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={isLit ? 'var(--accent)' : 'var(--border)'}
                strokeWidth={isLit ? 1.5 : 1}
                strokeDasharray={isLit ? undefined : '4 4'}
                initial={{ opacity: 0 }}
                animate={{ opacity: isLit ? 0.7 : 0.3 }}
                transition={{ duration: 0.4 }}
              />
            );
          })}
        </svg>

        {Array.from({ length: AGENT_COUNT }).map((_, i) => (
          <AgentNode
            key={`agent-${i}`}
            index={i}
            isActive={isScanning && completedAgents === i + 1}
            isCompleted={completedAgents > i}
            label={AGENT_LABELS[i]}
          />
        ))}

        <motion.div
          className="absolute bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-card)] flex flex-col items-center justify-center gap-2 p-3 overflow-hidden"
          style={{
            width: 112,
            height: 144,
            left: CENTER,
            top: CENTER,
            transform: 'translate(-50%, -50%)',
          }}
          animate={
            isScanning && !shouldReduceMotion
              ? {
                  boxShadow: [
                    'var(--shadow-card)',
                    '0 0 40px rgba(255, 90, 31, 0.25)',
                    'var(--shadow-card)',
                  ],
                }
              : { boxShadow: 'var(--shadow-card)' }
          }
          transition={{ duration: 1.2, repeat: isScanning ? Infinity : 0 }}
        >
          <Scan
            className={`w-5 h-5 ${isScanning ? 'text-yc' : 'text-[var(--text-soft)]'}`}
          />
          <p className="text-[11px] font-mono-tel text-[var(--text-muted)] text-center leading-tight line-clamp-3">
            {brief}
          </p>
          <AnimatePresence>
            {isScanning && (
              <motion.span
                className="text-[10px] text-yc font-mono-tel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                scan{dots}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[11px] font-mono-tel text-[var(--text-soft)]">
          {completedAgents}/{AGENT_COUNT} agents
        </span>
        <div className="flex gap-1">
          {Array.from({ length: AGENT_COUNT }).map((_, i) => (
            <motion.div
              key={`dot-${i}`}
              className={`h-1.5 w-6 rounded-full ${
                i < completedAgents ? 'bg-yc' : 'bg-[var(--border)]'
              }`}
              initial={shouldReduceMotion ? undefined : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: i * 0.06, duration: 0.2 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}