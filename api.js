/* ════════════════════════════════════════════════════════
   api.js — Data Fetching: Geocoding, Weather, AQI, GPS
   SkyCast Advanced Weather App
   ════════════════════════════════════════════════════════ */

// ── SHARED STATE ─────────────────────────────────────────
let currentWeatherData = null;

// ── GEOCODE CITY NAME → COORDS ───────────────────────────
async function fetchCoordinates(cityName) {
    setLocationLoading(`Searching "${cityName}"...`);
    try {
        const res  = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`);
        const data = await res.json();
        if (!data.results || !data.results.length) throw new Error(`"${cityName}" not found. Try a different name.`);

        const loc = data.results[0];
        const locationString = buildLocationString(loc.name, loc.admin1, loc.country);
        await getLiveWeatherData(loc.latitude, loc.longitude, locationString, null);
    } catch (e) {
        showToast(e.message || 'City not found.', 'error');
        setLocationLoading('Search failed');
    }
}

// ── REVERSE GEOCODE: COORDS → VILLAGE/AREA NAME ──────────
async function reverseGeocode(lat, lon) {
    // Use Nominatim for maximum detail — gets village, hamlet, suburb etc.
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&zoom=16&addressdetails=1`;
    const res  = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();

    const a = data.address || {};

    // Priority: village > hamlet > suburb > neighbourhood > town > city > county
    const place =
        a.village     ||
        a.hamlet      ||
        a.suburb      ||
        a.neighbourhood||
        a.town        ||
        a.city        ||
        a.county      ||
        '';

    const district = a.state_district || a.county || '';
    const state    = a.state || '';
    const country  = a.country || '';

    // Build compact: "Sonarpur, South 24 Parganas, West Bengal, India"
    const parts = [place, district, state, country].filter(Boolean);
    // Remove duplicates
    const unique = [...new Set(parts)];
    let locationString = unique.join(', ');

    // Strip Plus Codes like "J9XG+WR "
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
            fetchCoordinates('Kolkata'); // Sensible India default
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

        const tz = weather.timezone || timezone || 'auto';

        // Build current snapshot
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
                us_aqi: aqi.current?.us_aqi     ?? '--',
                pm25:   aqi.current?.pm2_5       ?? '--',
                pm10:   aqi.current?.pm10        ?? '--',
                no2:    aqi.current?.nitrogen_dioxide ?? '--',
                o3:     aqi.current?.ozone       ?? '--',
            },
            hourly: buildHourlyData(weather),
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

// ── PROCESS HOURLY DATA (next 24h) ──────────────────────
function buildHourlyData(weather) {
    const hourly = [];
    const now    = new Date();
    const nowHr  = now.getHours();

    // Find current hour index in hourly array
    // hourly.time[0] is today 00:00 local
    const startIdx = nowHr; // offset from midnight

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
        const hourlySlice  = weather.hourly.relative_humidity_2m.slice(i * 24, (i + 1) * 24);
        const avgHumidity  = hourlySlice.length
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
        if (on) {
            el.classList.remove('fade-out');
        } else {
            el.classList.add('fade-out');
        }
    }
}
