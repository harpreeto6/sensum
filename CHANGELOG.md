# Changelog

Quick notes on the bigger changes in this repo — the kind of updates that don’t fit well in a short commit message.

## Unreleased

- Notes for in-progress work go here.

## 2026-01-05 — Demo reliability + docs polish

### Backend

- Supported extension-friendly auth by accepting `Authorization: Bearer <jwt>` in addition to the HttpOnly cookie.
- Added `GET /auth/extension-token` for cookie-authenticated clients that need a Bearer token.
- Fixed Spring Security CORS so `chrome-extension://<id>` origins are allowed via origin patterns.
- Made sure `POST /auth/logout` is permitted so the client can always clear the auth cookie.

### Extension

- Removed the nudge cooldown so nudges keep showing during a demo.
- Stopped relying on SameSite cookies for event ingestion: the extension reads `sensum_token` via the Cookies API and sends it as a Bearer token when flushing events.
- Updated `manifest.json` permissions/host permissions to support cookie reads and tracked-site injection.

### Web

- Added a Logout action in the top “Menu” across main pages (calls `POST /api/auth/logout`, clears local `userId`, redirects to `/login`).

### Docs

- Updated the root README (clearer structure + embedded screenshots from `docs/screenshots/`).
- Added `extension.md` (install/use, internals, and auth troubleshooting).
- Updated `issues.md` to mark the logout UI gap as resolved.
