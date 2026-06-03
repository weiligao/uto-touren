<p align="center">
  <img src="public/logo.svg" alt="UtoTouren" width="96" height="96">
</p>
<h1 align="center">UtoTouren</h1>

A web app for searching, filtering and exporting tours from [SAC-Sektion Uto](https://sac-uto.ch/de/aktivitaeten/touren-und-kurse/). Scrapes the official tour listing, parses results server-side, and displays them in a filterable table or month calendar view.


## Features

### Filtering & Browsing
- Faceted, chip-based filters for year, tour type, event type, group, status, weekday, duration, difficulty, tour leader name, tour title
- Multi-select support: search and select multiple filters to match any combination
- Collapsible filter panel with active-filter count badge
- Table view (expandable rows on mobile)
- Calendar view (multi-day spanning, swipe navigation on mobile)

### Tour Details & Export
- Status indicators: open, full/cancelled, not yet open
- Tooltips with tour details and links to the original listing
- Export to calendar: `.ics` download or direct Google Calendar links
- Calendar entries include route, equipment, accommodation, and cost info

### Sharing, Caching & Automation
- All filters and view state are persisted in the URL for easy sharing
- Results cached in Redis for 7 days and in memory for the lifetime of a server instance, for instant repeat filtering
- Automated backend job (cron) fetches and updates tours with resumable backfill strategy

### Analytics & Monitoring
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
| `node scripts/generate-icons.mjs` | Regenerate app icons (apple-icon, 512 px) |

## Caching & Scraping Strategy

### Initial Backfill
On first deployment, the cron job scrapes historical tours from 2013 to current+1 year. This is chunked across multiple cron invocations to prevent timeout. Per-year completion is tracked in Redis, enabling resumable backfill.

**Track progress** via status endpoint:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://uto-touren.vercel.app/api/cron/warm-cache?status=check"
```

Response includes `pendingHistoricalYears` and `fullScrapeComplete` flag.

### Regular Updates
Once backfill completes (global flag set), cron switches to **regular-update mode**: scrapes the current and next calendar year on each invocation to capture newly-added or modified tours.

### Cron Schedule
Configured in `vercel.json`. See that file for the exact schedule.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | No | Canonical URL for OG metadata (defaults to `https://uto-touren.vercel.app`) |
| `KV_REST_API_URL` | No | Upstash Redis REST endpoint — enables persistent cross-cold-start cache |
| `KV_REST_API_TOKEN` | No | Upstash Redis REST token |
| `CRON_SECRET` | No | Bearer token for cron endpoint authentication (required in production) |

Without Upstash env vars the app falls back to an in-process cache that is lost on each cold start. Without `CRON_SECRET`, the cron endpoint is disabled in production.

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
