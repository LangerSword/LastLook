import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, ChevronDown } from 'lucide-react';
import AnimatedSection from '../components/motion/AnimatedSection';
import ThemeToggle from '../components/ThemeToggle';
import { getHealth, type HealthResponse } from '../lib/api';
import type { Theme } from '../lib/theme';
import { useAuth } from '../contexts/AuthContext';
import { applyTheme, initializeTheme, setStoredTheme } from '../lib/theme';
import { useUsage } from '../hooks/useUsage';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const IS_DEV = import.meta.env.DEV;

export default function SettingsPage() {
  const [theme, setTheme] = useState<Theme>('system');
  const [providerStatus, setProviderStatus] = useState<'ok' | 'warn'>('warn');
  const [defaultStrictness, setDefaultStrictness] = useState('Balanced');
  const [defaultType, setDefaultType] = useState('Fellowship');
  const [debugOpen, setDebugOpen] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [serverSupabaseStatus, setServerSupabaseStatus] = useState<string>('unknown');
  const [hasAccessToken, setHasAccessToken] = useState<boolean | null>(null);

  const { user, session, isSupabaseConfigured, isAuthenticated, isDemoMode } = useAuth();
  const usage = useUsage();
  const navigate = useNavigate();

  useEffect(() => {
    getHealth()
      .then((data) => {
        setProviderStatus('ok');
        if ('supabase' in data && data.supabase?.server) {
          setServerSupabaseStatus(data.supabase.server);
        }
      })
      .catch(() => setProviderStatus('warn'));
  }, []);

  useEffect(() => {
    const checkAccessToken = async () => {
      if (supabase && isSupabaseConfigured) {
        const { data } = await supabase.auth.getSession();
        setHasAccessToken(!!data.session?.access_token);
      } else {
        setHasAccessToken(null);
      }
    };
    checkAccessToken();
  }, [session]);

  useEffect(() => {
    const current = initializeTheme();
    setTheme(current);
  }, []);

  useEffect(() => {
    const storedStrictness = localStorage.getItem('lastlook_default_strictness');
    const storedType = localStorage.getItem('lastlook_default_app_type');
    if (storedStrictness) setDefaultStrictness(storedStrictness);
    if (storedType) setDefaultType(storedType);
  }, []);

  useEffect(() => {
    if (supabase && isAuthenticated) {
      supabase.auth.mfa.listFactors().then(({ data }) => {
        if (data?.totp) {
          const verified = data.totp.filter((f: any) => f.status === 'verified');
          setMfaEnabled(verified.length > 0);
        }
      });
    }
  }, [isAuthenticated]);

  const handleThemeChange = (value: Theme) => {
    setStoredTheme(value);
    applyTheme(value);
    setTheme(value);
    window.dispatchEvent(new CustomEvent('lastlook-theme-change', { detail: value }));
  };

  // Storage mode label
  const storageMode = isAuthenticated ? 'Supabase (cloud)' : 'localStorage (local)';
  const storageModeDesc = isAuthenticated
    ? `Signed in as ${user?.email}. Reviews sync to your account.`
    : isDemoMode
    ? 'Local demo mode — reviews are saved only in this browser.'
    : 'Sign in to save reviews across devices.';

  return (
    <div className="space-y-6">
      <AnimatedSection>
        <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">settings</span>
        <h1 className="text-2xl font-semibold text-ink mt-2">Preferences</h1>
        <p className="text-[13px] text-ink-secondary mt-2">Manage theme, defaults, and provider status.</p>
      </AnimatedSection>

      <div className="rounded-3xl border border-edge bg-surface p-6 shadow-soft space-y-4">
        {/* Theme */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-semibold text-ink">Theme</div>
            <div className="text-[12px] text-ink-secondary">Light, dark, or system preference.</div>
          </div>
          <ThemeToggle value={theme} onChange={handleThemeChange} />
        </div>

        {/* Defaults */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-[12px] text-ink-secondary">
            Default strictness
            <select
              value={defaultStrictness}
              onChange={(e) => {
                setDefaultStrictness(e.target.value);
                localStorage.setItem('lastlook_default_strictness', e.target.value);
              }}
              className="mt-2 w-full bg-surface-muted border border-edge rounded-xl px-3 py-2.5 text-[13px] text-ink"
            >
              {['Gentle', 'Balanced', 'Brutal'].map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </label>
          <label className="text-[12px] text-ink-secondary">
            Default application type
            <select
              value={defaultType}
              onChange={(e) => {
                setDefaultType(e.target.value);
                localStorage.setItem('lastlook_default_app_type', e.target.value);
              }}
              className="mt-2 w-full bg-surface-muted border border-edge rounded-xl px-3 py-2.5 text-[13px] text-ink"
            >
              {['Fellowship', 'Hackathon', 'Internship', 'Accelerator', 'Scholarship', 'Club/community', 'Grant', 'Other'].map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Account / Storage Mode */}
        <div className="rounded-2xl border border-edge bg-surface-muted p-4 space-y-1">
          <div className="flex items-center justify-between">
            <div className="text-[13px] font-semibold text-ink">Account &amp; storage</div>
            {isAuthenticated ? (
              <CheckCircle2 className="w-4 h-4 text-ok" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-warn" />
            )}
          </div>
          <div className="text-[12px] text-ink-secondary">{storageModeDesc}</div>
          <div className="text-[11px] font-mono text-ink-muted mt-1">Storage: {storageMode}</div>
        </div>

        {/* Supabase status */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-semibold text-ink">Supabase status</div>
            <div className="text-[12px] text-ink-secondary">
              {isSupabaseConfigured ? 'Connected' : 'Not configured (local fallback active)'}
            </div>
          </div>
          {isSupabaseConfigured ? (
            <CheckCircle2 className="w-5 h-5 text-ok" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-warn" />
          )}
        </div>

        {/* AI provider status */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-semibold text-ink">AI provider status</div>
            <div className="text-[12px] text-ink-secondary">
              {providerStatus === 'ok' ? 'Ready' : 'Offline — run npm run pages:dev'}
            </div>
          </div>
          {providerStatus === 'ok' ? (
            <CheckCircle2 className="w-5 h-5 text-ok" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-warn" />
          )}
        </div>
        {/* Usage Stats */}
        {isAuthenticated && !isDemoMode && (
          <div className="rounded-2xl border border-edge bg-surface-muted p-4 space-y-2">
            <div className="text-[13px] font-semibold text-ink">Usage & Limits (Free Beta)</div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <div className="text-[11px] text-ink-muted uppercase tracking-wider">Full Reviews</div>
                <div className="text-[14px] text-ink font-mono mt-0.5">
                  {usage.loading ? '...' : `${usage.fullReviewsUsed} / 5`}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-ink-muted uppercase tracking-wider">Individual Actions</div>
                <div className="text-[14px] text-ink font-mono mt-0.5">
                  {usage.loading ? '...' : `${usage.individualActionsUsed} / 15`}
                </div>
              </div>
            </div>
            <div className="text-[11px] text-ink-secondary mt-2 border-t border-edge pt-2">
              Limits reset daily at midnight UTC.
            </div>
          </div>
        )}
      </div>

      {/* Security Navigation */}
      <div className="rounded-3xl border border-edge bg-surface p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-semibold text-ink">Security &amp; Data</div>
            <div className="text-[12px] text-ink-secondary">Manage 2FA, password, and active sessions.</div>
          </div>
          <button 
            onClick={() => navigate('/settings/security')}
            className="px-4 py-2 bg-surface border border-edge text-ink text-[13px] font-semibold rounded-lg hover:bg-surface-muted transition-all duration-200"
          >
            Security Settings
          </button>
        </div>
      </div>

      {/* Security Audit Hints */}
      <div className="rounded-3xl border border-edge bg-surface p-6 shadow-soft space-y-4">
        <div>
          <div className="text-[13px] font-semibold text-ink">Security Audit Hints</div>
          <div className="text-[12px] text-ink-secondary mb-4">Quick overview of your active security protections.</div>
        </div>
        <div className="space-y-2">
          {[
            ['Supabase configured', isSupabaseConfigured],
            ['MFA enabled', mfaEnabled],
            ['BYOK active', Boolean(sessionStorage.getItem('lastlook_byok'))],
            ['Shared quota protected', isSupabaseConfigured && !isDemoMode]
          ].map(([label, value]) => (
            <div key={String(label)} className="flex items-center justify-between py-2 border-b border-edge last:border-0">
              <span className="text-[13px] text-ink-secondary">{String(label)}</span>
              <span className={`text-[12px] font-medium ${value ? 'text-ok' : 'text-warn'}`}>
                {value ? 'Yes' : 'No'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Dev Debug Panel — development only */}
      {IS_DEV && (
        <div className="rounded-3xl border border-edge bg-surface p-6 shadow-soft">
          <button
            onClick={() => setDebugOpen((p) => !p)}
            className="flex items-center justify-between w-full text-left"
          >
            <div>
              <div className="text-[13px] font-semibold text-ink font-mono">
                🛠 Auth debug panel
              </div>
              <div className="text-[12px] text-ink-muted">Development only — never shown in production</div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-ink-muted transition-transform ${debugOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {debugOpen && (
            <div className="mt-4 space-y-2 font-mono text-[12px]">
              {[
                ['isSupabaseConfigured', isSupabaseConfigured],
                ['server Supabase (from /api/health)', serverSupabaseStatus],
                ['session exists', Boolean(session)],
                ['user email', user?.email || null],
                ['access token exists', hasAccessToken],
                ['isAuthenticated', isAuthenticated],
                ['isDemoMode', isDemoMode],
                ['storage mode', isAuthenticated ? 'supabase' : 'localStorage'],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex items-center justify-between py-1.5 border-b border-edge last:border-0">
                  <span className="text-ink-secondary">{String(label)}</span>
                  <span
                    className={
                      typeof value === 'boolean'
                        ? value
                          ? 'text-ok font-semibold'
                          : 'text-ink-muted'
                        : 'text-ink'
                    }
                  >
                    {typeof value === 'boolean' ? (value ? 'yes' : 'no') : String(value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
