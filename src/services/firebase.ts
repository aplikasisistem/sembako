import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore, 
  enableIndexedDbPersistence, 
  clearIndexedDbPersistence,
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  query,
  where,
  limit,
  deleteDoc, 
  writeBatch,
  onSnapshot, 
  Unsubscribe 
} from 'firebase/firestore';
import { getAuth, Auth, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { UserAccount } from '../types';
import firebaseAppletConfig from '../../firebase-applet-config.json';
import { INITIAL_USERS } from './seedData';

export interface FirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  firestoreDatabaseId?: string;
}

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;
let firebaseAuth: Auth | null = null;
let isFirestoreInitialized = false;

export function getActiveFirebaseConfig(): FirebaseConfig | null {
  // Check localStorage override first
  try {
    const saved = localStorage.getItem('pandir_firebase_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.apiKey && parsed.projectId) return parsed;
    }
  } catch {
    // Ignore storage parse error
  }

  // Use configuration from firebase-applet-config.json
  if (
    firebaseAppletConfig && 
    firebaseAppletConfig.apiKey && 
    firebaseAppletConfig.projectId && 
    firebaseAppletConfig.apiKey !== 'AIzaSy...'
  ) {
    return firebaseAppletConfig;
  }

  const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

  if (envApiKey && envApiKey !== 'AIzaSy...' && envProjectId) {
    return {
      apiKey: envApiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${envProjectId}.firebaseapp.com`,
      projectId: envProjectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${envProjectId}.appspot.com`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef',
      firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || 'ai-studio-pandirstorepwapo-cbfd82a5-e27c-42fb-bc4b-eb4a9e237f30',
    };
  }

  return null;
}

export function initFirebaseService(): { 
  isConfigured: boolean; 
  db: Firestore | null; 
  auth: Auth | null; 
} {
  const config = getActiveFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return { isConfigured: false, db: null, auth: null };
  }

  try {
    if (!getApps().length) {
      firebaseApp = initializeApp(config);
    } else {
      firebaseApp = getApp();
    }

    const databaseId = (config as any).firestoreDatabaseId || 'ai-studio-pandirstorepwapo-cbfd82a5-e27c-42fb-bc4b-eb4a9e237f30';
    firestoreDb = getFirestore(firebaseApp, databaseId);
    firebaseAuth = getAuth(firebaseApp);
    setPersistence(firebaseAuth, browserLocalPersistence).catch(() => {});

    if (!isFirestoreInitialized && typeof window !== 'undefined') {
      isFirestoreInitialized = true;
      enableIndexedDbPersistence(firestoreDb).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('[Firebase] Multiple tabs open, persistence enabled in first tab only.');
        } else if (err.code === 'unimplemented') {
          console.warn('[Firebase] Current browser does not support IndexedDb persistence.');
        }
      });
    }

    return { isConfigured: true, db: firestoreDb, auth: firebaseAuth };
  } catch (error) {
    console.error('[Firebase] Initialization error:', error);
    return { isConfigured: false, db: null, auth: null };
  }
}

const initialFirebaseInit = initFirebaseService();
export const db = initialFirebaseInit.db;
export const auth = initialFirebaseInit.auth;

/**
 * Real-time Document Listener with automatic fallback
 */
export function listenToDocument<T>(
  collectionName: string, 
  docId: string, 
  callback: (data: T | null) => void
): Unsubscribe {
  const { isConfigured, db } = initFirebaseService();
  if (isConfigured && db) {
    try {
      const docRef = doc(db, collectionName, docId);
      return onSnapshot(
        docRef, 
        (snapshot) => {
          if (snapshot.exists()) {
            callback({ id: snapshot.id, ...snapshot.data() } as T);
          } else {
            callback(null);
          }
        }, 
        (err) => {
          console.warn(`[Firebase] doc listener error on ${collectionName}/${docId}:`, err);
        }
      );
    } catch (e) {
      console.warn('[Firebase] listener error:', e);
    }
  }

  // Fallback: Cross-tab localStorage event listener
  const handleStorage = (event: StorageEvent) => {
    if (event.key === `pandir_${collectionName}`) {
      try {
        const items = JSON.parse(event.newValue || '[]');
        const target = items.find((item: { id: string }) => item.id === docId);
        callback(target || null);
      } catch {
        // ignore
      }
    }
  };

  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
}

/**
 * Real-time Collection Listener with automatic fallback
 */
export function listenToCollection<T extends { id: string }>(
  collectionName: string,
  callback: (data: T[]) => void,
  maxLimit?: number
): Unsubscribe {
  const { isConfigured, db } = initFirebaseService();
  if (isConfigured && db) {
    try {
      const colRef = collection(db, collectionName);
      const q = maxLimit ? query(colRef, limit(maxLimit)) : colRef;
      return onSnapshot(
        q,
        (snapshot) => {
          const items: T[] = [];
          snapshot.forEach((docSnap) => {
            items.push({ id: docSnap.id, ...docSnap.data() } as T);
          });
          callback(items);
        },
        (err) => {
          console.warn(`[Firebase] Collection listener notice on ${collectionName}:`, err);
        }
      );
    } catch (e) {
      console.warn(`[Firebase] Collection listener initialization error on ${collectionName}:`, e);
    }
  }

  return () => {};
}

/**
 * Save / sync document to Firestore if active
 */
export async function syncDocToFirestore(collectionName: string, docId: string, data: Record<string, unknown>): Promise<boolean> {
  const { isConfigured, db } = initFirebaseService();
  if (!isConfigured || !db) return false;

  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, data, { merge: true });
    return true;
  } catch (err) {
    console.warn(`[Firebase] sync error on ${collectionName}/${docId}:`, err);
    return false;
  }
}

/**
 * Delete document from Firestore real-time if active
 */
export async function deleteDocFromFirestore(collectionName: string, docId: string): Promise<boolean> {
  const { isConfigured, db } = initFirebaseService();
  if (!isConfigured || !db) return false;

  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.warn(`[Firebase] delete error on ${collectionName}/${docId}:`, err);
    return false;
  }
}

/**
 * Delete all documents in all operational collections from Cloud Firestore
 */
export async function clearAllFirestoreCollections(): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  const { isConfigured, db } = initFirebaseService();
  if (db) {
    try {
      await clearIndexedDbPersistence(db);
    } catch (e) {
      console.warn('[Firebase] clearIndexedDbPersistence warning:', e);
    }
  }

  if (!isConfigured || !db) {
    return { success: true, deletedCount: 0 };
  }

  const collectionsToClear = [
    'products',
    'transactions',
    'customer_debts',
    'petty_cash_logs',
    'closing_reports',
    'capital_logs',
    'stock_flow_logs',
    'categories',
    'settings',
    'users',
  ];

  let totalDeleted = 0;

  try {
    for (const collectionName of collectionsToClear) {
      const colRef = collection(db, collectionName);
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        const docs = snapshot.docs;
        for (let i = 0; i < docs.length; i += 400) {
          const chunk = docs.slice(i, i + 400);
          const batch = writeBatch(db);
          for (const d of chunk) {
            batch.delete(d.ref);
            totalDeleted++;
          }
          await batch.commit();
        }
      }
    }
    return { success: true, deletedCount: totalDeleted };
  } catch (err) {
    console.error('[Firebase Reset Error]', err);
    return {
      success: false,
      deletedCount: totalDeleted,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Send transaction to Google Apps Script Webhook for Google Sheets
 */
export async function sendToGoogleSheetsWebhook(
  webhookUrl: string, 
  payload: Record<string, unknown>
): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return { success: false, message: 'URL Webhook Google Apps Script belum diisi.' };
  }

  try {
    // Mode no-cors is standard for Google Apps Script Web Apps when called from browser
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return { 
      success: true, 
      message: 'Transaksi berhasil dikirim ke antrean Google Sheets.' 
    };
  } catch (err) {
    console.error('[GAS] Webhook Error:', err);
    return { 
      success: false, 
      message: `Gagal mengirim ke Google Sheets: ${err instanceof Error ? err.message : String(err)}` 
    };
  }
}

/**
 * Pure Firebase Auth & Firestore Profile Login
 */
export async function loginWithFirebase(
  identifier: string,
  pass: string
): Promise<UserAccount> {
  const cleanId = identifier.trim().toLowerCase();
  const { isConfigured, db, auth } = initFirebaseService();

  let targetEmail = cleanId;

  // 1. Instant Username to Email Resolution (0ms network delay)
  if (!cleanId.includes('@')) {
    const seedMap: Record<string, string> = {
      admin: 'admin@pandirstore.com',
      kasir: 'kasir@pandirstore.com',
      pandir: 'pandir@pandirstore.com',
    };
    if (seedMap[cleanId]) {
      targetEmail = seedMap[cleanId];
    } else {
      if (typeof window !== 'undefined') {
        try {
          const localUsers: UserAccount[] = JSON.parse(localStorage.getItem('pandir_users') || '[]') || [];
          const matched = localUsers.find(
            (u) => (u.username && u.username.toLowerCase() === cleanId) || u.email.split('@')[0].toLowerCase() === cleanId
          );
          if (matched) targetEmail = matched.email;
        } catch {
          // ignore
        }
      }
    }
    if (!targetEmail.includes('@')) {
      targetEmail = `${cleanId}@pandirstore.com`;
    }
  }

  // Helper for local seed / offline accounts match
  const findLocalUserMatch = (): UserAccount | null => {
    if (typeof window === 'undefined') return null;
    try {
      const storedUsers: UserAccount[] = JSON.parse(localStorage.getItem('pandir_users') || '[]') || [];
      const userList = [...INITIAL_USERS, ...storedUsers];
      const matched = userList.find(
        (u) =>
          u.email.toLowerCase() === targetEmail ||
          (u.username && u.username.toLowerCase() === cleanId) ||
          u.email.split('@')[0].toLowerCase() === cleanId
      );

      if (matched && (matched.password === pass || !matched.password)) {
        if (matched.status === 'disabled') {
          throw new Error('Akun Anda tidak aktif. Silakan hubungi Administrator.');
        }
        const { password, ...safeUser } = matched;
        return safeUser as UserAccount;
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes('tidak aktif')) throw e;
    }
    return null;
  };

  // 2. Perform Firebase Auth login if service is configured
  if (isConfigured && auth) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, targetEmail, pass);
      const authUser = userCredential.user;
      const emailLower = (authUser.email || targetEmail).toLowerCase();
      const isSuper = emailLower === 'pandir@pandirstore.com' || emailLower === 'admin@pandirstore.com' || cleanId === 'admin' || cleanId === 'pandir';

      // Check for cached profile in localStorage for instant hydration
      let cachedProfile: UserAccount | null = null;
      try {
        const saved = localStorage.getItem('pandir_current_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.id === authUser.uid) {
            cachedProfile = parsed;
          }
        }
      } catch {
        // ignore
      }

      // Build instant user profile immediately (NO network wait blocking return!)
      const instantProfile: UserAccount = cachedProfile || {
        id: authUser.uid,
        email: authUser.email || targetEmail,
        name: authUser.displayName || (isSuper ? 'Pemilik Toko (Admin Super)' : 'Kasir Toko'),
        role: isSuper ? 'admin' : 'kasir',
        username: cleanId,
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      // 3. Background Non-Blocking Firestore Profile Sync
      if (db) {
        const userDocRef = doc(db, 'users', authUser.uid);
        getDoc(userDocRef).then((snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const updatedProfile: UserAccount = {
              id: authUser.uid,
              email: authUser.email || targetEmail,
              name: data.name || authUser.displayName || instantProfile.name,
              role: data.role || instantProfile.role,
              username: data.username || cleanId,
              status: data.status || 'active',
              createdAt: data.createdAt || instantProfile.createdAt,
              updatedAt: data.updatedAt,
            };
            if (typeof window !== 'undefined') {
              localStorage.setItem('pandir_current_user', JSON.stringify(updatedProfile));
            }
          } else {
            // First time login - seed Firestore user document asynchronously
            setDoc(userDocRef, { ...instantProfile, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
          }
        }).catch((err) => {
          console.warn('[Firebase] Background profile sync error:', err);
        });
      }

      return instantProfile;
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('tidak aktif')) {
        throw err;
      }

      // Local fallback for offline / seed accounts
      const localMatched = findLocalUserMatch();
      if (localMatched) {
        return localMatched;
      }

      if (err instanceof Error) {
        const code = (err as { code?: string }).code || '';
        if (
          code === 'auth/invalid-credential' ||
          code === 'auth/wrong-password' ||
          code === 'auth/user-not-found' ||
          code === 'auth/invalid-email'
        ) {
          throw new Error('Email/Username atau Kata Sandi salah.');
        } else if (code === 'auth/too-many-requests') {
          throw new Error('Terlalu banyak percobaan login yang gagal. Silakan coba lagi nanti.');
        } else if (code === 'auth/network-request-failed') {
          throw new Error('Gagal terhubung ke server Firebase. Periksa koneksi internet Anda.');
        } else {
          throw new Error(err.message || 'Gagal masuk. Silakan periksa kredensial Anda.');
        }
      }

      throw new Error('Terjadi kesalahan saat otentikasi. Silakan coba lagi.');
    }
  }

  // 4. Offline fallback if Firebase Auth is not configured
  const localMatched = findLocalUserMatch();
  if (localMatched) {
    return localMatched;
  }

  throw new Error('Email/Username atau Kata Sandi salah.');
}

