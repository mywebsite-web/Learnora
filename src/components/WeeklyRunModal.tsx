/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Trophy, 
  Clock, 
  Award, 
  Flame, 
  Brain, 
  Plus, 
  CheckCircle2, 
  Share2, 
  Copy, 
  RotateCw, 
  ArrowRight, 
  Calendar,
  Check,
  TrendingUp,
  Target,
  Layers,
  MessageSquare,
  BookOpen
} from 'lucide-react';
import { UserProfile, WeeklyRunSummaryData, WeeklyRunSprintTask, StudySet } from '../types';
import { WeeklyRunSprintList } from './WeeklyRunSprintList';
import { ConfettiService } from '../services/confettiService';

interface WeeklyRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: WeeklyRunSummaryData;
  profile: UserProfile | null;
  studySets?: StudySet[];
  onLogTime: (minutes: number, subject?: string) => void;
  onToggleTask: (taskId: string) => void;
  onAddTask: (taskData: { title: string; category: WeeklyRunSprintTask['category']; xpReward: number }) => void;
  onGenerateAiDebrief: () => void;
  isAiGenerating?: boolean;
  onNavigateToTutorWithPrompt?: (prompt: string) => void;
  onNavigateAction?: (category: string) => void;
  onTriggerStreakCelebration?: () => void;
}

export const WeeklyRunModal: React.FC<WeeklyRunModalProps> = ({
  isOpen,
  onClose,
  summary,
  profile,
  studySets = [],
  onLogTime,
  onToggleTask,
  onAddTask,
  onGenerateAiDebrief,
  isAiGenerating = false,
  onNavigateToTutorWithPrompt,
  onNavigateAction,
  onTriggerStreakCelebration
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sprints' | 'log-time'>('overview');
  const [logMinutes, setLogMinutes] = useState(30);

  // Extract actual subjects the user added
  const studySetSubjects = (studySets || [])
    .map(s => s.subject?.trim())
    .filter((s): s is string => Boolean(s));

  const distributionSubjects = summary.subjectDistribution
    .map(s => s.subject?.trim())
    .filter(Boolean);

  const availableSubjects = Array.from(new Set([...distributionSubjects, ...studySetSubjects]));
  const defaultSubject = availableSubjects[0] || summary.subjectDistribution[0]?.subject || 'General Studies';

  const [logSubject, setLogSubject] = useState(defaultSubject);
  const [copiedReport, setCopiedReport] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const percentMet = Math.min(
    100,
    Math.round((summary.totalMinutesStudied / (summary.targetWeeklyMinutes || 210)) * 100)
  );

  const todayDay = summary.days.find(d => d.isToday);
  const todayMinutes = todayDay?.minutesStudied || 0;

  const handleManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (logMinutes <= 0) return;
    onLogTime(Number(logMinutes), logSubject);
    setToastMessage(`✅ Successfully logged +${logMinutes} minutes to today's study run!`);
    setTimeout(() => setToastMessage(null), 3000);
    setActiveTab('overview');
  };

  const handleCopyReport = () => {
    const reportText = `📊 LEARNORA WEEKLY RUN REPORT
🗓️ ${summary.weekRangeLabel}
⏱️ Total Study Time: ${summary.totalMinutesStudied} / ${summary.targetWeeklyMinutes} mins (${percentMet}% of target)
🔥 Daily Run Streak: ${profile?.streakDays || summary.streakDays} Days
⭐ Knowledge XP: ${profile?.points || summary.totalXP} XP
🧠 Diagnostics Accuracy: ${summary.accuracyRate}%
🎯 Weekly Sprints: ${summary.sprintTasks.filter(t => t.completed).length} / ${summary.sprintTasks.length} Completed

✨ Nora AI Evaluation:
Grade: ${summary.aiInsight?.grade || 'A'}
Headline: ${summary.aiInsight?.summaryHeadline || 'Steady study pace!'}
Overview: ${summary.aiInsight?.deepOverview || ''}

Generated on Learnora AI Study Companion`;

    navigator.clipboard?.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* MODAL HEADER */}
        <div className="px-5 sm:px-8 py-4 sm:py-5 bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Weekly Run Summary &amp; Analytics
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
                  {summary.weekRangeLabel}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-400 font-medium">
                Comprehensive study sprint recap, daily breakdown &amp; Nora AI diagnostics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyReport}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-600 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
              title="Copy formatted summary card"
            >
              {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedReport ? 'Copied!' : 'Export Card'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="px-5 sm:px-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex items-center gap-2 pt-2 shrink-0 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Run Overview & AI Debrief', icon: Sparkles },
            { id: 'sprints', label: `Weekly Sprints (${summary.sprintTasks.filter(t => t.completed).length}/${summary.sprintTasks.length})`, icon: Target },
            { id: 'log-time', label: '+ Log Study Time', icon: Plus }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-t-2xl text-xs font-bold transition-all flex items-center gap-2 border-b-2 shrink-0 ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 shadow-2xs'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TOAST MESSAGE */}
        {toastMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* HERO SCORECARD BANNER */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 text-white shadow-md relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-white/20 text-white backdrop-blur-md uppercase tracking-wider">
                        Performance Grade: {summary.aiInsight?.grade || 'A'}
                      </span>
                      <span className="text-xs text-blue-200 font-semibold">
                        {percentMet >= 80 ? 'High Velocity Sprint' : 'Sprint In Progress'}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {summary.totalMinutesStudied} / {summary.targetWeeklyMinutes} Minutes Logged
                    </h3>

                    <p className="text-xs text-blue-100 max-w-lg leading-relaxed">
                      {summary.aiInsight?.deepOverview || 'Your weekly study rhythm is actively monitored by Nora AI. Review your daily activity and weak topics below.'}
                    </p>
                  </div>

                  {/* Circular Progress Gauge */}
                  <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shrink-0 self-start sm:self-auto min-w-[120px] text-center">
                    <span className="text-3xl font-black text-white">{percentMet}%</span>
                    <span className="text-[10px] text-blue-200 font-bold uppercase tracking-wider mt-0.5">Target Met</span>
                  </div>
                </div>

                {/* Shimmer progress track */}
                <div className="w-full bg-white/20 rounded-full h-2 mt-5 overflow-hidden">
                  <div 
                    className="bg-emerald-400 h-2 rounded-full transition-all duration-700 shadow-sm"
                    style={{ width: `${percentMet}%` }}
                  />
                </div>
              </div>

              {/* 4 CORE METRICS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-800 rounded-2xl space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center mb-2">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="text-slate-400 dark:text-slate-400 text-[11px] font-bold block uppercase">Weekly Study Time</span>
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100 block">{summary.totalMinutesStudied} mins</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {todayMinutes > 0 ? `${todayMinutes}m today` : '0m today'} · Goal: {summary.targetWeeklyMinutes}m
                  </span>
                </div>

                <div 
                  onClick={() => {
                    ConfettiService.fireGrandCannons();
                    if (onTriggerStreakCelebration) onTriggerStreakCelebration();
                  }}
                  className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-800 rounded-2xl space-y-1 cursor-pointer hover:border-amber-400 dark:hover:border-amber-600 transition-all group"
                  title="Click to celebrate study streak with confetti!"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Flame className="w-4 h-4 fill-amber-500" />
                    </div>
                    <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-950/60 px-2 py-0.5 rounded-full flex items-center gap-1 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Celebrate</span>
                    </span>
                  </div>
                  <span className="text-slate-400 dark:text-slate-400 text-[11px] font-bold block uppercase">Daily Run Streak</span>
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100 block">{summary.streakDays || profile?.streakDays || 1} Days</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                    {todayMinutes > 0 ? '🔥 7-Day sprint active today' : '🔥 Run pending today'}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-800 rounded-2xl space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 flex items-center justify-center mb-2">
                    <Award className="w-4 h-4" />
                  </div>
                  <span className="text-slate-400 dark:text-slate-400 text-[11px] font-bold block uppercase">Knowledge XP</span>
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100 block">{summary.totalXP || profile?.points || 240} XP</span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">Top 5% Learner · Verified</span>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-800 rounded-2xl space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-2">
                    <Brain className="w-4 h-4" />
                  </div>
                  <span className="text-slate-400 dark:text-slate-400 text-[11px] font-bold block uppercase">Diagnostics Accuracy</span>
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100 block">{summary.accuracyRate}%</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Socratic Diagnostic Tested</span>
                </div>
              </div>

              {/* 7-DAY DAY-BY-DAY ACTIVITY BREAKDOWN */}
              <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
                        7-Day Study Cadence (Mon – Sun)
                      </h3>
                      {todayDay && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
                          Today: {todayDay.dayName} ({todayDay.dateStr})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">
                      Daily minutes logged against your profile target
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('log-time')}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white text-xs font-bold transition-all flex items-center gap-1 active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Time</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-7 gap-3">
                  {summary.days.map((day, idx) => {
                    const isMet = day.minutesStudied >= day.targetMinutes;
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-2xl border text-center transition-all ${
                          day.isToday
                            ? 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-500 ring-2 ring-blue-500/40 shadow-sm'
                            : day.minutesStudied > 0
                              ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                              : 'bg-white dark:bg-slate-900/40 border-dashed border-slate-200 dark:border-slate-800 opacity-60'
                        }`}
                      >
                        {day.isToday && (
                          <div className="mb-1.5">
                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-blue-600 text-white tracking-wider shadow-2xs">
                              Today
                            </span>
                          </div>
                        )}
                        <span className={`text-xs font-black block ${day.isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          {day.dayName}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block">
                          {day.dateStr}
                        </span>

                        <div className={`my-2 py-1 px-2 rounded-xl border shadow-2xs ${
                          day.isToday ? 'bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
                        }`}>
                          <span className={`text-sm font-black block ${day.isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-slate-100'}`}>
                            {day.minutesStudied}m
                          </span>
                        </div>

                        <span className={`text-[10px] font-bold block ${
                          day.isToday 
                            ? (isMet ? '✓ Goal Met' : day.minutesStudied > 0 ? `${day.minutesStudied}/${day.targetMinutes}m` : 'Ready to Run')
                            : (isMet ? '✓ Met' : day.minutesStudied > 0 ? 'Logged' : day.isFuture ? 'Upcoming' : 'Rest')
                        }`}>
                          {day.isToday 
                            ? (isMet ? '✓ Goal Met' : day.minutesStudied > 0 ? `${day.minutesStudied}/${day.targetMinutes}m` : 'Ready to Run')
                            : (isMet ? '✓ Met' : day.minutesStudied > 0 ? 'Logged' : day.isFuture ? 'Upcoming' : 'Rest')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* NORA AI RUN DEBRIEF & RECOMMENDATIONS */}
              <div className="p-5 sm:p-6 bg-gradient-to-br from-indigo-50/80 via-blue-50/60 to-white dark:from-indigo-950/30 dark:via-blue-950/20 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-900/60 rounded-3xl space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-slate-100 tracking-tight">
                          Nora AI Pedagogical Diagnostics
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                          Gemini 2.5 Cognitive Core
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Autonomous evaluation of your study speed, retention, and focus
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={onGenerateAiDebrief}
                    disabled={isAiGenerating}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto active:scale-95 shadow-sm"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isAiGenerating ? 'animate-spin' : ''}`} />
                    <span>{isAiGenerating ? 'Synthesizing...' : 'Re-analyze with AI'}</span>
                  </button>
                </div>

                {/* AI Headline & Overview */}
                <div className="p-4 bg-white/90 dark:bg-slate-900/90 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 shadow-2xs space-y-2">
                  <h4 className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>{summary.aiInsight?.summaryHeadline || 'Steady study rhythm detected!'}</span>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {summary.aiInsight?.deepOverview || 'Your study pattern demonstrates high engagement and steady recall.'}
                  </p>
                </div>

                {/* Strengths & Weak Areas Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Strengths */}
                  <div className="p-4 bg-white/90 dark:bg-slate-900/90 rounded-2xl border border-emerald-100 dark:border-emerald-950/60 space-y-2 shadow-2xs">
                    <span className="text-xs font-black text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Demonstrated Breakthroughs</span>
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {(summary.aiInsight?.keyStrengths || [
                        'Consistent review schedule',
                        'High Socratic interaction rate',
                        'Active streak maintenance'
                      ]).map((str, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Growth Focus Areas */}
                  <div className="p-4 bg-white/90 dark:bg-slate-900/90 rounded-2xl border border-amber-100 dark:border-amber-950/60 space-y-2 shadow-2xs">
                    <span className="text-xs font-black text-amber-800 dark:text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <Target className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Next Run Focus Targets</span>
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {(summary.aiInsight?.focusAreas || [
                        'Review missed practice questions',
                        'Complete remaining flashcard repetitions'
                      ]).map((area, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{area}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Recommended Prompt Action Card */}
                {summary.aiInsight?.recommendedPrompt && (
                  <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full inline-block">
                        Recommended Nora Socratic Run
                      </span>
                      <p className="text-xs font-semibold text-blue-100 italic">
                        "{summary.aiInsight.recommendedPrompt}"
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToTutorWithPrompt?.(summary.aiInsight!.recommendedPrompt);
                      }}
                      className="px-4 py-2 rounded-xl bg-white text-blue-600 hover:bg-blue-50 font-black text-xs transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto shadow-md active:scale-95"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Launch Nora Session</span>
                    </button>
                  </div>
                )}
              </div>

              {/* SUBJECT TIME DISTRIBUTION */}
              <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">
                      Subject Time Distribution
                    </h3>
                    {summary.subjectDistribution.length > 0 && (
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200/60 dark:border-blue-900/40">
                        {summary.subjectDistribution.length} {summary.subjectDistribution.length === 1 ? 'Subject' : 'Subjects'} Added
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-semibold">
                    {summary.totalMinutesStudied}m total study
                  </span>
                </div>

                {summary.subjectDistribution.length === 0 ? (
                  <div className="p-5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-1.5">
                    <BookOpen className="w-7 h-7 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No subjects added yet</p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      Create or upload study sets in your Library to track study minutes per subject.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {summary.subjectDistribution.map((item, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-2 min-w-0">
                            <span 
                              className="w-2.5 h-2.5 rounded-full shrink-0" 
                              style={{ backgroundColor: item.color }} 
                            />
                            <span className="truncate">{item.subject}</span>
                          </div>
                          <span className="text-slate-500 dark:text-slate-400 font-semibold shrink-0">
                            {item.minutes} mins ({item.percent}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${Math.max(item.minutes > 0 ? 5 : 0, item.percent)}%`, 
                              backgroundColor: item.color 
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: SPRINTS & GOALS */}
          {activeTab === 'sprints' && (
            <div className="space-y-4">
              <WeeklyRunSprintList
                tasks={summary.sprintTasks}
                onToggleTask={onToggleTask}
                onAddTask={onAddTask}
                onNavigateAction={(category) => {
                  onClose();
                  onNavigateAction?.(category);
                }}
              />
            </div>
          )}

          {/* TAB 3: LOG TIME */}
          {activeTab === 'log-time' && (
            <div className="max-w-xl mx-auto space-y-5 p-2">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Log External Study Session</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {todayDay ? `Logging directly to Today, ${todayDay.dayName} (${todayDay.dateStr}) to update Weekly Study Time, Knowledge XP, and Daily Run Streak.` : 'Record offline reading, textbook homework, or lecture time into your weekly study run.'}
                </p>
              </div>

              <form onSubmit={handleManualLog} className="p-6 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-2xs">
                {/* Preset minute buttons */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">Quick Duration Presets</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[15, 30, 45, 60].map(mins => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setLogMinutes(mins)}
                        className={`py-2.5 rounded-xl text-xs font-black transition-all ${
                          logMinutes === mins
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        +{mins} mins
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Minutes Input */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="600"
                    value={logMinutes}
                    onChange={(e) => setLogMinutes(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Subject Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Course / Subject
                  </label>
                  {availableSubjects.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {availableSubjects.map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setLogSubject(s)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            logSubject.toLowerCase() === s.toLowerCase()
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                          <span>{s}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <input
                    type="text"
                    value={logSubject}
                    onChange={(e) => setLogSubject(e.target.value)}
                    placeholder={availableSubjects[0] ? `e.g. ${availableSubjects[0]}` : 'e.g. Mathematics, History, Law'}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-200 font-medium flex items-center justify-between">
                  <span>Earns Knowledge XP:</span>
                  <span className="font-black text-blue-700 dark:text-blue-300">+{Math.max(10, Math.round(logMinutes * (10 / 15)))} XP</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/20 transition-all active:scale-98"
                >
                  Record Study Session to Weekly Run
                </button>
              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
