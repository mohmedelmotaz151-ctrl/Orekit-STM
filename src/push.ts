import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { app, auth, ensureFirebaseAuth, firebaseConfigured } from './firebase';

const env=(import.meta as ImportMeta & { env: Record<string, string | undefined> }).env;
const vapidKey = env.vapid_key || env.VITE_FIREBASE_VAPID_KEY || '';

async function registerMessagingWorker() {
  if (!('serviceWorker' in navigator)) return null;
  return navigator.serviceWorker.register('/firebase-messaging-sw.js');
}

export async function enablePush(userId: string, role: 'customer' | 'admin') {
  if (!firebaseConfigured || !app || !auth || !vapidKey || typeof window === 'undefined' || !('Notification' in window)) return false;

  if (Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;
  }

  await ensureFirebaseAuth();
  if (!auth.currentUser || !(await isSupported())) return false;

  const registration = await registerMessagingWorker();
  if (!registration) return false;

  const token = await getToken(getMessaging(app), {
    vapidKey,
    serviceWorkerRegistration: registration,
  });
  if (!token) return false;

  const idToken = await auth.currentUser.getIdToken();
  const response = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ token, userId, role }),
  });

  if (!response.ok) throw new Error('تعذر تسجيل جهاز الإشعارات');
  return true;
}

export async function sendPush(
  target: { userId?: string; role?: 'customer' | 'admin' },
  title: string,
  body: string,
  data: Record<string, string> = {}
) {
  if (!auth?.currentUser) await ensureFirebaseAuth();
  if (!auth?.currentUser) return false;

  const idToken = await auth.currentUser.getIdToken();
  const response = await fetch('/api/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ ...target, title, body, data }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) console.warn('Push send failed:', response.status, result);
  else console.info('Push sent:', result);
  return response.ok;
}

export async function startForegroundPushListener() {
  if (!firebaseConfigured || !app || typeof window === 'undefined' || !(await isSupported())) {
    return () => {};
  }

  const unsubscribe = onMessage(getMessaging(app), payload => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(
          payload.notification?.title || 'Orkeit',
          {
            body: payload.notification?.body || 'لديك إشعار جديد',
            icon: '/pwa-192x192.png',
          }
        );
      } catch {}
    }
  });

  return unsubscribe;
}
