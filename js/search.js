/* ══════════════════════════════════════════════════════════
   search.js — LIVE SEARCH SUGGESTIONS
   SkyCast v2.0

   Type-ahead autocomplete powered by the Open-Meteo geocoding API:
   • Debounced queries (250 ms) as you type
   • Country flags, region + country subtitles
   • Full keyboard navigation: ↑ ↓ to move · Enter to pick · Esc to close
   • Recent searches shown when the field is focused but empty
   • One-click selection loads weather via saved coordinates
     (no second geocoding round-trip, no "city not found" errors)
   ══════════════════════════════════════════════════════════ */

const Search = (() => {
    let box        = null;
    let input      = null;
    let items      = [];        // current suggestion list [{name,label,lat,lon,countryCode,...}]
    let activeIdx  = -1;
    let reqToken   = 0;         // guards against out-of-order responses

    // ── INIT ─────────────────────────────────────────────
    function init() {
        input = document.getElementById('city-search');
        box   = document.getElementById('suggestions-box');
        if (!input || !box) return;

        input.addEventListener('input',  debounce(onType, 250));
        input.addEventListener('focus',  onType);
        input.addEventListener('keydown',onKeydown);
        input.addEventListener('blur',   () => setTimeout(close, 180)); // allow click-through

        document.addEventListener('click', (e) => {
            if (!box.contains(e.target) && e.target !== input) close();
        });

        // "/" or Ctrl+K focuses search from anywhere
        document.addEventListener('keydown', (e) => {
            const typingElsewhere = /input|textarea|select/i.test(document.activeElement?.tagName || '');
            if (e.key === '/' && !typingElsewhere) { e.preventDefault(); input.focus(); input.select(); }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); input.focus(); input.select(); }
        });
    }

    // ── QUERY ────────────────────────────────────────────
    async function onType() {
        const q = input.value.trim();

        if (!q) {
            renderRecents();
            open();
            return;
        }

        const token = ++reqToken;
        renderLoading();

        try {
            const results = await searchGeocode(q, 8);
            if (token !== reqToken) return;          // stale response — ignore
            items     = results;
            activeIdx = -1;
            renderResults(q);
        } catch (e) {
            if (token !== reqToken) return;
            renderMessage('<i class="fas fa-triangle-exclamation"></i> Search unavailable. Check connection.');
        }
        open();
    }

    // ── KEYBOARD ─────────────────────────────────────────
    function onKeydown(e) {
        if (e.key === 'Escape') { close(); input.blur(); return; }

        if (!box.classList.contains('open')) return;

        const rows = box.querySelectorAll('.suggest-item');
        if (!rows.length) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIdx = (activeIdx + 1) % rows.length;
            highlight(rows);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIdx = (activeIdx - 1 + rows.length) % rows.length;
            highlight(rows);
        } else if (e.key === 'Enter') {
            if (activeIdx >= 0 && items[activeIdx]) {
                e.preventDefault();
                pick(items[activeIdx]);
            }
            // Enter with no highlighted row → fall through to
            // the plain-Enter handler in app.js (direct geocode)
        }
    }

    function highlight(rows) {
        rows.forEach((r, i) => r.classList.toggle('active', i === activeIdx));
        rows[activeIdx]?.scrollIntoView({ block: 'nearest' });
    }

    // ── PICK & LOAD ──────────────────────────────────────
    function pick(item) {
        close();
        input.value = '';
        input.blur();
        loadLocation(item.lat, item.lon, item.label);
        // recents saved inside loadLocation
    }

    // ── RENDERERS ────────────────────────────────────────
    function open()  { box.classList.add('open'); }
    function close() { box.classList.remove('open'); activeIdx = -1; }

    function renderLoading() {
        box.innerHTML = `<div class="suggest-loading"><i class="fas fa-spinner fa-spin"></i>Searching locations…</div>`;
        open();
    }

    function renderMessage(html) {
        box.innerHTML = `<div class="suggest-empty">${html}</div>`;
    }

    function renderResults(q) {
        if (!items.length) {
            renderMessage(`<i class="fas fa-face-frown"></i> No matches for "<strong>${escapeHtml(q)}</strong>"`);
            return;
        }
        box.innerHTML =
            `<div class="suggest-group-label"><i class="fas fa-magnifying-glass"></i> Locations</div>` +
            items.map((it, i) => suggestionRow(it, i)).join('');
        wireRows();
    }

    function renderRecents() {
        if (!CONFIG.recents.length) { close(); return; }
        box.innerHTML =
            `<div class="suggest-group-label"><i class="fas fa-clock-rotate-left"></i> Recent</div>` +
            CONFIG.recents.map((it, i) => suggestionRow(it, i)).join('');
        items = CONFIG.recents;
        activeIdx = -1;
        wireRows();
    }

    function suggestionRow(it, i) {
        const sub = [it.admin1, it.country].filter(Boolean).join(', ');
        const flag = it.countryCode ? flagEmoji(it.countryCode) : '';
        return `
            <div class="suggest-item" data-idx="${i}">
                <span class="suggest-flag">${flag}</span>
                <span class="s-main">
                    <span class="s-name">${escapeHtml(it.name)}</span>
                    <span class="s-sub">${escapeHtml(sub || '—')}</span>
                </span>
                <i class="fas fa-arrow-right s-arrow"></i>
            </div>`;
    }

    function wireRows() {
        box.querySelectorAll('.suggest-item').forEach(row => {
            row.addEventListener('mousedown', (e) => {   // mousedown survives input blur
                e.preventDefault();
                pick(items[+row.dataset.idx]);
            });
        });
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    return { init, close };
})();
