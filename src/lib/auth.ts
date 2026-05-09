/**
 * auth.ts — Legacy auth helpers (still used by reviewStore.ts for server-side session checks).
 * 
 * For UI components, prefer useAuth() from contexts/AuthContext.tsx instead.
 */
import { supabase } from './supabase';

export interface AppUser {
  id: string;
  email: string;
  isDemo: boolean;
}

const DEMO_MODE_KEY = 'lastlook_demo_mode';

export async function getSessionUser(): Promise<AppUser | null> {
  // Check local demo mode flag
  if (localStorage.getItem(DEMO_MODE_KEY) === 'true') {
    return { id: 'demo-user', email: 'demo@local.host', isDemo: true };
  }

  if (!supabase) return null;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      return { id: session.user.id, email: session.user.email || '', isDemo: false };
    }
  } catch (err) {
    console.error('[auth] getSessionUser error:', err);
  }
  return null;
}

export async function signInWithMagicLink(email: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase not configured.' };
  const redirectTo = `${window.location.origin}/auth/callback`;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });
  return { error: error?.message || null };
}

export async function signInWithPassword(email: string, password: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase not configured.' };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message || null };
}

export async function signUp(email: string, password: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase not configured.' };
  const redirectTo = `${window.location.origin}/auth/callback`;
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: redirectTo },
  });
  return { error: error?.message || null };
}

export async function enableDemoMode() {
  localStorage.setItem(DEMO_MODE_KEY, 'true');
  if (supabase) await supabase.auth.signOut();
}

export async function signOut() {
  localStorage.removeItem(DEMO_MODE_KEY);
  if (supabase) {
    await supabase.auth.signOut();
  }
}
