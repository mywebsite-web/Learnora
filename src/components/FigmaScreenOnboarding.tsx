import React, { useState } from 'react';
import { 
  User, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  LogIn, 
  Zap,
  Mail
} from 'lucide-react';
import { AiRobotMascot } from './AiRobotMascot';

interface FigmaScreenOnboardingProps {
  onSignInWithGoogle: () => void;
  onContinueWithEmail: (email: string) => void;
  onInstantAccess: () => void;
  onToggleAuthMode?: () => void;
  initialMode?: 'signin' | 'signup';
}

export const FigmaScreenOnboarding: React.FC<FigmaScreenOnboardingProps> = ({
  onSignInWithGoogle,
  onContinueWithEmail,
  onInstantAccess,
  onToggleAuthMode,
  initialMode = 'signup'
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      onContinueWithEmail(emailInput.trim());
    } else {
      onInstantAccess();
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-sky-50/60 via-white to-blue-50/30 text-slate-900 select-none overflow-hidden relative font-sans">
      {/* iOS Status Bar (9:41, Cellular, Wifi, Battery) */}
      <div className="pt-3 px-7 pb-2 flex items-center justify-between text-xs font-semibold text-slate-900 shrink-0">
        <span className="font-bold tracking-tight text-xs">9:41</span>
        <div className="flex items-center gap-2">
          <div className="flex items-end gap-0.5 h-2.5">
            <span className="w-0.5 h-1 bg-slate-900 rounded-xs" />
            <span className="w-0.5 h-1.5 bg-slate-900 rounded-xs" />
            <span className="w-0.5 h-2 bg-slate-900 rounded-xs" />
            <span className="w-0.5 h-2.5 bg-slate-900 rounded-xs" />
          </div>
          <svg className="w-3.5 h-3.5 text-slate-900" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98C20.93 5.9 16.69 4 12 4zm0 3.5c3.55 0 6.77 1.39 9.17 3.66L12 19.34 2.83 11.16C5.23 8.89 8.45 7.5 12 7.5z" />
          </svg>
          <div className="w-5 h-2.5 rounded-xs border border-slate-900 p-0.5 flex items-center">
            <div className="w-full h-full bg-slate-900 rounded-2xs" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col justify-between scrollbar-none">
        {/* Top Headline: "Master AI Skills for Your Future" */}
        <div className="pt-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-[1.18] tracking-tight">
            Master AI <span className="text-blue-600">Skills</span> for<br />
            Your Future
          </h1>
        </div>

        {/* Large Centered 3D AI Robot Mascot with Speech Bubble */}
        <div className="py-4 my-auto flex flex-col items-center justify-center relative">
          <AiRobotMascot 
            variant="waving" 
            size={230} 
            showBubble={true} 
            className="animate-pulse duration-1000"
          />
        </div>

        {/* Bottom Interactive Area */}
        <div className="space-y-3.5 pb-2">
          {/* Subtitle Description */}
          <p className="text-xs text-slate-500 font-medium text-center max-w-[280px] mx-auto leading-relaxed">
            Access hundreds of AI courses taught by top industry experts right from your smartphone
          </p>

          {/* Email or Phone Input Field */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-slate-400 absolute left-4" />
              <input
                type="text"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Email or Phone"
                className="w-full pl-11 pr-12 py-3.5 bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-slate-200/80 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
              />
              {/* Enter / Next Arrow Icon Button */}
              <button
                type="submit"
                className="w-8 h-8 rounded-xl bg-slate-200 hover:bg-blue-600 hover:text-white text-slate-600 absolute right-2.5 flex items-center justify-center transition-colors"
                title="Continue"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Primary Action Button: "Sign in with Google" */}
          <button
            onClick={onSignInWithGoogle}
            className="w-full py-3.5 px-5 bg-[#2563EB] hover:bg-blue-700 active:scale-[0.99] text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              {/* Google G icon inside white pill */}
              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <span className="font-semibold text-xs sm:text-sm">Sign in with Google</span>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-200" />
          </button>

          {/* Instant 1-Click Persona Access Button */}
          <button
            onClick={onInstantAccess}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Launch Instant Demo Workspace (Alex Morgan)</span>
          </button>

          {/* Footer Text Link: "Already have no account? Sign In" */}
          <div className="text-center pt-1">
            <span className="text-xs text-slate-500">
              {mode === 'signup' ? 'Already have no account?' : 'Already have an account?'}
            </span>
            <button
              onClick={() => {
                const nextMode = mode === 'signup' ? 'signin' : 'signup';
                setMode(nextMode);
                onToggleAuthMode?.();
              }}
              className="ml-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors underline"
            >
              {mode === 'signup' ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>

        {/* iPhone Home Indicator */}
        <div className="w-32 h-1 bg-slate-300 rounded-full mx-auto mt-2 shrink-0" />
      </div>
    </div>
  );
};
