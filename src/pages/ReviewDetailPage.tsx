import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Copy, FileText, LayoutDashboard, Share2, AlertTriangle, Zap, Sparkles } from 'lucide-react';
import { getReviewSessions, type ReviewSession } from '../lib/reviewStore';
import { normalizeReviewSession } from '../lib/reviewNormalizer';
import MetricCard from '../components/dashboard/MetricCard';
import ReviewerPanel from '../components/review/ReviewerPanel';
import RequirementCoverage from '../components/review/RequirementCoverage';
import FixPlan from '../components/review/FixPlan';
import AnswerComparison from '../components/review/AnswerComparison';
import NextBestEditCard from '../components/review/NextBestEditCard';
import AnimatedSection from '../components/motion/AnimatedSection';
import ReadinessRing from '../components/motion/ReadinessRing';

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
      <div className="rounded-3xl border border-edge bg-surface p-10 text-center text-ink-secondary">
        Loading review...
      </div>
    );
  }

  if (!session || !normalized) {
    return (
      <div className="rounded-3xl border border-edge bg-surface p-10 text-center text-ink-secondary">
        Review not found. This review may have been deleted or is unavailable.
      </div>
    );
  }

  const report = normalized.readinessReport;
  const summary = normalized.dashboardSummary;

  const handleCopy = () => {
    const text = `Score: ${report.score}/100\nVerdict: ${summary.verdict}\nNext Best Edit: ${summary.nextBestEdit}\n\nFix order:\n${report.fixOrder.map((item, idx) => `${idx + 1}. ${item}`).join('\n')}`;
    navigator.clipboard.writeText(text);
  };

  const handleExport = () => {
    const text = `# ${normalized.title}\n\n## Score\n${report.score}/100 (${report.status})\n\n## Verdict\n${summary.verdict}\n\n## Next Best Edit\n${summary.nextBestEdit}\n\n## Requirement Coverage\n${normalized.requirementCoverage.map((item) => `- ${item.requirement}: ${item.status} (${item.note})`).join('\n')}\n\n## Reviewer Scores\n${Object.entries(normalized.reviewerPanel).map(([key, value]) => `- ${key}: ${value.score} - ${value.summary}`).join('\n')}\n\n## Fix Plan\n${report.fixOrder.map((item, idx) => `${idx + 1}. ${item}`).join('\n')}`;
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${normalized.title.replace(/\s+/g, '-')}-review.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <AnimatedSection>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">review dashboard</span>
            <h1 className="text-2xl font-semibold text-ink mt-2">{normalized.title}</h1>
            <p className="text-[13px] text-ink-secondary mt-1">{summary.verdict}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleCopy} className="inline-flex items-center gap-2 px-4 py-2 bg-surface-muted border border-edge rounded-xl text-[12px] font-semibold text-ink">
              <Copy className="w-4 h-4" /> Copy report
            </button>
            <button onClick={handleExport} className="inline-flex items-center gap-2 px-4 py-2 bg-surface-muted border border-edge rounded-xl text-[12px] font-semibold text-ink">
              <FileText className="w-4 h-4" /> Export Markdown
            </button>
            <button onClick={() => navigate('/app')} className="inline-flex items-center gap-2 px-4 py-2 bg-yc text-[var(--button-text)] rounded-xl text-[12px] font-semibold">
              Start another review
            </button>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1 flex justify-center">
            <div className="p-6 bg-surface rounded-3xl border border-edge shadow-soft">
              <ReadinessRing score={report.score} size={140} label={report.status} />
            </div>
          </div>
          <div className="lg:col-span-2">
            <NextBestEditCard verdict={summary.verdict} nextBestEdit={summary.nextBestEdit} topFix={summary.topFix} />
          </div>
          <div className="lg:col-span-1">
            <MetricCard label="Blocking Issues" value={report.criticalIssues.length} helper={summary.evaluatorRisk} accent={report.criticalIssues.length ? 'err' : 'ok'} icon={<Share2 className="w-4 h-4" />} />
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <MetricCard label="Requirement Coverage" value={`${summary.fitSnapshot.completeness}%`} helper="Coverage score" accent="accent" />
          <MetricCard label="Opportunity Fit" value={`${summary.opportunityFitScore ?? 0}%`} helper="Fit score" accent="accent" />
          <MetricCard label="Reviewer Avg" value={Math.round(Object.values(normalized.reviewerPanel).reduce((sum, r) => sum + r.score, 0) / 6)} helper="Panel average" />
          <MetricCard label="Word Count" value={report.wordCount} helper="Targeted length" />
          <MetricCard label="Speaking Time" value={`${report.speakingTimeSeconds}s`} helper="Estimated" />
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <div className="rounded-3xl border border-edge bg-surface p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold text-ink">Reviewer Panel</h2>
            <span className="text-[11px] text-ink-muted">Decision-ready summaries</span>
          </div>
          <ReviewerPanel panel={normalized.reviewerPanel} />
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-3xl border border-edge bg-surface p-6 shadow-soft">
            <h2 className="text-[15px] font-semibold text-ink mb-4">Requirement Coverage</h2>
            <RequirementCoverage items={normalized.requirementCoverage} />
          </div>
          <div className="rounded-3xl border border-edge bg-surface p-6 shadow-soft">
            <h2 className="text-[15px] font-semibold text-ink mb-4">Fix Plan</h2>
            <FixPlan items={report.fixOrder} />
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <div className="rounded-3xl border border-edge bg-surface p-6 shadow-soft">
          <h2 className="text-[15px] font-semibold text-ink mb-4">Answer Review</h2>
          <AnswerComparison
            original={session.finalAnswer || ''}
            draft={session.generatedDraft}
            whyItWorks={session.briefAnalysis?.suggestedAngles || []}
          />
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <div className="rounded-3xl border border-edge bg-surface p-6 shadow-soft">
          <h2 className="text-[15px] font-semibold text-ink mb-4">Submission Risks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {session.briefAnalysis?.submissionRisks?.length ? (
              session.briefAnalysis.submissionRisks.map((risk) => (
                <div key={risk} className="rounded-2xl border border-edge bg-surface-muted p-4 text-[13px] text-ink-secondary">
                  {risk}
                </div>
              ))
            ) : (
              <div className="text-[13px] text-ink-secondary">No submission risks detected.</div>
            )}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <div className="rounded-3xl border border-edge bg-surface p-6 shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-warn" />
            <h2 className="text-[15px] font-semibold text-ink">Blocking Issues</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.criticalIssues.length ? (
              report.criticalIssues.map((issue) => (
                <div key={issue} className="rounded-2xl border border-edge bg-err-soft p-4 text-[13px] text-err">
                  {issue}
                </div>
              ))
            ) : (
              <div className="text-[13px] text-ink-secondary">No blockers flagged.</div>
            )}
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}
