import type { SupabaseUser } from './auth';

export interface UsageEnv {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  ADMIN_EMAILS?: string;
}

export const LIMITS = {
  fullReviewsPerDay: 5,
  individualActionsPerDay: 15,
};

/**
 * Checks usage quota and logs the event if quota allows.
 * If quota is exceeded, returns a 429 Response.
 * If quota is valid, returns null (meaning OK to proceed).
 */
export async function checkAndLogUsage(
  user: SupabaseUser,
  action: 'analyze' | 'generate' | 'check' | 'full_review',
  env: UsageEnv,
  provider: string,
  model: string
): Promise<Response | null> {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    // If Supabase isn't configured for the server, we can't track usage.
    // Allow by default to not break local dev without Supabase.
    return null;
  }

  const isAdmin = env.ADMIN_EMAILS?.split(',')
    .map(e => e.trim().toLowerCase())
    .includes(user.email?.toLowerCase() || '');

  // Admins bypass normal limits
  const maxLimit = isAdmin
    ? 100 // generous limit for admins
    : action === 'full_review'
    ? LIMITS.fullReviewsPerDay
    : LIMITS.individualActionsPerDay;

  try {
    // 1. Check current usage for today
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    // Using Supabase PostgREST to count records
    // Determine which actions to count:
    // If we're doing a full_review, count full_reviews.
    // If doing an individual action, we should probably count all individual actions combined.
    const actionFilter = action === 'full_review' 
      ? 'eq.full_review' 
      : 'in.(analyze,generate,check)';

    const url = new URL(`${env.SUPABASE_URL}/rest/v1/usage_events`);
    url.searchParams.set('user_id', `eq.${user.id}`);
    url.searchParams.set('action', actionFilter);
    url.searchParams.set('created_at', `gte.${startOfDay.toISOString()}`);
    // Request exact count via headers
    
    const countRes = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'apikey': env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
        'Range-Unit': 'items',
        'Prefer': 'count=exact',
      },
    });

    if (countRes.ok) {
      // Content-Range format: "items 0-0/1"
      const rangeHeader = countRes.headers.get('Content-Range') || '';
      const match = rangeHeader.match(/\/(\d+)$/);
      const count = match ? parseInt(match[1], 10) : 0;

      if (count >= maxLimit) {
        return new Response(
          JSON.stringify({
            error: 'daily_limit_reached',
            message: isAdmin 
              ? 'Admin limit reached.'
              : 'You’ve used today’s free review limit. Your saved dashboards are still available.',
            limits: LIMITS,
          }),
          {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // 2. Log the event (asynchronous is fine, but we'll await to be safe on CF Workers)
    await fetch(`${env.SUPABASE_URL}/rest/v1/usage_events`, {
      method: 'POST',
      headers: {
        'apikey': env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        user_id: user.id,
        action,
        provider,
        model,
      }),
    });
    
  } catch (err) {
    console.error('[checkAndLogUsage] Error:', err);
    // On DB error, fail open to avoid breaking the product? 
    // Or fail closed? We will fail open to ensure users aren't blocked by transient DB issues.
  }

  return null;
}
