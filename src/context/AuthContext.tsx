import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserAccount } from '../types';
import { auth, db, initFirebaseService } from '../services/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, getDocFromCache, setDoc, onSnapshot } from 'firebase/firestore';

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
  const [loading, setLoading] = useState(true);

  // 1. Firebase Auth Observer - Source of Truth
  useEffect(() => {
    const { isConfigured, auth: firebaseAuth, db: firestoreDb } = initFirebaseService();
    if (!isConfigured || !firebaseAuth || !firestoreDb) {
      setLoading(false);
      return;
    }

    const unsubscribeAuth = firebaseAuth.onAuthStateChanged(async (authUser) => {
      if (authUser) {
        // User is signed in, fetch full profile from Firestore
        const userDocRef = doc(firestoreDb, 'users', authUser.uid);
        
        // Use a snapshot listener for the active user profile to catch role/status changes instantly
        const unsubscribeProfile = onSnapshot(userDocRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
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
            // Document doesn't exist in Firestore yet (e.g. first login)
            // Use Auth data as fallback
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
            
            // Auto-create missing profile
            setDoc(userDocRef, { ...fallbackUser, updatedAt: new Date().toISOString() }, { merge: true });
          }
          setLoading(false);
        }, (error) => {
          console.error('[AuthContext] Profile sync error:', error);
          setLoading(false);
        });

        return () => unsubscribeProfile();
      } else {
        // User is signed out
        setCurrentUser(null);
        localStorage.removeItem('pandir_current_user');
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
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
      // onAuthStateChanged will handle the rest
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
      {!loading && children}
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

