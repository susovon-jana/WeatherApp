/* ════════════════════════════════════════════════════════
   utils.js — Utility / Helper Functions
   SkyCast Advanced Weather App
   ════════════════════════════════════════════════════════ */

// ── TEMPERATURE CONVERSION ───────────────────────────────
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

// ── AQI LEVEL LOOKUP ─────────────────────────────────────
function getAQILevel(aqi) {
    return AQI_LEVELS.find(l => aqi <= l.max) || AQI_LEVELS[AQI_LEVELS.length - 1];
}

// ── UV LEVEL LOOKUP ──────────────────────────────────────
function getUVLevel(uv) {
    return UV_LEVELS.find(l => uv <= l.max) || UV_LEVELS[UV_LEVELS.length - 1];
}

// ── GREETING ─────────────────────────────────────────────
function getGreeting() {
    const h = new Date().getHours();
    if (h < 5)  return 'Good Night';
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    if (h < 21) return 'Good Evening';
    return 'Good Night';
}

// ── DATE FORMATTING ──────────────────────────────────────
function formatDate(date) {
    return date.toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
}

function formatTime(iso, timezone) {
    // Convert ISO sunrise/sunset to local time string
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// ── SUN POSITION ─────────────────────────────────────────
// Returns 0-1 progress of sun through the day
function getSunProgress(sunriseISO, sunsetISO) {
    const now = Date.now();
    const rise = new Date(sunriseISO).getTime();
    const set  = new Date(sunsetISO).getTime();
    if (now < rise) return 0;
    if (now > set)  return 1;
    return (now - rise) / (set - rise);
}

// ── LOCAL CLOCK ──────────────────────────────────────────
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

// ── POLLUTANT BAR WIDTH ──────────────────────────────────
// Normalizes pollutant µg/m³ to a max of 100% based on WHO reference levels
function pollutantPercent(type, value) {
    const maxes = { pm25: 75, pm10: 150, no2: 200, o3: 240 };
    const max = maxes[type] || 100;
    return Math.min(100, Math.round((value / max) * 100));
}

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
            box-shadow: 0 4px 24px rgba(0,0,0,0.3);
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

// ── SAVE / LOAD FAVORITES ────────────────────────────────
function saveFavorites() {
    localStorage.setItem('skycast_favorites', JSON.stringify(CONFIG.favorites));
}

function addFavorite(locationString) {
    if (CONFIG.favorites.includes(locationString)) return false;
    if (CONFIG.favorites.length >= 8) {
        showToast('Max 8 favorites. Remove one first.', 'error');
        return false;
    }
    CONFIG.favorites.push(locationString);
    saveFavorites();
    return true;
}

function removeFavorite(locationString) {
    CONFIG.favorites = CONFIG.favorites.filter(f => f !== locationString);
    saveFavorites();
}
