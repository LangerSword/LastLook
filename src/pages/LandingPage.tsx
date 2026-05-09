import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap, ArrowRight, Terminal, Sparkles,
  AlertTriangle, Clock, MessageSquare, Layers, Link2, FileText,
  CheckCircle2, Clock3, Volume2, AlertOctagon, Brain,
  ScanLine, ClipboardCheck, Package, ChevronRight, Save, FolderOpen,
  Play, Rocket
} from 'lucide-react';
import { getSessionUser } from '../lib/auth';
import AnimatedSection from '../components/motion/AnimatedSection';
import StaggeredReveal from '../components/motion/StaggeredReveal';
import XRayCard from '../components/motion/XRayCard';
import SpectraNoise from '../components/motion/SpectraNoise';

const JOURNEY_STEPS = [
  { icon: FileText, label: 'Brief', desc: 'Paste the opportunity.' },
  { icon: Brain, label: 'Memory', desc: 'Bring your saved context.' },
  { icon: ScanLine, label: 'Reviewers', desc: 'Specialist agents inspect the application.' },
  { icon: ClipboardCheck, label: 'Dashboard', desc: 'See what is blocking submission.' },
  { icon: Package, label: 'Packet', desc: 'Export copy-ready answers.' },
];

const PROBLEMS = [
  { icon: AlertTriangle, title: 'Missed requirement', desc: 'The brief asks for a portfolio link. You forgot to include it. Someone notices.' },
  { icon: MessageSquare, title: 'Generic answer', desc: '"I want to learn from smart people" applies to every program on earth. The reviewer knows.' },
  { icon: Clock, title: 'Wrong length', desc: 'Your 60-second script renders at 15 seconds. The upload timer has already started.' },
  { icon: Link2, title: 'Missing public link', desc: 'The brief says "ensure the link is publicly accessible." You did not paste one.' },
  { icon: Layers, title: 'No fix order', desc: 'You have ten things to fix but no idea which one matters most. Time is running out.' },
  { icon: FileText, title: 'Project names without explanation', desc: 'You mention AgentMesh but never say what it does. The reviewer is lost.' },
];

const AGENTS = [
  { name: 'Requirement Reviewer', specialty: 'Completeness', desc: 'Confirms every explicit requirement from the brief is addressed, with zero missed checkboxes.', icon: CheckCircle2 },
  { name: 'Fit Reviewer', specialty: 'Alignment', desc: 'Checks opportunity alignment, motivation specificity, and whether your "why" lands.', icon: Sparkles },
  { name: 'Clarity Reviewer', specialty: 'Communication', desc: 'Ensures structure, plain language, and that reviewers walk away knowing exactly what you mean.', icon: MessageSquare },
  { name: 'Evidence Reviewer', specialty: 'Proof', desc: 'Verifies projects are explained, links are visible, and memory is actually used.', icon: FileText },
  { name: 'Length Reviewer', specialty: 'Format', desc: 'Validates word count, speaking time, and that your format matches what was asked for.', icon: Clock3 },
  { name: 'Voice Reviewer', specialty: 'Consistency', desc: 'Checks tone consistency with your saved memory — no whiplash between paragraphs.', icon: Volume2 },
  { name: 'Risk Reviewer', specialty: 'Blockers', desc: 'Flags application blockers: missing assets, broken links, conflicting dates, and red flags.', icon: AlertOctagon },
];

const PREP_CARDS = [
  { icon: Save, title: 'Save your memory', desc: 'Store your profile, projects, achievements, and links so every review uses them.' },
  { icon: Link2, title: 'Add your links', desc: 'GitHub, portfolio, demo video — keep them in one vault so they never get forgotten.' },
  { icon: FileText, title: 'Build your packet', desc: 'Compile final answers, requirement checklists, and fix plans into one export.' },
  { icon: ClipboardCheck, title: 'Run final check', desc: 'One button. Six agents. A readiness score. Know before you submit.' },
];

const EXPERIENCES = [
  { icon: ScanLine, title: 'Requirement extraction', desc: 'The brief is parsed into a checklist you can check off one by one.' },
  { icon: FileText, title: 'Evidence mapping', desc: 'Your saved projects and achievements are matched against what the brief asks for.' },
  { icon: MessageSquare, title: 'Generic phrase cleanup', desc: 'Filler like "smart people" is flagged and replaced with memory-specific detail.' },
  { icon: FolderOpen, title: 'Project explanation check', desc: 'Named projects are checked to make sure they are explained, not just listed.' },
  { icon: Link2, title: 'Link vault check', desc: 'If the brief wants a link, we check your vault and suggest the right one.' },
  { icon: Play, title: 'Video script timing', desc: 'Word count is converted to speaking time at 145 words per minute.' },
  { icon: Package, title: 'Final packet export', desc: 'Everything compiled into a copy-ready markdown packet with a checklist.' },
];

function JourneyCard({ step, index }: { step: typeof JOURNEY_STEPS[0]; index: number }) {
  const Icon = step.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: index * 0.12 }}
      className="relative"
    >
      <div className="card p-6 md:p-8 h-full flex flex-col items-center text-center group">
        <div className="w-16 h-16 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-7 h-7 text-[var(--accent)]" />
        </div>
        <h3 className="text-[18px] font-bold text-ink mb-2 font-headline">{step.label}</h3>
        <p className="text-[13px] text-ink-secondary leading-relaxed">{step.desc}</p>
      </div>
      {index < JOURNEY_STEPS.length - 1 && (
        <div className="hidden lg:block absolute top-1/2 -right-3 translate-x-1/2 -translate-y-1/2 z-10">
          <ChevronRight className="w-5 h-5 text-ink-faint" />
        </div>
      )}
    </motion.div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block font-mono text-[10px] text-ink-muted uppercase tracking-[0.14em] mb-3">
      {children}
    </span>
  );
}

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
      <AnimatedSection id="hero" className="relative py-20 md:py-32 overflow-hidden">
        <SpectraNoise className="opacity-60" />
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(var(--accent-rgb),0.16),transparent_70%)] blur-3xl animate-pulse" />
          <div className="absolute top-32 right-[-10%] h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,rgba(var(--accent-rgb),0.08),transparent_70%)] blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        </div>

        <div className="relative max-w-[900px] mx-auto text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-edge mb-10 shadow-soft"
          >
            <Terminal className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="font-mono text-[12px] sm:text-[13px] text-ink-secondary tracking-tight">
              lastlook run --before-submit
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[clamp(2.8rem,8vw,6.5rem)] font-extrabold tracking-tight text-ink leading-[1.02] mb-6 font-display"
          >
            The final check<br className="hidden sm:block" />
            <span className="text-[var(--accent)]"> before you submit.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-[clamp(1.05rem,2vw,1.25rem)] text-ink-secondary leading-[1.75] mb-8 max-w-2xl mx-auto"
          >
            Turn any application brief into a checklist, let reviewer agents inspect your answers, and leave with a readiness dashboard before you send it.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center mb-10"
          >
            <button id="btn-load-demo" onClick={handleStart} className="btn-primary text-[15px] px-8 py-3.5">
              <Zap className="w-[17px] h-[17px]" />
              Start a review
            </button>
            <button onClick={handleWalkthrough} className="btn-secondary text-[15px] px-8 py-3.5">
              Try sample
              <ArrowRight className="w-[17px] h-[17px]" />
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="flex flex-wrap items-center justify-center gap-2 sm:gap-3"
          >
            {['Reviewer agents', 'Readiness dashboard', 'Application packets', 'Local / BYOK'].map((chip) => (
              <span key={chip} className="px-3 py-1.5 rounded-full border border-edge bg-surface text-[12px] font-medium text-ink-secondary">
                {chip}
              </span>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ─── SUBMISSION JOURNEY ───────────────────────────────────── */}
      <AnimatedSection className="mb-24 md:mb-32 px-4">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>Your submission journey</SectionLabel>
            <h2 className="text-[clamp(1.8rem,3.5vw,3rem)] font-bold text-ink font-headline">
              From brief to packet.
            </h2>
            <p className="text-[15px] text-ink-secondary mt-3 max-w-lg mx-auto">
              Five stages. One smooth flow. No more submitting blind.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
            {JOURNEY_STEPS.map((step, i) => (
              <JourneyCard key={step.label} step={step} index={i} />
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ─── THINGS THAT KILL APPLICATIONS ────────────────────────── */}
      <AnimatedSection className="mb-24 md:mb-32 px-4">
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <SectionLabel>What lastlook protects you from</SectionLabel>
              <h2 className="text-[clamp(2rem,3.5vw,3.2rem)] font-bold text-ink font-headline leading-tight mb-5">
                Things that kill<br />applications.
              </h2>
              <p className="text-[15px] text-ink-secondary leading-relaxed max-w-md">
                The gaps that are obvious in hindsight — and easy to fix before submission. LastLook catches them while you still have time.
              </p>
            </div>
            <StaggeredReveal className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PROBLEMS.map(({ icon: Icon, title, desc }) => (
                <XRayCard key={title} className="card p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--danger-soft)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-5 h-5 text-[var(--danger)]" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-ink mb-1">{title}</h3>
                    <p className="text-[12px] text-ink-secondary leading-relaxed">{desc}</p>
                  </div>
                </XRayCard>
              ))}
            </StaggeredReveal>
          </div>
        </div>
      </AnimatedSection>

      {/* ─── REVIEWER LINEUP ───────────────────────────────────────── */}
      <AnimatedSection className="mb-24 md:mb-32 px-4">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>Your application review lineup</SectionLabel>
            <h2 className="text-[clamp(1.8rem,3.5vw,3rem)] font-bold text-ink font-headline">
              Seven specialist agents. One mission.
            </h2>
            <p className="text-[15px] text-ink-secondary mt-3 max-w-lg mx-auto">
              Each reviewer focuses on one dimension. Together, they cover every angle that matters.
            </p>
          </div>
          <StaggeredReveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {AGENTS.map(({ name, specialty, desc, icon: Icon }) => (
              <XRayCard key={name} className="card p-6 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--accent)] group-hover:text-white transition-all duration-300">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mt-1">{specialty}</span>
                </div>
                <h3 className="text-[15px] font-bold text-ink mb-2 font-mono tracking-tight">{name}</h3>
                <p className="text-[12px] text-ink-secondary leading-relaxed">{desc}</p>
              </XRayCard>
            ))}
          </StaggeredReveal>
        </div>
      </AnimatedSection>

      {/* ─── PREPARE YOUR SUBMISSION ─────────────────────────────── */}
      <AnimatedSection className="mb-24 md:mb-32 px-4">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>Prepare your submission</SectionLabel>
            <h2 className="text-[clamp(1.8rem,3.5vw,3rem)] font-bold text-ink font-headline">
              Get your materials ready.
            </h2>
            <p className="text-[15px] text-ink-secondary mt-3 max-w-lg mx-auto">
              The best reviews start with good inputs. Save your context once, use it everywhere.
            </p>
          </div>
          <StaggeredReveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PREP_CARDS.map(({ icon: Icon, title, desc }) => (
              <XRayCard key={title} className="card p-7 group">
                <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] border border-edge flex items-center justify-center mb-5 group-hover:border-[var(--accent)]/30 group-hover:shadow-glow transition-all duration-300">
                  <Icon className="w-6 h-6 text-[var(--accent)]" />
                </div>
                <h3 className="text-[16px] font-bold text-ink mb-2 font-headline">{title}</h3>
                <p className="text-[13px] text-ink-secondary leading-relaxed">{desc}</p>
              </XRayCard>
            ))}
          </StaggeredReveal>
        </div>
      </AnimatedSection>

      {/* ─── APPLICATION IMPROVEMENT EXPERIENCES ───────────────────── */}
      <AnimatedSection className="mb-24 md:mb-32 px-4">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>Everything your application goes through</SectionLabel>
            <h2 className="text-[clamp(1.8rem,3.5vw,3rem)] font-bold text-ink font-headline">
              Application improvement experiences.
            </h2>
            <p className="text-[15px] text-ink-secondary mt-3 max-w-lg mx-auto">
              Every step your answer takes on its way from rough draft to submission-ready.
            </p>
          </div>
          <StaggeredReveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {EXPERIENCES.map(({ icon: Icon, title, desc }) => (
              <XRayCard key={title} className="card p-6 flex items-start gap-4 group">
                <div className="w-11 h-11 rounded-xl bg-[var(--surface-2)] border border-edge flex items-center justify-center flex-shrink-0 group-hover:border-[var(--accent)]/30 transition-all duration-300">
                  <Icon className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-ink mb-1">{title}</h3>
                  <p className="text-[12px] text-ink-secondary leading-relaxed">{desc}</p>
                </div>
              </XRayCard>
            ))}
          </StaggeredReveal>
        </div>
      </AnimatedSection>

      {/* ─── APPLICATION PACKET PREVIEW ────────────────────────────── */}
      <AnimatedSection className="mb-24 md:mb-32 px-4">
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <SectionLabel>Application packet</SectionLabel>
              <h2 className="text-[clamp(2rem,3.5vw,3.2rem)] font-bold text-ink font-headline leading-tight mb-5">
                Everything in one<br />exportable packet.
              </h2>
              <p className="text-[15px] text-ink-secondary leading-relaxed max-w-md mb-6">
                When the review is done, you get a copy-ready packet: program name, final answers, requirement checklist, link checklist, next best edit, and export status.
              </p>
              <ul className="space-y-3">
                {['Program name and application type', 'Final answers with requirement checklist', 'Required links and link vault check', 'Next best edit and fix plan', 'Exportable markdown packet'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-[14px] text-ink-secondary">
                    <CheckCircle2 className="w-4 h-4 text-ok flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="card p-6 md:p-8 space-y-5">
                <div className="flex items-center gap-3 pb-5 border-b border-edge">
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center">
                    <Package className="w-5 h-5 text-[var(--accent)]" />
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-ink">Founders Fellowship 2026</div>
                    <div className="text-[11px] text-ink-muted">Fellowship · Ready with minor edits</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-ink-secondary">Readiness score</span>
                    <span className="font-bold text-ink">84/100</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-ink-secondary">Requirements</span>
                    <span className="font-medium text-ok">4/5 covered</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-ink-secondary">Links</span>
                    <span className="font-medium text-warn">1 missing</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-ink-secondary">Next best edit</span>
                    <span className="font-medium text-ink">Add public link</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-edge">
                  <div className="text-[11px] font-mono text-ink-muted uppercase tracking-widest mb-2">Export</div>
                  <div className="flex gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-[var(--surface-2)] border border-edge text-[11px] text-ink-secondary">Markdown</span>
                    <span className="px-2.5 py-1 rounded-lg bg-[var(--surface-2)] border border-edge text-[11px] text-ink-secondary">Copy</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
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
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--accent-soft)] mb-6">
                <Rocket className="w-8 h-8 text-[var(--accent)]" />
              </div>
              <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-extrabold text-ink font-display leading-tight mb-4">
                Run your LastLook<br className="hidden sm:block" /> before you submit.
              </h2>
              <p className="text-[15px] text-ink-secondary leading-relaxed mb-8 max-w-lg mx-auto">
                Applications, fellowships, grants, video scripts — anything where the brief matters and the stakes are real.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={handleStart} className="btn-primary text-[15px] px-8 py-3.5">
                  <Zap className="w-[17px] h-[17px]" />
                  Start your review
                </button>
                <button onClick={handleWalkthrough} className="btn-ghost text-[14px] px-6 py-3">
                  <Sparkles className="w-[14px] h-[14px]" />
                  Try sample
                </button>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}
