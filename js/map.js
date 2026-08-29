/* ══════════════════════════════════════════════════════════
   map.js — LIVE PRECIPITATION RADAR (Leaflet + RainViewer)
   SkyCast v2.0

   Interactive dark map centered on the current location with an
   animated rain-radar overlay. Frames = last 6 radar scans plus
   2 nowcast frames. Free & key-less (RainViewer + CARTO tiles).
   ══════════════════════════════════════════════════════════ */

const RadarMap = (() => {
    let map        = null;
    let radarLayer = null;
    let baseLayer  = null;
    let marker     = null;
    let frames     = [];
    let rvHost     = 'https://tilecache.rainviewer.com';
    let frameIdx   = 0;
    let timer      = null;
    let playing    = true;
    let loadedFor  = null;   // "lat,lon" the map is centered on

    const FRAME_MS = 900;

    // ── BUILD MAP (once) ─────────────────────────────────
    function ensureMap(lat, lon) {
        if (map) return;

        map = L.map('radar-canvas', {
            center: [lat, lon],
            zoom: 6,
            zoomControl: true,
            attributionControl: true,
            worldCopyJump: true,
        });

        baseLayer = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
            {
                maxZoom: 12,
                attribution: 'Esri Dark Gray · Radar: RainViewer',
            }
        ).addTo(map);

        marker = L.circleMarker([lat, lon], {
            radius: 7,
            color: '#60a5fa',
            weight: 2.5,
            fillColor: '#3b82f6',
            fillOpacity: 0.85,
        }).addTo(map);

        // Pause animation while user interacts
        map.on('dragstart zoomstart', pause);
        map.on('dragend zoomend', resumeSoon);
    }

    // ── UPDATE LOCATION ──────────────────────────────────
    function updateLocation(lat, lon) {
        if (!map) return false;
        const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
        const changed = key !== loadedFor;
        if (changed) {
            map.setView([lat, lon], 6, { animate: true });
            marker?.setLatLng([lat, lon]);
            loadedFor = key;
        }
        return changed;
    }

    // ── LOAD RADAR FRAMES ────────────────────────────────
    async function loadRadar() {
        try {
            const data = await fetchRainviewerFrames();
            frames = data.frames || [];
            if (data.host) rvHost = data.host;
            if (!frames.length) return;

            if (radarLayer) { map.removeLayer(radarLayer); radarLayer = null; }
            frameIdx = Math.max(0, frames.length - 3);   // start near "now"
            showFrame(frameIdx);
            startLoop();
        } catch (e) {
            console.warn('Radar unavailable:', e);
        }
    }

    function tileUrl(frame) {
        // {host}{path}/512/{z}/{x}/{y}/color/{smooth}_{snow}.png
        return `${rvHost}${frame.path}/512/{z}/{x}/{y}/4/1_1.png`;
    }

    function showFrame(i) {
        if (!frames.length || !map) return;
        frameIdx = ((i % frames.length) + frames.length) % frames.length;
        const f  = frames[frameIdx];

        const next = L.tileLayer(tileUrl(f), { opacity: 0.0, maxZoom: 12, tileSize: 512, zoomOffset: -1 });
        next.on('load', () => {
            next.setOpacity(0.72);
            if (radarLayer && radarLayer !== next) map.removeLayer(radarLayer);
            radarLayer = next;
        });
        next.addTo(map);

        const t = new Date(f.time * 1000);
        const label = document.getElementById('radar-frame-label');
        if (label) {
            label.textContent = t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
            label.title = f.path.includes('nowcast') ? 'Forecast radar' : 'Observed radar';
        }
    }

    // ── ANIMATION LOOP ───────────────────────────────────
    function startLoop() {
        stopLoop();
        playing = true;
        syncPlayIcon();
        timer = setInterval(() => {
            if (!playing) return;
            showFrame(frameIdx + 1);
        }, FRAME_MS);
    }

    function stopLoop() {
        if (timer) { clearInterval(timer); timer = null; }
    }

    function pause()        { playing = false; syncPlayIcon(); }
    function resumeSoon()   { setTimeout(() => { playing = true; syncPlayIcon(); }, 1500); }

    function togglePlay() {
        playing = !playing;
        syncPlayIcon();
    }

    function syncPlayIcon() {
        const btn = document.getElementById('radar-play-btn');
        if (btn) btn.innerHTML = playing ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
    }

    function step(dir) {
        pause();
        showFrame(frameIdx + dir);
    }

    // ── PUBLIC: refresh when a new location loads ────────
    function refresh(lat, lon) {
        const panel = document.getElementById('map-section');
        if (!panel || panel.style.display === 'none') return;

        ensureMap(lat, lon);
        updateLocation(lat, lon);
        loadRadar();
        // Leaflet needs a nudge when its container was hidden at init
        setTimeout(() => map?.invalidateSize(), 250);
    }

    return { refresh, togglePlay, step };
})();
