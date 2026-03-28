# UtoMate

A web app for searching and browsing tours from [SAC Uto](https://sac-uto.ch). Scrapes the official tour listing, parses results server-side, and displays them in a table or month calendar view.

## Features

- Filter by year, tour type, event type, and group
- Table view and calendar view with multi-day tour spanning
- Status indicators (open, full/cancelled, not yet open)
- Hover tooltips with tour details and links to the original listing
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
