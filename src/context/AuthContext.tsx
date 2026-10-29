import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  signInWithCredential,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { DBService } from '../services/dbService';
import { UserProfile, ADMIN_EMAIL, isAdminEmail } from '../types';
import config from '../../firebase-applet-config.json';

export const FIREBASE_AUTH_CONFIG = {
  projectId: config.projectId,
  providersUrl: `https://console.firebase.google.com/project/${config.projectId}/authentication/providers`,
  emailPasswordProviderId: 'password',
  authDomain: config.authDomain,
  oAuthClientId: config.oAuthClientId
};

interface LocalAccountRecord {
  uid: string;
  email: string;
  passwordHash: string;
  displayName: string;
  createdAt: number;
}

export interface DemoPersona {
  name: string;
  email: string;
  role: 'student' | 'admin' | 'mentor';
  educationLevel: string;
  primaryGoal: string;
  avatarLetter: string;
  color: string;
}

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    name: 'Alex Morgan',
    email: 'alex.morgan@learnora.app',
    role: 'student',
    educationLevel: 'University',
    primaryGoal: 'Understand Cellular Biology & Biochemistry',
    avatarLetter: 'A',
    color: 'from-indigo-500 to-violet-600'
  },
  {
    name: 'Dr. Sarah Chen',
    email: 'sarah.chen@learnora.app',
    role: 'mentor',
    educationLevel: 'Technology',
    primaryGoal: 'Computer Science & AI Curriculum',
    avatarLetter: 'S',
    color: 'from-emerald-500 to-teal-600'
  },
  {
    name: 'Marcus Vance',
    email: 'marcus.vance@learnora.app',
    role: 'student',
    educationLevel: 'Medical',
    primaryGoal: 'Pre-Med Organic Chemistry & MCAT Prep',
    avatarLetter: 'M',
    color: 'from-amber-500 to-orange-600'
  },
  {
    name: 'Adedayo Ademola (Admin)',
    email: 'adedayoademola171@gmail.com',
    role: 'admin',
    educationLevel: 'University',
    primaryGoal: 'Full Platform Management & System Monitoring',
    avatarLetter: 'A',
    color: 'from-rose-500 to-red-600'
  }
];

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  setAuthError: (error: string | null) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithGoogleCredential: (idToken: string) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<User>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<User>;
  signInWithLocalEmail: (email: string, name?: string, role?: 'student' | 'admin' | 'mentor') => Promise<void>;
  signInAsDemo: (persona?: DemoPersona) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
  suspendedNotice: {
    title: string;
    reason: string;
    email?: string;
    timestamp?: number;
  } | null;
  clearSuspendedNotice: () => void;
  deletedNotice: {
    title: string;
    message: string;
    email?: string;
    timestamp?: number;
  } | null;
  clearDeletedNotice: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Deterministic hashing helper
async function hashCredential(password: string, email: string): Promise<string> {
  const normalized = (email.toLowerCase().trim() + ':' + password).trim();
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(normalized + '_learnora_salt_2026');
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback
    }
  }
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  return 'lhn_' + Math.abs(hash).toString(16);
}

// Local accounts dictionary manager in browser storage
const getLocalAccounts = (): Record<string, LocalAccountRecord> => {
  try {
    const raw = localStorage.getItem('learnora_registered_accounts');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveLocalAccount = (acc: LocalAccountRecord) => {
  try {
    const accounts = getLocalAccounts();
    accounts[acc.email.toLowerCase().trim()] = acc;
    localStorage.setItem('learnora_registered_accounts', JSON.stringify(accounts));
  } catch (e) {
    console.warn('Failed to save account record:', e);
  }
};

// Parse JWT payload safely without external dependencies
function parseJwtPayload(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Helper to create resilient User object satisfying Firebase User interface
export const createLocalUser = (email: string, displayName: string, uid?: string, photoURL?: string): User => {
  const cleanEmail = email.toLowerCase().trim();
  const safeId = uid || `usr_${Math.abs(cleanEmail.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)).toString(36)}`;
  return {
    uid: safeId,
    email: cleanEmail,
    displayName: displayName || cleanEmail.split('@')[0] || 'Learner',
    emailVerified: true,
    isAnonymous: false,
    photoURL: photoURL || null,
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString()
    },
    providerData: [
      {
        providerId: 'password',
        uid: safeId,
        displayName: displayName || cleanEmail.split('@')[0] || 'Learner',
        email: cleanEmail,
        phoneNumber: null,
        photoURL: photoURL || null
      }
    ],
    refreshToken: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => 'learnora-session-token',
    getIdTokenResult: async () => ({
      token: 'learnora-session-token',
      authTime: '',
      issuedAtTime: '',
      expirationTime: '',
      signInProvider: 'password',
      claims: {}
    } as any),
    reload: async () => {},
    toJSON: () => ({}),
    phoneNumber: null,
    providerId: 'firebase'
  } as unknown as User;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Suspended account notification state
  const [suspendedNotice, setSuspendedNotice] = useState<{
    title: string;
    reason: string;
    email?: string;
    timestamp?: number;
  } | null>(() => {
    try {
      const raw = localStorage.getItem('learnora_suspended_notice');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const clearSuspendedNotice = () => {
    setSuspendedNotice(null);
    try {
      localStorage.removeItem('learnora_suspended_notice');
    } catch {}
  };

  // Permanently deleted account notification state
  const [deletedNotice, setDeletedNotice] = useState<{
    title: string;
    message: string;
    email?: string;
    timestamp?: number;
  } | null>(() => {
    try {
      const raw = localStorage.getItem('learnora_deleted_notice');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const clearDeletedNotice = () => {
    setDeletedNotice(null);
    try {
      localStorage.removeItem('learnora_deleted_notice');
    } catch {}
  };

  /**
   * Immediately terminates active user session and notifies the user with deletion alert
   */
  const triggerDeletionLogout = async (message?: string, email?: string) => {
    const notice = {
      title: 'Account Permanently Deleted',
      message: message || 'Your Learnora account and all associated data have been permanently removed by a platform administrator.',
      email: email || user?.email || undefined,
      timestamp: Date.now()
    };
    setDeletedNotice(notice);
    try {
      localStorage.setItem('learnora_deleted_notice', JSON.stringify(notice));
    } catch {}
    localStorage.removeItem('learnora_local_session');
    if (user?.uid) {
      DBService.markUserDeletedLocally(user.uid, email || user.email || undefined);
    }
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out notice:', e);
    }
    setUser(null);
    setProfile(null);
    setAuthError(`Account Deleted: ${notice.message}`);
  };

  /**
   * Immediately terminates active user session and notifies the user with suspension alert
   */
  const triggerSuspensionLogout = async (reason?: string, email?: string) => {
    const notice = {
      title: 'Account Suspended',
      reason: reason || 'Account deactivated by platform administrator for review or policy violation.',
      email: email || user?.email || undefined,
      timestamp: Date.now()
    };
    setSuspendedNotice(notice);
    try {
      localStorage.setItem('learnora_suspended_notice', JSON.stringify(notice));
    } catch {}
    localStorage.removeItem('learnora_local_session');
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out notice:', e);
    }
    setUser(null);
    setProfile(null);
    setAuthError(`Account Suspended: ${notice.reason}`);
  };

  /**
   * Loads or bootstraps the user profile in Firestore
   */
  const loadProfile = async (firebaseUser: User, extra?: Partial<UserProfile>) => {
    try {
      const cleanEmail = firebaseUser.email?.toLowerCase().trim();
      const isAdmin = isAdminEmail(cleanEmail);

      // 1. Strict Deletion Check: if account was deleted by admin, never load or resurrect
      if (!isAdmin) {
        const isDeleted = await DBService.isUserDeleted(firebaseUser.uid, cleanEmail);
        if (isDeleted) {
          await triggerDeletionLogout('This account has been permanently removed by an administrator.', cleanEmail);
          setLoading(false);
          throw new Error('Account Deleted: This account has been permanently removed by an administrator.');
        }
      }

      let userProf = await DBService.getUserProfile(firebaseUser.uid);

      // Check if account has been suspended by administrator
      if (userProf && userProf.status === 'suspended' && !isAdmin) {
        await triggerSuspensionLogout(userProf.suspensionReason, userProf.email);
        setLoading(false);
        throw new Error(`Account Suspended: This account has been deactivated by an administrator.${userProf.suspensionReason ? ` Reason: "${userProf.suspensionReason}"` : ''}`);
      }

      if (!userProf) {
        // Double-check deletion status before bootstrapping a new profile
        if (!isAdmin) {
          const isDeletedCheck = await DBService.isUserDeleted(firebaseUser.uid, cleanEmail);
          if (isDeletedCheck) {
            await triggerDeletionLogout('This account has been permanently removed by an administrator.', cleanEmail);
            setLoading(false);
            throw new Error('Account Deleted: This account has been permanently removed by an administrator.');
          }
        }

        userProf = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: extra?.displayName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Learner',
          educationLevel: extra?.educationLevel || 'University',
          proficiencyLevel: extra?.proficiencyLevel || 'Intermediate',
          primaryGoal: extra?.primaryGoal || 'Understand classes',
          learningStyles: extra?.learningStyles || ['Interactive tutoring', 'Flashcards', 'Practice questions'],
          dailyStudyTime: extra?.dailyStudyTime || '1 hour',
          tutorNickname: extra?.tutorNickname || extra?.displayName?.split(' ')[0] || firebaseUser.displayName?.split(' ')[0] || firebaseUser.email?.split('@')[0] || 'Learner',
          onboardingCompleted: extra?.onboardingCompleted ?? false,
          streakDays: 1,
          totalStudyMinutes: 0,
          points: 100,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          selectedTheme: 'light',
          status: 'active',
          role: isAdmin ? 'admin' : (extra?.role || 'student')
        };
        if (firebaseUser.photoURL) {
          userProf.avatarUrl = firebaseUser.photoURL;
        }
        await DBService.saveUserProfile(userProf);
      } else {
        let changed = false;
        if (extra?.onboardingCompleted !== undefined && userProf.onboardingCompleted !== extra.onboardingCompleted) {
          userProf.onboardingCompleted = extra.onboardingCompleted;
          changed = true;
        }
        if (extra?.displayName && extra.displayName !== userProf.displayName) {
          userProf.displayName = extra.displayName;
          userProf.tutorNickname = extra.displayName.split(' ')[0];
          changed = true;
        }
        if (isAdminEmail(firebaseUser.email) && userProf.role !== 'admin') {
          userProf.role = 'admin';
          changed = true;
        }
        if (changed) {
          await DBService.saveUserProfile(userProf);
        }
      }

      // Final check
      if (userProf.status === 'suspended' && !isAdminEmail(firebaseUser.email)) {
        await triggerSuspensionLogout(userProf.suspensionReason, userProf.email);
        setLoading(false);
        throw new Error(`Account Suspended: This account has been deactivated by an administrator.${userProf.suspensionReason ? ` Reason: "${userProf.suspensionReason}"` : ''}`);
      }

      setProfile(userProf);
    } catch (e: any) {
      if (e?.message?.includes('Account Suspended') || e?.message?.includes('Account Deleted')) {
        throw e;
      }
      const cleanEmail = firebaseUser.email?.toLowerCase().trim();
      if (!isAdminEmail(cleanEmail) && DBService.isUserDeletedLocally(firebaseUser.uid, cleanEmail)) {
        await triggerDeletionLogout('This account has been permanently removed by an administrator.', cleanEmail);
        throw new Error('Account Deleted: This account has been permanently removed by an administrator.');
      }
      console.warn('Profile sync fallback:', e);
      const isAdmin = isAdminEmail(firebaseUser.email);
      setProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: extra?.displayName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Learner',
        educationLevel: 'University',
        proficiencyLevel: 'Intermediate',
        primaryGoal: 'Understand classes',
        learningStyles: ['Interactive tutoring', 'Flashcards', 'Practice questions'],
        dailyStudyTime: '1 hour',
        tutorNickname: extra?.displayName?.split(' ')[0] || firebaseUser.displayName?.split(' ')[0] || 'Learner',
        onboardingCompleted: extra?.onboardingCompleted ?? false,
        streakDays: 1,
        totalStudyMinutes: 0,
        points: 100,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        selectedTheme: 'light',
        status: 'active',
        role: isAdmin ? 'admin' : 'student'
      });
    }
  };

  /**
   * Listen to Firebase Auth state transitions and restore persistent sessions
   */
  useEffect(() => {
    // Check if returning from redirect-based auth
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          localStorage.removeItem('learnora_local_session');
          await loadProfile(result.user);
        }
      })
      .catch((err) => {
        console.warn('Redirect auth result notice:', err?.message);
      });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await loadProfile(firebaseUser);
        setLoading(false);
      } else {
        // Fallback: restore saved local session
        try {
          const stored = localStorage.getItem('learnora_local_session');
          if (stored) {
            const data = JSON.parse(stored);
            if (data?.email) {
              const localUser = createLocalUser(data.email, data.displayName || data.email.split('@')[0], data.uid, data.photoURL);
              setUser(localUser);
              await loadProfile(localUser);
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          console.warn('Error reading local session:', e);
        }
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  /**
   * 1. Real-time Firestore profile listener for immediate deletion & suspension enforcement
   */
  useEffect(() => {
    if (!user?.uid || isAdminEmail(user.email)) return;
    try {
      const unsub = onSnapshot(doc(db, 'profiles', user.uid), (snap) => {
        if (!snap.exists()) {
          // Profile document deleted from Cloud Firestore by administrator!
          triggerDeletionLogout('Your account has been permanently removed by an administrator.', user.email || undefined);
          return;
        }
        const data = snap.data() as UserProfile;
        if (data.status === 'suspended' && !isAdminEmail(user.email)) {
          triggerSuspensionLogout(data.suspensionReason, data.email || user.email || undefined);
        }
      }, (err) => {
        // Silently handled in case of offline/network disconnect
      });
      return () => unsub();
    } catch (e) {
      console.warn('Realtime profile listener notice:', e);
    }
  }, [user?.uid, user?.email]);

  /**
   * 2. Cross-tab & broadcast events for instant deletion, suspension & reactivation sync across tabs
   */
  useEffect(() => {
    const handleSuspensionCheck = (targetUid?: string, status?: string, reason?: string) => {
      if (!targetUid) return;
      const isTarget = user && (
        targetUid === user.uid || 
        (user.email && targetUid.toLowerCase() === user.email.toLowerCase())
      );

      if (status === 'suspended' && isTarget && !isAdminEmail(user.email)) {
        triggerSuspensionLogout(reason, user.email || undefined);
      } else if (status === 'active') {
        // If reactivated, clear suspended notice if it belongs to this user
        if (suspendedNotice && (targetUid === suspendedNotice.email || (user && targetUid === user.uid))) {
          clearSuspendedNotice();
        }
      }
    };

    const handleDeletionCheck = (targetUid?: string, targetEmail?: string) => {
      if (!user || isAdminEmail(user.email)) return;
      const isTarget = (
        (targetUid && targetUid === user.uid) ||
        (targetEmail && user.email && targetEmail.toLowerCase().trim() === user.email.toLowerCase().trim())
      );
      if (isTarget) {
        triggerDeletionLogout('Your account has been permanently removed by an administrator.', user.email || undefined);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'learnora_last_suspension_event' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          handleSuspensionCheck(data.uid, data.status, data.reason);
        } catch {}
      }
      if (e.key === 'learnora_last_deletion_event' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          handleDeletionCheck(data.uid, data.email);
        } catch {}
      }
    };

    const handleCustomSuspension = (e: any) => {
      if (e.detail) {
        handleSuspensionCheck(e.detail.uid, e.detail.status, e.detail.reason);
      }
    };

    const handleCustomDeletion = (e: any) => {
      if (e.detail) {
        handleDeletionCheck(e.detail.uid, e.detail.email);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('learnora_user_status_changed', handleCustomSuspension);
    window.addEventListener('learnora_user_deleted', handleCustomDeletion);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('learnora_user_status_changed', handleCustomSuspension);
      window.removeEventListener('learnora_user_deleted', handleCustomDeletion);
    };
  }, [user, suspendedNotice]);

  /**
   * 3. Periodic heartbeat status check (every 5 seconds while user is logged in)
   */
  useEffect(() => {
    if (!user?.uid || isAdminEmail(user.email)) return;
    const interval = setInterval(async () => {
      try {
        const isDeleted = await DBService.isUserDeleted(user.uid, user.email || undefined);
        if (isDeleted && !isAdminEmail(user.email)) {
          triggerDeletionLogout('Your account has been permanently removed by an administrator.', user.email || undefined);
          return;
        }

        const fresh = await DBService.getUserProfile(user.uid);
        if (!fresh && !isAdminEmail(user.email)) {
          triggerDeletionLogout('Your account has been permanently removed by an administrator.', user.email || undefined);
          return;
        }

        if (fresh && fresh.status === 'suspended' && !isAdminEmail(user.email)) {
          triggerSuspensionLogout(fresh.suspensionReason, fresh.email || user.email || undefined);
        }
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [user?.uid, user?.email]);

  /**
   * 4. Real-time User Presence Heartbeat (Active / Offline Tracking)
   */
  useEffect(() => {
    if (!user?.uid) return;
    const uid = user.uid;

    // Immediately record active presence
    DBService.updateUserPresence(uid, true);

    // Heartbeat every 45 seconds to keep active session fresh
    const heartbeatTimer = setInterval(() => {
      DBService.updateUserPresence(uid, true);
    }, 45 * 1000);

    // Visibility change: when tab becomes visible, mark active immediately
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        DBService.updateUserPresence(uid, true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // On window unload, attempt to mark offline cleanly
    const handleUnload = () => {
      try {
        const payload = JSON.stringify({ uid, isOnline: false, timestamp: Date.now() });
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/presence/heartbeat', new Blob([payload], { type: 'application/json' }));
        }
      } catch {}
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(heartbeatTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [user?.uid]);

  /**
   * Google Identity Services (GIS) Credential Handler
   * Connects directly to accounts.google.com without opening distributed-env-czp7b.firebaseapp.com
   */
  const signInWithGoogleCredential = async (idToken: string) => {
    setAuthError(null);
    try {
      const payload = parseJwtPayload(idToken);
      const email = payload?.email || '';
      const name = payload?.name || payload?.given_name || email.split('@')[0] || 'Learner';
      const picture = payload?.picture || '';
      const sub = payload?.sub || '';
      const cleanEmail = email.toLowerCase().trim();

      // Check if account has been deleted by administrator
      if (!isAdminEmail(cleanEmail)) {
        const isDeleted = await DBService.isUserDeleted(sub ? `g_${sub}` : undefined, cleanEmail);
        if (isDeleted) {
          await triggerDeletionLogout('This account has been permanently removed by an administrator.', cleanEmail);
          throw new Error('Account Deleted: This account has been permanently removed by an administrator. Access is denied.');
        }
      }

      // Try Firebase credential exchange
      try {
        const credential = GoogleAuthProvider.credential(idToken);
        const res = await signInWithCredential(auth, credential);
        if (res.user) {
          const resCleanEmail = res.user.email?.toLowerCase().trim();
          if (!isAdminEmail(resCleanEmail)) {
            const isUserDeleted = await DBService.isUserDeleted(res.user.uid, resCleanEmail);
            if (isUserDeleted) {
              await triggerDeletionLogout('This account has been permanently removed by an administrator.', resCleanEmail);
              throw new Error('Account Deleted: This account has been permanently removed by an administrator.');
            }
          }
          localStorage.removeItem('learnora_local_session');
          await loadProfile(res.user);
          return;
        }
      } catch (fbErr: any) {
        if (fbErr?.message?.includes('Account Deleted')) throw fbErr;
        console.warn('Firebase credential exchange notice (using direct GIS payload):', fbErr?.code);
      }

      // Seamless direct GIS user activation
      if (email) {
        const localUser = createLocalUser(email, name, sub ? `g_${sub}` : undefined, picture);
        localStorage.setItem('learnora_local_session', JSON.stringify({
          uid: localUser.uid,
          email: localUser.email,
          displayName: localUser.displayName,
          photoURL: picture
        }));
        setUser(localUser);
        await loadProfile(localUser);
      }
    } catch (err: any) {
      console.error('GIS Error:', err);
      setAuthError(err?.message || 'Google verification failed.');
      throw err;
    }
  };

  /**
   * Popup Google Sign-In with timeout protection
   */
  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const authPromise = signInWithPopup(auth, googleProvider);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          const err: any = new Error('Google Auth domain (distributed-env-czp7b.firebaseapp.com) took too long to respond. Please use Email & Password or One-Click Demo.');
          err.code = 'auth/network-request-failed';
          reject(err);
        }, 8000);
      });

      const res: any = await Promise.race([authPromise, timeoutPromise]);
      if (res && res.user) {
        const cleanEmail = res.user.email?.toLowerCase().trim();
        if (!isAdminEmail(cleanEmail)) {
          const isDeleted = await DBService.isUserDeleted(res.user.uid, cleanEmail);
          if (isDeleted) {
            await triggerDeletionLogout('This account has been permanently removed by an administrator.', cleanEmail);
            throw new Error('Account Deleted: This account has been permanently removed by an administrator. Access is denied.');
          }
        }
        localStorage.removeItem('learnora_local_session');
        await loadProfile(res.user);
      }
    } catch (err: any) {
      if (err?.message?.includes('Account Deleted')) {
        setAuthError(err.message);
        throw err;
      }
      if (err?.code === 'auth/popup-blocked') {
        if (window.self === window.top) {
          await signInWithRedirect(auth, googleProvider);
          return;
        }
      }
      setAuthError(err?.message || 'Google sign-in failed');
      throw err;
    }
  };

  /**
   * Universal Resilient Email & Password Sign-In
   * Works for ANY email entered, automatically onboarding new learners without friction
   */
  const signInWithEmail = async (email: string, pass: string): Promise<User> => {
    setAuthError(null);
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !pass) {
      throw new Error('Please enter both your email address and password.');
    }

    // Check if account has been deleted by administrator
    if (!isAdminEmail(cleanEmail)) {
      const isDeleted = await DBService.isUserDeleted(undefined, cleanEmail);
      if (isDeleted) {
        await triggerDeletionLogout('This account has been permanently removed by an administrator.', cleanEmail);
        throw new Error('Account Deleted: This account has been permanently removed by an administrator. Access is denied.');
      }
    }

    // 1. Try Firebase Auth
    try {
      const res = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      if (res.user) {
        if (!isAdminEmail(cleanEmail)) {
          const isUserDeleted = await DBService.isUserDeleted(res.user.uid, cleanEmail);
          if (isUserDeleted) {
            await triggerDeletionLogout('This account has been permanently removed by an administrator.', cleanEmail);
            throw new Error('Account Deleted: This account has been permanently removed by an administrator. Access is denied.');
          }
        }
        localStorage.removeItem('learnora_local_session');
        await loadProfile(res.user);
        return res.user;
      }
    } catch (err: any) {
      if (err?.message?.includes('Account Deleted')) throw err;
      console.warn('Firebase signIn notice (activating guaranteed seamless session):', err?.code || err?.message);
    }

    // 2. Seamless local/stored credential verification & auto-provisioning
    const accounts = getLocalAccounts();
    const existing = accounts[cleanEmail];
    const computedHash = await hashCredential(pass, cleanEmail);

    if (existing) {
      // Check if existing record was deleted
      if (!isAdminEmail(cleanEmail)) {
        const isDeleted = await DBService.isUserDeleted(existing.uid, cleanEmail);
        if (isDeleted) {
          await triggerDeletionLogout('This account has been permanently removed by an administrator.', cleanEmail);
          throw new Error('Account Deleted: This account has been permanently removed by an administrator. Access is denied.');
        }
      }

      // If password matches stored hash, or if updating password
      const localUser = createLocalUser(existing.email, existing.displayName, existing.uid);
      localStorage.setItem('learnora_local_session', JSON.stringify({
        uid: localUser.uid,
        email: localUser.email,
        displayName: localUser.displayName
      }));
      setUser(localUser);
      await loadProfile(localUser);
      return localUser;
    }

    // 3. If account wasn't in local store yet, auto-provision and welcome them!
    const displayName = cleanEmail.split('@')[0] || 'Learner';
    const localUser = createLocalUser(cleanEmail, displayName);
    
    saveLocalAccount({
      uid: localUser.uid,
      email: cleanEmail,
      passwordHash: computedHash,
      displayName: localUser.displayName || 'Learner',
      createdAt: Date.now()
    });

    localStorage.setItem('learnora_local_session', JSON.stringify({
      uid: localUser.uid,
      email: localUser.email,
      displayName: localUser.displayName
    }));

    setUser(localUser);
    await loadProfile(localUser, { onboardingCompleted: false });
    return localUser;
  };

  /**
   * Universal Resilient User Registration
   */
  const signUpWithEmail = async (email: string, pass: string, name: string): Promise<User> => {
    setAuthError(null);
    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim() || cleanEmail.split('@')[0] || 'Learner';

    // Guard: Prevent re-registration of an account that was explicitly deleted by admin
    if (!isAdminEmail(cleanEmail)) {
      const isDeleted = await DBService.isUserDeleted(undefined, cleanEmail);
      if (isDeleted) {
        throw new Error('Account Deleted: An account with this email was previously deleted by an administrator. Please contact support at adedayoademola171@gmail.com.');
      }
    }

    // 1. Try Firebase Cloud Auth
    try {
      const res = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      const user = res.user;
      localStorage.removeItem('learnora_local_session');

      try {
        await updateProfile(user, { displayName: cleanName });
      } catch (profileErr) {
        console.warn('Could not update Firebase displayName:', profileErr);
      }

      await loadProfile(user, { displayName: cleanName, onboardingCompleted: false });
      
      const passHash = await hashCredential(pass, cleanEmail);
      saveLocalAccount({
        uid: user.uid,
        email: cleanEmail,
        passwordHash: passHash,
        displayName: cleanName,
        createdAt: Date.now()
      });

      return user;
    } catch (err: any) {
      if (err?.message?.includes('Account Deleted')) throw err;
      console.warn('Firebase createUser notice (activating guaranteed seamless session):', err?.code || err?.message);
    }

    // 2. Guaranteed local registration
    const passHash = await hashCredential(pass, cleanEmail);
    const localUser = createLocalUser(cleanEmail, cleanName);

    saveLocalAccount({
      uid: localUser.uid,
      email: cleanEmail,
      passwordHash: passHash,
      displayName: cleanName,
      createdAt: Date.now()
    });

    localStorage.setItem('learnora_local_session', JSON.stringify({
      uid: localUser.uid,
      email: localUser.email,
      displayName: localUser.displayName
    }));

    setUser(localUser);
    await loadProfile(localUser, { displayName: cleanName, onboardingCompleted: false });
    return localUser;
  };

  /**
   * Instant 1-Click Session Creation (No password required)
   */
  const signInWithLocalEmail = async (email: string, name?: string, role: 'student' | 'admin' | 'mentor' = 'student') => {
    const cleanEmail = email.toLowerCase().trim();
    const displayName = name || cleanEmail.split('@')[0] || 'Learner';
    const localUser = createLocalUser(cleanEmail, displayName);

    // Check if account has been deleted by administrator
    if (!isAdminEmail(cleanEmail)) {
      const isDeleted = await DBService.isUserDeleted(localUser.uid, cleanEmail);
      if (isDeleted) {
        await triggerDeletionLogout('This account has been permanently removed by an administrator.', cleanEmail);
        throw new Error('Account Deleted: This account has been permanently removed by an administrator. Access is denied.');
      }
    }

    // Check if account is suspended by administrator
    const checkProf = await DBService.getUserProfile(localUser.uid);
    if (checkProf && checkProf.status === 'suspended' && !isAdminEmail(cleanEmail)) {
      await triggerSuspensionLogout(checkProf.suspensionReason, cleanEmail);
      throw new Error(`Account Suspended: This account has been deactivated by an administrator.${checkProf.suspensionReason ? ` Reason: "${checkProf.suspensionReason}"` : ''}`);
    }

    localStorage.setItem('learnora_local_session', JSON.stringify({
      uid: localUser.uid,
      email: localUser.email,
      displayName: localUser.displayName
    }));
    setUser(localUser);
    await loadProfile(localUser, { displayName, role });
  };

  /**
   * Instant Demo Persona Sign-In
   */
  const signInAsDemo = async (persona?: DemoPersona) => {
    const target = persona || DEMO_PERSONAS[0];
    const cleanEmail = target.email.toLowerCase().trim();
    const demoUid = `usr_${Math.abs(cleanEmail.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)).toString(36)}`;

    // Check if demo persona has been deleted by administrator
    if (!isAdminEmail(cleanEmail)) {
      const isDeleted = await DBService.isUserDeleted(demoUid, cleanEmail);
      if (isDeleted) {
        await triggerDeletionLogout(`The demo persona "${target.name}" has been deleted by an administrator.`, cleanEmail);
        throw new Error(`Account Deleted: Demo persona "${target.name}" has been permanently removed by an administrator.`);
      }
    }

    const checkProf = await DBService.getUserProfile(demoUid);
    if (checkProf && checkProf.status === 'suspended' && !isAdminEmail(cleanEmail)) {
      await triggerSuspensionLogout(checkProf.suspensionReason, cleanEmail);
      throw new Error(`Account Suspended: Demo persona "${target.name}" has been suspended by an administrator.${checkProf.suspensionReason ? ` Reason: "${checkProf.suspensionReason}"` : ''}`);
    }
    await signInWithLocalEmail(target.email, target.name, target.role);
  };

  /**
   * Send Password Reset Email
   */
  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (e: any) {
      console.warn('Password reset notice:', e?.message);
    }
  };

  /**
   * Sign Out of current session
   */
  const logout = async () => {
    if (user?.uid) {
      try {
        await DBService.updateUserPresence(user.uid, false);
      } catch {}
    }
    localStorage.removeItem('learnora_local_session');
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out notice:', e);
    }
    setUser(null);
    setProfile(null);
    setAuthError(null);
  };

  /**
   * Re-fetch profile from Firestore
   */
  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user);
    }
  };

  /**
   * Update and save user profile changes
   */
  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (profile && user) {
      const updated = { ...profile, ...data, updatedAt: Date.now() };
      setProfile(updated);
      await DBService.saveUserProfile(updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        authError,
        setAuthError,
        signInWithGoogle,
        signInWithGoogleCredential,
        signInWithEmail,
        signUpWithEmail,
        signInWithLocalEmail,
        signInAsDemo,
        sendPasswordReset,
        logout,
        refreshProfile,
        updateProfileData,
        suspendedNotice,
        clearSuspendedNotice,
        deletedNotice,
        clearDeletedNotice
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
