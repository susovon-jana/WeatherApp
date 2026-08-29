/* ══════════════════════════════════════════════════════════
   config.js — APP CONFIGURATION & STATIC DATA
   SkyCast v2.0 · Advanced Weather Intelligence
   Author: Susovon Jana, Ph.D. · https://dr-susovon.pages.dev
   ══════════════════════════════════════════════════════════ */

// ── APP METADATA ─────────────────────────────────────────
const APP_INFO = {
    name:     'SkyCast',
    version:  '2.0.0',
    author:   'Susovon Jana, Ph.D.',
    website:  'https://dr-susovon.pages.dev',
    github:   'https://github.com/susovon-jana/WeatherApp',
    live:     'https://sky-cast.pages.dev',
};

// ── API ENDPOINTS (all free · no API keys required) ──────
const API = {
    forecast:   'https://api.open-meteo.com/v1/forecast',
    airQuality: 'https://air-quality-api.open-meteo.com/v1/air-quality',
    geocode:    'https://geocoding-api.open-meteo.com/v1/search',
    reverse:    'https://nominatim.openstreetmap.org/reverse',
    rainviewer: 'https://api.rainviewer.com/public/weather-maps.json',
};

// ── SAFE localStorage READ (self-contained for boot ordering) ──
// config.js is the FIRST script loaded, so it cannot rely on helpers
// from utils.js — this private copy keeps boot order fail-safe.
function _readStorePrivate(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
        return fallback;
    }
}

// ── PERSISTED APP STATE ──────────────────────────────────
// Every piece survives page reloads via localStorage (see utils.js stores).
const CONFIG = {
    isMetric:  _readStorePrivate('skycast_units', 'metric') === 'metric',

    // Favorites now store FULL location objects:
    // { id: "lat,lon", name, label, lat, lon }  ← fixes the "saved location" bug
    favorites: _readStorePrivate('skycast_favorites_v2', []),

    // Recently searched locations (same object shape as favorites)
    recents:   _readStorePrivate('skycast_recents', []),

    // Last viewed location — restored on startup instead of re-prompting GPS
    lastLocation: _readStorePrivate('skycast_last_location', null),

    maxFavorites: 12,
    maxRecents:   6,
    refreshMs:    15 * 60 * 1000,   // silent auto-refresh every 15 minutes
};

// ── QUICK PICK: INDIAN CITIES ────────────────────────────
const INDIAN_CITIES = [
    "Kolkata", "Mumbai", "Delhi", "Bangalore", "Chennai",
    "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Lucknow",
    "Bhubaneswar", "Guwahati", "Patna", "Varanasi", "Surat"
];

// ── QUICK PICK: GLOBAL CAPITALS ──────────────────────────
const GLOBAL_CAPITALS = [
    "London", "Tokyo", "Washington D.C.", "Paris", "Berlin",
    "Moscow", "Beijing", "Canberra", "Ottawa", "Brasilia",
    "Rome", "Madrid", "Seoul", "Cairo", "Buenos Aires",
    "Jakarta", "Riyadh", "Bangkok", "Mexico City", "Nairobi",
    "Ankara", "Lagos", "Dhaka", "Islamabad", "Kathmandu",
    "Colombo", "Thimphu", "Kabul", "Rangoon", "Kuala Lumpur"
];

// ── WEATHER CODE DETAILS (WMO codes used by Open-Meteo) ──
const WEATHER_CODES = {
    0:  { text: "Clear Sky",              icon: "fa-sun",                  color: "#facc15" },
    1:  { text: "Mainly Clear",           icon: "fa-sun",                  color: "#fbbf24" },
    2:  { text: "Partly Cloudy",          icon: "fa-cloud-sun",            color: "#60a5fa" },
    3:  { text: "Overcast",               icon: "fa-cloud",                color: "#94a3b8" },
    45: { text: "Foggy",                  icon: "fa-smog",                 color: "#94a3b8" },
    48: { text: "Rime Fog",               icon: "fa-smog",                 color: "#cbd5e1" },
    51: { text: "Light Drizzle",          icon: "fa-cloud-drizzle",        color: "#7dd3fc" },
    53: { text: "Moderate Drizzle",       icon: "fa-cloud-drizzle",        color: "#38bdf8" },
    55: { text: "Dense Drizzle",          icon: "fa-cloud-showers-heavy",  color: "#0ea5e9" },
    61: { text: "Slight Rain",            icon: "fa-cloud-rain",           color: "#60a5fa" },
    63: { text: "Moderate Rain",          icon: "fa-cloud-rain",           color: "#3b82f6" },
    65: { text: "Heavy Rain",             icon: "fa-cloud-showers-heavy",  color: "#2563eb" },
    71: { text: "Slight Snow",            icon: "fa-snowflake",            color: "#bae6fd" },
    73: { text: "Moderate Snow",          icon: "fa-snowflake",            color: "#e0f2fe" },
    75: { text: "Heavy Snow",             icon: "fa-snowflake",            color: "#f0f9ff" },
    77: { text: "Snow Grains",            icon: "fa-snowflake",            color: "#dbeafe" },
    80: { text: "Slight Rain Showers",    icon: "fa-cloud-rain",           color: "#60a5fa" },
    81: { text: "Moderate Rain Showers",  icon: "fa-cloud-showers-heavy",  color: "#3b82f6" },
    82: { text: "Violent Rain Showers",   icon: "fa-cloud-showers-heavy",  color: "#1d4ed8" },
    85: { text: "Slight Snow Showers",    icon: "fa-snowflake",            color: "#bae6fd" },
    86: { text: "Heavy Snow Showers",     icon: "fa-snowflake",            color: "#e0f2fe" },
    95: { text: "Thunderstorm",           icon: "fa-bolt",                 color: "#c084fc" },
    96: { text: "Thunderstorm + Hail",    icon: "fa-bolt",                 color: "#a855f7" },
    99: { text: "Heavy Thunderstorm",     icon: "fa-bolt-lightning",       color: "#7c3aed" },
};

// ── AQI LEVELS ───────────────────────────────────────────
const AQI_LEVELS = [
    { max: 50,       label: "Good",           color: "#10b981", advice: "Air quality is satisfactory. Ideal for outdoor activities." },
    { max: 100,      label: "Moderate",       color: "#f59e0b", advice: "Acceptable air quality. Unusually sensitive people should limit prolonged outdoor exertion." },
    { max: 150,      label: "Unhealthy (SG)", color: "#fb923c", advice: "Sensitive groups should limit outdoor exertion. General public is less likely to be affected." },
    { max: 200,      label: "Unhealthy",      color: "#ef4444", advice: "Everyone may begin to experience health effects. Sensitive groups should avoid outdoor activity." },
    { max: 300,      label: "Very Unhealthy", color: "#a855f7", advice: "Health alert: everyone may experience more serious health effects. Avoid prolonged outdoor activity." },
    { max: Infinity, label: "Hazardous",      color: "#7f1d1d", advice: "Emergency conditions. Entire population is likely to be affected. Stay indoors." },
];

// ── UV INDEX LEVELS ──────────────────────────────────────
const UV_LEVELS = [
    { max: 2,        label: "Low",       color: "#10b981" },
    { max: 5,        label: "Moderate",  color: "#f59e0b" },
    { max: 7,        label: "High",      color: "#fb923c" },
    { max: 10,       label: "Very High", color: "#ef4444" },
    { max: Infinity, label: "Extreme",   color: "#7c3aed" },
];

// ── MOON PHASES ──────────────────────────────────────────
const MOON_PHASES = [
    { icon: "🌑", name: "New Moon" },
    { icon: "🌒", name: "Waxing Crescent" },
    { icon: "🌓", name: "First Quarter" },
    { icon: "🌔", name: "Waxing Gibbous" },
    { icon: "🌕", name: "Full Moon" },
    { icon: "🌖", name: "Waning Gibbous" },
    { icon: "🌗", name: "Last Quarter" },
    { icon: "🌘", name: "Waning Crescent" },
];
