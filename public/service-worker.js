const CACHE_NAME = 'ghetto-finance-v2';
const RUNTIME_CACHE = 'ghetto-finance-runtime-v2';
const PROFILE_CACHE = 'ghetto-finance-profile-v2';
const IMAGE_CACHE = 'ghetto-finance-images-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME &&
              cacheName !== RUNTIME_CACHE &&
              cacheName !== PROFILE_CACHE &&
              cacheName !== IMAGE_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (url.origin === location.origin || url.hostname.includes('supabase')) {
    if (url.hostname.includes('supabase')) {
      if (url.pathname.includes('/rest/v1/profiles') ||
          url.pathname.includes('/rest/v1/referral') ||
          url.pathname.includes('/rest/v1/products') && url.searchParams.get('seller_id')) {
        event.respondWith(profileDataStrategy(request));
      } else {
        event.respondWith(networkFirst(request));
      }
    } else if (request.destination === 'image' || url.pathname.includes('/icons/')) {
      event.respondWith(imageCacheStrategy(request));
    } else {
      event.respondWith(networkFirst(request));
    }
  }
});

async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Fetch failed:', error);
    return new Response('Offline - Content not available', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', error);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    if (request.destination === 'document') {
      const offlinePage = await cache.match('/');
      if (offlinePage) {
        return offlinePage;
      }
    }

    return new Response('Offline - Content not available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

async function profileDataStrategy(request) {
  const cache = await caches.open(PROFILE_CACHE);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const clonedResponse = networkResponse.clone();
      const data = await clonedResponse.json();

      const responseToCache = new Response(JSON.stringify({
        data: data,
        cached: true,
        cachedAt: new Date().toISOString()
      }), {
        headers: {
          'Content-Type': 'application/json',
          'X-Cached': 'true'
        }
      });

      cache.put(request, responseToCache);
    }
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed for profile data, using cache:', error);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      const cached = await cachedResponse.clone();
      const headers = new Headers(cached.headers);
      headers.set('X-Offline', 'true');

      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers: headers
      });
    }

    return new Response(JSON.stringify({ error: 'Offline - No cached data available' }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function imageCacheStrategy(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Image fetch failed:', error);
    return new Response('', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_PROFILE_DATA') {
    cacheProfileData(event.data.payload);
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      })
    );
  }
});

async function cacheProfileData(data) {
  const cache = await caches.open(PROFILE_CACHE);
  const cacheData = {
    data: data,
    cached: true,
    cachedAt: new Date().toISOString()
  };

  const response = new Response(JSON.stringify(cacheData), {
    headers: { 'Content-Type': 'application/json' }
  });

  await cache.put('/offline/profile', response);
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-profile') {
    event.waitUntil(syncProfileData());
  }

  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

async function syncProfileData() {
  console.log('[Service Worker] Syncing profile data in background...');
}

async function syncMessages() {
  console.log('[Service Worker] Syncing messages in background...');
}
