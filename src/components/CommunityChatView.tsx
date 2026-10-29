import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Smile, 
  Search, 
  X, 
  ShieldCheck, 
  Sparkles, 
  ArrowDown, 
  Reply, 
  Trash2, 
  BookOpen, 
  Volume2, 
  VolumeX, 
  CornerDownRight, 
  Users, 
  MessageSquare, 
  Target, 
  BrainCircuit, 
  Flame,
  CheckCircle2,
  Share2,
  Atom,
  Scale,
  Copy,
  Check,
  MoreHorizontal,
  Bell
} from 'lucide-react';
import { 
  CommunityMessage, 
  CommunityRoom, 
  CommunityRoomId, 
  StudySet, 
  isAdminEmail 
} from '../types';
import { 
  CommunityChatService, 
  COMMUNITY_ROOMS 
} from '../services/communityChatService';
import { useAuth } from '../context/AuthContext';

interface CommunityChatViewProps {
  studySets?: StudySet[];
  onOpenStudySet?: (set: StudySet) => void;
  onBack?: () => void;
}

const QUICK_REACTION_EMOJIS = ['🔥', '❤️', '👏', '💡', '🎯', '🚀'];

export const CommunityChatView: React.FC<CommunityChatViewProps> = ({
  studySets = [],
  onOpenStudySet,
  onBack
}) => {
  const { user, profile } = useAuth();

  // Active room state
  const [activeRoomId, setActiveRoomId] = useState<CommunityRoomId>('general-lounge');
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Real-time online presence state (Strictly real online users)
  const [presenceState, setPresenceState] = useState<{
    totalOnline: number;
    roomCounts: Record<CommunityRoomId, number>;
    onlineUsers: any[];
  }>({
    totalOnline: 1,
    roomCounts: {
      'general-lounge': 0,
      'exam-prep': 0,
      'study-partners': 0,
      'nora-tips': 0,
      'stem-hub': 0,
      'humanities-law': 0
    },
    onlineUsers: []
  });

  // Replying state
  const [replyingTo, setReplyingTo] = useState<CommunityMessage | null>(null);

  // Share Study Set modal
  const [showShareSetPicker, setShowShareSetPicker] = useState(false);

  // Quick Emoji Picker & Mobile Action Popover
  const [activeEmojiMenuMsgId, setActiveEmojiMenuMsgId] = useState<string | null>(null);
  const [activeActionMenuMsgId, setActiveActionMenuMsgId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // In-Chat Message Drop Notification Banner
  const [incomingDropBanner, setIncomingDropBanner] = useState<CommunityMessage | null>(null);

  // Touch Swipe-to-Reply State
  const [swipingMsgId, setSwipingMsgId] = useState<string | null>(null);
  const [swipeDistance, setSwipeDistance] = useState<number>(0);
  const touchStartRef = useRef<{ x: number; y: number; msgId: string } | null>(null);

  // Auto-scroll & scroll to bottom state
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const isUserNearBottomRef = useRef(true);

  // Channel meta
  const currentRoom = CommunityChatService.getRoom(activeRoomId);
  const currentUserIsAdmin = isAdminEmail(user?.email);

  // Subscribe to room messages
  useEffect(() => {
    const unsubscribe = CommunityChatService.subscribeToRoomMessages(activeRoomId, (msgs) => {
      setMessages(msgs);
      if (isUserNearBottomRef.current) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 80);
      }
    });

    return () => unsubscribe();
  }, [activeRoomId]);

  // Subscribe to strictly real-time online presence and heartbeat
  useEffect(() => {
    const unsubPresence = CommunityChatService.subscribeToOnlinePresence(setPresenceState);
    if (user) {
      CommunityChatService.updateUserPresence({
        uid: user.uid,
        email: user.email || '',
        displayName: profile?.displayName || user.displayName || 'Learner',
        avatarUrl: profile?.avatarUrl
      }, activeRoomId);
    }

    const interval = setInterval(() => {
      if (user) {
        CommunityChatService.updateUserPresence({
          uid: user.uid,
          email: user.email || '',
          displayName: profile?.displayName || user.displayName || 'Learner',
          avatarUrl: profile?.avatarUrl
        }, activeRoomId);
      }
    }, 30000);

    const handleUnload = () => {
      if (user?.uid) CommunityChatService.setOfflinePresence(user.uid);
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      unsubPresence();
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [activeRoomId, user?.uid, profile?.displayName, profile?.avatarUrl]);

  // In-chat live message notification drop listener (WhatsApp Heads-Up)
  useEffect(() => {
    if (!user?.uid) return;
    const unsubDrops = CommunityChatService.subscribeToAllIncomingMessages(user.uid, (newMsg) => {
      // Show drop banner if message is from another student or in another room
      setIncomingDropBanner(newMsg);
      if (soundEnabled) {
        CommunityChatService.playWhatsAppChime();
        CommunityChatService.triggerWhatsAppVibration();
      }
      CommunityChatService.showNativePhoneNotification(`💬 ${newMsg.userName} (#${CommunityChatService.getRoom(newMsg.roomId).name.split(' ')[0]})`, {
        body: newMsg.text
      });
      setTimeout(() => {
        setIncomingDropBanner(prev => (prev?.id === newMsg.id ? null : prev));
      }, 7000);
    });

    return () => unsubDrops();
  }, [user?.uid, soundEnabled]);

  // Scroll detection to show "Jump to bottom" button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isNearBottom = distanceFromBottom < 120;
    isUserNearBottomRef.current = isNearBottom;
    setShowScrollBottomBtn(!isNearBottom);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottomBtn(false);
    isUserNearBottomRef.current = true;
  };

  // Touch Swipe-to-Reply Handlers
  const handleTouchStart = (msg: CommunityMessage, e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      msgId: msg.id
    };
  };

  const handleTouchMove = (msg: CommunityMessage, e: React.TouchEvent) => {
    if (!touchStartRef.current || touchStartRef.current.msgId !== msg.id) return;
    const deltaX = e.touches[0].clientX - touchStartRef.current.x;
    const deltaY = e.touches[0].clientY - touchStartRef.current.y;
    
    // Ignore swipe if vertical scrolling is dominant
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaX) < 15) return;
    
    // Only support swiping right (drag to reply)
    if (deltaX > 0) {
      const clamped = Math.min(deltaX * 0.7, 70);
      setSwipingMsgId(msg.id);
      setSwipeDistance(clamped);
    }
  };

  const handleTouchEnd = (msg: CommunityMessage) => {
    if (swipingMsgId === msg.id) {
      if (swipeDistance >= 30) {
        setReplyingTo(msg);
        if (soundEnabled) CommunityChatService.playWhatsAppChime();
        CommunityChatService.triggerWhatsAppVibration();
      }
    }
    setSwipingMsgId(null);
    setSwipeDistance(0);
    touchStartRef.current = null;
  };

  // Send message handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText('');

    const replyData = replyingTo ? {
      messageId: replyingTo.id,
      userName: replyingTo.userName,
      textSnippet: replyingTo.text.length > 80 ? replyingTo.text.slice(0, 80) + '...' : replyingTo.text,
      isAdmin: replyingTo.isAdmin
    } : undefined;

    setReplyingTo(null);

    try {
      await CommunityChatService.sendMessage({
        roomId: activeRoomId,
        userId: user?.uid || 'guest_user',
        userEmail: user?.email || 'student@learnora.app',
        userName: profile?.displayName || user?.displayName || 'Learner',
        userAvatarUrl: profile?.avatarUrl,
        userCourse: profile?.customEducation || (typeof profile?.educationLevel === 'string' ? profile.educationLevel : 'General Studies'),
        text: textToSend,
        replyTo: replyData
      });

      if (soundEnabled) {
        CommunityChatService.playMessageChime();
      }

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } catch (err) {
      console.error('Failed to dispatch message:', err);
    }
  };

  // Toggle reaction
  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    try {
      await CommunityChatService.toggleReaction(activeRoomId, messageId, emoji, user.uid);
    } catch (err) {
      console.error(err);
    }
    setActiveEmojiMenuMsgId(null);
    setActiveActionMenuMsgId(null);
  };

  // Delete message
  const handleDeleteMessage = async (messageId: string) => {
    try {
      await CommunityChatService.deleteMessage(activeRoomId, messageId);
      setActiveActionMenuMsgId(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Copy message text
  const handleCopyText = (text: string, id: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedMsgId(id);
      setTimeout(() => setCopiedMsgId(null), 2000);
      setActiveActionMenuMsgId(null);
    } catch {}
  };

  // Share a study deck
  const handleShareStudySet = async (deck: StudySet) => {
    setShowShareSetPicker(false);
    try {
      await CommunityChatService.sendMessage({
        roomId: activeRoomId,
        userId: user?.uid || 'guest_user',
        userEmail: user?.email || 'student@learnora.app',
        userName: profile?.displayName || user?.displayName || 'Learner',
        userAvatarUrl: profile?.avatarUrl,
        userCourse: profile?.customEducation || (typeof profile?.educationLevel === 'string' ? profile.educationLevel : 'General Studies'),
        text: `📚 I just shared a study deck with the community: **${deck.title}** (${deck.subject || 'Course Material'}). Check it out for active recall practice!`,
        attachment: {
          type: 'study_set',
          title: deck.title,
          id: deck.id
        }
      });
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } catch (err) {
      console.error(err);
    }
  };

  // Filter messages by search keyword if active
  const filteredMessages = searchQuery.trim()
    ? messages.filter(m => 
        m.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.userCourse && m.userCourse.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : messages;

  // Format date headers cleanly
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateHeader = (ts: number) => {
    const date = new Date(ts);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Group messages by date
  const groupedByDate: { dateLabel: string; items: CommunityMessage[] }[] = [];
  filteredMessages.forEach((msg) => {
    const label = formatDateHeader(msg.createdAt);
    const lastGroup = groupedByDate[groupedByDate.length - 1];
    if (lastGroup && lastGroup.dateLabel === label) {
      lastGroup.items.push(msg);
    } else {
      groupedByDate.push({ dateLabel: label, items: [msg] });
    }
  });

  return (
    <div className="flex-1 min-h-0 h-full w-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans select-text relative">
      {/* ============================================================== */}
      {/* LIVE IN-CHAT MESSAGE DROP NOTIFICATION BANNER (WHATSAPP HEADS-UP) */}
      {/* ============================================================== */}
      {incomingDropBanner && (
        <div 
          className="fixed top-[max(0.6rem,env(safe-area-inset-top))] left-2.5 right-2.5 sm:left-auto sm:right-6 sm:max-w-md z-[100000] p-3.5 rounded-3xl bg-slate-900/98 dark:bg-slate-900/98 text-white shadow-2xl shadow-black/50 border border-emerald-500/50 backdrop-blur-xl animate-in slide-in-from-top-6 duration-300 transition-all select-none ring-1 ring-emerald-500/30"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0 flex-1">
              {/* WhatsApp Green Icon / Sender Avatar */}
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 font-bold overflow-hidden">
                  {incomingDropBanner.userAvatarUrl ? (
                    <img src={incomingDropBanner.userAvatarUrl} alt={incomingDropBanner.userName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-black">{incomingDropBanner.userName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                {/* Emerald WhatsApp pulse dot */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-slate-900 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                </span>
              </div>

              {/* Message Details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    WhatsApp Drop
                  </span>
                  <span className="text-xs font-black text-slate-100 truncate">
                    {incomingDropBanner.userName}
                  </span>
                  {incomingDropBanner.isAdmin && (
                    <span className="text-amber-400 font-extrabold text-[10px] inline-flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3 text-amber-400" /> (Admin)
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 font-medium">
                    • #{CommunityChatService.getRoom(incomingDropBanner.roomId).name.split(' ')[0]}
                  </span>
                </div>

                <p className="text-xs text-slate-200 font-medium line-clamp-2 mt-1 leading-snug">
                  {incomingDropBanner.text}
                </p>

                {/* Interactive Action Buttons */}
                <div className="flex items-center gap-2 mt-2 pt-1 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => {
                      setReplyingTo(incomingDropBanner);
                      setIncomingDropBanner(null);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                  >
                    <Reply className="w-3 h-3" />
                    <span>Reply</span>
                  </button>

                  {incomingDropBanner.roomId !== activeRoomId ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveRoomId(incomingDropBanner.roomId);
                        setIncomingDropBanner(null);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-[11px] font-bold border border-slate-700 transition-all cursor-pointer"
                    >
                      Switch Room
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        scrollToBottom();
                        setIncomingDropBanner(null);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-[11px] font-bold border border-slate-700 transition-all cursor-pointer"
                    >
                      View
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Dismiss X button */}
            <button
              type="button"
              onClick={() => setIncomingDropBanner(null)}
              className="w-7 h-7 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer shrink-0 transition-colors"
              title="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. TOP HEADER & ROOM SELECTOR BAR                              */}
      {/* ============================================================== */}
      <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 shrink-0 z-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          {/* Left: Active Room Info & Back */}
          <div className="flex items-center gap-2.5 min-w-0">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors shrink-0 md:hidden active:scale-95 cursor-pointer"
                title="Return to Dashboard"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              {activeRoomId === 'general-lounge' && <MessageSquare className="w-4 sm:w-5 h-4 sm:h-5" />}
              {activeRoomId === 'exam-prep' && <Target className="w-4 sm:w-5 h-4 sm:h-5" />}
              {activeRoomId === 'study-partners' && <Users className="w-4 sm:w-5 h-4 sm:h-5" />}
              {activeRoomId === 'nora-tips' && <BrainCircuit className="w-4 sm:w-5 h-4 sm:h-5" />}
              {activeRoomId === 'stem-hub' && <Atom className="w-4 sm:w-5 h-4 sm:h-5" />}
              {activeRoomId === 'humanities-law' && <Scale className="w-4 sm:w-5 h-4 sm:h-5" />}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate tracking-tight">
                  {currentRoom.name}
                </h2>
                
                {/* Live Online Presence Pill with Strictly Real Count */}
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{presenceState.totalOnline} {presenceState.totalOnline === 1 ? 'Online' : 'Online'}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-md hidden sm:block">
                {currentRoom.topic}
              </p>
            </div>
          </div>

          {/* Right: Actions (Test Drop, Search, Sound, Share Deck) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* WhatsApp Drop Notification Test on Mobile Button */}
            <button
              type="button"
              onClick={async () => {
                await CommunityChatService.requestNotificationPermission();
                CommunityChatService.triggerTestIncomingMessage(user?.uid || '', (msg) => {
                  setIncomingDropBanner(msg);
                });
              }}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/80 text-xs font-black flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
              title="Test WhatsApp drop notification on this phone with vibration and chime"
            >
              <Bell className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              <span className="hidden xs:inline">Test Drop</span>
            </button>
            {/* Search Toggle */}
            <button
              type="button"
              onClick={() => {
                setShowSearch(prev => !prev);
                if (showSearch) setSearchQuery('');
              }}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                showSearch 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="Search messages in this channel"
            >
              <Search className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            </button>

            {/* Share Deck Button */}
            {studySets.length > 0 && (
              <button
                type="button"
                onClick={() => setShowShareSetPicker(prev => !prev)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200/80 dark:border-slate-700 active:scale-95 cursor-pointer"
                title="Share a study deck into this channel"
              >
                <Share2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Share Deck</span>
              </button>
            )}

            {/* Sound Mute Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(prev => !prev)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              title={soundEnabled ? 'Mute message chimes' : 'Enable message chimes'}
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <VolumeX className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* Expandable Search Input Row */}
        {showSearch && (
          <div className="px-3 sm:px-6 pb-2.5 animate-fade-in border-t border-slate-100 dark:border-slate-800/80 pt-2 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="relative max-w-xl mx-auto">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages, student names, or topics..."
                className="w-full pl-9 pr-9 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="w-6 h-6 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 absolute right-2 top-2 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Horizontal Scrollable Room Channels Bar */}
        <div className="px-3 sm:px-6 py-1.5 border-t border-slate-100 dark:border-slate-800/60 overflow-x-auto no-scrollbar flex items-center gap-1.5 touch-pan-x bg-white dark:bg-slate-900">
          <span className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-wider shrink-0 mr-1 hidden xs:inline">
            Channels:
          </span>
          {COMMUNITY_ROOMS.map((r) => {
            const isActive = activeRoomId === r.id;
            const count = presenceState.roomCounts[r.id] || 0;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setActiveRoomId(r.id);
                  setReplyingTo(null);
                  if (showSearch) setSearchQuery('');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 active:scale-95 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>#{r.name.split(' ')[0]}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                  }`}>
                    {count}
                  </span>
                )}
                {r.badge && (
                  <span className={`px-1 py-0.2 rounded text-[9px] font-black hidden sm:inline ${
                    isActive ? 'bg-white/20 text-white' : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                  }`}>
                    {r.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. CHAT MESSAGES STREAM                                        */}
      {/* ============================================================== */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4 max-w-4xl mx-auto w-full relative touch-pan-y"
      >
        {/* Welcome Banner for the Channel */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-white dark:from-slate-900 dark:via-blue-950/20 dark:to-slate-900 border border-blue-100/80 dark:border-slate-800 text-center space-y-2 mb-4 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 font-serif">
            Welcome to #{currentRoom.name}!
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            {currentRoom.description}. Share study goals, ask questions, or swipe right on any message on mobile to reply.
          </p>
          <div className="pt-1 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-wrap">
            <span className="text-emerald-600 dark:text-emerald-400 font-black">
              🟢 {presenceState.roomCounts[activeRoomId] > 0 ? `${presenceState.roomCounts[activeRoomId]} studying in this room` : 'Active Study Room'}
            </span>
            <span>•</span>
            <span>Swipe Right to Reply on Mobile</span>
            <span>•</span>
            <span>Admin Verified</span>
          </div>
        </div>

        {/* Empty State: When search query finds no matching messages */}
        {filteredMessages.length === 0 && searchQuery.trim() && (
          <div className="py-10 text-center space-y-2 animate-fade-in">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              No messages match &ldquo;{searchQuery}&rdquo;
            </p>
            <p className="text-[11px] text-slate-400">
              Try searching for another keyword, student name, or topic.
            </p>
          </div>
        )}

        {/* Empty State: Real-time room has no messages yet (no fake seed chats) */}
        {filteredMessages.length === 0 && !searchQuery.trim() && (
          <div className="py-8 sm:py-12 text-center space-y-3 px-4 animate-fade-in">
            <div className="w-12 h-12 rounded-3xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                No messages yet in #{currentRoom.name}
              </h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                Be the first to start the discussion! Ask a study question, share an exam tip, or say hello to peers.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-2 flex-wrap max-w-md mx-auto">
              {['👋 Hello everyone!', '📚 What is everyone studying today?', '🎯 Prepping for upcoming exams!'].map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => setInputText(starter)}
                  className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-white dark:bg-slate-850 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-blue-300 transition-all active:scale-95 cursor-pointer shadow-2xs"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Groups by Date */}
        {groupedByDate.map((group) => (
          <div key={group.dateLabel} className="space-y-3">
            {/* Sticky Date Pill Separator */}
            <div className="flex items-center justify-center my-3">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shadow-2xs">
                {group.dateLabel}
              </span>
            </div>

            {/* Messages */}
            {group.items.map((msg) => {
              const isMine = msg.userId === user?.uid;
              const isAdmin = msg.isAdmin || isAdminEmail(msg.userEmail);
              const hasReactions = msg.reactions && Object.keys(msg.reactions).length > 0;
              const isSwiping = swipingMsgId === msg.id && swipeDistance > 0;
              const isActionMenuOpen = activeActionMenuMsgId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`relative flex flex-col group transition-all animate-fade-in ${
                    isMine ? 'items-end' : 'items-start'
                  }`}
                  onTouchStart={(e) => handleTouchStart(msg, e)}
                  onTouchMove={(e) => handleTouchMove(msg, e)}
                  onTouchEnd={() => handleTouchEnd(msg)}
                >
                  {/* Swipe-to-Reply Drag Reveal Badge on Mobile */}
                  {isSwiping && (
                    <div
                      className="absolute left-1 top-1/2 -translate-y-1/2 z-10 pointer-events-none transition-transform"
                      style={{
                        opacity: Math.min(swipeDistance / 35, 1),
                        transform: `scale(${Math.min(swipeDistance / 40, 1)})`
                      }}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-colors ${
                        swipeDistance >= 40 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        <Reply className="w-4 h-4" />
                      </div>
                    </div>
                  )}

                  {/* Sender Header (Name, Badge, Role) */}
                  <div className={`flex items-center gap-1.5 mb-1 px-1 text-[11px] ${
                    isMine ? 'flex-row-reverse text-right' : 'flex-row text-left'
                  }`}>
                    {/* User Avatar Circle */}
                    <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 border border-slate-300 dark:border-slate-600">
                      {msg.userAvatarUrl ? (
                        <img src={msg.userAvatarUrl} alt={msg.userName} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full text-white text-[9px] font-black flex items-center justify-center ${
                          isAdmin ? 'bg-gradient-to-tr from-amber-500 to-rose-500' : 'bg-blue-600'
                        }`}>
                          {msg.userName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {isMine ? 'You' : msg.userName}
                    </span>

                    {/* Platform Admin Verified Badge */}
                    {isAdmin && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-indigo-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 shadow-2xs">
                        <ShieldCheck className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Admin</span>
                      </span>
                    )}

                    {/* Student Course / Academic Field Tag */}
                    {!isAdmin && msg.userCourse && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-400 truncate max-w-[120px] sm:max-w-none">
                        • {msg.userCourse}
                      </span>
                    )}

                    <span className="text-[10px] text-slate-400">
                      • {formatTime(msg.createdAt)}
                    </span>

                    {/* Mobile Tap Menu Trigger Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveActionMenuMsgId(prev => (prev === msg.id ? null : msg.id));
                      }}
                      className="sm:hidden p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 active:scale-95 transition-all cursor-pointer"
                      title="Tap for reactions and reply"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Message Bubble Card */}
                  <div
                    style={{
                      transform: isSwiping ? `translateX(${swipeDistance}px)` : 'translateX(0px)',
                      transition: isSwiping ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)'
                    }}
                    onClick={() => {
                      // On mobile tap, toggle action menu
                      setActiveActionMenuMsgId(prev => (prev === msg.id ? null : msg.id));
                    }}
                    className={`relative max-w-[88%] sm:max-w-[75%] rounded-3xl p-3.5 sm:p-4 text-xs leading-relaxed shadow-sm transition-all cursor-pointer sm:cursor-default select-text ${
                      isAdmin
                        ? isMine
                          ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white border-2 border-amber-300/90 shadow-md rounded-tr-xs'
                          : 'bg-amber-50/95 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-2 border-amber-400 dark:border-amber-500 shadow-md rounded-tl-xs'
                        : isMine
                          ? 'bg-blue-600 text-white rounded-tr-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-slate-800 rounded-tl-xs'
                    }`}
                  >
                    {/* Admin Announcement Ribbon inside Message */}
                    {isAdmin && (
                      <div className={`mb-2 pb-1.5 flex items-center justify-between gap-2 border-b ${
                        isMine 
                          ? 'border-white/30 text-amber-200' 
                          : 'border-amber-300/60 dark:border-amber-500/30 text-amber-800 dark:text-amber-300'
                      }`}>
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider">
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                          <span>Platform Admin Official Note</span>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                          isMine ? 'bg-amber-400/25 text-amber-200 border border-amber-300/40' : 'bg-amber-400/20 text-amber-900 dark:text-amber-200'
                        }`}>
                          Verified
                        </span>
                      </div>
                    )}

                    {/* Quoted Reply Preview */}
                    {msg.replyTo && (
                      <div className={`mb-2.5 p-2 rounded-xl border text-[11px] space-y-0.5 flex items-start gap-1.5 ${
                        isMine 
                          ? 'bg-blue-700/60 border-blue-400/40 text-blue-100' 
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        <CornerDownRight className="w-3.5 h-3.5 shrink-0 opacity-70 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <span className="font-bold block leading-tight">
                            {msg.replyTo.userName} {msg.replyTo.isAdmin && '👑'}
                          </span>
                          <span className="truncate block opacity-90 italic">
                            &quot;{msg.replyTo.textSnippet}&quot;
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Main Message Text */}
                    <p className="whitespace-pre-wrap font-normal leading-relaxed break-words">
                      {msg.text}
                    </p>

                    {/* Shared Study Deck Interactive Card */}
                    {msg.attachment && msg.attachment.type === 'study_set' && (
                      <div className={`mt-3 p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                        isMine
                          ? 'bg-blue-700/50 border-blue-400/50 text-white'
                          : 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-950 dark:text-blue-100'
                      }`}>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isMine ? 'bg-white text-blue-700' : 'bg-blue-600 text-white'
                          }`}>
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase font-bold tracking-wider block opacity-75">
                              Shared Study Deck
                            </span>
                            <h4 className="font-bold text-xs truncate">
                              {msg.attachment.title}
                            </h4>
                          </div>
                        </div>

                        {onOpenStudySet && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const found = studySets.find(s => s.id === msg.attachment?.id);
                              if (found) onOpenStudySet(found);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                              isMine
                                ? 'bg-white text-blue-700 hover:bg-blue-50 shadow-xs'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                            }`}
                          >
                            Study Deck
                          </button>
                        )}
                      </div>
                    )}

                    {/* Desktop Hover Action Bar (Visible when mouse is hovered) */}
                    <div className={`absolute top-1.5 ${
                      isMine ? '-left-20' : '-right-20'
                    } hidden sm:group-hover:flex items-center gap-1 z-10 bg-white dark:bg-slate-800 p-1 rounded-xl shadow-md border border-slate-200 dark:border-slate-700`}>
                      {/* Reply button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReplyingTo(msg);
                        }}
                        className="p-1 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                        title="Reply to message"
                      >
                        <Reply className="w-3.5 h-3.5" />
                      </button>

                      {/* Emoji reaction button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveEmojiMenuMsgId(activeEmojiMenuMsgId === msg.id ? null : msg.id);
                        }}
                        className="p-1 rounded-lg text-slate-500 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                        title="Add reaction"
                      >
                        <Smile className="w-3.5 h-3.5" />
                      </button>

                      {/* Copy message text */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyText(msg.text, msg.id);
                        }}
                        className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                        title="Copy text"
                      >
                        {copiedMsgId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      {/* Delete button (owner or admin) */}
                      {(isMine || currentUserIsAdmin) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMessage(msg.id);
                          }}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                          title="Delete message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Floating Reaction Quick Bar for Desktop */}
                    {activeEmojiMenuMsgId === msg.id && (
                      <div className={`absolute -top-10 ${
                        isMine ? 'right-0' : 'left-0'
                      } z-30 bg-white dark:bg-slate-800 p-1 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1 animate-in zoom-in-95`}>
                        {QUICK_REACTION_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleReaction(msg.id, emoji);
                            }}
                            className="w-7 h-7 text-sm rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-125 transition-transform flex items-center justify-center cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* MOBILE INTERACTIVE ACTION POPOVER (Solves touch screen hover issue) */}
                  {isActionMenuOpen && (
                    <div 
                      className={`sm:hidden mt-1.5 p-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl space-y-2 z-20 animate-fade-in ${
                        isMine ? 'self-end' : 'self-start'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Quick 1-Tap Reaction Row */}
                      <div className="flex items-center gap-1 pb-1 border-b border-slate-100 dark:border-slate-700/80">
                        {QUICK_REACTION_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleToggleReaction(msg.id, emoji)}
                            className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-750 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-125 transition-transform flex items-center justify-center text-sm cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>

                      {/* Action Buttons: Reply, Copy, Delete */}
                      <div className="flex items-center gap-1 text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingTo(msg);
                            setActiveActionMenuMsgId(null);
                          }}
                          className="flex-1 py-1.5 px-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                        >
                          <Reply className="w-3.5 h-3.5" />
                          <span>Reply</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyText(msg.text, msg.id)}
                          className="py-1.5 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                        >
                          {copiedMsgId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedMsgId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>

                        {(isMine || currentUserIsAdmin) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="py-1.5 px-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rendered Reaction Pills */}
                  {hasReactions && (
                    <div className={`flex items-center gap-1 mt-1 flex-wrap ${
                      isMine ? 'justify-end' : 'justify-start'
                    }`}>
                      {Object.entries(msg.reactions || {}).map(([emoji, userIds]) => {
                        const hasReacted = user && userIds.includes(user.uid);
                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleToggleReaction(msg.id, emoji)}
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                              hasReacted
                                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 text-blue-800 dark:text-blue-300 shadow-2xs'
                                : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                            }`}
                          >
                            <span>{emoji}</span>
                            <span className="font-mono text-[10px]">{userIds.length}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Subtle Mobile Direct Action Links below Bubble (Never rely only on hover!) */}
                  {!isActionMenuOpen && (
                    <div className={`sm:hidden flex items-center gap-3 mt-0.5 px-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 ${
                      isMine ? 'justify-end' : 'justify-start'
                    }`}>
                      <button
                        type="button"
                        onClick={() => setReplyingTo(msg)}
                        className="hover:text-blue-600 active:scale-95 flex items-center gap-0.5 transition-colors cursor-pointer"
                      >
                        <Reply className="w-2.5 h-2.5" />
                        <span>Reply</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveActionMenuMsgId(msg.id)}
                        className="hover:text-amber-500 active:scale-95 flex items-center gap-0.5 transition-colors cursor-pointer"
                      >
                        <Smile className="w-2.5 h-2.5" />
                        <span>React</span>
                      </button>
                      {(isMine || currentUserIsAdmin) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="hover:text-rose-500 active:scale-95 flex items-center gap-0.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Jump to Latest Button */}
      {showScrollBottomBtn && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="fixed bottom-24 right-6 sm:right-10 z-30 p-2.5 rounded-full bg-blue-600 text-white shadow-xl hover:bg-blue-700 active:scale-90 transition-all flex items-center gap-1.5 text-xs font-bold animate-bounce cursor-pointer"
        >
          <ArrowDown className="w-4 h-4" />
          <span className="hidden sm:inline">Latest Messages</span>
        </button>
      )}

      {/* ============================================================== */}
      {/* 3. STICKY INPUT BAR (MOBILE OPTIMIZED, ZERO CLUTTER)           */}
      {/* ============================================================== */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200/90 dark:border-slate-800 p-2.5 sm:p-3 shrink-0 z-20 pb-[env(safe-area-inset-bottom,12px)]">
        <div className="max-w-4xl mx-auto w-full space-y-2">
          {/* Active Reply Banner */}
          {replyingTo && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 animate-fade-in">
              <div className="flex items-center gap-2 min-w-0">
                <Reply className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate">
                  Replying to <strong>{replyingTo.userName}</strong>: &quot;{replyingTo.text.slice(0, 50)}...&quot;
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="w-5 h-5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Form and Input Area */}
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            {/* Quick Share Study Set Button (Mobile + Desktop) */}
            {studySets.length > 0 && (
              <button
                type="button"
                onClick={() => setShowShareSetPicker(prev => !prev)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                title="Attach & share study set"
              >
                <BookOpen className="w-4 h-4" />
              </button>
            )}

            {/* Textarea Input */}
            <div className="flex-1 relative bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-800 focus-within:bg-white dark:focus-within:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
                maxLength={1000}
                placeholder={`Message #${currentRoom.name}... (Swipe to reply on mobile)`}
                className="w-full px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 bg-transparent resize-none focus:outline-none max-h-24 font-medium"
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/25 transition-all cursor-pointer"
              title="Send message (Enter)"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          {/* Quick Emoji Reaction Tap Bar for Mobile/Tablet */}
          <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 hidden sm:inline">
                Quick React:
              </span>
              {QUICK_REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setInputText(prev => prev ? `${prev} ${emoji}` : emoji)}
                  className="w-6 h-6 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-xs transition-transform active:scale-125 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Character counter */}
            {inputText.length > 200 && (
              <span className={`font-mono text-[10px] ${inputText.length > 900 ? 'text-rose-500 font-bold' : ''}`}>
                {inputText.length}/1000
              </span>
            )}
          </div>
        </div>
      </footer>

      {/* ============================================================== */}
      {/* 4. SHARE STUDY SET MODAL                                       */}
      {/* ============================================================== */}
      {showShareSetPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 font-serif">
                    Share a Study Deck
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Post to #{currentRoom.name} so peers can study it
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShareSetPicker(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {studySets.map((deck) => (
                <button
                  key={deck.id}
                  type="button"
                  onClick={() => handleShareStudySet(deck)}
                  className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-850 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                      {deck.subject || 'General'}
                    </span>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate mt-0.5">
                      {deck.title}
                    </h5>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 group-hover:bg-blue-600 group-hover:text-white text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors shadow-2xs">
                    Share
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
