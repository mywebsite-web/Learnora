import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  initializeFirestore,
  getFirestore, 
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
  setLogLevel,
  Firestore,
  doc,
  getDoc
} from 'firebase/firestore';
import config from '../../firebase-applet-config.json';

// Silence routine transport-switch and offline retry notices so transient disconnects operate smoothly
try {
  setLogLevel('error');
} catch {}

// In Firebase Web Auth, *.firebaseapp.com may sometimes be unreachable, blocked by firewalls/DNS,
// or experience regional network timeouts. If needed, the authDomain can fallback to the hosting domain
// or the application's current origin.
const effectiveConfig = {
  projectId: config.projectId,
  appId: config.appId,
  apiKey: config.apiKey,
  authDomain: config.authDomain || `${config.projectId}.firebaseapp.com`,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
};

const app: FirebaseApp = getApps().length === 0 ? initializeApp(effectiveConfig) : getApp();
const auth = getAuth(app);

// Use the specific firestoreDatabaseId provisioned in AI Studio
const databaseId = (config as any).firestoreDatabaseId || 'ai-studio-learnora-189ac80e-2fad-4aed-9e25-ea8469c78882';

// Resilient local cache configuration (falls back safely to memory cache if indexedDB is restricted)
const getLocalCacheConfig = () => {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    return memoryLocalCache();
  }
  try {
    return persistentLocalCache({ tabManager: persistentMultipleTabManager() });
  } catch {
    return memoryLocalCache();
  }
};

let db: Firestore;
try {
  // In iframe/preview and proxy networks, WebChannel HTTP streaming can fail 1-2 times before falling back.
  // experimentalForceLongPolling bypasses streaming failures and connects cleanly via standard HTTP long-polling.
  db = initializeFirestore(
    app,
    {
      ignoreUndefinedProperties: true,
      experimentalForceLongPolling: true,
      localCache: getLocalCacheConfig(),
    },
    databaseId
  );
} catch {
  try {
    db = initializeFirestore(
      app,
      {
        ignoreUndefinedProperties: true,
        experimentalForceLongPolling: true,
      },
      databaseId
    );
  } catch {
    db = getFirestore(app, databaseId);
  }
}

const googleProvider = new GoogleAuthProvider();

export {
  app,
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
};
export type { User };
