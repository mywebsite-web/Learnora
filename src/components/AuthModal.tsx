import React, { useState, useEffect, useRef } from 'react';
import { useAuth, DEMO_PERSONAS, DemoPersona } from '../context/AuthContext';
import { 
  BrainCircuit, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle, 
  Check, 
  Sparkles, 
  Eye, 
  EyeOff, 
  KeyRound, 
  CheckCircle2, 
  ShieldCheck,
  Zap,
  GraduationCap
} from 'lucide-react';
import config from '../../firebase-applet-config.json';

interface AuthModalProps {
  initialMode?: 'signin' | 'signup';
  onClose: () => void;
  onSuccess: () => void;
}

type AuthMethod = 'email' | 'instant' | 'google' | 'demo';

export const AuthModal: React.FC<AuthModalProps> = ({ initialMode = 'signin', onClose, onSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);
  const [method, setMethod] = useState<AuthMethod>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);

  const gisContainerRef = useRef<HTMLDivElement | null>(null);

  const { 
    signInWithEmail, 
    signUpWithEmail, 
    signInWithLocalEmail, 
    signInWithGoogle, 
    signInWithGoogleCredential,
    signInAsDemo, 
    sendPasswordReset 
  } = useAuth();

  // Initialize Google Identity Services (GIS) if available
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: config.oAuthClientId,
          callback: async (response: any) => {
            if (response?.credential) {
              setLoading(true);
              try {
                await signInWithGoogleCredential(response.credential);
                onSuccess();
              } catch (err: any) {
                console.warn('GIS credential sign-in notice:', err);
                setError(err?.message || 'Google sign-in could not complete.');
              } finally {
                setLoading(false);
              }
            }
          }
        });

        if (gisContainerRef.current) {
          gisContainerRef.current.innerHTML = '';
          (window as any).google.accounts.id.renderButton(gisContainerRef.current, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left'
          });
        }
      } catch (e) {
        console.warn('Google Identity Services init notice:', e);
      }
    }
  }, [method]);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', color: 'bg-rose-500' };
      case 2:
        return { score: 2, label: 'Fair', color: 'bg-amber-500' };
      case 3:
        return { score: 3, label: 'Good', color: 'bg-indigo-500' };
      case 4:
        return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
      default:
        return { score: 0, label: '', color: 'bg-slate-200' };
    }
  };

  const passwordStrength = getPasswordStrength(password);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setPopupBlocked(false);
    setLoading(true);

    try {
      if (mode === 'signin') {
        if (!email.trim() || !password) {
          throw new Error('Please enter both your email address and password.');
        }
        await signInWithEmail(email.trim(), password);
        onSuccess();
      } else if (mode === 'signup') {
        if (!name.trim()) {
          throw new Error('Please enter your full name.');
        }
        if (!email.trim()) {
          throw new Error('Please enter a valid email address.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match. Please verify and re-type.');
        }
        await signUpWithEmail(email.trim(), password, name.trim());
        onSuccess();
      } else if (mode === 'forgot') {
        if (!email.trim()) {
          throw new Error('Please enter your email address to receive password reset instructions.');
        }
        await sendPasswordReset(email.trim());
        setInfo(`Password reset instructions have been sent to ${email.trim()}. Please check your inbox.`);
      }
    } catch (err: any) {
      const msg = err?.message || 'Authentication failed. Please verify your details.';
      if (msg.includes('Account Suspended')) {
        onClose();
        return;
      }
      if (msg.includes('auth/wrong-password') || msg.includes('Incorrect password')) {
        setError('Incorrect password for this account. Please verify or use Instant Access.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Instant 1-Click Access (Passwordless)
  const handleInstantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setLoading(true);
    try {
      await signInWithLocalEmail(email.trim(), name.trim() || undefined);
      onSuccess();
    } catch (err: any) {
      if (err?.message?.includes('Account Suspended')) {
        onClose();
        return;
      }
      setError(err?.message || 'Could not start instant session.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setPopupBlocked(false);
    setLoading(true);
    try {
      await signInWithGoogle();
      onSuccess();
    } catch (err: any) {
      const code = err?.code || '';
      const msg = err?.message || '';

      if (msg.includes('Account Suspended')) {
        onClose();
        return;
      }

      if (code === 'auth/popup-blocked') {
        setPopupBlocked(true);
        setError('Google sign-in pop-up was blocked. Use Email & Password or Instant Access below.');
      } else if (code === 'auth/network-request-failed' || msg.includes('timeout') || msg.includes('timed out')) {
        setError('Google Auth domain took too long to respond. Use Email & Password or Instant Access instead.');
      } else if (code === 'auth/popup-closed-by-user') {
        setError('Google sign-in popup was dismissed. Please try again.');
      } else {
        setError(err?.message || 'Google sign-in could not complete. Try Email or Demo Persona.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePersonaSelect = async (persona: DemoPersona) => {
    setError(null);
    setLoading(true);
    try {
      await signInAsDemo(persona);
      onSuccess();
    } catch (err: any) {
      if (err?.message?.includes('Account Suspended')) {
        onClose();
        return;
      }
      setError(err?.message || 'Failed to launch demo account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 w-full max-w-md overflow-hidden relative animate-scale-up my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-full transition-colors z-10"
          aria-label="Close dialog"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="p-6 sm:p-7 pb-4 text-center border-b border-slate-100 dark:border-slate-800 bg-gradient-to-b from-slate-50/70 to-white dark:from-slate-900 dark:to-slate-900">
          <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-indigo-600/20">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100 font-serif">
            {mode === 'signin' && 'Welcome Back to Learnora'}
            {mode === 'signup' && 'Create Your Student Account'}
            {mode === 'forgot' && 'Reset Your Password'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            {mode === 'signin' && 'Sign in to access your notes, Nora Socratic sessions, and flashcards.'}
            {mode === 'signup' && 'Join thousands of students turning course materials into high-yield mastery.'}
            {mode === 'forgot' && 'Enter your email to receive password recovery instructions.'}
          </p>

          {/* Authentication Method Selector Tabs */}
          {mode !== 'forgot' && (
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mt-5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <button
                type="button"
                onClick={() => { setMethod('email'); setError(null); }}
                className={`py-1.5 px-1 rounded-lg transition-all text-center truncate ${
                  method === 'email' ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold' : 'hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Email &amp; Pass
              </button>
              <button
                type="button"
                onClick={() => { setMethod('instant'); setError(null); }}
                className={`py-1.5 px-1 rounded-lg transition-all text-center truncate flex items-center justify-center gap-1 ${
                  method === 'instant' ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold' : 'hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                <span>Instant</span>
              </button>
              <button
                type="button"
                onClick={() => { setMethod('google'); setError(null); }}
                className={`py-1.5 px-1 rounded-lg transition-all text-center truncate ${
                  method === 'google' ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold' : 'hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Google
              </button>
              <button
                type="button"
                onClick={() => { setMethod('demo'); setError(null); }}
                className={`py-1.5 px-1 rounded-lg transition-all text-center truncate flex items-center justify-center gap-1 ${
                  method === 'demo' ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold' : 'hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
                <span>Personas</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Form Body */}
        <div className="p-6 sm:p-7 pt-4 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-start gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1">
                <span className="font-semibold block text-rose-900">Notice</span>
                <span className="text-[11px] leading-relaxed">{error}</span>
                {email && (
                  <button
                    type="button"
                    onClick={() => handleInstantAccess({ preventDefault: () => {} } as any)}
                    className="mt-1.5 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline block"
                  >
                    → Enter immediately with 1-click Instant Session as {email}
                  </button>
                )}
              </div>
            </div>
          )}

          {info && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-start gap-2.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <div className="flex-1">
                <span className="font-semibold block text-emerald-950">Success</span>
                <span className="text-[11px] leading-relaxed">{info}</span>
              </div>
            </div>
          )}

          {/* METHOD 1: EMAIL & PASSWORD */}
          {(method === 'email' || mode === 'forgot') && (
            <form onSubmit={handleEmailSubmit} className="space-y-3.5">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Alex Morgan"
                      className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu or gmail"
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password</label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => { setMode('forgot'); setError(null); setInfo(null); }}
                        className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === 'signup' ? 'Create a secure password (min. 6 chars)' : 'Enter your password'}
                      className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {mode === 'signup' && password.length > 0 && (
                    <div className="mt-2 space-y-1 animate-fade-in">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">Password strength:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{passwordStrength.label}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                        <div className={`h-full rounded-full transition-colors ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-slate-200 dark:bg-slate-700'}`} />
                        <div className={`h-full rounded-full transition-colors ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-slate-200 dark:bg-slate-700'}`} />
                        <div className={`h-full rounded-full transition-colors ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-slate-200 dark:bg-slate-700'}`} />
                        <div className={`h-full rounded-full transition-colors ${passwordStrength.score >= 4 ? passwordStrength.color : 'bg-slate-200 dark:bg-slate-700'}`} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirm Password</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type your password"
                      className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {mode === 'signin' && 'Sign In to Workspace'}
                      {mode === 'signup' && 'Create Student Account'}
                      {mode === 'forgot' && 'Send Password Reset Link'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* METHOD 2: INSTANT PASSWORDLESS ACCESS */}
          {method === 'instant' && mode !== 'forgot' && (
            <form onSubmit={handleInstantAccess} className="space-y-3.5 py-1 animate-fade-in">
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-xs text-amber-950 dark:text-amber-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300">
                  <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Instant Passwordless Access</span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed">
                  Enter your name and email to immediately start studying. No password setup required; automatically preserves your notes and sessions.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Your Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Alex or Jordan"
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Your Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Launch Instant Study Session</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* METHOD 3: GOOGLE ACCOUNT VIEW */}
          {method === 'google' && mode !== 'forgot' && (
            <div className="space-y-4 py-1 animate-fade-in">
              <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-950 dark:text-indigo-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-300">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Google Workspace &amp; Personal Accounts</span>
                </div>
                <p className="text-[11px] text-indigo-800/90 dark:text-indigo-300/80 leading-relaxed">
                  Sign in with your verified Google account. Connects directly to Google Identity Services.
                </p>
              </div>

              {/* Official Google Identity Services Container */}
              <div ref={gisContainerRef} className="w-full flex justify-center min-h-[44px]" />

              {/* Standard Fallback Popup Button */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full py-2.5 px-4 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 rounded-xl font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center justify-center gap-3 transition-all text-xs shadow-2xs active:scale-[0.99]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google Pop-up</span>
              </button>
            </div>
          )}

          {/* METHOD 4: DEMO PERSONAS VIEW */}
          {method === 'demo' && mode !== 'forgot' && (
            <div className="space-y-2.5 py-1 animate-fade-in">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Select a Persona to Sign In Instantly (1-Click)
              </span>

              <div className="space-y-2">
                {DEMO_PERSONAS.map((persona) => (
                  <button
                    key={persona.email}
                    type="button"
                    onClick={() => handlePersonaSelect(persona)}
                    disabled={loading}
                    className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/30 transition-all text-left flex items-center justify-between group active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${persona.color} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs`}>
                        {persona.avatarLetter}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                            {persona.name}
                          </h4>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            persona.role === 'admin' 
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400' 
                              : persona.role === 'mentor' 
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400' 
                                : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400'
                          }`}>
                            {persona.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{persona.primaryGoal}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Modal Footer Mode Switch */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            {mode === 'signin' && (
              <>
                <span>New to Learnora?</span>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(null); }}
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                >
                  Create an account
                </button>
              </>
            )}

            {mode === 'signup' && (
              <>
                <span>Already have an account?</span>
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError(null); }}
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                >
                  Sign in
                </button>
              </>
            )}

            {mode === 'forgot' && (
              <div className="w-full text-center">
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError(null); }}
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                >
                  ← Back to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
