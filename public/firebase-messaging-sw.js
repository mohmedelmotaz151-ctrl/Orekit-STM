importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAD20x36K4Iv5HxMBIXtp4vdt63erMXJu8',
  authDomain: 'oriket-14b76.firebaseapp.com',
  projectId: 'oriket-14b76',
  storageBucket: 'oriket-14b76.firebasestorage.app',
  messagingSenderId: '369863592977',
  appId: '1:369863592977:web:68010e2585c7c1657f35b0'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || 'Orkeit';
  const body = payload.notification?.body || payload.data?.body || 'لديك إشعار جديد';
  self.registration.showNotification(title, {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: payload.data?.tag || 'orkeit-notification',
    renotify: true,
    vibrate: [200, 100, 200, 100, 300],
    data: payload.data || {}
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
    for (const client of clientList) {
      if ('focus' in client) return client.focus();
    }
    if (clients.openWindow) return clients.openWindow('/');
  }));
});
