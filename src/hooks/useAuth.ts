import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  onAuthStateChanged, 
  signInWithGoogle, 
  logOut, 
  getUserRole, 
  createPendingUser,
  ADMIN_EMAIL,
  auth,
  db 
} from '../firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'enabled' | 'pending' | null;

interface UseAuthReturn {
  user: User | null;
  role: UserRole;
  loading: boolean;
  signIn: (requestEmail?: string, requestMessage?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (user: User | null) => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }
    
    // Admin always has access (case-insensitive)
    if (user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      setRole('admin');
      setLoading(false);
      return;
    }
    
    try {
      const userRole = await getUserRole(user.email!);
      
      if (userRole === 'enabled' || userRole === 'admin') {
        setRole(userRole);
      } else {
        // User not enabled - set to pending
        setRole('pending');
      }
    } catch (error) {
      console.error('Error fetching role:', error);
      setRole('pending');
    }
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      await fetchRole(firebaseUser);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (requestEmail?: string, requestMessage?: string) => {
    try {
      // If email and message provided (Request Access flow), save pending request to Firestore BEFORE auth
      if (requestEmail && requestMessage) {
        try {
          const userRef = doc(db, 'users', requestEmail);
          await setDoc(userRef, {
            role: 'pending',
            requestedAt: serverTimestamp(),
            email: requestEmail,
            message: requestMessage,
          }, { merge: true });
        } catch (e) {
          console.error('Error saving pending request:', e);
        }
      }
      
      const firebaseUser = await signInWithGoogle();
      setUser(firebaseUser);
      
      // Admin always has access (case-insensitive)
      if (firebaseUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        setRole('admin');
        return;
      }
      
      // Check if user exists in Firestore
      const userRole = await getUserRole(firebaseUser.email!);
      
      if (userRole === 'enabled' || userRole === 'admin') {
        setRole(userRole);
      } else {
        // New user - create pending request (message was already saved above if provided)
        try {
          await createPendingUser(firebaseUser, requestMessage);
        } catch (e) {
          console.error('Error creating pending user:', e);
        }
        setRole('pending');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    await logOut();
    setUser(null);
    setRole(null);
  };

  const refreshRole = async () => {
    if (user) {
      await fetchRole(user);
    }
  };

  return { user, role, loading, signIn, signOut, refreshRole };
};
