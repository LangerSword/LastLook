import { animate, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface Props {
  value: number;
  className?: string;
  duration?: number;
}

export default function ScoreReveal({ value, className = '', duration = 0.9 }: Props) {
  const shouldReduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplay(value);
      previous.current = value;
      return;
    }

    const controls = animate(previous.current, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });

    previous.current = value;
    return () => controls.stop();
  }, [value, duration, shouldReduceMotion]);

  return <span className={className}>{display}</span>;
}
