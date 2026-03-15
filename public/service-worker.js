const CACHE_NAME = 'ghetto-finance-v3';
const RUNTIME_CACHE = 'ghetto-finance-runtime-v3';
const PROFILE_CACHE = 'ghetto-finance-profile-v3';
const IMAGE_CACHE = 'ghetto-finance-images-v3';

const MAX_RUNTIME_CACHE_SIZE = 50;
const MAX_PROFILE_CACHE_SIZE = 30;
const MAX_IMAGE_CACHE_SIZE = 100;
const CACHE_EXPIRATION_TIME = 24 * 60 * 60 * 1000;

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

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxItems) {
    const itemsToDelete = keys.length - maxItems;
    for (let i = 0; i < itemsToDelete; i++) {
      await cache.delete(keys[i]);
    }
    console.log(`[Service Worker] Trimmed ${itemsToDelete} items from ${cacheName}`);
  }
}

async function isExpired(response) {
  if (!response) return true;

  const dateHeader = response.headers.get('date');
  const cachedAtHeader = response.headers.get('X-Cached-At');

  const timestamp = cachedAtHeader || dateHeader;
  if (!timestamp) return false;

  const cachedTime = new Date(timestamp).getTime();
  const now = Date.now();

  return (now - cachedTime) > CACHE_EXPIRATION_TIME;
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('X-Cached-At', new Date().toISOString());

      const newResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });

      await cache.put(request, newResponse);
      await trimCache(RUNTIME_CACHE, MAX_RUNTIME_CACHE_SIZE);
    }
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', error);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      const expired = await isExpired(cachedResponse);
      if (!expired) {
        return cachedResponse;
      }
      console.log('[Service Worker] Cached response expired');
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
          'X-Cached': 'true',
          'X-Cached-At': new Date().toISOString()
        }
      });

      await cache.put(request, responseToCache);
      await trimCache(PROFILE_CACHE, MAX_PROFILE_CACHE_SIZE);
    }
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed for profile data, using cache:', error);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      const expired = await isExpired(cachedResponse);
      if (!expired) {
        const cached = await cachedResponse.clone();
        const headers = new Headers(cached.headers);
        headers.set('X-Offline', 'true');

        return new Response(cached.body, {
          status: cached.status,
          statusText: cached.statusText,
          headers: headers
        });
      }
      console.log('[Service Worker] Cached profile data expired');
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
    const expired = await isExpired(cachedResponse);
    if (!expired) {
      return cachedResponse;
    }
    console.log('[Service Worker] Cached image expired');
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('X-Cached-At', new Date().toISOString());

      const newResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });

      await cache.put(request, newResponse);
      await trimCache(IMAGE_CACHE, MAX_IMAGE_CACHE_SIZE);
    }
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Image fetch failed:', error);
    if (cachedResponse) {
      return cachedResponse;
    }
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
      clearAllCaches().then(() => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: true });
        }
      }).catch(error => {
        console.error('[Service Worker] Error clearing caches:', error);
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: false, error: error.message });
        }
      })
    );
  }

  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      getCacheSize().then(size => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ size });
        }
      })
    );
  }
});

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
  console.log('[Service Worker] All caches cleared');
}

async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    totalSize += keys.length;
  }

  return totalSize;
}

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
