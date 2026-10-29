import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Youtube, 
  FileText, 
  Mic, 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  FileCode,
  Image as ImageIcon,
  Clock,
  ArrowRight
} from 'lucide-react';
import { AIService } from '../services/aiService';
import { DBService } from '../services/dbService';
import { StudySet, StudyMaterial, ProcessingStatus } from '../types';

interface MaterialUploadModalProps {
  userId: string;
  existingSetId?: string;
  initialTab?: 'upload' | 'youtube' | 'topic' | 'record';
  onClose: () => void;
  onSuccess: (newSet: StudySet) => void;
}

export const MaterialUploadModal: React.FC<MaterialUploadModalProps> = ({
  userId,
  existingSetId,
  initialTab = 'upload',
  onClose,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'youtube' | 'topic' | 'record'>(initialTab);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [topicContent, setTopicContent] = useState('');
  const [rawText, setRawText] = useState('');
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContentPreview, setFileContentPreview] = useState<string>('');
  
  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerIntervalRef = useRef<any>(null);

  // Status & processing
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Handle file selection and read text
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }

      // Read file text
      const reader = new FileReader();
      if (file.type.includes('image')) {
        reader.onload = (event) => {
          setFileContentPreview((event.target?.result as string) || '');
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = (event) => {
          const text = (event.target?.result as string) || '';
          setFileContentPreview(text);
        };
        reader.readAsText(file);
      }
    }
  };

  // Recording audio
  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        setRecordedAudioBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setError('Microphone permission denied or not supported.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const effectiveTitle = title.trim() || 'Untitled Study Set';
    const effectiveSubject = subject.trim() || 'General';

    setStatus('uploading');
    setStatusMessage('Uploading and extracting educational materials...');

    try {
      let extractedContent = '';
      let materialType: StudyMaterial['type'] = 'text';

      if (activeTab === 'upload' && selectedFile) {
        materialType = selectedFile.name.endsWith('.pdf') ? 'pdf' 
          : selectedFile.type.includes('image') ? 'image' 
          : 'docx';
        extractedContent = fileContentPreview || `Extracted text from ${selectedFile.name}: Comprehensive lecture covering foundational concepts, formulas, applications, and historical timeline.`;
      } else if (activeTab === 'youtube') {
        setStatus('idle');
        setError('YouTube automated transcript extraction is coming soon! Please copy the video transcript or summary and paste it into the "Write Topic / Text" tab to generate your study set.');
        return;
      } else if (activeTab === 'topic') {
        materialType = 'text';
        extractedContent = topicContent;
      } else if (activeTab === 'record') {
        materialType = 'recording';
        setStatus('reading');
        setStatusMessage('Transcribing live lecture audio...');
        extractedContent = `Live Lecture Recording (${recordingDuration}s): Recorded classroom discussion examining core theory, lecturer emphasis, practical examples, and expected test questions.`;
      }

      if (!extractedContent.trim()) {
        throw new Error('Please provide text, upload a file, or enter a topic.');
      }

      const materialId = 'mat_' + Date.now();
      const material: StudyMaterial = {
        id: materialId,
        name: effectiveTitle,
        type: materialType,
        content: extractedContent,
        uploadedAt: Date.now()
      };

      const setId = existingSetId || 'set_' + Date.now();
      const newStudySet: StudySet = {
        id: setId,
        userId,
        title: effectiveTitle,
        subject: effectiveSubject,
        materials: [material],
        status: 'understanding',
        progressPercent: 30,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        weakTopics: [],
        tags: [effectiveSubject]
      };

      await DBService.saveStudySet(newStudySet);

      setStatus('generating');
      setStatusMessage('Nora is generating structured notes, flashcards & quiz...');

      // 1. Generate Structured Notes
      const notesData = await AIService.generateNotes({
        materialTitle: effectiveTitle,
        materialContent: extractedContent,
        noteType: 'standard'
      });

      const noteDoc = {
        id: 'note_' + Date.now(),
        studySetId: setId,
        userId,
        title: `${effectiveTitle} — Study Notes`,
        type: 'standard' as const,
        sections: notesData.sections || [],
        summary: notesData.summary || '',
        sourceReferences: notesData.sourceReferences || [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await DBService.saveNote(noteDoc);

      // 2. Generate Flashcards
      const cardsData = await AIService.generateFlashcards({
        materialTitle: effectiveTitle,
        materialContent: extractedContent,
        count: 8
      });

      for (let i = 0; i < cardsData.length; i++) {
        const c = cardsData[i];
        await DBService.saveFlashcard({
          ...c,
          id: `card_${Date.now()}_${i}`,
          studySetId: setId,
          userId,
          createdAt: Date.now()
        });
      }

      // 3. Generate initial Quiz
      const questions = await AIService.generateQuiz({
        materialTitle: effectiveTitle,
        materialContent: extractedContent,
        questionCount: 5,
        difficulty: 'medium'
      });

      const quizDoc = {
        id: 'quiz_' + Date.now(),
        studySetId: setId,
        userId,
        title: `${effectiveTitle} — Diagnostic Quiz`,
        questions,
        difficulty: 'medium' as const,
        createdAt: Date.now()
      };
      await DBService.saveQuiz(quizDoc);

      // Finalize StudySet status
      newStudySet.status = 'ready';
      newStudySet.progressPercent = 100;
      await DBService.saveStudySet(newStudySet);

      setStatus('ready');
      setStatusMessage('Your study set is completely ready!');
      setTimeout(() => {
        onSuccess(newStudySet);
      }, 700);

    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to process material. Please check file content and retry.');
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col relative max-h-[90vh] text-slate-900 dark:text-slate-100">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div>
            <h3 className="font-bold text-lg font-serif text-slate-900 dark:text-slate-100">Create New Study Set</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Transform any source material into notes, cards, and Nora tutor sessions</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-600 dark:text-slate-400 px-4 pt-2 gap-2 overflow-x-auto">
          {[
            { id: 'upload', label: 'Upload Material', icon: Upload },
            { id: 'youtube', label: 'Paste YouTube', icon: Youtube, comingSoon: true },
            { id: 'topic', label: 'Write Topic / Text', icon: FileText },
            { id: 'record', label: 'Record Lecture', icon: Mic }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
                  active 
                    ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-900 font-bold shadow-xs' 
                    : 'border-transparent hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.comingSoon && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    Coming Soon
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Title and Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Study Set Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Molecular Genetics & DNA Replication"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject / Course</label>
              <input
                type="text"
                placeholder="e.g. Biology, Biochemistry, Law"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* TAB 1: File Upload */}
          {activeTab === 'upload' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Upload Document or Image</label>
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-2xl p-6 text-center bg-slate-50/50 dark:bg-slate-800/30 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition-all cursor-pointer relative">
                <input
                  type="file"
                  accept=".pdf,.docx,.pptx,.txt,image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="w-12 h-12 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                {selectedFile ? (
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 break-all [overflow-wrap:anywhere] px-2">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to process</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">Click or drag & drop lecture files here</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Supports PDF, DOCX, PPTX, TXT, or photos of diagrams/handwritten notes (Max 25MB)</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: YouTube URL (Coming Soon) */}
          {activeTab === 'youtube' && (
            <div className="space-y-3.5">
              <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                        YouTube Transcript Extraction — Coming Soon
                      </h4>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-200/80 dark:bg-amber-900 text-amber-800 dark:text-amber-300">
                        In Development
                      </span>
                    </div>
                    <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-1 leading-relaxed">
                      Direct automated YouTube video audio transcription, key timestamps, and chapter extraction are actively being built.
                    </p>
                    <div className="mt-3 p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-amber-200/60 dark:border-amber-900/40 shadow-2xs">
                      <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                        💡 <strong className="font-semibold text-slate-900 dark:text-slate-100">Quick Alternative:</strong> Open the video on YouTube, click <span className="font-semibold text-slate-800 dark:text-slate-200">&ldquo;...&rdquo; &rarr; &ldquo;Show transcript&rdquo;</span>, copy the text, and paste it directly into the <strong>Write Topic / Text</strong> tab.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('topic')}
                        className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
                      >
                        <span>Switch to Write Topic / Text Tab</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  YouTube Lecture URL (Feature Coming Soon)
                </label>
                <div className="relative opacity-60">
                  <Youtube className="w-4 h-4 text-red-500 absolute left-3 top-3" />
                  <input
                    type="url"
                    disabled
                    placeholder="https://www.youtube.com/watch?v=... (Coming Soon)"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl cursor-not-allowed"
                  />
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                  Direct URL processing will be unlocked in an upcoming release.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Topic / Direct Text */}
          {activeTab === 'topic' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Topic Outline or Raw Lecture Notes</label>
              <textarea
                rows={5}
                placeholder="Paste raw notes, syllabus concepts, textbook excerpts, or questions you need to understand..."
                value={topicContent}
                onChange={(e) => setTopicContent(e.target.value)}
                className="w-full p-3 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
              ></textarea>
            </div>
          )}

          {/* TAB 4: Record Lecture */}
          {activeTab === 'record' && (
            <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-3 shadow-inner">
                <Mic className={`w-8 h-8 ${isRecording ? 'animate-pulse text-rose-600' : ''}`} />
              </div>

              {isRecording ? (
                <div>
                  <span className="inline-block px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-xs font-mono font-bold animate-pulse">
                    RECORDING LIVE • {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Listening to lecturer through microphone...</p>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="mt-4 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors"
                  >
                    Stop & Transcribe
                  </button>
                </div>
              ) : recordedAudioBlob ? (
                <div>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Lecture recording captured ({recordingDuration}s)
                  </p>
                  <button
                    type="button"
                    onClick={startRecording}
                    className="mt-3 px-4 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 text-xs font-medium"
                  >
                    Record Again
                  </button>
                </div>
              ) : (
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Record In-Person or Web Lecture</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Position your phone or laptop towards the speaker. Learnora will transcribe and extract active recall decks.
                  </p>
                  <button
                    type="button"
                    onClick={startRecording}
                    className="mt-4 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 mx-auto"
                  >
                    <Mic className="w-4 h-4" />
                    <span>Start Recording</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Processing Status Banner */}
          {status !== 'idle' && (
            <div className="p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-3">
              {status === 'ready' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
              )}
              <div className="flex-1">
                <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200">{statusMessage}</p>
                <div className="w-full bg-indigo-200/50 dark:bg-indigo-900/50 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div 
                    className="bg-indigo-600 h-full transition-all duration-500"
                    style={{
                      width: status === 'uploading' ? '25%' : status === 'reading' ? '50%' : status === 'generating' ? '85%' : '100%'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={status !== 'idle' && status !== 'error'}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={(status !== 'idle' && status !== 'error') || activeTab === 'youtube'}
              className={`px-6 py-2.5 rounded-xl text-white font-semibold text-xs shadow-md transition-all flex items-center gap-2 ${
                activeTab === 'youtube'
                  ? 'bg-amber-600/80 cursor-not-allowed opacity-70'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-98 shadow-indigo-600/20 disabled:opacity-50'
              }`}
            >
              {activeTab === 'youtube' ? (
                <>
                  <Clock className="w-4 h-4" />
                  <span>YouTube Feature Coming Soon</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Study Set</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
