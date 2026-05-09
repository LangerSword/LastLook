import { motion, useMotionTemplate, useMotionValue, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode, MouseEvent } from 'react';
import { useRef } from 'react';

type XRayCardProps = HTMLMotionProps<'div'> & {
  children: ReactNode;
  glow?: boolean;
};

export default function XRayCard({
  children,
  className = '',
  glow = true,
  ...motionProps
}: XRayCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const { onMouseMove, onMouseLeave, ...restMotionProps } = motionProps;

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - rect.left);
    y.set(event.clientY - rect.top);
    if (onMouseMove) onMouseMove(event);
  };

  const handleMouseLeave = (event: MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    x.set(rect.width / 2);
    y.set(rect.height / 2);
    if (onMouseLeave) onMouseLeave(event);
  };

  const glowBg = useMotionTemplate`radial-gradient(220px at ${x}px ${y}px, rgb(var(--accent-rgb) / 0.18), transparent 60%)`;

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              y: -4,
              boxShadow: '0 18px 50px var(--shadow)',
            }
      }
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={`relative ${className}`}
      {...restMotionProps}
    >
      {glow && !shouldReduceMotion && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{ background: glowBg, opacity: 0.85 }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
