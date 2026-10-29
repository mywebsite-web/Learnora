import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ArrowLeft,
  ChevronRight,
  BookOpen,
  Award,
  Trash2,
  AlertTriangle,
  Plus,
  Layers,
  Check,
  X
} from 'lucide-react';
import { StudyPlan, StudyPlanDay } from '../types';
import { AIService } from '../services/aiService';
import { DBService } from '../services/dbService';

interface StudyPlanViewProps {
  userId: string;
  onBack?: () => void;
}

export const StudyPlanView: React.FC<StudyPlanViewProps> = ({ userId, onBack }) => {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null);
  const [subject, setSubject] = useState('Organic Chemistry');
  const [examDate, setExamDate] = useState('2026-10-15');
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<StudyPlan | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, [userId]);

  const loadPlans = async () => {
    try {
      const fetched = await DBService.getStudyPlans(userId);
      setPlans(fetched);
      if (fetched.length > 0) setActivePlan(fetched[0]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await AIService.generateStudyPlan({
        subject,
        examDate,
        hoursPerWeek,
        currentConfidence: confidence
      });

      const newPlan: StudyPlan = {
        ...res,
        id: 'plan_' + Date.now(),
        userId,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await DBService.saveStudyPlan(newPlan);
      setPlans([newPlan, ...plans]);
      setActivePlan(newPlan);
      showToast(`Study plan "${newPlan.title}" created successfully!`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskCompletion = async (dayIndex: number, taskId: string) => {
    if (!activePlan) return;
    const updatedSchedule = [...activePlan.schedule];
    const task = updatedSchedule[dayIndex].tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      const updatedPlan = { ...activePlan, schedule: updatedSchedule, updatedAt: Date.now() };
      setActivePlan(updatedPlan);
      setPlans(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));
      await DBService.saveStudyPlan(updatedPlan);
    }
  };

  const handleDeleteClick = (plan: StudyPlan, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPlanToDelete(plan);
  };

  const confirmDeletePlan = async () => {
    if (!planToDelete) return;
    const targetId = planToDelete.id;
    const targetTitle = planToDelete.title;
    setDeletingId(targetId);
    try {
      await DBService.deleteStudyPlan(targetId);
      const remaining = plans.filter(p => p.id !== targetId);
      setPlans(remaining);
      if (activePlan?.id === targetId) {
        setActivePlan(remaining.length > 0 ? remaining[0] : null);
      }
      setPlanToDelete(null);
      showToast(`Study plan "${targetTitle}" deleted.`);
    } catch (err) {
      console.error('Failed to delete study plan:', err);
      showToast('Error deleting study plan. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getPlanStats = (plan: StudyPlan) => {
    let totalTasks = 0;
    let completedTasks = 0;
    plan.schedule?.forEach(day => {
      day.tasks?.forEach(t => {
        totalTasks++;
        if (t.completed) completedTasks++;
      });
    });
    const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return { totalTasks, completedTasks, percent };
  };

  const activeStats = activePlan ? getPlanStats(activePlan) : null;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-y-auto relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 right-4 left-4 sm:left-auto sm:right-6 z-50 p-3.5 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-10 shadow-2xs">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white shrink-0 shadow-xs">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div className="truncate">
            <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 font-serif truncate">Adaptive Study Plan &amp; Calendar</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Paced revision schedules that adjust to your mastery</p>
          </div>
        </div>

        {/* Header Right Actions: Plan switcher & New Plan */}
        <div className="flex items-center gap-2 shrink-0">
          {plans.length > 1 && (
            <select
              value={activePlan?.id || ''}
              onChange={(e) => {
                const found = plans.find(p => p.id === e.target.value);
                if (found) setActivePlan(found);
              }}
              className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 dark:text-slate-200 max-w-[130px] sm:max-w-[200px] truncate focus:outline-none"
            >
              {plans.map(p => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          )}

          {activePlan && (
            <button
              onClick={() => setActivePlan(null)}
              className="px-3 py-1.5 rounded-xl bg-violet-50 dark:bg-violet-950/60 hover:bg-violet-100 dark:hover:bg-violet-900/60 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 text-xs font-bold transition-all flex items-center gap-1 active:scale-95"
              title="Create another revision plan"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Plan</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-8 w-full flex-1">
        {!activePlan ? (
          <div className="space-y-8 animate-fade-in">
            {/* Form to create a new plan */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm max-w-xl mx-auto">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 font-serif">Create Your Revision Schedule</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Tell Nora your exam timeline and target study hours.</p>

              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Subject or Exam *</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Organic Chemistry, USMLE Step 1, MBE"
                    className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Exam Date</label>
                    <input
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Hours / Week</label>
                    <input
                      type="number"
                      min={2}
                      max={50}
                      value={hoursPerWeek}
                      onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                      className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Confidence</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['low', 'medium', 'high'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setConfidence(lvl)}
                        className={`p-2 rounded-xl border text-xs capitalize font-medium transition-all ${
                          confidence === lvl 
                            ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-bold' 
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate AI Study Schedule</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Existing Saved Study Plans List */}
            {plans.length > 0 && (
              <div className="max-w-xl mx-auto space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h4 className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                    <span>Your Saved Study Plans ({plans.length})</span>
                  </h4>
                </div>

                <div className="space-y-2.5">
                  {plans.map((plan) => {
                    const stats = getPlanStats(plan);
                    return (
                      <div
                        key={plan.id}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-violet-300 dark:hover:border-violet-500 transition-all group"
                      >
                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                            {plan.title}
                          </h5>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                              {plan.examDate || 'Self-paced'}
                            </span>
                            <span>•</span>
                            <span>{plan.hoursPerWeek} hrs/week</span>
                            <span>•</span>
                            <span className="font-semibold text-violet-700 dark:text-violet-400">
                              {stats.completedTasks}/{stats.totalTasks} tasks ({stats.percent}%)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setActivePlan(plan)}
                            className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs transition-all shadow-2xs flex items-center gap-1 active:scale-95"
                          >
                            <span>Open</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => handleDeleteClick(plan, e)}
                            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all"
                            title="Delete this study plan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Top Plan Overview Card with Delete Action */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200/60 dark:border-indigo-800/60">
                      Active Study Plan
                    </span>
                    {activeStats && (
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        {activeStats.completedTasks}/{activeStats.totalTasks} completed ({activeStats.percent}%)
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-serif mt-1.5 truncate">
                    {activePlan.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Target Exam: <strong>{activePlan.examDate || 'Self-paced'}</strong> • {activePlan.hoursPerWeek} hrs/week
                  </p>
                </div>

                {/* Plan Actions: Create New & Delete Plan */}
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setActivePlan(null)}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                    title="Switch or create new plan"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Create New Plan</span>
                  </button>

                  <button
                    onClick={() => handleDeleteClick(activePlan)}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-800/60 text-rose-600 dark:text-rose-300 hover:text-rose-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs"
                    title="Delete this study plan"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span>Delete Plan</span>
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              {activeStats && (
                <div className="pt-3.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
                    <span>Overall Revision Progress</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{activeStats.percent}% Complete</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full transition-all duration-500"
                      style={{ width: `${activeStats.percent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Daily schedule cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activePlan.schedule?.map((day, dIdx) => (
                <div key={dIdx} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100 font-serif">{day.dayName}</span>
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-medium">{day.date}</span>
                    </div>

                    <div className="mt-4 space-y-2.5">
                      {day.tasks?.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => toggleTaskCompletion(dIdx, task.id)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                            task.completed
                              ? 'bg-slate-50 dark:bg-slate-850 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 line-through'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                            task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600'
                          }`}>
                            {task.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold block truncate">{task.topic}</span>
                            <span className="text-[11px] text-slate-400 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" /> {task.estimatedMinutes} mins • {task.activityType.replace('-', ' ')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {planToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div 
            className="fixed inset-0"
            onClick={() => {
              if (!deletingId) setPlanToDelete(null);
            }}
          />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6 stroke-[2]" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 font-serif">
                Delete Study Plan?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Are you sure you want to permanently delete <strong>"{planToDelete.title}"</strong>? All daily revision schedules, tasks, and progress milestones will be removed.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                disabled={!!deletingId}
                onClick={() => setPlanToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!!deletingId}
                onClick={confirmDeletePlan}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {deletingId ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
