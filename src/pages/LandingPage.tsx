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
      <div className="card p-8 md:p-10 h-full flex flex-col items-center text-center group bg-[var(--surface-2)] border-2 border-[var(--border)] hover:border-[var(--accent)] transition-all duration-300">
        <div className="w-20 h-20 rounded-3xl bg-[var(--accent-soft)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-soft">
          <Icon className="w-9 h-9 text-[var(--accent)]" />
        </div>
        <h3 className="text-[22px] font-bold text-ink mb-3 font-headline tracking-tight">{step.label}</h3>
        <p className="text-[15px] text-ink-secondary leading-relaxed">{step.desc}</p>
      </div>
      {index < JOURNEY_STEPS.length - 1 && (
        <div className="hidden lg:block absolute top-1/2 -right-4 translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-8 h-[2px] bg-[var(--border)] relative">
            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 rounded-full bg-[var(--accent)]" />
          </div>
        </div>
      )}
    </motion.div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block font-mono text-[11px] text-[var(--accent)] font-bold uppercase tracking-[0.2em] mb-4 bg-[var(--accent-soft)] px-3 py-1 rounded-md">
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
    <div className="pb-24 animate-fade-in overflow-x-hidden">

      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section id="hero" className="relative min-h-[90vh] flex items-center justify-center py-20 overflow-hidden bg-[var(--bg)]">
        <SpectraNoise className="opacity-40" />
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(var(--accent-rgb),0.2),transparent_70%)] blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-[-10%] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(var(--accent-rgb),0.1),transparent_70%)] blur-3xl" />
        </div>

        <div className="relative max-w-[1200px] mx-auto text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-[var(--surface)] border-2 border-[var(--border)] mb-12 shadow-lift"
          >
            <Terminal className="w-4 h-4 text-[var(--accent)]" />
            <span className="font-mono text-[14px] text-ink-secondary tracking-tight font-bold">
              lastlook run --before-submit
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[clamp(3.5rem,10vw,8rem)] font-black tracking-tighter text-ink leading-[0.9] mb-8 font-display uppercase"
          >
            The final check<br className="hidden sm:block" />
            <span className="text-[var(--accent)]"> before you submit.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-[clamp(1.1rem,2.5vw,1.5rem)] text-ink-secondary leading-[1.6] mb-12 max-w-3xl mx-auto font-medium"
          >
            Turn any application brief into a checklist, let reviewer agents inspect your answers, and leave with a readiness dashboard before you send it.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <button id="btn-load-demo" onClick={handleStart} className="btn-primary text-[18px] px-10 py-5 rounded-2xl shadow-lift hover:scale-105 transition-transform">
              <Zap className="w-[20px] h-[20px]" />
              Start a review
            </button>
            <button onClick={handleWalkthrough} className="btn-secondary text-[18px] px-10 py-5 rounded-2xl border-2 hover:bg-[var(--surface-2)] transition-colors">
              Try sample
              <ArrowRight className="w-[20px] h-[20px]" />
            </button>
          </motion.div>

          {/* Journey Strip Animation Placeholder */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="w-full max-w-4xl mx-auto h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent relative"
          >
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-3 h-3 rounded-full bg-[var(--accent)] blur-[2px] animate-[move_5s_linear_infinite]" />
          </motion.div>
        </div>
      </section>

      {/* ─── SUBMISSION JOURNEY ───────────────────────────────────── */}
      <section className="py-32 px-6 bg-[var(--surface)]">
        <div className="max-w-[1300px] mx-auto">
          <div className="text-center mb-20">
            <SectionLabel>Your submission journey</SectionLabel>
            <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black text-ink font-headline uppercase tracking-tighter leading-none">
              From brief to packet.
            </h2>
            <p className="text-[18px] text-ink-secondary mt-6 max-w-2xl mx-auto font-medium">
              Five stages. One bold flow. No more submitting blind.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-8">
            {JOURNEY_STEPS.map((step, i) => (
              <JourneyCard key={step.label} step={step} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── THINGS THAT KILL APPLICATIONS ────────────────────────── */}
      <section className="py-32 px-6 bg-[var(--bg)]">
        <div className="max-w-[1300px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <SectionLabel>Application Risks</SectionLabel>
              <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black text-ink font-headline leading-[0.95] mb-8 uppercase tracking-tighter">
                Things that kill<br />applications.
              </h2>
              <p className="text-[18px] text-ink-secondary mb-10 leading-relaxed font-medium">
                Reviewers look for reasons to say no. We give them reasons to say yes.
              </p>
              <button onClick={handleStart} className="btn-primary px-8 py-4 rounded-xl">
                Protect your submission
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PROBLEMS.map((prob, i) => (
                <XRayCard key={prob.title} className="p-6 border-2 border-[var(--border)] hover:border-[var(--danger)] transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 p-2 rounded-lg bg-[var(--danger-soft)]">
                      <prob.icon className="w-5 h-5 text-[var(--danger)]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-ink mb-2 text-[16px]">{prob.title}</h4>
                      <p className="text-[13px] text-ink-secondary leading-relaxed">{prob.desc}</p>
                    </div>
                  </div>
                </XRayCard>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── REVIEWER LINEUP ──────────────────────────────────────── */}
      <section className="py-32 px-6 bg-[var(--surface-3)]">
        <div className="max-w-[1300px] mx-auto">
          <div className="text-center mb-20">
            <SectionLabel>The Reviewer Panel</SectionLabel>
            <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black text-ink font-headline uppercase tracking-tighter leading-none">
              Your Review Lineup.
            </h2>
            <p className="text-[18px] text-ink-secondary mt-6 max-w-2xl mx-auto font-medium">
              Seven specialist agents inspecting every angle of your application.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {AGENTS.map((agent, i) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card p-8 bg-[var(--surface)] border-2 border-[var(--border)] group hover:border-[var(--accent)] transition-all"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                    <agent.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-ink-muted bg-[var(--bg)] px-2 py-1 rounded">
                    {agent.specialty}
                  </span>
                </div>
                <h3 className="text-[20px] font-bold text-ink mb-3">{agent.name}</h3>
                <p className="text-[14px] text-ink-secondary leading-relaxed">{agent.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PREPARE YOUR SUBMISSION ─────────────────────────────── */}
      <section className="py-32 px-6 bg-[var(--surface)]">
        <div className="max-w-[1300px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-2xl">
              <SectionLabel>Practical Prep</SectionLabel>
              <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black text-ink font-headline uppercase tracking-tighter leading-none">
                Prepare your<br />submission.
              </h2>
            </div>
            <p className="text-[18px] text-ink-secondary font-medium md:text-right">
              Don't leave your best work to chance.<br />Build a foundation that wins.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PREP_CARDS.map((card, i) => (
              <div key={card.title} className="p-8 rounded-3xl bg-[var(--surface-2)] border-2 border-[var(--border)] hover:bg-[var(--bg)] transition-all cursor-default group">
                <card.icon className="w-10 h-10 text-[var(--accent)] mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-[20px] font-bold text-ink mb-3">{card.title}</h3>
                <p className="text-[15px] text-ink-secondary leading-relaxed mb-6">{card.desc}</p>
                <button className="text-[var(--accent)] font-bold flex items-center gap-2 text-[14px] uppercase tracking-wider">
                  Learn more <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ────────────────────────────────────────────── */}
      <section className="py-40 px-6 relative overflow-hidden bg-[var(--accent)]">
        <div className="absolute inset-0 opacity-20">
          <SpectraNoise />
        </div>
        <div className="relative max-w-[1000px] mx-auto text-center">
          <h2 className="text-[clamp(3rem,8vw,7rem)] font-black text-white font-headline uppercase tracking-tighter leading-[0.85] mb-12">
            Run your LastLook<br />before you submit.
          </h2>
          <button onClick={handleStart} className="bg-white text-[var(--accent)] text-[20px] font-black px-12 py-6 rounded-2xl shadow-lift hover:scale-105 transition-transform uppercase tracking-tight">
            Start your review now
          </button>
        </div>
      </section>
      
      <style>{`
        @keyframes move {
          0% { left: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
