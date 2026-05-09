import type { ReactNode, CSSProperties } from 'react';

interface DeadlinePulseProps {
  urgency: 'normal' | 'fast' | 'emergency';
  children: ReactNode;
}

const pulseColors = {
  normal: 'var(--accent)',
  fast: 'var(--warning)',
  emergency: 'var(--danger)',
};

const keyframes = {
  normal: `
@keyframes pulse-normal {
  0%, 100% { border-color: var(--accent); opacity: 0.4; }
  50% { border-color: var(--accent); opacity: 0.8; }
}
`,
  fast: `
@keyframes pulse-fast {
  0%, 100% { border-color: var(--warning); opacity: 0.5; }
  50% { border-color: var(--warning); opacity: 1; }
}
`,
  emergency: `
@keyframes pulse-emergency {
  0%, 100% { border-color: var(--danger); opacity: 0.6; box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
  50% { border-color: var(--danger); opacity: 1; box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.15); }
}
`,
};

const styleId = 'deadline-pulse-styles';

if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const styleEl = document.createElement('style');
  styleEl.id = styleId;
  styleEl.textContent = Object.values(keyframes).join('\n');
  document.head.appendChild(styleEl);
}

export default function DeadlinePulse({ urgency, children }: DeadlinePulseProps) {
  const isAnimated = urgency !== 'normal';

  const style: CSSProperties = {
    '--pulse-color': pulseColors[urgency],
  } as CSSProperties;

  const animation =
    urgency === 'emergency'
      ? 'pulse-emergency 1.4s ease-in-out infinite'
      : urgency === 'fast'
      ? 'pulse-fast 1.8s ease-in-out infinite'
      : 'pulse-normal 2.2s ease-in-out infinite';

  return (
    <div
      className="relative rounded-xl border transition-colors"
      style={{
        ...style,
        borderColor: isAnimated ? pulseColors[urgency] : 'var(--border)',
        borderWidth: isAnimated ? '1px' : '1px',
        animation: isAnimated ? `${animation} ${animation}` : undefined,
        background: 'var(--surface)',
      }}
    >
      {isAnimated && (
        <style>
          {keyframes[urgency]}
        </style>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}