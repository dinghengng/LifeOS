importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAqCCcbwxAyd-p6AYQUbGFigPJFUypqCH8',
  authDomain: 'lifeos-5706c.firebaseapp.com',
  projectId: 'lifeos-5706c',     
  storageBucket: 'lifeos-5706c.firebasestorage.app',
  messagingSenderId: '933703748186', 
  appId: '1:933703748186:web:19f5b80f0526f89366a663', 
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? {};
  self.registration.showNotification(title || 'LifeOS', {
    body: body || '',
    icon: '/icon.png',
    badge: '/icon.png',
    data: { url: payload.data?.url || '/' },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});