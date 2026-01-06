# Sensum Extension

How to install and use the Sensum browser extension (plus a quick overview of how it works).

## Install (Dev)

1. Open `chrome://extensions` (Chrome/Edge)
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `extension/` folder from this repo
5. Click the extension’s **service worker** link to open logs (optional)

## How to use

- Log in to the Sensum web app at `http://localhost:3000`.
- If your dev server is on `http://127.0.0.1:3000`, that works too.
- Browse a tracked site (YouTube, TikTok, Instagram, Reddit).
- After you hit the configured threshold, a nudge overlay appears.
- Buttons:
  - **Reset / Grow / Connect**: opens the Sensum web app.
  - **Snooze**: pauses nudges on the current domain for 15/30/60 minutes.
  - **Disable on this site**: permanently stops nudges/time tracking for that domain (until re-enabled by clearing extension storage).

## What the extension tracks

The extension records minimal telemetry events:

- `time_spent` (every 5 seconds while active on a tracked domain)
- `nudge_shown` (when the overlay is displayed)
- `nudge_clicked` (when the user clicks through to Sensum)

Events are sent to the backend in batches.

## Architecture

The extension has three parts:

- `background.js` (service worker)
  - Tracks time on the active tab (every 5 seconds)
  - Applies gating rules (disabled domains, snooze windows)
  - Shows the nudge by messaging the content script
  - Batches and flushes events to `http://localhost:3000/api/events`
- `content.js` (content script)
  - Renders the nudge overlay UI on tracked sites
- `popup.html` / `popup.js`
  - Simple settings UI for the threshold

## Auth: how event ingestion is authenticated

The backend uses an HttpOnly cookie (`sensum_token`) with `SameSite=Lax`.

- Browsers generally do **not** send SameSite=Lax cookies on cross-site `fetch()` requests initiated by extensions.
- That causes authenticated API calls (like `POST /events`) to fail with `403` if the extension relies on cookies.

To avoid changing cookie policy, the extension uses the Chrome **Cookies API**:

1. The extension reads the `sensum_token` cookie value for `http://localhost:3000` (or `http://127.0.0.1:3000`).
2. It uses that JWT as `Authorization: Bearer <jwt>` when flushing events.

This avoids CSP issues and avoids relying on the browser to attach SameSite cookies to extension-origin fetches.

## Troubleshooting

- **Nudge never appears**
  - Confirm you’re on a supported domain.
  - Check the threshold in the extension popup.
  - Open the tab DevTools console and look for `Sensum content script loaded on:`.

- **Event flush returns 403**
  - Confirm you are logged in to the web app at `http://localhost:3000`.
  - Open the extension service worker console and look for `API token refreshed from cookie: (present)`.

- **I want to reset snooze/disabled domains**
  - In `chrome://extensions` → extension details → extension storage, clear site data/storage for the extension.
