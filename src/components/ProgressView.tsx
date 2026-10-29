import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Flame, 
  Clock, 
  Layers, 
  HelpCircle, 
  CheckCircle2, 
  ArrowLeft,
  TrendingUp,
  BrainCircuit,
  Calendar,
  Zap,
  Target,
  Sparkles,
  Award,
  ChevronRight
} from 'lucide-react';
import { UserProfile, QuizAttempt } from '../types';
import { DBService } from '../services/dbService';
import { ConfettiService } from '../services/confettiService';

interface ProgressViewProps {
  userId: string;
  profile: UserProfile | null;
  onBack?: () => void;
  onOpenWeeklyRun?: () => void;
  onOpenCertificates?: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ userId, profile, onBack, onOpenWeeklyRun, onOpenCertificates }) => {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [userId]);

  const loadProgress = async () => {
    try {
      const fetched = await DBService.getQuizAttempts(userId);
      setAttempts(fetched);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalQuizzes = attempts.length;
  const averageAccuracy = totalQuizzes > 0 
    ? Math.round(attempts.reduce((sum, a) => sum + (a.accuracy || 0), 0) / totalQuizzes) 
    : 85;

  // Aggregate weak and strong topics
  const allWeak = attempts.flatMap(a => a.weakTopics || []);
  const allStrong = attempts.flatMap(a => a.strongTopics || []);

  const topWeakTopics = Array.from(new Set(allWeak)).slice(0, 5);
  const topStrongTopics = Array.from(new Set(allStrong)).slice(0, 5);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-y-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 font-serif">Learning Analytics &amp; Mastery</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Track streaks, spaced retention, and diagnosed weak topics</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-8 w-full flex-1 space-y-6">
        {/* Weekly Run Banner */}
        {onOpenWeeklyRun && (
          <div 
            onClick={onOpenWeeklyRun}
            className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md flex items-center justify-between cursor-pointer hover:shadow-lg transition-all active:scale-[0.99] group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                <Trophy className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="font-black text-sm text-white">Active Weekly Study Run</h3>
                <p className="text-xs text-blue-100 font-medium">
                  {profile?.totalStudyMinutes || 120} mins logged this sprint · View 7-day breakdown, sprint goals &amp; AI debrief
                </p>
              </div>
            </div>
            <button className="px-3.5 py-1.5 rounded-xl bg-white text-blue-600 font-bold text-xs flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              <span>View Run Summary</span>
              <span>→</span>
            </button>
          </div>
        )}

        {/* Top metrics grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div 
            onClick={() => ConfettiService.fireGrandCannons()}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-amber-400 dark:hover:border-amber-600 transition-all group relative"
            title="Celebrate your study streak with confetti!"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Flame className="w-4 h-4 fill-amber-500" />
              </div>
              <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded-full flex items-center gap-1 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Celebrate</span>
              </span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Active Streak</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 block mt-0.5">{profile?.streakDays || 4} Days</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Study Time</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 block mt-0.5">{profile?.totalStudyMinutes || 128} mins</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Avg. Accuracy</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 block mt-0.5">{averageAccuracy}%</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-2">
              <Trophy className="w-4 h-4" />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Knowledge Points</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 block mt-0.5">{profile?.points || 340} pts</span>
          </div>
        </div>

        {/* Strengths & Weak Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Weak spots detected */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 font-serif flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-rose-500 dark:text-rose-400" />
              <span>Diagnosed Priority Review Areas</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Nora detected these concepts from missed quiz questions &amp; flashcard review.
            </p>

            {topWeakTopics.length > 0 ? (
              <div className="space-y-2">
                {topWeakTopics.map((topic, i) => (
                  <div key={i} className="p-3 bg-rose-50/60 dark:bg-rose-950/40 rounded-xl border border-rose-100 dark:border-rose-900/60 flex items-center justify-between text-xs">
                    <span className="font-semibold text-rose-950 dark:text-rose-200">{topic}</span>
                    <span className="text-[11px] font-medium text-rose-700 dark:text-rose-300 bg-rose-100/70 dark:bg-rose-900/60 px-2 py-0.5 rounded">
                      Needs 10 min review
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-center text-xs text-slate-500 dark:text-slate-400">
                No weak topics flagged yet. Take more quizzes to diagnose retention!
              </div>
            )}
          </div>

          {/* Mastered Topics */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 font-serif flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
              <span>Mastered Knowledge Areas</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Concepts with over 80% active recall consistency.
            </p>

            {topStrongTopics.length > 0 ? (
              <div className="space-y-2">
                {topStrongTopics.map((topic, i) => (
                  <div key={i} className="p-3 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-950 dark:text-emerald-200">{topic}</span>
                    <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/60 px-2 py-0.5 rounded">
                      Mastered
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-center text-xs text-slate-500 dark:text-slate-400">
                Keep studying to unlock concept mastery badges!
              </div>
            )}
          </div>
        </div>

        {/* Verified Certificates & Credentials Coming Soon Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-slate-50 dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 border border-amber-300/80 dark:border-amber-900/50 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  Accredited Certificates &amp; Diplomas
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Coming Soon
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
                Earn verifiable digital certificates for mastered knowledge areas, active recall streaks, and Socratic dialogues. Shareable directly to LinkedIn and CVs.
              </p>
            </div>
          </div>

          {onOpenCertificates && (
            <button
              type="button"
              onClick={onOpenCertificates}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-all shadow-xs active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
            >
              <span>Preview Certificates</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Recent Quiz Attempts */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 font-serif mb-4">Recent Quiz Performance</h3>
          {attempts.length > 0 ? (
            <div className="space-y-2">
              {attempts.map((att) => (
                <div key={att.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                      Score: {att.score}% ({att.score >= 70 ? 'Passed' : 'Needs Review'})
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-400">
                      {new Date(att.completedAt).toLocaleString()}
                    </span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                    att.score >= 80 ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                  }`}>
                    {att.score}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500">No attempts logged yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};
