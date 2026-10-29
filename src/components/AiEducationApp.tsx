import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  Star,
  Play,
  Info,
  ShieldCheck,
  Upload,
  X,
  Volume2,
  Layers,
  GraduationCap
} from 'lucide-react';
import { AiRobotMascot } from './AiRobotMascot';
import { AI_COURSES, AiCourse, LessonItem } from '../data/aiCourses';
import { useAuth } from '../context/AuthContext';
import { LessonPlayerModal } from './LessonPlayerModal';
import { NoraTutorView } from './NoraTutorView';
import { AdminPanel } from './AdminPanel';
import { MaterialUploadModal } from './MaterialUploadModal';
import { DBService } from '../services/dbService';
import { StudySet, isAdminEmail } from '../types';

type ActivePlatformTab = 'home' | 'course-detail' | 'tutor' | 'library' | 'admin';

export const AiEducationApp: React.FC = () => {
  const { user, profile, signInWithGoogle, signInAsDemo, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ActivePlatformTab>('home');
  const [selectedCourse, setSelectedCourse] = useState<AiCourse>(AI_COURSES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<LessonItem | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>(['pe-01', 'pe-02']);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [studySets, setStudySets] = useState<StudySet[]>([]);
  const [selectedSet, setSelectedSet] = useState<StudySet | null>(null);

  // Load existing user study sets
  useEffect(() => {
    if (user?.uid) {
      DBService.getStudySets(user.uid).then(sets => {
        setStudySets(sets);
        if (sets.length > 0 && !selectedSet) {
          setSelectedSet(sets[0]);
        }
      });
    }
  }, [user?.uid]);

  const userName = profile?.tutorNickname || profile?.displayName?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'Alex';

  const filteredCourses = AI_COURSES.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLessonComplete = (lessonId: string) => {
    if (!completedLessons.includes(lessonId)) {
      setCompletedLessons([...completedLessons, lessonId]);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans select-none">
      {/* ============================================================== */}
      {/* 1. TOP GLOBAL APPLICATION HEADER (CLEAN FIGMA DESIGN)          */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Brand Logo & Title */}
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-md shadow-emerald-950/20 group-hover:scale-105 transition-transform border border-emerald-800/30">
              <img src="/pwa-192x192.png" alt="Learnora Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-slate-900 tracking-tight">Learnora</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700 uppercase tracking-wider">
                  AI Platform
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Master AI Skills for Your Future
              </p>
            </div>
          </div>

          {/* Centered Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What are you looking for..."
                className="w-full pl-11 pr-11 py-2.5 bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
              />
              <button 
                onClick={() => {
                  setSelectedCourse(AI_COURSES[0]);
                  setActiveTab('course-detail');
                }}
                className="absolute right-2.5 top-2.5 w-6 h-6 rounded-lg text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-colors"
                title="Filter Courses"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Navigation Links & User Profile Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Promo Code Pill Banner */}
            <button
              onClick={() => setShowPromoModal(true)}
              className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 transition-colors text-xs font-bold"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>AI Bootcamp: $50 off</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setShowPromoModal(true)}
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
            </button>

            {/* User Greeting & Avatar */}
            <div className="flex items-center gap-2.5 pl-1 sm:pl-2">
              <div className="text-right hidden sm:block">
                <span className="text-xs font-black text-slate-900 block leading-tight">
                  Hello, {userName}!
                </span>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center justify-end gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Learner
                </span>
              </div>

              <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-blue-500/30 shrink-0">
                {profile?.avatarUrl ? (
                  <img 
                    src={profile.avatarUrl} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Admin or Sign In / Out */}
            {isAdminEmail(user?.email) && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                  activeTab === 'admin' 
                    ? 'bg-slate-900 text-blue-300' 
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                Admin
              </button>
            )}

            {user ? (
              <button
                onClick={logout}
                className="hidden sm:inline-block px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => signInAsDemo()}
                className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                Demo Log In
              </button>
            )}
          </div>
        </div>

        {/* Desktop Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between border-t border-slate-100">
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 scrollbar-none">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'home'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('course-detail')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'course-detail'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Course Curriculum</span>
            </button>

            <button
              onClick={() => setActiveTab('tutor')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'tutor'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
              <span>Nora Socratic AI Tutor</span>
            </button>

            <button
              onClick={() => setShowUploadModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center gap-1.5 shrink-0"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Upload Study Materials</span>
            </button>
          </nav>

          <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5 text-blue-600">
              <Clock className="w-3.5 h-3.5" />
              <span>14.5 hrs this week</span>
            </span>
            <span className="flex items-center gap-1.5 text-amber-600">
              <Flame className="w-3.5 h-3.5" />
              <span>5 day streak</span>
            </span>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. MAIN PLATFORM CONTENT AREA                                  */}
      {/* ============================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        
        {/* ------------------------------------------------------------ */}
        {/* TAB 1: MAIN DASHBOARD VIEW                                   */}
        {/* ------------------------------------------------------------ */}
        {activeTab === 'home' && (
          <div className="space-y-8 animate-fade-in">
            {/* HERO PROMOTIONAL BANNER: Royal Cobalt Blue + 3D Robot Mascot */}
            <div className="relative w-full rounded-3xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 sm:p-10 text-white overflow-hidden shadow-xl shadow-blue-600/20">
              {/* Subtle curved background aesthetic matching Figma kit */}
              <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-16 left-1/3 w-64 h-64 rounded-full bg-blue-400/20 blur-xl pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                {/* Left Text & CTA */}
                <div className="space-y-3.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-white/20 text-white tracking-wide uppercase">
                      AI Bootcamp 2026
                    </span>
                    <span className="text-xs text-blue-200 font-bold">
                      Limited Time Special
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-[1.15] tracking-tight">
                    Master AI <span className="text-blue-200">Skills</span> for<br className="hidden sm:inline" />
                    Your Future
                  </h1>

                  <p className="text-xs sm:text-sm text-blue-100/90 font-medium leading-relaxed max-w-xl">
                    Get <strong className="text-white font-bold">$50 off</strong> all enrollments this week. Access hundreds of AI courses taught by top industry experts with Nora, your personal 1-on-1 Socratic AI tutor.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setShowPromoModal(true)}
                      className="px-6 py-3 bg-white hover:bg-blue-50 active:scale-95 text-blue-700 text-xs sm:text-sm font-black rounded-2xl shadow-md transition-all flex items-center gap-2"
                    >
                      <span>Get Now ($50 Off)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setActiveTab('tutor')}
                      className="px-5 py-3 bg-blue-500/30 hover:bg-blue-500/40 text-white text-xs sm:text-sm font-bold rounded-2xl border border-white/20 backdrop-blur-md transition-all flex items-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Ask Nora AI Tutor</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('course-detail')}
                      className="px-5 py-3 bg-transparent hover:bg-white/10 text-white text-xs sm:text-sm font-bold rounded-2xl transition-all"
                    >
                      View Curriculum →
                    </button>
                  </div>
                </div>

                {/* Right 3D AI Robot Mascot */}
                <div className="relative shrink-0 flex items-center justify-center">
                  <div className="animate-bounce duration-1000">
                    <AiRobotMascot variant="waving" size={240} showBubble={true} />
                  </div>
                </div>
              </div>
            </div>

            {/* TWO-COLUMN GRID: ACTIVE COURSES & ACTIVITY STATS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* LEFT 2 COLUMNS: WEEKLY RUN SUMMARY (COURSES) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                      Weekly Run Summary
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">
                      Your ongoing AI courses &amp; active curriculum
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('course-detail')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                  >
                    <span>See All ({filteredCourses.length})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Course Cards List */}
                <div className="space-y-3">
                  {filteredCourses.map((course) => (
                    <div
                      key={course.id}
                      onClick={() => {
                        setSelectedCourse(course);
                        setActiveTab('course-detail');
                      }}
                      className="p-5 bg-white border border-slate-200/80 rounded-3xl hover:border-blue-400 hover:shadow-lg transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group shadow-2xs active:scale-[0.99]"
                    >
                      {/* Course Icon & Titles */}
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${course.bgTint} group-hover:scale-105 transition-transform`}>
                          {course.iconType === 'prompt' && <Sparkles className="w-7 h-7" />}
                          {course.iconType === 'brain' && <Brain className="w-7 h-7" />}
                          {course.iconType === 'language' && <Languages className="w-7 h-7" />}
                          {course.iconType === 'vision' && <Eye className="w-7 h-7" />}
                          {course.iconType === 'code' && <Cpu className="w-7 h-7" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                              {course.title}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600">
                              {course.rating} ★
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">
                            {course.subtitle}
                          </p>
                          <span className="text-[11px] text-slate-500 font-medium mt-1 inline-block">
                            Instructor: {course.instructor.name}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar & Actions */}
                      <div className="flex items-center gap-6 sm:text-right shrink-0">
                        <div className="space-y-1 w-32">
                          <div className="flex justify-between sm:justify-end gap-2 text-xs font-bold text-blue-600">
                            <span>{course.completionPercent}%</span>
                            <span className="text-slate-400 font-medium">Completed</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${course.completionPercent}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium block">
                            Lesson {course.currentLesson} of {course.totalLessons}
                          </span>
                        </div>

                        <button 
                          className="w-10 h-10 rounded-2xl bg-blue-50 group-hover:bg-blue-600 group-hover:text-white text-blue-600 flex items-center justify-center transition-all shrink-0"
                          title="Open Course"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT 1 COLUMN: ACTIVITY SUMMARY & NORA TUTOR CARD */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Weekly Run Summary
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    Learning metrics &amp; study analytics
                  </p>
                </div>

                {/* 4 Sleek Metric Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-white border border-slate-200/80 rounded-3xl shadow-2xs space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-slate-400 block">Study Time</span>
                      <span className="text-sm font-black text-slate-900">14.5 Hours</span>
                      <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">+12% this week</span>
                    </div>
                  </div>

                  <div className="p-4 bg-white border border-slate-200/80 rounded-3xl shadow-2xs space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-slate-400 block">Total XP</span>
                      <span className="text-sm font-black text-slate-900">2,450 XP</span>
                      <span className="text-[10px] text-indigo-600 font-bold block mt-0.5">Top 5% Student</span>
                    </div>
                  </div>

                  <div className="p-4 bg-white border border-slate-200/80 rounded-3xl shadow-2xs space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-slate-400 block">Daily Streak</span>
                      <span className="text-sm font-black text-slate-900">5 Days</span>
                      <span className="text-[10px] text-amber-600 font-bold block mt-0.5">Personal Record</span>
                    </div>
                  </div>

                  <div className="p-4 bg-white border border-slate-200/80 rounded-3xl shadow-2xs space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Brain className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-slate-400 block">AI Mastery</span>
                      <span className="text-sm font-black text-slate-900">92%</span>
                      <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Socratic Tested</span>
                    </div>
                  </div>
                </div>

                {/* Meet Nora AI Tutor Card */}
                <div 
                  onClick={() => setActiveTab('tutor')}
                  className="p-5 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-3xl text-white shadow-md shadow-blue-500/20 cursor-pointer hover:shadow-xl transition-all relative overflow-hidden group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center">
                      <AiRobotMascot variant="mini" size={32} />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-white/20 text-white uppercase tracking-wider">
                      Live AI Tutor
                    </span>
                  </div>

                  <h3 className="font-black text-base text-white">Nora Socratic AI Tutor</h3>
                  <p className="text-xs text-blue-100/90 leading-relaxed mt-1">
                    Ask questions, test your knowledge with interactive quizzes, and receive personalized explanations in real time.
                  </p>

                  <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs font-bold text-white">
                    <span>Start Socratic Session</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* TAB 2: COURSE DETAIL & CURRICULUM VIEW                       */}
        {/* ------------------------------------------------------------ */}
        {activeTab === 'course-detail' && (
          <div className="space-y-8 animate-fade-in">
            {/* Top Back & Header */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveTab('home')}
                className="px-4 py-2 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                ← Back to Dashboard
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold">Select Course:</span>
                <select
                  value={selectedCourse.id}
                  onChange={(e) => {
                    const c = AI_COURSES.find(item => item.id === e.target.value);
                    if (c) setSelectedCourse(c);
                  }}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {AI_COURSES.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* TWO-COLUMN COURSE DETAIL LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Course Card & 3D Robot Mascot Banner */}
              <div className="space-y-6">
                {/* Hero Visual Card: Soft Sky Blue + 3D Mascot */}
                <div className="relative w-full h-64 sm:h-72 rounded-3xl bg-gradient-to-b from-sky-100 via-blue-50 to-white border border-blue-100/70 overflow-hidden flex items-center justify-center shadow-xs">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-blue-300/30 blur-2xl pointer-events-none" />
                  <div className="relative z-10 animate-bounce duration-1000">
                    <AiRobotMascot variant="waving" size={210} />
                  </div>
                </div>

                {/* Course Overview Card */}
                <div className="p-6 bg-white border border-slate-200/80 rounded-3xl shadow-2xs space-y-4">
                  <div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700 uppercase tracking-wider">
                      {selectedCourse.category}
                    </span>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
                      {selectedCourse.title}
                    </h1>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      {selectedCourse.subtitle}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedCourse.description}
                  </p>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    {/* Avatars Stack */}
                    <div className="flex items-center">
                      <div className="flex -space-x-2">
                        <img className="w-8 h-8 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" alt="Student" />
                        <img className="w-8 h-8 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80" alt="Student" />
                        <img className="w-8 h-8 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80" alt="Student" />
                      </div>
                      <span className="ml-3 text-xs font-black text-blue-600">
                        +{selectedCourse.studentCount} enrolled
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-900 font-black text-xs">
                      <span>{selectedCourse.rating}</span>
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    </div>
                  </div>

                  {/* Instructor Bio */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                    <img 
                      src={selectedCourse.instructor.avatar} 
                      alt={selectedCourse.instructor.name}
                      className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-2xs"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{selectedCourse.instructor.name}</h4>
                      <p className="text-[11px] text-slate-500">{selectedCourse.instructor.role}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Full Curriculum List & Interactive Player */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      Curriculum :
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">
                      {selectedCourse.curriculum.length} Interactive Lessons with Audio Lectures &amp; Concept Checks
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                    {completedLessons.length} / {selectedCourse.curriculum.length} Completed
                  </span>
                </div>

                {/* Lesson Items */}
                <div className="space-y-3">
                  {selectedCourse.curriculum.map((lesson) => {
                    const isDone = completedLessons.includes(lesson.id);
                    return (
                      <div
                        key={lesson.id}
                        onClick={() => setSelectedLesson(lesson)}
                        className="p-5 bg-white border border-slate-200/80 rounded-3xl hover:border-blue-400 hover:shadow-md transition-all flex items-center justify-between gap-4 cursor-pointer group shadow-2xs active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <span className="font-black text-lg text-slate-900 group-hover:text-blue-600 transition-colors w-8">
                            {lesson.orderNumber}
                          </span>
                          <div className="min-w-0">
                            <h3 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                              {lesson.title}
                            </h3>
                            <p className="text-xs text-slate-400 font-medium flex items-center gap-2 mt-0.5">
                              <span>({lesson.duration})</span>
                              <span className="text-blue-600 font-bold capitalize">{lesson.type}</span>
                              <span>·</span>
                              <span className="line-clamp-1">{lesson.summary}</span>
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLesson(lesson);
                          }}
                          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shrink-0 shadow-sm ${
                            isDone 
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
                          }`}
                          title="Play Lesson"
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5 text-blue-700" />
                          ) : (
                            <Play className="w-4 h-4 ml-0.5 fill-current" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Socratic Helper Banner */}
                <div 
                  onClick={() => setActiveTab('tutor')}
                  className="p-5 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between gap-4 shadow-md shadow-blue-500/20 cursor-pointer hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0">
                      <AiRobotMascot variant="mini" size={36} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Have questions about this lesson?</h4>
                      <p className="text-xs text-blue-100">Ask Nora, your personal Socratic AI tutor for personalized explanations.</p>
                    </div>
                  </div>
                  <span className="text-xs font-black px-4 py-2 bg-white text-blue-700 rounded-xl shrink-0">
                    Chat with Nora
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* TAB 3: NORA SOCRATIC AI TUTOR (FULL-WIDTH WORKSPACE)         */}
        {/* ------------------------------------------------------------ */}
        {activeTab === 'tutor' && (
          <div className="-mx-4 -my-4 sm:mx-0 sm:my-0 bg-white sm:rounded-3xl border-0 sm:border sm:border-slate-200/80 sm:shadow-md h-[calc(100dvh-5.5rem)] sm:h-[82vh] overflow-hidden flex flex-col animate-fade-in">
            <div className="hidden sm:flex p-4 border-b border-slate-200 bg-slate-50 items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <AiRobotMascot variant="mini" size={30} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Nora Socratic AI Tutor</h3>
                  <p className="text-xs text-slate-500">Autonomous student modeling &amp; real-time pedagogical adjustments</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('home')}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Close Tutor
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <NoraTutorView
                userId={user?.uid || 'guest'}
                studentName={userName}
                studySet={selectedSet}
                onBack={() => setActiveTab('home')}
                hasBottomDock={true}
              />
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* TAB 4: ADMIN PANEL                                           */}
        {/* ------------------------------------------------------------ */}
        {activeTab === 'admin' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 animate-fade-in">
            <AdminPanel
              currentUserEmail={user?.email || null}
              onBack={() => setActiveTab('home')}
            />
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* 3. MOBILE FLOATING DOCK (SHOWN ONLY ON MOBILE VIEWPORTS)       */}
      {/* ============================================================== */}
      <div className="md:hidden fixed bottom-3 left-4 right-4 z-40">
        <div className="bg-[#2563EB] rounded-3xl py-2.5 px-6 shadow-xl shadow-blue-600/35 flex items-center justify-between text-white border border-blue-400/30 backdrop-blur-md">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
              activeTab === 'home' ? 'text-white scale-110' : 'text-blue-200 hover:text-white'
            }`}
            title="Dashboard"
          >
            <Home className="w-5 h-5" />
            {activeTab === 'home' && <span className="w-1 h-1 rounded-full bg-white mt-0.5" />}
          </button>

          <button 
            onClick={() => setActiveTab('course-detail')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
              activeTab === 'course-detail' ? 'text-white scale-110' : 'text-blue-200 hover:text-white'
            }`}
            title="Course Curriculum"
          >
            <GraduationCap className="w-5 h-5" />
            {activeTab === 'course-detail' && <span className="w-1 h-1 rounded-full bg-white mt-0.5" />}
          </button>

          <button 
            onClick={() => setActiveTab('tutor')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
              activeTab === 'tutor' ? 'text-white scale-110' : 'text-blue-200 hover:text-white'
            }`}
            title="Nora AI Tutor"
          >
            <MessageSquare className="w-5 h-5" />
            {activeTab === 'tutor' && <span className="w-1 h-1 rounded-full bg-white mt-0.5" />}
          </button>

          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex flex-col items-center justify-center p-1.5 rounded-xl text-blue-200 hover:text-white transition-all"
            title="Upload Material"
          >
            <Upload className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. MODALS: LESSON PLAYER, PROMO $50 OFF, MATERIAL UPLOAD        */}
      {/* ============================================================== */}
      {selectedLesson && (
        <LessonPlayerModal
          lesson={selectedLesson}
          course={selectedCourse}
          onClose={() => setSelectedLesson(null)}
          onComplete={handleLessonComplete}
        />
      )}

      {/* Bootcamp Promo Modal ($50 Off) */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-slate-900 relative shadow-2xl space-y-4 text-center">
            <button
              onClick={() => setShowPromoModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
              <Sparkles className="w-8 h-8" />
            </div>
            <span className="text-xs font-black text-blue-600 tracking-wider uppercase">
              AI Bootcamp 2026 Special
            </span>
            <h3 className="text-2xl font-black text-slate-900">
              Get $50 Off All Enrollments
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Unlock complete access to Prompt Engineering, Deep Learning, Natural Language, Computer Vision, and unlimited 1-on-1 Socratic tutoring with Nora.
            </p>
            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-xs text-blue-900 font-mono font-bold">
              PROMO CODE: LEARNORA2026
            </div>
            <button
              onClick={() => {
                setShowPromoModal(false);
                setSelectedCourse(AI_COURSES[0]);
                setActiveTab('course-detail');
              }}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-xs shadow-md shadow-blue-500/25 transition-all"
            >
              Claim Discount &amp; Start Learning
            </button>
          </div>
        </div>
      )}

      {/* Material Upload Modal */}
      {showUploadModal && (
        <MaterialUploadModal
          userId={user?.uid || 'guest'}
          onClose={() => setShowUploadModal(false)}
          onSuccess={(newSet: StudySet) => {
            setShowUploadModal(false);
            setStudySets(prev => [newSet, ...prev]);
            setSelectedSet(newSet);
          }}
        />
      )}
    </div>
  );
};
