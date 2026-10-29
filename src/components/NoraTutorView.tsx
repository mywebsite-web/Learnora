import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, 
  Sparkles, 
  BrainCircuit, 
  HelpCircle, 
  BookOpen, 
  Check, 
  CheckCircle2,
  XCircle, 
  Volume2, 
  VolumeX,
  ArrowLeft, 
  ArrowRight,
  Lightbulb, 
  Maximize2, 
  Minimize2, 
  ChevronRight, 
  Flame, 
  Award, 
  Zap, 
  Sliders, 
  TrendingUp, 
  Activity, 
  History,
  RotateCcw,
  Trash2,
  MessageSquare,
  Plus,
  PanelLeftClose,
  PanelLeft,
  Clock,
  X,
  MoreVertical,
  Play,
  Pause,
  Square,
  Gauge,
  Menu,
  Paperclip,
  GraduationCap,
  PanelRight,
  Search,
  Copy,
  CheckCheck,
  Target,
  Sun,
  Moon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudySet, TutorMode, TutorMessage, TeachingStyle, StudentCognitiveMemory, TeachingEvolutionLog, TutorSession } from '../types';
import { AIService } from '../services/aiService';
import { DBService } from '../services/dbService';
import { LearningMemoryService } from '../services/learningMemoryService';
import { NoraCognitiveDashboard } from './NoraCognitiveDashboard';
import { VoiceService } from '../services/voiceService';
import { ElevenLabsVoiceSelector } from './ElevenLabsVoiceSelector';
import { AiRobotMascot } from './AiRobotMascot';
import { useTheme } from '../context/ThemeContext';

// Lightweight, resilient Markdown-to-React text formatter for Nora's academic outputs
const renderInlineFormatted = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={index} className="font-bold text-slate-950 dark:text-slate-100 break-words [overflow-wrap:anywhere]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={index} className="px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono text-[11px] font-semibold border border-blue-200/50 dark:border-blue-800/60 break-all [overflow-wrap:anywhere]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={index} className="italic text-slate-700 dark:text-slate-300 break-words [overflow-wrap:anywhere]">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <span key={index} className="break-words [overflow-wrap:anywhere]">{part}</span>;
  });
};

interface FormattedMessageTextProps {
  content: string;
}

const FormattedMessageText: React.FC<FormattedMessageTextProps> = ({ content }) => {
  const blocks = useMemo(() => {
    if (!content) return [];
    // Normalize newlines and completely strip any unwanted spaces before lines or paragraphs
    const normalized = content
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+\n/g, '\n') // remove trailing spaces before \n
      .replace(/\n[ \t]+/g, '\n') // remove leading spaces before next line/paragraph
      .split('\n')
      .map((line) => {
        if (line.startsWith('```')) return line;
        // Strip leading spaces from standard lines to remove unwanted indentation before lines/paragraphs
        return line.trimStart();
      })
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return normalized.split(/\n\n+/);
  }, [content]);

  return (
    <div className="space-y-2 font-sans break-words [overflow-wrap:anywhere] text-slate-800 dark:text-slate-100 text-xs sm:text-[13px] leading-relaxed">
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Code block
        if (trimmed.startsWith('```') && trimmed.endsWith('```')) {
          const codeLines = trimmed.slice(3, -3).trim().split('\n');
          return (
            <div
              key={bIdx}
              className="my-2 p-3.5 rounded-2xl bg-slate-900 dark:bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto shadow-inner border border-slate-800 dark:border-slate-800"
            >
              <pre>{codeLines.join('\n')}</pre>
            </div>
          );
        }

        // Headings
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={bIdx} className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-2 mb-1 break-words [overflow-wrap:anywhere]">
              {renderInlineFormatted(trimmed.replace(/^###\s+/, ''))}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={bIdx} className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 mt-2.5 mb-1 font-serif break-words [overflow-wrap:anywhere]">
              {renderInlineFormatted(trimmed.replace(/^##\s+/, ''))}
            </h3>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={bIdx} className="font-black text-base text-slate-900 dark:text-slate-100 mt-3 mb-1.5 font-serif break-words [overflow-wrap:anywhere]">
              {renderInlineFormatted(trimmed.replace(/^#\s+/, ''))}
            </h2>
          );
        }

        // Bullet list lines
        const lines = trimmed.split('\n');
        const isBulletList = lines.every((l) => /^[-*•]\s+/.test(l.trim()));
        if (isBulletList) {
          return (
            <ul key={bIdx} className="space-y-1.5 my-1.5 pl-0.5">
              {lines.map((l, lIdx) => {
                const text = l.trim().replace(/^[-*•]\s+/, '');
                return (
                  <li key={lIdx} className="flex items-start gap-2 text-xs sm:text-[13px] leading-relaxed break-words [overflow-wrap:anywhere]">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                    <span className="flex-1 break-words [overflow-wrap:anywhere]">{renderInlineFormatted(text)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Numbered list lines
        const isNumberedList = lines.every((l) => /^\d+[\.\)]\s+/.test(l.trim()));
        if (isNumberedList) {
          return (
            <ol key={bIdx} className="space-y-1.5 my-1.5 pl-0.5">
              {lines.map((l, lIdx) => {
                const match = l.trim().match(/^(\d+)[\.\)]\s+(.*)/);
                const num = match ? match[1] : String(lIdx + 1);
                const text = match ? match[2] : l.trim();
                return (
                  <li key={lIdx} className="flex items-start gap-2 text-xs sm:text-[13px] leading-relaxed break-words [overflow-wrap:anywhere]">
                    <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {num}
                    </span>
                    <span className="flex-1 break-words [overflow-wrap:anywhere]">{renderInlineFormatted(text)}</span>
                  </li>
                );
              })}
            </ol>
          );
        }

        // Normal paragraph: soft line breaks rendered with <br /> instead of separate paragraph margins
        return (
          <p key={bIdx} className="leading-relaxed text-slate-800 dark:text-slate-100 my-1 break-words [overflow-wrap:anywhere]">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {lIdx > 0 && <br />}
                {renderInlineFormatted(line.trim())}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
};

interface TeachingStylePreset {
  id: string;
  name: string;
  shortLabel: string;
  icon: string;
  tagline: string;
  description: string;
}

const DEFAULT_TEACHING_STYLE_PRESETS: TeachingStylePreset[] = [
  {
    id: 'socratic',
    name: 'Socratic & Challenging',
    shortLabel: 'Socratic',
    icon: '🧠',
    tagline: 'Probing Questions & First Principles',
    description: 'Never gives flat answers; asks guided questions that help you derive the answers yourself.'
  },
  {
    id: 'coach',
    name: 'Encouraging Coach',
    shortLabel: 'Coach',
    icon: '🌟',
    tagline: 'Motivational, Warm & Supportive',
    description: 'High energy, celebrates every breakthrough, and keeps your morale and study momentum high.'
  },
  {
    id: 'academic',
    name: 'Academic Professor',
    shortLabel: 'Academic',
    icon: '🎓',
    tagline: 'Rigorous, Structured & Exam-Ready',
    description: 'Concise, intellectually demanding, focused on core syllabi, formal definitions, and exam rigor.'
  },
  {
    id: 'storyteller',
    name: 'Storyteller & Metaphors',
    shortLabel: 'Storyteller',
    icon: '📖',
    tagline: 'Vivid Real-World Analogies',
    description: 'Grounds abstract theories into relatable stories, day-to-day metaphors, and visual mental models.'
  },
  {
    id: 'eli5',
    name: 'Explain Like I\'m 10 (ELI5)',
    shortLabel: 'ELI5 Simple',
    icon: '⚡',
    tagline: 'Zero Jargon, Pure Intuition',
    description: 'Strikes down heavy jargon, explaining complex science or concepts with child-like clarity.'
  }
];

const TUTOR_MODES: {
  mode: TutorMode;
  icon: string;
  label: string;
  desc: string;
}[] = [
  { mode: 'Teach Me', icon: '🎓', label: 'Teach Me', desc: 'Step-by-step master lessons' },
  { mode: 'Quiz Me', icon: '❓', label: 'Quiz Me', desc: 'Interactive concept checks with options' },
  { mode: 'Explain', icon: '💡', label: 'Explain', desc: 'Comprehensive conceptual breakdown' },
  { mode: 'Explain Simply', icon: '⚡', label: 'Simply', desc: 'Intuitive analogies with zero jargon' },
  { mode: 'Go Deeper', icon: '🔍', label: 'Deep Dive', desc: 'Advanced academic rigor & edge cases' }
];

interface NoraTutorViewProps {
  userId: string;
  studentName: string;
  userAvatarUrl?: string;
  studySet?: StudySet | null;
  onBack?: () => void;
  hasBottomDock?: boolean;
  onOpenMobileNav?: () => void;
  onNavigateTab?: (tab: 'home' | 'library' | 'quiz' | 'tutor' | 'flashcards') => void;
  availableStudySets?: StudySet[];
  onSelectStudySet?: (set: StudySet | null) => void;
  onOpenUploadModal?: () => void;
}

export const NoraTutorView: React.FC<NoraTutorViewProps> = ({
  userId,
  studentName,
  userAvatarUrl,
  studySet,
  onBack,
  hasBottomDock = true,
  onOpenMobileNav,
  onNavigateTab,
  availableStudySets = [],
  onSelectStudySet,
  onOpenUploadModal
}) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const [activeMode, setActiveMode] = useState<TutorMode>('Teach Me');
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [teachingStyles, setTeachingStyles] = useState<TeachingStyle[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>('Socratic & Challenging');
  const [speechActive, setSpeechActive] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(VoiceService.getSpeechRate());
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isSpeakingMessageId, setIsSpeakingMessageId] = useState<string | null>(null);
  const [showCognitiveModal, setShowCognitiveModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showStylePickerModal, setShowStylePickerModal] = useState(false);
  const [showMaterialPickerModal, setShowMaterialPickerModal] = useState(false);
  const [styleToast, setStyleToast] = useState<string | null>(null);
  const [cognitiveMemory, setCognitiveMemory] = useState<StudentCognitiveMemory | null>(null);
  const [pendingQuizSelections, setPendingQuizSelections] = useState<Record<string, number>>({});
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    return studySet ? `sess_${studySet.id}` : `sess_general_${userId || 'guest'}`;
  });
  const [sessions, setSessions] = useState<TutorSession[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clearingChat, setClearingChat] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [mobileMenuTab, setMobileMenuTab] = useState<'chats' | 'settings'>('chats');
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string; type: string } | null>(null);

  // Desktop 3-Panel Workspace States (Defaulting to false for clean, spacious, distraction-free chat)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState<boolean>(false);
  const [desktopInspectorOpen, setDesktopInspectorOpen] = useState<boolean>(false);
  const [searchSessionQuery, setSearchSessionQuery] = useState('');
  const [sessionCategoryFilter, setSessionCategoryFilter] = useState<'all' | 'set'>('all');
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const handleCopyMessage = async (msgId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 2000);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (chatScrollContainerRef.current) {
      const container = chatScrollContainerRef.current;
      if (behavior === 'instant') {
        container.scrollTop = container.scrollHeight;
      } else {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  };

  // Ensure window scroll is always pinned to top on mount so header is visible immediately
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    if (typeof document !== 'undefined') {
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    }
    scrollToBottom('instant');
  }, []);

  const displayStudentName = (studentName && studentName.trim()) ? studentName.trim().toUpperCase() : 'SMONEY';

  const currentPreset = useMemo(() => {
    return DEFAULT_TEACHING_STYLE_PRESETS.find(p => p.name === selectedStyle) || DEFAULT_TEACHING_STYLE_PRESETS[0];
  }, [selectedStyle]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (sessionCategoryFilter === 'set' && studySet && s.studySetId !== studySet.id) {
        return false;
      }
      if (searchSessionQuery.trim()) {
        const query = searchSessionQuery.toLowerCase();
        const matchesTitle = s.title.toLowerCase().includes(query);
        const matchesWeak = s.identifiedWeakTopics ? s.identifiedWeakTopics.some(t => t.toLowerCase().includes(query)) : false;
        const matchesMode = s.activeMode ? s.activeMode.toLowerCase().includes(query) : false;
        return matchesTitle || matchesWeak || matchesMode;
      }
      return true;
    });
  }, [sessions, sessionCategoryFilter, studySet, searchSessionQuery]);

  const currentSetSessionsCount = useMemo(() => {
    if (!studySet) return 0;
    return sessions.filter((s) => s.studySetId === studySet.id).length;
  }, [sessions, studySet]);

  const handleSelectTeachingStyle = (styleName: string) => {
    setSelectedStyle(styleName);
    setShowStylePickerModal(false);
    setStyleToast(`Persona updated to ${styleName}`);
    setTimeout(() => setStyleToast(null), 2500);
  };

  const handleSelectStudyMaterial = async (newSet: StudySet | null) => {
    if (onSelectStudySet) {
      onSelectStudySet(newSet);
    }
    setShowMaterialPickerModal(false);
    VoiceService.stop();

    const newSessId = newSet ? `sess_${newSet.id}` : `sess_general_${userId || 'guest'}`;
    setCurrentSessionId(newSessId);
    setLoading(true);

    try {
      const savedMessages = await DBService.getTutorMessages(newSessId);
      if (savedMessages && savedMessages.length > 0) {
        setMessages(savedMessages);
      } else {
        const welcomeText = newSet 
          ? `Hello ${studentName || 'Student'}! I am grounded in your study set: **${newSet.title}**. What concept would you like to master first?`
          : `Hello ${studentName || 'Student'}! I am in General Socratic Mode. Ask me anything, or tap a learning mode above!`;

        const welcomeMsg: TutorMessage = {
          id: 'msg_welcome_' + Date.now(),
          sessionId: newSessId,
          sender: 'nora',
          mode: activeMode,
          content: welcomeText,
          interactiveOptions: [
            'Teach me the core concept step-by-step',
            'Give me a tricky quiz question',
            'Explain this simply with an analogy',
            'Test my knowledge'
          ],
          timestamp: Date.now()
        };
        setMessages([welcomeMsg]);
        DBService.saveTutorMessage(welcomeMsg).catch(() => {});
      }
    } catch (e) {
      console.warn('Error loading new set messages:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAttachmentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    if (file.type.startsWith('image/')) {
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setAttachedFile({ name: file.name, content: base64, type: file.type });
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = () => {
        setAttachedFile({ name: file.name, content: reader.result as string, type: file.type });
      };
      reader.readAsText(file);
    }
  };

  // Synchronize with VoiceService speech rate and reading state
  useEffect(() => {
    const unsubSpeed = VoiceService.onSpeedChange((speed) => {
      setSpeechRate(speed);
    });
    const unsubProgress = VoiceService.onProgress((prog) => {
      if (prog.isSpeaking && prog.messageId) {
        setIsSpeakingMessageId(prog.messageId);
      } else if (!prog.isSpeaking) {
        setIsSpeakingMessageId(null);
      }
    });

    return () => {
      unsubSpeed();
      unsubProgress();
    };
  }, []);

  // Load list of all sessions for this student
  const refreshSessionsList = async () => {
    if (!userId) return;
    try {
      const allSessions = await DBService.getTutorSessions(userId);
      // Sort most recent first
      const sorted = allSessions.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
      setSessions(sorted);
    } catch (e) {
      console.warn('Could not load sessions list:', e);
    }
  };

  // Switch to an existing session
  const handleSelectSession = async (sess: TutorSession) => {
    if (sess.id === currentSessionId) {
      setSidebarOpen(false);
      setShowMobileMenu(false);
      return;
    }

    VoiceService.stop();
    setCurrentSessionId(sess.id);
    setActiveMode(sess.activeMode || 'Teach Me');
    setLoading(true);
    setSidebarOpen(false);
    setShowMobileMenu(false);

    try {
      const savedMessages = await DBService.getTutorMessages(sess.id);
      if (savedMessages && savedMessages.length > 0) {
        setMessages(savedMessages);
      } else {
        const local = localStorage.getItem(`learnora_chat_${sess.id}`);
        if (local) {
          try {
            setMessages(JSON.parse(local));
          } catch (e) {}
        }
      }
    } catch (e) {
      console.warn('Error switching session:', e);
    } finally {
      setLoading(false);
    }
  };

  // Start a fresh new chat session
  const handleStartNewChat = async () => {
    VoiceService.stop();
    const newSessId = 'sess_' + Date.now();
    const newTitle = studySet ? `${studySet.title} (New Session)` : 'New Socratic Exploration';

    const newSession: TutorSession = {
      id: newSessId,
      studySetId: studySet?.id,
      userId,
      title: newTitle,
      activeMode,
      identifiedWeakTopics: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setCurrentSessionId(newSessId);
    setSidebarOpen(false);
    setShowMobileMenu(false);

    const welcome: TutorMessage = {
      id: 'msg_welcome_' + Date.now(),
      sessionId: newSessId,
      sender: 'nora',
      mode: activeMode,
      content: `Hello **${studentName}**! I've started a brand-new discussion.\n\n${
        studySet
          ? `I have your materials for **"${studySet.title}"** loaded. What angle or question shall we conquer in this fresh session?`
          : `I am ready. What topic, concept, or test would you like to master today?`
      }`,
      interactiveOptions: [
        'Teach me the core concept step-by-step',
        'Give me a tricky quiz question',
        'Explain this like I am 10 years old',
        'What are the most common exam pitfalls?'
      ],
      timestamp: Date.now()
    };

    setMessages([welcome]);

    try {
      await DBService.saveTutorSession(newSession);
      await DBService.saveTutorMessage(welcome);
      await refreshSessionsList();
    } catch (e) {
      console.warn('Error initializing new session in db:', e);
    }
  };

  // Delete an old chat session
  const handleDeleteSession = async (e: React.MouseEvent, sessId: string) => {
    e.stopPropagation();
    try {
      await DBService.deleteTutorSession(sessId);
      localStorage.removeItem(`learnora_chat_${sessId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessId));

      // If we just deleted the active one, start a fresh chat
      if (sessId === currentSessionId) {
        handleStartNewChat();
      }
    } catch (err) {
      console.warn('Could not delete session:', err);
    }
  };

  // Initialize session & load persistent chat history & cognitive memory
  useEffect(() => {
    const initSession = async () => {
      const activeSessId = studySet ? `sess_${studySet.id}` : `sess_general_${userId || 'guest'}`;
      setCurrentSessionId(activeSessId);

      // 1. Load cognitive memory
      if (userId) {
        try {
          const mem = await DBService.getCognitiveMemory(userId);
          setCognitiveMemory(mem);
        } catch (e) {
          console.error('Error fetching cognitive memory:', e);
        }
      }

      // 2. Refresh sessions list
      await refreshSessionsList();

      // 3. Load existing persistent chat messages from Firestore
      try {
        const savedMessages = await DBService.getTutorMessages(activeSessId);
        if (savedMessages && savedMessages.length > 0) {
          setMessages(savedMessages);
        } else {
          // Check local storage backup
          const localBackup = localStorage.getItem(`learnora_chat_${activeSessId}`);
          if (localBackup) {
            try {
              const parsed = JSON.parse(localBackup);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setMessages(parsed);
                return;
              }
            } catch (err) {}
          }

          // Initial greeting tailored to student
          const welcome: TutorMessage = {
            id: 'msg_welcome_' + Date.now(),
            sessionId: activeSessId,
            sender: 'nora',
            mode: activeMode,
            content: `Hello **${studentName}**! I'm **Nora**, your adaptive personal AI lecturer.\n\n${
              studySet 
                ? `I have fully analyzed your materials for **"${studySet.title}"**. What concept should we conquer today? You can ask me to explain a tricky idea, quiz your understanding, or guide you through a step-by-step Socratic lesson.`
                : `I am ready to help you master any subject. What topic or exam are you preparing for today?`
            }`,
            interactiveOptions: [
              'Teach me the core concept step-by-step',
              'Give me a tricky quiz question',
              'Explain this like I am 10 years old',
              'What are the most common exam pitfalls?'
            ],
            timestamp: Date.now()
          };
          setMessages([welcome]);
          DBService.saveTutorMessage(welcome).catch((e) => console.warn('Could not persist welcome message:', e));

          // Also ensure an entry exists in tutorSessions
          if (userId) {
            const initialSess: TutorSession = {
              id: activeSessId,
              studySetId: studySet?.id,
              userId,
              title: studySet ? studySet.title : 'General Study Session',
              activeMode,
              identifiedWeakTopics: [],
              createdAt: Date.now(),
              updatedAt: Date.now()
            };
            DBService.saveTutorSession(initialSess).catch(() => {});
          }
        }
      } catch (err) {
        console.warn('Could not fetch saved messages, checking local storage:', err);
        const localBackup = localStorage.getItem(`learnora_chat_${activeSessId}`);
        if (localBackup) {
          try {
            const parsed = JSON.parse(localBackup);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setMessages(parsed);
            }
          } catch (e) {}
        }
      }

      // Load teaching styles
      try {
        const styles = await DBService.getTeachingStyles(userId);
        setTeachingStyles(styles);
      } catch (e) {}
    };

    initSession();
  }, [studySet?.id, userId]);

  // Persist messages backup to localStorage on every state change
  useEffect(() => {
    if (messages.length > 0 && currentSessionId) {
      try {
        localStorage.setItem(`learnora_chat_${currentSessionId}`, JSON.stringify(messages));
      } catch (e) {}
    }
  }, [messages, currentSessionId]);

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, loading]);

  const handleSend = async (messageText?: string, quizContext?: { lastConcept?: string; wasCorrect?: boolean; userSubmittedAnswer?: string }) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: TutorMessage = {
      id: 'usr_' + Date.now(),
      sessionId: currentSessionId,
      sender: 'user',
      content: textToSend,
      timestamp: Date.now()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Persist user message to Firestore
    DBService.saveTutorMessage(userMsg).catch((e) => console.warn('Error saving user message to db:', e));

    try {
      const materialContext = studySet?.materials?.map(m => m.content).join('\n\n') || '';

      const noraResponse = await AIService.tutorChat({
        userMessage: textToSend,
        mode: activeMode,
        studyMaterialContext: materialContext,
        teachingStyle: selectedStyle,
        chatHistory: messages.slice(-6).map(m => ({ sender: m.sender, content: m.content })),
        studentName,
        cognitiveMemory,
        quizContext
      });

      const noraMsg: TutorMessage = {
        id: 'nora_' + Date.now(),
        sessionId: currentSessionId,
        sender: 'nora',
        mode: activeMode,
        content: noraResponse.content || 'Let us continue exploring this topic.',
        questionToStudent: noraResponse.questionToStudent,
        chatQuiz: noraResponse.chatQuiz,
        interactiveOptions: noraResponse.interactiveOptions || ['Can you give an analogy?', 'Test me with a harder question', 'Explain simply'],
        citations: noraResponse.citations || [],
        selfReflection: noraResponse.selfReflection,
        timestamp: Date.now()
      };

      setMessages((prev) => [...prev, noraMsg]);

      // Persist Nora message to Firestore
      DBService.saveTutorMessage(noraMsg).catch((e) => console.warn('Error saving Nora message to db:', e));

      // Also ensure session metadata is saved/updated in tutorSessions
      if (userId) {
        const sessionTitle = studySet 
          ? studySet.title 
          : textToSend.slice(0, 36) + (textToSend.length > 36 ? '...' : '');

        const sessMeta: TutorSession = {
          id: currentSessionId,
          studySetId: studySet?.id,
          userId,
          title: sessionTitle,
          activeMode,
          identifiedWeakTopics: cognitiveMemory?.learnedKnowledgeGaps || [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        DBService.saveTutorSession(sessMeta).then(() => refreshSessionsList()).catch(() => {});
      }

      // Self-Learning Pipeline: Update cognitive memory and log adjustments
      try {
        if (noraResponse.selfReflection && cognitiveMemory) {
          const reflection = noraResponse.selfReflection;
          const newGaps = reflection.identifiedGap && reflection.identifiedGap.trim() 
            ? [reflection.identifiedGap.trim()] 
            : [];
          const newStrengths = reflection.demonstratedStrength && reflection.demonstratedStrength.trim()
            ? [reflection.demonstratedStrength.trim()]
            : [];

          const updatedMem: StudentCognitiveMemory = {
            ...cognitiveMemory,
            learnedKnowledgeGaps: Array.from(new Set([...cognitiveMemory.learnedKnowledgeGaps, ...newGaps])),
            demonstratedStrengths: Array.from(new Set([...cognitiveMemory.demonstratedStrengths, ...newStrengths])),
            noraPedagogicalStrategy: {
              ...cognitiveMemory.noraPedagogicalStrategy,
              recentSelfAdjustment: reflection.tutorAdjustmentMade || cognitiveMemory.noraPedagogicalStrategy.recentSelfAdjustment,
              adaptationLevel: Math.min(100, cognitiveMemory.noraPedagogicalStrategy.adaptationLevel + 1),
              totalInteractionsReflected: (cognitiveMemory.noraPedagogicalStrategy.totalInteractionsReflected || 0) + 1
            },
            lastSelfReflectionAt: Date.now(),
            updatedAt: Date.now()
          };

          setCognitiveMemory(updatedMem);
          await DBService.saveCognitiveMemory(updatedMem);

          // Record teaching evolution event
          const evolutionLog: TeachingEvolutionLog = {
            id: 'log_' + Date.now(),
            userId,
            interactionSummary: `Dialogue on: "${textToSend.slice(0, 50)}..."`,
            studentGraspObserved: reflection.studentGraspObserved || 'partially-understood',
            identifiedGap: reflection.identifiedGap || undefined,
            tutorAdjustmentMade: reflection.tutorAdjustmentMade,
            timestamp: Date.now()
          };
          await DBService.recordTeachingEvolutionLog(evolutionLog);
        }
      } catch (memErr) {
        console.warn('Notice: Background cognitive memory save experienced a momentary delay:', memErr);
      }

      // Voice narration if active (ElevenLabs with fallback)
      if (speechActive) {
        setIsSpeakingMessageId(noraMsg.id);
        VoiceService.speak({
          text: noraResponse.content,
          messageId: noraMsg.id,
          onStart: () => setIsSpeakingMessageId(noraMsg.id),
          onEnd: () => setIsSpeakingMessageId(null),
          onError: () => setIsSpeakingMessageId(null)
        });
      }

      // Record study activity in persistent student learning memory
      try {
        LearningMemoryService.recordTutorInteraction(userId, {
          subject: studySet?.subject || 'African Morphology & Linguistics',
          topic: studySet?.title || 'Word Formation Processes',
          mode: activeMode
        }).catch(() => {});
      } catch (_) {}

    } catch (e) {
      console.error('Nora response generation error:', e);
      const errMsg: TutorMessage = {
        id: 'err_' + Date.now(),
        sessionId: currentSessionId,
        sender: 'nora',
        content: `I ran into a momentary connection delay while processing your question. Click below to retry immediately!`,
        interactiveOptions: [
          textToSend,
          'Explain this step-by-step',
          'Give me a real-world analogy'
        ],
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, errMsg]);
      DBService.saveTutorMessage(errMsg).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (clearingChat) return;
    setClearingChat(true);
    try {
      VoiceService.stop();
      await DBService.clearTutorMessages(currentSessionId);
      localStorage.removeItem(`learnora_chat_${currentSessionId}`);

      const freshWelcome: TutorMessage = {
        id: 'msg_welcome_' + Date.now(),
        sessionId: currentSessionId,
        sender: 'nora',
        mode: activeMode,
        content: `Chat history reset. How would you like to proceed with **${studySet ? studySet.title : 'your study session'}**?`,
        interactiveOptions: [
          'Teach me the core concept step-by-step',
          'Give me a tricky quiz question',
          'Explain this like I am 10 years old',
          'Test my knowledge'
        ],
        timestamp: Date.now()
      };
      setMessages([freshWelcome]);
      await DBService.saveTutorMessage(freshWelcome);
    } catch (e) {
      console.warn('Error clearing chat history:', e);
    } finally {
      setClearingChat(false);
    }
  };

  const handleSelectQuizOption = (messageId: string, optionIndex: number) => {
    setPendingQuizSelections((prev) => ({
      ...prev,
      [messageId]: optionIndex
    }));
  };

  const handleSubmitChatQuiz = (msg: TutorMessage) => {
    if (!msg.chatQuiz) return;
    const selectedIdx = pendingQuizSelections[msg.id];
    if (selectedIdx === undefined) return;

    const isCorrect = selectedIdx === msg.chatQuiz.correctIndex;
    const chosenOptionText = msg.chatQuiz.options[selectedIdx];

    // Mark message as submitted in local state
    const updatedMsg: TutorMessage = {
      ...msg,
      chatQuiz: {
        ...msg.chatQuiz,
        studentAnswerIndex: selectedIdx,
        isCorrect,
        submitted: true
      }
    };

    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? updatedMsg : m))
    );

    // Persist updated quiz state to Firestore
    DBService.saveTutorMessage(updatedMsg).catch(() => {});

    if (isCorrect) {
      confetti({ particleCount: 65, spread: 60 });
    }

    // Automatically trigger Nora's mastery-first follow-up
    const userPrompt = isCorrect
      ? `I selected "${chosenOptionText}" for the question on ${msg.chatQuiz.concept}. That was correct! What is the next concept or question?`
      : `I selected "${chosenOptionText}" for the question on ${msg.chatQuiz.concept}. I missed it (correct was "${msg.chatQuiz.options[msg.chatQuiz.correctIndex]}"). Can you explain why my choice was mistaken, teach me the intuition so I truly master it, and then test me on this concept again?`;

    handleSend(userPrompt, {
      lastConcept: msg.chatQuiz.concept,
      wasCorrect: isCorrect,
      userSubmittedAnswer: chosenOptionText
    });
  };

  const handleStartReading = (text: string, msgId: string) => {
    setSpeechActive(true);
    setIsSpeakingMessageId(msgId);
    VoiceService.speak({
      text,
      messageId: msgId,
      onStart: () => setIsSpeakingMessageId(msgId),
      onEnd: () => setIsSpeakingMessageId(null),
      onError: () => setIsSpeakingMessageId(null)
    });
  };

  const handleStopReading = () => {
    VoiceService.stop();
    setIsSpeakingMessageId(null);
  };

  const handleSpeedChange = (newSpeed: number) => {
    VoiceService.setSpeechRate(newSpeed);
    setSpeechRate(newSpeed);
    setShowSpeedMenu(false);
  };

  return (
    <div className={isFocusMode ? "fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex flex-col font-sans" : "flex-1 flex flex-col h-full min-h-0 min-w-0 bg-slate-50 dark:bg-slate-950 font-sans relative overflow-hidden"}>
      {/* Desktop Nora Header - Unified Command Bar */}
      <div className="hidden sm:flex bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-3 sm:px-5 py-2.5 items-center justify-between shrink-0 z-20 shadow-2xs">
        {/* Left Zone: Back Button + Nora Avatar & Grounding + Chats & New Chat */}
        <div className="flex items-center gap-2.5 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 font-bold text-xs active:scale-95 shadow-2xs shrink-0"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
          )}

          {/* Nora Mascot & Grounded Set Label */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0 overflow-hidden">
              <AiRobotMascot variant="face" size={28} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">Nora AI</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              </div>
              <button
                type="button"
                onClick={() => setShowMaterialPickerModal(true)}
                className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 truncate max-w-[150px] lg:max-w-[200px] block font-medium transition-colors text-left leading-tight"
                title="Change grounded study material"
              >
                {studySet ? `📚 ${studySet.title}` : '🌐 General Socratic'}
              </button>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden md:block shrink-0" />

          {/* Toggle Left Sidebar */}
          <button
            type="button"
            onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
            className={`p-2 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs shrink-0 ${
              desktopSidebarOpen 
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100/70' 
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
            title={desktopSidebarOpen ? "Collapse Chat History Sidebar" : "Expand Chat History Sidebar"}
          >
            <PanelLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="hidden xl:inline text-xs">Chats</span>
          </button>

          {/* New Chat Quick Button */}
          <button
            type="button"
            onClick={handleStartNewChat}
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white transition-all flex items-center gap-1.5 shadow-xs font-bold text-xs shrink-0"
            title="Start a fresh Socratic chat session"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">New Chat</span>
          </button>
        </div>

        {/* Center Zone: Segmented Pedagogical Modes */}
        <div className="hidden lg:flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700 shadow-inner shrink-0">
          {TUTOR_MODES.map((tm) => (
            <button
              key={tm.mode}
              onClick={() => setActiveMode(tm.mode)}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeMode === tm.mode 
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs font-bold' 
                  : 'hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-750'
              }`}
              title={tm.desc}
            >
              <span className="text-xs">{tm.icon}</span>
              <span>{tm.label}</span>
            </button>
          ))}
        </div>

        {/* Right Zone: Persona + Memory + Audio + Theme Toggle + Inspector Toggle + Clear */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Teaching Persona Selector */}
          <button
            onClick={() => setShowStylePickerModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-all active:scale-95"
            title="Choose Nora's Teaching Persona"
          >
            <span>{currentPreset.icon}</span>
            <span className="hidden xl:inline">{currentPreset.shortLabel}</span>
            <ChevronRight className="w-3 h-3 text-slate-400 rotate-90" />
          </button>

          {/* Nora Cognitive Mind Trigger */}
          <button
            onClick={() => setShowCognitiveModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold shadow-2xs transition-all active:scale-95"
            title="Open Nora's Cognitive Mind & Adaptation Dashboard"
          >
            <BrainCircuit className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden xl:inline">Memory</span>
            <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-mono">
              Lvl {cognitiveMemory?.noraPedagogicalStrategy?.adaptationLevel || 1}
            </span>
          </button>

          {/* Voice Models Settings */}
          <button
            onClick={() => setShowVoiceModal(true)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex items-center transition-colors bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs"
            title="Configure 5 Curated Tutor Voices"
          >
            <Sliders className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </button>

          {/* Read Aloud Toggle */}
          <button
            onClick={() => setSpeechActive(!speechActive)}
            className={`p-2 rounded-xl border text-xs flex items-center transition-colors shadow-2xs ${
              speechActive 
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' 
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
            title="Read responses aloud"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* Reading Speed Gauge Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex items-center gap-1 transition-colors bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold shadow-2xs"
              title="Speech Speed Control"
            >
              <Gauge className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{speechRate.toFixed(2).replace(/\.00$/, '')}x</span>
            </button>
            {showSpeedMenu && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setShowSpeedMenu(false)} 
                />
                <div className="absolute right-0 mt-2 py-1.5 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-40 animate-fade-in">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Reading Speed
                  </div>
                  {[0.75, 1.0, 1.15, 1.25, 1.5, 2.0].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handleSpeedChange(rate)}
                      className={`w-full px-3 py-1.5 text-xs text-left flex items-center justify-between hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors ${
                        speechRate === rate ? 'text-blue-700 dark:text-blue-400 font-bold bg-blue-50/70 dark:bg-slate-700/60' : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <span>{rate}x {rate === 1.0 ? '(Normal)' : rate === 0.75 ? '(Relaxed)' : rate === 1.15 ? '(Brisk)' : rate === 1.25 ? '(Focused)' : rate === 1.5 ? '(Fast)' : rate === 2.0 ? '(2x Turbo)' : ''}</span>
                      {speechRate === rate && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Desktop Theme Toggle Button (Light/Dark Mode Switcher in Nora Tutor) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-center transition-all bg-white dark:bg-slate-800 text-slate-700 dark:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-2xs active:scale-95 shrink-0"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 transition-transform hover:-rotate-12" />
            )}
          </button>

          {/* Toggle Right Study Deck Inspector */}
          <button
            onClick={() => setDesktopInspectorOpen(!desktopInspectorOpen)}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs ${
              desktopInspectorOpen 
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100/70' 
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
            title={desktopInspectorOpen ? "Close Study Deck & Cognitive Panel" : "Open Study Deck & Cognitive Panel"}
          >
            <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden xl:inline text-xs">Deck</span>
          </button>

          {/* Clear Chat Button */}
          <button
            onClick={handleClearChat}
            disabled={clearingChat || messages.length <= 1}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex items-center transition-colors bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 disabled:opacity-40 disabled:hover:text-slate-400 disabled:hover:bg-white dark:disabled:hover:bg-slate-800 shadow-2xs"
            title="Clear and reset chat history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Nora Header - Sleek, Uncluttered Ergonomic Bar (height 56px, comfortable spacing) */}
      <div className="sm:hidden sticky top-0 z-30 flex items-center justify-between px-3.5 py-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 shrink-0 shadow-2xs pt-[max(0.625rem,env(safe-area-inset-top))]">
        {/* Left: Back button + Avatar + Title & Grounded topic */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => {
              if (isFocusMode) {
                setIsFocusMode(false);
              } else if (onBack) {
                onBack();
              } else if (typeof window !== 'undefined' && window.history) {
                window.history.back();
              }
            }}
            className="w-10 h-10 rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center shrink-0 active:scale-95 transition-all border border-slate-200/60 dark:border-slate-700/60"
            title="Return to Dashboard"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs overflow-hidden">
              <AiRobotMascot variant="face" size={32} />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">
                Nora AI
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.2 rounded border border-blue-200/60 dark:border-blue-800 shrink-0">
                {activeMode}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowMaterialPickerModal(true)}
              className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium truncate max-w-[170px] xs:max-w-[210px] transition-colors text-left leading-tight mt-0.5"
              title="Change grounded study material"
            >
              <span className="truncate">
                {studySet ? `📚 ${studySet.title}` : '🌐 General Socratic'}
              </span>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
            </button>
          </div>
        </div>

        {/* Right: Exactly 2 clean, spacious touch targets */}
        <div className="flex items-center gap-2 shrink-0">
          {/* New Chat */}
          <button
            type="button"
            onClick={handleStartNewChat}
            className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 active:scale-95 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors border border-blue-200/60 dark:border-blue-800/60 shadow-2xs"
            title="Start New Chat"
            aria-label="Start New Chat"
          >
            <Plus className="w-5 h-5 stroke-[2.2]" />
          </button>

          {/* Menu & Sessions History Toggle */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuTab('chats');
              setShowMobileMenu(true);
            }}
            className="w-10 h-10 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center transition-colors relative active:scale-95 shadow-2xs"
            title="Conversations & Settings"
            aria-label="Conversations and settings"
          >
            <PanelLeft className="w-4 h-4" />
            {sessions.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center">
                {sessions.length > 9 ? '9+' : sessions.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Unified Mobile Bottom Sheet (Conversations & Settings) */}
      {showMobileMenu && (
        <>
          <div 
            className="sm:hidden fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fade-in" 
            onClick={() => setShowMobileMenu(false)} 
          />
          <div className="sm:hidden fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl border-t border-slate-200 dark:border-slate-800 p-4 max-h-[88vh] overflow-y-auto space-y-3.5 animate-slide-up pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            {/* Sheet Handle */}
            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />

            {/* Header with Segmented Navigation Tabs */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl flex-1 max-w-xs">
                <button
                  type="button"
                  onClick={() => setMobileMenuTab('chats')}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    mobileMenuTab === 'chats'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chats ({sessions.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileMenuTab('settings')}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    mobileMenuTab === 'settings'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Settings</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowMobileMenu(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 shrink-0"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* TAB 1: CHAT CONVERSATIONS & SESSIONS */}
            {mobileMenuTab === 'chats' && (
              <div className="space-y-3">
                {/* Start New Chat Action */}
                <button
                  type="button"
                  onClick={() => {
                    handleStartNewChat();
                    setShowMobileMenu(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Start New Conversation</span>
                </button>

                {/* Search Sessions */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchSessionQuery}
                    onChange={(e) => setSearchSessionQuery(e.target.value)}
                    placeholder="Search past conversations..."
                    className="w-full pl-8.5 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {searchSessionQuery && (
                    <button
                      onClick={() => setSearchSessionQuery('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <button
                    onClick={() => setSessionCategoryFilter('all')}
                    className={`flex-1 py-1 px-2.5 rounded-lg text-center transition-all ${
                      sessionCategoryFilter === 'all'
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    All ({sessions.length})
                  </button>
                  {studySet && (
                    <button
                      onClick={() => setSessionCategoryFilter('set')}
                      className={`flex-1 py-1 px-2.5 rounded-lg text-center transition-all truncate ${
                        sessionCategoryFilter === 'set'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                      title={studySet.title}
                    >
                      This PDF ({currentSetSessionsCount})
                    </button>
                  )}
                </div>

                {/* Sessions List */}
                <div className="space-y-1.5 max-h-[46vh] overflow-y-auto pr-0.5">
                  {filteredSessions.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 space-y-1">
                      <MessageSquare className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 stroke-1" />
                      <p className="font-semibold text-slate-600 dark:text-slate-300">No conversations found</p>
                      <p className="text-[11px] text-slate-400">Tap "Start New Conversation" above to begin.</p>
                    </div>
                  ) : (
                    filteredSessions.map((sess) => {
                      const isActive = sess.id === currentSessionId;
                      const dateLabel = new Date(sess.updatedAt || sess.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric'
                      });

                      return (
                        <div
                          key={sess.id}
                          onClick={() => {
                            handleSelectSession(sess);
                            setShowMobileMenu(false);
                          }}
                          className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-2 active:scale-98 ${
                            isActive
                              ? 'bg-blue-50/90 dark:bg-blue-950/60 border-blue-400 dark:border-blue-700 text-blue-950 dark:text-blue-100 font-medium shadow-2xs'
                              : 'bg-white dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <MessageSquare className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-bold leading-snug text-slate-900 dark:text-slate-100">
                                {sess.title || 'Study Session'}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {dateLabel}
                                </span>
                                {sess.activeMode && (
                                  <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300 font-medium">
                                    {sess.activeMode}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteSession(e, sess.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all shrink-0 active:scale-95"
                            title="Delete conversation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: TUTOR SETTINGS, MODES & PREFERENCES */}
            {mobileMenuTab === 'settings' && (
              <div className="space-y-3.5">
                {/* Pedagogical Learning Mode */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Pedagogical Mode
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {TUTOR_MODES.map((tm) => (
                      <button
                        key={tm.mode}
                        type="button"
                        onClick={() => {
                          setActiveMode(tm.mode);
                          setShowMobileMenu(false);
                        }}
                        className={`p-2.5 rounded-xl text-left text-xs font-semibold flex items-center gap-2 transition-all active:scale-98 ${
                          activeMode === tm.mode
                            ? 'bg-blue-600 text-white font-bold shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200/80 dark:border-slate-700'
                        }`}
                      >
                        <span className="text-base">{tm.icon}</span>
                        <div className="min-w-0 flex-1">
                          <span className="block truncate leading-tight font-bold">{tm.label}</span>
                          <span className={`text-[9px] block truncate leading-tight ${activeMode === tm.mode ? 'text-blue-100' : 'text-slate-400'}`}>
                            {tm.desc.split(' ')[0]} mode
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme Mode Toggle Row */}
                <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700 dark:text-slate-300" />}
                    <div>
                      <span className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                        {isDark ? 'Dark Focus Mode' : 'Light Paper Mode'}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {isDark ? 'Reduced glare & high contrast' : 'Crisp high-clarity daylight theme'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
                  >
                    Switch
                  </button>
                </div>

                {/* Spoken Voice Narration Toggle */}
                <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {speechActive ? <Volume2 className="w-4 h-4 text-blue-600 dark:text-blue-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                    <div>
                      <span className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                        {speechActive ? 'Voice Narration Active' : 'Voice Narration Muted'}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {speechActive ? 'Nora reads tutor responses aloud' : 'Tap to enable spoken audio narration'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSpeechActive(!speechActive)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all ${
                      speechActive
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300'
                    }`}
                  >
                    {speechActive ? 'Mute' : 'Enable'}
                  </button>
                </div>

                {/* Speed Selector */}
                <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">Speech Rate:</span>
                  <div className="flex items-center gap-1">
                    {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => handleSpeedChange(rate)}
                        className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                          speechRate === rate ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Deep Modals Links */}
                <div className="space-y-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMobileMenu(false);
                      setShowStylePickerModal(true);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl text-left bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">{currentPreset.icon}</span>
                      <span>Teaching Persona: <strong>{currentPreset.shortLabel}</strong></span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowMobileMenu(false);
                      setShowMaterialPickerModal(true);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl text-left bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700"
                  >
                    <span className="flex items-center gap-2 truncate min-w-0">
                      <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="truncate">Material: <strong>{studySet ? studySet.title : 'General Socratic'}</strong></span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowMobileMenu(false);
                      setShowCognitiveModal(true);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl text-left bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700"
                  >
                    <span className="flex items-center gap-2">
                      <BrainCircuit className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Nora's Memory Map (Lvl {cognitiveMemory?.noraPedagogicalStrategy?.adaptationLevel || 1})</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowMobileMenu(false);
                      setShowVoiceModal(true);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl text-left bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700"
                  >
                    <span className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      <span>5 Curated Tutor Voices</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>

                {/* Clear Chat Button */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMobileMenu(false);
                      handleClearChat();
                    }}
                    disabled={clearingChat || messages.length <= 1}
                    className="w-full py-2.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-40 transition-colors border border-transparent dark:border-rose-900/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Current Chat</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ------------------------------------------------------------ */}
      {/* MULTI-PANEL DESKTOP WORKSPACE LAYOUT                         */}
      {/* ------------------------------------------------------------ */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* PANEL 1: DOCKABLE DESKTOP LEFT SIDEBAR (Sessions & History) */}
        <aside className={`hidden md:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 shrink-0 transition-all duration-200 z-10 ${
          desktopSidebarOpen ? 'w-72 lg:w-80' : 'w-0 border-r-0 overflow-hidden opacity-0 pointer-events-none'
        }`}>
          {/* Top Actions: New Chat + Category Tabs */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2">
            <button
              onClick={handleStartNewChat}
              className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Start New Chat</span>
            </button>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchSessionQuery}
                onChange={(e) => setSearchSessionQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-8 pr-7 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {searchSessionQuery && (
                <button
                  onClick={() => setSearchSessionQuery('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 pt-0.5">
              <button
                onClick={() => setSessionCategoryFilter('all')}
                className={`flex-1 py-1 px-2 rounded-lg text-center transition-all ${
                  sessionCategoryFilter === 'all'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                All Chats ({sessions.length})
              </button>
              {studySet && (
                <button
                  onClick={() => setSessionCategoryFilter('set')}
                  className={`flex-1 py-1 px-2 rounded-lg text-center transition-all truncate ${
                    sessionCategoryFilter === 'set'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                  title={studySet.title}
                >
                  This Set ({currentSetSessionsCount})
                </button>
              )}
            </div>
          </div>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
            {filteredSessions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 space-y-1">
                <MessageSquare className="w-7 h-7 mx-auto text-slate-300 dark:text-slate-600 stroke-1" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">No conversations found</p>
                <p className="text-[10px] text-slate-400">Start a new chat to begin exploring with Nora.</p>
              </div>
            ) : (
              filteredSessions.map((sess) => {
                const isActive = sess.id === currentSessionId;
                const dateLabel = new Date(sess.updatedAt || sess.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric'
                });

                return (
                  <div
                    key={sess.id}
                    onClick={() => handleSelectSession(sess)}
                    className={`group relative p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-2 ${
                      isActive
                        ? 'bg-blue-50/90 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-950 dark:text-blue-100 font-semibold shadow-2xs'
                        : 'bg-white dark:bg-slate-900 border-transparent hover:border-slate-200 dark:hover:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <MessageSquare className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                      <div className="truncate flex-1">
                        <p className={`truncate leading-snug ${isActive ? 'text-blue-900 dark:text-blue-200 font-bold' : 'text-slate-800 dark:text-slate-200'}`}>
                          {sess.title || 'Study Session'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {dateLabel}
                          </span>
                          {sess.activeMode && (
                            <span className="px-1 py-0.2 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300 font-medium">
                              {sess.activeMode}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDeleteSession(e, sess.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all shrink-0"
                      title="Delete chat session"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Sidebar Footer: Current Grounding Notes */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
            <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-2 shadow-2xs">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Grounded Notes</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {studySet ? studySet.title : 'General Knowledge'}
                </p>
              </div>
              <button
                onClick={() => setShowMaterialPickerModal(true)}
                className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[11px] font-bold shrink-0 transition-colors"
              >
                Change
              </button>
            </div>
          </div>
        </aside>

        {/* PANEL 2: CENTER CHAT CANVAS */}
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative bg-slate-50/60 dark:bg-slate-950">
          {/* Messages Scroll Area */}
          <div 
            ref={chatScrollContainerRef}
            className="flex-1 overflow-y-auto px-3.5 py-4 sm:px-6 sm:py-6 space-y-4 max-w-3xl xl:max-w-4xl mx-auto w-full min-h-0 overscroll-contain"
          >
            {/* Grounded PDF Document Context Banner on Chat Canvas (Desktop Only - on mobile it is in the top bar) */}
            {studySet && (
              <div className="hidden sm:flex p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/80 dark:from-slate-900 dark:to-indigo-950/40 border border-blue-200/80 dark:border-blue-900/50 shadow-2xs items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950/80 px-1.5 py-0.2 rounded shrink-0">
                        Active PDF
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {studySet.subject || 'General'}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5 leading-snug break-words [overflow-wrap:anywhere]">
                      {studySet.title}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowMaterialPickerModal(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shrink-0 transition-all active:scale-95 shadow-2xs"
                >
                  Change
                </button>
              </div>
            )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 sm:gap-3 w-full animate-fade-in ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender === 'nora' && (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs overflow-hidden">
                <AiRobotMascot variant="face" size={28} />
              </div>
            )}

            <div
              className={`rounded-2xl p-3.5 sm:p-5 shadow-xs leading-relaxed text-[13px] sm:text-sm break-words [overflow-wrap:anywhere] overflow-hidden ${
                msg.sender === 'user'
                  ? 'max-w-[88%] sm:max-w-[78%] bg-blue-600 text-white rounded-br-xs'
                  : 'w-full max-w-full sm:max-w-[85%] md:max-w-[78%] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-xs'
              }`}
            >
              {/* Header with speaker label */}
              {msg.sender === 'nora' && (
                <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="font-bold text-blue-700 dark:text-blue-400 shrink-0">Nora</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal truncate">({msg.mode || 'Lecturer'})</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isSpeakingMessageId === msg.id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[11px] font-semibold border border-blue-200/60 dark:border-blue-800 shadow-2xs">
                          <Volume2 className="w-3 h-3 text-blue-600 dark:text-blue-400 animate-pulse" />
                          <span>Reading</span>
                        </span>
                        <button
                          type="button"
                          onClick={handleStopReading}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-medium transition-colors border border-rose-200/60 dark:border-rose-900 shadow-2xs"
                          title="Stop reading"
                        >
                          <Square className="w-2.5 h-2.5 fill-current" />
                          <span>Stop</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartReading(msg.content, msg.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
                        title="Read aloud"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Read aloud</span>
                      </button>
                    )}

                    {/* Copy message button */}
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition-colors"
                      title="Copy response"
                    >
                      {copiedMsgId === msg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[11px] hidden sm:inline">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Message text with Markdown formatting */}
              {msg.sender === 'nora' ? (
                <FormattedMessageText content={msg.content} />
              ) : (
                <div className="whitespace-pre-wrap font-sans break-words text-white">
                  {msg.content}
                </div>
              )}

              {/* Interactive In-Chat Quiz Card with Options, Checkmarks & Submit */}
              {msg.chatQuiz && (
                <div className="mt-3.5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-blue-50/90 via-slate-50 to-indigo-50/80 dark:from-slate-800/95 dark:via-slate-800 dark:to-indigo-950/50 border border-blue-200/90 dark:border-slate-700 shadow-2xs space-y-2.5 sm:space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-blue-100 dark:border-slate-700">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wide">
                      <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Interactive Concept Check</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                      {msg.chatQuiz.concept || 'Knowledge Check'}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                    {msg.chatQuiz.question}
                  </p>

                  <div className="space-y-1.5 sm:space-y-2 pt-1">
                    {msg.chatQuiz.options.map((option, optIdx) => {
                      const isPendingSelected = pendingQuizSelections[msg.id] === optIdx;
                      const isSubmitted = msg.chatQuiz!.submitted;
                      const isCorrect = optIdx === msg.chatQuiz!.correctIndex;
                      const wasChosen = msg.chatQuiz!.studentAnswerIndex === optIdx;

                      let itemStyle = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200';
                      let checkmarkStyle = 'border-slate-300 dark:border-slate-600 text-transparent';

                      if (isSubmitted) {
                        if (isCorrect) {
                          itemStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500/30';
                          checkmarkStyle = 'border-emerald-600 bg-emerald-600 text-white';
                        } else if (wasChosen) {
                          itemStyle = 'border-rose-400 bg-rose-50 dark:bg-rose-950/50 text-rose-950 dark:text-rose-200 line-through';
                          checkmarkStyle = 'border-rose-500 bg-rose-500 text-white';
                        } else {
                          itemStyle = 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-400 opacity-60';
                        }
                      } else if (isPendingSelected) {
                        itemStyle = 'border-blue-600 dark:border-blue-400 bg-blue-50/90 dark:bg-blue-950/60 text-blue-950 dark:text-blue-100 font-medium ring-2 ring-blue-500/20 shadow-xs';
                        checkmarkStyle = 'border-blue-600 bg-blue-600 text-white';
                      }

                      return (
                        <div
                          key={optIdx}
                          onClick={() => {
                            if (!isSubmitted && !loading) {
                              handleSelectQuizOption(msg.id, optIdx);
                            }
                          }}
                          className={`p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-2.5 transition-all cursor-pointer min-h-[46px] ${itemStyle} ${
                            isSubmitted || loading ? 'cursor-default pointer-events-none' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="leading-snug break-words">{option}</span>
                          </div>

                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${checkmarkStyle}`}>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Submit Button & State Feedback */}
                  {!msg.chatQuiz.submitted ? (
                    <div className="pt-2 flex flex-col xs:flex-row xs:items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                        {pendingQuizSelections[msg.id] !== undefined
                          ? 'Option selected. Tap Submit to verify understanding.'
                          : 'Select an option to test your grasp with Nora.'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSubmitChatQuiz(msg)}
                        disabled={pendingQuizSelections[msg.id] === undefined || loading}
                        className="w-full xs:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shrink-0 min-h-[42px]"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Submit Answer</span>
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2">
                      <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                        msg.chatQuiz.isCorrect 
                          ? 'bg-emerald-100/70 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' 
                          : 'bg-rose-100/70 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                      }`}>
                        {msg.chatQuiz.isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                        )}
                        <div className="leading-relaxed">
                          <strong className="block font-bold">
                            {msg.chatQuiz.isCorrect 
                              ? 'Mastered! Excellent understanding.' 
                              : `Needs Review (Correct answer: ${msg.chatQuiz.options[msg.chatQuiz.correctIndex]})`}
                          </strong>
                          <span>{msg.chatQuiz.explanation}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Nora's Real-time Self-Reflection Callout */}
              {msg.selfReflection && (
                <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                  <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    <span className="font-bold text-slate-900 dark:text-slate-100">Nora's Reflection: </span>
                    <span>Observed grasp was <strong>{msg.selfReflection.studentGraspObserved}</strong>. </span>
                    <span className="italic text-blue-900 dark:text-blue-300">"{msg.selfReflection.tutorAdjustmentMade}"</span>
                  </div>
                </div>
              )}

              {/* Follow-up question callout */}
              {msg.questionToStudent && (
                <div className="mt-3 p-3 bg-blue-50/80 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-800/60 text-blue-950 dark:text-blue-100 font-medium text-xs flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-blue-900 dark:text-blue-300 mb-0.5">Check for understanding:</span>
                    <span>{msg.questionToStudent}</span>
                  </div>
                </div>
              )}

              {/* Grounded Citation Sources */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 flex flex-wrap gap-1 items-center">
                  <span className="shrink-0 font-medium">Source Grounding:</span>
                  {msg.citations.map((c, i) => (
                    <span key={i} className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-blue-700 dark:text-blue-300 font-mono text-[10px] max-w-[200px] truncate">
                      {c.sourceName || 'Lecture Note'}
                    </span>
                  ))}
                </div>
              )}

              {/* Interactive prompt pills */}
              {msg.interactiveOptions && msg.interactiveOptions.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
                  {msg.interactiveOptions.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSend(opt)}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 hover:bg-blue-50 dark:hover:bg-slate-700 hover:border-blue-200 dark:hover:border-blue-500 border border-slate-200/90 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-left max-w-full break-words [overflow-wrap:anywhere] active:scale-95 flex items-center gap-1.5 shadow-2xs leading-snug"
                    >
                      <Sparkles className="w-3 h-3 text-blue-500 shrink-0" />
                      <span className="break-words [overflow-wrap:anywhere]">{opt}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Student Avatar for User Messages */}
            {msg.sender === 'user' && (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs overflow-hidden">
                {userAvatarUrl ? (
                  <img src={userAvatarUrl} alt={studentName} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-[11px]">{studentName.charAt(0).toUpperCase()}</span>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Mobile Airy Welcome & Quick Socratic Starters (Clean, Spacious, Uncluttered) */}
        {messages.length <= 2 && (
          <div className="sm:hidden py-4 px-1.5 space-y-3.5 animate-fade-in text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md mx-auto overflow-hidden">
              <AiRobotMascot variant="face" size={50} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                Hi {studentName ? studentName.split(' ')[0] : 'there'}! I'm Nora AI
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-xs mx-auto">
                {studySet 
                  ? `Ready to explore ${studySet.title}. How would you like to start?`
                  : 'Your personal Socratic tutor. What concept would you like to master today?'}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-1 max-w-sm mx-auto">
              {[
                { icon: '🎯', label: 'Quiz my understanding', prompt: 'Give me a concept check question with 4 options to test where my understanding is right now.' },
                { icon: '💡', label: 'Explain step-by-step', prompt: 'Explain the foundational intuition and core concepts step-by-step with real-world examples.' },
                { icon: '⚡', label: 'Simple analogy', prompt: 'Explain this in very simple terms with a real-world analogy.' }
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(item.prompt)}
                  disabled={loading}
                  className="w-full p-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-blue-50/70 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 text-left flex items-center gap-2.5 transition-all shadow-2xs active:scale-98 min-h-[46px]"
                >
                  <span className="text-base shrink-0">{item.icon}</span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex-1 leading-snug">{item.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Desktop Welcome Card & Cognitive Summary when chat is beginning */}
        {messages.length <= 2 && (
          <div className="hidden sm:block space-y-3">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs space-y-3 animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0 overflow-hidden">
                  <AiRobotMascot variant="face" size={36} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      Welcome to Learnora AI Tutor
                    </h3>
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800 shrink-0">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed break-words [overflow-wrap:anywhere]">
                    I adapt continuously to your thinking. Grounded in <strong className="font-semibold text-slate-900 dark:text-slate-100 break-words [overflow-wrap:anywhere] break-all underline decoration-blue-500/30">{studySet ? studySet.title : 'General Socratic'}</strong> with a <strong className="font-semibold text-slate-900 dark:text-slate-100">{currentPreset.shortLabel}</strong> persona.
                  </p>
                </div>
              </div>

              {/* Cognitive Mind Quick Status Strip */}
              <div 
                onClick={() => setShowCognitiveModal(true)}
                className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800 flex items-center justify-between text-xs text-blue-900 dark:text-blue-200 cursor-pointer hover:bg-blue-100/60 dark:hover:bg-blue-900/60 transition-colors gap-2"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <BrainCircuit className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="font-semibold truncate">
                    Cognitive Evolution: Lvl {cognitiveMemory?.noraPedagogicalStrategy?.adaptationLevel || 1}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 shrink-0">
                  View Mind Map →
                </span>
              </div>
            </div>

            {/* Desktop Quick Starter Suggestions */}
            <div className="py-1 animate-fade-in">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Suggested Jump-Starts:</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: '🎯', label: 'Quiz my understanding', prompt: 'Give me a concept check question with 4 options to test where my understanding is right now.' },
                  { icon: '💡', label: 'Explain the core concept step-by-step', prompt: 'Explain the foundational intuition and core concepts step-by-step with real-world examples.' },
                  { icon: '⚡', label: 'Summarize the 3 key rules', prompt: 'What are the 3 most essential principles I must master for exams?' },
                  { icon: '🔍', label: 'Probe my blind spots with a challenge', prompt: 'Ask me a tricky Socratic question that tests my intuition on potential misconceptions.' },
                ].map((starter, sIdx) => (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => handleSend(starter.prompt)}
                    disabled={loading}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-blue-50/70 dark:hover:bg-slate-800 active:scale-98 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500 text-left transition-all shadow-2xs flex items-center gap-2.5 group text-xs text-slate-700 dark:text-slate-300 min-h-[46px]"
                  >
                    <span className="text-base shrink-0">{starter.icon}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 text-xs leading-snug line-clamp-2 flex-1">
                      {starter.label}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex gap-2 sm:gap-3 justify-start animate-fade-in">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs overflow-hidden">
              <AiRobotMascot variant="face" size={26} />
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-bl-xs p-3.5 sm:p-4 shadow-xs flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]"></div>
              <span className="text-xs text-slate-400 ml-1 font-medium">Nora is reflecting and adapting...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Message Input Bar */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 px-3 py-2.5 sm:px-6 sm:py-3.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] shrink-0 z-20 transition-all shadow-xs">
        {/* Quick Action Prompts Ribbon (Aligned with message stream) */}
        <div className="max-w-3xl xl:max-w-4xl mx-auto w-full flex items-center overflow-x-auto gap-1.5 pb-2 mb-1 no-scrollbar text-xs">
          {[
            { label: '❓ Quiz Me', prompt: 'Give me a concept check question with 4 options to test my understanding right now.' },
            { label: '💡 Explain', prompt: 'Explain the core concept in clear detail.' },
            { label: '⚡ Simple Analogy', prompt: 'Explain this in very simple terms with a real-world analogy.' },
            { label: '🎯 Challenge Me', prompt: 'Ask me a tricky Socratic question that tests my intuition on potential misconceptions.' },
            { label: '🔍 Test Blind Spots', prompt: 'What are common student errors on this concept?' },
          ].map((action, aIdx) => (
            <button
              key={aIdx}
              type="button"
              onClick={() => handleSend(action.prompt)}
              disabled={loading}
              className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-750 hover:text-blue-700 dark:hover:text-blue-300 hover:border-blue-200 dark:hover:border-slate-600 border border-slate-200/80 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 shrink-0 whitespace-nowrap active:scale-95 transition-all shadow-2xs"
            >
              {action.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="mx-auto w-full max-w-3xl xl:max-w-4xl min-h-[48px] bg-slate-50 dark:bg-slate-800/90 hover:bg-slate-100/70 dark:hover:bg-slate-800 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:ring-2 focus-within:ring-blue-500 rounded-2xl border border-slate-300/80 dark:border-slate-700 shadow-xs flex items-center gap-2 px-3 py-1.5 transition-all"
        >
          {/* Desktop Grounding indicator chip */}
          <button
            type="button"
            onClick={() => setShowMaterialPickerModal(true)}
            className="hidden sm:flex items-center gap-1.5 py-1 px-2.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 hover:text-blue-700 dark:hover:text-white text-xs font-semibold shrink-0 transition-colors shadow-2xs mr-1"
            title="Change study grounding notes"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-[11px] max-w-[130px] truncate">
              {studySet?.title || 'General Socratic'}
            </span>
          </button>

          {/* Mobile Grounding Quick-Switch Icon Button */}
          <button
            type="button"
            onClick={() => setShowMaterialPickerModal(true)}
            className="sm:hidden w-8 h-8 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-600 shrink-0 shadow-2xs active:scale-95"
            title={studySet ? `Grounded in: ${studySet.title}` : 'General Socratic Mode'}
            aria-label="Change study material"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => {
              setTimeout(() => {
                scrollToBottom('smooth');
              }, 150);
            }}
            placeholder={
              studySet?.title 
                ? (studySet.title.length > 22 ? 'Ask Nora about this...' : `Ask about ${studySet.title}...`)
                : 'Ask Nora anything...'
            }
            className="flex-1 min-w-0 bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm py-2 px-1.5"
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-8 h-8 sm:w-auto sm:px-4 sm:h-9 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 font-bold text-xs"
            aria-label="Send message"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </main>

    {/* PANEL 3: DOCKABLE DESKTOP RIGHT INSPECTOR */}
    <aside className={`hidden lg:flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200/90 dark:border-slate-800 shrink-0 transition-all duration-200 z-10 ${
      desktopInspectorOpen ? 'w-72 xl:w-80' : 'w-0 border-l-0 overflow-hidden opacity-0 pointer-events-none'
    }`}>
      {/* Inspector Header */}
      <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">Study Deck & Memory</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Contextual Learning Assistant</p>
          </div>
        </div>
        <button
          onClick={() => setDesktopInspectorOpen(false)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          title="Close panel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Inspector Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
        {/* 1. Active Grounding Material Card */}
        <div className="bg-slate-50/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Active Material</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
              {studySet ? 'Grounded' : 'General'}
            </span>
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 leading-snug">
              {studySet ? studySet.title : 'General Socratic Mode'}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {studySet 
                ? `${studySet.materials?.length || 1} lecture source${(studySet.materials?.length || 1) === 1 ? '' : 's'} · ${studySet.subject || 'All Subjects'}`
                : 'Broad academic reasoning across all disciplines.'}
            </p>
          </div>

          {/* Action shortcuts */}
          <div className="pt-1.5 flex flex-col gap-1.5">
            {studySet && onNavigateTab && (
              <>
                <button
                  onClick={() => onNavigateTab('flashcards')}
                  className="w-full py-1.5 px-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-semibold flex items-center justify-between transition-colors shadow-2xs"
                >
                  <span className="flex items-center gap-1.5">
                    <span>🃏</span>
                    <span>Practice Flashcards</span>
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </button>
                <button
                  onClick={() => onNavigateTab('quiz')}
                  className="w-full py-1.5 px-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-700 dark:hover:text-indigo-300 text-xs font-semibold flex items-center justify-between transition-colors shadow-2xs"
                >
                  <span className="flex items-center gap-1.5">
                    <span>📝</span>
                    <span>Take Practice Exam</span>
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </button>
              </>
            )}
            <button
              onClick={() => setShowMaterialPickerModal(true)}
              className="w-full py-1.5 px-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{studySet ? 'Switch Study Set' : 'Attach Study Set'}</span>
            </button>
          </div>
        </div>

        {/* 2. Nora Cognitive Mind Card */}
        <div 
          onClick={() => setShowCognitiveModal(true)}
          className="bg-gradient-to-br from-indigo-50/70 to-blue-50/70 dark:from-slate-800/90 dark:to-indigo-950/60 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/60 p-3 space-y-2 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-all shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Cognitive Mind</span>
            </span>
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[10px] font-mono font-bold">
              Lvl {cognitiveMemory?.noraPedagogicalStrategy?.adaptationLevel || 1}
            </span>
          </div>
          <p className="text-xs text-indigo-950 dark:text-indigo-100 font-semibold leading-snug">
            {cognitiveMemory?.noraPedagogicalStrategy?.adaptationLevel 
              ? `Level ${cognitiveMemory.noraPedagogicalStrategy.adaptationLevel}: Autonomous Socratic Modeling`
              : 'Adaptive Student Modeling Active'}
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
            Nora tracks your misconceptions, cognitive fatigue, and comprehension velocity in real time.
          </p>
          <div className="pt-1 flex items-center justify-between text-[11px] text-indigo-700 dark:text-indigo-300 font-bold">
            <span>View Full Cognitive Map</span>
            <span>→</span>
          </div>
        </div>

        {/* 3. 1-Click Socratic Drills */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block px-0.5">
            Instant Socratic Drills
          </span>
          {[
            { 
              icon: '🎯', 
              title: 'Probe Misconceptions', 
              desc: 'Test for common student traps',
              prompt: 'What is the most common student error or misconception in this topic, and how do I avoid falling for it?'
            },
            { 
              icon: '💡', 
              title: 'Real-World Analogy', 
              desc: 'Intuitive mental model',
              prompt: 'Give me a vivid, unforgettable real-world analogy to grasp the core intuition of this concept.'
            },
            { 
              icon: '❓', 
              title: '3-Question Rapid Check', 
              desc: 'Diagnostic quiz check',
              prompt: 'Generate a 3-question interactive diagnostic check on the highest-yield concepts right now.'
            },
            { 
              icon: '🧠', 
              title: 'Feynman Technique', 
              desc: 'Explain to test understanding',
              prompt: 'Ask me to explain a key piece of this concept simply using the Feynman technique, and critique my explanation.'
            }
          ].map((drill, dIdx) => (
            <button
              key={dIdx}
              type="button"
              onClick={() => handleSend(drill.prompt)}
              disabled={loading}
              className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-blue-50/70 dark:hover:bg-slate-750 border border-slate-200/80 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 text-left transition-all flex items-start gap-2 shadow-2xs group active:scale-98"
            >
              <span className="text-base shrink-0 mt-0.5">{drill.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                  {drill.title}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {drill.desc}
                </p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0 mt-1" />
            </button>
          ))}
        </div>
      </div>
    </aside>
  </div>

      {/* Nora's Cognitive Mind & Memory Modal */}
      {showCognitiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden flex flex-col relative max-h-[90vh]">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 font-serif">Nora's Cognitive Self-Learning Model</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Autonomous adaptation, knowledge gap tracking & pedagogical evolution</p>
                </div>
              </div>
              <button
                onClick={() => setShowCognitiveModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-full"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-slate-900">
              <NoraCognitiveDashboard
                userId={userId}
                studentName={studentName}
                onClose={() => setShowCognitiveModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Chat Sessions Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-80 max-w-[85vw] bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 animate-slide-right border-r border-slate-200 dark:border-slate-800">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 font-serif">Nora Chat Sessions</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">History & New Conversations</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                title="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* New Chat Primary Button */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800">
              <button
                onClick={handleStartNewChat}
                className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>Start New Chat</span>
              </button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              <div className="px-2 py-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Recent Conversations</span>
                <span className="text-[10px] font-normal lowercase">{sessions.length} sessions</span>
              </div>

              {sessions.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 space-y-1">
                  <MessageSquare className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2 stroke-1" />
                  <p className="text-slate-600 dark:text-slate-300 font-semibold">No prior saved chats yet.</p>
                  <p className="text-[10px] text-slate-400">New conversations you start with Nora will appear right here.</p>
                </div>
              ) : (
                sessions.map((sess) => {
                  const isActive = sess.id === currentSessionId;
                  const dateLabel = new Date(sess.updatedAt || sess.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric'
                  });

                  return (
                    <div
                      key={sess.id}
                      onClick={() => handleSelectSession(sess)}
                      className={`group relative p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-2 ${
                        isActive
                          ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 font-medium shadow-2xs'
                          : 'bg-white dark:bg-slate-900 border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <MessageSquare className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                        <div className="truncate">
                          <p className="truncate font-semibold leading-tight text-slate-900 dark:text-slate-100">
                            {sess.title || 'Study Session'}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {dateLabel}
                            </span>
                            {sess.activeMode && (
                              <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300">
                                {sess.activeMode}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Delete session button */}
                      <button
                        onClick={(e) => handleDeleteSession(e, sess.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all shrink-0"
                        title="Delete chat session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Sidebar Footer info */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span className="truncate">Learner: <strong className="text-slate-800 dark:text-slate-200">{studentName}</strong></span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">Learnora AI</span>
            </div>
          </div>
        </div>
      )}

      {/* ElevenLabs Voice Selection Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh]">
            <ElevenLabsVoiceSelector onClose={() => setShowVoiceModal(false)} />
          </div>
        </div>
      )}

      {/* Teaching Persona Selector Bottom Sheet */}
      {showStylePickerModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div 
            className="fixed inset-0" 
            onClick={() => setShowStylePickerModal(false)} 
          />
          <div className="relative z-10 w-full max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl max-h-[85vh] flex flex-col animate-slide-up">
            <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3 shrink-0" />
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Nora's Teaching Persona</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Choose how Nora guides, explains, and questions</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStylePickerModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-2 flex-1">
              {DEFAULT_TEACHING_STYLE_PRESETS.map((preset) => {
                const isActive = selectedStyle === preset.name;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectTeachingStyle(preset.name)}
                    className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      isActive
                        ? 'bg-blue-50/90 dark:bg-blue-950/60 border-blue-500 dark:border-blue-400 text-blue-950 dark:text-blue-100 font-medium ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200/90 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <span className="text-xl shrink-0 mt-0.5">{preset.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">{preset.name}</h4>
                          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-semibold">
                            {preset.tagline}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          {preset.description}
                        </p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 transition-colors ${
                      isActive ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-600 text-transparent'
                    }`}>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Study Material Grounding Switcher Bottom Sheet */}
      {showMaterialPickerModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div 
            className="fixed inset-0" 
            onClick={() => setShowMaterialPickerModal(false)} 
          />
          <div className="relative z-10 w-full max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl max-h-[85vh] flex flex-col animate-slide-up">
            <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3 shrink-0" />
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Study Material Grounding</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Select what notes Nora references for your chat</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMaterialPickerModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-2 flex-1">
              {/* Option: General Socratic Mode */}
              <div
                onClick={() => handleSelectStudyMaterial(null)}
                className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-3 ${
                  !studySet
                    ? 'bg-blue-50/90 dark:bg-blue-950/60 border-blue-500 dark:border-blue-400 text-blue-950 dark:text-blue-100 font-medium ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200/90 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <span className="text-xl shrink-0 mt-0.5">🌐</span>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">General Socratic Knowledge</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      Broad academic knowledge across all subjects with no specific uploaded document required.
                    </p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 transition-colors ${
                  !studySet ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-600 text-transparent'
                }`}>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>

              {/* Uploaded Study Sets */}
              {availableStudySets && availableStudySets.length > 0 && (
                <>
                  <div className="px-1 pt-2 pb-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Your Study Sets ({availableStudySets.length})
                  </div>
                  {availableStudySets.map((s) => {
                    const isSelected = studySet?.id === s.id;
                    return (
                      <div
                        key={s.id}
                        onClick={() => handleSelectStudyMaterial(s)}
                        className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'bg-blue-50/90 dark:bg-blue-950/60 border-blue-500 dark:border-blue-400 text-blue-950 dark:text-blue-100 font-medium ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-white dark:bg-slate-800 border-slate-200/90 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <span className="text-xl shrink-0 mt-0.5">📚</span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate max-w-[200px]">{s.title}</h4>
                              {s.subject && (
                                <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px]">
                                  {s.subject}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                              {s.materials?.length || 1} lecture source{(s.materials?.length || 1) === 1 ? '' : 's'} · {s.progressPercent || 0}% mastery
                            </p>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 transition-colors ${
                          isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-600 text-transparent'
                        }`}>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* Upload New Material Trigger */}
              {onOpenUploadModal && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMaterialPickerModal(false);
                    onOpenUploadModal();
                  }}
                  className="w-full mt-2 py-2.5 px-3 rounded-xl border border-dashed border-blue-300 dark:border-blue-700 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload New Material / Slides</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
