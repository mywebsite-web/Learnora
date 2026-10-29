import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  MessageSquareWarning, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Bug, 
  BrainCircuit, 
  BookOpen, 
  CreditCard, 
  Lightbulb, 
  HelpCircle,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Inbox
} from 'lucide-react';
import { 
  UserComplaint, 
  ComplaintCategory, 
  ComplaintPriority, 
  ComplaintStatus, 
  StudySet 
} from '../types';
import { ComplaintService } from '../services/complaintService';

interface ComplaintModalProps {
  userId: string;
  userEmail: string;
  userName?: string;
  studySets?: StudySet[];
  onClose: () => void;
  initialTab?: 'submit' | 'history';
}

const CATEGORIES: Array<{
  id: ComplaintCategory;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = [
  { id: 'technical_bug', label: 'Technical Bug', desc: 'App crash, buttons not responding, visual glitches', icon: Bug, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800' },
  { id: 'ai_tutor', label: 'Nora AI Tutor', desc: 'Inaccurate answers, repetition, tutor tone or voice', icon: BrainCircuit, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800' },
  { id: 'content_material', label: 'Study Content', desc: 'Flashcard errors, note extraction, quiz questions', icon: BookOpen, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800' },
  { id: 'account_billing', label: 'Account & Quota', desc: 'Login issues, AI rate limits, Pro tier perks', icon: CreditCard, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800' },
  { id: 'feature_request', label: 'Feature Request', desc: 'Ideas and tools you would love added to Learnora', icon: Lightbulb, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800' },
  { id: 'other', label: 'Other / General', desc: 'General feedback, questions, or other concerns', icon: HelpCircle, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800' }
];

export const ComplaintModal: React.FC<ComplaintModalProps> = ({
  userId,
  userEmail,
  userName,
  studySets = [],
  onClose,
  initialTab = 'submit'
}) => {
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>(initialTab);
  const [category, setCategory] = useState<ComplaintCategory>('technical_bug');
  const [priority, setPriority] = useState<ComplaintPriority>('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [relatedSetTitle, setRelatedSetTitle] = useState('');
  const [contactEmail, setContactEmail] = useState(userEmail || '');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Complaints history state
  const [complaints, setComplaints] = useState<UserComplaint[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [expandedComplaintId, setExpandedComplaintId] = useState<string | null>(null);

  // Subscribe to real-time updates of user complaints
  useEffect(() => {
    if (!userId) return;
    const unsubscribe = ComplaintService.subscribeToUserComplaints(userId, (list) => {
      setComplaints(list);
      setLoadingHistory(false);
    });
    return () => unsubscribe();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide a subject or title for your complaint.');
      return;
    }
    if (title.trim().length < 5) {
      setError('Title must be at least 5 characters long.');
      return;
    }
    if (!description.trim() || description.trim().length < 15) {
      setError('Please provide more details (at least 15 characters) so the admin team can investigate.');
      return;
    }

    setIsSubmitting(true);
    try {
      await ComplaintService.submitComplaint({
        userId: userId || 'anonymous_student',
        userEmail: contactEmail.trim() || userEmail || 'student@learnora.app',
        userName: userName || 'Learner',
        category,
        priority,
        title: title.trim(),
        description: description.trim(),
        relatedSetTitle: relatedSetTitle.trim() || undefined
      });

      setSubmitSuccess('Your complaint has been submitted to the platform administration! You will receive updates directly in your notification center.');
      setTitle('');
      setDescription('');
      setRelatedSetTitle('');
      
      // Auto-switch to history tab after 1.5s
      setTimeout(() => {
        setSubmitSuccess(null);
        setActiveTab('history');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: ComplaintStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3 h-3" />
            <span>Under Review</span>
          </span>
        );
      case 'investigating':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            <BrainCircuit className="w-3 h-3 animate-spin" />
            <span>Investigating</span>
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Resolved</span>
          </span>
        );
      case 'dismissed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <span>Closed</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getPriorityBadge = (p: ComplaintPriority) => {
    switch (p) {
      case 'high':
        return (
          <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            High Priority
          </span>
        );
      case 'medium':
        return (
          <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            Medium
          </span>
        );
      case 'low':
        return (
          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            Low
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
              <MessageSquareWarning className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                  Student Help &amp; Complaints Desk
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400">
                  Direct to Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Report issues, pedagogical mistakes, or feature problems directly to the platform team.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold px-4 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('submit')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl transition-all border-b-2 ${
              activeTab === 'submit'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 font-bold shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Complaint</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl transition-all border-b-2 relative ${
              activeTab === 'history'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 font-bold shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>My Submitted Tickets</span>
            {complaints.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400">
                {complaints.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Submit Form */}
        {activeTab === 'submit' && (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
            {submitSuccess && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2.5 animate-fade-in shadow-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Complaint Submitted Successfully!</p>
                  <p className="mt-0.5 leading-relaxed">{submitSuccess}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Category Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                1. Select Complaint Category *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-2.5 rounded-2xl border text-left transition-all ${
                        isSelected 
                          ? 'border-rose-600 bg-rose-50/70 dark:bg-rose-950/50 ring-2 ring-rose-500/20 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`p-1.5 rounded-xl border ${cat.color} shrink-0`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-rose-700 dark:text-rose-300' : 'text-slate-900 dark:text-slate-100'}`}>
                          {cat.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                        {cat.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority Level */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                2. Urgency &amp; Impact
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'low', label: 'Low', desc: 'Minor question or visual glitch' },
                  { id: 'medium', label: 'Medium', desc: 'Disrupts study rhythm' },
                  { id: 'high', label: 'High', desc: 'Complete blocker or crash' }
                ].map((p) => {
                  const isSelected = priority === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPriority(p.id as any)}
                      className={`p-2 rounded-xl text-center border transition-all text-xs font-bold ${
                        isSelected
                          ? p.id === 'high'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : p.id === 'medium'
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                              : 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{p.label}</span>
                      <span className="block text-[10px] font-normal opacity-80 mt-0.5">{p.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                3. Complaint Title / Subject *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Flashcards flip button not working on mobile, or Nora repeated answer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  4. Explain the Complaint or Issue in Detail *
                </label>
                <span className="text-[10px] text-slate-400">
                  {description.length} characters (min 15)
                </span>
              </div>
              <textarea
                rows={4}
                required
                placeholder="Describe exactly what happened, what device or browser you are using, or what step caused the problem..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none leading-relaxed"
              ></textarea>
            </div>

            {/* Related Study Set & Email Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Related Study Set (Optional)
                </label>
                {studySets.length > 0 ? (
                  <select
                    value={relatedSetTitle}
                    onChange={(e) => setRelatedSetTitle(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="">-- None / General Platform --</option>
                    {studySets.map((s) => (
                      <option key={s.id} value={s.title}>
                        {s.title} ({s.subject})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. Molecular Genetics"
                    value={relatedSetTitle}
                    onChange={(e) => setRelatedSetTitle(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Email for Follow-up *
                </label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                <span>Monitored directly by Learnora administrators</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Submit Ticket</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: History & Status */}
        {activeTab === 'history' && (
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Your Filed Tickets ({complaints.length})
              </h4>
              <button
                type="button"
                onClick={() => setActiveTab('submit')}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
              >
                <span>+ File New Complaint</span>
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <span>Checking your submitted tickets...</span>
              </div>
            ) : complaints.length === 0 ? (
              <div className="py-12 text-center space-y-3 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Inbox className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-200">No Complaints Submitted</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    You haven&apos;t filed any complaints or bug reports. If something goes wrong while studying, submit a ticket here!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('submit')}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  Submit a Complaint
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {complaints.map((item) => {
                  const isExpanded = expandedComplaintId === item.id;
                  const categoryInfo = CATEGORIES.find(c => c.id === item.category);
                  const Icon = categoryInfo?.icon || HelpCircle;

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs space-y-2.5 transition-all"
                    >
                      <div 
                        className="flex items-start justify-between gap-3 cursor-pointer"
                        onClick={() => setExpandedComplaintId(isExpanded ? null : item.id)}
                      >
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <div className={`p-2 rounded-xl border mt-0.5 shrink-0 ${categoryInfo?.color || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                                {item.title}
                              </h5>
                              {getStatusBadge(item.status)}
                              {getPriorityBadge(item.priority)}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Filed on {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              {item.relatedSetTitle && ` • Set: ${item.relatedSetTitle}`}
                            </p>
                          </div>
                        </div>

                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>

                      {/* Complaint Description Snippet / Expanded */}
                      <p className={`text-xs text-slate-600 dark:text-slate-300 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                        {item.description}
                      </p>

                      {/* Admin Official Response Box */}
                      {item.adminResponse && (
                        <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 space-y-1">
                          <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Administrator Response &amp; Resolution</span>
                            {item.resolvedAt && (
                              <span className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400">
                                ({new Date(item.resolvedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })})
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed font-medium">
                            {item.adminResponse}
                          </p>
                        </div>
                      )}

                      {!item.adminResponse && item.status === 'pending' && (
                        <div className="text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1.5 pt-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Our admin team is currently reviewing your ticket. Updates will appear here.</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
