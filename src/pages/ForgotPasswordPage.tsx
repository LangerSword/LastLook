import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AnimatedSection from '../components/motion/AnimatedSection';
import SpectraNoise from '../components/motion/SpectraNoise';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }

    setStatus('loading');
    setError(null);

    const redirectTo = `${window.location.origin}/reset-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (resetError) {
      setError(resetError.message);
      setStatus('idle');
    } else {
      setStatus('success');
    }
  };

  const inputCls =
    'w-full bg-surface-muted border border-edge rounded-xl px-4 py-3 text-[14px] text-ink placeholder:text-ink-muted focus:border-yc focus:ring-1 focus:ring-yc/20 transition-all duration-200 outline-none';

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6 bg-canvas relative overflow-hidden">
      <SpectraNoise className="opacity-60" />
      
      <AnimatedSection className="w-full max-w-[400px] relative z-10">
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-yc text-white rounded-xl flex items-center justify-center shadow-soft mx-auto mb-6">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">Reset Password</h1>
          <p className="text-[14px] text-ink-secondary mt-2">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-err-soft border border-err/20 text-err text-[13px] animate-fade-in">
            {error}
          </div>
        )}

        {status === 'success' ? (
          <div className="text-center">
            <div className="mb-6 p-4 rounded-xl bg-ok-soft border border-ok/20 text-ok text-[13px] animate-fade-in">
              Check your email. We sent a password reset link.
            </div>
            <button
              onClick={() => navigate('/auth')}
              className="inline-flex items-center gap-2 text-[14px] font-medium text-ink-secondary hover:text-ink transition-colors mt-4"
            >
              <ArrowLeft className="w-4 h-4" /> Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-ink-secondary mb-1.5 ml-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-ink-muted absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${inputCls} pl-11`}
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status === 'loading' || !email}
              className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-ink hover:bg-ink-secondary disabled:bg-surface-muted disabled:text-ink-faint text-canvas text-[14px] font-semibold rounded-xl shadow-sm transition-all duration-200 mt-6"
            >
              {status === 'loading' ? (
                <span className="w-4 h-4 border-2 border-[color:var(--button-text)]/30 border-t-[color:var(--button-text)] rounded-full animate-spin" />
              ) : (
                <>
                  Send reset link <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {status !== 'success' && (
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/auth')}
              className="inline-flex items-center gap-2 text-[13px] font-medium text-ink-secondary hover:text-ink transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to sign in
            </button>
          </div>
        )}
      </AnimatedSection>
    </div>
  );
}
