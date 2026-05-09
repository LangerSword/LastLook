export interface SupabaseUser {
  id: string;
  email?: string;
}

/**
 * Verify a Supabase access token via the REST API.
 * Uses the auth/v1/user endpoint to validate the JWT against Supabase's auth server.
 */
export async function verifyUser(
  request: Request,
  env: { SUPABASE_URL?: string; SUPABASE_ANON_KEY?: string }
): Promise<SupabaseUser | null> {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    console.error('[verifyUser] Missing SUPABASE_URL or SUPABASE_ANON_KEY');
    return null;
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
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
      return null;
    }

    const user = (await res.json()) as any;
    if (user && user.id) {
      return { id: user.id, email: user.email };
    }
  } catch (err) {
    console.error('[verifyUser] Network error verifying user:', err);
  }

  return null;
}
