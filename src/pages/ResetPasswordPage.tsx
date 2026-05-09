import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AnimatedSection from '../components/motion/AnimatedSection';
import SpectraNoise from '../components/motion/SpectraNoise';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null);
  const [isPasswordStrong, setIsPasswordStrong] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we arrived here via a recovery link (Supabase sets session on hash match)
    const checkSession = async () => {
      if (!supabase) {
        setHasRecoverySession(false);
        return;
      }
      
      const { data } = await supabase.auth.getSession();
      // Also check if there's an active PASSWORD_RECOVERY event
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setHasRecoverySession(true);
        }
      });
      
      if (data.session) {
        setHasRecoverySession(true);
      } else {
        // Note: Using setTimeout since onAuthStateChange triggers immediately on mount
        setTimeout(async () => {
          if (!supabase) return;
          const { data: delayedData } = await supabase.auth.getSession();
          setHasRecoverySession(!!delayedData.session);
        }, 1000);
      }
      
      return () => {
        subscription.unsubscribe();
      };
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setError(null);
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setStatus('loading');

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError.message);
      setStatus('idle');
    } else {
      setStatus('success');
      setTimeout(() => {
        navigate('/app', { replace: true });
      }, 2000);
    }
  };

  const inputCls =
    'w-full bg-surface-muted border border-edge rounded-xl px-4 py-3 text-[14px] text-ink placeholder:text-ink-muted focus:border-yc focus:ring-1 focus:ring-yc/20 transition-all duration-200 outline-none';

  if (hasRecoverySession === null) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-yc/30 border-t-yc rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6 bg-canvas relative overflow-hidden">
      <SpectraNoise className="opacity-60" />
      
      <AnimatedSection className="w-full max-w-[400px] relative z-10">
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-yc text-white rounded-xl flex items-center justify-center shadow-soft mx-auto mb-6">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">Set New Password</h1>
          <p className="text-[14px] text-ink-secondary mt-2">
            Please enter your new password below.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-err-soft border border-err/20 text-err text-[13px] animate-fade-in">
            {error}
          </div>
        )}

        {!hasRecoverySession ? (
          <div className="text-center">
            <div className="mb-6 p-4 rounded-xl bg-err-soft border border-err/20 text-err text-[13px]">
              This reset link is invalid or expired. Request a new password reset link.
            </div>
            <button
              onClick={() => navigate('/forgot-password')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-yc hover:bg-yc-hover text-canvas text-[14px] font-semibold rounded-xl shadow-sm transition-all"
            >
              Request new link
            </button>
          </div>
        ) : status === 'success' ? (
          <div className="text-center">
            <div className="mb-6 p-4 rounded-xl bg-ok-soft border border-ok/20 text-ok text-[13px] animate-fade-in">
              Password updated. We’ll notify you by email if security notifications are enabled. Redirecting...
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-ink-secondary mb-1.5 ml-1">
                New password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-ink-muted absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`${inputCls} pl-11`}
                  placeholder="••••••••"
                  minLength={8}
                />
              </div>
              {newPassword && (
                <PasswordStrengthMeter 
                  password={newPassword} 
                  onStrengthChange={setIsPasswordStrong} 
                />
              )}
            </div>

            <div>
              <label className="block text-[12px] font-medium text-ink-secondary mb-1.5 ml-1">
                Confirm new password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-ink-muted absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`${inputCls} pl-11`}
                  placeholder="••••••••"
                  minLength={8}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status === 'loading' || !newPassword || !confirmPassword || !isPasswordStrong}
              className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-ink hover:bg-ink-secondary disabled:bg-surface-muted disabled:text-ink-faint text-canvas text-[14px] font-semibold rounded-xl shadow-sm transition-all duration-200 mt-6"
            >
              {status === 'loading' ? (
                <span className="w-4 h-4 border-2 border-[color:var(--button-text)]/30 border-t-[color:var(--button-text)] rounded-full animate-spin" />
              ) : (
                <>
                  Update password <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </AnimatedSection>
    </div>
  );
}
