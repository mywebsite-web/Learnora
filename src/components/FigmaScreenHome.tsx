import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  LayoutGrid, 
  Sparkles, 
  Brain, 
  Languages, 
  Eye, 
  Cpu, 
  Clock, 
  Flame, 
  Award, 
  ArrowRight,
  BookOpen,
  MessageSquare,
  User,
  Home,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { AiRobotMascot } from './AiRobotMascot';
import { AI_COURSES, AiCourse } from '../data/aiCourses';

interface FigmaScreenHomeProps {
  userName?: string;
  userAvatarUrl?: string;
  onSelectCourse: (course: AiCourse) => void;
  onOpenTutor: () => void;
  onOpenNotes: () => void;
  onOpenProfile: () => void;
  onOpenBootcampPromo: () => void;
  onOpenNotifications?: () => void;
  unreadNotifCount?: number;
  activeNavTab?: 'home' | 'notes' | 'tutor' | 'profile';
  onNavTabChange?: (tab: 'home' | 'notes' | 'tutor' | 'profile') => void;
}

export const FigmaScreenHome: React.FC<FigmaScreenHomeProps> = ({
  userName = 'Alex',
  userAvatarUrl,
  onSelectCourse,
  onOpenTutor,
  onOpenNotes,
  onOpenProfile,
  onOpenBootcampPromo,
  onOpenNotifications,
  unreadNotifCount = 0,
  activeNavTab = 'home',
  onNavTabChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);

  const filteredCourses = AI_COURSES.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col bg-[#F8FAFC] text-slate-900 select-none overflow-hidden relative font-sans">
      {/* iOS Status Bar (9:41, Cellular, Wifi, Battery) */}
      <div className="pt-3 px-7 pb-2 flex items-center justify-between text-xs font-semibold text-slate-900 shrink-0">
        <span className="font-bold tracking-tight text-xs">9:41</span>
        <div className="flex items-center gap-2">
          {/* Cellular bars */}
          <div className="flex items-end gap-0.5 h-2.5">
            <span className="w-0.5 h-1 bg-slate-900 rounded-xs" />
            <span className="w-0.5 h-1.5 bg-slate-900 rounded-xs" />
            <span className="w-0.5 h-2 bg-slate-900 rounded-xs" />
            <span className="w-0.5 h-2.5 bg-slate-900 rounded-xs" />
          </div>
          {/* Wifi */}
          <svg className="w-3.5 h-3.5 text-slate-900" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98C20.93 5.9 16.69 4 12 4zm0 3.5c3.55 0 6.77 1.39 9.17 3.66L12 19.34 2.83 11.16C5.23 8.89 8.45 7.5 12 7.5z" />
          </svg>
          {/* Battery */}
          <div className="w-5 h-2.5 rounded-xs border border-slate-900 p-0.5 flex items-center">
            <div className="w-full h-full bg-slate-900 rounded-2xs" />
          </div>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-24 space-y-4 scrollbar-none">
        {/* Top Header: "Hello, Alex!" + Bell + Profile Avatar */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Hello, {userName}!
            </h1>
          </div>
          <div className="flex items-center gap-2.5">
            {/* Bell button with notification badge */}
            <button 
              onClick={onOpenNotifications || onOpenBootcampPromo}
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors relative active:scale-95 cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white animate-pulse">
                  {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                </span>
              ) : (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
              )}
            </button>
            {/* User Profile Avatar with green online dot */}
            <button 
              onClick={onOpenProfile}
              className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-blue-500/30 hover:ring-blue-500 transition-all shrink-0 cursor-pointer active:scale-95"
              title="Profile & Settings"
            >
              {userAvatarUrl ? (
                <img 
                  src={userAvatarUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
            </button>
          </div>
        </div>

        {/* Search Bar: "What are you looking for..." + Grid Filter Button */}
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="What are you looking for..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200/90 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs transition-all"
            />
          </div>
          <button 
            onClick={() => onSelectCourse(AI_COURSES[0])}
            className="w-11 h-11 bg-white border border-slate-200/90 rounded-2xl flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors shadow-2xs shrink-0"
            title="Filter Courses"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>

        {/* HERO PROMOTIONAL BANNER: "AI Bootcamp 2026 / Get $50 off" */}
        <div 
          onClick={onOpenBootcampPromo}
          className="relative w-full rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-5 text-white overflow-hidden shadow-lg shadow-blue-600/25 cursor-pointer group transition-transform active:scale-[0.99]"
        >
          {/* Subtle curved background aesthetic placed away from mascot to prevent blur haze */}
          <div className="absolute -top-16 -left-10 w-52 h-52 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute -bottom-10 right-28 w-36 h-36 rounded-full bg-blue-400/20 pointer-events-none" />

          <div className="relative z-10 max-w-[62%] space-y-1.5">
            <span className="inline-block text-[11px] font-semibold text-blue-100 tracking-wide">
              AI Bootcamp 2026
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
              Get $50 <span className="text-blue-200 font-medium text-sm sm:text-base">off</span>
            </h2>
            <p className="text-[11px] text-blue-100/90 font-medium">
              all enrollments this week
            </p>
            <div className="pt-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenBootcampPromo();
                }}
                className="px-4 py-2 bg-white hover:bg-blue-50 text-blue-700 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1 active:scale-95"
              >
                <span>Get Now</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* 3D Cute AI Robot Mascot inside Card (Right side) */}
          <div className="absolute right-1 -bottom-1 pointer-events-none transition-transform duration-500 group-hover:scale-105">
            <AiRobotMascot variant="winking" size={135} />
          </div>
        </div>

        {/* Dots Pagination Indicator */}
        <div className="flex items-center justify-center gap-1.5 pt-0.5">
          <button 
            onClick={() => setActiveSlide(0)}
            className={`h-1.5 rounded-full transition-all ${activeSlide === 0 ? 'w-5 bg-blue-600' : 'w-1.5 bg-slate-300'}`} 
          />
          <button 
            onClick={() => setActiveSlide(1)}
            className={`h-1.5 rounded-full transition-all ${activeSlide === 1 ? 'w-5 bg-blue-600' : 'w-1.5 bg-slate-300'}`} 
          />
          <button 
            onClick={() => setActiveSlide(2)}
            className={`h-1.5 rounded-full transition-all ${activeSlide === 2 ? 'w-5 bg-blue-600' : 'w-1.5 bg-slate-300'}`} 
          />
        </div>

        {/* SECTION 1: WEEKLY RUN SUMMARY (Course Progress Cards) */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
              Weekly Run Summary
            </h3>
            <button 
              onClick={() => onSelectCourse(AI_COURSES[0])}
              className="text-xs font-semibold text-slate-400 hover:text-blue-600 transition-colors"
            >
              See All
            </button>
          </div>

          <div className="space-y-2.5">
            {filteredCourses.map((course) => (
              <div 
                key={course.id}
                onClick={() => onSelectCourse(course)}
                className="p-3.5 bg-white border border-slate-100 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between gap-3 shadow-2xs cursor-pointer group active:scale-[0.99]"
              >
                {/* Course Icon & Details */}
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${course.bgTint} group-hover:scale-105 transition-transform`}>
                    {course.iconType === 'prompt' && <Sparkles className="w-5 h-5" />}
                    {course.iconType === 'brain' && <Brain className="w-5 h-5" />}
                    {course.iconType === 'language' && <Languages className="w-5 h-5" />}
                    {course.iconType === 'vision' && <Eye className="w-5 h-5" />}
                    {course.iconType === 'code' && <Cpu className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                      {course.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {course.subtitle}
                    </p>
                  </div>
                </div>

                {/* Progress % & Lessons Completed */}
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-blue-600">
                    {course.completionPercent}% Completed
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                    Lesson {course.currentLesson} of {course.totalLessons}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: WEEKLY RUN SUMMARY (Learning Activity Stats) */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
              Weekly Run Summary
            </h3>
            <button 
              onClick={onOpenProfile}
              className="text-xs font-semibold text-slate-400 hover:text-blue-600 transition-colors"
            >
              See All
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Study Time Card */}
            <div className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">Study Time</span>
                <span className="text-xs font-bold text-slate-900">14.5 Hours</span>
              </div>
            </div>

            {/* Total XP Card */}
            <div className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">Total XP</span>
                <span className="text-xs font-bold text-slate-900">2,450 XP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROYAL COBALT BLUE BOTTOM FLOATING NAVIGATION DOCK */}
      <div className="absolute bottom-3 left-4 right-4 z-30">
        <div className="bg-[#2563EB] rounded-3xl py-2.5 px-6 shadow-xl shadow-blue-600/35 flex items-center justify-between text-white border border-blue-400/30 backdrop-blur-md">
          {/* Home Tab */}
          <button 
            onClick={() => onNavTabChange?.('home')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
              activeNavTab === 'home' ? 'text-white scale-110' : 'text-blue-200/80 hover:text-white'
            }`}
            title="Home"
          >
            <Home className="w-5 h-5" />
            {activeNavTab === 'home' && (
              <span className="w-1 h-1 rounded-full bg-white mt-0.5" />
            )}
          </button>

          {/* Notes & Library Tab */}
          <button 
            onClick={() => {
              onNavTabChange?.('notes');
              onOpenNotes();
            }}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
              activeNavTab === 'notes' ? 'text-white scale-110' : 'text-blue-200/80 hover:text-white'
            }`}
            title="Study Sets & Notes"
          >
            <BookOpen className="w-5 h-5" />
            {activeNavTab === 'notes' && (
              <span className="w-1 h-1 rounded-full bg-white mt-0.5" />
            )}
          </button>

          {/* Nora AI Socratic Tutor Chat Tab */}
          <button 
            onClick={() => {
              onNavTabChange?.('tutor');
              onOpenTutor();
            }}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
              activeNavTab === 'tutor' ? 'text-white scale-110' : 'text-blue-200/80 hover:text-white'
            }`}
            title="AI Socratic Tutor"
          >
            <MessageSquare className="w-5 h-5" />
            {activeNavTab === 'tutor' && (
              <span className="w-1 h-1 rounded-full bg-white mt-0.5" />
            )}
          </button>

          {/* Profile & Settings Tab */}
          <button 
            onClick={() => {
              onNavTabChange?.('profile');
              onOpenProfile();
            }}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
              activeNavTab === 'profile' ? 'text-white scale-110' : 'text-blue-200/80 hover:text-white'
            }`}
            title="Student Profile"
          >
            <User className="w-5 h-5" />
            {activeNavTab === 'profile' && (
              <span className="w-1 h-1 rounded-full bg-white mt-0.5" />
            )}
          </button>
        </div>

        {/* Bottom iPhone Home Indicator Bar */}
        <div className="w-32 h-1 bg-white/70 rounded-full mx-auto mt-2" />
      </div>
    </div>
  );
};
