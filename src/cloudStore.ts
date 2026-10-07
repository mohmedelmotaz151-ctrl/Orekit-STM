import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db, ensureFirebaseAuth, firebaseConfigured } from './firebase';

export type RecordData = { id: string; [key: string]: unknown };

export const cloudCollections = [
  'customers',
  'sites',
  'visits',
  'contracts',
  'maintenance',
  'requests',
  'scenes',
  'reports',
  'delegates',
] as const;

export type CloudCollection = typeof cloudCollections[number];

export async function loadCloud<T extends RecordData>(kind: CloudCollection): Promise<T[]> {
  if (!firebaseConfigured || !db) return [];
  await ensureFirebaseAuth();
  const snap = await getDocs(collection(db, 'orkeit_civil_defense', kind));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as T));
}

export async function saveCloud(kind: CloudCollection, item: RecordData) {
  if (!firebaseConfigured || !db) return;
  await ensureFirebaseAuth();
  await setDoc(doc(db, 'orkeit_civil_defense', kind, item.id), item, { merge: true });
}

export async function deleteCloud(kind: CloudCollection, id: string) {
  if (!firebaseConfigured || !db) return;
  await ensureFirebaseAuth();
  await deleteDoc(doc(db, 'orkeit_civil_defense', kind, id));
}

export { firebaseConfigured };
