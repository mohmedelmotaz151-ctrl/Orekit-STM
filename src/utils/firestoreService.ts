import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  updateDoc 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { User, Site, Visit, FollowUpLog, IncentiveSettings } from '../types';
import { INITIAL_USERS, INITIAL_SETTINGS } from './storage';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((p) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Collections references
const USERS_COL = 'users';
const SITES_COL = 'sites';
const VISITS_COL = 'visits';
const FOLLOWUPS_COL = 'followups';
const SETTINGS_COL = 'settings';

/**
 * Initialize Firestore bootstrap:
 * Ensures the admin user exists in the cloud Firestore database.
 */
export async function bootstrapFirestore(): Promise<void> {
  try {
    const adminDocRef = doc(db, USERS_COL, INITIAL_USERS[0].id);
    const snap = await getDoc(adminDocRef);
    if (!snap.exists()) {
      await setDoc(adminDocRef, INITIAL_USERS[0]);
    }

    const settingsDocRef = doc(db, SETTINGS_COL, 'global');
    const settingsSnap = await getDoc(settingsDocRef);
    if (!settingsSnap.exists()) {
      await setDoc(settingsDocRef, INITIAL_SETTINGS);
    }
  } catch (error) {
    console.warn('Firestore bootstrap notice (continuing):', error);
  }
}

/**
 * Real-time subscribers for cross-device multi-agent sync
 */
export function subscribeToUsers(callback: (users: User[]) => void): () => void {
  const colRef = collection(db, USERS_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const users: User[] = [];
      snapshot.forEach((d) => {
        users.push(d.data() as User);
      });
      if (users.length > 0) {
        callback(users);
      }
    },
    (error) => {
      console.warn('User listener fallback:', error);
    }
  );
}

export function subscribeToSites(callback: (sites: Site[]) => void): () => void {
  const colRef = collection(db, SITES_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const sites: Site[] = [];
      snapshot.forEach((d) => {
        sites.push(d.data() as Site);
      });
      // Sort newest first
      sites.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      callback(sites);
    },
    (error) => {
      console.warn('Sites listener fallback:', error);
    }
  );
}

export function subscribeToVisits(callback: (visits: Visit[]) => void): () => void {
  const colRef = collection(db, VISITS_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const visits: Visit[] = [];
      snapshot.forEach((d) => {
        visits.push(d.data() as Visit);
      });
      visits.sort((a, b) => (b.visitDate || '').localeCompare(a.visitDate || ''));
      callback(visits);
    },
    (error) => {
      console.warn('Visits listener fallback:', error);
    }
  );
}

export function subscribeToFollowups(callback: (followups: FollowUpLog[]) => void): () => void {
  const colRef = collection(db, FOLLOWUPS_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const logs: FollowUpLog[] = [];
      snapshot.forEach((d) => {
        logs.push(d.data() as FollowUpLog);
      });
      logs.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      callback(logs);
    },
    (error) => {
      console.warn('Followups listener fallback:', error);
    }
  );
}

export function subscribeToSettings(callback: (settings: IncentiveSettings) => void): () => void {
  const docRef = doc(db, SETTINGS_COL, 'global');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as IncentiveSettings);
      }
    },
    (error) => {
      console.warn('Settings listener fallback:', error);
    }
  );
}

// Cloud Mutation Operations (Writes to Firestore)
export async function fsSaveUser(user: User): Promise<void> {
  const path = `${USERS_COL}/${user.id}`;
  try {
    const docRef = doc(db, USERS_COL, user.id);
    await setDoc(docRef, user, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fsSaveSite(site: Site): Promise<void> {
  const path = `${SITES_COL}/${site.id}`;
  try {
    const docRef = doc(db, SITES_COL, site.id);
    await setDoc(docRef, site, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fsApproveSite(
  siteId: string,
  approved: boolean,
  reason?: string,
  approvedBy?: string
): Promise<void> {
  const path = `${SITES_COL}/${siteId}`;
  try {
    const docRef = doc(db, SITES_COL, siteId);
    await updateDoc(docRef, {
      approvalStatus: approved ? 'approved' : 'rejected',
      rejectionReason: approved ? null : (reason || null),
      approvedAt: approved ? new Date().toISOString().split('T')[0] : null,
      approvedBy: approved ? (approvedBy || null) : null,
      incentivePaid: approved,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fsUpdateSiteStatus(siteId: string, status: string): Promise<void> {
  const path = `${SITES_COL}/${siteId}`;
  try {
    const docRef = doc(db, SITES_COL, siteId);
    await updateDoc(docRef, {
      status,
      updatedAt: new Date().toISOString().split('T')[0],
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fsSaveVisit(visit: Visit): Promise<void> {
  const path = `${VISITS_COL}/${visit.id}`;
  try {
    const docRef = doc(db, VISITS_COL, visit.id);
    await setDoc(docRef, visit, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fsSaveFollowUp(followup: FollowUpLog): Promise<void> {
  const path = `${FOLLOWUPS_COL}/${followup.id}`;
  try {
    const docRef = doc(db, FOLLOWUPS_COL, followup.id);
    await setDoc(docRef, followup, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fsSaveSettings(settings: IncentiveSettings): Promise<void> {
  const path = `${SETTINGS_COL}/global`;
  try {
    const docRef = doc(db, SETTINGS_COL, 'global');
    await setDoc(docRef, settings, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
