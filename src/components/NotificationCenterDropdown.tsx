import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  X, 
  Clock, 
  BrainCircuit, 
  Flame, 
  Award, 
  ChevronRight, 
  Sparkles, 
  Check, 
  Volume2,
  VolumeX,
  CheckCircle2,
  ExternalLink,
  Smartphone
} from 'lucide-react';
import { NotificationItem, NotificationType } from '../types';
import { NotificationService } from '../services/notificationService';

interface NotificationCenterDropdownProps {
  notifications: NotificationItem[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onClearAll: () => void;
  onNavigateAction: (actionUrl?: string) => void;
  onTriggerTestDrop: () => void;
  onOpenFullView?: () => void;
  onOpenPushSettings?: () => void;
}

export const NotificationCenterDropdown: React.FC<NotificationCenterDropdownProps> = ({
  notifications,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAll,
  onNavigateAction,
  onTriggerTestDrop,
  onOpenFullView,
  onOpenPushSettings
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'announcements' | 'study'>('all');
  const [items, setItems] = useState<NotificationItem[]>(notifications);
  const [isLiveAlertsEnabled, setIsLiveAlertsEnabled] = useState<boolean>(() => {
    return NotificationService.isLiveAlertsEnabled();
  });
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync with prop updates
  useEffect(() => {
    setItems(notifications);
  }, [notifications]);

  const unreadCount = items.filter(n => !n.read).length;

  const filteredNotifications = items.filter(n => {
    if (filterTab === 'unread') return !n.read;
    if (filterTab === 'announcements') return n.type === 'announcement' || n.type === 'system';
    if (filterTab === 'study') return n.type === 'spaced-review' || n.type === 'study-reminder' || n.type === 'streak';
    return true;
  });

  const handleToggleAlerts = (enable: boolean) => {
    if (enable) {
      NotificationService.playNotificationChime();
      NotificationService.setLiveAlertsEnabled(true);
      setIsLiveAlertsEnabled(true);
      setActionSuccessToast('Live drop alerts and audio chime enabled!');
      setTimeout(() => setActionSuccessToast(null), 3000);
      onTriggerTestDrop();
      NotificationService.requestBrowserPermission().catch(() => {});
    } else {
      NotificationService.setLiveAlertsEnabled(false);
      setIsLiveAlertsEnabled(false);
      setActionSuccessToast('Live drop alerts muted');
      setTimeout(() => setActionSuccessToast(null), 2500);
    }
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setItems(prev => prev.filter(n => n.id !== id));
    onDeleteNotification(id);
    setActionSuccessToast('Notification deleted');
    setTimeout(() => setActionSuccessToast(null), 2000);
  };

  const handleClearAllItems = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setItems([]);
    onClearAll();
    setActionSuccessToast('All notifications cleared');
    setTimeout(() => setActionSuccessToast(null), 2000);
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    onMarkAllAsRead();
  };

  const formatRelativeTime = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'announcement':
        return <Bell className="w-4 h-4 text-blue-500" />;
      case 'spaced-review':
        return <Clock className="w-4 h-4 text-purple-500" />;
      case 'study-reminder':
        return <BrainCircuit className="w-4 h-4 text-indigo-500" />;
      case 'streak':
        return <Flame className="w-4 h-4 text-amber-500" />;
      case 'achievement':
        return <Award className="w-4 h-4 text-emerald-500" />;
      case 'system':
      default:
        return <Sparkles className="w-4 h-4 text-blue-500" />;
    }
  };

  const dropdownContent = (
    <>
      {/* Mobile Dimmed Backdrop (Closes dropdown on outside tap on phone screens) */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9998] sm:hidden animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Notification Dropdown / Card (Drops right beneath header bell on mobile and desktop) */}
      <div 
        data-notification-center="true"
        className="fixed inset-x-2.5 top-[62px] sm:top-18 sm:inset-auto sm:right-6 sm:w-[415px] max-h-[calc(100dvh-74px)] sm:max-h-[82vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 z-[9999] overflow-hidden flex flex-col ring-1 ring-black/5 dark:ring-white/10 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Notification Center"
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 truncate">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-blue-600 text-white shrink-0">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate">
                Live updates &amp; study reminders
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-xl transition-colors font-bold flex items-center gap-1 active:scale-95 cursor-pointer"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold hidden xs:inline">Mark read</span>
              </button>
            )}
            {onOpenFullView && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFullView();
                }}
                className="w-8 h-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                title="Open full notifications view"
                aria-label="Open full notifications page"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
              title="Close notifications"
              aria-label="Close notifications"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action feedback toast */}
        {actionSuccessToast && (
          <div className="px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 animate-fade-in shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">{actionSuccessToast}</span>
          </div>
        )}

        {/* Live Drop Notification Controls Banner - Ergonomic and responsive */}
        <div className="px-3.5 py-2 bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs gap-2 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${isLiveAlertsEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate">
              {isLiveAlertsEnabled ? 'Live chimes on' : 'Chimes muted'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                NotificationService.playNotificationChime();
                onTriggerTestDrop();
              }}
              className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] font-bold transition-colors flex items-center gap-1 active:scale-95 cursor-pointer border border-blue-200/60 dark:border-blue-800/60"
              title="Trigger a test live drop notification banner"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Test Drop</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleAlerts(!isLiveAlertsEnabled)}
              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-all active:scale-95 cursor-pointer ${
                isLiveAlertsEnabled 
                  ? 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
              }`}
            >
              {isLiveAlertsEnabled ? 'Mute' : 'Enable'}
            </button>
          </div>
        </div>

        {/* Filter Tabs Bar (Full horizontal width without squeezed controls) */}
        <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-white dark:bg-slate-900 shrink-0">
          {[
            { id: 'all', label: `All (${items.length})` },
            { id: 'unread', label: `Unread (${unreadCount})` },
            { id: 'announcements', label: 'Updates' },
            { id: 'study', label: 'Study & Socratic' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                filterTab === tab.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Notification Item List - Fully unclipped with comfortable scrolling */}
        <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800/80 overscroll-contain">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 px-4 text-center text-xs text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
                <Bell className="w-6 h-6 stroke-1" />
              </div>
              <p className="font-bold text-slate-700 dark:text-slate-300">No notifications here</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                {filterTab === 'unread' 
                  ? 'You are completely caught up! No unread notifications.'
                  : 'New study reminders and platform updates will appear here in real time.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map(item => (
              <div
                key={item.id}
                onClick={() => {
                  if (!item.read) onMarkAsRead(item.id);
                  if (item.actionUrl) {
                    onNavigateAction(item.actionUrl);
                    onClose();
                  }
                }}
                className={`p-3 sm:p-3.5 flex items-start gap-2.5 sm:gap-3 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors cursor-pointer group relative ${
                  !item.read ? 'bg-blue-50/50 dark:bg-blue-950/30' : ''
                }`}
              >
                {/* Category Icon with integrated Unread Dot Badge */}
                <div className="relative shrink-0 mt-0.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {getTypeIcon(item.type)}
                  </div>
                  {!item.read && (
                    <span 
                      className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" 
                      title="Unread notification"
                    />
                  )}
                </div>

                {/* Text Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
                      {item.sender || item.type}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>

                  <h4 className={`text-xs sm:text-sm leading-snug break-words ${!item.read ? 'font-black text-slate-900 dark:text-slate-100' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                    {item.title}
                  </h4>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-3 mt-0.5 leading-relaxed break-words">
                    {item.message}
                  </p>

                  {item.actionLabel && (
                    <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                      <span>{item.actionLabel}</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  )}
                </div>

                {/* Delete button (Ergonomic touch-friendly button) */}
                <button
                  type="button"
                  onClick={(e) => handleDeleteItem(item.id, e)}
                  className="w-8 h-8 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 flex items-center justify-center transition-all shrink-0 active:scale-90 cursor-pointer ml-1"
                  title="Delete notification"
                  aria-label={`Delete notification: ${item.title}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer - Always visible above mobile nav bar */}
        <div className="p-2.5 sm:p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/70 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">
              {items.length} {items.length === 1 ? 'notification' : 'notifications'}
            </span>
            {onOpenFullView && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFullView();
                }}
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 active:scale-95 cursor-pointer ml-1"
              >
                <span>Full Page</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
            {onOpenPushSettings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPushSettings();
                }}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 active:scale-95 cursor-pointer ml-1"
                title="Configure Web Push notifications & quiet hours"
              >
                <Smartphone className="w-3 h-3 text-indigo-500" />
                <span>Push Alerts</span>
              </button>
            )}
          </div>
          {items.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllItems}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors active:scale-95 cursor-pointer"
            >
              Clear all
            </button>
          )}
        </div>
      </div>
    </>
  );

  if (!isMounted || typeof document === 'undefined') return null;
  return createPortal(dropdownContent, document.body);
};
