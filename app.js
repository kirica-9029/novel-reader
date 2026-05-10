const STORAGE_KEY = "novelShelf:v1";
const THEME_KEY = "novelShelf:theme";
const VIEW_NAMES = new Set(["library", "updates", "ranking", "settings"]);
const DEFAULT_SITE = "小説家になろう";
const OTHER_SITE = "その他";
const SITE_OPTIONS = ["小説家になろう", "カクヨム", "ハーメルン", "Arcadia", "暁", "ノベルアップ+", "pixiv小説", "ノクターン"];
const SEARCH_SITE_OPTIONS = [DEFAULT_SITE];
const NOVEL_SITE_OPTIONS = [...SITE_OPTIONS, OTHER_SITE];
const NAROU_API_URL = "https://api.syosetu.com/novelapi/api/";
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

const state = {
  novels: [],
  activeView: "library",
  catalogSite: DEFAULT_SITE,
  catalogSearch: "",
  catalogResults: [],
  catalogLoading: false,
  catalogError: "",
  catalogHasSearched: false,
  librarySearch: "",
  siteFilter: "all",
  rankingSite: "all",
  rankingSort: "updated",
  rankingSearch: "",
};

const elements = {};
let catalogSearchTimer = 0;

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
    updatesSummary: document.querySelector("#updatesSummary"),
    markAllRead: document.querySelector("#markAllRead"),
    rankingControls: document.querySelector("#rankingControls"),
    rankingSite: document.querySelector("#rankingSite"),
    rankingSort: document.querySelector("#rankingSort"),
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
  elements.catalogSiteTabs.innerHTML = SEARCH_SITE_OPTIONS.map((site) => `
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
    queueCatalogSearch();
  });
  elements.catalogSiteTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-catalog-site]");
    if (!button) return;
    state.catalogSite = button.dataset.catalogSite;
    queueCatalogSearch(0);
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
  bindRankingControl(elements.rankingSite, "rankingSite", "change");
  bindRankingControl(elements.rankingSort, "rankingSort", "change");
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
  return [];
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
    lastOpenedChapter: toChapterNumber(values.lastOpenedChapter),
    lastViewedAt: values.lastViewedAt || "",
    memo: values.memo || "",
    unread: Boolean(values.unread),
    updatedAt: values.updatedAt || new Date().toISOString(),
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
    lastOpenedChapter: toChapterNumber(novel.lastOpenedChapter),
    lastViewedAt: novel.lastViewedAt || "",
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
  elements.catalogEmpty.textContent = getCatalogStatusText();
  elements.catalogEmpty.classList.toggle("is-hidden", shouldHideCatalogStatus());
  elements.catalogResults.innerHTML = state.catalogResults.map(renderCatalogCard).join("");
  elements.catalogSiteTabs.querySelectorAll("[data-catalog-site]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.catalogSite === state.catalogSite);
  });
  bindCatalogActions();
}

function queueCatalogSearch(delay = 350) {
  window.clearTimeout(catalogSearchTimer);
  catalogSearchTimer = window.setTimeout(searchCatalog, delay);
}

async function searchCatalog() {
  if (!state.catalogSearch) {
    state.catalogResults = [];
    state.catalogError = "";
    state.catalogHasSearched = false;
    state.catalogLoading = false;
    renderCatalogResults();
    return;
  }

  if (state.catalogSite !== DEFAULT_SITE) {
    state.catalogResults = [];
    state.catalogError = "現在は小説家になろう検索のみ対応しています。";
    state.catalogHasSearched = true;
    state.catalogLoading = false;
    renderCatalogResults();
    return;
  }

  state.catalogLoading = true;
  state.catalogError = "";
  state.catalogHasSearched = true;
  renderCatalogResults();

  try {
    state.catalogResults = await fetchNarouNovels(state.catalogSearch);
  } catch (error) {
    state.catalogResults = [];
    state.catalogError = getCatalogErrorMessage(error);
  } finally {
    state.catalogLoading = false;
    renderCatalogResults();
  }
}

async function fetchNarouNovels(keyword) {
  const response = await fetch(buildNarouApiUrl(keyword), { mode: "cors" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return parseNarouApiResults(data);
}

function buildNarouApiUrl(keyword) {
  const params = new URLSearchParams({
    out: "json",
    word: keyword,
    lim: "20",
    of: "t-n-w-s-gl-ga",
  });
  return `${NAROU_API_URL}?${params.toString()}`;
}

function parseNarouApiResults(data) {
  if (!Array.isArray(data)) return [];
  return data.slice(1).map(normalizeNarouNovel).filter(Boolean);
}

function normalizeNarouNovel(item) {
  if (!item?.ncode || !item?.title) return null;
  return {
    id: `narou-${item.ncode}`,
    ncode: item.ncode,
    title: item.title,
    writer: item.writer || "作者不明",
    site: DEFAULT_SITE,
    url: `https://ncode.syosetu.com/${String(item.ncode).toLowerCase()}/`,
    latestChapter: toChapterNumber(item.general_all_no),
    story: item.story || "",
    lastup: item.general_lastup || "",
  };
}

function toIsoDateOrNow(value) {
  const normalizedValue = String(value || "").replace(/-/g, "/");
  const timestamp = new Date(normalizedValue).getTime();
  return Number.isNaN(timestamp) ? new Date().toISOString() : new Date(timestamp).toISOString();
}

function getCatalogStatusText() {
  if (!state.catalogSearch) return "キーワードを入力すると小説家になろう公式APIで検索します。";
  if (state.catalogLoading) return "検索しています...";
  if (state.catalogError) return state.catalogError;
  if (state.catalogHasSearched && state.catalogResults.length === 0) return "条件に合う作品はありません。";
  return "";
}

function shouldHideCatalogStatus() {
  if (!state.catalogSearch) return false;
  return !state.catalogLoading && !state.catalogError && state.catalogResults.length > 0;
}

function getCatalogErrorMessage(error) {
  console.warn("Narou API request failed", error);
  /*
   * GitHub Pagesは静的ホスティングのため、ブラウザからAPIを直接fetchします。
   * もし小説家になろうAPI側のCORS設定やブラウザ制約で直接呼び出せない場合は、
   * Cloudflare Workers / Netlify Functions / GitHub Pagesとは別の軽量APIなどで
   * `https://api.syosetu.com/novelapi/api/?out=json...` を中継するプロキシを用意し、
   * このfetch先だけをプロキシURLへ差し替える構成にしてください。
   */
  return "小説家になろうAPIを取得できませんでした。CORSまたは通信制限の可能性があります。";
}

function renderCatalogCard(item) {
  const alreadyAdded = Boolean(findDuplicateNovel(item));

  return `
    <article class="catalog-card">
      <div>
        <p class="ranking-source">${escapeHtml(item.site)}</p>
        <h3 class="novel-title">${escapeHtml(item.title)}</h3>
        <p class="muted">作者：${escapeHtml(item.writer)}</p>
        <p class="muted">${escapeHtml(item.story)}</p>
        <div class="meta-row">
          <span class="badge">最終更新 ${escapeHtml(item.lastup || "不明")}</span>
          <span class="badge">話数 ${item.latestChapter || 0}</span>
          <a class="text-button" href="${escapeHtml(item.url)}" target="_blank" rel="noopener">作品URL</a>
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
  const item = state.catalogResults.find((catalogItem) => catalogItem.id === catalogId);
  if (!item || findDuplicateNovel(item)) return;

  const novel = createNovel({
    title: item.title,
    site: item.site,
    url: item.url,
    latestChapter: item.latestChapter,
    readChapter: 0,
    memo: `作者：${item.writer}\n${item.story}`,
    unread: item.latestChapter > 0,
    updatedAt: toIsoDateOrNow(item.lastup),
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
  elements.updatesSummary.classList.toggle("is-hidden", updates.length === 0);
  elements.updatesSummary.innerHTML = renderUpdatesSummary(updates);
  elements.updatesEmpty.classList.toggle("is-hidden", updates.length > 0);
  elements.updatesList.innerHTML = updates.map(renderUpdateCard).join("");
  bindCardActions(elements.updatesList);
}

function getUpdatedNovels() {
  return state.novels
    .filter((novel) => novel.unread)
    .sort(compareByUpdateDate);
}

function compareByUpdateDate(a, b) {
  return getTimestamp(b.updatedAt) - getTimestamp(a.updatedAt);
}

function getTimestamp(value) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function renderUpdatesSummary(updates) {
  const totalDiff = updates.reduce((sum, novel) => sum + getUnreadChapterCount(novel), 0);
  return `
    <span class="badge unread">NEW ${updates.length}件</span>
    <span class="badge">未読 ${totalDiff}話</span>
    <span class="muted">更新順で巡回できます</span>
  `;
}

function renderUpdateCard(novel) {
  const unreadCount = getUnreadChapterCount(novel);
  const nextChapter = getNextReadableChapter(novel);
  const diffText = getUpdateDiffText(novel, unreadCount);
  const continueButton = novel.url
    ? renderContinueLink(novel)
    : "";

  return `
    <article class="update-card" data-id="${novel.id}">
      <div class="update-main">
        <div class="update-title-row">
          <span class="new-label">NEW</span>
          <div>
            <h3 class="novel-title">${escapeHtml(novel.title)}</h3>
            <p class="update-time">最終更新：${escapeHtml(formatUpdatedAt(novel.updatedAt))}</p>
          </div>
        </div>
        <div class="meta-row">
          <span class="badge">${escapeHtml(novel.site)}</span>
          ${novel.latestChapter ? `<span class="badge">更新 ${novel.latestChapter}話</span>` : ""}
          ${unreadCount ? `<span class="badge unread">未読 ${unreadCount}話</span>` : ""}
          <span class="badge">次 ${nextChapter}話</span>
        </div>
        <p class="update-diff">${escapeHtml(diffText)}</p>
        ${novel.lastViewedAt ? `<p class="update-time">最終閲覧：${escapeHtml(formatUpdatedAt(novel.lastViewedAt))}</p>` : ""}
      </div>
      <div class="card-actions update-actions">
        ${continueButton}
        <button class="text-button" type="button" data-action="read">既読</button>
        <button class="text-button" type="button" data-action="edit">編集</button>
      </div>
    </article>
  `;
}

function getUpdateDiffText(novel, unreadCount) {
  if (!novel.latestChapter) return "更新話数は未設定です";
  if (unreadCount > 0) return `${novel.readChapter}話から${novel.latestChapter}話まで、${unreadCount}話分の更新があります`;
  return `${novel.latestChapter}話まで確認済みです`;
}

function renderNovelCard(novel) {
  const urlButton = novel.url
    ? renderContinueLink(novel)
    : "";
  const unreadCount = getUnreadChapterCount(novel);
  const progressText = getProgressText(novel, unreadCount);
  const viewedText = getViewedText(novel);

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
      ${viewedText ? `<p class="muted">${escapeHtml(viewedText)}</p>` : ""}
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

function renderContinueLink(novel) {
  const chapter = getNextReadableChapter(novel);
  return `
    <a class="text-button" href="${escapeHtml(getContinueUrl(novel, chapter))}" target="_blank" rel="noopener" data-action="continue">
      続きから読む
    </a>
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

function getViewedText(novel) {
  if (!novel.lastViewedAt) return "";
  const chapter = novel.lastOpenedChapter ? ` / 最後に開いた話：${novel.lastOpenedChapter}話` : "";
  return `最終閲覧：${formatUpdatedAt(novel.lastViewedAt)}${chapter}`;
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
    case "continue":
      saveReadingProgress(novel);
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

function saveReadingProgress(novel) {
  const openedChapter = getNextReadableChapter(novel);
  const readChapter = Math.max(novel.readChapter || 0, openedChapter);
  const now = new Date().toISOString();

  state.novels = state.novels.map((item) => {
    if (item.id !== novel.id) return item;
    return {
      ...item,
      readChapter,
      position: formatChapter(readChapter),
      lastOpenedChapter: openedChapter,
      lastViewedAt: now,
      unread: item.latestChapter > readChapter,
    };
  });
  saveState();
  window.setTimeout(render, 0);
}

function getNextReadableChapter(novel) {
  const latestChapter = novel.latestChapter || 0;
  const readChapter = novel.readChapter || 0;
  if (!latestChapter) return readChapter || 1;
  return Math.min(latestChapter, readChapter + 1 || 1);
}

function getContinueUrl(novel, chapter) {
  // API連携時はここで作品IDと話数から正確な話URLを組み立てる。
  return novel.url || SITE_HOME_URLS[novel.site] || "#";
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
  const hasSourceData = hasRankingSourceData();
  const items = getRankingItems();
  elements.rankingControls.classList.toggle("is-hidden", !hasSourceData);
  elements.rankingEmpty.classList.toggle("is-hidden", items.length > 0);
  elements.rankingList.innerHTML = items.map(renderRankingItem).join("");
  bindCardActions(elements.rankingList);
}

function hasRankingSourceData() {
  return state.novels.some((novel) => getUnreadChapterCount(novel) > 0 || novel.unread);
}

function getRankingItems() {
  const keyword = normalizeText(state.rankingSearch);

  return state.novels
    .filter((novel) => getUnreadChapterCount(novel) > 0 || novel.unread)
    .filter((novel) => {
      const searchableText = normalizeText(`${novel.title} ${novel.site} ${novel.memo}`);
      const matchesSite = state.rankingSite === "all" || novel.site === state.rankingSite;
      const matchesKeyword = !keyword || searchableText.includes(keyword);
      return matchesSite && matchesKeyword;
    })
    .sort(sortRankingItems);
}

function sortRankingItems(a, b) {
  if (state.rankingSort === "unread") return getUnreadChapterCount(b) - getUnreadChapterCount(a) || compareByUpdateDate(a, b);
  if (state.rankingSort === "stale") return getTimestamp(a.lastViewedAt) - getTimestamp(b.lastViewedAt) || compareByUpdateDate(a, b);
  return compareByUpdateDate(a, b);
}

function renderRankingItem(novel, index) {
  const unreadCount = getUnreadChapterCount(novel);
  const nextChapter = getNextReadableChapter(novel);
  const continueButton = novel.url ? renderContinueLink(novel) : "";

  return `
    <article class="ranking-item" data-id="${novel.id}">
      <div class="ranking-rank" aria-label="${index + 1}位">${index + 1}</div>
      <div class="ranking-body">
        <div class="card-top">
          <div>
            <p class="ranking-source">本棚データからリアルタイム更新</p>
            <h3 class="novel-title">${escapeHtml(novel.title)}</h3>
          </div>
          <span class="new-label">NEW</span>
        </div>
        <div class="meta-row">
          <span class="badge">${escapeHtml(novel.site)}</span>
          <span class="badge">更新 ${novel.latestChapter || 0}話</span>
          <span class="badge unread">差分 ${unreadCount}話</span>
          <span class="badge">次 ${nextChapter}話</span>
        </div>
        <p class="update-diff">${escapeHtml(getUpdateDiffText(novel, unreadCount))}</p>
        <p class="update-time">最終更新：${escapeHtml(formatUpdatedAt(novel.updatedAt))}</p>
        ${novel.lastViewedAt ? `<p class="update-time">最終巡回：${escapeHtml(formatUpdatedAt(novel.lastViewedAt))}</p>` : ""}
        <div class="card-actions update-actions">
          ${continueButton}
          <button class="text-button" type="button" data-action="read">既読</button>
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
