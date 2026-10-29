import React, { useState, useEffect } from 'react';
import { 
  X, 
  BrainCircuit, 
  Clock, 
  RotateCcw, 
  CheckCircle2, 
  ChevronRight, 
  Sparkles, 
  Award, 
  BookOpen, 
  HelpCircle, 
  Eye, 
  Flame,
  Zap,
  ArrowRight
} from 'lucide-react';
import { ReviewLessonItem, AnkiRating } from '../types';
import { ReviewQueueService } from '../services/reviewQueueService';
import { WeeklyRunService } from '../services/weeklyRunService';
import { ConfettiService } from '../services/confettiService';

interface ReviewSessionModalProps {
  userId: string;
  itemsToReview: ReviewLessonItem[];
  onClose: () => void;
  onItemReviewed: (updatedItem: ReviewLessonItem, allItems: ReviewLessonItem[]) => void;
  onOpenStudySet?: (studySetId?: string) => void;
  onAskNora?: (topic: string) => void;
}

export const ReviewSessionModal: React.FC<ReviewSessionModalProps> = ({
  userId,
  itemsToReview,
  onClose,
  onItemReviewed,
  onOpenStudySet,
  onAskNora
}) => {
  const [queue, setQueue] = useState<ReviewLessonItem[]>(itemsToReview);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [earnedXp, setEarnedXp] = useState(0);

  const currentItem = queue[currentIndex];

  // Keyboard shortcut listener: Space to reveal, 1-4 for Anki ratings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sessionCompleted || ratingLoading || !currentItem) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setShowAnswer(prev => !prev);
      } else if (showAnswer) {
        if (e.key === '1') handleRate('again');
        else if (e.key === '2') handleRate('hard');
        else if (e.key === '3') handleRate('good');
        else if (e.key === '4') handleRate('easy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAnswer, currentItem, sessionCompleted, ratingLoading]);

  const handleRate = async (rating: AnkiRating) => {
    if (!currentItem || ratingLoading) return;
    setRatingLoading(true);

    try {
      const { updatedItem, allItems } = await ReviewQueueService.recordReview(userId, currentItem.id, rating);
      onItemReviewed(updatedItem, allItems);

      const xpBonus = rating === 'again' ? 10 : rating === 'hard' ? 20 : rating === 'good' ? 30 : 40;
      setEarnedXp(prev => prev + xpBonus);
      setReviewedCount(prev => prev + 1);

      // If rated 'again', optionally re-append to end of session queue for immediate reinforcement
      if (rating === 'again') {
        setQueue(prev => [...prev, updatedItem]);
      }

      // Move to next item
      if (currentIndex + 1 < queue.length) {
        setCurrentIndex(prev => prev + 1);
        setShowAnswer(false);
      } else {
        setSessionCompleted(true);
        ConfettiService.fireMilestoneFireworks(2400);
        // Record 10m study time to Weekly Run for today
        try {
          WeeklyRunService.logStudyTime(userId, 10, currentItem?.subject || 'Spaced Repetition Review');
        } catch (_) {}
      }
    } catch (e) {
      console.error('Failed to record review:', e);
    } finally {
      setRatingLoading(false);
    }
  };

  const getStageLabel = (stage: number) => {
    if (stage === 1) return 'Stage 1 · 1 Day Interval';
    if (stage === 2) return 'Stage 2 · 3 Day Interval';
    if (stage === 3) return 'Stage 3 · 7 Day Interval';
    return 'Stage 4 · Mastered (14+ Days)';
  };

  const formatDaysAgo = (timestamp: number) => {
    const diffHours = Math.round((Date.now() - timestamp) / (1000 * 60 * 60));
    if (diffHours < 24) return 'Completed earlier today';
    const days = Math.round(diffHours / 24);
    return `Completed ${days} ${days === 1 ? 'day' : 'days'} ago`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                  Spaced Repetition Review
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Anki SM-2
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Reinforcing lessons completed 1, 3, and 7 days ago
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!sessionCompleted && (
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {currentIndex + 1} / {queue.length}
              </span>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {!sessionCompleted && (
          <div className="w-full h-1 bg-slate-100 dark:bg-slate-800">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${((currentIndex) / queue.length) * 100}%` }}
            />
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {sessionCompleted ? (
            /* Session Completed Screen */
            <div className="text-center py-8 sm:py-12 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Queue Complete!
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                  You reviewed <span className="font-bold text-slate-800 dark:text-slate-200">{reviewedCount} lessons</span> today. Your spaced repetition retention curve has been updated.
                </p>
              </div>

              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>+{earnedXp} Review XP Earned</span>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          ) : currentItem ? (
            /* Active Flashcard Review */
            <div className="space-y-5">
              
              {/* Meta information tags */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wide bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {currentItem.subject}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {getStageLabel(currentItem.repetitionStage)}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>{formatDaysAgo(currentItem.completedAt)}</span>
                </div>
              </div>

              {/* Lesson Title & Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 leading-snug">
                  {currentItem.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {currentItem.summarySnippet}
                </p>

                {/* Key Concepts Pills */}
                {currentItem.keyConcepts && currentItem.keyConcepts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800">
                    {currentItem.keyConcepts.map((kc, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs"
                      >
                        {kc}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Question / Active Recall Prompt */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-blue-50/70 dark:from-indigo-950/30 dark:to-blue-950/30 border border-indigo-200/60 dark:border-indigo-800/60 shadow-xs">
                <div className="flex items-center gap-2 mb-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs uppercase tracking-wider">
                  <HelpCircle className="w-4 h-4" />
                  <span>Spaced Recall Prompt</span>
                </div>
                <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                  {currentItem.promptQuestion || `What are the most essential principles and mechanisms covered in "${currentItem.title}"?`}
                </p>
              </div>

              {/* Reveal Answer Section */}
              {!showAnswer ? (
                <button
                  onClick={() => setShowAnswer(true)}
                  className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 active:scale-[0.99] transition-all"
                >
                  <Eye className="w-4 h-4" />
                  <span>Reveal Key Takeaway &amp; Answer (Space)</span>
                </button>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 text-slate-900 dark:text-slate-100 shadow-xs">
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Model Answer &amp; Retention Insight</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                      {currentItem.promptAnswer || currentItem.summarySnippet}
                    </p>
                  </div>

                  {/* Anki SM-2 4-Rating Button Bar */}
                  <div className="space-y-2">
                    <p className="text-center text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      Rate your recall accuracy to schedule the next review interval:
                    </p>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {/* 1. AGAIN */}
                      <button
                        onClick={() => handleRate('again')}
                        disabled={ratingLoading}
                        className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-left active:scale-95 transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black">Again (1)</span>
                          <span className="text-[10px] font-bold text-rose-500">&lt; 1d</span>
                        </div>
                        <p className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-1">
                          Forgot · Reset to Day 1
                        </p>
                      </button>

                      {/* 2. HARD */}
                      <button
                        onClick={() => handleRate('hard')}
                        disabled={ratingLoading}
                        className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-left active:scale-95 transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black">Hard (2)</span>
                          <span className="text-[10px] font-bold text-amber-500">
                            {currentItem.repetitionStage === 1 ? '2d' : currentItem.repetitionStage === 2 ? '4d' : '8d'}
                          </span>
                        </div>
                        <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-1">
                          Recalled with struggle
                        </p>
                      </button>

                      {/* 3. GOOD */}
                      <button
                        onClick={() => handleRate('good')}
                        disabled={ratingLoading}
                        className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-left active:scale-95 transition-all group ring-1 ring-blue-500/20"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black">Good (3)</span>
                          <span className="text-[10px] font-bold text-blue-500">
                            {currentItem.repetitionStage === 1 ? '3d' : currentItem.repetitionStage === 2 ? '7d' : '14d'}
                          </span>
                        </div>
                        <p className="text-[10px] text-blue-600/80 dark:text-blue-400/80 mt-1">
                          Solid · Advance stage
                        </p>
                      </button>

                      {/* 4. EASY */}
                      <button
                        onClick={() => handleRate('easy')}
                        disabled={ratingLoading}
                        className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-left active:scale-95 transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black">Easy (4)</span>
                          <span className="text-[10px] font-bold text-emerald-500">
                            {currentItem.repetitionStage === 1 ? '4d' : currentItem.repetitionStage === 2 ? '10d' : '21d'}
                          </span>
                        </div>
                        <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-1">
                          Effortless · Leap forward
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Context actions */}
                  <div className="flex items-center justify-between pt-2 text-xs">
                    {onAskNora && (
                      <button
                        onClick={() => {
                          onAskNora(currentItem.title);
                          onClose();
                        }}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Clarify with Nora AI</span>
                      </button>
                    )}
                    {onOpenStudySet && currentItem.studySetId && (
                      <button
                        onClick={() => {
                          onOpenStudySet(currentItem.studySetId);
                          onClose();
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 ml-auto"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Open Full Study Set</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No items left to review.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
