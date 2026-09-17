# Kairad Supply Chain Dashboard

Standalone React dashboard tracking live warehouse utilisation, unfulfilled
demand, and multimodal shipment tracking across the Chakan-Pune logistics
corridor. Deployed separately from the main Kairad marketing site and linked
to from `dashboard.html` there.

Stack: React 19 + Vite + Tailwind CSS v4 + Recharts + react-leaflet.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Outputs a static bundle to `dist/`.

## Deploy

This repo is configured for Netlify (see `netlify.toml`): build command
`npm run build`, publish directory `dist`. Connect the repo in Netlify
("Add new site" -> "Import an existing project") and it will build and
redeploy on every push to `main`.

## Updating data

All dashboard data currently lives inline in `src/App.jsx` (see the
`MARKET_DATA` / `TRACKING_DATA` constants near the top of the file). Swap
these for `fetch()` calls once a live data source is wired up.
