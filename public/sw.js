// Listen for push events
self.addEventListener("push", function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey || "1",
        url: data.url || "/",
      },
      actions: [
        {
          action: "view",
          title: "Ver Escala",
        },
        {
          action: "close",
          title: "Fechar",
        },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification click
self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  if (event.action === "view" || !event.action) {
    const urlToOpen = event.notification.data?.url || "/";
    
    event.waitUntil(
      clients.matchAll({ type: "window" }).then(function (clientList) {
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});

// Service worker installation
self.addEventListener("install", function (event) {
  self.skipWaiting();
});

// Service worker activation
self.addEventListener("activate", function (event) {
  event.waitUntil(clients.claim());
});
