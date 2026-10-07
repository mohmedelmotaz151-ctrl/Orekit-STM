import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { app, auth, ensureFirebaseAuth, firebaseConfigured } from './firebase';

const env=(import.meta as ImportMeta & { env: Record<string, string | undefined> }).env;
const vapidKey = env.vapid_key || env.VITE_FIREBASE_VAPID_KEY || '';

let notificationAudioContext: AudioContext | null = null;

export function unlockNotificationSound() {
  if (typeof window === 'undefined') return;
  try {
    notificationAudioContext ??= new AudioContext();
    if (notificationAudioContext.state === 'suspended') void notificationAudioContext.resume();
  } catch {}
}

export function playNotificationSound() {
  try {
    unlockNotificationSound();
    if (!notificationAudioContext) return;
    const ctx = notificationAudioContext;
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(660, now + 0.12);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  } catch {}
}

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', unlockNotificationSound, { passive: true });
  window.addEventListener('touchstart', unlockNotificationSound, { passive: true });
}

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
    playNotificationSound();
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
