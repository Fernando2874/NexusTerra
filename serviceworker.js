const CACHE_NAME = 'nexusterra-v2';

const APP_SHELL = [
    './',
    './index.html',
    './manifest.json',
    './icon.png'
];

// ================================
// INSTALACIÓN
// ================================
self.addEventListener('install', event => {
    console.log('🌱 NexusTerra: instalando Service Worker...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

// ================================
// ACTIVACIÓN
// ================================
self.addEventListener('activate', event => {
    console.log('🌱 NexusTerra: Service Worker activado');

    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(cacheName => cacheName !== CACHE_NAME)
                    .map(cacheName => caches.delete(cacheName))
            );
        }).then(() => self.clients.claim())
    );
});

// ================================
// PETICIONES (Cache First)
// ================================
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request)
                    .then(networkResponse => {
                        if (
                            networkResponse &&
                            networkResponse.status === 200 &&
                            event.request.url.startsWith(self.location.origin)
                        ) {
                            const responseClone = networkResponse.clone();

                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseClone);
                                });
                        }

                        return networkResponse;
                    })
                    .catch(() => {
                        if (event.request.mode === 'navigate') {
                            return caches.match('./index.html');
                        }
                    });
            })
    );
});