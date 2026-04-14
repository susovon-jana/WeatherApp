const CONFIG = {
    isMetric: true, 
};

const DATA = {
    indianCities: ["Mumbai", "Delhi", "Bangalore", "Kolkata", "Chennai", "Hyderabad", "Pune", "Ahmedabad", "Surat", "Jaipur"],
    globalCapitals: ["London", "Tokyo", "Washington D.C.", "Paris", "Berlin", "Moscow", "Beijing", "Canberra", "Ottawa", "Brasilia", "Rome", "Madrid", "Seoul", "Cairo", "Buenos Aires", "Jakarta", "Riyadh", "Pretoria", "Bangkok", "Mexico City"],
    favorites: JSON.parse(localStorage.getItem('weatherFavorites')) || []
};

const DOM = {
    greeting: document.getElementById('dynamic-greeting'), date: document.getElementById('current-date'),
    themeToggle: document.getElementById('theme-toggle'), unitToggle: document.getElementById('unit-toggle'),
    cityContainer: document.getElementById('indian-cities-container'), capitalsSelect: document.getElementById('global-capitals'),
    favSelect: document.getElementById('favorite-locations'), searchInput: document.getElementById('city-search'),
    gpsBtn: document.getElementById('gps-btn'), forecastContainer: document.getElementById('forecast-container'),
    saveFavBtn: document.getElementById('save-fav-btn'), compareBtn: document.getElementById('compare-btn'),
    compareResults: document.getElementById('compare-results')
};

// Global variable to store current real data for unit switching
let currentWeatherData = null; 

function init() {
    setGreetingAndDate();
    populateStaticLists();
    setupEventListeners();
    renderFavoritesDropdown();
    
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        document.documentElement.setAttribute('data-theme', 'light');
        DOM.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    handleGPS();
}

function setGreetingAndDate() {
    const hour = new Date().getHours();
    let greeting = 'Good Evening';
    if (hour < 12) greeting = 'Good Morning';
    else if (hour < 18) greeting = 'Good Afternoon';
    DOM.greeting.innerText = `Hello, ${greeting}!`;
    DOM.date.innerText = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function populateStaticLists() {
    DATA.indianCities.forEach(city => {
        const span = document.createElement('span');
        span.className = 'city-tab'; span.innerText = city;
        span.addEventListener('click', () => fetchCoordinates(city));
        DOM.cityContainer.appendChild(span);
    });
    DATA.globalCapitals.forEach(city => {
        const option = document.createElement('option');
        option.value = city; option.innerText = city;
        DOM.capitalsSelect.appendChild(option);
    });
}

// --- WMO Weather Code to Icon & Text Mapping ---
function getWeatherDetails(code) {
    const conditions = {
        0: { text: "Clear Sky", icon: "fa-sun" },
        1: { text: "Mainly Clear", icon: "fa-sun" },
        2: { text: "Partly Cloudy", icon: "fa-cloud-sun" },
        3: { text: "Overcast", icon: "fa-cloud" },
        45: { text: "Fog", icon: "fa-smog" },
        48: { text: "Depositing Rime Fog", icon: "fa-smog" },
        51: { text: "Light Drizzle", icon: "fa-cloud-rain" },
        53: { text: "Moderate Drizzle", icon: "fa-cloud-rain" },
        55: { text: "Dense Drizzle", icon: "fa-cloud-showers-heavy" },
        61: { text: "Slight Rain", icon: "fa-cloud-rain" },
        63: { text: "Moderate Rain", icon: "fa-cloud-rain" },
        65: { text: "Heavy Rain", icon: "fa-cloud-showers-heavy" },
        71: { text: "Slight Snow", icon: "fa-snowflake" },
        73: { text: "Moderate Snow", icon: "fa-snowflake" },
        75: { text: "Heavy Snow", icon: "fa-snowflake" },
        95: { text: "Thunderstorm", icon: "fa-bolt" },
        96: { text: "Thunderstorm with Hail", icon: "fa-bolt" },
        99: { text: "Heavy Thunderstorm", icon: "fa-bolt" }
    };
    return conditions[code] || { text: "Unknown", icon: "fa-cloud" };
}

// --- Conversions ---
const convertTemp = (celsius) => CONFIG.isMetric ? Math.round(celsius) : Math.round((celsius * 9/5) + 32);
const convertWind = (kmh) => CONFIG.isMetric ? kmh : (kmh * 0.621371).toFixed(1);

// --- Live API Fetching (Open-Meteo & Nominatim) ---
async function fetchCoordinates(cityName) {
    document.getElementById('current-location-name').innerText = `Searching ${cityName}...`;
    try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=1`);
        const data = await res.json();
        if (!data.results) throw new Error("City not found");
        
        const loc = data.results[0];
        // Construct basic name from geocoding
        let locationString = `${loc.name}`;
        if(loc.admin1) locationString += `, ${loc.admin1}`;
        if(loc.country) locationString += `, ${loc.country}`;
        
        getLiveWeatherData(loc.latitude, loc.longitude, locationString);
    } catch (e) {
        alert(e.message);
        document.getElementById('current-location-name').innerText = "Location Error";
    }
}

async function getLiveWeatherData(lat, lon, locationName) {
    document.getElementById('current-temp').innerText = '...';
    try {
        // 1. Fetch Weather Data (14 days, hourly humidity for avg, min/max temps)
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&hourly=relative_humidity_2m&timezone=auto&forecast_days=14`;
        
        // 2. Fetch AQI
        const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,us_aqi`;
        
        const [weatherRes, aqiRes] = await Promise.all([fetch(weatherUrl), fetch(aqiUrl)]);
        const weather = await weatherRes.json();
        const aqi = await aqiRes.json();

        // Process Data
        currentWeatherData = {
            location: locationName,
            current: {
                temp: weather.current.temperature_2m,
                feelsLike: weather.current.apparent_temperature,
                humidity: weather.current.relative_humidity_2m,
                wind: weather.current.wind_speed_10m,
                precip: weather.current.precipitation,
                code: weather.current.weather_code,
                sunrise: new Date(weather.daily.sunrise[0]).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                sunset: new Date(weather.daily.sunset[0]).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            },
            todayMax: weather.daily.temperature_2m_max[0],
            todayMin: weather.daily.temperature_2m_min[0],
            aqi: {
                us_aqi: aqi.current?.us_aqi || '--',
                pm25: aqi.current?.pm2_5 || '--',
                pm10: aqi.current?.pm10 || '--'
            },
            forecast: []
        };

        // Process 14 day forecast and average daily humidity from hourly data
        for(let i = 0; i < 14; i++) {
            // calculate avg humidity for the day (24 hours slices)
            const hourlyHumidities = weather.hourly.relative_humidity_2m.slice(i*24, (i+1)*24);
            const avgHumidity = Math.round(hourlyHumidities.reduce((a, b) => a + b, 0) / 24);
            
            currentWeatherData.forecast.push({
                date: new Date(weather.daily.time[i]),
                max: weather.daily.temperature_2m_max[i],
                min: weather.daily.temperature_2m_min[i],
                code: weather.daily.weather_code[i],
                rainProb: weather.daily.precipitation_probability_max[i],
                avgHumidity: avgHumidity
            });
        }

        renderDashboard();
    } catch (e) {
        console.error("API Error", e);
    }
}

// --- GPS Detailed Reverse Geocoding ---
function handleGPS() {
    if (navigator.geolocation) {
        document.getElementById('current-location-name').innerText = "Locating GPS...";
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                
                try {
                    // Use Nominatim for detailed string: Area, Pincode, District, State, Country
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2`);
                    const data = await res.json();
                    
                    let locName = "Current Location";
                    if(data && data.address) {
                        const a = data.address;
                        const area = a.suburb || a.neighbourhood || a.village || a.town || a.city || '';
                        const pin = a.postcode || '';
                        const dist = a.state_district || a.county || '';
                        const state = a.state || '';
                        const country = a.country || '';
                        
                        // Filter out empty parts and construct clean string
                        const parts = [area, pin, dist, state, country].filter(p => p !== '');
                        locName = parts.join(', ');
                    }
                    getLiveWeatherData(lat, lon, locName);
                } catch(e) {
                    console.log("Nominatim failed, falling back to coords", e);
                    getLiveWeatherData(lat, lon, "GPS Location");
                }
            },
            () => fetchCoordinates("New Delhi") // Fallback
        );
    } else {
        fetchCoordinates("New Delhi");
    }
}

// --- Rendering Engine ---
function renderDashboard() {
    if(!currentWeatherData) return;
    const data = currentWeatherData;
    const wd = getWeatherDetails(data.current.code);

    document.getElementById('current-location-name').innerText = data.location;
    document.getElementById('current-temp').innerText = convertTemp(data.current.temp);
    document.getElementById('current-feels-like').innerText = convertTemp(data.current.feelsLike);
    document.getElementById('today-high').innerText = convertTemp(data.todayMax);
    document.getElementById('today-low').innerText = convertTemp(data.todayMin);
    
    document.getElementById('current-condition').innerText = wd.text;
    document.getElementById('current-icon').className = `fas ${wd.icon} weather-icon-large`;
    
    document.getElementById('current-humidity').innerText = `${data.current.humidity}%`;
    document.getElementById('current-wind').innerText = `${convertWind(data.current.wind)} ${CONFIG.isMetric ? 'km/h' : 'mph'}`;
    document.getElementById('sun-times').innerText = `${data.current.sunrise} / ${data.current.sunset}`;
    document.getElementById('current-precip').innerText = `${data.current.precip} mm`;

    // AQI rendering
    const aqiVal = data.aqi.us_aqi;
    document.getElementById('aqi-value').innerText = aqiVal;
    let aqiText = 'Good', aqiColor = '#10b981';
    if(aqiVal > 50) { aqiText = 'Moderate'; aqiColor = '#eab308'; }
    if(aqiVal > 100) { aqiText = 'Unhealthy'; aqiColor = '#ef4444'; }
    if(aqiVal > 200) { aqiText = 'Hazardous'; aqiColor = '#7f1d1d'; }
    
    document.getElementById('aqi-status').innerText = aqiText;
    document.getElementById('aqi-value').style.color = aqiColor;
    document.getElementById('pm25-val').innerText = data.aqi.pm25;
    document.getElementById('pm10-val').innerText = data.aqi.pm10;

    // Unit Symbols
    document.querySelectorAll('.unit-symbol').forEach(el => el.innerText = CONFIG.isMetric ? '°C' : '°F');

    renderForecast();
    checkFavoriteState();
}

function renderForecast() {
    DOM.forecastContainer.innerHTML = '';
    currentWeatherData.forecast.forEach(day => {
        const wd = getWeatherDetails(day.code);
        const dayStr = day.date.toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'});
        
        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <span class="fc-date">${dayStr}</span>
            <i class="fas ${wd.icon} metric-icon" style="font-size: 2rem;"></i>
            <span class="fc-temps">${convertTemp(day.max)}° <span class="fc-low">${convertTemp(day.min)}°</span></span>
            <div class="fc-extra">
                <span title="Probability of Rain"><i class="fas fa-umbrella"></i> ${day.rainProb}%</span>
                <span title="Average Humidity"><i class="fas fa-tint"></i> ${day.avgHumidity}%</span>
            </div>
        `;
        DOM.forecastContainer.appendChild(card);
    });
}

// --- Features: Favorites, Compare ---
function checkFavoriteState() {
    const currentLoc = document.getElementById('current-location-name').innerText;
    if(DATA.favorites.includes(currentLoc)) {
        DOM.saveFavBtn.innerHTML = '<i class="fas fa-heart"></i>';
    } else {
        DOM.saveFavBtn.innerHTML = '<i class="far fa-heart"></i>';
    }
}

function handleSaveFavorite() {
    const currentCity = document.getElementById('current-location-name').innerText;
    if (DATA.favorites.includes(currentCity)) {
        DATA.favorites = DATA.favorites.filter(c => c !== currentCity); // Remove
    } else {
        if (DATA.favorites.length >= 5) return alert("You can only save up to 5 favorite locations.");
        DATA.favorites.push(currentCity); // Add
    }
    localStorage.setItem('weatherFavorites', JSON.stringify(DATA.favorites));
    renderFavoritesDropdown();
    checkFavoriteState();
}

function renderFavoritesDropdown() {
    DOM.favSelect.innerHTML = '<option value="" disabled selected>Saved Favorites</option>';
    DATA.favorites.forEach(city => {
        const option = document.createElement('option'); option.value = city; option.innerText = city;
        DOM.favSelect.appendChild(option);
    });
}

function handleCompare() {
    const city1 = document.getElementById('compare-city-1').value;
    const city2 = document.getElementById('compare-city-2').value;
    if(!city1 || !city2) return alert("Please enter both cities to compare.");

    DOM.compareResults.classList.remove('hidden');
    DOM.compareResults.innerHTML = '<p>Fetching data for comparison...</p>';
    
    // Quick dual fetch logic
    Promise.all([
        fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city1}&count=1`).then(r=>r.json()),
        fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city2}&count=1`).then(r=>r.json())
    ]).then(results => {
        const loc1 = results[0].results[0]; const loc2 = results[1].results[0];
        return Promise.all([
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc1.latitude}&longitude=${loc1.longitude}&current=temperature_2m,relative_humidity_2m`),
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc2.latitude}&longitude=${loc2.longitude}&current=temperature_2m,relative_humidity_2m`)
        ]).then(responses => Promise.all(responses.map(r => r.json())))
          .then(weatherRes => {
              const d1 = weatherRes[0].current; const d2 = weatherRes[1].current;
              DOM.compareResults.innerHTML = `
                <div class="compare-card">
                    <h4>${loc1.name}</h4><h2 style="margin: 10px 0">${convertTemp(d1.temperature_2m)}°</h2>
                    <p><i class="fas fa-tint"></i> ${d1.relative_humidity_2m}%</p>
                </div>
                <div class="compare-card">
                    <h4>${loc2.name}</h4><h2 style="margin: 10px 0">${convertTemp(d2.temperature_2m)}°</h2>
                    <p><i class="fas fa-tint"></i> ${d2.relative_humidity_2m}%</p>
                </div>
              `;
          });
    }).catch(e => DOM.compareResults.innerHTML = `<p>Error fetching comparison data.</p>`);
}

// --- Event Listeners ---
function setupEventListeners() {
    DOM.themeToggle.addEventListener('click', () => {
        const root = document.documentElement;
        const newTheme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', newTheme);
        DOM.themeToggle.innerHTML = newTheme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    });

    DOM.unitToggle.addEventListener('click', () => {
        CONFIG.isMetric = !CONFIG.isMetric;
        DOM.unitToggle.innerText = CONFIG.isMetric ? '°C' : '°F';
        renderDashboard(); // Re-render instantly without refetching API
    });

    DOM.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.target.value.trim() !== '') {
            fetchCoordinates(e.target.value.trim());
            e.target.value = '';
        }
    });

    DOM.capitalsSelect.addEventListener('change', (e) => fetchCoordinates(e.target.value));
    DOM.favSelect.addEventListener('change', (e) => fetchCoordinates(e.target.value));
    DOM.gpsBtn.addEventListener('click', handleGPS);
    DOM.saveFavBtn.addEventListener('click', handleSaveFavorite);
    DOM.compareBtn.addEventListener('click', handleCompare);
}

document.addEventListener('DOMContentLoaded', init);