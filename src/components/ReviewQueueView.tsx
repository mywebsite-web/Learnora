import React, { useState, useMemo } from 'react';
import { 
  BrainCircuit, 
  Clock, 
  CheckCircle2, 
  Flame, 
  Search, 
  Plus, 
  RotateCw, 
  Sparkles, 
  Filter, 
  BookOpen, 
  Award, 
  Calendar, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  HelpCircle, 
  Layers, 
  TrendingUp, 
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Zap,
  Info,
  Check,
  X
} from 'lucide-react';
import { ReviewLessonItem, StudySet, AnkiRating, SpacedRepetitionStage } from '../types';
import { ReviewQueueService } from '../services/reviewQueueService';
import { NotificationService } from '../services/notificationService';
import { ReviewSessionModal } from './ReviewSessionModal';

interface ReviewQueueViewProps {
  userId: string;
  items: ReviewLessonItem[];
  studySets: StudySet[];
  onQueueUpdated: (items: ReviewLessonItem[]) => void;
  onOpenStudySet: (studySetId?: string) => void;
  onAskNora: (topic: string) => void;
  onBackToDashboard: () => void;
}

export const ReviewQueueView: React.FC<ReviewQueueViewProps> = ({
  userId,
  items,
  studySets,
  onQueueUpdated,
  onOpenStudySet,
  onAskNora,
  onBackToDashboard
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'due' | '1d' | '3d' | '7d' | 'mastered'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSessionItems, setActiveSessionItems] = useState<ReviewLessonItem[] | null>(null);
  const [quickReviewItem, setQuickReviewItem] = useState<ReviewLessonItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [showCurveExplanation, setShowCurveExplanation] = useState(false);

  // New Lesson form state
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newCompletedDaysAgo, setNewCompletedDaysAgo] = useState<number>(1);
  const [newSelectedSetId, setNewSelectedSetId] = useState<string>('');
  const [newPromptQuestion, setNewPromptQuestion] = useState('');
  const [newPromptAnswer, setNewPromptAnswer] = useState('');

  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Search matching
      const matchesSearch = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.keyConcepts?.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      const ageDays = (now - item.completedAt) / oneDayMs;
      const isDue = item.nextReviewDate <= now;

      if (filterTab === 'due') return isDue;
      if (filterTab === '1d') return (ageDays >= 0.8 && ageDays < 2.5) || item.repetitionStage === 1;
      if (filterTab === '3d') return (ageDays >= 2.5 && ageDays < 5.5) || item.repetitionStage === 2;
      if (filterTab === '7d') return ageDays >= 5.5 || item.repetitionStage === 3;
      if (filterTab === 'mastered') return item.repetitionStage === 4 || item.targetIntervalDays >= 14;

      return true;
    });
  }, [items, searchQuery, filterTab, now, oneDayMs]);

  // Counts
  const dueCount = items.filter(i => i.nextReviewDate <= now).length;
  const stage1Count = items.filter(i => {
    const ageDays = (now - i.completedAt) / oneDayMs;
    return (ageDays >= 0.8 && ageDays < 2.5) || i.repetitionStage === 1;
  }).length;
  const stage2Count = items.filter(i => {
    const ageDays = (now - i.completedAt) / oneDayMs;
    return (ageDays >= 2.5 && ageDays < 5.5) || i.repetitionStage === 2;
  }).length;
  const stage3Count = items.filter(i => {
    const ageDays = (now - i.completedAt) / oneDayMs;
    return ageDays >= 5.5 || i.repetitionStage === 3;
  }).length;
  const masteredCount = items.filter(i => i.repetitionStage === 4 || i.targetIntervalDays >= 14).length;

  const averageRetention = items.length > 0 
    ? Math.round(items.reduce((acc, i) => acc + (i.retentionScore || 70), 0) / items.length)
    : 85;

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [stageToDelete, setStageToDelete] = useState<{ stage: 1 | 2 | 3 | 4 | 'due' | 'all'; label: string; count: number } | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [stageMenuOpenId, setStageMenuOpenId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleResetSamplesConfirm = async () => {
    setShowResetModal(false);
    setLoadingAction(true);
    try {
      const resetItems = await ReviewQueueService.resetQueueWithSamples(userId);
      onQueueUpdated(resetItems);
      showToast('Review queue reset with 1, 3, and 7-day sample lessons');
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Instant optimistic update
    const item = items.find(i => i.id === id);
    const updated = items.filter(i => i.id !== id);
    onQueueUpdated(updated);
    showToast(item ? `Deleted "${item.title.slice(0, 24)}..." from queue` : 'Lesson deleted from queue');
    try {
      await ReviewQueueService.deleteItem(userId, id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmDeleteStage = async () => {
    if (!stageToDelete) return;
    const { stage, label } = stageToDelete;
    setStageToDelete(null);
    setLoadingAction(true);
    try {
      let updated: ReviewLessonItem[] = [];
      if (stage === 'all') {
        updated = await ReviewQueueService.deleteAllInQueue(userId);
      } else {
        updated = await ReviewQueueService.deleteStage(userId, stage);
      }
      onQueueUpdated(updated);
      showToast(stage === 'all' ? 'Cleared all lessons from review queue' : `Deleted all lessons in ${label}`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleChangeStage = async (itemId: string, newStage: SpacedRepetitionStage, e: React.MouseEvent) => {
    e.stopPropagation();
    setStageMenuOpenId(null);
    try {
      const { allItems } = await ReviewQueueService.changeItemStage(userId, itemId, newStage);
      onQueueUpdated(allItems);
      const stageLabels: Record<number, string> = { 1: 'Stage 1 (1d)', 2: 'Stage 2 (3d)', 3: 'Stage 3 (7d)', 4: 'Mastered (14d+)' };
      showToast(`Moved to ${stageLabels[newStage]}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setLoadingAction(true);
    try {
      const added = await ReviewQueueService.enqueueCompletedLesson(userId, {
        studySetId: newSelectedSetId || undefined,
        title: newTitle.trim(),
        subject: newSubject.trim() || 'General Studies',
        customCompletedDaysAgo: newCompletedDaysAgo,
        promptQuestion: newPromptQuestion.trim() || undefined,
        promptAnswer: newPromptAnswer.trim() || undefined
      });

      const updated = [added, ...items];
      onQueueUpdated(updated);
      setShowAddModal(false);
      setNewTitle('');
      setNewSubject('');
      setNewPromptQuestion('');
      setNewPromptAnswer('');
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSelectExistingStudySet = (setId: string) => {
    setNewSelectedSetId(setId);
    const set = studySets.find(s => s.id === setId);
    if (set) {
      setNewTitle(set.title);
      setNewSubject(set.subject || 'General Study');
      if (set.description) {
        setNewPromptAnswer(set.description.slice(0, 250));
      } else if (set.materials && set.materials[0]?.content) {
        setNewPromptAnswer(set.materials[0].content.slice(0, 250));
      }
    }
  };

  const formatDaysAgo = (timestamp: number) => {
    const diffHours = Math.round((now - timestamp) / (1000 * 60 * 60));
    if (diffHours < 24) return 'Completed earlier today';
    const days = Math.round(diffHours / 24);
    return `Completed ${days} ${days === 1 ? 'day' : 'days'} ago`;
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <button onClick={onBackToDashboard} className="hover:text-blue-600 transition-colors">
              Dashboard
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-blue-600 dark:text-blue-400 font-bold">Review Queue</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <span>Spaced Repetition Review Queue</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Anki-Style
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Combat the forgetting curve with targeted recall at <span className="font-bold text-slate-800 dark:text-slate-200">1 day, 3 days, and 7 days</span> post-completion to cement knowledge into permanent memory.
          </p>
        </div>

        {/* Action Header Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              NotificationService.triggerTestStudyReminder(userId);
            }}
            className="px-3 py-2 rounded-2xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/70 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs"
            title="Test real native phone popup for spaced repetition review due"
          >
            <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span className="hidden sm:inline">Test Phone Drop</span>
            <span className="sm:hidden">Test Drop</span>
          </button>

          <button
            onClick={() => setShowCurveExplanation(prev => !prev)}
            className="px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5"
            title="How Spaced Repetition Works"
          >
            <Info className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden sm:inline">Science of 1, 3, 7 Days</span>
            <span className="sm:hidden">Science</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-2xs active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Add Lesson</span>
          </button>

          <button
            onClick={() => setActiveSessionItems(dueCount > 0 ? items.filter(i => i.nextReviewDate <= now) : items)}
            className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/25 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{dueCount > 0 ? `Review Due (${dueCount})` : 'Start Review Session'}</span>
          </button>
        </div>
      </div>

      {/* Forgetting Curve & Anki Science Drawer / Callout */}
      {showCurveExplanation && (
        <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-50/90 via-blue-50/70 to-slate-50 dark:from-indigo-950/40 dark:via-blue-950/30 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-800/80 text-slate-800 dark:text-slate-200 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                SM-2
              </div>
              <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                The Hermann Ebbinghaus Forgetting Curve &amp; 1-3-7 Spacing
              </h3>
            </div>
            <button
              onClick={() => setShowCurveExplanation(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Without review, human memory loses <span className="font-bold text-rose-600 dark:text-rose-400">up to 70% of new information within 24 hours</span>. By initiating an active recall prompt at <span className="font-bold text-blue-600 dark:text-blue-400">Day 1</span>, you reset the curve. Reinforcing again at <span className="font-bold text-indigo-600 dark:text-indigo-400">Day 3</span> and <span className="font-bold text-purple-600 dark:text-purple-400">Day 7</span> progressively flattens the decay, moving synaptic connections into indefinite long-term retention.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 text-xs">
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-indigo-100 dark:border-indigo-900">
              <span className="font-black text-blue-600 dark:text-blue-400">Day 1 (24 hrs)</span>
              <p className="text-[11px] text-slate-500 mt-0.5">Interrupts initial steep drop. First reconsolidation.</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-indigo-100 dark:border-indigo-900">
              <span className="font-black text-indigo-600 dark:text-indigo-400">Day 3 (72 hrs)</span>
              <p className="text-[11px] text-slate-500 mt-0.5">Strengthens conceptual associations and definitions.</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-indigo-100 dark:border-indigo-900">
              <span className="font-black text-purple-600 dark:text-purple-400">Day 7 (1 week)</span>
              <p className="text-[11px] text-slate-500 mt-0.5">Locks core principles into permanent long-term storage.</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-indigo-100 dark:border-indigo-900">
              <span className="font-black text-emerald-600 dark:text-emerald-400">Day 14+ (Mastery)</span>
              <p className="text-[11px] text-slate-500 mt-0.5">Periodic maintenance reviews driven by SM-2 Ease Factor.</p>
            </div>
          </div>
        </div>
      )}

      {/* METRICS DASHBOARD CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Due Today */}
        <div 
          onClick={() => setFilterTab('due')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group ${
            filterTab === 'due' 
              ? 'bg-amber-500/10 border-amber-500 shadow-sm' 
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between text-amber-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Due Today</span>
            <div className="flex items-center gap-1">
              {dueCount > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStageToDelete({ stage: 'due', label: 'Due Today', count: dueCount });
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  title="Delete all due lessons"
                  aria-label="Delete all due lessons"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
              <Flame className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
            {dueCount}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium mt-0.5">
            <span>Ready for recall</span>
            {dueCount > 0 && (
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  setStageToDelete({ stage: 'due', label: 'Due Today', count: dueCount });
                }}
                className="text-rose-500 hover:underline cursor-pointer sm:hidden text-[9px] font-bold"
              >
                Clear
              </span>
            )}
          </div>
        </div>

        {/* 1 Day Ago (Stage 1) */}
        <div 
          onClick={() => setFilterTab('1d')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group ${
            filterTab === '1d' 
              ? 'bg-blue-500/10 border-blue-500 shadow-sm' 
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-blue-400'
          }`}
        >
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">1 Day Ago</span>
            <div className="flex items-center gap-1">
              {stage1Count > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStageToDelete({ stage: 1, label: 'Stage 1 (1 Day Ago)', count: stage1Count });
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  title="Delete Stage 1 (1 Day Ago) lessons"
                  aria-label="Delete Stage 1 lessons"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
            {stage1Count}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium mt-0.5">
            <span>Stage 1 · 24h</span>
            {stage1Count > 0 && (
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  setStageToDelete({ stage: 1, label: 'Stage 1 (1 Day Ago)', count: stage1Count });
                }}
                className="text-rose-500 hover:underline cursor-pointer sm:hidden text-[9px] font-bold"
              >
                Clear
              </span>
            )}
          </div>
        </div>

        {/* 3 Days Ago (Stage 2) */}
        <div 
          onClick={() => setFilterTab('3d')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group ${
            filterTab === '3d' 
              ? 'bg-indigo-500/10 border-indigo-500 shadow-sm' 
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-indigo-400'
          }`}
        >
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">3 Days Ago</span>
            <div className="flex items-center gap-1">
              {stage2Count > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStageToDelete({ stage: 2, label: 'Stage 2 (3 Days Ago)', count: stage2Count });
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  title="Delete Stage 2 (3 Days Ago) lessons"
                  aria-label="Delete Stage 2 lessons"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
            {stage2Count}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium mt-0.5">
            <span>Stage 2 · 72h</span>
            {stage2Count > 0 && (
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  setStageToDelete({ stage: 2, label: 'Stage 2 (3 Days Ago)', count: stage2Count });
                }}
                className="text-rose-500 hover:underline cursor-pointer sm:hidden text-[9px] font-bold"
              >
                Clear
              </span>
            )}
          </div>
        </div>

        {/* 7 Days Ago (Stage 3) */}
        <div 
          onClick={() => setFilterTab('7d')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group ${
            filterTab === '7d' 
              ? 'bg-purple-500/10 border-purple-500 shadow-sm' 
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-purple-400'
          }`}
        >
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">7 Days Ago</span>
            <div className="flex items-center gap-1">
              {stage3Count > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStageToDelete({ stage: 3, label: 'Stage 3 (7 Days Ago)', count: stage3Count });
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  title="Delete Stage 3 (7 Days Ago) lessons"
                  aria-label="Delete Stage 3 lessons"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
            {stage3Count}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium mt-0.5">
            <span>Stage 3 · 1 week</span>
            {stage3Count > 0 && (
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  setStageToDelete({ stage: 3, label: 'Stage 3 (7 Days Ago)', count: stage3Count });
                }}
                className="text-rose-500 hover:underline cursor-pointer sm:hidden text-[9px] font-bold"
              >
                Clear
              </span>
            )}
          </div>
        </div>

        {/* Mastered */}
        <div 
          onClick={() => setFilterTab('mastered')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group ${
            filterTab === 'mastered' 
              ? 'bg-emerald-500/10 border-emerald-500 shadow-sm' 
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Mastered</span>
            <div className="flex items-center gap-1">
              {masteredCount > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStageToDelete({ stage: 4, label: 'Mastered', count: masteredCount });
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  title="Delete Mastered lessons"
                  aria-label="Delete Mastered lessons"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
            {masteredCount}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium mt-0.5">
            <span>14+ days interval</span>
            {masteredCount > 0 && (
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  setStageToDelete({ stage: 4, label: 'Mastered', count: masteredCount });
                }}
                className="text-rose-500 hover:underline cursor-pointer sm:hidden text-[9px] font-bold"
              >
                Clear
              </span>
            )}
          </div>
        </div>

        {/* Retention Rate */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Avg Retention</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
            {averageRetention}%
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Across all sets</span>
        </div>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center overflow-x-auto no-scrollbar gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl shadow-2xs">
          {[
            { id: 'all', label: `All (${items.length})` },
            { id: 'due', label: `Due (${dueCount})` },
            { id: '1d', label: `1 Day Ago (${stage1Count})` },
            { id: '3d', label: `3 Days Ago (${stage2Count})` },
            { id: '7d', label: `7 Days Ago (${stage3Count})` },
            { id: 'mastered', label: `Mastered (${masteredCount})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterTab === tab.id
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Stage Delete action & Search Input & Reset Button */}
        <div className="flex items-center gap-2">
          {((filterTab === 'all' && items.length > 0) || (filterTab !== 'all' && filteredItems.length > 0)) && (
            <button
              type="button"
              onClick={() => {
                if (filterTab === 'all') {
                  setStageToDelete({ stage: 'all', label: 'All Review Lessons', count: items.length });
                } else {
                  const stageMap: Record<string, { stage: any; label: string }> = {
                    due: { stage: 'due', label: 'Due Today' },
                    '1d': { stage: 1, label: 'Stage 1 (1 Day Ago)' },
                    '3d': { stage: 2, label: 'Stage 2 (3 Days Ago)' },
                    '7d': { stage: 3, label: 'Stage 3 (7 Days Ago)' },
                    mastered: { stage: 4, label: 'Mastered' }
                  };
                  const mapped = stageMap[filterTab];
                  if (mapped) {
                    setStageToDelete({ stage: mapped.stage, label: mapped.label, count: filteredItems.length });
                  }
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 border border-rose-200 dark:border-rose-900/60 active:scale-95 cursor-pointer"
              title={filterTab === 'all' ? "Clear all review lessons from queue" : "Delete all lessons in this stage filter"}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{filterTab === 'all' ? `Clear Queue (${items.length})` : `Delete Stage (${filteredItems.length})`}</span>
            </button>
          )}

          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search concepts or lessons..."
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            disabled={loadingAction}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Reset default 1d, 3d, 7d sample lessons"
          >
            <RotateCw className={`w-4 h-4 ${loadingAction ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* LESSONS LIST */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="p-8 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                No lessons found in this filter
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Add a new lesson to your queue, or reset with realistic 1, 3, and 7 day samples.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95"
              >
                Add Lesson
              </button>
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                Load Sample Lessons
              </button>
            </div>
          </div>
        ) : (
          filteredItems.map(item => {
            const isDue = item.nextReviewDate <= now;
            const daysAgo = Math.round((now - item.completedAt) / oneDayMs);

            return (
              <div
                key={item.id}
                className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 shadow-2xs transition-all space-y-3"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wide bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800">
                      {item.subject}
                    </span>
                    
                    {/* Repetition Stage Selector / Switcher */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStageMenuOpenId(stageMenuOpenId === item.id ? null : item.id);
                        }}
                        className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                          item.repetitionStage === 1 
                            ? 'bg-blue-100/70 text-blue-800 dark:bg-blue-950/70 dark:text-blue-200 hover:bg-blue-200/80' 
                            : item.repetitionStage === 2 
                              ? 'bg-indigo-100/70 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-200 hover:bg-indigo-200/80' 
                              : item.repetitionStage === 3 
                                ? 'bg-purple-100/70 text-purple-800 dark:bg-purple-950/70 dark:text-purple-200 hover:bg-purple-200/80' 
                                : 'bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200 hover:bg-emerald-200/80'
                        }`}
                        title="Change or reset repetition stage"
                      >
                        <span>
                          {item.repetitionStage === 1 ? 'Stage 1 (1d)' : item.repetitionStage === 2 ? 'Stage 2 (3d)' : item.repetitionStage === 3 ? 'Stage 3 (7d)' : 'Mastered (14d+)'}
                        </span>
                        <ChevronDown className="w-3 h-3 opacity-60" />
                      </button>

                      {/* Dropdown Menu to change stage or delete from stage */}
                      {stageMenuOpenId === item.id && (
                        <div 
                          className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 py-1 text-xs animate-fade-in"
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                            Change Review Stage:
                          </div>
                          {[
                            { stage: 1, label: 'Stage 1 (1 Day Recall)' },
                            { stage: 2, label: 'Stage 2 (3 Day Consolidation)' },
                            { stage: 3, label: 'Stage 3 (7 Day Lock-in)' },
                            { stage: 4, label: 'Mastered (14+ Days)' }
                          ].map(s => (
                            <button
                              key={s.stage}
                              type="button"
                              onClick={(e) => handleChangeStage(item.id, s.stage as SpacedRepetitionStage, e)}
                              className={`w-full text-left px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-[11px] cursor-pointer ${
                                item.repetitionStage === s.stage ? 'font-black text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <span>{s.label}</span>
                              {item.repetitionStage === s.stage && <Check className="w-3.5 h-3.5 text-blue-600" />}
                            </button>
                          ))}
                          <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                setStageMenuOpenId(null);
                                handleDeleteItem(item.id, e);
                              }}
                              className="w-full text-left px-2.5 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Lesson from Queue</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <span className="text-[11px] text-slate-400 font-medium">
                      {formatDaysAgo(item.completedAt)}
                    </span>
                  </div>

                  {/* Due status pill & Delete button */}
                  <div className="flex items-center gap-2">
                    {isDue ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold animate-pulse">
                        <Flame className="w-3.5 h-3.5 text-amber-500" />
                        <span>Due for Review</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Due in {Math.max(1, Math.round((item.nextReviewDate - now) / oneDayMs))}d</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={e => handleDeleteItem(item.id, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Remove lesson from review queue"
                      aria-label={`Delete ${item.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Title & snippet */}
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {item.summarySnippet}
                  </p>
                </div>

                {/* Key Concepts Pills */}
                {item.keyConcepts && item.keyConcepts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.keyConcepts.map((concept, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                )}

                {/* Recall Prompt Preview Box */}
                {item.promptQuestion && (
                  <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50">
                    <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] uppercase tracking-wider mb-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Active Recall Question</span>
                    </div>
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      {item.promptQuestion}
                    </p>
                  </div>
                )}

                {/* Footer metrics & actions */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Retention bar & Anki SM-2 Stats */}
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-slate-400">Retention:</span>
                      <div className="w-20 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            (item.retentionScore || 70) >= 80 
                              ? 'bg-emerald-500' 
                              : (item.retentionScore || 70) >= 60 
                                ? 'bg-amber-500' 
                                : 'bg-rose-500'
                          }`}
                          style={{ width: `${item.retentionScore || 70}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                        {item.retentionScore || 70}%
                      </span>
                    </div>

                    <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400">
                      <span>Ease: <strong className="text-slate-700 dark:text-slate-300">{item.easeFactor?.toFixed(2) || '2.50'}x</strong></span>
                      <span className="mx-1">·</span>
                      <span>Next: <strong className="text-slate-700 dark:text-slate-300">{item.targetIntervalDays}d</strong></span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => onAskNora(item.title)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold text-xs transition-colors flex items-center gap-1"
                    >
                      <Zap className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Ask Nora</span>
                    </button>

                    {item.studySetId && (
                      <button
                        onClick={() => onOpenStudySet(item.studySetId)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors flex items-center gap-1"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Open Set</span>
                      </button>
                    )}

                    <button
                      onClick={() => setActiveSessionItems([item])}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1"
                    >
                      <span>Review (Anki)</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: ADD LESSON TO QUEUE */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                    Add Lesson to Review Queue
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Select an existing study set or create a spaced repetition reminder
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddLessonSubmit} className="space-y-3.5">
              {/* Optional: Pick from existing Study Sets */}
              {studySets.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Auto-Fill from Existing Study Set (Optional)
                  </label>
                  <select
                    value={newSelectedSetId}
                    onChange={e => handleSelectExistingStudySet(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Or enter custom lesson title below --</option>
                    {studySets.map(set => (
                      <option key={set.id} value={set.id}>
                        {set.title} ({set.subject || 'General'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Lesson Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g., Organic Chemistry: Reaction Mechanisms"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Subject / Course
                </label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  placeholder="e.g., Chemistry, Physics, History"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Completed Days Ago selector: 1, 3, or 7 days ago! */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  When Was this Lesson Completed?
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { days: 0, label: 'Today', sub: 'Due in 1d' },
                    { days: 1, label: '1 Day Ago', sub: 'Due Now (Stage 1)' },
                    { days: 3, label: '3 Days Ago', sub: 'Due Now (Stage 2)' },
                    { days: 7, label: '7 Days Ago', sub: 'Due Now (Stage 3)' }
                  ].map(opt => (
                    <button
                      key={opt.days}
                      type="button"
                      onClick={() => setNewCompletedDaysAgo(opt.days)}
                      className={`p-2 rounded-xl text-center border transition-all text-xs ${
                        newCompletedDaysAgo === opt.days
                          ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="font-bold">{opt.label}</div>
                      <div className={`text-[9px] mt-0.5 ${newCompletedDaysAgo === opt.days ? 'text-blue-100' : 'text-slate-400'}`}>
                        {opt.sub}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recall Question */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Active Recall Prompt Question (Optional)
                </label>
                <input
                  type="text"
                  value={newPromptQuestion}
                  onChange={e => setNewPromptQuestion(e.target.value)}
                  placeholder="e.g., What is the rate-limiting step in SN1 vs SN2 reactions?"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Model Answer */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Key Takeaway / Model Answer (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newPromptAnswer}
                  onChange={e => setNewPromptAnswer(e.target.value)}
                  placeholder="Key principle to reveal upon reviewing..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction || !newTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                >
                  Add to Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ACTIVE REVIEW SESSION MODAL */}
      {activeSessionItems && activeSessionItems.length > 0 && (
        <ReviewSessionModal
          userId={userId}
          itemsToReview={activeSessionItems}
          onClose={() => setActiveSessionItems(null)}
          onItemReviewed={(updatedItem, allItems) => {
            onQueueUpdated(allItems);
          }}
          onOpenStudySet={onOpenStudySet}
          onAskNora={onAskNora}
        />
      )}

      {/* MODAL: DELETE STAGE CONFIRMATION */}
      {stageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  {stageToDelete.stage === 'all' ? 'Clear Review Queue?' : `Delete ${stageToDelete.label}?`}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {stageToDelete.stage === 'all'
                    ? `Are you sure you want to remove all ${stageToDelete.count} lessons from your queue?`
                    : `Are you sure you want to delete all ${stageToDelete.count} lessons in this stage?`}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-300">
              {stageToDelete.stage === 'all'
                ? 'Your review queue will be completely cleared and will remain empty across app updates until you add new lessons or reset with sample lessons.'
                : `This will remove all ${stageToDelete.count} lessons scheduled under this spaced repetition stage from your review queue.`}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setStageToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loadingAction}
                onClick={handleConfirmDeleteStage}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete {stageToDelete.count} {stageToDelete.count === 1 ? 'Lesson' : 'Lessons'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESET QUEUE CONFIRMATION */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <RotateCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  Reset with Sample Lessons?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Populate your queue with realistic sample lessons across 1, 3, and 7-day intervals.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loadingAction}
                onClick={handleResetSamplesConfirm}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCw className={`w-3.5 h-3.5 ${loadingAction ? 'animate-spin' : ''}`} />
                <span>Reset Review Queue</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-slate-900/90 dark:bg-slate-100/90 text-white dark:text-slate-900 text-xs font-bold shadow-2xl flex items-center gap-2 backdrop-blur-md animate-fade-in border border-white/10 dark:border-slate-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
