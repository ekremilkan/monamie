self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

const DEFAULT_ICON = '/favicon.svg';

self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('[sw] Push event received without data');
    return;
  }

  const payload = (() => {
    try {
      const parsed = event.data.json();
      console.log('[sw] Push payload (json)', parsed);
      return parsed;
    } catch (_error) {
      const textPayload = event.data.text();
      console.log('[sw] Push payload (text)', textPayload);
      return { title: 'Mon Amie Chicken', body: textPayload };
    }
  })();

  const title = payload.title || 'Mon Amie Chicken';
  const options = {
    body: payload.body || '',
    data: payload,
    icon: payload.icon || DEFAULT_ICON,
    badge: payload.badge || DEFAULT_ICON,
    vibrate: payload.vibrate || [200, 100, 200],
    actions: payload.actions || [],
    requireInteraction: Boolean(payload.requireInteraction),
    tag: payload.tag || `order-${payload.orderId || 'general'}`,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const { url, orderId } = event.notification.data || {};

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      const targetUrl = url || (orderId ? `/order-history?order=${orderId}` : '/');

      for (const client of allClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          client.postMessage({ type: 'ORDER_FOCUS', orderId });
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })()
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      for (const client of allClients) {
        client.postMessage({ type: 'PUSH_SUBSCRIPTION_EXPIRED' });
      }
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
