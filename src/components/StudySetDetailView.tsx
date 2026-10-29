import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Layers, 
  HelpCircle, 
  BrainCircuit, 
  Calendar, 
  Headphones, 
  Video, 
  ArrowLeft, 
  ExternalLink, 
  Check, 
  Clock, 
  Sparkles,
  Download,
  Share2,
  Trash2,
  ChevronRight,
  BookOpen,
  MessageSquare,
  Award,
  ShieldCheck,
  CheckCircle2,
  Lock,
  QrCode
} from 'lucide-react';
import { StudySet, StudyNote, Flashcard, Quiz } from '../types';
import { DBService } from '../services/dbService';
import { AIService } from '../services/aiService';
import { AiRobotMascot } from './AiRobotMascot';
import { ConfettiService } from '../services/confettiService';

interface StudySetDetailViewProps {
  studySet: StudySet;
  onBack: () => void;
  onOpenTutor: (studySet: StudySet) => void;
  onOpenFlashcards: (studySet: StudySet) => void;
  onOpenQuiz: (studySet: StudySet) => void;
  onOpenAudio: (studySet: StudySet) => void;
  onOpenExplainer: (studySet: StudySet) => void;
  onDeleteStudySet?: (studySet: StudySet) => void;
  onOpenCertificates?: () => void;
}

export const StudySetDetailView: React.FC<StudySetDetailViewProps> = ({
  studySet,
  onBack,
  onOpenTutor,
  onOpenFlashcards,
  onOpenQuiz,
  onOpenAudio,
  onOpenExplainer,
  onDeleteStudySet,
  onOpenCertificates
}) => {
  const [activeTab, setActiveTab] = useState<'notes' | 'flashcards' | 'quiz' | 'sources' | 'certificate'>('notes');
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingMore, setGeneratingMore] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<string | null>(null);
  const [isCertWaitlistJoined, setIsCertWaitlistJoined] = useState<boolean>(() => {
    return localStorage.getItem(`learnora_cert_waitlist_${studySet.id}`) === 'true';
  });
  const [certToast, setCertToast] = useState<string | null>(null);

  useEffect(() => {
    loadMaterials();
  }, [studySet.id]);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const [fetchedNotes, fetchedCards, fetchedQuizzes] = await Promise.all([
        DBService.getNotes(studySet.id),
        DBService.getFlashcards(studySet.id),
        DBService.getQuizzes(studySet.id)
      ]);
      setNotes(fetchedNotes);
      setFlashcards(fetchedCards);
      setQuizzes(fetchedQuizzes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const currentNote = notes[0];

  const handleExportNotes = () => {
    if (!currentNote) return;
    const textData = `# ${currentNote.title}\n\n${currentNote.summary}\n\n` + 
      currentNote.sections.map(s => `## ${s.heading}\n${s.content}\n${s.keyTerms ? s.keyTerms.map(t => `- ${t.term}: ${t.definition}`).join('\n') : ''}`).join('\n\n');
    
    const blob = new Blob([textData], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${studySet.title.replace(/\s+/g, '_')}_Notes.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-y-auto">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3.5 sm:px-8 py-3.5 sm:py-5 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <button 
              onClick={onBack}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 mt-0.5 sm:mt-0"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/60 shrink-0">
                  {studySet.subject || 'General'}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-400 shrink-0">
                  Updated {new Date(studySet.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <h1 className="text-base sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-serif mt-1 break-words [overflow-wrap:anywhere] line-clamp-2 sm:line-clamp-none leading-snug">
                {studySet.title}
              </h1>
            </div>
          </div>

          {/* Quick Study Actions */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0 touch-pan-x">
            <button
              onClick={() => onOpenTutor(studySet)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 transition-all shrink-0 whitespace-nowrap"
            >
              <BrainCircuit className="w-4 h-4" />
              <span>Ask Nora</span>
            </button>
            <button
              onClick={() => onOpenFlashcards(studySet)}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0 whitespace-nowrap"
            >
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Review Cards ({flashcards.length})</span>
            </button>
            <button
              onClick={() => onOpenQuiz(studySet)}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0 whitespace-nowrap"
            >
              <HelpCircle className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <span>Take Quiz</span>
            </button>
            <button
              onClick={() => onOpenAudio(studySet)}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0 whitespace-nowrap"
              title="Listen to Audio Lesson"
            >
              <Headphones className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Audio</span>
            </button>
            <button
              onClick={() => onOpenExplainer(studySet)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-50 to-amber-50 dark:from-rose-950/40 dark:to-amber-950/40 hover:from-rose-100 hover:to-amber-100 dark:hover:from-rose-900/50 dark:hover:to-amber-900/50 border border-rose-200/80 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-all shrink-0 whitespace-nowrap active:scale-95"
              title="Open StudyFetch-Style AI Explainer Video"
            >
              <Video className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Explainer Video</span>
              <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white text-[9px] font-bold uppercase">AI</span>
            </button>

            {onDeleteStudySet && (
              <button
                onClick={() => onDeleteStudySet(studySet)}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-slate-200 dark:border-slate-700 transition-colors shrink-0"
                title="Delete this Study Set"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Strip - Horizontally scrollable on mobile without wrapping */}
        <div className="max-w-6xl mx-auto flex items-center gap-4 sm:gap-6 mt-3 sm:mt-4 border-t border-slate-100 dark:border-slate-800 pt-2.5 sm:pt-3 text-xs font-semibold text-slate-600 dark:text-slate-400 overflow-x-auto no-scrollbar whitespace-nowrap">
          <button
            onClick={() => setActiveTab('notes')}
            className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'notes' ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 font-bold' : 'border-transparent hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>AI Notes</span>
          </button>
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'flashcards' ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 font-bold' : 'border-transparent hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Flashcards ({flashcards.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'quiz' ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 font-bold' : 'border-transparent hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span>Quizzes</span>
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'sources' ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 font-bold' : 'border-transparent hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>Source Materials ({studySet.materials?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('certificate')}
            className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'certificate' ? 'border-amber-500 text-amber-700 dark:text-amber-400 font-bold' : 'border-transparent hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Award className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Certificate</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
              Coming Soon
            </span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="max-w-6xl mx-auto px-3.5 sm:px-8 py-5 sm:py-6 w-full flex-1 pb-28 sm:pb-12">
        {/* Toast for Certificate Waitlist */}
        {certToast && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-fade-in border border-white/10 dark:border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
            <span>{certToast}</span>
          </div>
        )}

        {/* Dedicated "Ask Nora" Interactive Card for this Uploaded Document */}
        <div 
          onClick={() => onOpenTutor(studySet)}
          className="mb-6 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 text-white shadow-lg shadow-indigo-600/20 hover:shadow-xl transition-all cursor-pointer group border border-indigo-400/30 overflow-hidden relative"
        >
          {/* Ambient background decoration */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top Row: Mascot + Badges */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/15">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform overflow-hidden">
                <AiRobotMascot variant="face" size={28} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white shadow-2xs">
                    Ask Nora AI Tutor
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-100 bg-indigo-900/40 px-2 py-0.5 rounded-full border border-white/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>PDF Grounded</span>
                  </span>
                </div>
              </div>
            </div>

            <span className="text-[11px] text-indigo-200 font-semibold hidden xs:inline shrink-0">
              Socratic 1-on-1
            </span>
          </div>

          {/* Middle Body: Headline + Explanatory Text with Clean Break-all */}
          <div className="pt-3.5 pb-3">
            <h3 className="font-bold text-sm sm:text-base text-white leading-snug break-words [overflow-wrap:anywhere]">
              Have questions about this uploaded material?
            </h3>
            <p className="text-xs text-indigo-100/90 mt-1 leading-relaxed break-words [overflow-wrap:anywhere]">
              Nora is fully grounded in <strong className="text-white font-semibold underline decoration-white/30 break-words [overflow-wrap:anywhere] break-all">{studySet.title}</strong>. Ask for step-by-step explanations, practice questions, or key exam formulas.
            </p>

            {/* Quick Interactive Study Starters Chips on Mobile */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[
                '💡 Explain core ideas',
                '❓ Quiz my grasp',
                '⚡ Key exam takeaways'
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenTutor(studySet);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 active:scale-95 text-white text-[11px] font-medium border border-white/20 transition-all text-left shadow-2xs whitespace-nowrap"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Action Row: Big responsive button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenTutor(studySet);
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all min-h-[44px]"
            >
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span>Chat with Nora</span>
              <ChevronRight className="w-4 h-4 ml-0.5 text-indigo-500" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-500 font-medium">Loading study materials...</p>
          </div>
        ) : (
          <>
            {/* TAB: NOTES */}
            {activeTab === 'notes' && (
              <div className="space-y-6 animate-fade-in">
                {currentNote ? (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800 gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-100/60 dark:border-indigo-800/60">
                            {currentNote.type} Notes
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-400">
                            Source grounded by Nora
                          </span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-serif mt-2">{currentNote.title}</h2>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleExportNotes}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export Markdown</span>
                        </button>
                      </div>
                    </div>

                    {/* Executive Summary */}
                    {currentNote.summary && (
                      <div className="mt-6 p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5 mb-1.5">
                          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          <span>Executive Summary</span>
                        </h4>
                        <p className="text-sm text-indigo-950 dark:text-indigo-100 leading-relaxed font-sans">{currentNote.summary}</p>
                      </div>
                    )}

                    {/* Structured Sections */}
                    <div className="mt-8 space-y-8">
                      {currentNote.sections.map((section, idx) => (
                        <div key={section.id || idx} className="border-b border-slate-100 dark:border-slate-800 pb-8 last:border-b-0">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-serif mb-3 flex items-center gap-2">
                            <span className="text-sm font-sans font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 w-6 h-6 rounded-md flex items-center justify-center border border-indigo-100/60 dark:border-indigo-800/60">
                              {idx + 1}
                            </span>
                            <span>{section.heading}</span>
                          </h3>

                          <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3 font-sans">
                            <p>{section.content}</p>
                          </div>

                          {/* Key Terms */}
                          {section.keyTerms && section.keyTerms.length > 0 && (
                            <div className="mt-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700">
                              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">Key Vocabulary &amp; Definitions</h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {section.keyTerms.map((term, tIdx) => (
                                  <div key={tIdx} className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <strong className="text-indigo-950 dark:text-indigo-300 block">{term.term}</strong>
                                    <span className="text-slate-600 dark:text-slate-400">{term.definition}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Takeaways / Citations */}
                          {section.citations && section.citations.length > 0 && (
                            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-400">
                              <span>Source Grounding:</span>
                              {section.citations.map((c, cIdx) => (
                                <span 
                                  key={cIdx} 
                                  onClick={() => setSelectedCitation(c.quote || c.sourceName)}
                                  className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded font-mono text-[11px] border border-indigo-100/60 dark:border-indigo-800/60"
                                >
                                  "{c.quote?.slice(0, 40) || c.sourceName}..."
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                    <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">No notes generated yet</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Upload materials to create comprehensive structured notes.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: FLASHCARDS PREVIEW */}
            {activeTab === 'flashcards' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{flashcards.length} Spaced Repetition Flashcards in this study deck</p>
                  <button
                    onClick={() => onOpenFlashcards(studySet)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Launch Flashcard Session</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {flashcards.map((card, idx) => (
                    <div key={card.id || idx} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400 uppercase">{card.type}</span>
                          <span className={`px-2 py-0.5 rounded font-medium ${
                            card.mastery === 'mastered' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}>
                            {card.mastery}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-3 font-serif">{card.front}</h4>
                        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                          <strong className="block text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider mb-1">Answer</strong>
                          {card.back}
                        </div>
                      </div>

                      {card.explanation && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-3 italic">
                          Context: {card.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: QUIZ PREVIEW */}
            {activeTab === 'quiz' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{quizzes[0]?.questions.length || 0} Questions Ready</p>
                  <button
                    onClick={() => onOpenQuiz(studySet)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Start Practice Quiz</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {quizzes[0]?.questions.map((q, idx) => (
                    <div key={q.id || idx} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Q{idx + 1}</span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {q.type.replace('_', ' ')}
                        </span>
                        {q.topic && <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium ml-auto">{q.topic}</span>}
                      </div>
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{q.question}</h4>

                      {q.options && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {q.options.map((opt, oIdx) => (
                            <div 
                              key={oIdx}
                              className={`p-2.5 rounded-lg border text-slate-700 dark:text-slate-300 ${
                                opt === q.correctAnswer 
                                  ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 font-medium text-emerald-950 dark:text-emerald-200' 
                                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: SOURCES */}
            {activeTab === 'sources' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm font-serif">Original Attached Materials</h3>
                <div className="space-y-3">
                  {studySet.materials.map((mat) => (
                    <div key={mat.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-100/60 dark:border-indigo-800/60">
                              {mat.type}
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-400">
                              Uploaded {new Date(mat.uploadedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 mt-2">{mat.name}</h4>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs text-slate-600 dark:text-slate-300 font-mono max-h-40 overflow-y-auto leading-relaxed border border-slate-200 dark:border-slate-700">
                        {mat.content.slice(0, 500)}...
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: CERTIFICATE OF MASTERY (COMING SOON) */}
            {activeTab === 'certificate' && (
              <div className="space-y-6 animate-fade-in">
                {/* Hero Coming Soon Card */}
                <div className="relative rounded-3xl bg-gradient-to-br from-amber-600 via-amber-700 to-indigo-900 text-white p-6 sm:p-8 overflow-hidden shadow-xl shadow-amber-600/20">
                  <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                  <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 rounded-full bg-amber-400/20 blur-xl pointer-events-none" />

                  <div className="relative z-10 max-w-2xl space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-amber-200 text-[11px] font-bold border border-white/20 shadow-xs">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Verified Course Credential · Coming Soon</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                      Certificate of Academic Mastery
                    </h2>

                    <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed font-medium">
                      Earn a cryptographically verified academic certificate upon mastering all flashcards and scoring ≥85% on diagnostic exams for <span className="text-white font-bold">{studySet.title}</span>.
                    </p>

                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const next = !isCertWaitlistJoined;
                          setIsCertWaitlistJoined(next);
                          localStorage.setItem(`learnora_cert_waitlist_${studySet.id}`, String(next));
                          if (next) {
                            ConfettiService.fireGrandCannons();
                            setCertToast("You're on the priority waitlist for this certificate!");
                          } else {
                            setCertToast("Waitlist preference updated.");
                          }
                          setTimeout(() => setCertToast(null), 3500);
                        }}
                        className={`px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer ${
                          isCertWaitlistJoined 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-white text-slate-900 hover:bg-amber-50'
                        }`}
                      >
                        {isCertWaitlistJoined ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-white" />
                            <span>On Priority Waitlist</span>
                          </>
                        ) : (
                          <>
                            <Award className="w-4 h-4 text-amber-600" />
                            <span>Notify Me on Launch</span>
                          </>
                        )}
                      </button>

                      {onOpenCertificates && (
                        <button
                          type="button"
                          onClick={onOpenCertificates}
                          className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white border border-white/25 font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer backdrop-blur-md"
                        >
                          <span>Explore All Certificates</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Realistic Certificate Mockup Preview */}
                <div className="relative rounded-3xl border-4 border-double border-amber-300 dark:border-amber-700/60 bg-gradient-to-br from-amber-50/60 via-white to-amber-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-6 sm:p-10 shadow-lg text-center space-y-6">
                  {/* Watermark / Seal */}
                  <div className="flex items-center justify-between border-b border-amber-200/80 dark:border-amber-900/60 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                        <Award className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-black tracking-wider uppercase text-amber-800 dark:text-amber-400 block">
                          Learnora Academic Board
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Accredited Digital Credential Framework
                        </span>
                      </div>
                    </div>
                    <div className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-200 dark:border-amber-800">
                      Sample Preview
                    </div>
                  </div>

                  <div className="space-y-2 py-4">
                    <span className="text-xs uppercase tracking-widest text-slate-400 font-mono">
                      This is to certify that
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-serif">
                      Student Learner
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
                      has demonstrated verified academic mastery, spaced retrieval proficiency, and cognitive retention in
                    </p>
                    <h4 className="text-lg sm:text-xl font-black text-indigo-700 dark:text-indigo-400 font-serif pt-1">
                      {studySet.title}
                    </h4>
                    <span className="inline-block text-[11px] font-mono text-slate-400">
                      Subject: {studySet.subject || 'General Studies'} · Issue ID: LN-{(studySet.subject || 'STD').substring(0, 3).toUpperCase()}-2026-{studySet.id.substring(0, 5).toUpperCase()}
                    </span>
                  </div>

                  {/* Criteria Checklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-amber-200/80 dark:border-amber-900/60 text-left">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Flashcard Mastery</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Review all {flashcards.length} flashcards with active recall
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Quiz Performance</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Score ≥85% on {quizzes.length || 1} diagnostic practice quizzes
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Socratic Dialogue</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Engage in 1 interactive tutoring session with Nora AI
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Citation Modal / Flyout if clicked */}
      {selectedCitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm font-serif mb-2">Source Material Citation</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 leading-relaxed">
              "{selectedCitation}"
            </p>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedCitation(null)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
