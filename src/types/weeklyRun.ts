/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WeeklyRunDay {
  dayName: string; // 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
  dayShort: string; // 'M', 'T', 'W', 'T', 'F', 'S', 'S'
  dateStr: string; // e.g. 'Oct 5'
  isoDate: string; // e.g. '2026-10-05'
  minutesStudied: number;
  sessionsCount: number;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  targetMinutes: number;
  completed: boolean;
}

export interface WeeklyRunSprintTask {
  id: string;
  title: string;
  subject?: string;
  category: 'quiz' | 'tutor' | 'flashcards' | 'notes' | 'custom';
  targetCount: number;
  currentCount: number;
  completed: boolean;
  xpReward: number;
  dueDate?: string;
}

export interface WeeklyRunAiInsight {
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+';
  summaryHeadline: string;
  deepOverview: string;
  keyStrengths: string[];
  focusAreas: string[];
  productivityPace: string;
  noraRecommendedAction: string;
  recommendedPrompt: string;
  generatedAt: number;
}

export interface WeeklyRunSummaryData {
  userId: string;
  weekKey: string; // e.g. '2026-W41'
  weekRangeLabel: string; // e.g. 'Oct 5 – Oct 11, 2026'
  targetWeeklyMinutes: number; // e.g. 210 mins
  totalMinutesStudied: number;
  totalXP: number;
  streakDays: number;
  accuracyRate: number; // e.g. 91%
  sessionsCount: number;
  days: WeeklyRunDay[];
  sprintTasks: WeeklyRunSprintTask[];
  subjectDistribution: {
    subject: string;
    minutes: number;
    percent: number;
    color: string;
  }[];
  aiInsight?: WeeklyRunAiInsight;
  updatedAt: number;
}
