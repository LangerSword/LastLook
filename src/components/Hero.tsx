import { Zap, ArrowRight } from 'lucide-react';
import AnimatedSection from './motion/AnimatedSection';
import SpectraNoise from './motion/SpectraNoise';

interface HeroProps {
  onPrimary: () => void;
  onSecondary: () => void;
}

export default function Hero({ onPrimary, onSecondary }: HeroProps) {
  const trust = ['Local-first', 'No account', 'Built for deadlines', 'Browser memory'];
  return (
    <AnimatedSection id="hero" className="relative py-16 md:py-24 overflow-hidden">
      <SpectraNoise className="opacity-70" />
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgb(var(--accent-rgb)/0.18),transparent_70%)] blur-3xl" />
      </div>
      <div className="relative max-w-[760px] mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-muted border border-edge mb-8">
          <span className="font-mono text-[11px] text-ink-secondary">&gt; lastlook check --before-submit</span>
        </div>

        <h1 className="text-[clamp(2.7rem,7vw,5.5rem)] font-extrabold tracking-tight text-ink leading-[1.02] mb-5">
          The final check<br className="hidden sm:block" /> before you submit.
        </h1>

        <p className="text-[clamp(1.05rem,2.2vw,1.25rem)] text-ink-secondary leading-[1.7] mb-4 max-w-2xl mx-auto">
          LastLook turns application briefs into checklists, reviews your answer with specialist reviewer agents, and gives you a readiness dashboard before you send it.
        </p>
        <p className="text-sm font-semibold text-ink mb-7">Ship fast. Decide with evidence.</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <button id="btn-load-demo" onClick={onPrimary}
            className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-yc hover:bg-yc-hover text-[var(--button-text)] font-semibold rounded-xl w-full sm:w-auto
              shadow-sm transition-all duration-200 cursor-pointer text-[15px]">
            <Zap className="w-[18px] h-[18px]" /> Start a review
          </button>
          <button id="btn-start-memory" onClick={onSecondary}
            className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-surface hover:bg-surface-muted text-ink font-semibold w-full sm:w-auto
              rounded-xl border border-edge transition-all duration-200 cursor-pointer text-[15px]">
            View walkthrough <ArrowRight className="w-[18px] h-[18px]" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 text-[12px] text-ink-secondary">
          {trust.map((item) => (
            <span key={item} className="px-3 py-1 rounded-full border border-edge bg-surface-muted">
              {item}
            </span>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
