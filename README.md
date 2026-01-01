# Sensum

Sensum is a focused productivity + wellbeing app that helps you become more intentional about how you spend time online.

It combines:
- A browser extension that tracks time spent and nudges you when you drift.
- A web app where you can manage settings and see your progress.
- A Spring Boot API + Postgres database that stores users, events, quests, and settings.

## Architecture

```mermaid
flowchart LR
  Ext[Browser Extension] -->|POST /events (cookies)| API[Backend: Spring Boot]
  Web[Web App: Next.js] -->|calls API (cookies)| API
  API --> DB[(Postgres)]
```

Notes:
- Auth is cookie-based (an HttpOnly JWT cookie named `sensum_token`).
- The web app and extension must send cookies (`credentials: "include"`) so the backend can identify the user.

## How to run (local dev)

### 1) Start Postgres (Docker)

From the repo root:

```bash
docker compose up -d
```

This starts Postgres on `localhost:5432` (database/user/password are configured in `docker-compose.yml`).

### 2) Start the backend (Spring Boot)

```powershell
cd backend
.\mvnw spring-boot:run
```

Backend runs on: `http://localhost:8080`

### 3) Start the web app (Next.js)

```powershell
cd web
npm install
npm run dev
```

Web runs on: `http://localhost:3000`

The web app expects the backend at: `http://localhost:8080`

### 4) (Optional for local dev) Load the extension

Chrome/Edge:
- Go to `chrome://extensions`
- Enable **Developer mode**
- Click **Load unpacked**
- Select the `extension/` folder in this repo

## Screenshots / GIF
to be done
<!--
Add screenshots/GIFs that demonstrate the core flow:
- Login / Signup
- Settings page (paths, nudge threshold, tracked domains)
- Extension running + sending an event
- Any “results” view (profile / stats / leaderboard)

Suggested locations (create these files and update links below):
- `docs/screenshots/settings.png`
- `docs/demo.gif`

<!-- Example embeds (uncomment after you add files)

![Settings](docs/screenshots/settings.png)

![Demo](docs/demo.gif)

-->

## 60–90 second demo video
to be done
<!-- follow this structure when making video
Record a short demo (a phone screen-record is fine). A simple script:
1. Open the web app, sign up or log in.
2. Show the Settings page (selected paths, tracked domains, nudge threshold).
3. Trigger an example event (use the extension briefly), then refresh the web app.
4. Show that the backend attributed events to the logged-in user (e.g., profile/stats/leaderboard updates).

Tip: If the extension isn’t part of the recording, you can still demo event ingestion using a quick POST to `/events` after logging in.

## Quick smoke test (optional)

This is a fast way to prove auth + `/me` + `/events` work end-to-end.

```powershell
$base = "http://localhost:8080"

# Create a new account
$email = "demo-$([Guid]::NewGuid().ToString('N').Substring(0,8))@example.com"
$pass  = "password123"

$signupBody = @{ email = $email; password = $pass } | ConvertTo-Json
Invoke-WebRequest -UseBasicParsing -Uri "$base/auth/signup" -Method Post -ContentType "application/json" -Body $signupBody -SessionVariable sess

# Confirm cookie auth works
Invoke-RestMethod -Uri "$base/me" -Method Get -WebSession $sess

# Post an event
$evt = @{ domain = "example.com"; durationSec = 30; eventType = "time_spent"; ts = (Get-Date).ToString("o") } | ConvertTo-Json
Invoke-RestMethod -Uri "$base/events" -Method Post -ContentType "application/json" -WebSession $sess -Body $evt
```-->

## Notes (dev setup)

- The web app calls the backend via `/api/*`.
- In local dev, Next.js rewrites `/api/:path*` to `http://localhost:8080/:path*` (see [web/next.config.js](web/next.config.js)).
- There is also a [web/next.config.ts](web/next.config.ts) file in this repo, but the rewrite currently lives in the JS config.
