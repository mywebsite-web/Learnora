// Learnora Voice & Speech Service with Free Natural Speech & Optional ElevenLabs

export type VoiceEngine = 'free' | 'elevenlabs';
export type SpeechSharpness = 'ultra-sharp' | 'balanced' | 'deliberate';

export interface FreeVoiceProfile {
  id: string;
  name: string;
  tagline: string;
  description: string;
  gender: 'female' | 'male';
  recommendedPitch: number;
  recommendedRate: number;
  sampleText: string;
  badge: string;
}

export const CURATED_FREE_VOICES: FreeVoiceProfile[] = [
  {
    id: 'free_nora_sharp',
    name: 'Nora',
    tagline: 'Ultra-Sharp AI Mentor',
    description: 'Crisp enunciation, crystal-clear phonetics, and brisk pacing. Optimal for complex subjects and maximum study retention.',
    gender: 'female',
    recommendedPitch: 1.04,
    recommendedRate: 1.12,
    sampleText: "Hello! I'm Nora. Every concept is explained with razor-sharp clarity and step-by-step intuition.",
    badge: 'Default · Ultra Sharp'
  },
  {
    id: 'free_sarah_natural',
    name: 'Sarah',
    tagline: 'Warm & Articulate Teacher',
    description: 'Expressive and conversational with clear articulation. Ideal for biology, history, and literature.',
    gender: 'female',
    recommendedPitch: 1.02,
    recommendedRate: 1.06,
    sampleText: "Hi there! I'm Sarah. Let's make learning engaging, memorable, and crystal clear together.",
    badge: 'Warm & Natural'
  },
  {
    id: 'free_alex_scholar',
    name: 'Alex',
    tagline: 'Academic STEM Scholar',
    description: 'Precise, authoritative, and measured scholarly tone. Excellent for mathematics, physics, and coding.',
    gender: 'male',
    recommendedPitch: 0.98,
    recommendedRate: 1.10,
    sampleText: "Welcome. Let us systematically break down the fundamental principles behind this topic.",
    badge: 'Precise Academic'
  },
  {
    id: 'free_adam_deep',
    name: 'Adam',
    tagline: 'Deep Concept Explainer',
    description: 'Rich, grounded baritone tone. Ideal for deep conceptual explainers, audio lectures, and relaxed revision.',
    gender: 'male',
    recommendedPitch: 0.94,
    recommendedRate: 1.05,
    sampleText: "Greetings. I'm Adam. Sit back as we break down this chapter thoroughly and methodically.",
    badge: 'Deep & Grounded'
  },
  {
    id: 'free_morgan_coach',
    name: 'Morgan',
    tagline: 'Dynamic Study Coach',
    description: 'Upbeat, high-engagement delivery designed for active recall drills and rapid exam revision.',
    gender: 'male',
    recommendedPitch: 1.02,
    recommendedRate: 1.16,
    sampleText: "Hey! Ready for an active study challenge? Let's drill into the key points right now!",
    badge: 'High-Energy Drill'
  }
];

export interface ElevenLabsVoice {
  voiceId: string;
  name: string;
  tagline?: string;
  description: string;
  gender: 'female' | 'male';
  sampleText?: string;
  isComingSoon?: boolean;
  badge?: string;
}

export interface VoiceStatus {
  configured: boolean;
  serverConfigured?: boolean;
  defaultVoiceId: string;
  voices: ElevenLabsVoice[];
}

export interface VoiceValidationResult {
  valid: boolean;
  tier?: string;
  characterCount?: number;
  characterLimit?: number;
  error?: string;
}

export interface ReadableSentence {
  index: number;
  rawText: string;
  cleanText: string;
}

export interface SpeechProgress {
  messageId?: string;
  sentenceIndex: number;
  totalSentences: number;
  currentSentence: string;
  percentage: number;
  isPaused: boolean;
  isSpeaking: boolean;
  speed: number;
}

export interface SpeakOptions {
  text: string;
  messageId?: string;
  startSentenceIndex?: number;
  voiceId?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
  onProgress?: (progress: SpeechProgress) => void;
}

export class VoiceService {
  private static cachedStatus: VoiceStatus | null = null;
  private static currentAudio: HTMLAudioElement | null = null;
  private static selectedVoiceId: string = '21m00Tcm4TlvDq8ikWAM'; // Rachel default
  private static activePlayToken: number = 0;
  private static isSpeakingFallback: boolean = false;
  private static isPausedState: boolean = false;
  private static isSpeakingState: boolean = false;
  private static currentSentenceIndex: number = 0;
  private static currentSentencesList: ReadableSentence[] = [];
  private static currentSpeakParams: SpeakOptions | null = null;
  private static keepAliveInterval: any = null;
  private static voicesList: SpeechSynthesisVoice[] = [];
  private static voicesLoaded: boolean = false;
  private static speedListeners: Set<(speed: number) => void> = new Set();
  private static progressListeners: Set<(progress: SpeechProgress) => void> = new Set();

  static {
    // Pre-cache speech synthesis voices and handle async load in Chromium/Safari
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        try {
          const list = window.speechSynthesis.getVoices();
          if (list && list.length > 0) {
            this.voicesList = list;
            this.voicesLoaded = true;
          }
        } catch {
          // ignore
        }
      };

      updateVoices();
      if (typeof window.speechSynthesis.addEventListener === 'function') {
        window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
      } else {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }
  }

  static getVoiceEngine(): VoiceEngine {
    const saved = localStorage.getItem('learnora_voice_engine');
    // Default to free voice as requested, avoiding credit limits
    return saved === 'elevenlabs' ? 'elevenlabs' : 'free';
  }

  static setVoiceEngine(engine: VoiceEngine) {
    localStorage.setItem('learnora_voice_engine', engine);
    // If active playback, seamlessly restart using newly selected engine
    if (this.isSpeakingState && !this.isPausedState && this.currentSpeakParams) {
      this.speak({
        ...this.currentSpeakParams,
        startSentenceIndex: this.currentSentenceIndex
      });
    }
  }

  static getSpeechSharpness(): SpeechSharpness {
    const saved = localStorage.getItem('learnora_speech_sharpness') as SpeechSharpness;
    return saved === 'balanced' || saved === 'deliberate' ? saved : 'ultra-sharp';
  }

  static setSpeechSharpness(sharpness: SpeechSharpness) {
    localStorage.setItem('learnora_speech_sharpness', sharpness);
    if (this.isSpeakingFallback && this.isSpeakingState && !this.isPausedState && this.currentSpeakParams) {
      this.speak({
        ...this.currentSpeakParams,
        startSentenceIndex: this.currentSentenceIndex
      });
    }
  }

  static getCuratedFreeVoices(): FreeVoiceProfile[] {
    return CURATED_FREE_VOICES;
  }

  static getSelectedVoiceId(): string {
    return localStorage.getItem('learnora_voice_id') || this.selectedVoiceId;
  }

  static setSelectedVoiceId(voiceId: string) {
    this.selectedVoiceId = voiceId;
    localStorage.setItem('learnora_voice_id', voiceId);
  }

  static getSelectedSystemVoiceURI(): string {
    return localStorage.getItem('learnora_system_voice_uri') || '';
  }

  static setSelectedSystemVoiceURI(uri: string) {
    if (uri) {
      localStorage.setItem('learnora_system_voice_uri', uri);
    } else {
      localStorage.removeItem('learnora_system_voice_uri');
    }
  }

  /**
   * Returns available speech synthesis voices sorted with highest-quality natural voices first
   */
  static getAvailableSystemVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
    const list = this.voicesList.length > 0 ? this.voicesList : window.speechSynthesis.getVoices();
    if (!list || list.length === 0) return [];

    return [...list].sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aEn = a.lang.toLowerCase().startsWith('en') ? 100 : 0;
      const bEn = b.lang.toLowerCase().startsWith('en') ? 100 : 0;
      const aNat = (aName.includes('natural') || aName.includes('online') || aName.includes('enhanced') || aName.includes('google') || aName.includes('neural')) ? 50 : 0;
      const bNat = (bName.includes('natural') || bName.includes('online') || bName.includes('enhanced') || bName.includes('google') || bName.includes('neural')) ? 50 : 0;
      return (bEn + bNat) - (aEn + aNat);
    });
  }

  static getUserKeyOverride(): string {
    return localStorage.getItem('learnora_elevenlabs_user_key') || '';
  }

  static setUserKeyOverride(key: string) {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem('learnora_elevenlabs_user_key', trimmed);
    } else {
      localStorage.removeItem('learnora_elevenlabs_user_key');
    }
    this.cachedStatus = null; // Invalidate cache so UI refreshes status
  }

  static getSpeechRate(): number {
    const saved = localStorage.getItem('learnora_voice_rate');
    return saved ? Math.max(0.5, Math.min(2.5, parseFloat(saved))) : 1.1; // 1.1x brisk, natural default
  }

  static setSpeechRate(rate: number) {
    const clamped = Math.max(0.5, Math.min(2.5, rate));
    localStorage.setItem('learnora_voice_rate', clamped.toFixed(2));
    
    // Dynamically apply to active HTMLAudioElement if playing
    if (this.currentAudio) {
      try {
        this.currentAudio.playbackRate = clamped;
      } catch {
        // ignore
      }
    }

    // If WebSpeech is actively speaking, seamlessly restart at current sentence so speed applies instantly
    if (this.isSpeakingFallback && this.isSpeakingState && !this.isPausedState && this.currentSpeakParams) {
      this.speak({
        ...this.currentSpeakParams,
        startSentenceIndex: this.currentSentenceIndex
      });
    }

    // Notify all rate listeners
    this.speedListeners.forEach((listener) => {
      try {
        listener(clamped);
      } catch {
        // ignore
      }
    });
  }

  static onSpeedChange(listener: (speed: number) => void): () => void {
    this.speedListeners.add(listener);
    return () => {
      this.speedListeners.delete(listener);
    };
  }

  static onProgress(listener: (progress: SpeechProgress) => void): () => void {
    this.progressListeners.add(listener);
    return () => {
      this.progressListeners.delete(listener);
    };
  }

  private static emitProgress(progress: SpeechProgress) {
    this.progressListeners.forEach((listener) => {
      try {
        listener(progress);
      } catch {
        // ignore
      }
    });
  }

  static getPlaybackState(): {
    isSpeaking: boolean;
    isPaused: boolean;
    currentSentenceIndex: number;
    totalSentences: number;
    messageId?: string;
    speed: number;
  } {
    return {
      isSpeaking: this.isSpeakingState,
      isPaused: this.isPausedState,
      currentSentenceIndex: this.currentSentenceIndex,
      totalSentences: this.currentSentencesList.length,
      messageId: this.currentSpeakParams?.messageId,
      speed: this.getSpeechRate()
    };
  }

  static isSpeaking(messageId?: string): boolean {
    if (messageId) {
      return this.isSpeakingState && this.currentSpeakParams?.messageId === messageId;
    }
    return this.isSpeakingState;
  }

  static getSpeechPitch(): number {
    const saved = localStorage.getItem('learnora_voice_pitch');
    return saved ? parseFloat(saved) : 1.0;
  }

  static setSpeechPitch(pitch: number) {
    localStorage.setItem('learnora_voice_pitch', pitch.toFixed(2));
  }

  static getSpeechClarity(): 'crisp' | 'natural' | 'soft' {
    const saved = localStorage.getItem('learnora_voice_clarity') as any;
    return saved === 'natural' || saved === 'soft' ? saved : 'crisp';
  }

  static setSpeechClarity(clarity: 'crisp' | 'natural' | 'soft') {
    localStorage.setItem('learnora_voice_clarity', clarity);
    if (this.isSpeakingFallback && this.isSpeakingState && !this.isPausedState && this.currentSpeakParams) {
      this.speak({
        ...this.currentSpeakParams,
        startSentenceIndex: this.currentSentenceIndex
      });
    }
  }

  static isAutoReadEnabled(): boolean {
    const saved = localStorage.getItem('learnora_voice_autoread');
    return saved === null ? true : saved === 'true';
  }

  static setAutoReadEnabled(enabled: boolean) {
    localStorage.setItem('learnora_voice_autoread', enabled ? 'true' : 'false');
  }

  /**
   * Prime audio context on mobile (iOS Safari / Android Chrome) within a user gesture.
   */
  static unlockMobileAudio() {
    if (typeof window === 'undefined') return;

    // Resume speech synthesis if paused (common mobile Safari bug)
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
      } catch {
        // ignore
      }
    }

    // Play a 1-sample silent Web Audio buffer to unlock HTMLAudioElement restrictions
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      }
    } catch {
      // ignore
    }
  }

  /**
   * Validate an ElevenLabs API key via the backend proxy
   */
  static async validateApiKey(apiKey: string): Promise<VoiceValidationResult> {
    const cleanKey = apiKey.trim();
    if (!cleanKey) {
      return { valid: false, error: 'Please enter a valid ElevenLabs API key.' };
    }

    try {
      const res = await fetch('/api/elevenlabs/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: cleanKey })
      });

      if (!res.ok) {
        return { valid: false, error: `Validation request failed (${res.status})` };
      }

      const data = await res.json();
      return data;
    } catch (err: any) {
      return { valid: false, error: err?.message || 'Network error verifying key' };
    }
  }

  /**
   * Fetch configured status and curated voice presets from backend
   */
  static async getVoiceStatus(forceRefresh = false): Promise<VoiceStatus> {
    if (this.cachedStatus && !forceRefresh) return this.cachedStatus;

    try {
      const res = await fetch('/api/elevenlabs/voices');
      if (res.ok) {
        const data = await res.json();
        this.cachedStatus = data;
        if (data.defaultVoiceId && !localStorage.getItem('learnora_voice_id')) {
          this.selectedVoiceId = data.defaultVoiceId;
        }
        return data;
      }
    } catch (e) {
      console.warn('Could not fetch ElevenLabs status:', e);
    }

    const fallback: VoiceStatus = {
      configured: true,
      serverConfigured: true,
      defaultVoiceId: 'EXAVITQu4vr4xnSDxMaL',
      voices: [
        { 
          voiceId: 'EXAVITQu4vr4xnSDxMaL', 
          name: 'Nora (ElevenLabs Neural)', 
          tagline: 'Ultra-Lifelike Socratic Voice',
          description: 'Studio-grade neural voice model tailored for Nora. Coming soon with Academic Pro subscriptions.', 
          gender: 'female',
          sampleText: "Hello! I am Nora with ElevenLabs neural studio synthesis. Clear, adaptive tutoring is coming soon.",
          isComingSoon: true,
          badge: 'Coming Soon'
        }
      ]
    };
    this.cachedStatus = fallback;
    return fallback;
  }

  /**
   * Cleans formatting markdown, expands abbreviations phonetically, and optimizes
   * text for sharp, crisp pronunciation and clear articulation.
   */
  static cleanForSpeech(raw: string): string {
    if (!raw) return '';

    // 1. Normalize line endings and strip spaces before newlines and after newlines
    let text = raw
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+\n/g, '\n') // remove spaces before newlines
      .replace(/\n[ \t]+/g, '\n'); // remove spaces after newlines (before another line or paragraph)

    text = text
      .replace(/```[\s\S]*?```/g, 'Code example omitted.') // summarize code blocks
      .replace(/`([^`]+)`/g, '$1') // remove inline code marks
      .replace(/https?:\/\/[^\s]+/g, 'link') // normalize links
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // remove markdown links
      .replace(/[*#_~>]/g, '') // strip markdown markers
      .replace(/\|/g, ' ') // strip markdown table vertical bars
      .replace(/^[-*•]\s+/gm, '') // strip bullet dashes
      // Strip emojis so TTS engines don't pause or speak emoji unicode names
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      // Expand common math exponents and symbols for crystal clear articulation
      .replace(/(\w|\d)\^2\b|(\w|\d)²/g, '$1 squared')
      .replace(/(\w|\d)\^3\b|(\w|\d)³/g, '$1 cubed')
      .replace(/\s*=\s*/g, ' equals ')
      .replace(/\s*\+\s*/g, ' plus ')
      .replace(/(\d+)\s*-\s*(\d+)/g, '$1 minus $2')
      .replace(/(\w|\d)\s*[×*]\s*(\w|\d)/g, '$1 times $2')
      .replace(/(\w|\d)\s*[÷]\s*(\w|\d)/g, '$1 divided by $2')
      .replace(/\s*±\s*/g, ' plus or minus ')
      .replace(/\s*≈\s*/g, ' is approximately ')
      .replace(/\s*≠\s*/g, ' does not equal ')
      .replace(/\s*≤\s*/g, ' is less than or equal to ')
      .replace(/\s*≥\s*/g, ' is greater than or equal to ')
      .replace(/√(\w+|\d+)/g, 'square root of $1')
      // Fractions
      .replace(/\b1\/2\b/g, 'one half')
      .replace(/\b1\/4\b/g, 'one quarter')
      .replace(/\b3\/4\b/g, 'three quarters')
      .replace(/\b1\/3\b/g, 'one third')
      .replace(/\b2\/3\b/g, 'two thirds')
      // Percentages and Temperatures
      .replace(/(\d+)\s*%\b/g, '$1 percent')
      .replace(/(\d+)\s*°C\b/gi, '$1 degrees Celsius')
      .replace(/(\d+)\s*°F\b/gi, '$1 degrees Fahrenheit')
      .replace(/(\d+)\s*°\b/g, '$1 degrees')
      // Science and Measurement Units
      .replace(/(\d+)\s*cm\b/gi, '$1 centimeters')
      .replace(/(\d+)\s*mm\b/gi, '$1 millimeters')
      .replace(/(\d+)\s*km\b/gi, '$1 kilometers')
      .replace(/(\d+)\s*kg\b/gi, '$1 kilograms')
      .replace(/(\d+)\s*ml\b/gi, '$1 milliliters')
      .replace(/(\d+)\s*mph\b/gi, '$1 miles per hour')
      .replace(/\bpH\b/g, 'P H')
      .replace(/\bCO2\b|\bCO₂\b/g, 'C O 2')
      .replace(/\bH2O\b|\bH₂O\b/g, 'H 2 O')
      .replace(/\bDNA\b/g, 'D.N.A.')
      .replace(/\bRNA\b/g, 'R.N.A.')
      .replace(/\bATP\b/g, 'A.T.P.')
      // Acronyms & letter spacing for crisp, sharp enunciation
      .replace(/\bAI\b/g, 'A.I.')
      .replace(/\bAPI\b/g, 'A.P.I.')
      .replace(/\bHTML\b/g, 'H.T.M.L.')
      .replace(/\bCSS\b/g, 'C.S.S.')
      .replace(/\bSQL\b/g, 'S.Q.L.')
      .replace(/\bCPU\b/g, 'C.P.U.')
      .replace(/\bRAM\b/g, 'R.A.M.')
      .replace(/\bURL\b/g, 'U.R.L.')
      .replace(/\bJSON\b/g, 'J-S-O-N')
      .replace(/\bSTEM\b/g, 'S.T.E.M.')
      .replace(/\bID\b/g, 'I.D.')
      .replace(/\bIQ\b/g, 'I.Q.')
      .replace(/\bPhD\b/g, 'P.h.D.')
      .replace(/\bMIT\b/g, 'M.I.T.')
      // Expand common pedagogical and academic abbreviations cleanly
      .replace(/\be\.g\.,?\s*/gi, 'for example, ')
      .replace(/\bi\.e\.,?\s*/gi, 'that is, ')
      .replace(/\betc\./gi, 'etcetera')
      .replace(/\bvs\.?\s*/gi, 'versus ')
      .replace(/\bw\/\s*/gi, 'with ')
      .replace(/\bw\/o\s*/gi, 'without ');

    // 2. Clean spaces before another line or paragraph
    text = text.replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n');

    // 3. Join lines naturally into fluent spoken text without artificial stops
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    text = lines
      .map((l) => {
        if (/[.!?]$/.test(l)) {
          return l;
        }
        return l + '.';
      })
      .join(' ');

    // 4. Normalize punctuation so speech flows fluidly and normally
    text = text
      .replace(/:\s+/g, ', ')
      .replace(/;\s+/g, ', ')
      .replace(/[—–]|\s--\s/g, ', ')
      .replace(/\(([^)]+)\)/g, ', $1, ')
      .replace(/["""]/g, '')
      .replace(/\.{2,}/g, '.')
      .replace(/!{2,}/g, '!')
      .replace(/\?{2,}/g, '?')
      .replace(/,\s*,+/g, ',')
      .replace(/\s*([.!?])\s*/g, '$1 ')
      .replace(/\s+,/g, ',')
      .replace(/[ \t]+/g, ' ')
      .trim();

    return text;
  }

  /**
   * Intelligently splits a prose line into clean, natural sentence chunks
   * protecting decimals (e.g. 3.14), abbreviations (e.g. etc., Dr., vs.),
   * single initials (e.g. A. Smith), and URLs.
   */
  static splitLineIntoSentences(
    line: string,
    startIndex: number
  ): { sentences: ReadableSentence[]; nextIndex: number } {
    const lTrim = line.trim();
    if (!lTrim) return { sentences: [], nextIndex: startIndex };

    // 1. Protect decimal numbers like 3.14, 0.05, 99.9%
    let protectedText = lTrim.replace(/(\d+)\.(\d+)/g, '$1___DECIMAL___$2');

    // 2. Protect common abbreviations & titles
    protectedText = protectedText.replace(
      /\b(e\.g\.|i\.e\.|etc\.|vs\.|mr\.|mrs\.|ms\.|dr\.|prof\.|no\.|fig\.|vol\.|approx\.|est\.|u\.s\.|u\.k\.|a\.m\.|p\.m\.|jan\.|feb\.|mar\.|apr\.|jun\.|jul\.|aug\.|sep\.|sept\.|oct\.|nov\.|dec\.)/gi,
      (m) => m.replace(/\./g, '___DOT___')
    );

    // 3. Protect single-letter initials like "A. Smith" or "Step B."
    protectedText = protectedText.replace(/\b([A-Za-z])\.\s+/g, '$1___DOT___ ');

    // 4. Protect URLs
    protectedText = protectedText.replace(/(https?:\/\/[^\s]+)/gi, (m) =>
      m.replace(/\./g, '___DOT___')
    );

    // 5. Match natural sentence chunks
    const rawMatches = protectedText.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [protectedText];

    const sentences: ReadableSentence[] = [];
    let currentIndex = startIndex;

    for (const raw of rawMatches) {
      const restored = raw
        .replace(/___DECIMAL___/g, '.')
        .replace(/___DOT___/g, '.')
        .trim();

      if (!restored) continue;
      const clean = this.cleanForSpeech(restored);
      if (!clean) continue;

      sentences.push({
        index: currentIndex++,
        rawText: restored,
        cleanText: clean
      });
    }

    if (sentences.length === 0) {
      const clean = this.cleanForSpeech(lTrim);
      if (clean) {
        sentences.push({
          index: currentIndex++,
          rawText: lTrim,
          cleanText: clean
        });
      }
    }

    return { sentences, nextIndex: currentIndex };
  }

  /**
   * Splits text into structured, addressable readable sentences with clean speech text
   * Always synchronized 100% with parseBlocksWithSentences
   */
  static splitIntoReadableSentences(rawContent: string): ReadableSentence[] {
    if (!rawContent || !rawContent.trim()) return [];
    return this.parseBlocksWithSentences(rawContent).sentences;
  }

  /**
   * Parses markdown blocks while indexing every sentence deterministically
   */
  static parseBlocksWithSentences(rawContent: string): {
    blocks: any[];
    totalSentences: number;
    sentences: ReadableSentence[];
  } {
    if (!rawContent || !rawContent.trim()) {
      return { blocks: [], totalSentences: 0, sentences: [] };
    }

    const text = rawContent.replace(/\r\n/g, '\n');
    const rawBlocks = text.split(/\n\n+/);
    const blocks: any[] = [];
    const allSentences: ReadableSentence[] = [];
    let globalIndex = 0;

    for (const blockStr of rawBlocks) {
      const trimmed = blockStr.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('```') && trimmed.endsWith('```')) {
        const codeLines = trimmed.slice(3, -3).trim().split('\n');
        const sentObj: ReadableSentence = {
          index: globalIndex++,
          rawText: trimmed,
          cleanText: 'Code example omitted for audio.'
        };
        allSentences.push(sentObj);
        blocks.push({
          type: 'code',
          code: codeLines.join('\n'),
          sentence: sentObj
        });
        continue;
      }

      const lines = trimmed.split('\n');
      const elements: any[] = [];

      for (const line of lines) {
        const lTrim = line.trim();
        if (!lTrim) continue;

        if (/^[-*•]\s+/.test(lTrim)) {
          const bulletText = lTrim.replace(/^[-*•]\s+/, '');
          const clean = this.cleanForSpeech(bulletText);
          const sentObj: ReadableSentence = {
            index: globalIndex++,
            rawText: bulletText,
            cleanText: clean
          };
          allSentences.push(sentObj);
          elements.push({
            type: 'bullet',
            sentence: sentObj
          });
        } else if (/^\d+[\.\)]\s+/.test(lTrim)) {
          const match = lTrim.match(/^(\d+)[\.\)]\s+(.*)/);
          const num = match ? match[1] : '1';
          const contentText = match ? match[2] : lTrim;
          const clean = this.cleanForSpeech(contentText);
          const sentObj: ReadableSentence = {
            index: globalIndex++,
            rawText: contentText,
            cleanText: clean
          };
          allSentences.push(sentObj);
          elements.push({
            type: 'numbered',
            number: num,
            sentence: sentObj
          });
        } else {
          const { sentences: lineSentences, nextIndex } = this.splitLineIntoSentences(lTrim, globalIndex);
          globalIndex = nextIndex;
          if (lineSentences.length > 0) {
            allSentences.push(...lineSentences);
            elements.push({
              type: 'prose',
              sentences: lineSentences
            });
          }
        }
      }

      if (elements.length > 0) {
        blocks.push({
          type: 'block',
          elements
        });
      }
    }

    return { blocks, totalSentences: globalIndex, sentences: allSentences };
  }

  /**
   * Splits a long text into natural sentence-sized audio chunks (legacy alias)
   */
  static splitIntoSentences(text: string): string[] {
    const readable = this.splitIntoReadableSentences(text);
    return readable.map((s) => s.cleanText);
  }

  /**
   * Generate and play speech continuously and naturally without stopping between sentences
   */
  static async speak(
    params: SpeakOptions
  ): Promise<{ provider: 'elevenlabs' | 'webspeech'; audioUrl?: string }> {
    this.stop();
    this.unlockMobileAudio();

    const cleanText = this.cleanForSpeech(params.text);
    if (!cleanText) {
      params.onEnd?.();
      return { provider: 'webspeech' };
    }

    const token = ++this.activePlayToken;
    const targetVoiceId = params.voiceId || this.getSelectedVoiceId();

    this.currentSpeakParams = params;
    this.isSpeakingState = true;
    this.isPausedState = false;

    // Check if ElevenLabs engine is explicitly requested
    const engine = this.getVoiceEngine();

    // Attempt ElevenLabs server-side TTS if explicitly selected
    if (engine === 'elevenlabs') {
      try {
        const res = await fetch('/api/elevenlabs/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: cleanText,
            voiceId: targetVoiceId
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.audioUrl && this.activePlayToken === token) {
            const audio = new Audio(data.audioUrl);
            this.currentAudio = audio;
            audio.playbackRate = this.getSpeechRate();

            audio.onplay = () => {
              if (this.activePlayToken === token) {
                this.isSpeakingState = true;
                this.isPausedState = false;
                params.onStart?.();
              }
            };

            audio.onended = () => {
              if (this.activePlayToken === token) {
                this.isSpeakingState = false;
                this.isPausedState = false;
                this.currentAudio = null;
                params.onEnd?.();
              }
            };

            audio.onerror = () => {
              if (this.activePlayToken === token) {
                this.playWebSpeechNormally(
                  cleanText,
                  token,
                  targetVoiceId,
                  params.onStart,
                  params.onEnd
                );
              }
            };

            await audio.play();
            return { provider: 'elevenlabs', audioUrl: data.audioUrl };
          }
        }
      } catch (err) {
        console.warn('ElevenLabs TTS fallback to neural speech:', err);
      }
    }

    // High fidelity neural Web Speech: Continuous, normal, fluent reading without stopping between sentences!
    if (this.activePlayToken === token) {
      this.playWebSpeechNormally(
        cleanText,
        token,
        targetVoiceId,
        params.onStart,
        params.onEnd
      );
    }

    return { provider: 'webspeech' };
  }

  /**
   * Pause speech reading while preserving exact sentence location
   */
  static pause() {
    this.isPausedState = true;
    this.isSpeakingState = false;

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
      } catch {
        // ignore
      }
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }

    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }

    const currentSentence = this.currentSentencesList[this.currentSentenceIndex];
    const progress: SpeechProgress = {
      messageId: this.currentSpeakParams?.messageId,
      sentenceIndex: this.currentSentenceIndex,
      totalSentences: this.currentSentencesList.length,
      currentSentence: currentSentence?.rawText || '',
      percentage: Math.min(
        100,
        Math.round(((this.currentSentenceIndex + 1) / (this.currentSentencesList.length || 1)) * 100)
      ),
      isPaused: true,
      isSpeaking: false,
      speed: this.getSpeechRate()
    };

    this.currentSpeakParams?.onProgress?.(progress);
    this.emitProgress(progress);
  }

  /**
   * Resume speech reading seamlessly from the paused sentence
   */
  static resume() {
    if (!this.isPausedState && !this.currentSpeakParams) return;

    if (this.currentAudio && this.currentAudio.paused) {
      this.isPausedState = false;
      this.isSpeakingState = true;
      this.currentAudio.play().catch(() => {});
      return;
    }

    if (this.currentSpeakParams && this.currentSentencesList.length > 0) {
      this.speak({
        ...this.currentSpeakParams,
        startSentenceIndex: this.currentSentenceIndex
      });
    }
  }

  /**
   * Jump immediately to a specific sentence index in the current text
   */
  static jumpToSentence(sentenceIndex: number) {
    if (!this.currentSpeakParams || this.currentSentencesList.length === 0) return;
    const clamped = Math.max(0, Math.min(sentenceIndex, this.currentSentencesList.length - 1));
    this.speak({
      ...this.currentSpeakParams,
      startSentenceIndex: clamped
    });
  }

  /**
   * Stop all active voice audio immediately and reset state
   */
  static stop() {
    this.activePlayToken++;
    this.isSpeakingFallback = false;
    this.isSpeakingState = false;
    this.isPausedState = false;

    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {
        // ignore
      }
      this.currentAudio = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }

    if (typeof window !== 'undefined') {
      (window as any).__learnora_utterances = [];
    }

    if (this.currentSpeakParams) {
      const progress: SpeechProgress = {
        messageId: this.currentSpeakParams?.messageId,
        sentenceIndex: -1,
        totalSentences: this.currentSentencesList.length,
        currentSentence: '',
        percentage: 0,
        isPaused: false,
        isSpeaking: false,
        speed: this.getSpeechRate()
      };
      this.currentSpeakParams.onProgress?.(progress);
      this.emitProgress(progress);
    }
  }

  /**
   * Finds the best voice on the user's OS matching Nora's character and gender,
   * checking explicit user system voice preference first and prioritizing Natural/Neural/Google voices.
   */
  private static findBestVoiceForCharacter(voiceId: string): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

    const voices = this.voicesList.length > 0 ? this.voicesList : window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // 0. Explicit user system voice selection override
    const userVoiceURI = this.getSelectedSystemVoiceURI();
    if (userVoiceURI) {
      const explicitMatch = voices.find((v) => v.voiceURI === userVoiceURI || v.name === userVoiceURI);
      if (explicitMatch) return explicitMatch;
    }

    // Check if voiceId itself is a voice URI
    const directUriMatch = voices.find((v) => v.voiceURI === voiceId || v.name === voiceId);
    if (directUriMatch) return directUriMatch;

    const isFemale =
      voiceId === 'free_nora_sharp' ||
      voiceId === 'free_sarah_natural' ||
      voiceId === '21m00Tcm4TlvDq8ikWAM' ||
      voiceId === 'EXAVITQu4vr4xnSDxMaL' ||
      voiceId === 'AZnzlk1XvdvUeBnXmlld';

    // Premium high-fidelity modern speech keywords
    const premiumKeywords = [
      'natural',
      'neural',
      'online',
      'enhanced',
      'google',
      'siri',
      'jenny',
      'aria',
      'ava',
      'samantha',
      'guy',
      'daniel',
      'andrew',
      'ryan'
    ];

    const femaleKeywords = [
      'jenny',
      'aria',
      'samantha',
      'karen',
      'victoria',
      'ava',
      'moira',
      'zira',
      'female',
      'fiona',
      'zoe',
      'stephanie'
    ];
    const maleKeywords = [
      'guy',
      'daniel',
      'andrew',
      'alex',
      'david',
      'oliver',
      'george',
      'male',
      'fred',
      'ryan'
    ];
    const targetKeywords = isFemale ? femaleKeywords : maleKeywords;

    // 1. Natural / Enhanced / Online neural voices of target gender (Crystal clear, sharpest delivery)
    const topNatural = voices.find((v) => {
      const name = v.name.toLowerCase();
      const isEnglish = v.lang.toLowerCase().startsWith('en');
      const isPremium = premiumKeywords.some((kw) => name.includes(kw));
      const matchesGender = targetKeywords.some((kw) => name.includes(kw));
      return isEnglish && isPremium && matchesGender;
    });
    if (topNatural) return topNatural;

    // 2. High-quality natural English voice in general (e.g. Google US English, Microsoft Natural, Apple Enhanced)
    const premiumGeneral = voices.find((v) => {
      const name = v.name.toLowerCase();
      const isEnglish = v.lang.toLowerCase().startsWith('en');
      return isEnglish && (name.includes('natural') || name.includes('online') || name.includes('google us english') || name.includes('enhanced') || name.includes('samantha'));
    });
    if (premiumGeneral) return premiumGeneral;

    // 3. Any voice matching gender keywords in English
    for (const kw of targetKeywords) {
      const match = voices.find(
        (v) => v.lang.toLowerCase().startsWith('en') && v.name.toLowerCase().includes(kw)
      );
      if (match) return match;
    }

    // 4. Any English voice
    const englishVoice = voices.find((v) => v.lang.toLowerCase().startsWith('en'));
    if (englishVoice) return englishVoice;

    return voices[0] || null;
  }

  /**
   * Calculates tailored pitch & rate adjustments per character persona and sharpness mode
   */
  private static getCharacterAudioModulations(voiceId: string) {
    const baseRate = this.getSpeechRate();
    const basePitch = this.getSpeechPitch();
    const sharpness = this.getSpeechSharpness();

    // Sharpness modifiers:
    // 'ultra-sharp': 1.08x rate and +0.03 pitch lift for punchy, crisp articulation
    // 'balanced': 1.0x baseline
    // 'deliberate': 0.92x rate for complex problem solving
    const sharpnessRateFactor = sharpness === 'ultra-sharp' ? 1.08 : sharpness === 'deliberate' ? 0.92 : 1.0;
    const sharpnessPitchFactor = sharpness === 'ultra-sharp' ? 1.03 : sharpness === 'deliberate' ? 0.98 : 1.0;

    let charMod = { rate: baseRate, pitch: basePitch };

    switch (voiceId) {
      case 'free_nora_sharp':
        charMod = { rate: baseRate * 1.04, pitch: basePitch * 1.03 };
        break;
      case 'free_sarah_natural':
        charMod = { rate: baseRate * 1.0, pitch: basePitch * 1.02 };
        break;
      case 'free_alex_scholar':
        charMod = { rate: baseRate * 1.02, pitch: basePitch * 0.98 };
        break;
      case 'free_morgan_coach':
        charMod = { rate: baseRate * 1.10, pitch: basePitch * 1.02 };
        break;
      case 'free_adam_deep':
        charMod = { rate: baseRate * 0.98, pitch: basePitch * 0.94 };
        break;
      case '21m00Tcm4TlvDq8ikWAM': // Rachel
        charMod = { rate: baseRate * 1.0, pitch: basePitch * 1.02 };
        break;
      case 'EXAVITQu4vr4xnSDxMaL': // Sarah
        charMod = { rate: baseRate * 1.02, pitch: basePitch * 1.05 };
        break;
      case 'AZnzlk1XvdvUeBnXmlld': // Domi
        charMod = { rate: baseRate * 1.1, pitch: basePitch * 1.06 };
        break;
      case 'ErXwobaYiN019PkySvjV': // Antoni
        charMod = { rate: baseRate * 1.0, pitch: basePitch * 0.98 };
        break;
      case 'pNInz6obpgDQGcFmaJgB': // Adam
        charMod = { rate: baseRate * 1.0, pitch: basePitch * 0.94 };
        break;
      case 'TxGEqnHWrfWFTfGW9XjX': // Josh
        charMod = { rate: baseRate * 1.04, pitch: basePitch * 1.0 };
        break;
      default:
        charMod = { rate: baseRate, pitch: basePitch };
        break;
    }

    return {
      rate: charMod.rate * sharpnessRateFactor,
      pitch: charMod.pitch * sharpnessPitchFactor
    };
  }

  /**
   * Chunks clean text into natural spoken phrases (~120-180 chars) to prevent Chrome's
   * 15-second speech synthesis timeout bug from halting playback in the middle.
   */
  private static chunkTextForWebSpeech(text: string): string[] {
    if (!text) return [];
    if (text.length <= 180) return [text];

    const chunks: string[] = [];
    // Split on sentence boundaries first (. ! ?)
    const sentenceRegex = /[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g;
    const rawSentences = text.match(sentenceRegex) || [text];

    for (const rawSent of rawSentences) {
      const sentence = rawSent.trim();
      if (!sentence) continue;

      if (sentence.length <= 180) {
        chunks.push(sentence);
      } else {
        // If a single sentence is longer than 180 chars, split on clauses (, ; : -)
        const clauseParts = sentence.split(/([,;:—]\s+)/);
        let cur = '';
        for (let i = 0; i < clauseParts.length; i++) {
          const part = clauseParts[i];
          if ((cur + part).length > 180 && cur.length > 0) {
            chunks.push(cur.trim());
            cur = part;
          } else {
            cur += part;
          }
        }
        if (cur.trim()) {
          // If a remaining part is still > 180 chars, split on words
          if (cur.trim().length > 180) {
            const words = cur.trim().split(' ');
            let wordChunk = '';
            for (const w of words) {
              if ((wordChunk + ' ' + w).length > 160 && wordChunk.length > 0) {
                chunks.push(wordChunk.trim());
                wordChunk = w;
              } else {
                wordChunk = wordChunk ? wordChunk + ' ' + w : w;
              }
            }
            if (wordChunk.trim()) chunks.push(wordChunk.trim());
          } else {
            chunks.push(cur.trim());
          }
        }
      }
    }

    return chunks.filter((c) => c.length > 0);
  }

  /**
   * Continuous, natural Web Speech reading without stopping or getting cut off!
   */
  private static playWebSpeechNormally(
    cleanText: string,
    token: number,
    voiceId: string,
    onStart?: () => void,
    onEnd?: () => void
  ) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    } catch {
      // ignore
    }

    this.isSpeakingFallback = true;
    this.isSpeakingState = true;
    this.isPausedState = false;

    (window as any).__learnora_utterances = (window as any).__learnora_utterances || [];

    // Keep alive interval to prevent browser synthesis from timing out on longer speeches
    if (this.keepAliveInterval) clearInterval(this.keepAliveInterval);
    this.keepAliveInterval = setInterval(() => {
      if (this.isSpeakingFallback && 'speechSynthesis' in window) {
        try {
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          }
        } catch {
          // ignore
        }
      } else {
        clearInterval(this.keepAliveInterval);
        this.keepAliveInterval = null;
      }
    }, 3500);

    const voice = this.findBestVoiceForCharacter(voiceId);
    const modulations = this.getCharacterAudioModulations(voiceId);

    // Chunk text so Chrome never hits the 15-second speech freeze limit
    const chunks = this.chunkTextForWebSpeech(cleanText);
    if (chunks.length === 0) {
      chunks.push(cleanText);
    }

    let chunkIdx = 0;

    // Emit initial progress
    const progressStart: SpeechProgress = {
      messageId: this.currentSpeakParams?.messageId,
      sentenceIndex: 0,
      totalSentences: chunks.length,
      currentSentence: cleanText.slice(0, 100),
      percentage: 0,
      isPaused: false,
      isSpeaking: true,
      speed: this.getSpeechRate()
    };
    this.currentSpeakParams?.onProgress?.(progressStart);
    this.emitProgress(progressStart);

    const playNext = () => {
      if (this.activePlayToken !== token || !this.isSpeakingFallback) {
        return;
      }
      if (chunkIdx >= chunks.length) {
        this.isSpeakingFallback = false;
        this.isSpeakingState = false;
        this.isPausedState = false;
        if (this.keepAliveInterval) {
          clearInterval(this.keepAliveInterval);
          this.keepAliveInterval = null;
        }
        (window as any).__learnora_utterances = [];

        const progressEnd: SpeechProgress = {
          messageId: this.currentSpeakParams?.messageId,
          sentenceIndex: chunks.length,
          totalSentences: chunks.length,
          currentSentence: '',
          percentage: 100,
          isPaused: false,
          isSpeaking: false,
          speed: this.getSpeechRate()
        };
        this.currentSpeakParams?.onProgress?.(progressEnd);
        this.emitProgress(progressEnd);

        onEnd?.();
        return;
      }

      const textChunk = chunks[chunkIdx];
      const utterance = new SpeechSynthesisUtterance(textChunk);
      (window as any).__learnora_utterances.push(utterance);

      if (voice) utterance.voice = voice;
      utterance.rate = Math.max(0.7, Math.min(2.0, modulations.rate * this.getSpeechRate()));
      utterance.pitch = Math.max(0.6, Math.min(1.5, modulations.pitch));

      utterance.onstart = () => {
        if (this.activePlayToken !== token) return;
        if (chunkIdx === 0) {
          onStart?.();
        }
      };

      utterance.onend = () => {
        if (this.activePlayToken !== token) return;
        chunkIdx++;
        playNext();
      };

      utterance.onerror = () => {
        if (this.activePlayToken !== token) return;
        chunkIdx++;
        playNext();
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis call notice:', err);
        chunkIdx++;
        playNext();
      }
    };

    playNext();
  }
}
