import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserAccount } from '../types';
import { initFirebaseService } from '../services/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

interface AuthContextType {
  currentUser: UserAccount | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: (reason?: string) => void;
  sessionRevokedMessage: string | null;
  clearSessionMessage: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Instant LocalStorage Hydration: Zero-delay initial state for PWA Home Screen launch
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('pandir_current_user');
      if (!saved || saved === 'undefined' || saved === 'null') return null;
      const parsed = JSON.parse(saved);
      return parsed && typeof parsed === 'object' && parsed.id ? parsed : null;
    } catch {
      return null;
    }
  });

  const [sessionRevokedMessage, setSessionRevokedMessage] = useState<string | null>(null);
  
  // CRITICAL FIX: Always start loading as FALSE if we have a cached user, 
  // or set a strict maximum timeout (e.g., 600ms) so the PWA never hangs on cold start when opened from Home Screen.
  const [loading, setLoading] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('pandir_current_user');
      return !saved || saved === 'undefined' || saved === 'null';
    } catch {
      return false;
    }
  });

  // 2. Non-blocking Firebase Auth Observer with a strict safety timeout for poor mobile network / cold start
  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined = undefined;
    let isResolved = false;

    // Safety timeout: Never let auth check block the app for more than 800ms on mobile home screen launch
    const safetyTimer = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        setLoading(false);
      }
    }, 800);

    const { isConfigured, auth: firebaseAuth, db: firestoreDb } = initFirebaseService();
    if (!isConfigured || !firebaseAuth || !firestoreDb) {
      clearTimeout(safetyTimer);
      setLoading(false);
      return;
    }

    const unsubscribeAuth = firebaseAuth.onAuthStateChanged(async (authUser) => {
      if (isResolved && currentUser) return; // Already resolved via local cache or timeout
      
      if (authUser) {
        const userDocRef = doc(firestoreDb, 'users', authUser.uid);
        
        // Single getDoc first for lightning fast non-blocking resolution on mobile
        try {
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data.status === 'disabled') {
              signOut(firebaseAuth);
              setCurrentUser(null);
              localStorage.removeItem('pandir_current_user');
              setSessionRevokedMessage('Akun Anda telah dinonaktifkan oleh Administrator.');
            } else {
              const fullUser: UserAccount = {
                id: authUser.uid,
                email: authUser.email || data.email || '',
                name: data.name || authUser.displayName || 'Pengguna',
                role: data.role || 'kasir',
                status: 'active',
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
              };
              setCurrentUser(fullUser);
              localStorage.setItem('pandir_current_user', JSON.stringify(fullUser));
            }
          } else {
            const fallbackUser: UserAccount = {
              id: authUser.uid,
              email: authUser.email || '',
              name: authUser.displayName || 'Pengguna',
              role: (authUser.email === 'pandir@pandirstore.com' || authUser.email === 'admin@pandirstore.com') ? 'admin' : 'kasir',
              status: 'active',
              createdAt: new Date().toISOString(),
            };
            setCurrentUser(fallbackUser);
            localStorage.setItem('pandir_current_user', JSON.stringify(fallbackUser));
            setDoc(userDocRef, { ...fallbackUser, updatedAt: new Date().toISOString() }, { merge: true });
          }
        } catch (e) {
          console.warn('[AuthContext] Fast profile fetch fallback:', e);
        }

        if (!isResolved) {
          isResolved = true;
          clearTimeout(safetyTimer);
          setLoading(false);
        }

        // Setup background listener for role/status changes
        unsubscribeProfile = onSnapshot(userDocRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data.status === 'disabled') {
              signOut(firebaseAuth);
              setCurrentUser(null);
              localStorage.removeItem('pandir_current_user');
              setSessionRevokedMessage('Akun Anda telah dinonaktifkan oleh Administrator.');
            }
          }
        }, () => {});

      } else {
        // If Firebase says not signed in, but we have a valid offline local user, keep them logged in for offline PWA resilience!
        const saved = localStorage.getItem('pandir_current_user');
        if (!saved || saved === 'undefined' || saved === 'null') {
          setCurrentUser(null);
          localStorage.removeItem('pandir_current_user');
        }
        if (!isResolved) {
          isResolved = true;
          clearTimeout(safetyTimer);
          setLoading(false);
        }
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const login = async (identifier: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setSessionRevokedMessage(null);
    const cleanId = identifier.trim().toLowerCase();
    const emailToAuth = cleanId.includes('@') ? cleanId : `${cleanId}@pandirstore.com`;

    try {
      const { isConfigured, auth: firebaseAuth } = initFirebaseService();
      if (!isConfigured || !firebaseAuth) {
        return { success: false, error: 'Firebase belum dikonfigurasi.' };
      }

      await signInWithEmailAndPassword(firebaseAuth, emailToAuth, pass);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('auth/wrong-password') || msg.includes('auth/user-not-found') || msg.includes('invalid-credential')) {
        return { success: false, error: 'Email/Username atau Kata Sandi salah.' };
      }
      return { success: false, error: msg || 'Gagal masuk.' };
    }
  };

  const logout = (reason?: string) => {
    const { auth: firebaseAuth } = initFirebaseService();
    if (firebaseAuth) {
      signOut(firebaseAuth).catch(() => {});
    }
    setCurrentUser(null);
    localStorage.removeItem('pandir_current_user');
    if (reason) {
      setSessionRevokedMessage(reason);
    }
  };

  const clearSessionMessage = () => setSessionRevokedMessage(null);

  const isAdmin = currentUser?.role === 'admin';
  const isAuthenticated = !!currentUser;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isAdmin,
        login,
        logout,
        sessionRevokedMessage,
        clearSessionMessage,
      }}
    >
      {loading && !currentUser ? (
        <div className="min-h-screen bg-[#161922] flex flex-col items-center justify-center p-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white text-2xl font-black shadow-xl animate-pulse mb-4">
            PS
          </div>
          <h2 className="text-base font-bold text-slate-100 tracking-tight">PANDIR STORE</h2>
          <p className="text-xs text-slate-400 mt-1">Memuat sesi toko...</p>
        </div>
      ) : (
        children
      )}
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
