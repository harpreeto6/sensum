console.log("Sensum background service worker loaded");

const TRACKED_SUFFIXES = ["youtube.com", "tiktok.com", "instagram.com", "reddit.com"];

const EVENT_POST_URL = "http://localhost:3000/api/events";
const FLUSH_INTERVAL_SEC = 60;

let pendingEvents = [];

const DEFAULT_THRESHOLD_SEC = 8 * 60;
const TICK_SEC = 5;
let disabledDomains = [];
let snoozeUntilByDomain = {};

let thresholdSec = DEFAULT_THRESHOLD_SEC;

// “1 timer, 1 domain at a time”
let activeDomain = null;
let activeDomainSec = 0;

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
    const res = await fetch(EVENT_POST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(batch)
    });

    console.log("flush:", res.status, res.url);

    if (!res.ok) {
      // Put back so we can retry later
      pendingEvents = batch.concat(pendingEvents);
      console.warn("Event flush failed:", res.status);
      return;
    }

    const data = await res.json().catch(() => null);
    console.log("Event flush ok:", data ?? "(no json)");
  } catch (err) {
    pendingEvents = batch.concat(pendingEvents);
    console.warn("Event flush error:", err);
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
  const data = await chrome.storage.sync.get(["disabledDomains", "snoozeUntilByDomain"]);
  disabledDomains = Array.isArray(data.disabledDomains) ? data.disabledDomains : [];
  snoozeUntilByDomain = data.snoozeUntilByDomain && typeof data.snoozeUntilByDomain === "object"
    ? data.snoozeUntilByDomain
    : {};
  console.log("Nudge settings loaded", { disabledDomains, snoozeUntilByDomain });
}

loadNudgeSettings();

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

    // Normalize to base tracked suffix (optional); simplest is keep hostname
    if (activeDomain !== hostname) {
        activeDomain = hostname;
        activeDomainSec = 0;
    }

    activeDomainSec += TICK_SEC;
    enqueueEvent("tick", activeDomain, TICK_SEC);
    console.log("Tracking", activeDomain, activeDomainSec, "/", thresholdSec);

    if (activeDomainSec >= thresholdSec) {
        enqueueEvent("nudge", activeDomain, 0);
        console.log("Nudge threshold hit for", activeDomain);

        // Tell content script to show overlay (Step 4 will implement actual UI)
        chrome.tabs.sendMessage(
            tab.id,
            { type: "SHOW_NUDGE", domain: activeDomain },
            () => {
                if (chrome.runtime.lastError) {
                    console.log("No receiving end (content script not injected):", chrome.runtime.lastError.message);
                }
            }
        );

        // For MVP: reset after nudge
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

  if (msg.type === "OPEN_SENSUM") {
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