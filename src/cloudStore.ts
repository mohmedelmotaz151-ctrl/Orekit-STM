import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db, firebaseConfigured } from './firebase';

type RecordData={id:string;[key:string]:unknown};

const collections = ['sites','visits','maintenance','delegates'] as const;

export async function loadCloud<T extends RecordData>(kind: typeof collections[number]): Promise<T[]> {
  if (!firebaseConfigured || !db) return [];
  const snap = await getDocs(collection(db, 'orkeit_civil_defense', kind));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as T));
}

export async function saveCloud(kind: typeof collections[number], item: RecordData) {
  if (!firebaseConfigured || !db) return;
  await setDoc(doc(db, 'orkeit_civil_defense', kind, item.id), item);
}

export async function deleteCloud(kind: typeof collections[number], id: string) {
  if (!firebaseConfigured || !db) return;
  await deleteDoc(doc(db, 'orkeit_civil_defense', kind, id));
}

export { firebaseConfigured };
