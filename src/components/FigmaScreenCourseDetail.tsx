import React, { useState } from 'react';
import { 
  ChevronLeft, 
  Bell, 
  Play, 
  Star, 
  Info, 
  CheckCircle2, 
  Clock, 
  Award, 
  Share2,
  BookOpen
} from 'lucide-react';
import { AiRobotMascot } from './AiRobotMascot';
import { AiCourse, LessonItem, AI_COURSES } from '../data/aiCourses';
import { LessonPlayerModal } from './LessonPlayerModal';

interface FigmaScreenCourseDetailProps {
  course?: AiCourse;
  onBack: () => void;
  onOpenTutor: () => void;
}

export const FigmaScreenCourseDetail: React.FC<FigmaScreenCourseDetailProps> = ({
  course = AI_COURSES[0],
  onBack,
  onOpenTutor
}) => {
  const [activeLesson, setActiveLesson] = useState<LessonItem | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>(['pe-01', 'pe-02']);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const handleLessonComplete = (lessonId: string) => {
    if (!completedLessons.includes(lessonId)) {
      setCompletedLessons([...completedLessons, lessonId]);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F8FAFC] text-slate-900 select-none overflow-hidden relative font-sans">
      {/* iOS Status Bar (9:41, Cellular, Wifi, Battery) */}
      <div className="pt-3 px-7 pb-2 flex items-center justify-between text-xs font-semibold text-slate-900 shrink-0">
        <span className="font-bold tracking-tight text-xs">9:41</span>
        <div className="flex items-center gap-2">
          <div className="flex items-end gap-0.5 h-2.5">
            <span className="w-0.5 h-1 bg-slate-900 rounded-xs" />
            <span className="w-0.5 h-1.5 bg-slate-900 rounded-xs" />
            <span className="w-0.5 h-2 bg-slate-900 rounded-xs" />
            <span className="w-0.5 h-2.5 bg-slate-900 rounded-xs" />
          </div>
          <svg className="w-3.5 h-3.5 text-slate-900" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98C20.93 5.9 16.69 4 12 4zm0 3.5c3.55 0 6.77 1.39 9.17 3.66L12 19.34 2.83 11.16C5.23 8.89 8.45 7.5 12 7.5z" />
          </svg>
          <div className="w-5 h-2.5 rounded-xs border border-slate-900 p-0.5 flex items-center">
            <div className="w-full h-full bg-slate-900 rounded-2xs" />
          </div>
        </div>
      </div>

      {/* Top Header: "<" Back Circle + "Course Detail" Title + Bell Circle */}
      <div className="px-5 py-2 flex items-center justify-between shrink-0">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white border border-slate-200/90 text-slate-700 flex items-center justify-center hover:bg-slate-100 transition-colors shadow-2xs"
          title="Back to Home"
        >
          <ChevronLeft className="w-5 h-5 ml--0.5" />
        </button>

        <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
          Course Detail
        </h2>

        <button
          onClick={() => setShowInfoModal(!showInfoModal)}
          className="w-10 h-10 rounded-full bg-white border border-slate-200/90 text-slate-700 flex items-center justify-center hover:bg-slate-100 transition-colors shadow-2xs"
          title="Course Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-16 space-y-4 scrollbar-none">
        {/* HERO VISUAL CARD: Soft Sky Blue Backdrop + 3D Robot Mascot */}
        <div className="relative w-full h-44 sm:h-48 rounded-3xl bg-gradient-to-b from-sky-100 via-blue-50 to-white border border-blue-100/70 overflow-hidden flex items-center justify-center shadow-xs">
          {/* Subtle radial ambient blue light */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-blue-300/30 blur-2xl pointer-events-none" />

          {/* 3D Cute Blue & White AI Robot Mascot */}
          <div className="relative z-10 animate-bounce duration-1000">
            <AiRobotMascot variant="waving" size={175} />
          </div>
        </div>

        {/* COURSE TITLE & INFO CARD */}
        <div className="p-4 bg-white border border-slate-100 rounded-3xl shadow-2xs space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug">
                {course.title}
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {course.subtitle}
              </p>
            </div>

            {/* Circular Blue Action Button (!) */}
            <button
              onClick={() => setShowInfoModal(true)}
              className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center shadow-md shadow-blue-500/25 transition-all shrink-0"
              title="Course Syllabus Details"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>

          {/* Enrolled Avatars Stack + Rating */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            {/* Avatars Stack */}
            <div className="flex items-center">
              <div className="flex -space-x-2">
                <img 
                  className="w-7 h-7 rounded-full border-2 border-white object-cover shadow-xs" 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" 
                  alt="Student 1" 
                />
                <img 
                  className="w-7 h-7 rounded-full border-2 border-white object-cover shadow-xs" 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80" 
                  alt="Student 2" 
                />
                <img 
                  className="w-7 h-7 rounded-full border-2 border-white object-cover shadow-xs" 
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80" 
                  alt="Student 3" 
                />
              </div>
              <span className="ml-2.5 text-xs font-extrabold text-blue-600">
                +{course.studentCount > 1000 ? `${(course.studentCount/1000).toFixed(0)}k` : '10'}
              </span>
            </div>

            {/* Rating Stars */}
            <div className="flex items-center gap-1">
              <span className="text-xs font-black text-slate-900">{course.rating}</span>
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            </div>
          </div>
        </div>

        {/* CURRICULUM SECTION */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
              Curriculum :
            </h3>
            <span className="text-xs font-semibold text-slate-400">
              {course.curriculum.length} Lessons
            </span>
          </div>

          <div className="space-y-2.5">
            {course.curriculum.map((lesson) => {
              const isDone = completedLessons.includes(lesson.id);
              return (
                <div
                  key={lesson.id}
                  onClick={() => setActiveLesson(lesson)}
                  className="p-3.5 bg-white border border-slate-100 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between gap-3 shadow-2xs cursor-pointer group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Order Number: 01, 02, 03 */}
                    <span className="font-black text-sm text-slate-900 group-hover:text-blue-600 transition-colors w-6">
                      {lesson.orderNumber}
                    </span>

                    {/* Lesson Title & Duration */}
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors truncate leading-snug">
                        {lesson.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                        <span>({lesson.duration})</span>
                        <span className="text-blue-600 font-semibold">Play</span>
                      </p>
                    </div>
                  </div>

                  {/* Circular Blue Play Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveLesson(lesson);
                    }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 shadow-2xs ${
                      isDone 
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                    }`}
                    title="Play Lesson"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-blue-700" />
                    ) : (
                      <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ask Nora AI Socratic Tutor Quick Bar */}
        <div 
          onClick={onOpenTutor}
          className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between gap-3 shadow-md shadow-blue-500/20 cursor-pointer hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
              <AiRobotMascot variant="mini" size={28} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Have questions about this lesson?</h4>
              <p className="text-[11px] text-blue-100">Ask Nora, your personal AI tutor</p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 bg-white text-blue-700 rounded-xl shrink-0">
            Chat Now
          </span>
        </div>
      </div>

      {/* iPhone Home Indicator */}
      <div className="w-32 h-1 bg-slate-300 rounded-full mx-auto my-2 shrink-0" />

      {/* Interactive Lesson Audio/Video Player Modal */}
      {activeLesson && (
        <LessonPlayerModal
          lesson={activeLesson}
          course={course}
          onClose={() => setActiveLesson(null)}
          onComplete={handleLessonComplete}
        />
      )}
    </div>
  );
};
