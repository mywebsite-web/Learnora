import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Search, 
  Filter, 
  Crown, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Trash2, 
  Edit3, 
  Plus, 
  Flame, 
  Star, 
  Clock, 
  ArrowLeft, 
  BookOpen, 
  GraduationCap, 
  Mail, 
  UserCheck, 
  UserX, 
  Sparkles,
  Sliders,
  Send,
  MoreVertical,
  Check,
  X,
  Bell,
  Volume2,
  Radio,
  MessageSquare,
  Lock,
  User,
  Wrench,
  Power,
  Eye,
  Smartphone,
  Cpu,
  Play,
  Activity,
  Wifi,
  WifiOff,
  MessageSquareWarning,
  Bug,
  BrainCircuit,
  CreditCard,
  Lightbulb,
  HelpCircle,
  Inbox,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  UserProfile, 
  ADMIN_EMAIL, 
  isAdminEmail, 
  NotificationType, 
  MaintenanceModeConfig,
  isUserOnline,
  formatLastSeen,
  UserComplaint,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus
} from '../types';
import { DBService } from '../services/dbService';
import { CommunityChatService } from '../services/communityChatService';
import { NotificationService } from '../services/notificationService';
import { MaintenanceService } from '../services/maintenanceService';
import { ComplaintService } from '../services/complaintService';
import { MaintenanceScreenModal } from './MaintenanceScreenModal';

interface AdminPanelProps {
  currentUserEmail: string | null;
  onBack: () => void;
  onOpenCommunity?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUserEmail, onBack, onOpenCommunity }) => {
  const isAuthorized = isAdminEmail(currentUserEmail);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudySets: 0,
    totalFlashcards: 0,
    proUsers: 0,
    activeUsers: 0
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<'all' | 'free' | 'pro'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'offline' | 'suspended'>('all');

  // Broadcast / Direct Live Update State
  const [showBroadcastSection, setShowBroadcastSection] = useState(true);
  const [targetAudience, setTargetAudience] = useState<'all' | 'specific'>('all');
  const [selectedRecipientUid, setSelectedRecipientUid] = useState<string>('');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<NotificationType>('announcement');
  const [broadcastPriority, setBroadcastPriority] = useState<'normal' | 'high' | 'urgent'>('high');
  const [broadcastActionUrl, setBroadcastActionUrl] = useState<'review-queue' | 'tutor' | 'weekly-run' | 'library' | 'home'>('review-queue');
  const [broadcastActionLabel, setBroadcastActionLabel] = useState('Open Review Queue');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [dispatchNativePush, setDispatchNativePush] = useState(true);
  const [pushStats, setPushStats] = useState<{ totalDevices: number; activeDevices: number; androidDevices: number; desktopDevices: number } | null>(null);
  const [recentBroadcasts, setRecentBroadcasts] = useState<Array<{ id: string; title: string; time: number; recipientName?: string }>>([]);

  // Automated Study Reminder Engine state
  const [reminderEngineStatus, setReminderEngineStatus] = useState<{
    status: string;
    intervalMinutes: number;
    lastProcessedAt: number;
    nextScheduledAt: number;
    totalMemoriesTracked: number;
    totalReminderLogs: number;
    activeSubscribers: number;
  } | null>(null);
  const [reminderLogs, setReminderLogs] = useState<any[]>([]);
  const [isTriggeringEngine, setIsTriggeringEngine] = useState(false);
  const [triggerEngineResult, setTriggerEngineResult] = useState<any | null>(null);

  // Direct User Notification Modal State
  const [directNotifyUser, setDirectNotifyUser] = useState<UserProfile | null>(null);
  const [directTitle, setDirectTitle] = useState('');
  const [directMessage, setDirectMessage] = useState('');
  const [directType, setDirectType] = useState<NotificationType>('system');
  const [directPriority, setDirectPriority] = useState<'normal' | 'high' | 'urgent'>('high');
  const [directActionUrl, setDirectActionUrl] = useState<'review-queue' | 'tutor' | 'weekly-run' | 'library' | 'home'>('tutor');
  const [directActionLabel, setDirectActionLabel] = useState('Ask Nora AI');
  const [directSenderName, setDirectSenderName] = useState('Platform Admin');
  const [isSendingDirect, setIsSendingDirect] = useState(false);

  // Modals & Action States
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deleteTargetUser, setDeleteTargetUser] = useState<UserProfile | null>(null);
  const [suspendingUser, setSuspendingUser] = useState<UserProfile | null>(null);
  const [suspensionReasonInput, setSuspensionReasonInput] = useState('Account deactivated by platform administrator for review or policy violation.');
  const [reactivatingUser, setReactivatingUser] = useState<UserProfile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Quick Bonus Points Modal
  const [pointsUser, setPointsUser] = useState<UserProfile | null>(null);
  const [bonusPointsAmount, setBonusPointsAmount] = useState(100);

  // System Broadcast Notice
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastActive, setBroadcastActive] = useState(false);

  // Platform Maintenance in Progress State
  const [maintenanceConfig, setMaintenanceConfig] = useState<MaintenanceModeConfig>(() => MaintenanceService.getLocalConfig());
  const [maintenanceTitleInput, setMaintenanceTitleInput] = useState(maintenanceConfig.title);
  const [maintenanceMessageInput, setMaintenanceMessageInput] = useState(maintenanceConfig.message);
  const [maintenanceDurationInput, setMaintenanceDurationInput] = useState(maintenanceConfig.estimatedDuration || '~30 minutes');
  const [maintenanceCategoryInput, setMaintenanceCategoryInput] = useState<MaintenanceModeConfig['reasonCategory']>(maintenanceConfig.reasonCategory || 'scheduled');
  const [showMaintenanceSection, setShowMaintenanceSection] = useState(true);
  const [showMaintenancePreview, setShowMaintenancePreview] = useState(false);
  const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false);
  const [showConfirmMaintenanceModal, setShowConfirmMaintenanceModal] = useState(false);
  const [isSavingMaintenanceConfig, setIsSavingMaintenanceConfig] = useState(false);

  // User Complaints & Help Desk state
  const [complaints, setComplaints] = useState<UserComplaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [complaintSearchQuery, setComplaintSearchQuery] = useState('');
  const [complaintFilterStatus, setComplaintFilterStatus] = useState<'all' | 'pending' | 'investigating' | 'resolved' | 'dismissed'>('all');
  const [complaintFilterCategory, setComplaintFilterCategory] = useState<'all' | ComplaintCategory>('all');
  const [complaintFilterPriority, setComplaintFilterPriority] = useState<'all' | ComplaintPriority>('all');
  const [expandedComplaintId, setExpandedComplaintId] = useState<string | null>(null);

  // Resolution Modal State
  const [selectedComplaintForResolution, setSelectedComplaintForResolution] = useState<UserComplaint | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<ComplaintStatus>('resolved');
  const [resolutionResponseText, setResolutionResponseText] = useState('');
  const [resolutionNotifyUser, setResolutionNotifyUser] = useState(true);
  const [isUpdatingComplaint, setIsUpdatingComplaint] = useState(false);

  // Active Admin View Tab
  const [activeAdminTab, setActiveAdminTab] = useState<'all' | 'complaints' | 'users' | 'broadcast' | 'maintenance'>('all');

  const loadPushStats = async () => {
    try {
      const res = await fetch('/api/push/stats');
      if (res.ok) {
        const data = await res.json();
        setPushStats(data);
      }
    } catch (_) {}
  };

  const loadReminderEngineStatus = async () => {
    try {
      const [statusRes, logsRes] = await Promise.all([
        fetch('/api/reminders/status'),
        fetch('/api/reminders/logs')
      ]);
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setReminderEngineStatus(statusData);
      }
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setReminderLogs(logsData.logs || []);
      }
    } catch (_) {}
  };

  const handleTriggerReminderEngine = async () => {
    setIsTriggeringEngine(true);
    setTriggerEngineResult(null);
    try {
      const res = await fetch('/api/reminders/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true })
      });
      const data = await res.json();
      setTriggerEngineResult(data);
      if (data.success) {
        showToast(`🚀 Reminder Engine executed! Evaluated ${data.evaluatedUsers} students, delivered ${data.deliveredCount} notifications.`);
        loadReminderEngineStatus();
      } else {
        showToast(data.error || 'Failed to execute reminder engine');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error triggering reminder engine');
    } finally {
      setIsTriggeringEngine(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      loadData();
      loadPushStats();
      loadReminderEngineStatus();

      // Silent presence polling every 15 seconds
      const presenceInterval = setInterval(() => {
        loadData(true);
      }, 15000);

      const unsubMaintenance = MaintenanceService.subscribeToMaintenance((cfg) => {
        setMaintenanceConfig(cfg);
        setMaintenanceTitleInput(cfg.title);
        setMaintenanceMessageInput(cfg.message);
        setMaintenanceDurationInput(cfg.estimatedDuration || '~30 minutes');
        setMaintenanceCategoryInput(cfg.reasonCategory || 'scheduled');
      });

      const unsubComplaints = ComplaintService.subscribeToAllComplaints((list) => {
        setComplaints(list);
        setLoadingComplaints(false);
      });

      return () => {
        clearInterval(presenceInterval);
        unsubMaintenance();
        unsubComplaints();
      };
    }
  }, [isAuthorized]);

  const handleToggleMaintenanceMode = async (forceNextState?: boolean) => {
    const nextState = forceNextState !== undefined ? forceNextState : !maintenanceConfig.isActive;
    setIsTogglingMaintenance(true);
    try {
      const updated = await MaintenanceService.setMaintenanceMode({
        isActive: nextState,
        title: maintenanceTitleInput.trim() || 'Platform Maintenance in Progress',
        message: maintenanceMessageInput.trim() || 'We are currently performing scheduled platform enhancements.',
        estimatedDuration: maintenanceDurationInput.trim() || '~30 minutes',
        reasonCategory: maintenanceCategoryInput || 'scheduled',
        startTime: nextState ? Date.now() : maintenanceConfig.startTime
      }, currentUserEmail || 'Admin');

      setMaintenanceConfig(updated);
      setShowConfirmMaintenanceModal(false);
      if (nextState) {
        showToast('🚨 Maintenance Mode ACTIVATED! All regular learners now see the Maintenance in Progress screen.');
      } else {
        showToast('✅ Maintenance Mode DEACTIVATED! All learners have full platform access restored.');
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to toggle maintenance mode.');
    } finally {
      setIsTogglingMaintenance(false);
    }
  };

  const handleSaveMaintenanceSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingMaintenanceConfig(true);
    try {
      const updated = await MaintenanceService.setMaintenanceMode({
        title: maintenanceTitleInput.trim() || 'Platform Maintenance in Progress',
        message: maintenanceMessageInput.trim() || 'We are currently performing scheduled platform enhancements.',
        estimatedDuration: maintenanceDurationInput.trim() || '~30 minutes',
        reasonCategory: maintenanceCategoryInput || 'scheduled'
      }, currentUserEmail || 'Admin');
      setMaintenanceConfig(updated);
      showToast('💾 Maintenance screen configuration saved.');
    } catch (e) {
      console.error(e);
      showToast('Failed to save maintenance settings.');
    } finally {
      setIsSavingMaintenanceConfig(false);
    }
  };

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [fetchedUsers, platformStats] = await Promise.all([
        DBService.getAllUsers(),
        DBService.getPlatformStats()
      ]);
      setUsers(fetchedUsers);
      setStats(platformStats);
    } catch (e) {
      console.error('Error loading admin data:', e);
      if (!silent) showToast('Error loading user database.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // User Actions
  const handleToggleTier = async (user: UserProfile) => {
    const nextTier: 'free' | 'pro' = (user.tier === 'pro' || user.tier === 'elite') ? 'free' : 'pro';
    try {
      await DBService.updateUserByAdmin(user.uid, { tier: nextTier });
      setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, tier: nextTier } : u));
      showToast(`Updated ${user.displayName}'s tier to ${nextTier.toUpperCase()}`);
    } catch (e) {
      console.error(e);
      showToast('Failed to update tier.');
    }
  };

  const handleOpenSuspendModal = (user: UserProfile) => {
    if (isAdminEmail(user.email)) {
      showToast('Owner administrator account cannot be suspended.');
      return;
    }
    setSuspendingUser(user);
    setSuspensionReasonInput('Account deactivated by platform administrator for review or policy violation.');
  };

  const handleConfirmSuspension = async () => {
    if (!suspendingUser) return;
    setActionLoading(true);
    const reason = suspensionReasonInput.trim() || 'Account deactivated by platform administrator.';
    try {
      await DBService.updateUserByAdmin(suspendingUser.uid, {
        status: 'suspended',
        suspensionReason: reason,
        suspendedAt: Date.now()
      });
      setUsers(prev => prev.map(u => u.uid === suspendingUser.uid ? {
        ...u,
        status: 'suspended',
        suspensionReason: reason,
        suspendedAt: Date.now()
      } : u));
      showToast(`Account for ${suspendingUser.displayName} has been suspended. The student has been logged out and notified.`);
      setSuspendingUser(null);
    } catch (e) {
      console.error(e);
      showToast('Failed to suspend account.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReactivateModal = (user: UserProfile) => {
    setReactivatingUser(user);
  };

  const handleConfirmReactivation = async () => {
    if (!reactivatingUser) return;
    setActionLoading(true);
    try {
      await DBService.updateUserByAdmin(reactivatingUser.uid, {
        status: 'active',
        suspensionReason: '',
        suspendedAt: undefined
      });
      setUsers(prev => prev.map(u => u.uid === reactivatingUser.uid ? {
        ...u,
        status: 'active',
        suspensionReason: undefined,
        suspendedAt: undefined
      } : u));
      showToast(`Account for ${reactivatingUser.displayName} has been reactivated and is now ACTIVE. They can log in.`);
      setReactivatingUser(null);
    } catch (e) {
      console.error(e);
      showToast('Failed to reactivate account.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = (user: UserProfile) => {
    if (user.status === 'suspended') {
      handleOpenReactivateModal(user);
    } else {
      handleOpenSuspendModal(user);
    }
  };

  const handleAwardPoints = async () => {
    if (!pointsUser) return;
    setActionLoading(true);
    try {
      const newPoints = (pointsUser.points || 0) + bonusPointsAmount;
      await DBService.updateUserByAdmin(pointsUser.uid, { points: newPoints });
      setUsers(prev => prev.map(u => u.uid === pointsUser.uid ? { ...u, points: newPoints } : u));
      showToast(`Awarded +${bonusPointsAmount} points to ${pointsUser.displayName}`);
      setPointsUser(null);
    } catch (e) {
      console.error(e);
      showToast('Failed to award points.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveProfileEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setActionLoading(true);
    try {
      await DBService.updateUserByAdmin(editingUser.uid, {
        displayName: editingUser.displayName,
        tutorNickname: editingUser.tutorNickname,
        educationLevel: editingUser.educationLevel,
        role: editingUser.role,
        tier: editingUser.tier,
        streakDays: Number(editingUser.streakDays) || 0,
        points: Number(editingUser.points) || 0
      });
      setUsers(prev => prev.map(u => u.uid === editingUser.uid ? editingUser : u));
      showToast(`Updated profile for ${editingUser.displayName}`);
      setEditingUser(null);
    } catch (e) {
      console.error(e);
      showToast('Failed to update profile.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTargetUser) return;
    const target = deleteTargetUser;
    setActionLoading(true);
    try {
      await DBService.deleteUserByAdmin(target.uid, target.email, target.displayName);
      CommunityChatService.setOfflinePresence(target.uid);
      if (target.email === 'alex.morgan@learnora.app' || target.displayName === 'Alex Morgan') {
        CommunityChatService.setOfflinePresence('usr_y0na13');
      }
      setUsers(prev => prev.filter(u => 
        u.uid !== target.uid && 
        (target.email ? u.email?.toLowerCase().trim() !== target.email.toLowerCase().trim() : true) &&
        (target.displayName ? u.displayName?.toLowerCase().trim() !== target.displayName.toLowerCase().trim() : true)
      ));
      showToast(`User ${target.displayName} has been permanently deleted, active sessions terminated, and removed from the system.`);
    } catch (e) {
      console.error(e);
      showToast('Failed to delete user.');
    } finally {
      setDeleteTargetUser(null);
      setActionLoading(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    setIsBroadcasting(true);
    try {
      if (targetAudience === 'specific') {
        if (!selectedRecipientUid) {
          showToast('Please select a recipient learner from the list.');
          setIsBroadcasting(false);
          return;
        }
        const target = users.find(u => u.uid === selectedRecipientUid);
        const notif = await NotificationService.sendUserLiveNotification(selectedRecipientUid, {
          title: broadcastTitle.trim(),
          message: broadcastMessage.trim(),
          type: broadcastType,
          priority: broadcastPriority,
          actionUrl: broadcastActionUrl,
          actionLabel: broadcastActionLabel,
          sender: 'Platform Admin'
        });

        setRecentBroadcasts(prev => [
          { id: notif.id, title: notif.title, time: Date.now(), recipientName: target?.displayName || 'Private Recipient' },
          ...prev
        ]);
        showToast(`🔒 Direct notification dropped to ${target?.displayName || 'selected user'}! Only they will see it.`);
      } else {
        const notif = await NotificationService.broadcastPlatformUpdate({
          title: broadcastTitle.trim(),
          message: broadcastMessage.trim(),
          type: broadcastType,
          priority: broadcastPriority,
          actionUrl: broadcastActionUrl,
          actionLabel: broadcastActionLabel,
          sender: 'Platform Admin'
        });

        setRecentBroadcasts(prev => [{ id: notif.id, title: notif.title, time: Date.now() }, ...prev]);
        showToast('🚀 Live update broadcasted! Notification dropped to all active users.');
      }

      // Dispatch Web Push / FCM Native System Push to real phone & desktop subscribers
      if (dispatchNativePush) {
        try {
          const pushRes = await fetch('/api/push/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-email': currentUserEmail || ADMIN_EMAIL
            },
            body: JSON.stringify({
              title: broadcastTitle.trim(),
              message: broadcastMessage.trim(),
              actionUrl: broadcastActionUrl,
              actionLabel: broadcastActionLabel,
              type: broadcastType,
              priority: broadcastPriority,
              targetUserId: targetAudience === 'specific' ? selectedRecipientUid : 'all',
              adminEmail: currentUserEmail || ADMIN_EMAIL
            })
          });
          const pushData = await pushRes.json();
          if (pushData.sentCount > 0) {
            showToast(`📱 Native Web Push delivered to ${pushData.sentCount} active devices!`);
          }
          loadPushStats();
        } catch (pushErr) {
          console.warn('Native push dispatch exception:', pushErr);
        }
      }

      setBroadcastTitle('');
      setBroadcastMessage('');
    } catch (err) {
      console.error(err);
      showToast('Failed to send live notification.');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleOpenDirectNotifyModal = (u: UserProfile) => {
    setDirectNotifyUser(u);
    setDirectTitle(`Notice from Platform Administrator`);
    setDirectMessage(`Hi ${u.displayName || 'Learner'}, `);
    setDirectType('system');
    setDirectPriority('high');
    setDirectActionUrl('tutor');
    setDirectActionLabel('Ask Nora AI');
    setDirectSenderName('Platform Administrator');
  };

  const handleSendDirectNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directNotifyUser || !directTitle.trim() || !directMessage.trim()) return;

    setIsSendingDirect(true);
    try {
      const notif = await NotificationService.sendUserLiveNotification(directNotifyUser.uid, {
        title: directTitle.trim(),
        message: directMessage.trim(),
        type: directType,
        priority: directPriority,
        actionUrl: directActionUrl,
        actionLabel: directActionLabel,
        sender: directSenderName.trim() || 'Platform Administrator'
      });

      // Dispatch targeted Web Push / FCM Native System Push
      try {
        await fetch('/api/push/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-email': currentUserEmail || ADMIN_EMAIL
          },
          body: JSON.stringify({
            title: directTitle.trim(),
            message: directMessage.trim(),
            actionUrl: directActionUrl,
            actionLabel: directActionLabel,
            type: directType,
            priority: directPriority,
            targetUserId: directNotifyUser.uid,
            adminEmail: currentUserEmail || ADMIN_EMAIL
          })
        });
        loadPushStats();
      } catch (pushErr) {
        console.warn('Direct native push dispatch notice:', pushErr);
      }

      setRecentBroadcasts(prev => [
        { id: notif.id, title: notif.title, time: Date.now(), recipientName: directNotifyUser.displayName || 'Direct Recipient' },
        ...prev
      ]);

      showToast(`🔒 Private text notification dropped directly to ${directNotifyUser.displayName}! Only they will see it.`);
      setDirectNotifyUser(null);
      setDirectTitle('');
      setDirectMessage('');
    } catch (err) {
      console.error('Failed to send direct notification:', err);
      showToast('Failed to send direct notification.');
    } finally {
      setIsSendingDirect(false);
    }
  };

  const handleTestDropPreview = () => {
    NotificationService.playNotificationChime();
    window.dispatchEvent(new CustomEvent('learnora_live_notification_drop', {
      detail: {
        id: 'admin_preview_' + Date.now(),
        userId: 'all',
        title: broadcastTitle.trim() || '🚀 Test Live Platform Notification',
        message: broadcastMessage.trim() || 'This notification dropped live from the top of the screen in real-time.',
        type: broadcastType,
        read: false,
        createdAt: Date.now(),
        priority: broadcastPriority,
        actionUrl: broadcastActionUrl,
        actionLabel: broadcastActionLabel,
        sender: 'Admin Preview'
      }
    }));
    showToast('✨ Test notification dropped at the top of your screen!');
  };

  const handleOpenResolutionModal = (complaint: UserComplaint) => {
    setSelectedComplaintForResolution(complaint);
    setResolutionStatus(complaint.status === 'pending' ? 'resolved' : complaint.status);
    setResolutionResponseText(complaint.adminResponse || '');
    setResolutionNotifyUser(true);
  };

  const handleSaveComplaintResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaintForResolution) return;

    setIsUpdatingComplaint(true);
    try {
      await ComplaintService.updateComplaintStatus(selectedComplaintForResolution.id, {
        status: resolutionStatus,
        adminResponse: resolutionResponseText.trim(),
        adminEmail: currentUserEmail || ADMIN_EMAIL,
        notifyUser: resolutionNotifyUser,
        targetUserId: selectedComplaintForResolution.userId,
        complaintTitle: selectedComplaintForResolution.title
      });

      showToast(`Complaint "${selectedComplaintForResolution.title}" updated to ${resolutionStatus}!`);
      setSelectedComplaintForResolution(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to update complaint status.');
    } finally {
      setIsUpdatingComplaint(false);
    }
  };

  const handleQuickResolveComplaint = async (complaint: UserComplaint) => {
    try {
      await ComplaintService.updateComplaintStatus(complaint.id, {
        status: 'resolved',
        adminResponse: 'Reviewed and resolved by platform administrator.',
        adminEmail: currentUserEmail || ADMIN_EMAIL,
        notifyUser: true,
        targetUserId: complaint.userId,
        complaintTitle: complaint.title
      });
      showToast('Complaint marked as resolved and student notified!');
    } catch (err) {
      console.error(err);
      showToast('Failed to resolve complaint.');
    }
  };

  const handleDeleteComplaint = async (complaintId: string) => {
    if (!confirm('Are you sure you want to delete this complaint record?')) return;
    try {
      await ComplaintService.deleteComplaint(complaintId);
      showToast('Complaint removed.');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete complaint.');
    }
  };

  // If user is not adedayoademola171@gmail.com, show access denied
  if (!isAuthorized) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-900 text-white min-h-[80vh]">
        <div className="max-w-md w-full bg-slate-950 border border-rose-900/50 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-5">
            <XCircle className="w-8 h-8" />
          </div>
          <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Access Restricted
          </span>
          <h2 className="text-xl font-bold font-serif mt-4 text-white">Administrator Access Required</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            This administration panel is strictly restricted to the account:
          </p>
          <div className="mt-3 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-indigo-300 select-all">
            {ADMIN_EMAIL}
          </div>
          <p className="text-[11px] text-slate-500 mt-3">
            Logged in as: <span className="text-slate-300">{currentUserEmail || 'Anonymous'}</span>
          </p>
          <button
            onClick={onBack}
            className="mt-6 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Learning Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  // Active vs Offline Presence computations
  const onlineUsers = users.filter(u => !DBService.isUserDeletedLocally(u.uid, u.email) && isUserOnline(u));
  const offlineUsers = users.filter(u => (!isUserOnline(u) || DBService.isUserDeletedLocally(u.uid, u.email)) && u.status !== 'suspended');
  const suspendedUsers = users.filter(u => u.status === 'suspended');
  const proUsers = users.filter(u => u.tier === 'pro' || u.tier === 'elite');

  // Filter users
  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      (u.displayName && u.displayName.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.tutorNickname && u.tutorNickname.toLowerCase().includes(q));

    const matchesTier = 
      filterTier === 'all' || 
      (filterTier === 'pro' && (u.tier === 'pro' || u.tier === 'elite')) ||
      (filterTier === 'free' && (!u.tier || u.tier === 'free'));

    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'online' && isUserOnline(u)) ||
      (filterStatus === 'offline' && !isUserOnline(u) && u.status !== 'suspended') ||
      (filterStatus === 'suspended' && u.status === 'suspended');

    return matchesSearch && matchesTier && matchesStatus;
  });

  // Complaints counts and filters
  const pendingComplaints = complaints.filter(c => c.status === 'pending');
  const investigatingComplaints = complaints.filter(c => c.status === 'investigating');
  const resolvedComplaints = complaints.filter(c => c.status === 'resolved');
  const dismissedComplaints = complaints.filter(c => c.status === 'dismissed');

  const filteredComplaints = complaints.filter((c: UserComplaint) => {
    if (complaintFilterStatus !== 'all' && c.status !== complaintFilterStatus) {
      return false;
    }
    if (complaintFilterCategory !== 'all' && c.category !== complaintFilterCategory) {
      return false;
    }
    if (complaintFilterPriority !== 'all' && c.priority !== complaintFilterPriority) {
      return false;
    }
    if (complaintSearchQuery.trim()) {
      const q = complaintSearchQuery.toLowerCase();
      const matches = 
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (c.userName && c.userName.toLowerCase().includes(q)) ||
        (c.userEmail && c.userEmail.toLowerCase().includes(q)) ||
        (c.relatedSetTitle && c.relatedSetTitle.toLowerCase().includes(q)) ||
        (c.adminResponse && c.adminResponse.toLowerCase().includes(q));
      if (!matches) return false;
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto w-full">
      {/* Admin Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-indigo-400" />
                  <span>Admin Console</span>
                </span>
                <span className="text-[11px] text-emerald-400 font-mono">
                  {ADMIN_EMAIL}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-serif text-white mt-1">
                Learnora User Management
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData(false)}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Users</span>
            </button>
            {onOpenCommunity && (
              <button
                onClick={onOpenCommunity}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                title="Open Community Study Lounge as Admin"
              >
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Community Lounge</span>
              </button>
            )}
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-indigo-600/30"
            >
              Exit to Student App
            </button>
          </div>
        </div>
      </header>

      {/* Maintenance Mode Active Alert Banner */}
      {maintenanceConfig.isActive && (
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 sm:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg shadow-amber-950/50 sticky top-[73px] z-20 border-b border-amber-400/30 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Wrench className="w-4 h-4 text-white animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-md">
                  Maintenance Mode Active
                </span>
                <span className="text-xs font-semibold text-amber-100 hidden sm:inline">
                  All regular learners and visitors are locked out and seeing the maintenance screen.
                </span>
              </div>
              <p className="text-[11px] text-amber-100/90 sm:hidden mt-0.5">
                Regular learners are seeing the maintenance screen.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowMaintenancePreview(true)}
              className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Screen</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleMaintenanceMode(false)}
              disabled={isTogglingMaintenance}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-amber-900 text-xs font-extrabold transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <Power className="w-3.5 h-3.5 text-amber-600" />
              <span>Deactivate Now</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 w-full space-y-6">
        {/* Feedback Toast */}
        {feedbackToast && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 rounded-xl text-xs flex items-center gap-2 animate-fade-in shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackToast}</span>
          </div>
        )}

        {/* Platform Overview Metrics (7 Key Indicators) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* 1. Total Students */}
          <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold">Total Students</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-white">
              {users.length}
            </div>
            <span className="text-[10px] text-indigo-400 mt-1 block">Registered accounts</span>
          </div>

          {/* 2. Active Users (Online Now) */}
          <div className="bg-slate-900 border border-emerald-500/40 p-3.5 sm:p-4 rounded-2xl relative overflow-hidden shadow-lg shadow-emerald-950/30">
            <div className="flex items-center justify-between text-emerald-400 mb-1">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <span>Active Users</span>
              </span>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-emerald-400 flex items-baseline gap-1.5">
              <span>{onlineUsers.length}</span>
              <span className="text-[10px] uppercase font-bold text-emerald-500 font-sans tracking-wider">ONLINE</span>
            </div>
            <span className="text-[10px] text-emerald-400/80 mt-1 block font-medium">In session / live now</span>
          </div>

          {/* 3. Offline Users */}
          <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold">Offline Users</span>
              <WifiOff className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-slate-300">
              {offlineUsers.length}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Away / Disconnected</span>
          </div>

          {/* 4. Pro Members */}
          <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold">Pro Members</span>
              <Crown className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-amber-400">
              {proUsers.length}
            </div>
            <span className="text-[10px] text-amber-500/80 mt-1 block">Premium accounts</span>
          </div>

          {/* 5. Suspended Accounts */}
          <div className="bg-slate-900 border border-rose-900/40 p-3.5 sm:p-4 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-rose-400 mb-1">
              <span className="text-xs font-semibold">Suspended</span>
              <UserX className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-rose-400">
              {suspendedUsers.length}
            </div>
            <span className="text-[10px] text-rose-400/80 mt-1 block">Deactivated accounts</span>
          </div>

          {/* 6. Study Sets */}
          <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold">Study Sets</span>
              <BookOpen className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-sky-400">
              {stats.totalStudySets}
            </div>
            <span className="text-[10px] text-sky-400/80 mt-1 block">Platform collections</span>
          </div>

          {/* 7. Student Complaints & Help Desk */}
          <button
            type="button"
            onClick={() => setActiveAdminTab(activeAdminTab === 'complaints' ? 'all' : 'complaints')}
            className={`p-3.5 sm:p-4 rounded-2xl relative overflow-hidden text-left transition-all border cursor-pointer ${
              pendingComplaints.length > 0 
                ? 'bg-gradient-to-br from-rose-950/70 via-slate-900 to-amber-950/40 border-rose-500/50 ring-2 ring-rose-500/20 shadow-lg shadow-rose-950/40' 
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-rose-400 mb-1">
              <span className="text-xs font-semibold">Complaints</span>
              <MessageSquareWarning className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-white flex items-baseline gap-1.5">
              <span>{complaints.length}</span>
              {pendingComplaints.length > 0 && (
                <span className="text-[10px] uppercase font-bold text-rose-400 font-sans tracking-wider animate-pulse">
                  {pendingComplaints.length} PENDING
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {pendingComplaints.length > 0 ? 'Click to review tickets' : 'Help desk & issues'}
            </span>
          </button>
        </div>

        {/* Navigation Tabs Bar for Admin Sections */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: 'All Controls', count: null },
            { id: 'complaints', label: 'Complaints & Help Desk', count: complaints.length, badge: pendingComplaints.length > 0 ? `${pendingComplaints.length} Pending` : null, badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
            { id: 'users', label: 'Learners Directory', count: users.length },
            { id: 'broadcast', label: 'Broadcast & Push', count: null },
            { id: 'maintenance', label: 'Maintenance Mode', count: maintenanceConfig.isActive ? 'ACTIVE' : null, badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40' }
          ].map((tab) => {
            const isActive = activeAdminTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveAdminTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== null && !tab.badge && (
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${isActive ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase tracking-wider border animate-pulse ${tab.badgeColor || 'bg-rose-500/20 text-rose-300'}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ============================================================== */}
        {/* STUDENT COMPLAINTS & HELP DESK SECTION                         */}
        {/* ============================================================== */}
        {(activeAdminTab === 'all' || activeAdminTab === 'complaints') && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-rose-950/40">
                  <MessageSquareWarning className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-white font-serif tracking-tight">
                      Student Complaints &amp; Help Desk
                    </h3>
                    {pendingComplaints.length > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        <span>{pendingComplaints.length} Needs Attention</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>All Clear</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live stream of student issues, pedagogical errors, bug reports, and admin resolution feedback.
                  </p>
                </div>
              </div>

              {/* Status Counters */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-[11px] font-semibold">
                  Total: <strong className="text-white">{complaints.length}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-300 text-[11px] font-semibold">
                  Pending: <strong>{pendingComplaints.length}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-sky-950/60 border border-sky-800/60 text-sky-300 text-[11px] font-semibold">
                  Investigating: <strong>{investigatingComplaints.length}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-[11px] font-semibold">
                  Resolved: <strong>{resolvedComplaints.length}</strong>
                </span>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 sm:p-4 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={complaintSearchQuery}
                    onChange={(e) => setComplaintSearchQuery(e.target.value)}
                    placeholder="Search complaints by keyword, student name, email, or set title..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
                  />
                  {complaintSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setComplaintSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category & Priority Selectors */}
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={complaintFilterCategory}
                    onChange={(e) => setComplaintFilterCategory(e.target.value as any)}
                    className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:border-rose-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="technical_bug">Technical Bug</option>
                    <option value="ai_tutor">Nora AI Tutor</option>
                    <option value="content_material">Study Content</option>
                    <option value="account_billing">Account &amp; Quota</option>
                    <option value="feature_request">Feature Request</option>
                    <option value="other">Other / General</option>
                  </select>

                  <select
                    value={complaintFilterPriority}
                    onChange={(e) => setComplaintFilterPriority(e.target.value as any)}
                    className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:border-rose-500"
                  >
                    <option value="all">All Priorities</option>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar text-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
                  Status:
                </span>
                {[
                  { id: 'all', label: 'All', count: complaints.length },
                  { id: 'pending', label: 'Pending', count: pendingComplaints.length, color: 'text-amber-400' },
                  { id: 'investigating', label: 'Investigating', count: investigatingComplaints.length, color: 'text-sky-400' },
                  { id: 'resolved', label: 'Resolved', count: resolvedComplaints.length, color: 'text-emerald-400' },
                  { id: 'dismissed', label: 'Closed', count: dismissedComplaints.length, color: 'text-slate-400' }
                ].map((s) => {
                  const isActive = complaintFilterStatus === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setComplaintFilterStatus(s.id as any)}
                      className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <span>{s.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isActive ? 'bg-rose-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        {s.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Complaints Cards List */}
            {loadingComplaints ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span>Loading student complaints...</span>
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div className="py-12 text-center bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                  <Inbox className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-slate-300">
                  {complaints.length === 0 ? 'No Student Complaints Filed' : 'No Complaints Match Filters'}
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {complaints.length === 0 
                    ? 'All systems operating smoothly. When students file tickets from their help menu, they will appear here live in real-time.' 
                    : 'Try clearing your search query or switching status filters.'}
                </p>
                {complaints.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setComplaintSearchQuery('');
                      setComplaintFilterStatus('all');
                      setComplaintFilterCategory('all');
                      setComplaintFilterPriority('all');
                    }}
                    className="mt-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredComplaints.map((item) => {
                  const isExpanded = expandedComplaintId === item.id;
                  const targetUser = users.find(u => u.uid === item.userId);
                  const isOnline = targetUser ? isUserOnline(targetUser) : false;

                  const getCategoryLabel = (c: ComplaintCategory) => {
                    switch (c) {
                      case 'technical_bug': return { label: 'Technical Bug', icon: Bug, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
                      case 'ai_tutor': return { label: 'Nora AI Tutor', icon: BrainCircuit, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' };
                      case 'content_material': return { label: 'Study Content', icon: BookOpen, color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' };
                      case 'account_billing': return { label: 'Account / Quota', icon: CreditCard, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
                      case 'feature_request': return { label: 'Feature Request', icon: Lightbulb, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
                      default: return { label: 'General / Other', icon: HelpCircle, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
                    }
                  };

                  const catInfo = getCategoryLabel(item.category);
                  const CatIcon = catInfo.icon;

                  return (
                    <div 
                      key={item.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 ${
                        item.status === 'pending'
                          ? 'bg-slate-950/90 border-amber-500/40 shadow-md shadow-amber-950/20'
                          : item.status === 'investigating'
                            ? 'bg-slate-950/80 border-sky-500/30'
                            : item.status === 'resolved'
                              ? 'bg-slate-950/60 border-emerald-500/30'
                              : 'bg-slate-950/40 border-slate-800/80 opacity-80'
                      }`}
                    >
                      {/* Top Meta Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Category Badge */}
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${catInfo.color}`}>
                            <CatIcon className="w-3 h-3" />
                            <span>{catInfo.label}</span>
                          </span>

                          {/* Priority Pill */}
                          {item.priority === 'high' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                              High Priority
                            </span>
                          )}
                          {item.priority === 'medium' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Medium
                            </span>
                          )}
                          {item.priority === 'low' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                              Low
                            </span>
                          )}

                          {/* Status Pill */}
                          {item.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              <Clock className="w-3 h-3" />
                              <span>Pending Review</span>
                            </span>
                          )}
                          {item.status === 'investigating' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/40">
                              <BrainCircuit className="w-3 h-3 animate-spin" />
                              <span>Under Investigation</span>
                            </span>
                          )}
                          {item.status === 'resolved' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Resolved</span>
                            </span>
                          )}
                          {item.status === 'dismissed' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                              <span>Closed</span>
                            </span>
                          )}
                        </div>

                        {/* Timestamp */}
                        <span className="text-[11px] text-slate-500 font-mono">
                          {new Date(item.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Complaint Subject / Title */}
                      <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                        {item.title}
                      </h4>

                      {/* Student Info Bar */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span className="font-semibold text-white">{item.userName || 'Learner'}</span>
                          <span className="text-slate-500 font-mono">({item.userEmail})</span>
                        </div>

                        {/* Online / Offline Presence Indicator */}
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                          <span className={`text-[11px] font-semibold ${isOnline ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {isOnline ? 'Online Now' : 'Offline'}
                          </span>
                        </div>

                        {item.relatedSetTitle && (
                          <div className="flex items-center gap-1 text-[11px] text-sky-400">
                            <BookOpen className="w-3 h-3" />
                            <span>Set: {item.relatedSetTitle}</span>
                          </div>
                        )}
                      </div>

                      {/* Complaint Description */}
                      <div className="text-xs text-slate-300 leading-relaxed p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                        <p className={isExpanded ? '' : 'line-clamp-3'}>
                          {item.description}
                        </p>
                        {item.description.length > 180 && (
                          <button
                            type="button"
                            onClick={() => setExpandedComplaintId(isExpanded ? null : item.id)}
                            className="mt-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isExpanded ? 'Show less' : 'Read full text'}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        )}
                      </div>

                      {/* Official Admin Response Card (If Already Responded) */}
                      {item.adminResponse && (
                        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-1 text-xs">
                          <div className="flex items-center justify-between text-emerald-300 font-bold text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Official Admin Response:</span>
                            </div>
                            {item.adminResponderEmail && (
                              <span className="text-[10px] text-emerald-400/80 font-mono">
                                by {item.adminResponderEmail}
                              </span>
                            )}
                          </div>
                          <p className="text-emerald-200 leading-relaxed">
                            {item.adminResponse}
                          </p>
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenResolutionModal(item)}
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-950/40 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Respond &amp; Update Status</span>
                          </button>

                          {item.status !== 'resolved' && (
                            <button
                              type="button"
                              onClick={() => handleQuickResolveComplaint(item)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                              title="Quick-mark this issue as resolved and notify student"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Quick Resolve</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {targetUser && (
                            <button
                              type="button"
                              onClick={() => {
                                handleOpenDirectNotifyModal(targetUser);
                                setDirectTitle(`Update on: ${item.title}`);
                                setDirectMessage(`Hi ${targetUser.displayName || 'Learner'}, regarding your ticket "${item.title}": `);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                              title="Send a custom direct text notification to this student"
                            >
                              <Send className="w-3 h-3 text-sky-400" />
                              <span>Direct Text</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteComplaint(item.id)}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete this complaint record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* PLATFORM MAINTENANCE IN PROGRESS ACTIVATION                   */}
        {/* ============================================================== */}
        <div className={`rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden transition-all border ${
          maintenanceConfig.isActive 
            ? 'bg-gradient-to-br from-amber-950/80 via-slate-900 to-orange-950/50 border-amber-500/50 ring-2 ring-amber-500/20' 
            : 'bg-slate-900/90 border-slate-800'
        }`}>
          {/* Ambient Corner Glow */}
          {maintenanceConfig.isActive && (
            <div className="absolute top-0 right-0 w-80 h-40 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          )}

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                maintenanceConfig.isActive
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-lg shadow-amber-950/50'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                <Wrench className={`w-6 h-6 ${maintenanceConfig.isActive ? 'animate-bounce text-amber-400' : ''}`} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white font-serif tracking-tight">
                    Platform Maintenance in Progress
                  </h3>
                  {maintenanceConfig.isActive ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      <span>Active &bull; Users Blocked</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Inactive &bull; All Services Online</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  When activated, all regular students and visitors will immediately see the full-screen <span className="text-amber-300 font-semibold">"Maintenance in Progress"</span> screen (identical to account suspension) until deactivated.
                </p>
              </div>
            </div>

            {/* Quick Master Switch Controls */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-auto">
              <button
                type="button"
                onClick={() => setShowMaintenancePreview(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                title="Preview what learners see during maintenance"
              >
                <Eye className="w-4 h-4 text-indigo-400" />
                <span>Preview Screen</span>
              </button>

              <button
                type="button"
                onClick={() => setShowConfirmMaintenanceModal(true)}
                disabled={isTogglingMaintenance}
                className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg active:scale-95 cursor-pointer disabled:opacity-60 ${
                  maintenanceConfig.isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/50'
                    : 'bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white shadow-orange-950/60'
                }`}
              >
                <Power className="w-4 h-4" />
                <span>
                  {isTogglingMaintenance 
                    ? 'Updating...' 
                    : maintenanceConfig.isActive 
                      ? 'Deactivate Maintenance' 
                      : 'Activate Maintenance'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowMaintenanceSection(prev => !prev)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-slate-800 cursor-pointer"
                title="Customize maintenance notice"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Maintenance Notice Configuration Form */}
          {showMaintenanceSection && (
            <form onSubmit={handleSaveMaintenanceSettings} className="pt-4 mt-4 border-t border-slate-800/80 space-y-3.5 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Maintenance Screen Title
                  </label>
                  <input
                    type="text"
                    value={maintenanceTitleInput}
                    onChange={(e) => setMaintenanceTitleInput(e.target.value)}
                    placeholder="Platform Maintenance in Progress"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Reason Category
                  </label>
                  <select
                    value={maintenanceCategoryInput}
                    onChange={(e) => setMaintenanceCategoryInput(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                  >
                    <option value="scheduled">Scheduled System Upgrade</option>
                    <option value="optimization">Database Optimization</option>
                    <option value="upgrade">Core AI Model Update</option>
                    <option value="emergency">Emergency Infrastructure Fix</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Message Shown to Learners
                </label>
                <textarea
                  rows={2}
                  value={maintenanceMessageInput}
                  onChange={(e) => setMaintenanceMessageInput(e.target.value)}
                  placeholder="Explain what enhancements are being made to learners..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none font-medium leading-relaxed"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="w-full sm:w-72">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Estimated Time Window
                  </label>
                  <div className="relative">
                    <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={maintenanceDurationInput}
                      onChange={(e) => setMaintenanceDurationInput(e.target.value)}
                      placeholder="e.g. ~30 minutes or Until 5:00 PM UTC"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-medium"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 sm:pt-0 self-end sm:self-auto">
                  <button
                    type="submit"
                    disabled={isSavingMaintenanceConfig}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isSavingMaintenanceConfig ? 'Saving...' : 'Save Notice Copy'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* ============================================================== */}
        {/* LIVE PLATFORM BROADCAST & NOTIFICATION DROP SECTION           */}
        {/* ============================================================== */}
        <div className="bg-slate-900/90 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white font-serif">
                    Live Platform Update Broadcast
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Real-time Drop
                  </span>
                  {pushStats && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                      <Smartphone className="w-2.5 h-2.5 text-blue-400" />
                      <span>{pushStats.activeDevices} Active {pushStats.activeDevices === 1 ? 'Device' : 'Devices'}</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sends live drop-down notifications to all active learners with chime sounds and desktop alerts.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowBroadcastSection(prev => !prev)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 self-start sm:self-auto transition-colors"
            >
              {showBroadcastSection ? 'Collapse Panel' : 'Expand Broadcast Studio'}
            </button>
          </div>

          {showBroadcastSection && (
            <form onSubmit={handleSendBroadcast} className="pt-2 space-y-4 border-t border-slate-800 animate-fade-in">
              {/* Audience Selector: All Users vs Specific User */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-950/80 border border-slate-800/90 rounded-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                    Recipient Target:
                  </span>
                  <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
                    <button
                      type="button"
                      onClick={() => setTargetAudience('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        targetAudience === 'all'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>All Learners</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetAudience('specific');
                        if (!selectedRecipientUid && users.length > 0) {
                          setSelectedRecipientUid(users[0].uid);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        targetAudience === 'specific'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-300" />
                      <span>Specific Learner (Only They See It)</span>
                    </button>
                  </div>
                </div>

                {targetAudience === 'specific' && (
                  <div className="flex items-center gap-2 flex-1 sm:max-w-md">
                    <label className="text-[11px] text-slate-400 shrink-0 font-medium">Select Learner:</label>
                    <select
                      value={selectedRecipientUid}
                      onChange={(e) => setSelectedRecipientUid(e.target.value)}
                      className="w-full bg-slate-900 border border-indigo-500/50 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400 transition-colors"
                    >
                      <option value="" disabled>Choose recipient learner...</option>
                      {users.map(u => (
                        <option key={u.uid} value={u.uid}>
                          {u.displayName || 'Learner'} ({u.email || u.uid.slice(0, 8)}) {u.tier === 'pro' ? '⭐ PRO' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Private Notification Scope Callout */}
              {targetAudience === 'specific' && (
                <div className="px-3.5 py-2.5 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex items-center gap-2.5 text-xs text-indigo-200">
                  <Lock className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    <strong>Strict Private Delivery:</strong> This notification is cryptographically targeted to{' '}
                    <strong className="text-white">
                      {users.find(u => u.uid === selectedRecipientUid)?.displayName || 'the selected learner'}
                    </strong>
                    . No other learner on the platform will receive or view this message.
                  </span>
                </div>
              )}

              {/* Quick Template Fillers */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Quick Templates:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const recipientName = targetAudience === 'specific' 
                      ? (users.find(u => u.uid === selectedRecipientUid)?.displayName || 'Learner')
                      : 'Learner';
                    setBroadcastTitle(`🧠 Review Queue Awaiting Recall`);
                    setBroadcastMessage(`Hi ${recipientName}, your spaced repetition queue has flashcards ready for recall today to halt memory decay.`);
                    setBroadcastType('spaced-review');
                    setBroadcastActionUrl('review-queue');
                    setBroadcastActionLabel('Open Review Queue');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 transition-colors"
                >
                  🧠 Spaced Review Due
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const recipientName = targetAudience === 'specific' 
                      ? (users.find(u => u.uid === selectedRecipientUid)?.displayName || 'Learner')
                      : 'Learner';
                    setBroadcastTitle(`⭐ Learnora Pro Access Activated`);
                    setBroadcastMessage(`Congratulations ${recipientName}! Your account has been upgraded to Learnora Pro. Unlimited Socratic audio tutor sessions and advanced spaced repetition are unlocked!`);
                    setBroadcastType('system');
                    setBroadcastActionUrl('tutor');
                    setBroadcastActionLabel('Try Voice Tutor');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-amber-300 transition-colors"
                >
                  ⭐ Pro Upgrade Notice
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const recipientName = targetAudience === 'specific' 
                      ? (users.find(u => u.uid === selectedRecipientUid)?.displayName || 'Learner')
                      : 'Learner';
                    setBroadcastTitle(`🤖 Nora Socratic Study Prompt`);
                    setBroadcastMessage(`Hello ${recipientName}! Nora noticed your recent study momentum. Ready for a quick 3-minute oral comprehension drill?`);
                    setBroadcastType('study-reminder');
                    setBroadcastActionUrl('tutor');
                    setBroadcastActionLabel('Talk with Nora');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-sky-300 transition-colors"
                >
                  🤖 Nora Study Prompt
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const recipientName = targetAudience === 'specific' 
                      ? (users.find(u => u.uid === selectedRecipientUid)?.displayName || 'Learner')
                      : 'Learner';
                    setBroadcastTitle(`🔥 Protect Your Study Streak!`);
                    setBroadcastMessage(`Keep the momentum going, ${recipientName}! Complete a 10-minute study sprint today to preserve your active daily streak.`);
                    setBroadcastType('streak');
                    setBroadcastActionUrl('weekly-run');
                    setBroadcastActionLabel('View Weekly Run');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-orange-300 transition-colors"
                >
                  🔥 Daily Streak Alert
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Notification Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="e.g. 🚀 Spaced Repetition Review Queue is now live!"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Category & Action view */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Category
                    </label>
                    <select
                      value={broadcastType}
                      onChange={(e) => setBroadcastType(e.target.value as NotificationType)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="announcement">📢 Announcement</option>
                      <option value="spaced-review">🧠 Spaced Review Due</option>
                      <option value="study-reminder">🤖 Study Reminder</option>
                      <option value="streak">🔥 Streak Alert</option>
                      <option value="system">⚡ System Notice</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Action View
                    </label>
                    <select
                      value={broadcastActionUrl}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setBroadcastActionUrl(val);
                        if (val === 'review-queue') setBroadcastActionLabel('Open Review Queue');
                        else if (val === 'tutor') setBroadcastActionLabel('Ask Nora AI');
                        else if (val === 'weekly-run') setBroadcastActionLabel('View Weekly Run');
                        else setBroadcastActionLabel('Open Library');
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="review-queue">Review Queue</option>
                      <option value="tutor">Nora AI Tutor</option>
                      <option value="weekly-run">Weekly Run Sprints</option>
                      <option value="library">Study Library</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Notification Body Message *
                </label>
                <textarea
                  required
                  rows={2}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="e.g. Combat memory decay! Your 1, 3, and 7-day recall queue has been updated with your recent study sets."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Real Web Push & FCM Mobile Push Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-blue-950/40 border border-blue-500/30 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/40">
                    <Smartphone className="w-5 h-5 text-blue-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">📱 Real Device Push Notification (Web Push / FCM)</span>
                      {pushStats && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {pushStats.activeDevices} Active {pushStats.activeDevices === 1 ? 'Device' : 'Devices'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Delivers native system notifications to registered phones &amp; computers even when Learnora is closed.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setDispatchNativePush(!dispatchNativePush)}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                      dispatchNativePush ? 'bg-blue-600' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                        dispatchNativePush ? 'right-1' : 'left-1'
                      }`}
                    />
                  </button>
                  <span className="text-xs font-semibold text-slate-300">
                    {dispatchNativePush ? 'Active' : 'Off'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Volume2 className="w-4 h-4 text-indigo-400" />
                  <span>
                    {targetAudience === 'specific'
                      ? `Synthesizes chime and drops from top of ${users.find(u => u.uid === selectedRecipientUid)?.displayName || 'selected user'}'s screen`
                      : 'Synthesizes Web Audio chime and drops from the top of all active user viewports'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestDropPreview}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Preview Drop On My Screen</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isBroadcasting || !broadcastTitle.trim() || !broadcastMessage.trim() || (targetAudience === 'specific' && !selectedRecipientUid)}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Send className={`w-3.5 h-3.5 ${isBroadcasting ? 'animate-pulse' : ''}`} />
                    <span>
                      {isBroadcasting
                        ? 'Delivering...'
                        : targetAudience === 'specific'
                          ? `Drop Text to ${users.find(u => u.uid === selectedRecipientUid)?.displayName || 'Selected Learner'}`
                          : 'Broadcast to All Users'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Recent Notifications Sent */}
              {recentBroadcasts.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-500 shrink-0">Recent Deliveries:</span>
                  {recentBroadcasts.slice(0, 4).map(b => (
                    <span key={b.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 shrink-0">
                      {b.recipientName ? (
                        <span className="text-amber-400 font-medium">🔒 {b.recipientName}:</span>
                      ) : (
                        <span className="text-indigo-400 font-medium">🌐 All:</span>
                      )}
                      <span className="text-slate-300 max-w-[150px] truncate">{b.title}</span>
                      <span className="text-[10px] text-slate-500">Just now</span>
                    </span>
                  ))}
                </div>
              )}
            </form>
          )}
        </div>

        {/* ============================================================== */}
        {/* AI AUTOMATED REMINDER SCHEDULER & STUDY COMPANION ENGINE       */}
        {/* ============================================================== */}
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <Cpu className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white font-serif">
                    AI Personal Study Companion &amp; Reminder Engine
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Scheduler Active (Every 10m)</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Independent server-side scheduler evaluates student learning memory, quiet hours, and inactivity before generating grounded push notifications.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={loadReminderEngineStatus}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                title="Refresh Engine Metrics"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleTriggerReminderEngine}
                disabled={isTriggeringEngine}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
              >
                {isTriggeringEngine ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>{isTriggeringEngine ? 'Evaluating...' : 'Run Engine Evaluation Now'}</span>
              </button>
            </div>
          </div>

          {/* Engine Status Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Execution Interval</span>
              <span className="text-sm font-bold text-white mt-0.5 block">Every 10 Minutes</span>
              <span className="text-[10px] text-emerald-400">Independent server background</span>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Last Processed</span>
              <span className="text-sm font-bold text-white mt-0.5 block truncate">
                {reminderEngineStatus?.lastProcessedAt 
                  ? new Date(reminderEngineStatus.lastProcessedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : 'Pending First Run'}
              </span>
              <span className="text-[10px] text-slate-400">Auto cycle</span>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Tracked Student Memories</span>
              <span className="text-sm font-bold text-indigo-400 mt-0.5 block">
                {reminderEngineStatus?.totalMemoriesTracked || 0} Profiles
              </span>
              <span className="text-[10px] text-slate-400">Persistent database state</span>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Subscribed Devices</span>
              <span className="text-sm font-bold text-emerald-400 mt-0.5 block">
                {reminderEngineStatus?.activeSubscribers || 0} Web Push / FCM
              </span>
              <span className="text-[10px] text-slate-400">Target endpoints</span>
            </div>
          </div>

          {/* Trigger Outcome Banner */}
          {triggerEngineResult && (
            <div className="p-3.5 bg-slate-950 border border-emerald-500/40 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Cycle complete:</strong> Evaluated {triggerEngineResult.evaluatedUsers} users · Delivered {triggerEngineResult.deliveredCount} notifications
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">
                  Quiet Hours: {triggerEngineResult.skippedQuietHours}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">
                  Active &lt;45m: {triggerEngineResult.skippedInactivity}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">
                  Rate-limited: {triggerEngineResult.skippedRateLimit}
                </span>
              </div>
            </div>
          )}

          {/* Recent Automated Delivery Logs */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Recent Automated Reminders Delivered</span>
              </h4>
              <span className="text-[11px] text-slate-500">
                {reminderLogs.length} logged
              </span>
            </div>

            {reminderLogs.length === 0 ? (
              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-center text-xs text-slate-500">
                No automated reminders dispatched yet. The scheduler triggers automatically every 10 minutes when students have due reviews or unfinished lessons.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {reminderLogs.slice(0, 5).map((log: any) => (
                  <div key={log.id} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold text-[10px] uppercase tracking-wider border border-indigo-500/30">
                          {log.ruleCategory?.replace('_', ' ')}
                        </span>
                        <span className="font-semibold text-slate-300">
                          {log.userEmail || log.userId}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
                      <span>Subject: <strong className="text-slate-300">{log.groundedFacts?.subject}</strong></span>
                      <span>Topic: <strong className="text-slate-300">{log.groundedFacts?.topic}</strong></span>
                      {log.groundedFacts?.weakArea && (
                        <span className="text-amber-400">Weakness: {log.groundedFacts.weakArea}</span>
                      )}
                    </div>

                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80 text-[11px]">
                      <span className="font-bold text-white block">{log.generatedTitle}</span>
                      <span className="text-slate-400">{log.generatedMessage}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* User Search & Filters Toolbar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name, email, or nickname..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Tier Filter */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => setFilterTier('all')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterTier === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Tiers
              </button>
              <button
                onClick={() => setFilterTier('free')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterTier === 'free' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Free
              </button>
              <button
                onClick={() => setFilterTier('pro')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterTier === 'pro' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Pro ⭐
              </button>
            </div>

            {/* Status & Presence Filter */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterStatus === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({users.length})
              </button>
              <button
                onClick={() => setFilterStatus('online')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  filterStatus === 'online' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-400 hover:text-emerald-300'
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Online ({onlineUsers.length})</span>
              </button>
              <button
                onClick={() => setFilterStatus('offline')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  filterStatus === 'offline' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <WifiOff className="w-3 h-3 text-slate-400" />
                <span>Offline ({offlineUsers.length})</span>
              </button>
              <button
                onClick={() => setFilterStatus('suspended')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                  filterStatus === 'suspended' 
                    ? 'bg-rose-600 text-white' 
                    : suspendedUsers.length > 0
                    ? 'text-rose-400 hover:text-rose-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserX className="w-3 h-3 text-rose-400" />
                <span>Suspended ({suspendedUsers.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-white font-serif flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Registered Accounts ({filteredUsers.length})</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              Direct live sync with Cloud Firestore
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Querying users from database...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              No users found matching the filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">User / Email</th>
                    <th className="py-3 px-4">Level & Goal</th>
                    <th className="py-3 px-4">Tier</th>
                    <th className="py-3 px-4">Presence & Status</th>
                    <th className="py-3 px-4">Stats</th>
                    <th className="py-3 px-4">Joined</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredUsers.map((u) => {
                    const isSelfAdmin = isAdminEmail(u.email);
                    const isPro = u.tier === 'pro' || u.tier === 'elite';
                    const isSuspended = u.status === 'suspended';
                    const isOnline = !DBService.isUserDeletedLocally(u.uid, u.email) && isUserOnline(u);

                    return (
                      <tr key={u.uid} className="hover:bg-slate-800/40 transition-colors">
                        {/* Name & Email with Presence Indicator */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="relative shrink-0">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-800 flex items-center justify-center font-bold text-white text-xs overflow-hidden ring-1 ring-slate-700">
                                {u.avatarUrl ? (
                                  <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  u.displayName?.[0] || 'U'
                                )}
                              </div>
                              {/* Live Presence indicator badge */}
                              {isOnline ? (
                                <span 
                                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-slate-900 flex items-center justify-center"
                                  title="Online Now (Active in session)"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                </span>
                              ) : (
                                <span 
                                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-slate-500 ring-2 ring-slate-900" 
                                  title={`Offline (Last seen: ${formatLastSeen(u.lastActiveAt || u.updatedAt)})`}
                                />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-white truncate max-w-[140px]">
                                  {u.displayName || 'Learner'}
                                </span>
                                {isSelfAdmin && (
                                  <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[9px] font-bold">
                                    OWNER ADMIN
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                                {u.email || 'No email provided'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Education Level */}
                        <td className="py-3.5 px-4">
                          <div className="text-slate-200 font-medium">{u.educationLevel || 'General'}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{u.primaryGoal || 'Study'}</div>
                        </td>

                        {/* Tier */}
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleTier(u)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
                              isPro
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                                : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                            }`}
                            title="Click to toggle Free / Pro tier"
                          >
                            <Crown className="w-3 h-3" />
                            <span>{isPro ? 'PRO TIER' : 'FREE'}</span>
                          </button>
                        </td>

                        {/* Presence & Status */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1.5 items-start">
                            {isSuspended ? (
                              <div className="flex flex-col gap-1">
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 shadow-xs">
                                  <XCircle className="w-3 h-3 text-rose-400" />
                                  <span>SUSPENDED</span>
                                </span>
                                {u.suspensionReason && (
                                  <span 
                                    className="text-[10px] text-rose-400/90 italic truncate max-w-[190px]" 
                                    title={`Reason: ${u.suspensionReason}`}
                                  >
                                    Note: {u.suspensionReason}
                                  </span>
                                )}
                              </div>
                            ) : isOnline ? (
                              <div className="flex flex-col gap-0.5 items-start">
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm shadow-emerald-950/40">
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                  </span>
                                  <span>ONLINE NOW</span>
                                </span>
                                <span className="text-[10px] text-emerald-400/90 font-medium flex items-center gap-1 mt-0.5">
                                  <Activity className="w-2.5 h-2.5 text-emerald-400" />
                                  <span>Active in session</span>
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-0.5 items-start">
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700/80 flex items-center gap-1.5">
                                  <WifiOff className="w-2.5 h-2.5 text-slate-400" />
                                  <span>OFFLINE</span>
                                </span>
                                <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Clock className="w-2.5 h-2.5 text-slate-500" />
                                  <span>Last seen: {formatLastSeen(u.lastActiveAt || u.updatedAt)}</span>
                                </span>
                              </div>
                            )}

                            {/* Direct Action Toggle Button */}
                            {isSuspended ? (
                              <button
                                type="button"
                                onClick={() => handleOpenReactivateModal(u)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-950/40 active:scale-95"
                                title="Reactivate this account and allow student to log back in"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Make Active Back</span>
                              </button>
                            ) : (
                              !isSelfAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenSuspendModal(u)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-950/70 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-600/50 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                                  title="Suspend account, force logout across devices, and notify student"
                                >
                                  <UserX className="w-3.5 h-3.5 text-rose-400" />
                                  <span>Suspend Account</span>
                                </button>
                              )
                            )}
                          </div>
                        </td>

                        {/* Stats */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3 text-[11px]">
                            <span className="flex items-center gap-1 text-amber-400" title="Points">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>{u.points || 0}</span>
                            </span>
                            <span className="flex items-center gap-1 text-orange-400" title="Streak Days">
                              <Flame className="w-3 h-3 fill-orange-400 text-orange-400" />
                              <span>{u.streakDays || 0}d</span>
                            </span>
                          </div>
                        </td>

                        {/* Joined Date */}
                        <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Recent'}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isSuspended ? (
                              <button
                                type="button"
                                onClick={() => handleOpenReactivateModal(u)}
                                className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/50 transition-colors"
                                title="Make Active Back (Reactivate Account)"
                              >
                                <UserCheck className="w-4 h-4" />
                              </button>
                            ) : (
                              !isSelfAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenSuspendModal(u)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                                  title="Suspend Account & Force Immediate Logout"
                                >
                                  <UserX className="w-4 h-4" />
                                </button>
                              )
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenDirectNotifyModal(u)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-sky-950/40 transition-colors"
                              title={`Send Private Notification Drop to ${u.displayName || 'Learner'} (Only they will see it)`}
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setPointsUser(u)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors"
                              title="Award Bonus Points"
                            >
                              <Star className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditingUser(u)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                              title="Edit User Details"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {!isSelfAdmin && (
                              <button
                                type="button"
                                onClick={() => setDeleteTargetUser(u)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                                title="Delete User and Associated Data"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl text-slate-100 relative">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold font-serif text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-indigo-400" />
              <span>Edit User: {editingUser.displayName}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">UID: {editingUser.uid}</p>

            <form onSubmit={handleSaveProfileEdit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={editingUser.displayName}
                  onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nora Tutor Nickname</label>
                <input
                  type="text"
                  value={editingUser.tutorNickname || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, tutorNickname: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Subscription Tier</label>
                  <select
                    value={editingUser.tier || 'free'}
                    onChange={(e) => setEditingUser({ ...editingUser, tier: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="free">Free Learner</option>
                    <option value="pro">Pro Member</option>
                    <option value="elite">Academic Elite</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Account Role</label>
                  <select
                    value={editingUser.role || 'student'}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="student">Student</option>
                    <option value="mentor">Peer Mentor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Study Streak (Days)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingUser.streakDays || 0}
                    onChange={(e) => setEditingUser({ ...editingUser, streakDays: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Reward Points</label>
                  <input
                    type="number"
                    min={0}
                    value={editingUser.points || 0}
                    onChange={(e) => setEditingUser({ ...editingUser, points: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Education Level</label>
                <input
                  type="text"
                  value={editingUser.educationLevel || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, educationLevel: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Award Points Modal */}
      {pointsUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl text-slate-100 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <Star className="w-6 h-6 fill-amber-400" />
            </div>
            <h3 className="font-bold text-base font-serif text-white">Award Bonus Points</h3>
            <p className="text-xs text-slate-400 mt-1">
              Grant achievement study points to <strong className="text-white">{pointsUser.displayName}</strong>
            </p>

            <div className="flex items-center justify-center gap-2 my-4">
              {[50, 100, 250, 500].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setBonusPointsAmount(amt)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    bonusPointsAmount === amt
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  +{amt}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setPointsUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAwardPoints}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                {actionLoading ? 'Awarding...' : `Add +${bonusPointsAmount} Points`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deleteTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-rose-900/60 rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl text-slate-100 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-rose-400" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Action: Permanent Account Deletion & Wipe</span>
            </div>

            <h3 className="font-bold text-xl font-serif text-white">Permanently Delete Account</h3>

            <div className="mt-3 p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Target Student:</span>
                <span className="font-semibold text-white">{deleteTargetUser.displayName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Account Email:</span>
                <span className="font-mono text-indigo-300">{deleteTargetUser.email || 'None'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">User ID (UID):</span>
                <span className="font-mono text-slate-400 text-[10px]">{deleteTargetUser.uid}</span>
              </div>
            </div>

            <div className="mt-3 p-3 bg-rose-950/30 border border-rose-900/40 rounded-xl text-xs text-rose-200/90 leading-relaxed space-y-1.5">
              <div>
                <strong>Immediate Session Eradication:</strong> If this student is currently active on any browser or mobile app, they will be <em>instantly logged out</em> with an Account Deleted notice.
              </div>
              <div>
                <strong>Data Wipe:</strong> Cloud profiles, study sets, flashcards, tutor cognitive memories, and presence records will be wiped. A permanent deletion tombstone will prevent this account from re-registering or being auto-recreated.
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTargetUser(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-rose-950/50 flex items-center gap-1.5"
              >
                {actionLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting Account...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Permanently Delete User</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend User Confirmation Modal */}
      {suspendingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-rose-900/60 rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl text-slate-100 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-4">
              <UserX className="w-6 h-6 text-rose-400" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Action: Account Suspension & Force Logout</span>
            </div>

            <h3 className="text-xl font-bold font-serif text-white">
              Suspend Student Account
            </h3>

            <div className="mt-3 p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Target Student:</span>
                <span className="font-semibold text-white">{suspendingUser.displayName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Account Email:</span>
                <span className="font-mono text-indigo-300">{suspendingUser.email}</span>
              </div>
            </div>

            <div className="mt-3 p-3 bg-rose-950/30 border border-rose-900/40 rounded-xl text-xs text-rose-200/90 leading-relaxed">
              <strong>Immediate Effect:</strong> This student will be <em>instantly logged out</em> of any active sessions across devices. When they try to access Learnora or log in, they will be notified that their account has been suspended by an administrator.
            </div>

            <div className="mt-4 space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Reason for Suspension (Visible to Student upon Logout):
              </label>
              
              {/* Common presets */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[
                  'Academic integrity review',
                  'Terms of service violation',
                  'Suspicious multiple-session activity',
                  'Administrative account review',
                  'Temporary security hold'
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSuspensionReasonInput(preset)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
                      suspensionReasonInput === preset
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                value={suspensionReasonInput}
                onChange={(e) => setSuspensionReasonInput(e.target.value)}
                placeholder="Enter specific reason for suspension..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 leading-relaxed"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSuspendingUser(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSuspension}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2 shadow-lg shadow-rose-950/50 active:scale-95"
              >
                {actionLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Suspending & Logging Out...</span>
                  </>
                ) : (
                  <>
                    <UserX className="w-4 h-4" />
                    <span>Suspend & Log Out Student</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reactivate Account Confirmation Modal */}
      {reactivatingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-emerald-900/60 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl text-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4">
              <UserCheck className="w-6 h-6 text-emerald-400" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Action: Reactivate Account</span>
            </div>

            <h3 className="text-xl font-bold font-serif text-white">
              Make Account Active Back
            </h3>

            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Are you sure you want to reactivate <strong className="text-white">{reactivatingUser.displayName}</strong> ({reactivatingUser.email})?
            </p>

            {reactivatingUser.suspensionReason && (
              <div className="mt-3 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Previous Suspension Reason:</span>
                "{reactivatingUser.suspensionReason}"
              </div>
            )}

            <div className="mt-3 p-3 bg-emerald-950/30 border border-emerald-900/40 rounded-xl text-xs text-emerald-200/90 leading-relaxed">
              <strong>Effect:</strong> The suspension flag will be cleared, and this learner will immediately be allowed to log back in, continue studying with Nora, and access all their notes and study sets.
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setReactivatingUser(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReactivation}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2 shadow-lg shadow-emerald-950/50 active:scale-95"
              >
                {actionLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Reactivating...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Reactivate & Restore Access</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Private User Notification Drop Modal */}
      {directNotifyUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-sky-500/30 rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl text-slate-100 relative my-8">
            <button
              onClick={() => setDirectNotifyUser(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
                <MessageSquare className="w-6 h-6 text-sky-400" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  <Lock className="w-3 h-3 text-amber-300" />
                  <span>Private Direct Notification</span>
                </div>
                <h3 className="text-xl font-bold font-serif text-white mt-1">
                  Message for {directNotifyUser.displayName || 'Learner'}
                </h3>
              </div>
            </div>

            {/* Recipient User Details Card */}
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-800 flex items-center justify-center font-bold text-white text-xs shrink-0 ring-1 ring-slate-700 overflow-hidden">
                  {directNotifyUser.avatarUrl ? (
                    <img src={directNotifyUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    directNotifyUser.displayName?.[0] || 'U'
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-white text-xs truncate">
                    {directNotifyUser.displayName || 'Learner'}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {directNotifyUser.email || 'No email registered'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                  directNotifyUser.tier === 'pro' || directNotifyUser.tier === 'elite'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {directNotifyUser.tier === 'pro' || directNotifyUser.tier === 'elite' ? 'PRO ⭐' : 'FREE'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {directNotifyUser.status === 'suspended' ? 'SUSPENDED' : 'ACTIVE'}
                </span>
              </div>
            </div>

            {/* Privacy Guarantee Note */}
            <div className="p-2.5 mb-4 bg-sky-950/30 border border-sky-800/40 rounded-xl text-xs text-sky-200/90 flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                <strong>Confidential delivery:</strong> This text notification will only appear on <strong>{directNotifyUser.displayName}</strong>'s screen with chime. No other users can access or view this.
              </span>
            </div>

            {/* Quick Template Chips */}
            <div className="mb-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Quick Message Templates
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setDirectTitle(`🤖 Nora Study Companion Check-in`);
                    setDirectMessage(`Hi ${directNotifyUser.displayName || 'there'}! Nora noticed your recent study momentum. Would you like a 3-minute oral comprehension drill on your newest flashcard deck?`);
                    setDirectType('study-reminder');
                    setDirectActionUrl('tutor');
                    setDirectActionLabel('Talk with Nora');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-sky-300 transition-colors"
                >
                  🤖 Study Check-in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDirectTitle(`⭐ Learnora Pro Membership Upgrade`);
                    setDirectMessage(`Congratulations ${directNotifyUser.displayName || 'there'}! You've been granted Pro access by the platform admin. Enjoy unlimited Socratic voice tutoring, deeper analytics, and priority sync.`);
                    setDirectType('system');
                    setDirectActionUrl('tutor');
                    setDirectActionLabel('Try Voice Tutor');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-amber-300 transition-colors"
                >
                  ⭐ Pro Upgrade
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDirectTitle(`🧠 Spaced Review Deck Ready`);
                    setDirectMessage(`Hello ${directNotifyUser.displayName || 'there'}, your spaced repetition schedule has cards due today. A 5-minute review halts memory decay.`);
                    setDirectType('spaced-review');
                    setDirectActionUrl('review-queue');
                    setDirectActionLabel('Review Cards');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-indigo-300 transition-colors"
                >
                  🧠 Review Due
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDirectTitle(`⚡ Notice from Platform Administrator`);
                    setDirectMessage(`Hello ${directNotifyUser.displayName || 'there'}, please review your account settings or reach out if you have any questions or feedback about your learning sets.`);
                    setDirectType('system');
                    setDirectActionUrl('home');
                    setDirectActionLabel('Open Dashboard');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 transition-colors"
                >
                  ⚡ Admin Notice
                </button>
              </div>
            </div>

            <form onSubmit={handleSendDirectNotification} className="space-y-3.5">
              {/* Title & Sender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Notification Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={directTitle}
                    onChange={(e) => setDirectTitle(e.target.value)}
                    placeholder="e.g. 🤖 Quick Study Check-in"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Sender Label
                  </label>
                  <input
                    type="text"
                    value={directSenderName}
                    onChange={(e) => setDirectSenderName(e.target.value)}
                    placeholder="e.g. Platform Administrator"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Message Body */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Message Text *
                </label>
                <textarea
                  required
                  rows={3}
                  value={directMessage}
                  onChange={(e) => setDirectMessage(e.target.value)}
                  placeholder={`Write your private message to ${directNotifyUser.displayName || 'this learner'}...`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none"
                />
              </div>

              {/* Category, Priority & Action View */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={directType}
                    onChange={(e) => setDirectType(e.target.value as NotificationType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="system">⚡ System Notice</option>
                    <option value="study-reminder">🤖 Study Reminder</option>
                    <option value="spaced-review">🧠 Spaced Review</option>
                    <option value="announcement">📢 Announcement</option>
                    <option value="streak">🔥 Streak Alert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    value={directPriority}
                    onChange={(e) => setDirectPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High (Chime)</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Action Destination
                  </label>
                  <select
                    value={directActionUrl}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setDirectActionUrl(val);
                      if (val === 'tutor') setDirectActionLabel('Ask Nora AI');
                      else if (val === 'review-queue') setDirectActionLabel('Open Review Queue');
                      else if (val === 'weekly-run') setDirectActionLabel('View Weekly Run');
                      else setDirectActionLabel('Open Dashboard');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="tutor">Nora AI Tutor</option>
                    <option value="review-queue">Review Queue</option>
                    <option value="weekly-run">Weekly Run</option>
                    <option value="home">Dashboard</option>
                  </select>
                </div>
              </div>

              {/* Live Preview Drop Banner */}
              <div className="p-3 bg-slate-950/90 border border-sky-500/20 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">
                  Drop Banner Preview (What {directNotifyUser.displayName || 'they'} will see):
                </span>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 shadow-md flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs text-white truncate">
                      {directTitle || 'Notification Title'}
                    </div>
                    <div className="text-[11px] text-slate-300 line-clamp-2 mt-0.5">
                      {directMessage || 'Message will appear here...'}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[9px] text-slate-500">From: {directSenderName}</span>
                      <span className="text-[9px] font-semibold text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-800/40">
                        {directActionLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDirectNotifyUser(null)}
                  disabled={isSendingDirect}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingDirect || !directTitle.trim() || !directMessage.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-sky-950/60 active:scale-95 disabled:opacity-50"
                >
                  {isSendingDirect ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Drop Text to {directNotifyUser.displayName || 'Learner'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM MAINTENANCE MODE ACTIVATION / DEACTIVATION */}
      {showConfirmMaintenanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                maintenanceConfig.isActive 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {maintenanceConfig.isActive ? <Check className="w-6 h-6" /> : <Wrench className="w-6 h-6 animate-bounce" />}
              </div>
              <div>
                <h3 className="font-bold text-base text-white">
                  {maintenanceConfig.isActive ? 'Deactivate Maintenance Mode?' : 'Activate Maintenance in Progress?'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {maintenanceConfig.isActive 
                    ? 'All learners will immediately have full access restored.' 
                    : 'All learners will be blocked with the Maintenance in Progress screen.'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <div className="font-semibold text-white">
                {maintenanceConfig.isActive ? 'Access Restoration Notice:' : 'Lockdown Summary:'}
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {maintenanceConfig.isActive
                  ? 'Learners currently waiting on the maintenance screen will be automatically reconnected and restored to their dashboard without needing to re-login.'
                  : 'Any active student sessions will immediately be prevented from taking quizzes or loading study sets, and will see the full-screen maintenance notice until you deactivate it.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmMaintenanceModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isTogglingMaintenance}
                onClick={() => handleToggleMaintenanceMode()}
                className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg active:scale-95 cursor-pointer disabled:opacity-60 ${
                  maintenanceConfig.isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
                    : 'bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-500 hover:to-rose-500'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>
                  {isTogglingMaintenance 
                    ? 'Updating...' 
                    : maintenanceConfig.isActive 
                      ? 'Deactivate & Restore Access' 
                      : 'Confirm & Activate Maintenance'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESOLVE / RESPOND TO STUDENT COMPLAINT */}
      {selectedComplaintForResolution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <MessageSquareWarning className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Respond to Complaint
                  </h3>
                  <p className="text-xs text-slate-400">
                    From: <strong className="text-slate-200">{selectedComplaintForResolution.userName || 'Learner'}</strong> ({selectedComplaintForResolution.userEmail})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedComplaintForResolution(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Complaint Summary Card */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">
                  {selectedComplaintForResolution.title}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {new Date(selectedComplaintForResolution.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed max-h-32 overflow-y-auto">
                {selectedComplaintForResolution.description}
              </p>
              {selectedComplaintForResolution.relatedSetTitle && (
                <div className="text-[11px] text-sky-400 pt-0.5">
                  Related Set: {selectedComplaintForResolution.relatedSetTitle}
                </div>
              )}
            </div>

            <form onSubmit={handleSaveComplaintResolution} className="space-y-4">
              {/* Target Status */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Update Ticket Status:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'pending', label: 'Pending', color: 'bg-amber-600' },
                    { id: 'investigating', label: 'Investigating', color: 'bg-sky-600' },
                    { id: 'resolved', label: 'Resolved', color: 'bg-emerald-600' },
                    { id: 'dismissed', label: 'Closed', color: 'bg-slate-700' }
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setResolutionStatus(s.id as any)}
                      className={`p-2 rounded-xl text-center text-xs font-bold transition-all border cursor-pointer ${
                        resolutionStatus === s.id
                          ? `${s.color} text-white border-white/20 shadow-md`
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Canned Replies */}
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Quick Canned Templates:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Issue investigated and resolved. We pushed a fix—thank you for reporting!',
                    'Nora AI tutor parameter updated for this topic. Please retry.',
                    'Account study set generation quota has been refreshed.',
                    'Thank you for the suggestion! We have added this to our product roadmap.'
                  ].map((template, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setResolutionResponseText(template)}
                      className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 hover:text-white transition-colors text-left cursor-pointer"
                    >
                      {template.slice(0, 36)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Official Response Text */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Official Response to Student:
                </label>
                <textarea
                  rows={3}
                  value={resolutionResponseText}
                  onChange={(e) => setResolutionResponseText(e.target.value)}
                  placeholder="Explain the solution, steps taken, or answer for the student..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              {/* Instant Notification Toggle */}
              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <input
                  type="checkbox"
                  checked={resolutionNotifyUser}
                  onChange={(e) => setResolutionNotifyUser(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                />
                <span>Drop real-time in-app chime notification &amp; system push to this student</span>
              </label>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedComplaintForResolution(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingComplaint}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isUpdatingComplaint ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Save &amp; Update Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL-SCREEN LIVE PREVIEW MODAL */}
      {showMaintenancePreview && (
        <MaintenanceScreenModal
          config={{
            ...maintenanceConfig,
            title: maintenanceTitleInput.trim() || 'Platform Maintenance in Progress',
            message: maintenanceMessageInput.trim() || 'We are currently performing scheduled platform enhancements.',
            estimatedDuration: maintenanceDurationInput.trim() || '~30 minutes',
            reasonCategory: maintenanceCategoryInput || 'scheduled'
          }}
          isPreview={true}
          onClosePreview={() => setShowMaintenancePreview(false)}
        />
      )}
    </div>
  );
};
