/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Sparkles, 
  Target, 
  Layers, 
  MessageSquare, 
  Trash2, 
  Zap, 
  Trophy,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { WeeklyRunSprintTask } from '../types';
import { ConfettiService } from '../services/confettiService';

interface WeeklyRunSprintListProps {
  tasks: WeeklyRunSprintTask[];
  onToggleTask: (taskId: string) => void;
  onAddTask: (taskData: { title: string; category: WeeklyRunSprintTask['category']; xpReward: number }) => void;
  onNavigateAction?: (category: string) => void;
}

export const WeeklyRunSprintList: React.FC<WeeklyRunSprintListProps> = ({
  tasks,
  onToggleTask,
  onAddTask,
  onNavigateAction
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<WeeklyRunSprintTask['category']>('custom');
  const [newXp, setNewXp] = useState(40);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const completedCount = tasks.filter(t => t.completed).length;
  const allCompleted = tasks.length > 0 && completedCount === tasks.length;

  const handleToggle = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const task = tasks.find(t => t.id === taskId);
    onToggleTask(taskId);
    if (task && !task.completed) {
      // Fire celebratory particle animation effect
      ConfettiService.fireParticlePop();
      setToastMessage(`🎉 Goal completed! +${task.xpReward} XP awarded!`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask({
      title: newTitle.trim(),
      category: newCategory,
      xpReward: Number(newXp) || 40
    });
    setNewTitle('');
    setShowAddForm(false);
    setToastMessage(`🎯 Added new weekly sprint goal!`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const getCategoryIcon = (cat: WeeklyRunSprintTask['category']) => {
    switch (cat) {
      case 'tutor':
        return <MessageSquare className="w-4 h-4 text-purple-600" />;
      case 'quiz':
        return <Target className="w-4 h-4 text-blue-600" />;
      case 'flashcards':
        return <Layers className="w-4 h-4 text-emerald-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-600" />;
    }
  };

  const getActionLabel = (cat: WeeklyRunSprintTask['category']) => {
    switch (cat) {
      case 'tutor':
        return 'Talk to Nora';
      case 'quiz':
        return 'Start Quiz';
      case 'flashcards':
        return 'Practice Cards';
      default:
        return 'Start Study';
    }
  };

  return (
    <div className="space-y-3">
      {/* HEADER BANNER */}
      <div className="p-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-2xl sm:rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-300" />
            <h3 className="font-black text-sm sm:text-base tracking-tight">
              Weekly Run Sprints ({completedCount}/{tasks.length})
            </h3>
          </div>
          <p className="text-xs text-blue-100 font-medium mt-0.5">
            {allCompleted 
              ? 'Outstanding performance! You completed every weekly sprint goal!' 
              : 'Complete milestones to accelerate retention and boost Knowledge XP.'}
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold backdrop-blur-md transition-all flex items-center gap-1.5 self-start sm:self-auto active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Sprint Goal</span>
        </button>
      </div>

      {/* TOAST MESSAGE */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in shadow-2xs">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ADD GOAL FORM */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="p-4 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900 rounded-2xl shadow-xs space-y-3 animate-fade-in">
          <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">Create Weekly Sprint Goal</h4>
          
          <input
            type="text"
            placeholder="e.g. Read Chapter 4 and review with Nora AI"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="custom">General Sprint Goal</option>
                <option value="tutor">Nora AI Socratic Session</option>
                <option value="quiz">Diagnostic Practice Quiz</option>
                <option value="flashcards">Spaced Repetition Cards</option>
                <option value="notes">Lecture Note Synthesis</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">XP Reward</label>
              <select
                value={newXp}
                onChange={(e) => setNewXp(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value={30}>+30 XP (Easy)</option>
                <option value={40}>+40 XP (Standard)</option>
                <option value={50}>+50 XP (High Impact)</option>
                <option value={75}>+75 XP (Boss Challenge)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-95"
            >
              Save Goal
            </button>
          </div>
        </form>
      )}

      {/* TASK LIST */}
      <div className="space-y-2.5">
        {tasks.map((task) => {
          return (
            <div
              key={task.id}
              onClick={(e) => handleToggle(task.id, e)}
              className={`p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border transition-all flex items-center justify-between gap-3 cursor-pointer group shadow-2xs ${
                task.completed
                  ? 'bg-slate-50/80 dark:bg-slate-850 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 opacity-80'
                  : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-xs'
              }`}
            >
              {/* Checkbox and Details */}
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={(e) => handleToggle(task.id, e)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90 ${
                    task.completed 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : 'text-slate-300 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 fill-emerald-100 dark:fill-emerald-950" />
                  ) : (
                    <Circle className="w-5 h-5 stroke-[2]" />
                  )}
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs sm:text-sm font-bold truncate leading-snug ${
                      task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                    }`}>
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 dark:text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      {getCategoryIcon(task.category)}
                      <span className="capitalize">{task.category}</span>
                    </span>
                    <span>·</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">+{task.xpReward} XP</span>
                    {task.targetCount > 1 && (
                      <>
                        <span>·</span>
                        <span>{task.currentCount} / {task.targetCount}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {onNavigateAction && !task.completed && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateAction(task.category);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-600 dark:hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white dark:hover:text-white text-[11px] font-bold transition-all shrink-0 flex items-center gap-1 active:scale-95"
                >
                  <span>{getActionLabel(task.category)}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
