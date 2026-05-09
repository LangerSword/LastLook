import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Children, cloneElement } from 'react';

interface StaggeredCardListProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}

export default function StaggeredCardList({
  children,
  staggerDelay = 0.08,
  className = '',
}: StaggeredCardListProps) {
  const shouldReduceMotion = useReducedMotion();
  const childArray = Children.toArray(children);

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {childArray.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{
            duration: 0.45,
            ease: 'easeOut',
            delay: index * staggerDelay,
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}