import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuthContextValue {
  /** Raw Supabase user (null if not authenticated or Supabase not configured) */
  user: User | null;
  /** Raw Supabase session */
  session: Session | null;
  /** True while checking initial session */
  loading: boolean;
  /** True only if Supabase env vars are present */
  isSupabaseConfigured: boolean;
  /** True if user is signed in with a real Supabase account */
  isAuthenticated: boolean;
  /**
   * True ONLY when:
   *  a) Supabase is not configured, OR
   *  b) user explicitly chose "Continue in demo mode"
   * Never true if Supabase is configured and a session exists.
   */
  isDemoMode: boolean;
  /** Sign in with email + password */
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  /** Sign up with email + password (includes redirect URL) */
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  /** Sign out and clear demo mode flag */
  signOut: () => Promise<void>;
  /** Explicitly opt in to demo mode (persisted via localStorage) */
  enableDemoMode: () => Promise<void>;
  /** Force re-fetch session from Supabase */
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_MODE_KEY = 'lastlook_demo_mode';

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const isSupabaseConfigured = Boolean(supabase);

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // ── Derived flag: authenticated only if session exists and demo not chosen
  const isAuthenticated = Boolean(session?.user && !isDemoMode);

  // ── Initialize: fetch existing session + subscribe to auth changes
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // If Supabase is not configured, fall back to demo mode
      if (!supabase) {
        setIsDemoMode(true);
        setLoading(false);
        return;
      }

      // Restore explicit demo-mode preference FIRST
      const storedDemo = localStorage.getItem(DEMO_MODE_KEY) === 'true';
      if (storedDemo) {
        setIsDemoMode(true);
      }

      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;

        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
          // If user has a real session, clear demo mode flag regardless of localStorage
          setIsDemoMode(false);
          localStorage.removeItem(DEMO_MODE_KEY);
        }
      } catch (err) {
        console.error('[AuthContext] getSession error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase?.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;

      if (_event === 'SIGNED_IN' && newSession) {
        setSession(newSession);
        setUser(newSession.user);
        setIsDemoMode(false);
        localStorage.removeItem(DEMO_MODE_KEY);
      } else if (_event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
      } else if (_event === 'TOKEN_REFRESHED' && newSession) {
        setSession(newSession);
        setUser(newSession.user);
      }
    }) ?? { data: { subscription: { unsubscribe: () => {} } } };

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────

  const refreshSession = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      setSession(data.session);
      setUser(data.session.user);
      setIsDemoMode(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    if (!supabase) return { error: 'Supabase is not configured.' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    if (!supabase) return { error: 'Supabase is not configured.' };
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem(DEMO_MODE_KEY);
    setIsDemoMode(false);
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setUser(null);
  }, []);

  const enableDemoMode = useCallback(async () => {
    localStorage.setItem(DEMO_MODE_KEY, 'true');
    setIsDemoMode(true);
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isSupabaseConfigured,
        isAuthenticated,
        isDemoMode,
        signIn,
        signUp,
        signOut,
        enableDemoMode,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
