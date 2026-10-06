import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAD20x36K4Iv5HxMBIXtp4vdt63erMXJu8',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'oriket-14b76.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'oriket-14b76',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:369863592977:web:68010e2585c7c1657f35b0',
};

export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
const app = firebaseConfigured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

export async function ensureFirebaseAuth() {
  if (!auth) return;
  if (auth.currentUser) return;
  try {
    await signInAnonymously(auth);
  } catch (error) {
    // Anonymous authentication may be disabled in Firebase.
    // Firestore rules for this app allow the required request operations,
    // so a disabled anonymous provider must not block customer requests.
    console.warn('Firebase anonymous authentication unavailable; continuing without it.', error);
  }
}
