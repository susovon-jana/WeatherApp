/* ════════════════════════════════════════════════════════
   app.js — MERGED: config + utils + api + render + app
   SkyCast Advanced Weather App
   Data Provider: OpenWeatherMap (One Call 3.0 + Air Pollution + Geocoding)
   ════════════════════════════════════════════════════════ */


/* ══════════════════════════════════════════════════════════
   SECTION 1 — CONFIGURATION & STATIC DATA
══════════════════════════════════════════════════════════ */

// ── OWM API KEY ──────────────────────────────────────────
const OWM_KEY = '5dddccc6fc25a0ea088cbc058842a970';

// ── APP STATE ────────────────────────────────────────────
const CONFIG = {
    isMetric: true,
    favorites: JSON.parse(localStorage.getItem('skycast_favorites')) || [],
    lastLocation: null,
};

// ── INDIAN CITIES ────────────────────────────────────────
const INDIAN_CITIES = [
    "Kolkata", "Mumbai", "Delhi", "Bangalore", "Chennai",
    "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Lucknow",
    "Bhubaneswar", "Guwahati", "Patna", "Varanasi", "Surat"
];

// ── GLOBAL CAPITALS ──────────────────────────────────────
const GLOBAL_CAPITALS = [
    "London", "Tokyo", "Washington D.C.", "Paris", "Berlin",
    "Moscow", "Beijing", "Canberra", "Ottawa", "Brasilia",
    "Rome", "Madrid", "Seoul", "Cairo", "Buenos Aires",
    "Jakarta", "Riyadh", "Bangkok", "Mexico City", "Nairobi",
    "Ankara", "Lagos", "Dhaka", "Islamabad", "Kathmandu",
    "Colombo", "Thimphu", "Kabul", "Rangoon", "Kuala Lumpur"
];

// ── OWM CONDITION ID → ICON / COLOR / TEXT ───────────────
function owmConditionDetails(id, pod) {
    const night = pod === 'n';
    if (id === 800) return night
        ? { text: 'Clear Night',       icon: 'fa-moon',                color: '#818cf8' }
        : { text: 'Clear Sky',         icon: 'fa-sun',                 color: '#facc15' };
    if (id === 801) return { text: 'Few Clouds',        icon: night ? 'fa-cloud-moon' : 'fa-cloud-sun', color: '#60a5fa' };
    if (id === 802) return { text: 'Scattered Clouds',  icon: 'fa-cloud-sun',          color: '#94a3b8' };
    if (id >= 803)  return { text: 'Overcast',          icon: 'fa-cloud',              color: '#64748b' };
    if (id >= 762)  return { text: 'Volcanic Ash',      icon: 'fa-smog',               color: '#78716c' };
    if (id >= 751)  return { text: 'Sand / Dust',       icon: 'fa-smog',               color: '#d97706' };
    if (id >= 741)  return { text: 'Fog',               icon: 'fa-smog',               color: '#94a3b8' };
    if (id >= 731)  return { text: 'Sand Whirls',       icon: 'fa-smog',               color: '#b45309' };
    if (id >= 721)  return { text: 'Haze',              icon: 'fa-smog',               color: '#a8a29e' };
    if (id >= 711)  return { text: 'Smoke',             icon: 'fa-smog',               color: '#78716c' };
    if (id >= 700)  return { text: 'Mist',              icon: 'fa-smog',               color: '#94a3b8' };
    if (id >= 622)  return { text: 'Heavy Snow Shower', icon: 'fa-snowflake',          color: '#e0f2fe' };
    if (id >= 620)  return { text: 'Snow Shower',       icon: 'fa-snowflake',          color: '#bae6fd' };
    if (id >= 615)  return { text: 'Rain and Snow',     icon: 'fa-cloud-rain',         color: '#7dd3fc' };
    if (id >= 611)  return { text: 'Sleet',             icon: 'fa-cloud-rain',         color: '#93c5fd' };
    if (id >= 602)  return { text: 'Heavy Snow',        icon: 'fa-snowflake',          color: '#f0f9ff' };
    if (id >= 601)  return { text: 'Snow',              icon: 'fa-snowflake',          color: '#e0f2fe' };
    if (id >= 600)  return { text: 'Light Snow',        icon: 'fa-snowflake',          color: '#bae6fd' };
    if (id === 511) return { text: 'Freezing Rain',     icon: 'fa-cloud-showers-heavy',color: '#7dd3fc' };
    if (id >= 502)  return { text: 'Heavy Rain',        icon: 'fa-cloud-showers-heavy',color: '#2563eb' };
    if (id >= 501)  return { text: 'Moderate Rain',     icon: 'fa-cloud-rain',         color: '#3b82f6' };
    if (id >= 500)  return { text: 'Light Rain',        icon: 'fa-cloud-rain',         color: '#60a5fa' };
    if (id >= 321)  return { text: 'Heavy Drizzle',     icon: 'fa-cloud-drizzle',      color: '#38bdf8' };
    if (id >= 310)  return { text: 'Drizzle Rain',      icon: 'fa-cloud-drizzle',      color: '#7dd3fc' };
    if (id >= 300)  return { text: 'Light Drizzle',     icon: 'fa-cloud-drizzle',      color: '#7dd3fc' };
    if (id >= 232)  return { text: 'Thunderstorm + Heavy Rain', icon: 'fa-cloud-bolt', color: '#7c3aed' };
    if (id >= 230)  return { text: 'Thunderstorm + Rain',       icon: 'fa-cloud-bolt', color: '#a855f7' };
    if (id >= 221)  return { text: 'Ragged Thunderstorm',       icon: 'fa-bolt',       color: '#c084fc' };
    if (id >= 210)  return { text: 'Light Thunderstorm',        icon: 'fa-bolt',       color: '#c084fc' };
    if (id >= 200)  return { text: 'Thunderstorm',              icon: 'fa-bolt',       color: '#a855f7' };
    return { text: 'Unknown', icon: 'fa-cloud', color: '#94a3b8' };
}

// ── OWM AQI SCALE (1–5) ──────────────────────────────────
const OWM_AQI_LEVELS = [
    { label: 'Good',      color: '#10b981', advice: 'Air quality is satisfactory. Ideal for outdoor activities.' },
    { label: 'Fair',      color: '#84cc16', advice: 'Air quality is acceptable. Moderate concern for very sensitive individuals.' },
    { label: 'Moderate',  color: '#f59e0b', advice: 'Sensitive groups should reduce prolonged or heavy outdoor exertion.' },
    { label: 'Poor',      color: '#ef4444', advice: 'Everyone may experience health effects. Sensitive groups should avoid outdoor activity.' },
    { label: 'Very Poor', color: '#7c3aed', advice: 'Health alert: serious effects for everyone. Avoid all outdoor activity.' },
];

// Approximate US-AQI equivalent for ring display
const OWM_AQI_TO_US = [25, 75, 125, 175, 250];

// ── UV LEVELS ────────────────────────────────────────────
const UV_LEVELS = [
    { max: 2,        label: 'Low',       color: '#10b981' },
    { max: 5,        label: 'Moderate',  color: '#f59e0b' },
    { max: 7,        label: 'High',      color: '#fb923c' },
    { max: 10,       label: 'Very High', color: '#ef4444' },
    { max: Infinity, label: 'Extreme',   color: '#7c3aed' },
];

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


/* ══════════════════════════════════════════════════════════
   SECTION 2 — UTILITY HELPERS
══════════════════════════════════════════════════════════ */

function convertTemp(celsius) {
    return CONFIG.isMetric
        ? Math.round(celsius)
        : Math.round((celsius * 9 / 5) + 32);
}

function convertWind(mps) {
    // OWM returns wind in m/s
    const kmh = mps * 3.6;
    return CONFIG.isMetric
        ? `${Math.round(kmh)} km/h`
        : `${(mps * 2.237).toFixed(1)} mph`;
}

function getUVLevel(uv) {
    return UV_LEVELS.find(l => uv <= l.max) || UV_LEVELS[UV_LEVELS.length - 1];
}

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

// OWM gives unix timestamps + timezone offset seconds
function formatTime(unixTs, tzOffsetSec) {
    const d    = new Date((unixTs + tzOffsetSec) * 1000);
    const h    = d.getUTCHours();
    const m    = d.getUTCMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${(h % 12) || 12}:${m} ${ampm}`;
}

function getSunProgress(sunriseUnix, sunsetUnix) {
    const now = Math.floor(Date.now() / 1000);
    if (now < sunriseUnix) return 0;
    if (now > sunsetUnix)  return 1;
    return (now - sunriseUnix) / (sunsetUnix - sunriseUnix);
}

function getLocalTimeString(tzOffsetSec) {
    try {
        const now = new Date();
        const utc = now.getTime() + now.getTimezoneOffset() * 60000;
        const loc = new Date(utc + tzOffsetSec * 1000);
        const h   = loc.getHours();
        const m   = loc.getMinutes().toString().padStart(2, '0');
        return `${(h % 12) || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
    } catch (e) {
        return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
}

function pollutantPercent(type, value) {
    const maxes = { pm2_5: 75, pm10: 150, no2: 200, o3: 240, so2: 350, co: 10000 };
    return Math.min(100, Math.round((value / (maxes[type] || 100)) * 100));
}

function capitalise(str) {
    return str ? str.replace(/\b\w/g, c => c.toUpperCase()) : '';
}

let toastTimeout;
function showToast(msg, type = 'info') {
    let el = document.getElementById('toast-notification');
    if (!el) {
        el = document.createElement('div');
        el.id = 'toast-notification';
        el.style.cssText = `
            position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
            background:var(--glass-bg);border:1px solid var(--glass-border);
            backdrop-filter:blur(16px);color:var(--text-primary);
            padding:10px 20px;border-radius:12px;font-size:0.88rem;
            font-weight:600;z-index:9998;transition:opacity 0.3s;
            box-shadow:0 4px 24px rgba(0,0,0,0.3);white-space:nowrap;
        `;
        document.body.appendChild(el);
    }
    const colors = { info: '#60a5fa', success: '#10b981', error: '#ef4444' };
    el.style.borderColor = colors[type] || colors.info;
    el.style.opacity = '1';
    el.textContent = msg;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { el.style.opacity = '0'; }, 3500);
}

function saveFavorites() { localStorage.setItem('skycast_favorites', JSON.stringify(CONFIG.favorites)); }

function addFavorite(loc) {
    if (CONFIG.favorites.includes(loc)) return false;
    if (CONFIG.favorites.length >= 8) { showToast('Max 8 favorites. Remove one first.', 'error'); return false; }
    CONFIG.favorites.push(loc);
    saveFavorites();
    return true;
}

function removeFavorite(loc) {
    CONFIG.favorites = CONFIG.favorites.filter(f => f !== loc);
    saveFavorites();
}

function setEl(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}


/* ══════════════════════════════════════════════════════════
   SECTION 3 — DATA FETCHING  (OpenWeatherMap APIs)
══════════════════════════════════════════════════════════ */

let currentWeatherData = null;

// ── GEOCODE: city name → lat/lon (OWM Geocoding API) ─────
async function fetchCoordinates(cityName) {
    setLocationLoading(`Searching "${cityName}"...`);
    try {
        const res  = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${OWM_KEY}`
        );
        const data = await res.json();
        if (!Array.isArray(data) || !data.length)
            throw new Error(`"${cityName}" not found. Try a different name.`);

        const loc  = data[0];
        const name = loc.local_names?.en || loc.name;
        await getLiveWeatherData(loc.lat, loc.lon, buildLocationString(name, loc.state, loc.country));
    } catch (e) {
        showToast(e.message || 'City not found.', 'error');
        setLocationLoading('Search failed');
    }
}

// ── REVERSE GEOCODE: lat/lon → name (OWM Reverse Geocoding) ─
async function reverseGeocode(lat, lon) {
    const res  = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${OWM_KEY}`
    );
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return 'GPS Location';
    const loc  = data[0];
    const name = loc.local_names?.en || loc.name || '';
    return buildLocationString(name, loc.state, loc.country);
}

// ── GPS HANDLER ──────────────────────────────────────────
async function handleGPS() {
    const gpsBtn = document.getElementById('gps-btn');
    if (!navigator.geolocation) {
        showToast('GPS not available on this device.', 'error');
        fetchCoordinates('Kolkata');
        return;
    }
    gpsBtn.classList.add('locating');
    setLocationLoading('Acquiring GPS…');

    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const { latitude: lat, longitude: lon } = pos.coords;
            try {
                const locName = await reverseGeocode(lat, lon);
                await getLiveWeatherData(lat, lon, locName);
            } catch (e) {
                await getLiveWeatherData(lat, lon, 'My Location');
            } finally {
                gpsBtn.classList.remove('locating');
            }
        },
        (err) => {
            gpsBtn.classList.remove('locating');
            const msgs = {
                1: 'Location access denied. Please allow in browser settings.',
                2: 'Position unavailable. Try searching a city name.',
                3: 'Location request timed out.',
            };
            showToast(msgs[err.code] || 'GPS error.', 'error');
            fetchCoordinates('Kolkata');
        },
        { timeout: 12000, enableHighAccuracy: true, maximumAge: 0 }
    );
}

// ── MAIN WEATHER FETCH (One Call 3.0 + Air Pollution) ────
async function getLiveWeatherData(lat, lon, locationName) {
    setDashboardLoading(true);
    try {
        const oneCallUrl = `https://api.openweathermap.org/data/3.0/onecall` +
            `?lat=${lat}&lon=${lon}&units=metric&appid=${OWM_KEY}&exclude=minutely,alerts`;

        const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution` +
            `?lat=${lat}&lon=${lon}&appid=${OWM_KEY}`;

        const [wcRes, aqRes] = await Promise.all([fetch(oneCallUrl), fetch(aqiUrl)]);

        if (!wcRes.ok) {
            const err = await wcRes.json().catch(() => ({}));
            throw new Error(err.message || `Weather fetch failed (${wcRes.status})`);
        }

        const wc  = await wcRes.json();
        const aqd = aqRes.ok ? await aqRes.json() : { list: [] };

        const cur      = wc.current;
        const tzOffset = wc.timezone_offset; // seconds from UTC

        // Determine day/night for icon selection
        const localHour = new Date((cur.dt + tzOffset) * 1000).getUTCHours();
        const pod       = (localHour >= 6 && localHour < 20) ? 'd' : 'n';

        // AQI
        const aqList  = aqd.list?.[0] || {};
        const aqComp  = aqList.components || {};
        const owmAqi  = aqList.main?.aqi || 1;
        const aqiInfo = OWM_AQI_LEVELS[owmAqi - 1];

        currentWeatherData = {
            location: locationName,
            lat, lon,
            tzOffset,
            timezone: wc.timezone,

            current: {
                temp:       cur.temp,
                feelsLike:  cur.feels_like,
                humidity:   cur.humidity,
                wind:       cur.wind_speed,     // m/s
                windDeg:    cur.wind_deg,
                precip:     cur.rain?.['1h'] || cur.snow?.['1h'] || 0,
                condId:     cur.weather[0].id,
                condPod:    pod,
                condDesc:   cur.weather[0].description,
                pressure:   cur.pressure,
                visibility: cur.visibility ? (cur.visibility / 1000).toFixed(1) : null,
                uv:         cur.uvi,
                cloudCover: cur.clouds,
                sunrise:    cur.sunrise,
                sunset:     cur.sunset,
                dewPoint:   cur.dew_point,
            },

            todayMax:  wc.daily[0].temp.max,
            todayMin:  wc.daily[0].temp.min,
            todayRain: Math.round((wc.daily[0].pop || 0) * 100),

            aqi: {
                owmIndex: owmAqi,
                label:    aqiInfo.label,
                color:    aqiInfo.color,
                advice:   aqiInfo.advice,
                usApprox: OWM_AQI_TO_US[owmAqi - 1],
                pm2_5:    aqComp.pm2_5  ?? 0,
                pm10:     aqComp.pm10   ?? 0,
                no2:      aqComp.no2    ?? 0,
                o3:       aqComp.o3     ?? 0,
                so2:      aqComp.so2    ?? 0,
                co:       aqComp.co     ?? 0,
            },

            hourly:   buildHourlyData(wc),
            forecast: buildForecastData(wc),
        };

        CONFIG.lastLocation = { lat, lon, locationName };
        renderDashboard();

    } catch (e) {
        console.error('OWM API error:', e);
        showToast('Failed to load weather: ' + (e.message || 'Check your connection.'), 'error');
        setDashboardLoading(false);
    }
}

// ── HOURLY DATA (next 24h from OWM 48h hourly) ───────────
function buildHourlyData(wc) {
    const hourly   = [];
    const tzOffset = wc.timezone_offset;

    wc.hourly.slice(0, 24).forEach((h, idx) => {
        const localHr = new Date((h.dt + tzOffset) * 1000).getUTCHours();
        hourly.push({
            dt:        h.dt,
            tzOffset,
            temp:      h.temp,
            condId:    h.weather[0].id,
            condPod:   (localHr >= 6 && localHr < 20) ? 'd' : 'n',
            rainProb:  Math.round((h.pop || 0) * 100),
            humidity:  h.humidity,
            isCurrent: idx === 0,
        });
    });
    return hourly;
}

// ── DAILY FORECAST (8 days from OWM One Call) ────────────
function buildForecastData(wc) {
    const tzOffset = wc.timezone_offset;
    return wc.daily.map(day => ({
        dt:        day.dt,
        tzOffset,
        max:       day.temp.max,
        min:       day.temp.min,
        condId:    day.weather[0].id,
        condDesc:  day.weather[0].description,
        rainProb:  Math.round((day.pop || 0) * 100),
        humidity:  day.humidity,
        uvMax:     day.uvi,
        precipSum: day.rain || day.snow || 0,
        sunrise:   day.sunrise,
        sunset:    day.sunset,
    }));
}

// ── COMPARE TWO CITIES ───────────────────────────────────
async function compareCities(city1, city2) {
    const geocode = async (city) => {
        const res  = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${OWM_KEY}`
        );
        const data = await res.json();
        if (!Array.isArray(data) || !data.length) throw new Error(`"${city}" not found`);
        return data[0];
    };

    const getCurrent = async (lat, lon) => {
        const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OWM_KEY}`
        );
        return res.json();
    };

    const [loc1, loc2] = await Promise.all([geocode(city1), geocode(city2)]);
    const [wx1,  wx2]  = await Promise.all([getCurrent(loc1.lat, loc1.lon), getCurrent(loc2.lat, loc2.lon)]);

    return [
        { name: loc1.local_names?.en || loc1.name, country: loc1.country, data: wx1 },
        { name: loc2.local_names?.en || loc2.name, country: loc2.country, data: wx2 },
    ];
}

// ── DOM / STATE HELPERS ───────────────────────────────────
function buildLocationString(name, state, country) {
    return [name, state, country].filter(Boolean).join(', ');
}
function setLocationLoading(msg) {
    const el = document.getElementById('current-location-name');
    if (el) el.textContent = msg;
}
function setDashboardLoading(on) {
    const el = document.getElementById('loading-screen');
    if (!el) return;
    if (on) el.classList.remove('fade-out');
    else    el.classList.add('fade-out');
}


/* ══════════════════════════════════════════════════════════
   SECTION 4 — DOM RENDERING
══════════════════════════════════════════════════════════ */

function renderDashboard() {
    if (!currentWeatherData) return;
    setDashboardLoading(false);
    renderHero();
    renderMetrics();
    renderAQI();
    renderHourly();
    renderForecast();
    checkFavoriteState();
    startLocalClock();
}

// ── HERO ─────────────────────────────────────────────────
function renderHero() {
    const d  = currentWeatherData;
    const wd = owmConditionDetails(d.current.condId, d.current.condPod);

    setEl('current-location-name', d.location.split(',')[0]);
    setEl('location-sub', d.location.split(',').slice(1).join(',').trim());

    const tempEl = document.getElementById('current-temp');
    if (tempEl) {
        tempEl.textContent = convertTemp(d.current.temp);
        tempEl.classList.remove('updated');
        void tempEl.offsetWidth;
        tempEl.classList.add('updated');
    }

    document.querySelectorAll('.unit-symbol').forEach(el => {
        el.textContent = CONFIG.isMetric ? '°C' : '°F';
    });

    setEl('current-condition',  capitalise(d.current.condDesc));
    setEl('current-feels-like', convertTemp(d.current.feelsLike));
    setEl('today-high',         convertTemp(d.todayMax));
    setEl('today-low',          convertTemp(d.todayMin));

    const iconEl = document.getElementById('current-icon');
    if (iconEl) {
        iconEl.className   = `fas ${wd.icon} hero-icon`;
        iconEl.style.color = wd.color;
    }
    setEl('weather-bg-label', wd.text);

    setEl('sunrise-time', formatTime(d.current.sunrise, d.tzOffset));
    setEl('sunset-time',  formatTime(d.current.sunset,  d.tzOffset));

    const pct         = Math.round(getSunProgress(d.current.sunrise, d.current.sunset) * 100);
    const progressBar = document.getElementById('sun-progress');
    const sunDot      = document.getElementById('sun-dot');
    if (progressBar) progressBar.style.width = `${pct}%`;
    if (sunDot)       sunDot.style.left       = `${pct}%`;
}

// ── METRICS ──────────────────────────────────────────────
function renderMetrics() {
    const d = currentWeatherData;

    setEl('current-humidity',   `${d.current.humidity}%`);
    setEl('current-wind',       convertWind(d.current.wind));
    setEl('current-precip',     `${d.current.precip.toFixed(1)} mm`);
    setEl('current-pressure',   d.current.pressure ? `${Math.round(d.current.pressure)} hPa` : '—');
    setEl('current-uv',         d.current.uv !== null ? `${d.current.uv.toFixed(1)}` : '—');
    setEl('current-visibility', d.current.visibility ? `${d.current.visibility} km` : '—');

    const humBar = document.getElementById('humidity-bar');
    if (humBar) humBar.style.width = `${d.current.humidity}%`;

    const windDir = getWindDirection(d.current.windDeg);
    setEl('wind-direction-text', windDir !== '—' ? `Blowing ${windDir}` : '—');
    setEl('rain-prob-text', `${d.todayRain}% chance today`);

    if (d.current.visibility)
        setEl('visibility-label', getVisibilityLabel(parseFloat(d.current.visibility)));

    if (d.current.uv !== null && d.current.uv !== undefined) {
        const uvLevel = getUVLevel(d.current.uv);
        setEl('uv-label', uvLevel.label);
        const uvEl = document.getElementById('current-uv');
        if (uvEl) uvEl.style.color = uvLevel.color;
    }

    if (d.current.pressure)
        setEl('pressure-label', getPressureLabel(d.current.pressure));
}

// ── AQI ──────────────────────────────────────────────────
function renderAQI() {
    const aqi = currentWeatherData.aqi;

    // Show OWM 1-5 index in the ring centre, label in badge
    const numEl = document.getElementById('aqi-value');
    if (numEl) { numEl.textContent = aqi.owmIndex; numEl.style.color = aqi.color; }

    const badge = document.getElementById('aqi-badge');
    if (badge) {
        badge.textContent   = aqi.label;
        badge.style.cssText = `background:${aqi.color}22;color:${aqi.color};border-color:${aqi.color}44;`;
    }

    // Arc uses US-approximate score for visual proportion
    const arc = document.getElementById('aqi-arc');
    if (arc) {
        const offset = 314 - Math.min(314, (aqi.usApprox / 300) * 314);
        arc.style.strokeDashoffset = offset;
        arc.style.stroke           = aqi.color;
    }

    // Pollutant bars
    [
        { id: 'pm25', barId: 'pm25-bar', val: aqi.pm2_5, type: 'pm2_5' },
        { id: 'pm10', barId: 'pm10-bar', val: aqi.pm10,  type: 'pm10'  },
        { id: 'no2',  barId: 'no2-bar',  val: aqi.no2,   type: 'no2'   },
        { id: 'o3',   barId: 'o3-bar',   val: aqi.o3,    type: 'o3'    },
    ].forEach(({ id, barId, val, type }) => {
        const n = typeof val === 'number' ? val : 0;
        setEl(`${id}-val`, n > 0 ? n.toFixed(1) : '--');
        const barEl = document.getElementById(barId);
        if (barEl) barEl.style.width = `${pollutantPercent(type, n)}%`;
    });

    setEl('aqi-health-advice', aqi.advice);
}

// ── HOURLY ───────────────────────────────────────────────
function renderHourly() {
    const container = document.getElementById('hourly-container');
    if (!container) return;
    container.innerHTML = '';

    if (!currentWeatherData.hourly?.length) {
        container.innerHTML = '<p style="color:var(--text-muted);padding:10px;">No hourly data.</p>';
        return;
    }

    currentWeatherData.hourly.forEach((h) => {
        const wd  = owmConditionDetails(h.condId, h.condPod);
        const ts  = formatTime(h.dt, h.tzOffset);
        const card = document.createElement('div');
        card.className = `hourly-card ${h.isCurrent ? 'current-hour' : ''}`;
        card.innerHTML = `
            <span class="h-time">${h.isCurrent ? 'Now' : ts}</span>
            <i class="fas ${wd.icon} h-icon" style="color:${wd.color}"></i>
            <span class="h-temp">${convertTemp(h.temp)}°</span>
            ${h.rainProb > 0 ? `<span class="h-rain"><i class="fas fa-droplet"></i> ${h.rainProb}%</span>` : ''}
        `;
        container.appendChild(card);
    });
}

// ── FORECAST ─────────────────────────────────────────────
function renderForecast() {
    const container = document.getElementById('forecast-container');
    if (!container) return;
    container.innerHTML = '';

    const tzOffset  = currentWeatherData.tzOffset;
    const nowLocal  = new Date((Math.floor(Date.now() / 1000) + tzOffset) * 1000);

    currentWeatherData.forecast.forEach((day) => {
        const wd      = owmConditionDetails(day.condId, 'd');
        const dayLocal = new Date((day.dt + day.tzOffset) * 1000);
        const isToday  = dayLocal.getUTCFullYear() === nowLocal.getUTCFullYear()
                      && dayLocal.getUTCMonth()    === nowLocal.getUTCMonth()
                      && dayLocal.getUTCDate()     === nowLocal.getUTCDate();

        const dayStr  = dayLocal.toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'UTC' });
        const dateNum = dayLocal.getUTCDate();
        const monStr  = dayLocal.toLocaleDateString('en-IN', { month: 'short', timeZone: 'UTC' });

        const card = document.createElement('div');
        card.className = `forecast-card ${isToday ? 'today' : ''}`;
        card.innerHTML = `
            <span class="fc-day">${isToday ? 'Today' : dayStr}</span>
            <span class="fc-date-num">${dateNum} ${monStr}</span>
            <i class="fas ${wd.icon} fc-icon" style="color:${wd.color}"></i>
            <span class="fc-high">${convertTemp(day.max)}°</span>
            <span class="fc-low">${convertTemp(day.min)}°</span>
            ${day.rainProb > 0 ? `<span class="fc-rain"><i class="fas fa-umbrella"></i> ${day.rainProb}%</span>` : ''}
            <span class="fc-humidity-text"><i class="fas fa-droplet"></i> ${day.humidity}%</span>
        `;
        container.appendChild(card);
    });
}

// ── FAVORITES ─────────────────────────────────────────────
function checkFavoriteState() {
    const loc = currentWeatherData?.location;
    if (!loc) return;
    const btn = document.getElementById('save-fav-btn');
    if (!btn) return;
    const isFav = CONFIG.favorites.includes(loc);
    btn.innerHTML = isFav ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
    btn.title     = isFav ? 'Remove from Favorites' : 'Save to Favorites';
}

function renderFavoritesDropdown() {
    const sel = document.getElementById('favorite-locations');
    if (!sel) return;
    sel.innerHTML = '<option value="" disabled selected>❤️ Saved Favorites</option>';
    CONFIG.favorites.forEach(loc => {
        const o = document.createElement('option');
        o.value = loc;
        o.textContent = loc.length > 30 ? loc.substring(0, 28) + '…' : loc;
        sel.appendChild(o);
    });
}

// ── COMPARE RESULTS ───────────────────────────────────────
function renderCompareResults(results) {
    const container = document.getElementById('compare-results');
    if (!container) return;
    container.classList.remove('hidden');
    container.innerHTML = results.map(({ name, country, data }) => {
        const wd   = owmConditionDetails(data.weather[0].id, 'd');
        const temp = data.main.temp;
        const hum  = data.main.humidity;
        const wind = data.wind.speed;
        const prec = data.rain?.['1h'] || 0;
        return `
            <div class="compare-item">
                <span class="cmp-city">${name}</span>
                <span style="font-size:0.72rem;color:var(--text-muted);">${country}</span>
                <i class="fas ${wd.icon}" style="font-size:1.9rem;color:${wd.color};margin:5px 0;"></i>
                <span class="cmp-temp">${convertTemp(temp)}°</span>
                <div class="cmp-meta">
                    <span><i class="fas fa-droplet"    style="color:var(--c-humidity)"></i> ${hum}%</span>
                    <span><i class="fas fa-wind"        style="color:var(--c-wind)"></i>    ${convertWind(wind)}</span>
                    <span><i class="fas fa-cloud-rain"  style="color:var(--c-precip)"></i>  ${prec.toFixed(1)} mm</span>
                </div>
                <span style="font-size:0.72rem;color:var(--text-muted);margin-top:3px;">${capitalise(data.weather[0].description)}</span>
            </div>
        `;
    }).join('');
}

// ── LOCAL CLOCK ───────────────────────────────────────────
let clockInterval;
function startLocalClock() {
    const el = document.getElementById('local-time');
    if (!el) return;
    clearInterval(clockInterval);
    const tzOffset = currentWeatherData?.tzOffset;
    const tick = () => { el.textContent = getLocalTimeString(tzOffset); };
    tick();
    clockInterval = setInterval(tick, 1000);
}

// ── CITY CHIP ACTIVE STATE ────────────────────────────────
function setActiveChip(cityName) {
    document.querySelectorAll('.city-chip').forEach(c => {
        c.classList.toggle('active', c.textContent === cityName);
    });
}


/* ══════════════════════════════════════════════════════════
   SECTION 5 — MAIN ENTRY POINT & EVENT LISTENERS
══════════════════════════════════════════════════════════ */

const DOM = {
    themeToggle:    () => document.getElementById('theme-toggle'),
    unitToggle:     () => document.getElementById('unit-toggle'),
    citySearch:     () => document.getElementById('city-search'),
    gpsBtn:         () => document.getElementById('gps-btn'),
    capitalsSelect: () => document.getElementById('global-capitals'),
    favSelect:      () => document.getElementById('favorite-locations'),
    saveFavBtn:     () => document.getElementById('save-fav-btn'),
    greeting:       () => document.getElementById('dynamic-greeting'),
    dateEl:         () => document.getElementById('current-date'),
    cityContainer:  () => document.getElementById('indian-cities-container'),
};

function init() {
    setGreetingAndDate();
    populateCityChips();
    populateCapitalsSelect();
    renderFavoritesDropdown();
    applySystemTheme();
    setupEventListeners();
    handleGPS();
}

function setGreetingAndDate() {
    const greetEl = DOM.greeting();
    const dateEl  = DOM.dateEl();
    if (greetEl) greetEl.textContent = `${getGreeting()}!`;
    if (dateEl)  dateEl.textContent  = formatDate(new Date());
}

function applySystemTheme() {
    const saved = localStorage.getItem('skycast_theme');
    if (saved) setTheme(saved);
    else if (window.matchMedia('(prefers-color-scheme: light)').matches) setTheme('light');
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = DOM.themeToggle();
    if (btn) btn.innerHTML = theme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    localStorage.setItem('skycast_theme', theme);
}

function populateCityChips() {
    const container = DOM.cityContainer();
    if (!container) return;
    container.innerHTML = '';
    INDIAN_CITIES.forEach(city => {
        const chip = document.createElement('span');
        chip.className   = 'city-chip';
        chip.textContent = city;
        chip.addEventListener('click', () => { setActiveChip(city); fetchCoordinates(city); });
        container.appendChild(chip);
    });
}

function populateCapitalsSelect() {
    const sel = DOM.capitalsSelect();
    if (!sel) return;
    GLOBAL_CAPITALS.forEach(city => {
        const opt = document.createElement('option');
        opt.value = city; opt.textContent = city;
        sel.appendChild(opt);
    });
}

function setupEventListeners() {
    DOM.themeToggle()?.addEventListener('click', () => {
        setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });

    DOM.unitToggle()?.addEventListener('click', () => {
        CONFIG.isMetric = !CONFIG.isMetric;
        DOM.unitToggle().textContent = CONFIG.isMetric ? '°C' : '°F';
        if (currentWeatherData) renderDashboard();
    });

    DOM.citySearch()?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const val = e.target.value.trim();
            if (val) { fetchCoordinates(val); e.target.value = ''; e.target.blur(); }
        }
    });

    DOM.gpsBtn()?.addEventListener('click', handleGPS);

    DOM.capitalsSelect()?.addEventListener('change', (e) => {
        if (e.target.value) { fetchCoordinates(e.target.value); e.target.value = ''; }
    });

    DOM.favSelect()?.addEventListener('change', (e) => {
        if (e.target.value) { fetchCoordinates(e.target.value); e.target.value = ''; }
    });

    DOM.saveFavBtn()?.addEventListener('click', () => {
        const loc = currentWeatherData?.location;
        if (!loc) return;
        const btn = DOM.saveFavBtn();
        if (CONFIG.favorites.includes(loc)) {
            removeFavorite(loc);
            showToast(`Removed "${loc.split(',')[0]}" from favorites.`, 'info');
        } else {
            if (addFavorite(loc)) showToast(`Saved "${loc.split(',')[0]}" to favorites!`, 'success');
        }
        renderFavoritesDropdown();
        checkFavoriteState();
        btn.classList.add('popped');
        btn.addEventListener('animationend', () => btn.classList.remove('popped'), { once: true });
    });

    document.getElementById('compare-btn')?.addEventListener('click', handleCompareClick);
    ['compare-city-1','compare-city-2'].forEach(id => {
        document.getElementById(id)?.addEventListener('keydown', e => {
            if (e.key === 'Enter') handleCompareClick();
        });
    });
}

async function handleCompareClick() {
    const city1 = document.getElementById('compare-city-1')?.value.trim();
    const city2 = document.getElementById('compare-city-2')?.value.trim();
    if (!city1 || !city2) { showToast('Enter both city names to compare.', 'error'); return; }

    const container = document.getElementById('compare-results');
    if (container) {
        container.classList.remove('hidden');
        container.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:16px;">
                <i class="fas fa-spinner fa-spin"></i> Fetching comparison data…
            </div>`;
    }
    try {
        renderCompareResults(await compareCities(city1, city2));
    } catch (e) {
        if (container) container.innerHTML = `<p style="grid-column:1/-1;color:var(--color-bad);padding:10px;text-align:center;">${e.message || 'Comparison failed.'}</p>`;
        showToast(e.message || 'Comparison failed.', 'error');
    }
}

document.addEventListener('DOMContentLoaded', init);
