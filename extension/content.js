console.log("Sensum content script loaded on:", location.hostname);

// Note: Auth + event ingestion is handled in the background service worker.
// The content script is only responsible for rendering the in-page nudge UI.

const OVERLAY_ID = "sensum-nudge-overlay";

function removeOverlay() {
  const existing = document.getElementById(OVERLAY_ID);
  if (existing) existing.remove();
}

function createButton(label) {
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.style.border = "1px solid rgba(255,255,255,0.25)";
  btn.style.background = "transparent";
  btn.style.color = "inherit";
  btn.style.padding = "8px 10px";
  btn.style.borderRadius = "10px";
  btn.style.cursor = "pointer";
  btn.style.fontSize = "14px";
  return btn;
}

function showNudge({ domain }) {
  // Don’t stack multiple overlays
  removeOverlay();

  const container = document.createElement("div");
  container.id = OVERLAY_ID;

  // Fixed bottom-right card
  container.style.position = "fixed";
  container.style.right = "16px";
  container.style.bottom = "16px";
  container.style.zIndex = "2147483647";
  container.style.maxWidth = "280px";
  container.style.width = "280px";
  container.style.padding = "12px";
  container.style.borderRadius = "14px";
  container.style.border = "1px solid rgba(255,255,255,0.15)";
  container.style.background = "rgba(20, 20, 20, 0.92)";
  container.style.color = "#fff";
  container.style.backdropFilter = "blur(10px)";
  container.style.boxShadow = "0 10px 30px rgba(0,0,0,0.35)";
  container.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

  const title = document.createElement("div");
  title.textContent = "Want a 2–5 min quest?";
  title.style.fontWeight = "700";
  title.style.fontSize = "14px";

  const subtitle = document.createElement("div");
  subtitle.textContent = domain ? `You’ve been on ${domain}` : "You’ve been scrolling a while";
  subtitle.style.marginTop = "4px";
  subtitle.style.opacity = "0.8";
  subtitle.style.fontSize = "12px";

  const row1 = document.createElement("div");
  row1.style.display = "flex";
  row1.style.gap = "8px";
  row1.style.marginTop = "10px";

  const resetBtn = createButton("Reset");
  const growBtn = createButton("Grow");
  const connectBtn = createButton("Connect");

  // Make the 3 buttons fit nicely
  resetBtn.style.flex = "1";
  growBtn.style.flex = "1";
  connectBtn.style.flex = "1";

  row1.appendChild(resetBtn);
  row1.appendChild(growBtn);
  row1.appendChild(connectBtn);

  const row2 = document.createElement("div");
  row2.style.display = "flex";
  row2.style.gap = "8px";
  row2.style.marginTop = "10px";

  // Snooze dropdown
  const snoozeContainer = document.createElement("div");
  snoozeContainer.style.flex = "1";
  snoozeContainer.style.position = "relative";
  
  const snoozeBtn = createButton("Snooze ▼");
  snoozeBtn.style.width = "100%";
  snoozeBtn.style.fontSize = "12px";
  
  const snoozeMenu = document.createElement("div");
  snoozeMenu.style.display = "none";
  snoozeMenu.style.position = "absolute";
  snoozeMenu.style.bottom = "100%";
  snoozeMenu.style.left = "0";
  snoozeMenu.style.right = "0";
  snoozeMenu.style.background = "rgba(30, 30, 30, 0.95)";
  snoozeMenu.style.border = "1px solid rgba(255,255,255,0.25)";
  snoozeMenu.style.borderRadius = "10px";
  snoozeMenu.style.marginBottom = "4px";
  snoozeMenu.style.overflow = "hidden";
  
  const snoozeOptions = [
    { label: "15 minutes", minutes: 15 },
    { label: "30 minutes", minutes: 30 },
    { label: "60 minutes", minutes: 60 }
  ];
  
  snoozeOptions.forEach(opt => {
    const optBtn = document.createElement("button");
    optBtn.textContent = opt.label;
    optBtn.style.display = "block";
    optBtn.style.width = "100%";
    optBtn.style.padding = "8px";
    optBtn.style.border = "none";
    optBtn.style.background = "transparent";
    optBtn.style.color = "inherit";
    optBtn.style.cursor = "pointer";
    optBtn.style.fontSize = "12px";
    optBtn.style.textAlign = "left";
    optBtn.addEventListener("mouseover", () => {
      optBtn.style.background = "rgba(255,255,255,0.1)";
    });
    optBtn.addEventListener("mouseout", () => {
      optBtn.style.background = "transparent";
    });
    optBtn.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "SNOOZE_DOMAIN", domain, minutes: opt.minutes });
      removeOverlay();
    });
    snoozeMenu.appendChild(optBtn);
  });
  
  snoozeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    snoozeMenu.style.display = snoozeMenu.style.display === "none" ? "block" : "none";
  });
  
  snoozeContainer.appendChild(snoozeBtn);
  snoozeContainer.appendChild(snoozeMenu);

  const disableBtn = createButton("Disable on this site");
  disableBtn.style.flex = "1";
  disableBtn.style.fontSize = "12px";

  row2.appendChild(snoozeContainer);
  row2.appendChild(disableBtn);

    function safeSend(msg) {
        try {
            chrome.runtime.sendMessage(msg);
            return true;
        } catch (e) {
            console.log("sendMessage failed (context invalidated):", e);
            return false;
        }
    }

  // Wire up button actions -> send message to background
    resetBtn.addEventListener("click", () => {
        const ok = safeSend({ type: "OPEN_SENSUM", mode: "reset", domain });
        if (!ok) window.open("http://localhost:3000/?mode=reset", "_blank");
        removeOverlay();
    });

  growBtn.addEventListener("click", () => {
    const ok = safeSend({ type: "OPEN_SENSUM", mode: "grow", domain });
    if (!ok) window.open("http://localhost:3000/?mode=grow", "_blank");
    removeOverlay();
  });

  connectBtn.addEventListener("click", () => {
    const ok = safeSend({ type: "OPEN_SENSUM", mode: "connect", domain });
    if (!ok) window.open("http://localhost:3000/?mode=connect", "_blank");
    removeOverlay();
  });

  disableBtn.addEventListener("click", () => {
    if (confirm(`Stop tracking time on ${domain}? You can re-enable it in the extension settings.`)) {
      chrome.runtime.sendMessage({ type: "DISABLE_DOMAIN", domain });
      removeOverlay();
    }
  });
  
  // Close snooze menu when clicking outside
  document.addEventListener("click", () => {
    if (snoozeMenu) snoozeMenu.style.display = "none";
  }, { once: true });

  container.appendChild(title);
  container.appendChild(subtitle);
  container.appendChild(row1);
  container.appendChild(row2);

  document.documentElement.appendChild(container);
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === "SHOW_NUDGE") {
    console.log("Sensum: SHOW_NUDGE received", msg);
    showNudge({ domain: msg.domain });
  }
  return false;
});