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
  QrCode,
  Printer,
  RefreshCw,
  ChevronLeft,
  XCircle,
  RotateCcw,
  Trophy,
  Play
} from 'lucide-react';
import { StudySet, StudyNote, Flashcard, Quiz, QuizAttempt } from '../types';
import { DBService } from '../services/dbService';
import { AIService } from '../services/aiService';
import { AiRobotMascot } from './AiRobotMascot';
import { ConfettiService } from '../services/confettiService';
import { MultilingualAudioPlayer } from './MultilingualAudioPlayer';

/**
 * Citation Badge styled identically to the user's reference screenshot:
 * Small dark outlined pill with miniature paper icon and page number [📄 X]
 */
export const PageCitationBadge: React.FC<{ 
  page: number | string; 
  onClick?: () => void;
  title?: string;
}> = ({ page, onClick, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title || `Source Citation: Page/Slide ${page} · Click to review source context`}
    className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded text-[11px] font-mono leading-none border border-zinc-700/80 hover:border-indigo-400 bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer align-baseline select-none active:scale-95 shadow-2xs"
  >
    <svg className="w-2.5 h-2.5 text-zinc-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
    <span className="font-semibold">{page}</span>
  </button>
);

/**
 * Parse text and replace inline citations like [📄 2], [Page 2], [2] with PageCitationBadge
 */
export const renderTextWithCitations = (
  text: string,
  extraCitations?: (number | string)[],
  onCitationClick?: (page: string) => void
) => {
  if (!text) return null;

  // Regex matches [📄 2], [Page 2], [p. 2], [2]
  const citationRegex = /\[(?:📄\s*|page\s*|p\.\s*)?(\d+)\]/gi;
  const parts: (string | { page: string })[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const foundPages = new Set<string>();

  while ((match = citationRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const pageNum = match[1];
    foundPages.add(pageNum);
    parts.push({ page: pageNum });
    lastIndex = citationRegex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  // Any extra citationPages not yet in text?
  const remainingCitations = (extraCitations || [])
    .map(p => String(p))
    .filter(p => !foundPages.has(p));

  return (
    <span>
      {parts.map((part, i) => {
        if (typeof part === 'string') {
          return <span key={i}>{part}</span>;
        }
        return (
          <PageCitationBadge
            key={i}
            page={part.page}
            onClick={() => onCitationClick?.(part.page)}
          />
        );
      })}
      {remainingCitations.length > 0 && (
        <span className="inline-flex items-center ml-1">
          {remainingCitations.map((p, idx) => (
            <PageCitationBadge
              key={`extra-${idx}`}
              page={p}
              onClick={() => onCitationClick?.(p)}
            />
          ))}
        </span>
      )}
    </span>
  );
};

/**
 * Parses markdown tables or bulleted definitions in raw text
 */
export const parseMarkdownTablesAndBullets = (content: string) => {
  const lines = content.split('\n');
  const blocks: (
    | { type: 'table'; headers: string[]; rows: string[][] }
    | { type: 'bullet'; term: string; etymology?: string; definition: string }
    | { type: 'text'; text: string }
  )[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    // Check for markdown table
    if (line.startsWith('|') && line.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const rawHeaders = tableLines[0].split('|').map(s => s.trim()).filter(Boolean);
        const contentRows = tableLines.slice(1).filter(r => !/^\s*\|?\s*[-:]+[-| :]*\|?\s*$/.test(r));
        const rows = contentRows.map(r => r.split('|').map(c => c.trim()).filter(Boolean));
        if (rawHeaders.length > 0 && rows.length > 0) {
          blocks.push({ type: 'table', headers: rawHeaders, rows });
          continue;
        }
      }
      tableLines.forEach(l => blocks.push({ type: 'text', text: l }));
      continue;
    }

    // Check for bullet definition e.g. "• Conflict (Latin: confligere): Defined as..."
    const bulletMatch = line.match(/^[-*•]\s*(?:\*\*(.*?)\*\*|(.*?))(?:\s*\((.*?)\))?\s*:\s*(.*)$/);
    if (bulletMatch) {
      const term = (bulletMatch[1] || bulletMatch[2] || '').trim();
      const etymology = bulletMatch[3]?.trim();
      const definition = (bulletMatch[4] || '').trim();
      if (term && definition) {
        blocks.push({ type: 'bullet', term, etymology, definition });
        i++;
        continue;
      }
    }

    if (line) {
      blocks.push({ type: 'text', text: line });
    }
    i++;
  }

  return blocks;
};

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
  const [activeTab, setActiveTab] = useState<'notes' | 'flashcards' | 'quiz' | 'certificate'>('notes');
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingMore, setGeneratingMore] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<{ page?: string | number; quote: string } | null>(null);
  const [isCertWaitlistJoined, setIsCertWaitlistJoined] = useState<boolean>(() => {
    return localStorage.getItem(`learnora_cert_waitlist_${studySet.id}`) === 'true';
  });
  const [certToast, setCertToast] = useState<string | null>(null);

  // Interactive Flashcards Player State
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [flashcardViewMode, setFlashcardViewMode] = useState<'flipper' | 'grid'>('flipper');

  // Interactive Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

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

      // 1. Ensure notes exist
      if (fetchedNotes.length === 0) {
        const sample = AIService.createComprehensiveFallbackNotes(
          studySet.title || 'Peace and Conflict Resolution Fundamentals',
          studySet.materials?.[0]?.content || 'Peace and Conflict Resolution Fundamentals lecture syllabus'
        );
        const initialNote: StudyNote = {
          id: 'note_' + studySet.id,
          studySetId: studySet.id,
          userId: studySet.userId,
          title: `${studySet.title} — Comprehensive Study Notes`,
          type: 'comprehensive',
          sections: sample.sections,
          summary: sample.summary,
          sourceReferences: sample.sourceReferences,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        setNotes([initialNote]);
        DBService.saveNote(initialNote).catch(() => {});
      } else {
        setNotes(fetchedNotes);
      }

      // 2. Ensure flashcards exist
      if (fetchedCards.length === 0) {
        const fallbackCards = AIService.createFallbackFlashcards(
          studySet.title,
          studySet.materials?.[0]?.content || studySet.title,
          8
        );
        const cardsToSave: Flashcard[] = fallbackCards.map((c, i) => ({
          ...c,
          id: `card_${studySet.id}_${i}`,
          studySetId: studySet.id,
          userId: studySet.userId,
          createdAt: Date.now()
        }));
        setFlashcards(cardsToSave);
        cardsToSave.forEach(c => DBService.saveFlashcard(c).catch(() => {}));
      } else {
        setFlashcards(fetchedCards);
      }

      // 3. Ensure quiz exists
      if (fetchedQuizzes.length === 0) {
        const fallbackQuestions = AIService.createFallbackQuizQuestions(
          studySet.title,
          studySet.materials?.[0]?.content || studySet.title,
          5
        );
        const quizDoc: Quiz = {
          id: `quiz_${studySet.id}`,
          studySetId: studySet.id,
          userId: studySet.userId,
          title: `${studySet.title} — Diagnostic Quiz`,
          questions: fallbackQuestions,
          difficulty: 'medium',
          createdAt: Date.now()
        };
        setQuizzes([quizDoc]);
        DBService.saveQuiz(quizDoc).catch(() => {});
      } else {
        setQuizzes(fetchedQuizzes);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const currentNote = notes[0];

  const handleExportNotes = () => {
    if (!currentNote) return;
    let textData = `# ${currentNote.title}\n\n`;
    if (currentNote.summary) {
      textData += `> ${currentNote.summary}\n\n`;
    }
    for (const section of currentNote.sections) {
      textData += `## ${section.heading}\n\n`;
      if (section.intro) {
        textData += `${section.intro}\n\n`;
      }
      if (section.bulletConcepts && section.bulletConcepts.length > 0) {
        for (const c of section.bulletConcepts) {
          const etym = c.etymology ? ` (${c.etymology})` : '';
          const cit = c.citationPages && c.citationPages.length > 0 ? ` [📄 ${c.citationPages.join(', ')}]` : '';
          textData += `• **${c.term}**${etym}: ${c.definition}${cit} .\n`;
        }
        textData += '\n';
      }
      if (section.tables && section.tables.length > 0) {
        for (const tbl of section.tables) {
          if (tbl.title) textData += `### ${tbl.title}\n\n`;
          if (tbl.intro) textData += `${tbl.intro}\n\n`;
          textData += `| ${tbl.headers.join(' | ')} |\n`;
          textData += `| ${tbl.headers.map(() => '---').join(' | ')} |\n`;
          for (const row of tbl.rows) {
            const cit = row.citationPages && row.citationPages.length > 0 ? ` [📄 ${row.citationPages.join(', ')}]` : '';
            textData += `| ${row.cells[0]} | ${row.cells.slice(1).join(' | ')}${cit} |\n`;
          }
          textData += '\n';
        }
      }
      if (section.content) {
        textData += `${section.content}\n\n`;
      }
      if (section.keyTerms && section.keyTerms.length > 0 && (!section.bulletConcepts || section.bulletConcepts.length === 0)) {
        for (const t of section.keyTerms) {
          textData += `• **${t.term}**: ${t.definition}\n`;
        }
        textData += '\n';
      }
    }
    
    const blob = new Blob([textData], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${studySet.title.replace(/\s+/g, '_')}_Detailed_Notes.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Flashcard Actions
  const currentCard = flashcards[activeCardIndex];

  const handleNextCard = () => {
    if (activeCardIndex < flashcards.length - 1) {
      setActiveCardIndex(prev => prev + 1);
      setIsCardFlipped(false);
    }
  };

  const handlePrevCard = () => {
    if (activeCardIndex > 0) {
      setActiveCardIndex(prev => prev - 1);
      setIsCardFlipped(false);
    }
  };

  const handleFlipCard = () => {
    setIsCardFlipped(prev => !prev);
  };

  const handleCardMastery = async (cardId: string, status: 'learning' | 'mastered') => {
    const updated = flashcards.map(c => {
      if (c.id === cardId) {
        return {
          ...c,
          mastery: status,
          timesReviewed: (c.timesReviewed || 0) + 1,
          timesCorrect: status === 'mastered' ? (c.timesCorrect || 0) + 1 : (c.timesCorrect || 0),
          timesMissed: status === 'learning' ? (c.timesMissed || 0) + 1 : (c.timesMissed || 0),
        };
      }
      return c;
    });
    setFlashcards(updated);
    const target = updated.find(c => c.id === cardId);
    if (target) {
      DBService.saveFlashcard(target).catch(() => {});
    }
    if (status === 'mastered') {
      ConfettiService.fireCelebration();
    }
    // Auto advance smoothly
    if (activeCardIndex < flashcards.length - 1) {
      setTimeout(() => {
        setActiveCardIndex(prev => prev + 1);
        setIsCardFlipped(false);
      }, 300);
    }
  };

  // Quiz Actions
  const currentQuiz = quizzes[0];
  const quizQuestions = currentQuiz?.questions || [];

  const handleSelectQuizAnswer = (qIndex: number, option: string) => {
    if (quizSubmitted) return;
    setQuizAnswers(prev => ({
      ...prev,
      [qIndex]: option
    }));
  };

  const handleSubmitQuiz = async () => {
    if (quizQuestions.length === 0) return;
    let score = 0;
    quizQuestions.forEach((q, idx) => {
      const selected = quizAnswers[idx];
      if (selected !== undefined && String(selected).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()) {
        score++;
      }
    });

    setQuizScore(score);
    setQuizSubmitted(true);

    const accuracy = Math.round((score / quizQuestions.length) * 100);
    if (accuracy >= 70) {
      ConfettiService.fireCelebration();
    }

    const attempt: QuizAttempt = {
      id: `attempt_${Date.now()}`,
      quizId: currentQuiz?.id || `quiz_${studySet.id}`,
      studySetId: studySet.id,
      userId: studySet.userId,
      answers: quizAnswers,
      score,
      totalQuestions: quizQuestions.length,
      accuracy,
      weakTopics: [],
      strongTopics: [],
      recommendedRevision: accuracy < 70 ? 'Review core definitions and escalation stages' : 'Excellent mastery of course concepts',
      completedAt: Date.now()
    };

    try {
      await DBService.saveQuizAttempt(attempt);
    } catch (e) {
      console.warn('Error saving quiz attempt:', e);
    }
  };

  const handleRetakeQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
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
            <span>Practice Quiz ({quizzes[0]?.questions?.length || 0})</span>
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
                  <div className="rounded-2xl sm:rounded-3xl border border-zinc-800/90 bg-[#121215] text-[#ededed] shadow-2xl p-5 sm:p-8">
                    {/* Top Reader Header Bar (Exact match to reference screenshot: Title on left, Chat pill on right) */}
                    <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 gap-3">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base sm:text-xl font-bold font-serif text-white tracking-tight truncate" title={currentNote.title || studySet.title}>
                          {studySet.title || currentNote.title.replace(/—\s*Study Notes$/i, '').trim()}
                        </h2>
                      </div>
                      
                      {/* Pill "Chat" button right at top (Matches Screenshot) */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onOpenTutor(studySet)}
                          className="px-4 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-750 active:scale-95 text-zinc-100 hover:text-white border border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                          title="Open Socratic AI Chat grounded in this document"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Chat</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleExportNotes}
                          className="px-3 py-1.5 rounded-full bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-750 text-xs font-medium items-center gap-1.5 transition-colors hidden sm:inline-flex cursor-pointer"
                          title="Export detailed notes as Markdown"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export</span>
                        </button>
                      </div>
                    </div>

                    {/* Multilingual Gemini TTS Audio Player with Language Dropdown (English, Yoruba, Igbo, Hausa, French) */}
                    <div className="mt-5">
                      <MultilingualAudioPlayer
                        lessonTitle={studySet.title || currentNote.title}
                        textKey={`note_${currentNote.id}`}
                        textToRead={[
                          currentNote.summary ? `Executive Summary: ${currentNote.summary}.` : '',
                          ...currentNote.sections.map(s => {
                            const bulletTexts = s.bulletConcepts?.map(b => `${b.term}: ${b.definition}`).join('. ') || '';
                            const takeaways = s.keyTakeaways?.join('. ') || '';
                            return `${s.heading}. ${s.intro || ''}. ${bulletTexts}. ${takeaways}. ${s.content || ''}`;
                          })
                        ].filter(Boolean).join(' ')}
                      />
                    </div>

                    {/* Executive Summary */}
                    {currentNote.summary && (
                      <div className="mt-5 p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 mb-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Executive Summary</span>
                        </h4>
                        <p className="text-sm leading-relaxed font-sans">{currentNote.summary}</p>
                      </div>
                    )}

                    {/* Detailed Academic Sections */}
                    <div className="mt-7 space-y-9">
                      {currentNote.sections.map((section, idx) => (
                        <div key={section.id || idx} className="border-b border-zinc-800/80 pb-8 last:border-b-0">
                          {/* Section Heading */}
                          <h3 className="text-lg sm:text-xl font-bold text-white font-serif tracking-tight mb-2 flex items-center gap-2">
                            <span>{section.heading}</span>
                          </h3>

                          {/* Section Intro Sentence */}
                          {section.intro && (
                            <p className="text-sm text-zinc-300 mb-3 leading-relaxed">
                              {section.intro}
                            </p>
                          )}

                          {/* Bulleted Core Concepts (Exact match to screenshot) */}
                          {section.bulletConcepts && section.bulletConcepts.length > 0 && (
                            <div className="space-y-3.5 my-4">
                              {section.bulletConcepts.map((concept, cIdx) => (
                                <div key={cIdx} className="flex items-start gap-2.5 text-sm leading-relaxed text-zinc-300">
                                  <span className="text-zinc-400 select-none text-base leading-tight mt-0.5">•</span>
                                  <div className="flex-1">
                                    <strong className="text-white font-bold text-[14.5px]">{concept.term}</strong>
                                    {concept.etymology && (
                                      <span className="text-zinc-400 italic text-sm ml-1 font-serif">
                                        ({concept.etymology})
                                      </span>
                                    )}
                                    <span className="text-zinc-200 font-semibold">: </span>
                                    <span className="text-zinc-300">
                                      {renderTextWithCitations(
                                        concept.definition,
                                        concept.citationPages,
                                        (page) => setSelectedCitation({ page, quote: `${concept.term}: ${concept.definition}` })
                                      )}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Structured Process/Stages Tables (Exact match to screenshot) */}
                          {section.tables && section.tables.map((table, tIdx) => (
                            <div key={tIdx} className="my-5">
                              {table.title && table.title !== section.heading && (
                                <h4 className="text-sm sm:text-base font-bold text-white font-serif mb-1.5">
                                  {table.title}
                                </h4>
                              )}
                              {table.intro && table.intro !== section.intro && (
                                <p className="text-xs sm:text-sm text-zinc-300 mb-2.5 leading-relaxed">
                                  {table.intro}
                                </p>
                              )}
                              <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-[#16161a] shadow-sm">
                                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                                  <thead>
                                    <tr className="bg-[#242429] border-b border-zinc-700/80 text-zinc-200">
                                      {table.headers.map((h, hIdx) => (
                                        <th
                                          key={hIdx}
                                          className={`py-3 px-4 font-bold text-xs uppercase tracking-wider text-zinc-200 ${
                                            hIdx < table.headers.length - 1 ? 'border-r border-zinc-700/80' : ''
                                          } ${hIdx === 0 ? 'w-2/5 sm:w-1/3' : ''}`}
                                        >
                                          {h}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-zinc-800">
                                    {table.rows.map((row, rIdx) => (
                                      <tr
                                        key={rIdx}
                                        className="hover:bg-zinc-800/40 transition-colors"
                                      >
                                        {row.cells.map((cell, cIdx) => (
                                          <td
                                            key={cIdx}
                                            className={`py-3.5 px-4 align-top leading-relaxed ${
                                              cIdx === 0
                                                ? 'font-bold text-white border-r border-zinc-800'
                                                : 'text-zinc-300'
                                            }`}
                                          >
                                            {cIdx === 0 ? (
                                              cell
                                            ) : (
                                              renderTextWithCitations(
                                                cell,
                                                row.citationPages,
                                                (page) => setSelectedCitation({ page, quote: `${row.cells[0]}: ${cell}` })
                                              )
                                            )}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ))}

                          {/* Fallback rendering of section.keyTerms if bulletConcepts was empty */}
                          {(!section.bulletConcepts || section.bulletConcepts.length === 0) && section.keyTerms && section.keyTerms.length > 0 && (
                            <div className="space-y-3.5 my-4">
                              {section.keyTerms.map((term, tIdx) => (
                                <div key={tIdx} className="flex items-start gap-2.5 text-sm leading-relaxed text-zinc-300">
                                  <span className="text-zinc-400 select-none text-base leading-tight mt-0.5">•</span>
                                  <div className="flex-1">
                                    <strong className="text-white font-bold text-[14.5px]">{term.term}</strong>
                                    {term.etymology && (
                                      <span className="text-zinc-400 italic text-sm ml-1 font-serif">
                                        ({term.etymology})
                                      </span>
                                    )}
                                    <span className="text-zinc-200 font-semibold">: </span>
                                    <span className="text-zinc-300">
                                      {renderTextWithCitations(
                                        term.definition,
                                        term.citationPages,
                                        (page) => setSelectedCitation({ page, quote: `${term.term}: ${term.definition}` })
                                      )}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Narrative content (parsed for markdown tables/bullets if present) */}
                          {section.content && (
                            <div className="text-sm text-zinc-300 leading-relaxed space-y-3 font-sans mt-3">
                              {parseMarkdownTablesAndBullets(section.content).map((block, bIdx) => {
                                if (block.type === 'table') {
                                  return (
                                    <div key={bIdx} className="my-4 overflow-x-auto rounded-xl border border-zinc-800 bg-[#16161a]">
                                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                                        <thead>
                                          <tr className="bg-[#242429] border-b border-zinc-700/80 text-zinc-200">
                                            {block.headers.map((h, hIdx) => (
                                              <th key={hIdx} className="py-2.5 px-3.5 font-bold uppercase tracking-wider text-xs">
                                                {h}
                                              </th>
                                            ))}
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-800">
                                          {block.rows.map((row, rIdx) => (
                                            <tr key={rIdx} className="hover:bg-zinc-800/30">
                                              {row.map((cell, cIdx) => (
                                                <td key={cIdx} className={`py-3 px-3.5 ${cIdx === 0 ? 'font-bold text-white' : 'text-zinc-300'}`}>
                                                  {renderTextWithCitations(cell, undefined, (page) => setSelectedCitation({ page, quote: cell }))}
                                                </td>
                                              ))}
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  );
                                }
                                if (block.type === 'bullet') {
                                  return (
                                    <div key={bIdx} className="flex items-start gap-2.5 text-sm leading-relaxed text-zinc-300 my-2">
                                      <span className="text-zinc-400 select-none text-base leading-tight mt-0.5">•</span>
                                      <div className="flex-1">
                                        <strong className="text-white font-bold">{block.term}</strong>
                                        {block.etymology && (
                                          <span className="text-zinc-400 italic text-sm ml-1 font-serif">
                                            ({block.etymology})
                                          </span>
                                        )}
                                        <span className="text-zinc-200 font-semibold">: </span>
                                        <span>
                                          {renderTextWithCitations(block.definition, undefined, (page) => setSelectedCitation({ page, quote: block.definition }))}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                }
                                return (
                                  <p key={bIdx}>
                                    {renderTextWithCitations(block.text, undefined, (page) => setSelectedCitation({ page, quote: block.text }))}
                                  </p>
                                );
                              })}
                            </div>
                          )}

                          {/* High-yield takeaways if present */}
                          {section.keyTakeaways && section.keyTakeaways.length > 0 && (
                            <div className="mt-4 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300">
                              <h5 className="font-bold uppercase tracking-wider text-amber-400 text-[11px] mb-1.5 flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3 text-amber-400" />
                                <span>High-Yield Exam Takeaway</span>
                              </h5>
                              <ul className="list-disc list-inside space-y-1 text-zinc-300">
                                {section.keyTakeaways.map((takeaway, tkIdx) => (
                                  <li key={tkIdx}>{takeaway}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Empty state with instant generator */
                  <div className="bg-[#121215] text-[#ededed] p-10 sm:p-14 rounded-3xl border border-zinc-800 text-center space-y-4">
                    <FileText className="w-12 h-12 text-zinc-500 mx-auto" />
                    <div>
                      <h3 className="font-bold text-lg text-white">Generate Structured Study Notes</h3>
                      <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                        Extract comprehensive bulleted concepts, etymological roots, process tables, and slide/page citations for {studySet.title}.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={generatingMore}
                      onClick={async () => {
                        setGeneratingMore(true);
                        try {
                          const result = await AIService.generateNotes({
                            materialTitle: studySet.title,
                            materialContent: studySet.materials?.[0]?.content || studySet.title,
                            noteType: 'comprehensive'
                          });
                          const newNote: StudyNote = {
                            id: 'note_' + Date.now(),
                            studySetId: studySet.id,
                            userId: studySet.userId,
                            title: `${studySet.title} — Detailed Notes`,
                            type: 'comprehensive',
                            sections: result.sections,
                            summary: result.summary,
                            sourceReferences: result.sourceReferences,
                            createdAt: Date.now(),
                            updatedAt: Date.now()
                          };
                          setNotes([newNote]);
                          await DBService.saveNote(newNote);
                        } catch (e) {
                          console.error(e);
                        } finally {
                          setGeneratingMore(false);
                        }
                      }}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs inline-flex items-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
                    >
                      {generatingMore ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Generating Detailed Notes...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Generate Detailed Study Set</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB: FLASHCARDS INTERACTIVE DECK & FLIPPER */}
            {activeTab === 'flashcards' && (
              <div className="space-y-5 animate-fade-in">
                {/* Header Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-serif">
                        Spaced Repetition Flashcards
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/60">
                        {flashcards.length} Cards
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {flashcards.filter(c => c.mastery === 'mastered').length} of {flashcards.length} cards mastered ({Math.round(flashcards.length > 0 ? (flashcards.filter(c => c.mastery === 'mastered').length / flashcards.length) * 100 : 0)}%)
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => setFlashcardViewMode('flipper')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          flashcardViewMode === 'flipper'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        Card Player
                      </button>
                      <button
                        onClick={() => setFlashcardViewMode('grid')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          flashcardViewMode === 'grid'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        Deck Grid ({flashcards.length})
                      </button>
                    </div>

                    <button
                      onClick={() => onOpenFlashcards(studySet)}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0"
                    >
                      <Layers className="w-4 h-4" />
                      <span className="hidden sm:inline">Launch Fullscreen</span>
                    </button>
                  </div>
                </div>

                {flashcards.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
                    <Layers className="w-10 h-10 text-indigo-500 mx-auto" />
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">No Flashcards Yet</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Generate key exam flashcards extracted directly from your study material.
                    </p>
                    <button
                      onClick={async () => {
                        const fallbackCards = AIService.createFallbackFlashcards(studySet.title, studySet.materials?.[0]?.content || studySet.title, 8);
                        const cardsToSave: Flashcard[] = fallbackCards.map((c, i) => ({
                          ...c,
                          id: `card_${studySet.id}_${i}`,
                          studySetId: studySet.id,
                          userId: studySet.userId,
                          createdAt: Date.now()
                        }));
                        setFlashcards(cardsToSave);
                        cardsToSave.forEach(c => DBService.saveFlashcard(c).catch(() => {}));
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs cursor-pointer shadow-sm"
                    >
                      Generate Flashcards Deck
                    </button>
                  </div>
                ) : flashcardViewMode === 'flipper' && currentCard ? (
                  /* Single Card Interactive Flipper */
                  <div className="max-w-2xl mx-auto space-y-4">
                    {/* Top Card Progress Bar */}
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                      <span>Card {activeCardIndex + 1} of {flashcards.length}</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          currentCard.mastery === 'mastered'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        }`}>
                          {currentCard.mastery === 'mastered' ? '✓ Mastered' : 'Learning'}
                        </span>
                        <span className="font-mono text-[11px] uppercase text-indigo-600 dark:text-indigo-400 font-semibold">
                          {currentCard.type}
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${((activeCardIndex + 1) / flashcards.length) * 100}%` }}
                      />
                    </div>

                    {/* 3D Flip Card */}
                    <div
                      onClick={handleFlipCard}
                      className="min-h-[290px] sm:min-h-[320px] p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 transition-all duration-200 cursor-pointer flex flex-col justify-between select-none relative group"
                    >
                      {/* Top Header of Card */}
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${isCardFlipped ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {isCardFlipped ? 'Answer & Core Meaning' : 'Question / Concept'}
                          </span>
                        </div>
                        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Click to flip</span>
                        </span>
                      </div>

                      {/* Center Content */}
                      <div className="py-6 my-auto text-center">
                        {!isCardFlipped ? (
                          <div className="space-y-3">
                            <h4 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white leading-relaxed">
                              {currentCard.front}
                            </h4>
                            <p className="text-xs text-slate-400 italic">
                              Tap anywhere on this card to check the answer
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3 animate-fade-in">
                            <p className="text-base sm:text-lg text-slate-800 dark:text-slate-100 font-medium leading-relaxed">
                              {currentCard.back}
                            </p>
                            {currentCard.explanation && (
                              <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 text-left">
                                <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block text-[10px] mb-1">
                                  Course Context
                                </span>
                                {currentCard.explanation}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Bottom Footer */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Card {activeCardIndex + 1} of {flashcards.length}</span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {isCardFlipped ? 'Showing Back' : 'Showing Front'}
                        </span>
                      </div>
                    </div>

                    {/* Navigation and Mastery Controls */}
                    <div className="flex items-center justify-between gap-2 pt-2">
                      <button
                        onClick={handlePrevCard}
                        disabled={activeCardIndex === 0}
                        className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Previous</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCardMastery(currentCard.id, 'learning')}
                          className="px-3.5 sm:px-4 py-2.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-all active:scale-95 cursor-pointer shadow-2xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Still Learning</span>
                        </button>
                        <button
                          onClick={() => handleCardMastery(currentCard.id, 'mastered')}
                          className="px-3.5 sm:px-4 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all active:scale-95 cursor-pointer shadow-2xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Mastered (+1)</span>
                        </button>
                      </div>

                      <button
                        onClick={handleNextCard}
                        disabled={activeCardIndex === flashcards.length - 1}
                        className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Grid Deck View */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {flashcards.map((card, idx) => (
                      <div 
                        key={card.id || idx} 
                        className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{card.type}</span>
                            <button
                              onClick={() => handleCardMastery(card.id, card.mastery === 'mastered' ? 'learning' : 'mastered')}
                              className={`px-2 py-0.5 rounded-full font-semibold transition-all cursor-pointer ${
                                card.mastery === 'mastered' 
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {card.mastery === 'mastered' ? '✓ Mastered' : 'Still Learning'}
                            </button>
                          </div>
                          <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 mt-3 font-serif">
                            {card.front}
                          </h4>
                          <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                            <strong className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1">Answer</strong>
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
                )}
              </div>
            )}

            {/* TAB: INTERACTIVE QUIZ WITH ANSWER SELECTION, SUBMISSION & INSTANT SCORING */}
            {activeTab === 'quiz' && (
              <div className="space-y-6 animate-fade-in">
                {quizQuestions.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
                    <HelpCircle className="w-10 h-10 text-indigo-500 mx-auto" />
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">No Quiz Questions Available</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Generate an interactive diagnostic quiz from your course notes.
                    </p>
                    <button
                      onClick={async () => {
                        const fallbackQuestions = AIService.createFallbackQuizQuestions(studySet.title, studySet.materials?.[0]?.content || studySet.title, 5);
                        const quizDoc: Quiz = {
                          id: `quiz_${studySet.id}`,
                          studySetId: studySet.id,
                          userId: studySet.userId,
                          title: `${studySet.title} — Diagnostic Quiz`,
                          questions: fallbackQuestions,
                          difficulty: 'medium',
                          createdAt: Date.now()
                        };
                        setQuizzes([quizDoc]);
                        DBService.saveQuiz(quizDoc).catch(() => {});
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs cursor-pointer shadow-sm"
                    >
                      Generate Diagnostic Quiz
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Quiz Hero Banner / Scoring State */}
                    {quizSubmitted ? (
                      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 border border-indigo-700/50 text-white shadow-xl space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-200 text-xs font-bold border border-white/10">
                              <Trophy className="w-4 h-4 text-amber-400" />
                              <span>Quiz Complete</span>
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-black font-serif tracking-tight mt-1">
                              Your Score: {quizScore} / {quizQuestions.length} ({Math.round((quizScore / quizQuestions.length) * 100)}%)
                            </h3>
                            <p className="text-xs sm:text-sm text-indigo-200 font-medium">
                              {quizScore / quizQuestions.length >= 0.7
                                ? '🎉 Outstanding mastery! You successfully passed this diagnostic quiz.'
                                : '📚 Good effort! Review your incorrect answers and explanations below, then retake to master the subject.'}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={handleRetakeQuiz}
                              className="px-4 py-2.5 rounded-xl bg-white hover:bg-indigo-50 text-indigo-900 font-bold text-xs shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                            >
                              <RotateCcw className="w-4 h-4 text-indigo-600" />
                              <span>Retake Quiz</span>
                            </button>
                            <button
                              onClick={() => setActiveTab('notes')}
                              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs transition-colors cursor-pointer"
                            >
                              Review AI Notes
                            </button>
                          </div>
                        </div>

                        {/* Visual Breakdown Bar */}
                        <div className="pt-2">
                          <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden flex">
                            <div 
                              className="bg-emerald-500 h-full transition-all duration-500"
                              style={{ width: `${(quizScore / quizQuestions.length) * 100}%` }}
                            />
                            <div 
                              className="bg-rose-500/80 h-full transition-all duration-500"
                              style={{ width: `${((quizQuestions.length - quizScore) / quizQuestions.length) * 100}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-indigo-200 mt-2 font-mono">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                              {quizScore} Correct
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                              {quizQuestions.length - quizScore} Incorrect
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-serif">
                              {currentQuiz?.title || 'Interactive Course Quiz'}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/60">
                              {quizQuestions.length} Questions
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Answer each question below and click <strong>Submit Quiz</strong> to calculate your score.
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                            Answered: {Object.keys(quizAnswers).length} / {quizQuestions.length}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Questions Interactive List */}
                    <div className="space-y-4">
                      {quizQuestions.map((q, qIdx) => {
                        const selectedAnswer = quizAnswers[qIdx];
                        const isCorrect = selectedAnswer !== undefined && String(selectedAnswer).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();

                        return (
                          <div
                            key={q.id || qIdx}
                            className={`p-5 sm:p-6 rounded-2xl border transition-all ${
                              quizSubmitted
                                ? isCorrect
                                  ? 'bg-emerald-50/20 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80'
                                  : 'bg-rose-50/20 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/80'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            {/* Question Header */}
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono">
                                  Q{qIdx + 1}
                                </span>
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                  {q.type.replace('_', ' ')}
                                </span>
                                {q.topic && (
                                  <span className="hidden sm:inline text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                                    {q.topic}
                                  </span>
                                )}
                              </div>

                              {quizSubmitted && (
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                                  isCorrect
                                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                    : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                                }`}>
                                  {isCorrect ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Correct (+1 pt)</span>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-3.5 h-3.5" />
                                      <span>Incorrect (0 pts)</span>
                                    </>
                                  )}
                                </span>
                              )}
                            </div>

                            {/* Question Text */}
                            <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-snug">
                              {q.question}
                            </h4>

                            {/* Options Buttons */}
                            {q.options && q.options.length > 0 && (
                              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {q.options.map((opt, oIdx) => {
                                  const optionLetter = String.fromCharCode(65 + oIdx);
                                  const isSelected = selectedAnswer === opt;
                                  const isTheCorrectAnswer = String(opt).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();

                                  let optionStyle = 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:border-indigo-300 dark:hover:border-indigo-600 text-slate-800 dark:text-slate-200';
                                  
                                  if (!quizSubmitted) {
                                    if (isSelected) {
                                      optionStyle = 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-950 dark:text-indigo-100 font-bold ring-2 ring-indigo-500/20';
                                    }
                                  } else {
                                    if (isTheCorrectAnswer) {
                                      optionStyle = 'border-emerald-500 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-100 font-bold ring-2 ring-emerald-500/20';
                                    } else if (isSelected && !isTheCorrectAnswer) {
                                      optionStyle = 'border-rose-500 dark:border-rose-500 bg-rose-50 dark:bg-rose-950/80 text-rose-950 dark:text-rose-100 font-bold ring-2 ring-rose-500/20';
                                    } else {
                                      optionStyle = 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-400 opacity-60';
                                    }
                                  }

                                  return (
                                    <button
                                      key={oIdx}
                                      type="button"
                                      disabled={quizSubmitted}
                                      onClick={() => handleSelectQuizAnswer(qIdx, opt)}
                                      className={`p-3 rounded-xl border text-xs sm:text-sm text-left flex items-start gap-2.5 transition-all cursor-pointer ${optionStyle} ${
                                        quizSubmitted ? 'cursor-default' : 'active:scale-98'
                                      }`}
                                    >
                                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                                        isSelected 
                                          ? 'bg-indigo-600 text-white' 
                                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                      }`}>
                                        {optionLetter}
                                      </span>
                                      <span className="flex-1 leading-snug">{opt}</span>
                                      {quizSubmitted && isTheCorrectAnswer && (
                                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                      )}
                                      {quizSubmitted && isSelected && !isTheCorrectAnswer && (
                                        <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* Explanation when submitted */}
                            {quizSubmitted && (
                              <div className="mt-4 p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 text-[11px] uppercase tracking-wider">
                                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>Explanation</span>
                                </div>
                                <p className="leading-relaxed">{q.explanation}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Bottom Submit Action */}
                    {!quizSubmitted ? (
                      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky bottom-4 z-10">
                        <div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {Object.keys(quizAnswers).length} of {quizQuestions.length} Questions Answered
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Click Submit Quiz when you are finished to calculate your final grade.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleSubmitQuiz}
                          disabled={Object.keys(quizAnswers).length === 0}
                          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Submit Quiz ({Object.keys(quizAnswers).length}/{quizQuestions.length})</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleRetakeQuiz}
                          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Retake Practice Quiz</span>
                        </button>
                      </div>
                    )}
                  </>
                )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#16161a] text-zinc-100 rounded-2xl p-6 max-w-lg w-full border border-zinc-700/80 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                {selectedCitation.page && (
                  <PageCitationBadge page={selectedCitation.page} />
                )}
                <h4 className="font-bold text-sm text-white font-serif">
                  Source Grounded Citation
                </h4>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono truncate max-w-[160px]">
                {studySet.title}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed font-sans">
              <p className="italic text-zinc-200 mb-2">"{selectedCitation.quote}"</p>
              {selectedCitation.page && (
                <div className="flex items-center gap-1.5 text-[11px] text-indigo-400 font-mono mt-2 pt-2 border-t border-zinc-800">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Referenced on Slide / Page {selectedCitation.page} of course material</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedCitation(null);
                  onOpenTutor(studySet);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <BrainCircuit className="w-3.5 h-3.5" />
                <span>Ask Nora about Page {selectedCitation.page || 'Citation'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCitation(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-semibold active:scale-95 transition-colors cursor-pointer"
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
