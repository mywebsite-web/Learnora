import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Clock, 
  BrainCircuit, 
  Flame, 
  Award, 
  ChevronRight, 
  Search, 
  Filter, 
  ShieldCheck,
  Check,
  Smartphone
} from 'lucide-react';
import { NotificationItem, NotificationType } from '../types';
import { NotificationService } from '../services/notificationService';

interface NotificationsViewProps {
  notifications: NotificationItem[];
  userId?: string;
  onBack: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onClearAll: () => void;
  onNavigateAction: (actionUrl?: string) => void;
  onTriggerTestDrop: () => void;
  onTriggerTestLiveUpdate?: () => void;
  onTriggerTestStudyReminder?: () => void;
  onOpenPushSettings?: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  userId,
  onBack,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAll,
  onNavigateAction,
  onTriggerTestDrop,
  onTriggerTestLiveUpdate,
  onTriggerTestStudyReminder,
  onOpenPushSettings
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'study' | 'announcements' | 'achievements'>('all');
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [isChimeEnabled, setIsChimeEnabled] = useState<boolean>(() => {
    return NotificationService.isLiveAlertsEnabled();
  });
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const handleRequestPermission = async () => {
    const res = await NotificationService.requestNotificationPermission();
    setPermissionState(res);
    if (res === 'granted') {
      setActionToast('🎉 Phone notifications permitted! Popups active.');
    } else {
      setActionToast('Notification permission not granted.');
    }
    setTimeout(() => setActionToast(null), 3000);
  };

  const handleTestLiveUpdate = async () => {
    if (permissionState !== 'granted') {
      await handleRequestPermission();
    }
    NotificationService.triggerTestLiveUpdate(userId || '', (item) => {
      setActionToast(`📢 Live Update "${item.title}" dropped to phone!`);
    });
    if (onTriggerTestLiveUpdate) onTriggerTestLiveUpdate();
    setTimeout(() => setActionToast(null), 3000);
  };

  const handleTestStudyReminder = async () => {
    if (permissionState !== 'granted') {
      await handleRequestPermission();
    }
    NotificationService.triggerTestStudyReminder(userId || '', (item) => {
      setActionToast(`🧠 Study Reminder "${item.title}" dropped to phone!`);
    });
    if (onTriggerTestStudyReminder) onTriggerTestStudyReminder();
    setTimeout(() => setActionToast(null), 3000);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleToggleChime = (enabled: boolean) => {
    setIsChimeEnabled(enabled);
    NotificationService.setLiveAlertsEnabled(enabled);
    if (enabled) {
      NotificationService.playNotificationChime();
      NotificationService.requestBrowserPermission().catch(() => {});
      setActionToast('Live audio chimes enabled');
    } else {
      setActionToast('Audio chimes muted');
    }
    setTimeout(() => setActionToast(null), 2500);
  };

  const handleMarkAll = () => {
    onMarkAllAsRead();
    setActionToast('All notifications marked as read');
    setTimeout(() => setActionToast(null), 2500);
  };

  const handleClear = () => {
    if (window.confirm('Clear all notifications? This cannot be undone.')) {
      onClearAll();
      setActionToast('All notifications cleared');
      setTimeout(() => setActionToast(null), 2500);
    }
  };

  const formatRelativeTime = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    if (diff < 60 * 1000) return 'Just now';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'announcement':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'spaced-review':
        return <Clock className="w-4 h-4 text-purple-500" />;
      case 'study-reminder':
        return <BrainCircuit className="w-4 h-4 text-indigo-500" />;
      case 'streak':
        return <Flame className="w-4 h-4 text-rose-500" />;
      case 'achievement':
        return <Award className="w-4 h-4 text-emerald-500" />;
      case 'system':
      default:
        return <Bell className="w-4 h-4 text-blue-500" />;
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter(item => {
      // Filter tab check
      if (filterType === 'unread' && item.read) return false;
      if (filterType === 'study' && !['spaced-review', 'study-reminder'].includes(item.type)) return false;
      if (filterType === 'announcements' && item.type !== 'announcement') return false;
      if (filterType === 'achievements' && !['achievement', 'streak'].includes(item.type)) return false;

      // Query check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.message.toLowerCase().includes(q) ||
          (item.sender && item.sender.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [notifications, filterType, searchQuery]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-y-auto pb-28 sm:pb-16">
      {/* Toast Feedback */}
      {actionToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-fade-in border border-white/10 dark:border-slate-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{actionToast}</span>
        </div>
      )}

      {/* Top Header Navigation */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3.5 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all shrink-0 cursor-pointer"
              title="Return to Dashboard"
              aria-label="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <Bell className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
                  Notifications &amp; Activity
                </h1>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white shrink-0">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 truncate">
                Real-time study alerts, review intervals &amp; announcements
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer border border-blue-200/50 dark:border-blue-800/50"
                title="Mark all notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 font-bold text-xs flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                title="Clear all notifications"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear all</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto w-full p-3.5 sm:p-6 space-y-4 sm:space-y-6 flex-1">
        
        {/* Real-time Phone Popups & Live Drop Controls */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs mt-0.5 ${
                permissionState === 'granted'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-indigo-600 text-white'
              }`}>
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    Live Updates &amp; Study Reminders (Phone Popups)
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    permissionState === 'granted'
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                      : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${permissionState === 'granted' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span>{permissionState === 'granted' ? 'Phone Popups Active' : 'Permission Needed'}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Exactly like Community Chat, live platform updates, 1, 3 &amp; 7-day spaced repetition reminders drop as actual system notifications in your phone's notification tray with sound and vibration.
                </p>
              </div>
            </div>

            {/* Chime & Sound Controls */}
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => handleToggleChime(!isChimeEnabled)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                  isChimeEnabled
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                }`}
                title={isChimeEnabled ? 'Mute notification chimes' : 'Enable notification chimes'}
              >
                {isChimeEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>{isChimeEnabled ? 'Chime Active' : 'Muted'}</span>
              </button>
              {onOpenPushSettings && (
                <button
                  type="button"
                  onClick={onOpenPushSettings}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                  title="Configure background push & quiet hours"
                >
                  <Smartphone className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="hidden sm:inline">Settings</span>
                </button>
              )}
            </div>
          </div>

          {/* Test Buttons Row */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2.5">
            {permissionState !== 'granted' && (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-xs"
              >
                <Bell className="w-3.5 h-3.5 animate-pulse" />
                <span>Allow Phone Notifications</span>
              </button>
            )}

            {/* 1. Test Live Update */}
            <button
              type="button"
              onClick={handleTestLiveUpdate}
              className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 text-xs font-extrabold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs"
              title="Drop a live platform announcement popup to your phone with chime and vibration"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>📢 Test Live Update (Phone Drop)</span>
            </button>

            {/* 2. Test Study Reminder */}
            <button
              type="button"
              onClick={handleTestStudyReminder}
              className="px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/70 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800 text-xs font-extrabold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs"
              title="Drop a 1, 3, or 7-day spaced repetition review reminder popup to your phone"
            >
              <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>🧠 Test Study Reminder (Phone Drop)</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications, study reminders, or updates..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs transition-all"
            />
          </div>

          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'all', label: `All (${notifications.length})` },
              { id: 'unread', label: `Unread (${unreadCount})` },
              { id: 'study', label: 'Study & Socratic' },
              { id: 'announcements', label: 'Announcements' },
              { id: 'achievements', label: 'Streaks & Honors' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  filterType === tab.id
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-2.5">
          {filteredNotifications.length === 0 ? (
            <div className="py-16 px-4 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Bell className="w-6 h-6 stroke-1" />
              </div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-200">
                No notifications match your filter
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {filterType === 'unread'
                  ? 'All caught up! You have reviewed all notifications.'
                  : 'New study recommendations, spaced repetition review intervals, and Nora AI updates will appear here.'}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                >
                  Clear search query
                </button>
              )}
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (!item.read) onMarkAsRead(item.id);
                  if (item.actionUrl) {
                    onNavigateAction(item.actionUrl);
                  }
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer group flex items-start gap-3 relative ${
                  !item.read
                    ? 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 shadow-2xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                {/* Category Icon */}
                <div className="relative shrink-0 mt-0.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                    {getTypeIcon(item.type)}
                  </div>
                  {!item.read && (
                    <span 
                      className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" 
                      title="Unread notification"
                    />
                  )}
                </div>

                {/* Content Block */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {item.sender || item.type}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>

                  <h3 className={`text-sm sm:text-base leading-snug break-words ${
                    !item.read ? 'font-black text-slate-900 dark:text-slate-100' : 'font-semibold text-slate-800 dark:text-slate-200'
                  }`}>
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed break-words">
                    {item.message}
                  </p>

                  {item.actionLabel && (
                    <div className="pt-1.5 flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:underline">
                      <span>{item.actionLabel}</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </div>

                {/* Single Delete Action */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNotification(item.id);
                  }}
                  className="w-8 h-8 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 flex items-center justify-center transition-all shrink-0 active:scale-90 cursor-pointer self-start"
                  title="Delete notification"
                  aria-label={`Delete notification: ${item.title}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
