import type { HTMLAttributes } from 'react';

interface Props extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export default function SpectraNoise({ className = '', ...rest }: Props) {
  return (
    <div
      aria-hidden
      className={`spectra-noise pointer-events-none absolute inset-0 ${className}`}
      {...rest}
    />
  );
}
