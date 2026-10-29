import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  ArrowLeft, 
  RotateCcw, 
  Check, 
  X, 
  Clock, 
  HelpCircle, 
  Flame, 
  Sparkles,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudySet, Flashcard } from '../types';
import { DBService } from '../services/dbService';
import { ReviewQueueService } from '../services/reviewQueueService';
import { WeeklyRunService } from '../services/weeklyRunService';

interface FlashcardSessionProps {
  studySet: StudySet;
  onBack: () => void;
}

export const FlashcardSession: React.FC<FlashcardSessionProps> = ({ studySet, onBack }) => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [stats, setStats] = useState({ mastered: 0, almost: 0, dontKnow: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCards();
  }, [studySet.id]);

  const loadCards = async () => {
    setLoading(true);
    try {
      const fetched = await DBService.getFlashcards(studySet.id);
      setCards(fetched);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const currentCard = cards[currentIndex];

  const handleRating = async (rating: 'mastered' | 'almost' | 'dontKnow') => {
    if (!currentCard) return;

    const isCorrect = rating === 'mastered';
    const masteryState = rating === 'mastered' ? 'mastered' : rating === 'almost' ? 'learning' : 'new';

    // Update database
    await DBService.updateFlashcardMastery(currentCard.id, masteryState, isCorrect);

    // Update session stats
    setStats((prev) => ({
      ...prev,
      [rating]: prev[rating] + 1
    }));

    setIsFlipped(false);

    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setSessionCompleted(true);
      confetti({ particleCount: 70, spread: 60 });

      // Update Nora's Cognitive Memory with retention signals
      try {
        const userId = studySet.userId;
        const mem = await DBService.getCognitiveMemory(userId);
        const cardTopic = studySet.title;
        const totalCards = cards.length;
        const masteryRatio = (stats.mastered + (rating === 'mastered' ? 1 : 0)) / totalCards;

        const updatedMem = {
          ...mem,
          noraPedagogicalStrategy: {
            ...mem.noraPedagogicalStrategy,
            recentSelfAdjustment: masteryRatio > 0.7
              ? `Observed high flashcard retention (${Math.round(masteryRatio * 100)}%) on ${cardTopic}; transitioning to higher cognitive inquiry.`
              : `Flagged recall fatigue on ${cardTopic}; will offer simpler analogies and mnemonic hooks in future explanations.`,
            adaptationLevel: Math.min(100, mem.noraPedagogicalStrategy.adaptationLevel + 1),
            totalInteractionsReflected: (mem.noraPedagogicalStrategy.totalInteractionsReflected || 0) + 1
          },
          lastSelfReflectionAt: Date.now(),
          updatedAt: Date.now()
        };
        await DBService.saveCognitiveMemory(updatedMem);
      } catch (err) {
        console.error('Failed to log flashcard retention memory:', err);
      }

      // Enqueue into Spaced Repetition Review Queue for 1, 3, and 7 day reminders
      try {
        await ReviewQueueService.enqueueCompletedLesson(studySet.userId, {
          studySetId: studySet.id,
          title: `${studySet.title} - Flashcards`,
          subject: studySet.subject,
          lessonType: 'flashcards',
          keyConcepts: cards.slice(0, 4).map(c => c.front),
          summarySnippet: `Flashcard deck completed with ${(stats.mastered + (rating === 'mastered' ? 1 : 0))} cards mastered out of ${cards.length}.`,
          promptQuestion: cards[0]?.front,
          promptAnswer: cards[0]?.back
        });
      } catch (err) {
        console.warn('Notice enqueuing flashcard deck to review queue:', err);
      }

      // Record 10m study time & flashcards sprint progress into Weekly Run for Today
      try {
        await WeeklyRunService.recordFlashcardCompletion(studySet.userId, studySet.subject);
      } catch (err) {
        console.warn('Notice recording flashcard completion to weekly run:', err);
      }
    }
  };

  const restartSession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
    setStats({ mastered: 0, almost: 0, dontKnow: 0 });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-center">
        <Layers className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">No flashcards found</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          This study set doesn't have any cards yet. Return to the set to generate a deck.
        </p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 font-serif">Spaced Repetition Flashcards</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{studySet.title}</p>
          </div>
        </div>

        {/* Card counter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
            {sessionCompleted ? cards.length : currentIndex + 1} / {cards.length}
          </span>
        </div>
      </div>

      {/* Main card interface */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-2xl mx-auto w-full">
        {!sessionCompleted && currentCard ? (
          <div className="w-full flex flex-col items-center">
            {/* Flashcard container */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full min-h-[320px] sm:min-h-[360px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl p-8 flex flex-col justify-between cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-all select-none relative group"
            >
              {/* Card Meta Top */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="uppercase tracking-wider font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-md">
                  {currentCard.type}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">Click card to flip</span>
              </div>

              {/* Card Body */}
              <div className="my-auto text-center py-6">
                {!isFlipped ? (
                  <div>
                    <span className="text-xs uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 block mb-3">Front</span>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-serif leading-snug">
                      {currentCard.front}
                    </h3>
                  </div>
                ) : (
                  <div className="animate-fade-in">
                    <span className="text-xs uppercase font-bold tracking-widest text-indigo-600 dark:text-indigo-400 block mb-3">Back / Answer</span>
                    <h3 className="text-lg sm:text-xl font-bold text-indigo-950 dark:text-indigo-200 font-sans leading-relaxed">
                      {currentCard.back}
                    </h3>
                    {currentCard.explanation && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 italic bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                        {currentCard.explanation}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Card Bottom Grounding */}
              <div className="text-center text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-3">
                {currentCard.citation?.quote ? (
                  <span>Source: "{currentCard.citation.quote.slice(0, 50)}..."</span>
                ) : (
                  <span>Grounded in {studySet.title}</span>
                )}
              </div>
            </div>

            {/* Interaction Buttons: Know it / Almost / Don't know */}
            <div className="mt-8 grid grid-cols-3 gap-3 w-full">
              <button
                type="button"
                onClick={() => handleRating('dontKnow')}
                className="py-3 px-3 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <X className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Don't Know</span>
              </button>

              <button
                type="button"
                onClick={() => handleRating('almost')}
                className="py-3 px-3 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Almost</span>
              </button>

              <button
                type="button"
                onClick={() => handleRating('mastered')}
                className="py-3 px-3 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Know It!</span>
              </button>
            </div>
          </div>
        ) : (
          /* Completion Card */
          <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xl text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-serif">Deck Completed!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Your spaced repetition schedule has been updated.</p>

            <div className="my-6 grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900">
                <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 block">{stats.mastered}</span>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Mastered</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900">
                <span className="text-2xl font-bold text-amber-700 dark:text-amber-300 block">{stats.almost}</span>
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Review Soon</span>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-900">
                <span className="text-2xl font-bold text-rose-700 dark:text-rose-300 block">{stats.dontKnow}</span>
                <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">Needs Work</span>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={restartSession}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Review Deck Again</span>
              </button>
              <button
                onClick={onBack}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors"
              >
                Back to Study Set
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
