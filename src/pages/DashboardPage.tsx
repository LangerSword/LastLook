import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, CheckCircle2, FileText, ArrowUpRight, Clock, Search, Trash2, AlertTriangle, Sparkles } from 'lucide-react';
import { deleteReviewSession, getReviewSessions, type ReviewSession } from '../lib/reviewStore';
import AnimatedSection from '../components/motion/AnimatedSection';
import SpectraNoise from '../components/motion/SpectraNoise';
import StaggeredReveal from '../components/motion/StaggeredReveal';
import XRayCard from '../components/motion/XRayCard';
import ScoreReveal from '../components/motion/ScoreReveal';
import { AnimatePresence, motion } from 'framer-motion';
import TrendChart from '../components/dashboard/TrendChart';
import IssueBreakdownChart from '../components/dashboard/IssueBreakdownChart';
import ApplicationTypeChart from '../components/dashboard/ApplicationTypeChart';
import ReviewHistoryTable from '../components/dashboard/ReviewHistoryTable';

const statusFromScore = (score: number) => {
  if (score >= 80) return { key: 'ready', label: 'Ready', tone: 'ok' } as const;
  if (score >= 60) return { key: 'polish', label: 'Needs polish', tone: 'warn' } as const;
  return { key: 'fix', label: 'Needs fixes', tone: 'err' } as const;
};

export default function DashboardPage() {
  const [sessions, setSessions] = useState<ReviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'polish' | 'fix'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    getReviewSessions().then((data) => {
      setSessions(data);
      setLoading(false);
    });
  }, []);

  const stats = useMemo(() => {
    if (sessions.length === 0) return null;
    const scores = sessions.map((s) => s.readinessReport?.score || 0);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const highestScore = Math.max(...scores);
    const needsFixes = sessions.filter(
      (s) => (s.readinessReport?.score || 0) < 70 || (s.readinessReport?.criticalIssues?.length || 0) > 0
    ).length;

    const chartData = [...sessions].reverse().map((s) => ({
      name: new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: s.readinessReport?.score || 0,
    }));

    const latest = sessions[0];
    return { avgScore, highestScore, needsFixes, chartData, latest };
  }, [sessions]);

  const blockers = useMemo(() => {
    const counts = new Map<string, number>();
    sessions.forEach((s) => {
      (s.readinessReport?.criticalIssues || []).forEach((issue) => {
        counts.set(issue, (counts.get(issue) || 0) + 1);
      });
      (s.readinessReport?.warnings || []).forEach((issue) => {
        counts.set(issue, (counts.get(issue) || 0) + 1);
      });
    });

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([label, count]) => ({ label, count }));
  }, [sessions]);

  const applicationTypeData = useMemo(() => {
    const counts = new Map<string, number>();
    sessions.forEach((s) => {
      const type = s.dashboardSummary?.applicationType || s.applicationType || 'Other';
      counts.set(type, (counts.get(type) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }, [sessions]);

  const fitSnapshotAverages = useMemo(() => {
    if (!sessions.length) return [] as { name: string; value: number }[];
    const totals = { completeness: 0, specificity: 0, clarity: 0, lengthFit: 0 };
    let count = 0;
    sessions.forEach((s) => {
      const snapshot = s.dashboardSummary?.fitSnapshot;
      if (!snapshot) return;
      totals.completeness += snapshot.completeness;
      totals.specificity += snapshot.specificity;
      totals.clarity += snapshot.clarity;
      totals.lengthFit += snapshot.lengthFit;
      count += 1;
    });
    if (!count) return [];
    return [
      { name: 'Completeness', value: Math.round(totals.completeness / count) },
      { name: 'Specificity', value: Math.round(totals.specificity / count) },
      { name: 'Clarity', value: Math.round(totals.clarity / count) },
      { name: 'Length Fit', value: Math.round(totals.lengthFit / count) },
    ];
  }, [sessions]);

  const scoreByType = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    sessions.forEach((s) => {
      const type = s.dashboardSummary?.applicationType || s.applicationType || 'Other';
      const score = s.readinessReport?.score || 0;
      const entry = map.get(type) || { total: 0, count: 0 };
      entry.total += score;
      entry.count += 1;
      map.set(type, entry);
    });
    return Array.from(map.entries()).map(([name, value]) => ({
      name,
      value: Math.round(value.total / value.count),
    }));
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sessions.filter((s) => {
      const score = s.readinessReport?.score || 0;
      const statusKey = statusFromScore(score).key;
      if (statusFilter !== 'all' && statusKey !== statusFilter) return false;
      if (!q) return true;
      return (
        (s.title || '').toLowerCase().includes(q) ||
        (s.question || '').toLowerCase().includes(q) ||
        (s.brief || '').toLowerCase().includes(q)
      );
    });
  }, [sessions, query, statusFilter]);

  const openSession = (session: ReviewSession) => {
    navigate(`/reviews/${session.id}`);
  };

  const handleDelete = async (session: ReviewSession) => {
    if (!confirm(`Delete "${session.title}"?`)) return;
    await deleteReviewSession(session.id);
    setSessions((prev) => prev.filter((s) => s.id !== session.id));
  };

  if (loading) {
    return (
      <div className="relative min-h-[50vh] flex items-center justify-center">
        <SpectraNoise className="opacity-60" />
        <span className="relative z-10 w-6 h-6 border-2 border-yc/30 border-t-yc rounded-full animate-spin" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="relative pt-12 text-center animate-fade-in">
        <SpectraNoise className="opacity-60" />
        <div className="relative z-10">
          <div className="w-16 h-16 bg-surface-muted rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-soft">
            <Activity className="w-8 h-8 text-ink-faint" />
          </div>
          <h2 className="text-2xl font-semibold text-ink">No reviews yet.</h2>
          <p className="text-[14px] text-ink-secondary mt-2 mb-8">Run an application through the Review Studio to populate your dashboard.</p>
          <button onClick={() => navigate('/app')} className="px-6 py-3 bg-yc hover:bg-yc-hover text-white text-[14px] font-semibold rounded-xl transition-all">
            Start a review
          </button>
        </div>
      </div>
    );
  }

  const { avgScore, highestScore, needsFixes, chartData, latest } = stats!;
  const latestScore = latest.readinessReport?.score || 0;
  const latestStatus = statusFromScore(latestScore);

  const insight = useMemo(() => {
    if (sessions.length < 2) return null;
    
    const avg = fitSnapshotAverages.find(f => f.name === 'Specificity')?.value || 0;
    const clarity = fitSnapshotAverages.find(f => f.name === 'Clarity')?.value || 0;
    
    if (avg < 60 && clarity >= 70) {
      return {
        title: 'Strong clarity, weaker specificity',
        desc: 'Your answers are well-structured but could use more concrete, program-specific details. Add one program-specific sentence earlier in each answer.',
        type: 'suggestion' as const,
      };
    }
    if (needsFixes > sessions.length * 0.5) {
      return {
        title: 'High blocker rate',
        desc: 'Multiple reviews need fixes. Focus on the top critical issue from each review before submitting.',
        type: 'warning' as const,
      };
    }
    if (avgScore >= 80) {
      return {
        title: 'Strong readiness trend',
        desc: `Your average score is ${avgScore}%. You're consistently producing high-quality applications.`,
        type: 'success' as const,
      };
    }
    return {
      title: 'Room for improvement',
      desc: 'Keep iterating. Each review builds your understanding of what makes applications strong.',
      type: 'neutral' as const,
    };
  }, [sessions.length, fitSnapshotAverages, needsFixes, avgScore]);

  return (
    <div className="relative pb-20 pt-10">
      <SpectraNoise className="opacity-60" />
      <div className="relative z-10 max-w-6xl mx-auto">
        <AnimatedSection className="mb-8">
          <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">readiness cockpit</span>
          <h1 className="text-[clamp(1.6rem,3.6vw,2.4rem)] font-extrabold text-ink mt-2 font-display">Readiness Analytics</h1>
          <p className="text-[15px] text-ink-secondary mt-2 max-w-3xl">Track your application quality, blockers, and momentum — the command center for what you’ll fix before you hit submit.</p>
        </AnimatedSection>

        <AnimatedSection className="mb-8">
          <StaggeredReveal className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))]">
            {[
              { label: 'Total Reviews', val: sessions.length },
              { label: 'Average Score', val: avgScore },
              { label: 'Best Score', val: highestScore },
              { label: 'Needs Fixes', val: needsFixes },
            ].map((stat) => (
              <XRayCard key={stat.label} className="rounded-2xl border border-edge bg-surface p-5 shadow-soft">
                <div className="text-[11px] font-mono uppercase tracking-widest text-ink-muted mb-2">{stat.label}</div>
                <div className="text-3xl font-semibold text-ink">{stat.val}</div>
              </XRayCard>
            ))}
          </StaggeredReveal>
        </AnimatedSection>

        {insight && (
          <AnimatedSection className="mb-8">
            <div className={`rounded-2xl border p-5 shadow-soft ${
              insight.type === 'success' ? 'bg-[var(--success-soft)] border-[var(--success)]/20' :
              insight.type === 'warning' ? 'bg-[var(--warning-soft)] border-[var(--warning)]/20' :
              insight.type === 'suggestion' ? 'bg-[var(--accent-soft)] border-[var(--accent)]/20' :
              'bg-surface border-edge'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  insight.type === 'success' ? 'bg-[var(--success)]/10' :
                  insight.type === 'warning' ? 'bg-[var(--warning)]/10' :
                  insight.type === 'suggestion' ? 'bg-[var(--accent)]/10' :
                  'bg-surface-muted'
                }`}>
                  {insight.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-[var(--success)]" /> :
                   insight.type === 'warning' ? <AlertTriangle className="w-5 h-5 text-[var(--warning)]" /> :
                   <Sparkles className="w-5 h-5 text-[var(--accent)]" />}
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-ink">{insight.title}</div>
                  <div className="text-[12px] text-ink-secondary mt-1">{insight.desc}</div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        )}

        <AnimatedSection className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <XRayCard className="lg:col-span-2 rounded-3xl border border-edge bg-surface p-6 shadow-soft">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">latest review</span>
                  <h3 className="text-[18px] font-semibold text-ink mt-2">{latest.title}</h3>
                  <p className="text-[13px] text-ink-secondary mt-1">{latest.dashboardSummary?.verdict || 'Promising, but not ready yet.'}</p>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-ink-muted">Score</div>
                  <div className="text-[32px] font-semibold text-ink">
                    <ScoreReveal value={latestScore} />
                  </div>
                  <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full ${latestStatus.tone === 'ok' ? 'bg-ok-soft text-ok' : latestStatus.tone === 'warn' ? 'bg-warn-soft text-warn' : 'bg-err-soft text-err'}`}>
                    {latestStatus.label}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-edge bg-surface-muted p-4">
                  <span className="block text-[11px] font-mono text-ink-muted uppercase tracking-wider mb-1">Next Best Edit</span>
                  <p className="text-[13px] text-ink-secondary">{latest.dashboardSummary?.nextBestEdit || latest.dashboardSummary?.nextAction || 'Add one concrete outcome to sharpen the story.'}</p>
                </div>
                <div className="rounded-2xl border border-edge bg-surface-muted p-4">
                  <span className="block text-[11px] font-mono text-ink-muted uppercase tracking-wider mb-1">Evaluator Risk</span>
                  <p className="text-[13px] text-ink-secondary">{latest.dashboardSummary?.evaluatorRisk || 'No major risk noted yet.'}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button onClick={() => openSession(latest)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-yc hover:bg-yc-hover text-[var(--button-text)] text-[13px] font-semibold rounded-xl">
                  Open review <ArrowUpRight className="w-4 h-4" />
                </button>
                <button onClick={() => navigate('/app')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-muted hover:bg-surface border border-edge text-ink text-[13px] font-semibold rounded-xl">
                  Start new review
                </button>
              </div>
            </XRayCard>

            <div className="rounded-3xl border border-edge bg-surface p-6 shadow-soft">
              <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">latest run fit</span>
              <div className="mt-5 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-surface-muted flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-ink-secondary" />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-ink">Requirement Extraction</div>
                    <div className="text-[12px] text-ink-secondary mt-0.5">{latest.briefAnalysis?.explicitRequirements?.length || 0} explicit requests tracked.</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-surface-muted flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-ink-secondary" />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-ink">Word Count</div>
                    <div className="text-[12px] text-ink-secondary mt-0.5">{latest.readinessReport?.wordCount || 0} words total.</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-surface-muted flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-ink-secondary" />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-ink">Speaking Time</div>
                    <div className="text-[12px] text-ink-secondary mt-0.5">~{latest.readinessReport?.speakingTimeSeconds || 0} seconds at 145 wpm.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div className="lg:col-span-2 rounded-3xl border border-edge bg-surface p-6 shadow-soft" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5 }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[14px] font-semibold text-ink">Readiness trend</h3>
                <span className="text-[11px] text-ink-muted">Last {chartData.length} reviews</span>
              </div>
              <TrendChart data={chartData} />
            </motion.div>

            <motion.div className="rounded-3xl border border-edge bg-surface p-6 shadow-soft" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <h3 className="text-[14px] font-semibold text-ink mb-5">Common blockers</h3>
              {blockers.length === 0 ? (
                <p className="text-[13px] text-ink-secondary">No recurring blockers yet.</p>
              ) : (
                <IssueBreakdownChart data={blockers.map((item) => ({ name: item.label, value: item.count }))} />
              )}
            </motion.div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div className="rounded-3xl border border-edge bg-surface p-6 shadow-soft" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5 }}>
              <h3 className="text-[14px] font-semibold text-ink mb-5">Application type distribution</h3>
              {applicationTypeData.length ? (
                <ApplicationTypeChart data={applicationTypeData} />
              ) : (
                <p className="text-[13px] text-ink-secondary">No application data yet.</p>
              )}
            </motion.div>
            <motion.div className="rounded-3xl border border-edge bg-surface p-6 shadow-soft" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <h3 className="text-[14px] font-semibold text-ink mb-5">Reviewer averages</h3>
              {fitSnapshotAverages.length ? (
                <IssueBreakdownChart data={fitSnapshotAverages} />
              ) : (
                <p className="text-[13px] text-ink-secondary">No reviewer averages yet.</p>
              )}
            </motion.div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div className="rounded-3xl border border-edge bg-surface p-6 shadow-soft" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5 }}>
              <h3 className="text-[14px] font-semibold text-ink mb-5">Score by application type</h3>
              {scoreByType.length ? (
                <IssueBreakdownChart data={scoreByType} />
              ) : (
                <p className="text-[13px] text-ink-secondary">No score data yet.</p>
              )}
            </motion.div>
            <motion.div className="rounded-3xl border border-edge bg-surface p-6 shadow-soft" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <h3 className="text-[14px] font-semibold text-ink mb-5">Insight</h3>
              <div className="rounded-2xl border border-edge bg-surface-muted p-4 text-[13px] text-ink-secondary">
                Your project clarity is strong, but opportunity-fit sections score lower. Add one program-specific sentence earlier.
              </div>
            </motion.div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-3xl border border-edge bg-surface shadow-soft overflow-hidden">
              <div className="px-6 py-5 border-b border-edge flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-[14px] font-semibold text-ink">Review history</h3>
                  <p className="text-[12px] text-ink-secondary">Search, filter, and revisit any review.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-edge bg-surface-muted text-[12px] text-ink-secondary">
                    <Search className="w-3.5 h-3.5" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search reviews"
                      className="bg-transparent outline-none placeholder:text-ink-muted"
                    />
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                    className="px-3 py-2 rounded-lg border border-edge bg-surface-muted text-[12px] text-ink-secondary"
                  >
                    <option value="all">All statuses</option>
                    <option value="ready">Ready</option>
                    <option value="polish">Needs polish</option>
                    <option value="fix">Needs fixes</option>
                  </select>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <AnimatePresence mode="popLayout">
                  {filteredSessions.map((s) => {
                    const score = s.readinessReport?.score || 0;
                    const status = statusFromScore(score);
                    return (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-2xl border border-edge bg-surface-muted/40 p-4"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <div className="text-[12px] text-ink-muted">{new Date(s.createdAt).toLocaleDateString()}</div>
                            <div className="text-[15px] font-semibold text-ink mt-1">{s.title}</div>
                            <div className="text-[12px] text-ink-secondary mt-1 max-w-[420px]">{s.question}</div>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full ${status.tone === 'ok' ? 'bg-ok-soft text-ok' : status.tone === 'warn' ? 'bg-warn-soft text-warn' : 'bg-err-soft text-err'}`}>
                              {status.label}
                            </span>
                            <span className="text-[13px] font-semibold text-ink">{score}</span>
                            <button onClick={() => openSession(s)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yc text-[var(--button-text)] text-[12px] font-semibold">
                              Open <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(s)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-edge text-ink-secondary hover:text-err">
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {filteredSessions.length === 0 && (
                  <div className="text-center text-[13px] text-ink-secondary">No reviews match this filter.</div>
                )}
              </div>
            </div>

            <ReviewHistoryTable items={sessions.slice(0, 6)} onOpen={openSession} />
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
