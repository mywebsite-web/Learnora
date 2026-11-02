import { NotificationService } from './notificationService';

export type TimerMode = 'pomodoro' | 'deep' | 'shortBreak' | 'longBreak' | 'stopwatch';

export interface TimerConfig {
  label: string;
  defaultSeconds: number;
  accentColor: string;
  isBreak: boolean;
  desc: string;
}

export const TIMER_CONFIGS: Record<TimerMode, TimerConfig> = {
  pomodoro: {
    label: 'Pomodoro',
    defaultSeconds: 25 * 60,
    accentColor: 'rose',
    isBreak: false,
    desc: '25 min focus sprint'
  },
  deep: {
    label: 'Deep Focus',
    defaultSeconds: 50 * 60,
    accentColor: 'indigo',
    isBreak: false,
    desc: '50 min deep study'
  },
  shortBreak: {
    label: 'Short Break',
    defaultSeconds: 5 * 60,
    accentColor: 'emerald',
    isBreak: true,
    desc: '5 min refresh'
  },
  longBreak: {
    label: 'Long Break',
    defaultSeconds: 15 * 60,
    accentColor: 'teal',
    isBreak: true,
    desc: '15 min rest'
  },
  stopwatch: {
    label: 'Stopwatch',
    defaultSeconds: 0,
    accentColor: 'amber',
    isBreak: false,
    desc: 'Open study count-up'
  }
};

export interface StudyTimerState {
  mode: TimerMode;
  timeLeft: number;
  isRunning: boolean;
  soundEnabled: boolean;
  isWidgetVisible: boolean;
  completedSessions: number;
  activeSubject: string;
}

const STORAGE_KEY_STATE = 'learnora_floating_timer_state';
const STORAGE_KEY_VISIBLE = 'learnora_floating_timer_visible';

type TimerListener = (state: StudyTimerState) => void;

class StudyTimerServiceManager {
  private state: StudyTimerState = {
    mode: 'pomodoro',
    timeLeft: TIMER_CONFIGS.pomodoro.defaultSeconds,
    isRunning: false,
    soundEnabled: true,
    isWidgetVisible: true,
    completedSessions: 0,
    activeSubject: 'General Studies'
  };

  private listeners: Set<TimerListener> = new Set();
  private intervalId: any = null;
  private lastTick: number = Date.now();
  private onLogStudyTimeCallback?: (minutes: number, subject?: string) => Promise<void>;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY_STATE);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.mode && TIMER_CONFIGS[parsed.mode as TimerMode]) {
          this.state.mode = parsed.mode;
        }
        if (typeof parsed.timeLeft === 'number') {
          this.state.timeLeft = parsed.timeLeft;
        }
        if (typeof parsed.completedSessions === 'number') {
          this.state.completedSessions = parsed.completedSessions;
        }
        if (typeof parsed.soundEnabled === 'boolean') {
          this.state.soundEnabled = parsed.soundEnabled;
        }
      }

      const savedVisible = localStorage.getItem(STORAGE_KEY_VISIBLE);
      if (savedVisible !== null) {
        this.state.isWidgetVisible = JSON.parse(savedVisible);
      }
    } catch (e) {
      console.warn('Notice loading study timer state from storage:', e);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify({
        mode: this.state.mode,
        timeLeft: this.state.timeLeft,
        completedSessions: this.state.completedSessions,
        soundEnabled: this.state.soundEnabled
      }));
      localStorage.setItem(STORAGE_KEY_VISIBLE, JSON.stringify(this.state.isWidgetVisible));
    } catch {}
  }

  private notify() {
    this.saveToStorage();
    const snapshot = { ...this.state };
    this.listeners.forEach(fn => {
      try {
        fn(snapshot);
      } catch (e) {
        console.error('Timer listener error:', e);
      }
    });
  }

  public getState(): StudyTimerState {
    return { ...this.state };
  }

  public subscribe(listener: TimerListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => {
      this.listeners.delete(listener);
    };
  }

  public registerStudyTimeLogger(fn: (minutes: number, subject?: string) => Promise<void>) {
    this.onLogStudyTimeCallback = fn;
  }

  public setActiveSubject(subject: string) {
    if (this.state.activeSubject !== subject) {
      this.state.activeSubject = subject;
      this.notify();
    }
  }

  public start() {
    if (this.state.isRunning) return;
    this.state.isRunning = true;
    this.lastTick = Date.now();
    this.startInterval();
    this.notify();
  }

  public pause() {
    if (!this.state.isRunning) return;
    this.state.isRunning = false;
    this.stopInterval();
    this.notify();
  }

  public toggle() {
    if (this.state.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  }

  public reset() {
    this.pause();
    this.state.timeLeft = TIMER_CONFIGS[this.state.mode].defaultSeconds;
    this.notify();
  }

  public setMode(newMode: TimerMode) {
    this.pause();
    this.state.mode = newMode;
    this.state.timeLeft = TIMER_CONFIGS[newMode].defaultSeconds;
    this.notify();
  }

  public adjustMinutes(deltaMin: number) {
    const minSeconds = this.state.mode === 'stopwatch' ? 0 : 60;
    this.state.timeLeft = Math.max(minSeconds, this.state.timeLeft + deltaMin * 60);
    this.notify();
  }

  public toggleWidgetVisible() {
    this.state.isWidgetVisible = !this.state.isWidgetVisible;
    this.notify();
  }

  public setWidgetVisible(visible: boolean) {
    if (this.state.isWidgetVisible !== visible) {
      this.state.isWidgetVisible = visible;
      this.notify();
    }
  }

  public setSoundEnabled(enabled: boolean) {
    if (this.state.soundEnabled !== enabled) {
      this.state.soundEnabled = enabled;
      this.notify();
    }
  }

  private startInterval() {
    this.stopInterval();
    this.lastTick = Date.now();
    this.intervalId = setInterval(() => {
      this.tick();
    }, 250);
  }

  private stopInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick() {
    const now = Date.now();
    const delta = Math.floor((now - this.lastTick) / 1000);

    if (delta >= 1) {
      this.lastTick += delta * 1000;

      if (this.state.mode === 'stopwatch') {
        this.state.timeLeft += delta;
        this.notify();
      } else {
        if (this.state.timeLeft <= delta) {
          this.state.timeLeft = 0;
          this.notify();
          this.handleTimerFinished();
        } else {
          this.state.timeLeft -= delta;
          this.notify();
        }
      }
    }
  }

  private handleTimerFinished() {
    this.pause();

    // 1. Audio chime
    if (this.state.soundEnabled) {
      try {
        NotificationService.playNotificationChime();
      } catch (e) {
        console.warn('Audio chime notice:', e);
      }
    }

    // 2. Mobile haptic vibration
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([200, 100, 200, 100, 300]);
      } catch {}
    }

    const config = TIMER_CONFIGS[this.state.mode];
    const minutesCompleted = Math.round(config.defaultSeconds / 60);

    if (!config.isBreak) {
      // Focus session completed!
      this.state.completedSessions += 1;

      // Auto log study time
      if (minutesCompleted > 0 && this.onLogStudyTimeCallback) {
        this.onLogStudyTimeCallback(minutesCompleted, this.state.activeSubject).catch(() => {});
      }

      // Drop live in-app notification
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('learnora_live_notification_drop', {
          detail: {
            id: `timer_done_${Date.now()}`,
            userId: 'all',
            title: '🎉 Focus Sprint Completed!',
            message: `Awesome dedication! You logged ${minutesCompleted} focus minutes on ${this.state.activeSubject}. Take a 5-minute breather.`,
            type: 'study-reminder',
            read: false,
            createdAt: Date.now(),
            priority: 'high',
            actionUrl: 'weekly-run',
            actionLabel: 'View Weekly Run',
            sender: 'Nora Focus Timer'
          }
        }));
      }

      // Automatically cue short break
      this.state.mode = 'shortBreak';
      this.state.timeLeft = TIMER_CONFIGS.shortBreak.defaultSeconds;
      this.notify();
    } else {
      // Break completed
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('learnora_live_notification_drop', {
          detail: {
            id: `break_done_${Date.now()}`,
            userId: 'all',
            title: '🔔 Break Finished!',
            message: 'Your 5-minute pause is done. Refreshed and ready for your next study sprint?',
            type: 'announcement',
            read: false,
            createdAt: Date.now(),
            priority: 'high',
            actionUrl: 'flashcards',
            actionLabel: 'Resume Study',
            sender: 'Nora Focus Timer'
          }
        }));
      }

      // Switch back to Pomodoro
      this.state.mode = 'pomodoro';
      this.state.timeLeft = TIMER_CONFIGS.pomodoro.defaultSeconds;
      this.notify();
    }
  }

  public formatTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
}

export const StudyTimerService = new StudyTimerServiceManager();
