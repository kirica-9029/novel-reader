const STORAGE_KEY = "novelShelf:v1";
const THEME_KEY = "novelShelf:theme";
const VIEW_NAMES = new Set(["library", "updates", "ranking", "settings"]);

const periodLabels = {
  daily: "日間",
  weekly: "週間",
  monthly: "月間",
};

const rankingSeed = [
  { title: "薬草師は静かに暮らしたい", site: "小説家になろう", genre: "異世界", tags: ["スローライフ", "薬師"], scores: { daily: 9820, weekly: 42100, monthly: 162400 } },
  { title: "辺境都市の図書館長", site: "小説家になろう", genre: "異世界", tags: ["内政", "読書"], scores: { daily: 7460, weekly: 39800, monthly: 155900 } },
  { title: "夜勤明けの魔法使い", site: "カクヨム", genre: "現代", tags: ["現代ファンタジー", "社会人"], scores: { daily: 8640, weekly: 45200, monthly: 149500 } },
  { title: "星間郵便局の配達記録", site: "カクヨム", genre: "SF", tags: ["宇宙", "仕事"], scores: { daily: 8120, weekly: 38600, monthly: 171200 } },
  { title: "もしも英雄科に編入したら", site: "ハーメルン", genre: "二次創作", tags: ["学園", "バトル"], scores: { daily: 7900, weekly: 47100, monthly: 183000 } },
  { title: "放課後の錬金ログ", site: "ハーメルン", genre: "二次創作", tags: ["錬金術", "日常"], scores: { daily: 6350, weekly: 35100, monthly: 128800 } },
  { title: "古き掲示板の竜騎士", site: "Arcadia", genre: "異世界", tags: ["掲示板", "竜"], scores: { daily: 6740, weekly: 30500, monthly: 112200 } },
  { title: "北方砦の傭兵録", site: "Arcadia", genre: "異世界", tags: ["戦記", "成り上がり"], scores: { daily: 5480, weekly: 33600, monthly: 121900 } },
  { title: "暁に響く航宙譚", site: "暁", genre: "SF", tags: ["艦隊", "宇宙"], scores: { daily: 6410, weekly: 35900, monthly: 135700 } },
  { title: "黎明の魔導士候補生", site: "暁", genre: "異世界", tags: ["魔法", "学園"], scores: { daily: 5220, weekly: 28800, monthly: 118300 } },
  { title: "ノベラの街角食堂", site: "ノベルアップ+", genre: "現代", tags: ["料理", "群像劇"], scores: { daily: 6180, weekly: 31400, monthly: 109600 } },
  { title: "竜と配信者の週末", site: "ノベルアップ+", genre: "現代", tags: ["配信", "コメディ"], scores: { daily: 5900, weekly: 32900, monthly: 101500 } },
  { title: "放課後イラストノベル", site: "pixiv小説", genre: "現代", tags: ["青春", "創作"], scores: { daily: 5870, weekly: 27600, monthly: 96500 } },
  { title: "春待ちアトリエ", site: "pixiv小説", genre: "現代", tags: ["恋愛", "青春"], scores: { daily: 5030, weekly: 30100, monthly: 104900 } },
  { title: "夜想の迷宮記録", site: "ノクターン", genre: "異世界", tags: ["迷宮", "ダーク"], scores: { daily: 5520, weekly: 34200, monthly: 132100 } },
  { title: "月下の契約者", site: "ノクターン", genre: "異世界", tags: ["恋愛", "ファンタジー"], scores: { daily: 4980, weekly: 29700, monthly: 120400 } },
];

const state = {
  novels: [],
  activeView: "library",
  librarySearch: "",
  siteFilter: "all",
  rankingPeriod: "daily",
  rankingSite: "all",
  rankingGenre: "all",
  rankingSort: "score",
  rankingTag: "",
  rankingSearch: "",
};

const elements = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  loadState();
  applyTheme(loadTheme());
  bindEvents();
  initializeRoute();
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
    formError: document.querySelector("#formError"),
    librarySearch: document.querySelector("#librarySearch"),
    siteFilter: document.querySelector("#siteFilter"),
    novelList: document.querySelector("#novelList"),
    libraryEmpty: document.querySelector("#libraryEmpty"),
    updatesList: document.querySelector("#updatesList"),
    updatesEmpty: document.querySelector("#updatesEmpty"),
    markAllRead: document.querySelector("#markAllRead"),
    rankingControls: document.querySelector("#rankingControls"),
    rankingPeriodButtons: document.querySelectorAll("[data-ranking-period]"),
    rankingSite: document.querySelector("#rankingSite"),
    rankingGenre: document.querySelector("#rankingGenre"),
    rankingSort: document.querySelector("#rankingSort"),
    rankingTag: document.querySelector("#rankingTag"),
    rankingSearch: document.querySelector("#rankingSearch"),
    rankingList: document.querySelector("#rankingList"),
    rankingEmpty: document.querySelector("#rankingEmpty"),
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
  window.addEventListener("hashchange", () => {
    switchView(getViewFromLocation(), { replaceHash: false });
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
  elements.rankingControls.addEventListener("submit", (event) => {
    event.preventDefault();
  });
  elements.rankingPeriodButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.rankingPeriod = button.dataset.rankingPeriod;
      renderRanking();
    });
  });
  elements.rankingSite.addEventListener("change", (event) => {
    state.rankingSite = event.target.value;
    renderRanking();
  });
  elements.rankingGenre.addEventListener("change", (event) => {
    state.rankingGenre = event.target.value;
    renderRanking();
  });
  elements.rankingSort.addEventListener("change", (event) => {
    state.rankingSort = event.target.value;
    renderRanking();
  });
  elements.rankingTag.addEventListener("input", (event) => {
    state.rankingTag = event.target.value.trim();
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
    state.novels = saved ? normalizeStoredData(JSON.parse(saved)) : getInitialNovels();
  } catch {
    state.novels = getInitialNovels();
  }
}

function saveState() {
  const payload = {
    version: 1,
    novels: state.novels,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function normalizeStoredData(savedData) {
  const novels = Array.isArray(savedData) ? savedData : savedData?.novels;
  if (!Array.isArray(novels)) return getInitialNovels();
  return dedupeNovels(novels.map(sanitizeNovel));
}

function parseImportedNovels(importedData) {
  const novels = Array.isArray(importedData) ? importedData : importedData?.novels;
  if (!Array.isArray(novels)) throw new Error("Invalid data");
  return dedupeNovels(novels.map(sanitizeNovel));
}

function getInitialNovels() {
  return [
    createNovel({
      title: "サンプル：辺境の読書家",
      site: "小説家になろう",
      latestChapter: 18,
      readChapter: 15,
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
    latestChapter: toChapterNumber(values.latestChapter ?? values.latest),
    readChapter: toChapterNumber(values.readChapter ?? values.position),
    latest: formatChapter(toChapterNumber(values.latestChapter ?? values.latest)),
    position: formatChapter(toChapterNumber(values.readChapter ?? values.position)),
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

function initializeRoute() {
  const viewName = getViewFromLocation();
  switchView(viewName, { replaceHash: false });
}

function getViewFromLocation() {
  const hashView = location.hash.replace(/^#\/?/, "");
  const queryView = new URLSearchParams(location.search).get("view");
  if (VIEW_NAMES.has(hashView)) return hashView;
  if (VIEW_NAMES.has(queryView)) return queryView;
  return "library";
}

function switchView(viewName, options = {}) {
  if (!VIEW_NAMES.has(viewName)) return;
  state.activeView = viewName;
  elements.tabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === viewName);
  });
  elements.panels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.viewPanel === viewName);
  });
  if (options.replaceHash !== false && location.hash !== `#/${viewName}`) {
    history.replaceState(null, "", `#/${viewName}`);
  }
}

function showForm(novel = null) {
  elements.novelForm.classList.remove("is-hidden");
  setFormError("");
  elements.novelId.value = novel?.id || "";
  elements.novelTitle.value = novel?.title || "";
  elements.novelSite.value = novel?.site || "小説家になろう";
  elements.novelUrl.value = novel?.url || "";
  elements.novelLatest.value = novel?.latestChapter || "";
  elements.novelPosition.value = novel?.readChapter || "";
  elements.novelMemo.value = novel?.memo || "";
  elements.novelTitle.focus();
}

function hideForm() {
  elements.novelForm.reset();
  elements.novelId.value = "";
  setFormError("");
  elements.novelForm.classList.add("is-hidden");
}

function saveNovelFromForm(event) {
  event.preventDefault();
  const formValue = {
    title: elements.novelTitle.value.trim(),
    site: elements.novelSite.value,
    url: elements.novelUrl.value.trim(),
    latestChapter: toChapterNumber(elements.novelLatest.value),
    readChapter: toChapterNumber(elements.novelPosition.value),
    memo: elements.novelMemo.value.trim(),
  };

  const id = elements.novelId.value;
  const duplicate = findDuplicateNovel(formValue, id);
  if (duplicate) {
    setFormError(`「${duplicate.title}」はすでに登録されています。`);
    return;
  }

  if (id) {
    state.novels = state.novels.map((novel) => {
      if (novel.id !== id) return novel;
      const unread = formValue.latestChapter > formValue.readChapter;
      return {
        ...novel,
        ...formValue,
        latest: formatChapter(formValue.latestChapter),
        position: formatChapter(formValue.readChapter),
        unread,
        updatedAt: new Date().toISOString(),
      };
    });
  } else {
    state.novels.unshift(createNovel({ ...formValue, unread: formValue.latestChapter > formValue.readChapter }));
  }

  saveState();
  hideForm();
  render();
}

function findDuplicateNovel(target, ignoreId = "") {
  const targetKey = getNovelKey(target);
  return state.novels.find((novel) => novel.id !== ignoreId && getNovelKey(novel) === targetKey);
}

function getNovelKey(novel) {
  const normalizedUrl = normalizeUrl(novel.url);
  if (normalizedUrl) return `url:${normalizedUrl}`;
  return `title:${normalizeText(novel.site)}:${normalizeText(novel.title)}`;
}

function normalizeUrl(url) {
  return String(url || "").trim().replace(/\/+$/, "").toLowerCase();
}

function normalizeText(text) {
  return String(text || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function sanitizeNovel(novel) {
  const latestChapter = toChapterNumber(novel.latestChapter ?? novel.latest);
  const readChapter = toChapterNumber(novel.readChapter ?? novel.position);

  return {
    id: novel.id || createId(),
    title: String(novel.title || "").trim(),
    site: novel.site || "その他",
    url: String(novel.url || "").trim(),
    latestChapter,
    readChapter,
    latest: formatChapter(latestChapter),
    position: formatChapter(readChapter),
    memo: String(novel.memo || "").trim(),
    unread: Boolean(novel.unread) || latestChapter > readChapter,
    updatedAt: novel.updatedAt || new Date().toISOString(),
  };
}

function toChapterNumber(value) {
  const match = String(value || "").match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function formatChapter(chapter) {
  return chapter > 0 ? `第${chapter}話` : "";
}

function dedupeNovels(novels) {
  const seen = new Set();
  return novels.filter((novel) => {
    if (!novel.title) return false;
    const key = getNovelKey(novel);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function setFormError(message) {
  elements.formError.textContent = message;
  elements.formError.classList.toggle("is-hidden", !message);
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
  const updates = getUpdatedNovels();
  elements.updatesEmpty.classList.toggle("is-hidden", updates.length > 0);
  elements.updatesList.innerHTML = updates.map(renderUpdateCard).join("");
  bindCardActions(elements.updatesList);
}

function getUpdatedNovels() {
  return state.novels
    .filter((novel) => novel.unread)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

function renderUpdateCard(novel) {
  const unreadCount = getUnreadChapterCount(novel);
  const continueButton = novel.url
    ? `<a class="text-button" href="${escapeHtml(novel.url)}" target="_blank" rel="noopener">続きから読む</a>`
    : "";

  return `
    <article class="update-card" data-id="${novel.id}">
      <div class="update-main">
        <div class="update-title-row">
          <span class="new-label">NEW</span>
          <h3 class="novel-title">${escapeHtml(novel.title)}</h3>
        </div>
        <div class="meta-row">
          <span class="badge">${escapeHtml(novel.site)}</span>
          ${novel.latestChapter ? `<span class="badge">更新 ${novel.latestChapter}話</span>` : ""}
          ${unreadCount ? `<span class="badge unread">未読 ${unreadCount}話</span>` : ""}
        </div>
        <p class="update-time">更新日時：${escapeHtml(formatUpdatedAt(novel.updatedAt))}</p>
      </div>
      <div class="card-actions">
        ${continueButton}
        <button class="text-button" type="button" data-action="read">既読</button>
        <button class="text-button" type="button" data-action="edit">編集</button>
      </div>
    </article>
  `;
}

function renderNovelCard(novel) {
  const urlButton = novel.url
    ? `<a class="text-button" href="${escapeHtml(novel.url)}" target="_blank" rel="noopener">続きから読む</a>`
    : "";
  const unreadCount = getUnreadChapterCount(novel);
  const progressText = getProgressText(novel, unreadCount);

  return `
    <article class="novel-card" data-id="${novel.id}">
      <div class="card-top">
        <div>
          <h3 class="novel-title">${escapeHtml(novel.title)}</h3>
          <div class="meta-row">
            <span class="badge">${escapeHtml(novel.site)}</span>
            ${novel.unread ? '<span class="badge unread">更新あり</span>' : ""}
            ${novel.latestChapter ? `<span class="badge">更新 ${novel.latestChapter}話</span>` : ""}
            ${novel.readChapter ? `<span class="badge">読了 ${novel.readChapter}話</span>` : ""}
          </div>
        </div>
      </div>
      ${progressText ? `<p class="muted">${escapeHtml(progressText)}</p>` : ""}
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

function getUnreadChapterCount(novel) {
  return Math.max(0, Number(novel.latestChapter || 0) - Number(novel.readChapter || 0));
}

function getProgressText(novel, unreadCount) {
  if (!novel.latestChapter && !novel.readChapter) return "";
  if (unreadCount > 0) return `未読 ${unreadCount}話（${novel.readChapter}話 → ${novel.latestChapter}話）`;
  if (novel.readChapter > 0) return `最新話まで読了済み（${novel.readChapter}話）`;
  return `更新話数：${novel.latestChapter}話`;
}

function formatUpdatedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "不明";

  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function bindCardActions(container) {
  container.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleCardAction(button));
  });
}

function handleCardAction(button) {
  const card = button.closest("[data-id]");
  const novel = state.novels.find((item) => item.id === card.dataset.id);
  if (!novel) return;

  const action = button.dataset.action;
  if (action === "edit") showForm(novel);
  if (action === "read") markNovelRead(novel);
  if (action === "update") markNovelUpdated(novel);
  if (action === "delete" && confirm(`「${novel.title}」を削除しますか？`)) {
    state.novels = state.novels.filter((item) => item.id !== novel.id);
    saveState();
    render();
  }
}

function markNovelUpdated(novel) {
  const latestChapter = Math.max(novel.latestChapter || 0, novel.readChapter || 0) + 1;
  updateNovel(novel.id, {
    latestChapter,
    latest: formatChapter(latestChapter),
    unread: true,
    updatedAt: new Date().toISOString(),
  });
}

function markNovelRead(novel) {
  updateNovel(novel.id, {
    readChapter: Math.max(novel.readChapter || 0, novel.latestChapter || 0),
    position: formatChapter(Math.max(novel.readChapter || 0, novel.latestChapter || 0)),
    unread: false,
  });
}

function updateNovel(id, patch) {
  state.novels = state.novels.map((novel) => (novel.id === id ? { ...novel, ...patch } : novel));
  saveState();
  render();
}

function markAllRead() {
  state.novels = state.novels.map((novel) => {
    const readChapter = Math.max(novel.readChapter || 0, novel.latestChapter || 0);
    return {
      ...novel,
      readChapter,
      position: formatChapter(readChapter),
      unread: false,
    };
  });
  saveState();
  render();
}

function renderRanking() {
  const items = getRankingItems();
  elements.rankingPeriodButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.rankingPeriod === state.rankingPeriod);
  });
  elements.rankingEmpty.classList.toggle("is-hidden", items.length > 0);
  elements.rankingList.innerHTML = items.map(renderRankingItem).join("");
}

function getRankingItems() {
  const keyword = normalizeText(state.rankingSearch);
  const tagKeyword = normalizeText(state.rankingTag);

  return rankingSeed
    .filter((item) => {
      const searchableText = normalizeText(`${item.title} ${item.site} ${item.genre} ${item.tags.join(" ")}`);
      const tagText = normalizeText(item.tags.join(" "));
      const matchesSite = state.rankingSite === "all" || item.site === state.rankingSite;
      const matchesGenre = state.rankingGenre === "all" || item.genre === state.rankingGenre;
      const matchesKeyword = !keyword || searchableText.includes(keyword);
      const matchesTag = !tagKeyword || tagText.includes(tagKeyword);
      return matchesSite && matchesGenre && matchesKeyword && matchesTag;
    })
    .sort(sortRankingItems);
}

function sortRankingItems(a, b) {
  if (state.rankingSort === "title") return a.title.localeCompare(b.title, "ja");
  if (state.rankingSort === "site") return a.site.localeCompare(b.site, "ja") || getRankingScore(b) - getRankingScore(a);
  return getRankingScore(b) - getRankingScore(a);
}

function getRankingScore(item) {
  return item.scores[state.rankingPeriod] || 0;
}

function renderRankingItem(item, index) {
  const score = getRankingScore(item);
  const tags = item.tags.map((tag) => `<span class="tag-chip">#${escapeHtml(tag)}</span>`).join("");

  return `
    <article class="ranking-item">
      <div class="ranking-rank" aria-label="${index + 1}位">${index + 1}</div>
      <div class="ranking-body">
        <div class="card-top">
          <div>
            <p class="ranking-source">${escapeHtml(item.site)} ${periodLabels[state.rankingPeriod]}ランキング</p>
            <h3 class="novel-title">${escapeHtml(item.title)}</h3>
          </div>
          <span class="badge">${score.toLocaleString()} pt</span>
        </div>
        <div class="meta-row">
          <span class="badge">${escapeHtml(item.genre)}</span>
          ${tags}
        </div>
      </div>
    </article>
  `;
}

function exportData() {
  elements.exportBox.value = JSON.stringify({ version: 1, novels: state.novels }, null, 2);
  elements.exportBox.select();
}

function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const parsed = JSON.parse(reader.result);
      const imported = parseImportedNovels(parsed);
      state.novels = dedupeNovels([...state.novels, ...imported]);
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
