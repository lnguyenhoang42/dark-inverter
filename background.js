// background.js

async function updateBadge() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url || !/^https?:/.test(tab.url)) return;
  const { darkSites = [] } = await chrome.storage.local.get("darkSites");
  const active = darkSites.includes(new URL(tab.url).origin);
  await chrome.action.setBadgeText({ text: active ? "ON" : "" });
  await chrome.action.setBadgeBackgroundColor({ color: "#4a90d9" });
}

async function loadCSS() {
  const res = await fetch(chrome.runtime.getURL("dark-mode.css"));
  return res.text();
}

async function applyFilter(tabId) {
  const tab = await chrome.tabs.get(tabId);
  if (!tab?.url || !/^https?:/.test(tab.url)) return;
  const { darkSites = [] } = await chrome.storage.local.get("darkSites");
  const shouldHave = darkSites.includes(new URL(tab.url).origin);
  const css = await loadCSS();

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (apply, cssText) => {
        const el = document.getElementById("dark-inverter-style");
        if (apply) {
          if (!el) {
            const s = document.createElement("style");
            s.id = "dark-inverter-style";
            s.textContent = cssText;
            document.head.appendChild(s);
          }
          document.querySelectorAll('img, video, canvas, svg').forEach(e => {
            e.style.setProperty('filter', 'invert(100%) hue-rotate(180deg)', 'important');
            e.style.setProperty('background', '#fff', 'important');
          });
        } else {
          if (el) el.remove();
          document.querySelectorAll('img, video, canvas, svg').forEach(e => {
            e.style.removeProperty('filter');
            e.style.removeProperty('background');
          });
        }
      },
      args: [shouldHave, css]
    });
  } catch (e) {
    console.error("applyFilter failed:", e);
  }
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status === "complete") {
    await applyFilter(tabId);
    updateBadge();
  }
});

chrome.tabs.onActivated.addListener(() => updateBadge());

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== "local" || !changes.darkSites) return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) await applyFilter(tab.id);
  updateBadge();
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-dark") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url || !/^https?:/.test(tab.url)) return;
  const origin = new URL(tab.url).origin;
  const { darkSites = [] } = await chrome.storage.local.get("darkSites");
  const isEnabled = darkSites.includes(origin);
  await chrome.storage.local.set({
    darkSites: isEnabled ? darkSites.filter(s => s !== origin) : [...darkSites, origin]
  });
});