/**
 * Gemini Multilingual Text-to-Speech Service
 * Powered by native Gemini API (gemini-3.8-flash-tts)
 * Supports English (Nigerian Accent), Yoruba, Igbo, Hausa, and French
 * with dynamic system prompt instructions.
 */

export type SupportedTtsLanguage = 'English' | 'Yoruba' | 'Igbo' | 'Hausa' | 'French';

export interface LanguageOption {
  code: SupportedTtsLanguage;
  label: string;
  nativeLabel: string;
  flag: string;
  accentDescription: string;
}

export const TTS_LANGUAGES: LanguageOption[] = [
  { 
    code: 'English', 
    label: 'English', 
    nativeLabel: 'Nigerian English', 
    flag: '🇳🇬', 
    accentDescription: 'Clear, measured, natural Nigerian English accent' 
  },
  { 
    code: 'Yoruba', 
    label: 'Yoruba', 
    nativeLabel: 'Èdè Yorùbá', 
    flag: '🇳🇬', 
    accentDescription: 'Perfect tonal inflections and native cadence' 
  },
  { 
    code: 'Igbo', 
    label: 'Igbo', 
    nativeLabel: 'Asụsụ Igbo', 
    flag: '🇳🇬', 
    accentDescription: 'Tone-marking inflections and natural flow' 
  },
  { 
    code: 'Hausa', 
    label: 'Hausa', 
    nativeLabel: 'Harshen Hausa', 
    flag: '🇳🇬', 
    accentDescription: 'Standard, clear Hausa phonetics' 
  },
  { 
    code: 'French', 
    label: 'French', 
    nativeLabel: 'Français', 
    flag: '🇫🇷', 
    accentDescription: 'Flawless native French pronunciation' 
  }
];

export interface TtsPlaybackState {
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  language: SupportedTtsLanguage;
  currentTextKey: string | null;
  playbackRate: number;
  error: string | null;
  activeEngine: 'gemini-neural' | 'device-fallback';
}

export type PlaybackListener = (state: TtsPlaybackState) => void;

const getInitialLanguage = (): SupportedTtsLanguage => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('learnora_tts_language');
      if (saved && ['English', 'Yoruba', 'Igbo', 'Hausa', 'French'].includes(saved)) {
        return saved as SupportedTtsLanguage;
      }
    }
  } catch (_) {}
  return 'English';
};

export class GeminiTtsService {
  private static audioCache = new Map<string, string>();
  private static currentAudio: HTMLAudioElement | null = null;
  private static currentTextKey: string | null = null;
  private static currentLanguage: SupportedTtsLanguage = getInitialLanguage();
  private static isPlaying = false;
  private static isLoading = false;
  private static currentTime = 0;
  private static duration = 0;
  private static playbackRate = 1.0;
  private static error: string | null = null;
  private static activeEngine: 'gemini-neural' | 'device-fallback' = 'gemini-neural';
  private static listeners = new Set<PlaybackListener>();
  private static playToken = 0;

  // Simple string hash for cache keying
  private static getCacheKey(text: string, language: SupportedTtsLanguage): string {
    let hash = 0;
    const str = `${language}:::${text.trim()}`;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return `tts_${language}_${hash}`;
  }

  public static getSelectedLanguage(): SupportedTtsLanguage {
    return this.currentLanguage;
  }

  public static getState(): TtsPlaybackState {
    return {
      isPlaying: this.isPlaying,
      isLoading: this.isLoading,
      currentTime: this.currentTime,
      duration: this.duration,
      language: this.currentLanguage,
      currentTextKey: this.currentTextKey,
      playbackRate: this.playbackRate,
      error: this.error,
      activeEngine: this.activeEngine
    };
  }

  public static subscribe(listener: PlaybackListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify() {
    const state = this.getState();
    this.listeners.forEach(fn => {
      try {
        fn(state);
      } catch (e) {
        console.warn('TTS listener error:', e);
      }
    });
  }

  /**
   * Generates or retrieves cached audio bytes from Gemini TTS
   */
  public static async getAudioUrl(text: string, language: SupportedTtsLanguage): Promise<string> {
    const key = this.getCacheKey(text, language);
    if (this.audioCache.has(key)) {
      return this.audioCache.get(key)!;
    }

    const response = await fetch('/api/ai/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        language
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Network error generating audio' }));
      throw new Error(err?.error || `Failed to generate audio (${response.status})`);
    }

    const data = await response.json();
    if (!data.success || !data.audioUrl) {
      throw new Error(data.error || 'No audio returned from Gemini TTS');
    }

    this.audioCache.set(key, data.audioUrl);
    return data.audioUrl;
  }

  /**
   * Plays text aloud in the specified language using gemini-3.8-flash-tts
   */
  public static async speak(params: {
    text: string;
    language?: SupportedTtsLanguage;
    textKey?: string;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }): Promise<void> {
    const targetLang = params.language || this.currentLanguage || 'English';
    const textKey = params.textKey || params.text.slice(0, 40);

    // If currently playing the exact same text and language, toggle pause/play
    if (this.currentAudio && this.currentTextKey === textKey && this.currentLanguage === targetLang) {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.resume();
      }
      return;
    }

    // Stop existing audio
    this.stop();

    const token = ++this.playToken;
    this.isLoading = true;
    this.currentLanguage = targetLang;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('learnora_tts_language', targetLang);
      }
    } catch (_) {}
    this.currentTextKey = textKey;
    this.error = null;
    this.currentTime = 0;
    this.duration = 0;
    this.notify();

    try {
      const audioUrl = await this.getAudioUrl(params.text, targetLang);

      // Check if another request took over
      if (token !== this.playToken) return;

      const audio = new Audio(audioUrl);
      this.currentAudio = audio;
      audio.playbackRate = this.playbackRate;

      audio.onloadedmetadata = () => {
        if (token !== this.playToken) return;
        this.duration = audio.duration || 0;
        this.notify();
      };

      audio.ontimeupdate = () => {
        if (token !== this.playToken) return;
        this.currentTime = audio.currentTime || 0;
        this.notify();
      };

      audio.onended = () => {
        if (token !== this.playToken) return;
        this.isPlaying = false;
        this.currentTime = 0;
        this.notify();
        params.onEnd?.();
      };

      audio.onerror = (e) => {
        if (token !== this.playToken) return;
        console.error('Audio playback error:', e);
        this.isPlaying = false;
        this.isLoading = false;
        this.error = 'Failed to play audio bytes';
        this.notify();
        params.onError?.(e);
      };

      await audio.play();
      if (token !== this.playToken) {
        audio.pause();
        return;
      }

      this.activeEngine = 'gemini-neural';
      this.isLoading = false;
      this.isPlaying = true;
      this.notify();
    } catch (err: any) {
      if (token !== this.playToken) return;
      console.info('Gemini TTS network/quota notice, falling back to Web Speech:', err?.message || err);

      // Graceful fallback to browser speech synthesis
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          this.speakViaWebSpeech(params.text, targetLang, token, params);
          return;
        } catch (synthErr) {
          console.warn('Browser speech synthesis fallback notice:', synthErr);
        }
      }

      this.isLoading = false;
      this.isPlaying = false;
      this.error = err?.message || 'Error generating TTS audio';
      this.notify();
      params.onError?.(err);
    }
  }

  private static speakViaWebSpeech(
    text: string, 
    lang: SupportedTtsLanguage, 
    token: number, 
    params: { onEnd?: () => void; onError?: (err: any) => void }
  ) {
    window.speechSynthesis.cancel();
    this.activeEngine = 'device-fallback';

    const cleanText = text
      .replace(/\[(?:📄\s*|page\s*|p\.\s*)?\d+\]/gi, '')
      .replace(/\[\d+\]/g, '')
      .replace(/[*#_`~>|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const langCodes: Record<SupportedTtsLanguage, string> = {
      English: 'en-NG',
      Yoruba: 'yo-NG',
      Igbo: 'ig-NG',
      Hausa: 'ha-NG',
      French: 'fr-FR'
    };

    const targetCode = langCodes[lang] || 'en-NG';
    utterance.lang = targetCode;
    utterance.rate = Math.max(0.85, Math.min(1.15, this.playbackRate * 0.95));
    utterance.pitch = 1.0;

    // Pick best matching or natural voice available on device
    try {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const bestVoice = voices.find(v => v.lang.toLowerCase() === targetCode.toLowerCase())
          || voices.find(v => v.lang.toLowerCase().startsWith(targetCode.slice(0, 2).toLowerCase()))
          || voices.find(v => /nigeria|natural|google|enhanced|premium|samantha|arthur/i.test(v.name))
          || voices[0];
        if (bestVoice) utterance.voice = bestVoice;
      }
    } catch (_) {}

    utterance.onstart = () => {
      if (token !== this.playToken) {
        window.speechSynthesis.cancel();
        return;
      }
      this.isLoading = false;
      this.isPlaying = true;
      this.duration = Math.max(10, Math.round(cleanText.split(' ').length / 2.5));
      this.notify();
    };

    utterance.onend = () => {
      if (token !== this.playToken) return;
      this.isPlaying = false;
      this.currentTime = 0;
      this.notify();
      params.onEnd?.();
    };

    utterance.onerror = (e) => {
      if (token !== this.playToken) return;
      this.isPlaying = false;
      this.isLoading = false;
      this.notify();
      params.onError?.(e);
    };

    window.speechSynthesis.speak(utterance);
  }

  public static pause() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
    if (this.currentAudio && this.isPlaying) {
      this.currentAudio.pause();
      this.isPlaying = false;
      this.notify();
    }
  }

  public static resume() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      this.isPlaying = true;
      this.notify();
      return;
    }
    if (this.currentAudio && !this.isPlaying) {
      this.currentAudio.play().then(() => {
        this.isPlaying = true;
        this.notify();
      }).catch(err => {
        console.error('Error resuming audio:', err);
      });
    }
  }

  public static stop() {
    this.playToken++;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (_) {}
      this.currentAudio = null;
    }
    this.isPlaying = false;
    this.isLoading = false;
    this.currentTime = 0;
    this.notify();
  }

  public static seek(timeInSeconds: number) {
    if (this.currentAudio && this.duration > 0) {
      const clamped = Math.max(0, Math.min(timeInSeconds, this.duration));
      this.currentAudio.currentTime = clamped;
      this.currentTime = clamped;
      this.notify();
    }
  }

  public static setPlaybackRate(rate: number) {
    this.playbackRate = rate;
    if (this.currentAudio) {
      this.currentAudio.playbackRate = rate;
    }
    this.notify();
  }

  public static setLanguage(lang: SupportedTtsLanguage) {
    this.currentLanguage = lang;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('learnora_tts_language', lang);
      }
    } catch (_) {}
    this.notify();
  }
}
