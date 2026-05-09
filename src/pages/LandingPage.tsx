import { useNavigate } from 'react-router-dom';
import { Brain, ClipboardList, ScanSearch, AlertTriangle, FileCheck, Clock } from 'lucide-react';
import Hero from '../components/Hero';
import { getSessionUser } from '../lib/auth';
import AnimatedSection from '../components/motion/AnimatedSection';
import StaggeredReveal from '../components/motion/StaggeredReveal';
import XRayCard from '../components/motion/XRayCard';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleStart = async () => {
    const user = await getSessionUser();
    if (user) navigate('/app');
    else navigate('/auth');
  };

  const handleWalkthrough = () => {
    navigate('/walkthrough');
  };

  const workflow = [
    { num: '01', title: 'Brief', desc: 'Turn briefs into checklists', meta: 'Input', icon: ClipboardList },
    { num: '02', title: 'Reviewer Agents', desc: 'Specialist review panel', meta: 'Review', icon: Brain },
    { num: '03', title: 'Readiness Dashboard', desc: 'Decision-first summary', meta: 'Decide', icon: ScanSearch },
  ];

  return (
    <div className="pb-20 pt-8 md:pt-12 animate-fade-in">
      <Hero onPrimary={handleStart} onSecondary={handleWalkthrough} />

      <AnimatedSection id="how-it-works" className="mb-16 md:mb-20">
        <div className="rounded-3xl border border-edge bg-surface p-6 sm:p-8 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">workflow preview</span>
              <h2 className="text-[20px] sm:text-[24px] font-semibold text-ink mt-2">Brief to reviewers to readiness.</h2>
              <p className="text-[13px] text-ink-secondary mt-2">Get a decision-first dashboard, not a generic report.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-[12px] text-ink-secondary">
              {['Reviewer panel', 'Decision-first', 'Real dashboard'].map((chip) => (
                <span key={chip} className="px-2.5 py-1 rounded-full border border-edge bg-surface-muted">{chip}</span>
              ))}
            </div>
          </div>
          <StaggeredReveal className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {workflow.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.num} className="rounded-2xl border border-edge bg-surface-muted p-4 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-yc-soft flex items-center justify-center">
                        <Icon className="w-4 h-4 text-yc" />
                      </div>
                      <span className="text-[13px] font-semibold text-ink">{step.title}</span>
                    </div>
                    <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">{step.num}</span>
                  </div>
                  <p className="text-[13px] text-ink-secondary">{step.desc}</p>
                  <span className="mt-3 inline-flex text-[10px] font-mono uppercase tracking-widest text-ink-muted">{step.meta}</span>
                </div>
              );
            })}
          </StaggeredReveal>
        </div>
      </AnimatedSection>

      <AnimatedSection id="why" className="mb-20">
        <div className="text-center mb-8">
          <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">what lastlook protects you from</span>
          <h2 className="text-[clamp(1.6rem,3vw,2.2rem)] font-semibold text-ink mt-2 max-w-2xl mx-auto">
            Most tools help you write. LastLook helps you decide if it's ready.
          </h2>
        </div>
        <StaggeredReveal className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: AlertTriangle, title: 'Missed requirements', desc: 'The brief asks for a public link. You forgot to include it.' },
            { icon: FileCheck, title: 'Generic answers', desc: '"I want to learn from smart people" applies to every program.' },
            { icon: Clock, title: 'Wrong length or timing', desc: 'Your 60-second script is 15 seconds long.' },
          ].map(({ icon: Icon, title, desc }) => (
            <XRayCard key={title} className="rounded-2xl border border-edge bg-surface p-6 shadow-soft">
              <div className="w-10 h-10 rounded-xl bg-err-soft flex items-center justify-center mb-3"><Icon className="w-5 h-5 text-err" /></div>
              <h3 className="text-[15px] font-semibold text-ink mb-1.5">{title}</h3>
              <p className="text-[13px] text-ink-secondary leading-relaxed">{desc}</p>
            </XRayCard>
          ))}
        </StaggeredReveal>
      </AnimatedSection>

      <AnimatedSection className="mb-20">
        <div className="text-center mb-8">
          <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">reviewer agents</span>
          <h2 className="text-[clamp(1.6rem,3vw,2.2rem)] font-semibold text-ink mt-2 max-w-2xl mx-auto">
            A specialist panel, not a single generic grader.
          </h2>
        </div>
        <StaggeredReveal className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { title: 'Requirement Reviewer', desc: 'Confirms every explicit requirement is answered.' },
            { title: 'Fit Reviewer', desc: 'Checks opportunity alignment and motivation.' },
            { title: 'Clarity Reviewer', desc: 'Ensures structure, specificity, and plain language.' },
            { title: 'Length Reviewer', desc: 'Validates word count and speaking time.' },
            { title: 'Voice Reviewer', desc: 'Checks tone consistency with saved memory.' },
            { title: 'Risk Reviewer', desc: 'Flags blockers and missing assets.' },
          ].map((agent) => (
            <XRayCard key={agent.title} className="rounded-2xl border border-edge bg-surface p-6 shadow-soft">
              <h3 className="text-[15px] font-semibold text-ink mb-1.5">{agent.title}</h3>
              <p className="text-[13px] text-ink-secondary leading-relaxed">{agent.desc}</p>
            </XRayCard>
          ))}
        </StaggeredReveal>
      </AnimatedSection>

      <AnimatedSection className="mb-24">
        <div className="rounded-3xl border border-edge bg-surface p-8 sm:p-10 shadow-soft">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">use it before you send anything important</span>
              <h3 className="text-[clamp(1.5rem,2.8vw,2rem)] font-semibold text-ink mt-3">A calm review desk for high-stakes submissions.</h3>
              <p className="text-[14px] text-ink-secondary leading-relaxed mt-3 max-w-xl">
                Run LastLook right before you submit applications, scholarships, fellowship essays, grants, and video scripts.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={handleStart} className="inline-flex items-center justify-center px-6 py-3 bg-yc hover:bg-yc-hover text-[var(--button-text)] text-[14px] font-semibold rounded-xl shadow-soft transition-all duration-200">
                Start a review
              </button>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}
