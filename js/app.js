/* ══════════════════════════════════════════════════════════
   app.js — ENTRY POINT, EVENTS & APP-LIFE FEATURES
   SkyCast v2.0
   Startup priority: 1) last viewed location (instant restore)
                     2) GPS                        3) default city
   Extras: auto-refresh, share, PWA install, back-to-top,
           online/offline detection, keyboard shortcuts.
   ══════════════════════════════════════════════════════════ */

// ── DOM REFERENCES ────────────────────────────────────────
const DOM = {
    themeToggle:    () => document.getElementById('theme-toggle'),
    unitToggle:     () => document.getElementById('unit-toggle'),
    refreshBtn:     () => document.getElementById('refresh-btn'),
    shareBtn:       () => document.getElementById('share-btn'),
    installBtn:     () => document.getElementById('install-btn'),
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
    applySavedTheme();
    applySavedUnits();
    Search.init();
    setupEventListeners();
    setupConnectivityWatch();
    setupAutoRefresh();
    setupBackToTop();
    setupInstallPrompt();
    registerServiceWorker();
    bootstrapLocation();
}

// ── SMART STARTUP ────────────────────────────────────────
// Restores the last viewed location instantly; falls back to GPS,
// then to a default city — so the app is never blank.
function bootstrapLocation() {
    if (isDemoMode()) { loadDemoData(); return; }

    if (CONFIG.lastLocation) {
        const { lat, lon, label } = CONFIG.lastLocation;
        loadLocation(lat, lon, label);
    } else if (navigator.geolocation) {
        handleGPS();
    } else {
        fetchCoordinates('Kolkata');
    }
}

// ── GREETING & DATE ───────────────────────────────────────
function setGreetingAndDate() {
    const greetEl = DOM.greeting();
    const dateEl  = DOM.dateEl();
    if (greetEl) greetEl.textContent = `${getGreeting()}!`;
    if (dateEl)  dateEl.textContent  = formatDate(new Date());
}

// ── THEME ────────────────────────────────────────────────
function applySavedTheme() {
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
    if (currentWeatherData) TrendChart.render();   // restyle chart with new palette
}

// ── UNITS (now persisted) ────────────────────────────────
function applySavedUnits() {
    const btn = DOM.unitToggle();
    if (btn) btn.textContent = CONFIG.isMetric ? '°C' : '°F';
    document.querySelectorAll('.unit-symbol').forEach(el => {
        el.textContent = CONFIG.isMetric ? '°C' : '°F';
    });
}

// ── CITY CHIPS & CAPITALS ────────────────────────────────
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

function populateCapitalsSelect() {
    const sel = DOM.capitalsSelect();
    if (!sel) return;
    GLOBAL_CAPITALS.forEach(city => {
        const opt = document.createElement('option');
        opt.value = city; opt.textContent = city;
        sel.appendChild(opt);
    });
}

// ── EVENT LISTENERS ──────────────────────────────────────
function setupEventListeners() {
    // ── ANTI-COPY & DEV TOOLS DETERRENTS ──
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    document.addEventListener('copy', (e) => {
        e.preventDefault();
        showToast('Copying is disabled.', 'error');
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'F12') e.preventDefault();
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) e.preventDefault();
        if ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u')) e.preventDefault();
    });
    // ─────────────────────────────────────

    DOM.themeToggle()?.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        setTheme(current === 'dark' ? 'light' : 'dark');
    });

    DOM.unitToggle()?.addEventListener('click', () => {
        CONFIG.isMetric = !CONFIG.isMetric;
        persistUnits();
        applySavedUnits();
        if (currentWeatherData) renderDashboard();
    });

    // Enter in search → direct geocode (suggestions handle Arrow/Enter-pick)
    DOM.citySearch()?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const val = e.target.value.trim();
            if (val) {
                fetchCoordinates(val);
                e.target.value = '';
                e.target.blur();
                Search.close();
            }
        }
    });

    DOM.gpsBtn()?.addEventListener('click', handleGPS);

    DOM.refreshBtn()?.addEventListener('click', manualRefresh);

    DOM.shareBtn()?.addEventListener('click', shareWeather);

    DOM.capitalsSelect()?.addEventListener('change', (e) => {
        if (e.target.value) { fetchCoordinates(e.target.value); e.target.value = ''; }
    });

    // ★ Favorites now load by stored coordinates — instant & reliable
    DOM.favSelect()?.addEventListener('change', (e) => {
        if (!e.target.value) return;
        const fav = CONFIG.favorites.find(f => f.id === e.target.value);
        if (fav) loadLocation(fav.lat, fav.lon, fav.label);
        e.target.value = '';
    });

    DOM.saveFavBtn()?.addEventListener('click', () => {
        if (!currentWeatherData) return;
        const btn  = DOM.saveFavBtn();
        const locObj = makeLocationObj(
            currentWeatherData.lat,
            currentWeatherData.lon,
            currentWeatherData.location
        );

        if (isFavorite(locObj)) {
            removeFavorite(locObj);
            showToast(`Removed "${locObj.name}" from favorites.`, 'info');
        } else {
            if (addFavorite(locObj)) showToast(`Saved "${locObj.name}" to favorites!`, 'success');
        }
        renderFavoritesDropdown();
        checkFavoriteState();

        btn.classList.add('popped');
        btn.addEventListener('animationend', () => btn.classList.remove('popped'), { once: true });
    });

    // Radar map controls
    document.getElementById('radar-play-btn')?.addEventListener('click', () => RadarMap.togglePlay());
    document.getElementById('radar-prev-btn')?.addEventListener('click', () => RadarMap.step(-1));
    document.getElementById('radar-next-btn')?.addEventListener('click', () => RadarMap.step(1));

    document.getElementById('compare-btn')?.addEventListener('click', handleCompareClick);

    ['compare-city-1', 'compare-city-2'].forEach(id => {
        document.getElementById(id)?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleCompareClick();
        });
    });
}

// ── COMPARE HANDLER ──────────────────────────────────────
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

// ── MANUAL + AUTO REFRESH ────────────────────────────────
async function manualRefresh() {
    if (!CONFIG.lastLocation) return;
    const btn = DOM.refreshBtn();
    btn?.classList.add('spinning');
    const { lat, lon, label } = CONFIG.lastLocation;
    await loadLocation(lat, lon, label);
    setTimeout(() => btn?.classList.remove('spinning'), 700);
    showToast('Weather refreshed.', 'success');
}

function setupAutoRefresh() {
    setInterval(() => {
        if (document.hidden || !CONFIG.lastLocation || isDemoMode()) return;
        const { lat, lon, label } = CONFIG.lastLocation;
        loadLocation(lat, lon, label);           // silent — no toast/spinner
    }, CONFIG.refreshMs);
}

// ── SHARE (Web Share API + clipboard fallback) ───────────
async function shareWeather() {
    if (!currentWeatherData) return;
    const d  = currentWeatherData;
    const wd = getWeatherDetails(d.current.code);
    const text =
        `${wd.text} · ${convertTemp(d.current.temp)}${CONFIG.isMetric ? '°C' : '°F'} in ${d.location.split(',')[0]} ` +
        `(feels like ${convertTemp(d.current.feelsLike)}°) — via SkyCast`;

    try {
        if (navigator.share) {
            await navigator.share({ title: 'SkyCast Weather', text, url: location.href });
        } else {
            await navigator.clipboard.writeText(`${text} ${location.href}`);
            showToast('Weather copied to clipboard!', 'success');
        }
    } catch (e) { /* user cancelled — ignore */ }
}

// ── ONLINE / OFFLINE WATCH ───────────────────────────────
function setupConnectivityWatch() {
    window.addEventListener('offline', () => showToast('You are offline. Data will refresh when reconnected.', 'error'));
    window.addEventListener('online', () => {
        showToast('Back online — refreshing…', 'success');
        manualRefresh();
    });
}

// ── BACK TO TOP ──────────────────────────────────────────
function setupBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 600);
    }, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ── PWA INSTALL PROMPT ───────────────────────────────────
let deferredInstallPrompt = null;

function setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
        DOM.installBtn()?.classList.add('visible');
    });

    DOM.installBtn()?.addEventListener('click', async () => {
        if (!deferredInstallPrompt) return;
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') showToast('SkyCast installed! 🎉', 'success');
        deferredInstallPrompt = null;
        DOM.installBtn()?.classList.remove('visible');
    });

    window.addEventListener('appinstalled', () => {
        DOM.installBtn()?.classList.remove('visible');
    });
}

// ── SERVICE WORKER ───────────────────────────────────────
function registerServiceWorker() {
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
        navigator.serviceWorker.register('sw.js').catch(err =>
            console.warn('SW registration skipped:', err));
    }
}

// ── START ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
