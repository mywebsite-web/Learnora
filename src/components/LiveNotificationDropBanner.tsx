import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  X, 
  ChevronRight, 
  Sparkles, 
  Flame, 
  BrainCircuit, 
  Clock, 
  Award, 
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  Volume2,
  VolumeX
} from 'lucide-react';
import { NotificationItem, NotificationType } from '../types';
import { CommunityChatService } from '../services/communityChatService';
import { NotificationService } from '../services/notificationService';

interface LiveNotificationDropBannerProps {
  notification: NotificationItem | null;
  onDismiss: () => void;
  onNavigateAction?: (actionUrl?: string) => void;
  durationMs?: number;
}

export const LiveNotificationDropBanner: React.FC<LiveNotificationDropBannerProps> = ({
  notification,
  onDismiss,
  onNavigateAction,
  durationMs = 7000
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isVisible, setIsVisible] = useState(false);
  const progressIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!notification) {
      setIsVisible(false);
      setProgress(100);
      return;
    }

    // Trigger enter drop animation
    setIsVisible(true);
    setProgress(100);

    // Audio chime & phone vibration (WhatsApp dual buzz)
    if (notification.type === 'chat') {
      CommunityChatService.playWhatsAppChime();
      CommunityChatService.triggerWhatsAppVibration();
      CommunityChatService.showNativePhoneNotification(notification.title, {
        body: notification.message
      });
    } else {
      NotificationService.playNotificationChime();
    }

    const stepMs = 50;
    const totalSteps = durationMs / stepMs;
    const decrement = 100 / totalSteps;

    progressIntervalRef.current = window.setInterval(() => {
      setIsHovered(hovered => {
        if (!hovered) {
          setProgress(prev => {
            const next = prev - decrement;
            if (next <= 0) {
              if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
              handleClose();
              return 0;
            }
            return next;
          });
        }
        return hovered;
      });
    }, stepMs);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [notification?.id]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss();
    }, 250);
  };

  const handleClickBanner = () => {
    if (notification?.actionUrl && onNavigateAction) {
      onNavigateAction(notification.actionUrl);
    }
    handleClose();
  };

  if (!notification) return null;

  // Icon & color theme based on notification type
  const getTypeStyling = (type: NotificationType) => {
    switch (type) {
      case 'announcement':
        return {
          icon: Bell,
          badgeBg: 'bg-blue-100 dark:bg-blue-950/80',
          badgeText: 'text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
          iconColor: 'text-blue-600 dark:text-blue-400',
          pillLabel: 'Live Platform Update'
        };
      case 'spaced-review':
        return {
          icon: Clock,
          badgeBg: 'bg-purple-100 dark:bg-purple-950/80',
          badgeText: 'text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
          iconColor: 'text-purple-600 dark:text-purple-400',
          pillLabel: 'Spaced Review Due'
        };
      case 'study-reminder':
        return {
          icon: BrainCircuit,
          badgeBg: 'bg-indigo-100 dark:bg-indigo-950/80',
          badgeText: 'text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
          iconColor: 'text-indigo-600 dark:text-indigo-400',
          pillLabel: 'Nora AI Study Prompt'
        };
      case 'streak':
        return {
          icon: Flame,
          badgeBg: 'bg-amber-100 dark:bg-amber-950/80',
          badgeText: 'text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          iconColor: 'text-amber-600 dark:text-amber-400',
          pillLabel: 'Study Streak Milestone'
        };
      case 'achievement':
        return {
          icon: Award,
          badgeBg: 'bg-emerald-100 dark:bg-emerald-950/80',
          badgeText: 'text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          pillLabel: 'Achievement Unlocked'
        };
      case 'chat':
        return {
          icon: MessageSquare,
          badgeBg: 'bg-emerald-500/15 dark:bg-emerald-500/25',
          badgeText: 'text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          pillLabel: 'WhatsApp Drop • Community Chat'
        };
      case 'system':
      default:
        return {
          icon: Sparkles,
          badgeBg: 'bg-blue-100 dark:bg-blue-950/80',
          badgeText: 'text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
          iconColor: 'text-blue-600 dark:text-blue-400',
          pillLabel: 'Platform Alert'
        };
    }
  };

  const style = getTypeStyling(notification.type);
  const Icon = style.icon;

  return (
    <div 
      className={`fixed top-[max(0.5rem,env(safe-area-inset-top))] sm:top-4 left-1/2 -translate-x-1/2 z-[999999] w-[95%] max-w-md transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] select-none ${
        isVisible 
          ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' 
          : 'opacity-0 -translate-y-28 scale-90 pointer-events-none'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="alert"
      aria-live="polite"
    >
      <div className="relative rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-700/80 shadow-2xl shadow-slate-900/15 dark:shadow-black/50 overflow-hidden ring-1 ring-black/5 dark:ring-white/10 group cursor-pointer">
        
        {/* Subtle glowing animated backdrop indicator */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-3xl pointer-events-none" />

        <div className="relative p-3.5 sm:p-4 flex items-start gap-3" onClick={handleClickBanner}>
          
          {/* Category Icon Badge with gentle pulse */}
          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 ${style.badgeBg} shadow-sm group-hover:scale-105 transition-transform`}>
            <Icon className={`w-5 h-5 ${style.iconColor}`} />
          </div>

          {/* Text Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${style.badgeBg} ${style.badgeText}`}>
                {style.pillLabel}
              </span>
              <span className="text-slate-300 dark:text-slate-600 text-xs">·</span>
              <span className="text-[10px] font-bold text-slate-400">
                {notification.sender || 'Just now'}
              </span>
            </div>

            <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-snug truncate">
              {notification.title}
            </h4>
            
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2 mt-0.5 leading-relaxed">
              {notification.message}
            </p>

            {/* Action link if available */}
            {notification.actionLabel && (
              <div className="mt-2 flex items-center gap-1 text-[11px] font-black text-blue-600 dark:text-blue-400 group-hover:underline">
                <span>{notification.actionLabel}</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            )}
          </div>

          {/* Close 'X' Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="w-7 h-7 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors shrink-0 -mr-1 -mt-1"
            title="Dismiss notification"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Countdown Auto-Dismiss Progress Bar */}
        <div className="w-full h-1 bg-slate-100 dark:bg-slate-800/80">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
