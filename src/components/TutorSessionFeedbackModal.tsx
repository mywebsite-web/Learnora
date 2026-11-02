import React, { useState, useEffect } from 'react';
import {
  Star,
  CheckCircle2,
  Sparkles,
  BrainCircuit,
  MessageSquareHeart,
  X,
  ArrowRight,
  ThumbsUp,
  RotateCcw
} from 'lucide-react';
import { TutorMode, TutorSessionFeedback } from '../types';
import { AiRobotMascot } from './AiRobotMascot';

interface TutorSessionFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExitAfterFeedback?: () => void;
  onStartNewSessionAfterFeedback?: () => void;
  onSubmitFeedback: (data: {
    rating: number;
    helpfulnessLevel: TutorSessionFeedback['helpfulnessLevel'];
    comprehensionAfter: TutorSessionFeedback['comprehensionAfter'];
    tags: string[];
    comment: string;
  }) => Promise<void>;
  sessionTitle: string;
  tutorMode: TutorMode;
  teachingPersona: string;
  messageCount: number;
  existingFeedback?: TutorSessionFeedback | null;
  triggeredByExit?: boolean;
}

const RATING_LABELS: Record<
  number,
  {
    level: TutorSessionFeedback['helpfulnessLevel'];
    title: string;
    subtitle: string;
    emoji: string;
  }
> = {
  1: {
    level: 'not-helpful',
    title: 'Not Helpful',
    subtitle: 'Nora missed the mark—we will adjust her explanation strategy immediately.',
    emoji: '😕'
  },
  2: {
    level: 'somewhat-helpful',
    title: 'Somewhat Helpful',
    subtitle: 'Some parts helped, but the pacing or clarity needed work.',
    emoji: '🤔'
  },
  3: {
    level: 'helpful',
    title: 'Helpful Lesson',
    subtitle: 'Solid Socratic session that covered the core concepts.',
    emoji: '👍'
  },
  4: {
    level: 'very-helpful',
    title: 'Very Helpful',
    subtitle: 'Clear explanations, great analogies, and effective concept checks!',
    emoji: '🌟'
  },
  5: {
    level: 'extremely-helpful',
    title: 'Extremely Helpful!',
    subtitle: 'Breakthrough Socratic session! The concepts clicked completely.',
    emoji: '🚀'
  }
};

const FEEDBACK_TAG_OPTIONS = [
  'Great Socratic questions',
  'Clear analogies & examples',
  'Perfect pacing',
  'Helpful quiz checks',
  'Strong source grounding',
  'Too fast / complex',
  'Too slow / basic',
  'Wanted more examples'
];

export const TutorSessionFeedbackModal: React.FC<TutorSessionFeedbackModalProps> = ({
  isOpen,
  onClose,
  onExitAfterFeedback,
  onStartNewSessionAfterFeedback,
  onSubmitFeedback,
  sessionTitle,
  tutorMode,
  teachingPersona,
  messageCount,
  existingFeedback,
  triggeredByExit = false
}) => {
  const [rating, setRating] = useState<number>(existingFeedback?.rating || 5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [comprehensionAfter, setComprehensionAfter] = useState<
    TutorSessionFeedback['comprehensionAfter']
  >(existingFeedback?.comprehensionAfter || 'mastered');
  const [selectedTags, setSelectedTags] = useState<string[]>(
    existingFeedback?.tags || ['Great Socratic questions', 'Clear analogies & examples']
  );
  const [comment, setComment] = useState<string>(existingFeedback?.comment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      if (existingFeedback) {
        setRating(existingFeedback.rating);
        setComprehensionAfter(existingFeedback.comprehensionAfter);
        setSelectedTags(existingFeedback.tags || []);
        setComment(existingFeedback.comment || '');
      } else {
        setRating(5);
        setComprehensionAfter('mastered');
        setSelectedTags(['Great Socratic questions', 'Clear analogies & examples']);
        setComment('');
      }
    }
  }, [isOpen, existingFeedback]);

  if (!isOpen) return null;

  const activeRatingValue = hoveredRating ?? rating;
  const ratingMeta = RATING_LABELS[activeRatingValue] || RATING_LABELS[5];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const chosenMeta = RATING_LABELS[rating] || RATING_LABELS[5];
      await onSubmitFeedback({
        rating,
        helpfulnessLevel: chosenMeta.level,
        comprehensionAfter,
        tags: selectedTags,
        comment: comment.trim()
      });
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-auto relative overflow-hidden">
        
        {/* Top Decorative Gradient Bar */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500" />

        {submitted ? (
          /* ============================================================== */
          /* SUBMITTED CONFIRMATION VIEW                                    */
          /* ============================================================== */
          <div className="py-4 text-center space-y-4 animate-in fade-in duration-150">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center ring-8 ring-emerald-50 dark:ring-emerald-950/30">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800">
                <Sparkles className="w-3 h-3" />
                <span>+15 Study XP Awarded</span>
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2">
                Thank You for Rating This Lesson!
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Your <strong>{rating}-star</strong> feedback for{' '}
                <strong className="text-slate-800 dark:text-slate-200">{sessionTitle}</strong> has been saved to Nora's Cognitive Memory.
              </p>
            </div>

            {/* Cognitive Adaptation Confirmation Box */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/60 text-left flex items-start gap-2.5">
              <BrainCircuit className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed">
                <span className="font-bold block">Pedagogical Strategy Updated:</span>
                <span>
                  {comprehensionAfter === 'mastered'
                    ? 'Nora marked this topic as mastered and will challenge you with deeper application questions next session.'
                    : comprehensionAfter === 'struggling'
                    ? 'Nora will slow the pacing down and use simpler step-by-step analogies on this topic next time.'
                    : 'Nora will reinforce this topic with targeted Socratic concept checks in your next review.'}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {onExitAfterFeedback && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onExitAfterFeedback();
                  }}
                  className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Return to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <div className="flex items-center gap-2">
                {onStartNewSessionAfterFeedback && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onStartNewSessionAfterFeedback();
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>New Session</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
                >
                  Back to Chat
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* FEEDBACK FORM VIEW                                             */
          /* ============================================================== */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shrink-0 overflow-hidden">
                  <AiRobotMascot variant="face" size={34} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                    Socratic Session Debrief
                  </span>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                    How helpful was this lesson?
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                aria-label="Close feedback modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Session Context Pill */}
            <div className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/70 flex items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                📚 {sessionTitle}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 shrink-0">
                {tutorMode} · { Math.max(1, messageCount) } msgs
              </span>
            </div>

            {/* 1. Interactive 5-Star Rating */}
            <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = star <= activeRatingValue;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(null)}
                      className={`p-1.5 rounded-xl transition-all transform active:scale-90 cursor-pointer ${
                        isFilled ? 'scale-105' : 'opacity-60 hover:opacity-100'
                      }`}
                      aria-label={`Rate ${star} out of 5 stars`}
                    >
                      <Star
                        className={`w-8 h-8 sm:w-9 sm:h-9 transition-colors ${
                          isFilled
                            ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 text-sm font-black text-slate-900 dark:text-white">
                  <span>{ratingMeta.emoji}</span>
                  <span>{ratingMeta.title}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {ratingMeta.subtitle}
                </p>
              </div>
            </div>

            {/* 2. Comprehension Check After Lesson */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                How well do you understand this topic now?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    id: 'struggling' as const,
                    emoji: '🧩',
                    label: 'Still Tricky',
                    sub: 'Need simpler steps'
                  },
                  {
                    id: 'partially-understood' as const,
                    emoji: '📈',
                    label: 'Getting There',
                    sub: 'Need practice'
                  },
                  {
                    id: 'mastered' as const,
                    emoji: '🎯',
                    label: 'Mastered It!',
                    sub: 'Crystal clear'
                  }
                ].map((item) => {
                  const active = comprehensionAfter === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setComprehensionAfter(item.id)}
                      className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                        active
                          ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-600 dark:border-blue-400 text-blue-950 dark:text-blue-100 ring-2 ring-blue-500/20 shadow-2xs'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-base block">{item.emoji}</span>
                      <span className="text-xs font-extrabold block mt-0.5 leading-tight">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5 leading-tight">
                        {item.sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Quick Pedagogical Feedback Tags */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                What stood out? (Select any)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {FEEDBACK_TAG_OPTIONS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-200/70'
                      }`}
                    >
                      {isSelected ? `✓ ${tag}` : tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Optional Written Note for Nora */}
            <div className="space-y-1">
              <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Additional Feedback for Nora (Optional)
              </label>
              <textarea
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="e.g., Loved the real-world analogy, or give me more exam-style multiple choice questions next time..."
                className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Submit & Skip Action Buttons */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving Feedback...' : 'Submit Lesson Rating (+15 XP)'}</span>
              </button>

              {triggeredByExit && onExitAfterFeedback && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onExitAfterFeedback();
                  }}
                  className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Skip &amp; Return to Dashboard
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
