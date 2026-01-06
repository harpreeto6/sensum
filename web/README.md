# Sensum Web

This folder contains the Sensum web app (Next.js + TypeScript).

For full setup (Postgres + backend + extension), see the repo root README.

## Run locally

From this folder:

```bash
npm install
npm run dev
```

App: http://localhost:3000

## API proxy

In local dev, the web app calls the backend via `/api/*`.

`/api/:path*` is rewritten to `http://localhost:8080/:path*` (see `next.config.js`).
