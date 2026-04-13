(function () {
  const data = window.MPTI_DATA;
  const table = document.getElementById("leaderboardTable");
  if (!data || !table) return;

  const SUMMARY_ENDPOINT = "/.netlify/functions/mpti-analytics-summary";
  const types = Object.values(data.typeLibrary);
  const typeMap = Object.fromEntries(types.map((type) => [type.code, type]));
  const numberFormatter = new Intl.NumberFormat("zh-CN");
  const leaderboardIntro = document.getElementById("leaderboardIntro");
  const imageErrorHandler =
    "if(!this.dataset.fallbackTried&&this.dataset.fallbackSrc){this.dataset.fallbackTried='1';this.src=this.dataset.fallbackSrc;return;}this.style.display='none';this.nextElementSibling.style.display='flex';";

  if (leaderboardIntro) {
    leaderboardIntro.textContent = `看看学生们最常测出哪种导师。当前榜单覆盖 ${types.length} 种人格结果，数据只统计测试结果分布，不记录个人信息。`;
  }

  function formatNumber(value) {
    return numberFormatter.format(value || 0);
  }

  function formatUpdatedAt(value) {
    if (!value) return "最近更新：暂无数据";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "最近更新：暂无数据";
    const text = new Intl.DateTimeFormat("zh-CN", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(date);
    return `最近更新：${text}`;
  }

  function renderThumb(type) {
    return `
      <div class="persona-thumb">
        <img
          src="${type.image}"
          data-fallback-src="${type.imageFallback || ""}"
          alt="${type.code}"
          loading="lazy"
          onerror="${imageErrorHandler}"
        />
        <div class="thumb-fallback" style="display:none;">
          <strong>${type.code}</strong>
        </div>
      </div>
    `;
  }

  function renderError(message) {
    document.getElementById("updatedAt").textContent = "最近更新：读取失败";
    document.getElementById("podiumStatus").textContent = "加载失败";
    document.getElementById("tableStatus").textContent = "加载失败";
    document.getElementById("podium").innerHTML = `<div class="error-state">${message}</div>`;
    document.getElementById("leaderboardTable").innerHTML = `<div class="error-state">${message}</div>`;
    document.getElementById("leaderName").textContent = "--";
    document.getElementById("leaderNote").textContent = "请确认 Netlify Functions 已安装依赖并部署成功。";
  }

  function renderPodium(ranking, totalResults) {
    const podium = document.getElementById("podium");
    if (!totalResults) {
      podium.innerHTML = `<div class="empty-state">还没有已完成的测试记录。等第一批学生测完后，这里会自动长出前三名导师人格。</div>`;
      return;
    }

    podium.innerHTML = ranking
      .slice(0, 3)
      .map((item, index) => {
        const meta = typeMap[item.code] || { code: item.code, cn: item.code, intro: "", image: "" };
        return `
          <article class="podium-card rank-${index + 1}">
            <div class="podium-rank">#${index + 1}</div>
            <div class="podium-image">
              <img
                src="${meta.image}"
                data-fallback-src="${meta.imageFallback || ""}"
                alt="${meta.code}"
                loading="lazy"
                onerror="${imageErrorHandler}"
              />
              <div class="podium-fallback" style="display:none;">
                <strong>${meta.code}</strong>
                <span>${meta.cn}</span>
              </div>
            </div>
            <div class="podium-code">${meta.code}</div>
            <div class="podium-cn">${meta.cn}</div>
            <div class="podium-stats">
              <div class="mini-chip">次数 ${formatNumber(item.count)}</div>
              <div class="mini-chip">占比 ${item.share}%</div>
            </div>
            <div class="summary-note">${meta.intro}</div>
          </article>
        `;
      })
      .join("");
  }

  function renderTable(ranking, totalResults) {
    table.innerHTML = ranking
      .map((item, index) => {
        const meta = typeMap[item.code] || { code: item.code, cn: item.code, image: "" };
        const barWidth = totalResults ? `${Math.max(item.share, item.count > 0 ? 2 : 0)}%` : "0%";
        return `
          <article class="leaderboard-row" data-rank="${index + 1}">
            <div class="rank-badge">#${index + 1}</div>
            <div class="persona-cell">
              ${renderThumb(meta)}
              <div class="persona-info">
                <div class="persona-code">${meta.code}</div>
                <div class="persona-name">${meta.cn}</div>
              </div>
            </div>
            <div class="stats-cell">
              <div class="count-cell">
                ${formatNumber(item.count)}
                <small>累计次数</small>
              </div>
              <div class="share-cell">
                ${item.share}%
                <small>结果占比</small>
              </div>
            </div>
            <div class="bar-cell">
              <div class="bar-track">
                <div class="bar-fill" style="--bar:${barWidth};"></div>
              </div>
              <div class="bar-label">${item.count > 0 ? `${meta.code} 当前占全部结果的 ${item.share}%` : "暂时还没人测出这个人格"}</div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderStats(dataSummary) {
    const ranking = dataSummary.ranking.map((item) => ({
      ...item,
      ...(typeMap[item.code] || {})
    }));
    const leader = ranking[0];

    document.getElementById("totalVisits").textContent = formatNumber(dataSummary.totalVisits);
    document.getElementById("totalResults").textContent = formatNumber(dataSummary.totalResults);
    document.getElementById("uniquePersonasHit").textContent = formatNumber(dataSummary.uniquePersonasHit);
    document.getElementById("updatedAt").textContent = formatUpdatedAt(dataSummary.lastUpdatedAt);
    document.getElementById("podiumStatus").textContent = dataSummary.totalResults ? "已按最新结果刷新" : "暂无结果数据";
    document.getElementById("tableStatus").textContent = `共展示 ${ranking.length} 种导师人格`;

    if (leader && leader.count > 0) {
      document.getElementById("leaderName").textContent = leader.code;
      document.getElementById("leaderNote").textContent = `${leader.cn} 目前出现 ${formatNumber(leader.count)} 次，占比 ${leader.share}%。`;
    } else {
      document.getElementById("leaderName").textContent = "暂无";
      document.getElementById("leaderNote").textContent = "还没有任何已完成测试记录。";
    }

    renderPodium(ranking, dataSummary.totalResults);
    renderTable(ranking, dataSummary.totalResults);
  }

  async function loadStats() {
    try {
      const response = await fetch(SUMMARY_ENDPOINT, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`统计接口返回 ${response.status}`);
      }
      const payload = await response.json();
      renderStats(payload);
    } catch (error) {
      renderError(`统计暂时加载失败。请确认 Netlify 已成功安装依赖并部署 Functions。错误信息：${error.message}`);
    }
  }

  document.getElementById("refreshBtn").addEventListener("click", loadStats);
  loadStats();
})();
