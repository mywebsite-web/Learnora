/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Clock, 
  Award, 
  Flame, 
  Brain, 
  ChevronRight, 
  Sparkles, 
  Plus, 
  BarChart2, 
  CheckCircle2, 
  Calendar,
  ExternalLink,
  Zap,
  TrendingUp,
  RotateCw
} from 'lucide-react';
import { UserProfile, WeeklyRunSummaryData } from '../types';
import { ConfettiService } from '../services/confettiService';

interface WeeklyRunSummaryCardProps {
  summary: WeeklyRunSummaryData;
  profile: UserProfile | null;
  onOpenModal: () => void;
  onQuickLogTime: (minutes: number) => void;
  onGenerateAiDebrief: () => void;
  isAiGenerating?: boolean;
  onTriggerStreakCelebration?: () => void;
}

export const WeeklyRunSummaryCard: React.FC<WeeklyRunSummaryCardProps> = ({
  summary,
  profile,
  onOpenModal,
  onQuickLogTime,
  onGenerateAiDebrief,
  isAiGenerating = false,
  onTriggerStreakCelebration
}) => {
  const [quickLogSuccess, setQuickLogSuccess] = useState<number | null>(null);

  const percentMet = Math.min(
    100,
    Math.round((summary.totalMinutesStudied / (summary.targetWeeklyMinutes || 210)) * 100)
  );

  const todayDay = summary.days.find(d => d.isToday);
  const todayMinutes = todayDay?.minutesStudied || 0;

  const handleAddMinutes = (mins: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickLogTime(mins);
    setQuickLogSuccess(mins);
    setTimeout(() => setQuickLogSuccess(null), 2500);
  };

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* CARD HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Weekly Run Summary
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60">
              {percentMet >= 80 ? '🔥 On Track' : `${percentMet}% Met`}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-400 font-medium mt-0.5">
            {summary.weekRangeLabel}
          </p>
        </div>

        <button
          onClick={onOpenModal}
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors flex items-center gap-0.5 active:scale-95 group"
          title="Open comprehensive Weekly Run Analytics and Sprint Goals"
        >
          <span>See All</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* WEEKLY SPRINT PROGRESS & 7-DAY MINI RUN VISUALIZER */}
      <div 
        onClick={onOpenModal}
        className="p-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xs hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
      >
        {/* Target Progress Bar */}
        <div className="space-y-1.5 mb-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Sprint Target</span>
            </span>
            <div className="text-right">
              <span className="font-black text-slate-900 dark:text-slate-100">{summary.totalMinutesStudied}</span>
              <span className="text-slate-400 font-medium"> / {summary.targetWeeklyMinutes} mins</span>
              <span className="ml-1.5 font-bold text-blue-600 dark:text-blue-400">({percentMet}%)</span>
            </div>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 shadow-inner">
            <div 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-1.5 rounded-full transition-all duration-700 ease-out shadow-xs"
              style={{ width: `${percentMet}%` }}
            />
          </div>
        </div>

        {/* 7-DAY MINI BAR CHART */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>7-Day Run Activity</span>
              {todayDay && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
                  Today: {todayDay.dayName} {todayDay.dateStr}
                </span>
              )}
            </span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold normal-case">Tap for daily details</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
            {summary.days.map((day, idx) => {
              const maxDayMinutes = Math.max(60, day.targetMinutes * 1.5);
              const heightPercent = Math.min(100, Math.round((day.minutesStudied / maxDayMinutes) * 100));

              return (
                <div key={idx} className="flex flex-col items-center gap-1 group/day">
                  {/* Bar container */}
                  <div className={`w-full h-12 bg-slate-100 dark:bg-slate-800/80 rounded-lg flex items-end p-0.5 relative overflow-hidden transition-all ${
                    day.isToday ? 'ring-2 ring-blue-500/50 bg-blue-50/60 dark:bg-blue-950/40' : ''
                  }`}>
                    {/* Active progress fill */}
                    <div 
                      className={`w-full rounded-md transition-all duration-500 ${
                        day.isToday 
                          ? 'bg-blue-600 shadow-xs' 
                          : day.minutesStudied > 0 
                            ? 'bg-blue-400/80 dark:bg-blue-500/80' 
                            : 'bg-transparent'
                      }`}
                      style={{ height: `${Math.max(day.minutesStudied > 0 ? 15 : 0, heightPercent)}%` }}
                    />
                    {day.isToday && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                    )}
                  </div>

                  {/* Day label with TODAY badge */}
                  <div className="flex flex-col items-center leading-none">
                    <span className={`text-[10px] font-extrabold ${day.isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
                      {day.dayShort}
                    </span>
                    {day.isToday && (
                      <span className="text-[7px] font-black uppercase tracking-tight text-white bg-blue-600 px-1 py-0.2 rounded-full mt-0.5">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Minutes badge */}
                  <span className={`text-[9px] font-semibold ${day.isToday && day.minutesStudied > 0 ? 'text-blue-600 dark:text-blue-400 font-extrabold' : 'text-slate-400 font-medium'}`}>
                    {day.minutesStudied > 0 ? `${day.minutesStudied}m` : day.isToday ? '0m' : day.isFuture ? '—' : '0m'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Log Notification banner if triggered */}
        {quickLogSuccess !== null && (
          <div className="mt-3 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Logged +{quickLogSuccess} mins to today's study run! +{Math.round(quickLogSuccess * (10 / 15))} XP added!</span>
          </div>
        )}
      </div>

      {/* 4 LIVE METRIC TILES */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {/* Study Time with Quick Log */}
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xs space-y-1.5 relative group">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <button
              onClick={(e) => handleAddMinutes(15, e)}
              className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-600 dark:hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white dark:hover:text-white text-[10px] font-black transition-colors active:scale-95 shadow-2xs"
              title="Add 15 minutes of study to today's run"
            >
              +15m
            </button>
          </div>
          <div>
            <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 block">Weekly Study Time</span>
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">{summary.totalMinutesStudied} mins</span>
            <span className="text-[9px] sm:text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
              {todayMinutes > 0 ? `${todayMinutes}m today` : '0m today'} · {percentMet >= 100 ? 'Goal Met' : `${Math.max(0, summary.targetWeeklyMinutes - summary.totalMinutesStudied)}m left`}
            </span>
          </div>
        </div>

        {/* Total Points */}
        <div 
          onClick={() => ConfettiService.fireParticlePop()}
          className="p-3 sm:p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xs space-y-1.5 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-all group"
          title="Click to celebrate Knowledge XP"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 opacity-60 group-hover:opacity-100 group-hover:rotate-12 transition-all" />
          </div>
          <div>
            <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 block">Knowledge XP</span>
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">{summary.totalXP || profile?.points || 240} XP</span>
            <span className="text-[9px] sm:text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block mt-0.5">
              Top 5% Learner · Verified
            </span>
          </div>
        </div>

        {/* Daily Streak */}
        <div 
          onClick={() => {
            ConfettiService.fireGrandCannons();
            if (onTriggerStreakCelebration) onTriggerStreakCelebration();
          }}
          className="p-3 sm:p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xs space-y-1.5 cursor-pointer hover:border-amber-400 dark:hover:border-amber-600 transition-all relative group"
          title="Click to celebrate 7-day study streak with confetti!"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-500" />
            </div>
            <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-200/70 dark:border-amber-800/60 flex items-center gap-1 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Celebrate</span>
            </span>
          </div>
          <div>
            <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 block">Daily Run Streak</span>
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">{summary.streakDays || profile?.streakDays || 1} Days</span>
            <span className="text-[9px] sm:text-[10px] text-amber-600 dark:text-amber-400 font-bold block mt-0.5">
              {todayMinutes > 0 ? '🔥 7-Day sprint active today' : '🔥 Run pending today'}
            </span>
          </div>
        </div>

        {/* Accuracy / AI Mastery */}
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xs space-y-1.5">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Brain className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 block">Diagnostics Accuracy</span>
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">{summary.accuracyRate}%</span>
            <span className="text-[9px] sm:text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
              Socratic Diagnostic Tested
            </span>
          </div>
        </div>
      </div>

      {/* NORA AI RUN DEBRIEF BANNER */}
      <div 
        onClick={onOpenModal}
        className="p-3.5 sm:p-4 bg-gradient-to-br from-indigo-50 via-blue-50 to-white dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/40 border border-blue-200/80 dark:border-indigo-900/60 rounded-2xl sm:rounded-3xl shadow-2xs hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-900 dark:text-slate-100">Nora's AI Run Debrief</span>
                {summary.aiInsight?.grade && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    Grade: {summary.aiInsight.grade}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium line-clamp-2 mt-0.5 leading-snug">
                {summary.aiInsight?.summaryHeadline || 'Steady study pace this week! Tap to review insights.'}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
            <span className="hidden sm:inline">Details</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Footer actions inside the debrief box */}
        <div className="mt-3 pt-2.5 border-t border-blue-100/80 dark:border-slate-800 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-medium truncate">
            {summary.sprintTasks.filter(t => t.completed).length} / {summary.sprintTasks.length} Weekly goals met
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onGenerateAiDebrief();
            }}
            disabled={isAiGenerating}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors active:scale-95"
            title="Refresh AI insights using latest learning data"
          >
            <RotateCw className={`w-3 h-3 ${isAiGenerating ? 'animate-spin' : ''}`} />
            <span>{isAiGenerating ? 'Analyzing...' : 'Refresh AI'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
