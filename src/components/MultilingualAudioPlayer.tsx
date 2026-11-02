import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  Globe, 
  Loader2, 
  Sparkles,
  Headphones,
  Check,
  CheckCircle2,
  X
} from 'lucide-react';
import { 
  GeminiTtsService, 
  SupportedTtsLanguage, 
  TTS_LANGUAGES, 
  TtsPlaybackState 
} from '../services/geminiTtsService';

interface MultilingualAudioPlayerProps {
  textToRead: string;
  lessonTitle?: string;
  textKey?: string;
  variant?: 'embedded-bar' | 'compact-inline' | 'floating-card';
  initialLanguage?: SupportedTtsLanguage;
  onLanguageChange?: (lang: SupportedTtsLanguage) => void;
  className?: string;
}

export const MultilingualAudioPlayer: React.FC<MultilingualAudioPlayerProps> = ({
  textToRead,
  lessonTitle = 'Lesson',
  textKey,
  variant = 'embedded-bar',
  initialLanguage,
  onLanguageChange,
  className = ''
}) => {
  const [selectedLang, setSelectedLang] = useState<SupportedTtsLanguage>(() => {
    return initialLanguage || GeminiTtsService.getSelectedLanguage() || 'English';
  });
  const [state, setState] = useState<TtsPlaybackState>(GeminiTtsService.getState());
  const [modalOpen, setModalOpen] = useState(false);
  const [justSwitched, setJustSwitched] = useState<SupportedTtsLanguage | null>(null);

  const activeKey = textKey || textToRead.slice(0, 40);
  const isCurrentTextActive = state.currentTextKey === activeKey;

  useEffect(() => {
    const unsubscribe = GeminiTtsService.subscribe((newState: TtsPlaybackState) => {
      setState(newState);
      if (newState.language && newState.language !== selectedLang) {
        setSelectedLang(newState.language);
      }
    });
    return () => unsubscribe();
  }, [selectedLang]);

  const currentLangObj = TTS_LANGUAGES.find(l => l.code === selectedLang) || TTS_LANGUAGES[0];

  const handleLanguageSelect = (lang: SupportedTtsLanguage) => {
    setSelectedLang(lang);
    GeminiTtsService.setLanguage(lang);
    setModalOpen(false);
    onLanguageChange?.(lang);

    setJustSwitched(lang);
    setTimeout(() => {
      setJustSwitched(null);
    }, 3000);

    // If currently active and playing or previously started, re-synthesize immediately in new language!
    if (isCurrentTextActive && (state.isPlaying || state.currentTime > 0)) {
      GeminiTtsService.speak({
        text: textToRead,
        language: lang,
        textKey: activeKey
      });
    }
  };

  const handleTogglePlay = (forceLang?: SupportedTtsLanguage) => {
    const langToUse = forceLang || selectedLang;
    if (isCurrentTextActive && state.isPlaying) {
      GeminiTtsService.pause();
    } else if (isCurrentTextActive && !state.isPlaying && state.duration > 0 && state.language === langToUse) {
      GeminiTtsService.resume();
    } else {
      GeminiTtsService.speak({
        text: textToRead,
        language: langToUse,
        textKey: activeKey
      });
    }
  };

  const handleStop = () => {
    GeminiTtsService.stop();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    GeminiTtsService.seek(targetTime);
  };

  const cycleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 0.9];
    const nextIdx = (speeds.indexOf(state.playbackRate) + 1) % speeds.length;
    GeminiTtsService.setPlaybackRate(speeds[nextIdx]);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Compact inline button variant (e.g. inside Nora chat messages)
  if (variant === 'compact-inline') {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        {/* Quick Language Pills on Desktop */}
        <div className="hidden sm:inline-flex items-center gap-1 bg-zinc-800/90 dark:bg-slate-800/90 p-0.5 rounded-lg border border-zinc-700/80 dark:border-slate-700">
          {TTS_LANGUAGES.map((l) => {
            const isSelected = selectedLang === l.code;
            const shortCode = l.code === 'English' ? 'NG EN' : l.code.slice(0, 2).toUpperCase();
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => handleLanguageSelect(l.code)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-zinc-400 dark:text-slate-400 hover:text-white hover:bg-zinc-700'
                }`}
                title={`${l.label} (${l.nativeLabel}) - ${l.accentDescription}`}
              >
                <span>{l.flag}</span>
                <span className="ml-1">{shortCode}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile / Compact Selector Button */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="sm:hidden flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 text-[11px] font-semibold transition-colors cursor-pointer"
          title="Choose Voice Language"
        >
          <span>{currentLangObj.flag}</span>
          <span>{currentLangObj.code}</span>
          <span className="text-[9px] text-zinc-400">▾</span>
        </button>

        {/* Read Aloud / Stop Button */}
        {isCurrentTextActive && state.isLoading ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950/80 text-indigo-300 border border-indigo-800 text-xs font-semibold animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span className="text-[11px]">{selectedLang}...</span>
          </span>
        ) : isCurrentTextActive && state.isPlaying ? (
          <button
            type="button"
            onClick={handleStop}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all cursor-pointer animate-pulse"
          >
            <Square className="w-3 h-3 fill-rose-400 text-rose-400" />
            <span>Stop</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleTogglePlay()}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
            title={`Read aloud in ${currentLangObj.label}`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Read aloud</span>
          </button>
        )}

        {/* High Z-Index Modal / Popover (Never clipped by container overflow) */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
            <div 
              className="fixed inset-0" 
              onClick={() => setModalOpen(false)} 
            />
            <div className="relative w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl p-4 text-white z-10 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Select Voice Language & Accent
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] text-zinc-400">
                Native Gemini 3.8 Flash TTS with authentic pronunciation and tonal inflections.
              </p>

              <div className="space-y-1.5 pt-1">
                {TTS_LANGUAGES.map((l) => {
                  const isSelected = selectedLang === l.code;
                  return (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => handleLanguageSelect(l.code)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-bold ring-2 ring-indigo-400/50 shadow-md'
                          : 'bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-750'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{l.flag}</span>
                          <span className="font-semibold text-xs text-white">{l.label}</span>
                          <span className="text-[10px] text-zinc-300">({l.nativeLabel})</span>
                        </div>
                        <p className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-zinc-400'}`}>
                          {l.accentDescription}
                        </p>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-white text-indigo-700 flex items-center justify-center shrink-0 ml-2">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Primary Embedded Audio Bar (for Text Reader in StudySetDetailView / Notes and AudioLessonModal)
  return (
    <div className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#18181c] border border-zinc-800 text-zinc-100 shadow-xl transition-all space-y-3.5 ${className}`}>
      {/* Top Playback Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Play Button + Title */}
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            type="button"
            onClick={() => handleTogglePlay()}
            disabled={state.isLoading && isCurrentTextActive}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-all active:scale-95 cursor-pointer ${
              isCurrentTextActive && state.isPlaying
                ? 'bg-amber-500 hover:bg-amber-600 text-white ring-4 ring-amber-500/20'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white ring-4 ring-indigo-500/20'
            }`}
            title={isCurrentTextActive && state.isPlaying ? 'Pause Lesson Audio' : `Play Lesson in ${selectedLang}`}
          >
            {isCurrentTextActive && state.isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isCurrentTextActive && state.isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {state.activeEngine === 'device-fallback' && isCurrentTextActive ? 'Device Voice Engine' : 'Gemini 3.8 Flash TTS'}
              </span>
              {isCurrentTextActive && state.isPlaying ? (
                <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Speaking in {selectedLang} {state.activeEngine === 'device-fallback' ? '(Device Audio)' : '(Gemini Neural)'}</span>
                </span>
              ) : isCurrentTextActive && state.isLoading ? (
                <span className="flex items-center gap-1.5 text-[11px] text-indigo-300 font-bold bg-indigo-950/60 border border-indigo-800/80 px-2 py-0.5 rounded-full animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                  <span>Synthesizing {selectedLang}...</span>
                </span>
              ) : (
                <span className="text-[11px] text-zinc-400 font-medium">
                  {currentLangObj.flag} {currentLangObj.label} Ready
                </span>
              )}
            </div>

            <h4 className="font-bold text-xs sm:text-sm text-white truncate mt-1" title={lessonTitle}>
              {lessonTitle}
            </h4>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {/* Speed Toggle */}
          <button
            type="button"
            onClick={cycleSpeed}
            className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-mono font-bold transition-colors cursor-pointer"
            title="Adjust Playback Speed"
          >
            {state.playbackRate}x
          </button>

          {/* Stop Button */}
          {isCurrentTextActive && (state.isPlaying || state.currentTime > 0) && (
            <button
              type="button"
              onClick={handleStop}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-rose-950/50 text-zinc-400 hover:text-rose-400 border border-zinc-700 hover:border-rose-800 transition-colors cursor-pointer"
              title="Stop Audio"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          )}

          {/* Primary Action Button: "Read Lesson in [Language]" */}
          {(!isCurrentTextActive || (!state.isPlaying && state.currentTime === 0)) ? (
            <button
              type="button"
              onClick={() => handleTogglePlay()}
              disabled={state.isLoading}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Read Lesson in {selectedLang}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleTogglePlay()}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 text-xs font-bold flex items-center gap-1.5 border border-zinc-700 transition-all cursor-pointer shrink-0"
            >
              {state.isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{state.isPlaying ? 'Pause' : 'Resume'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Prominent Multi-Language Pill Switcher */}
      <div className="pt-2 border-t border-zinc-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Globe className="w-3 h-3 text-indigo-400" />
            <span>Select Voice Language & Accent (Gemini TTS):</span>
          </span>
          <span className="text-[10px] text-zinc-500 font-semibold hidden sm:inline">
            Click any language to switch instantly
          </span>
        </div>

        {/* 5 Distinct Clickable Language Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2">
          {TTS_LANGUAGES.map((l) => {
            const isSelected = selectedLang === l.code;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => handleLanguageSelect(l.code)}
                className={`flex items-center justify-between sm:justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer border ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 border-indigo-400/80 text-white font-bold shadow-md ring-2 ring-indigo-400/40 scale-[1.02]'
                    : 'bg-zinc-800/80 hover:bg-zinc-750 text-zinc-300 hover:text-white border-zinc-700/80'
                }`}
                title={l.accentDescription}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-base leading-none">{l.flag}</span>
                  <div className="text-left sm:text-center leading-tight">
                    <span className="block truncate">{l.label}</span>
                    <span className={`block text-[9px] truncate ${isSelected ? 'text-indigo-100' : 'text-zinc-400'}`}>
                      {l.nativeLabel}
                    </span>
                  </div>
                </div>

                {isSelected ? (
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0 sm:hidden" />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Active Accent & System Prompt Callout Banner */}
        <div className="mt-2.5 px-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-start sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-start sm:items-center gap-2 min-w-0 flex-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <div className="text-[11px] leading-tight text-zinc-300">
              <strong className="text-white font-bold mr-1">
                {currentLangObj.flag} {currentLangObj.label} ({currentLangObj.nativeLabel}):
              </strong>
              <span className="text-zinc-300">{currentLangObj.accentDescription}</span>
            </div>
          </div>

          {/* Quick "Listen in [Language]" button if not already playing */}
          {(!isCurrentTextActive || !state.isPlaying) && (
            <button
              type="button"
              onClick={() => handleTogglePlay(selectedLang)}
              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-2 shrink-0 cursor-pointer hidden xs:inline"
            >
              Play in {selectedLang} →
            </button>
          )}
        </div>

        {/* Switch Toast Indicator */}
        {justSwitched && (
          <div className="mt-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-[10px] font-bold flex items-center gap-1.5 animate-fade-in">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>Switched to {justSwitched} accent. Press "Read Lesson" or Play anytime to listen.</span>
          </div>
        )}

        {/* Device Fallback Notice if active */}
        {isCurrentTextActive && state.activeEngine === 'device-fallback' && (
          <div className="mt-2 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-[11px] flex items-center gap-2 animate-fade-in">
            <Volume2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Reading via device voice (free Gemini TTS limit of 10 requests/day reached today; resets daily).</span>
          </div>
        )}
      </div>

      {/* Scrub / Progress Bar (Only visible when active audio is playing or paused) */}
      {isCurrentTextActive && state.duration > 0 && (
        <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-3">
          <span className="text-[11px] font-mono text-zinc-400 shrink-0 w-9 text-right">
            {formatTime(state.currentTime)}
          </span>

          <input
            type="range"
            min={0}
            max={state.duration || 100}
            step={0.1}
            value={state.currentTime}
            onChange={handleSeek}
            className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
          />

          <span className="text-[11px] font-mono text-zinc-400 shrink-0 w-9">
            {formatTime(state.duration)}
          </span>
        </div>
      )}
    </div>
  );
};
