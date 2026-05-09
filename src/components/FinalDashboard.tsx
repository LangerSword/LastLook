import { AlertOctagon, AlertTriangle, ShieldCheck, ListOrdered, FileText, Mic, CheckCircle2, ClipboardList, Copy, LayoutDashboard, Save } from 'lucide-react';
import type { FullRunResult } from '../lib/api';
import { formatTime } from '../lib/utils';
import { buildTailoredDashboardSummary, type DashboardSummary } from '../lib/dashboardSummary';
import type { FullReviewPacket } from '../lib/types';
import ScoreReveal from './motion/ScoreReveal';
import XRayCard from './motion/XRayCard';

interface Props {
  result: FullRunResult;
  hideOverview?: boolean;
  summary?: DashboardSummary;
  reviewPacket?: FullReviewPacket;
  showActions?: boolean;
  onSave?: () => void;
  onOpenDashboard?: () => void;
  onCopy?: () => void;
  saveState?: 'idle' | 'saving' | 'saved' | 'error';
  saveError?: string | null;
  canSave?: boolean;
}

export default function FinalDashboard({
  result,
  hideOverview,
  summary,
  reviewPacket,
  showActions,
  onSave,
  onOpenDashboard,
  onCopy,
  saveState = 'idle',
  saveError,
  canSave = true,
}: Props) {
  const { readinessReport: report, briefAnalysis: brief } = result;
  const answerText = (result.generatedAnswer.draft || '').toLowerCase();

  const sc = (s: number) => (s >= 80 ? 'text-ok' : s >= 60 ? 'text-warn' : 'text-err');
  const bc = (s: number) => (s >= 80 ? 'bg-ok' : s >= 60 ? 'bg-warn' : 'bg-err');
  const sb = (s: number) => (s >= 80 ? 'bg-ok-soft text-ok' : s >= 60 ? 'bg-warn-soft text-warn' : 'bg-err-soft text-err');

  const derivedSummary =
    summary ||
    buildTailoredDashboardSummary({
      briefAnalysis: brief,
      generatedAnswer: result.generatedAnswer,
      readinessReport: report,
    });

  const { verdict, topFix, nextBestEdit, evaluatorRisk, fitSnapshot } = derivedSummary;

  const MetricBar = ({ label, value }: { label: string; value: number }) => (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[12px] font-medium text-ink-secondary w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-surface-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${bc(value)}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      {!hideOverview && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Score Card */}
            <XRayCard className="md:col-span-1 rounded-2xl border border-edge bg-surface p-6 text-center shadow-soft ring-1 ring-yc/20 flex flex-col justify-center">
              <div className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-3">readiness score</div>
              <div className={`text-[clamp(3.5rem,5vw,4.5rem)] font-extrabold tracking-tighter leading-none ${sc(report.score)}`}>
                <ScoreReveal value={report.score} />
              </div>
              <div className="text-sm text-ink-muted mt-2">out of 100</div>
              <div className="mt-3">
                <span className={`inline-block text-[11px] font-semibold font-mono px-3 py-1 rounded-full ${sb(report.score)}`}>
                  {report.status}
                </span>
              </div>
              <div className="flex justify-center gap-4 mt-5 text-[11px] text-ink-muted font-mono border-t border-edge pt-4">
                <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> {report.wordCount} w</span>
                <span className="flex items-center gap-1.5"><Mic className="w-3.5 h-3.5" /> ~{formatTime(report.speakingTimeSeconds)}</span>
              </div>
            </XRayCard>

            {/* Summary Card */}
            <div className="md:col-span-2 rounded-2xl border border-edge bg-surface p-6 shadow-soft flex flex-col justify-center">
              <h3 className="text-lg font-semibold text-ink">{verdict}</h3>
              
              <div className="mt-4 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertOctagon className="w-4 h-4 text-err mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-[11px] font-mono text-ink-muted uppercase tracking-wider mb-0.5">Top Fix</span>
                    <p className="text-[14px] text-ink-secondary">{topFix}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-yc mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-[11px] font-mono text-ink-muted uppercase tracking-wider mb-0.5">Next Best Edit</span>
                    <p className="text-[14px] text-ink-secondary">{nextBestEdit}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-warn mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-[11px] font-mono text-ink-muted uppercase tracking-wider mb-0.5">Evaluator Risk</span>
                    <p className="text-[14px] text-ink-secondary">{evaluatorRisk}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fit Metrics Snapshot */}
          <div className="rounded-2xl border border-edge bg-surface p-5 shadow-soft">
            <h4 className="text-[11px] font-mono font-semibold text-ink-muted uppercase tracking-widest mb-4">Application Fit Snapshot</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              <MetricBar label="Completeness" value={fitSnapshot.completeness} />
              <MetricBar label="Specificity" value={fitSnapshot.specificity} />
              <MetricBar label="Clarity" value={fitSnapshot.clarity} />
              <MetricBar label="Length Fit" value={fitSnapshot.lengthFit} />
            </div>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fix Order & Brief Checklist */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-edge bg-surface p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-4">
              <ListOrdered className="w-4 h-4 text-ink" />
              <h4 className="text-[13px] font-semibold text-ink">Suggested Fix Order</h4>
            </div>
            {report.fixOrder.length > 0 ? (
              <ul className="space-y-2">
                {report.fixOrder.map((fix, idx) => (
                  <li key={idx} className="flex gap-2 text-[13px] text-ink-secondary leading-relaxed">
                    <span className="font-mono text-ink-muted">{idx + 1}.</span> {fix}
                  </li>
                ))}
              </ul>
            ) : <p className="text-[13px] text-ink-muted">No fixes required.</p>}
          </div>

          <div className="rounded-2xl border border-edge bg-surface p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="w-4 h-4 text-ink" />
              <h4 className="text-[13px] font-semibold text-ink">Requirement coverage</h4>
            </div>
            {brief.explicitRequirements.length > 0 ? (
              <ul className="space-y-2">
                {brief.explicitRequirements.map((req, idx) => {
                  const key = req.toLowerCase().split(' ').find((word) => word.length > 3) || req.toLowerCase().split(' ')[0];
                  const covered = answerText.includes(key);
                  const needsAttention = !covered || report.criticalIssues.some((i) => i.toLowerCase().includes(key));
                  return (
                    <li key={idx} className="flex gap-2 text-[13px] text-ink-secondary items-start leading-relaxed">
                      {needsAttention ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-warn mt-0.5 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-ok mt-0.5 shrink-0" />
                      )}
                      <span className={needsAttention ? 'font-medium text-ink' : ''}>{req}</span>
                    </li>
                  )
                })}
              </ul>
            ) : <p className="text-[13px] text-ink-muted">No explicit requirements extracted.</p>}
          </div>
        </div>

        {/* Detailed Issues */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-edge bg-surface p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-3">
              <AlertOctagon className="w-4 h-4 text-err" />
              <h4 className="text-[13px] font-semibold text-ink">What to fix before submitting</h4>
            </div>
            {report.criticalIssues.length > 0 ? (
              <ul className="space-y-2">
                {report.criticalIssues.map((item, idx) => (
                  <li key={idx} className="flex gap-2 text-[13px] text-ink-secondary items-start leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-err mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-[13px] text-ok font-medium">No blocking issues found.</p>}
          </div>

          <div className="rounded-2xl border border-edge bg-surface p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-warn" />
              <h4 className="text-[13px] font-semibold text-ink">What would make it stronger</h4>
            </div>
            {report.warnings.length > 0 ? (
              <ul className="space-y-2">
                {report.warnings.map((item, idx) => (
                  <li key={idx} className="flex gap-2 text-[13px] text-ink-secondary items-start leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-warn mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-[13px] text-ok font-medium">No major improvements needed.</p>}
          </div>

          <div className="rounded-2xl border border-edge bg-surface p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-ok" />
              <h4 className="text-[13px] font-semibold text-ink">What's already working</h4>
            </div>
            {report.strongPoints.length > 0 ? (
              <ul className="space-y-2">
                {report.strongPoints.map((item, idx) => (
                  <li key={idx} className="flex gap-2 text-[13px] text-ink-secondary items-start leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-ok mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-[13px] text-ink-muted">Nothing specific to highlight.</p>}
          </div>
        </div>
      </div>

      {reviewPacket && (
        <div className="rounded-2xl border border-edge bg-surface p-5 shadow-soft space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">application packet</div>
              <h4 className="mt-2 text-[15px] font-semibold text-ink">Copy-ready summary for submission</h4>
              <p className="mt-1 text-[13px] text-ink-secondary">This packet is built from the brief, your answer, and saved memory.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(reviewPacket.applicationPacket.exportMarkdown)}
                className="inline-flex items-center gap-2 rounded-xl border border-edge bg-surface-muted px-3 py-2 text-[12px] font-medium text-ink"
              >
                <Copy className="w-3.5 h-3.5" /> Copy packet markdown
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-edge bg-surface-muted p-4">
              <div className="text-[11px] font-mono uppercase tracking-widest text-ink-muted">Checklist</div>
              <ul className="mt-3 space-y-2 text-[13px] text-ink-secondary">
                {reviewPacket.applicationPacket.requirementChecklist.map((item) => (
                  <li key={item.requirement} className="flex gap-2">
                    <span className={`mt-1 h-2 w-2 rounded-full ${item.status === 'covered' ? 'bg-ok' : item.status === 'partial' ? 'bg-warn' : 'bg-err'}`} />
                    <span>{item.requirement}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-edge bg-surface-muted p-4">
              <div className="text-[11px] font-mono uppercase tracking-widest text-ink-muted">Required links</div>
              <ul className="mt-3 space-y-2 text-[13px] text-ink-secondary">
                {reviewPacket.applicationPacket.requiredLinks.length > 0 ? (
                  reviewPacket.applicationPacket.requiredLinks.map((link) => (
                    <li key={link} className="break-all">{link}</li>
                  ))
                ) : (
                  <li>No required link detected yet.</li>
                )}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-edge bg-surface-muted p-4">
            <div className="text-[11px] font-mono uppercase tracking-widest text-ink-muted">Submission checklist</div>
            <ul className="mt-3 space-y-2 text-[13px] text-ink-secondary">
              {reviewPacket.applicationPacket.submissionChecklist.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-edge bg-surface-muted p-4">
            <div className="text-[11px] font-mono uppercase tracking-widest text-ink-muted">Export markdown</div>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-[12px] leading-relaxed text-ink-secondary">{reviewPacket.applicationPacket.exportMarkdown}</pre>
          </div>
        </div>
      )}

      {showActions && !hideOverview && (
        <div className="flex flex-col gap-3 pt-6 border-t border-edge mt-6">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {onSave && (
              <button
                onClick={onSave}
                disabled={!canSave || saveState === 'saving' || saveState === 'saved'}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-yc hover:bg-yc-hover disabled:bg-surface-muted disabled:text-ink-faint text-[var(--button-text)] text-[13px] font-semibold rounded-xl shadow-sm transition-all duration-200"
              >
                <Save className="w-4 h-4" />
                {saveState === 'saved' ? 'Saved' : saveState === 'saving' ? 'Saving...' : 'Save session'}
              </button>
            )}
            {onOpenDashboard && (
              <button
                onClick={onOpenDashboard}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-muted hover:bg-surface border border-edge text-ink text-[13px] font-semibold rounded-xl transition-all duration-200"
              >
                <LayoutDashboard className="w-4 h-4" /> Open review dashboard
              </button>
            )}
            {onCopy && (
              <button
                onClick={onCopy}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-muted hover:bg-surface border border-edge text-ink text-[13px] font-semibold rounded-xl transition-all duration-200"
              >
                <Copy className="w-4 h-4" /> Copy report
              </button>
            )}
          </div>
          {saveError && (
            <div className="text-[12px] text-err bg-err-soft border border-err/20 rounded-xl px-3 py-2 text-center">
              {saveError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
