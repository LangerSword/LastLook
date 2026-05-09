import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import { useMemo } from 'react';

interface ReadinessRingProps {
  score: number;
  size?: number;
  label?: string;
  strokeWidth?: number;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--success)';
  if (score >= 60) return 'var(--warning)';
  return 'var(--danger)';
}

export default function ReadinessRing({
  score,
  size = 160,
  label = 'Readiness',
  strokeWidth: strokeWidthProp,
}: ReadinessRingProps) {
  const shouldReduceMotion = useReducedMotion();

  const clampedScore = Math.max(0, Math.min(100, score));
  const color = useMemo(() => getScoreColor(clampedScore), [clampedScore]);

  const strokeWidth = strokeWidthProp ?? Math.max(8, Math.round(size / 20));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;
  const center = size / 2;

  return (
    <motion.div
      className="relative flex flex-col items-center gap-2"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'backOut' }}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={strokeWidth * 0.4}
          />

          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }
            }
          />

          {shouldReduceMotion && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-headline leading-none"
            style={{ fontSize: size * 0.28, color: 'var(--text)' }}
          >
            {clampedScore}
          </span>
        </div>

        {clampedScore >= 80 && (
          <motion.div
            className="absolute inset-4 rounded-full pointer-events-none"
            style={{
              boxShadow: `0 0 24px ${color}`,
              opacity: 0.25,
            }}
            animate={shouldReduceMotion ? {} : { opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
        )}
      </div>

      <span className="text-[11px] font-mono-tel text-[var(--text-muted)] uppercase tracking-widest">
        {label}
      </span>

      <div
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0.5 rounded-full"
        style={{
          width: size * 0.4,
          background: color,
          opacity: 0.4,
        }}
      />
    </motion.div>
  );
}