import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleCheck, CircleAlert, LogOut, User, Cloud, HardDrive } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import type { Theme } from '../../lib/theme';
import { useAuth } from '../../contexts/AuthContext';
import { getHealth } from '../../lib/api';

interface Props {
  theme: Theme;
  onThemeChange: (t: Theme) => void;
}

type ProviderStatus = 'unknown' | 'healthy' | 'offline';

export default function TopBar({ theme, onThemeChange }: Props) {
  const { user, isAuthenticated, isDemoMode, isSupabaseConfigured, signOut } = useAuth();
  const [providerStatus, setProviderStatus] = useState<ProviderStatus>('unknown');
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    getHealth()
      .then(() => { if (active) setProviderStatus('healthy'); })
      .catch(() => { if (active) setProviderStatus('offline'); });
    return () => { active = false; };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const statusLabel =
    providerStatus === 'healthy' ? 'AI Ready' : providerStatus === 'offline' ? 'AI Offline' : 'Checking AI';

  // ── Mode badge label + icon
  const ModeBadge = () => {
    if (isAuthenticated && user) {
      return (
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-ok/30 bg-ok-soft text-[11px] font-mono text-ok">
          <Cloud className="w-3 h-3" />
          Cloud sync on
        </span>
      );
    }
    if (isDemoMode) {
      return (
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-edge bg-surface-muted text-[11px] font-mono text-ink-muted">
          <HardDrive className="w-3 h-3" />
          Local demo mode
        </span>
      );
    }
    if (!isSupabaseConfigured) {
      return (
        <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full border border-edge bg-surface-muted text-[11px] font-mono text-ink-muted">
          Supabase not configured
        </span>
      );
    }
    return null;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-edge bg-canvas/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-surface-muted border border-edge flex items-center justify-center">
            {providerStatus === 'healthy' ? (
              <CircleCheck className="w-4 h-4 text-ok" />
            ) : (
              <CircleAlert className="w-4 h-4 text-warn" />
            )}
          </div>
          <div>
            <div className="text-[13px] font-semibold text-ink">Reviewer Command</div>
            <div className="text-[11px] text-ink-muted">{statusLabel}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ModeBadge />
          <ThemeToggle value={theme} onChange={onThemeChange} />

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 pl-3 border-l border-edge">
              <div className="flex items-center gap-2 text-[12px] text-ink-secondary">
                <div className="w-7 h-7 rounded-full bg-surface-muted border border-edge flex items-center justify-center">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="hidden sm:inline-block max-w-[160px] truncate">{user.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="p-1.5 text-ink-muted hover:text-err transition-colors rounded-lg hover:bg-surface-muted"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : isDemoMode ? (
            <button
              onClick={() => navigate('/auth')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium border border-edge rounded-lg bg-surface hover:bg-surface-muted text-ink-secondary transition-all"
            >
              Sign in
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
