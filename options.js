const list = document.getElementById("list");
const clearAllBtn = document.getElementById("clearAll");

async function render() {
  const { darkSites = [] } = await chrome.storage.local.get("darkSites");
  list.innerHTML = "";
  clearAllBtn.style.display = darkSites.length ? "block" : "none";

  if (!darkSites.length) {
    list.innerHTML = '<p class="empty">No sites saved yet.</p>';
    return;
  }

  for (const origin of darkSites) {
    const div = document.createElement("div");
    div.className = "site";
    div.innerHTML = `<span>${origin}</span>`;

    const btn = document.createElement("button");
    btn.textContent = "Remove";
    btn.addEventListener("click", async () => {
      const updated = darkSites.filter(s => s !== origin);
      await chrome.storage.local.set({ darkSites: updated });
      render();
    });
    div.appendChild(btn);
    list.appendChild(div);
  }
}

clearAllBtn.addEventListener("click", async () => {
  await chrome.storage.local.set({ darkSites: [] });
  render();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.darkSites) render();
});

render();