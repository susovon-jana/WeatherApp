/* ══════════════════════════════════════════════════════════
   utils.js — HELPERS + PERSISTENT STORAGE LAYER
   SkyCast v2.0

   ★ THE FIX for "saved locations not working":
   Favorites used to be stored as plain strings like
   "Village, District, State, Country". Loading one re-ran a
   city-name geocode that often failed (GPS names are not
   searchable). Now every saved location stores its exact
   coordinates, so a favorite loads instantly & reliably.
   ══════════════════════════════════════════════════════════ */

// ── SAFE localStorage WRAPPER ────────────────────────────
function readStore(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
        return fallback;
    }
}

function writeStore(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.warn('Storage unavailable:', e);
    }
}

// ── LOCATION OBJECT FACTORY ──────────────────────────────
// The single canonical shape used by favorites / recents / lastLocation.
function makeLocationObj(lat, lon, label) {
    return {
        id:    `${(+lat).toFixed(4)},${(+lon).toFixed(4)}`,
        name:  (label || 'My Location').split(',')[0],
        label: label || 'My Location',
        lat:   +lat,
        lon:   +lon,
    };
}

// ── FAVORITES STORE (coordinate-accurate) ────────────────
function saveFavorites()            { writeStore('skycast_favorites_v2', CONFIG.favorites); }

function isFavorite(locObj)         { return !!locObj && CONFIG.favorites.some(f => f.id === locObj.id); }

function addFavorite(locObj) {
    if (!locObj) return false;
    if (isFavorite(locObj)) return false;
    if (CONFIG.favorites.length >= CONFIG.maxFavorites) {
        showToast(`Max ${CONFIG.maxFavorites} favorites. Remove one first.`, 'error');
        return false;
    }
    CONFIG.favorites.push(locObj);
    saveFavorites();
    return true;
}

function removeFavorite(locObj) {
    if (!locObj) return;
    CONFIG.favorites = CONFIG.favorites.filter(f => f.id !== locObj.id);
    saveFavorites();
}

// ── RECENT SEARCHES STORE ────────────────────────────────
function saveRecent(locObj) {
    if (!locObj) return;
    CONFIG.recents = [locObj, ...CONFIG.recents.filter(r => r.id !== locObj.id)]
                         .slice(0, CONFIG.maxRecents);
    writeStore('skycast_recents', CONFIG.recents);
}

// ── LAST LOCATION STORE ──────────────────────────────────
function rememberLastLocation(locObj) {
    CONFIG.lastLocation = locObj;
    writeStore('skycast_last_location', locObj);
}

// ── UNITS STORE ──────────────────────────────────────────
function persistUnits() {
    writeStore('skycast_units', CONFIG.isMetric ? 'metric' : 'imperial');
}


/* ══════════════════════════════════════════════════════════
   FORMAT & CONVERSION HELPERS
══════════════════════════════════════════════════════════ */

// ── TEMPERATURE / WIND ───────────────────────────────────
function convertTemp(celsius) {
    return CONFIG.isMetric
        ? Math.round(celsius)
        : Math.round((celsius * 9 / 5) + 32);
}

function convertWind(kmh) {
    return CONFIG.isMetric
        ? `${Math.round(kmh)} km/h`
        : `${(kmh * 0.621371).toFixed(1)} mph`;
}

// ── WEATHER CODE LOOKUP ──────────────────────────────────
function getWeatherDetails(code) {
    return WEATHER_CODES[code] || { text: "Unknown", icon: "fa-cloud", color: "#94a3b8" };
}

// ── AQI / UV LEVEL LOOKUP ────────────────────────────────
function getAQILevel(aqi) {
    return AQI_LEVELS.find(l => aqi <= l.max) || AQI_LEVELS[AQI_LEVELS.length - 1];
}

function getUVLevel(uv) {
    return UV_LEVELS.find(l => uv <= l.max) || UV_LEVELS[UV_LEVELS.length - 1];
}

// ── WIND / PRESSURE / VISIBILITY LABELS ──────────────────
function getWindDirection(deg) {
    if (deg === undefined || deg === null) return '—';
    const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
    return dirs[Math.round(deg / 22.5) % 16];
}

function getPressureLabel(hpa) {
    if (hpa < 1000) return '↓ Low';
    if (hpa > 1020) return '↑ High';
    return '→ Normal';
}

function getVisibilityLabel(km) {
    if (km >= 10) return 'Excellent';
    if (km >= 5)  return 'Good';
    if (km >= 2)  return 'Moderate';
    if (km >= 1)  return 'Poor';
    return 'Very Poor';
}

// ── MOON PHASE (computed locally — no API needed) ────────
function getMoonPhase(date = new Date()) {
    const synodicMonth = 29.53058867;
    const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14);   // reference new moon
    const days   = (date.getTime() - knownNewMoon) / 86400000;
    const phase  = ((days % synodicMonth) + synodicMonth) % synodicMonth;
    const idx    = Math.floor((phase / synodicMonth) * 8 + 0.5) % 8;
    const illum  = Math.round((1 - Math.cos(2 * Math.PI * phase / synodicMonth)) / 2 * 100);
    return { ...MOON_PHASES[idx], illumination: illum };
}

// ── COUNTRY CODE → FLAG EMOJI ───────────────────────────
function flagEmoji(countryCode) {
    if (!countryCode || countryCode.length !== 2) return '🌍';
    try {
        return String.fromCodePoint(
            ...[...countryCode.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
        );
    } catch (e) { return '🌍'; }
}


/* ══════════════════════════════════════════════════════════
   DATE / TIME HELPERS (timezone-accurate)
══════════════════════════════════════════════════════════ */

function getGreeting() {
    const h = new Date().getHours();
    if (h < 5)  return 'Good Night';
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    if (h < 21) return 'Good Evening';
    return 'Good Night';
}

function formatDate(date) {
    return date.toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
}

function formatTime(iso) {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// ── SUN POSITION ─────────────────────────────────────────
function getSunProgress(sunriseISO, sunsetISO) {
    const now  = Date.now();
    const rise = new Date(sunriseISO).getTime();
    const set  = new Date(sunsetISO).getTime();
    if (!rise || !set || set <= rise) return 0;
    if (now < rise) return 0;
    if (now > set)  return 1;
    return (now - rise) / (set - rise);
}

// ── LOCAL CLOCK (at the viewed location) ─────────────────
function getLocalTimeString(timezone) {
    try {
        return new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit',
            hour12: true, timeZone: timezone
        });
    } catch (e) {
        return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
}

// Location-local date as YYYY-MM-DD (uses the API's utc_offset_seconds)
function locationTodayISO(utcOffsetSec) {
    return new Date(Date.now() + (utcOffsetSec || 0) * 1000).toISOString().slice(0, 10);
}

// ── POLLUTANT BAR WIDTH ──────────────────────────────────
function pollutantPercent(type, value) {
    const maxes = { pm25: 75, pm10: 150, no2: 200, o3: 240 };
    const max   = maxes[type] || 100;
    return Math.min(100, Math.round((value / max) * 100));
}


/* ══════════════════════════════════════════════════════════
   UI HELPERS
══════════════════════════════════════════════════════════ */

// ── TOAST NOTIFICATION ───────────────────────────────────
let toastTimeout;
function showToast(msg, type = 'info') {
    let el = document.getElementById('toast-notification');
    if (!el) {
        el = document.createElement('div');
        el.id = 'toast-notification';
        el.style.cssText = `
            position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
            background: var(--glass-bg); border: 1px solid var(--glass-border);
            backdrop-filter: blur(16px); color: var(--text-primary);
            padding: 10px 20px; border-radius: 12px; font-size: 0.88rem;
            font-weight: 600; z-index: 9998; transition: opacity 0.3s;
            box-shadow: 0 4px 24px rgba(0,0,0,0.3); white-space: nowrap;
        `;
        document.body.appendChild(el);
    }
    const colors = { info: '#60a5fa', success: '#10b981', error: '#ef4444' };
    el.style.borderColor = colors[type] || colors.info;
    el.style.opacity = '1';
    el.textContent = msg;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { el.style.opacity = '0'; }, 3000);
}

// ── DEBOUNCE ─────────────────────────────────────────────
function debounce(fn, ms) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}

// ── GENERIC DOM HELPERS ──────────────────────────────────
function setEl(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function buildLocationString(name, admin, country) {
    return [name, admin, country].filter(Boolean).join(', ');
}
