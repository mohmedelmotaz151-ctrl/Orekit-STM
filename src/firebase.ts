import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'oriket-14b76.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'oriket-14b76',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'oriket-14b76.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '369863592977',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:369863592977:web:68010e2585c7c1657f35b0',
};

export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId === 'oriket-14b76' &&
  firebaseConfig.appId
);

const app = firebaseConfigured ? initializeApp(firebaseConfig) : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

export async function ensureFirebaseAuth() {
  if (!auth) return;
  if (auth.currentUser) return;

  try {
    await signInAnonymously(auth);
  } catch (error) {
    console.warn(
      'Firebase anonymous authentication unavailable; continuing without it.',
      error
    );
  }
}
