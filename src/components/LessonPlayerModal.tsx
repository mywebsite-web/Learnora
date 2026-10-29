import React, { useState, useEffect } from 'react';
import { LessonItem, AiCourse } from '../data/aiCourses';
import { 
  Play, 
  Pause, 
  X, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Sparkles, 
  ArrowRight,
  BrainCircuit,
  Award
} from 'lucide-react';
import { AiRobotMascot } from './AiRobotMascot';

import { auth } from '../lib/firebase';
import { LearningMemoryService } from '../services/learningMemoryService';

interface LessonPlayerModalProps {
  lesson: LessonItem;
  course: AiCourse;
  onClose: () => void;
  onComplete: (lessonId: string) => void;
}

export const LessonPlayerModal: React.FC<LessonPlayerModalProps> = ({
  lesson,
  course,
  onClose,
  onComplete
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [completed, setCompleted] = useState(lesson.completed || false);
  const [synth, setSynth] = useState<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Record student lesson access in persistent learning memory
    const uid = auth.currentUser?.uid;
    if (uid) {
      LearningMemoryService.recordLessonAccess(uid, {
        lessonId: lesson.id,
        title: lesson.title,
        courseId: course.id,
        courseTitle: course.title,
        subject: course.category || course.title,
        topic: lesson.title,
        sectionIndex: 1,
        totalSections: 3,
        isCompleted: Boolean(lesson.completed)
      }).catch(console.warn);
    }
  }, [lesson.id, course.id]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSynth(window.speechSynthesis);
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCompleteLesson = (id: string) => {
    setCompleted(true);
    onComplete(id);

    const uid = auth.currentUser?.uid;
    if (uid) {
      LearningMemoryService.recordLessonCompleted(uid, {
        lessonId: id,
        title: lesson.title,
        courseId: course.id,
        courseTitle: course.title,
        subject: course.category || course.title,
        topic: lesson.title
      }).catch(console.warn);
    }
  };

  // Timer simulation for lesson progress
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            handleCompleteLesson(lesson.id);
            return 100;
          }
          return prev + 2;
        });
      }, 600);
    }
    return () => clearInterval(interval);
  }, [isPlaying, lesson.id]);

  const toggleSpeech = () => {
    if (!synth) {
      setIsPlaying(!isPlaying);
      return;
    }

    if (isPlaying) {
      synth.cancel();
      setIsPlaying(false);
    } else {
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(lesson.audioScript);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.onend = () => {
        setIsPlaying(false);
        setProgress(100);
        handleCompleteLesson(lesson.id);
      };
      synth.speak(utterance);
      setIsPlaying(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-blue-100 w-full max-w-lg overflow-hidden relative animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 text-white relative overflow-hidden">
          {/* Subtle geometric circles matching Figma design */}
          <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute bottom-0 right-10 w-24 h-24 rounded-full bg-blue-400/20 pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white tracking-wide">
              Lesson {lesson.orderNumber}
            </span>
            <span className="text-xs text-blue-100 font-medium">{course.title}</span>
          </div>

          <h3 className="text-xl font-bold font-sans text-white leading-tight">
            {lesson.title}
          </h3>
          <p className="text-xs text-blue-100/90 mt-1 flex items-center gap-1.5">
            <span>Duration: {lesson.duration}</span>
            <span>·</span>
            <span className="capitalize">{lesson.type} interactive lecture</span>
          </p>

          {/* Floating Robot Mascot in player */}
          <div className="absolute right-4 bottom-2 opacity-90 hidden sm:block pointer-events-none">
            <AiRobotMascot variant="winking" size={85} />
          </div>
        </div>

        {/* Player Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Audio Player Control Bar */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleSpeech}
                  className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center shadow-md shadow-blue-500/20 transition-all"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {isPlaying ? 'Playing Audio Lecture with Nora AI...' : 'Listen to Lesson Audio'}
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Voice synthesized by Learnora AI Studio
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (synth) synth.cancel();
                  setIsPlaying(false);
                  setProgress(0);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                title="Restart audio"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>0:00</span>
                <span>{progress}% finished</span>
                <span>{lesson.duration}</span>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Core Takeaways</span>
            </h4>
            <div className="space-y-2">
              {lesson.keyPoints.map((point, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/50 border border-blue-100/60 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Concept Check Question */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <h4 className="text-xs font-bold text-slate-900 mb-1">Concept Check</h4>
            <p className="text-xs text-slate-600 mb-3">
              How does providing structured delimiters (like XML tags or backticks) improve prompt execution?
            </p>
            <div className="space-y-2">
              {[
                'It clearly separates instructions from input content, preventing prompt injection.',
                'It speeds up GPU network latency by 50%.',
                'It bypasses all tokenization limits in the model.'
              ].map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setQuizAnswer(i)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all border ${
                    quizAnswer === i 
                      ? i === 0 
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold' 
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-white border-slate-200 hover:border-blue-300 text-slate-700'
                  }`}
                >
                  <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
                  <span>{opt}</span>
                </button>
              ))}
            </div>
            {quizAnswer === 0 && (
              <p className="text-[11px] font-semibold text-emerald-700 mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Correct! Delimiters isolate semantic instruction tokens.</span>
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>

          <button
            onClick={() => {
              handleCompleteLesson(lesson.id);
              onClose();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-[0.99]"
          >
            <Award className="w-4 h-4" />
            <span>{completed ? 'Lesson Completed ✓' : 'Complete Lesson (+50 XP)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
