import React, { useState } from 'react';
import { 
  FileCheck, 
  Sparkles, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  BarChart3, 
  Award,
  BookOpen
} from 'lucide-react';
import { EssayFeedback } from '../types';
import { AIService } from '../services/aiService';
import { DBService } from '../services/dbService';

interface EssayGraderViewProps {
  userId: string;
  onBack?: () => void;
}

export const EssayGraderView: React.FC<EssayGraderViewProps> = ({ userId, onBack }) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('English Literature');
  const [assignmentType, setAssignmentType] = useState('Argumentative Essay');
  const [essayContent, setEssayContent] = useState('');
  const [rubric, setRubric] = useState('Standard collegiate academic rubric');
  const [feedback, setFeedback] = useState<EssayFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!essayContent.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const result = await AIService.gradeEssay({
        essayTitle: title || 'Academic Essay Draft',
        essayContent,
        subject,
        assignmentType,
        rubric
      });

      const fullFeedback: EssayFeedback = {
        ...result,
        id: 'essay_' + Date.now(),
        userId,
        createdAt: Date.now()
      };

      await DBService.saveEssay(fullFeedback);
      setFeedback(fullFeedback);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to grade essay. Please check internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-y-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 font-serif">Academic Essay Grader &amp; Rubric Feedback</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Constructive analysis of structure, thesis, evidence &amp; clarity</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 sm:p-8 w-full flex-1">
        {!feedback ? (
          <form onSubmit={handleGrade} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-5">
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Essay Title</label>
                <input
                  type="text"
                  placeholder="e.g. The Paradox of AI Autonomy"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject Area</label>
                <input
                  type="text"
                  placeholder="e.g. Philosophy, Law, History"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Assignment Type</label>
                <select
                  value={assignmentType}
                  onChange={(e) => setAssignmentType(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option>Argumentative Essay</option>
                  <option>Research Paper</option>
                  <option>Literary Analysis</option>
                  <option>Case Study</option>
                  <option>Expository Essay</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Paste Essay Content *</label>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">Word count: {essayContent.trim() ? essayContent.trim().split(/\s+/).length : 0}</span>
              </div>
              <textarea
                rows={12}
                required
                value={essayContent}
                onChange={(e) => setEssayContent(e.target.value)}
                placeholder="Paste your essay draft here. Learnora will evaluate thesis alignment, evidentiary depth, tone, and grammar..."
                className="w-full p-4 text-xs font-mono border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
              ></textarea>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span><strong>Note:</strong> Learnora provides formative feedback to help you revise; this is not an official academic grade.</span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading || !essayContent.trim()}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 disabled:opacity-40 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Evaluate &amp; Grade Essay</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Feedback Results */
          <div className="space-y-6 animate-fade-in">
            {/* Top score banner */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100/60 dark:border-indigo-800/60 px-2.5 py-0.5 rounded">
                  Evaluation Report
                </span>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-serif mt-2">{feedback.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{feedback.subject} • {feedback.assignmentType}</p>
              </div>

              <div className="flex items-center gap-4 bg-indigo-50/70 dark:bg-indigo-950/60 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/60">
                <div className="text-center">
                  <span className="text-4xl font-bold text-indigo-700 dark:text-indigo-300 font-serif">{feedback.estimatedScore}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">/ {feedback.maxScore} Est. Score</span>
                </div>
              </div>
            </div>

            {/* Rubric Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: 'Structure', score: feedback.structureScore },
                { label: 'Argument', score: feedback.argumentScore },
                { label: 'Clarity', score: feedback.clarityScore },
                { label: 'Evidence', score: feedback.evidenceScore },
                { label: 'Grammar', score: feedback.grammarScore }
              ].map((m, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{m.label}</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-slate-100 block mt-1">{m.score}%</span>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                    <div className="bg-indigo-600 h-full" style={{ width: `${m.score}%` }}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Strengths & Areas to improve */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-sm text-emerald-800 dark:text-emerald-400 flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Key Strengths</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  {feedback.strengths.map((str, i) => (
                    <li key={i} className="flex items-start gap-2 bg-emerald-50/50 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/60">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-sm text-amber-800 dark:text-amber-400 flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Areas to Refine</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  {feedback.areasToImprove.map((area, i) => (
                    <li key={i} className="flex items-start gap-2 bg-amber-50/50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-100 dark:border-amber-900/60">
                      <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Detailed Written Feedback */}
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 font-serif">Academic Overview &amp; Suggested Revision</h4>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-line border border-slate-200 dark:border-slate-700">
                {feedback.feedbackSummary}
              </div>
              <div className="pt-2">
                <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Actionable Revision Plan</h5>
                <p className="text-xs text-slate-700 dark:text-slate-300 bg-indigo-50/40 dark:bg-indigo-950/40 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/60 leading-relaxed">
                  {feedback.suggestedRevision}
                </p>
              </div>
            </div>

            <div className="flex justify-center pb-8">
              <button
                onClick={() => setFeedback(null)}
                className="px-6 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 text-xs font-semibold active:scale-95 transition-all"
              >
                Grade Another Draft
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
