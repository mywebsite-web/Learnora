import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Moon, 
  ShieldCheck, 
  Sparkles, 
  Send, 
  Trash2, 
  RefreshCw,
  ExternalLink,
  Info,
  Flame,
  Layers,
  Brain,
  Pause,
  Play,
  BookOpen,
  ArrowRight,
  Target,
  Lock
} from 'lucide-react';
import { WebPushService } from '../services/webPushService';
import { LearningMemoryService } from '../services/learningMemoryService';
import { CommunityChatService } from '../services/communityChatService';
import { NotificationService } from '../services/notificationService';
import { 
  PushNotificationPreferences, 
  DEFAULT_PUSH_PREFERENCES,
  UserProfile,
  StudentLearningMemory
} from '../types';

interface NotificationSettingsTabProps {
  user: { uid: string; email?: string | null } | null;
  profile: UserProfile | null;
  onShowToast?: (message: string) => void;
}

export const NotificationSettingsTab: React.FC<NotificationSettingsTabProps> = ({
  user,
  profile,
  onShowToast
}) => {
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [memory, setMemory] = useState<StudentLearningMemory | null>(null);
  const [isTestingCompanion, setIsTestingCompanion] = useState(false);
  const [companionResult, setCompanionResult] = useState<{ success: boolean; message: string } | null>(null);
  const [prefs, setPrefs] = useState<PushNotificationPreferences>(() => 
    WebPushService.getPreferences(user?.uid)
  );
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [showUnblockGuide, setShowUnblockGuide] = useState(false);
  const [isRechecking, setIsRechecking] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<{ deviceType: string; browser: string }>({
    deviceType: 'desktop',
    browser: 'Web Browser'
  });
  const isInIframe = WebPushService.isInIframe();

  useEffect(() => {
    checkStatus();

    // Auto-prompt if opened in a standalone window with ?request_push=1
    if (typeof window !== 'undefined') {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get('request_push') === '1' || searchParams.get('prompt_notifications') === '1') {
          setTimeout(() => {
            handleEnablePush();
          }, 600);
        }
      } catch {}
    }

    if (user?.uid) {
      LearningMemoryService.getMemory(user.uid, user.email || undefined).then(setMemory);
    }
  }, [user?.uid]);

  const checkStatus = async () => {
    const perm = WebPushService.getPermissionState();
    setPermissionState(perm);

    if (WebPushService.isSupported()) {
      const sub = await WebPushService.getExistingSubscription();
      setIsSubscribed(Boolean(sub && perm === 'granted'));
    }

    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      let dType = 'desktop';
      if (/android/.test(ua)) dType = 'Android Mobile';
      else if (/iphone|ipad|ipod/.test(ua)) dType = 'iPhone / iPad';
      else if (/mobile/.test(ua)) dType = 'Mobile Device';

      let br = 'Browser';
      if (/chrome|crios/.test(ua)) br = 'Google Chrome';
      else if (/edg\//.test(ua)) br = 'Microsoft Edge';
      else if (/firefox|fxios/.test(ua)) br = 'Mozilla Firefox';
      else if (/safari/.test(ua) && !/chrome/.test(ua)) br = 'Apple Safari';

      setDeviceInfo({ deviceType: dType, browser: br });
    }
  };

  const handleEnablePush = async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    setTestResult(null);

    try {
      const result = await WebPushService.subscribeDevice(user.uid, user.email || undefined, prefs);
      const perm = WebPushService.getPermissionState();
      setPermissionState(perm);

      if (result.success) {
        setIsSubscribed(true);
        setPermissionState('granted');
        setShowUnblockGuide(false);
        if (onShowToast) onShowToast('🎉 Notifications allowed! Device registered for real-time study updates.');
      } else {
        if (isInIframe) {
          setTestResult({
            success: false,
            message: 'Browser restricted notification prompt inside embedded preview. Click "Open Standalone Tab & Prompt" to trigger the native browser dialog.'
          });
        } else {
          setTestResult({
            success: false,
            message: result.error || 'Notifications could not be enabled. See unblock instructions below.'
          });
          if (perm === 'denied') {
            setShowUnblockGuide(true);
          }
        }
        if (onShowToast) onShowToast(result.error || 'Failed to enable push notifications');
      }
    } catch (err: any) {
      console.error(err);
      if (onShowToast) onShowToast(err?.message || 'Error subscribing to push notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecheckPermission = async () => {
    setIsRechecking(true);
    try {
      const perm = WebPushService.getPermissionState();
      setPermissionState(perm);
      if (perm === 'granted') {
        setShowUnblockGuide(false);
        await handleEnablePush();
        if (onShowToast) onShowToast('✅ Notification permission granted! Device connected.');
      } else if (perm === 'denied') {
        setShowUnblockGuide(true);
        if (onShowToast) onShowToast('Browser still reports blocked. Please toggle Notifications to Allow in browser settings.');
      } else {
        if (onShowToast) onShowToast('Ready to ask. Click "Ask to Allow Notifications".');
      }
    } finally {
      setTimeout(() => setIsRechecking(false), 500);
    }
  };

  const handleUnsubscribe = async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    try {
      await WebPushService.unsubscribeDevice(user.uid);
      setIsSubscribed(false);
      if (onShowToast) onShowToast('Unsubscribed this device from push notifications.');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePref = async (key: keyof PushNotificationPreferences, value: any) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    if (!user?.uid) return;

    setIsSavingPrefs(true);
    try {
      await WebPushService.savePreferences(user.uid, { [key]: value });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleSendTestPush = async () => {
    if (!user?.uid) return;
    setIsTesting(true);
    setTestResult(null);

    // Immediately trigger native phone system popup via ServiceWorker with chime and vibration
    NotificationService.triggerTestStudyReminder(user.uid);

    try {
      const res = await WebPushService.sendTestPushToDevice(user.uid);
      setTestResult(res);
      if (onShowToast) onShowToast(res.message);
    } catch (err: any) {
      setTestResult({ success: true, message: 'Native Study Reminder dropped to phone notification tray!' });
      if (onShowToast) onShowToast('📱 Study reminder dropped to phone!');
    } finally {
      setIsTesting(false);
    }
  };

  const handleTogglePause = async () => {
    if (!user?.uid || !memory) return;
    const newPaused = !memory.remindersPaused;
    await LearningMemoryService.pauseOrResumeReminders(user.uid, newPaused);
    setMemory(prev => prev ? { ...prev, remindersPaused: newPaused } : null);
    if (onShowToast) {
      onShowToast(newPaused ? '⏸️ Automated study reminders paused.' : '▶️ Automated study reminders active.');
    }
  };

  const handleTestCompanion = async () => {
    if (!user?.uid) return;
    setIsTestingCompanion(true);
    setCompanionResult(null);
    try {
      const res = await fetch('/api/reminders/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, force: true })
      });
      const data = await res.json();
      if (data.success && data.deliveredCount > 0) {
        setCompanionResult({
          success: true,
          message: 'Personalized Nora companion notification delivered to your registered device!'
        });
        LearningMemoryService.getMemory(user.uid).then(setMemory);
        if (onShowToast) onShowToast('🤖 AI Companion notification sent to your phone/browser!');
      } else {
        setCompanionResult({
          success: false,
          message: data.error || 'No active device received the notification. Make sure Native Push is enabled above.'
        });
      }
    } catch (e: any) {
      setCompanionResult({
        success: false,
        message: e?.message || 'Failed to dispatch companion reminder'
      });
    } finally {
      setIsTestingCompanion(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-900 dark:text-slate-100 font-sans pb-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </div>
          <h4 className="text-lg font-black text-slate-900 dark:text-slate-100 font-serif tracking-tight">
            Web Push &amp; Mobile Notifications
          </h4>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          Receive real native system push notifications on your phone or desktop even when Learnora is closed. Never miss an Anki-style 1, 3, or 7-day spaced review or lose your study streak.
        </p>
      </div>

      {/* Permission & Status Card */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isSubscribed 
          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
          : permissionState === 'denied'
            ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60'
            : 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/60'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              isSubscribed
                ? 'bg-emerald-600 text-white'
                : permissionState === 'denied'
                  ? 'bg-amber-500 text-white'
                  : 'bg-blue-600 text-white'
            }`}>
              {isSubscribed ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : permissionState === 'denied' ? (
                <AlertCircle className="w-6 h-6" />
              ) : (
                <Bell className="w-6 h-6 animate-pulse" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h5 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  {isSubscribed 
                    ? 'Push Notifications Active on this Device' 
                    : permissionState === 'denied' 
                      ? 'Notification Permission Blocked in Browser' 
                      : 'Enable Native Push Notifications'}
                </h5>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isSubscribed 
                    ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200' 
                    : permissionState === 'denied'
                      ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                      : 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200'
                }`}>
                  {isSubscribed ? 'Connected' : permissionState === 'denied' ? 'Permission Required' : 'Action Needed'}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {isSubscribed ? (
                  <>Registered for <strong>{deviceInfo.deviceType}</strong> ({deviceInfo.browser}). Background delivery is enabled via FCM and Web Push standards.</>
                ) : permissionState === 'denied' ? (
                  <>Notifications are currently blocked by browser settings or restricted inside the embedded preview frame. Tap <strong>Ask to Allow Notifications</strong> below to prompt your browser, or open in a standalone tab.</>
                ) : (
                  <>Grant permission to receive timely reminders for scheduled study intervals, spaced repetition flashcards, and peer messages.</>
                )}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
            {!isSubscribed && (
              <>
                {/* 1. Main Ask to Allow Button - ALWAYS PRESENT & ACTIVE */}
                <button
                  type="button"
                  onClick={handleEnablePush}
                  disabled={isLoading}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Bell className="w-3.5 h-3.5" />
                  )}
                  <span>{isLoading ? 'Requesting Prompt...' : 'Ask to Allow Notifications'}</span>
                </button>

                {/* 2. Standalone Opener Button (vital for iframe preview & blocked states) */}
                {(isInIframe || permissionState === 'denied') && (
                  <button
                    type="button"
                    onClick={() => WebPushService.openStandaloneToPrompt()}
                    className="px-3.5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs"
                    title="Open app in a standalone browser tab where native notification permission prompts can display freely"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Standalone Tab &amp; Prompt</span>
                  </button>
                )}

                {/* 3. Re-Check Status Button */}
                {permissionState === 'denied' && (
                  <button
                    type="button"
                    onClick={handleRecheckPermission}
                    disabled={isRechecking}
                    className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs"
                    title="Re-check browser notification permission"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRechecking ? 'animate-spin' : ''}`} />
                    <span>Re-Check Status</span>
                  </button>
                )}
              </>
            )}

            {isSubscribed && (
              <button
                type="button"
                onClick={handleSendTestPush}
                disabled={isTesting}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 shadow-2xs cursor-pointer"
              >
                {isTesting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                )}
                <span>{isTesting ? 'Sending...' : 'Test on Phone / Device'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Step-by-Step Unblock Helper Guide when Denied */}
        {permissionState === 'denied' && (
          <div className="mt-4 pt-4 border-t border-amber-200/80 dark:border-amber-800/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>How to allow notifications in your browser:</span>
              </div>
              <button
                type="button"
                onClick={() => setShowUnblockGuide(prev => !prev)}
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {showUnblockGuide ? 'Hide Steps' : 'Show Detailed Steps'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-700 dark:text-slate-300">
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-amber-200/60 dark:border-slate-700/80 flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-[10px] shrink-0">1</span>
                <span>Click the <strong>🔒 padlock</strong> or <strong>🎚️ tune icon</strong> beside the URL in your browser bar.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-amber-200/60 dark:border-slate-700/80 flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-[10px] shrink-0">2</span>
                <span>Toggle <strong>Notifications</strong> from <em>Blocked</em> to <strong>Allow</strong>.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-amber-200/60 dark:border-slate-700/80 flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-[10px] shrink-0">3</span>
                <span>Click <strong>Re-Check Status</strong> or <strong>Ask to Allow</strong> above.</span>
              </div>
            </div>

            {isInIframe && (
              <div className="p-2.5 rounded-xl bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800 text-[11px] text-blue-900 dark:text-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span>
                  💡 <strong>In AI Studio preview:</strong> Embedded frames automatically suppress notification prompts. Tap the button to launch standalone.
                </span>
                <button
                  type="button"
                  onClick={() => WebPushService.openStandaloneToPrompt()}
                  className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shrink-0 active:scale-95 transition-all cursor-pointer self-start sm:self-auto"
                >
                  Open Standalone Tab
                </button>
              </div>
            )}
          </div>
        )}

        {/* Test Result Feedback */}
        {testResult && (
          <div className={`mt-3 pt-3 border-t text-xs flex items-center gap-2 font-medium ${
            testResult.success 
              ? 'border-emerald-200 text-emerald-800 dark:text-emerald-300' 
              : 'border-rose-200 text-rose-700 dark:text-rose-300'
          }`}>
            {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>

      {/* Live Updates, Study Reminders & Phone Popups Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                Live Updates &amp; Study Reminders (Phone Popups)
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Just like Community Chat, live announcements and 1, 3, and 7-day memory consolidation intervals drop as actual system popups into your phone's notification tray with audio chime and haptics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => {
              if (user?.uid) {
                NotificationService.triggerTestLiveUpdate(user.uid);
                if (onShowToast) onShowToast('📢 Live Update popped up on phone with chime & vibration!');
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 font-extrabold text-xs shrink-0 active:scale-95 transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
            title="Test Live Update platform announcement popup on your phone"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Test Live Update</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (user?.uid) {
                NotificationService.triggerTestStudyReminder(user.uid);
                if (onShowToast) onShowToast('🧠 1, 3 & 7-Day Study Reminder popped up on phone!');
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/70 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800 font-extrabold text-xs shrink-0 active:scale-95 transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
            title="Test 1, 3, and 7-day Spaced Repetition study reminder popup on your phone"
          >
            <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Test Study Reminder</span>
          </button>
        </div>
      </div>

      {/* AI Personal Study Companion & Persistent Learning Memory */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/70 dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h5 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 font-serif">
                  AI Personal Study Companion
                </h5>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  memory?.remindersPaused 
                    ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200' 
                    : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                }`}>
                  {memory?.remindersPaused ? 'Paused' : 'Active Engine'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Evaluates your real learning history to deliver grounded, non-spammy reminders when you need them.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
            <button
              type="button"
              onClick={handleTogglePause}
              className={`flex-1 sm:flex-initial justify-center px-3 py-2 sm:py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                memory?.remindersPaused
                  ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {memory?.remindersPaused ? (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Resume Reminders</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause Reminders</span>
                </>
              )}
            </button>

            {isSubscribed && (
              <button
                type="button"
                onClick={handleTestCompanion}
                disabled={isTestingCompanion}
                className="flex-1 sm:flex-initial justify-center px-3.5 py-2 sm:py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 text-center"
                title="Generates a real grounded reminder based on your learning memory and sends it to your device"
              >
                {isTestingCompanion ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>{isTestingCompanion ? 'Generating...' : 'Simulate Companion Check-in'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Companion Test Result Feedback */}
        {companionResult && (
          <div className={`p-3 rounded-2xl text-xs flex items-center gap-2 font-medium ${
            companionResult.success 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
              : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
          }`}>
            {companionResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
            <span>{companionResult.message}</span>
          </div>
        )}

        {/* Persistent Learning Memory Context Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* Active Learning Focus */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-indigo-500" />
              <span>Current Learning Focus</span>
            </span>
            <h6 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
              {memory?.currentSubject || 'African Morphology & Linguistics'}
            </h6>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Topic: <strong className="text-slate-700 dark:text-slate-300">{memory?.currentTopic || 'Word Formation Processes'}</strong>
            </p>
          </div>

          {/* Last Study Session */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-500" />
              <span>Last Meaningful Activity</span>
            </span>
            <div className="flex items-center justify-between">
              <h6 className="font-bold text-xs text-slate-900 dark:text-slate-100 capitalize">
                {memory?.lastStudyActivity?.type 
                  ? `${memory.lastStudyActivity.type} Session` 
                  : 'Diagnostic Exploration'}
              </h6>
              {memory?.lastStudyActivity?.timestamp && (
                <span className="text-[10px] text-slate-400">
                  {new Date(memory.lastStudyActivity.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {memory?.lastStudyActivity?.lessonTitle || memory?.lastStudyActivity?.topic || 'Interactive academic dialogue'}
            </p>
          </div>
        </div>

        {/* Diagnosed Weak Areas & Unfinished Lessons badges */}
        <div className="space-y-2">
          {memory?.weakAreas && memory.weakAreas.length > 0 && (
            <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-amber-600" />
                  <span>Diagnosed Weak Concepts (Targeted for Practice)</span>
                </span>
                <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold">
                  {memory.weakAreas.length} identified
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {memory.weakAreas.map((w, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-[11px] text-amber-900 dark:text-amber-200 font-medium shadow-2xs"
                  >
                    {w.topic} {w.accuracy ? `(${w.accuracy}%)` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Next Step Card */}
          {memory?.recommendedNextStep && (
            <div className="p-3.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-200" />
                  <span>Nora Recommended Next Step</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/20 text-white uppercase tracking-wider">
                  {memory.recommendedNextStep.action.replace('-', ' ')}
                </span>
              </div>
              <div>
                <h6 className="font-bold text-xs text-white">
                  {memory.recommendedNextStep.title}
                </h6>
                <p className="text-[11px] text-indigo-100/90 leading-snug mt-0.5">
                  {memory.recommendedNextStep.rationale}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Why Learnora Sends Notifications Card (Educational) */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
        <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Our Notification Promise</span>
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
              <Brain className="w-3.5 h-3.5" />
            </div>
            <div>
              <strong className="block text-slate-900 dark:text-slate-100">Spaced Repetition Decay Halt</strong>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">Consolidates memories at day 1, 3, and 7 so you don&apos;t forget concepts.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Flame className="w-3.5 h-3.5" />
            </div>
            <div>
              <strong className="block text-slate-900 dark:text-slate-100">Daily Streak Preservation</strong>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">A friendly nudge in the evening before your learning cadence resets.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div>
              <strong className="block text-slate-900 dark:text-slate-100">Zero Spam &amp; Strict Quiet Hours</strong>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">Notifications are silenced during sleeping hours unless marked urgent.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <strong className="block text-slate-900 dark:text-slate-100">Instant Deep Linking</strong>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">Tapping a notification brings you straight to your flashcard deck or tutor lesson.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Frequency & Categories Toggles */}
      <div className="space-y-4">
        <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Delivery Preferences &amp; Triggers
        </h5>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
          {/* 1. Daily Study Reminders */}
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h6 className="font-bold text-xs text-slate-900 dark:text-slate-100">Daily Study Reminders</h6>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Receive a daily check-in matching your dedicated learning schedule.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {prefs.dailyStudyReminder && (
                <select
                  value={prefs.preferredStudyTime}
                  onChange={(e) => handleTogglePref('preferredStudyTime', e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                >
                  <option value="07:00">07:00 AM</option>
                  <option value="08:00">08:00 AM</option>
                  <option value="09:00">09:00 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="17:00">05:00 PM</option>
                  <option value="18:00">06:00 PM</option>
                  <option value="20:00">08:00 PM</option>
                  <option value="21:00">09:00 PM</option>
                </select>
              )}
              <button
                type="button"
                onClick={() => handleTogglePref('dailyStudyReminder', !prefs.dailyStudyReminder)}
                className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                  prefs.dailyStudyReminder ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    prefs.dailyStudyReminder ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 2. Spaced Repetition (1, 3, 7 days) */}
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-600" />
                <h6 className="font-bold text-xs text-slate-900 dark:text-slate-100">Spaced Repetition Review Queue</h6>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Alerts when lessons hit 1-day, 3-day, and 7-day recall checkpoints.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleTogglePref('spacedReviewAlerts', !prefs.spacedReviewAlerts)}
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                prefs.spacedReviewAlerts ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  prefs.spacedReviewAlerts ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* 3. Streak Protection */}
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <h6 className="font-bold text-xs text-slate-900 dark:text-slate-100">Streak Preservation Alerts</h6>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Warns in the evening if your daily study goal is pending so your streak doesn&apos;t break.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleTogglePref('streakProtectionAlerts', !prefs.streakProtectionAlerts)}
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                prefs.streakProtectionAlerts ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  prefs.streakProtectionAlerts ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* 4. Nora AI Tutor Check-Ins */}
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h6 className="font-bold text-xs text-slate-900 dark:text-slate-100">Nora Socratic Study Prompts</h6>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Receive proactive interactive voice dialogue prompts and conceptual quizzes from Nora.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleTogglePref('tutorCheckIns', !prefs.tutorCheckIns)}
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                prefs.tutorCheckIns ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  prefs.tutorCheckIns ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* 5. Platform & Admin Announcements */}
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h6 className="font-bold text-xs text-slate-900 dark:text-slate-100">Platform &amp; Maintenance Updates</h6>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Important announcements from Learnora administrators regarding maintenance and new features.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleTogglePref('adminAnnouncements', !prefs.adminAnnouncements)}
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                prefs.adminAnnouncements ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  prefs.adminAnnouncements ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Quiet Hours Configuration */}
      <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <h6 className="font-bold text-xs text-slate-900 dark:text-slate-100">Quiet Hours (Do Not Disturb)</h6>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Mutes all non-emergency study prompts while you sleep.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleTogglePref('quietHoursEnabled', !prefs.quietHoursEnabled)}
            className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
              prefs.quietHoursEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                prefs.quietHoursEnabled ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>

        {prefs.quietHoursEnabled && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs text-slate-600 dark:text-slate-300">
            <span className="shrink-0">Mute from</span>
            <input
              type="time"
              value={prefs.quietHoursStart}
              onChange={(e) => handleTogglePref('quietHoursStart', e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
            />
            <span className="shrink-0">until</span>
            <input
              type="time"
              value={prefs.quietHoursEnd}
              onChange={(e) => handleTogglePref('quietHoursEnd', e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
            />
          </div>
        )}
      </div>

      {/* Device Registration & Management Footer */}
      {isSubscribed && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-slate-400" />
            <span>Device ID: <code className="font-mono text-[11px] text-slate-700 dark:text-slate-300">{WebPushService.getDeviceId().slice(0, 14)}...</code></span>
          </div>

          <button
            type="button"
            onClick={handleUnsubscribe}
            disabled={isLoading}
            className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 font-bold hover:underline flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Unsubscribe Device</span>
          </button>
        </div>
      )}
    </div>
  );
};
