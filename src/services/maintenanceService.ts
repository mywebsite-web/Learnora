import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MaintenanceModeConfig } from '../types';

const STORAGE_KEY = 'learnora_maintenance_config';
const DOC_COLLECTION = 'platformSettings';
const DOC_ID = 'maintenance';

export const DEFAULT_MAINTENANCE_CONFIG: MaintenanceModeConfig = {
  isActive: false,
  title: 'Platform Maintenance in Progress',
  message: 'We are currently performing scheduled platform enhancements, security patches, and database optimizations to provide you with a faster, seamless learning workspace. All study sets, notes, and progress remain completely safe.',
  estimatedDuration: '~30 minutes',
  startTime: Date.now(),
  updatedAt: Date.now(),
  updatedBy: 'System',
  reasonCategory: 'scheduled'
};

export class MaintenanceService {
  /**
   * Retrieves the locally cached maintenance configuration
   */
  static getLocalConfig(): MaintenanceModeConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return { ...DEFAULT_MAINTENANCE_CONFIG, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn('Error reading local maintenance config:', e);
    }
    return DEFAULT_MAINTENANCE_CONFIG;
  }

  /**
   * Saves the maintenance configuration to local storage and broadcasts an event
   */
  static saveLocalConfig(config: MaintenanceModeConfig): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      window.dispatchEvent(new CustomEvent('learnora_maintenance_changed', { detail: config }));
    } catch (e) {
      console.warn('Error saving local maintenance config:', e);
    }
  }

  /**
   * Fetches the current platform maintenance configuration from Firestore
   */
  static async getConfig(): Promise<MaintenanceModeConfig> {
    const local = this.getLocalConfig();

    try {
      const docRef = doc(db, DOC_COLLECTION, DOC_ID);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const cloud = snap.data() as MaintenanceModeConfig;
        const merged: MaintenanceModeConfig = {
          ...DEFAULT_MAINTENANCE_CONFIG,
          ...cloud
        };
        this.saveLocalConfig(merged);
        return merged;
      }
    } catch (e) {
      console.warn('Notice loading maintenance configuration from Firestore:', e);
    }

    return local;
  }

  /**
   * Updates platform maintenance status (Admin restricted)
   */
  static async setMaintenanceMode(
    update: Partial<MaintenanceModeConfig>,
    adminEmail?: string
  ): Promise<MaintenanceModeConfig> {
    const current = await this.getConfig();
    const updated: MaintenanceModeConfig = {
      ...current,
      ...update,
      updatedAt: Date.now(),
      updatedBy: adminEmail || 'Platform Admin'
    };

    if (update.isActive !== undefined && update.isActive) {
      updated.startTime = updated.startTime || Date.now();
    }

    // 1. Cache locally and notify current tab & other tabs
    this.saveLocalConfig(updated);

    // 2. Persist to Firestore so all users across the web are immediately locked or unlocked
    try {
      const docRef = doc(db, DOC_COLLECTION, DOC_ID);
      await setDoc(docRef, updated, { merge: true });
    } catch (e) {
      console.warn('Notice saving maintenance config to Firestore:', e);
    }

    return updated;
  }

  /**
   * Subscribes to real-time maintenance updates from Firestore and cross-tab storage
   */
  static subscribeToMaintenance(callback: (config: MaintenanceModeConfig) => void): () => void {
    // Immediate callback with current local cached status
    callback(this.getLocalConfig());

    // 1. Firestore real-time listener
    let unsubFirestore: (() => void) | null = null;
    try {
      const docRef = doc(db, DOC_COLLECTION, DOC_ID);
      unsubFirestore = onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          const cloud = snap.data() as MaintenanceModeConfig;
          const merged: MaintenanceModeConfig = {
            ...DEFAULT_MAINTENANCE_CONFIG,
            ...cloud
          };
          this.saveLocalConfig(merged);
          callback(merged);
        } else {
          // If document doesn't exist, maintenance is inactive
          callback(DEFAULT_MAINTENANCE_CONFIG);
        }
      }, (err) => {
        console.warn('Real-time maintenance listener notice:', err);
      });
    } catch (e) {
      console.warn('Error creating Firestore maintenance listener:', e);
    }

    // 2. Cross-tab storage listener
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          callback({ ...DEFAULT_MAINTENANCE_CONFIG, ...parsed });
        } catch {}
      }
    };

    // 3. Same-tab custom event listener
    const handleCustomEvent = (e: any) => {
      if (e.detail) {
        callback(e.detail);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('learnora_maintenance_changed', handleCustomEvent);

    return () => {
      if (unsubFirestore) unsubFirestore();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('learnora_maintenance_changed', handleCustomEvent);
    };
  }
}
