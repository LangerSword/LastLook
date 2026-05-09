import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import type { Theme } from '../lib/theme';
import { getSessionUser, signOut, type AppUser } from '../lib/auth';
import { getReviewSessions } from '../lib/reviewStore';
import { supabase } from '../lib/supabase';

interface Props {
  theme: Theme;
  onThemeChange: (t: Theme) => void;
}

export default function Navigation({ theme, onThemeChange }: Props) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [sessionCount, setSessionCount] = useState<number | null>(null);
  const [quotaRemaining, setQuotaRemaining] = useState<string | null>(null);
  const navigate = useNavigate();
  const supabaseEnabled = Boolean(supabase);

  useEffect(() => {
    getSessionUser().then(setUser);
  }, []);

  useEffect(() => {
    if (!user) {
      setSessionCount(null);
      setQuotaRemaining(null);
      return;
    }
    getReviewSessions().then((sessions) => setSessionCount(sessions.length));
    const quota = localStorage.getItem('lastlook_free_reviews');
    if (quota) setQuotaRemaining(quota);
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-edge bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto w-[min(100%-2rem,1200px)] h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-base font-bold text-ink tracking-tight">LastLook</Link>
          
          {user && (
            <div className="hidden sm:flex items-center gap-4 text-[13px] font-medium text-ink-secondary">
              <Link to="/app" className="hover:text-ink transition-colors">Workspace</Link>
              <Link to="/dashboard" className="hover:text-ink transition-colors">Dashboard</Link>
              <Link to="/walkthrough" className="hover:text-ink transition-colors">Walkthrough</Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!supabaseEnabled && (
            <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full border border-edge bg-surface-muted text-[11px] font-mono text-ink-muted">
              Local mode
            </span>
          )}
          <ThemeToggle value={theme} onChange={onThemeChange} />
          
          {user ? (
            <div className="flex items-center gap-3 ml-2 border-l border-edge pl-3">
              <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-ink-muted">
                {sessionCount !== null && (
                  <span className="px-2 py-1 rounded-full border border-edge bg-surface-muted">Sessions: {sessionCount}</span>
                )}
                {quotaRemaining && (
                  <span className="px-2 py-1 rounded-full border border-edge bg-surface-muted">Free: {quotaRemaining}</span>
                )}
                {user.isDemo && (
                  <span className="px-2 py-1 rounded-full border border-edge bg-surface-muted">Demo</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[12px] text-ink-secondary">
                <div className="w-6 h-6 rounded-full bg-surface-muted border border-edge flex items-center justify-center">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
                <span className="hidden sm:inline-block max-w-[120px] truncate">{user.email}</span>
              </div>
              <button onClick={handleSignOut} className="p-1.5 text-ink-muted hover:text-err transition-colors rounded-lg hover:bg-surface-muted">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/walkthrough" className="text-[13px] font-medium text-ink-secondary hover:text-ink px-3 py-1.5 transition-colors">Walkthrough</Link>
              <Link to="/auth" className="text-[13px] font-medium text-ink-secondary hover:text-ink px-3 py-1.5 transition-colors">Sign in</Link>
              <Link to="/auth" className="px-3 sm:px-4 py-1.5 sm:py-2 bg-yc hover:bg-yc-hover text-[var(--button-text)] text-[12px] sm:text-[13px] font-semibold rounded-lg shadow-sm transition-all duration-200">
                Get started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
