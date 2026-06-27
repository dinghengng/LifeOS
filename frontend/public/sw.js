// public/sw.js — replace your push handler with this:
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};

  // Don't show OS notification if a focused app window is already open
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const isFocused = clientList.some((c) => c.focused);
      if (isFocused) return; // App is open → foreground handler shows toast, skip OS noti

      return self.registration.showNotification(data.title || 'LifeOS', {
        body: data.body || '',
        icon: '/icon.png',
        badge: '/icon.png',
        data: { url: data.url || '/' }
      });
    })
  );
});