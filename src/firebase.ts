import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
const env=import.meta.env;
const firebaseConfig={apiKey:env.api_key||env.VITE_FIREBASE_API_KEY||'',authDomain:env.auth_domain||env.VITE_FIREBASE_AUTH_DOMAIN||'oriket-14b76.firebaseapp.com',projectId:env.project_id||env.VITE_FIREBASE_PROJECT_ID||'oriket-14b76',storageBucket:env.storage_bucket||env.VITE_FIREBASE_STORAGE_BUCKET||'oriket-14b76.firebasestorage.app',messagingSenderId:env.messaging_sender_id||env.VITE_FIREBASE_MESSAGING_SENDER_ID||'369863592977',appId:env.app_id||env.VITE_FIREBASE_APP_ID||'1:369863592977:web:68010e2585c7c1657f35b0'};
export const firebaseConfigured=Boolean(firebaseConfig.apiKey&&firebaseConfig.projectId==='oriket-14b76'&&firebaseConfig.appId);
export const app=firebaseConfigured?initializeApp(firebaseConfig):null;
export const auth=app?getAuth(app):null;
export const db=app?getFirestore(app):null;
export async function ensureFirebaseAuth(){if(!auth||auth.currentUser)return;try{await signInAnonymously(auth)}catch(error){console.warn('Firebase anonymous authentication unavailable.',error)}}