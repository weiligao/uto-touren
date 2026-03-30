<p align="center">
  <img src="public/logo.svg" alt="UtoTouren" width="96" height="96">
</p>
<h1 align="center">UtoTouren</h1>

A web app for searching and browsing tours from [SAC-Sektion Uto](https://sac-uto.ch/de/aktivitaeten/touren-und-kurse/). Scrapes the official tour listing, parses results server-side, and displays them in a filterable table or month calendar view.

## Features

- Search by year, tour type, event type, and group
- Post-search multi-select chip filters for status, duration, difficulty, and group — collapsible panel with active-filter count badge
- Table view with expandable rows on mobile
- Calendar view with multi-day tour spanning and swipe navigation on mobile
- Status indicators (open, full/cancelled, not yet open)
- Tour detail tooltips with links to the original listing
- Download individual tours as `.ics` calendar files
- All search parameters and view mode are persisted in the URL — shareable links auto-trigger the search
- Results cached for 24 hours to avoid hammering the upstream site
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

## Tech Stack

- [Next.js](https://nextjs.org) 16 (App Router)
- [React](https://react.dev) 19
- [Tailwind CSS](https://tailwindcss.com) v4
- [cheerio](https://cheerio.js.org) for HTML parsing
- [Vitest](https://vitest.dev) for unit tests
- [Vercel Analytics](https://vercel.com/docs/analytics) for usage analytics
- [Vercel Speed Insights](https://vercel.com/docs/speed-insights) for performance monitoring

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on reporting bugs, suggesting features, and submitting pull requests.
