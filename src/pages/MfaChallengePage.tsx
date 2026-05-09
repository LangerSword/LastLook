import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AnimatedSection from '../components/motion/AnimatedSection';
import SpectraNoise from '../components/motion/SpectraNoise';

export default function MfaChallengePage() {
  const [code, setCode] = useState('');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFactor = async () => {
      if (!supabase) return;
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) {
        setError(error.message);
        return;
      }
      
      const totpFactor = data.totp[0];
      if (totpFactor) {
        setFactorId(totpFactor.id);
      } else {
        setError('No TOTP factor found for this account.');
      }
    };
    
    fetchFactor();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !factorId) return;

    setError(null);
    setLoading(true);

    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) {
        setError(challenge.error.message);
        setLoading(false);
        return;
      }

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code
      });

      if (verify.error) {
        setError(verify.error.message);
        setLoading(false);
      } else {
        navigate('/app');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
      setLoading(false);
    }
  };

  const inputCls =
    'w-full bg-surface-muted border border-edge rounded-xl px-4 py-3 text-[14px] text-ink placeholder:text-ink-muted focus:border-yc focus:ring-1 focus:ring-yc/20 transition-all duration-200 outline-none text-center font-mono tracking-widest text-lg';

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6 bg-canvas relative overflow-hidden">
      <SpectraNoise className="opacity-60" />
      
      <AnimatedSection className="w-full max-w-[400px] relative z-10">
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-yc text-white rounded-xl flex items-center justify-center shadow-soft mx-auto mb-6">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">Two-Factor Authentication</h1>
          <p className="text-[14px] text-ink-secondary mt-2">
            Enter the 6-digit code from your authenticator app.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-err-soft border border-err/20 text-err text-[13px] animate-fade-in text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              className={inputCls}
              placeholder="000000"
              maxLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6 || !factorId}
            className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-ink hover:bg-ink-secondary disabled:bg-surface-muted disabled:text-ink-faint text-canvas text-[14px] font-semibold rounded-xl shadow-sm transition-all duration-200 mt-6"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-[color:var(--button-text)]/30 border-t-[color:var(--button-text)] rounded-full animate-spin" />
            ) : (
              <>
                Verify Code <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button 
            onClick={() => navigate('/auth')}
            className="text-[13px] text-ink-secondary hover:text-ink transition-colors"
          >
            Back to sign in
          </button>
        </div>
      </AnimatedSection>
    </div>
  );
}
