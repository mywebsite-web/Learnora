import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  X, 
  GripVertical, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Coffee, 
  Flame, 
  Clock, 
  ChevronUp, 
  ChevronDown, 
  Check, 
  Minimize2
} from 'lucide-react';
import { NotificationService } from '../services/notificationService';

export type TimerMode = 'pomodoro' | 'deep' | 'shortBreak' | 'longBreak' | 'stopwatch';

interface FloatingStudyTimerProps {
  isVisible: boolean;
  onToggleVisibility: () => void;
  activeSubject?: string;
  onLogStudyTime: (minutes: number, subject?: string) => Promise<void>;
}

interface TimerConfig {
  label: string;
  defaultSeconds: number;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  isBreak: boolean;
}

const TIMER_CONFIGS: Record<TimerMode, TimerConfig> = {
  pomodoro: {
    label: 'Pomodoro',
    defaultSeconds: 25 * 60,
    icon: Flame,
    accentColor: 'text-rose-400 bg-rose-500/20 border-rose-500/30',
    isBreak: false
  },
  deep: {
    label: 'Deep Focus',
    defaultSeconds: 50 * 60,
    icon: Sparkles,
    accentColor: 'text-indigo-400 bg-indigo-500/20 border-indigo-500/30',
    isBreak: false
  },
  shortBreak: {
    label: 'Short Break',
    defaultSeconds: 5 * 60,
    icon: Coffee,
    accentColor: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
    isBreak: true
  },
  longBreak: {
    label: 'Long Break',
    defaultSeconds: 15 * 60,
    icon: Coffee,
    accentColor: 'text-teal-400 bg-teal-500/20 border-teal-500/30',
    isBreak: true
  },
  stopwatch: {
    label: 'Stopwatch',
    defaultSeconds: 0,
    icon: Clock,
    accentColor: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    isBreak: false
  }
};

const STORAGE_KEY_POS = 'learnora_floating_timer_pos';
const STORAGE_KEY_STATE = 'learnora_floating_timer_state';

export const FloatingStudyTimer: React.FC<FloatingStudyTimerProps> = ({
  isVisible,
  onToggleVisibility,
  activeSubject = 'General Studies',
  onLogStudyTime
}) => {
  // Timer States
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [timeLeft, setTimeLeft] = useState<number>(TIMER_CONFIGS.pomodoro.defaultSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [completedSessions, setCompletedSessions] = useState<number>(0);

  // Dragging States
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_POS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch {}
    // Default: Top-right corner, comfortably below navigation bar
    const initialX = typeof window !== 'undefined' ? Math.max(16, window.innerWidth - 220) : 100;
    return { x: initialX, y: 76 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const isPointerDownRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number; hasMoved: boolean }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
    hasMoved: false
  });

  const widgetRef = useRef<HTMLDivElement>(null);
  const lastTickRef = useRef<number>(Date.now());

  // Load persisted state on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_STATE);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.mode && TIMER_CONFIGS[saved.mode as TimerMode]) {
          setMode(saved.mode);
        }
        if (typeof saved.timeLeft === 'number') {
          setTimeLeft(saved.timeLeft);
        }
        if (typeof saved.completedSessions === 'number') {
          setCompletedSessions(saved.completedSessions);
        }
        if (typeof saved.soundEnabled === 'boolean') {
          setSoundEnabled(saved.soundEnabled);
        }
      }
    } catch {}
  }, []);

  // Save state on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify({
        mode,
        timeLeft,
        completedSessions,
        soundEnabled
      }));
    } catch {}
  }, [mode, timeLeft, completedSessions, soundEnabled]);

  // Keep widget clamped inside screen boundaries on window resize
  const clampPosition = useCallback((x: number, y: number) => {
    if (typeof window === 'undefined') return { x, y };
    const width = widgetRef.current?.offsetWidth || 190;
    const height = widgetRef.current?.offsetHeight || 44;
    const maxX = Math.max(12, window.innerWidth - width - 12);
    const maxY = Math.max(12, window.innerHeight - height - 12);
    return {
      x: Math.min(maxX, Math.max(12, x)),
      y: Math.min(maxY, Math.max(12, y))
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => clampPosition(prev.x, prev.y));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampPosition]);

  // When timer finishes
  const handleTimerFinished = useCallback(() => {
    setIsRunning(false);

    // 1. Play Audio Chime
    if (soundEnabled) {
      try {
        NotificationService.playNotificationChime();
      } catch (e) {
        console.warn('Audio chime notice:', e);
      }
    }

    // 2. Mobile haptic feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([200, 100, 200, 100, 300]);
      } catch {}
    }

    const config = TIMER_CONFIGS[mode];
    const minutesCompleted = Math.round(config.defaultSeconds / 60);

    if (!config.isBreak) {
      // Focus session completed!
      setCompletedSessions(prev => prev + 1);

      // Auto log study time to Weekly Run and XP
      if (minutesCompleted > 0) {
        onLogStudyTime(minutesCompleted, activeSubject);
      }

      // Drop live in-app notification
      window.dispatchEvent(new CustomEvent('learnora_live_notification_drop', {
        detail: {
          id: `timer_done_${Date.now()}`,
          userId: 'all',
          title: '🎉 Focus Sprint Completed!',
          message: `Awesome dedication! You logged ${minutesCompleted} focus minutes on ${activeSubject}. Take a 5-minute breather.`,
          type: 'study-reminder',
          read: false,
          createdAt: Date.now(),
          priority: 'high',
          actionUrl: 'weekly-run',
          actionLabel: 'View Weekly Run',
          sender: 'Nora Focus Timer'
        }
      }));

      // Auto set up short break
      setMode('shortBreak');
      setTimeLeft(TIMER_CONFIGS.shortBreak.defaultSeconds);
    } else {
      // Break completed
      window.dispatchEvent(new CustomEvent('learnora_live_notification_drop', {
        detail: {
          id: `break_done_${Date.now()}`,
          userId: 'all',
          title: '🔔 Break Finished!',
          message: 'Your 5-minute pause is done. Refreshed and ready for your next active recall study sprint?',
          type: 'announcement',
          read: false,
          createdAt: Date.now(),
          priority: 'high',
          actionUrl: 'flashcards',
          actionLabel: 'Resume Study',
          sender: 'Nora Focus Timer'
        }
      }));

      // Switch back to Pomodoro
      setMode('pomodoro');
      setTimeLeft(TIMER_CONFIGS.pomodoro.defaultSeconds);
    }
  }, [activeSubject, mode, onLogStudyTime, soundEnabled]);

  // Handle timer countdown / countup tick
  useEffect(() => {
    let interval: any = null;

    if (isRunning) {
      lastTickRef.current = Date.now();
      interval = setInterval(() => {
        const now = Date.now();
        // Use Math.floor to ensure accurate 1-second ticks
        const delta = Math.floor((now - lastTickRef.current) / 1000);
        
        if (delta >= 1) {
          lastTickRef.current += delta * 1000;

          if (mode === 'stopwatch') {
            setTimeLeft(prev => prev + delta);
          } else {
            setTimeLeft(prev => {
              if (prev <= delta) {
                // Timer finished!
                setTimeout(() => handleTimerFinished(), 0);
                return 0;
              }
              return prev - delta;
            });
          }
        }
      }, 250);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, mode, handleTimerFinished]);

  // Dragging event handlers (Pointer events work on both Mouse and Touch)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // If clicking on or inside any interactive button or input, DO NOT initiate drag
    const target = e.target as Element | null;
    if (
      target?.closest('button') || 
      target?.closest('input') || 
      target?.closest('select') || 
      target?.closest('[data-no-drag="true"]')
    ) {
      return;
    }

    isPointerDownRef.current = true;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
      hasMoved: false
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;
    const distance = Math.hypot(deltaX, deltaY);

    // Only capture pointer and visually set dragging once moved past 4px threshold
    if (distance > 4) {
      if (!isDragging) {
        setIsDragging(true);
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {}
      }
      dragStartRef.current.hasMoved = true;

      const nextX = dragStartRef.current.posX + deltaX;
      const nextY = dragStartRef.current.posY + deltaY;
      setPosition(clampPosition(nextX, nextY));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isPointerDownRef.current = false;
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}

      // Persist position
      try {
        localStorage.setItem(STORAGE_KEY_POS, JSON.stringify(position));
      } catch {}
    }
  };

  // Quick Controls - Guaranteed instant Play/Pause toggle
  const togglePlayPause = (e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setIsRunning(prev => !prev);
  };

  const handleReset = (e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setIsRunning(false);
    setTimeLeft(TIMER_CONFIGS[mode].defaultSeconds);
  };

  const handleSelectMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(TIMER_CONFIGS[newMode].defaultSeconds);
    setIsExpanded(false);
  };

  const adjustMinutes = (deltaMin: number, e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setTimeLeft(prev => Math.max(60, prev + deltaMin * 60));
  };

  // Format time mm:ss or hh:mm:ss
  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  const currentConfig = TIMER_CONFIGS[mode];
  const Icon = currentConfig.icon;
  const progressPercent = mode === 'stopwatch' 
    ? 100 
    : Math.min(100, Math.max(0, ((currentConfig.defaultSeconds - timeLeft) / currentConfig.defaultSeconds) * 100));

  return (
    <div
      ref={widgetRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
      className={`fixed z-[60] select-none touch-none transition-shadow ${
        isDragging ? 'cursor-grabbing opacity-95 scale-[1.02]' : 'cursor-grab'
      }`}
    >
      {/* ============================================================== */}
      {/* 1. ULTRA-COMPACT MINIMIZED ORB (IF MINIMIZED)                 */}
      {/* ============================================================== */}
      {isMinimized ? (
        <div 
          onClick={() => setIsMinimized(false)}
          className="relative group bg-slate-900/95 dark:bg-slate-900/95 border border-slate-700/80 hover:border-indigo-500/60 rounded-full p-2 shadow-2xl backdrop-blur-md flex items-center justify-center transition-all cursor-pointer ring-1 ring-white/10"
          title="Click to expand Study Timer"
        >
          {/* Subtle pulse ring if active */}
          {isRunning && (
            <span className="absolute -inset-1 rounded-full bg-emerald-500/20 animate-ping opacity-75" />
          )}

          <div className="relative w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold text-xs">
            <Icon className="w-4 h-4 text-amber-400" />
          </div>

          <div className="ml-2 pr-1.5 font-mono text-xs font-bold text-white tracking-tight">
            {formatTime(timeLeft)}
          </div>

          <button
            type="button"
            data-no-drag="true"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={togglePlayPause}
            className={`ml-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-md ${
              isRunning ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
            }`}
            title={isRunning ? 'Pause Timer' : 'Start Focus Session'}
          >
            {isRunning ? (
              <Pause className="w-3 h-3 fill-slate-950 pointer-events-none" />
            ) : (
              <Play className="w-3 h-3 fill-slate-950 ml-0.5 pointer-events-none" />
            )}
          </button>
        </div>
      ) : (
        /* ============================================================== */
        /* 2. SLIM COMPACT DOCKED PILL (DEFAULT STATE - UNDER 42PX TALL)   */
        /* ============================================================== */
        <div className="relative bg-slate-900/95 dark:bg-slate-900/95 border border-slate-700/90 hover:border-slate-600 rounded-2xl shadow-2xl backdrop-blur-md text-white px-2 py-1.5 flex items-center gap-1.5 ring-1 ring-white/10 transition-all">
          {/* Progress bar line along the bottom border */}
          {mode !== 'stopwatch' && (
            <div className="absolute bottom-0 left-3 right-3 h-[2px] bg-slate-800 rounded-full overflow-hidden pointer-events-none">
              <div 
                className={`h-full transition-all duration-500 ${
                  currentConfig.isBreak ? 'bg-emerald-400' : 'bg-indigo-400'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}

          {/* Grip drag handle icon */}
          <div 
            className="text-slate-400 hover:text-slate-200 transition-colors p-0.5 rounded cursor-grab active:cursor-grabbing shrink-0" 
            title="Drag to reposition anywhere on screen"
          >
            <GripVertical className="w-3.5 h-3.5 pointer-events-none" />
          </div>

          {/* Mode Pill Chip */}
          <button
            type="button"
            data-no-drag="true"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(prev => !prev);
            }}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 transition-all active:scale-95 ${currentConfig.accentColor}`}
            title="Change Timer Mode / Duration"
          >
            <Icon className="w-3 h-3 pointer-events-none" />
            <span className="hidden sm:inline pointer-events-none">{currentConfig.label}</span>
          </button>

          {/* Digits Display */}
          <button
            type="button"
            data-no-drag="true"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(prev => !prev);
            }}
            className="px-1.5 py-0.5 cursor-pointer font-mono font-bold text-sm tracking-tight text-white hover:text-indigo-300 transition-colors"
            title="Click for settings & presets"
          >
            {formatTime(timeLeft)}
          </button>

          {/* Play / Pause Toggle Button */}
          <button
            type="button"
            data-no-drag="true"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={togglePlayPause}
            className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold transition-all active:scale-90 shadow-md ${
              isRunning 
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 ring-2 ring-amber-500/30' 
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 ring-2 ring-emerald-500/30'
            }`}
            title={isRunning ? 'Pause Timer' : 'Start Focus Session'}
          >
            {isRunning ? (
              <Pause className="w-3.5 h-3.5 fill-slate-950 pointer-events-none" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-slate-950 ml-0.5 pointer-events-none" />
            )}
          </button>

          {/* Quick Reset */}
          <button
            type="button"
            data-no-drag="true"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleReset}
            className="w-6 h-6 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors"
            title="Reset timer"
          >
            <RotateCcw className="w-3 h-3 pointer-events-none" />
          </button>

          {/* Settings / Options toggle */}
          <button
            type="button"
            data-no-drag="true"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(prev => !prev);
            }}
            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
              isExpanded ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Focus Settings & Presets"
          >
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 pointer-events-none" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 pointer-events-none" />
            )}
          </button>

          {/* Minimize button */}
          <button
            type="button"
            data-no-drag="true"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(true);
            }}
            className="w-5 h-6 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
            title="Minimize to floating orb"
          >
            <Minimize2 className="w-3 h-3 pointer-events-none" />
          </button>

          {/* Close / Hide Button */}
          <button
            type="button"
            data-no-drag="true"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility();
            }}
            className="w-5 h-6 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors"
            title="Hide Floating Timer (Can re-open from top bar)"
          >
            <X className="w-3.5 h-3.5 pointer-events-none" />
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. EXPANDABLE PRESET & SETTINGS POPOVER                        */}
      {/* ============================================================== */}
      {isExpanded && !isMinimized && (
        <div 
          data-no-drag="true"
          onPointerDown={(e) => e.stopPropagation()}
          className="mt-2 w-72 bg-slate-900/98 dark:bg-slate-900/98 border border-slate-700 rounded-3xl p-4 shadow-2xl backdrop-blur-xl text-slate-100 space-y-3.5 animate-in fade-in zoom-in-95 origin-top"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="font-bold text-xs text-white">Focus Study Timer</span>
            </div>
            <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full font-mono">
              #{completedSessions} Sprints Done
            </span>
          </div>

          {/* Active Study Subject Tag */}
          <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
            <span>Focus Track:</span>
            <span className="font-semibold text-indigo-300 truncate max-w-[150px]">
              {activeSubject}
            </span>
          </div>

          {/* Mode Selector Buttons */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Timer Presets
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(TIMER_CONFIGS) as TimerMode[]).map((m) => {
                const conf = TIMER_CONFIGS[m];
                const ModeIcon = conf.icon;
                const isSelected = mode === m;

                return (
                  <button
                    key={m}
                    type="button"
                    data-no-drag="true"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => handleSelectMode(m)}
                    className={`px-2.5 py-2 rounded-xl text-left transition-all flex items-center gap-2 border ${
                      isSelected
                        ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold ring-1 ring-indigo-500/40'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <ModeIcon className="w-3.5 h-3.5 shrink-0 text-indigo-400 pointer-events-none" />
                    <div className="min-w-0 flex-1 pointer-events-none">
                      <div className="text-xs truncate">{conf.label}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {m === 'stopwatch' ? 'Count Up' : `${Math.round(conf.defaultSeconds / 60)}m`}
                      </div>
                    </div>
                    {isSelected && <Check className="w-3 h-3 text-indigo-400 shrink-0 pointer-events-none" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Adjust Duration */}
          {mode !== 'stopwatch' && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Quick Adjust
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  data-no-drag="true"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => adjustMinutes(-5, e)}
                  className="py-1 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 text-center transition-colors"
                >
                  -5m
                </button>
                <button
                  type="button"
                  data-no-drag="true"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => adjustMinutes(-1, e)}
                  className="py-1 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 text-center transition-colors"
                >
                  -1m
                </button>
                <button
                  type="button"
                  data-no-drag="true"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => adjustMinutes(1, e)}
                  className="py-1 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 text-center transition-colors"
                >
                  +1m
                </button>
                <button
                  type="button"
                  data-no-drag="true"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => adjustMinutes(5, e)}
                  className="py-1 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 text-center transition-colors"
                >
                  +5m
                </button>
              </div>
            </div>
          )}

          {/* Audio Chime & Auto-log Notice */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <button
              type="button"
              data-no-drag="true"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setSoundEnabled(prev => !prev)}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400 pointer-events-none" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              )}
              <span className="text-[11px] pointer-events-none">
                {soundEnabled ? 'Chime Enabled' : 'Chime Muted'}
              </span>
            </button>

            <button
              type="button"
              data-no-drag="true"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setIsExpanded(false)}
              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
