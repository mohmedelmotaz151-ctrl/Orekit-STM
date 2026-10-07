import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'oriket-14b76.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'oriket-14b76',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
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
    // The current Firestore rules allow the app to continue when
    // anonymous authentication is not enabled.
    console.warn(
      'Firebase anonymous authentication unavailable; continuing without it.',
      error
    );
  }
}
