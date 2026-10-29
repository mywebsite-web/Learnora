import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  ArrowLeft, 
  Check, 
  X, 
  Sparkles, 
  Award, 
  RotateCcw,
  Clock,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudySet, Quiz, QuizQuestion, QuizAttempt } from '../types';
import { DBService } from '../services/dbService';
import { ReviewQueueService } from '../services/reviewQueueService';
import { WeeklyRunService } from '../services/weeklyRunService';
import { LearningMemoryService } from '../services/learningMemoryService';

interface QuizSessionProps {
  userId: string;
  studySet: StudySet;
  onBack: () => void;
}

export const QuizSession: React.FC<QuizSessionProps> = ({ userId, studySet, onBack }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string | boolean>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuiz();
  }, [studySet.id]);

  const loadQuiz = async () => {
    setLoading(true);
    try {
      const fetched = await DBService.getQuizzes(studySet.id);
      setQuizzes(fetched);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const activeQuiz = quizzes[0];
  const questions = activeQuiz?.questions || [];
  const currentQ = questions[currentQuestionIndex];

  const handleSelectOption = (opt: string | boolean) => {
    if (showExplanation) return; // Prevent changing after submit
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQ.id]: opt
    });
  };

  const handleCheckAnswer = () => {
    setShowExplanation(true);
  };

  const handleNext = async () => {
    setShowExplanation(false);
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate score & finalize
      let correct = 0;
      const weakTopics: string[] = [];
      const strongTopics: string[] = [];

      questions.forEach((q) => {
        const userAns = selectedAnswers[q.id];
        if (String(userAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()) {
          correct++;
          if (q.topic) strongTopics.push(q.topic);
        } else {
          if (q.topic) weakTopics.push(q.topic);
        }
      });

      const score = Math.round((correct / questions.length) * 100);
      const attempt: QuizAttempt = {
        id: 'att_' + Date.now(),
        quizId: activeQuiz.id,
        studySetId: studySet.id,
        userId,
        answers: selectedAnswers,
        score,
        totalQuestions: questions.length,
        accuracy: score,
        weakTopics: Array.from(new Set(weakTopics)),
        strongTopics: Array.from(new Set(strongTopics)),
        recommendedRevision: weakTopics.length > 0 
          ? `Review: ${weakTopics.slice(0, 3).join(', ')} using Nora Tutor mode.` 
          : 'Outstanding mastery across all tested dimensions!',
        completedAt: Date.now()
      };

      await DBService.saveQuizAttempt(attempt);

      // Feed into Nora's Cognitive Self-Learning Memory
      try {
        const mem = await DBService.getCognitiveMemory(userId);
        const updatedGaps = Array.from(new Set([...mem.learnedKnowledgeGaps, ...weakTopics]));
        const updatedStrengths = Array.from(new Set([...mem.demonstratedStrengths, ...strongTopics]));
        
        const updatedMemory = {
          ...mem,
          learnedKnowledgeGaps: updatedGaps,
          demonstratedStrengths: updatedStrengths,
          noraPedagogicalStrategy: {
            ...mem.noraPedagogicalStrategy,
            recentSelfAdjustment: weakTopics.length > 0 
              ? `Calibrated diagnostic focus to prioritize review for: ${weakTopics.slice(0, 2).join(', ')}.`
              : 'Affirmed student high mastery; increased analytical challenge for upcoming lessons.',
            adaptationLevel: Math.min(100, mem.noraPedagogicalStrategy.adaptationLevel + 1),
            totalInteractionsReflected: (mem.noraPedagogicalStrategy.totalInteractionsReflected || 0) + 1
          },
          lastSelfReflectionAt: Date.now(),
          updatedAt: Date.now()
        };
        await DBService.saveCognitiveMemory(updatedMemory);

        // Record teaching evolution log
        await DBService.recordTeachingEvolutionLog({
          id: 'log_quiz_' + Date.now(),
          userId,
          interactionSummary: `Diagnostic Quiz Completed (${score}%) on ${studySet.title}`,
          studentGraspObserved: score >= 80 ? 'mastered' : score >= 50 ? 'partially-understood' : 'struggling',
          identifiedGap: weakTopics.length > 0 ? weakTopics.join(', ') : undefined,
          tutorAdjustmentMade: updatedMemory.noraPedagogicalStrategy.recentSelfAdjustment,
          timestamp: Date.now()
        });
      } catch (err) {
        console.error('Failed to update cognitive memory from quiz:', err);
      }

      // Enqueue quiz into Spaced Repetition Review Queue for 1, 3, 7 day reminders
      try {
        await ReviewQueueService.enqueueCompletedLesson(userId, {
          studySetId: studySet.id,
          title: `${studySet.title} - Quiz Practice`,
          subject: studySet.subject,
          lessonType: 'quiz',
          keyConcepts: weakTopics.length > 0 ? weakTopics : strongTopics,
          summarySnippet: `Diagnostic quiz completed with score of ${score}% across ${questions.length} questions.`,
          promptQuestion: questions[0]?.question,
          promptAnswer: questions[0]?.explanation
        });
      } catch (err) {
        console.warn('Notice enqueuing quiz to review queue:', err);
      }

      // Record Diagnostic Accuracy, XP & Study Run Time into Weekly Run for Today
      try {
        await WeeklyRunService.recordQuizCompletion(userId, score, studySet.subject);
      } catch (err) {
        console.warn('Notice recording quiz completion to weekly run:', err);
      }

      // Record diagnostic quiz results and identified weak areas in Student Learning Memory
      try {
        await LearningMemoryService.recordQuizOrTestCompletion(userId, {
          quizId: activeQuiz.id,
          subject: studySet.subject,
          topic: studySet.title,
          score,
          totalQuestions: questions.length,
          weakTopics: Array.from(new Set(weakTopics)),
          strongTopics: Array.from(new Set(strongTopics)),
          source: 'quiz'
        });
      } catch (memErr) {
        console.warn('Notice recording quiz completion to learning memory:', memErr);
      }

      setIsCompleted(true);
      confetti({ particleCount: 80, spread: 70 });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!activeQuiz || questions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-center">
        <HelpCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">No Quiz Available</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          A quiz has not been generated for this study set yet.
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

  // Calculate current score
  let correctCount = 0;
  questions.forEach(q => {
    if (selectedAnswers[q.id] && String(selectedAnswers[q.id]).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()) {
      correctCount++;
    }
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 font-serif">Diagnostic Quiz</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{studySet.title}</p>
          </div>
        </div>

        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/60 px-3 py-1 rounded-full">
          Question {isCompleted ? questions.length : currentQuestionIndex + 1} of {questions.length}
        </span>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-2xl mx-auto w-full">
        {!isCompleted && currentQ ? (
          <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="uppercase font-semibold text-indigo-600 dark:text-indigo-400 tracking-wider">
                {currentQ.type.replace('_', ' ')}
              </span>
              {currentQ.topic && <span>Topic: {currentQ.topic}</span>}
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 font-serif mb-6 leading-snug">
              {currentQ.question}
            </h3>

            {/* Options */}
            <div className="space-y-3">
              {currentQ.options?.map((opt, idx) => {
                const isSelected = selectedAnswers[currentQ.id] === opt;
                const isCorrect = String(opt).trim().toLowerCase() === String(currentQ.correctAnswer).trim().toLowerCase();

                let style = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500 text-slate-700 dark:text-slate-200';
                if (showExplanation) {
                  if (isCorrect) {
                    style = 'border-emerald-500 dark:border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200 font-bold';
                  } else if (isSelected && !isCorrect) {
                    style = 'border-rose-400 dark:border-rose-600 bg-rose-50 dark:bg-rose-950/60 text-rose-950 dark:text-rose-200';
                  }
                } else if (isSelected) {
                  style = 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/70 text-indigo-950 dark:text-indigo-100 ring-2 ring-indigo-500/20 font-semibold';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={showExplanation}
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full p-4 text-left rounded-xl border text-sm transition-all flex items-center justify-between ${style}`}
                  >
                    <span>{opt}</span>
                    {showExplanation && isCorrect && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                    {showExplanation && isSelected && !isCorrect && <X className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Explanation box after check */}
            {showExplanation && (
              <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-1.5 animate-fade-in">
                <span className="font-bold text-slate-900 dark:text-slate-100 block">Explanation:</span>
                <p className="leading-relaxed">{currentQ.explanation}</p>
                {currentQ.citation && (
                  <span className="text-[11px] text-slate-400 dark:text-slate-400 block pt-1 italic">
                    Grounding: {currentQ.citation.sourceName}
                  </span>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              {!showExplanation ? (
                <button
                  type="button"
                  disabled={!selectedAnswers[currentQ.id]}
                  onClick={handleCheckAnswer}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold text-xs shadow-md transition-all active:scale-95"
                >
                  Check Answer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-all active:scale-95"
                >
                  {currentQuestionIndex + 1 < questions.length ? 'Next Question' : 'View Results'}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Completion Screen */
          <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xl text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-serif">Quiz Completed!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Here is your performance breakdown</p>

            <div className="my-6 p-6 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 max-w-sm mx-auto">
              <span className="text-5xl font-bold text-indigo-700 dark:text-indigo-300 font-serif">
                {Math.round((correctCount / questions.length) * 100)}%
              </span>
              <p className="text-xs font-semibold text-indigo-950 dark:text-indigo-200 mt-2">
                {correctCount} out of {questions.length} Correct
              </p>
            </div>

            {/* Certificate Progress Teaser (Coming Soon) */}
            <div className="my-5 p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 max-w-sm mx-auto text-left flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Award className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-amber-950 dark:text-amber-200">
                    Course Certificate
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                    Coming Soon
                  </span>
                </div>
                <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                  {Math.round((correctCount / questions.length) * 100) >= 85
                    ? "Great job! This score qualifies for your upcoming accredited Certificate of Mastery."
                    : "Score 85% or higher to qualify for your upcoming accredited Certificate of Mastery."}
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setCurrentQuestionIndex(0);
                  setSelectedAnswers({});
                  setShowExplanation(false);
                  setIsCompleted(false);
                }}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Quiz</span>
              </button>
              <button
                onClick={onBack}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors active:scale-95"
              >
                Return to Workspace
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
