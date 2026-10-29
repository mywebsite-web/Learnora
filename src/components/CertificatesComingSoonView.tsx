import React, { useState } from 'react';
import { 
  Award, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  Share2, 
  Download, 
  ShieldCheck, 
  GraduationCap, 
  Bell, 
  Lock, 
  Clock, 
  Check, 
  QrCode, 
  ExternalLink,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ConfettiService } from '../services/confettiService';

interface CertificatesComingSoonViewProps {
  onBack?: () => void;
  onNavigateView?: (view: string) => void;
}

export const CertificatesComingSoonView: React.FC<CertificatesComingSoonViewProps> = ({
  onBack,
  onNavigateView
}) => {
  const { user, profile } = useAuth();
  const [isNotified, setIsNotified] = useState<boolean>(() => {
    return localStorage.getItem('learnora_cert_notify_enabled') === 'true';
  });
  const [selectedPreviewTier, setSelectedPreviewTier] = useState<'socratic' | 'retrieval' | 'course'>('socratic');
  const [showToast, setShowToast] = useState<string | null>(null);

  const studentName = profile?.displayName || user?.displayName || 'Alex Mercer';

  const handleToggleNotify = () => {
    const nextState = !isNotified;
    setIsNotified(nextState);
    localStorage.setItem('learnora_cert_notify_enabled', String(nextState));
    
    if (nextState) {
      ConfettiService.fireGrandCannons();
      setShowToast("You're on the priority waitlist! We'll notify you as soon as certificates launch.");
    } else {
      setShowToast('Waitlist notification preference updated.');
    }
    setTimeout(() => setShowToast(null), 3500);
  };

  const certificateTiers = [
    {
      id: 'socratic' as const,
      title: 'Socratic Dialogue Specialist',
      topic: 'Adaptive Socratic Reasoning & Cognitive Inquiry',
      badge: 'Honor Award',
      level: 'Advanced',
      criteria: 'Complete 10 high-rigor interactive tutoring sessions with Nora AI',
      color: 'from-blue-600 to-indigo-700',
      sealColor: 'text-amber-400',
      idCode: 'LN-SOC-2026-9842'
    },
    {
      id: 'retrieval' as const,
      title: 'Spaced Retrieval Master',
      topic: 'Long-Term Memory Synthesis & Active Recall',
      badge: 'Mastery Diploma',
      level: 'Expert',
      criteria: 'Maintain a 14-day spaced repetition review streak with ≥85% accuracy',
      color: 'from-purple-600 to-indigo-800',
      sealColor: 'text-purple-300',
      idCode: 'LN-SRM-2026-4419'
    },
    {
      id: 'course' as const,
      title: 'Full Curriculum Academic Diploma',
      topic: 'Comprehensive Subject Matter & Exam Readiness',
      badge: 'Summa Cum Laude',
      level: 'Distinction',
      criteria: 'Master 100% of study set flashcards and pass final diagnostic exams',
      color: 'from-emerald-600 to-teal-800',
      sealColor: 'text-emerald-300',
      idCode: 'LN-ACD-2026-1077'
    }
  ];

  const currentTier = certificateTiers.find(t => t.id === selectedPreviewTier) || certificateTiers[0];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-y-auto">
      {/* Toast Feedback */}
      {showToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-fade-in border border-white/10 dark:border-slate-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{showToast}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
              title="Return to Dashboard"
              aria-label="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                Verified Certificates &amp; Credentials
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Coming Soon
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Official accredited recognition for mastered subjects and active recall milestones
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleNotify}
          className={`hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-xs ${
            isNotified
              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isNotified ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>Priority Waitlist Active</span>
            </>
          ) : (
            <>
              <Bell className="w-3.5 h-3.5" />
              <span>Notify Me on Launch</span>
            </>
          )}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto w-full p-4 sm:p-8 space-y-6 sm:space-y-8 flex-1">
        
        {/* HERO INTRO CARD */}
        <div className="relative rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-6 sm:p-8 overflow-hidden shadow-xl shadow-blue-600/20">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 rounded-full bg-indigo-500/20 blur-xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-blue-100 text-[11px] font-bold border border-white/20 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Academic Integrity &amp; Cryptographic Verification</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Earn Verifiable Certificates as You Master Your Studies
            </h2>

            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-medium">
              Turn your active recall flashcard streaks, diagnostic practice exam scores, and 1-on-1 Socratic sessions into accredited academic credentials. Shareable directly to LinkedIn, portfolios, and academic CVs.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleToggleNotify}
                className="px-5 py-2.5 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 font-black text-xs transition-all shadow-md active:scale-95 flex items-center gap-2"
              >
                {isNotified ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>You're on the Waitlist</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 text-blue-600" />
                    <span>Join Early Access Waitlist</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 text-xs text-blue-200">
                <Clock className="w-3.5 h-3.5" />
                <span>Target Launch: Q2 2026</span>
              </div>
            </div>
          </div>
        </div>

        {/* TIER SELECTOR TABS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Upcoming Certificate Types</span>
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">Click to preview style</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {certificateTiers.map(tier => (
              <button
                key={tier.id}
                type="button"
                onClick={() => setSelectedPreviewTier(tier.id)}
                className={`p-4 rounded-2xl border text-left transition-all active:scale-98 cursor-pointer relative ${
                  selectedPreviewTier === tier.id
                    ? 'bg-white dark:bg-slate-900 border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                    : 'bg-white/80 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300`}>
                    {tier.badge}
                  </span>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                    {tier.level}
                  </span>
                </div>
                <h4 className="font-black text-xs text-slate-900 dark:text-slate-100 leading-snug mb-1">
                  {tier.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {tier.criteria}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* LIVE REALISTIC CERTIFICATE PREVIEW CARD */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Interactive Certificate Preview
            </span>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Cryptographic QR Validation</span>
            </div>
          </div>

          {/* Certificate Frame Container */}
          <div className="relative rounded-3xl bg-amber-50/50 dark:bg-slate-900 p-4 sm:p-10 border-4 border-amber-200/70 dark:border-amber-900/50 shadow-xl overflow-hidden font-serif">
            {/* Ornamental guilloche corner accents */}
            <div className="absolute top-2 left-2 w-10 h-10 border-t-2 border-l-2 border-amber-500/50 pointer-events-none" />
            <div className="absolute top-2 right-2 w-10 h-10 border-t-2 border-r-2 border-amber-500/50 pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-10 h-10 border-b-2 border-l-2 border-amber-500/50 pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-10 h-10 border-b-2 border-r-2 border-amber-500/50 pointer-events-none" />

            {/* Inner Border */}
            <div className="relative border border-amber-300/80 dark:border-amber-800/60 p-6 sm:p-10 rounded-2xl bg-white/90 dark:bg-slate-950/70 text-center space-y-5">
              
              {/* Header Crest */}
              <div className="flex items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md">
                  <Award className="w-6 h-6" />
                </div>
              </div>

              <div>
                <p className="text-[11px] sm:text-xs tracking-[0.25em] font-sans font-black text-amber-700 dark:text-amber-400 uppercase">
                  Learnora Academic Honors
                </p>
                <h3 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
                  Certificate of Academic Mastery
                </h3>
                <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-2" />
              </div>

              <div className="space-y-1 font-sans">
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  This verifiable credential is officially awarded to
                </p>
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-serif tracking-tight border-b-2 border-amber-400/40 inline-block px-4 pb-0.5">
                  {studentName}
                </p>
              </div>

              <div className="max-w-xl mx-auto space-y-1 font-sans">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  in formal recognition of demonstrated rigor and verified mastery in
                </p>
                <p className="text-sm sm:text-base font-extrabold text-blue-700 dark:text-blue-400">
                  {currentTier.topic}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 italic pt-1">
                  Requirements: {currentTier.criteria}
                </p>
              </div>

              {/* Signatures & Seal Row */}
              <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 font-sans text-left">
                {/* Signee 1: Nora AI */}
                <div className="text-center sm:text-left space-y-0.5">
                  <p className="font-serif italic text-base text-blue-600 dark:text-blue-400">
                    Nora AI
                  </p>
                  <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                    Lead Socratic Cognitive Engine
                  </p>
                  <p className="text-[9px] text-slate-400">
                    Automated Rigor Evaluator
                  </p>
                </div>

                {/* Center 3D Gold Ribbon Seal */}
                <div className="relative shrink-0 flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-white flex flex-col items-center justify-center shadow-lg border-2 border-white dark:border-slate-900">
                    <ShieldCheck className="w-5 h-5 text-amber-100" />
                    <span className="text-[7px] font-black uppercase tracking-tighter">VERIFIED</span>
                  </div>
                </div>

                {/* Signee 2: Verification QR & ID */}
                <div className="text-center sm:text-right space-y-0.5">
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300 mb-1">
                    <QrCode className="w-3.5 h-3.5 text-slate-500" />
                    <span>{currentTier.idCode}</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                    Public Verification Protocol
                  </p>
                  <p className="text-[9px] text-slate-400">
                    Learnora Decentralized Registry
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 FEATURE PILLARS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              icon: Share2,
              title: '1-Click LinkedIn Add',
              desc: 'Seamlessly add your credential directly to your LinkedIn profile with official issuer metadata.'
            },
            {
              icon: Download,
              title: 'High-Res PDF Export',
              desc: 'Vector-quality 300 DPI downloadable diplomas with high-security guilloche anti-copy patterns.'
            },
            {
              icon: QrCode,
              title: 'Tamper-Proof URL',
              desc: 'Every certificate receives a public URL and QR code for employers or admissions officers to verify.'
            },
            {
              icon: Award,
              title: 'Automatic Unlocking',
              desc: 'No paperwork needed—certificates trigger automatically once your study mastery thresholds are met.'
            }
          ].map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-2xs">
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                  {feat.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* STUDY TO PREPARE CTA CARD */}
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm text-white">Start Building Your Qualifying Mastery Now</h4>
              <p className="text-xs text-slate-300 font-medium">
                All quiz scores and flashcard intervals completed today will retroactively count toward your certificates upon launch.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onNavigateView && (
              <button
                type="button"
                onClick={() => onNavigateView('quiz')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center gap-1.5"
              >
                <span>Take Practice Quiz</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all active:scale-95"
              >
                Back to Dashboard
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
