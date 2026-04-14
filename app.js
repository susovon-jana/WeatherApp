/* ════════════════════════════════════════════════════════
   app.js — MERGED: config.js + utils.js + api.js +
                    render.js + app.js
   SkyCast Advanced Weather App
   ════════════════════════════════════════════════════════ */


/* ══════════════════════════════════════════════════════════
   SECTION 1 — APP CONFIGURATION & STATIC DATA  (config.js)
══════════════════════════════════════════════════════════ */

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

// ── WEATHER CODE DETAILS ─────────────────────────────────
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

// ── UV INDEX LABELS ──────────────────────────────────────
const UV_LEVELS = [
    { max: 2,        label: "Low",       color: "#10b981" },
    { max: 5,        label: "Moderate",  color: "#f59e0b" },
    { max: 7,        label: "High",      color: "#fb923c" },
    { max: 10,       label: "Very High", color: "#ef4444" },
    { max: Infinity, label: "Extreme",   color: "#7c3aed" },
];

// ── WIND DIRECTION LABELS ────────────────────────────────
function getWindDirection(deg) {
    if (deg === undefined || deg === null) return '—';
    const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
    return dirs[Math.round(deg / 22.5) % 16];
}

// ── PRESSURE LABELS ──────────────────────────────────────
function getPressureLabel(hpa) {
    if (hpa < 1000) return '↓ Low';
    if (hpa > 1020) return '↑ High';
    return '→ Normal';
}

// ── VISIBILITY LABELS ────────────────────────────────────
function getVisibilityLabel(km) {
    if (km >= 10) return 'Excellent';
    if (km >= 5)  return 'Good';
    if (km >= 2)  return 'Moderate';
    if (km >= 1)  return 'Poor';
    return 'Very Poor';
}


/* ══════════════════════════════════════════════════════════
   SECTION 2 — UTILITY / HELPER FUNCTIONS  (utils.js)
══════════════════════════════════════════════════════════ */

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

function formatTime(iso) {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// ── SUN POSITION ─────────────────────────────────────────
function getSunProgress(sunriseISO, sunsetISO) {
    const now  = Date.now();
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
function pollutantPercent(type, value) {
    const maxes = { pm25: 75, pm10: 150, no2: 200, o3: 240 };
    const max   = maxes[type] || 100;
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


/* ══════════════════════════════════════════════════════════
   SECTION 3 — DATA FETCHING: GEOCODING, WEATHER, AQI, GPS  (api.js)
══════════════════════════════════════════════════════════ */

// ── SHARED STATE ─────────────────────────────────────────
let currentWeatherData = null;

// ── GEOCODE CITY NAME → COORDS ───────────────────────────
async function fetchCoordinates(cityName) {
    setLocationLoading(`Searching "${cityName}"...`);
    try {
        const res  = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`);
        const data = await res.json();
        if (!data.results || !data.results.length) throw new Error(`"${cityName}" not found. Try a different name.`);

        const loc            = data.results[0];
        const locationString = buildLocationString(loc.name, loc.admin1, loc.country);
        await getLiveWeatherData(loc.latitude, loc.longitude, locationString, null);
    } catch (e) {
        showToast(e.message || 'City not found.', 'error');
        setLocationLoading('Search failed');
    }
}

// ── REVERSE GEOCODE: COORDS → VILLAGE/AREA NAME ──────────
async function reverseGeocode(lat, lon) {
    const url  = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&zoom=16&addressdetails=1`;
    const res  = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();

    const a = data.address || {};
    const place =
        a.village      ||
        a.hamlet       ||
        a.suburb       ||
        a.neighbourhood||
        a.town         ||
        a.city         ||
        a.county       ||
        '';

    const district = a.state_district || a.county || '';
    const state    = a.state || '';
    const country  = a.country || '';

    const parts  = [place, district, state, country].filter(Boolean);
    const unique = [...new Set(parts)];
    let locationString = unique.join(', ');

    locationString = locationString.replace(/\b[A-Z0-9]{4,8}\+[A-Z0-9]{2,4}(?:,\s*)?/g, '').trim();
    locationString = locationString.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',');

    return locationString || 'GPS Location';
}

// ── GPS HANDLER ──────────────────────────────────────────
async function handleGPS() {
    const gpsBtn = document.getElementById('gps-btn');
    if (!navigator.geolocation) {
        showToast('GPS not available on this device.', 'error');
        fetchCoordinates('New Delhi');
        return;
    }

    gpsBtn.classList.add('locating');
    setLocationLoading('Acquiring GPS…');

    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            try {
                const locName = await reverseGeocode(lat, lon);
                await getLiveWeatherData(lat, lon, locName, null);
            } catch (e) {
                await getLiveWeatherData(lat, lon, 'My Location', null);
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
        { timeout: 10000, enableHighAccuracy: true }
    );
}

// ── MAIN WEATHER + AQI FETCH ─────────────────────────────
async function getLiveWeatherData(lat, lon, locationName, timezone) {
    setDashboardLoading(true);
    try {
        const weatherUrl = [
            `https://api.open-meteo.com/v1/forecast`,
            `?latitude=${lat}&longitude=${lon}`,
            `&current=temperature_2m,relative_humidity_2m,apparent_temperature`,
            `,precipitation,weather_code,wind_speed_10m,wind_direction_10m`,
            `,surface_pressure,visibility,uv_index,cloud_cover`,
            `&daily=weather_code,temperature_2m_max,temperature_2m_min`,
            `,precipitation_probability_max,sunrise,sunset,uv_index_max,precipitation_sum`,
            `&hourly=temperature_2m,weather_code,precipitation_probability,relative_humidity_2m`,
            `&timezone=auto&forecast_days=14&wind_speed_unit=kmh`,
        ].join('');

        const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,us_aqi,nitrogen_dioxide,ozone`;

        const [weatherRes, aqiRes] = await Promise.all([fetch(weatherUrl), fetch(aqiUrl)]);
        const weather = await weatherRes.json();
        const aqi     = await aqiRes.json();

        const tz  = weather.timezone || timezone || 'auto';
        const cur = weather.current;

        currentWeatherData = {
            location: locationName,
            lat, lon,
            timezone: tz,
            current: {
                temp:       cur.temperature_2m,
                feelsLike:  cur.apparent_temperature,
                humidity:   cur.relative_humidity_2m,
                wind:       cur.wind_speed_10m,
                windDir:    cur.wind_direction_10m,
                precip:     cur.precipitation,
                code:       cur.weather_code,
                pressure:   cur.surface_pressure,
                visibility: cur.visibility ? (cur.visibility / 1000).toFixed(1) : null,
                uv:         cur.uv_index,
                cloudCover: cur.cloud_cover,
                sunrise:    weather.daily.sunrise[0],
                sunset:     weather.daily.sunset[0],
            },
            todayMax:    weather.daily.temperature_2m_max[0],
            todayMin:    weather.daily.temperature_2m_min[0],
            todayRain:   weather.daily.precipitation_probability_max[0],
            aqi: {
                us_aqi: aqi.current?.us_aqi             ?? '--',
                pm25:   aqi.current?.pm2_5               ?? '--',
                pm10:   aqi.current?.pm10                ?? '--',
                no2:    aqi.current?.nitrogen_dioxide    ?? '--',
                o3:     aqi.current?.ozone               ?? '--',
            },
            hourly:   buildHourlyData(weather),
            forecast: buildForecastData(weather),
        };

        CONFIG.lastLocation = { lat, lon, locationName };
        renderDashboard();
    } catch (e) {
        console.error('Weather API error:', e);
        showToast('Failed to load weather data. Check your connection.', 'error');
        setDashboardLoading(false);
    }
}

// ── PROCESS HOURLY DATA (next 24h) ───────────────────────
function buildHourlyData(weather) {
    const hourly  = [];
    const nowHr   = new Date().getHours();
    const startIdx = nowHr;

    for (let i = startIdx; i < startIdx + 24 && i < weather.hourly.time.length; i++) {
        hourly.push({
            time:      weather.hourly.time[i],
            temp:      weather.hourly.temperature_2m[i],
            code:      weather.hourly.weather_code[i],
            rainProb:  weather.hourly.precipitation_probability[i],
            humidity:  weather.hourly.relative_humidity_2m[i],
            isCurrent: (i === startIdx),
        });
    }
    return hourly;
}

// ── PROCESS 14-DAY FORECAST ──────────────────────────────
function buildForecastData(weather) {
    const forecast = [];
    for (let i = 0; i < 14; i++) {
        const hourlySlice = weather.hourly.relative_humidity_2m.slice(i * 24, (i + 1) * 24);
        const avgHumidity = hourlySlice.length
            ? Math.round(hourlySlice.reduce((a, b) => a + b, 0) / hourlySlice.length)
            : 0;

        forecast.push({
            date:       new Date(weather.daily.time[i]),
            max:        weather.daily.temperature_2m_max[i],
            min:        weather.daily.temperature_2m_min[i],
            code:       weather.daily.weather_code[i],
            rainProb:   weather.daily.precipitation_probability_max[i],
            precipSum:  weather.daily.precipitation_sum[i],
            uvMax:      weather.daily.uv_index_max[i],
            avgHumidity,
        });
    }
    return forecast;
}

// ── COMPARE TWO CITIES ───────────────────────────────────
async function compareCities(city1, city2) {
    const geoBase = 'https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&format=json';
    const wxBase  = 'https://api.open-meteo.com/v1/forecast';
    const wxParts = '&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,precipitation&timezone=auto';

    const [geo1, geo2] = await Promise.all([
        fetch(`${geoBase}&name=${encodeURIComponent(city1)}`).then(r => r.json()),
        fetch(`${geoBase}&name=${encodeURIComponent(city2)}`).then(r => r.json()),
    ]);

    if (!geo1.results?.length) throw new Error(`"${city1}" not found`);
    if (!geo2.results?.length) throw new Error(`"${city2}" not found`);

    const loc1 = geo1.results[0];
    const loc2 = geo2.results[0];

    const [wx1, wx2] = await Promise.all([
        fetch(`${wxBase}?latitude=${loc1.latitude}&longitude=${loc1.longitude}${wxParts}`).then(r => r.json()),
        fetch(`${wxBase}?latitude=${loc2.latitude}&longitude=${loc2.longitude}${wxParts}`).then(r => r.json()),
    ]);

    return [
        { name: loc1.name, country: loc1.country, data: wx1.current },
        { name: loc2.name, country: loc2.country, data: wx2.current },
    ];
}

// ── HELPERS ──────────────────────────────────────────────
function buildLocationString(name, admin, country) {
    return [name, admin, country].filter(Boolean).join(', ');
}

function setLocationLoading(msg) {
    const el = document.getElementById('current-location-name');
    if (el) el.textContent = msg;
}

function setDashboardLoading(on) {
    const el = document.getElementById('loading-screen');
    if (el) {
        if (on) el.classList.remove('fade-out');
        else    el.classList.add('fade-out');
    }
}


/* ══════════════════════════════════════════════════════════
   SECTION 4 — ALL DOM RENDERING FUNCTIONS  (render.js)
══════════════════════════════════════════════════════════ */

// ── MASTER RENDER ────────────────────────────────────────
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

// ── HERO CARD ────────────────────────────────────────────
function renderHero() {
    const d  = currentWeatherData;
    const wd = getWeatherDetails(d.current.code);

    setEl('current-location-name', d.location.split(',')[0]);
    const sub = d.location.split(',').slice(1).join(',').trim();
    setEl('location-sub', sub);

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

    setEl('current-condition',  wd.text);
    setEl('current-feels-like', convertTemp(d.current.feelsLike));
    setEl('today-high',         convertTemp(d.todayMax));
    setEl('today-low',          convertTemp(d.todayMin));

    const iconEl = document.getElementById('current-icon');
    if (iconEl) {
        iconEl.className   = `fas ${wd.icon} hero-icon`;
        iconEl.style.color = wd.color;
    }

    setEl('weather-bg-label', wd.text);

    const srTime = formatTime(d.current.sunrise);
    const ssTime = formatTime(d.current.sunset);
    setEl('sunrise-time', srTime);
    setEl('sunset-time',  ssTime);

    const progress    = getSunProgress(d.current.sunrise, d.current.sunset);
    const pct         = Math.round(progress * 100);
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
    setEl('current-precip',     `${d.current.precip} mm`);
    setEl('current-pressure',   d.current.pressure ? `${Math.round(d.current.pressure)} hPa` : '—');
    setEl('current-uv',         d.current.uv !== null ? `${d.current.uv}` : '—');
    setEl('current-visibility', d.current.visibility ? `${d.current.visibility} km` : '—');

    const humBar = document.getElementById('humidity-bar');
    if (humBar) humBar.style.width = `${d.current.humidity}%`;

    const windDir = getWindDirection(d.current.windDir);
    setEl('wind-direction-text', windDir !== '—' ? `Blowing ${windDir}` : '—');

    setEl('rain-prob-text', d.todayRain !== undefined ? `${d.todayRain}% chance today` : '—');

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
    const val = typeof aqi.us_aqi === 'number' ? aqi.us_aqi : parseInt(aqi.us_aqi) || 0;
    const level = getAQILevel(val);

    setEl('aqi-value', val || '--');
    const badge = document.getElementById('aqi-badge');
    if (badge) {
        badge.textContent   = level.label;
        badge.style.cssText = `background: ${level.color}22; color: ${level.color}; border-color: ${level.color}44;`;
    }

    const arc = document.getElementById('aqi-arc');
    if (arc) {
        const maxAQI = 300;
        const offset = 314 - Math.min(314, (val / maxAQI) * 314);
        arc.style.strokeDashoffset = offset;
        arc.style.stroke           = level.color;
    }

    const numEl = document.getElementById('aqi-value');
    if (numEl) numEl.style.color = level.color;

    const pollutants = [
        { id: 'pm25', barId: 'pm25-bar', val: aqi.pm25, type: 'pm25' },
        { id: 'pm10', barId: 'pm10-bar', val: aqi.pm10, type: 'pm10' },
        { id: 'no2',  barId: 'no2-bar',  val: aqi.no2,  type: 'no2'  },
        { id: 'o3',   barId: 'o3-bar',   val: aqi.o3,   type: 'o3'   },
    ];

    pollutants.forEach(({ id, barId, val: v, type }) => {
        const numVal = typeof v === 'number' ? v : parseFloat(v) || 0;
        setEl(`${id}-val`, numVal > 0 ? numVal.toFixed(1) : '--');
        const barEl = document.getElementById(barId);
        if (barEl) barEl.style.width = `${pollutantPercent(type, numVal)}%`;
    });

    setEl('aqi-health-advice', level.advice);
}

// ── HOURLY FORECAST ───────────────────────────────────────
function renderHourly() {
    const container = document.getElementById('hourly-container');
    if (!container) return;
    container.innerHTML = '';

    const data = currentWeatherData.hourly;
    if (!data || !data.length) {
        container.innerHTML = '<p style="color:var(--text-muted);padding:10px;">No hourly data.</p>';
        return;
    }

    data.forEach((h) => {
        const wd      = getWeatherDetails(h.code);
        const dt      = new Date(h.time);
        const timeStr = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

        const card = document.createElement('div');
        card.className = `hourly-card ${h.isCurrent ? 'current-hour' : ''}`;
        card.innerHTML = `
            <span class="h-time">${h.isCurrent ? 'Now' : timeStr}</span>
            <i class="fas ${wd.icon} h-icon" style="color:${wd.color}"></i>
            <span class="h-temp">${convertTemp(h.temp)}°</span>
            ${h.rainProb > 0 ? `<span class="h-rain"><i class="fas fa-droplet"></i> ${h.rainProb}%</span>` : ''}
        `;
        container.appendChild(card);
    });
}

// ── 14-DAY FORECAST ──────────────────────────────────────
function renderForecast() {
    const container = document.getElementById('forecast-container');
    if (!container) return;
    container.innerHTML = '';

    const today = new Date().toDateString();

    currentWeatherData.forecast.forEach((day) => {
        const wd       = getWeatherDetails(day.code);
        const isToday  = day.date.toDateString() === today;
        const dayStr   = day.date.toLocaleDateString('en-IN', { weekday: 'short' });
        const dateNum  = day.date.getDate();
        const monthStr = day.date.toLocaleDateString('en-IN', { month: 'short' });

        const card = document.createElement('div');
        card.className = `forecast-card ${isToday ? 'today' : ''}`;
        card.innerHTML = `
            <span class="fc-day">${isToday ? 'Today' : dayStr}</span>
            <span class="fc-date-num">${dateNum} ${monthStr}</span>
            <i class="fas ${wd.icon} fc-icon" style="color:${wd.color}"></i>
            <span class="fc-high">${convertTemp(day.max)}°</span>
            <span class="fc-low">${convertTemp(day.min)}°</span>
            ${day.rainProb > 0 ? `<span class="fc-rain"><i class="fas fa-umbrella"></i> ${day.rainProb}%</span>` : ''}
            <span class="fc-humidity-text"><i class="fas fa-droplet"></i> ${day.avgHumidity}%</span>
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
    btn.title = isFav ? 'Remove from Favorites' : 'Save to Favorites';
}

function renderFavoritesDropdown() {
    const sel = document.getElementById('favorite-locations');
    if (!sel) return;
    sel.innerHTML = '<option value="" disabled selected>❤️ Saved Favorites</option>';
    CONFIG.favorites.forEach(loc => {
        const o = document.createElement('option');
        o.value       = loc;
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
        const wd = getWeatherDetails(data.weather_code);
        return `
            <div class="compare-item">
                <span class="cmp-city">${name}</span>
                <span style="font-size:0.72rem;color:var(--text-muted);">${country}</span>
                <i class="fas ${wd.icon}" style="font-size:1.9rem;color:${wd.color};margin:5px 0;"></i>
                <span class="cmp-temp">${convertTemp(data.temperature_2m)}°</span>
                <div class="cmp-meta">
                    <span><i class="fas fa-droplet" style="color:var(--c-humidity)"></i> ${data.relative_humidity_2m}%</span>
                    <span><i class="fas fa-wind"    style="color:var(--c-wind)"></i>    ${convertWind(data.wind_speed_10m)}</span>
                    <span><i class="fas fa-cloud-rain" style="color:var(--c-precip)"></i> ${data.precipitation} mm</span>
                </div>
                <span style="font-size:0.72rem;color:var(--text-muted);margin-top:3px;">${wd.text}</span>
            </div>
        `;
    }).join('');
}

// ── LOCAL CLOCK (live ticker) ─────────────────────────────
let clockInterval;
function startLocalClock() {
    const el = document.getElementById('local-time');
    if (!el) return;
    clearInterval(clockInterval);
    const tz = currentWeatherData?.timezone;
    function tick() { el.textContent = getLocalTimeString(tz); }
    tick();
    clockInterval = setInterval(tick, 1000);
}

// ── CITY CHIP ACTIVE STATE ────────────────────────────────
function setActiveChip(cityName) {
    document.querySelectorAll('.city-chip').forEach(c => {
        c.classList.toggle('active', c.textContent === cityName);
    });
}

// ── GENERIC DOM HELPER ────────────────────────────────────
function setEl(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}


/* ══════════════════════════════════════════════════════════
   SECTION 5 — MAIN ENTRY POINT & EVENT LISTENERS  (app.js)
══════════════════════════════════════════════════════════ */

// ── DOM REFERENCES ────────────────────────────────────────
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

// ── INIT ──────────────────────────────────────────────────
function init() {
    setGreetingAndDate();
    populateCityChips();
    populateCapitalsSelect();
    renderFavoritesDropdown();
    applySystemTheme();
    setupEventListeners();
    handleGPS();
}

// ── GREETING & DATE ───────────────────────────────────────
function setGreetingAndDate() {
    const greetEl = DOM.greeting();
    const dateEl  = DOM.dateEl();
    if (greetEl) greetEl.textContent = `${getGreeting()}!`;
    if (dateEl)  dateEl.textContent  = formatDate(new Date());
}

// ── SYSTEM THEME ─────────────────────────────────────────
function applySystemTheme() {
    const savedTheme = localStorage.getItem('skycast_theme');
    if (savedTheme) {
        setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        setTheme('light');
    }
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = DOM.themeToggle();
    if (btn) btn.innerHTML = theme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    localStorage.setItem('skycast_theme', theme);
}

// ── POPULATE CITY CHIPS ───────────────────────────────────
function populateCityChips() {
    const container = DOM.cityContainer();
    if (!container) return;
    container.innerHTML = '';
    INDIAN_CITIES.forEach(city => {
        const chip = document.createElement('span');
        chip.className   = 'city-chip';
        chip.textContent = city;
        chip.addEventListener('click', () => {
            setActiveChip(city);
            fetchCoordinates(city);
        });
        container.appendChild(chip);
    });
}

// ── POPULATE CAPITALS DROPDOWN ────────────────────────────
function populateCapitalsSelect() {
    const sel = DOM.capitalsSelect();
    if (!sel) return;
    GLOBAL_CAPITALS.forEach(city => {
        const opt = document.createElement('option');
        opt.value = city; opt.textContent = city;
        sel.appendChild(opt);
    });
}

// ── EVENT LISTENERS ───────────────────────────────────────
function setupEventListeners() {
    // ── ANTI-COPY & DEV TOOLS DETERRENTS ADDED HERE ──
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    
    document.addEventListener('copy', (e) => {
        e.preventDefault();
        showToast('Copying is disabled.', 'error');
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F12') e.preventDefault();
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) e.preventDefault();
        if ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u')) e.preventDefault();
        if ((e.ctrlKey || e.metaKey) && (e.key === 'S' || e.key === 's')) e.preventDefault();
    });
    // ─────────────────────────────────────────────────

    DOM.themeToggle()?.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        setTheme(current === 'dark' ? 'light' : 'dark');
    });

    DOM.unitToggle()?.addEventListener('click', () => {
        CONFIG.isMetric = !CONFIG.isMetric;
        DOM.unitToggle().textContent = CONFIG.isMetric ? '°C' : '°F';
        if (currentWeatherData) renderDashboard();
    });

    DOM.citySearch()?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const val = e.target.value.trim();
            if (val) {
                fetchCoordinates(val);
                e.target.value = '';
                e.target.blur();
            }
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
            const added = addFavorite(loc);
            if (added) showToast(`Saved "${loc.split(',')[0]}" to favorites!`, 'success');
        }
        renderFavoritesDropdown();
        checkFavoriteState();

        btn.classList.add('popped');
        btn.addEventListener('animationend', () => btn.classList.remove('popped'), { once: true });
    });

    document.getElementById('compare-btn')?.addEventListener('click', handleCompareClick);

    ['compare-city-1', 'compare-city-2'].forEach(id => {
        document.getElementById(id)?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleCompareClick();
        });
    });
}

// ── COMPARE HANDLER ───────────────────────────────────────
async function handleCompareClick() {
    const city1 = document.getElementById('compare-city-1')?.value.trim();
    const city2 = document.getElementById('compare-city-2')?.value.trim();

    if (!city1 || !city2) {
        showToast('Enter both city names to compare.', 'error');
        return;
    }

    const container = document.getElementById('compare-results');
    if (container) {
        container.classList.remove('hidden');
        container.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:16px;">
                <i class="fas fa-spinner fa-spin"></i> Fetching comparison data…
            </div>
        `;
    }

    try {
        const results = await compareCities(city1, city2);
        renderCompareResults(results);
    } catch (e) {
        if (container) {
            container.innerHTML = `<p style="grid-column:1/-1;color:var(--color-bad);padding:10px;text-align:center;">${e.message || 'Comparison failed.'}</p>`;
        }
        showToast(e.message || 'Comparison failed.', 'error');
    }
}

// ── START ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
