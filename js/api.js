/* ══════════════════════════════════════════════════════════
   api.js — ALL NETWORK DATA FETCHING
   SkyCast v2.0
   Sources: Open-Meteo (weather/AQI/geocoding), Nominatim (reverse
   geocoding), RainViewer (radar tiles). All free, key-less.
   ══════════════════════════════════════════════════════════ */

// ── SHARED STATE ─────────────────────────────────────────
let currentWeatherData = null;

// ── GEOCODE: multi-result (powers live search suggestions) ─
async function searchGeocode(query, count = 8) {
    const url = `${API.geocode}?name=${encodeURIComponent(query)}&count=${count}&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Geocoding service unavailable');
    const data = await res.json();
    return (data.results || []).map(r => ({
        id:          `${r.latitude},${r.longitude}`,
        name:        r.name,
        label:       buildLocationString(r.name, r.admin1, r.country),
        lat:         r.latitude,
        lon:         r.longitude,
        country:     r.country      || '',
        countryCode: r.country_code || '',
        admin1:      r.admin1       || '',
    }));
}

// ── GEOCODE: single best match (city chips / capitals) ───
async function fetchCoordinates(cityName) {
    setLocationLoading(`Searching "${cityName}"...`);
    try {
        const results = await searchGeocode(cityName, 1);
        if (!results.length) throw new Error(`"${cityName}" not found. Try a different name.`);
        const loc = results[0];
        await loadLocation(loc.lat, loc.lon, loc.label);
    } catch (e) {
        showToast(e.message || 'City not found.', 'error');
        setLocationLoading('Search failed');
    }
}

// ── REVERSE GEOCODE: COORDS → VILLAGE/AREA NAME ──────────
async function reverseGeocode(lat, lon) {
    const url  = `${API.reverse}?lat=${lat}&lon=${lon}&format=jsonv2&zoom=16&addressdetails=1`;
    const res  = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();

    const a = data.address || {};
    const place =
        a.village       ||
        a.hamlet        ||
        a.suburb        ||
        a.neighbourhood ||
        a.town          ||
        a.city          ||
        a.county        ||
        '';

    const district = a.state_district || a.county || '';
    const state    = a.state  || '';
    const country  = a.country || '';

    const parts  = [place, district, state, country].filter(Boolean);
    const unique = [...new Set(parts)];
    let locationString = unique.join(', ');

    locationString = locationString.replace(/\b[A-Z0-9]{4,8}\+[A-Z0-9]{2,4}(?:,\s*)?/g, '').trim();
    locationString = locationString.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',');

    return locationString || 'GPS Location';
}

// ── MASTER LOADER: fetch weather + AQI, then render ──────
// Every path (GPS, search, favorites, chips, recents) funnels here.
async function loadLocation(lat, lon, label) {
    setDashboardLoading(true);
    setLocationLoading(label?.split(',')[0] || 'Loading...');

    try {
        const weatherUrl = [
            `${API.forecast}`,
            `?latitude=${lat}&longitude=${lon}`,
            `&current=temperature_2m,relative_humidity_2m,apparent_temperature`,
            `,is_day,precipitation,weather_code,cloud_cover,surface_pressure`,
            `,wind_speed_10m,wind_direction_10m,wind_gusts_10m`,
            `&hourly=temperature_2m,weather_code,precipitation_probability`,
            `,relative_humidity_2m,visibility,uv_index,is_day`,
            `&daily=weather_code,temperature_2m_max,temperature_2m_min`,
            `,precipitation_probability_max,sunrise,sunset,uv_index_max,precipitation_sum`,
            `&timezone=auto&forecast_days=14&wind_speed_unit=kmh`,
        ].join('');

        const aqiUrl = `${API.airQuality}?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,us_aqi,nitrogen_dioxide,ozone`;

        // allSettled: AQI failure must not kill the whole dashboard
        const [weatherRes, aqiRes] = await Promise.allSettled([
            fetch(weatherUrl).then(r => r.json()),
            fetch(aqiUrl).then(r => r.json()),
        ]);

        const weather = weatherRes.status === 'fulfilled' ? weatherRes.value : null;
        if (!weather || weather.error) {
            throw new Error(weather?.reason || 'Weather service unavailable.');
        }

        const aqi = aqiRes.status === 'fulfilled' ? aqiRes.value : null;

        const tz  = weather.timezone || 'auto';
        const cur = weather.current;

        // Timezone-accurate "current hour" index into the hourly arrays.
        // (uv_index & visibility live in hourly — slice at the location's
        //  real local hour, not the browser's hour.)
        const nowLocalMs  = Date.now() + (weather.utc_offset_seconds || 0) * 1000;
        let startIdx = weather.hourly.time.findIndex(
            t => Date.parse(t + ':00Z') >= nowLocalMs - 30 * 60 * 1000
        );
        if (startIdx < 0) startIdx = 0;

        currentWeatherData = {
            location: label || 'My Location',
            lat, lon,
            timezone:      tz,
            utcOffset:     weather.utc_offset_seconds || 0,
            fetchedAt:     Date.now(),
            current: {
                temp:       cur.temperature_2m,
                feelsLike:  cur.apparent_temperature,
                humidity:   cur.relative_humidity_2m,
                wind:       cur.wind_speed_10m,
                windDir:    cur.wind_direction_10m,
                windGust:   cur.wind_gusts_10m,
                precip:     cur.precipitation,
                code:       cur.weather_code,
                pressure:   cur.surface_pressure,
                isDay:      cur.is_day === 1,
                cloudCover: cur.cloud_cover,
                uv:         weather.hourly.uv_index[startIdx] ?? null,
                visibility: weather.hourly.visibility[startIdx] != null
                                ? (weather.hourly.visibility[startIdx] / 1000).toFixed(1)
                                : null,
                sunrise:    weather.daily.sunrise[0],
                sunset:     weather.daily.sunset[0],
            },
            todayMax:  weather.daily.temperature_2m_max[0],
            todayMin:  weather.daily.temperature_2m_min[0],
            todayRain: weather.daily.precipitation_probability_max[0],
            aqi: {
                us_aqi: aqi?.current?.us_aqi          ?? '--',
                pm25:   aqi?.current?.pm2_5           ?? '--',
                pm10:   aqi?.current?.pm10            ?? '--',
                no2:    aqi?.current?.nitrogen_dioxide ?? '--',
                o3:     aqi?.current?.ozone           ?? '--',
            },
            hourly:   buildHourlyData(weather, startIdx),
            forecast: buildForecastData(weather),
        };

        // ★ Persist everything so the next visit restores instantly
        const locObj = makeLocationObj(lat, lon, label);
        rememberLastLocation(locObj);
        saveRecent(locObj);

        renderDashboard();
    } catch (e) {
        console.error('Weather API error:', e);
        showToast(
            !navigator.onLine
                ? 'You are offline — showing instructions to reconnect.'
                : 'Failed to load weather data. Check your connection.',
            'error'
        );
        setDashboardLoading(false);
    }
}

// ── PROCESS HOURLY DATA (next 24h from location-local hour) ─
function buildHourlyData(weather, startIdx) {
    const hourly = [];
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
    const todayISO = locationTodayISO(weather.utc_offset_seconds);
    const forecast = [];

    for (let i = 0; i < 14; i++) {
        const hourlySlice = weather.hourly.relative_humidity_2m.slice(i * 24, (i + 1) * 24);
        const avgHumidity = hourlySlice.length
            ? Math.round(hourlySlice.reduce((a, b) => a + b, 0) / hourlySlice.length)
            : 0;

        // Anchor at 12:00 so weekday labels never shift across timezones
        const date = new Date(`${weather.daily.time[i]}T12:00:00`);

        forecast.push({
            date,
            dateISO:   weather.daily.time[i],
            isToday:   weather.daily.time[i] === todayISO,
            max:       weather.daily.temperature_2m_max[i],
            min:       weather.daily.temperature_2m_min[i],
            code:      weather.daily.weather_code[i],
            rainProb:  weather.daily.precipitation_probability_max[i],
            precipSum: weather.daily.precipitation_sum[i],
            uvMax:     weather.daily.uv_index_max[i],
            avgHumidity,
        });
    }
    return forecast;
}

// ── COMPARE TWO CITIES ───────────────────────────────────
async function compareCities(city1, city2) {
    const wxParts = '&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,precipitation&timezone=auto';

    const [geo1, geo2] = await Promise.all([
        fetch(`${API.geocode}?name=${encodeURIComponent(city1)}&count=1&language=en&format=json`).then(r => r.json()),
        fetch(`${API.geocode}?name=${encodeURIComponent(city2)}&count=1&language=en&format=json`).then(r => r.json()),
    ]);

    if (!geo1.results?.length) throw new Error(`"${city1}" not found`);
    if (!geo2.results?.length) throw new Error(`"${city2}" not found`);

    const loc1 = geo1.results[0];
    const loc2 = geo2.results[0];

    const [wx1, wx2] = await Promise.all([
        fetch(`${API.forecast}?latitude=${loc1.latitude}&longitude=${loc1.longitude}${wxParts}`).then(r => r.json()),
        fetch(`${API.forecast}?latitude=${loc2.latitude}&longitude=${loc2.longitude}${wxParts}`).then(r => r.json()),
    ]);

    return [
        { name: loc1.name, country: loc1.country, data: wx1.current },
        { name: loc2.name, country: loc2.country, data: wx2.current },
    ];
}

// ── RAINVIEWER: radar frame list for the map ─────────────
async function fetchRainviewerFrames() {
    const res = await fetch(API.rainviewer);
    if (!res.ok) throw new Error('Radar service unavailable');
    const data = await res.json();
    const past = data.radar?.past || [];
    const nowcast = data.radar?.nowcast || [];
    return {
        host: data.host,
        frames: [...past.slice(-6), ...nowcast.slice(0, 2)],   // last 6 past + 2 forecast
    };
}

// ── GPS HANDLER ──────────────────────────────────────────
async function handleGPS() {
    const gpsBtn = document.getElementById('gps-btn');
    if (!navigator.geolocation) {
        showToast('GPS not available on this device.', 'error');
        fetchCoordinates('New Delhi');
        return;
    }

    gpsBtn?.classList.add('locating');
    setLocationLoading('Acquiring GPS…');

    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            try {
                const locName = await reverseGeocode(lat, lon);
                await loadLocation(lat, lon, locName);
            } catch (e) {
                await loadLocation(lat, lon, 'My Location');
            } finally {
                gpsBtn?.classList.remove('locating');
            }
        },
        (err) => {
            gpsBtn?.classList.remove('locating');
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

// ── DEMO MODE (?demo in URL) ─────────────────────────────
// Loads embedded sample data so the app can be previewed with no
// network — handy for offline development and UI testing.
function isDemoMode() {
    return new URLSearchParams(location.search).has('demo');
}

async function loadDemoData() {
    try {
        const res = await fetch('assets/demo-data.json');
        const demo = await res.json();
        currentWeatherData = demo;
        renderDashboard();
        showToast('Demo data loaded (?demo mode)', 'info');
    } catch (e) {
        showToast('Demo data unavailable.', 'error');
        setDashboardLoading(false);
    }
}
