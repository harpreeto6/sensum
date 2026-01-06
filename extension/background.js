console.log("Sensum background service worker loaded");

const TRACKED_SUFFIXES = ["youtube.com", "tiktok.com", "instagram.com", "reddit.com"];

const EVENT_POST_URL = "http://localhost:3000/api/events";
const WEB_APP_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];
const AUTH_COOKIE_NAME = "sensum_token";
const FLUSH_INTERVAL_SEC = 60;

// JWT used for Authorization: Bearer <token> when posting events.
// This is needed because the backend cookie is SameSite=Lax and won't be sent by the browser
// on cross-site requests from a chrome-extension:// origin.
let apiToken = null;

let pendingEvents = [];

const DEFAULT_THRESHOLD_SEC = 8 * 60;
// Cooldown disabled for now (nudges can re-trigger whenever threshold is hit).
// Re-enable later if you want fewer interruptions.
const COOLDOWN_SEC = 0;
const TICK_SEC = 5;
let disabledDomains = [];
let snoozeUntilByDomain = {};
let lastNudgeByDomain = {}; // Track when we last nudged each domain

let thresholdSec = DEFAULT_THRESHOLD_SEC;

// "1 timer, 1 domain at a time"
let activeDomain = null;
let activeDomainSec = 0;

// Retry logic
let retryCount = 0;
const MAX_RETRIES = 5;

async function loadApiToken() {
  const data = await chrome.storage.local.get(["apiToken"]);
  apiToken = typeof data.apiToken === "string" && data.apiToken.length > 0 ? data.apiToken : null;
  console.log("API token loaded:", apiToken ? "(present)" : "(none)");
}

async function refreshApiTokenFromCookie() {
  // Recommended approach: read the HttpOnly JWT cookie via the Chrome Cookies API.
  // This bypasses SameSite restrictions that block extension-origin fetch cookies.
  try {
    let token = null;
    let foundOn = null;

    for (const origin of WEB_APP_ORIGINS) {
      const cookie = await chrome.cookies.get({ url: origin, name: AUTH_COOKIE_NAME });
      const candidate = cookie && typeof cookie.value === "string" && cookie.value.length > 0 ? cookie.value : null;
      if (candidate) {
        token = candidate;
        foundOn = origin;
        break;
      }
    }

    if (token && token !== apiToken) {
      apiToken = token;
      await chrome.storage.local.set({ apiToken });
      console.log("API token refreshed from cookie:", foundOn ?? "(unknown)");
      return true;
    }
    if (!token) {
      console.log(
        "API token refresh: cookie not found. Open the web app and log in:",
        WEB_APP_ORIGINS.join(" or ")
      );
    }
    return false;
  } catch (e) {
    console.warn("API token refresh error:", e);
    return false;
  }
}

//helper to push events

function enqueueEvent(eventType, domain, durationSec) {
    pendingEvents.push({
        domain,
        durationSec,
        eventType,
        ts: new Date().toISOString(),
    });
}


async function flushEvents() {
  if (pendingEvents.length === 0) return;

  const batch = pendingEvents;
  // Optimistic: clear buffer now; if fail, put them back
  pendingEvents = [];

  try {
    const headers = { "Content-Type": "application/json" };
    if (apiToken) headers["Authorization"] = `Bearer ${apiToken}`;

    const res = await fetch(EVENT_POST_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(batch),
      credentials: "include"
    });

    console.log("flush:", res.status, res.url);

    if (!res.ok) {
      // If we're unauthorized, try refreshing the token from the cookie once.
      if (res.status === 401 || res.status === 403) {
        const refreshed = await refreshApiTokenFromCookie();
        if (refreshed) {
          const retryHeaders = { "Content-Type": "application/json", "Authorization": `Bearer ${apiToken}` };
          const retryRes = await fetch(EVENT_POST_URL, {
            method: "POST",
            headers: retryHeaders,
            body: JSON.stringify(batch),
            credentials: "include",
          });

          console.log("flush (retry):", retryRes.status, retryRes.url);
          if (retryRes.ok) {
            const data = await retryRes.json().catch(() => null);
            console.log("Event flush ok (retry):", data ?? "(no json)");
            retryCount = 0;
            return;
          }
        }
      }

      // Put back so we can retry later
      pendingEvents = batch.concat(pendingEvents);
      retryCount++;
      console.warn("Event flush failed:", res.status, "retry", retryCount);
      
      // Limit queue size to prevent memory issues
      if (pendingEvents.length > 100) {
        pendingEvents = pendingEvents.slice(-100); // Keep last 100
      }
      return;
    }

    const data = await res.json().catch(() => null);
    console.log("Event flush ok:", data ?? "(no json)");
    retryCount = 0; // Reset on success
  } catch (err) {
    pendingEvents = batch.concat(pendingEvents);
    retryCount++;
    console.warn("Event flush error:", err, "retry", retryCount);
    
    // Limit queue size
    if (pendingEvents.length > 100) {
      pendingEvents = pendingEvents.slice(-100);
    }
  }
}

function isTracked(hostname) {
  return TRACKED_SUFFIXES.some((suf) => hostname === suf || hostname.endsWith("." + suf));
}

function getHostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

async function loadThreshold() {
  const data = await chrome.storage.sync.get(["thresholdSec"]);
  thresholdSec = Number(data.thresholdSec ?? DEFAULT_THRESHOLD_SEC);
  if (!Number.isFinite(thresholdSec) || thresholdSec < 60) {
    thresholdSec = DEFAULT_THRESHOLD_SEC;
  }
  console.log("Threshold loaded (sec):", thresholdSec);
}

async function loadNudgeSettings() {
  const data = await chrome.storage.sync.get(["disabledDomains", "snoozeUntilByDomain", "lastNudgeByDomain"]);
  disabledDomains = Array.isArray(data.disabledDomains) ? data.disabledDomains : [];
  snoozeUntilByDomain = data.snoozeUntilByDomain && typeof data.snoozeUntilByDomain === "object"
    ? data.snoozeUntilByDomain
    : {};
  lastNudgeByDomain = data.lastNudgeByDomain && typeof data.lastNudgeByDomain === "object"
    ? data.lastNudgeByDomain
    : {};
  console.log("Nudge settings loaded", { disabledDomains, snoozeUntilByDomain, lastNudgeByDomain });
}

loadNudgeSettings();
loadApiToken();
refreshApiTokenFromCookie();

async function tick() {
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const tab = tabs[0];
  if (!tab || !tab.id || !tab.url) return;

  const hostname = getHostname(tab.url);
  if (!hostname || !isTracked(hostname)) {
    activeDomain = null;
    activeDomainSec = 0;
    return;
  }

  // Gate 1: disabled domain => do nothing
    if (disabledDomains.includes(hostname)) {
        activeDomain = null;
        activeDomainSec = 0;
        return;
    }

    // Gate 2: snoozed domain => don’t nudge while snoozed
    const snoozeUntil = Number(snoozeUntilByDomain[hostname] || 0);
    if (Date.now() < snoozeUntil) {
    // You can keep counting or reset; minimal = reset so it doesn't auto-fire immediately after snooze ends
        activeDomain = hostname;
        activeDomainSec = 0;
        return;
    }
    // Gate 3: cooldown => don't nudge if we recently showed one
    const lastNudge = Number(lastNudgeByDomain[hostname] || 0);
    const cooldownUntil = lastNudge + (COOLDOWN_SEC * 1000);
    if (Date.now() < cooldownUntil) {
        // Still in cooldown, keep tracking but don't nudge yet
        if (activeDomain !== hostname) {
            activeDomain = hostname;
            activeDomainSec = 0;
        }
        activeDomainSec += TICK_SEC;
        enqueueEvent("time_spent", activeDomain, TICK_SEC);
        return;
    }
    // Normalize to base tracked suffix (optional); simplest is keep hostname
    if (activeDomain !== hostname) {
        activeDomain = hostname;
        activeDomainSec = 0;
    }

    activeDomainSec += TICK_SEC;
    enqueueEvent("time_spent", activeDomain, TICK_SEC);
    console.log("Tracking", activeDomain, activeDomainSec, "/", thresholdSec);

    if (activeDomainSec >= thresholdSec) {
        enqueueEvent("nudge_shown", activeDomain, 0);
        console.log("Nudge threshold hit for", activeDomain);

        // Save the timestamp when we showed this nudge
        lastNudgeByDomain[hostname] = Date.now();
        chrome.storage.sync.set({ lastNudgeByDomain });

        // Tell content script to show overlay
        chrome.tabs.sendMessage(
            tab.id,
            { type: "SHOW_NUDGE", domain: activeDomain },
            () => {
                if (chrome.runtime.lastError) {
                    console.log("No receiving end (content script not injected):", chrome.runtime.lastError.message);
                }
            }
        );

        // Reset after nudge
        activeDomainSec = 0;
    }
}

loadThreshold();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;

  if (changes.thresholdSec) {
    thresholdSec = Number(changes.thresholdSec.newValue ?? DEFAULT_THRESHOLD_SEC);
    console.log("Threshold updated (sec):", thresholdSec);
  }

  if (changes.disabledDomains) {
    disabledDomains = Array.isArray(changes.disabledDomains.newValue) ? changes.disabledDomains.newValue : [];
    console.log("disabledDomains updated:", disabledDomains);
  }

  if (changes.snoozeUntilByDomain) {
    snoozeUntilByDomain =
      changes.snoozeUntilByDomain.newValue && typeof changes.snoozeUntilByDomain.newValue === "object"
        ? changes.snoozeUntilByDomain.newValue
        : {};
    console.log("snoozeUntilByDomain updated:", snoozeUntilByDomain);
  }
});

// Start ticking
setInterval(tick, TICK_SEC * 1000);
setInterval(flushEvents, FLUSH_INTERVAL_SEC * 1000);


chrome.runtime.onMessage.addListener((msg) => {
  if (!msg || !msg.type) return;

  if (msg.type === "SET_API_TOKEN") {
    // Token is minted by the backend via /auth/extension-token and sent from the web app
    // to the extension through the content-script token bridge.
    const token = typeof msg.token === "string" ? msg.token.trim() : "";
    apiToken = token.length > 0 ? token : null;
    chrome.storage.local.set({ apiToken });
    console.log("API token updated:", apiToken ? "(present)" : "(cleared)");
    return;
  }

  if (msg.type === "OPEN_SENSUM") {
    const domain = msg.domain;
    if (domain) {
      enqueueEvent("nudge_clicked", domain, 0);
    }
    const mode = encodeURIComponent(msg.mode || "reset");
    const url = `http://localhost:3000/?mode=${mode}`;
    chrome.tabs.create({ url });
  }

  if (msg.type === "SNOOZE_DOMAIN") {
    const domain = msg.domain;
    const minutes = Number(msg.minutes || 15);
    const until = Date.now() + minutes * 60 * 1000;

    // Minimal persistence: store one snooze timestamp per domain
    chrome.storage.sync.get(["snoozeUntilByDomain"]).then((data) => {
      const map = data.snoozeUntilByDomain || {};
      map[domain] = until;
      chrome.storage.sync.set({ snoozeUntilByDomain: map });
    });
  }

  if (msg.type === "DISABLE_DOMAIN") {
    const domain = msg.domain;

    chrome.storage.sync.get(["disabledDomains"]).then((data) => {
      const arr = Array.isArray(data.disabledDomains) ? data.disabledDomains : [];
      if (!arr.includes(domain)) arr.push(domain);
      chrome.storage.sync.set({ disabledDomains: arr });
    });
  }
});