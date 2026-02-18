self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = {
      title: 'Todogram',
      body: event.data ? event.data.text() : '',
    }
  }

  const title = payload.title || 'Todogram'
  const options = {
    body: payload.body || '',
    icon: '/todogram-icon-20260214-glyph-192.png',
    badge: '/todogram-icon-20260214-glyph-192.png',
    tag: payload.tag || undefined,
    renotify: true,
    data: payload.data || { url: '/' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification?.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.postMessage({
            type: 'todo-notification-click',
            data: event.notification?.data || {},
          })
          return client.focus()
        }
      }
      return clients.openWindow(targetUrl)
    })
  )
})
