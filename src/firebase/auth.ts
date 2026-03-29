import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
// Reuse the same app, db, storage from firebase.ts
import { app, db, storage } from '../firebase';

export { app, db, storage };
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const ADMIN_EMAIL = 'asi.vong@gmail.com';

export const signInWithGoogle = async (): Promise<User> => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

export const logOut = async (): Promise<void> => {
  await signOut(auth);
};

export const getUserRole = async (email: string): Promise<string | null> => {
  const lowerEmail = email.toLowerCase();
  // Try lowercase version first (document ID)
  const userDoc = await getDoc(doc(db, 'users', lowerEmail));
  if (userDoc.exists()) {
    return userDoc.data().role;
  }
  // Try original email (in case of mixed case stored)
  const userDoc2 = await getDoc(doc(db, 'users', email));
  if (userDoc2.exists()) {
    return userDoc2.data().role;
  }
  return null;
};

export const createPendingUser = async (user: User, message?: string): Promise<void> => {
  const userRef = doc(db, 'users', user.email!);
  const existing = await getDoc(userRef);
  
  if (!existing.exists()) {
    await setDoc(userRef, {
      role: 'pending',
      requestedAt: serverTimestamp(),
      name: user.displayName || 'Unknown',
      email: user.email,
      photoURL: user.photoURL || null,
      message: message || '',
    });
  }
};

export const approveUser = async (email: string): Promise<void> => {
  await updateDoc(doc(db, 'users', email), {
    role: 'enabled',
    approvedAt: serverTimestamp()
  });
};

export const rejectUser = async (email: string): Promise<void> => {
  await deleteDoc(doc(db, 'users', email));
};

export const removeUser = async (email: string): Promise<void> => {
  await deleteDoc(doc(db, 'users', email));
};

export const getPendingUsers = async (): Promise<any[]> => {
  const q = query(collection(db, 'users'), where('role', '==', 'pending'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getEnabledUsers = async (): Promise<any[]> => {
  const q = query(collection(db, 'users'), where('role', '==', 'enabled'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export { onAuthStateChanged };
