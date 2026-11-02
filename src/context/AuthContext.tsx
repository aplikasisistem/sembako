import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserAccount } from '../types';
import { initFirebaseService, loginWithFirebase } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

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
  
  // Start loading as FALSE if we have a cached user for instant app launch
  const [loading, setLoading] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('pandir_current_user');
      return !saved || saved === 'undefined' || saved === 'null';
    } catch {
      return false;
    }
  });

  // 2. Non-blocking Firebase Auth Observer with safety timeout for mobile PWA
  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined = undefined;
    let isResolved = false;

    // Safety timeout: max 400ms for background auth check
    const safetyTimer = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        setLoading(false);
      }
    }, 400);

    const { isConfigured, auth: firebaseAuth, db: firestoreDb } = initFirebaseService();
    if (!isConfigured || !firebaseAuth || !firestoreDb) {
      clearTimeout(safetyTimer);
      setLoading(false);
      return;
    }

    const unsubscribeAuth = firebaseAuth.onAuthStateChanged((authUser) => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(safetyTimer);
        setLoading(false);
      }

      if (authUser) {
        const userDocRef = doc(firestoreDb, 'users', authUser.uid);

        // Listen for background profile changes (role updates, account disabling)
        unsubscribeProfile = onSnapshot(userDocRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data.status === 'disabled') {
              signOut(firebaseAuth).catch(() => {});
              setCurrentUser(null);
              localStorage.removeItem('pandir_current_user');
              setSessionRevokedMessage('Akun Anda telah dinonaktifkan oleh Administrator.');
            } else {
              setCurrentUser((prev) => {
                const fullUser: UserAccount = {
                  id: authUser.uid,
                  email: authUser.email || data.email || prev?.email || '',
                  name: data.name || authUser.displayName || prev?.name || 'Pengguna',
                  role: data.role || prev?.role || 'kasir',
                  username: data.username || prev?.username,
                  status: 'active',
                  createdAt: data.createdAt || prev?.createdAt,
                  updatedAt: data.updatedAt,
                };
                localStorage.setItem('pandir_current_user', JSON.stringify(fullUser));
                return fullUser;
              });
            }
          }
        }, (err) => {
          console.warn('[AuthContext] Background profile listener notice:', err);
        });

      } else {
        // Only clear if not in localStorage cache
        const saved = localStorage.getItem('pandir_current_user');
        if (!saved || saved === 'undefined' || saved === 'null') {
          setCurrentUser(null);
        }
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  // 3. Instant Login Handler: Resolves in milliseconds and immediately navigates user to Kasir
  const login = async (identifier: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setSessionRevokedMessage(null);
    try {
      const userProfile = await loginWithFirebase(identifier, pass);
      setCurrentUser(userProfile);
      localStorage.setItem('pandir_current_user', JSON.stringify(userProfile));
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
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
