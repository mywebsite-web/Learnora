import React, { useState, useMemo } from 'react';
import {
  Award,
  Zap,
  Flame,
  Trophy,
  Brain,
  BookOpen,
  Clock,
  CheckCircle2,
  Lock,
  Sparkles,
  ChevronRight,
  X,
  Star
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types';

export interface VirtualBadge {
  id: string;
  name: string;
  description: string;
  criteriaLabel: string;
  category: 'Lesson Mastery' | 'Streak & Consistency' | 'Deep Focus';
  iconName: 'zap' | 'flame' | 'trophy' | 'brain' | 'book' | 'clock';
  accentColor: 'amber' | 'orange' | 'emerald' | 'indigo' | 'blue' | 'purple';
  currentValue: number;
  targetValue: number;
  unit: string;
  unlocked: boolean;
  xpBonus: number;
}

interface UserBadgesSectionProps {
  profile: UserProfile | null;
  studySetsCount?: number;
  completedTasksCount?: number;
  reviewedItemsCount?: number;
  variant?: 'card' | 'compact';
  onCelebrateBadge?: (badgeName: string) => void;
}

export const UserBadgesSection: React.FC<UserBadgesSectionProps> = ({
  profile,
  studySetsCount = 0,
  completedTasksCount = 0,
  reviewedItemsCount = 0,
  variant = 'card',
  onCelebrateBadge
}) => {
  const [filter, setFilter] = useState<'all' | 'earned' | 'locked'>('all');
  const [selectedBadge, setSelectedBadge] = useState<VirtualBadge | null>(null);
  const [showAllModal, setShowAllModal] = useState(false);

  const streakDays = Math.max(1, profile?.streakDays || 1);
  const points = profile?.points || 180;
  const totalStudyMinutes = profile?.totalStudyMinutes || 45;

  // Compute virtual reward badges from lesson completion, study sets, XP, and streak metrics
  const badges: VirtualBadge[] = useMemo(() => {
    // 1. Quick Learner: Complete 1st study set/lesson or reach 100+ XP
    const quickLearnerProgress = Math.max(
      studySetsCount >= 1 ? 1 : 0,
      points >= 100 ? 1 : 0
    );

    // 2. Consistent Contributor: Active streak + lesson/task contributions (target: 3 contributions/streak score)
    const contributorScore = Math.min(
      3,
      streakDays + studySetsCount + completedTasksCount + (points >= 150 ? 1 : 0)
    );

    // 3. 7-Day Streak Warrior: Reach a 7-day study streak
    const streakWarriorProgress = Math.min(7, streakDays);

    // 4. Socratic Scholar: Engage in Socratic lessons / earn 195+ Study XP
    const socraticScholarProgress = Math.min(195, points);

    // 5. Deck Architect: Create & complete 3+ Study Sets
    const deckArchitectProgress = Math.min(3, Math.max(studySetsCount, points >= 250 ? 3 : 1));

    // 6. Spaced Repetition Pro: Complete 60+ minutes of study or 3+ spaced-repetition reviews
    const focusProgress = Math.min(
      60,
      Math.max(totalStudyMinutes, reviewedItemsCount * 20)
    );

    return [
      {
        id: 'quick-learner',
        name: 'Quick Learner',
        description: 'Rapidly grasps new concepts by completing initial lessons and earning early Study XP.',
        criteriaLabel: 'Complete your first lesson set or reach 100 Study XP',
        category: 'Lesson Mastery',
        iconName: 'zap',
        accentColor: 'amber',
        currentValue: quickLearnerProgress,
        targetValue: 1,
        unit: 'milestone',
        unlocked: quickLearnerProgress >= 1,
        xpBonus: 50
      },
      {
        id: 'consistent-contributor',
        name: 'Consistent Contributor',
        description: 'Shows steady academic momentum across daily streaks, sprint tasks, and study sets.',
        criteriaLabel: 'Reach 3 combined streak days & completed study tasks',
        category: 'Streak & Consistency',
        iconName: 'flame',
        accentColor: 'orange',
        currentValue: contributorScore,
        targetValue: 3,
        unit: 'contributions',
        unlocked: contributorScore >= 3,
        xpBonus: 75
      },
      {
        id: 'socratic-scholar',
        name: 'Socratic Scholar',
        description: 'Demonstrates deep critical thinking during Nora Socratic tutor lessons and feedback.',
        criteriaLabel: 'Accumulate 195+ Study XP through lessons & tutor sessions',
        category: 'Lesson Mastery',
        iconName: 'brain',
        accentColor: 'indigo',
        currentValue: socraticScholarProgress,
        targetValue: 195,
        unit: 'XP',
        unlocked: socraticScholarProgress >= 195,
        xpBonus: 100
      },
      {
        id: 'streak-warrior',
        name: '7-Day Streak Warrior',
        description: 'Maintains an unbroken 7-day learning streak with daily study check-ins.',
        criteriaLabel: 'Maintain a 7-day continuous study streak',
        category: 'Streak & Consistency',
        iconName: 'trophy',
        accentColor: 'emerald',
        currentValue: streakWarriorProgress,
        targetValue: 7,
        unit: 'days',
        unlocked: streakWarriorProgress >= 7,
        xpBonus: 150
      },
      {
        id: 'deck-architect',
        name: 'Deck Architect',
        description: 'Builds a rich personal knowledge library of flashcards, quizzes, and study notes.',
        criteriaLabel: 'Build or master 3 Study Sets in your library',
        category: 'Lesson Mastery',
        iconName: 'book',
        accentColor: 'blue',
        currentValue: deckArchitectProgress,
        targetValue: 3,
        unit: 'sets',
        unlocked: deckArchitectProgress >= 3,
        xpBonus: 120
      },
      {
        id: 'deep-focus-pro',
        name: 'Deep Focus Pro',
        description: 'Invests dedicated focus time mastering spaced-repetition cards and review sessions.',
        criteriaLabel: 'Log 60+ total study minutes or complete 3 review sessions',
        category: 'Deep Focus',
        iconName: 'clock',
        accentColor: 'purple',
        currentValue: focusProgress,
        targetValue: 60,
        unit: 'mins',
        unlocked: focusProgress >= 60,
        xpBonus: 100
      }
    ];
  }, [studySetsCount, completedTasksCount, reviewedItemsCount, streakDays, points, totalStudyMinutes]);

  const earnedBadges = useMemo(() => badges.filter(b => b.unlocked), [badges]);
  const filteredBadges = useMemo(() => {
    if (filter === 'earned') return badges.filter(b => b.unlocked);
    if (filter === 'locked') return badges.filter(b => !b.unlocked);
    return badges;
  }, [badges, filter]);

  const triggerBadgeConfetti = (badge: VirtualBadge) => {
    if (badge.unlocked) {
      confetti({
        particleCount: 55,
        spread: 65,
        origin: { y: 0.7 }
      });
      onCelebrateBadge?.(badge.name);
    }
  };

  const renderBadgeIcon = (iconName: VirtualBadge['iconName'], className = 'w-4 h-4') => {
    switch (iconName) {
      case 'zap':
        return <Zap className={className} />;
      case 'flame':
        return <Flame className={className} />;
      case 'trophy':
        return <Trophy className={className} />;
      case 'brain':
        return <Brain className={className} />;
      case 'book':
        return <BookOpen className={className} />;
      case 'clock':
        return <Clock className={className} />;
    }
  };

  const getBadgeStyle = (accent: VirtualBadge['accentColor'], unlocked: boolean) => {
    if (!unlocked) {
      return {
        bg: 'bg-slate-100/80 dark:bg-slate-800/50',
        border: 'border-slate-200/80 dark:border-slate-700/60',
        iconBg: 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500',
        pill: 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
        bar: 'bg-slate-400 dark:bg-slate-600'
      };
    }
    switch (accent) {
      case 'amber':
        return {
          bg: 'bg-gradient-to-br from-amber-50/90 via-white to-yellow-50/60 dark:from-amber-950/40 dark:via-slate-900 dark:to-amber-900/20',
          border: 'border-amber-200/90 dark:border-amber-800/60',
          iconBg: 'bg-amber-500 text-white shadow-xs shadow-amber-500/30',
          pill: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800',
          bar: 'bg-amber-500'
        };
      case 'orange':
        return {
          bg: 'bg-gradient-to-br from-orange-50/90 via-white to-rose-50/50 dark:from-orange-950/40 dark:via-slate-900 dark:to-orange-900/20',
          border: 'border-orange-200/90 dark:border-orange-800/60',
          iconBg: 'bg-orange-500 text-white shadow-xs shadow-orange-500/30',
          pill: 'bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 border border-orange-200/70 dark:border-orange-800',
          bar: 'bg-orange-500'
        };
      case 'indigo':
        return {
          bg: 'bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-indigo-900/20',
          border: 'border-indigo-200/90 dark:border-indigo-800/60',
          iconBg: 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30',
          pill: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800',
          bar: 'bg-indigo-600'
        };
      case 'emerald':
        return {
          bg: 'bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-emerald-900/20',
          border: 'border-emerald-200/90 dark:border-emerald-800/60',
          iconBg: 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30',
          pill: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800',
          bar: 'bg-emerald-500'
        };
      case 'blue':
        return {
          bg: 'bg-gradient-to-br from-blue-50/90 via-white to-sky-50/50 dark:from-blue-950/40 dark:via-slate-900 dark:to-blue-900/20',
          border: 'border-blue-200/90 dark:border-blue-800/60',
          iconBg: 'bg-blue-600 text-white shadow-xs shadow-blue-600/30',
          pill: 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800',
          bar: 'bg-blue-600'
        };
      case 'purple':
        return {
          bg: 'bg-gradient-to-br from-purple-50/90 via-white to-fuchsia-50/50 dark:from-purple-950/40 dark:via-slate-900 dark:to-purple-900/20',
          border: 'border-purple-200/90 dark:border-purple-800/60',
          iconBg: 'bg-purple-600 text-white shadow-xs shadow-purple-600/30',
          pill: 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200/70 dark:border-purple-800',
          bar: 'bg-purple-600'
        };
    }
  };

  // Compact variant for Profile Dropdown & Mobile Profile Card
  if (variant === 'compact') {
    return (
      <>
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-500" />
              <span>Badges ({earnedBadges.length}/{badges.length})</span>
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAllModal(true);
              }}
              className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-2.5 h-2.5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {badges.slice(0, 3).map((badge) => {
              const style = getBadgeStyle(badge.accentColor, badge.unlocked);
              return (
                <button
                  key={badge.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBadge(badge);
                    triggerBadgeConfetti(badge);
                  }}
                  title={`${badge.name}: ${badge.description}`}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                    badge.unlocked
                      ? style.pill
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200/70 dark:border-slate-700'
                  }`}
                >
                  {renderBadgeIcon(badge.iconName, 'w-2.5 h-2.5 shrink-0')}
                  <span className="truncate max-w-[105px]">{badge.name}</span>
                  {!badge.unlocked && <Lock className="w-2 h-2 opacity-60 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Badge Detail / Showcase Modal when triggered from compact view */}
        {(selectedBadge || showAllModal) && (
          <div
            className="fixed inset-0 z-[80] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedBadge(null);
              setShowAllModal(false);
            }}
          >
            <div
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      Learner Badges & Rewards
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {earnedBadges.length} of {badges.length} virtual rewards unlocked
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBadge(null);
                    setShowAllModal(false);
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5">
                {badges.map((b) => {
                  const st = getBadgeStyle(b.accentColor, b.unlocked);
                  const pct = Math.min(100, Math.round((b.currentValue / b.targetValue) * 100));
                  const isHighlighted = selectedBadge?.id === b.id;
                  return (
                    <div
                      key={b.id}
                      onClick={() => triggerBadgeConfetti(b)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${st.bg} ${st.border} ${
                        isHighlighted ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${st.iconBg}`}>
                          {renderBadgeIcon(b.iconName, 'w-4 h-4')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                              {b.name}
                            </span>
                            {b.unlocked ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center gap-1 shrink-0">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                Earned
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center gap-1 shrink-0">
                                <Lock className="w-2.5 h-2.5" />
                                {pct}%
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                            {b.description}
                          </p>
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                              <span>{b.criteriaLabel}</span>
                              <span>
                                {b.currentValue}/{b.targetValue} {b.unit}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${st.bar}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Full Card variant for Dashboard User Profile Area & Profile Settings Tab
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header with User Profile Summary & Badge Counter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-xs shadow-amber-500/20 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                Profile Badges & Rewards
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                {earnedBadges.length}/{badges.length} Earned
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Virtual rewards unlocked from your lesson completions & {streakDays}-day streak
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          {(['all', 'earned', 'locked'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer ${
                filter === tab
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab === 'all'
                ? `All (${badges.length})`
                : tab === 'earned'
                ? `Earned (${earnedBadges.length})`
                : `Locked (${badges.length - earnedBadges.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {filteredBadges.map((badge) => {
          const style = getBadgeStyle(badge.accentColor, badge.unlocked);
          const progressPct = Math.min(
            100,
            Math.round((badge.currentValue / badge.targetValue) * 100)
          );

          return (
            <div
              key={badge.id}
              onClick={() => {
                setSelectedBadge(badge);
                triggerBadgeConfetti(badge);
              }}
              className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${style.bg} ${style.border}`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${style.iconBg}`}
                >
                  {renderBadgeIcon(badge.iconName, 'w-5 h-5')}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                      {badge.name}
                    </h4>
                    {badge.unlocked ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Earned</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0">
                        <Lock className="w-2.5 h-2.5" />
                        <span>{progressPct}%</span>
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2 leading-snug">
                    {badge.description}
                  </p>

                  {/* Progress Bar & Metric */}
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      <span className="truncate pr-2">{badge.category}</span>
                      <span className="shrink-0">
                        {badge.currentValue}/{badge.targetValue} {badge.unit}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Badge Spotlight Banner */}
      {selectedBadge && (
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/70 flex items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                getBadgeStyle(selectedBadge.accentColor, selectedBadge.unlocked).iconBg
              }`}
            >
              {renderBadgeIcon(selectedBadge.iconName, 'w-4 h-4')}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                  {selectedBadge.name}
                </span>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  +{selectedBadge.xpBonus} XP Value
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                Requirement: {selectedBadge.criteriaLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedBadge(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
            title="Dismiss details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
