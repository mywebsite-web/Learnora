import confetti from 'canvas-confetti';

export type MilestoneType = 
  | '7-day-streak'
  | 'streak-milestone'
  | 'weekly-goal-met'
  | 'study-century'
  | 'spaced-repetition-master'
  | 'quiz-ace';

export interface MilestoneInfo {
  id: string;
  type: MilestoneType;
  title: string;
  description: string;
  badge: string;
  rewardXP: number;
  unlockedAt: number;
}

export class ConfettiService {
  /**
   * Plays a celebratory victory fanfare sound using Web Audio API synthesis
   */
  static playCelebrationChime(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      // Arpeggio chords: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
      const notes = [
        { freq: 523.25, time: now, dur: 0.18, vol: 0.08 },
        { freq: 659.25, time: now + 0.10, dur: 0.20, vol: 0.10 },
        { freq: 783.99, time: now + 0.20, dur: 0.24, vol: 0.12 },
        { freq: 1046.50, time: now + 0.32, dur: 0.65, vol: 0.16 },
        { freq: 1318.51, time: now + 0.44, dur: 0.80, vol: 0.14 } // High E6 sparkle
      ];

      notes.forEach(({ freq, time, dur, vol }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + dur);
      });
    } catch (e) {
      console.warn('Celebration audio notice:', e);
    }
  }

  /**
   * Fires a grand two-sided confetti cannon burst (e.g. for hitting a 7-day streak)
   */
  static fireGrandCannons(): void {
    try {
      this.playCelebrationChime();

      // Left cannon
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 70,
        origin: { x: 0.1, y: 0.75 },
        colors: ['#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#10B981', '#EC4899'],
        ticks: 280,
        gravity: 1.1,
        scalar: 1.15
      });

      // Right cannon
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 70,
        origin: { x: 0.9, y: 0.75 },
        colors: ['#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#10B981', '#EC4899'],
        ticks: 280,
        gravity: 1.1,
        scalar: 1.15
      });

      // Center golden starburst after 250ms
      setTimeout(() => {
        confetti({
          particleCount: 60,
          spread: 100,
          origin: { x: 0.5, y: 0.55 },
          colors: ['#FFD700', '#FFA500', '#F59E0B', '#FFFFFF'],
          shapes: ['circle', 'square'],
          ticks: 220,
          scalar: 1.25,
          gravity: 0.9
        });
      }, 250);
    } catch (e) {
      console.warn('Confetti cannon error:', e);
    }
  }

  /**
   * Fires a continuous multi-burst fireworks show for monumental milestones
   */
  static fireMilestoneFireworks(durationMs = 2400): void {
    try {
      this.playCelebrationChime();

      const animationEnd = Date.now() + durationMs;
      const defaults = { startVelocity: 30, spread: 360, ticks: 120, zIndex: 100000 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / durationMs);

        // Burst 1: Random top left
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.15, 0.4), y: Math.random() - 0.2 },
          colors: ['#F59E0B', '#3B82F6', '#10B981', '#FFD700']
        });

        // Burst 2: Random top right
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.6, 0.85), y: Math.random() - 0.2 },
          colors: ['#EF4444', '#8B5CF6', '#EC4899', '#FFD700']
        });
      }, 350);
    } catch (e) {
      console.warn('Confetti fireworks error:', e);
    }
  }

  /**
   * Fires a snappy targeted particle pop (e.g. for button actions, quick logs, mini milestones)
   */
  static fireParticlePop(elementOrCenter?: { x: number; y: number }): void {
    try {
      const origin = elementOrCenter || { x: 0.5, y: 0.6 };
      confetti({
        particleCount: 45,
        spread: 60,
        origin,
        colors: ['#3B82F6', '#6366F1', '#F59E0B', '#10B981'],
        ticks: 160,
        gravity: 1.2
      });
    } catch (e) {
      console.warn('Particle pop error:', e);
    }
  }

  /**
   * Fires cascading stars and colorful particle shower for milestone achievements
   */
  static fireRainbowStars(): void {
    try {
      this.playCelebrationChime();
      confetti({
        particleCount: 90,
        spread: 100,
        startVelocity: 40,
        origin: { x: 0.5, y: 0.35 },
        colors: ['#FFD700', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#EC4899', '#EF4444'],
        shapes: ['circle', 'square'],
        ticks: 280,
        gravity: 0.95,
        scalar: 1.2
      });
    } catch (e) {
      console.warn('Rainbow stars error:', e);
    }
  }

  /**
   * Checks whether the user has unlocked the 7-day streak milestone today
   */
  static isStreakMilestoneCelebrated(userId: string, streakDays: number): boolean {
    if (!userId || streakDays < 7) return true;
    try {
      const key = `learnora_celebrated_streak_${userId}_${Math.floor(streakDays / 7) * 7}`;
      return localStorage.getItem(key) === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Marks a streak milestone as celebrated
   */
  static markStreakMilestoneCelebrated(userId: string, streakDays: number): void {
    if (!userId) return;
    try {
      const key = `learnora_celebrated_streak_${userId}_${Math.floor(streakDays / 7) * 7}`;
      localStorage.setItem(key, 'true');
    } catch {}
  }
}
