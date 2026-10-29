import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  TrendingUp, 
  Target, 
  ShieldAlert, 
  CheckCircle2, 
  Zap, 
  Layers, 
  Clock, 
  RefreshCw, 
  Sliders, 
  BookOpen, 
  ArrowRight,
  Activity,
  History
} from 'lucide-react';
import { StudentCognitiveMemory, TeachingEvolutionLog } from '../types';
import { DBService } from '../services/dbService';
import { AIService } from '../services/aiService';

interface NoraCognitiveDashboardProps {
  userId: string;
  studentName: string;
  onClose?: () => void;
}

export const NoraCognitiveDashboard: React.FC<NoraCognitiveDashboardProps> = ({
  userId,
  studentName,
  onClose
}) => {
  const [memory, setMemory] = useState<StudentCognitiveMemory | null>(null);
  const [evolutionLogs, setEvolutionLogs] = useState<TeachingEvolutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [synthesizing, setSynthesizing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadMemoryData();
    }
  }, [userId]);

  const loadMemoryData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [mem, logs] = await Promise.all([
        DBService.getCognitiveMemory(userId),
        DBService.getTeachingEvolutionLogs(userId)
      ]);
      setMemory(mem);
      setEvolutionLogs(logs);
    } catch (e) {
      console.error('Failed to load cognitive memory:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSelfReflection = async () => {
    if (!memory || synthesizing) return;
    setSynthesizing(true);
    try {
      const evolution = await AIService.synthesizeCognitiveEvolution({
        studentName,
        recentLogs: evolutionLogs.slice(0, 10),
        currentMemory: memory
      });

      // Merge and save updated memory
      const updatedMemory: StudentCognitiveMemory = {
        ...memory,
        learnedKnowledgeGaps: Array.from(new Set([...memory.learnedKnowledgeGaps, ...(evolution.newGaps || [])])),
        demonstratedStrengths: Array.from(new Set([...memory.demonstratedStrengths, ...(evolution.resolvedStrengths || [])])),
        preferredExplanations: {
          ...memory.preferredExplanations,
          technicalDepth: evolution.optimalDepth || memory.preferredExplanations.technicalDepth,
          pacingSpeed: evolution.optimalPacing || memory.preferredExplanations.pacingSpeed,
          effectiveHooks: Array.from(new Set([...memory.preferredExplanations.effectiveHooks, ...(evolution.recommendedHooks || [])]))
        },
        noraPedagogicalStrategy: {
          strategyName: evolution.strategyName || memory.noraPedagogicalStrategy.strategyName,
          focusAreas: evolution.focusAreas || memory.noraPedagogicalStrategy.focusAreas,
          recentSelfAdjustment: evolution.recentSelfAdjustment || memory.noraPedagogicalStrategy.recentSelfAdjustment,
          adaptationLevel: Math.min(100, Math.max(memory.noraPedagogicalStrategy.adaptationLevel + 3, evolution.adaptationLevel || memory.noraPedagogicalStrategy.adaptationLevel + 1)),
          totalInteractionsReflected: memory.noraPedagogicalStrategy.totalInteractionsReflected + 1
        },
        lastSelfReflectionAt: Date.now(),
        updatedAt: Date.now()
      };

      await DBService.saveCognitiveMemory(updatedMemory);
      setMemory(updatedMemory);

      // Add a synthesis evolution log
      const newLog: TeachingEvolutionLog = {
        id: 'synth_' + Date.now(),
        userId,
        interactionSummary: 'Periodic Cognitive Synthesis & Metacognitive Calibration',
        studentGraspObserved: 'partially-understood',
        tutorAdjustmentMade: evolution.recentSelfAdjustment,
        timestamp: Date.now()
      };
      await DBService.recordTeachingEvolutionLog(newLog);
      setEvolutionLogs([newLog, ...evolutionLogs]);

      setToastMessage(evolution.evolutionNarrative || 'Nora successfully completed self-reflection and calibrated her teaching strategy.');
      setTimeout(() => setToastMessage(null), 6000);
    } catch (e) {
      console.error('Synthesis failed:', e);
    } finally {
      setSynthesizing(false);
    }
  };

  const removeGap = async (gapToRemove: string) => {
    if (!memory) return;
    const updated: StudentCognitiveMemory = {
      ...memory,
      learnedKnowledgeGaps: memory.learnedKnowledgeGaps.filter(g => g !== gapToRemove),
      demonstratedStrengths: Array.from(new Set([...memory.demonstratedStrengths, gapToRemove])),
      updatedAt: Date.now()
    };
    setMemory(updated);
    await DBService.saveCognitiveMemory(updated);
  };

  if (loading) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Accessing Nora's Cognitive Mind & Memory Model...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 bg-gradient-to-r from-indigo-900 to-violet-900 text-white rounded-2xl shadow-xl border border-indigo-500/30 flex items-start gap-3 animate-fade-in">
          <Sparkles className="w-5 h-5 text-indigo-300 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h5 className="font-bold text-xs uppercase tracking-wider text-indigo-200">Metacognitive Calibration Update</h5>
            <p className="text-xs text-indigo-100 mt-1 leading-relaxed">{toastMessage}</p>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-indigo-300 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* Hero: Adaptation Level & Active Strategy */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-4 sm:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5">
                <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
                <span>Nora Self-Learning Engine</span>
              </span>
              <span className="text-xs text-slate-400">
                Self-Evolving Cognitive Profile
              </span>
            </div>

            <h3 className="text-xl sm:text-3xl font-bold font-serif mt-3 text-white">
              {memory?.noraPedagogicalStrategy.strategyName || 'Dynamic Socratic Mentorship'}
            </h3>

            <p className="text-xs sm:text-sm text-indigo-200/90 mt-2 max-w-xl leading-relaxed">
              <strong>Latest Self-Adjustment:</strong> {memory?.noraPedagogicalStrategy.recentSelfAdjustment || 'Calibrating explanations to match conceptual pacing.'}
            </p>
          </div>

          {/* Evolution Meter */}
          <div className="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/15 w-full md:w-auto md:min-w-[220px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-indigo-200 font-semibold">Tutor Adaptation</span>
              <span className="text-lg font-bold text-white font-mono">
                Level {memory?.noraPedagogicalStrategy.adaptationLevel || 1}/100
              </span>
            </div>

            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden my-3">
              <div 
                className="bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400 h-full transition-all duration-700 rounded-full"
                style={{ width: `${Math.min(100, Math.max(8, memory?.noraPedagogicalStrategy.adaptationLevel || 1))}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-indigo-300">
              <span>{memory?.noraPedagogicalStrategy.totalInteractionsReflected || 0} reflections</span>
              <button
                onClick={handleManualSelfReflection}
                disabled={synthesizing}
                className="hover:text-white flex items-center gap-1 text-[11px] font-semibold text-emerald-300 hover:underline"
                title="Trigger self-reflection on recent interactions"
              >
                <RefreshCw className={`w-3 h-3 ${synthesizing ? 'animate-spin' : ''}`} />
                <span>{synthesizing ? 'Reflecting...' : 'Evolve Now'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Diagnosed Gaps vs Demonstrated Strengths */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identified Knowledge Gaps */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 font-serif">Learned Knowledge Gaps</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Concepts Nora detected you hesitated or stumbled on</p>
                </div>
              </div>
              <span className="text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-full">
                {memory?.learnedKnowledgeGaps?.length || 0}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {memory?.learnedKnowledgeGaps && memory.learnedKnowledgeGaps.length > 0 ? (
                memory.learnedKnowledgeGaps.map((gap, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 bg-rose-50/60 dark:bg-rose-950/40 rounded-xl border border-rose-100/90 dark:border-rose-900/60 text-xs text-rose-950 dark:text-rose-200 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                      <span className="font-medium">{gap}</span>
                    </div>
                    <button
                      onClick={() => removeGap(gap)}
                      className="text-[11px] text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                      title="Mark concept as mastered"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Mastered</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  Nora has not detected any persistent knowledge gaps yet. As you ask questions and complete quizzes, Nora will log areas needing reinforcement.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Nora automatically prioritizes these topics in quizzes & hints.</span>
          </div>
        </div>

        {/* Demonstrated Strengths */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 font-serif">Demonstrated Strengths</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Concepts Nora verified you have firmly grasped</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
                {memory?.demonstratedStrengths?.length || 0}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {memory?.demonstratedStrengths && memory.demonstratedStrengths.length > 0 ? (
                memory.demonstratedStrengths.map((strength, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-xl border border-emerald-100/90 dark:border-emerald-900/60 text-xs text-emerald-950 dark:text-emerald-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                      <span className="font-medium">{strength}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">
                      Verified
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  Demonstrate correct understanding during Socratic checks or complete practice quizzes to build your strengths list.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Nora skips redundant beginner explanations for these topics.</span>
          </div>
        </div>
      </div>

      {/* Explanation Calibration Parameters */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 font-serif mb-1 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Learned Pedagogical Preferences</span>
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Nora automatically calibrates these parameters based on your response comprehension rates.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <span className="text-slate-400 dark:text-slate-400 block text-[11px] uppercase font-semibold mb-1">Technical Depth</span>
            <span className="text-sm font-bold text-indigo-950 dark:text-indigo-200 capitalize">
              {memory?.preferredExplanations.technicalDepth || 'Balanced'}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {memory?.preferredExplanations.technicalDepth === 'rigorous' 
                ? 'Emphasizes formal academic proofs & terminology.'
                : memory?.preferredExplanations.technicalDepth === 'simplified'
                ? 'Focuses on intuitive clarity with minimal jargon.'
                : 'Balanced blend of academic definitions and intuitive intuition.'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <span className="text-slate-400 dark:text-slate-400 block text-[11px] uppercase font-semibold mb-1">Instruction Pacing</span>
            <span className="text-sm font-bold text-indigo-950 dark:text-indigo-200 capitalize">
              {memory?.preferredExplanations.pacingSpeed || 'Standard'}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {memory?.preferredExplanations.pacingSpeed === 'deliberate'
                ? 'Micro-steps with frequent Socratic check-ins.'
                : memory?.preferredExplanations.pacingSpeed === 'accelerated'
                ? 'Concise, high-velocity concept synthesis.'
                : 'Steady pace with periodic understanding checks.'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <span className="text-slate-400 dark:text-slate-400 block text-[11px] uppercase font-semibold mb-1">Effective Hooks &amp; Analogies</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {memory?.preferredExplanations.effectiveHooks && memory.preferredExplanations.effectiveHooks.length > 0 ? (
                memory.preferredExplanations.effectiveHooks.map((hook, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold text-[10px]">
                    {hook}
                  </span>
                ))
              ) : (
                <span className="text-slate-400">Calibrating...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Historical Evolution Timeline */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 font-serif flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Teaching Evolution Activity Log</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Real-time record of pedagogical self-adjustments made by Nora</p>
          </div>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
            {evolutionLogs.length} events logged
          </span>
        </div>

        {evolutionLogs.length > 0 ? (
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {evolutionLogs.map((log) => (
              <div key={log.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      log.studentGraspObserved === 'mastered' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : log.studentGraspObserved === 'struggling'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {log.studentGraspObserved}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{log.interactionSummary}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] pt-1 italic">
                    Adjustment: "{log.tutorAdjustmentMade}"
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            No self-learning adjustments logged yet. Start a conversation with Nora to begin mutual adaptation.
          </div>
        )}
      </div>
    </div>
  );
};
