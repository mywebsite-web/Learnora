import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  User, 
  Zap, 
  CheckCircle2, 
  BrainCircuit, 
  BookOpen, 
  Layers, 
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { AiRobotMascot } from './AiRobotMascot';
import { useAuth, DEMO_PERSONAS } from '../context/AuthContext';
import { PWAInstallButton } from './PWAInstallButton';

interface LandingProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export const LandingPage: React.FC<LandingProps> = ({ onGetStarted, onSignIn }) => {
  const { signInWithGoogle, signInWithLocalEmail, signInAsDemo } = useAuth();
  const [emailInput, setEmailInput] = useState('');
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [loading, setLoading] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setLoading(true);
      try {
        await signInWithLocalEmail(emailInput.trim());
      } catch (err) {
        console.warn('Sign-in notice:', err);
        onGetStarted();
      } finally {
        setLoading(false);
      }
    } else {
      onGetStarted();
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.warn('Google sign-in action notice:', err);
      onSignIn();
    } finally {
      setLoading(false);
    }
  };

  const handleInstantDemo = async () => {
    setLoading(true);
    try {
      await signInAsDemo();
    } catch (err: any) {
      console.warn('Demo session notice:', err);
      // If Alex Morgan was deleted by admin, attempt Dr. Sarah Chen fallback or open sign in
      try {
        await signInAsDemo(DEMO_PERSONAS[1]);
      } catch {
        onSignIn();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/70 via-white to-blue-50/40 text-slate-900 selection:bg-blue-100 selection:text-blue-900 flex flex-col font-sans select-none">
      {/* Minimal Top Brand Bar */}
      <header className="w-full px-6 py-4 flex items-center justify-between max-w-5xl mx-auto shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <AiRobotMascot variant="mini" size={26} />
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-slate-900">Learnora</span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
              AI Study Workspace
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <PWAInstallButton variant="compact" />

          <button
            onClick={() => {
              const next = mode === 'signup' ? 'signin' : 'signup';
              setMode(next);
              if (next === 'signin') onSignIn(); else onGetStarted();
            }}
            className="text-xs font-bold text-slate-600 hover:text-blue-600 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            {mode === 'signup' ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </header>

      {/* Main Hero Container - Simple, Focused, Not Crowded (Matching COVER.jpg) */}
      <main className="flex-1 w-full max-w-md sm:max-w-lg mx-auto px-6 py-6 sm:py-10 flex flex-col justify-between my-auto">
        {/* 1. Top Headlines */}
        <div className="text-left space-y-2 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Next-Gen Personal AI Study Workspace</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-slate-900 leading-[1.14] tracking-tight">
            Turn what you have into <span className="text-blue-600">what you know.</span>
          </h1>
        </div>

        {/* 2. Large Centered 3D AI Robot Mascot with Speech Bubble */}
        <div className="py-6 sm:py-8 my-auto flex flex-col items-center justify-center relative">
          <AiRobotMascot 
            variant="waving" 
            size={240} 
            showBubble={true} 
            className="animate-pulse duration-1000"
          />
        </div>

        {/* 3. Action Section: Subtext, Email Input, Google Button & Demo */}
        <div className="space-y-4 pb-4">
          <p className="text-xs sm:text-sm text-slate-500 font-medium text-center max-w-sm mx-auto leading-relaxed">
            Upload lecture slides, notes, or YouTube recordings. Learnora builds comprehensive notes, flashcards, and an interactive AI tutor named Nora.
          </p>

          {/* Email or Phone Input */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-slate-400 absolute left-4" />
              <input
                type="text"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Email or Phone"
                className="w-full pl-11 pr-12 py-3.5 bg-white/90 hover:bg-white focus:bg-white border border-slate-200/90 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs transition-all font-medium"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 absolute right-2.5 flex items-center justify-center transition-colors shadow-2xs"
                title="Continue"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Primary Action Button: "Sign in with Google" */}
          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full py-3.5 px-5 bg-[#2563EB] hover:bg-blue-700 active:scale-[0.99] text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              {/* Google G icon inside white circle */}
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

          {/* Instant 1-Click Persona Demo Access */}
          <button
            onClick={handleInstantDemo}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Launch Instant Demo Workspace (Alex Morgan)</span>
          </button>

          {/* Footer Toggle: "Already have no account? Sign In" */}
          <div className="text-center pt-1">
            <span className="text-xs text-slate-500">
              {mode === 'signup' ? 'Already have an account?' : 'Already have no account?'}
            </span>
            <button
              onClick={() => {
                const next = mode === 'signup' ? 'signin' : 'signup';
                setMode(next);
                if (next === 'signin') onSignIn(); else onGetStarted();
              }}
              className="ml-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors underline"
            >
              {mode === 'signup' ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>

        {/* Quiet, Clean Feature Accordion below without crowding */}
        <div className="pt-4 text-center">
          <button
            onClick={() => setShowMoreInfo(!showMoreInfo)}
            className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 inline-flex items-center gap-1 transition-colors"
          >
            <span>{showMoreInfo ? 'Hide features' : 'Learn more about Nora AI features'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMoreInfo ? 'rotate-180' : ''}`} />
          </button>

          {showMoreInfo && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left mt-4 pt-4 border-t border-slate-200/60 animate-fade-in">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-2xs">
                <BrainCircuit className="w-5 h-5 text-blue-600 mb-2" />
                <h4 className="font-bold text-xs text-slate-900">Socratic AI Tutor</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Autonomous student modeling that adapts explanations in real time.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-2xs">
                <Layers className="w-5 h-5 text-indigo-600 mb-2" />
                <h4 className="font-bold text-xs text-slate-900">Spaced Flashcards</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Automated flashcard extraction with 3D flip review and Leitner tracking.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-2xs">
                <BookOpen className="w-5 h-5 text-emerald-600 mb-2" />
                <h4 className="font-bold text-xs text-slate-900">Source-Grounded</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">All answers and summaries anchor strictly to your uploaded lecture files.</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full py-4 text-center text-[11px] text-slate-400 border-t border-slate-100">
        <span>Learnora AI © 2026 · Personal AI Lecturer &amp; Study Workspace</span>
      </footer>
    </div>
  );
};
