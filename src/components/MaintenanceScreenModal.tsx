import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Clock, 
  RefreshCw, 
  Mail, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle,
  X
} from 'lucide-react';
import { ADMIN_EMAIL, MaintenanceModeConfig } from '../types';
import { MaintenanceService } from '../services/maintenanceService';

interface MaintenanceScreenModalProps {
  config: MaintenanceModeConfig;
  isPreview?: boolean;
  onClosePreview?: () => void;
  onRefreshStatus?: () => void;
}

export const MaintenanceScreenModal: React.FC<MaintenanceScreenModalProps> = ({
  config,
  isPreview = false,
  onClosePreview,
  onRefreshStatus
}) => {
  const [copied, setCopied] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(ADMIN_EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleCheckNow = async () => {
    setIsChecking(true);
    setCheckMessage(null);
    try {
      const fresh = await MaintenanceService.getConfig();
      if (!fresh.isActive) {
        setCheckMessage('✅ Maintenance complete! Restoring access...');
        if (onRefreshStatus) onRefreshStatus();
      } else {
        setCheckMessage('⏳ System updates are still underway. Please check back shortly.');
        setTimeout(() => setCheckMessage(null), 4000);
      }
    } catch {
      setCheckMessage('⏳ Checking status... updates are still in progress.');
      setTimeout(() => setCheckMessage(null), 3000);
    } finally {
      setIsChecking(false);
    }
  };

  // Periodic background check every 15 seconds
  useEffect(() => {
    if (isPreview) return;
    const interval = setInterval(async () => {
      try {
        const fresh = await MaintenanceService.getConfig();
        if (!fresh.isActive && onRefreshStatus) {
          onRefreshStatus();
        }
      } catch {}
    }, 15000);
    return () => clearInterval(interval);
  }, [isPreview, onRefreshStatus]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in select-none">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-slate-100 ring-1 ring-amber-500/20"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="maintenance-title"
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-44 bg-gradient-to-r from-amber-500/25 via-orange-500/20 to-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* If in admin preview mode, close preview button at top right */}
        {isPreview && onClosePreview && (
          <button
            type="button"
            onClick={onClosePreview}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700 z-20 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            title="Exit preview"
          >
            <X className="w-4 h-4" />
            <span>Close Preview</span>
          </button>
        )}

        <div className="relative flex flex-col items-center text-center">
          {/* Badge Icon with glowing amber ring */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-lg shadow-amber-950/60 relative">
            <Wrench className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full ring-4 ring-slate-900 animate-ping" />
          </div>

          {/* Pill Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>System Maintenance &bull; Operations in Progress</span>
          </div>

          {/* Heading */}
          <h2 id="maintenance-title" className="text-xl sm:text-2xl font-bold font-serif text-white tracking-tight">
            {config.title || 'Platform Maintenance in Progress'}
          </h2>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-md leading-relaxed">
            {config.message || 'We are currently upgrading server systems and performing database optimizations to enhance performance.'}
          </p>

          {/* Maintenance Details Box */}
          <div className="w-full mt-5 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-left space-y-3">
            {/* Estimated Duration & Category Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Estimated Window:</span>
                <span className="text-white font-mono">{config.estimatedDuration || '~30 minutes'}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                {config.reasonCategory || 'Scheduled Upgrade'}
              </span>
            </div>

            {/* Safety & Data Guarantee */}
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold text-slate-200">Your Data is Secure:</span> All study sets, interactive notes, flashcard mastery levels, and AI memories are safely preserved.
              </div>
            </div>

            {/* Real-time status update ticker */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live status checks active</span>
              </div>
              <span className="text-[10px] text-slate-500">Auto-restores on completion</span>
            </div>
          </div>

          {/* Status check message banner if triggered */}
          {checkMessage && (
            <div className="w-full mt-3 p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-amber-300 animate-fade-in flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{checkMessage}</span>
            </div>
          )}

          {/* Support / Administrator Contact Card */}
          <div className="w-full mt-4 bg-slate-800/40 border border-slate-800 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  Platform Administrator
                </div>
                <div className="text-xs font-mono text-amber-300 truncate">
                  {ADMIN_EMAIL}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={handleCopyEmail}
                className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
                title="Copy administrator email to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Email</span>
                  </>
                )}
              </button>

              <a
                href={`mailto:${ADMIN_EMAIL}?subject=Platform Maintenance Inquiry`}
                className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Email Support</span>
              </a>
            </div>
          </div>

          {/* Action Buttons: Check Platform Status */}
          <div className="mt-5 w-full flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="button"
              disabled={isChecking}
              onClick={handleCheckNow}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-950/50 flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Checking System Status...' : 'Check Platform Status'}</span>
            </button>

            {isPreview && onClosePreview && (
              <button
                type="button"
                onClick={onClosePreview}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition-colors border border-slate-700 cursor-pointer"
              >
                Exit Preview
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
