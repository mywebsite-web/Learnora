import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Mail, 
  Copy, 
  Check, 
  ExternalLink,
  LogOut,
  ArrowRight
} from 'lucide-react';
import { ADMIN_EMAIL } from '../types';

interface SuspendedAccountModalProps {
  notice: {
    title: string;
    reason: string;
    email?: string;
    timestamp?: number;
  };
  onDismiss: () => void;
}

export const SuspendedAccountModal: React.FC<SuspendedAccountModalProps> = ({ notice, onDismiss }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(ADMIN_EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-slate-100 ring-1 ring-rose-500/20"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="suspended-title"
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-40 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col items-center text-center">
          {/* Badge Icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 shadow-lg shadow-rose-950/50">
            <ShieldAlert className="w-9 h-9 sm:w-11 sm:h-11 animate-pulse" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Access Revoked by Administrator</span>
          </div>

          <h2 id="suspended-title" className="text-xl sm:text-2xl font-bold font-serif text-white tracking-tight">
            Account Suspended
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-md leading-relaxed">
            Your Learnora account has been suspended by a platform administrator. Any active sessions on this device have been logged out.
          </p>

          {/* Account & Reason Box */}
          <div className="w-full mt-5 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-left space-y-3">
            {notice.email && (
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/80">
                <span className="text-slate-400">Target Account:</span>
                <span className="font-mono text-slate-200 font-semibold">{notice.email}</span>
              </div>
            )}

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 block mb-1">
                Reason for Suspension:
              </span>
              <p className="text-xs text-slate-200 bg-rose-950/20 border border-rose-900/30 rounded-xl p-3 leading-relaxed">
                "{notice.reason || 'Account deactivated by platform administrator for review or policy violation.'}"
              </p>
            </div>

            <div className="text-[11px] text-slate-400 leading-normal pt-1">
              While suspended, you cannot access learning workspaces, study sets, flashcards, or Nora AI tutoring.
            </div>
          </div>

          {/* Support / Appeal Contact */}
          <div className="w-full mt-4 bg-slate-800/40 border border-slate-800 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  Platform Administrator
                </div>
                <div className="text-xs font-mono text-indigo-300 truncate">
                  {ADMIN_EMAIL}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={handleCopyEmail}
                className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-slate-700"
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
                href={`mailto:${ADMIN_EMAIL}?subject=Account Suspension Appeal (${encodeURIComponent(notice.email || 'Learner')})`}
                className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Email Support</span>
              </a>
            </div>
          </div>

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={onDismiss}
            className="mt-6 w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>I Understand &bull; Return to Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};
