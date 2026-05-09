export interface SupabaseUser {
  id: string;
  email?: string;
}

export type AuthResult =
  | { user: SupabaseUser; error: null }
  | { user: null; error: 'no_token' }
  | { user: null; error: 'server_not_configured' }
  | { user: null; error: 'invalid_token' };

/**
 * Check if the server has Supabase environment variables configured.
 */
export function isServerSupabaseConfigured(env: { SUPABASE_URL?: string; SUPABASE_ANON_KEY?: string }): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);
}

/**
 * Verify a Supabase access token via the REST API.
 * Uses the auth/v1/user endpoint to validate the JWT against Supabase's auth server.
 */
export async function verifyUser(
  request: Request,
  env: { SUPABASE_URL?: string; SUPABASE_ANON_KEY?: string }
): Promise<SupabaseUser | null> {
  const result = await verifyUserWithReason(request, env);
  return result.user;
}

export async function verifyUserWithReason(
  request: Request,
  env: { SUPABASE_URL?: string; SUPABASE_ANON_KEY?: string }
): Promise<AuthResult> {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    console.error('[verifyUser] Missing SUPABASE_URL or SUPABASE_ANON_KEY');
    return { user: null, error: 'server_not_configured' };
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'no_token' };
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: env.SUPABASE_ANON_KEY,
      },
    });

    if (!res.ok) {
      console.error('[verifyUser] Invalid token or error fetching user:', await res.text().catch(() => ''));
      return { user: null, error: 'invalid_token' };
    }

    const user = (await res.json()) as any;
    if (user && user.id) {
      return { user: { id: user.id, email: user.email }, error: null };
    }
  } catch (err) {
    console.error('[verifyUser] Network error verifying user:', err);
  }

  return { user: null, error: 'invalid_token' };
}
