import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  BrainCircuit, 
  BookOpen, 
  Layers, 
  Clock, 
  Flame, 
  Upload, 
  Youtube, 
  FileText, 
  Mic, 
  HelpCircle, 
  Calendar as CalendarIcon, 
  Video, 
  Headphones, 
  FileCheck, 
  Sparkles, 
  TrendingUp, 
  Settings, 
  User, 
  CheckCircle2, 
  ArrowRight, 
  FolderOpen, 
  Library, 
  Target, 
  Trash2, 
  ShieldCheck, 
  LayoutGrid, 
  Bell, 
  ChevronRight, 
  ChevronDown, 
  GraduationCap, 
  Star, 
  Play, 
  Home, 
  MessageSquare, 
  Award, 
  Brain, 
  X, 
  BarChart3,
  Menu,
  Trophy,
  Camera,
  LogOut,
  Volume2,
  CreditCard,
  Sun,
  Moon,
  Wrench,
  MessageSquareWarning,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { DBService } from '../services/dbService';
import { StudySet, isAdminEmail, ADMIN_EMAIL, MaintenanceModeConfig } from '../types';
import { MaintenanceService } from '../services/maintenanceService';
import { MaterialUploadModal } from './MaterialUploadModal';
import { ComplaintModal } from './ComplaintModal';
import { StudySetDetailView } from './StudySetDetailView';
import { NoraTutorView } from './NoraTutorView';
import { FlashcardSession } from './FlashcardSession';
import { QuizSession } from './QuizSession';
import { EssayGraderView } from './EssayGraderView';
import { StudyPlanView } from './StudyPlanView';
import { ProgressView } from './ProgressView';
import { AudioLessonModal } from './AudioLessonModal';
import { ExplainerVideoModal } from './ExplainerVideoModal';
import { SettingsModal } from './SettingsModal';
import { NoraCognitiveDashboard } from './NoraCognitiveDashboard';
import { PWAInstallButton } from './PWAInstallButton';
import { AdminPanel } from './AdminPanel';
import { AiRobotMascot } from './AiRobotMascot';
import { WeeklyRunService } from '../services/weeklyRunService';
import { WeeklyRunSummaryData } from '../types';
import { WeeklyRunSummaryCard } from './WeeklyRunSummaryCard';
import { WeeklyRunModal } from './WeeklyRunModal';
import { WeeklyRunSprintList } from './WeeklyRunSprintList';
import { ProfileImageModal } from './ProfileImageModal';
import { ReviewLessonItem, NotificationItem } from '../types';
import { ReviewQueueService } from '../services/reviewQueueService';
import { ReviewQueueCard } from './ReviewQueueCard';
import { ReviewQueueView } from './ReviewQueueView';
import { ReviewSessionModal } from './ReviewSessionModal';
import { NotificationService } from '../services/notificationService';
import { WebPushService } from '../services/webPushService';
import { LiveNotificationDropBanner } from './LiveNotificationDropBanner';
import { NotificationCenterDropdown } from './NotificationCenterDropdown';
import { MilestoneCelebrationModal, MilestoneCelebrationData } from './MilestoneCelebrationModal';
import { ConfettiService } from '../services/confettiService';
import { CertificatesComingSoonView } from './CertificatesComingSoonView';
import { NotificationsView } from './NotificationsView';
import { FloatingStudyTimer } from './FloatingStudyTimer';
import { CommunityChatView } from './CommunityChatView';
import { CommunityChatService } from '../services/communityChatService';
import { useSEO } from '../hooks/useSEO';

type ActiveView = 
  | 'home' 
  | 'library' 
  | 'study-set-detail' 
  | 'tutor' 
  | 'flashcards' 
  | 'quiz' 
  | 'essay-grader' 
  | 'study-plan' 
  | 'progress' 
  | 'cognitive-mind' 
  | 'weekly-run'
  | 'admin'
  | 'review-queue'
  | 'certificates'
  | 'notifications'
  | 'community';

interface MainDashboardProps {
  onRerunSetup?: () => void;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({ onRerunSetup }) => {
  const { user, profile, logout, updateProfileData } = useAuth();
  const { theme, isDark, toggleTheme, setTheme } = useTheme();
  const [activeView, setActiveView] = useState<ActiveView>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const v = params.get('view') as ActiveView;
      const validViews: ActiveView[] = ['home', 'library', 'study-set-detail', 'tutor', 'flashcards', 'quiz', 'essay-grader', 'study-plan', 'progress', 'cognitive-mind', 'weekly-run', 'admin', 'review-queue', 'certificates', 'notifications'];
      if (v && validViews.includes(v)) return v;
      const h = window.location.hash.replace('#', '') as ActiveView;
      if (h && validViews.includes(h)) return h;
    }
    return 'home';
  });
  const [studySets, setStudySets] = useState<StudySet[]>([]);
  const [selectedSet, setSelectedSet] = useState<StudySet | null>(null);
  const [loadingSets, setLoadingSets] = useState(true);

  // Keep window scrolled to top whenever active view changes (essential for mobile headers)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });

    if (typeof window !== 'undefined' && window.history?.replaceState) {
      const url = new URL(window.location.href);
      if (activeView === 'home') {
        url.searchParams.delete('view');
      } else {
        url.searchParams.set('view', activeView);
      }
      window.history.replaceState(null, '', url.toString());
    }
  }, [activeView]);

  // Dynamic SEO optimization across views and study sets
  const seoConfig = useMemo(() => {
    switch (activeView) {
      case 'library':
        return {
          title: 'Study Sets & Library',
          description: 'Browse, create, and organize your AI-generated study sets, notes, and flashcard decks on Learnora.'
        };
      case 'study-set-detail':
        return {
          title: selectedSet ? `${selectedSet.title} (${selectedSet.subject || 'Coursework'})` : 'Study Set Detail',
          description: selectedSet?.description || `Study ${selectedSet?.title || 'this coursework'} with AI summary notes, flashcards, and diagnostic quizzes on Learnora.`
        };
      case 'tutor':
        return {
          title: 'Nora Socratic AI Lecturer & Tutor',
          description: 'Engage in adaptive, dialogue-based Socratic learning sessions with Nora AI to master tough concepts.'
        };
      case 'flashcards':
        return {
          title: selectedSet ? `Flashcards – ${selectedSet.title}` : 'Spaced Repetition Flashcards',
          description: 'Master key definitions and terminology with adaptive spaced repetition flashcards on Learnora.'
        };
      case 'quiz':
        return {
          title: selectedSet ? `Diagnostic Quiz – ${selectedSet.title}` : 'Diagnostic Knowledge Quiz',
          description: 'Test your understanding with AI diagnostic questions, answer feedback, and grounding citations.'
        };
      case 'review-queue':
        return {
          title: 'Spaced Repetition Review Queue',
          description: 'Lock your study material into permanent long-term memory with Anki-style 1, 3, and 7 day review cycles.'
        };
      case 'community':
        return {
          title: 'Community Study Lounge & Chat',
          description: 'Connect, study together, and discuss coursework in real time with fellow learners on Learnora.'
        };
      case 'essay-grader':
        return {
          title: 'AI Essay Grader & Rubric Analysis',
          description: 'Receive instant, in-depth evaluation and actionable writing feedback on your essays.'
        };
      case 'study-plan':
        return {
          title: 'Personalized Academic Study Plan',
          description: 'Plan exam prep, daily milestones, and spaced learning routines tailored to your target score.'
        };
      case 'progress':
        return {
          title: 'Learning Analytics & Mastery Progress',
          description: 'Track your cognitive memory growth, weekly study run momentum, and accuracy diagnostics.'
        };
      case 'admin':
        return {
          title: 'Admin Command Center',
          description: 'Platform management and student administration panel for Learnora.'
        };
      default:
        return {
          title: 'Learnora - Turn what you have into what you know',
          description: 'Turn what you have into what you know. Learnora is an AI personal lecturer and study workspace that transforms your notes, slides, and educational materials into an interactive learning experience.'
        };
    }
  }, [activeView, selectedSet]);

  useSEO(seoConfig);

  // Modals & Profile Settings
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadModalInitialTab, setUploadModalInitialTab] = useState<'upload' | 'youtube' | 'topic' | 'record'>('upload');
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintModalInitialTab, setComplaintModalInitialTab] = useState<'submit' | 'history'>('submit');
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [showExplainerModal, setShowExplainerModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'profile' | 'setup' | 'ai' | 'voice' | 'subscription' | 'certificates' | 'app' | 'privacy' | 'notifications'>('profile');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [deleteConfirmSet, setDeleteConfirmSet] = useState<StudySet | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccessToast, setDeleteSuccessToast] = useState<string | null>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  // Helper to open specific settings tab smoothly
  const openSettings = (tab: 'profile' | 'setup' | 'ai' | 'voice' | 'subscription' | 'app' | 'privacy' | 'notifications' = 'profile') => {
    setSettingsInitialTab(tab);
    setShowSettingsModal(true);
    setShowProfileDropdown(false);
    setShowMobileMenu(false);
  };

  // Weekly Run Summary State
  const [weeklySummary, setWeeklySummary] = useState<WeeklyRunSummaryData | null>(null);
  const [showWeeklyRunModal, setShowWeeklyRunModal] = useState(false);
  const [showProfileImageModal, setShowProfileImageModal] = useState(false);
  const [isAiDebriefGenerating, setIsAiDebriefGenerating] = useState(false);
  const [leftTab, setLeftTab] = useState<'study-sets' | 'weekly-sprints'>('study-sets');
  const [runLogToast, setRunLogToast] = useState<string | null>(null);
  const [celebratingMilestone, setCelebratingMilestone] = useState<MilestoneCelebrationData | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activePromoSlide, setActivePromoSlide] = useState(0);

  // Spaced Repetition Review Queue State (Anki-style 1, 3, 7 days)
  const [reviewItems, setReviewItems] = useState<ReviewLessonItem[]>([]);
  const [loadingReviewQueue, setLoadingReviewQueue] = useState(true);
  const [activeReviewSessionModal, setActiveReviewSessionModal] = useState<ReviewLessonItem[] | null>(null);

  const loadReviewQueue = async () => {
    if (!user) return;
    try {
      const queue = await ReviewQueueService.getQueue(user.uid);
      setReviewItems(queue);
      ReviewQueueService.checkAndNotifyDueReviews(user.uid);
    } catch (e) {
      console.warn('Notice loading review queue:', e);
    } finally {
      setLoadingReviewQueue(false);
    }
  };

  const dueReviewCount = reviewItems.filter(i => i.nextReviewDate <= Date.now()).length;

  // Live Notifications & Drop Banner State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [droppedNotification, setDroppedNotification] = useState<NotificationItem | null>(null);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const notificationDropdownRef = useRef<HTMLDivElement | null>(null);

  // Floating Study Focus Timer State (Visible by default and repositionable anywhere)
  const [showFloatingTimer, setShowFloatingTimer] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('learnora_floating_timer_visible');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const handleToggleFloatingTimer = () => {
    setShowFloatingTimer(prev => {
      const next = !prev;
      try {
        localStorage.setItem('learnora_floating_timer_visible', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Maintenance mode state for admin indicator
  const [maintenanceConfig, setMaintenanceConfig] = useState<MaintenanceModeConfig>(() => MaintenanceService.getLocalConfig());

  useEffect(() => {
    const unsub = MaintenanceService.subscribeToMaintenance(setMaintenanceConfig);
    return () => unsub();
  }, []);

  // Close notification center when clicking/tapping outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        notificationDropdownRef.current?.contains(target as Node) ||
        target?.closest?.('[data-notification-center="true"]')
      ) {
        return;
      }
      setShowNotificationCenter(false);
    };
    if (showNotificationCenter) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showNotificationCenter]);

  // Real-time Firestore & Broadcast Live Notification Listener
  useEffect(() => {
    if (!user?.uid) return;

    // Auto-prompt notification permission if opened with ?request_push=1 or ?prompt_notifications=1
    try {
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get('request_push') === '1' || searchParams.get('prompt_notifications') === '1') {
          setTimeout(() => {
            WebPushService.requestNativePermission().then((perm) => {
              if (perm === 'granted' && user?.uid) {
                WebPushService.subscribeDevice(user.uid, user.email || undefined);
              }
            });
            window.history.replaceState({}, '', window.location.pathname);
          }, 700);
        }
      }
    } catch {}

    const unsubscribe = NotificationService.subscribeToLiveNotifications(
      user.uid,
      (updatedList) => {
        setNotifications(updatedList);
      },
      (newNotif) => {
        // Drops smoothly like a normal system notification
        setDroppedNotification(newNotif);
        NotificationService.showNativePhoneNotification(newNotif.title, {
          body: newNotif.message,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: newNotif.id,
          actionUrl: newNotif.actionUrl
        });
      }
    );

    // Foreground service worker push listener (handles Web Push / FCM message routing)
    const unsubPush = WebPushService.listenForMessages((pushData) => {
      if (pushData && pushData.payload) {
        const p = pushData.payload;
        const item: NotificationItem = {
          id: p.data?.id || `push_${Date.now()}`,
          userId: user.uid,
          title: p.title || 'Learnora - Study Reminder',
          message: p.body || p.message || '',
          type: (p.data?.type as any) || 'study-reminder',
          read: false,
          createdAt: Date.now(),
          actionUrl: p.data?.url || 'review-queue',
          actionLabel: 'Open',
          sender: 'Learnora Push Engine'
        };
        NotificationService.showNativePhoneNotification(item.title, {
          body: item.message,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: item.id,
          actionUrl: item.actionUrl
        });
        setDroppedNotification(item);
      }
    });

    // Real-time Community Chat incoming message drop banner across Learnora
    const unsubChatDrops = CommunityChatService.subscribeToAllIncomingMessages(user.uid, (msg) => {
      const room = CommunityChatService.getRoom(msg.roomId);
      setDroppedNotification({
        id: `chat_drop_${msg.id}`,
        userId: user.uid,
        title: `💬 ${msg.userName}${msg.isAdmin ? ' 👑 (Admin)' : ''} in #${room.name.split(' ')[0]}`,
        message: msg.text.length > 90 ? msg.text.slice(0, 90) + '...' : msg.text,
        type: 'chat',
        read: false,
        createdAt: msg.createdAt,
        actionUrl: 'community',
        actionLabel: 'Open Lounge',
        sender: msg.userName
      });
      CommunityChatService.playWhatsAppChime();
      CommunityChatService.triggerWhatsAppVibration();
      CommunityChatService.showNativePhoneNotification(`💬 ${msg.userName} in #${room.name.split(' ')[0]}`, {
        body: msg.text
      });
    });

    // Real-time online learner presence tracking
    const unsubPresence = CommunityChatService.subscribeToOnlinePresence((presenceData) => {
      setOnlineCount(presenceData.totalOnline);
    });

    // Update active user presence
    CommunityChatService.updateUserPresence({
      uid: user.uid,
      email: user.email || '',
      displayName: profile?.displayName || user.displayName || 'Learner',
      avatarUrl: profile?.avatarUrl
    });

    const presenceHeartbeat = setInterval(() => {
      CommunityChatService.updateUserPresence({
        uid: user.uid,
        email: user.email || '',
        displayName: profile?.displayName || user.displayName || 'Learner',
        avatarUrl: profile?.avatarUrl
      });
    }, 30000);

    const handleUnload = () => {
      CommunityChatService.setOfflinePresence(user.uid);
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      unsubscribe();
      unsubPush();
      unsubChatDrops();
      unsubPresence();
      clearInterval(presenceHeartbeat);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [user?.uid, profile?.displayName, profile?.avatarUrl]);

  const unreadNotifCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (user) {
      loadSets();
      loadWeeklyRun();
      loadReviewQueue();
    }
  }, [user, profile?.points, profile?.totalStudyMinutes, profile?.streakDays]);

  const loadWeeklyRun = async (overrideSets?: StudySet[]) => {
    if (!user) return;
    try {
      const setsToUse = overrideSets !== undefined ? overrideSets : studySets;
      const summary = await WeeklyRunService.getWeeklyRunSummary(user.uid, profile, setsToUse);
      setWeeklySummary(summary);

      // Check if 7-day streak milestone was hit and not yet celebrated
      if (summary.streakDays >= 7 && !ConfettiService.isStreakMilestoneCelebrated(user.uid, summary.streakDays)) {
        ConfettiService.markStreakMilestoneCelebrated(user.uid, summary.streakDays);
        ConfettiService.fireMilestoneFireworks(3000);
        setCelebratingMilestone({
          type: '7-day-streak',
          title: `${summary.streakDays}-Day Study Streak Champion!`,
          subtitle: 'Unbelievable dedication! 7 consecutive days of active study locks your concepts into permanent long-term memory.',
          metricLabel: 'Consecutive Streak',
          metricValue: `${summary.streakDays} Days`,
          bonusXP: 200,
          badgeEmoji: '🔥'
        });
      }
    } catch (e) {
      console.warn('Notice loading weekly run summary:', e);
    }
  };

  const triggerStreakCelebration = (streakDays?: number) => {
    const currentStreak = streakDays || profile?.streakDays || weeklySummary?.streakDays || 7;
    ConfettiService.fireGrandCannons();
    setCelebratingMilestone({
      type: '7-day-streak',
      title: currentStreak >= 7 ? `${currentStreak}-Day Study Streak Champion!` : '7-Day Study Streak Milestone!',
      subtitle: '7 days of daily active recall and spaced repetition. Your brain is officially locking in memory retention!',
      metricLabel: 'Consecutive Study Days',
      metricValue: `${currentStreak} Days`,
      bonusXP: 150,
      badgeEmoji: '🔥'
    });
  };

  const handleClaimMilestoneBonus = async (bonusXP: number) => {
    if (updateProfileData && profile) {
      await updateProfileData({
        points: (profile.points || 0) + bonusXP
      });
      setRunLogToast(`🎉 Claimed +${bonusXP} XP milestone reward!`);
      setTimeout(() => setRunLogToast(null), 3000);
    }
  };

  const handleQuickLogStudyTime = async (minutes: number, subject?: string) => {
    if (!user) return;
    try {
      const { updatedSummary, xpEarned } = await WeeklyRunService.logStudyTime(
        user.uid,
        minutes,
        subject || studySets[0]?.subject || 'General Studies',
        profile
      );
      setWeeklySummary(updatedSummary);
      if (updateProfileData && profile) {
        await updateProfileData({
          points: (profile.points || 0) + xpEarned,
          totalStudyMinutes: (profile.totalStudyMinutes || 0) + minutes,
          streakDays: updatedSummary.streakDays
        });
      }

      // 1. Particle pop animation effect on logging
      ConfettiService.fireParticlePop();

      // 2. Check if user achieved the 7-day study streak milestone!
      if (updatedSummary.streakDays >= 7 && !ConfettiService.isStreakMilestoneCelebrated(user.uid, updatedSummary.streakDays)) {
        ConfettiService.markStreakMilestoneCelebrated(user.uid, updatedSummary.streakDays);
        ConfettiService.fireMilestoneFireworks(3000);
        setCelebratingMilestone({
          type: '7-day-streak',
          title: `${updatedSummary.streakDays}-Day Study Streak Champion!`,
          subtitle: 'Unbelievable dedication! 7 consecutive days of active study locks your concepts into permanent long-term memory.',
          metricLabel: 'Consecutive Streak',
          metricValue: `${updatedSummary.streakDays} Days`,
          bonusXP: 200,
          badgeEmoji: '🔥'
        });
      } else if (
        updatedSummary.totalMinutesStudied >= updatedSummary.targetWeeklyMinutes &&
        (weeklySummary?.totalMinutesStudied || 0) < updatedSummary.targetWeeklyMinutes
      ) {
        // Exceeded weekly target milestone
        ConfettiService.fireRainbowStars();
        setCelebratingMilestone({
          type: 'weekly-goal-met',
          title: 'Weekly Study Target Crushed!',
          subtitle: `You exceeded your goal of ${updatedSummary.targetWeeklyMinutes} minutes this week! Phenomenal intellectual momentum.`,
          metricLabel: 'Total Minutes Studied',
          metricValue: `${updatedSummary.totalMinutesStudied} mins`,
          bonusXP: 100,
          badgeEmoji: '🏆'
        });
      }

      setRunLogToast(`+${minutes} mins logged to today's study run! +${xpEarned} XP added!`);
      setTimeout(() => setRunLogToast(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleSprintTask = async (taskId: string) => {
    if (!user) return;
    try {
      const { updatedSummary, xpDelta, completed } = await WeeklyRunService.toggleSprintTask(
        user.uid,
        taskId,
        profile
      );
      setWeeklySummary(updatedSummary);
      if (updateProfileData && profile && xpDelta !== 0) {
        await updateProfileData({
          points: Math.max(0, (profile.points || 0) + xpDelta)
        });
      }
      if (completed) {
        setRunLogToast(`🎯 Goal completed! +${xpDelta} XP awarded!`);
        setTimeout(() => setRunLogToast(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddSprintTask = async (taskData: { title: string; category: any; xpReward: number }) => {
    if (!user) return;
    try {
      const updated = await WeeklyRunService.addCustomSprintTask(user.uid, taskData, profile);
      setWeeklySummary(updated);
      setRunLogToast('🎯 Added new sprint goal!');
      setTimeout(() => setRunLogToast(null), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateAiDebrief = async () => {
    if (!user) return;
    setIsAiDebriefGenerating(true);
    try {
      const updated = await WeeklyRunService.generateAiWeeklyDebrief(user.uid, profile, studySets);
      setWeeklySummary(updated);
      setRunLogToast('✨ Nora updated your Weekly Run Debrief!');
      setTimeout(() => setRunLogToast(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiDebriefGenerating(false);
    }
  };

  const loadSets = async () => {
    if (!user) return;
    setLoadingSets(true);
    try {
      const sets = await DBService.getStudySets(user.uid);
      setStudySets(sets);
      if (sets.length > 0 && !selectedSet) {
        setSelectedSet(sets[0]);
      }
      loadWeeklyRun(sets);
    } catch (e) {
      console.warn('Notice loading study sets:', e);
    } finally {
      setLoadingSets(false);
    }
  };

  const handleStudySetCreated = (newSet: StudySet) => {
    const updated = [newSet, ...studySets];
    setStudySets(updated);
    setSelectedSet(newSet);
    setShowUploadModal(false);
    setActiveView('study-set-detail');
    loadWeeklyRun(updated);
  };

  const handleDeleteStudySet = async (setToDel: StudySet) => {
    setIsDeleting(true);
    try {
      await DBService.deleteStudySet(setToDel.id);
      const updated = studySets.filter(s => s.id !== setToDel.id);
      setStudySets(updated);
      if (selectedSet?.id === setToDel.id) {
        setSelectedSet(null);
        setActiveView('home');
      }
      setDeleteConfirmSet(null);
      setDeleteSuccessToast(`"${setToDel.title}" has been removed.`);
      setTimeout(() => setDeleteSuccessToast(null), 3000);
      loadWeeklyRun(updated);
    } catch (e) {
      console.warn('Error deleting study set:', e);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredSets = studySets.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.subject && s.subject.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const userName = profile?.tutorNickname || profile?.displayName?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'Alex';
  const isOwnerAdmin = isAdminEmail(user?.email);

  return (
    <div className={`${
      activeView === 'tutor' || activeView === 'community'
        ? 'h-[100dvh] max-h-[100dvh] overflow-hidden'
        : 'min-h-screen overflow-x-hidden'
    } bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200`}>
      {/* Live Drop-Down Animated Notification Banner */}
      <LiveNotificationDropBanner
        notification={droppedNotification}
        onDismiss={() => setDroppedNotification(null)}
        onNavigateAction={(actionUrl) => {
          if (actionUrl) {
            setActiveView(actionUrl as any);
          }
        }}
      />

      {/* Persistent Floating Draggable Study Timer (Accessible across all views) */}
      <FloatingStudyTimer
        isVisible={showFloatingTimer}
        onToggleVisibility={handleToggleFloatingTimer}
        activeSubject={selectedSet?.subject || selectedSet?.title || 'General Studies'}
        onLogStudyTime={async (minutes, subject) => {
          await handleQuickLogStudyTime(minutes, subject);
        }}
      />

      {/* Admin Maintenance Mode Active Alert Banner */}
      {isOwnerAdmin && maintenanceConfig.isActive && (
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 sm:px-6 py-2.5 text-xs font-semibold flex items-center justify-between gap-3 shadow-md z-50 border-b border-amber-400/30 animate-fade-in">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-white animate-bounce shrink-0" />
            <span>⚠️ Platform Maintenance Mode is currently ACTIVE for all regular learners.</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveView('admin')}
            className="px-3 py-1 rounded-lg bg-white text-amber-900 font-extrabold hover:bg-amber-50 transition-all shrink-0 text-[11px] shadow-sm active:scale-95 cursor-pointer"
          >
            Manage in Admin Panel
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. TOP GLOBAL NAVIGATION HEADER (MOBILE OPTIMIZED)             */}
      {/* ============================================================== */}
      <header className={`sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-2xs ${activeView === 'tutor' || activeView === 'study-set-detail' || activeView === 'notifications' ? 'hidden' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-3">
          
          {/* Brand Logo & Title on Desktop / Mobile User Greeting */}
          <div className="flex items-center gap-2.5">
            <div 
              onClick={() => setActiveView('home')}
              className="w-10 h-10 rounded-2xl overflow-hidden shadow-md shadow-emerald-950/20 cursor-pointer active:scale-95 transition-transform shrink-0 border border-emerald-800/30"
              title="Learnora Home"
            >
              <img src="/pwa-192x192.png" alt="Learnora Logo" className="w-full h-full object-cover" />
            </div>
            
            <div className="min-w-0">
              {/* Mobile Heading: Hello, Alex! */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none truncate max-w-[130px] sm:max-w-none">
                  Hello, {userName}!
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 shrink-0 sm:hidden" />
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 font-medium leading-tight mt-0.5 hidden xs:block">
                Turn what you have into what you know
              </p>
            </div>
          </div>

          {/* Centered Search Bar on Tablet/Desktop */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What are you looking for..."
                className="w-full pl-11 pr-11 py-2 bg-slate-100/80 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
              />
              <button 
                onClick={() => setActiveView('library')}
                className="absolute right-2.5 top-2 w-6 h-6 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                title="View All Study Sets"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Streak & points badges on desktop */}
            <div className="hidden lg:flex items-center gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => triggerStreakCelebration()}
                className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-2xl border border-amber-200/70 dark:border-amber-800/60 hover:border-amber-400 dark:hover:border-amber-600 hover:scale-105 active:scale-95 transition-all cursor-pointer group shadow-2xs"
                title="Celebrate your study streak with confetti!"
              >
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 group-hover:animate-bounce" />
                <span>{profile?.streakDays || 1}d</span>
                <Sparkles className="w-2.5 h-2.5 text-amber-500 opacity-60 group-hover:opacity-100" />
              </button>
              <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-2xl border border-blue-200/70 dark:border-blue-800/60">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{profile?.points || 180} pts</span>
              </div>
            </div>

            {/* Community Study Lounge & Peer Group Chat Button (Prominently Visible) */}
            <button
              type="button"
              onClick={() => setActiveView('community')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl flex items-center gap-1.5 transition-all relative shrink-0 border cursor-pointer active:scale-95 ${
                activeView === 'community'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 ring-2 ring-blue-500/20'
                  : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-indigo-950/40 text-blue-900 dark:text-blue-100 border-blue-200/90 dark:border-indigo-800 hover:border-blue-400 dark:hover:border-indigo-600 shadow-2xs'
              }`}
              title="Open Community Study Lounge & Peer Chat Rooms"
              aria-label="Open Community Study Lounge"
            >
              <Users className={`w-4 h-4 ${activeView === 'community' ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
              <span className="text-xs font-extrabold hidden md:inline">Community</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                {onlineCount}
              </span>
            </button>

            {/* Theme Toggle Button (Light/Dark Mode Switcher) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-amber-300 items-center justify-center transition-all relative shrink-0 border border-slate-200/60 dark:border-slate-700 shadow-2xs"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 transition-transform duration-300 hover:-rotate-12" />
              )}
            </button>

            {/* Floating Study Focus Timer Toggle Button */}
            <button
              type="button"
              onClick={handleToggleFloatingTimer}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all relative shrink-0 border ${
                showFloatingTimer 
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 ring-2 ring-indigo-500/20 shadow-2xs' 
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200/60 dark:border-slate-700'
              }`}
              title={showFloatingTimer ? 'Hide Floating Focus Timer' : 'Show Floating Focus Timer (Draggable Anywhere)'}
              aria-label="Toggle floating study timer"
            >
              <Clock className="w-4 h-4" />
              {showFloatingTimer && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {/* Notification Bell with Real-time Dropdown & Dynamic Unread Badge */}
            <div className="relative" ref={notificationDropdownRef}>
              <button
                type="button"
                onClick={() => setShowNotificationCenter(prev => !prev)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all relative shrink-0 border border-slate-200/60 dark:border-slate-700"
                title="Notifications & Live Updates"
                aria-label="View notifications and live platform updates"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-pulse">
                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                  </span>
                )}
              </button>

              {showNotificationCenter && (
                <NotificationCenterDropdown
                  notifications={notifications}
                  onClose={() => setShowNotificationCenter(false)}
                  onMarkAsRead={(id) => {
                    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
                    NotificationService.markAsRead(user?.uid || '', id);
                  }}
                  onMarkAllAsRead={() => {
                    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                    NotificationService.markAllAsRead(user?.uid || '', notifications);
                  }}
                  onDeleteNotification={(id) => {
                    setNotifications(prev => prev.filter(n => n.id !== id));
                    NotificationService.deleteNotification(user?.uid || '', id);
                  }}
                  onClearAll={() => {
                    setNotifications([]);
                    NotificationService.clearAll(user?.uid || '', notifications);
                  }}
                  onNavigateAction={(url) => {
                    if (url) setActiveView(url as any);
                  }}
                  onOpenFullView={() => {
                    setShowNotificationCenter(false);
                    setActiveView('notifications');
                  }}
                  onOpenPushSettings={() => {
                    setShowNotificationCenter(false);
                    openSettings('notifications');
                  }}
                  onTriggerTestDrop={() => {
                    NotificationService.playNotificationChime();
                    setDroppedNotification({
                      id: 'test_drop_' + Date.now(),
                      userId: user?.uid || 'all',
                      title: '🔔 Live Platform Update Dropped!',
                      message: 'This is how real-time live updates drop down from the top of the screen on Learnora.',
                      type: 'announcement',
                      read: false,
                      createdAt: Date.now(),
                      priority: 'high',
                      actionUrl: 'review-queue',
                      actionLabel: 'Check Review Queue',
                      sender: 'Learnora System'
                    });
                  }}
                />
              )}
            </div>

            {/* Settings Gear Button (Visible on sm+ screens, mobile drawer has full settings) */}
            <button
              onClick={() => openSettings('profile')}
              className="hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 items-center justify-center transition-all relative shrink-0 border border-slate-200/60 dark:border-slate-700"
              title="Profile & Workspace Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Profile Avatar Button -> Opens Profile Settings Directly */}
            <div className="relative shrink-0 flex items-center gap-1">
              <button 
                type="button"
                onClick={() => openSettings('profile')}
                className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden ring-2 ring-blue-500/30 dark:ring-blue-500/50 hover:ring-blue-600 active:scale-95 transition-all cursor-pointer shrink-0 shadow-2xs block"
                title="Profile & Account Settings"
                aria-label="User profile settings"
              >
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full hidden sm:block" />
              </button>

              {/* Quick options dropdown toggle button on tablet/desktop */}
              <button
                type="button"
                onClick={() => setShowProfileDropdown(prev => !prev)}
                className="hidden sm:flex w-5 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                title="Account options & photo"
                aria-label="More account options"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Profile & Settings Dropdown Menu (If opened via arrow) */}
            <div className="relative" ref={profileDropdownRef}>
              {showProfileDropdown && (
                <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-24px)] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 py-2.5 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                  {/* User Profile Summary Card */}
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-br from-slate-50 via-white to-blue-50/50 dark:from-slate-800 dark:via-slate-800/90 dark:to-blue-950/40 -mt-2.5 mb-2 rounded-t-3xl">
                    <div className="flex items-center gap-3">
                      <div className="relative group w-12 h-12 rounded-full overflow-hidden ring-2 ring-blue-500/30 dark:ring-blue-500/50 shrink-0 bg-slate-200 dark:bg-slate-700">
                        {profile?.avatarUrl ? (
                          <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-blue-600 text-white font-black text-base flex items-center justify-center">
                            {userName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setShowProfileDropdown(false);
                            setShowProfileImageModal(true);
                          }}
                          className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                          title="Change photo"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate leading-tight">
                          {profile?.displayName || userName}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5">
                          {user?.email || 'Student Account'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] font-semibold">
                          <span className="text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-lg border border-blue-200/60 dark:border-blue-800">
                            {profile?.points || 180} pts
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setShowMobileMenu(false);
                              triggerStreakCelebration();
                            }}
                            className="text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-200/60 dark:border-amber-800 flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                            title="Celebrate study streak with confetti"
                          >
                            <Flame className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                            <span>{profile?.streakDays || 1}d streak</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Quick Access Dual Action Buttons */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openSettings('profile')}
                        className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>Profile Settings</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileDropdown(false);
                          setShowProfileImageModal(true);
                        }}
                        className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-98 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all"
                        title="Change profile photo"
                      >
                        <Camera className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Photo</span>
                      </button>
                    </div>

                    {/* Theme Mode Toggle Row inside Profile Dropdown */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {isDark ? (
                          <Moon className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Sun className="w-3.5 h-3.5 text-amber-500" />
                        )}
                        <span>Theme: {isDark ? 'Dark Mode' : 'Light Mode'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={toggleTheme}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all border ${
                          isDark
                            ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 hover:bg-amber-400/30'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                        title="Toggle dark/light mode"
                      >
                        {isDark ? 'Switch Light' : 'Switch Dark'}
                      </button>
                    </div>
                  </div>

                  {/* Dropdown Navigation Menu */}
                  <div className="px-2 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => openSettings('profile')}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white flex items-center gap-2.5 transition-colors"
                    >
                      <User className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="block font-bold text-slate-900 dark:text-slate-100 leading-tight">Profile & Account</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 block leading-tight mt-0.5">Edit name, bio, email & credentials</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileDropdown(false);
                        setShowProfileImageModal(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white flex items-center gap-2.5 transition-colors"
                    >
                      <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="block font-bold text-slate-900 dark:text-slate-100 leading-tight">Change Profile Picture</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 block leading-tight mt-0.5">Upload image, use camera or avatar presets</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => openSettings('setup')}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white flex items-center gap-2.5 transition-colors"
                    >
                      <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="block font-bold text-slate-900 dark:text-slate-100 leading-tight">Learning Goals & Setup</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 block leading-tight mt-0.5">Degree, pacing & learning formats</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => openSettings('ai')}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white flex items-center gap-2.5 transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="block font-bold text-slate-900 dark:text-slate-100 leading-tight">AI Socratic Tutor</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 block leading-tight mt-0.5">Strict grounding & tutoring style</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => openSettings('voice')}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white flex items-center gap-2.5 transition-colors"
                    >
                      <Volume2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="block font-bold text-slate-900 dark:text-slate-100 leading-tight">Voice & Audio Settings</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 block leading-tight mt-0.5">5 curated learning personas &amp; speed</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => openSettings('subscription')}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white flex items-center gap-2.5 transition-colors"
                    >
                      <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="block font-bold text-slate-900 dark:text-slate-100 leading-tight">Subscription & Plan</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">Coming Soon</span>
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 block leading-tight mt-0.5">Plan tiers & pricing (Coming Soon)</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileDropdown(false);
                        setActiveView('weekly-run');
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white flex items-center gap-2.5 transition-colors"
                    >
                      <Trophy className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="block font-bold text-slate-900 dark:text-slate-100 leading-tight">Weekly Run Summary</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 block leading-tight mt-0.5">Cadence, time logged & AI debrief</span>
                      </div>
                    </button>

                    {/* Community Lounge & Peer Chat */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileDropdown(false);
                        setActiveView('community');
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="block font-bold leading-tight">Community Study Lounge</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 block leading-tight mt-0.5">Peer chat rooms, channels &amp; deck sharing</span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                    </button>

                    {isOwnerAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileDropdown(false);
                          setActiveView('admin');
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="block font-bold">Admin Management</span>
                          <span className="text-[10px] text-rose-400 block">Manage users, AI quotas & data</span>
                        </div>
                      </button>
                    )}

                    {/* Student Help & Complaints Desk */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileDropdown(false);
                        setComplaintModalInitialTab('submit');
                        setShowComplaintModal(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <MessageSquareWarning className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="block font-bold leading-tight">Help &amp; Complaints Desk</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 block leading-tight mt-0.5">Report bugs or pedagogical issues</span>
                      </div>
                    </button>
                  </div>

                  {/* Sign Out Section */}
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 px-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileDropdown(false);
                        logout();
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Navigation Menu Button */}
            <button
              type="button"
              onClick={() => setShowMobileMenu(true)}
              className="flex md:hidden w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-slate-100 items-center justify-center transition-all relative shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs"
              title="All Navigation Menus & Tools"
              aria-label="Open navigation menu"
            >
              <Menu className="w-4 h-4 text-slate-700 dark:text-slate-200" />
              {unreadNotifCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
              ) : isAdminEmail(user?.email) ? (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-white dark:ring-slate-900" />
              ) : null}
            </button>

            {/* Quick Upload Button on Desktop */}
            <button
              onClick={() => {
                setUploadModalInitialTab('upload');
                setShowUploadModal(true);
              }}
              className="hidden sm:flex px-3.5 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-blue-500/20 items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload</span>
            </button>
          </div>
        </div>

        {/* Mobile Dedicated Search Input (Visible on mobile screens!) */}
        <div className="md:hidden px-4 pb-2.5 pt-0.5">
          <div className="relative w-full flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What are you looking for..."
                className="w-full pl-10 pr-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-100/90 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
              />
            </div>
            <button 
              onClick={() => setActiveView('library')}
              className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 active:scale-95"
              title="Grid Filter"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Navigation Tabs Bar (Prominently Visible on BOTH Mobile & Desktop when not in focused tutor view) */}
        {activeView !== 'tutor' && (
          <div className="relative border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95">
            {/* Subtle scroll edge cue for mobile screens */}
            <div className="md:hidden pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-slate-900 via-white/80 dark:via-slate-900/80 to-transparent z-10" />

            {/* Mobile-Optimized Direct Nav Bar (Visible on mobile screens) */}
            <div className="md:hidden flex items-center overflow-x-auto no-scrollbar px-3 py-2 gap-1.5 touch-pan-x">
              {/* 1. Study Sets */}
              <button
                onClick={() => setActiveView('library')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap active:scale-95 ${
                  activeView === 'library' || activeView === 'study-set-detail'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent dark:border-slate-700/50'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Study Sets</span>
                {studySets.length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                    activeView === 'library' || activeView === 'study-set-detail'
                      ? 'bg-white text-blue-700'
                      : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                  }`}>
                    {studySets.length}
                  </span>
                )}
              </button>

              {/* 2. Flashcards */}
              <button
                onClick={() => {
                  if (!selectedSet && studySets.length > 0) {
                    setSelectedSet(studySets[0]);
                  }
                  setActiveView('flashcards');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap active:scale-95 ${
                  activeView === 'flashcards'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent dark:border-slate-700/50'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Flashcards</span>
              </button>

              {/* 3. Practice Questions */}
              <button
                onClick={() => {
                  if (!selectedSet && studySets.length > 0) {
                    setSelectedSet(studySets[0]);
                  }
                  setActiveView('quiz');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap active:scale-95 ${
                  activeView === 'quiz'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent dark:border-slate-700/50'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>Practice Questions</span>
              </button>

              {/* Review Queue (Spaced Repetition 1, 3, 7 days) */}
              <button
                onClick={() => setActiveView('review-queue')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap active:scale-95 ${
                  activeView === 'review-queue'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent dark:border-slate-700/50'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Review Queue</span>
                {dueReviewCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                    activeView === 'review-queue'
                      ? 'bg-white text-blue-700'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                  }`}>
                    {dueReviewCount}
                  </span>
                )}
              </button>

              {/* 4. Admin Panel */}
              {isOwnerAdmin && (
                <button
                  onClick={() => setActiveView('admin')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap active:scale-95 ${
                    activeView === 'admin'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
                  <span>Admin Panel</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200">
                    Owner
                  </span>
                </button>
              )}

              {/* Community Study Lounge on Mobile */}
              <button
                onClick={() => setActiveView('community')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap active:scale-95 ${
                  activeView === 'community'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:bg-slate-800 text-blue-800 dark:text-blue-300 border border-blue-200/70 dark:border-slate-700/60'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Community</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  {onlineCount}
                </span>
              </button>

              {/* 5. Nora AI Tutor */}
              <button
                onClick={() => setActiveView('tutor')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap active:scale-95 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200/60 dark:border-indigo-800"
              >
                <MessageSquare className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                <span>Nora AI</span>
              </button>

              {/* 6. Certificates (Coming Soon) */}
              <button
                onClick={() => setActiveView('certificates')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap active:scale-95 ${
                  activeView === 'certificates'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent dark:border-slate-700/50'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>Certificates</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                  Soon
                </span>
              </button>

              {/* All Tools & Co Drawer Trigger */}
              <button
                onClick={() => setShowMobileMenu(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-transparent dark:border-slate-700/50 transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                title="All Navigation Menus & Tools"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>&amp; Co</span>
              </button>
            </div>

            {/* Desktop Full Navigation Tabs Bar */}
            <div className="hidden md:flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 items-center justify-between py-2 sm:py-2.5 gap-2">
              <nav className="flex items-center gap-1.5 sm:gap-2 shrink-0 overflow-x-auto no-scrollbar">
                {[
                  { id: 'home', label: 'Dashboard', shortLabel: 'Home', icon: Home },
                  { id: 'library', label: `Study Sets (${studySets.length})`, shortLabel: `Study Sets (${studySets.length})`, icon: BookOpen },
                  { id: 'flashcards', label: 'Flashcards', shortLabel: 'Flashcards', icon: Layers },
                  { id: 'quiz', label: 'Practice Questions', shortLabel: 'Practice Qs', icon: Target },
                  { id: 'review-queue', label: 'Review Queue', shortLabel: 'Review', icon: Clock, badge: dueReviewCount > 0 ? `${dueReviewCount} Due` : undefined },
                  { id: 'tutor', label: 'Nora AI Tutor', shortLabel: 'Nora AI', icon: MessageSquare, highlight: true },
                  { id: 'community', label: `Community (${onlineCount} online)`, shortLabel: 'Community', icon: Users, badge: `${onlineCount} Online`, highlight: true },
                  ...(isOwnerAdmin ? [
                    { id: 'admin', label: 'Admin Panel', shortLabel: 'Admin Panel', icon: ShieldCheck, admin: true }
                  ] : []),
                  { id: 'essay-grader', label: 'Essay Grader', shortLabel: 'Essays', icon: FileCheck },
                  { id: 'study-plan', label: 'Study Plan', shortLabel: 'Study Plan', icon: CalendarIcon },
                  { id: 'progress', label: 'Analytics', shortLabel: 'Analytics', icon: TrendingUp },
                  { id: 'weekly-run', label: 'Weekly Run', shortLabel: 'Weekly Run', icon: Trophy, badge: 'Sprint' },
                  { id: 'cognitive-mind', label: "Nora's Mind", shortLabel: "AI Mind", icon: BrainCircuit, badge: 'AI' },
                  { id: 'certificates', label: 'Certificates', shortLabel: 'Certs', icon: Award, badge: 'Soon' }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = (activeView as string) === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        if (tab.id === 'flashcards' || tab.id === 'quiz') {
                          if (!selectedSet && studySets.length > 0) {
                            setSelectedSet(studySets[0]);
                          }
                        }
                        setActiveView(tab.id as ActiveView);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap active:scale-95 ${
                        isActive
                          ? tab.admin
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-blue-600 text-white shadow-xs'
                          : tab.admin
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200/80 dark:border-rose-800'
                            : tab.highlight
                              ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-100/60 dark:hover:bg-blue-900/40 bg-blue-50/80 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 bg-transparent'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-indigo-100 text-indigo-700">
                          {tab.badge}
                        </span>
                      )}
                      {tab.admin && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 text-rose-800">
                          {isAdminEmail(user?.email) ? 'Owner' : 'Admin'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* ============================================================== */}
      {/* 2. MAIN WORKSPACE CONTENT ROUTER                               */}
      {/* ============================================================== */}
      <main className={`flex-1 w-full mx-auto min-h-0 ${
        activeView === 'tutor'
          ? 'p-0 max-w-none h-[100dvh] sm:h-[calc(100dvh-64px)] flex flex-col overflow-hidden'
          : activeView === 'study-set-detail' || activeView === 'notifications' || activeView === 'community'
            ? 'p-0 max-w-none h-full flex flex-col overflow-hidden'
            : 'max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8 pb-32 md:pb-12'
      }`}>
        
        {/* Toast Notification */}
        {deleteSuccessToast && (
          <div className="fixed top-20 right-4 left-4 sm:left-auto sm:right-6 z-50 p-3.5 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{deleteSuccessToast}</span>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* VIEW: HOME DASHBOARD (MOBILE-OPTIMIZED FIGMA LAYOUT)         */}
        {/* ------------------------------------------------------------ */}
        {activeView === 'home' && (
          <div className="space-y-5 sm:space-y-8 animate-fade-in">
            
            {/* HERO PROMOTIONAL BANNER: Royal Cobalt Blue Card matching Screen 1 */}
            <div className="relative w-full rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-5 sm:p-8 text-white overflow-hidden shadow-lg shadow-blue-600/25">
              {/* Subtle curved background circles (placed away from mascot to prevent blur haze) */}
              <div className="absolute -top-16 -left-10 w-52 h-52 rounded-full bg-white/10 blur-xl pointer-events-none" />
              <div className="absolute -bottom-10 left-10 w-36 h-36 rounded-full bg-blue-400/20 pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between">
                {/* Left Text Block (max-w-[65%] on mobile so mascot fits beside it without wrapping!) */}
                <div className="max-w-[65%] sm:max-w-xl space-y-1.5 sm:space-y-2.5">
                  <span className="inline-block text-[10px] sm:text-xs font-bold text-blue-100 tracking-wide uppercase">
                    AI Study Workspace 2026
                  </span>

                  <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight">
                    Master Your Studies <span className="text-blue-200">with Nora AI</span>
                  </h1>

                  <p className="text-[11px] sm:text-xs text-blue-100/90 font-medium leading-relaxed line-clamp-2 sm:line-clamp-none">
                    Turn lecture slides, PDFs, notes, and curriculum into interactive flashcards, practice quizzes, and 1-on-1 Socratic tutoring.
                  </p>

                  <div className="pt-1.5 sm:pt-2 flex flex-wrap items-center gap-2 sm:gap-3">
                    <button
                      onClick={() => {
                        if (studySets.length > 0) {
                          setSelectedSet(studySets[0]);
                          setActiveView('flashcards');
                        } else {
                          setShowUploadModal(true);
                        }
                      }}
                      className="px-4 py-2 sm:px-5 sm:py-2.5 bg-white hover:bg-blue-50 active:scale-95 text-blue-700 text-xs font-black rounded-xl sm:rounded-2xl shadow-xs transition-all flex items-center gap-1"
                    >
                      <span>{studySets.length > 0 ? 'Review Now' : 'Get Started'}</span>
                      <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>

                    <button
                      onClick={() => setActiveView('tutor')}
                      className="flex px-3.5 py-2 sm:px-4 sm:py-2.5 bg-blue-500/30 hover:bg-blue-500/40 text-white text-xs font-bold rounded-xl sm:rounded-2xl border border-white/20 backdrop-blur-md transition-all items-center gap-1.5 active:scale-95 shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Ask Nora AI</span>
                    </button>
                  </div>
                </div>

                {/* Right 3D AI Robot Mascot - Crisp, Sharp, High-Definition without blur */}
                <div className="relative shrink-0 flex items-center justify-center -mr-1 sm:mr-0 pointer-events-none">
                  <div className="transition-transform duration-500 hover:scale-105">
                    {/* Size 128 on mobile (fits beside text), size 200 on desktop */}
                    <div className="sm:hidden">
                      <AiRobotMascot variant="winking" size={128} />
                    </div>
                    <div className="hidden sm:block">
                      <AiRobotMascot variant="waving" size={200} showBubble={true} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dots Pagination Indicator matching Screen 1 */}
              <div className="flex items-center justify-center gap-1.5 pt-3 sm:pt-4">
                <button 
                  onClick={() => setActivePromoSlide(0)}
                  className={`h-1.5 rounded-full transition-all ${activePromoSlide === 0 ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`} 
                />
                <button 
                  onClick={() => setActivePromoSlide(1)}
                  className={`h-1.5 rounded-full transition-all ${activePromoSlide === 1 ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`} 
                />
                <button 
                  onClick={() => setActivePromoSlide(2)}
                  className={`h-1.5 rounded-full transition-all ${activePromoSlide === 2 ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`} 
                />
              </div>
            </div>

            {/* QUICK MATERIAL UPLOAD BUTTONS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
              {[
                { label: 'Upload Document', tab: 'upload', desc: 'PDF, Word, PPTX', icon: Upload, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60' },
                { label: 'Paste YouTube', tab: 'youtube', desc: 'Video transcript', icon: Youtube, color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60', isComingSoon: true },
                { label: 'Generate Topic', tab: 'topic', desc: 'AI curriculum', icon: FileText, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60' },
                { label: 'Record Lecture', tab: 'record', desc: 'Voice microphone', icon: Mic, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60' }
              ].map((act, i) => {
                const Icon = act.icon;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setUploadModalInitialTab(act.tab as any);
                      setShowUploadModal(true);
                    }}
                    className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md active:scale-95 transition-all text-left group shadow-2xs relative"
                  >
                    {act.isComingSoon && (
                      <span className="absolute top-3 right-3 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shadow-2xs">
                        Coming Soon
                      </span>
                    )}
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-2.5 ${act.color} group-hover:scale-105 transition-transform`}>
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug truncate">
                      {act.label}
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 font-medium mt-0.5 truncate">{act.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* TWO-COLUMN LAYOUT: WEEKLY RUN SUMMARY (STUDY SETS & SPRINTS) & METRICS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              
              {/* LEFT 2 COLUMNS: WEEKLY COURSEWORK & STUDY SETS / SPRINT GOALS */}
              <div className="lg:col-span-2 space-y-3.5 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                      Weekly Coursework &amp; Study Runs
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-400 font-medium">
                      Active syllabus sets &amp; weekly sprint milestones
                    </p>
                  </div>

                  {/* View Switcher: Study Sets vs Weekly Sprints */}
                  <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl self-start sm:self-auto shadow-2xs border border-transparent dark:border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => setLeftTab('study-sets')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        leftTab === 'study-sets'
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-2xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      Study Sets ({studySets.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setLeftTab('weekly-sprints')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        leftTab === 'weekly-sprints'
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-2xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      <span>Weekly Sprints</span>
                      {weeklySummary && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                          {weeklySummary.sprintTasks.filter(t => t.completed).length}/{weeklySummary.sprintTasks.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* TAB 1: WEEKLY SPRINTS & GOALS */}
                {leftTab === 'weekly-sprints' && weeklySummary && (
                  <WeeklyRunSprintList
                    tasks={weeklySummary.sprintTasks}
                    onToggleTask={handleToggleSprintTask}
                    onAddTask={handleAddSprintTask}
                    onNavigateAction={(category) => {
                      if (category === 'tutor') setActiveView('tutor');
                      else if (category === 'quiz') setActiveView('quiz');
                      else if (category === 'flashcards') setActiveView('flashcards');
                      else setActiveView('library');
                    }}
                  />
                )}

                {/* TAB 2: ACTIVE STUDY SETS */}
                {leftTab === 'study-sets' && (
                  <>
                    {loadingSets ? (
                      <div className="py-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
                        Loading your study sets...
                      </div>
                    ) : studySets.length === 0 ? (
                      /* Empty state styled cleanly */
                      <div className="p-6 sm:p-10 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3 shadow-2xs">
                        <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-slate-100">Your study space is ready</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                            Upload lecture slides or notes. Nora AI will extract structured summaries, create flashcards, and guide your Socratic review.
                          </p>
                        </div>
                        <button
                          onClick={() => setShowUploadModal(true)}
                          className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 inline-flex items-center gap-1.5 active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Upload First Document</span>
                        </button>
                      </div>
                    ) : (
                      /* Live Study Sets formatted with clean horizontal mobile row aesthetic & Weekly Run progress */
                      <div className="space-y-2.5 sm:space-y-3">
                        {filteredSets.slice(0, 5).map((set) => (
                          <div
                            key={set.id}
                            onClick={() => {
                              setSelectedSet(set);
                              setActiveView('study-set-detail');
                            }}
                            className="p-3.5 sm:p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md transition-all flex items-center justify-between gap-3 cursor-pointer group shadow-2xs active:scale-[0.99]"
                          >
                            {/* Course Icon & Details */}
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug truncate">
                                    {set.title}
                                  </h3>
                                </div>
                                <p className="text-[11px] text-slate-400 dark:text-slate-400 font-medium truncate mt-0.5">
                                  <span className="text-blue-600 dark:text-blue-400 font-bold uppercase">{set.subject || 'General'}</span>
                                  <span className="mx-1">·</span>
                                  <span>{set.materials?.length || 1} source</span>
                                  <span className="mx-1">·</span>
                                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Weekly Run: {set.progressPercent || 75}% pace</span>
                                </p>
                              </div>
                            </div>

                            {/* Open Button / Status Indicator */}
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="hidden sm:inline text-xs font-bold text-blue-600 dark:text-blue-400">
                                Open Set
                              </span>
                              <button 
                                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-blue-50 dark:bg-blue-950/60 group-hover:bg-blue-600 group-hover:text-white text-blue-600 dark:text-blue-400 flex items-center justify-center transition-all shrink-0"
                                title="Open Study Set"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* RIGHT 1 COLUMN: INTERACTIVE WEEKLY RUN SUMMARY CARD & METRICS */}
              <div className="space-y-3.5 sm:space-y-4">
                {weeklySummary ? (
                  <WeeklyRunSummaryCard
                    summary={weeklySummary}
                    profile={profile}
                    onOpenModal={() => setShowWeeklyRunModal(true)}
                    onQuickLogTime={handleQuickLogStudyTime}
                    onGenerateAiDebrief={handleGenerateAiDebrief}
                    isAiGenerating={isAiDebriefGenerating}
                    onTriggerStreakCelebration={() => triggerStreakCelebration()}
                  />
                ) : (
                  <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 dark:text-slate-500">
                    Loading your weekly run summary...
                  </div>
                )}

                {/* Spaced Repetition Review Queue Card (Anki-style 1, 3, 7 days) */}
                <ReviewQueueCard
                  items={reviewItems}
                  onStartReviewSession={(itemsToReview) => {
                    setActiveReviewSessionModal(itemsToReview || (dueReviewCount > 0 ? reviewItems.filter(i => i.nextReviewDate <= Date.now()) : reviewItems));
                  }}
                  onOpenFullQueue={() => setActiveView('review-queue')}
                  onQuickReviewItem={(item) => setActiveReviewSessionModal([item])}
                />

                {/* Socratic AI Tutor Card */}
                <div 
                  onClick={() => setActiveView('tutor')}
                  className="p-4 sm:p-5 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl sm:rounded-3xl text-white shadow-md shadow-blue-500/20 cursor-pointer active:scale-98 transition-all relative overflow-hidden group"
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white/20 flex items-center justify-center overflow-hidden">
                      <AiRobotMascot variant="face" size={34} />
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-white/20 text-white uppercase tracking-wider">
                      Live AI Tutor
                    </span>
                  </div>

                  <h3 className="font-black text-sm sm:text-base text-white">Nora Socratic AI Tutor</h3>
                  <p className="text-[11px] sm:text-xs text-blue-100/90 leading-relaxed mt-1">
                    Ask questions, practice voice dialogues, and receive real-time explanations adapted to your learning style.
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-white/20 flex items-center justify-between text-xs font-bold text-white">
                    <span>Start Socratic Session</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Verified Academic Certificates Card (Coming Soon) */}
                <div 
                  onClick={() => setActiveView('certificates')}
                  className="p-4 sm:p-5 bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-slate-50 dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 rounded-2xl sm:rounded-3xl border border-amber-300/70 dark:border-amber-900/40 shadow-2xs cursor-pointer active:scale-98 transition-all relative overflow-hidden group hover:border-amber-400 dark:hover:border-amber-700"
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-2.5">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-500/15 dark:bg-amber-500/25 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <Award className="w-5 h-5" />
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      Coming Soon
                    </span>
                  </div>

                  <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Verified Academic Certificates
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                    Earn official accredited certificates with cryptographic verification as you master your coursework.
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400">
                    <span>Preview Certificates &amp; Waitlist</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* VIEW: STUDY SETS LIBRARY                                      */}
        {/* ------------------------------------------------------------ */}
        {activeView === 'library' && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Study Sets Library
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  All your uploaded lecture notes, syllabus documents, and flashcard sets
                </p>
              </div>

              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-blue-500/20 inline-flex items-center gap-1.5 self-start"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Study Set</span>
              </button>
            </div>

            {studySets.length === 0 ? (
              <div className="p-8 sm:p-12 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-center">
                <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">No study sets uploaded yet</h3>
                <p className="text-xs text-slate-400 dark:text-slate-400 mt-1">Upload a PDF or paste notes to begin studying.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredSets.map((set) => (
                  <div
                    key={set.id}
                    onClick={() => {
                      setSelectedSet(set);
                      setActiveView('study-set-detail');
                    }}
                    className="p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all flex flex-col justify-between cursor-pointer group shadow-2xs active:scale-[0.99]"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 uppercase">
                          {set.subject || 'General'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmSet(set);
                          }}
                          className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {set.title}
                      </h3>
                      <p className="text-xs text-slate-400 dark:text-slate-400 mt-1 line-clamp-2">
                        {set.description || (set.materials?.length ? `${set.materials[0].name}` : 'Course notes')}
                      </p>
                    </div>

                    <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{set.materials?.length || 1} source file</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        <span>Open Set</span>
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* VIEW: STUDY SET DETAIL VIEW (FULL WORKSPACE)                 */}
        {/* ------------------------------------------------------------ */}
        {activeView === 'study-set-detail' && selectedSet && (
          <StudySetDetailView
            studySet={selectedSet}
            onBack={() => setActiveView('home')}
            onOpenTutor={() => setActiveView('tutor')}
            onOpenFlashcards={() => setActiveView('flashcards')}
            onOpenQuiz={() => setActiveView('quiz')}
            onOpenAudio={() => setShowAudioModal(true)}
            onOpenExplainer={() => setShowExplainerModal(true)}
            onDeleteStudySet={() => handleDeleteStudySet(selectedSet)}
            onOpenCertificates={() => setActiveView('certificates')}
          />
        )}

        {/* VIEW: NORA SOCRATIC AI TUTOR (FULL-WIDTH WORKSPACE) */}
        {activeView === 'tutor' && (
          <div className="w-full h-full flex flex-col flex-1 min-h-0 overflow-hidden bg-white dark:bg-slate-950">
            <NoraTutorView
              userId={user?.uid || 'guest'}
              studentName={userName}
              userAvatarUrl={profile?.avatarUrl}
              studySet={selectedSet}
              onBack={() => setActiveView('home')}
              onOpenMobileNav={() => setShowMobileMenu(true)}
              onNavigateTab={(tab) => {
                if (tab === 'quiz' && !selectedSet && studySets.length > 0) {
                  setSelectedSet(studySets[0]);
                }
                if (tab === 'flashcards' && !selectedSet && studySets.length > 0) {
                  setSelectedSet(studySets[0]);
                }
                setActiveView(tab);
              }}
              hasBottomDock={false}
              availableStudySets={studySets}
              onSelectStudySet={(set) => setSelectedSet(set)}
              onOpenUploadModal={() => setShowUploadModal(true)}
            />
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* VIEW: FLASHCARDS SESSION                                     */}
        {/* ------------------------------------------------------------ */}
        {activeView === 'flashcards' && (
          <div className="space-y-4 animate-fade-in">
            <button
              onClick={() => setActiveView('home')}
              className="px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
            >
              ← Back to Dashboard
            </button>
            {selectedSet ? (
              <FlashcardSession
                studySet={selectedSet}
                onBack={() => setActiveView('home')}
              />
            ) : (
              <div className="p-8 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Please select a study set first</h3>
                <button onClick={() => setActiveView('library')} className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 underline">
                  Go to Library
                </button>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* VIEW: PRACTICE QUIZ SESSION                                  */}
        {/* ------------------------------------------------------------ */}
        {activeView === 'quiz' && (
          <div className="space-y-4 animate-fade-in">
            <button
              onClick={() => setActiveView('home')}
              className="px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
            >
              ← Back to Dashboard
            </button>
            {selectedSet ? (
              <QuizSession
                userId={user?.uid || 'guest'}
                studySet={selectedSet}
                onBack={() => setActiveView('home')}
              />
            ) : (
              <div className="p-8 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Please select a study set first</h3>
                <button onClick={() => setActiveView('library')} className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 underline">
                  Go to Library
                </button>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* VIEW: ESSAY GRADER                                           */}
        {/* ------------------------------------------------------------ */}
        {activeView === 'essay-grader' && (
          <div className="animate-fade-in">
            <EssayGraderView
              userId={user?.uid || 'guest'}
              onBack={() => setActiveView('home')}
            />
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* VIEW: ADAPTIVE STUDY PLAN                                    */}
        {/* ------------------------------------------------------------ */}
        {activeView === 'study-plan' && (
          <div className="animate-fade-in">
            <StudyPlanView
              userId={user?.uid || 'guest'}
              onBack={() => setActiveView('home')}
            />
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* VIEW: PROGRESS & ANALYTICS                                   */}
        {/* ------------------------------------------------------------ */}
        {activeView === 'progress' && (
          <div className="animate-fade-in">
            <ProgressView
              userId={user?.uid || 'guest'}
              profile={profile}
              onBack={() => setActiveView('home')}
              onOpenWeeklyRun={() => setShowWeeklyRunModal(true)}
              onOpenCertificates={() => setActiveView('certificates')}
            />
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* VIEW: NORA'S COGNITIVE MIND DASHBOARD                        */}
        {/* ------------------------------------------------------------ */}
        {activeView === 'cognitive-mind' && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Nora's Cognitive Self-Learning Mind</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Autonomous student modeling &amp; real-time pedagogical adjustments</p>
              </div>
              <button
                onClick={() => setActiveView('home')}
                className="px-3.5 py-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                ← Back
              </button>
            </div>
            <NoraCognitiveDashboard
              userId={user?.uid || ''}
              studentName={userName}
            />
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* VIEW: WEEKLY RUN SUMMARY (DEDICATED FULL VIEW)               */}
        {/* ------------------------------------------------------------ */}
        {activeView === 'weekly-run' && weeklySummary && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Weekly Run Summary &amp; Study Sprints
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {weeklySummary.weekRangeLabel} · Weekly cadence &amp; Nora AI diagnostics
                </p>
              </div>
              <button
                onClick={() => setActiveView('home')}
                className="px-3.5 py-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs transition-colors"
              >
                ← Back to Dashboard
              </button>
            </div>

            <WeeklyRunSummaryCard
              summary={weeklySummary}
              profile={profile}
              onOpenModal={() => setShowWeeklyRunModal(true)}
              onQuickLogTime={handleQuickLogStudyTime}
              onGenerateAiDebrief={handleGenerateAiDebrief}
              isAiGenerating={isAiDebriefGenerating}
              onTriggerStreakCelebration={() => triggerStreakCelebration()}
            />

            <div className="mt-6 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <WeeklyRunSprintList
                tasks={weeklySummary.sprintTasks}
                onToggleTask={handleToggleSprintTask}
                onAddTask={handleAddSprintTask}
                onNavigateAction={(category) => {
                  if (category === 'tutor') setActiveView('tutor');
                  else if (category === 'quiz') setActiveView('quiz');
                  else if (category === 'flashcards') setActiveView('flashcards');
                  else setActiveView('library');
                }}
              />
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* VIEW: ADMIN PANEL (RESTRICTED TO OWNER adedayoademola171@gmail.com) */}
        {/* ------------------------------------------------------------ */}
        {activeView === 'admin' && (
          isOwnerAdmin ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-md p-4 sm:p-6 animate-fade-in">
              <AdminPanel
                currentUserEmail={user?.email || null}
                onBack={() => setActiveView('home')}
                onOpenCommunity={() => setActiveView('community')}
              />
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-md p-8 text-center animate-fade-in space-y-4 max-w-md mx-auto my-12">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-serif">Access Restricted</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                The administration section is strictly reserved for the owner account ({ADMIN_EMAIL}).
              </p>
              <button
                onClick={() => setActiveView('home')}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all"
              >
                Return to Dashboard
              </button>
            </div>
          )
        )}

        {/* ------------------------------------------------------------ */}
        {/* VIEW: REVIEW QUEUE (SPACED REPETITION 1, 3, 7 DAYS)          */}
        {/* ------------------------------------------------------------ */}
        {activeView === 'review-queue' && (
          <ReviewQueueView
            userId={user?.uid || 'learner'}
            items={reviewItems}
            studySets={studySets}
            onQueueUpdated={(updated) => setReviewItems(updated)}
            onOpenStudySet={(setId) => {
              const found = studySets.find(s => s.id === setId);
              if (found) {
                setSelectedSet(found);
                setActiveView('study-set-detail');
              }
            }}
            onAskNora={(_topic) => {
              setActiveView('tutor');
            }}
            onBackToDashboard={() => setActiveView('home')}
          />
        )}

        {/* ------------------------------------------------------------ */}
        {/* VIEW: CERTIFICATES & CREDENTIALS (COMING SOON)               */}
        {/* ------------------------------------------------------------ */}
        {activeView === 'certificates' && (
          <CertificatesComingSoonView
            onBack={() => setActiveView('home')}
            onNavigateView={(view) => setActiveView(view as ActiveView)}
          />
        )}

        {/* ------------------------------------------------------------ */}
        {/* VIEW: NOTIFICATIONS & LIVE REAL-TIME UPDATES                 */}
        {/* ------------------------------------------------------------ */}
        {activeView === 'notifications' && (
          <NotificationsView
            notifications={notifications}
            onBack={() => setActiveView('home')}
            onMarkAsRead={(id) => {
              setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
              NotificationService.markAsRead(user?.uid || '', id);
            }}
            onMarkAllAsRead={() => {
              setNotifications(prev => prev.map(n => ({ ...n, read: true })));
              NotificationService.markAllAsRead(user?.uid || '', notifications);
            }}
            onDeleteNotification={(id) => {
              setNotifications(prev => prev.filter(n => n.id !== id));
              NotificationService.deleteNotification(user?.uid || '', id);
            }}
            onClearAll={() => {
              setNotifications([]);
              NotificationService.clearAll(user?.uid || '', notifications);
            }}
            onNavigateAction={(url) => {
              if (url) setActiveView(url as any);
            }}
            userId={user?.uid}
            onOpenPushSettings={() => {
              openSettings('notifications');
            }}
            onTriggerTestLiveUpdate={() => {
              NotificationService.triggerTestLiveUpdate(user?.uid || '', (notif) => {
                setDroppedNotification(notif);
              });
            }}
            onTriggerTestStudyReminder={() => {
              NotificationService.triggerTestStudyReminder(user?.uid || '', (notif) => {
                setDroppedNotification(notif);
              });
            }}
            onTriggerTestDrop={() => {
              NotificationService.triggerTestLiveUpdate(user?.uid || '', (notif) => {
                setDroppedNotification(notif);
              });
            }}
          />
        )}

        {/* ------------------------------------------------------------ */}
        {/* VIEW: COMMUNITY STUDY LOUNGE & PEER GROUP CHAT               */}
        {/* ------------------------------------------------------------ */}
        {activeView === 'community' && (
          <CommunityChatView
            studySets={studySets}
            onOpenStudySet={(deck) => {
              setSelectedSet(deck);
              setActiveView('study-set-detail');
            }}
            onBack={() => setActiveView('home')}
          />
        )}
      </main>

      {/* ============================================================== */}
      {/* 4. MODALS (UPLOAD, SETTINGS, AUDIO, EXPLAINER, DELETE)         */}
      {/* ============================================================== */}
      {showUploadModal && (
        <MaterialUploadModal
          userId={user?.uid || 'guest'}
          initialTab={uploadModalInitialTab}
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleStudySetCreated}
        />
      )}

      {/* Student Complaints & Help Desk Modal */}
      {showComplaintModal && (
        <ComplaintModal
          userId={user?.uid || 'guest'}
          userEmail={user?.email || ''}
          userName={profile?.displayName || userName}
          studySets={studySets}
          initialTab={complaintModalInitialTab}
          onClose={() => setShowComplaintModal(false)}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          initialTab={settingsInitialTab}
          onClose={() => setShowSettingsModal(false)}
          onRerunSetup={onRerunSetup}
        />
      )}

      {/* Profile Image & Avatar Picker Modal */}
      <ProfileImageModal
        isOpen={showProfileImageModal}
        onClose={() => setShowProfileImageModal(false)}
        onOpenProfileSettings={() => {
          setShowProfileImageModal(false);
          openSettings('profile');
        }}
      />

      {/* Comprehensive Weekly Run Summary & Analytics Modal */}
      {weeklySummary && (
        <WeeklyRunModal
          isOpen={showWeeklyRunModal}
          onClose={() => setShowWeeklyRunModal(false)}
          summary={weeklySummary}
          profile={profile}
          studySets={studySets}
          onLogTime={handleQuickLogStudyTime}
          onToggleTask={handleToggleSprintTask}
          onAddTask={handleAddSprintTask}
          onGenerateAiDebrief={handleGenerateAiDebrief}
          isAiGenerating={isAiDebriefGenerating}
          onNavigateToTutorWithPrompt={() => {
            setActiveView('tutor');
          }}
          onNavigateAction={(category) => {
            if (category === 'tutor') setActiveView('tutor');
            else if (category === 'quiz') setActiveView('quiz');
            else if (category === 'flashcards') setActiveView('flashcards');
            else setActiveView('library');
          }}
          onTriggerStreakCelebration={() => {
            setShowWeeklyRunModal(false);
            triggerStreakCelebration();
          }}
        />
      )}

      {/* Spaced Repetition Anki Review Session Modal */}
      {activeReviewSessionModal && activeReviewSessionModal.length > 0 && (
        <ReviewSessionModal
          userId={user?.uid || 'learner'}
          itemsToReview={activeReviewSessionModal}
          onClose={() => setActiveReviewSessionModal(null)}
          onItemReviewed={(_updatedItem, allItems) => {
            setReviewItems(allItems);
          }}
          onOpenStudySet={(setId) => {
            const found = studySets.find(s => s.id === setId);
            if (found) {
              setSelectedSet(found);
              setActiveView('study-set-detail');
            }
          }}
          onAskNora={(_topic) => {
            setActiveView('tutor');
          }}
        />
      )}

      {/* Floating Run Log Notification Toast */}
      {runLogToast && (
        <div className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-50 bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{runLogToast}</span>
        </div>
      )}

      {/* Milestone & 7-Day Streak Celebration Particle Confetti Modal */}
      <MilestoneCelebrationModal
        milestone={celebratingMilestone}
        onClose={() => setCelebratingMilestone(null)}
        onClaimBonus={handleClaimMilestoneBonus}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmSet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-slate-900 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-base text-slate-900">Delete Study Set?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong>"{deleteConfirmSet.title}"</strong>? This will remove all associated flashcards and notes.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                disabled={isDeleting}
                onClick={() => setDeleteConfirmSet(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={() => handleDeleteStudySet(deleteConfirmSet)}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. MOBILE FULL NAVIGATION DRAWER (STUDY TOOLS, ADMIN & CO)     */}
      {/* ============================================================== */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="fixed inset-0" 
            onClick={() => setShowMobileMenu(false)} 
          />
          <div className="relative z-10 bg-white dark:bg-slate-900 rounded-t-3xl max-h-[88vh] overflow-y-auto p-5 space-y-4 shadow-2xl border-t border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <BrainCircuit className="w-5 h-5 text-blue-100" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 font-serif">Learnora Navigation</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Study sets, flashcards, practice & tools</p>
                </div>
              </div>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center active:scale-95 border border-transparent dark:border-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Theme Switcher in Mobile Drawer */}
            <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-amber-300 shadow-2xs">
                  {isDark ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block leading-tight">
                    {isDark ? 'Dark Mode' : 'Light Mode'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    {isDark ? 'Comfortable night studying' : 'Clean high contrast'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  isDark 
                    ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 hover:bg-amber-400/30' 
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {isDark ? '☀️ Switch Light' : '🌙 Switch Dark'}
              </button>
            </div>

            {/* Mobile User Profile & Avatar Card */}
            <div className="p-3.5 bg-gradient-to-br from-slate-50 via-white to-blue-50/50 dark:from-slate-800 dark:via-slate-800/90 dark:to-blue-950/40 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div 
                onClick={() => openSettings('profile')}
                className="flex items-center gap-3 cursor-pointer group"
                title="Open Profile Settings"
              >
                <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-blue-500/30 dark:ring-blue-500/50 bg-slate-200 dark:bg-slate-700 shrink-0 flex items-center justify-center">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate leading-tight group-hover:text-blue-600 transition-colors">
                      {profile?.displayName || userName}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                    {user?.email || 'Student Account'}
                  </span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold inline-flex items-center gap-1 mt-0.5">
                    {profile?.points || 100} pts · {profile?.streakDays || 1}d streak
                  </span>
                </div>
              </div>

              {/* Action Buttons: Profile Settings + Photo */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => openSettings('profile')}
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Profile Settings</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMenu(false);
                    setShowProfileImageModal(true);
                  }}
                  className="py-2 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Change profile photo"
                >
                  <Camera className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Photo</span>
                </button>
              </div>
            </div>

            {/* Admin Management Panel Banner */}
            {isOwnerAdmin && (
              <button
                onClick={() => {
                  setActiveView('admin');
                  setShowMobileMenu(false);
                }}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 text-white shadow-md shadow-rose-600/20 flex items-center justify-between text-left active:scale-98 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm block leading-tight">Admin Management Panel</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-white text-rose-700 uppercase">Owner</span>
                    </div>
                    <span className="text-[11px] text-rose-100 block mt-0.5">
                      Manage users, study sets &amp; system stats
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/80 shrink-0" />
              </button>
            )}

            {/* Grid of All Study Views */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'home', label: 'Dashboard', desc: 'Overview & recent sets', icon: Home, color: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300' },
                { id: 'community', label: 'Community Lounge', desc: 'Peer study chat & rooms', icon: Users, color: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300' },
                { id: 'library', label: `Study Sets (${studySets.length})`, desc: 'Notes & materials', icon: BookOpen, color: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300' },
                { id: 'tutor', label: 'Nora AI Tutor', desc: '24/7 Socratic tutor', icon: MessageSquare, color: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300' },
                { id: 'flashcards', label: 'Flashcards', desc: 'Spaced repetition drills', icon: Layers, color: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' },
                { id: 'quiz', label: 'Practice Quizzes', desc: 'Diagnostic testing', icon: Target, color: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300' },
                { id: 'review-queue', label: 'Review Queue', desc: '1, 3, 7d spaced repetition', icon: Clock, color: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300' },
                { id: 'essay-grader', label: 'Essay Grader', desc: 'Rubric AI grading', icon: FileCheck, color: 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300' },
                { id: 'study-plan', label: 'Study Plan', desc: 'Personal timetable', icon: CalendarIcon, color: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300' },
                { id: 'progress', label: 'Analytics', desc: 'Mastery & streaks', icon: TrendingUp, color: 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300' },
                { id: 'weekly-run', label: 'Weekly Run', desc: 'Sprints & cadence', icon: Trophy, color: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300' },
                { id: 'cognitive-mind', label: "Nora's Mind", desc: 'AI memory dashboard', icon: BrainCircuit, color: 'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300' },
                { id: 'notifications', label: 'Notifications', desc: unreadNotifCount > 0 ? `${unreadNotifCount} new alert${unreadNotifCount > 1 ? 's' : ''}` : 'Live updates & chimes', icon: Bell, color: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300' },
                { id: 'certificates', label: 'Certificates', desc: 'Verified credentials (Coming Soon)', icon: Award, color: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300' },
                { id: 'floating-timer', label: showFloatingTimer ? 'Focus Timer (Active)' : 'Focus Timer (Hidden)', desc: 'Draggable Pomodoro widget', icon: Clock, color: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' },
                { id: 'complaints', label: 'Help & Complaints', desc: 'Report bugs or feedback', icon: MessageSquareWarning, color: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300' },
                { id: 'profile-settings', label: 'Profile Settings', desc: 'Account & preferences', icon: User, color: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300' },
                { id: 'change-photo', label: 'Profile Photo', desc: 'Upload or avatar picker', icon: Camera, color: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300' }
              ].map(({ id, label, desc, icon: Icon, color }) => {
                const isActive = activeView === id;
                return (
                  <button
                    key={id}
                    onClick={() => {
                      if (id === 'complaints') {
                        setShowMobileMenu(false);
                        setComplaintModalInitialTab('submit');
                        setShowComplaintModal(true);
                        return;
                      }
                      if (id === 'floating-timer') {
                        handleToggleFloatingTimer();
                        setShowMobileMenu(false);
                        return;
                      }
                      if (id === 'profile-settings') {
                        openSettings('profile');
                        return;
                      }
                      if (id === 'change-photo') {
                        setShowMobileMenu(false);
                        setShowProfileImageModal(true);
                        return;
                      }
                      if (id === 'flashcards' || id === 'quiz') {
                        if (!selectedSet && studySets.length > 0) {
                          setSelectedSet(studySets[0]);
                        }
                      }
                      setActiveView(id as ActiveView);
                      setShowMobileMenu(false);
                    }}
                    className={`p-3 text-left rounded-2xl border transition-all flex items-start gap-2.5 ${
                      isActive
                        ? 'border-blue-600 bg-blue-50/90 dark:bg-blue-950/60 text-blue-950 dark:text-blue-200 font-bold ring-2 ring-blue-500/25 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold block truncate leading-tight text-slate-900 dark:text-slate-100">{label}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">{desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  setShowUploadModal(true);
                }}
                className="flex-1 py-3 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Material</span>
              </button>
              <button
                onClick={() => openSettings('profile')}
                className="py-3 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-98 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-transparent dark:border-slate-700"
                title="Settings & Profile"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. PERSISTENT MOBILE BOTTOM NAVIGATION BAR (MATCHING SCREENSHOT)*/}
      {/* ============================================================== */}
      <nav className={`${activeView === 'tutor' || activeView === 'study-set-detail' || activeView === 'community' ? 'hidden' : 'md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-lg h-[56px] pb-[env(safe-area-inset-bottom,0px)]'}`}>
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => setActiveView('home')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 transition-colors ${
            activeView === 'home' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Home className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] font-semibold">Home</span>
          {activeView === 'home' ? (
            <span className="w-4 h-0.75 rounded-full bg-blue-600 dark:bg-blue-400 mt-0.5" />
          ) : (
            <span className="w-4 h-0.75 mt-0.5 opacity-0" />
          )}
        </button>

        {/* 2. Library */}
        <button
          type="button"
          onClick={() => setActiveView('library')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 transition-colors ${
            activeView === 'library' || activeView === 'study-set-detail' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <BookOpen className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] font-semibold">Library</span>
          {(activeView === 'library' || activeView === 'study-set-detail') ? (
            <span className="w-4 h-0.75 rounded-full bg-blue-600 dark:bg-blue-400 mt-0.5" />
          ) : (
            <span className="w-4 h-0.75 mt-0.5 opacity-0" />
          )}
        </button>

        {/* 3. Community Lounge (1-Tap Accessible Everywhere on Mobile) */}
        <button
          type="button"
          onClick={() => setActiveView('community')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 transition-colors ${
            activeView === 'community' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <div className="relative">
            <Users className="w-5 h-5 stroke-[2.2]" />
            <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] px-0.5 rounded-full bg-emerald-500 text-white text-[8px] font-black flex items-center justify-center ring-1 ring-white dark:ring-slate-900 animate-pulse">
              {onlineCount}
            </span>
          </div>
          <span className="text-[10px] font-semibold">Lounge</span>
          {activeView === 'community' ? (
            <span className="w-4 h-0.75 rounded-full bg-blue-600 dark:bg-blue-400 mt-0.5" />
          ) : (
            <span className="w-4 h-0.75 mt-0.5 opacity-0" />
          )}
        </button>

        {/* 4. Practice */}
        <button
          type="button"
          onClick={() => {
            if (!selectedSet && studySets.length > 0) {
              setSelectedSet(studySets[0]);
            }
            setActiveView('quiz');
          }}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 transition-colors ${
            activeView === 'quiz' || activeView === 'flashcards' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Target className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] font-semibold">Practice</span>
          {(activeView === 'quiz' || activeView === 'flashcards') ? (
            <span className="w-4 h-0.75 rounded-full bg-blue-600 dark:bg-blue-400 mt-0.5" />
          ) : (
            <span className="w-4 h-0.75 mt-0.5 opacity-0" />
          )}
        </button>

        {/* 4. Nora (AI Tutor) */}
        <button
          type="button"
          onClick={() => setActiveView('tutor')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 transition-colors ${
            activeView === 'tutor' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <div className="relative">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={activeView === 'tutor' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}>
              <rect x="3" y="6" width="18" height="14" rx="5" stroke="currentColor" strokeWidth="2" fill={activeView === 'tutor' ? 'currentColor' : 'none'} fillOpacity={activeView === 'tutor' ? '0.15' : '0'} />
              <path d="M12 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="2" r="1.5" fill="currentColor" />
              <circle cx="8.5" cy="12.5" r="1.5" fill="currentColor" />
              <circle cx="15.5" cy="12.5" r="1.5" fill="currentColor" />
              <path d="M9.5 16C10.5 17 13.5 17 14.5 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-[10px] font-semibold">Nora</span>
          {activeView === 'tutor' ? (
            <span className="w-5 h-0.75 rounded-full bg-blue-600 dark:bg-blue-400 mt-0.5" />
          ) : (
            <span className="w-5 h-0.75 mt-0.5 opacity-0" />
          )}
        </button>

        {/* 5. Profile & Settings */}
        <button
          type="button"
          onClick={() => openSettings('profile')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 transition-colors ${
            showSettingsModal ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <div className="w-5 h-5 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            )}
          </div>
          <span className="text-[10px] font-semibold">Profile</span>
          {showSettingsModal ? (
            <span className="w-4 h-0.75 rounded-full bg-blue-600 dark:bg-blue-400 mt-0.5" />
          ) : (
            <span className="w-4 h-0.75 mt-0.5 opacity-0" />
          )}
        </button>
      </nav>
    </div>
  );
};
