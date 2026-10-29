import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  Sparkles, 
  Check, 
  Play, 
  Square, 
  CheckCircle2, 
  Sliders, 
  Users, 
  X, 
  VolumeX, 
  Zap, 
  Clock,
  Sparkle,
  Gauge
} from 'lucide-react';
import { 
  VoiceService, 
  VoiceStatus, 
  ElevenLabsVoice, 
  VoiceEngine,
  SpeechSharpness,
  CURATED_FREE_VOICES
} from '../services/voiceService';

interface ElevenLabsVoiceSelectorProps {
  onClose?: () => void;
}

export const ElevenLabsVoiceSelector: React.FC<ElevenLabsVoiceSelectorProps> = ({ onClose }) => {
  const [engine, setEngineState] = useState<VoiceEngine>(VoiceService.getVoiceEngine());
  const [status, setStatus] = useState<VoiceStatus | null>(null);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(VoiceService.getSelectedVoiceId() || 'free_nora_sharp');
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Audio Tuning & Sharpness State
  const [sharpness, setSharpnessState] = useState<SpeechSharpness>(VoiceService.getSpeechSharpness());
  const [speechRate, setSpeechRateState] = useState<number>(VoiceService.getSpeechRate());
  const [speechPitch, setSpeechPitchState] = useState<number>(VoiceService.getSpeechPitch());
  const [autoRead, setAutoReadState] = useState<boolean>(VoiceService.isAutoReadEnabled());

  useEffect(() => {
    loadVoiceData();
  }, []);

  const loadVoiceData = async () => {
    const st = await VoiceService.getVoiceStatus();
    setStatus(st);
    setEngineState(VoiceService.getVoiceEngine());
    setSelectedVoiceId(VoiceService.getSelectedVoiceId());
    setSharpnessState(VoiceService.getSpeechSharpness());
    setSpeechRateState(VoiceService.getSpeechRate());
    setSpeechPitchState(VoiceService.getSpeechPitch());
    setAutoReadState(VoiceService.isAutoReadEnabled());
  };

  const handlePreview = async (voiceKey: string, sampleText: string) => {
    VoiceService.unlockMobileAudio();

    if (previewingVoiceId === voiceKey) {
      VoiceService.stop();
      setPreviewingVoiceId(null);
      return;
    }

    setPreviewingVoiceId(voiceKey);

    try {
      await VoiceService.speak({
        text: sampleText,
        voiceId: voiceKey,
        onStart: () => {
          setPreviewingVoiceId(voiceKey);
        },
        onEnd: () => {
          setPreviewingVoiceId(null);
        },
        onError: () => {
          setPreviewingVoiceId(null);
        }
      });
    } catch {
      setPreviewingVoiceId(null);
    }
  };

  const handleStopAudio = () => {
    VoiceService.stop();
    setPreviewingVoiceId(null);
  };

  const handleSelectVoice = (voiceId: string) => {
    setSelectedVoiceId(voiceId);
    setEngineState('free');
    VoiceService.setVoiceEngine('free');
    VoiceService.setSelectedVoiceId(voiceId);
    VoiceService.setSelectedSystemVoiceURI('');

    const profile = CURATED_FREE_VOICES.find(v => v.id === voiceId);
    if (profile) {
      setSpeechRateState(profile.recommendedRate);
      setSpeechPitchState(profile.recommendedPitch);
    }
  };

  const handleSaveSettings = () => {
    VoiceService.setVoiceEngine('free');
    VoiceService.setSelectedVoiceId(selectedVoiceId);
    VoiceService.setSelectedSystemVoiceURI('');
    VoiceService.setSpeechSharpness(sharpness);
    VoiceService.setSpeechRate(speechRate);
    VoiceService.setSpeechPitch(speechPitch);
    VoiceService.setAutoReadEnabled(autoRead);

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      if (onClose) onClose();
    }, 1000);
  };

  const activeVoiceName = (() => {
    const freeProfile = CURATED_FREE_VOICES.find((v) => v.id === selectedVoiceId);
    if (freeProfile) return freeProfile.name;
    return 'Nora';
  })();

  const elevenLabsVoice = status?.voices?.[0] || {
    voiceId: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Nora (ElevenLabs Neural)',
    tagline: 'Ultra-Lifelike Socratic Voice',
    description: 'Custom neural studio voice model tailored for Nora with expressive inflections and human cadence.',
    gender: 'female' as const,
    sampleText: "Hello! I am Nora with ElevenLabs neural studio synthesis. Clear, adaptive tutoring is coming soon.",
    isComingSoon: true,
    badge: 'Coming Soon'
  };

  return (
    <div className="flex flex-col h-full max-h-[85vh] sm:max-h-[80vh] text-slate-800 dark:text-slate-100 font-sans select-none overflow-hidden bg-white dark:bg-slate-900">
      {/* Mobile drag handle */}
      <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto my-1.5 sm:hidden shrink-0" />

      {/* Header Bar */}
      <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Volume2 className="w-5 h-5 text-blue-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 font-serif leading-none">
                Nora Voice Studio
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                5 Curated Personas
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Select from our 5 top study voices, tuned for crystal-clear enunciation and learning retention
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close voice settings"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Toast Banner for Saved Settings */}
      {savedSuccess && (
        <div className="mx-4 sm:mx-6 mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 animate-fade-in shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-semibold">Voice preference updated and active for all tutoring sessions!</span>
        </div>
      )}

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4 space-y-4 min-h-0 overscroll-contain">
        
        {/* ================= 1. ELEVENLABS NORA VOICE (COMING SOON) ================= */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 text-white shadow-md relative overflow-hidden border border-violet-800/40">
          {/* Subtle glow decoration */}
          <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-violet-500/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 left-16 w-28 h-28 rounded-full bg-blue-500/15 blur-xl pointer-events-none" />

          <div className="relative z-10 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-violet-500/30 border border-violet-400/40 flex items-center justify-center text-violet-200">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white font-serif">
                      ElevenLabs Studio Voice
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-black uppercase tracking-wider">
                      <Clock className="w-3 h-3" />
                      Coming Soon
                    </span>
                  </div>
                  <span className="text-[11px] text-violet-200/90 font-medium">
                    {elevenLabsVoice.name} · {elevenLabsVoice.tagline}
                  </span>
                </div>
              </div>

              {/* Sample Preview Button */}
              <button
                type="button"
                onClick={() => handlePreview('EXAVITQu4vr4xnSDxMaL', elevenLabsVoice.sampleText || "Hello! I am Nora with ElevenLabs neural studio synthesis. Clear, adaptive tutoring is coming soon.")}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
              >
                {previewingVoiceId === 'EXAVITQu4vr4xnSDxMaL' ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current text-rose-400" />
                    <span>Stop Preview</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current text-amber-300" />
                    <span>Preview Voice</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-violet-100/80 leading-relaxed max-w-xl">
              Our custom ElevenLabs neural voice model brings human-level intonation, emotional warmth, and cinematic clarity to Nora. Launching soon with Academic Pro! In the meantime, enjoy all 5 complimentary high-clarity voices below.
            </p>
          </div>
        </div>

        {/* ================= 2. THE 5 PERFECT CURATED VOICES ================= */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between pb-0.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Choose Your Nora Persona (5 Best Voices)</span>
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Active voice: <strong className="text-blue-700 dark:text-blue-400">{activeVoiceName}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CURATED_FREE_VOICES.map((profile) => {
              const isSelected = selectedVoiceId === profile.id;
              const isPlaying = previewingVoiceId === profile.id;

              const colorTheme = 
                profile.id === 'free_nora_sharp' ? 'from-blue-600 to-indigo-600 text-white' :
                profile.id === 'free_sarah_natural' ? 'from-rose-500 to-amber-500 text-white' :
                profile.id === 'free_alex_scholar' ? 'from-teal-600 to-emerald-700 text-white' :
                profile.id === 'free_adam_deep' ? 'from-slate-700 to-slate-900 text-white' :
                'from-violet-600 to-purple-600 text-white';

              return (
                <div
                  key={profile.id}
                  onClick={() => handleSelectVoice(profile.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-blue-50/90 dark:bg-blue-950/60 border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/25 shadow-xs'
                      : 'bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200/90 dark:border-slate-700 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${colorTheme} flex items-center justify-center font-bold text-sm shrink-0 shadow-xs`}>
                        {profile.name[0]}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100 font-serif leading-none">
                            {profile.name}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 leading-none">
                            {profile.badge}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5 truncate">
                          {profile.tagline}
                        </span>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-600 text-white' 
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {profile.description}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(profile.id, profile.sampleText);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
                        isPlaying
                          ? 'bg-rose-600 text-white shadow-xs'
                          : isSelected
                          ? 'bg-blue-600 text-white shadow-xs hover:bg-blue-700'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {isPlaying ? (
                        <>
                          <Square className="w-3 h-3 fill-current" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          <span>Sample Voice</span>
                        </>
                      )}
                    </button>

                    <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">
                      {isPlaying ? 'Speaking...' : isSelected ? 'Active selection' : 'Tap to select'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= 3. TUNING & SPEED PREFERENCES ================= */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Voice Pacing &amp; Reading Settings</span>
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Current Speed: {speechRate.toFixed(2).replace(/\.00$/, '')}x</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* Speed Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600 dark:text-slate-300 font-medium text-[11px]">Speed:</span>
              {[0.75, 1.0, 1.15, 1.25, 1.5].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => {
                    setSpeechRateState(rate);
                    VoiceService.setSpeechRate(rate);
                  }}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                    speechRate === rate
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            {/* Auto-read Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRead}
                onChange={(e) => {
                  setAutoReadState(e.target.checked);
                  VoiceService.setAutoReadEnabled(e.target.checked);
                }}
                className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 w-4 h-4 bg-white dark:bg-slate-800"
              />
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Auto-read Nora responses</span>
            </label>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="p-3 sm:p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 shadow-lg">
        {/* Selected voice indicator */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
            {activeVoiceName[0] || 'N'}
          </div>
          <div className="truncate">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate">
              {activeVoiceName}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
              Complimentary High-Clarity Engine
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {previewingVoiceId && (
            <button
              type="button"
              onClick={handleStopAudio}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 flex items-center gap-1.5 transition-all"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Stop Audio</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveSettings}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Voice</span>
          </button>
        </div>
      </div>
    </div>
  );
};
