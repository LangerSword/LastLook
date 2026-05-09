import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AnimatedSection from '../components/motion/AnimatedSection';
import SpectraNoise from '../components/motion/SpectraNoise';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPasswordStrong, setIsPasswordStrong] = useState(false);

  const navigate = useNavigate();
  const { signIn, signUp, enableDemoMode, isSupabaseConfigured } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    if (isSignUp) {
      const res = await signUp(email, password);
      setLoading(false);
      if (res.error) {
        setError(res.error);
      } else {
        setInfo(
          'Account created! Check your email for a verification link. ' +
          'Once verified, return here to sign in.'
        );
      }
    } else {
      const res = await signIn(email, password);
      setLoading(false);
      if (res.error) {
        setError(res.error);
      } else if (res.requiresMfa) {
        navigate('/mfa-challenge');
      } else {
        navigate('/app');
      }
    }
  };

  const handleDemoMode = async () => {
    await enableDemoMode();
    navigate('/app');
  };

  const inputCls =
    'w-full bg-surface-muted border border-edge rounded-xl px-4 py-3 text-[14px] text-ink placeholder:text-ink-muted focus:border-yc focus:ring-1 focus:ring-yc/20 transition-all duration-200 outline-none';

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex bg-canvas relative overflow-hidden">
      <SpectraNoise className="opacity-60" />
      {/* Left Column - Value Prop */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-surface-muted/30 border-r border-edge relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(40%_40%_at_50%_50%,rgb(var(--accent-rgb)/0.05),transparent)] pointer-events-none" />

        <div className="max-w-md relative z-10">
          <div className="w-12 h-12 bg-yc text-white rounded-xl flex items-center justify-center shadow-soft mb-8">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-semibold text-ink tracking-tight mb-4">
            The final check before you submit.
          </h1>
          <p className="text-[15px] text-ink-secondary leading-relaxed mb-8">
            Save your application profile, analyze hidden brief requirements, and get a readiness
            score on your final draft.
          </p>

          <div className="space-y-4">
            {[
              'Personalized application drafts based on your local memory.',
              'Readiness scoring that prevents generic, weak answers.',
              'Persistent review dashboard to track your submissions.',
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-ok-soft flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-ok" />
                </div>
                <span className="text-[14px] text-ink-secondary leading-relaxed">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-[12px] text-ink-muted relative z-10">
          LastLook is a student-built tool. Your memory stays local.
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative z-10">
        <AnimatedSection className="w-full max-w-[400px]">
          <div className="text-center mb-10 lg:hidden">
            <div className="w-12 h-12 bg-yc text-white rounded-xl flex items-center justify-center shadow-soft mx-auto mb-6">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-semibold text-ink tracking-tight">LastLook</h1>
          </div>

          {!isSupabaseConfigured && (
            <div className="mb-6 p-4 rounded-xl bg-surface-muted border border-edge text-[13px] text-ink-secondary">
              Supabase is not configured — running in local demo mode. Reviews are saved in this
              browser only.
            </div>
          )}

          <h2 className="text-2xl font-semibold text-ink tracking-tight mb-2">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-[14px] text-ink-secondary mb-8">
            {isSignUp
              ? 'Start analyzing applications securely.'
              : 'Sign in to access your review dashboard.'}
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-err-soft border border-err/20 text-err text-[13px] animate-fade-in">
              {error}
            </div>
          )}

          {info && (
            <div className="mb-6 p-4 rounded-xl bg-ok-soft border border-ok/20 text-ok text-[13px] animate-fade-in">
              {info}
            </div>
          )}

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

            <div>
              <label className="block text-[12px] font-medium text-ink-secondary mb-1.5 ml-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-ink-muted absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputCls} pl-11`}
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
              {!isSignUp && (
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-[12px] font-medium text-yc hover:text-yc-hover transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
              {isSignUp && password && (
                <PasswordStrengthMeter 
                  password={password} 
                  onStrengthChange={setIsPasswordStrong} 
                />
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password || (isSignUp && !isPasswordStrong)}
              className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-ink hover:bg-ink-secondary disabled:bg-surface-muted disabled:text-ink-faint text-canvas text-[14px] font-semibold rounded-xl shadow-sm transition-all duration-200 mt-6"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-[color:var(--button-text)]/30 border-t-[color:var(--button-text)] rounded-full animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Sign up' : 'Sign in'} <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-[13px] text-ink-secondary">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setInfo(null);
              }}
              className="text-yc hover:text-yc-hover font-semibold transition-colors"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-edge text-center">
            <p className="text-[12px] text-ink-muted mb-4 uppercase tracking-widest font-mono">
              Or try without an account
            </p>
            <button
              onClick={handleDemoMode}
              className="w-full px-4 py-3 bg-surface hover:bg-surface-muted border border-edge text-ink text-[13px] font-semibold rounded-xl shadow-sm transition-all duration-200"
            >
              Continue in Demo Mode
            </button>
            <p className="text-[12px] text-ink-faint mt-3">
              Reviews saved locally in this browser only.
            </p>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
