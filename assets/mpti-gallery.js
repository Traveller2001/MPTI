(function () {
  const data = window.MPTI_DATA;
  const grid = document.getElementById("grid");
  const filters = document.getElementById("filters");
  const legend = document.getElementById("legend");
  if (!data || !grid || !filters || !legend) return;

  const { typeLibrary, rarityMeta } = data;
  const types = Object.values(typeLibrary);
  let currentFilter = "all";

  function renderMedia(type) {
    return `
      <div class="card-img-wrap">
        <img
          src="${type.image}"
          alt="${type.code}"
          loading="lazy"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
        />
        <div class="card-fallback" style="display:none;">
          <strong>${type.code}</strong>
          <span>${type.cn}</span>
        </div>
      </div>
    `;
  }

  function updateFilterButtons() {
    filters.querySelectorAll(".filter-btn").forEach((button) => {
      button.classList.toggle("active", currentFilter === (button.dataset.rarity || "all"));
    });
  }

  function renderGrid() {
    const filtered = (currentFilter === "all" ? types : types.filter((type) => type.rarity === currentFilter))
      .slice()
      .sort((left, right) => {
        const rarityDiff = rarityMeta[left.rarity].order - rarityMeta[right.rarity].order;
        if (rarityDiff !== 0) return rarityDiff;
        return left.code.localeCompare(right.code, "en");
      });

    grid.innerHTML = filtered
      .map((type) => `
        <article class="card">
          <div class="rarity-tag rarity-${type.rarity}">${rarityMeta[type.rarity].label}</div>
          ${renderMedia(type)}
          <div class="card-body">
            <div class="card-code">${type.code}</div>
            <div class="card-cn">${type.cn}</div>
            <div class="card-intro">${type.intro}</div>
          </div>
        </article>
      `)
      .join("");
  }

  const allButton = document.createElement("button");
  allButton.className = "filter-btn active";
  allButton.textContent = "全部";
  allButton.addEventListener("click", () => {
    currentFilter = "all";
    renderGrid();
    updateFilterButtons();
  });
  filters.appendChild(allButton);

  Object.entries(rarityMeta).forEach(([key, meta]) => {
    const button = document.createElement("button");
    button.className = "filter-btn";
    button.dataset.rarity = key;
    button.textContent = meta.label;
    button.addEventListener("click", () => {
      currentFilter = key;
      renderGrid();
      updateFilterButtons();
    });
    filters.appendChild(button);
  });

  Object.entries(rarityMeta).forEach(([key, meta]) => {
    const count = types.filter((type) => type.rarity === key).length;
    legend.innerHTML += `
      <div class="legend-item">
        <div class="legend-dot" style="background:${meta.color}"></div>
        ${meta.label}（${count}）
      </div>
    `;
  });

  renderGrid();
})();
