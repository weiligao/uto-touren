<p align="center">
  <img src="public/logo.svg" alt="UtoMate" width="96" height="96">
</p>
<h1 align="center">UtoMate</h1>

A web app for searching and browsing tours from [SAC Uto](https://sac-uto.ch/de/aktivitaeten/touren-und-kurse/). Scrapes the official tour listing, parses results server-side, displays them in a table or month calendar view, and lets you download tours as `.ics` calendar files.

## Features

- Filter by year, tour type, event type, and group
- Table view and calendar view with multi-day tour spanning
- Status indicators (open, full/cancelled, not yet open)
- Click tooltips with tour details and links to the original listing
- Download individual tours as `.ics` calendar files
- Results cached for 24 hours to avoid hammering the upstream site

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
