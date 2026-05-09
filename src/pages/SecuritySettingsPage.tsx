import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, KeyRound, Smartphone, LogOut, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import AnimatedSection from '../components/motion/AnimatedSection';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';

export default function SecuritySettingsPage() {
  const { user, isDemoMode, signOut } = useAuth();
  const navigate = useNavigate();

  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [isPasswordStrong, setIsPasswordStrong] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // MFA State
  const [mfaStatus, setMfaStatus] = useState<'loading' | 'disabled' | 'enabled'>('loading');
  const [factors, setFactors] = useState<any[]>([]);
  const [enrollmentFactorId, setEnrollmentFactorId] = useState<string | null>(null);
  const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Delete State
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetchMfaStatus();
  }, []);

  const fetchMfaStatus = async () => {
    if (!supabase) return;
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      console.error('Error fetching factors:', error);
      return;
    }
    const totpFactors = data.totp || [];
    const verifiedFactors = totpFactors.filter((f: any) => f.status === 'verified');
    setFactors(verifiedFactors);
    setMfaStatus(verifiedFactors.length > 0 ? 'enabled' : 'disabled');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setPasswordError(null);
    setPasswordStatus('loading');

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setPasswordError(error.message);
      setPasswordStatus('idle');
    } else {
      setPasswordStatus('success');
      setNewPassword('');
      setTimeout(() => setPasswordStatus('idle'), 5000);
    }
  };

  const handleSetupMfa = async () => {
    if (!supabase) return;
    setMfaError(null);
    setIsEnrolling(true);

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
    });

    if (error) {
      setMfaError(error.message);
      setIsEnrolling(false);
      return;
    }

    setEnrollmentFactorId(data.id);
    setQrCodeSvg(data.totp.qr_code);
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !enrollmentFactorId) return;
    setMfaError(null);

    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId: enrollmentFactorId });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId: enrollmentFactorId,
        challengeId: challenge.data.id,
        code: mfaCode,
      });

      if (verify.error) throw verify.error;

      setIsEnrolling(false);
      setEnrollmentFactorId(null);
      setQrCodeSvg(null);
      setMfaCode('');
      await fetchMfaStatus();
    } catch (err: any) {
      setMfaError(err.message || 'Failed to verify code.');
    }
  };

  const handleRemoveMfa = async (factorId: string) => {
    if (!supabase) return;
    setMfaError(null);
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) {
      setMfaError(error.message);
    } else {
      await fetchMfaStatus();
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleDeleteReviews = async () => {
    if (!supabase || !user) return;
    if (!window.confirm("Are you sure you want to delete all your saved reviews? This cannot be undone.")) return;
    
    setIsDeleting(true);
    setDeleteError(null);

    const { error } = await supabase
      .from('review_sessions')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      setDeleteError(error.message);
    } else {
      alert("All saved reviews have been deleted.");
    }
    setIsDeleting(false);
  };

  if (isDemoMode) {
    return (
      <div className="space-y-6">
        <AnimatedSection>
          <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">security</span>
          <h1 className="text-2xl font-semibold text-ink mt-2">Security</h1>
          <p className="text-[13px] text-ink-secondary mt-2">You are in Demo Mode. Sign in to access security settings.</p>
        </AnimatedSection>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <AnimatedSection>
        <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">settings</span>
        <h1 className="text-2xl font-semibold text-ink mt-2">Security</h1>
        <p className="text-[13px] text-ink-secondary mt-2">Manage your password, two-factor authentication, and data.</p>
      </AnimatedSection>

      {/* Password Section */}
      <section className="rounded-3xl border border-edge bg-surface p-6 shadow-soft space-y-4">
        <div className="flex items-center gap-2 text-[14px] font-semibold text-ink border-b border-edge pb-4">
          <KeyRound className="w-4 h-4" /> Password
        </div>
        
        <form onSubmit={handlePasswordChange} className="max-w-md space-y-4 pt-2">
          {passwordError && <div className="p-3 rounded-xl bg-err-soft text-err text-[13px] border border-err/20">{passwordError}</div>}
          {passwordStatus === 'success' && (
            <div className="p-3 rounded-xl bg-ok-soft text-ok text-[13px] border border-ok/20">
              Password updated. We’ll notify you by email if security notifications are enabled.
            </div>
          )}

          <div>
            <label className="block text-[12px] font-medium text-ink-secondary mb-1.5 ml-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-surface-muted border border-edge rounded-xl px-4 py-2.5 text-[14px] text-ink placeholder:text-ink-muted outline-none focus:border-yc focus:ring-1 focus:ring-yc/20"
              placeholder="••••••••"
              minLength={8}
            />
            {newPassword && (
              <PasswordStrengthMeter password={newPassword} onStrengthChange={setIsPasswordStrong} />
            )}
          </div>
          
          <button
            type="submit"
            disabled={passwordStatus === 'loading' || !newPassword || !isPasswordStrong}
            className="px-4 py-2 bg-ink hover:bg-ink-secondary disabled:bg-surface-muted disabled:text-ink-faint text-canvas text-[13px] font-semibold rounded-lg shadow-sm transition-all duration-200"
          >
            {passwordStatus === 'loading' ? 'Updating...' : 'Change password'}
          </button>
        </form>
      </section>

      {/* MFA Section */}
      <section className="rounded-3xl border border-edge bg-surface p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-edge pb-4">
          <div className="flex items-center gap-2 text-[14px] font-semibold text-ink">
            <Smartphone className="w-4 h-4" /> Two-factor authentication
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono border ${mfaStatus === 'enabled' ? 'bg-ok-soft text-ok border-ok/30' : 'bg-surface-muted text-ink-muted border-edge'}`}>
            {mfaStatus === 'enabled' ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {mfaError && <div className="p-3 rounded-xl bg-err-soft text-err text-[13px] border border-err/20">{mfaError}</div>}

        {mfaStatus === 'enabled' ? (
          <div className="pt-2 space-y-4">
            <p className="text-[13px] text-ink-secondary">Two-factor authentication is currently enabled on your account.</p>
            <div className="space-y-3">
              {factors.map(factor => (
                <div key={factor.id} className="flex items-center justify-between p-3 rounded-xl border border-edge bg-surface-muted">
                  <div className="text-[13px] font-mono text-ink">TOTP Authenticator</div>
                  <button 
                    onClick={() => handleRemoveMfa(factor.id)}
                    className="text-[12px] font-medium text-err hover:text-err/80 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : isEnrolling ? (
          <form onSubmit={handleVerifyMfa} className="pt-2 space-y-4 max-w-md">
            <p className="text-[13px] text-ink-secondary">
              Scan the QR code below with your authenticator app (like Authy, Google Authenticator, or 1Password).
            </p>
            {qrCodeSvg && (
              <div 
                className="bg-white p-4 rounded-xl inline-block"
                dangerouslySetInnerHTML={{ __html: qrCodeSvg }} 
              />
            )}
            <div>
              <label className="block text-[12px] font-medium text-ink-secondary mb-1.5 ml-1">Verification Code</label>
              <input
                type="text"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                className="w-full bg-surface-muted border border-edge rounded-xl px-4 py-2.5 text-[14px] text-ink placeholder:text-ink-muted outline-none font-mono tracking-widest"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={mfaCode.length !== 6}
                className="flex-1 px-4 py-2 bg-ink hover:bg-ink-secondary disabled:bg-surface-muted disabled:text-ink-faint text-canvas text-[13px] font-semibold rounded-lg shadow-sm transition-all duration-200"
              >
                Verify & Enable
              </button>
              <button
                type="button"
                onClick={() => { setIsEnrolling(false); setMfaError(null); setEnrollmentFactorId(null); setQrCodeSvg(null); }}
                className="px-4 py-2 bg-surface border border-edge text-ink text-[13px] font-semibold rounded-lg hover:bg-surface-muted transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="pt-2">
            <p className="text-[13px] text-ink-secondary mb-4">
              Add an additional layer of security to your account.
            </p>
            <button
              onClick={handleSetupMfa}
              className="px-4 py-2 bg-surface border border-edge text-ink text-[13px] font-semibold rounded-lg hover:bg-surface-muted transition-all duration-200"
            >
              Set up 2FA
            </button>
          </div>
        )}
      </section>

      {/* Sessions & Data */}
      <section className="rounded-3xl border border-edge bg-surface p-6 shadow-soft space-y-4">
        <div className="flex items-center gap-2 text-[14px] font-semibold text-ink border-b border-edge pb-4">
          <Shield className="w-4 h-4" /> Sessions & Data
        </div>
        
        <div className="pt-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[13px] font-semibold text-ink">Sign out everywhere</div>
              <div className="text-[12px] text-ink-secondary mt-1">Sign out of this browser and clear BYOK session storage keys.</div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface border border-edge text-ink text-[13px] font-semibold rounded-lg hover:bg-surface-muted transition-all duration-200 shrink-0"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-edge pt-6">
            <div>
              <div className="text-[13px] font-semibold text-err">Delete saved reviews</div>
              <div className="text-[12px] text-ink-secondary mt-1">Permanently delete all your review sessions from the server.</div>
              {deleteError && <div className="mt-2 text-[12px] text-err">{deleteError}</div>}
            </div>
            <button
              onClick={handleDeleteReviews}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-err-soft text-err border border-err/20 text-[13px] font-semibold rounded-lg hover:bg-err hover:text-white transition-all duration-200 shrink-0 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" /> {isDeleting ? 'Deleting...' : 'Delete saved reviews'}
            </button>
          </div>
        </div>
      </section>
      
      {/* Security Notes */}
      <div className="text-[12px] text-ink-muted px-4">
        <p><strong>Note on BYOK API Keys:</strong> LastLook does not store your API key on our servers. In this beta, BYOK keys are kept only in this browser session. Clear them manually by logging out.</p>
        <p className="mt-2">Use 2FA if you store private application drafts or API keys.</p>
      </div>
    </div>
  );
}
