import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

/**
 * /auth/callback
 *
 * Handles the redirect after email verification / magic link.
 * Supabase appends a token hash to the URL; calling getSession()
 * exchanges it for a real session automatically.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');

  useEffect(() => {
    let cancelled = false;

    const handleCallback = async () => {
      if (!supabase) {
        // No Supabase — go to app in demo mode
        navigate('/app', { replace: true });
        return;
      }

      try {
        // Give Supabase a moment to exchange the token from the URL hash
        const { data } = await supabase.auth.getSession();

        if (cancelled) return;

        if (data.session) {
          setStatus('success');
          // Brief delay so the user sees the confirmation message
          setTimeout(() => {
            navigate('/app', { replace: true });
          }, 1200);
        } else {
          setStatus('error');
        }
      } catch (err) {
        console.error('[AuthCallback] Error:', err);
        if (!cancelled) setStatus('error');
      }
    };

    handleCallback();
    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="text-center max-w-sm w-full">
        <div className="w-14 h-14 bg-yc text-white rounded-2xl flex items-center justify-center shadow-soft mx-auto mb-6">
          <Sparkles className="w-7 h-7" />
        </div>

        {status === 'checking' && (
          <>
            <div className="w-6 h-6 border-2 border-yc/30 border-t-yc rounded-full animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-ink">Finishing sign in…</h1>
            <p className="text-[13px] text-ink-secondary mt-2">
              Verifying your session, please wait.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-6 h-6 text-ok mx-auto mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-ink">Signed in!</h1>
            <p className="text-[13px] text-ink-secondary mt-2">
              Redirecting you to the app…
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="text-xl font-semibold text-ink mb-2">Sign-in link expired</h1>
            <p className="text-[13px] text-ink-secondary mb-6">
              The link may have already been used or has expired. Please sign in again.
            </p>
            <button
              onClick={() => navigate('/auth', { replace: true })}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-yc hover:bg-yc-hover text-canvas text-[14px] font-semibold rounded-xl shadow-sm transition-all"
            >
              Back to sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
}
