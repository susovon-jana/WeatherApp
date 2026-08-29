<div align="center">

# ☀️ SkyCast — Advanced Weather Intelligence

**A modern, dependency-free weather app. Search any city on Earth, save locations that actually load back, read the rain radar, and install it as an app.**

[![Version](https://img.shields.io/badge/version-2.0.0-3b82f6?style=flat-square)](#-changelog)
[![License: MIT](https://img.shields.io/badge/license-MIT-10b981?style=flat-square)](LICENSE)
[![No API key needed](https://img.shields.io/badge/API%20keys-none-f59e0b?style=flat-square)](#-data-sources)
[![Vanilla JS](https://img.shields.io/badge/vanilla-JS%20%2B%20CSS-a855f7?style=flat-square)](#-tech-stack)

[Live Demo](https://sky-cast.pages.dev) · [Documentation](documentation.html) · [Developer](https://dr-susovon.pages.dev)

*Designed & Developed by **[Susovon Jana, Ph.D.](https://dr-susovon.pages.dev)***

</div>

---

## 📖 Table of Contents

1. [What's New in v2.0](#-whats-new-in-v20)
2. [Features](#-features)
3. [Quick Start](#-quick-start)
4. [Project Structure](#-project-structure)
5. [How It Works](#-how-it-works)
6. [Data Sources](#-data-sources)
7. [User Guide](#-user-guide)
8. [Customization Guide](#-customization-guide)
9. [Deployment](#-deployment)
10. [Troubleshooting](#-troubleshooting)
11. [Tech Stack](#-tech-stack)
12. [Changelog](#-changelog)
13. [License](#-license)

---

## ✨ What's New in v2.0

| | Feature | Description |
|---|---------|-------------|
| 🔍 | **Live search suggestions** | Type any city → instant suggestions with country flags, states & keyboard navigation (↑ ↓ Enter Esc) |
| ❤️ | **Saved locations — FIXED** | Favorites now store exact coordinates, so they **always** load back correctly (the old string-based favorites could silently fail) |
| 💾 | **Instant restore** | The app remembers your last viewed location, units (°C/°F) and theme — reopen and it's exactly where you left it |
| 📈 | **24-hour trend chart** | Temperature curve + rain-probability bars (Chart.js) |
| 🛰️ | **Live rain radar** | Animated precipitation radar centered on your location (Leaflet + RainViewer) |
| ⚠️ | **Weather alerts** | Auto-derived advisories: extreme heat, very-high UV, strong winds, thunderstorms, heavy rain, unhealthy air, low visibility |
| 🌙 | **Moon phase** | Computed locally — no extra API call |
| 🎨 | **Dynamic weather theming** | Ambient background orbs subtly retint to match live conditions (clear, rain, storm, snow, fog, night) |
| 📲 | **Installable PWA** | Add SkyCast to your home screen / desktop — works offline with a service worker |
| 🔄 | **Auto-refresh** | Data silently refreshes every 15 minutes; manual refresh button too |
| 📤 | **Share button** | Native share sheet on mobile, clipboard fallback on desktop |
| ⌨️ | **Keyboard shortcuts** | `/` or `Ctrl+K` jumps to search |
| 🕘 | **Recent searches** | Your last 6 locations appear when you focus the search box |
| 🧭 | **Timezone-accurate** | Hourly slices and "today" detection now follow the *viewed city's* local time, not your browser's |

## 🌟 Features (full list)

**Core weather**
- 🌡️ Current conditions: temperature, feels-like, humidity, wind (speed + direction + gusts), precipitation, pressure, visibility, UV index, cloud cover
- 📅 14-day forecast with rain probability, humidity & UV max
- ⏰ 24-hour forecast strip + interactive trend chart
- 🌅 Sunrise / sunset with a live day-progress bar
- 🌫️ Air Quality Index (US AQI) with PM2.5, PM10, NO₂, O₃ breakdown + health advice

**Location intelligence**
- 🔍 Live autocomplete for **any place worldwide** (cities, towns, villages)
- 📍 One-tap GPS with reverse-geocoded village/area names
- ❤️ Up to 12 saved favorites (coordinate-accurate)
- 🕘 Recent searches history
- 🏙️ Quick chips for Indian cities + global capitals dropdown
- ⚖️ Side-by-side city comparison

**Experience**
- 🌗 Dark / light themes (auto-detects system preference)
- 🎨 Dynamic ambient theming that follows the weather
- ⚠️ Smart weather alert banners
- 🌙 Moon phase chip
- 📲 PWA install + offline shell
- 📱 Fully responsive — desktop grid → mobile cards

## 🚀 Quick Start

SkyCast is 100% static — no build step, no npm, no framework.

**Option A — just open it**
```bash
# unzip, then double-click index.html
```
> Most features work from `file://`, but GPS, the PWA install and the service worker require a local server (browsers restrict them on `file://`).

**Option B — local server (recommended)**

```bash
# Python
python -m http.server 8080

# …or Node
npx serve .
```
Then open **http://localhost:8080**

**Option C — preview with demo data (no network needed)**
```
http://localhost:8080/index.html?demo
```
Loads a built-in sample dataset (`assets/demo-data.json`) — great for UI testing, screenshots and offline development.

**First launch behavior:** the app asks for GPS permission. If you decline, it falls back to Kolkata. From the second visit on, it **instantly restores your last viewed location**.

## 📁 Project Structure

```
WeatherApp/
├── index.html              ← main app (all UI sections)
├── documentation.html      ← technical documentation page
├── manifest.json           ← PWA manifest (name, icons, colors)
├── sw.js                   ← service worker (offline shell + caching)
├── LICENSE                 ← MIT license
├── README.md               ← this guide
├── .gitignore
│
├── assets/
│   ├── favicon.svg         ← brand icon (vector)
│   ├── icons/              ← generated PWA icons (180/192/512 px)
│   └── demo-data.json      ← sample dataset for ?demo mode
│
├── css/                    ← styles split by responsibility
│   ├── base.css            ← variables, theming, reset, ambient bg, loader
│   ├── layout.css          ← header, search bar, quick nav, grid, footer
│   ├── components.css      ← hero, metrics, AQI, compare, forecast,
│   │                          suggestions dropdown, alerts, chart, radar map
│   └── responsive.css      ← animations, keyframes, mobile fixes,
│                              dynamic weather themes (body[data-wx])
│
└── js/                     ← logic split by responsibility (load order matters)
    ├── config.js           ← constants: APIs, weather codes, city lists, state
    ├── utils.js            ← helpers + localStorage stores (favorites/recents/
    │                          last location/units) + date-time + formatting
    ├── api.js              ← all fetching: geocoding, weather, AQI, GPS,
    │                          reverse geocode, compare, radar frames, demo mode
    ├── search.js           ← live suggestions module (debounce, keyboard nav)
    ├── charts.js           ← 24-hour Chart.js trend (temp line + rain bars)
    ├── map.js              ← Leaflet rain radar with animated frames
    ├── render.js           ← every DOM rendering function + alerts + theming
    └── app.js              ← init, events, auto-refresh, share, PWA install
```

## 🧠 How It Works

**1. Every location load funnels through one function**
`loadLocation(lat, lon, label)` in `api.js` — GPS, search picks, favorites, city chips and capitals all end up here. It fetches weather + air quality in parallel, processes the data, renders the dashboard, and **persists the location** to `localStorage`.

**2. Why saved locations now always work**
The old version stored favorites as display strings (`"Village, District, State, Country"`) and re-searched that text on load — GPS-derived names often aren't searchable, so favorites failed silently. v2.0 stores `{ id, name, label, lat, lon }`; the dropdown loads favorites **directly by coordinates** with zero geocoding.

**3. Timezone-accurate hourly data**
Open-Meteo returns hourly arrays in the *viewed city's* local time. v2.0 computes the current local hour using the API's `utc_offset_seconds`, so "Now" is correct even when you browse another continent.

**4. Search suggestions**
`search.js` debounces your typing (250 ms), queries the Open-Meteo geocoder for up to 8 matches, renders flags + regions, and tracks an out-of-order-response token so fast typing never shows stale results.

**5. Offline & PWA**
`sw.js` precaches the whole shell at install. API responses are cached network-first — if you go offline, the last successful weather data still renders.

## 🌐 Data Sources

All free, all key-less:

| Service | Provides | Endpoint |
|---------|----------|----------|
| [Open-Meteo](https://open-meteo.com) | Current, hourly (incl. UV & visibility), 14-day forecast | `api.open-meteo.com/v1/forecast` |
| [Open-Meteo AQ](https://open-meteo.com/en/docs/air-quality-api) | US AQI, PM2.5, PM10, NO₂, O₃ | `air-quality-api.open-meteo.com` |
| [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api) | City search & suggestions | `geocoding-api.open-meteo.com` |
| [Nominatim / OSM](https://nominatim.org) | Reverse geocoding (GPS → place name) | `nominatim.openstreetmap.org` |
| [RainViewer](https://www.rainviewer.com) | Radar frames for the map | `api.rainviewer.com` |
| [Esri](https://www.esri.com) | Dark-gray base map tiles | `server.arcgisonline.com` |

## 📱 User Guide

**Search any location**
Click the search box (or press `/`) → type → pick a suggestion with the mouse or ↑ ↓ + Enter. Your selection is saved to *Recent searches* automatically.

**Save a favorite**
Load any location → tap the ♡ heart next to the city name. It's stored with coordinates and appears in the **Saved Favorites** dropdown. Tap again to remove.

**Read the radar**
The *Live Rain Radar* section animates the last hour of radar + 30 min of nowcast. Buttons: prev / play-pause / next. Dragging the map pauses the loop so you can explore.

**Share the weather**
The ↗ share button uses the native share sheet on phones; on desktop it copies a ready-made summary to your clipboard.

**Install as an app**
Once served over HTTPS, the download icon appears in the header (Chrome/Edge desktop, Android Chrome, iOS Safari → *Share → Add to Home Screen*).

**Units & theme**
The °C/°F button and the moon/sun toggle persist between visits.

## 🛠️ Customization Guide

**Change branding (name, site, links)** — edit in three places:
- `js/config.js` → the `APP_INFO` object
- `index.html` → the header `profile-chip` and footer links
- `manifest.json` → `name`, `author`, `website`

**Add quick-pick cities** — `js/config.js`:
```js
const INDIAN_CITIES    = [ "Kolkata", … ];   // chips
const GLOBAL_CAPITALS  = [ "London", … ];    // dropdown
```

**Change favorites limit** — `js/config.js` → `CONFIG.maxFavorites` (default 12).

**Change auto-refresh interval** — `js/config.js` → `CONFIG.refreshMs` (default 15 min).

**Tweak alert thresholds** — `js/render.js` → `renderAlerts()` (e.g. change heat advisory from 35 °C, wind from 40 km/h, AQI from 150).

**Add a color theme** — `css/base.css` holds all CSS variables per `[data-theme]`; retint `--accent`, `--glass-bg`, orbs, etc.

**Adjust weather-tint backgrounds** — `css/responsive.css` → the `body[data-wx="…"]` rules.

**Tune chart style** — `js/charts.js` (colors are read from CSS variables automatically).

**Radar colors/opacity** — `js/map.js` → `tileUrl()` color id (`4` = Universal Blue; see RainViewer docs) and the `0.72` opacity. The dark base map (Esri) can be swapped there too.

## 🌍 Deployment

Any static host works. After deploying over **HTTPS**, the PWA install prompt activates automatically.

**Cloudflare Pages (current host)**
```bash
git add . && git commit -m "SkyCast v2.0" && git push
```
Build command: *(none)* · Output dir: `/` (root). First-time setup: create the project at [pages.dev](https://pages.dev) → connect the GitHub repo.

**GitHub Pages**
Repo → Settings → Pages → Deploy from branch → `main / (root)`.

**Netlify / Vercel**
Drag-and-drop the folder, or connect the repo. No build command, publish directory = root.

## 🔧 Troubleshooting

| Problem | Cause & Fix |
|---------|-------------|
| "Location access denied" | Browser blocked GPS. Use the search box instead, or allow location in site settings. |
| Search shows nothing | You're offline or the geocoder is unreachable — check the connection; suggestions recover automatically. |
| Weather card empty / toast error | Open-Meteo may be briefly rate-limited or down. Press the refresh button in a minute. |
| Radar section blank | RainViewer occasionally restarts tiles — refresh. Radar needs the map visible; it loads lazily. |
| PWA install icon missing | Serve over HTTPS (or localhost) and open in Chrome/Edge/Safari. Already-installed apps hide the button by design. |
| Stale UI after an update | Hard-refresh (Ctrl+Shift+R). The service worker updates in the background and activates on next load. |
| Saved favorites disappeared | v1 stored plain strings; v2 stores coordinate objects. Re-save your favorites once — they'll never break again. |

## 🧱 Tech Stack

- **Zero frameworks, zero build step** — vanilla HTML5, CSS3, modern JavaScript (ES2020)
- [Chart.js 4](https://www.chartjs.org) — 24-hour trend chart
- [Leaflet 1.9](https://leafletjs.com) — radar map
- [Font Awesome 6](https://fontawesome.com) + Google Fonts (Outfit, Space Grotesk, JetBrains Mono)
- Storage: `localStorage` (favorites, recents, last location, units, theme)

## 📜 Changelog

**v2.0.0** — Major upgrade
- ✨ Live search suggestions with flags & keyboard navigation
- 🐛 **Fixed:** saved locations now store coordinates and always reload
- 💾 Persistent last location, units, theme, recent searches
- 📈 24-hour trend chart · 🛰️ animated rain radar · ⚠️ weather alerts · 🌙 moon phase
- 🎨 dynamic weather theming · 📲 PWA (manifest + service worker + icons)
- 🔄 auto-refresh + manual refresh · 📤 share · ⌨️ `/` search shortcut
- 🧭 timezone-accurate hourly slice & "today" detection
- 🗂️ codebase reorganized into modular `css/` + `js/` folders
- 📚 this README guide, MIT LICENSE, `.gitignore`, demo mode (`?demo`)

**v1.x** — single-file app: current weather, AQI, 14-day forecast, compare cities, favorites (string-based), theme & unit toggles.

## 📄 License

Released under the [MIT License](LICENSE) — free to use, modify and distribute with attribution.

Copyright © 2024–2026 **[Susovon Jana, Ph.D.](https://dr-susovon.pages.dev)**

<div align="center">

**SkyCast** · Advanced Weather Intelligence · [sky-cast.pages.dev](https://sky-cast.pages.dev)

</div>
