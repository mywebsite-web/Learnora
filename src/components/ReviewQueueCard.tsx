import React from 'react';
import { 
  Clock, 
  BrainCircuit, 
  CheckCircle2, 
  Flame, 
  ChevronRight, 
  Sparkles, 
  RotateCw, 
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { ReviewLessonItem } from '../types';

interface ReviewQueueCardProps {
  items: ReviewLessonItem[];
  onStartReviewSession: (itemsToReview?: ReviewLessonItem[]) => void;
  onOpenFullQueue: () => void;
  onQuickReviewItem: (item: ReviewLessonItem) => void;
}

export const ReviewQueueCard: React.FC<ReviewQueueCardProps> = ({
  items,
  onStartReviewSession,
  onOpenFullQueue,
  onQuickReviewItem
}) => {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  // Categorize lessons completed 1, 3, and 7 days ago
  const day1Items = items.filter(item => {
    const ageDays = (now - item.completedAt) / oneDayMs;
    return (ageDays >= 0.8 && ageDays < 2.5) || item.repetitionStage === 1;
  });

  const day3Items = items.filter(item => {
    const ageDays = (now - item.completedAt) / oneDayMs;
    return (ageDays >= 2.5 && ageDays < 5.5) || item.repetitionStage === 2;
  });

  const day7Items = items.filter(item => {
    const ageDays = (now - item.completedAt) / oneDayMs;
    return ageDays >= 5.5 || item.repetitionStage === 3;
  });

  // Due items: review date is now or in the past
  const dueItems = items.filter(item => item.nextReviewDate <= now);
  const averageRetention = items.length > 0 
    ? Math.round(items.reduce((acc, i) => acc + (i.retentionScore || 70), 0) / items.length)
    : 85;

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-slate-100 tracking-tight">
                Review Queue
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
                Spaced Repetition
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Anki-style memory intervals: 1, 3, and 7 days
            </p>
          </div>
        </div>

        {dueItems.length > 0 ? (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold shrink-0 animate-pulse">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>{dueItems.length} Due Now</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>All Caught Up</span>
          </div>
        )}
      </div>

      {/* 1, 3, 7 Day Interval Stages Grid */}
      <div className="grid grid-cols-3 gap-2">
        {/* 1 Day Ago */}
        <div 
          onClick={onOpenFullQueue}
          className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800 text-center cursor-pointer hover:border-blue-400 transition-colors"
          title="Open Review Queue for Stage 1"
        >
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            1 Day Ago
          </div>
          <div className="text-sm font-black text-blue-600 dark:text-blue-400 mt-0.5">
            {day1Items.length} {day1Items.length === 1 ? 'lesson' : 'lessons'}
          </div>
          <div className="text-[9px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Stage 1 Recall
          </div>
        </div>

        {/* 3 Days Ago */}
        <div 
          onClick={onOpenFullQueue}
          className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800 text-center cursor-pointer hover:border-indigo-400 transition-colors"
          title="Open Review Queue for Stage 2"
        >
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            3 Days Ago
          </div>
          <div className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
            {day3Items.length} {day3Items.length === 1 ? 'lesson' : 'lessons'}
          </div>
          <div className="text-[9px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Stage 2 Consolidation
          </div>
        </div>

        {/* 7 Days Ago */}
        <div 
          onClick={onOpenFullQueue}
          className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800 text-center cursor-pointer hover:border-purple-400 transition-colors"
          title="Open Review Queue for Stage 3"
        >
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            7 Days Ago
          </div>
          <div className="text-sm font-black text-purple-600 dark:text-purple-400 mt-0.5">
            {day7Items.length} {day7Items.length === 1 ? 'lesson' : 'lessons'}
          </div>
          <div className="text-[9px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Stage 3 Lock-in
          </div>
        </div>
      </div>

      {/* Retention Curve Bar */}
      <div className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Estimated Retention Rate
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-black text-blue-700 dark:text-blue-300">
          <span>{averageRetention}%</span>
          <span className="text-[10px] font-medium text-slate-400">vs forgetting curve</span>
        </div>
      </div>

      {/* Top Due Items List (Quick Glance) */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Up Next for Review
        </div>
        
        {items.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400">
            No lessons in queue. Complete a lesson to schedule reviews!
          </div>
        ) : (
          items.slice(0, 3).map((item) => {
            const isDue = item.nextReviewDate <= now;
            const daysAgo = Math.round((now - item.completedAt) / oneDayMs);

            return (
              <div
                key={item.id}
                className="p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between gap-2.5 group hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase truncate">
                      {item.subject}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <span className="text-[10px] text-slate-400">
                      {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
                    </span>
                  </div>
                  <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate mt-0.5">
                    {item.title}
                  </h5>
                </div>

                <button
                  onClick={() => onQuickReviewItem(item)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition-all active:scale-95 flex items-center gap-1 ${
                    isDue
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>{isDue ? 'Review' : 'Recall'}</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-1 flex items-center gap-2">
        <button
          onClick={() => onStartReviewSession(dueItems.length > 0 ? dueItems : items)}
          className="flex-1 py-2.5 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{dueItems.length > 0 ? `Review Due (${dueItems.length})` : 'Start Practice Session'}</span>
        </button>

        <button
          onClick={onOpenFullQueue}
          className="py-2.5 px-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs active:scale-95 transition-all flex items-center gap-1"
        >
          <span>All ({items.length})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
