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
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab?.url || !/^https?:/.test(tab.url)) return;
    const { darkSites = [], overrides = {} } = await chrome.storage.local.get(["darkSites", "overrides"]);
    const shouldHave = darkSites.includes(new URL(tab.url).origin);
    const css = await loadCSS();
    const siteOverrides = overrides[new URL(tab.url).origin] || [];

    await chrome.scripting.executeScript({
      target: { tabId },
      func: (apply, cssText, overrides) => {
        const el = document.getElementById("dark-inverter-style");
        if (apply) {
          if (!el) {
            const s = document.createElement("style");
            s.id = "dark-inverter-style";
            s.textContent = cssText;
            document.head.appendChild(s);
          }
          document.querySelectorAll('img, canvas, svg').forEach(e => {
            e.style.setProperty('filter', 'invert(100%) hue-rotate(180deg)', 'important');
          });
          document.querySelectorAll('video').forEach(e => {
            e.style.removeProperty('filter');
            e.style.removeProperty('background');
          });
          if (overrides) {
			for (const o of overrides) {
			  if (!o.enabled) continue;
			  try {
				document.querySelectorAll(o.selector).forEach(e => {
				  e.style.setProperty('filter', 'none', 'important');
				});
			  } catch (e) {}
			}
		  }
        } else {
          if (el) el.remove();
          document.querySelectorAll('img, canvas, svg, video').forEach(e => {
            e.style.removeProperty('filter');
            e.style.removeProperty('background');
          });
          if (overrides) {
			for (const o of overrides) {
			  if (!o.enabled) continue;
			  try {
				document.querySelectorAll(o.selector).forEach(e => {
				  e.style.removeProperty('filter');
				});
			  } catch (e) {}
			}
		  }   
        }
      },
      args: [shouldHave, css, siteOverrides]
    });
  } catch (e) {
    // Tab closed or chrome:// page — safe to ignore
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
  if (area !== "local") return;
  if (!changes.darkSites && !changes.overrides) return;
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

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "picked") {
    const origin = msg.origin || "unknown";
    chrome.storage.local.get("overrides", async ({ overrides = {} }) => {
      if (Array.isArray(overrides)) overrides = {};
      if (!overrides[origin]) overrides[origin] = [];
      // Skip if same selector already exists
      const exists = overrides[origin].some(o => o.selector === msg.selector);
      if (!exists) {
        overrides[origin].push({ selector: msg.selector, tag: msg.tag, enabled: true });
        await chrome.storage.local.set({ overrides });
      }
      sendResponse({ ok: true, duplicate: exists });
    });
    return true;
  }
});