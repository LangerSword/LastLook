import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ArrowUpRight, Trash2, FileText, Zap } from 'lucide-react';
import { deleteReviewSession, getReviewSessions, type ReviewSession } from '../lib/reviewStore';
import AnimatedSection from '../components/motion/AnimatedSection';

const statusFromScore = (score: number) => {
  if (score >= 80) return { label: 'Ready', tone: 'ok' } as const;
  if (score >= 60) return { label: 'Needs polish', tone: 'warn' } as const;
  return { label: 'Needs fixes', tone: 'err' } as const;
};

export default function ReviewsPage() {
  const [sessions, setSessions] = useState<ReviewSession[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    getReviewSessions().then(setSessions);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sessions.filter((session) => {
      if (statusFilter !== 'all') {
        const tone = statusFromScore(session.readinessReport?.score || 0).label;
        if (statusFilter === 'ready' && tone !== 'Ready') return false;
        if (statusFilter === 'polish' && tone !== 'Needs polish') return false;
        if (statusFilter === 'fix' && tone !== 'Needs fixes') return false;
      }
      if (typeFilter !== 'all') {
        const appType = session.dashboardSummary?.applicationType || session.applicationType || 'Other';
        if (appType !== typeFilter) return false;
      }
      if (!q) return true;
      return (
        (session.title || '').toLowerCase().includes(q) ||
        (session.question || '').toLowerCase().includes(q) ||
        (session.brief || '').toLowerCase().includes(q)
      );
    });
  }, [sessions, query, statusFilter, typeFilter]);

  const openSession = (session: ReviewSession) => {
    navigate(`/reviews/${session.id}`);
  };

  const handleDelete = async (session: ReviewSession) => {
    if (!confirm(`Delete "${session.title}"?`)) return;
    await deleteReviewSession(session.id);
    setSessions((prev) => prev.filter((s) => s.id !== session.id));
  };

  return (
    <div className="space-y-6">
      <AnimatedSection>
        <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">review library</span>
        <h1 className="text-2xl font-semibold text-ink mt-2">Saved reviews</h1>
        <p className="text-[13px] text-ink-secondary mt-2">Find past reviews, open dashboards, or delete old sessions.</p>
      </AnimatedSection>

      <div className="rounded-3xl border border-edge bg-surface p-4 shadow-soft">
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
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-edge bg-surface-muted text-[12px] text-ink-secondary">
            <Filter className="w-3.5 h-3.5" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-transparent">
              <option value="all">All statuses</option>
              <option value="ready">Ready</option>
              <option value="polish">Needs polish</option>
              <option value="fix">Needs fixes</option>
            </select>
          </label>
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-edge bg-surface-muted text-[12px] text-ink-secondary">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-transparent">
              <option value="all">All types</option>
              {['Fellowship', 'Hackathon', 'Internship', 'Accelerator', 'Scholarship', 'Club/community', 'Grant', 'Other'].map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] border border-edge flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-ink-muted" />
          </div>
          <h3 className="text-[18px] font-bold text-ink mb-2">No reviews yet</h3>
          <p className="text-[14px] text-ink-secondary mb-6 max-w-sm mx-auto">
            Run your first LastLook review to see it here. Every review gets a readiness score and a fix plan.
          </p>
          <button onClick={() => navigate('/app')} className="btn-primary text-[14px] px-5 py-2.5">
            <Zap className="w-4 h-4" /> Start a review
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((session) => {
            const score = session.readinessReport?.score || 0;
            const status = statusFromScore(score);
            return (
              <div key={session.id} className="card p-5 group">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] text-ink-muted">{new Date(session.createdAt).toLocaleDateString()}</span>
                      <span className="text-[11px] text-ink-muted">·</span>
                      <span className="text-[11px] text-ink-muted">
                        {session.dashboardSummary?.applicationType || session.applicationType || 'Other'}
                      </span>
                    </div>
                    <div className="text-[16px] font-bold text-ink font-headline">{session.title}</div>
                    <div className="text-[13px] text-ink-secondary mt-1 truncate max-w-xl">{session.question || 'No question saved.'}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                        status.tone === 'ok' ? 'bg-ok-soft text-ok' : status.tone === 'warn' ? 'bg-warn-soft text-warn' : 'bg-err-soft text-err'
                      }`}>
                        {status.label}
                      </span>
                      <span className="text-[20px] font-bold text-ink font-headline">{score}</span>
                    </div>
                    <button onClick={() => openSession(session)} className="btn-primary text-[12px] px-3 py-2">
                      Open <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(session)} className="btn-ghost text-[12px] px-3 py-2 hover:text-err">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-edge bg-[var(--surface-2)] p-4">
                  <div className="text-[11px] font-mono text-ink-muted uppercase tracking-[0.14em] mb-1">Next best edit</div>
                  <div className="text-[13px] text-ink-secondary">
                    {session.dashboardSummary?.nextBestEdit || session.dashboardSummary?.topFix || 'Add a program-specific line early.'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
