import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Settings as SettingsIcon, 
  CreditCard, 
  Shield, 
  Bell, 
  LogOut, 
  Sparkles, 
  CheckCircle2, 
  Lock,
  Smartphone,
  Volume2,
  GraduationCap,
  Target,
  Layers,
  Clock,
  Compass,
  HelpCircle,
  BookOpen,
  Video,
  Headphones,
  Award,
  Zap,
  RotateCcw,
  Download,
  X,
  Check,
  Briefcase,
  Smile,
  ShieldCheck,
  ChevronRight,
  Camera,
  Upload,
  Trash2,
  Image as ImageIcon,
  MessageSquareWarning,
  Bug,
  BrainCircuit,
  Lightbulb,
  Send,
  AlertCircle,
  Inbox
} from 'lucide-react';
import { 
  UserProfile, 
  EducationLevel, 
  ProficiencyLevel, 
  LearningGoal, 
  LearningStyle, 
  StudyTimePerDay,
  isAdminEmail,
  UserComplaint,
  ComplaintCategory,
  ComplaintPriority
} from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ElevenLabsVoiceSelector } from './ElevenLabsVoiceSelector';
import { PWAInstallButton } from './PWAInstallButton';
import { ComplaintService } from '../services/complaintService';
import { ProfileImageModal } from './ProfileImageModal';
import { NotificationSettingsTab } from './NotificationSettingsTab';
import { resizeAndCompressImage } from '../utils/imageUtils';

interface SettingsModalProps {
  onClose: () => void;
  onRerunSetup?: () => void;
  initialTab?: 'profile' | 'setup' | 'ai' | 'voice' | 'subscription' | 'certificates' | 'app' | 'privacy' | 'notifications' | 'complaints';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  onClose, 
  onRerunSetup,
  initialTab = 'profile'
}) => {
  const { user, profile, updateProfileData, sendPasswordReset, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'setup' | 'ai' | 'voice' | 'subscription' | 'certificates' | 'app' | 'privacy' | 'notifications' | 'complaints'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Profile image modal & quick upload state
  const [showProfilePhotoModal, setShowProfilePhotoModal] = useState(false);
  const quickFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isQuickUploading, setIsQuickUploading] = useState(false);

  // Profile states
  const [name, setName] = useState(profile?.displayName || '');
  const [tutorNickname, setTutorNickname] = useState(profile?.tutorNickname || '');
  
  // 6-Stage Learnora Setup states
  const [educationLevel, setEducationLevel] = useState<string>(profile?.educationLevel || 'University');
  const [customEducation, setCustomEducation] = useState<string>(profile?.customEducation || '');
  const [proficiencyLevel, setProficiencyLevel] = useState<ProficiencyLevel>(profile?.proficiencyLevel || 'Intermediate');
  const [primaryGoal, setPrimaryGoal] = useState<string>(profile?.primaryGoal || 'Understand classes');
  const [customGoal, setCustomGoal] = useState<string>('');
  const [learningStyles, setLearningStyles] = useState<LearningStyle[]>(
    profile?.learningStyles?.length 
      ? profile.learningStyles 
      : ['Reading', 'Watching explanations', 'Practice questions', 'Flashcards', 'Interactive tutoring']
  );
  const [dailyStudyTime, setDailyStudyTime] = useState<StudyTimePerDay>(profile?.dailyStudyTime || '1 hour');

  // AI & Feedback states
  const [socraticFirst, setSocraticFirst] = useState(true);
  const [strictGrounding, setStrictGrounding] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>(theme || profile?.selectedTheme || 'light');

  // Help & Complaints Tab state
  const [complaintList, setComplaintList] = useState<UserComplaint[]>([]);
  const [complaintCategory, setComplaintCategory] = useState<ComplaintCategory>('technical_bug');
  const [complaintPriority, setComplaintPriority] = useState<ComplaintPriority>('medium');
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintContactEmail, setComplaintContactEmail] = useState(user?.email || '');
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);
  const [complaintFeedback, setComplaintFeedback] = useState<string | null>(null);
  const [complaintSubTab, setComplaintSubTab] = useState<'submit' | 'history'>('submit');
  const [expandedComplaintId, setExpandedComplaintId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = ComplaintService.subscribeToUserComplaints(user.uid, (list) => {
      setComplaintList(list);
    });
    return () => unsub();
  }, [user?.uid]);

  const handleSettingsSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintTitle.trim() || !complaintDesc.trim()) return;

    setIsSubmittingComplaint(true);
    try {
      await ComplaintService.submitComplaint({
        userId: user?.uid || 'guest_user',
        userEmail: complaintContactEmail.trim() || user?.email || 'student@learnora.app',
        userName: profile?.displayName || 'Learner',
        category: complaintCategory,
        priority: complaintPriority,
        title: complaintTitle.trim(),
        description: complaintDesc.trim()
      });
      setComplaintFeedback('Ticket submitted to administrator! We will review and notify you.');
      setComplaintTitle('');
      setComplaintDesc('');
      setTimeout(() => {
        setComplaintFeedback(null);
        setComplaintSubTab('history');
      }, 1500);
    } catch (err) {
      console.error(err);
      setComplaintFeedback('Failed to submit ticket. Please retry.');
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  // Keep selectedTheme in sync when theme changes
  useEffect(() => {
    if (theme) {
      setSelectedTheme(theme);
    }
  }, [theme]);
  const [soundEffects, setSoundEffects] = useState(true);
  const [studyReminders, setStudyReminders] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

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

  // Quick image upload handler
  const handleQuickImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsQuickUploading(true);
    try {
      const dataUrl = await resizeAndCompressImage(file, 320, 0.85);
      await updateProfileData({ avatarUrl: dataUrl });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      console.error('Quick image upload error:', err);
    } finally {
      setIsQuickUploading(false);
      if (quickFileInputRef.current) quickFileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    await updateProfileData({ avatarUrl: undefined });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const chosenField = (educationLevel === 'Another subject' || educationLevel === 'Your course') && customEducation.trim()
      ? customEducation.trim()
      : (customEducation.trim() || educationLevel);

    const chosenGoal = primaryGoal === 'Another goal' && customGoal.trim()
      ? customGoal.trim()
      : primaryGoal;

    await updateProfileData({
      displayName: name.trim() || profile?.displayName || 'Learner',
      tutorNickname: tutorNickname.trim() || name.trim().split(' ')[0] || 'Learner',
      educationLevel: chosenField,
      customEducation: customEducation.trim(),
      proficiencyLevel,
      primaryGoal: chosenGoal,
      learningStyles,
      dailyStudyTime,
      selectedTheme
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Safe client-side data export without window.alert
  const handleExportData = () => {
    setIsExporting(true);
    try {
      const exportPayload = {
        exportedAt: new Date().toISOString(),
        profile: {
          ...profile,
          displayName: name,
          tutorNickname,
          educationLevel,
          customEducation,
          proficiencyLevel,
          primaryGoal,
          learningStyles,
          dailyStudyTime
        },
        user: {
          uid: user?.uid,
          email: user?.email
        }
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `learnora-study-backup-${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setExportNotice('Study data backup downloaded successfully.');
      setTimeout(() => setExportNotice(null), 3000);
    } catch (err) {
      setExportNotice('Export failed. Please try again.');
      setTimeout(() => setExportNotice(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  interface NavItem {
    id: 'profile' | 'setup' | 'ai' | 'voice' | 'notifications' | 'subscription' | 'certificates' | 'app' | 'privacy' | 'complaints';
    label: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }

  const navItems: NavItem[] = [
    { id: 'profile', label: 'Profile', desc: 'Account & Identity', icon: User },
    { id: 'setup', label: 'Learnora Setup', desc: '6 Stages & Curriculum', icon: GraduationCap, badge: '6 Stages' },
    { id: 'ai', label: 'Nora AI', desc: 'Pedagogy & Rigor', icon: Sparkles },
    { id: 'voice', label: 'Voice & Audio', desc: '5 Curated Personas', icon: Volume2 },
    { id: 'notifications', label: 'Push Notifications', desc: 'Phone & Study Alerts', icon: Bell, badge: 'Web Push' },
    { id: 'complaints', label: 'Help & Complaints', desc: 'Report Issue to Admin', icon: MessageSquareWarning },
    { id: 'subscription', label: 'Plan & Billing', desc: 'Academic Pro Tier', icon: CreditCard, badge: 'Coming Soon' },
    { id: 'certificates', label: 'Certificates', desc: 'Verified Credentials', icon: Award, badge: 'Coming Soon' },
    { id: 'app', label: 'App (PWA)', desc: 'Mobile & Desktop App', icon: Smartphone },
    { id: 'privacy', label: 'Privacy & Data', desc: 'Export & Security', icon: Shield }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 w-full max-w-4xl overflow-hidden flex flex-col md:flex-row relative h-[92vh] sm:h-[86vh] max-h-[850px]">
        
        {/* ============================================================== */}
        {/* TOP MOBILE HEADER (Title & Close Button)                       */}
        {/* ============================================================== */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 leading-tight">Workspace Settings</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{user?.email || 'Student Account'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors active:scale-95"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ============================================================== */}
        {/* DESKTOP SIDEBAR / MOBILE HORIZONTAL PILL TABS                  */}
        {/* ============================================================== */}
        <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-950 border-b md:border-b-0 md:border-r border-slate-200/80 dark:border-slate-800 p-2 sm:p-4 flex flex-col md:justify-between shrink-0 overflow-x-auto md:overflow-x-visible no-scrollbar">
          <div>
            {/* Desktop Brand Header */}
            <div className="hidden md:flex items-center justify-between mb-4 pb-3 border-b border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <SettingsIcon className="w-5 h-5 text-blue-100" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 font-serif leading-tight">Workspace Settings</h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Personalize Learnora</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs List */}
            <div className="flex md:flex-col gap-1 md:gap-1.5 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0 no-scrollbar">
              {navItems.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`whitespace-nowrap flex items-center justify-between px-3 py-2 sm:py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                      active 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-white bg-white/70 dark:bg-slate-900/70 md:bg-transparent md:dark:bg-transparent border border-slate-200/60 dark:border-slate-800 md:border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                      <span className="tracking-tight">{tab.label}</span>
                    </div>
                    {tab.badge && (
                      <span className={`hidden md:inline-block text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                        active ? 'bg-white/20 text-white' : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop User Footer & Sign Out */}
          <div className="hidden md:block pt-4 border-t border-slate-200/70 dark:border-slate-800 mt-4 space-y-2">
            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowProfilePhotoModal(true)}
                className="group relative w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black text-xs shrink-0 overflow-hidden ring-2 ring-blue-500/20 hover:ring-blue-500 transition-all cursor-pointer"
                title="Change Profile Photo"
              >
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{(name || profile?.displayName || user?.email || 'L').charAt(0).toUpperCase()}</span>
                )}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                  <Camera className="w-3.5 h-3.5" />
                </div>
              </button>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate">
                  {name || profile?.displayName || 'Learner'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowProfilePhotoModal(true)}
                  className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold hover:underline block truncate text-left"
                >
                  Change Photo
                </button>
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* MAIN SETTINGS CONTENT PANE                                     */}
        {/* ============================================================== */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white dark:bg-slate-900">
          
          {/* Desktop Top Close Button */}
          <div className="hidden md:flex items-center justify-between px-6 sm:px-8 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {navItems.find(n => n.id === activeTab)?.desc}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-colors active:scale-95"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Form Body */}
          <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto space-y-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
            
            {/* Save Success Banner */}
            {savedSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200/90 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-fade-in shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Workspace preferences updated and synced across all devices!</span>
              </div>
            )}

            {exportNotice && (
              <div className="p-3.5 bg-blue-50 border border-blue-200/90 rounded-2xl text-blue-800 text-xs font-semibold flex items-center gap-2.5 animate-fade-in shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{exportNotice}</span>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* TAB: PROFILE                                                 */}
            {/* ------------------------------------------------------------ */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSave} className="space-y-5 animate-fade-in">
                <div>
                  <h4 className="text-lg font-black text-slate-900 font-serif tracking-tight">Student Profile Information</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Manage your identity, avatar picture, how Nora addresses you, and security credentials.</p>
                </div>

                {/* 1. Profile Photo & Avatar Card */}
                <input
                  ref={quickFileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                  onChange={handleQuickImageUpload}
                  className="hidden"
                />

                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-blue-50/40 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowProfilePhotoModal(true)}
                      className="group relative w-20 h-20 sm:w-22 sm:h-22 rounded-full overflow-hidden ring-4 ring-white shadow-md border-2 border-blue-500/30 bg-slate-100 flex items-center justify-center cursor-pointer transition-transform active:scale-95"
                      title="Click to change profile picture"
                    >
                      {profile?.avatarUrl ? (
                        <img
                          src={profile.avatarUrl}
                          alt={name || 'Profile'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center">
                          {(name || profile?.displayName || 'L').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-0.5">
                        <Camera className="w-5 h-5" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Change</span>
                      </div>
                    </button>
                    <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-2xs" />
                  </div>

                  <div className="flex-1 text-center sm:text-left min-w-0">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        Profile Photo
                      </span>
                      {profile?.avatarUrl ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/60">
                          Custom Photo Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          Default Initials
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Upload your image, snap a photo with your webcam, or choose from our curated learner avatars.
                    </p>

                    <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <button
                        type="button"
                        onClick={() => setShowProfilePhotoModal(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Change Photo</span>
                      </button>

                      <button
                        type="button"
                        disabled={isQuickUploading}
                        onClick={() => quickFileInputRef.current?.click()}
                        className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isQuickUploading ? 'Uploading...' : 'Quick Upload'}</span>
                      </button>

                      {profile?.avatarUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Johnson"
                      className="w-full p-3 text-xs sm:text-sm border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      What should Nora call you? (Nickname)
                    </label>
                    <input
                      type="text"
                      value={tutorNickname}
                      onChange={(e) => setTutorNickname(e.target.value)}
                      placeholder="e.g. Alex or Ademola"
                      className="w-full p-3 text-xs sm:text-sm border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Account Credentials */}
                <div className="pt-2">
                  <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-2">Account Authentication</h5>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Registered Email:</span>
                      <span className="font-bold text-slate-800 font-mono">{user?.email || profile?.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Sign-In Method:</span>
                      <span className="font-bold text-blue-700">
                        {user?.providerData?.some(p => p.providerId === 'password')
                          ? 'Email & Password'
                          : user?.providerData?.some(p => p.providerId === 'google.com')
                          ? 'Google Account'
                          : 'Learnora Guaranteed Session'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Platform Role:</span>
                      <span className="inline-flex items-center gap-1 font-bold text-slate-800">
                        {isAdminEmail(user?.email) ? (
                          <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            Administrator &amp; Owner
                          </span>
                        ) : (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Active Student
                          </span>
                        )}
                      </span>
                    </div>

                    {user?.email && (
                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-200">
                        <span className="text-slate-500 text-[11px]">Need to change or reset your password?</span>
                        <button
                          type="button"
                          onClick={async () => {
                            if (user.email) {
                              await sendPasswordReset(user.email);
                              setResetSent(true);
                              setTimeout(() => setResetSent(false), 4000);
                            }
                          }}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline text-left sm:text-right"
                        >
                          Send Password Reset Link
                        </button>
                      </div>
                    )}

                    {resetSent && (
                      <p className="text-[11px] text-emerald-600 font-bold pt-1">
                        ✓ Password reset link dispatched! Please check your inbox.
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
                  >
                    Save Profile Changes
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('setup')}
                    className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <span>Configure 6-Stage Curriculum</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}

            {/* ------------------------------------------------------------ */}
            {/* TAB: LEARNORA SETUP (THE 6 STAGES!)                          */}
            {/* ------------------------------------------------------------ */}
            {activeTab === 'setup' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                  <div>
                    <h4 className="text-lg font-black text-slate-900 font-serif tracking-tight">Learnora 6-Stage Curriculum Setup</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Review or update the 6 core pillars that tailor Nora's explanations, quizzes, and pacing.
                    </p>
                  </div>

                  {onRerunSetup && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onRerunSetup();
                      }}
                      className="px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 self-start shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Launch Animated Wizard</span>
                    </button>
                  )}
                </div>

                {/* STAGE 1: Choose your field */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-[11px] font-black flex items-center justify-center">1</span>
                    <h5 className="font-bold text-sm text-slate-900 font-serif">Choose your field</h5>
                  </div>
                  <p className="text-xs text-slate-600">Choose a field such as your course or another subject.</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {[
                      'Your course',
                      'University Degree',
                      'Secondary School',
                      'Medical & Healthcare',
                      'Computer Science',
                      'Law & Jurisprudence',
                      'Business & Finance',
                      'Another subject'
                    ].map((field) => {
                      const isSelected = educationLevel === field;
                      return (
                        <button
                          key={field}
                          type="button"
                          onClick={() => setEducationLevel(field)}
                          className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                            isSelected 
                              ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold ring-2 ring-blue-500/20' 
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {field}
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Specify Course Title or Custom Subject
                    </label>
                    <input
                      type="text"
                      value={customEducation}
                      onChange={(e) => setCustomEducation(e.target.value)}
                      placeholder="e.g. Organic Chemistry, Macroeconomics, Anatomy, Python..."
                      className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>

                {/* STAGE 2: What is your current level? */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center">2</span>
                    <h5 className="font-bold text-sm text-slate-900 font-serif">What is your current level?</h5>
                  </div>
                  <p className="text-xs text-slate-600">Beginner, intermediate, advanced, or exam preparation.</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {(['Beginner', 'Intermediate', 'Advanced', 'Exam preparation'] as ProficiencyLevel[]).map((lvl) => {
                      const isSelected = proficiencyLevel === lvl;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setProficiencyLevel(lvl)}
                          className={`p-3 rounded-xl border text-xs text-left transition-all ${
                            isSelected 
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20' 
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="font-bold">{lvl}</div>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            {lvl === 'Beginner' && 'Foundations & analogies'}
                            {lvl === 'Intermediate' && 'Applied practice'}
                            {lvl === 'Advanced' && 'Theoretical rigor'}
                            {lvl === 'Exam preparation' && 'High-yield drills'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* STAGE 3: What are you trying to achieve? */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center">3</span>
                    <h5 className="font-bold text-sm text-slate-900 font-serif">What are you trying to achieve?</h5>
                  </div>
                  <p className="text-xs text-slate-600">
                    Understand classes, prepare for exams, improve grades, learn a subject, prepare for certification, build practical skills, or another goal.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {[
                      'Understand classes',
                      'Prepare for exams',
                      'Improve grades',
                      'Learn a subject',
                      'Prepare for certification',
                      'Build practical skills',
                      'Another goal'
                    ].map((g) => {
                      const isSelected = primaryGoal === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setPrimaryGoal(g)}
                          className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                            isSelected 
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold ring-2 ring-indigo-500/20' 
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>

                  {primaryGoal === 'Another goal' && (
                    <input
                      type="text"
                      value={customGoal}
                      onChange={(e) => setCustomGoal(e.target.value)}
                      placeholder="Describe your personalized milestone..."
                      className="w-full p-2.5 text-xs border border-indigo-300 rounded-xl bg-white"
                    />
                  )}
                </div>

                {/* STAGE 4: How do you learn best? */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-600 text-white text-[11px] font-black flex items-center justify-center">4</span>
                    <h5 className="font-bold text-sm text-slate-900 font-serif">How do you learn best?</h5>
                  </div>
                  <p className="text-xs text-slate-600">
                    Select one or more formats: reading, watching explanations, listening, practice questions, flashcards, interactive tutoring, or a mixture.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {[
                      'Reading',
                      'Watching explanations',
                      'Listening',
                      'Practice questions',
                      'Flashcards',
                      'Interactive tutoring',
                      'A mixture'
                    ].map((style) => {
                      const isSelected = learningStyles.includes(style as LearningStyle) || 
                        (style === 'A mixture' && learningStyles.includes('A mixture of everything'));
                      return (
                        <button
                          key={style}
                          type="button"
                          onClick={() => toggleLearningStyle(style as LearningStyle)}
                          className={`p-2.5 rounded-xl border text-xs font-semibold text-left flex items-center justify-between transition-all ${
                            isSelected 
                              ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold ring-2 ring-amber-500/20' 
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span>{style}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* STAGE 5: How much time can you study daily? */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-[11px] font-black flex items-center justify-center">5</span>
                    <h5 className="font-bold text-sm text-slate-900 font-serif">How much time can you study daily?</h5>
                  </div>
                  <p className="text-xs text-slate-600">Choose 15 minutes, 30 minutes, 1 hour, 2 hours, or 3+ hours.</p>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                    {(['15 minutes', '30 minutes', '1 hour', '2 hours', '3+ hours'] as StudyTimePerDay[]).map((time) => {
                      const isSelected = dailyStudyTime === time;
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setDailyStudyTime(time)}
                          className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                            isSelected 
                              ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold ring-2 ring-blue-500/20' 
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* STAGE 6: What should Nora call you? */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-rose-600 text-white text-[11px] font-black flex items-center justify-center">6</span>
                    <h5 className="font-bold text-sm text-slate-900 font-serif">What should Nora call you?</h5>
                  </div>
                  <p className="text-xs text-slate-600">Nora will address you with this name in tutoring and encouragements.</p>

                  <input
                    type="text"
                    value={tutorNickname}
                    onChange={(e) => setTutorNickname(e.target.value)}
                    placeholder="e.g. Alex or Ademola"
                    className="w-full p-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
                  >
                    Save All 6 Stages
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* TAB: NORA AI PREFERENCES                                     */}
            {/* ------------------------------------------------------------ */}
            {activeTab === 'ai' && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h4 className="text-lg font-black text-slate-900 font-serif tracking-tight">Nora AI Socratic Engine</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Fine-tune Nora's pedagogy, explanation depth, and verification rules.</p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block text-sm">Socratic Inquiry First</span>
                      <span className="text-slate-500 leading-relaxed block mt-0.5">
                        Ask guiding check-for-understanding questions before revealing complete solutions.
                      </span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={socraticFirst} 
                      onChange={(e) => setSocraticFirst(e.target.checked)}
                      className="w-5 h-5 rounded-lg text-blue-600 accent-blue-600 shrink-0 cursor-pointer" 
                    />
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block text-sm">Strict Source Grounding</span>
                      <span className="text-slate-500 leading-relaxed block mt-0.5">
                        Clearly distinguish between your uploaded curriculum materials and external frontier knowledge.
                      </span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={strictGrounding} 
                      onChange={(e) => setStrictGrounding(e.target.checked)}
                      className="w-5 h-5 rounded-lg text-blue-600 accent-blue-600 shrink-0 cursor-pointer" 
                    />
                  </div>

                  <div className="p-4 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between gap-3">
                    <div>
                      <span className="font-bold text-sm text-slate-900 block font-serif">
                        Learnora 6-Stage Curriculum Setup
                      </span>
                      <span className="text-xs text-slate-600 block mt-0.5">
                        Update your course, level, goal, formats, daily time, or Nora nickname.
                      </span>
                    </div>
                    {onRerunSetup && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onRerunSetup();
                        }}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all shrink-0"
                      >
                        Restart Setup
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* TAB: VOICE & AUDIO                                           */}
            {/* ------------------------------------------------------------ */}
            {activeTab === 'voice' && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h4 className="text-lg font-black text-slate-900 font-serif tracking-tight">Audio &amp; Voice Narration</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Select high-clarity neural voices for audio recaps and tutoring.</p>
                </div>
                <ElevenLabsVoiceSelector />
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* TAB: SUBSCRIPTION & BILLING                                  */}
            {/* ------------------------------------------------------------ */}
            {activeTab === 'subscription' && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-black text-slate-900 font-serif tracking-tight">Academic Pro Subscription &amp; Billing</h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200/80">
                      Pricing Coming Soon
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official billing and regional payment options are coming soon. All registered learners currently enjoy complimentary full access.
                  </p>
                </div>

                {/* Active Complimentary Tier Hero Banner */}
                <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white shadow-lg shadow-blue-600/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 bg-white/20 px-2.5 py-0.5 rounded-full inline-block">
                        Active Tier
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 rounded-full inline-block">
                        Full Access Enabled
                      </span>
                    </div>
                    <h5 className="text-2xl font-black font-serif">Academic Pro (Full Access)</h5>
                    <p className="text-xs text-blue-100/90 font-medium max-w-lg">
                      Unlimited study sets, AI quizzes, Socratic audio lessons, essay grading, and full exam simulations.
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span className="px-3 py-1.5 rounded-full bg-emerald-400 text-slate-950 text-xs font-black inline-block shadow-xs">
                      Active
                    </span>
                  </div>
                </div>

                {/* Billing Launch Notice */}
                <div className="p-4 rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/80 to-orange-50/50 flex items-start gap-3 text-xs">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h6 className="font-extrabold text-amber-950 text-xs">Pricing &amp; Billing Launching Soon</h6>
                    <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                      We are finalizing regional pricing, student discounts, and institutional payment methods. Plan prices will be unveiled here before billing is activated. In the meantime, enjoy complete, unrestricted Academic Pro features!
                    </p>
                  </div>
                </div>

                {/* Quota & Generation Limits */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-700 font-semibold">
                    <span>Monthly AI Tutor Generations</span>
                    <span className="text-blue-700 font-bold">Unlimited Plan (Complimentary)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full w-full rounded-full" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                    <span>No token restrictions during preview</span>
                    <span className="font-semibold text-emerald-600">100% Unlocked</span>
                  </div>
                </div>

                {/* Renewal Durations (All with Coming Soon & No amounts displayed) */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                      Upcoming Subscription Plans
                    </h5>
                    <span className="text-[11px] text-slate-400 font-medium">Pricing details coming soon</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                    {[
                      { dur: '1 Month', desc: 'Flexible monthly billing for exams & single courses', tag: 'Standard' },
                      { dur: '3 Months', desc: 'Full academic term access with uninterrupted tutoring', tag: 'Term Pass' },
                      { dur: '6 Months', desc: 'Semester-long mastery with priority ElevenLabs voices', tag: 'Semester Pass', popular: true },
                      { dur: '1 Year', desc: 'Annual pass across all degrees, subjects & materials', tag: 'Annual Pass' }
                    ].map((plan) => (
                      <div 
                        key={plan.dur} 
                        className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all ${
                          plan.popular 
                            ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-xs' 
                            : 'border-slate-200 bg-slate-50/70 hover:bg-slate-50'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-black text-slate-900 text-xs">{plan.dur}</span>
                            {plan.popular && (
                              <span className="text-[9px] font-black uppercase text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-md">
                                Best Value
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 leading-tight">
                            {plan.desc}
                          </p>
                        </div>

                        <div className="pt-3 mt-3 border-t border-slate-200/80 flex items-center justify-between">
                          <span className="text-[10px] font-medium text-slate-400">Price:</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200/80">
                            Coming Soon
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Features & Tier Breakdown Table */}
                <div className="pt-2">
                  <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-2">
                    Plan Features &amp; Availability
                  </h5>
                  <div className="rounded-2xl border border-slate-200 overflow-hidden text-xs">
                    <div className="grid grid-cols-3 bg-slate-100/80 p-2.5 font-bold text-slate-700 border-b border-slate-200 text-[11px]">
                      <div>Capability</div>
                      <div className="text-center">Free Starter</div>
                      <div className="text-center text-blue-700">Academic Pro</div>
                    </div>
                    <div className="divide-y divide-slate-100 bg-white">
                      {[
                        { feature: 'Study Sets & Flashcards', free: 'Standard', pro: 'Unlimited' },
                        { feature: 'Nora Socratic AI Tutor', free: 'Standard', pro: '24/7 Adaptive' },
                        { feature: 'Neural Voice Narration', free: 'Web Speech', pro: 'All ElevenLabs Voices' },
                        { feature: 'Essay Grader & AI Rubrics', free: 'Standard', pro: 'Unlimited Detailed' },
                        { feature: 'Billing Price', free: 'Free', pro: 'Coming Soon' }
                      ].map((row, rIdx) => (
                        <div key={rIdx} className="grid grid-cols-3 p-2.5 items-center text-[11px]">
                          <span className="font-medium text-slate-800">{row.feature}</span>
                          <span className="text-center text-slate-500">{row.free}</span>
                          <div className="text-center font-bold">
                            {row.pro === 'Coming Soon' ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-200/80 inline-block">
                                Coming Soon
                              </span>
                            ) : (
                              <span className="text-blue-700">{row.pro}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* TAB: CERTIFICATES & DIPLOMAS (COMING SOON)                   */}
            {/* ------------------------------------------------------------ */}
            {activeTab === 'certificates' && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-black text-slate-900 font-serif tracking-tight">Verified Academic Certificates &amp; Diplomas</h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200/80">
                      Coming Soon · Q2 2026
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official credentials with cryptographic verification for demonstrated topic mastery, spaced retrieval retention, and Socratic dialogues.
                  </p>
                </div>

                {/* Verified Certificate Showcase Card */}
                <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-slate-50 border border-amber-300/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center shrink-0 shadow-md">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-sm text-slate-900">Cryptographically Verifiable Credentials</h5>
                      <p className="text-xs text-slate-500 mt-0.5 max-w-md leading-relaxed">
                        Upon launch, eligible learners will receive shareable LinkedIn credentials, tamper-proof verification URLs, and printable 300 DPI vector PDF diplomas.
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-black inline-block border border-amber-200">
                      In Development
                    </span>
                  </div>
                </div>

                {/* 3 Upcoming Certificate Milestones */}
                <div className="space-y-2.5">
                  <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Upcoming Certificate Tiers</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { title: 'Socratic Dialogue Specialist', badge: 'Honor Award', desc: '10 deep cognitive sessions with Nora AI' },
                      { title: 'Spaced Retrieval Master', badge: 'Mastery Diploma', desc: '14-day retention review streak (≥85% accuracy)' },
                      { title: 'Course Curriculum Diploma', badge: 'Summa Cum Laude', desc: '100% study deck mastery & diagnostic exam pass' }
                    ].map((item, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-slate-200 text-slate-700">
                          {item.badge}
                        </span>
                        <h6 className="font-bold text-xs text-slate-900 pt-1 leading-snug">{item.title}</h6>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* TAB: WORKSPACE PREFERENCES & APP (PWA)                       */}
            {/* ------------------------------------------------------------ */}
            {activeTab === 'app' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h4 className="text-lg font-black text-slate-900 font-serif tracking-tight">Workspace Preferences &amp; App</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Customize your visual workspace appearance, study sound effects, and install the mobile/desktop app.
                  </p>
                </div>

                {/* Workspace Theme Preference */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">Workspace Display Theme</h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Choose your preferred visual mode for studying.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 text-xs font-bold">
                    {[
                      { id: 'light', label: 'Paper Light', desc: 'Clean high contrast' },
                      { id: 'dark', label: 'Dark Focus', desc: 'Reduced eye strain' },
                      { id: 'system', label: 'System Default', desc: 'Auto-sync OS' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSelectedTheme(t.id as any);
                          setTheme(t.id as any);
                        }}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          selectedTheme === t.id
                            ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 shadow-xs ring-2 ring-blue-500/20'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                        }`}
                      >
                        <span className="block text-xs">{t.label}</span>
                        <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-normal mt-0.5">{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Audio Feedback & Reminders */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs">Interactive Sound Effects</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Audio feedback during flashcard flips, quiz answers &amp; mastery</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSoundEffects(!soundEffects)}
                      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                        soundEffects ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                          soundEffects ? 'right-1' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-800">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs">Study Streak Reminders</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Spaced repetition notifications to retain memory</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStudyReminders(!studyReminders)}
                      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                        studyReminders ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                          studyReminders ? 'right-1' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Progressive Web App Install Section */}
                <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-blue-950 dark:text-blue-100">Install Learnora as an App</h5>
                    <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80">Works seamlessly on mobile &amp; desktop with full offline flashcards.</p>
                  </div>
                </div>

                <div>
                  <PWAInstallButton variant="full" />
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Instant offline study with locally cached flashcards and notes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Optimized for both mobile touch and desktop keyboard shortcuts</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Save Workspace Preferences</span>
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* TAB: PUSH NOTIFICATIONS & MOBILE ALERTS                      */}
            {/* ------------------------------------------------------------ */}
            {activeTab === 'notifications' && (
              <NotificationSettingsTab
                user={user}
                profile={profile}
                onShowToast={(msg) => {
                  setSavedSuccess(true);
                  setTimeout(() => setSavedSuccess(false), 2500);
                }}
              />
            )}

            {/* ------------------------------------------------------------ */}
            {/* TAB: HELP DESK & USER COMPLAINTS                             */}
            {/* ------------------------------------------------------------ */}
            {activeTab === 'complaints' && (
              <div className="space-y-5 animate-fade-in">
                {/* Header with Sub-tab Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-slate-100 font-serif tracking-tight flex items-center gap-2">
                      <MessageSquareWarning className="w-5 h-5 text-amber-500" />
                      Help &amp; Complaints Desk
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Report bugs, Nora AI pedagogical inaccuracies, content flaws, or suggest features directly to our platform admin.
                    </p>
                  </div>
                  
                  {/* Sub-tab pills */}
                  <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl shrink-0 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setComplaintSubTab('submit')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        complaintSubTab === 'submit'
                          ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      Submit Ticket
                    </button>
                    <button
                      type="button"
                      onClick={() => setComplaintSubTab('history')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        complaintSubTab === 'history'
                          ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <span>My Tickets</span>
                      {complaintList.length > 0 && (
                        <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px] font-black flex items-center justify-center">
                          {complaintList.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {complaintFeedback && (
                  <div className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in ${
                    complaintFeedback.includes('Failed')
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  }`}>
                    {complaintFeedback.includes('Failed') ? (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                    )}
                    <span>{complaintFeedback}</span>
                  </div>
                )}

                {/* SUB-TAB: SUBMIT TICKET */}
                {complaintSubTab === 'submit' ? (
                  <form onSubmit={handleSettingsSubmitComplaint} className="space-y-4">
                    {/* Category Selector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                        Issue Category <span className="text-rose-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                          { id: 'technical_bug' as ComplaintCategory, label: 'Technical Bug', icon: Bug },
                          { id: 'ai_tutor' as ComplaintCategory, label: 'Nora AI Tutor', icon: BrainCircuit },
                          { id: 'content_material' as ComplaintCategory, label: 'Study Content', icon: BookOpen },
                          { id: 'account_billing' as ComplaintCategory, label: 'Account & Quota', icon: CreditCard },
                          { id: 'feature_request' as ComplaintCategory, label: 'Feature Request', icon: Lightbulb },
                          { id: 'other' as ComplaintCategory, label: 'Other Concern', icon: HelpCircle }
                        ].map((cat) => {
                          const IconComp = cat.icon;
                          const isSelected = complaintCategory === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setComplaintCategory(cat.id)}
                              className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                                isSelected
                                  ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                              }`}
                            >
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}>
                                <IconComp className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs font-bold truncate">{cat.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Priority Selector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Urgency Level
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'low' as ComplaintPriority, label: 'Low', desc: 'Minor issue / cosmetic' },
                          { id: 'medium' as ComplaintPriority, label: 'Medium', desc: 'Affects daily study' },
                          { id: 'high' as ComplaintPriority, label: 'High Urgency', desc: 'Critical blocker / error' }
                        ].map((p) => {
                          const isSelected = complaintPriority === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setComplaintPriority(p.id)}
                              className={`p-2.5 rounded-xl border text-center transition-all ${
                                isSelected
                                  ? p.id === 'high'
                                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 ring-2 ring-rose-500/20'
                                    : 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                              }`}
                            >
                              <span className="block text-xs font-bold">{p.label}</span>
                              <span className="block text-[10px] opacity-75 mt-0.5">{p.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Ticket Title / Subject <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={complaintTitle}
                        onChange={(e) => setComplaintTitle(e.target.value)}
                        placeholder="e.g. Nora gave incorrect explanation on organic chemistry mechanisms"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
                        required
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Detailed Description <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        value={complaintDesc}
                        onChange={(e) => setComplaintDesc(e.target.value)}
                        placeholder="Provide details on what happened, steps to reproduce, or exact phrases Nora used..."
                        rows={3}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                        required
                      />
                    </div>

                    {/* Contact Email */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Contact Email for Admin Resolution
                      </label>
                      <input
                        type="email"
                        value={complaintContactEmail}
                        onChange={(e) => setComplaintContactEmail(e.target.value)}
                        placeholder="student@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2 flex items-center justify-between">
                      <p className="text-[11px] text-slate-400">
                        Admin will review and dispatch a live response to your workspace.
                      </p>
                      <button
                        type="submit"
                        disabled={isSubmittingComplaint || !complaintTitle.trim() || !complaintDesc.trim()}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        {isSubmittingComplaint ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Submit Complaint</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* SUB-TAB: TICKETS HISTORY */
                  <div className="space-y-3">
                    {complaintList.length === 0 ? (
                      <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
                        <Inbox className="w-9 h-9 text-slate-400 mx-auto mb-2" />
                        <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200">No Tickets Filed Yet</h5>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                          Whenever you report a bug or pedagogical issue, track the administrator&apos;s investigation and official resolution response here.
                        </p>
                        <button
                          type="button"
                          onClick={() => setComplaintSubTab('submit')}
                          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Your First Ticket</span>
                        </button>
                      </div>
                    ) : (
                      complaintList.map((ticket) => {
                        const isExpanded = expandedComplaintId === ticket.id;
                        return (
                          <div
                            key={ticket.id}
                            className={`p-4 rounded-2xl border transition-all ${
                              ticket.status === 'resolved'
                                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                                : ticket.status === 'investigating'
                                ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800'
                                : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    ticket.status === 'resolved'
                                      ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                                      : ticket.status === 'investigating'
                                      ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300'
                                      : ticket.status === 'dismissed'
                                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                      : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                                  }`}>
                                    {ticket.status === 'resolved' ? 'Resolved' : ticket.status === 'investigating' ? 'Investigating' : ticket.status === 'dismissed' ? 'Closed' : 'Under Review'}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                                    {ticket.category.replace('_', ' ')}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    • {new Date(ticket.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <h5 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                                  {ticket.title}
                                </h5>
                              </div>

                              <button
                                type="button"
                                onClick={() => setExpandedComplaintId(isExpanded ? null : ticket.id)}
                                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                              >
                                {isExpanded ? 'Less' : 'Details'}
                              </button>
                            </div>

                            <p className={`text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                              {ticket.description}
                            </p>

                            {/* Official Admin Response Card */}
                            {ticket.adminResponse && (
                              <div className="mt-3 p-3 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 space-y-1">
                                <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-200 text-xs font-bold">
                                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                  <span>Official Admin Resolution</span>
                                </div>
                                <p className="text-xs text-emerald-900 dark:text-emerald-100 font-medium leading-relaxed">
                                  {ticket.adminResponse}
                                </p>
                                {ticket.resolvedAt && (
                                  <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400">
                                    Resolved on {new Date(ticket.resolvedAt).toLocaleDateString()} at {new Date(ticket.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* TAB: PRIVACY & DATA EXPORT                                   */}
            {/* ------------------------------------------------------------ */}
            {activeTab === 'privacy' && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h4 className="text-lg font-black text-slate-900 font-serif tracking-tight">Privacy &amp; Data Security</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Your lecture slides, personal notes, and flashcards belong exclusively to you.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 text-xs text-slate-700 space-y-2 leading-relaxed">
                  <p>
                    • All uploaded syllabi, lecture slides, and recordings are encrypted and private to your account.
                  </p>
                  <p>
                    • We never use your university materials to train public frontier models.
                  </p>
                  <p>
                    • You can export your full profile and study progress at any time in standard JSON format.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleExportData}
                    disabled={isExporting}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs"
                  >
                    <Download className="w-4 h-4 text-blue-600" />
                    <span>{isExporting ? 'Preparing Export...' : 'Download Study Data Backup (JSON)'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* MOBILE STICKY BOTTOM ACTIONS BAR                               */}
          {/* ============================================================== */}
          <div className="md:hidden p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2 shrink-0">
            <button
              type="button"
              onClick={logout}
              className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200/60 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-blue-600 active:scale-95 text-white text-xs font-bold shadow-md shadow-blue-600/25 transition-all flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Profile Image & Avatar Picker Modal */}
      <ProfileImageModal
        isOpen={showProfilePhotoModal}
        onClose={() => setShowProfilePhotoModal(false)}
        onSuccess={() => {
          setSavedSuccess(true);
          setTimeout(() => setSavedSuccess(false), 2500);
        }}
      />
    </div>
  );
};
