const siteList = document.getElementById("siteList");
const overrideList = document.getElementById("overrideList");
const clearAllBtn = document.getElementById("clearAll");

async function renderSites() {
  const { darkSites = [] } = await chrome.storage.local.get("darkSites");
  siteList.innerHTML = "";
  clearAllBtn.style.display = darkSites.length ? "block" : "none";
  if (!darkSites.length) { siteList.innerHTML = '<p class="empty">No sites saved.</p>'; return; }
  for (const origin of darkSites) {
    const div = document.createElement("div");
    div.className = "site";
    div.innerHTML = `<span>${origin}</span>`;
    const btn = document.createElement("button");
    btn.textContent = "Remove";
    btn.addEventListener("click", async () => {
      await chrome.storage.local.set({ darkSites: darkSites.filter(s => s !== origin) });
      renderSites();
    });
    div.appendChild(btn);
    siteList.appendChild(div);
  }
}

async function renderOverrides() {
  const { overrides = {} } = await chrome.storage.local.get("overrides");
  overrideList.innerHTML = "";

  // Guard against old array format
  if (Array.isArray(overrides)) {
    overrideList.innerHTML = '<p class="empty">Old format detected. Clear storage and re-pick.</p>';
    return;
  }

  const origins = Object.keys(overrides);
  if (!origins.length) {
    overrideList.innerHTML = '<p class="empty">No overrides. Use "Pick element" in the popup.</p>';
    return;
  }

  for (const origin of origins) {
    const h3 = document.createElement("h3");
    h3.style.cssText = "font-size:13px; margin:12px 0 6px; color:#888;";
    h3.textContent = origin;
    overrideList.appendChild(h3);

    const items = overrides[origin];
    for (let i = 0; i < items.length; i++) {
	  const o = items[i];
	  const div = document.createElement("div");
	  div.className = "override";
	  div.innerHTML = `<span>${o.selector}</span>`;

	  const t = document.createElement("div");
	  t.className = "toggle" + (o.enabled ? " on" : "");
	  t.addEventListener("click", async () => {
		o.enabled = !o.enabled;
		t.classList.toggle("on");
		await chrome.storage.local.set({ overrides });
	  });
	  div.appendChild(t);

	  const rm = document.createElement("button");
	  rm.textContent = "Remove";
	  rm.style.cssText = "background:none;border:none;color:#e74c3c;cursor:pointer;font-size:12px;padding:4px 8px;border-radius:4px;white-space:nowrap;";
	  rm.addEventListener("click", async () => {
		items.splice(i, 1);
		if (!items.length) delete overrides[origin];
		await chrome.storage.local.set({ overrides });
		renderOverrides();
	  });
	  div.appendChild(rm);

	  overrideList.appendChild(div);
	}
  }
}

clearAllBtn.addEventListener("click", async () => {
  await chrome.storage.local.set({ darkSites: [] });
  renderSites();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.darkSites) renderSites();
  if (changes.overrides) renderOverrides();
});

renderSites();
renderOverrides();