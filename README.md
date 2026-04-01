<p align="center">
  <img src="public/logo.svg" alt="UtoTouren" width="96" height="96">
</p>
<h1 align="center">UtoTouren</h1>

A web app for searching, filtering and exporting tours from [SAC-Sektion Uto](https://sac-uto.ch/de/aktivitaeten/touren-und-kurse/). Scrapes the official tour listing, parses results server-side, and displays them in a filterable table or month calendar view.

## Features

- Search by year, tour type, event type, and group — form auto-collapses after a successful search
- Live progress indicator during scraping: determinate ring showing pages loaded vs. total (e.g. "Seite 2 von 3 geladen…"), falling back to an indeterminate spinner when page count is unavailable
- Post-search multi-select chip filters for status, duration, difficulty, event type (Tour/Kurs), and group — collapsible panel with active-filter count badge
- Table view with expandable rows on mobile
- Calendar view with multi-day tour spanning and swipe navigation on mobile
- Status indicators (open, full/cancelled, not yet open)
- Tour detail tooltips with links to the original listing
- Export tours to calendar via a dropdown: `.ics` download (tour event + registration reminder with Zurich-midnight alarm, linked via `RELATED-TO`) or direct Google Calendar links for both events; all entries enriched with route details, equipment, accommodation, and cost info fetched server-side and cached 24 h
- All search parameters and view mode are persisted in the URL — shareable links auto-trigger the search
- Results cached in-memory for 24 hours; repeat searches are served instantly without re-scraping
- Vercel Analytics and Speed Insights for performance monitoring

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest tests |
| `node scripts/generate-og-image.mjs` | Regenerate OG images |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | No | Canonical URL for OG metadata (defaults to `https://uto-touren.vercel.app`) |
| `KV_REST_API_URL` | No | Upstash Redis REST endpoint — enables persistent cross-cold-start cache |
| `KV_REST_API_TOKEN` | No | Upstash Redis REST token |

Without the Upstash env vars the app falls back to an in-process cache that is lost on each cold start.

## Tech Stack

- [Next.js](https://nextjs.org) 16 (App Router)
- [React](https://react.dev) 19
- [Tailwind CSS](https://tailwindcss.com) v4
- [cheerio](https://cheerio.js.org) for HTML parsing
- [Upstash Redis](https://upstash.com) for persistent serverless cache
- [Vitest](https://vitest.dev) for unit tests
- [Vercel Analytics](https://vercel.com/docs/analytics) for usage analytics
- [Vercel Speed Insights](https://vercel.com/docs/speed-insights) for performance monitoring

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on reporting bugs, suggesting features, and submitting pull requests.
