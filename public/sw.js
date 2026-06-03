// beepbeep Service Worker - 백그라운드 푸시 알림

self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'beepbeep 💕'
  const options = {
    body: data.body || '새로운 알림이 있어요',
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [100, 50, 100, 300, 100, 50, 100],
    data: data,
    actions: [
      { action: 'open', title: '확인하기' },
      { action: 'close', title: '닫기' }
    ]
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  if (event.action === 'open' || !event.action) {
    event.waitUntil(clients.openWindow('/'))
  }
})

self.addEventListener('install', e => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(clients.claim()))
