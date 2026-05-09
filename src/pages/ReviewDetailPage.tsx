import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Copy, FileText, Download, Zap, Sparkles, AlertTriangle,
  CheckCircle2, Clock, Link2, FileCheck, ArrowRight,
  ShieldCheck, AlertOctagon, Package, TrendingUp, MessageSquare,
  Pencil
} from 'lucide-react';
import { getReviewSessions, type ReviewSession } from '../lib/reviewStore';
import { normalizeReviewSession } from '../lib/reviewNormalizer';
import ReviewerPanel from '../components/review/ReviewerPanel';
import RequirementCoverage from '../components/review/RequirementCoverage';
import FixPlan from '../components/review/FixPlan';
import AnimatedSection from '../components/motion/AnimatedSection';
import ReadinessRing from '../components/motion/ReadinessRing';

function SectionHeader({ label, title, action }: { label: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <span className="font-mono text-[10px] text-ink-muted uppercase tracking-[0.14em]">{label}</span>
        <h2 className="text-[16px] font-bold text-ink mt-1">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-edge bg-surface p-6 shadow-soft ${className}`}>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isReady = status.toLowerCase().includes('ready');
  const isBlocked = status.toLowerCase().includes('not ready');
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold ${
      isReady ? 'bg-ok-soft text-ok' : isBlocked ? 'bg-err-soft text-err' : 'bg-warn-soft text-warn'
    }`}>
      {isReady ? <ShieldCheck className="w-3.5 h-3.5" /> : isBlocked ? <AlertOctagon className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
      {status}
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Zap className="w-6 h-6 text-[var(--accent)]" />
          </div>
          <p className="text-[14px] text-ink-secondary">Loading review...</p>
        </div>
      </div>
    );
  }

  if (!session || !normalized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-ink-muted" />
          </div>
          <h2 className="text-[18px] font-bold text-ink mb-2">Review not found</h2>
          <p className="text-[14px] text-ink-secondary mb-6">This review may have been deleted or is unavailable.</p>
          <button onClick={() => navigate('/reviews')} className="btn-primary text-[13px] px-5 py-2.5">
            Back to reviews
          </button>
        </div>
      </div>
    );
  }

  const report = normalized.readinessReport;
  const summary = normalized.dashboardSummary;
  const deadline = session.dashboardSummary?.deadline;
  const deadlineText = deadline ? new Date(deadline).toLocaleDateString() : 'No deadline set';
  const daysLeft = deadline ? Math.max(0, Math.round((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;

  const handleCopy = () => {
    const text = [
      `# ${normalized.title}`,
      ``,
      `## Readiness Score: ${report.score}/100`,
      `Status: ${report.status}`,
      ``,
      `## Verdict`,
      summary.verdict,
      ``,
      `## Next Best Edit`,
      summary.nextBestEdit,
      ``,
      `## Requirement Coverage`,
      ...normalized.requirementCoverage.map((item) => `- [${item.status}] ${item.requirement} — ${item.note}`),
      ``,
      `## Fix Plan`,
      ...report.fixOrder.map((item, idx) => `${idx + 1}. ${item}`),
      ``,
      `## Word Count & Timing`,
      `- Words: ${report.wordCount}`,
      `- Speaking time: ~${report.speakingTimeSeconds}s`,
    ].join('\n');
    navigator.clipboard.writeText(text);
  };

  const handleExport = () => {
    const text = [
      `# ${normalized.title}`,
      ``,
      `## Score: ${report.score}/100 (${report.status})`,
      ``,
      `## Verdict`,
      summary.verdict,
      ``,
      `## Next Best Edit`,
      summary.nextBestEdit,
      ``,
      `## Requirement Coverage`,
      ...normalized.requirementCoverage.map((item) => `- [${item.status}] ${item.requirement} — ${item.note}`),
      ``,
      `## Reviewer Scores`,
      ...Object.entries(normalized.reviewerPanel).map(([key, value]) => `- ${key}: ${value.score} — ${value.summary}`),
      ``,
      `## Fix Plan`,
      ...report.fixOrder.map((item, idx) => `${idx + 1}. ${item}`),
      ``,
      `## Final Answer`,
      session.finalAnswer || session.generatedDraft || '',
    ].join('\n');
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${normalized.title.replace(/\s+/g, '-')}-review.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const avgScore = Math.round(Object.values(normalized.reviewerPanel).reduce((sum, r) => sum + r.score, 0) / Object.keys(normalized.reviewerPanel).length);

  return (
    <div className="space-y-8 pb-12">
      {/* ─── HERO READINESS COCKPIT ─────────────────────────────── */}
      <AnimatedSection>
        <div className="relative rounded-3xl overflow-hidden border border-edge bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)] p-6 md:p-10 shadow-lift">
          <div aria-hidden className="pointer-events-none absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(var(--accent-rgb),0.08),transparent_70%)] blur-3xl -translate-y-1/2 translate-x-1/4" />

          <div className="relative flex flex-col lg:flex-row lg:items-start gap-8">
            {/* Left: Score + Verdict */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-[10px] text-ink-muted uppercase tracking-[0.14em]">readiness cockpit</span>
                <StatusBadge status={report.status} />
              </div>

              <h1 className="text-[clamp(1.6rem,3vw,2.4rem)] font-extrabold tracking-tight leading-tight font-display mb-3">
                {normalized.title}
              </h1>

              <p className="text-[15px] text-ink-secondary leading-relaxed max-w-2xl mb-6">
                {summary.verdict}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button onClick={handleCopy} className="btn-secondary text-[12px] px-4 py-2.5">
                  <Copy className="w-3.5 h-3.5" /> Copy summary
                </button>
                <button onClick={handleExport} className="btn-secondary text-[12px] px-4 py-2.5">
                  <Download className="w-3.5 h-3.5" /> Export markdown
                </button>
                <button onClick={() => navigate('/app')} className="btn-primary text-[12px] px-4 py-2.5">
                  <Zap className="w-3.5 h-3.5" /> New review
                </button>
              </div>
            </div>

            {/* Right: Big Score Ring */}
            <div className="flex flex-col items-center lg:items-end gap-4">
              <div className="p-5 bg-surface rounded-3xl border border-edge shadow-soft">
                <ReadinessRing score={report.score} size={160} label={report.status} />
              </div>
              {daysLeft !== null && (
                <div className={`px-3 py-2 rounded-xl border text-[12px] font-medium ${
                  daysLeft <= 2 ? 'border-err/30 bg-err-soft text-err' : daysLeft <= 7 ? 'border-warn/30 bg-warn-soft text-warn' : 'border-edge bg-surface-muted text-ink-secondary'
                }`}>
                  <Clock className="w-3.5 h-3.5 inline mr-1.5" />
                  {daysLeft === 0 ? 'Due today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`} · {deadlineText}
                </div>
              )}
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* ─── NEXT BEST EDIT + METRICS ───────────────────────────── */}
      <AnimatedSection>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Next Best Edit — spans 2 columns on large screens */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-2 card p-6 md:p-8"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center flex-shrink-0">
                <Pencil className="w-6 h-6 text-[var(--accent)]" />
              </div>
              <div className="min-w-0">
                <span className="font-mono text-[10px] text-ink-muted uppercase tracking-[0.14em]">Next best edit</span>
                <h3 className="text-[18px] font-bold text-ink mt-1 font-headline">{summary.nextBestEdit}</h3>
                <p className="text-[13px] text-ink-secondary mt-2 leading-relaxed">{summary.topFix || summary.verdict}</p>
                <div className="mt-4 flex items-center gap-2">
                  <button onClick={() => navigate('/app')} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--accent)] hover:underline">
                    Open in workspace <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick stats */}
          <div className="space-y-4">
            <div className="card p-5">
              <div className="text-[11px] font-mono text-ink-muted uppercase tracking-widest">Blocking issues</div>
              <div className="flex items-end justify-between mt-2">
                <div className="text-[32px] font-bold text-ink">{report.criticalIssues.length}</div>
                <div className={`px-2 py-1 rounded-lg text-[11px] font-semibold ${report.criticalIssues.length ? 'bg-err-soft text-err' : 'bg-ok-soft text-ok'}`}>
                  {report.criticalIssues.length ? 'Action needed' : 'All clear'}
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="text-[11px] font-mono text-ink-muted uppercase tracking-widest">Reviewer average</div>
              <div className="flex items-end justify-between mt-2">
                <div className="text-[32px] font-bold text-ink">{avgScore}</div>
                <TrendingUp className="w-5 h-5 text-ink-muted" />
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* ─── KEY METRICS ROW ──────────────────────────────────────── */}
      <AnimatedSection>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Word count', value: report.wordCount, helper: 'Current length' },
            { label: 'Speaking time', value: `~${report.speakingTimeSeconds}s`, helper: 'At 145 wpm' },
            { label: 'Requirements', value: `${normalized.requirementCoverage.filter(i => i.status === 'covered').length}/${normalized.requirementCoverage.length}`, helper: 'Covered' },
            { label: 'Warnings', value: report.warnings.length, helper: 'To address' },
          ].map((metric) => (
            <div key={metric.label} className="card p-5">
              <div className="text-[11px] font-mono text-ink-muted uppercase tracking-widest">{metric.label}</div>
              <div className="text-[24px] font-bold text-ink mt-2">{metric.value}</div>
              <div className="text-[12px] text-ink-secondary mt-1">{metric.helper}</div>
            </div>
          ))}
        </div>
      </AnimatedSection>

      {/* ─── REVIEWER PANEL ─────────────────────────────────────── */}
      <AnimatedSection>
        <Card>
          <SectionHeader label="Reviewer agents" title="Your application review lineup" />
          <ReviewerPanel panel={normalized.reviewerPanel} />
        </Card>
      </AnimatedSection>

      {/* ─── REQUIREMENT COVERAGE + FIX PLAN ────────────────────── */}
      <AnimatedSection>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <SectionHeader
              label="Requirement coverage"
              title="Is every requirement addressed?"
              action={
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-ok-soft text-ok">
                  {normalized.requirementCoverage.filter(i => i.status === 'covered').length}/{normalized.requirementCoverage.length}
                </span>
              }
            />
            <RequirementCoverage items={normalized.requirementCoverage} />
          </Card>
          <Card>
            <SectionHeader label="Fix plan" title="What should I fix first?" />
            <FixPlan items={report.fixOrder} />
          </Card>
        </div>
      </AnimatedSection>

      {/* ─── IMPROVED ANSWER + APPLICATION PACKET ─────────────────── */}
      <AnimatedSection>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <SectionHeader label="Improved application" title="What can I copy and submit?" />
            {session.generatedDraft ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-edge bg-[var(--surface-2)] p-5">
                  <div className="text-[11px] font-mono text-ink-muted uppercase tracking-widest mb-3">Suggested answer</div>
                  <p className="text-[14px] text-ink leading-relaxed whitespace-pre-wrap">{session.generatedDraft}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(session.generatedDraft || '')}
                    className="btn-secondary text-[12px] px-4 py-2"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy answer
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-[13px] text-ink-secondary">No improved answer generated yet. Run a full review to get a tailored draft.</div>
            )}
          </Card>

          <Card>
            <SectionHeader label="Application packet" title="Everything in one place" />
            <div className="space-y-3">
              {[
                { icon: FileCheck, label: 'Program', value: normalized.title },
                { icon: CheckCircle2, label: 'Requirements', value: `${normalized.requirementCoverage.filter(i => i.status === 'covered').length} covered` },
                { icon: Link2, label: 'Links', value: session.briefAnalysis?.explicitRequirements?.some(r => /link|url|portfolio|github/i.test(r)) ? 'Check needed' : 'N/A' },
                { icon: MessageSquare, label: 'Next best edit', value: summary.nextBestEdit },
                { icon: Package, label: 'Export format', value: 'Markdown' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-edge last:border-0">
                  <div className="flex items-center gap-2.5 text-[13px] text-ink-secondary">
                    <row.icon className="w-4 h-4 text-ink-muted" />
                    {row.label}
                  </div>
                  <div className="text-[13px] font-medium text-ink">{row.value}</div>
                </div>
              ))}
              <div className="pt-3">
                <button onClick={handleExport} className="w-full btn-primary text-[13px] py-2.5">
                  <Download className="w-4 h-4" /> Export full packet
                </button>
              </div>
            </div>
          </Card>
        </div>
      </AnimatedSection>

      {/* ─── SUBMISSION RISKS + BLOCKING ISSUES ─────────────────── */}
      <AnimatedSection>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <SectionHeader
              label="Submission risks"
              title="What could go wrong at submit time?"
              action={
                session.briefAnalysis?.submissionRisks?.length ? (
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-warn-soft text-warn">
                    {session.briefAnalysis.submissionRisks.length} flagged
                  </span>
                ) : null
              }
            />
            <div className="space-y-3">
              {session.briefAnalysis?.submissionRisks?.length ? (
                session.briefAnalysis.submissionRisks.map((risk, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-2xl border border-edge bg-[var(--surface-2)] p-4">
                    <AlertTriangle className="w-4 h-4 text-warn flex-shrink-0 mt-0.5" />
                    <p className="text-[13px] text-ink-secondary">{risk}</p>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-3 text-[13px] text-ink-secondary">
                  <ShieldCheck className="w-4 h-4 text-ok" />
                  No submission risks detected.
                </div>
              )}
            </div>
          </Card>

          <Card>
            <SectionHeader
              label="Blocking issues"
              title="What is stopping me from submitting?"
              action={
                report.criticalIssues.length ? (
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-err-soft text-err">
                    {report.criticalIssues.length} blocker{report.criticalIssues.length === 1 ? '' : 's'}
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-ok-soft text-ok">All clear</span>
                )
              }
            />
            <div className="space-y-3">
              {report.criticalIssues.length ? (
                report.criticalIssues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-2xl border border-err/20 bg-err-soft p-4">
                    <AlertOctagon className="w-4 h-4 text-err flex-shrink-0 mt-0.5" />
                    <p className="text-[13px] text-err">{issue}</p>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-3 text-[13px] text-ink-secondary">
                  <ShieldCheck className="w-4 h-4 text-ok" />
                  No blockers flagged. You are clear to submit after reviewing the fix plan.
                </div>
              )}
            </div>
          </Card>
        </div>
      </AnimatedSection>

      {/* ─── FINAL CTA ───────────────────────────────────────────── */}
      <AnimatedSection>
        <div className="relative rounded-3xl overflow-hidden border border-edge shadow-soft">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--accent-soft)]/30 to-transparent" />
          <div className="relative p-8 md:p-12 text-center">
            <h2 className="text-[clamp(1.4rem,3vw,2rem)] font-bold text-ink font-headline mb-3">
              Ready to make it better?
            </h2>
            <p className="text-[14px] text-ink-secondary mb-6 max-w-md mx-auto">
              Open this review in the workspace to edit the answer, run the tweak lab, and re-check readiness.
            </p>
            <button onClick={() => navigate('/app')} className="btn-primary text-[14px] px-6 py-3">
              <Sparkles className="w-4 h-4" /> Open in workspace
            </button>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}
