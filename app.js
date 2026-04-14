/* ════════════════════════════════════════════════════════
   app.js — Main Entry Point & Event Listeners
   SkyCast Advanced Weather App
   ════════════════════════════════════════════════════════ */

// ── DOM REFERENCES ────────────────────────────────────────
const DOM = {
    themeToggle:   () => document.getElementById('theme-toggle'),
    unitToggle:    () => document.getElementById('unit-toggle'),
    citySearch:    () => document.getElementById('city-search'),
    gpsBtn:        () => document.getElementById('gps-btn'),
    capitalsSelect:() => document.getElementById('global-capitals'),
    favSelect:     () => document.getElementById('favorite-locations'),
    saveFavBtn:    () => document.getElementById('save-fav-btn'),
    compareBtn:    () => document.getElementById('compare-btn'),
    greeting:      () => document.getElementById('dynamic-greeting'),
    dateEl:        () => document.getElementById('current-date'),
    cityContainer: () => document.getElementById('indian-cities-container'),
};

// ── INIT ──────────────────────────────────────────────────
function init() {
    // Set greeting & date
    setGreetingAndDate();

    // Populate lists
    populateCityChips();
    populateCapitalsSelect();
    renderFavoritesDropdown();

    // Apply system theme preference
    applySystemTheme();

    // Bind all events
    setupEventListeners();

    // Fetch initial weather via GPS
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
    // else dark is default in HTML
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

    // ── THEME TOGGLE
    DOM.themeToggle()?.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        setTheme(current === 'dark' ? 'light' : 'dark');
    });

    // ── UNIT TOGGLE
    DOM.unitToggle()?.addEventListener('click', () => {
        CONFIG.isMetric = !CONFIG.isMetric;
        DOM.unitToggle().textContent = CONFIG.isMetric ? '°C' : '°F';
        if (currentWeatherData) renderDashboard();
    });

    // ── SEARCH: enter key
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

    // ── GPS BUTTON
    DOM.gpsBtn()?.addEventListener('click', handleGPS);

    // ── CAPITALS DROPDOWN
    DOM.capitalsSelect()?.addEventListener('change', (e) => {
        if (e.target.value) {
            fetchCoordinates(e.target.value);
            e.target.value = '';
        }
    });

    // ── FAVORITES DROPDOWN
    DOM.favSelect()?.addEventListener('change', (e) => {
        if (e.target.value) {
            fetchCoordinates(e.target.value);
            e.target.value = '';
        }
    });

    // ── SAVE FAVORITE
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

        // Heart animation
        btn.classList.add('popped');
        btn.addEventListener('animationend', () => btn.classList.remove('popped'), { once: true });
    });

    // ── COMPARE BUTTON
    document.getElementById('compare-btn')?.addEventListener('click', handleCompareClick);

    // ── COMPARE: enter key in fields
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
