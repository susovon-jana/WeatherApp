/* ════════════════════════════════════════════════════════
   render.js — All DOM Rendering Functions
   SkyCast Advanced Weather App
   ════════════════════════════════════════════════════════ */

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

    // Location
    setEl('current-location-name', d.location.split(',')[0]);
    const sub = d.location.split(',').slice(1).join(',').trim();
    setEl('location-sub', sub);

    // Temperature (animated)
    const tempEl = document.getElementById('current-temp');
    if (tempEl) {
        tempEl.textContent = convertTemp(d.current.temp);
        tempEl.classList.remove('updated');
        void tempEl.offsetWidth; // reflow for re-trigger
        tempEl.classList.add('updated');
    }

    // Unit symbols
    document.querySelectorAll('.unit-symbol').forEach(el => {
        el.textContent = CONFIG.isMetric ? '°C' : '°F';
    });

    setEl('current-condition',  wd.text);
    setEl('current-feels-like', convertTemp(d.current.feelsLike));
    setEl('today-high',         convertTemp(d.todayMax));
    setEl('today-low',          convertTemp(d.todayMin));

    // Weather icon + color
    const iconEl = document.getElementById('current-icon');
    if (iconEl) {
        iconEl.className = `fas ${wd.icon} hero-icon`;
        iconEl.style.color = wd.color;
    }

    setEl('weather-bg-label', wd.text);

    // Sunrise / Sunset
    const srTime = formatTime(d.current.sunrise);
    const ssTime = formatTime(d.current.sunset);
    setEl('sunrise-time', srTime);
    setEl('sunset-time', ssTime);

    // Sun progress bar
    const progress = getSunProgress(d.current.sunrise, d.current.sunset);
    const pct = Math.round(progress * 100);
    const progressBar = document.getElementById('sun-progress');
    const sunDot      = document.getElementById('sun-dot');
    if (progressBar) progressBar.style.width = `${pct}%`;
    if (sunDot)       sunDot.style.left = `${pct}%`;
}

// ── METRICS ──────────────────────────────────────────────
function renderMetrics() {
    const d = currentWeatherData;

    setEl('current-humidity',  `${d.current.humidity}%`);
    setEl('current-wind',      convertWind(d.current.wind));
    setEl('current-precip',    `${d.current.precip} mm`);
    setEl('current-pressure',  d.current.pressure ? `${Math.round(d.current.pressure)} hPa` : '—');
    setEl('current-uv',        d.current.uv !== null ? `${d.current.uv}` : '—');
    setEl('current-visibility', d.current.visibility ? `${d.current.visibility} km` : '—');

    // Humidity bar
    const humBar = document.getElementById('humidity-bar');
    if (humBar) humBar.style.width = `${d.current.humidity}%`;

    // Wind direction
    const windDir = getWindDirection(d.current.windDir);
    setEl('wind-direction-text', windDir !== '—' ? `Blowing ${windDir}` : '—');

    // Rain probability
    setEl('rain-prob-text', d.todayRain !== undefined ? `${d.todayRain}% chance today` : '—');

    // Visibility label
    if (d.current.visibility) setEl('visibility-label', getVisibilityLabel(parseFloat(d.current.visibility)));

    // UV label
    if (d.current.uv !== null && d.current.uv !== undefined) {
        const uvLevel = getUVLevel(d.current.uv);
        setEl('uv-label', uvLevel.label);
        const uvEl = document.getElementById('current-uv');
        if (uvEl) uvEl.style.color = uvLevel.color;
    }

    // Pressure label
    if (d.current.pressure) setEl('pressure-label', getPressureLabel(d.current.pressure));
}

// ── AQI ──────────────────────────────────────────────────
function renderAQI() {
    const aqi = currentWeatherData.aqi;
    const val = typeof aqi.us_aqi === 'number' ? aqi.us_aqi : parseInt(aqi.us_aqi) || 0;

    const level = getAQILevel(val);

    // Number + arc
    setEl('aqi-value', val || '--');
    const badge = document.getElementById('aqi-badge');
    if (badge) {
        badge.textContent = level.label;
        badge.style.cssText = `
            background: ${level.color}22;
            color: ${level.color};
            border-color: ${level.color}44;
        `;
    }

    // SVG arc (circumference = 2πr = 2π×50 ≈ 314)
    const arc = document.getElementById('aqi-arc');
    if (arc) {
        const maxAQI = 300;
        const offset = 314 - Math.min(314, (val / maxAQI) * 314);
        arc.style.strokeDashoffset = offset;
        arc.style.stroke = level.color;
    }

    // AQI num color
    const numEl = document.getElementById('aqi-value');
    if (numEl) numEl.style.color = level.color;

    // Pollutant bars
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

    // Health advice
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

    data.forEach((h, idx) => {
        const wd  = getWeatherDetails(h.code);
        const dt  = new Date(h.time);
        const timeStr = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

        const card = document.createElement('div');
        card.className = `hourly-card ${h.isCurrent ? 'current-hour' : ''}`;
        card.innerHTML = `
            <span class="h-time">${h.isCurrent ? 'Now' : timeStr}</span>
            <i class="fas ${wd.icon} h-icon" style="color:${wd.color}"></i>
            <span class="h-temp">${convertTemp(h.temp)}°</span>
            ${h.rainProb > 0
                ? `<span class="h-rain"><i class="fas fa-droplet"></i> ${h.rainProb}%</span>`
                : ''}
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

    currentWeatherData.forecast.forEach((day, idx) => {
        const wd     = getWeatherDetails(day.code);
        const isToday = day.date.toDateString() === today;
        const dayStr  = day.date.toLocaleDateString('en-IN', { weekday: 'short' });
        const dateNum = day.date.getDate();
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
        o.value   = loc;
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
                <i class="fas ${wd.icon}" style="font-size:2rem;color:${wd.color};margin:6px 0;"></i>
                <span class="cmp-temp">${convertTemp(data.temperature_2m)}°</span>
                <div class="cmp-meta">
                    <span><i class="fas fa-droplet" style="color:var(--c-humidity)"></i> ${data.relative_humidity_2m}%</span>
                    <span><i class="fas fa-wind" style="color:var(--c-wind)"></i> ${convertWind(data.wind_speed_10m)}</span>
                    <span><i class="fas fa-cloud-rain" style="color:var(--c-precip)"></i> ${data.precipitation} mm</span>
                </div>
                <span style="font-size:0.72rem;color:var(--text-muted);margin-top:4px;">${wd.text}</span>
            </div>
        `;
    }).join('');
}

// ── LOCAL CLOCK (live ticker) ────────────────────────────
let clockInterval;
function startLocalClock() {
    const el = document.getElementById('local-time');
    if (!el) return;
    clearInterval(clockInterval);
    const tz = currentWeatherData?.timezone;

    function tick() {
        el.textContent = getLocalTimeString(tz);
    }
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
