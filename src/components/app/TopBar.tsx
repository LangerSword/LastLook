import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ChevronRight, Sparkles, Settings, Shield, LogOut, User } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import type { Theme } from '../../lib/theme';
import { useAuth } from '../../contexts/AuthContext';
import { getHealth } from '../../lib/api';
import { useUsage } from '../../hooks/useUsage';

interface Props {
  theme: Theme;
  onThemeChange: (t: Theme) => void;
}

type ProviderStatus = 'unknown' | 'healthy' | 'offline';

const routeLabels: Record<string, string> = {
  '/app': 'Review Studio',
  '/reviews': 'My Reviews',
  '/dashboard': 'Dashboard',
  '/memory': 'Memory',
  '/settings': 'Settings',
  '/settings/security': 'Security',
};

export default function TopBar({ theme, onThemeChange }: Props) {
  const { user, isAuthenticated, isDemoMode, signOut } = useAuth();
  const [providerStatus, setProviderStatus] = useState<ProviderStatus>('unknown');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const usage = useUsage();
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    getHealth()
      .then(() => { if (active) setProviderStatus('healthy'); })
      .catch(() => { if (active) setProviderStatus('offline'); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const currentRouteLabel = routeLabels[location.pathname] || 'LastLook';
  const statusLabel = providerStatus === 'healthy' ? 'AI Ready' : providerStatus === 'offline' ? 'AI Offline' : 'Checking...';

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-xl">
      <div className="flex items-center justify-between h-full px-3 lg:px-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center shadow-md">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="absolute -inset-0.5 bg-[var(--accent)] opacity-25 blur-sm rounded-xl" />
            </div>
            <div className="hidden sm:block">
              <span className="text-[15px] font-bold text-[var(--text)] tracking-tight">LastLook</span>
            </div>
          </div>

          {location.pathname !== '/' && (
            <>
              <ChevronRight className="w-4 h-4 text-[var(--text-faint)] hidden sm:block" />
              <span className="hidden sm:block text-[13px] font-medium text-[var(--text-muted)]">
                {currentRouteLabel}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface-muted)] border border-[var(--border)]">
            <span className={`w-2 h-2 rounded-full ${
              providerStatus === 'healthy' ? 'bg-[var(--success)]' :
              providerStatus === 'offline' ? 'bg-[var(--warning)]' :
              'bg-[var(--text-faint)] animate-pulse'
            }`} />
            <span className="text-[11px] font-medium text-[var(--text-muted)]">{statusLabel}</span>
          </div>

          {!isAuthenticated || isDemoMode ? null : (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface-muted)] border border-[var(--border)]">
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                {usage.loading ? '...' : `${Math.max(0, 5 - usage.fullReviewsUsed)}/5`}
              </span>
              <span className="text-[10px] text-[var(--text-faint)]">left</span>
            </div>
          )}

          <ThemeToggle value={theme} onChange={onThemeChange} />

          {isAuthenticated && user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--surface-muted)] transition-all"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="hidden md:block text-[12px] font-medium text-[var(--text)] max-w-[140px] truncate">
                  {user.email?.split('@')[0] || 'User'}
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] animate-[fade-in_200ms_ease-out]">
                  <div className="px-3 py-2.5 border-b border-[var(--border)] mb-1">
                    <p className="text-[12px] font-medium text-[var(--text)] truncate">{user.email}</p>
                    <p className="text-[10px] text-[var(--text-faint)]">Account</p>
                  </div>
                  <button
                    onClick={() => { setUserMenuOpen(false); navigate('/settings'); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <button
                    onClick={() => { setUserMenuOpen(false); navigate('/settings/security'); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    Security
                  </button>
                  <div className="border-t border-[var(--border)] mt-1 pt-1">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : isDemoMode ? (
            <button
              onClick={() => navigate('/auth')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-semibold rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-all shadow-sm"
            >
              Sign in
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
