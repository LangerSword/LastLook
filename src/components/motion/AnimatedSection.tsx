import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';

type AnimatedSectionProps = HTMLMotionProps<'section'> & {
  children: ReactNode;
  delay?: number;
};

export default function AnimatedSection({
  children,
  className,
  delay = 0,
  ...motionProps
}: AnimatedSectionProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.section
      className={className}
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 14 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={shouldReduceMotion ? undefined : { duration: 0.5, ease: 'easeOut', delay }}
      {...motionProps}
    >
      {children}
    </motion.section>
  );
}
