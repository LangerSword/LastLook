import { useEffect, useMemo, useState } from 'react';
import { Copy, RefreshCcw, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { BriefAnalysis, GeneratedAnswer, CheckResult, ApplicationMemory, ApplicationType, ReviewStrictness } from '../lib/types';
import { buildTailoredDashboardSummary } from '../lib/dashboardSummary';
import { buildFullReviewPacket } from '../lib/reviewEngine';
import AnalysisLoader from './AnalysisLoader';
import FinalDashboard from './FinalDashboard';
import ResultCard from './ResultCard';
import CopyButton from './CopyButton';
import XRayCard from './motion/XRayCard';
import ScoreReveal from './motion/ScoreReveal';
import StaggeredReveal from './motion/StaggeredReveal';

export interface LoadingState {
  active: boolean;
  stages: string[];
  currentIdx: number;
}

interface Props {
  analysis?: BriefAnalysis | null;
  generated?: GeneratedAnswer | null;
  checkResult?: CheckResult | null;
  loading?: LoadingState | null;
  loadingState?: LoadingState | null;
  error?: string | null;
  onReset?: () => void;
  memory?: ApplicationMemory | null;
  briefText?: string;
  question?: string;
  finalAnswer?: string;
  applicationType?: ApplicationType;
  reviewStrictness?: ReviewStrictness;
  programName?: string;
  deadline?: string;
  openReviewPath?: string;
  onSaveSession?: () => void;
  saveState?: 'idle' | 'saving' | 'saved' | 'error';
  saveError?: string | null;
  onGenerated?: (g: GeneratedAnswer) => void;
}

type TabId = 'overview' | 'requirements' | 'draft' | 'readiness' | 'fix';

export default function ReviewStudio({
  analysis,
  generated,
  checkResult,
  loading: loadingProp,
  loadingState: loadingStateProp,
  error,
  onReset,
  memory,
  briefText,
  question,
  finalAnswer,
  applicationType,
  reviewStrictness,
  programName,
  deadline,
  onSaveSession,
  openReviewPath,
  saveState = 'idle',
  saveError,
  onGenerated,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const navigate = useNavigate();
  
  // Support both loading and loadingState prop names
  const loadingState = loadingProp ?? loadingStateProp;

  // Auto-switch tabs when new data arrives
  useEffect(() => {
    if (loadingState?.active) return; // don't switch while loading
    if (checkResult && saveState === 'saved') setActiveTab('overview');
    else if (checkResult) setActiveTab('readiness');
    else if (generated) setActiveTab('draft');
    else if (analysis) setActiveTab('requirements');
  }, [analysis, generated, checkResult, loadingState?.active, saveState]);

  const tabs: { id: TabId; label: string; disabled: boolean }[] = [
    { id: 'overview', label: 'Overview', disabled: !checkResult },
    { id: 'requirements', label: 'Requirements', disabled: !analysis },
    { id: 'draft', label: 'Draft', disabled: !generated },
    { id: 'readiness', label: 'Readiness', disabled: !checkResult },
    { id: 'fix', label: 'Fix Plan', disabled: !checkResult },
  ];

  const isEmpty = !analysis && !generated && !checkResult && !loadingState?.active && !error;
  const canSave = Boolean(analysis && checkResult && (finalAnswer?.trim() || generated?.draft));

  const summary = useMemo(() => {
    if (!analysis || !checkResult) return null;
    return buildTailoredDashboardSummary({
      memory,
      briefAnalysis: analysis,
      generatedAnswer: generated,
      readinessReport: checkResult,
      question,
      finalAnswer,
    });
  }, [analysis, checkResult, generated, memory, question, finalAnswer]);

  const reviewPacket = useMemo(() => {
    if (!analysis || !checkResult) return null;
    return buildFullReviewPacket({
      briefAnalysis: analysis,
      answer: finalAnswer || generated?.draft || '',
      question: question || briefText || '',
      memory,
      applicationType: applicationType || 'Other',
      reviewStrictness,
      programName,
      deadline,
      generatedAnswer: generated,
    });
  }, [analysis, checkResult, generated, memory, question, finalAnswer, applicationType, reviewStrictness, programName, deadline, briefText]);

  const safeGenerated = generated || (finalAnswer ? { draft: finalAnswer, whyItWorks: [], customize: [] } : null);
  const coverage = summary?.fitSnapshot.completeness ?? 0;
  const requirementCount = analysis?.explicitRequirements?.length || 0;

  const handleCopy = () => {
    // Only copy if we have checkResult and analysis
    if (!checkResult) return;
    const summaryBlock = summary
      ? `Verdict: ${summary.verdict}\nTop Fix: ${summary.topFix}\nNext Best Edit: ${summary.nextBestEdit}\nEvaluator Risk: ${summary.evaluatorRisk}\n\n`
      : '';
    const text = `${summaryBlock}Score: ${checkResult.score}/100\nStatus: ${checkResult.status}\n\nFix before submitting:\n${checkResult.criticalIssues.map(i => `- ${i}`).join('\n')}\n\nWorth improving:\n${checkResult.warnings.map(i => `- ${i}`).join('\n')}\n\nAlready working:\n${checkResult.strongPoints.map(i => `- ${i}`).join('\n')}\n\nFix order:\n${checkResult.fixOrder.map((i, n) => `${n + 1}. ${i}`).join('\n')}`;
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="h-full min-h-[600px] flex flex-col bg-surface border border-edge rounded-3xl shadow-soft overflow-hidden">
      {/* Header / Tabs */}
      <div className="flex items-center justify-between border-b border-edge bg-surface px-4 sm:px-6 py-4 shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-yc" />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-ink">Review Studio</span>
        </div>
        
        {/* Actions */}
        {(!isEmpty || loadingState?.active) && (
          <div className="flex items-center gap-2">
            {checkResult && (
              <button onClick={handleCopy} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-edge bg-surface hover:bg-surface-muted text-ink text-[11px] font-medium rounded-lg transition-colors cursor-pointer">
                <Copy className="w-3 h-3" /> Copy
              </button>
            )}
            <button onClick={onReset} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-edge bg-surface hover:bg-surface-muted text-[11px] font-medium rounded-lg transition-colors text-err cursor-pointer">
              <RefreshCcw className="w-3 h-3" /> Reset
            </button>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      {!isEmpty && !loadingState?.active && (
        <div className="flex border-b border-edge px-2 overflow-x-auto hide-scrollbar shrink-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              disabled={t.disabled}
              className={`px-4 py-3 text-[13px] font-medium whitespace-nowrap transition-all border-b-2 ${
                activeTab === t.id
                  ? 'border-yc text-ink'
                  : t.disabled
                  ? 'border-transparent text-ink-faint cursor-not-allowed'
                  : 'border-transparent text-ink-secondary hover:text-ink hover:border-edge cursor-pointer'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-surface-muted/30">
        {loadingState?.active ? (
          <AnalysisLoader currentStageIdx={loadingState.currentIdx} stages={loadingState.stages} />
        ) : isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-surface-muted border border-edge flex items-center justify-center mb-4">
              <Layers className="w-5 h-5 text-ink-faint" />
            </div>
            <p className="text-[14px] text-ink-secondary max-w-[260px] leading-relaxed">
              Your review will appear here as LastLook reads the brief, drafts your answer, and checks readiness.
            </p>
          </div>
        ) : (
          <div className="animate-fade-up">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-err-soft text-err text-[13px] border border-err/20">
                {error}
              </div>
            )}

            {activeTab === 'overview' && checkResult && analysis && safeGenerated && (
              <FinalDashboard
                result={{ briefAnalysis: analysis, generatedAnswer: safeGenerated, readinessReport: checkResult }}
                summary={summary || undefined}
                reviewPacket={reviewPacket || undefined}
                showActions
                onSave={onSaveSession}
                onOpenDashboard={openReviewPath ? () => navigate(openReviewPath) : undefined}
                onCopy={() => handleCopy()}
                saveState={saveState}
                saveError={saveError}
                canSave={canSave}
              />
            )}

            {activeTab === 'requirements' && analysis && (
              <StaggeredReveal className="grid gap-4">
                <XRayCard className="rounded-2xl border border-edge bg-surface p-5 shadow-soft">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">requirement coverage</span>
                      <div className="mt-2 text-[15px] font-semibold text-ink">{requirementCount} requirements tracked</div>
                      <p className="text-[12px] text-ink-secondary mt-1">
                        Coverage improves once you run the readiness check.
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-[22px] font-semibold text-ink">{coverage}%</div>
                      <div className="text-[11px] text-ink-muted">coverage</div>
                    </div>
                  </div>
                  <div className="mt-4 h-2 bg-surface-muted rounded-full overflow-hidden">
                    <div className="h-full bg-yc/60 rounded-full" style={{ width: `${coverage}%` }} />
                  </div>
                </XRayCard>

                {analysis.summary && (
                  <div className="rounded-2xl border border-edge bg-surface p-5 shadow-soft">
                    <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">summary</span>
                    <p className="mt-3 text-[13px] text-ink-secondary leading-relaxed">{analysis.summary}</p>
                  </div>
                )}

                <ResultCard title="Explicit Requirements" items={analysis.explicitRequirements} />
                <ResultCard title="Implied Criteria" items={analysis.impliedCriteria} />
                <ResultCard title="Submission Risks" items={analysis.submissionRisks} variant="warning" />
              </StaggeredReveal>
            )}

            {activeTab === 'draft' && generated && (
              <StaggeredReveal className="grid gap-4">
                <div className="rounded-2xl border border-edge bg-surface p-5 shadow-soft">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">draft preview</span>
                      <p className="text-[12px] text-ink-secondary mt-1">Edit it before running readiness.</p>
                    </div>
                    <CopyButton text={generated.draft} />
                  </div>
                  <p className="mt-4 text-[13px] text-ink-secondary whitespace-pre-wrap leading-relaxed">{generated.draft}</p>
                </div>
                <ResultCard title="Why it works" items={generated.whyItWorks} variant="success" />
                <ResultCard title="Customize further" items={generated.customize} />
              </StaggeredReveal>
            )}

            {activeTab === 'readiness' && checkResult && (
              <StaggeredReveal className="grid gap-4">
                <XRayCard className="rounded-2xl border border-edge bg-surface p-6 shadow-soft">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">readiness score</span>
                      <div className="mt-3 text-[clamp(2.6rem,5vw,3.4rem)] font-bold text-ink tracking-tight">
                        <ScoreReveal value={checkResult.score} />
                      </div>
                      <div className="text-[12px] text-ink-secondary mt-1">out of 100</div>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-surface-muted text-ink">
                      {checkResult.status}
                    </span>
                  </div>
                  {summary && (
                    <div className="mt-4 text-[13px] text-ink-secondary">
                      <span className="font-semibold text-ink">{summary.verdict}</span>
                      <div className="mt-2">Top fix: {summary.topFix}</div>
                    </div>
                  )}
                </XRayCard>

                <ResultCard title="Fix before submitting" items={checkResult.criticalIssues} variant="danger" />
                <ResultCard title="Worth improving" items={checkResult.warnings} variant="warning" />
                <ResultCard title="Already working" items={checkResult.strongPoints} variant="success" />
              </StaggeredReveal>
            )}

            {activeTab === 'fix' && checkResult && (
              <StaggeredReveal className="grid gap-4">
                <div className="rounded-2xl border border-edge bg-surface p-5 shadow-soft">
                  <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">fix order</span>
                  {checkResult.fixOrder.length > 0 ? (
                    <ol className="mt-4 space-y-2">
                      {checkResult.fixOrder.map((fix, idx) => (
                        <li key={idx} className="flex gap-2 text-[13px] text-ink-secondary leading-relaxed">
                          <span className="font-mono text-ink-muted">{idx + 1}.</span> {fix}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="mt-3 text-[13px] text-ink-muted">No fixes required.</p>
                  )}
                </div>

                {analysis && (
                  <ResultCard title="Evaluator criteria to cover" items={analysis.impliedCriteria} />
                )}
                {analysis && (
                  <ResultCard title="Submission risks to avoid" items={analysis.submissionRisks} variant="warning" />
                )}
              </StaggeredReveal>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
