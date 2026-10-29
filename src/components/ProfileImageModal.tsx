/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Camera, 
  Sparkles, 
  Link as LinkIcon, 
  Trash2, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Video, 
  VideoOff, 
  User,
  Image as ImageIcon,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { resizeAndCompressImage, validateImageUrl, PRESET_AVATARS, PresetAvatar } from '../utils/imageUtils';

interface ProfileImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newAvatarUrl: string | undefined) => void;
  onOpenProfileSettings?: () => void;
}

export const ProfileImageModal: React.FC<ProfileImageModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenProfileSettings
}) => {
  const { profile, user, updateProfileData } = useAuth();

  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'presets' | 'url'>('upload');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'science' | 'humanities' | 'creative' | 'students'>('all');

  // Preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile?.avatarUrl || null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isVerifyingUrl, setIsVerifyingUrl] = useState(false);
  const [urlVerificationStatus, setUrlVerificationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Camera / Webcam State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Save State
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const displayName = profile?.displayName || user?.displayName || 'Learner';
  const initialLetter = displayName.charAt(0).toUpperCase() || 'L';

  // Sync current avatar when modal opens
  useEffect(() => {
    if (isOpen) {
      setPreviewUrl(profile?.avatarUrl || null);
      setCapturedPhoto(null);
      setUploadError(null);
      setCameraError(null);
      setUrlVerificationStatus('idle');
      setSaveSuccess(false);

      // Check if current matches a preset
      const match = PRESET_AVATARS.find(p => p.url === profile?.avatarUrl);
      setSelectedPresetId(match ? match.id : null);
    } else {
      stopCamera();
    }
  }, [isOpen, profile?.avatarUrl]);

  // Clean up camera on unmount or tab change
  useEffect(() => {
    if (activeTab !== 'camera' && isCameraActive) {
      stopCamera();
    }
  }, [activeTab]);

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    setCapturedPhoto(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: 'user' },
        audio: false
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera permissions in your browser or choose file upload.');
      } else {
        setCameraError('Unable to access camera. Please check your camera settings or upload an image file.');
      }
      setIsCameraActive(false);
    }
  };

  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const size = Math.min(video.videoWidth || 400, video.videoHeight || 400);
      canvas.width = 320;
      canvas.height = 320;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const sx = (video.videoWidth - size) / 2;
      const sy = (video.videoHeight - size) / 2;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(video, sx, sy, size, size, 0, 0, 320, 320);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      setCapturedPhoto(dataUrl);
      setPreviewUrl(dataUrl);
      stopCamera();
    } catch (err) {
      console.error('Failed to capture snapshot:', err);
      setCameraError('Failed to capture photo from camera.');
    }
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  // Process File Selection
  const handleFileProcess = async (file: File) => {
    setUploadError(null);
    setIsProcessingFile(true);
    try {
      const compressedDataUrl = await resizeAndCompressImage(file, 320, 0.85);
      setPreviewUrl(compressedDataUrl);
      setSelectedPresetId(null);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to process image. Please try another file.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  // URL input handler
  const handleVerifyAndSetUrl = async () => {
    if (!customUrlInput.trim()) return;
    setIsVerifyingUrl(true);
    setUrlVerificationStatus('idle');
    try {
      const isValid = await validateImageUrl(customUrlInput.trim());
      if (isValid) {
        setUrlVerificationStatus('valid');
        setPreviewUrl(customUrlInput.trim());
        setSelectedPresetId(null);
      } else {
        setUrlVerificationStatus('invalid');
      }
    } catch {
      setUrlVerificationStatus('invalid');
    } finally {
      setIsVerifyingUrl(false);
    }
  };

  // Select Preset
  const handleSelectPreset = (preset: PresetAvatar) => {
    setSelectedPresetId(preset.id);
    setPreviewUrl(preset.url);
  };

  // Save profile changes
  const handleSaveAvatar = async () => {
    setIsSaving(true);
    setUploadError(null);
    try {
      const finalAvatar = previewUrl || undefined;
      await updateProfileData({
        avatarUrl: finalAvatar
      });

      setSaveSuccess(true);
      if (onSuccess) {
        onSuccess(finalAvatar);
      }
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Failed to update avatar:', err);
      setUploadError('Failed to save profile picture. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Remove photo handler
  const handleRemovePhoto = async () => {
    setIsSaving(true);
    try {
      setPreviewUrl(null);
      setSelectedPresetId(null);
      setCapturedPhoto(null);
      await updateProfileData({
        avatarUrl: undefined
      });
      setSaveSuccess(true);
      if (onSuccess) {
        onSuccess(undefined);
      }
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setUploadError('Failed to remove profile picture.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const filteredPresets = selectedCategory === 'all'
    ? PRESET_AVATARS
    : PRESET_AVATARS.filter(p => p.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in font-sans">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-scale-in"
        role="dialog"
        aria-modal="true"
      >
        {/* MODAL HEADER */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Camera className="w-5 h-5 text-blue-100" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 font-serif leading-tight">
                Profile Photo &amp; Avatar
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Personalize your learner identity across Learnora
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors active:scale-95"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* QUICK LINK TO FULL PROFILE SETTINGS */}
          {onOpenProfileSettings && (
            <div className="px-3.5 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/90 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-2xs">
              <div className="flex items-center gap-2 text-slate-800 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-blue-950 block truncate leading-tight">Need to update your account or learning settings?</span>
                  <span className="text-[10px] text-slate-500 block truncate">Edit name, goals, tutor style, voice & study time</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onClose();
                  onOpenProfileSettings();
                }}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-200/80 font-bold text-xs shrink-0 flex items-center gap-1 shadow-2xs transition-all active:scale-95"
              >
                <span>Profile Settings</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* SUCCESS BANNER */}
          {saveSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2.5 shadow-2xs animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Profile picture updated and synced successfully!</span>
            </div>
          )}

          {/* ERROR BANNER */}
          {uploadError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold flex items-center gap-2.5 shadow-2xs animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* ACTIVE AVATAR PREVIEW CARD */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200/80 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 shadow-2xs">
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden ring-4 ring-white shadow-md border-2 border-blue-500/30 bg-slate-200 flex items-center justify-center">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center">
                    {initialLetter}
                  </div>
                )}
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-2xs" />
            </div>

            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="font-bold text-sm sm:text-base text-slate-900 truncate">
                  {displayName}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                  {previewUrl ? 'Custom Image Active' : 'Default Initials'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                This image is visible on your dashboard, tutor messages, study progress reports, and discussions.
              </p>
              {previewUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setPreviewUrl(null);
                    setSelectedPresetId(null);
                    setCapturedPhoto(null);
                  }}
                  className="mt-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline inline-flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove picture (revert to initials)</span>
                </button>
              )}
            </div>
          </div>

          {/* METHOD SELECTION TABS */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/70">
            {[
              { id: 'upload', label: 'Upload File', icon: Upload },
              { id: 'camera', label: 'Take Photo', icon: Camera },
              { id: 'presets', label: 'Avatar Library', icon: Sparkles },
              { id: 'url', label: 'Image URL', icon: LinkIcon }
            ].map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setActiveTab(id as any);
                    if (id === 'camera' && !isCameraActive && !capturedPhoto) {
                      startCamera();
                    }
                  }}
                  className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    isActive
                      ? 'bg-white text-blue-700 shadow-xs ring-1 ring-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: UPLOAD FILE */}
          {activeTab === 'upload' && (
            <div className="space-y-3 animate-fade-in">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/80 scale-[1.01]'
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/20'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                  {isProcessingFile ? (
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-800">
                    {isProcessingFile ? 'Optimizing & Centering Image...' : 'Click to upload or drag & drop'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    PNG, JPG, WEBP, or GIF (auto-cropped to square and optimized for fast offline loading)
                  </p>
                </div>

                <button
                  type="button"
                  className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
                >
                  Browse Device Files
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CAMERA / WEBCAM */}
          {activeTab === 'camera' && (
            <div className="space-y-4 animate-fade-in">
              {cameraError ? (
                <div className="p-6 text-center rounded-2xl border border-amber-200 bg-amber-50/70 space-y-3">
                  <VideoOff className="w-8 h-8 text-amber-600 mx-auto" />
                  <h4 className="font-bold text-sm text-slate-800">Camera Unavailable</h4>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">{cameraError}</p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    Try Camera Again
                  </button>
                </div>
              ) : capturedPhoto ? (
                <div className="space-y-3 text-center">
                  <div className="w-48 h-48 rounded-full overflow-hidden mx-auto ring-4 ring-blue-500 shadow-md">
                    <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleRetakePhoto}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retake Photo</span>
                    </button>
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      <span>Photo captured!</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative w-full max-w-sm mx-auto aspect-square bg-slate-900 rounded-3xl overflow-hidden shadow-inner border border-slate-800 flex items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {/* Viewfinder circular overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-52 h-52 rounded-full border-2 border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleCaptureSnapshot}
                      className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-2 transition-all"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Snap Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-3.5 py-2.5 rounded-2xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-bold"
                    >
                      Turn Off Camera
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AVATAR LIBRARY */}
          {activeTab === 'presets' && (
            <div className="space-y-3.5 animate-fade-in">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { id: 'all', label: 'All Avatars' },
                  { id: 'students', label: 'Students' },
                  { id: 'science', label: 'Science & AI' },
                  { id: 'humanities', label: 'Humanities' },
                  { id: 'creative', label: 'Arts & Design' }
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedCategory(id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                      selectedCategory === id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Grid of Avatars */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-1">
                {filteredPresets.map((preset) => {
                  const isSelected = previewUrl === preset.url || selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`group relative flex flex-col items-center p-2 rounded-2xl border transition-all text-left ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/30 scale-105 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden shadow-xs ring-1 ring-slate-200">
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center">
                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 mt-2 truncate w-full text-center">
                        {preset.name.split(' ')[0]}
                      </span>
                      <span className="text-[9px] text-slate-400 truncate w-full text-center">
                        {preset.role.split('&')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: IMAGE URL */}
          {activeTab === 'url' && (
            <div className="space-y-3 animate-fade-in">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Direct Web Image URL (HTTPS)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={customUrlInput}
                  onChange={(e) => {
                    setCustomUrlInput(e.target.value);
                    setUrlVerificationStatus('idle');
                  }}
                  placeholder="https://example.com/avatar.jpg"
                  className="flex-1 p-3 text-xs sm:text-sm border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900 shadow-2xs"
                />
                <button
                  type="button"
                  disabled={isVerifyingUrl || !customUrlInput.trim()}
                  onClick={handleVerifyAndSetUrl}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
                >
                  {isVerifyingUrl ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Test &amp; Use</span>
                </button>
              </div>

              {urlVerificationStatus === 'valid' && (
                <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Image URL loaded successfully! Preview is ready above.</span>
                </p>
              )}

              {urlVerificationStatus === 'invalid' && (
                <p className="text-xs text-rose-600 font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Could not load image from this URL. Please verify the link or try another.</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            {profile?.avatarUrl && (
              <button
                type="button"
                disabled={isSaving}
                onClick={handleRemovePhoto}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove current photo</span>
              </button>
            )}
            {onOpenProfileSettings && (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => {
                  stopCamera();
                  onClose();
                  onOpenProfileSettings();
                }}
                className="text-xs font-semibold text-slate-600 hover:text-blue-700 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Open Profile Settings</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isSaving || previewUrl === profile?.avatarUrl}
              onClick={handleSaveAvatar}
              className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-600/25 flex items-center gap-2 transition-all"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Save Profile Photo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
