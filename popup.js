// popup.js

const toggle = document.getElementById("toggle");

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url || !/^https?:/.test(tab.url)) return;
  const origin = new URL(tab.url).origin;
  const { darkSites = [] } = await chrome.storage.local.get("darkSites");
  if (darkSites.includes(origin)) toggle.classList.add("on");
}

toggle.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url || !/^https?:/.test(tab.url)) return;
  const origin = new URL(tab.url).origin;
  const { darkSites = [] } = await chrome.storage.local.get("darkSites");
  const isEnabled = darkSites.includes(origin);
  await chrome.storage.local.set({
    darkSites: isEnabled ? darkSites.filter(s => s !== origin) : [...darkSites, origin]
  });
  toggle.classList.toggle("on");
});

document.getElementById("pick").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url || !/^https?:/.test(tab.url)) return;
  const origin = new URL(tab.url).origin;

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (siteOrigin) => {
      const box = document.createElement("div");
      box.id = "picker-box";
      Object.assign(box.style, {
        position: "fixed", pointerEvents: "none", zIndex: "2147483646",
        border: "2px solid #4a90d9", borderRadius: "2px",
        display: "none", boxShadow: "0 0 0 99999px rgba(0,0,0,0.3)"
      });
      document.documentElement.appendChild(box);

      const label = document.createElement("div");
      label.textContent = "Click to select \u00b7 Esc to cancel";
      Object.assign(label.style, {
        position: "fixed", top: "10px", left: "50%", transform: "translateX(-50%)",
        background: "#000", color: "#fff", padding: "6px 12px",
        borderRadius: "4px", zIndex: "2147483647", fontFamily: "sans-serif", fontSize: "13px",
        pointerEvents: "none"
      });
      document.documentElement.appendChild(label);

      document.body.style.cursor = "crosshair";

      let currentTarget = null;

      function cleanup() {
        box.remove();
        label.remove();
        document.body.style.cursor = "";
        currentTarget = null;
        document.removeEventListener("click", onClick, true);
        document.removeEventListener("mouseover", onHover, true);
        document.removeEventListener("keydown", onKey, true);
        document.removeEventListener("scroll", onScroll, true);
      }

      function getSelector(el) {
        if (el.id) return `#${el.id}`;
        const parts = [];
        while (el && el !== document.body) {
          let part = el.tagName.toLowerCase();
          if (el.id) { parts.unshift(`#${el.id}`); break; }
          if (el.classList.length) part += "." + el.classList[0];
          const parent = el.parentElement;
          if (parent) {
            const siblings = Array.from(parent.children).filter(c => c.tagName === el.tagName);
            if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(el) + 1})`;
          }
          parts.unshift(part);
          el = parent;
        }
        return parts.join(" > ");
      }

      function positionBox(target) {
        const r = target.getBoundingClientRect();
        box.style.display = "block";
        box.style.top = r.top + "px";
        box.style.left = r.left + "px";
        box.style.width = r.width + "px";
        box.style.height = r.height + "px";
      }

      const onHover = (e) => {
        const target = document.elementFromPoint(e.clientX, e.clientY);
        if (!target || target === box || target === label) return;
        currentTarget = target;
        positionBox(target);
      };

      const onScroll = () => {
        if (!currentTarget) return;
        positionBox(currentTarget);
      };

      const onClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const target = document.elementFromPoint(e.clientX, e.clientY);
        if (!target || target === box || target === label) return;
        const selector = getSelector(target);
        cleanup();
        chrome.runtime.sendMessage({ type: "picked", selector, tag: target.tagName.toLowerCase(), origin: siteOrigin });
      };

      const onKey = (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          cleanup();
        }
      };

      document.addEventListener("click", onClick, true);
      document.addEventListener("mouseover", onHover, true);
      document.addEventListener("keydown", onKey, true);
      document.addEventListener("scroll", onScroll, true);
    },
    args: [origin]
  });
});

document.getElementById("manage").addEventListener("click", async () => {
  await chrome.runtime.openOptionsPage();
});

init();