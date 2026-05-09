import { useNavigate } from 'react-router-dom';
import {
  Zap, ArrowRight,
  AlertTriangle, Clock, Shield, MessageSquare, Clock3, Volume2,
  AlertOctagon, Terminal, Sparkles,
  CheckCircle2, Layers
} from 'lucide-react';
import { getSessionUser } from '../lib/auth';
import AnimatedSection from '../components/motion/AnimatedSection';
import StaggeredReveal from '../components/motion/StaggeredReveal';
import XRayCard from '../components/motion/XRayCard';
import SpectraNoise from '../components/motion/SpectraNoise';
import ProductFlow from '../components/ProductFlow';

const AGENTS = [
  { name: 'Requirement Reviewer', specialty: 'Completeness', desc: 'Confirms every explicit requirement from the brief is addressed, with zero missed checkboxes.', icon: CheckCircle2 },
  { name: 'Fit Reviewer', specialty: 'Alignment', desc: 'Checks opportunity alignment, motivation specificity, and whether your "why" lands.', icon: Sparkles },
  { name: 'Clarity Reviewer', specialty: 'Communication', desc: 'Ensures structure, plain language, and that reviewers walk away knowing exactly what you mean.', icon: MessageSquare },
  { name: 'Length Reviewer', specialty: 'Format', desc: 'Validates word count, speaking time, and that your format matches what was asked for.', icon: Clock3 },
  { name: 'Voice Reviewer', specialty: 'Consistency', desc: 'Checks tone consistency with your saved memory — no whiplash between paragraphs.', icon: Volume2 },
  { name: 'Risk Reviewer', specialty: 'Blockers', desc: 'Flags application blockers: missing assets, broken links, conflicting dates, and red flags.', icon: AlertOctagon },
];

const PROBLEMS = [
  { icon: AlertTriangle, title: 'You missed a requirement.', desc: 'The brief asks for a portfolio link. You forgot to include it. Someone notices.' },
  { icon: MessageSquare, title: 'Your answers sound generic.', desc: '"I want to learn from smart people" applies to every program on earth. The reviewer knows.' },
  { icon: Clock, title: 'Your video is the wrong length.', desc: 'Your 60-second script renders at 15 seconds. The upload timer has already started.' },
  { icon: Layers, title: 'You submitted in the wrong order.', desc: 'The checklist had priority hints. You answered chronologically and hit blockers late.' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  const handleStart = async () => {
    const user = await getSessionUser();
    if (user) navigate('/app');
    else navigate('/auth');
  };

  const handleWalkthrough = () => navigate('/walkthrough');

  return (
    <div className="pb-24 pt-6 md:pt-8 animate-fade-in">

      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <AnimatedSection
        id="hero"
        className="relative py-20 md:py-32 overflow-hidden"
      >
        <SpectraNoise className="opacity-60" />

        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(var(--accent-rgb),0.16),transparent_70%)] blur-3xl animate-pulse" />
          <div className="absolute top-32 right-[-10%] h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,rgba(var(--accent-rgb),0.08),transparent_70%)] blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        </div>

        <div className="relative max-w-[820px] mx-auto text-center px-4">

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-edge mb-10 shadow-soft">
            <Terminal className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="font-mono text-[12px] sm:text-[13px] text-ink-secondary tracking-tight">
              lastlook run --before-submit
            </span>
          </div>

          <h1 className="text-[clamp(2.8rem,8vw,6rem)] font-extrabold tracking-tight text-ink leading-[1.02] mb-6 font-display">
            The final check<br className="hidden sm:block" />
            <span className="text-[var(--accent)]"> before you submit.</span>
          </h1>

          <p className="text-[clamp(1.05rem,2vw,1.2rem)] text-ink-secondary leading-[1.75] mb-6 max-w-2xl mx-auto">
            Turn any application brief into a checklist. Let six specialist reviewer agents inspect your answers. Leave with a readiness dashboard before you send it.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <button
              id="btn-load-demo"
              onClick={handleStart}
              className="btn-primary text-[15px] px-8 py-3.5"
            >
              <Zap className="w-[17px] h-[17px]" />
              Start a review
            </button>
            <button
              id="btn-start-memory"
              onClick={handleWalkthrough}
              className="btn-secondary text-[15px] px-8 py-3.5"
            >
              Try sample
              <ArrowRight className="w-[17px] h-[17px]" />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {['Reviewer agents', 'Readiness dashboard', 'Application packets', 'Local / BYOK'].map((chip) => (
              <span key={chip} className="px-3 py-1.5 rounded-full border border-edge bg-surface text-[12px] font-medium text-ink-secondary">
                {chip}
              </span>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ─── PRODUCT STORY ────────────────────────────────────────── */}
      <AnimatedSection className="mb-20 md:mb-28 px-4">
        <div className="max-w-[960px] mx-auto">
          <div className="text-center mb-12">
            <span className="font-mono-tel text-[10px] text-ink-muted">workflow</span>
            <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] font-bold text-ink mt-3 font-headline">
              Brief → Reviewers → Ready.
            </h2>
            <p className="text-[14px] text-ink-secondary mt-2 max-w-xl mx-auto">
              Four steps from chaos to confidence.
            </p>
          </div>

          <ProductFlow />
        </div>
      </AnimatedSection>

      {/* ─── WHY IT MATTERS ───────────────────────────────────────── */}
      <AnimatedSection className="mb-20 md:mb-28 px-4">
        <div className="max-w-[960px] mx-auto">
          <div className="text-center mb-12">
            <span className="font-mono-tel text-[10px] text-ink-muted">what lastlook protects you from</span>
            <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] font-bold text-ink mt-3 font-headline">
              Things that kill applications.
            </h2>
            <p className="text-[14px] text-ink-secondary mt-2 max-w-xl mx-auto">
              The gaps that are obvious in hindsight — and easy to fix before submission.
            </p>
          </div>

          <StaggeredReveal className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PROBLEMS.map(({ icon: Icon, title, desc }) => (
              <XRayCard
                key={title}
                className="card p-6 flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--danger-soft)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-5 h-5 text-[var(--danger)]" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-ink mb-1">{title}</h3>
                  <p className="text-[13px] text-ink-secondary leading-relaxed">{desc}</p>
                </div>
              </XRayCard>
            ))}
          </StaggeredReveal>
        </div>
      </AnimatedSection>

      {/* ─── REVIEWER AGENTS ───────────────────────────────────────── */}
      <AnimatedSection className="mb-20 md:mb-28 px-4">
        <div className="max-w-[960px] mx-auto">
          <div className="text-center mb-12">
            <span className="font-mono-tel text-[10px] text-ink-muted">reviewer agents</span>
            <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] font-bold text-ink mt-3 font-headline">
              A specialist panel, not a single grader.
            </h2>
            <p className="text-[14px] text-ink-secondary mt-2 max-w-xl mx-auto">
              Six agents, each with a focused specialty. Together, they cover every dimension that matters.
            </p>
          </div>

          <StaggeredReveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AGENTS.map(({ name, specialty, desc, icon: Icon }) => (
              <XRayCard
                key={name}
                className="card p-6 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--accent)] group-hover:text-white transition-all duration-300">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mt-1">{specialty}</span>
                </div>
                <h3 className="text-[14px] font-bold text-ink mb-1 font-mono tracking-tight">{name}</h3>
                <p className="text-[12px] text-ink-secondary leading-relaxed">{desc}</p>
              </XRayCard>
            ))}
          </StaggeredReveal>
        </div>
      </AnimatedSection>

      {/* ─── FINAL CTA ─────────────────────────────────────────────── */}
      <AnimatedSection className="px-4 mb-16">
        <div className="max-w-[960px] mx-auto">
          <div className="relative rounded-3xl overflow-hidden border border-edge shadow-soft">
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <SpectraNoise className="opacity-30" />
              <div className="absolute -top-24 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(var(--accent-rgb),0.12),transparent_70%)] blur-3xl" />
            </div>

            <div className="relative p-10 sm:p-14 md:p-16 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--accent-soft)] mb-6">
                <Shield className="w-7 h-7 text-[var(--accent)]" />
              </div>

              <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-extrabold text-ink font-display leading-tight mb-4">
                Run your LastLook<br className="hidden sm:block" /> before you submit.
              </h2>

              <p className="text-[14px] sm:text-[15px] text-ink-secondary leading-relaxed mb-8 max-w-lg mx-auto">
                Applications, fellowships, grants, video scripts — anything where the brief matters and the stakes are real.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleStart}
                  className="btn-primary text-[15px] px-8 py-3.5"
                >
                  <Zap className="w-[17px] h-[17px]" />
                  Start a review
                </button>
                <button
                  onClick={handleWalkthrough}
                  className="btn-ghost text-[14px] px-6 py-3"
                >
                  <Sparkles className="w-[14px] h-[14px]" />
                  View walkthrough
                </button>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}
