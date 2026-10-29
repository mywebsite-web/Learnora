import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  HelpCircle, 
  BrainCircuit, 
  Layers, 
  Award, 
  ArrowRight,
  RefreshCw,
  Zap,
  MessageSquare,
  Settings2,
  Sliders
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudySet, ExplainerVideo, ExplainerSlide } from '../types';
import { AIService } from '../services/aiService';
import { VoiceService } from '../services/voiceService';
import { ElevenLabsVoiceSelector } from './ElevenLabsVoiceSelector';

interface ExplainerVideoModalProps {
  studySet: StudySet;
  onClose: () => void;
}

export const ExplainerVideoModal: React.FC<ExplainerVideoModalProps> = ({ studySet, onClose }) => {
  const [video, setVideo] = useState<Omit<ExplainerVideo, 'id' | 'studySetId' | 'userId' | 'createdAt'> | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [elapsedSlideTime, setElapsedSlideTime] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showAnswerFeedback, setShowAnswerFeedback] = useState(false);
  const [activeSubtitle, setActiveSubtitle] = useState<string>('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [voiceProvider, setVoiceProvider] = useState<'elevenlabs' | 'webspeech'>('elevenlabs');
  
  const timerRef = useRef<any>(null);

  const currentSlide = video?.slides?.[currentSlideIndex];

  // Auto-generation on open if not already loaded
  useEffect(() => {
    handleGenerate();
    return () => {
      stopPlayback();
    };
  }, [studySet.id]);

  // Handle slide timer & speech synthesis when slide or play state changes
  useEffect(() => {
    if (!video || !currentSlide) return;

    if (isPlaying) {
      startSpeechAndTimer();
    } else {
      pauseSpeechAndTimer();
    }

    return () => {
      clearInterval(timerRef.current);
    };
  }, [isPlaying, currentSlideIndex, playbackRate, isMuted]);

  const handleGenerate = async () => {
    setLoading(true);
    stopPlayback();
    try {
      const content = studySet.materials?.map(m => m.content).join('\n') || studySet.title;
      const res = await AIService.generateExplainerVideo({
        topic: studySet.title,
        materialContent: content
      });
      setVideo(res);
      setCurrentSlideIndex(0);
      setElapsedSlideTime(0);
      setSelectedAnswer(null);
      setShowAnswerFeedback(false);
      // Auto-start playback
      setIsPlaying(true);
    } catch (e) {
      console.error('Explainer generation error:', e);
    } finally {
      setLoading(false);
    }
  };

  const startSpeechAndTimer = () => {
    if (!currentSlide) return;

    if (timerRef.current) clearInterval(timerRef.current);
    VoiceService.stop();

    const duration = currentSlide.durationSeconds || 16;
    setActiveSubtitle(currentSlide.narration);

    if (!isMuted) {
      VoiceService.speak({
        text: currentSlide.narration,
        onEnd: () => {
          if (!currentSlide.interactiveCheck || showAnswerFeedback) {
            advanceSlideOrLoop();
          }
        },
        onError: () => {
          if (!currentSlide.interactiveCheck || showAnswerFeedback) {
            advanceSlideOrLoop();
          }
        }
      }).then((res) => {
        if (res.provider) setVoiceProvider(res.provider);
      }).catch((e) => console.warn(e));
    }

    // Progress clock
    timerRef.current = setInterval(() => {
      setElapsedSlideTime((prev) => {
        if (prev >= duration) {
          if (currentSlide.interactiveCheck && selectedAnswer === null) {
            pauseSpeechAndTimer();
            return duration;
          }
          advanceSlideOrLoop();
          return 0;
        }
        return prev + 0.25;
      });
    }, 250);
  };

  const pauseSpeechAndTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    VoiceService.stop();
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    VoiceService.stop();
    setElapsedSlideTime(0);
  };

  const advanceSlideOrLoop = () => {
    if (!video) return;
    if (currentSlideIndex + 1 < video.slides.length) {
      setCurrentSlideIndex(prev => prev + 1);
      setElapsedSlideTime(0);
      setSelectedAnswer(null);
      setShowAnswerFeedback(false);
    } else {
      // Completed all scenes
      setIsPlaying(false);
      confetti({ particleCount: 90, spread: 70 });
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
      setElapsedSlideTime(0);
      setSelectedAnswer(null);
      setShowAnswerFeedback(false);
    }
  };

  const handleNextSlide = () => {
    if (video && currentSlideIndex + 1 < video.slides.length) {
      setCurrentSlideIndex(prev => prev + 1);
      setElapsedSlideTime(0);
      setSelectedAnswer(null);
      setShowAnswerFeedback(false);
    }
  };

  const handleSelectQuizOption = (idx: number) => {
    setSelectedAnswer(idx);
    setShowAnswerFeedback(true);
    if (idx === currentSlide?.interactiveCheck?.correctIndex) {
      confetti({ particleCount: 50, spread: 45 });
    }
  };

  const slideDuration = currentSlide?.durationSeconds || 16;
  const progressPercent = Math.min(100, (elapsedSlideTime / slideDuration) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 w-full max-w-4xl overflow-hidden flex flex-col relative max-h-[96vh] text-white">
        
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-sm">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white font-serif">StudyFetch Explainer Video Player</h3>
                <span className="px-2 py-0.2 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold uppercase tracking-wider border border-rose-500/30">
                  AI Animated Lecture
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-sm sm:max-w-md">
                {studySet.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                pauseSpeechAndTimer();
                setShowVoiceSettings(true);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-indigo-300 hover:text-white flex items-center gap-1.5 transition-colors border border-slate-700"
              title="Change Voice Model (Nora Voices)"
            >
              <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Voice:</span>
              <span className="text-white font-medium">Nora Voices</span>
            </button>

            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className={`p-2 rounded-xl text-xs flex items-center gap-1 transition-colors ${
                showTranscript ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
              title="Toggle Narration Transcript"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Transcript</span>
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Regenerate Video Scenes"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={() => {
                stopPlayback();
                onClose();
              }}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors ml-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center text-white shadow-xl animate-pulse">
                <Video className="w-8 h-8" />
              </div>
              <div className="absolute -inset-1 rounded-2xl bg-rose-500/20 blur-md -z-10 animate-ping"></div>
            </div>
            <div>
              <h4 className="font-bold text-base text-white font-serif">Synthesizing Visual Explainer Video</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Constructing animated diagram nodes, conceptual progression, and synchronized Nora voiceover...
              </p>
            </div>
          </div>
        ) : !video ? (
          <div className="p-12 text-center space-y-4">
            <p className="text-sm text-slate-400">Failed to initialize video scenes. Click below to retry.</p>
            <button
              onClick={handleGenerate}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-xs"
            >
              Generate Explainer
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Main Audiovisual Studio Stage */}
            <div className="relative flex-1 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-8 flex flex-col justify-between overflow-y-auto">
              
              {/* Scene Top Metabar */}
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white font-mono text-xs font-bold backdrop-blur-md border border-white/10">
                    Scene {currentSlideIndex + 1} of {video.slides.length}
                  </span>
                  <span className="text-xs text-slate-400 hidden sm:inline">
                    {currentSlide?.subtitle || 'Key Concept Analysis'}
                  </span>
                </div>

                {/* Animated Nora Avatar Badge */}
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-800/90 border border-slate-700/80 shadow-md">
                  <div className="relative">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white text-[11px] font-bold">
                      N
                    </div>
                    {isPlaying && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900 animate-pulse"></span>
                    )}
                  </div>
                  <div className="text-[11px] font-semibold text-indigo-200">
                    Nora <span className="text-[10px] text-slate-400 font-normal capitalize">({currentSlide?.avatarExpression || 'explaining'})</span>
                  </div>
                </div>
              </div>

              {/* Center Screen: Visual Animated Content */}
              <div className="my-auto py-6 max-w-2xl mx-auto w-full space-y-6 z-10">
                {/* Title & Subtitle */}
                <div className="text-center sm:text-left space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-bold font-serif text-white tracking-tight leading-tight">
                    {currentSlide?.title}
                  </h2>
                  {currentSlide?.subtitle && (
                    <p className="text-xs sm:text-sm text-indigo-300 font-medium">
                      {currentSlide.subtitle}
                    </p>
                  )}
                </div>

                {/* Animated Diagram Canvas (StudyFetch-style dynamic graphic) */}
                {currentSlide?.diagramNodes && currentSlide.diagramNodes.length > 0 && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-slate-800 shadow-inner">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3 uppercase tracking-wider font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Interactive Diagram Blueprint: {currentSlide.diagramType || 'Process Flow'}</span>
                      </span>
                      <span className="text-indigo-400">Live Stage</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {currentSlide.diagramNodes.map((node, nIdx) => {
                        const isNodeActive = Math.floor((elapsedSlideTime / slideDuration) * currentSlide.diagramNodes!.length) === nIdx;
                        return (
                          <div 
                            key={nIdx}
                            className={`p-3.5 rounded-xl border transition-all duration-300 ${
                              isNodeActive || node.highlight
                                ? 'bg-gradient-to-br from-indigo-900/60 to-violet-900/60 border-indigo-400/80 shadow-lg shadow-indigo-500/10 scale-102 ring-1 ring-indigo-400/50'
                                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-mono font-bold text-indigo-300 uppercase">
                                0{nIdx + 1}
                              </span>
                              {(isNodeActive || node.highlight) && (
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                              )}
                            </div>
                            <h4 className="font-bold text-xs text-white leading-snug">{node.label}</h4>
                            {node.desc && (
                              <p className="text-[11px] text-slate-400 mt-1 leading-normal">{node.desc}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* High-Impact Core Takeaway Bullets */}
                <div className="space-y-2">
                  {currentSlide?.bulletPoints.map((point, pIdx) => (
                    <div 
                      key={pIdx} 
                      className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/40 border border-slate-800/60 text-xs sm:text-sm text-slate-200"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{point}</span>
                    </div>
                  ))}
                </div>

                {/* StudyFetch-style Mid-Video Interactive Check */}
                {currentSlide?.interactiveCheck && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-950/90 to-slate-900 border border-indigo-500/40 shadow-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="font-bold text-xs text-amber-300 uppercase tracking-wider">
                        Interactive Check-for-Understanding
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-semibold text-white">
                      {currentSlide.interactiveCheck.question}
                    </p>

                    <div className="space-y-2">
                      {currentSlide.interactiveCheck.options.map((opt, optIdx) => {
                        const isSelected = selectedAnswer === optIdx;
                        const isCorrect = optIdx === currentSlide.interactiveCheck!.correctIndex;
                        let btnStyle = 'bg-slate-900/90 border-slate-700 text-slate-200 hover:border-indigo-400';

                        if (showAnswerFeedback) {
                          if (isCorrect) btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold';
                          else if (isSelected) btnStyle = 'bg-rose-950/80 border-rose-500 text-rose-200 line-through';
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectQuizOption(optIdx)}
                            disabled={showAnswerFeedback}
                            className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm flex items-center justify-between transition-all ${btnStyle}`}
                          >
                            <span>{opt}</span>
                            {showAnswerFeedback && isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {showAnswerFeedback && (
                      <div className="p-3 bg-indigo-900/40 rounded-xl border border-indigo-500/30 text-xs text-indigo-200 leading-relaxed animate-fade-in flex items-start gap-2">
                        <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong>Explanation:</strong> {currentSlide.interactiveCheck.explanation}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Subtitles Overlay Bar */}
              <div className="min-h-[50px] p-3 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 text-center text-xs sm:text-sm text-indigo-100 flex items-center justify-center font-medium shadow-lg z-10">
                <span className="leading-relaxed">"{activeSubtitle || currentSlide?.narration}"</span>
              </div>
            </div>

            {/* Narration Script Drawer (if toggled) */}
            {showTranscript && (
              <div className="bg-slate-950 p-4 border-t border-slate-800 text-xs text-slate-300 max-h-36 overflow-y-auto animate-fade-in">
                <span className="font-bold text-indigo-300 block mb-1">Full Scene Narration:</span>
                <p className="leading-relaxed italic">{currentSlide?.narration}</p>
              </div>
            )}

            {/* Video Controls Bar */}
            <div className="bg-slate-950 px-4 sm:px-6 py-3 border-t border-slate-800 space-y-2">
              {/* Progress Slider Track */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden relative cursor-pointer">
                <div 
                  className="h-full bg-gradient-to-r from-rose-500 via-indigo-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>

              {/* Buttons and Time Display */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Play/Pause Button */}
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white flex items-center justify-center shadow-md transition-all"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>

                  {/* Previous / Next buttons */}
                  <button
                    onClick={handlePrevSlide}
                    disabled={currentSlideIndex === 0}
                    className="p-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                    title="Previous Scene"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleNextSlide}
                    disabled={currentSlideIndex + 1 >= video.slides.length}
                    className="p-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                    title="Next Scene"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Time Counter */}
                  <span className="text-xs font-mono text-slate-400">
                    {Math.floor(elapsedSlideTime)}s / {slideDuration}s
                  </span>
                </div>

                {/* Scene Dots */}
                <div className="hidden sm:flex items-center gap-1.5">
                  {video.slides.map((_, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => {
                        stopPlayback();
                        setCurrentSlideIndex(sIdx);
                      }}
                      className={`h-2 rounded-full transition-all ${
                        currentSlideIndex === sIdx ? 'w-6 bg-indigo-500' : 'w-2 bg-slate-700 hover:bg-slate-500'
                      }`}
                      title={`Jump to Scene ${sIdx + 1}`}
                    />
                  ))}
                </div>

                {/* Right Controls: Speed & Audio */}
                <div className="flex items-center gap-3">
                  {/* Playback Speed Pill */}
                  <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs text-slate-400">
                    {[1.0, 1.25, 1.5].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => setPlaybackRate(rate)}
                        className={`px-2 py-0.5 rounded-md font-mono ${
                          playbackRate === rate ? 'bg-indigo-600 text-white font-bold' : 'hover:text-white'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>

                  {/* Mute Toggle */}
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ElevenLabs Voice Selection Modal */}
      {showVoiceSettings && (
        <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh]">
            <ElevenLabsVoiceSelector onClose={() => setShowVoiceSettings(false)} />
          </div>
        </div>
      )}
    </div>
  );
};
