import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  Headphones, 
  Sparkles, 
  ArrowLeft,
  BookOpen
} from 'lucide-react';
import { StudySet } from '../types';
import { AIService } from '../services/aiService';
import { VoiceService } from '../services/voiceService';
import { ElevenLabsVoiceSelector } from './ElevenLabsVoiceSelector';

interface AudioLessonModalProps {
  studySet: StudySet;
  onClose: () => void;
}

export const AudioLessonModal: React.FC<AudioLessonModalProps> = ({ studySet, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setMode] = useState<'Quick recap' | 'Detailed lecture' | 'Conversation' | 'Exam revision'>('Quick recap');
  const [script, setScript] = useState<string>('');
  const [scenes, setScenes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  const handleGenerateScript = async () => {
    setLoading(true);
    try {
      const content = studySet.materials?.map(m => m.content).join('\n') || studySet.title;
      const res = await AIService.generateAudioLesson({
        title: studySet.title,
        materialContent: content,
        mode
      });
      setScript(res.script);
      setScenes(res.scenes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      VoiceService.stop();
      setIsPlaying(false);
    } else {
      if (!script) return;
      setIsPlaying(true);
      VoiceService.speak({
        text: script,
        onEnd: () => setIsPlaying(false),
        onError: () => setIsPlaying(false)
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden flex flex-col relative max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 font-serif">AI Audio Lesson</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{studySet.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVoiceModal(true)}
              className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold text-xs flex items-center gap-1 border border-indigo-200 dark:border-indigo-800"
              title="Select Voice"
            >
              <Volume2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Voice</span>
            </button>
            <button 
              onClick={() => {
                VoiceService.stop();
                onClose();
              }}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-semibold p-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Lesson Audio Format</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(['Quick recap', 'Detailed lecture', 'Conversation', 'Exam revision'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                    mode === m 
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-bold' 
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {!script ? (
            <div className="text-center py-8">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-xs mx-auto">
                Synthesize your study set into a natural spoken audio lecture you can listen to on the go.
              </p>
              <button
                type="button"
                onClick={handleGenerateScript}
                disabled={loading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 mx-auto"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Audio Script</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              {/* Audio Player Controls */}
              <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col items-center justify-between border border-slate-800">
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => {
                      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                      setIsPlaying(false);
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>

                  <button
                    onClick={togglePlay}
                    className="w-14 h-14 rounded-full bg-indigo-500 hover:bg-indigo-400 flex items-center justify-center text-white shadow-lg transition-transform active:scale-95"
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                  </button>

                  <button
                    onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 1.25 : playbackSpeed === 1.25 ? 1.5 : 1)}
                    className="text-xs font-mono bg-white/10 px-2 py-1 rounded text-slate-300 hover:text-white"
                  >
                    {playbackSpeed}x
                  </button>
                </div>

                <div className="w-full mt-4 flex items-center justify-between text-xs text-slate-400">
                  <span>Nora Audio Engine</span>
                  <span>{isPlaying ? 'Playing Audio' : 'Paused'}</span>
                </div>
              </div>

              {/* Transcript */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">Lesson Transcript</h4>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800">
                  {script}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ElevenLabs Voice Selection Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh]">
            <ElevenLabsVoiceSelector onClose={() => setShowVoiceModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
};
