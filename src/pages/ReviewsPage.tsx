import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ArrowUpRight, Trash2 } from 'lucide-react';
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
        <div className="rounded-3xl border border-edge bg-surface p-10 text-center text-ink-secondary">
          No reviews yet. Run a new review to populate this list.
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((session) => {
            const score = session.readinessReport?.score || 0;
            const status = statusFromScore(score);
            return (
              <div key={session.id} className="rounded-3xl border border-edge bg-surface p-5 shadow-soft">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-[11px] text-ink-muted">{new Date(session.createdAt).toLocaleDateString()}</div>
                    <div className="text-[16px] font-semibold text-ink mt-1">{session.title}</div>
                    <div className="text-[12px] text-ink-secondary mt-1 max-w-[520px]">{session.question || 'No question saved.'}</div>
                    <div className="text-[12px] text-ink-muted mt-2">
                      {session.dashboardSummary?.applicationType || session.applicationType || 'Other'}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      status.tone === 'ok' ? 'bg-ok-soft text-ok' : status.tone === 'warn' ? 'bg-warn-soft text-warn' : 'bg-err-soft text-err'
                    }`}>
                      {status.label}
                    </span>
                    <span className="text-[15px] font-semibold text-ink">{score}</span>
                    <button onClick={() => openSession(session)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-yc text-[var(--button-text)] text-[12px] font-semibold">
                      Open <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(session)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-edge text-ink-secondary hover:text-err">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-edge bg-surface-muted p-4">
                  <div className="text-[11px] font-mono text-ink-muted uppercase tracking-widest">Next best edit</div>
                  <div className="text-[13px] text-ink-secondary mt-2">
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
