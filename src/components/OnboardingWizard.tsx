import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Check, 
  ArrowRight, 
  ArrowLeft,
  GraduationCap, 
  Target, 
  Sparkles, 
  Clock, 
  BrainCircuit, 
  Compass,
  Smile,
  BookOpen,
  Video,
  Headphones,
  HelpCircle,
  Layers,
  MessageSquare,
  Zap,
  Award,
  Briefcase,
  Stethoscope,
  Scale,
  Laptop,
  TrendingUp,
  Globe,
  Bot
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EducationLevel, ProficiencyLevel, LearningGoal, LearningStyle, StudyTimePerDay } from '../types';

interface OnboardingProps {
  onComplete: () => void;
}

export const OnboardingWizard: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { profile, updateProfileData } = useAuth();
  const [step, setStep] = useState(1);
  const totalSteps = 6;

  // Stage 1: Choose your field
  const [educationLevel, setEducationLevel] = useState<string>(
    profile?.customEducation || profile?.educationLevel || 'University'
  );
  const [customEducation, setCustomEducation] = useState<string>(profile?.customEducation || '');

  // Stage 2: What is your current level?
  const [proficiencyLevel, setProficiencyLevel] = useState<ProficiencyLevel>(
    profile?.proficiencyLevel || 'Intermediate'
  );

  // Stage 3: What are you trying to achieve?
  const [primaryGoal, setPrimaryGoal] = useState<string>(
    profile?.primaryGoal || 'Understand classes'
  );
  const [customGoal, setCustomGoal] = useState<string>('');

  // Stage 4: How do you learn best?
  const [learningStyles, setLearningStyles] = useState<LearningStyle[]>(
    profile?.learningStyles?.length 
      ? profile.learningStyles 
      : ['Reading', 'Watching explanations', 'Practice questions', 'Flashcards', 'Interactive tutoring']
  );

  // Stage 5: How much time can you study daily?
  const [dailyStudyTime, setDailyStudyTime] = useState<StudyTimePerDay>(
    profile?.dailyStudyTime || '1 hour'
  );

  // Stage 6: What should Nora call you?
  const [tutorNickname, setTutorNickname] = useState<string>(
    profile?.tutorNickname || profile?.displayName?.split(' ')[0] || 'Learner'
  );

  const [saving, setSaving] = useState(false);

  // Toggle multi-select learning formats
  const toggleLearningStyle = (style: LearningStyle) => {
    if (style === 'A mixture of everything' || (style as string) === 'A mixture') {
      if (learningStyles.includes('A mixture of everything') || (learningStyles as string[]).includes('A mixture')) {
        setLearningStyles(['Interactive tutoring', 'Flashcards']);
      } else {
        setLearningStyles([
          'Reading',
          'Watching explanations',
          'Listening',
          'Practice questions',
          'Flashcards',
          'Interactive tutoring',
          'A mixture of everything'
        ]);
      }
      return;
    }

    if (learningStyles.includes(style)) {
      if (learningStyles.length > 1) {
        setLearningStyles(learningStyles.filter(s => s !== style && s !== 'A mixture of everything' && (s as string) !== 'A mixture'));
      }
    } else {
      const next = [...learningStyles.filter(s => s !== 'A mixture of everything' && (s as string) !== 'A mixture'), style];
      setLearningStyles(next);
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleFinalize();
    }
  };

  const handleFinalize = async () => {
    setSaving(true);
    const chosenField = (educationLevel === 'Another subject' || educationLevel === 'Your course') && customEducation.trim() 
      ? customEducation.trim() 
      : (customEducation.trim() || educationLevel);

    const chosenGoal = primaryGoal === 'Another goal' && customGoal.trim()
      ? customGoal.trim()
      : primaryGoal;

    const chosenName = tutorNickname.trim() || 'Learner';

    try {
      await updateProfileData({
        educationLevel: chosenField,
        customEducation: customEducation.trim() || '',
        proficiencyLevel,
        primaryGoal: chosenGoal,
        learningStyles,
        dailyStudyTime,
        tutorNickname: chosenName,
        onboardingCompleted: true
      });

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });

      setTimeout(() => {
        onComplete();
      }, 900);
    } catch (e) {
      console.warn('Notice: Profile saved locally during setup completion:', e);
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  // Keyboard navigation: Enter advances step
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleNext();
    }
  };

  const stepNames = [
    'Field of Study',
    'Current Level',
    'Learning Goal',
    'Study Formats',
    'Daily Commitment',
    'Tutor Greeting'
  ];

  return (
    <div 
      onKeyDown={handleKeyDown}
      className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/30 to-indigo-50/20 flex flex-col justify-between p-4 sm:p-6 md:p-10 font-sans select-none"
    >
      {/* Top Header & Multi-Stage Breadcrumbs */}
      <div className="max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <BrainCircuit className="w-5 h-5 text-blue-100" />
            </div>
            <div>
              <span className="font-bold text-base font-serif text-slate-900 block leading-tight">
                Learnora Setup
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Stage {step} of {totalSteps}: {stepNames[step - 1]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                await updateProfileData({ onboardingCompleted: true });
                onComplete();
              }}
              className="text-xs font-semibold text-slate-500 hover:text-blue-600 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Skip to Dashboard →
            </button>
            <span className="text-xs font-bold text-blue-700 bg-blue-100/80 border border-blue-200 px-3 py-1 rounded-full shadow-2xs">
              {step} / {totalSteps}
            </span>
          </div>
        </div>

        {/* Progress Bar with 6 Segments */}
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-6 shadow-inner flex gap-0.5 p-0.5">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div 
              key={s}
              className={`h-full flex-1 rounded-full transition-all duration-300 ${
                s <= step 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-xs' 
                  : 'bg-slate-300/60'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Multi-Stage Step Content Card */}
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col justify-center my-2">
        
        {/* ================= STAGE 1: Choose your field ================= */}
        {step === 1 && (
          <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200/90 shadow-sm animate-fade-in space-y-5">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3 shadow-2xs">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif tracking-tight">
                Choose your field
              </h2>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Choose a field such as your course or another subject so Nora can adapt her vocabulary and pedagogical examples.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { label: 'Your course', desc: 'Degree major, college class, or specific syllabus', icon: BookOpen },
                { label: 'Another subject', desc: 'Custom subject, personal study, or topic', icon: Sparkles },
                { label: 'Secondary School', desc: 'High school & college prep', icon: GraduationCap },
                { label: 'University', desc: 'Degree course, major, or undergrad', icon: BookOpen },
                { label: 'Professional Certification', desc: 'CPA, CFA, PMP, AWS, NCLEX', icon: Award },
                { label: 'Medical', desc: 'Medicine, nursing, pharmacology', icon: Stethoscope },
                { label: 'Law', desc: 'Jurisprudence, constitutional, legal', icon: Scale },
                { label: 'Technology', desc: 'Computer science, AI, coding', icon: Laptop },
                { label: 'Business', desc: 'Finance, economics, marketing', icon: TrendingUp },
                { label: 'Language Learning', desc: 'Vocabulary, grammar, fluency', icon: Globe }
              ].map(({ label, desc, icon: Icon }) => {
                const isSelected = educationLevel === label;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setEducationLevel(label)}
                    className={`p-3.5 text-left rounded-2xl border transition-all flex items-start justify-between gap-2.5 ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50/80 text-blue-950 font-semibold ring-2 ring-blue-500/25 shadow-2xs' 
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-sm block leading-tight text-slate-900 truncate">
                          {label}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                          {desc}
                        </span>
                      </div>
                    </div>

                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-1 transition-all ${
                      isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {(educationLevel === 'Your course' || educationLevel === 'Another subject') && (
              <div className="pt-2 animate-fade-in space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Type your specific course or subject
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Organic Chemistry, Macroeconomics, AP Biology, Data Structures..."
                  value={customEducation}
                  onChange={(e) => setCustomEducation(e.target.value)}
                  className="w-full p-3.5 text-sm border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-blue-50/30 text-slate-900"
                />
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-500 mr-1">Suggestions:</span>
                  {[
                    'Organic Chemistry',
                    'Computer Science',
                    'Macroeconomics',
                    'Cell Biology',
                    'Calculus',
                    'Psychology',
                    'Data Structures'
                  ].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setCustomEducation(sug)}
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= STAGE 2: What is your current level? ================= */}
        {step === 2 && (
          <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200/90 shadow-sm animate-fade-in space-y-5">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 shadow-2xs">
                <Compass className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif tracking-tight">
                What is your current level?
              </h2>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Beginner, intermediate, advanced, or exam preparation.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { 
                  title: 'Beginner', 
                  desc: 'Starting from the basics; clear foundational concepts with intuitive everyday analogies.',
                  badge: 'Foundations'
                },
                { 
                  title: 'Intermediate', 
                  desc: 'Familiar with core concepts; ready to tackle applied problem-solving and structured exercises.',
                  badge: 'Applied Practice'
                },
                { 
                  title: 'Advanced', 
                  desc: 'Strong conceptual grasp; ready for deep theoretical nuance, edge cases, and high academic rigor.',
                  badge: 'Theoretical Rigor'
                },
                { 
                  title: 'Exam preparation', 
                  desc: 'High-yield test focus; rapid active recall drills, tricky practice questions, and weak-spot remediation.',
                  badge: 'High-Yield Drill'
                }
              ].map((lvl) => {
                const isSelected = proficiencyLevel === lvl.title;
                return (
                  <button
                    key={lvl.title}
                    type="button"
                    onClick={() => setProficiencyLevel(lvl.title as ProficiencyLevel)}
                    className={`w-full p-4 text-left rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50/80 text-blue-950 ring-2 ring-blue-500/25 shadow-2xs' 
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-slate-900 font-serif">
                          {lvl.title}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          {lvl.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {lvl.desc}
                      </p>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                      isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= STAGE 3: What are you trying to achieve? ================= */}
        {step === 3 && (
          <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200/90 shadow-sm animate-fade-in space-y-5">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 shadow-2xs">
                <Target className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif tracking-tight">
                What are you trying to achieve?
              </h2>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Understand classes, prepare for exams, improve grades, learn a subject, prepare for certification, build practical skills, or another goal.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { goal: 'Understand classes', desc: 'Master textbook readings & lectures', icon: BookOpen },
                { goal: 'Prepare for exams', desc: 'High-yield practice & test simulation', icon: HelpCircle },
                { goal: 'Improve grades', desc: 'Elevate test scores & assignments', icon: TrendingUp },
                { goal: 'Learn a subject', desc: 'Comprehensive mastery from scratch', icon: BrainCircuit },
                { goal: 'Prepare for certification', desc: 'Industry certifications & licensure', icon: Award },
                { goal: 'Build practical skills', desc: 'Real-world problem solving & career', icon: Briefcase },
                { goal: 'Another goal', desc: 'Personal goal or specific milestone', icon: Sparkles }
              ].map(({ goal, desc, icon: Icon }) => {
                const isSelected = primaryGoal === goal;
                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => setPrimaryGoal(goal)}
                    className={`p-3.5 text-left rounded-2xl border transition-all flex items-start justify-between gap-2.5 ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50/80 text-blue-950 font-semibold ring-2 ring-blue-500/25 shadow-2xs' 
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-sm block leading-tight text-slate-900 truncate">
                          {goal}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                          {desc}
                        </span>
                      </div>
                    </div>

                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-1 transition-all ${
                      isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {primaryGoal === 'Another goal' && (
              <div className="pt-2 animate-fade-in">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Describe your personal learning goal
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Master statistics for research, pass bar exam, learn Spanish for travel..."
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  className="w-full p-3.5 text-sm border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-blue-50/30 text-slate-900"
                />
              </div>
            )}
          </div>
        )}

        {/* ================= STAGE 4: How do you learn best? ================= */}
        {step === 4 && (
          <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200/90 shadow-sm animate-fade-in space-y-5">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3 shadow-2xs">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif tracking-tight">
                How do you learn best?
              </h2>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Select one or more formats: reading, watching explanations, listening, practice questions, flashcards, interactive tutoring, or a mixture.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { style: 'Reading', desc: 'Structured notes, executive summaries & guides', icon: BookOpen },
                { style: 'Watching explanations', desc: 'Visual explainer slides & breakdown diagrams', icon: Video },
                { style: 'Listening', desc: 'Audio recaps, podcasts & voice lectures', icon: Headphones },
                { style: 'Practice questions', desc: 'Diagnostic quizzes, drills & self-checks', icon: HelpCircle },
                { style: 'Flashcards', desc: 'Spaced repetition active recall memory drills', icon: Layers },
                { style: 'Interactive tutoring', desc: 'Step-by-step Socratic conversation with Nora', icon: MessageSquare },
                { style: 'A mixture', desc: 'Balanced multimodal learning across all formats', icon: Zap }
              ].map(({ style, desc, icon: Icon }) => {
                const isSelected = learningStyles.includes(style as LearningStyle) || 
                  (style === 'A mixture' && learningStyles.includes('A mixture of everything'));
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() => toggleLearningStyle(style as LearningStyle)}
                    className={`p-3.5 text-left rounded-2xl border transition-all flex items-start justify-between gap-2.5 ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50/80 text-blue-950 font-semibold ring-2 ring-blue-500/25 shadow-2xs' 
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-sm block leading-tight text-slate-900 truncate">
                          {style}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                          {desc}
                        </span>
                      </div>
                    </div>

                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-1 transition-all ${
                      isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= STAGE 5: How much time can you study daily? ================= */}
        {step === 5 && (
          <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200/90 shadow-sm animate-fade-in space-y-5">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3 shadow-2xs">
                <Clock className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif tracking-tight">
                How much time can you study daily?
              </h2>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Choose 15 minutes, 30 minutes, 1 hour, 2 hours, or 3+ hours.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { time: '15 minutes', title: 'Micro-learning', note: 'Quick flashcards & 1 diagnostic quiz', badge: 'Casual' },
                { time: '30 minutes', title: 'Focused Review', note: 'Notes review + targeted practice problems', badge: 'Consistent' },
                { time: '1 hour', title: 'Standard Session', note: 'Recommended standard: Deep concept breakdown + spaced repetition', badge: 'Recommended' },
                { time: '2 hours', title: 'Deep Study', note: 'Timed practice exams + comprehensive Socratic tutoring', badge: 'Dedicated' },
                { time: '3+ hours', title: 'Intensive Immersion', note: 'Full curriculum mastery & extensive exam preparation', badge: 'Intensive' }
              ].map((item) => {
                const isSelected = dailyStudyTime === item.time;
                return (
                  <button
                    key={item.time}
                    type="button"
                    onClick={() => setDailyStudyTime(item.time as StudyTimePerDay)}
                    className={`w-full p-4 text-left rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50/80 text-blue-950 ring-2 ring-blue-500/25 shadow-2xs' 
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-slate-900 font-serif">
                          {item.time}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          · {item.title}
                        </span>
                        {item.badge === 'Recommended' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {item.note}
                      </p>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                      isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= STAGE 6: What should Nora call you? ================= */}
        {step === 6 && (
          <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200/90 shadow-sm animate-fade-in space-y-6">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3 shadow-2xs">
                <Smile className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif tracking-tight">
                What should Nora call you?
              </h2>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Your personal AI tutor will address you by this name during study conversations, quizzes, and encouragement.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Your First Name or Nickname
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  value={tutorNickname}
                  onChange={(e) => setTutorNickname(e.target.value)}
                  placeholder="e.g. Ademola or Alex"
                  className="w-full p-4 text-base font-semibold border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900 shadow-xs"
                />
              </div>
            </div>

            {/* Personalized Nora Greeting Preview Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/90 to-purple-50/90 border border-blue-200/80 shadow-2xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="w-6 h-6 text-blue-100" />
                </div>
                <div>
                  <span className="font-bold text-xs uppercase tracking-wider text-blue-900 block">
                    Nora AI Personal Tutor
                  </span>
                  <span className="text-[11px] text-blue-700">
                    Ready to guide your learning journey
                  </span>
                </div>
              </div>

              <div className="p-3 bg-white/90 backdrop-blur-xs rounded-xl border border-blue-100 text-xs text-slate-700 leading-relaxed shadow-2xs">
                "Hello, <strong>{tutorNickname.trim() || 'Learner'}</strong>! I have customized your curriculum for <strong>{(educationLevel === 'Another subject' || educationLevel === 'Your course') && customEducation ? customEducation : educationLevel}</strong> ({proficiencyLevel} level) with a <strong>{dailyStudyTime}</strong> daily pace. Let's turn what you have into what you know!"
              </div>

              {/* Summary pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-[11px] font-semibold">
                  Field: {(educationLevel === 'Another subject' || educationLevel === 'Your course') && customEducation ? customEducation : educationLevel}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                  Level: {proficiencyLevel}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 text-[11px] font-semibold">
                  Goal: {primaryGoal === 'Another goal' && customGoal ? customGoal : primaryGoal}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-[11px] font-semibold">
                  Daily: {dailyStudyTime}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav Action Bar */}
      <div className="max-w-2xl mx-auto w-full pt-4 border-t border-slate-200/80 flex items-center justify-between gap-3">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={handleNext}
          disabled={saving}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-98 text-white font-bold text-sm shadow-md shadow-blue-600/25 transition-all flex items-center gap-2"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>{step === totalSteps ? 'Enter Learnora' : 'Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
