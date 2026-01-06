# Sensum — Issues / Tech Debt Tracker

A running list of known issues and improvement ideas found while reviewing the current implementation (backend + web + extension). Each item includes impact and a concrete fix.

## Legend

- **Severity:** High / Medium / Low
- **Type:** Bug / Security / Data / UX / Maintainability

---

## High severity

### 1) CSRF protection is disabled while using cookie auth
- **Type:** Security
- **Severity:** High
- **Where:** Backend security config (CSRF disabled) + JWT stored in HttpOnly cookie
- **Why it matters:** When auth is cookie-based, browsers automatically attach cookies on cross-site requests. If CSRF is disabled and an attacker can cause the browser to send requests to the API, state-changing endpoints could be at risk.
- **Suggested fix:**
  - Implement CSRF protection (Spring Security CSRF tokens) OR
  - Switch to `Authorization: Bearer <token>` header (and keep tokens out of cookies) OR
  - Use defense-in-depth: `SameSite=Strict/Lax` cookie settings + CSRF token for unsafe methods.

### 2) JWT signing key is hard-coded (dev secret)
- **Type:** Security
- **Severity:** High
- **Where:** JWT utility
- **Why it matters:** Anyone with the repo can forge tokens; also makes deployments unsafe.
- **Suggested fix:** Load secret from environment (`JWT_SECRET`) and rotate per environment; ensure strong random secret.

### 3) Flyway migrations define buddy tables twice (schema conflict risk)
- **Type:** Data
- **Severity:** High
- **Where:** `backend/src/main/resources/db/migration/V4__social.sql` vs `V7__buddy_sessions.sql`
- **Why it matters:** Two different definitions for `buddy_sessions` / `buddy_checkins` can break fresh installs or create confusing partial schemas depending on DB history.
- **Suggested fix:** Consolidate to a single canonical schema:
  - Create a new migration that renames/merges tables safely
  - Remove/replace older definitions for fresh DBs
  - Verify `flyway_schema_history` and clean dev DB if needed

### 4) `/stats/today` aggregates globally (not per-user)
- **Type:** Bug / Data
- **Severity:** High
- **Where:** Stats controller
- **Why it matters:** “Today” metrics can leak or mix data across users; also doesn’t match typical per-user expectations.
- **Suggested fix:** Filter by authenticated `userId` and date window; consider admin-only global stats if needed.

---

## Medium severity

### 5) Stats range parameter is currently ignored
- **Type:** Bug
- **Severity:** Medium
- **Where:** `/stats/summary?range=...`
- **Why it matters:** UI suggests time-range filtering, but backend returns totals without applying range.
- **Suggested fix:** Parse `range` (e.g., week/month/all) and apply time constraints in queries.

### 6) Extension does not read tracked domains from user settings
- **Type:** UX / Maintainability
- **Severity:** Medium
- **Where:** Extension uses its own allowlist/disabled logic; backend stores `tracked_domains`
- **Why it matters:** Users set domains in the web settings, but the extension doesn’t automatically follow it.
- **Suggested fix:** Add an endpoint to fetch settings (or reuse `/me/settings`) from the extension, and sync `tracked_domains` into extension state.

### 7) “mode” query param from extension isn’t consumed by the web app
- **Type:** UX
- **Severity:** Medium
- **Where:** Extension opens `http://localhost:3000/?mode=...`
- **Why it matters:** The nudge buttons imply category intent, but the web app does not appear to use that param to filter recommendations.
- **Suggested fix:** Read query params on the Today page and map to a `path` / category selection.

### 8) CORS allows `chrome-extension://*` with credentials
- **Type:** Security
- **Severity:** Medium
- **Where:** Backend CORS config
- **Why it matters:** With credentialed requests, permissive extension origins can broaden attack surface.
- **Suggested fix:** Restrict to your actual extension ID(s) per environment.

### 9) Logout exists server-side but UI flow may not call it (resolved)
- **Type:** UX / Security
- **Severity:** Medium
- **Status:** Resolved — logout is available in the web UI menus and calls `POST /auth/logout`.

---

## Low severity / polish

### 10) Settings arrays stored as JSON strings
- **Type:** Data / Maintainability
- **Severity:** Low
- **Where:** `user_settings.selected_paths` and `tracked_domains`
- **Why it matters:** JSON-as-string works, but complicates querying and validation.
- **Suggested fix:** Use `jsonb` columns (Postgres) or normalized tables; validate inputs server-side.

### 11) Duplicate Next config files (JS + TS)
- **Type:** Maintainability
- **Severity:** Low
- **Where:** `web/next.config.js` and `web/next.config.ts`
- **Why it matters:** Confusing source of truth; easy to edit the wrong one.
- **Suggested fix:** Keep only one config file and ensure rewrites live there.

### 12) Client stores `userId` in localStorage
- **Type:** UX / Maintainability
- **Severity:** Low
- **Why it matters:** Backend already identifies users from the cookie; stale localStorage can drift from server truth.
- **Suggested fix:** Use `/me` response as source of truth; avoid localStorage for identity.

---

## Nice-to-have (future improvements)

- Add automated tests:
  - Backend: controller/service tests for auth, quests, events batching
  - Web: basic integration tests for core flows
- Add structured logging + request IDs (backend) for easier debugging.
- Improve extension reliability:
  - Exponential backoff on flush failures
  - Surface last-sync status in popup
- UI theme + mascot animations:
  - Unify look/feel across pages (colors/typography/components; light/dark consistency)
  - Add an optional mascot (beaver/dog) with small animations tied to key moments (nudge shown, quest completed)
  - Include a “reduce motion / disable animations” toggle and keep animations lightweight
- Add API documentation (OpenAPI/Swagger) for endpoints.

---

## Notes

- This file is intentionally scoped to actionable items that materially improve correctness, security, and product coherence.
