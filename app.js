const STORAGE_KEY = "novelShelf:v1";
const THEME_KEY = "novelShelf:theme";
const VIEW_NAMES = new Set(["library", "updates", "ranking", "settings"]);
const DEFAULT_SITE = "小説家になろう";
const OTHER_SITE = "その他";
const SITE_OPTIONS = ["小説家になろう", "カクヨム", "ハーメルン", "Arcadia", "暁", "ノベルアップ+", "pixiv小説", "ノクターン"];
const NOVEL_SITE_OPTIONS = [...SITE_OPTIONS, OTHER_SITE];
const SITE_HOME_URLS = {
  "小説家になろう": "https://syosetu.com/",
  カクヨム: "https://kakuyomu.jp/",
  ハーメルン: "https://syosetu.org/",
  Arcadia: "http://www.mai-net.net/",
  暁: "https://www.akatsuki-novels.com/",
  "ノベルアップ+": "https://novelup.plus/",
  pixiv小説: "https://www.pixiv.net/novel",
  ノクターン: "https://noc.syosetu.com/",
};

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

const catalogSeed = rankingSeed.map((item, index) => ({
  id: `catalog-${index + 1}`,
  title: item.title,
  site: item.site,
  url: SITE_HOME_URLS[item.site] || "",
  latestChapter: 12 + index,
  tags: item.tags,
  summary: `${item.genre}ジャンルの注目作品。${item.tags.join("、")}が好きな読者向けです。`,
}));

const state = {
  novels: [],
  activeView: "library",
  catalogSite: DEFAULT_SITE,
  catalogSearch: "",
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
  populateStaticOptions();
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
    catalogSiteTabs: document.querySelector("#catalogSiteTabs"),
    catalogSearch: document.querySelector("#catalogSearch"),
    catalogResults: document.querySelector("#catalogResults"),
    catalogEmpty: document.querySelector("#catalogEmpty"),
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

function populateStaticOptions() {
  // Site choices are shared by multiple controls; keep the source of truth in JS.
  populateCatalogSiteTabs();
  populateSelect(elements.novelSite, NOVEL_SITE_OPTIONS);
  populateSelect(elements.siteFilter, NOVEL_SITE_OPTIONS, { allLabel: "すべて" });
  populateSelect(elements.rankingSite, SITE_OPTIONS, { allLabel: "全サイト" });
}

function populateCatalogSiteTabs() {
  elements.catalogSiteTabs.innerHTML = SITE_OPTIONS.map((site) => `
    <button class="site-tab${site === state.catalogSite ? " is-active" : ""}" type="button" data-catalog-site="${escapeHtml(site)}">
      ${escapeHtml(site)}
    </button>
  `).join("");
}

function populateSelect(select, options, config = {}) {
  const allOption = config.allLabel ? [{ value: "all", label: config.allLabel }] : [];
  const siteOptions = options.map((option) => ({ value: option, label: option }));
  select.innerHTML = [...allOption, ...siteOptions].map(renderOption).join("");
}

function renderOption(option) {
  return `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`;
}

function bindEvents() {
  bindNavigationEvents();
  bindLibraryEvents();
  bindUpdateEvents();
  bindRankingEvents();
  bindSettingsEvents();
}

function bindNavigationEvents() {
  elements.themeToggle.addEventListener("click", toggleTheme);
  elements.tabButtons.forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });
  window.addEventListener("hashchange", () => {
    switchView(getViewFromLocation(), { replaceHash: false });
  });
}

function bindLibraryEvents() {
  elements.openAddForm.addEventListener("click", () => showForm());
  elements.catalogSearch.addEventListener("input", (event) => {
    state.catalogSearch = event.target.value.trim();
    renderCatalogResults();
  });
  elements.catalogSiteTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-catalog-site]");
    if (!button) return;
    state.catalogSite = button.dataset.catalogSite;
    renderCatalogResults();
  });
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
}

function bindUpdateEvents() {
  elements.markAllRead.addEventListener("click", markAllRead);
}

function bindRankingEvents() {
  elements.rankingControls.addEventListener("submit", (event) => {
    event.preventDefault();
  });
  elements.rankingPeriodButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.rankingPeriod = button.dataset.rankingPeriod;
      renderRanking();
    });
  });
  bindRankingControl(elements.rankingSite, "rankingSite", "change");
  bindRankingControl(elements.rankingGenre, "rankingGenre", "change");
  bindRankingControl(elements.rankingSort, "rankingSort", "change");
  bindRankingControl(elements.rankingTag, "rankingTag", "input", { trim: true });
  bindRankingControl(elements.rankingSearch, "rankingSearch", "input", { trim: true });
}

function bindSettingsEvents() {
  elements.exportData.addEventListener("click", exportData);
  elements.importData.addEventListener("change", importData);
  elements.clearData.addEventListener("click", clearData);
}

function bindRankingControl(element, stateKey, eventName, options = {}) {
  element.addEventListener(eventName, (event) => {
    const value = options.trim ? event.target.value.trim() : event.target.value;
    state[stateKey] = value;
    renderRanking();
  });
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
      site: DEFAULT_SITE,
      latestChapter: 18,
      readChapter: 15,
      memo: "週末に続きから読む",
      unread: true,
    }),
  ];
}

function createNovel(values) {
  const latestChapter = toChapterNumber(values.latestChapter ?? values.latest);
  const readChapter = toChapterNumber(values.readChapter ?? values.position);

  return {
    id: createId(),
    title: values.title,
    site: values.site,
    url: values.url || "",
    latestChapter,
    readChapter,
    latest: formatChapter(latestChapter),
    position: formatChapter(readChapter),
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
  // GitHub Pages serves one HTML file; hash/query routing keeps direct links usable.
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
  setSelectValue(elements.novelSite, novel?.site || DEFAULT_SITE);
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
  const formValue = getNovelFormValue();
  const id = elements.novelId.value;
  const duplicate = findDuplicateNovel(formValue, id);

  if (duplicate) {
    setFormError(`「${duplicate.title}」はすでに登録されています。`);
    return;
  }

  upsertNovel(formValue, id);
  saveState();
  hideForm();
  render();
}

function getNovelFormValue() {
  return {
    title: elements.novelTitle.value.trim(),
    site: elements.novelSite.value,
    url: elements.novelUrl.value.trim(),
    latestChapter: toChapterNumber(elements.novelLatest.value),
    readChapter: toChapterNumber(elements.novelPosition.value),
    memo: elements.novelMemo.value.trim(),
  };
}

function upsertNovel(formValue, id) {
  if (!id) {
    state.novels.unshift(createNovel({ ...formValue, unread: hasUnreadChapters(formValue) }));
    return;
  }

  state.novels = state.novels.map((novel) => {
    if (novel.id !== id) return novel;
    return {
      ...novel,
      ...formValue,
      latest: formatChapter(formValue.latestChapter),
      position: formatChapter(formValue.readChapter),
      unread: hasUnreadChapters(formValue),
      updatedAt: new Date().toISOString(),
    };
  });
}

function hasUnreadChapters(novel) {
  return novel.latestChapter > novel.readChapter;
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
  // Older exports used Japanese strings like "第12話"; normalize both shapes.
  const latestChapter = toChapterNumber(novel.latestChapter ?? novel.latest);
  const readChapter = toChapterNumber(novel.readChapter ?? novel.position);

  return {
    id: novel.id || createId(),
    title: String(novel.title || "").trim(),
    site: novel.site || OTHER_SITE,
    url: String(novel.url || "").trim(),
    latestChapter,
    readChapter,
    latest: formatChapter(latestChapter),
    position: formatChapter(readChapter),
    memo: String(novel.memo || "").trim(),
    unread: Boolean(novel.unread) || hasUnreadChapters({ latestChapter, readChapter }),
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

function setSelectValue(select, value) {
  if (![...select.options].some((option) => option.value === value)) {
    select.append(new Option(value, value));
  }
  select.value = value;
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
  renderCatalogResults();
  renderLibrary();
  renderUpdates();
  renderRanking();
}

function renderCatalogResults() {
  const results = getCatalogResults();
  elements.catalogEmpty.classList.toggle("is-hidden", results.length > 0);
  elements.catalogResults.innerHTML = results.map(renderCatalogCard).join("");
  elements.catalogSiteTabs.querySelectorAll("[data-catalog-site]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.catalogSite === state.catalogSite);
  });
  bindCatalogActions();
}

function getCatalogResults() {
  const keyword = normalizeText(state.catalogSearch);
  return catalogSeed
    .filter((item) => {
      const matchesSite = item.site === state.catalogSite;
      const searchableText = normalizeText(`${item.title} ${item.site} ${item.tags.join(" ")} ${item.summary}`);
      return matchesSite && (!keyword || searchableText.includes(keyword));
    })
    .slice(0, 8);
}

function renderCatalogCard(item) {
  const alreadyAdded = Boolean(findDuplicateNovel(item));
  const tags = item.tags.map((tag) => `<span class="tag-chip">#${escapeHtml(tag)}</span>`).join("");

  return `
    <article class="catalog-card">
      <div>
        <p class="ranking-source">${escapeHtml(item.site)}</p>
        <h3 class="novel-title">${escapeHtml(item.title)}</h3>
        <p class="muted">${escapeHtml(item.summary)}</p>
        <div class="meta-row">
          <span class="badge">更新 ${item.latestChapter}話</span>
          ${tags}
        </div>
      </div>
      <button class="primary-button catalog-add-button" type="button" data-catalog-id="${item.id}" ${alreadyAdded ? "disabled" : ""}>
        ${alreadyAdded ? "登録済み" : "本棚に追加"}
      </button>
    </article>
  `;
}

function bindCatalogActions() {
  elements.catalogResults.querySelectorAll("[data-catalog-id]").forEach((button) => {
    button.addEventListener("click", () => addCatalogNovel(button.dataset.catalogId));
  });
}

function addCatalogNovel(catalogId) {
  const item = catalogSeed.find((catalogItem) => catalogItem.id === catalogId);
  if (!item || findDuplicateNovel(item)) return;

  const novel = createNovel({
    title: item.title,
    site: item.site,
    url: item.url,
    latestChapter: item.latestChapter,
    readChapter: 0,
    memo: item.summary,
    unread: true,
  });
  state.novels.unshift(novel);
  saveState();
  render();
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
  if (!card) return;
  const novel = state.novels.find((item) => item.id === card.dataset.id);
  if (!novel) return;

  switch (button.dataset.action) {
    case "edit":
      showForm(novel);
      break;
    case "read":
      markNovelRead(novel);
      break;
    case "update":
      markNovelUpdated(novel);
      break;
    case "delete":
      deleteNovel(novel);
      break;
  }
}

function deleteNovel(novel) {
  if (!confirm(`「${novel.title}」を削除しますか？`)) return;
  state.novels = state.novels.filter((item) => item.id !== novel.id);
  saveState();
  render();
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
  const readChapter = getReadableLatestChapter(novel);
  updateNovel(novel.id, {
    readChapter,
    position: formatChapter(readChapter),
    unread: false,
  });
}

function getReadableLatestChapter(novel) {
  return Math.max(novel.readChapter || 0, novel.latestChapter || 0);
}

function updateNovel(id, patch) {
  state.novels = state.novels.map((novel) => (novel.id === id ? { ...novel, ...patch } : novel));
  saveState();
  render();
}

function markAllRead() {
  state.novels = state.novels.map((novel) => {
    const readChapter = getReadableLatestChapter(novel);
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
