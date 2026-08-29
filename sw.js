/* ══════════════════════════════════════════════════════════
   sw.js — SKYCAST SERVICE WORKER
   Strategy:
   • App shell (local files) → precached at install
   • Static assets & CDN libs → stale-while-revalidate
   • Weather/AQI/geocoding APIs → network-first, cached fallback
     (so the last successful data still shows when offline)
   ══════════════════════════════════════════════════════════ */

const VERSION      = 'v2.0.0';
const SHELL_CACHE  = `skycast-shell-${VERSION}`;
const RUNTIME_CACHE = `skycast-runtime-${VERSION}`;

const SHELL_ASSETS = [
    './',
    './index.html',
    './documentation.html',
    './manifest.json',
    './css/base.css',
    './css/layout.css',
    './css/components.css',
    './css/responsive.css',
    './js/config.js',
    './js/utils.js',
    './js/api.js',
    './js/search.js',
    './js/charts.js',
    './js/map.js',
    './js/render.js',
    './js/app.js',
    './assets/favicon.svg',
    './assets/icons/icon-192.png',
    './assets/icons/icon-512.png',
    './assets/icons/apple-touch-icon.png',
];

// ── INSTALL: precache the app shell ──────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(SHELL_CACHE)
            .then((cache) => cache.addAll(SHELL_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// ── ACTIVATE: purge old caches ───────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys
                    .filter((k) => k !== SHELL_CACHE && k !== RUNTIME_CACHE)
                    .map((k) => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

// ── FETCH ROUTING ────────────────────────────────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Only handle GET
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // Weather / AQI / geocoding / radar APIs → network-first with cache fallback
    if (/open-meteo\.com|nominatim\.openstreetmap\.org|rainviewer\.com/.test(url.hostname)) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Same-origin → cache-first (shell is precached)
    if (url.origin === self.location.origin) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // CDN (fonts, icons, chart.js, leaflet) → stale-while-revalidate
    event.respondWith(staleWhileRevalidate(request));
});

// ── STRATEGIES ───────────────────────────────────────────
async function cacheFirst(request) {
    const cached = await caches.match(request);
    return cached || networkFallback(request);
}

async function networkFirst(request) {
    try {
        const fresh = await fetch(request);
        if (fresh && fresh.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, fresh.clone());
        }
        return fresh;
    } catch (e) {
        const cached = await caches.match(request);
        if (cached) return cached;
        throw e;
    }
}

async function staleWhileRevalidate(request) {
    const cached = await caches.match(request);
    const network = fetch(request).then((res) => {
        if (res && res.ok) {
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, res.clone()));
        }
        return res;
    }).catch(() => cached);
    return cached || network;
}

async function networkFallback(request) {
    try {
        return await fetch(request);
    } catch (e) {
        const cached = await caches.match(request);
        if (cached) return cached;
        // Offline navigation → serve the app shell
        if (request.mode === 'navigate') {
            return (await caches.match('./index.html')) || Response.error();
        }
        return Response.error();
    }
}
