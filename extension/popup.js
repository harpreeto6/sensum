document.addEventListener("DOMContentLoaded", async () => {
  const thresholdInput = document.getElementById("thresholdMin");
  const statusEl = document.getElementById("status");
  const saveBtn = document.getElementById("save");

  if (!thresholdInput || !statusEl || !saveBtn) {
    console.error("Popup elements missing:", {
      thresholdInput,
      statusEl,
      saveBtn,
      html: document.documentElement?.outerHTML,
    });
    return;
  }

  const DEFAULT_THRESHOLD_SEC = 8 * 60;

  function setStatus(text) {
    statusEl.textContent = text;
  }

  async function loadSettings() {
    const data = await chrome.storage.sync.get(["thresholdSec"]);
    const thresholdSec = Number(data.thresholdSec ?? DEFAULT_THRESHOLD_SEC);
    thresholdInput.value = String(Math.round(thresholdSec / 60));
  }

  async function saveSettings() {
    const mins = Number(thresholdInput.value);
    if (!Number.isFinite(mins) || mins < 1) {
      setStatus("Enter a valid number (>= 1).");
      return;
    }
    const thresholdSec = mins * 60;
    await chrome.storage.sync.set({ thresholdSec });
    setStatus(`Saved: ${mins} min`);
  }

  saveBtn.addEventListener("click", saveSettings);
  await loadSettings();
});