import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, setDoc,
  query, orderBy, where, Firestore, onSnapshot, Unsubscribe,
  FirestoreSettings, PersistentCacheSettings
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firebaseConfig } from './firebase/config';

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db: Firestore = getFirestore(app);
export const storage = getStorage(app);

// Enable persistent cache (replaces deprecated enableIndexedDbPersistence)
const cacheSettings: PersistentCacheSettings = {
  kind: 'local'
};
const firestoreSettings: FirestoreSettings = {
  cache: cacheSettings
};
// Note: In production, you may want to use: 
// setDatabaseCompatibilityMode(db, { useSnapshotsInDeduplicateNotifications: true });

// Helper to convert Firestore doc to object with id
const docToObj = (doc: any) => ({ id: doc.id, ...doc.data() });

// ============ GROUPS (mostly static - read once) ============
export const getGroups = async () => {
  const q = query(collection(db, 'exercise_groups'), orderBy('sort_order', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToObj);
};

export const createGroup = async (group: any) => {
  const docRef = await addDoc(collection(db, 'exercise_groups'), group);
  return { id: docRef.id, ...group };
};

export const deleteGroup = async (id: string) => {
  await deleteDoc(doc(db, 'exercise_groups', id));
};

export const updateGroup = async (id: string, data: any) => {
  await updateDoc(doc(db, 'exercise_groups', id), data);
};

// ============ EXERCISES (mostly static - read once) ============
export const getExercises = async (groupId?: string) => {
  if (groupId) {
    const q = query(collection(db, 'exercises'), where('group_id', '==', groupId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToObj);
  }
  const snapshot = await getDocs(collection(db, 'exercises'));
  return snapshot.docs.map(docToObj);
};

export const getExercise = async (id: string) => {
  const snap = await getDoc(doc(db, 'exercises', id));
  if (!snap.exists()) return null;
  return docToObj(snap);
};

export const createExercise = async (exercise: any) => {
  const { id, ...data } = exercise;
  const docRef = await addDoc(collection(db, 'exercises'), data);
  return { id: docRef.id, ...data };
};

export const updateExercise = async (id: string, data: any) => {
  await updateDoc(doc(db, 'exercises', id), data);
  return { id, ...data };
};

export const deleteExercise = async (id: string) => {
  await deleteDoc(doc(db, 'exercises', id));
};

// ============ WORKOUTS (real-time updates needed) ============
export const getWorkouts = async () => {
  const q = query(collection(db, 'workouts'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToObj);
};

export const getWorkout = async (id: string) => {
  const snap = await getDoc(doc(db, 'workouts', id));
  if (!snap.exists()) return null;
  return docToObj(snap);
};

export const createWorkout = async (workout: any) => {
  const { id, ...data } = workout;
  const docRef = await addDoc(collection(db, 'workouts'), data);
  return { id: docRef.id, ...data };
};

export const updateWorkout = async (id: string, data: any) => {
  await updateDoc(doc(db, 'workouts', id), data);
  return { id, ...data };
};

export const deleteWorkout = async (id: string) => {
  await deleteDoc(doc(db, 'workouts', id));
};

// Real-time listener for workouts - efficient, only updates on changes
export const subscribeToWorkouts = (callback: (workouts: any[]) => void): Unsubscribe => {
  const q = query(collection(db, 'workouts'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const workouts = snapshot.docs.map(docToObj);
    callback(workouts);
  }, (error) => {
    console.error('[Firebase] Workouts listener error:', error);
  });
};

// ============ GIF MAPPINGS (efficient - uses exercise_id as doc ID, no query needed) ============

// Get single GIF mapping by exercise_id (O(1) direct access)
export const getGifMapping = async (exerciseId: string) => {
  console.log('[getGifMapping] Fetching for:', exerciseId);
  const snap = await getDoc(doc(db, 'gif_mappings', exerciseId));
  console.log('[getGifMapping] Doc exists:', snap.exists());
  if (!snap.exists()) return null;
  const data = { id: snap.id, ...snap.data() };
  console.log('[getGifMapping] Returning:', data);
  return data;
};

// Get ALL GIF mappings for badge display (cached, only read once per session)
let cachedGifMappings: any[] | null = null;

export const getGifMappings = async () => {
  if (cachedGifMappings) {
    return cachedGifMappings;
  }
  const snapshot = await getDocs(collection(db, 'gif_mappings'));
  cachedGifMappings = snapshot.docs.map(docToObj);
  return cachedGifMappings;
};

// Clear cache when a GIF is updated
export const clearGifMappingsCache = () => {
  cachedGifMappings = null;
};

// Create or update GIF mapping (uses exercise_id as doc ID - efficient O(1) access)
export const setGifMapping = async (exerciseId: string, gifUrl: string) => {
  const docRef = doc(db, 'gif_mappings', exerciseId);
  const snap = await getDoc(docRef);
  
  if (snap.exists()) {
    await updateDoc(docRef, {
      gif_url: gifUrl,
      updated_at: new Date().toISOString()
    });
  } else {
    // Use setDoc with docRef to create document with specific ID (exerciseId)
    await setDoc(docRef, {
      exercise_id: exerciseId,
      gif_url: gifUrl,
      created_at: new Date().toISOString()
    });
  }
  clearGifMappingsCache();
};

// Real-time listener for GIF mappings - efficient updates using onSnapshot
export const subscribeToGifMappings = (callback: (mappings: any[]) => void): Unsubscribe => {
  return onSnapshot(collection(db, 'gif_mappings'), (snapshot) => {
    const mappings = snapshot.docs.map(docToObj);
    // Update cache
    cachedGifMappings = mappings;
    callback(mappings);
  }, (error) => {
    console.error('[Firebase] GIF mappings listener error:', error);
  });
};

// ============ STORAGE ============
export const uploadGif = async (filename: string, blob: Blob): Promise<string> => {
  const storageRef = ref(storage, `gifs/${filename}`);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
};

export const getGifUrl = (filename: string) => {
  return `https://storage.googleapis.com/studio-7990555522-7e3ef.firebasestorage.app/gifs/${filename}`;
};


