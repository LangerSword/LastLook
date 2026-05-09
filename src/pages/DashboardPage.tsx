import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, CheckCircle2, FileText, ArrowUpRight, Clock, Search, Trash2, AlertTriangle, Sparkles, Layout, Terminal, TrendingUp, BarChart3 } from 'lucide-react';
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block font-mono text-[11px] text-[var(--accent)] font-bold uppercase tracking-[0.2em] mb-4 bg-[var(--accent-soft)] px-3 py-1 rounded-md">
      {children}
    </span>
  );
}

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
    const readyCount = sessions.filter(s => (s.readinessReport?.score || 0) >= 80).length;
    const latest = sessions[0];
    return { avgScore, highestScore, readyCount, latest };
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

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-[var(--accent)] flex items-center justify-center mx-auto mb-4 animate-spin">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <p className="text-[14px] font-black uppercase tracking-tighter">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="pt-24 text-center">
        <div className="w-20 h-20 bg-[var(--surface-2)] rounded-[30px] flex items-center justify-center mx-auto mb-8 border-2 border-[var(--border)]">
          <Activity className="w-10 h-10 text-ink-faint" />
        </div>
        <h2 className="text-[32px] font-black uppercase tracking-tighter mb-4">No reviews yet.</h2>
        <p className="text-[18px] text-ink-secondary mb-12 font-medium">Run an application through the Review Studio to populate your board.</p>
        <button onClick={() => navigate('/app')} className="btn-primary px-10 py-4 rounded-xl font-bold uppercase tracking-tight shadow-lift">
          Start your first review
        </button>
      </div>
    );
  }

  const { avgScore, highestScore, readyCount, latest } = stats!;

  return (
    <div className="pb-24 animate-fade-in">
      
      {/* ─── DASHBOARD HERO ──────────────────────────────────────── */}
      <section className="relative py-16 px-6 bg-[var(--surface)] border-b-2 border-[var(--border)] overflow-hidden">
        <div className="max-w-[1400px] mx-auto">
          <SectionLabel>Performance Board</SectionLabel>
          <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-black uppercase tracking-tighter text-ink leading-[0.9] font-display mb-12">
            Your Application<br />Command Center.
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Total Reviews', value: sessions.length, icon: FileText },
              { label: 'Average Readiness', value: `${avgScore}%`, icon: TrendingUp },
              { label: 'Ready to Submit', value: readyCount, icon: CheckCircle2 },
              { label: 'Common Blocker', value: 'Fit specificity', icon: AlertTriangle },
            ].map((stat, i) => (
              <div key={i} className="card p-8 bg-[var(--surface-2)] border-2 border-[var(--border)] group hover:border-[var(--accent)] transition-all">
                <div className="flex justify-between items-start mb-4">
                  <stat.icon className="w-6 h-6 text-[var(--accent)]" />
                </div>
                <div className="text-[32px] font-black text-ink mb-1">{stat.value}</div>
                <div className="text-[12px] font-black uppercase tracking-widest text-ink-secondary">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="max-w-[1400px] mx-auto p-6 md:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Charts & Trends */}
          <div className="lg:col-span-8 space-y-12">
            <div className="card p-10 bg-[var(--surface)] border-2 border-[var(--border)]">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-[20px] font-black uppercase tracking-tighter flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[var(--accent)]" />
                  Readiness Trend
                </h2>
              </div>
              <div className="h-[300px]">
                <TrendChart data={sessions.slice(0, 10).reverse().map(s => ({
                  name: new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                  score: s.readinessReport?.score || 0
                }))} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-[24px] font-black uppercase tracking-tighter">Recent Reviews</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
                  <input 
                    type="text" 
                    placeholder="Search reviews..." 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-xl bg-[var(--surface-2)] border-2 border-[var(--border)] focus:border-[var(--accent)] outline-none text-[13px] font-bold"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                {filteredSessions.map((session) => (
                  <div 
                    key={session.id} 
                    onClick={() => navigate(`/reviews/${session.id}`)}
                    className="card p-6 bg-[var(--surface)] border-2 border-[var(--border)] hover:border-[var(--accent)] cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-[18px] ${
                        (session.readinessReport?.score || 0) >= 80 ? 'bg-[var(--success-soft)] text-[var(--success)]' : 'bg-[var(--warning-soft)] text-[var(--warning)]'
                      }`}>
                        {session.readinessReport?.score || 0}
                      </div>
                      <div>
                        <h3 className="text-[18px] font-black uppercase tracking-tighter text-ink group-hover:text-[var(--accent)] transition-colors">
                          {session.title || 'Untitled Review'}
                        </h3>
                        <div className="flex items-center gap-3 text-[12px] font-bold text-ink-secondary uppercase tracking-widest mt-1">
                          <span>{session.applicationType || 'General'}</span>
                          <span className="opacity-20">•</span>
                          <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <ArrowUpRight className="w-6 h-6 text-ink-faint group-hover:text-[var(--accent)] transition-all" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Insights */}
          <div className="lg:col-span-4 space-y-8">
            <div className="sticky top-28 space-y-8">
              <div className="card p-8 bg-[var(--surface-3)] border-2 border-[var(--border)]">
                <h2 className="text-[18px] font-black uppercase tracking-tighter mb-6 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[var(--accent)]" />
                  Human Insights
                </h2>
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-[var(--surface)] border-2 border-[var(--border)]">
                    <h4 className="text-[14px] font-black uppercase tracking-tight mb-2">Specificity Warning</h4>
                    <p className="text-[13px] text-ink-secondary leading-relaxed">Your last 3 reviews flagged "generic language". Try adding more metrics to your projects.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--surface)] border-2 border-[var(--border)]">
                    <h4 className="text-[14px] font-black uppercase tracking-tight mb-2">Momentum Check</h4>
                    <p className="text-[13px] text-ink-secondary leading-relaxed">You've completed 5 reviews this week. You're 40% more likely to submit on time.</p>
                  </div>
                </div>
              </div>

              <div className="card p-8 bg-[var(--surface-2)] border-2 border-[var(--border)]">
                <h2 className="text-[18px] font-black uppercase tracking-tighter mb-6">Issue Breakdown</h2>
                <div className="h-[250px]">
                  <IssueBreakdownChart data={[
                    { name: 'Fit', value: 40 },
                    { name: 'Clarity', value: 25 },
                    { name: 'Length', value: 20 },
                    { name: 'Voice', value: 15 },
                  ]} />
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
