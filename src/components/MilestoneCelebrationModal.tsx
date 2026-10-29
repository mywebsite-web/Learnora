import React, { useEffect, useState } from 'react';
import { 
  Flame, 
  Trophy, 
  Sparkles, 
  Award, 
  X, 
  CheckCircle2, 
  Share2, 
  Zap, 
  RotateCw,
  TrendingUp,
  BrainCircuit,
  ArrowRight
} from 'lucide-react';
import { ConfettiService } from '../services/confettiService';

export interface MilestoneCelebrationData {
  type: '7-day-streak' | 'weekly-goal-met' | 'points-milestone' | 'spaced-review-complete';
  title: string;
  subtitle: string;
  metricLabel: string;
  metricValue: string | number;
  bonusXP: number;
  badgeEmoji: string;
}

interface MilestoneCelebrationModalProps {
  milestone: MilestoneCelebrationData | null;
  onClose: () => void;
  onClaimBonus?: (xp: number) => void;
}

export const MilestoneCelebrationModal: React.FC<MilestoneCelebrationModalProps> = ({
  milestone,
  onClose,
  onClaimBonus
}) => {
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    if (milestone) {
      setClaimed(false);
      // Trigger full confetti fireworks and audio chime immediately upon modal display!
      ConfettiService.fireMilestoneFireworks(2600);
    }
  }, [milestone]);

  if (!milestone) return null;

  const handleClaim = () => {
    ConfettiService.fireGrandCannons();
    setClaimed(true);
    if (onClaimBonus) {
      onClaimBonus(milestone.bonusXP);
    }
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleReplayParticles = () => {
    ConfettiService.fireGrandCannons();
  };

  return (
    <div 
      className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-amber-300/80 dark:border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden p-6 text-center space-y-5 animate-scale-up ring-2 ring-amber-400/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Radial Background Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-b from-amber-400/25 via-orange-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          title="Close celebration"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Glowing Badge Avatar */}
        <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
          {/* Animated pulsing outer halo */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 opacity-30 animate-ping rounded-full" />
          <div className="relative w-full h-full rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 flex items-center justify-center text-white shadow-xl shadow-amber-500/30 transform hover:scale-105 transition-transform">
            {milestone.type === '7-day-streak' ? (
              <Flame className="w-12 h-12 sm:w-14 sm:h-14 fill-white animate-bounce" />
            ) : milestone.type === 'weekly-goal-met' ? (
              <Trophy className="w-12 h-12 sm:w-14 sm:h-14 fill-white animate-bounce" />
            ) : (
              <Award className="w-12 h-12 sm:w-14 sm:h-14 fill-white animate-bounce" />
            )}
          </div>
          {/* Sparkle sticker */}
          <span className="absolute -bottom-1 -right-1 text-2xl filter drop-shadow">
            {milestone.badgeEmoji || '🎉'}
          </span>
        </div>

        {/* Title & Headline */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
            <span>Milestone Unlocked!</span>
          </div>
          
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
            {milestone.title}
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
            {milestone.subtitle}
          </p>
        </div>

        {/* Milestone Achievement Tile */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-amber-50/70 dark:bg-slate-800/80 border border-amber-200/90 dark:border-amber-900/50 text-left">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
              {milestone.metricLabel}
            </span>
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 block mt-0.5">
              {milestone.metricValue}
            </span>
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>Permanent memory lock</span>
            </span>
          </div>

          <div className="border-l border-amber-200/80 dark:border-slate-700 pl-3">
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
              Milestone Reward
            </span>
            <span className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 block mt-0.5">
              +{milestone.bonusXP} XP
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Added to profile</span>
            </span>
          </div>
        </div>

        {/* Buttons / Actions */}
        <div className="pt-1 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleClaim}
            disabled={claimed}
            className={`w-full py-3 px-5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 cursor-pointer ${
              claimed
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/25'
            }`}
          >
            {claimed ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Bonus Claimed!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Claim +{milestone.bonusXP} XP &amp; Keep Streak</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Replay Confetti Particle Blast */}
          <button
            type="button"
            onClick={handleReplayParticles}
            className="w-full py-2 px-4 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Replay Confetti &amp; Fanfare 🎉</span>
          </button>
        </div>
      </div>
    </div>
  );
};
