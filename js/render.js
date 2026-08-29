/* ══════════════════════════════════════════════════════════
   render.js — ALL DOM RENDERING
   SkyCast v2.0
   Renders: hero, metrics, AQI, hourly strip, 14-day list,
   favorites, compare results + NEW: alerts banner, moon chip,
   dynamic weather theming, chart & radar hooks.
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
    renderAlerts();
    checkFavoriteState();
    renderFavoritesDropdown();
    startLocalClock();
    startUpdatedAgo();
    applyWeatherTheme();
    TrendChart.render();
    RadarMap.refresh(currentWeatherData.lat, currentWeatherData.lon);
}

// ── DYNAMIC WEATHER THEME (ambient orbs follow conditions) ─
function applyWeatherTheme() {
    const d = currentWeatherData;
    const code = d.current.code;
    const isDay = d.current.isDay;

    let wx = 'cloudy';
    if ([0, 1].includes(code))                 wx = isDay ? 'clear-day' : 'clear-night';
    else if (code === 2)                       wx = isDay ? 'clear-day' : 'cloudy';
    else if ([45, 48].includes(code))          wx = 'fog';
    else if ([71, 73, 75, 77, 85, 86].includes(code)) wx = 'snow';
    else if ([95, 96, 99].includes(code))      wx = 'storm';
    else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) wx = 'rain';

    document.body.dataset.wx = wx;
}

// ── HERO CARD ────────────────────────────────────────────
function renderHero() {
    const d  = currentWeatherData;
    const wd = getWeatherDetails(d.current.code);

    setEl('current-location-name', d.location.split(',')[0]);
    setEl('location-sub', d.location.split(',').slice(1).join(',').trim());

    const tempEl = document.getElementById('current-temp');
    if (tempEl) {
        tempEl.textContent = convertTemp(d.current.temp);
        tempEl.classList.remove('updated');
        void tempEl.offsetWidth;                 // restart pulse animation
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

    // Moon phase chip
    const moon = getMoonPhase();
    const moonEl = document.getElementById('moon-chip');
    if (moonEl) moonEl.innerHTML = `<span class="moon-ico">${moon.icon}</span> ${moon.name} · ${moon.illumination}%`;

    // Sunrise / sunset + progress
    setEl('sunrise-time', formatTime(d.current.sunrise));
    setEl('sunset-time',  formatTime(d.current.sunset));

    const pct         = Math.round(getSunProgress(d.current.sunrise, d.current.sunset) * 100);
    const progressBar = document.getElementById('sun-progress');
    const sunDot      = document.getElementById('sun-dot');
    if (progressBar) progressBar.style.width = `${pct}%`;
    if (sunDot)      sunDot.style.left       = `${pct}%`;
}

// ── METRICS ──────────────────────────────────────────────
function renderMetrics() {
    const d = currentWeatherData;

    setEl('current-humidity',   `${d.current.humidity}%`);
    setEl('current-wind',       convertWind(d.current.wind));
    setEl('current-precip',     `${d.current.precip} mm`);
    setEl('current-pressure',   d.current.pressure ? `${Math.round(d.current.pressure)} hPa` : '—');
    setEl('current-uv',         d.current.uv !== null && d.current.uv !== undefined ? `${Math.round(d.current.uv * 10) / 10}` : '—');
    setEl('current-visibility', d.current.visibility ? `${d.current.visibility} km` : '—');

    const humBar = document.getElementById('humidity-bar');
    if (humBar) humBar.style.width = `${d.current.humidity}%`;

    const windDir = getWindDirection(d.current.windDir);
    setEl('wind-direction-text', windDir !== '—' ? `Blowing ${windDir}` : '—');

    setEl('rain-prob-text', d.todayRain !== undefined && d.todayRain !== null ? `${d.todayRain}% chance today` : '—');

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

// ── HOURLY STRIP ─────────────────────────────────────────
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
        const dt      = new Date(`${h.time}:00`);
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

    currentWeatherData.forecast.forEach((day) => {
        const wd       = getWeatherDetails(day.code);
        const dt       = new Date(day.date);          // tolerate ISO strings (demo data)
        const dayStr   = dt.toLocaleDateString('en-IN', { weekday: 'short' });
        const dateNum  = dt.getDate();
        const monthStr = dt.toLocaleDateString('en-IN', { month: 'short' });

        const card = document.createElement('div');
        card.className = `forecast-card ${day.isToday ? 'today' : ''}`;
        card.innerHTML = `
            <span class="fc-day">${day.isToday ? 'Today' : dayStr}</span>
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

// ── WEATHER ALERTS (derived from live data — no extra API) ─
function renderAlerts() {
    const wrap = document.getElementById('alerts-banner');
    if (!wrap) return;

    const d    = currentWeatherData;
    const c    = d.current;
    // Thresholds are defined in Celsius — compare against the raw °C value
    // and convert only for display (prevents false alarms in °F mode).
    const unit = CONFIG.isMetric ? '°C' : '°F';
    const tempC = c.temp;
    const tempDisp = `${convertTemp(c.temp)}${unit}`;
    const windKmh = c.wind;
    const aqiVal  = typeof d.aqi.us_aqi === 'number' ? d.aqi.us_aqi : parseInt(d.aqi.us_aqi) || 0;
    const todayCode = d.forecast[0]?.code;

    const alerts = [];

    if (tempC >= 40) alerts.push({ level: 'danger',  icon: 'fa-temperature-arrow-up',
        html: `<strong>Extreme heat:</strong> it feels like ${tempDisp}. Stay hydrated and avoid peak sun.` });
    else if (tempC >= 35) alerts.push({ level: 'warning', icon: 'fa-temperature-high',
        html: `<strong>Heat advisory:</strong> temperatures near ${tempDisp}. Limit outdoor exertion.` });

    if (c.uv >= 8) alerts.push({ level: 'warning', icon: 'fa-sun',
        html: `<strong>Very high UV (${Math.round(c.uv)}):</strong> use SPF 30+ sunscreen and cover up.` });

    if (windKmh >= 40) alerts.push({ level: 'warning', icon: 'fa-wind',
        html: `<strong>Strong winds:</strong> sustained ${Math.round(windKmh)} km/h${c.windGust ? ` (gusts ${Math.round(c.windGust)} km/h)` : ''}. Secure loose objects.` });

    if ([95, 96, 99].includes(todayCode) || [95, 96, 99].includes(c.code))
        alerts.push({ level: 'danger', icon: 'fa-bolt',
            html: `<strong>Thunderstorm risk:</strong> lightning possible today. Seek shelter when warned.` });

    if ([65, 82].includes(todayCode) || d.todayRain >= 70)
        alerts.push({ level: 'warning', icon: 'fa-cloud-showers-heavy',
            html: `<strong>Heavy rain expected:</strong> ${d.todayRain}% chance today. Carry an umbrella.` });

    if (aqiVal > 200) alerts.push({ level: 'danger', icon: 'fa-lungs',
        html: `<strong>Very poor air quality (AQI ${aqiVal}):</strong> keep windows closed; consider a mask outdoors.` });
    else if (aqiVal > 150) alerts.push({ level: 'warning', icon: 'fa-lungs',
        html: `<strong>Unhealthy air (AQI ${aqiVal}):</strong> sensitive groups should limit outdoor activity.` });

    if (c.visibility !== null && parseFloat(c.visibility) < 1)
        alerts.push({ level: 'info', icon: 'fa-eye-slash',
            html: `<strong>Low visibility (${c.visibility} km):</strong> drive slowly with headlights on.` });

    wrap.innerHTML = alerts.map(a =>
        `<div class="alert-chip level-${a.level}">
            <i class="fas ${a.icon} al-icon"></i>
            <span class="al-text">${a.html}</span>
         </div>`).join('');
    wrap.classList.toggle('has-alerts', alerts.length > 0);
}

// ── "UPDATED X AGO" TICKER ───────────────────────────────
let updatedTimer;
function startUpdatedAgo() {
    clearInterval(updatedTimer);
    const tick = () => {
        if (!currentWeatherData) return;
        const mins = Math.floor((Date.now() - currentWeatherData.fetchedAt) / 60000);
        const txt  = mins <= 0 ? 'just now'
                   : mins === 1 ? '1 min ago'
                   : `${mins} min ago`;
        const el = document.getElementById('updated-ago');
        if (el) el.innerHTML = `<i class="fas fa-circle-check"></i> Updated ${txt}`;
    };
    tick();
    updatedTimer = setInterval(tick, 30000);
}

// ── FAVORITES ─────────────────────────────────────────────
function checkFavoriteState() {
    if (!currentWeatherData) return;
    const btn = document.getElementById('save-fav-btn');
    if (!btn) return;

    const locObj = makeLocationObj(currentWeatherData.lat, currentWeatherData.lon, currentWeatherData.location);
    const isFav  = isFavorite(locObj);

    btn.innerHTML = isFav ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
    btn.title     = isFav ? 'Remove from Favorites' : 'Save to Favorites';
}

function renderFavoritesDropdown() {
    const sel = document.getElementById('favorite-locations');
    if (!sel) return;
    sel.innerHTML = '<option value="" disabled selected>❤️ Saved Favorites</option>';

    if (!CONFIG.favorites.length) {
        const o = document.createElement('option');
        o.value = ''; o.disabled = true;
        o.textContent = '— nothing saved yet —';
        sel.appendChild(o);
        return;
    }

    CONFIG.favorites.forEach(loc => {
        const o = document.createElement('option');
        o.value       = loc.id;                 // "lat,lon" → loads by coordinates
        o.textContent = loc.label.length > 34 ? loc.label.substring(0, 32) + '…' : loc.label;
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

// ── LOCAL CLOCK (live ticker at viewed location) ─────────
let clockInterval;
function startLocalClock() {
    const el = document.getElementById('local-time');
    if (!el) return;
    clearInterval(clockInterval);
    const tz = currentWeatherData?.timezone;
    const tick = () => { el.textContent = getLocalTimeString(tz); };
    tick();
    clockInterval = setInterval(tick, 1000);
}

// ── CITY CHIP ACTIVE STATE ────────────────────────────────
function setActiveChip(cityName) {
    document.querySelectorAll('.city-chip').forEach(c => {
        c.classList.toggle('active', c.textContent === cityName);
    });
}

// ── LOADING STATE HELPERS ────────────────────────────────
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
