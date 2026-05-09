import type { ReactNode } from 'react';
import Navigation from '../Navigation';
import type { Theme } from '../../lib/theme';

interface Props {
  theme: Theme;
  onThemeChange: (t: Theme) => void;
  children: ReactNode;
}

export default function MarketingLayout({ theme, onThemeChange, children }: Props) {
  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <Navigation theme={theme} onThemeChange={onThemeChange} />
      <main className="mx-auto w-[min(100%-2rem,1200px)]">{children}</main>
      <footer className="border-t border-edge py-10">
        <div className="mx-auto w-[min(100%-2rem,1200px)] text-center">
          <p className="text-[15px] font-semibold text-ink mb-2">LastLook</p>
          <p className="text-[13px] text-ink-secondary mb-4">
            Built for people shipping applications under deadlines.
          </p>
          <div className="flex justify-center gap-4 text-[12px] text-ink-muted">
            <a href="https://github.com" className="hover:text-ink transition-colors duration-200 cursor-pointer">GitHub</a>
            <span className="text-edge">·</span>
            <a href="/walkthrough" className="hover:text-ink transition-colors duration-200 cursor-pointer">Walkthrough</a>
            <span className="text-edge">·</span>
            <span>Local-first fallback available. No tracking.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
