# ☁️ SkyCast — Advanced Weather Intelligence

<div align="center">

![SkyCast Banner](https://img.shields.io/badge/SkyCast-Advanced%20Weather-3b82f6?style=for-the-badge&logo=cloud&logoColor=white)
![Vanilla JS](https://img.shields.io/badge/Vanilla-JavaScript-f7df1e?style=for-the-badge&logo=javascript&logoColor=black)
![CSS3](https://img.shields.io/badge/CSS3-No%20Framework-264de4?style=for-the-badge&logo=css3&logoColor=white)
![No API Key](https://img.shields.io/badge/API%20Keys-None%20Required-10b981?style=for-the-badge)
![Deployed on Cloudflare](https://img.shields.io/badge/Deployed%20on-Cloudflare%20Pages-f38020?style=for-the-badge&logo=cloudflare&logoColor=white)

**A full-featured, real-time weather app built with pure HTML, CSS and JavaScript — no frameworks, no build tools, no API keys.**

[🌐 Live Demo](https://sky-cast.pages.dev) · [📖 Full Docs](./documentation.html) · [👤 Developer Portfolio](https://dr-susovon.pages.dev)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Screenshots & UI](#-ui-highlights)
- [Tech Stack](#-tech-stack)
- [File Structure](#-file-structure)
- [Data Flow](#-data-flow)
- [APIs Used](#-apis-used)
- [Local Setup](#-local-setup)
- [Deployment](#-deployment)
- [JS Module Reference](#-javascript-module-reference)
- [CSS Architecture](#-css-architecture)
- [Configuration](#-configuration)
- [Developer](#-developer)

---

## 🌤 Overview

SkyCast is a production-quality weather dashboard that delivers real-time weather conditions, air quality, hourly and 14-day forecasts — all with zero dependencies and zero API keys. It uses only browser-native APIs, free open-data weather services, and hand-crafted CSS for a polished glassmorphism UI with dark and light theme support.

**Why it exists:** To demonstrate that modern, beautiful, data-rich web apps can be built with nothing but the platform — no React, no Vue, no webpack, no npm.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📍 **GPS Auto-Location** | Browser Geolocation API with reverse geocoding to village/area level |
| 🌡️ **Live Current Weather** | Temperature, feels-like, humidity, wind, pressure, UV index, visibility, precipitation |
| 🕐 **24-Hour Forecast** | Hourly strip with rain probability and weather icon per hour |
| 📅 **14-Day Forecast** | Extended daily forecast with high/low, rain probability, and average humidity |
| 🍃 **Air Quality Index** | US AQI animated ring gauge + PM2.5, PM10, NO₂, O₃ pollutant bars with health advice |
| 🆚 **City Comparison** | Side-by-side weather comparison of any two cities worldwide |
| ❤️ **Saved Favorites** | Up to 8 locations saved to `localStorage` for quick access |
| ☀️ **Sun Progress Bar** | Real-time sunrise-to-sunset arc with animated sun dot |
| 🌍 **Global Capitals Dropdown** | 30 pre-loaded world capitals for instant access |
| 🇮🇳 **Indian City Chips** | 15 major Indian cities as one-click quick-nav tabs |
| 🌓 **Dark / Light Theme** | System-preference auto-detection + manual toggle, persisted to `localStorage` |
| °C / °F **Unit Toggle** | Instant metric/imperial switching with live re-render |
| 🕰️ **Local Time Clock** | Live clock ticking in the queried location's timezone |
| 📱 **Fully Responsive** | 6 breakpoints covering desktop, tablet, mobile, landscape, and safe areas |
| ⚡ **No Build Tools** | Works by opening `index.html` via any static server — no npm, no bundler |

---

## 🖥️ UI Highlights

The interface uses a **glassmorphism** design language with:

- Animated ambient background orbs
- Frosted-glass cards with `backdrop-filter: blur()`
- Staggered entrance animations on all forecast cards
- Floating weather icon animation
- Pulsing sun-dot on the sunrise/sunset progress bar
- Color-coded metrics (humidity, wind, UV, pressure) with semantic color theming

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 (semantic, accessible) |
| Styling | Pure CSS3 — custom properties, CSS Grid, Flexbox, `@keyframes` |
| Logic | Vanilla JavaScript (ES2020+) — async/await, `Promise.all`, `localStorage` |
| Fonts | Space Grotesk, Outfit, JetBrains Mono (via Google Fonts) |
| Icons | Font Awesome 6.5 (via CDN) |
| Hosting | Cloudflare Pages |
| Version Control | Git + GitHub |

**No npm. No Node. No React. No Tailwind. No build step.**

---

## 📁 File Structure

```
skycast/
├── index.html          ← Full HTML structure & layout
├── styles.css          ← All styles (16 sections merged)
├── app.js              ← All JavaScript (5 modules merged)
└── documentation.html  ← Interactive documentation page
```

All source was deliberately kept in **3 core files** for maximum portability — paste them into any static host and it works.

### Internal Module Breakdown

`app.js` is organised into 5 logical sections (originally separate files):

```
§1 — config.js    App state, city lists, weather/AQI/UV lookup tables
§2 — utils.js     Temperature conversion, formatting, toast, debounce, favorites
§3 — api.js       Geocoding, GPS handling, weather fetch, AQI fetch, city compare
§4 — render.js    All DOM update functions (hero, metrics, AQI, hourly, forecast)
§5 — app.js       Entry point, event listeners, theme, init()
```

`styles.css` is organised into 16 sections:

```
§1  — CSS variables (dark + light theme tokens)
§2  — Reset, typography, scrollbars, utility classes
§3  — Ambient background orbs
§4  — Loading screen
§5–9 — App wrapper, sticky header, search bar, quick-nav, footer
§10 — Hero card (temperature, weather icon, sun bar)
§11 — Metrics panel (6 cards)
§12 — AQI card (SVG ring, pollutant bars)
§13 — Compare card
§14 — Hourly & 14-day forecast sections
§15 — All @keyframes animations
§16 — Responsive breakpoints (6 breakpoints + safe areas + reduced-motion)
```

---

## 🔄 Data Flow

```
User Action (search / GPS / chip click)
         │
         ▼
  1. Geocoding
     ├─ City name  →  Open-Meteo Geocoding API  →  lat/lon
     └─ GPS coords →  Nominatim (OSM) reverse   →  location name
         │
         ▼
  2. Parallel API Fetch  (Promise.all)
     ├─ Open-Meteo Weather API  →  current + hourly + 14-day daily
     └─ Open-Meteo AQI API     →  US AQI + PM2.5, PM10, NO₂, O₃
         │
         ▼
  3. Data Normalisation
     └─ Raw responses → currentWeatherData object
         (hourly sliced to 24h, daily mapped to 14 objects with avg humidity)
         │
         ▼
  4. renderDashboard()
     ├─ renderHero()      → location, temp, condition, sun bar
     ├─ renderMetrics()   → 6 metric cards
     ├─ renderAQI()       → ring gauge + pollutant bars
     ├─ renderHourly()    → 24 hourly cards
     └─ renderForecast()  → 14 daily cards
```

---

## 🔌 APIs Used

All APIs are **free** and require **no API key**.

### Open-Meteo Weather API
- **Endpoint:** `https://api.open-meteo.com/v1/forecast`
- **Data:** Current conditions, hourly forecast (next 48h), 14-day daily forecast
- **Parameters used:** `temperature_2m`, `relative_humidity_2m`, `apparent_temperature`, `precipitation`, `weather_code`, `wind_speed_10m`, `wind_direction_10m`, `surface_pressure`, `visibility`, `uv_index`, `cloud_cover`, `sunrise`, `sunset`, `precipitation_probability_max`
- **Docs:** [open-meteo.com](https://open-meteo.com)

### Open-Meteo Air Quality API
- **Endpoint:** `https://air-quality-api.open-meteo.com/v1/air-quality`
- **Data:** `us_aqi`, `pm2_5`, `pm10`, `nitrogen_dioxide`, `ozone`
- **Docs:** [open-meteo.com/en/docs/air-quality-api](https://open-meteo.com/en/docs/air-quality-api)

### Open-Meteo Geocoding API
- **Endpoint:** `https://geocoding-api.open-meteo.com/v1/search`
- **Data:** Lat/lon from city name, used for search and city chips
- **Docs:** [open-meteo.com/en/docs/geocoding-api](https://open-meteo.com/en/docs/geocoding-api)

### Nominatim / OpenStreetMap
- **Endpoint:** `https://nominatim.openstreetmap.org/reverse`
- **Data:** Human-readable location name from GPS coordinates (village → district → state → country)
- **Docs:** [nominatim.openstreetmap.org](https://nominatim.openstreetmap.org)

> **Note:** SkyCast deliberately avoids any service requiring API key registration. The app works out of the box for anyone who clones it.

---

## 🚀 Local Setup

SkyCast needs **no npm install, no build step**. Just a static file server (required for GPS / Geolocation API which does not work over `file://`).

### Option A — VS Code Live Server (Recommended)

1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension in VS Code
2. Right-click `index.html` → **Open with Live Server**
3. Browser opens at `http://127.0.0.1:5500`

### Option B — Python

```bash
cd skycast/
python -m http.server 8080
# Open http://localhost:8080
```

### Option C — Node.js

```bash
npx serve .
# Follow the URL printed in terminal
```

> ⚠️ **GPS will not work** if you open `index.html` directly as a `file://` URL. Always use a local server.

---

## ☁️ Deployment

SkyCast is a fully static app — deploy to any static host.

### Cloudflare Pages (Live version)

1. Push your code to GitHub (see git workflow below)
2. Log in to [Cloudflare Pages](https://pages.cloudflare.com)
3. Create a new project → Connect to your GitHub repo
4. Build command: *(leave empty)*
5. Output directory: `/`
6. Deploy — every future `git push` auto-triggers a new deploy

**Live URL:** [https://sky-cast.pages.dev](https://sky-cast.pages.dev)

### GitHub Pages

1. Go to your repo → **Settings** → **Pages**
2. Set source to `main` branch, root `/`
3. Save — the site publishes at `https://username.github.io/WeatherApp`

### Git Workflow

**First-time push:**
```bash
git init
git remote add origin https://github.com/susovon-jana/WeatherApp.git
git add .
git commit -m "First commit"
git branch -M main
git push -u origin main
```

**Every update after that:**
```bash
git add .
git commit -m "update"
git push
```

---

## 📦 JavaScript Module Reference

| Function | Section | Purpose |
|---|---|---|
| `CONFIG` | §1 Config | Global state object: `isMetric`, `favorites[]`, `lastLocation` |
| `WEATHER_CODES` | §1 Config | WMO code → `{ text, icon, color }` lookup table |
| `AQI_LEVELS` | §1 Config | AQI thresholds → `{ label, color, advice }` |
| `UV_LEVELS` | §1 Config | UV index thresholds → `{ label, color }` |
| `convertTemp(c)` | §2 Utils | Returns °C or °F based on `CONFIG.isMetric` |
| `convertWind(kmh)` | §2 Utils | Returns km/h or mph string |
| `getGreeting()` | §2 Utils | Returns time-appropriate greeting string |
| `getSunProgress()` | §2 Utils | Returns 0–1 fraction of daylight elapsed |
| `showToast(msg, type)` | §2 Utils | Displays transient bottom-screen notification |
| `debounce(fn, ms)` | §2 Utils | Standard debounce wrapper |
| `addFavorite(loc)` | §2 Utils | Adds location to `CONFIG.favorites` + `localStorage` |
| `handleGPS()` | §3 API | Triggers browser geolocation + reverse geocode + weather load |
| `fetchCoordinates(city)` | §3 API | Geocodes city name and loads weather |
| `reverseGeocode(lat, lon)` | §3 API | Converts GPS coords → human-readable location string |
| `getLiveWeatherData()` | §3 API | Main fetch: calls weather + AQI APIs in parallel via `Promise.all` |
| `buildHourlyData(weather)` | §3 API | Slices API hourly array to next 24 hours |
| `buildForecastData(weather)` | §3 API | Maps 14 daily entries with computed avg humidity |
| `compareCities(c1, c2)` | §3 API | Geocodes + fetches weather for two cities simultaneously |
| `renderDashboard()` | §4 Render | Master render: calls all sub-renderers in order |
| `renderHero()` | §4 Render | Location, temperature, condition, unit symbols, sun bar |
| `renderMetrics()` | §4 Render | 6 metric cards, humidity bar, wind direction, UV color |
| `renderAQI()` | §4 Render | AQI ring SVG, badge color, 4 pollutant bars, health advice |
| `renderHourly()` | §4 Render | Generates 24 hourly card elements |
| `renderForecast()` | §4 Render | Generates 14 daily forecast card elements |
| `startLocalClock()` | §4 Render | 1-second interval displaying location timezone time |
| `renderFavoritesDropdown()` | §4 Render | Rebuilds the favorites `<select>` from `CONFIG.favorites` |
| `renderCompareResults()` | §4 Render | Renders side-by-side comparison cards |
| `init()` | §5 App | Entry point: greet, populate UI, bind events, fire GPS |
| `setTheme(theme)` | §5 App | Applies `data-theme` to `<html>`, persists to `localStorage` |
| `setupEventListeners()` | §5 App | Binds all button, input, select, and keyboard events |

---

## 🎨 CSS Architecture

Pure CSS3 with **no preprocessor** and **no utility framework**.

| Section | Purpose |
|---|---|
| `§1` CSS Variables | 40+ design tokens for dark and light themes (colors, glass effects, shadows) |
| `§2` Reset | Box-model reset, base typography, scrollbar styling, `.hidden` utility |
| `§3` Ambient | Animated background orbs with `filter: blur()` |
| `§4` Loader | Full-screen loading overlay with animated progress bar |
| `§5–9` Layout | App wrapper, sticky header, search bar, quick-nav, footer |
| `§10` Hero | 5.5rem temperature display, floating icon, sunrise/sunset progress bar |
| `§11` Metrics | 6-card 3-column grid with icon color-coding and mini bar chart |
| `§12` AQI | SVG `stroke-dashoffset` ring animation, pollutant rows, advice text |
| `§13` Compare | Input wraps, VS divider, 2-column results grid |
| `§14` Forecast | Horizontally scrollable hourly and daily card strips |
| `§15` Animations | 12 `@keyframes` including `fade-up`, `temp-pop`, `heart-pop`, `orb-drift` |
| `§16` Responsive | Breakpoints at 1200px, 1024px, 768px, 480px + landscape + safe areas |

**Theming approach:** Dark is the default (`:root`). Light is applied via `[data-theme="light"]` on `<html>`, toggled by JS and persisted to `localStorage`. The theme also auto-detects `prefers-color-scheme: light`.

---

## ⚙️ Configuration

All user-facing configuration lives at the top of `app.js`.

| Key | Type | Default | Purpose |
|---|---|---|---|
| `CONFIG.isMetric` | `boolean` | `true` | `true` = °C, `false` = °F |
| `CONFIG.favorites` | `string[]` | `[]` | Location strings loaded from `localStorage` |
| `CONFIG.lastLocation` | `object` | `null` | Most recently loaded `{ lat, lon, locationName }` |
| `INDIAN_CITIES` | `string[]` | 15 cities | Quick-access chips in the nav bar |
| `GLOBAL_CAPITALS` | `string[]` | 30 cities | Dropdown list of world capital cities |

**To add cities**, simply append to the arrays:

```js
// Add a new city chip
const INDIAN_CITIES = [
    "Kolkata", "Mumbai", ..., "Siliguri"
];

// Add a new global capital
const GLOBAL_CAPITALS = [
    "London", "Tokyo", ..., "Reykjavik"
];
```

**Favorites limit:** The app allows up to 8 saved favorites. This can be changed in the `addFavorite()` function in `app.js`:

```js
if (CONFIG.favorites.length >= 8) { /* change 8 to your limit */ }
```

---

## 👤 Developer

**Susovon Jana, Ph.D.**

Researcher, developer, and designer of SkyCast. The project was built as a showcase of what is achievable with pure browser technologies — no frameworks, no build tooling, just clean, well-structured vanilla code.

- 🌐 Portfolio: [dr-susovon.pages.dev](https://dr-susovon.pages.dev)
- 💻 GitHub: [github.com/susovon-jana](https://github.com/susovon-jana)
- ☁️ Live App: [sky-cast.pages.dev](https://sky-cast.pages.dev)

---

## 📄 License

This project is personal work by Susovon Jana. All rights reserved. You may clone and run it locally for personal learning purposes. Please do not redistribute or republish as your own work.

---

<div align="center">

Made with ☁️ and pure JavaScript by **Susovon Jana, Ph.D.**

</div>
