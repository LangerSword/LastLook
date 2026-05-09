import { supabase } from './supabase';
import type { BriefAnalysis, CheckResult } from './types';
import { getSessionUser } from './auth';
import type { DashboardSummary } from './dashboardSummary';

export interface ReviewSession {
  id: string;
  user_id?: string;
  title: string;
  brief?: string;
  question?: string;
  finalAnswer: string;
  generatedDraft?: string;
  briefAnalysis?: BriefAnalysis;
  readinessReport?: CheckResult;
  reviewerPanel?: Record<string, {
    score: number;
    summary: string;
    findings: string[];
  }>;
  dashboardSummary?: DashboardSummary;
  applicationType?: string;
  reviewStrictness?: string;
  programName?: string;
  deadline?: string;
  createdAt: string;
}

const LOCAL_STORAGE_KEY = 'lastlook_review_sessions';

export async function saveReviewSession(session: Omit<ReviewSession, 'id' | 'createdAt'>): Promise<ReviewSession | null> {
  const user = await getSessionUser();
  const fullSession: ReviewSession = {
    ...session,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    user_id: user && !user.isDemo ? user.id : undefined,
  };

  if (user && !user.isDemo && supabase) {
    const { error } = await supabase
      .from('review_sessions')
      .insert([{
        id: fullSession.id,
        user_id: fullSession.user_id,
        title: fullSession.title,
        brief: fullSession.brief,
        question: fullSession.question,
        final_answer: fullSession.finalAnswer,
        generated_draft: fullSession.generatedDraft,
        brief_analysis: fullSession.briefAnalysis,
        readiness_report: fullSession.readinessReport,
        dashboard_summary: fullSession.dashboardSummary,
        created_at: fullSession.createdAt
      }]);
    
    if (error) {
      console.error('Failed to save to Supabase:', error);
      // Fallback to local
      saveToLocal(fullSession);
    }
  } else {
    // Save local
    saveToLocal(fullSession);
  }

  return fullSession;
}

export async function getReviewSessions(): Promise<ReviewSession[]> {
  const user = await getSessionUser();
  
  let remoteSessions: ReviewSession[] = [];
  if (user && !user.isDemo && supabase) {
    const { data, error } = await supabase
      .from('review_sessions')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      remoteSessions = data.map(mapDbToSession);
    }
  }

  // Always blend local sessions to support graceful offline/demo
  const localStr = localStorage.getItem(LOCAL_STORAGE_KEY);
  let localSessions: ReviewSession[] = [];
  if (localStr) {
    try {
      localSessions = JSON.parse(localStr);
    } catch { }
  }

  // If user is logged in, we might still want to see their local drafts or just remote?
  // Let's just merge and sort them. In a real app we might migrate them.
  const all = [...remoteSessions, ...localSessions];
  
  // Deduplicate by ID and sort
  const map = new Map<string, ReviewSession>();
  for (const s of all) {
    if (!map.has(s.id)) map.set(s.id, s);
  }

  return Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function deleteReviewSession(id: string): Promise<void> {
  const user = await getSessionUser();
  if (user && !user.isDemo && supabase) {
    await supabase.from('review_sessions').delete().eq('id', id);
  }
  
  const localStr = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (localStr) {
    try {
      let local: ReviewSession[] = JSON.parse(localStr);
      local = local.filter(s => s.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(local));
    } catch {}
  }
}

function saveToLocal(session: ReviewSession) {
  const localStr = localStorage.getItem(LOCAL_STORAGE_KEY);
  let local: ReviewSession[] = [];
  if (localStr) {
    try { local = JSON.parse(localStr); } catch {}
  }
  local.unshift(session);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(local));
}

function mapDbToSession(row: any): ReviewSession {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    brief: row.brief || '',
    question: row.question || '',
    finalAnswer: row.final_answer || '',
    generatedDraft: row.generated_draft,
    briefAnalysis: row.brief_analysis,
    readinessReport: row.readiness_report,
    dashboardSummary: row.dashboard_summary,
    createdAt: row.created_at,
  };
}
