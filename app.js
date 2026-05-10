const STORAGE_KEY = "novelShelf:v1";
const THEME_KEY = "novelShelf:theme";

const rankingSeed = [
  { title: "薬草師は静かに暮らしたい", site: "小説家になろう", genre: "異世界", score: 9820 },
  { title: "夜勤明けの魔法使い", site: "カクヨム", genre: "現代", score: 8640 },
  { title: "星間郵便局の配達記録", site: "カクヨム", genre: "SF", score: 8120 },
  { title: "もしも英雄科に編入したら", site: "ハーメルン", genre: "二次創作", score: 7900 },
  { title: "辺境都市の図書館長", site: "小説家になろう", genre: "異世界", score: 7460 },
  { title: "放課後タイムリープ相談室", site: "カクヨム", genre: "現代", score: 6980 },
];

const state = {
  novels: [],
  activeView: "library",
  librarySearch: "",
  siteFilter: "all",
  rankingSite: "all",
  rankingGenre: "all",
  rankingSearch: "",
};

const elements = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  loadState();
  applyTheme(loadTheme());
  bindEvents();
  render();
});

function cacheElements() {
  Object.assign(elements, {
    themeToggle: document.querySelector("#themeToggle"),
    themeIcon: document.querySelector("#themeIcon"),
    tabButtons: document.querySelectorAll(".tab-button"),
    panels: document.querySelectorAll("[data-view-panel]"),
    openAddForm: document.querySelector("#openAddForm"),
    novelForm: document.querySelector("#novelForm"),
    cancelEdit: document.querySelector("#cancelEdit"),
    novelId: document.querySelector("#novelId"),
    novelTitle: document.querySelector("#novelTitle"),
    novelSite: document.querySelector("#novelSite"),
    novelUrl: document.querySelector("#novelUrl"),
    novelLatest: document.querySelector("#novelLatest"),
    novelPosition: document.querySelector("#novelPosition"),
    novelMemo: document.querySelector("#novelMemo"),
    librarySearch: document.querySelector("#librarySearch"),
    siteFilter: document.querySelector("#siteFilter"),
    novelList: document.querySelector("#novelList"),
    libraryEmpty: document.querySelector("#libraryEmpty"),
    updatesList: document.querySelector("#updatesList"),
    updatesEmpty: document.querySelector("#updatesEmpty"),
    markAllRead: document.querySelector("#markAllRead"),
    rankingSite: document.querySelector("#rankingSite"),
    rankingGenre: document.querySelector("#rankingGenre"),
    rankingSearch: document.querySelector("#rankingSearch"),
    rankingList: document.querySelector("#rankingList"),
    exportData: document.querySelector("#exportData"),
    importData: document.querySelector("#importData"),
    clearData: document.querySelector("#clearData"),
    exportBox: document.querySelector("#exportBox"),
  });
}

function bindEvents() {
  elements.themeToggle.addEventListener("click", toggleTheme);
  elements.tabButtons.forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });

  elements.openAddForm.addEventListener("click", () => showForm());
  elements.cancelEdit.addEventListener("click", hideForm);
  elements.novelForm.addEventListener("submit", saveNovelFromForm);
  elements.librarySearch.addEventListener("input", (event) => {
    state.librarySearch = event.target.value.trim();
    renderLibrary();
  });
  elements.siteFilter.addEventListener("change", (event) => {
    state.siteFilter = event.target.value;
    renderLibrary();
  });
  elements.markAllRead.addEventListener("click", markAllRead);
  elements.rankingSite.addEventListener("change", (event) => {
    state.rankingSite = event.target.value;
    renderRanking();
  });
  elements.rankingGenre.addEventListener("change", (event) => {
    state.rankingGenre = event.target.value;
    renderRanking();
  });
  elements.rankingSearch.addEventListener("input", (event) => {
    state.rankingSearch = event.target.value.trim();
    renderRanking();
  });
  elements.exportData.addEventListener("click", exportData);
  elements.importData.addEventListener("change", importData);
  elements.clearData.addEventListener("click", clearData);
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    state.novels = saved ? JSON.parse(saved) : getInitialNovels();
  } catch {
    state.novels = getInitialNovels();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.novels));
}

function getInitialNovels() {
  return [
    createNovel({
      title: "サンプル：辺境の読書家",
      site: "小説家になろう",
      latest: "第18話",
      position: "第15話",
      memo: "週末に続きから読む",
      unread: true,
    }),
  ];
}

function createNovel(values) {
  return {
    id: createId(),
    title: values.title,
    site: values.site,
    url: values.url || "",
    latest: values.latest || "",
    position: values.position || "",
    memo: values.memo || "",
    unread: Boolean(values.unread),
    updatedAt: new Date().toISOString(),
  };
}

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `novel-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadTheme() {
  return localStorage.getItem(THEME_KEY) || "light";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  elements.themeIcon.textContent = theme === "dark" ? "☀" : "☾";
  localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
}

function switchView(viewName) {
  state.activeView = viewName;
  elements.tabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === viewName);
  });
  elements.panels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.viewPanel === viewName);
  });
}

function showForm(novel = null) {
  elements.novelForm.classList.remove("is-hidden");
  elements.novelId.value = novel?.id || "";
  elements.novelTitle.value = novel?.title || "";
  elements.novelSite.value = novel?.site || "小説家になろう";
  elements.novelUrl.value = novel?.url || "";
  elements.novelLatest.value = novel?.latest || "";
  elements.novelPosition.value = novel?.position || "";
  elements.novelMemo.value = novel?.memo || "";
  elements.novelTitle.focus();
}

function hideForm() {
  elements.novelForm.reset();
  elements.novelId.value = "";
  elements.novelForm.classList.add("is-hidden");
}

function saveNovelFromForm(event) {
  event.preventDefault();
  const formValue = {
    title: elements.novelTitle.value.trim(),
    site: elements.novelSite.value,
    url: elements.novelUrl.value.trim(),
    latest: elements.novelLatest.value.trim(),
    position: elements.novelPosition.value.trim(),
    memo: elements.novelMemo.value.trim(),
  };

  const id = elements.novelId.value;
  if (id) {
    state.novels = state.novels.map((novel) => {
      if (novel.id !== id) return novel;
      const latestChanged = novel.latest !== formValue.latest;
      return { ...novel, ...formValue, unread: novel.unread || latestChanged, updatedAt: new Date().toISOString() };
    });
  } else {
    state.novels.unshift(createNovel({ ...formValue, unread: true }));
  }

  saveState();
  hideForm();
  render();
}

function getFilteredNovels() {
  const keyword = state.librarySearch.toLowerCase();
  return state.novels.filter((novel) => {
    const matchesSite = state.siteFilter === "all" || novel.site === state.siteFilter;
    const text = `${novel.title} ${novel.site} ${novel.memo}`.toLowerCase();
    return matchesSite && text.includes(keyword);
  });
}

function render() {
  renderLibrary();
  renderUpdates();
  renderRanking();
}

function renderLibrary() {
  const novels = getFilteredNovels();
  elements.libraryEmpty.classList.toggle("is-hidden", novels.length > 0);
  elements.novelList.innerHTML = novels.map(renderNovelCard).join("");
  bindCardActions(elements.novelList);
}

function renderUpdates() {
  const updates = state.novels.filter((novel) => novel.unread);
  elements.updatesEmpty.classList.toggle("is-hidden", updates.length > 0);
  elements.updatesList.innerHTML = updates.map(renderNovelCard).join("");
  bindCardActions(elements.updatesList);
}

function renderNovelCard(novel) {
  const urlButton = novel.url
    ? `<a class="text-button" href="${escapeHtml(novel.url)}" target="_blank" rel="noopener">開く</a>`
    : "";

  return `
    <article class="novel-card" data-id="${novel.id}">
      <div class="card-top">
        <div>
          <h3 class="novel-title">${escapeHtml(novel.title)}</h3>
          <div class="meta-row">
            <span class="badge">${escapeHtml(novel.site)}</span>
            ${novel.unread ? '<span class="badge unread">更新あり</span>' : ""}
            ${novel.latest ? `<span class="badge">最新 ${escapeHtml(novel.latest)}</span>` : ""}
          </div>
        </div>
      </div>
      ${novel.position ? `<p class="muted">読了位置：${escapeHtml(novel.position)}</p>` : ""}
      ${novel.memo ? `<p>${escapeHtml(novel.memo)}</p>` : ""}
      <div class="card-actions">
        ${urlButton}
        <button class="text-button" type="button" data-action="read">既読</button>
        <button class="text-button" type="button" data-action="update">更新あり</button>
        <button class="text-button" type="button" data-action="edit">編集</button>
        <button class="text-button" type="button" data-action="delete">削除</button>
      </div>
    </article>
  `;
}

function bindCardActions(container) {
  container.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleCardAction(button));
  });
}

function handleCardAction(button) {
  const card = button.closest(".novel-card");
  const novel = state.novels.find((item) => item.id === card.dataset.id);
  if (!novel) return;

  const action = button.dataset.action;
  if (action === "edit") showForm(novel);
  if (action === "read") updateNovel(novel.id, { unread: false });
  if (action === "update") updateNovel(novel.id, { unread: true, updatedAt: new Date().toISOString() });
  if (action === "delete" && confirm(`「${novel.title}」を削除しますか？`)) {
    state.novels = state.novels.filter((item) => item.id !== novel.id);
    saveState();
    render();
  }
}

function updateNovel(id, patch) {
  state.novels = state.novels.map((novel) => (novel.id === id ? { ...novel, ...patch } : novel));
  saveState();
  render();
}

function markAllRead() {
  state.novels = state.novels.map((novel) => ({ ...novel, unread: false }));
  saveState();
  render();
}

function renderRanking() {
  const keyword = state.rankingSearch.toLowerCase();
  const items = rankingSeed.filter((item) => {
    const matchesSite = state.rankingSite === "all" || item.site === state.rankingSite;
    const matchesGenre = state.rankingGenre === "all" || item.genre === state.rankingGenre;
    const matchesKeyword = item.title.toLowerCase().includes(keyword);
    return matchesSite && matchesGenre && matchesKeyword;
  });

  elements.rankingList.innerHTML = items.map((item, index) => `
    <article class="ranking-item">
      <div class="card-top">
        <h3 class="novel-title">${index + 1}. ${escapeHtml(item.title)}</h3>
        <span class="badge">${item.score.toLocaleString()} pt</span>
      </div>
      <div class="meta-row">
        <span class="badge">${escapeHtml(item.site)}</span>
        <span class="badge">${escapeHtml(item.genre)}</span>
      </div>
    </article>
  `).join("");
}

function exportData() {
  elements.exportBox.value = JSON.stringify({ novels: state.novels }, null, 2);
  elements.exportBox.select();
}

function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!Array.isArray(parsed.novels)) throw new Error("Invalid data");
      state.novels = parsed.novels;
      saveState();
      render();
    } catch {
      alert("JSONを読み込めませんでした。");
    }
  });
  reader.readAsText(file);
  event.target.value = "";
}

function clearData() {
  if (!confirm("保存済みデータを全て削除しますか？")) return;
  state.novels = [];
  saveState();
  render();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
