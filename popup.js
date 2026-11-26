const toggle = document.getElementById("toggle");

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url || tab.url.startsWith("chrome")) return;

  const origin = new URL(tab.url).origin;
  const { darkSites = [] } = await chrome.storage.local.get("darkSites");

  if (darkSites.includes(origin)) {
    toggle.classList.add("on");
  }
}

toggle.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url || tab.url.startsWith("chrome") || tab.url.startsWith("brave")) return;

  const origin = new URL(tab.url).origin;
  const { darkSites = [] } = await chrome.storage.local.get("darkSites");
  const isEnabled = darkSites.includes(origin);

  if (isEnabled) {
    await chrome.storage.local.set({ darkSites: darkSites.filter(s => s !== origin) });
  } else {
    await chrome.storage.local.set({ darkSites: [...darkSites, origin] });
  }

  toggle.classList.toggle("on");

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const el = document.getElementById("dark-inverter-style");
      if (el) { el.remove(); return; }
      const s = document.createElement("style");
      s.id = "dark-inverter-style";
      s.textContent = `
        html { filter: invert(100%) hue-rotate(180deg) !important; }
        img[src$=".png"], img[src$=".jpg"], img[src$=".jpeg"], img[src$=".webp"],
        video, canvas, iframe {
          filter: invert(100%) hue-rotate(180deg) !important;
          background: #fff !important;
        }
      `;
      document.documentElement.prepend(s);
    }
  });
});

document.getElementById("manage").addEventListener("click", async () => {
  await chrome.runtime.openOptionsPage();
});

init();