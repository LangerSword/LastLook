import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Copy, FileText, Download, Zap, Sparkles, AlertTriangle,
  CheckCircle2, Clock, Link2, FileCheck, ArrowRight,
  ShieldCheck, AlertOctagon, Package, TrendingUp, MessageSquare,
  Pencil, Terminal, Layout
} from 'lucide-react';
import { getReviewSessions, type ReviewSession } from '../lib/reviewStore';
import { normalizeReviewSession } from '../lib/reviewNormalizer';
import ReviewerPanel from '../components/review/ReviewerPanel';
import RequirementCoverage from '../components/review/RequirementCoverage';
import FixPlan from '../components/review/FixPlan';
import AnimatedSection from '../components/motion/AnimatedSection';
import ReadinessRing from '../components/motion/ReadinessRing';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block font-mono text-[11px] text-[var(--accent)] font-bold uppercase tracking-[0.2em] mb-4 bg-[var(--accent-soft)] px-3 py-1 rounded-md">
      {children}
    </span>
  );
}

export default function ReviewDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReviewSessions().then((data) => {
      const found = data.find((item) => item.id === id);
      if (found) setSession(found);
      setLoading(false);
    });
  }, [id]);

  const normalized = useMemo(() => (session ? normalizeReviewSession(session) : null), [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--accent)] flex items-center justify-center mx-auto mb-6 shadow-glow animate-bounce">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <p className="text-[16px] font-black uppercase tracking-tighter">Analyzing Readiness...</p>
        </div>
      </div>
    );
  }

  if (!session || !normalized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <h2 className="text-[24px] font-black uppercase tracking-tighter mb-4">Review not found</h2>
          <button onClick={() => navigate('/dashboard')} className="btn-primary px-8 py-3 rounded-xl font-bold">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const report = normalized.readinessReport;
  const summary = normalized.dashboardSummary;

  return (
    <div className="pb-24 animate-fade-in">
      
      {/* ─── COCKPIT HERO ────────────────────────────────────────── */}
      <section className="relative py-16 px-6 bg-[var(--surface)] border-b-2 border-[var(--border)] overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(var(--accent-rgb),0.15),transparent_70%)] blur-3xl -translate-y-1/2 translate-x-1/4" />
        </div>

        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 items-start">
            
            <div className="flex-1 space-y-8">
              <div className="flex items-center gap-4">
                <SectionLabel>Readiness Cockpit</SectionLabel>
                <span className={`px-4 py-1 rounded-full text-[12px] font-black uppercase tracking-widest ${
                  report.score >= 80 ? 'bg-[var(--success-soft)] text-[var(--success)]' : 'bg-[var(--warning-soft)] text-[var(--warning)]'
                }`}>
                  {report.status}
                </span>
              </div>

              <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-black uppercase tracking-tighter text-ink leading-[0.9] font-display">
                {normalized.title}
              </h1>

              <p className="text-[20px] text-ink-secondary font-medium leading-relaxed max-w-3xl">
                {summary.verdict}
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <button className="btn-primary px-8 py-4 rounded-xl shadow-lift flex items-center gap-3">
                  <Download className="w-5 h-5" />
                  <span className="font-bold uppercase tracking-tight">Export Packet</span>
                </button>
                <button onClick={() => navigate('/app')} className="btn-secondary px-8 py-4 rounded-xl border-2 font-bold uppercase tracking-tight">
                  Tweak in Lab
                </button>
              </div>
            </div>

            <div className="w-full lg:w-auto flex flex-col items-center gap-6">
              <div className="p-10 bg-[var(--surface-2)] rounded-[40px] border-4 border-[var(--border)] shadow-lift relative group">
                <ReadinessRing score={report.score} size={220} strokeWidth={12} />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <span className="block text-[64px] font-black text-ink leading-none">{report.score}</span>
                    <span className="text-[12px] font-black uppercase tracking-widest text-ink-secondary">Readiness</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── COCKPIT GRID ────────────────────────────────────────── */}
      <main className="max-w-[1400px] mx-auto p-6 md:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Main Insights */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Next Best Edit */}
            <div className="card p-10 bg-[var(--accent)] text-white border-none shadow-glow overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Zap className="w-32 h-32" />
              </div>
              <div className="relative space-y-6">
                <SectionLabel><span className="text-white">Next Best Edit</span></SectionLabel>
                <h3 className="text-[32px] font-black uppercase tracking-tighter leading-tight">
                  {summary.nextBestEdit}
                </h3>
                <p className="text-[18px] font-medium opacity-90 max-w-2xl">
                  {summary.topFix || "Our agents identified this as the highest-leverage improvement for your application fit."}
                </p>
                <button className="bg-white text-[var(--accent)] font-black px-6 py-3 rounded-xl uppercase tracking-tight shadow-soft">
                  Apply Fix Now
                </button>
              </div>
            </div>

            {/* Requirement Coverage */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-[24px] font-black uppercase tracking-tighter">Requirement Coverage</h2>
                <span className="text-[14px] font-bold text-ink-secondary">
                  {normalized.requirementCoverage.filter(r => r.status === 'covered').length} / {normalized.requirementCoverage.length} PASSED
                </span>
              </div>
              <RequirementCoverage items={normalized.requirementCoverage} />
            </div>

            {/* Fix Plan */}
            <div className="space-y-6">
              <h2 className="text-[24px] font-black uppercase tracking-tighter">Fix Plan</h2>
              <FixPlan items={report.fixOrder} />
            </div>

          </div>

          {/* Right: Agent Panel */}
          <div className="lg:col-span-4 space-y-8">
            <div className="sticky top-28 space-y-8">
              
              <div className="card p-8 bg-[var(--surface-2)] border-2 border-[var(--border)]">
                <h2 className="text-[18px] font-black uppercase tracking-tighter mb-6 flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-[var(--accent)]" />
                  Agent Verdicts
                </h2>
                <ReviewerPanel reviewers={normalized.reviewerPanel} />
              </div>

              <div className="card p-8 bg-[var(--surface-3)] border-2 border-[var(--border)]">
                <h2 className="text-[18px] font-black uppercase tracking-tighter mb-6">Metrics</h2>
                <div className="space-y-6">
                  <div className="flex justify-between items-end border-b border-[var(--border)] pb-4">
                    <span className="text-[12px] font-black uppercase tracking-widest text-ink-secondary">Word Count</span>
                    <span className="text-[20px] font-black text-ink">{report.wordCount}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-[var(--border)] pb-4">
                    <span className="text-[12px] font-black uppercase tracking-widest text-ink-secondary">Speaking Time</span>
                    <span className="text-[20px] font-black text-ink">~{report.speakingTimeSeconds}s</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[12px] font-black uppercase tracking-widest text-ink-secondary">Submission Risk</span>
                    <span className="text-[20px] font-black text-[var(--danger)]">LOW</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
