const STORAGE_KEY = "novelShelf:v1";
const THEME_KEY = "novelShelf:theme";
const TUTORIAL_KEY = "novelShelf:tutorialCompleted";
const VIEW_NAMES = new Set(["library", "updates", "ranking", "settings", "reader"]);
const DEFAULT_SITE = "小説家になろう";
const OTHER_SITE = "その他";
const SITE_OPTIONS = ["小説家になろう", "カクヨム", "ハーメルン", "Arcadia", "暁", "ノベルアップ+", "pixiv小説", "ノクターン"];
const SEARCH_SITE_OPTIONS = SITE_OPTIONS;
const NOVEL_SITE_OPTIONS = [...SITE_OPTIONS, OTHER_SITE];
const NAROU_API_URL = "https://api.syosetu.com/novelapi/api/";
const NAROU_JSONP_TIMEOUT = 12000;
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
const SITE_CARD_META = {
  "小説家になろう": { icon: "な", description: "公式APIで作品情報を検索して本棚へ追加できます。" },
  カクヨム: { icon: "K", description: "検索ページを開き、作品URLを貼り付けて管理します。" },
  ハーメルン: { icon: "H", description: "検索ページから作品を探し、外部リンクとして登録します。" },
  Arcadia: { icon: "A", description: "外部検索で作品を探し、URL登録で管理します。" },
  暁: { icon: "暁", description: "外部検索とURL登録で読了位置を管理します。" },
  "ノベルアップ+": { icon: "N+", description: "検索ページを開いて作品URLを本棚に保存します。" },
  pixiv小説: { icon: "P", description: "pixiv小説の検索ページから作品を探します。" },
  ノクターン: { icon: "夜", description: "なろう系URLとしてNコード読了管理に対応します。" },
};
const API_SEARCH_SITES = new Set([DEFAULT_SITE]);
const EXTERNAL_SEARCH_BUILDERS = {
  カクヨム: (keyword) => `https://kakuyomu.jp/search?q=${encodeURIComponent(keyword)}`,
  ハーメルン: (keyword) => `https://syosetu.org/search/?mode=search&word=${encodeURIComponent(keyword)}`,
  Arcadia: (keyword) => `https://www.google.com/search?q=${encodeURIComponent(`${keyword} site:mai-net.net`)}`,
  暁: (keyword) => `https://www.google.com/search?q=${encodeURIComponent(`${keyword} site:akatsuki-novels.com`)}`,
  "ノベルアップ+": (keyword) => `https://novelup.plus/search?q=${encodeURIComponent(keyword)}`,
  pixiv小説: (keyword) => `https://www.pixiv.net/search/novels/${encodeURIComponent(keyword)}`,
  ノクターン: (keyword) => `https://noc.syosetu.com/search/search/?word=${encodeURIComponent(keyword)}`,
};
const SITE_URL_PATTERNS = [
  { site: "ノクターン", pattern: /noc\.syosetu\.com/i },
  { site: DEFAULT_SITE, pattern: /ncode\.syosetu\.com|syosetu\.com/i },
  { site: "カクヨム", pattern: /kakuyomu\.jp/i },
  { site: "ハーメルン", pattern: /syosetu\.org/i },
  { site: "Arcadia", pattern: /mai-net\.net/i },
  { site: "暁", pattern: /akatsuki-novels\.com/i },
  { site: "ノベルアップ+", pattern: /novelup\.plus/i },
  { site: "pixiv小説", pattern: /pixiv\.net\/novel|pixiv\.net\/.*novels/i },
];

const state = {
  novels: [],
  updateOrder: [],
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
  updateChecking: false,
  updateCheckMessage: "",
  updateCheckError: "",
  readerNovelId: "",
  bookmarkletMessage: "",
  bookmarkletError: "",
};

const elements = {};
let catalogSearchTimer = 0;
let updatesSortable = null;

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  populateStaticOptions();
  loadState();
  applyTheme(loadTheme());
  bindEvents();
  processBookmarkletParams();
  initializeRoute();
  render();
  showTutorialIfNeeded();
});

function cacheElements() {
  Object.assign(elements, {
    themeToggle: document.querySelector("#themeToggle"),
    themeIcon: document.querySelector("#themeIcon"),
    heroRegisterUrl: document.querySelector("#heroRegisterUrl"),
    heroSearchNarou: document.querySelector("#heroSearchNarou"),
    heroShowTutorial: document.querySelector("#heroShowTutorial"),
    tabButtons: document.querySelectorAll(".tab-button"),
    panels: document.querySelectorAll("[data-view-panel]"),
    openAddForm: document.querySelector("#openAddForm"),
    catalogSiteTabs: document.querySelector("#catalogSiteTabs"),
    catalogSearchPanel: document.querySelector("#catalogSearchPanel"),
    catalogModeNote: document.querySelector("#catalogModeNote"),
    catalogSearchLabel: document.querySelector("#catalogSearchLabel"),
    catalogSearch: document.querySelector("#catalogSearch"),
    catalogExternalSearch: document.querySelector("#catalogExternalSearch"),
    catalogResults: document.querySelector("#catalogResults"),
    catalogEmpty: document.querySelector("#catalogEmpty"),
    quickUrl: document.querySelector("#quickUrl"),
    manualRegisterPanel: document.querySelector("#manualRegisterPanel"),
    quickRegister: document.querySelector("#quickRegister"),
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
    libraryEmptyRegister: document.querySelector("#libraryEmptyRegister"),
    libraryEmptySearch: document.querySelector("#libraryEmptySearch"),
    bookmarkletStatus: document.querySelector("#bookmarkletStatus"),
    updatesList: document.querySelector("#updatesList"),
    readerPanel: document.querySelector("#readerPanel"),
    updatesEmpty: document.querySelector("#updatesEmpty"),
    updatesEmptyRegister: document.querySelector("#updatesEmptyRegister"),
    updatesEmptyCheck: document.querySelector("#updatesEmptyCheck"),
    updatesSummary: document.querySelector("#updatesSummary"),
    checkUpdates: document.querySelector("#checkUpdates"),
    updateCheckStatus: document.querySelector("#updateCheckStatus"),
    markAllRead: document.querySelector("#markAllRead"),
    rankingControls: document.querySelector("#rankingControls"),
    rankingSite: document.querySelector("#rankingSite"),
    rankingSort: document.querySelector("#rankingSort"),
    rankingSearch: document.querySelector("#rankingSearch"),
    rankingList: document.querySelector("#rankingList"),
    rankingEmpty: document.querySelector("#rankingEmpty"),
    rankingEmptyCheck: document.querySelector("#rankingEmptyCheck"),
    exportData: document.querySelector("#exportData"),
    importData: document.querySelector("#importData"),
    clearData: document.querySelector("#clearData"),
    exportBox: document.querySelector("#exportBox"),
    bookmarkletLink: document.querySelector("#bookmarkletLink"),
    tutorialModal: document.querySelector("#tutorialModal"),
    tutorialClose: document.querySelector("#tutorialClose"),
    tutorialComplete: document.querySelector("#tutorialComplete"),
  });
}

function populateStaticOptions() {
  // Site choices are shared by multiple controls; keep the source of truth in JS.
  populateCatalogSiteTabs();
  populateSelect(elements.novelSite, NOVEL_SITE_OPTIONS);
  populateSelect(elements.siteFilter, NOVEL_SITE_OPTIONS, { allLabel: "すべて" });
  populateSelect(elements.rankingSite, SITE_OPTIONS, { allLabel: "全サイト" });
  elements.bookmarkletLink.href = createBookmarkletHref();
}

function populateCatalogSiteTabs() {
  elements.catalogSiteTabs.innerHTML = SEARCH_SITE_OPTIONS.map((site) => `
    <li>
      <button class="site-card${site === state.catalogSite ? " is-active" : ""}" type="button" data-catalog-site="${escapeHtml(site)}" aria-label="${escapeHtml(`${site}で作品を探す`)}">
        <span class="site-card-icon" aria-hidden="true">${escapeHtml(getSiteCardMeta(site).icon)}</span>
        <span class="site-card-body">
          <span class="site-card-name">${escapeHtml(site)}</span>
          <span class="site-card-description">${escapeHtml(getSiteCardMeta(site).description)}</span>
          <span class="site-card-mode">${isApiSearchSite(site) ? "API検索" : "外部リンク管理"}</span>
        </span>
      </button>
    </li>
  `).join("");
}

function getSiteCardMeta(site) {
  return SITE_CARD_META[site] || { icon: site.slice(0, 1), description: "外部検索とURL登録で管理します。" };
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
  elements.heroRegisterUrl.addEventListener("click", focusUrlRegister);
  elements.heroSearchNarou.addEventListener("click", focusNarouSearch);
  elements.heroShowTutorial.addEventListener("click", openTutorial);
  elements.libraryEmptyRegister.addEventListener("click", focusUrlRegister);
  elements.libraryEmptySearch.addEventListener("click", focusNarouSearch);
  elements.updatesEmptyRegister.addEventListener("click", focusUrlRegister);
  elements.updatesEmptyCheck.addEventListener("click", focusUpdateCheck);
  elements.rankingEmptyCheck.addEventListener("click", focusUpdateCheck);
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
    if (isApiSearchSite(state.catalogSite)) {
      queueCatalogSearch();
    } else {
      state.catalogResults = [];
      state.catalogError = "";
      state.catalogHasSearched = false;
      renderCatalogResults();
    }
  });
  elements.catalogExternalSearch.addEventListener("click", openExternalCatalogSearch);
  elements.quickRegister.addEventListener("click", registerNovelFromUrl);
  elements.quickUrl.addEventListener("input", () => {
    if (!elements.novelForm.classList.contains("is-hidden")) return;
    const detectedSite = detectSiteFromUrl(elements.quickUrl.value);
    if (detectedSite) setFormError("");
  });
  elements.catalogSiteTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-catalog-site]");
    if (!button) return;
    state.catalogSite = button.dataset.catalogSite;
    state.catalogResults = [];
    state.catalogError = "";
    state.catalogHasSearched = false;
    if (isApiSearchSite(state.catalogSite)) queueCatalogSearch(0);
    renderCatalogResults();
  });
  elements.cancelEdit.addEventListener("click", hideForm);
  elements.novelForm.addEventListener("submit", saveNovelFromForm);
  elements.novelUrl.addEventListener("input", () => {
    const detectedSite = detectSiteFromUrl(elements.novelUrl.value);
    if (detectedSite) setSelectValue(elements.novelSite, detectedSite);
  });
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
  elements.checkUpdates.addEventListener("click", checkNarouUpdates);
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
  elements.tutorialClose?.addEventListener("click", completeTutorial);
  elements.tutorialComplete?.addEventListener("click", completeTutorial);
  elements.tutorialModal?.addEventListener("click", (event) => {
    if (event.target === elements.tutorialModal) completeTutorial();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.tutorialModal?.classList.contains("is-hidden")) {
      completeTutorial();
    }
  });
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
    updateOrder: state.updateOrder,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function normalizeStoredData(savedData) {
  const novels = Array.isArray(savedData) ? savedData : savedData?.novels;
  if (!Array.isArray(novels)) return getInitialNovels();
  state.updateOrder = normalizeUpdateOrder(savedData?.updateOrder);
  return dedupeNovels(novels.map(sanitizeNovel));
}

function parseImportedNovels(importedData) {
  const novels = Array.isArray(importedData) ? importedData : importedData?.novels;
  if (!Array.isArray(novels)) throw new Error("Invalid data");
  return dedupeNovels(novels.map(sanitizeNovel));
}

function normalizeUpdateOrder(order) {
  if (!Array.isArray(order)) return [];
  return order.map((id) => String(id || "")).filter(Boolean);
}

function getInitialNovels() {
  return [];
}

function createNovel(values) {
  const latestChapter = toChapterNumber(values.generalAllNo ?? values.latestChapter ?? values.latest);
  const readChapter = toChapterNumber(values.lastReadEpisode ?? values.readChapter ?? values.position);
  const sourceInfo = extractSourceInfoFromUrl(values.url);
  const ncode = normalizeNcode(values.ncode || sourceInfo.workId) || extractNarouNcode(values.url);
  const site = ncode ? DEFAULT_SITE : values.site;
  const generalLastup = values.generalLastup || values.lastup || values.updatedAt || "";
  const updatedAt = generalLastup ? toIsoDateOrNow(generalLastup) : values.updatedAt || new Date().toISOString();

  return {
    id: createId(),
    title: values.title,
    site,
    ncode,
    workId: values.workId || sourceInfo.workId || ncode,
    novelId: values.novelId || sourceInfo.novelId || "",
    episodeId: values.episodeId || sourceInfo.episodeId || "",
    author: values.author || values.writer || "",
    story: values.story || "",
    url: values.url || "",
    generalLastup,
    generalAllNo: latestChapter,
    lastReadEpisode: readChapter,
    lastReadEpisodeId: values.lastReadEpisodeId || "",
    sourceUrl: values.sourceUrl || "",
    lastCheckedAt: values.lastCheckedAt || "",
    latestChapter,
    readChapter,
    latest: formatChapter(latestChapter),
    position: formatChapter(readChapter),
    lastOpenedChapter: toChapterNumber(values.lastOpenedChapter),
    lastViewedAt: values.lastViewedAt || "",
    memo: values.memo || "",
    unread: Boolean(values.unread),
    lastCheckDiff: toChapterNumber(values.lastCheckDiff),
    updatedAt,
  };
}

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `novel-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadTheme() {
  return localStorage.getItem(THEME_KEY) || "light";
}

function showTutorialIfNeeded() {
  if (localStorage.getItem(TUTORIAL_KEY) === "true") return;
  openTutorial();
}

function openTutorial() {
  elements.tutorialModal.classList.remove("is-hidden");
  elements.tutorialComplete.focus();
}

function completeTutorial() {
  localStorage.setItem(TUTORIAL_KEY, "true");
  elements.tutorialModal.classList.add("is-hidden");
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

function focusUrlRegister() {
  switchView("library");
  scrollToPanel(elements.manualRegisterPanel);
  elements.quickUrl.focus();
}

function focusNarouSearch() {
  switchView("library");
  state.catalogSite = DEFAULT_SITE;
  renderCatalogResults();
  scrollToPanel(elements.catalogSearchPanel);
  elements.catalogSearch.focus();
}

function focusUpdateCheck() {
  switchView("updates");
  scrollToPanel(elements.checkUpdates);
  elements.checkUpdates.focus();
}

function scrollToPanel(panel) {
  panel?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function showForm(novel = null, options = {}) {
  elements.novelForm.classList.remove("is-hidden");
  elements.novelForm.classList.toggle("is-url-register", Boolean(options.urlRegister));
  setFormError("");
  elements.novelId.value = novel?.id || "";
  elements.novelTitle.value = novel?.title || "";
  setSelectValue(elements.novelSite, novel?.site || DEFAULT_SITE);
  elements.novelUrl.value = novel?.url || "";
  elements.novelLatest.value = novel?.generalAllNo || novel?.latestChapter || "";
  elements.novelPosition.value = novel?.lastReadEpisode || novel?.readChapter || "";
  elements.novelMemo.value = novel?.memo || "";
  elements.novelTitle.focus();
}

function hideForm() {
  elements.novelForm.reset();
  elements.novelId.value = "";
  elements.novelForm.classList.remove("is-url-register");
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
  const url = elements.novelUrl.value.trim();
  const detectedSite = detectSiteFromUrl(url);
  const sourceInfo = extractSourceInfoFromUrl(url);
  const latestChapter = toChapterNumber(elements.novelLatest.value);
  const readChapter = toChapterNumber(elements.novelPosition.value);
  return {
    title: elements.novelTitle.value.trim(),
    site: detectedSite || elements.novelSite.value,
    url,
    ncode: sourceInfo.site === "narou" ? sourceInfo.workId : extractNarouNcode(url),
    workId: sourceInfo.workId,
    novelId: sourceInfo.novelId,
    episodeId: sourceInfo.episodeId,
    generalAllNo: latestChapter,
    latestChapter,
    lastReadEpisode: readChapter,
    readChapter,
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
      generalAllNo: formValue.generalAllNo,
      lastReadEpisode: formValue.lastReadEpisode,
      latest: formatChapter(formValue.latestChapter),
      position: formatChapter(formValue.readChapter),
      unread: hasUnreadChapters(formValue),
      lastCheckDiff: 0,
      updatedAt: new Date().toISOString(),
    };
  });
}

function hasUnreadChapters(novel) {
  return toChapterNumber(novel.generalAllNo ?? novel.latestChapter) > toChapterNumber(novel.lastReadEpisode ?? novel.readChapter);
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

function normalizeNcode(value) {
  const match = String(value || "").trim().match(/^n\d{4}[a-z]+$/i);
  return match ? match[0].toUpperCase() : "";
}

function extractNarouNcode(url) {
  const match = String(url || "").match(/ncode\.syosetu\.com\/(n\d{4}[a-z]+)\/?/i);
  return match ? match[1].toUpperCase() : "";
}

function extractSourceInfoFromUrl(url) {
  const target = String(url || "").trim();
  const nocturne = target.match(/noc\.syosetu\.com\/(n\d{4}[a-z]+)\/(?:(\d+)\/?)?/i);
  if (nocturne) {
    return {
      site: "nocturne",
      workId: normalizeNcode(nocturne[1]),
      episodeNo: nocturne[2] ? Number(nocturne[2]) : 0,
    };
  }

  const narou = target.match(/ncode\.syosetu\.com\/(n\d{4}[a-z]+)\/(?:(\d+)\/?)?/i);
  if (narou) {
    return {
      site: "narou",
      workId: normalizeNcode(narou[1]),
      episodeNo: narou[2] ? Number(narou[2]) : 0,
    };
  }

  const kakuyomu = target.match(/kakuyomu\.jp\/works\/([^/?#]+)(?:\/episodes\/([^/?#]+))?/i);
  if (kakuyomu) {
    return {
      site: "kakuyomu",
      workId: kakuyomu[1],
      episodeId: kakuyomu[2] || "",
    };
  }

  const hameln = target.match(/syosetu\.org\/novel\/(\d+)\/(?:(\d+)(?:\.html|\/)?)?/i);
  if (hameln) {
    return {
      site: "hameln",
      workId: hameln[1],
      novelId: hameln[1],
      episodeNo: hameln[2] ? Number(hameln[2]) : 0,
    };
  }

  const arcadia = target.match(/mai-net\.net\/bbs\/sst\/sst\.php\?[^#]*\ball=(\d+)(?:[^#]*\bn=(\d+))?/i);
  if (arcadia) {
    return {
      site: "arcadia",
      workId: arcadia[1],
      episodeNo: arcadia[2] ? Number(arcadia[2]) : 0,
    };
  }

  const akatsuki = target.match(/akatsuki-novels\.com\/stories\/view\/(\d+)\/novel_id~(\d+)/i);
  if (akatsuki) {
    return {
      site: "akatsuki",
      workId: akatsuki[2],
      episodeId: akatsuki[1],
    };
  }

  const pixiv = target.match(/pixiv\.net\/novel\/show\.php\?[^#]*\bid=(\d+)/i);
  if (pixiv) {
    return {
      site: "pixiv",
      workId: pixiv[1],
      episodeId: pixiv[1],
    };
  }

  const novelup = target.match(/novelup\.plus\/story\/([^/?#]+)/i);
  if (novelup) {
    return {
      site: "novelup",
      workId: novelup[1],
      episodeId: novelup[1],
    };
  }

  return {};
}

function detectSiteFromUrl(url) {
  const target = String(url || "").trim();
  if (!target) return "";
  const matched = SITE_URL_PATTERNS.find((entry) => entry.pattern.test(target));
  return matched?.site || OTHER_SITE;
}

function normalizeText(text) {
  return String(text || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function sanitizeNovel(novel) {
  // Older exports used Japanese strings like "第12話"; normalize both shapes.
  const sourceInfo = extractSourceInfoFromUrl(novel.url);
  const latestChapter = toChapterNumber(novel.generalAllNo ?? novel.latestChapter ?? novel.latest);
  const readChapter = toChapterNumber(novel.lastReadEpisode ?? novel.readChapter ?? novel.position);
  const ncode = normalizeNcode(novel.ncode || (sourceInfo.site === "narou" ? sourceInfo.workId : "")) || extractNarouNcode(novel.url);
  const generalLastup = novel.generalLastup || novel.lastup || novel.updatedAt || "";
  const site = ncode ? DEFAULT_SITE : novel.site || OTHER_SITE;

  return {
    id: novel.id || createId(),
    title: String(novel.title || "").trim(),
    site,
    ncode,
    workId: novel.workId || sourceInfo.workId || ncode,
    novelId: novel.novelId || sourceInfo.novelId || "",
    episodeId: novel.episodeId || sourceInfo.episodeId || "",
    author: String(novel.author || novel.writer || "").trim(),
    story: String(novel.story || "").trim(),
    url: String(novel.url || "").trim(),
    generalLastup,
    generalAllNo: latestChapter,
    lastReadEpisode: readChapter,
    lastReadEpisodeId: novel.lastReadEpisodeId || "",
    sourceUrl: novel.sourceUrl || "",
    lastCheckedAt: novel.lastCheckedAt || "",
    latestChapter,
    readChapter,
    latest: formatChapter(latestChapter),
    position: formatChapter(readChapter),
    lastOpenedChapter: toChapterNumber(novel.lastOpenedChapter),
    lastViewedAt: novel.lastViewedAt || "",
    memo: String(novel.memo || "").trim(),
    unread: Boolean(novel.unread) || hasUnreadChapters({ latestChapter, readChapter }),
    lastCheckDiff: toChapterNumber(novel.lastCheckDiff),
    updatedAt: generalLastup ? toIsoDateOrNow(generalLastup) : novel.updatedAt || new Date().toISOString(),
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
  renderReader();
}

function renderCatalogResults() {
  renderCatalogMode();
  elements.catalogEmpty.innerHTML = getCatalogStatusText();
  elements.catalogEmpty.classList.toggle("is-loading", state.catalogLoading);
  elements.catalogEmpty.classList.toggle("is-hidden", shouldHideCatalogStatus());
  elements.catalogResults.innerHTML = state.catalogResults.map(renderCatalogCard).join("");
  elements.catalogSiteTabs.querySelectorAll("[data-catalog-site]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.catalogSite === state.catalogSite);
  });
  bindCatalogActions();
}

function processBookmarkletParams() {
  const params = new URLSearchParams(location.search);
  if (!params.has("site") || !params.has("sourceUrl")) return;

  const payload = {
    site: params.get("site") || "",
    workId: params.get("workId") || "",
    ncode: params.get("ncode") || "",
    novelId: params.get("novelId") || "",
    episodeId: params.get("episodeId") || "",
    episodeNo: toChapterNumber(params.get("episodeNo")),
    sourceUrl: params.get("sourceUrl") || "",
  };

  const result = applyBookmarkletRead(payload);
  state.bookmarkletMessage = result.ok ? result.message : "";
  state.bookmarkletError = result.ok ? "" : result.message;
  saveState();
  cleanBookmarkletQuery();
}

function applyBookmarkletRead(payload) {
  if (!isSupportedBookmarkletPayload(payload)) {
    return { ok: false, message: "このページは読了登録に対応していません。" };
  }

  const novel = findNovelByBookmarkletPayload(payload);
  if (!novel) {
    return { ok: false, message: "本棚に該当作品が見つかりません。先に作品URLを登録してください。" };
  }

  updateNovelReadFromBookmarklet(novel, payload);
  return { ok: true, message: `「${novel.title}」の読了位置を更新しました。` };
}

function isSupportedBookmarkletPayload(payload) {
  if (["narou", "nocturne"].includes(payload.site)) return Boolean(normalizeNcode(payload.workId || payload.ncode) && payload.episodeNo);
  if (["kakuyomu", "akatsuki", "pixiv", "novelup"].includes(payload.site)) return Boolean(payload.workId && payload.episodeId);
  if (payload.site === "hameln") return Boolean((payload.novelId || payload.workId) && payload.episodeNo);
  if (payload.site === "arcadia") return Boolean(payload.workId && payload.sourceUrl.includes("n="));
  return false;
}

function findNovelByBookmarkletPayload(payload) {
  if (["narou", "nocturne"].includes(payload.site)) {
    const ncode = normalizeNcode(payload.workId || payload.ncode);
    return state.novels.find((novel) => normalizeNcode(novel.ncode || novel.workId) === ncode || normalizeUrl(novel.url).includes(ncode.toLowerCase()));
  }
  if (payload.site === "kakuyomu") {
    return state.novels.find((novel) => novel.site === "カクヨム" && (novel.workId === payload.workId || normalizeUrl(novel.url).includes(`/works/${payload.workId}`)));
  }
  if (payload.site === "hameln") {
    const novelId = payload.novelId || payload.workId;
    return state.novels.find((novel) => novel.site === "ハーメルン" && (novel.novelId === novelId || novel.workId === novelId || normalizeUrl(novel.url).includes(`/novel/${novelId}`)));
  }
  if (payload.site === "arcadia") return findExternalNovelBySiteAndWork("Arcadia", payload.workId, "all=");
  if (payload.site === "akatsuki") return findExternalNovelBySiteAndWork("暁", payload.workId, "novel_id~");
  if (payload.site === "pixiv") return findExternalNovelBySiteAndWork("pixiv小説", payload.workId, "id=");
  if (payload.site === "novelup") return findExternalNovelBySiteAndWork("ノベルアップ+", payload.workId, "/story/");
  return null;
}

function findExternalNovelBySiteAndWork(site, workId, urlNeedle) {
  return state.novels.find((novel) => novel.site === site && (
    novel.workId === workId ||
    novel.episodeId === workId ||
    normalizeUrl(novel.url).includes(`${urlNeedle}${String(workId).toLowerCase()}`)
  ));
}

function updateNovelReadFromBookmarklet(targetNovel, payload) {
  const now = new Date().toISOString();
  state.novels = state.novels.map((novel) => {
    if (novel.id !== targetNovel.id) return novel;

    if (payload.episodeId && !payload.episodeNo) {
      return {
        ...novel,
        workId: payload.workId,
        lastReadEpisodeId: payload.episodeId,
        episodeId: payload.episodeId,
        sourceUrl: payload.sourceUrl,
        lastViewedAt: now,
      };
    }

    const readChapter = Math.max(toChapterNumber(novel.lastReadEpisode ?? novel.readChapter), payload.episodeNo);
    return {
      ...novel,
      workId: payload.workId || novel.workId,
      novelId: payload.novelId || novel.novelId,
      lastReadEpisode: readChapter,
      readChapter,
      position: formatChapter(readChapter),
      lastOpenedChapter: payload.episodeNo,
      sourceUrl: payload.sourceUrl,
      lastViewedAt: now,
      unread: (novel.generalAllNo || novel.latestChapter || 0) > readChapter,
      lastCheckDiff: (novel.generalAllNo || novel.latestChapter || 0) > readChapter ? novel.lastCheckDiff : 0,
    };
  });
}

function cleanBookmarkletQuery() {
  const cleanUrl = `${location.pathname}${location.hash || ""}`;
  history.replaceState(null, "", cleanUrl);
}

function renderCatalogMode() {
  const isApiMode = isApiSearchSite(state.catalogSite);
  elements.catalogSearchLabel.textContent = isApiMode ? `${state.catalogSite} API検索` : `${state.catalogSite} 外部検索`;
  elements.catalogModeNote.textContent = isApiMode
    ? `${state.catalogSite}は公式APIから作品情報を取得し、そのまま本棚へ追加できます。`
    : `${state.catalogSite}は現時点ではAPI未対応のため、検索ページを開いて作品URLを貼り付け登録します。`;
  elements.catalogExternalSearch.classList.toggle("is-hidden", isApiMode);
}

function createBookmarkletHref() {
  const appUrl = new URL(location.pathname.split("/").pop() ? "./" : ".", location.href);
  const targetUrl = new URL("index.html", appUrl);
  targetUrl.hash = "";
  targetUrl.search = "";
  const script = `
    (() => {
      const sourceUrl = location.href;
      const patterns = [
        {
          site: "nocturne",
          match: sourceUrl.match(/noc\\.syosetu\\.com\\/(n\\d{4}[a-z]+)\\/(\\d+)\\/?/i),
          build: (m) => ({ site: "nocturne", workId: m[1].toUpperCase(), ncode: m[1].toUpperCase(), episodeNo: m[2] })
        },
        {
          site: "narou",
          match: sourceUrl.match(/ncode\\.syosetu\\.com\\/(n\\d{4}[a-z]+)\\/(\\d+)\\/?/i),
          build: (m) => ({ site: "narou", workId: m[1].toUpperCase(), ncode: m[1].toUpperCase(), episodeNo: m[2] })
        },
        {
          site: "kakuyomu",
          match: sourceUrl.match(/kakuyomu\\.jp\\/works\\/([^/?#]+)\\/episodes\\/([^/?#]+)/i),
          build: (m) => ({ site: "kakuyomu", workId: m[1], episodeId: m[2] })
        },
        {
          site: "hameln",
          match: sourceUrl.match(/syosetu\\.org\\/novel\\/(\\d+)\\/(\\d+)(?:\\.html|\\/)?/i),
          build: (m) => ({ site: "hameln", workId: m[1], novelId: m[1], episodeNo: m[2] })
        },
        {
          site: "arcadia",
          match: sourceUrl.match(/mai-net\\.net\\/bbs\\/sst\\/sst\\.php\\?[^#]*\\ball=(\\d+)(?:[^#]*\\bn=(\\d+))?/i),
          build: (m) => ({ site: "arcadia", workId: m[1], episodeNo: m[2] || "0" })
        },
        {
          site: "akatsuki",
          match: sourceUrl.match(/akatsuki-novels\\.com\\/stories\\/view\\/(\\d+)\\/novel_id~(\\d+)/i),
          build: (m) => ({ site: "akatsuki", workId: m[2], episodeId: m[1] })
        },
        {
          site: "pixiv",
          match: sourceUrl.match(/pixiv\\.net\\/novel\\/show\\.php\\?[^#]*\\bid=(\\d+)/i),
          build: (m) => ({ site: "pixiv", workId: m[1], episodeId: m[1] })
        },
        {
          site: "novelup",
          match: sourceUrl.match(/novelup\\.plus\\/story\\/([^/?#]+)/i),
          build: (m) => ({ site: "novelup", workId: m[1], episodeId: m[1] })
        }
      ];
      const matched = patterns.find((item) => item.match);
      if (!matched) {
        location.href = ${JSON.stringify(targetUrl.href)} + "?site=unsupported&sourceUrl=" + encodeURIComponent(sourceUrl);
        return;
      }
      const payload = matched.build(matched.match);
      payload.sourceUrl = sourceUrl;
      const params = new URLSearchParams(payload);
      location.href = ${JSON.stringify(targetUrl.href)} + "?" + params.toString();
    })();
  `;
  return `javascript:${encodeURIComponent(script.replace(/\s+/g, " "))}`;
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

  if (!isApiSearchSite(state.catalogSite)) {
    state.catalogResults = [];
    state.catalogError = "";
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

function isApiSearchSite(site) {
  return API_SEARCH_SITES.has(site);
}

function openExternalCatalogSearch() {
  const keyword = state.catalogSearch.trim();
  if (!keyword) {
    state.catalogError = "検索キーワードを入力してください。";
    state.catalogHasSearched = true;
    renderCatalogResults();
    return;
  }

  const url = buildExternalSearchUrl(state.catalogSite, keyword);
  window.open(url, "_blank", "noopener");
  state.catalogError = "";
  state.catalogHasSearched = true;
  renderCatalogResults();
}

function buildExternalSearchUrl(site, keyword) {
  const builder = EXTERNAL_SEARCH_BUILDERS[site];
  if (builder) return builder(keyword);
  return `https://www.google.com/search?q=${encodeURIComponent(`${keyword} ${site}`)}`;
}

async function fetchNarouNovels(keyword) {
  const data = await requestNarouApi({
    word: keyword,
    lim: "20",
    of: "t-n-w-s-g-k-gl-ga",
  });
  return parseNarouApiResults(data);
}

async function fetchNarouNovelsByNcodes(ncodes) {
  const data = await requestNarouApi({
    ncode: ncodes.join("-").toLowerCase(),
    lim: String(ncodes.length),
    of: "t-n-w-s-g-k-gl-ga",
  });
  return parseNarouApiResults(data);
}

function requestNarouApi(params) {
  return new Promise((resolve, reject) => {
    const callbackName = `novelShelfNarou_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const script = document.createElement("script");
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error("Narou API JSONP timeout"));
    }, NAROU_JSONP_TIMEOUT);

    function cleanup() {
      window.clearTimeout(timer);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = (data) => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("Narou API JSONP failed"));
    };
    script.src = buildNarouApiUrl(params, callbackName);
    document.head.append(script);
  });
}

function buildNarouApiUrl(apiParams, callbackName) {
  /*
   * なろう公式APIはJSONPを提供しています。
   * GitHub Pagesのような静的サイトから out=json をfetchするとCORSで読めない場合があるため、
   * ブラウザ単体では out=jsonp + callback のscript読み込みで取得します。
   * サーバー側でAPIプロキシを用意できる場合は、ここを out=json のfetch構成に戻せます。
   */
  const searchParams = new URLSearchParams({
    out: "jsonp",
    callback: callbackName,
    ...apiParams,
  });
  return `${NAROU_API_URL}?${searchParams.toString()}`;
}

function parseNarouApiResults(data) {
  if (!Array.isArray(data)) return [];
  return data.slice(1).map(normalizeNarouNovel).filter(Boolean);
}

function normalizeNarouNovel(item) {
  if (!item?.ncode || !item?.title) return null;
  const ncode = normalizeNcode(item.ncode);
  if (!ncode) return null;
  const generalAllNo = toChapterNumber(item.general_all_no);
  const generalLastup = item.general_lastup || "";
  return {
    id: `narou-${ncode}`,
    ncode,
    title: item.title,
    author: item.writer || "作者不明",
    writer: item.writer || "作者不明",
    site: DEFAULT_SITE,
    url: `https://ncode.syosetu.com/${ncode.toLowerCase()}/`,
    generalLastup,
    generalAllNo,
    latestChapter: generalAllNo,
    story: item.story || "",
    genre: item.genre || "",
    keyword: item.keyword || "",
    lastup: generalLastup,
  };
}

function toIsoDateOrNow(value) {
  const normalizedValue = String(value || "").replace(/-/g, "/");
  const timestamp = new Date(normalizedValue).getTime();
  return Number.isNaN(timestamp) ? new Date().toISOString() : new Date(timestamp).toISOString();
}

function getCatalogStatusText() {
  if (!isApiSearchSite(state.catalogSite)) {
    if (state.catalogError) return state.catalogError;
    return "API未対応サイトは検索ページを新しいタブで開き、作品URLを貼り付けて本棚へ登録します。";
  }
  if (!state.catalogSearch) return "キーワードを入力すると小説家になろう公式APIで検索します。";
  if (state.catalogLoading) return '<span class="loading-spinner" aria-hidden="true"></span><span>検索しています...</span>';
  if (state.catalogError) return state.catalogError;
  if (state.catalogHasSearched && state.catalogResults.length === 0) return "条件に合う作品はありません。";
  return "";
}

function shouldHideCatalogStatus() {
  if (!isApiSearchSite(state.catalogSite)) return false;
  if (!state.catalogSearch) return false;
  return !state.catalogLoading && !state.catalogError && state.catalogResults.length > 0;
}

function getCatalogErrorMessage(error) {
  console.warn("Narou API request failed", error);
  return "小説家になろうAPIを取得できませんでした。時間を置いて再検索してください。";
}

function renderCatalogCard(item) {
  const alreadyAdded = Boolean(findDuplicateNovel(item));
  const addButtonLabel = alreadyAdded ? `${item.title}は登録済みです` : `${item.title}を本棚に追加`;
  const chips = getNarouMetaChips(item).map((chip) => `<span class="tag-chip">${escapeHtml(chip)}</span>`).join("");
  const storyId = `story-${escapeHtml(item.id)}`;

  return `
    <article class="catalog-card">
      <div class="catalog-main">
        <p class="ranking-source">${escapeHtml(item.site)}</p>
        <h3 class="novel-title">${escapeHtml(item.title)}</h3>
        <p class="catalog-author">作者：${escapeHtml(item.writer)}</p>
        <div class="meta-row">
          <span class="badge">話数 ${item.latestChapter || 0}</span>
          <span class="badge">最終更新 ${escapeHtml(item.lastup || "不明")}</span>
          <a class="text-button" href="${escapeHtml(item.url)}" target="_blank" rel="noopener" aria-label="${escapeHtml(`${item.title}を公式サイトで開く`)}">作品URL</a>
        </div>
        ${chips ? `<div class="tag-row">${chips}</div>` : ""}
        <p class="catalog-story" id="${storyId}">${escapeHtml(item.story || "あらすじはありません。")}</p>
        <button class="text-button story-toggle" type="button" data-story-toggle="${item.id}" aria-expanded="false" aria-controls="${storyId}" aria-label="${escapeHtml(`${item.title}のあらすじを開く`)}">
          あらすじを開く
        </button>
      </div>
      <button class="primary-button catalog-add-button" type="button" data-catalog-id="${item.id}" aria-label="${escapeHtml(addButtonLabel)}" ${alreadyAdded ? "disabled" : ""}>
        ${alreadyAdded ? "登録済み" : "本棚に追加"}
      </button>
    </article>
  `;
}

function getNarouMetaChips(item) {
  return [item.genre, item.keyword]
    .filter(Boolean)
    .flatMap((value) => String(value).split(/\s+/))
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function bindCatalogActions() {
  elements.catalogResults.querySelectorAll("[data-catalog-id]").forEach((button) => {
    button.addEventListener("click", () => addCatalogNovel(button.dataset.catalogId));
  });
  elements.catalogResults.querySelectorAll("[data-story-toggle]").forEach((button) => {
    button.addEventListener("click", () => toggleCatalogStory(button));
  });
}

function toggleCatalogStory(button) {
  const card = button.closest(".catalog-card");
  const expanded = button.getAttribute("aria-expanded") === "true";
  button.setAttribute("aria-expanded", String(!expanded));
  button.setAttribute("aria-label", expanded ? "あらすじを開く" : "あらすじを閉じる");
  card.classList.toggle("is-story-open", !expanded);
  button.textContent = expanded ? "あらすじを開く" : "あらすじを閉じる";
}

function addCatalogNovel(catalogId) {
  const item = state.catalogResults.find((catalogItem) => catalogItem.id === catalogId);
  if (!item || findDuplicateNovel(item)) return;

  const novel = createNovelFromNarouItem(item);
  state.novels.unshift(novel);
  saveState();
  render();
}

function createNovelFromNarouItem(item) {
  return createNovel({
    title: item.title,
    site: DEFAULT_SITE,
    ncode: item.ncode,
    author: item.author || item.writer,
    story: item.story,
    url: item.url,
    generalLastup: item.generalLastup || item.lastup,
    generalAllNo: item.generalAllNo ?? item.latestChapter,
    lastReadEpisode: 0,
    memo: `作者：${item.author || item.writer}\n${item.story}`,
    unread: toChapterNumber(item.generalAllNo ?? item.latestChapter) > 0,
  });
}

async function registerNovelFromUrl() {
  const url = elements.quickUrl.value.trim();
  if (!url) {
    showCatalogMessage("作品URLを入力してください。");
    return;
  }

  const site = detectSiteFromUrl(url);
  const ncode = extractNarouNcode(url);

  if (ncode) {
    try {
      const [item] = await fetchNarouNovelsByNcodes([ncode]);
      if (item) {
        addNarouItemFromUrl(item);
        return;
      }
    } catch (error) {
      console.warn("Narou URL registration failed", error);
    }
  }

  showForm({
    title: "",
    site,
    url,
    latestChapter: 0,
    readChapter: 0,
    memo: site === DEFAULT_SITE ? "API取得に失敗しました。タイトルを入力して保存してください。" : "API未対応サイトの外部リンク管理です。",
  }, { urlRegister: true });
  setFormError("タイトルだけ入力して保存できます。サイト種別はURLから判定しました。");
}

function addNarouItemFromUrl(item) {
  if (findDuplicateNovel(item)) {
    showCatalogMessage("この作品はすでに本棚に登録されています。");
    return;
  }

  const novel = createNovelFromNarouItem(item);
  state.novels.unshift(novel);
  elements.quickUrl.value = "";
  saveState();
  showCatalogMessage("小説家になろうAPIから作品情報を取得して本棚に追加しました。");
  render();
}

function showCatalogMessage(message) {
  state.catalogError = message;
  state.catalogHasSearched = true;
  renderCatalogResults();
}

function renderLibrary() {
  const novels = getFilteredNovels();
  renderBookmarkletStatus();
  elements.libraryEmpty.classList.toggle("is-hidden", novels.length > 0);
  elements.novelList.innerHTML = novels.map(renderNovelCard).join("");
  bindCardActions(elements.novelList);
}

function renderBookmarkletStatus() {
  const message = state.bookmarkletError || state.bookmarkletMessage;
  elements.bookmarkletStatus.textContent = message;
  elements.bookmarkletStatus.classList.toggle("is-hidden", !message);
  elements.bookmarkletStatus.classList.toggle("is-error", Boolean(state.bookmarkletError));
}

function renderUpdates() {
  const updates = getUpdatedNovels();
  renderUpdateCheckStatus();
  elements.checkUpdates.disabled = state.updateChecking;
  elements.checkUpdates.textContent = state.updateChecking ? "確認中..." : "更新確認";
  elements.updatesSummary.classList.toggle("is-hidden", updates.length === 0);
  elements.updatesSummary.innerHTML = renderUpdatesSummary(updates);
  elements.updatesEmpty.classList.toggle("is-hidden", updates.length > 0);
  elements.updatesList.innerHTML = updates.map(renderUpdateCard).join("");
  bindCardActions(elements.updatesList);
  initializeUpdatesSortable(updates);
}

function renderUpdateCheckStatus() {
  const message = state.updateCheckError || state.updateCheckMessage;
  elements.updateCheckStatus.textContent = message;
  elements.updateCheckStatus.classList.toggle("is-hidden", !message);
  elements.updateCheckStatus.classList.toggle("is-error", Boolean(state.updateCheckError));
}

async function checkNarouUpdates() {
  const targets = state.novels.filter(isNarouNovelWithNcode);
  if (targets.length === 0) {
    state.updateCheckError = "Nコードを持つ小説家になろう作品が本棚にありません。なろう検索から追加するか、なろう作品URLを登録してください。";
    state.updateCheckMessage = "";
    renderUpdates();
    return;
  }

  state.updateChecking = true;
  state.updateCheckError = "";
  state.updateCheckMessage = `${targets.length}件の更新を確認しています...`;
  renderUpdates();

  try {
    const latestItems = await fetchNarouNovelsByNcodes(targets.map((novel) => novel.ncode));
    const latestByNcode = new Map(latestItems.map((item) => [item.ncode, item]));
    const checkedAt = new Date().toISOString();
    let updatedCount = 0;
    let missingCount = 0;

    state.novels = state.novels.map((novel) => {
      if (!isNarouNovelWithNcode(novel)) return novel;
      const latestItem = latestByNcode.get(novel.ncode);
      if (!latestItem) {
        missingCount += 1;
        return { ...novel, lastCheckedAt: checkedAt };
      }

      const patch = createNarouUpdatePatch(novel, latestItem, checkedAt);
      if (patch.hasUpdate) updatedCount += 1;
      delete patch.hasUpdate;
      return { ...novel, ...patch };
    });

    state.updateCheckMessage = `更新確認完了：更新あり ${updatedCount}件 / 対象 ${targets.length}件${missingCount ? `（取得なし ${missingCount}件）` : ""}`;
    state.updateCheckError = "";
    saveState();
  } catch (error) {
    console.warn("Narou update check failed", error);
    state.updateCheckError = "更新確認に失敗しました。なろうAPIの混雑、通信制限、またはJSONP読み込み失敗の可能性があります。";
    state.updateCheckMessage = "";
  } finally {
    state.updateChecking = false;
    render();
  }
}

function isNarouNovelWithNcode(novel) {
  return Boolean(novel.ncode);
}

function isExternalManagedNovel(novel) {
  return !isNarouNovelWithNcode(novel);
}

function createNarouUpdatePatch(novel, latestItem, checkedAt) {
  const previousChapter = toChapterNumber(novel.generalAllNo ?? novel.latestChapter);
  const latestChapter = toChapterNumber(latestItem.generalAllNo ?? latestItem.latestChapter);
  const previousLastup = novel.generalLastup || novel.updatedAt || "";
  const latestLastup = latestItem.generalLastup || latestItem.lastup || "";
  const previousUpdatedAt = getTimestamp(toIsoDateOrNow(previousLastup));
  const latestUpdatedIso = latestLastup ? toIsoDateOrNow(latestLastup) : novel.updatedAt;
  const latestUpdatedAt = getTimestamp(latestUpdatedIso);
  const chapterDiff = Math.max(0, latestChapter - previousChapter);
  const hasUpdate = chapterDiff > 0 || latestLastup !== previousLastup || latestUpdatedAt > previousUpdatedAt;
  const unread = hasUpdate || latestChapter > toChapterNumber(novel.lastReadEpisode ?? novel.readChapter) || novel.unread;

  return {
    hasUpdate,
    title: latestItem.title || novel.title,
    site: DEFAULT_SITE,
    author: latestItem.author || latestItem.writer || novel.author,
    story: latestItem.story || novel.story,
    url: latestItem.url || novel.url,
    ncode: latestItem.ncode || novel.ncode,
    generalLastup: latestLastup || previousLastup,
    generalAllNo: latestChapter,
    latestChapter,
    latest: formatChapter(latestChapter),
    updatedAt: latestUpdatedIso,
    unread,
    lastCheckDiff: chapterDiff,
    lastCheckedAt: checkedAt,
  };
}

function getUpdatedNovels() {
  const orderIndex = new Map(state.updateOrder.map((id, index) => [id, index]));
  return state.novels
    .filter((novel) => novel.unread)
    .sort((a, b) => compareByUpdatePriority(a, b, orderIndex));
}

function compareByUpdatePriority(a, b, orderIndex) {
  const aIndex = orderIndex.has(a.id) ? orderIndex.get(a.id) : Number.POSITIVE_INFINITY;
  const bIndex = orderIndex.has(b.id) ? orderIndex.get(b.id) : Number.POSITIVE_INFINITY;
  if (aIndex !== bIndex) return aIndex - bIndex;
  return compareByUpdateDate(a, b);
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
    <span class="badge">未読: ${totalDiff}話</span>
    <span class="muted">ドラッグで優先順を変更できます</span>
  `;
}

function renderUpdateCard(novel) {
  const unreadCount = getUnreadChapterCount(novel);
  const nextChapter = getNextReadableChapter(novel);
  const diffText = getUpdateDiffText(novel, unreadCount);
  const checkDiffText = novel.lastCheckDiff ? `API差分 +${novel.lastCheckDiff}話` : "";
  const continueButton = novel.url
    ? renderContinueLink(novel)
    : "";

  return `
    <article class="update-card" data-id="${novel.id}">
      <button class="drag-handle" type="button" aria-label="${escapeHtml(`${novel.title}を並び替える`)}">⋮⋮</button>
      <div class="update-main">
        <div class="update-title-row">
          <span class="new-label">NEW</span>
          <div>
            <h3 class="novel-title">${escapeHtml(novel.title)}</h3>
            <p class="update-time">最終更新：${escapeHtml(formatUpdatedAt(novel.generalLastup || novel.updatedAt))}</p>
          </div>
        </div>
        <div class="meta-row">
          <span class="badge">${escapeHtml(novel.site)}</span>
          ${novel.generalAllNo ? `<span class="badge">更新 ${novel.generalAllNo}話</span>` : ""}
          ${unreadCount ? `<span class="badge unread">未読: ${unreadCount}話</span>` : ""}
          ${checkDiffText ? `<span class="badge unread">${escapeHtml(checkDiffText)}</span>` : ""}
          <span class="badge">次 ${nextChapter}話</span>
        </div>
        <p class="update-diff">${escapeHtml(diffText)}</p>
        ${novel.lastViewedAt ? `<p class="update-time">最終閲覧：${escapeHtml(formatUpdatedAt(novel.lastViewedAt))}</p>` : ""}
      </div>
      <div class="card-actions update-actions">
        ${continueButton}
        <button class="text-button" type="button" data-action="read" aria-label="${escapeHtml(`${novel.title}を既読にする`)}">既読</button>
        <button class="text-button" type="button" data-action="edit" aria-label="${escapeHtml(`${novel.title}を編集する`)}">編集</button>
      </div>
    </article>
  `;
}

function initializeUpdatesSortable(updates) {
  if (updatesSortable) {
    updatesSortable.destroy();
    updatesSortable = null;
  }

  if (!updates.length || typeof Sortable === "undefined") return;

  elements.updatesList.setAttribute("aria-label", "更新リスト。ドラッグで優先順に並び替えできます。");
  updatesSortable = Sortable.create(elements.updatesList, {
    animation: 150,
    handle: ".drag-handle",
    draggable: ".update-card",
    ghostClass: "update-card-ghost",
    chosenClass: "update-card-chosen",
    dragClass: "update-card-drag",
    onEnd: saveUpdateOrderFromDom,
  });
}

function saveUpdateOrderFromDom() {
  const visibleIds = [...elements.updatesList.querySelectorAll(".update-card")]
    .map((card) => card.dataset.id)
    .filter(Boolean);
  const unreadIds = new Set(state.novels.filter((novel) => novel.unread).map((novel) => novel.id));
  const remainingIds = state.updateOrder.filter((id) => unreadIds.has(id) && !visibleIds.includes(id));
  state.updateOrder = [...visibleIds, ...remainingIds];
  saveState();
  renderUpdates();
}

function getUpdateDiffText(novel, unreadCount) {
  const latestEpisode = toChapterNumber(novel.generalAllNo ?? novel.latestChapter);
  const lastReadEpisode = toChapterNumber(novel.lastReadEpisode ?? novel.readChapter);
  if (!latestEpisode) return "更新話数は未設定です";
  if (unreadCount > 0) return `${lastReadEpisode}話から${latestEpisode}話まで、${unreadCount}話分の更新があります`;
  return `${latestEpisode}話まで確認済みです`;
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
            ${isExternalManagedNovel(novel) ? '<span class="badge">外部リンク管理</span>' : ""}
            ${novel.unread ? '<span class="badge unread">更新あり</span>' : ""}
            ${novel.unread ? '<span class="new-label">NEW</span>' : ""}
            ${novel.generalAllNo ? `<span class="badge">更新 ${novel.generalAllNo}話</span>` : ""}
            ${novel.ncode ? `<span class="badge">読了 ${novel.lastReadEpisode || 0} / 全 ${novel.generalAllNo || 0}話</span>` : ""}
            ${unreadCount ? `<span class="badge unread">未読: ${unreadCount}話</span>` : ""}
            ${novel.lastCheckDiff ? `<span class="badge unread">差分 +${novel.lastCheckDiff}話</span>` : ""}
            ${!novel.ncode && novel.lastReadEpisode ? `<span class="badge">読了 ${novel.lastReadEpisode}話</span>` : ""}
            ${novel.ncode ? `<span class="badge">${escapeHtml(novel.ncode)}</span>` : ""}
            ${novel.lastReadEpisodeId ? '<span class="badge">読了ID保存済み</span>' : ""}
          </div>
        </div>
      </div>
      ${progressText ? `<p class="muted">${escapeHtml(progressText)}</p>` : ""}
      ${viewedText ? `<p class="muted">${escapeHtml(viewedText)}</p>` : ""}
      ${novel.author ? `<p class="muted">作者：${escapeHtml(novel.author)}</p>` : ""}
      ${novel.memo ? `<p>${escapeHtml(novel.memo)}</p>` : ""}
      <div class="card-actions">
        ${urlButton}
        ${novel.ncode ? `<button class="text-button" type="button" data-action="reader" aria-label="${escapeHtml(`${novel.title}の話一覧を開く`)}">話一覧</button>` : ""}
        <button class="text-button" type="button" data-action="read" aria-label="${escapeHtml(`${novel.title}を既読にする`)}">既読</button>
        <button class="text-button" type="button" data-action="edit" aria-label="${escapeHtml(`${novel.title}を編集する`)}">編集</button>
        <button class="text-button" type="button" data-action="delete" aria-label="${escapeHtml(`${novel.title}を削除する`)}">削除</button>
      </div>
    </article>
  `;
}

function renderContinueLink(novel) {
  const chapter = getNextReadableChapter(novel);
  return `
    <a class="text-button" href="${escapeHtml(getContinueUrl(novel, chapter))}" target="_blank" rel="noopener" aria-label="${escapeHtml(`${novel.title}の${chapter}話を公式サイトで開く`)}">
      続きから読む
    </a>
  `;
}

function openReader(novel) {
  if (!novel.ncode) return;
  state.readerNovelId = novel.id;
  switchView("reader");
  renderReader();
}

function renderReader() {
  if (!elements.readerPanel) return;
  const novel = state.novels.find((item) => item.id === state.readerNovelId);
  if (!novel) {
    elements.readerPanel.innerHTML = renderReaderEmpty();
    bindReaderActions();
    return;
  }

  if (!novel.ncode) {
    elements.readerPanel.innerHTML = renderExternalReaderNotice(novel);
    bindReaderActions();
    return;
  }

  const model = NovelReader.createReaderModel(novel);
  elements.readerPanel.innerHTML = renderReaderPanel(model);
  bindReaderActions();
}

function renderReaderEmpty() {
  return `
    <div class="reader-header">
      <button class="ghost-button" type="button" data-reader-action="back" aria-label="本棚へ戻る">本棚へ戻る</button>
    </div>
    <div class="empty-state">本棚から作品を選択してください。</div>
  `;
}

function renderExternalReaderNotice(novel) {
  return `
    <div class="reader-header">
      <button class="ghost-button" type="button" data-reader-action="back" aria-label="本棚へ戻る">本棚へ戻る</button>
    </div>
    <article class="reader-summary">
      <h2>${escapeHtml(novel.title)}</h2>
      <p class="muted">この作品は外部リンク管理です。自動話一覧は小説家になろう作品のみ対応しています。</p>
      ${novel.url ? `<a class="primary-button reader-official-link" href="${escapeHtml(novel.url)}" target="_blank" rel="noopener" aria-label="${escapeHtml(`${novel.title}を公式サイトで開く`)}">公式サイトで開く</a>` : ""}
    </article>
  `;
}

function renderReaderPanel(model) {
  return `
    <div class="reader-header">
      <button class="ghost-button" type="button" data-reader-action="back" aria-label="本棚へ戻る">本棚へ戻る</button>
      <a class="text-button" href="${escapeHtml(model.url)}" target="_blank" rel="noopener" aria-label="${escapeHtml(`${model.title}の公式作品ページを開く`)}">公式作品ページ</a>
    </div>
    <article class="reader-summary">
      <p class="ranking-source">${escapeHtml(model.site)}</p>
      <h2>${escapeHtml(model.title)}</h2>
      ${model.author ? `<p class="muted">作者：${escapeHtml(model.author)}</p>` : ""}
      <div class="meta-row">
        <span class="badge">最終更新 ${escapeHtml(model.generalLastup || "不明")}</span>
        <span class="badge">全 ${model.totalEpisodes}話</span>
        <span class="badge">読了 ${model.lastReadEpisode} / 全 ${model.totalEpisodes}話</span>
        <span class="badge unread">未読: ${model.unreadEpisodes}話</span>
      </div>
      <p class="muted">話一覧から開いた話数だけ読了位置として保存します。本文は保存しません。</p>
      <p class="reader-story">${escapeHtml(model.story || "あらすじはありません。")}</p>
    </article>
    <section class="episode-section" aria-labelledby="episodeListTitle">
      <h3 id="episodeListTitle">話一覧</h3>
      <div class="episode-list">
        ${model.episodes.map(renderEpisodeItem).join("")}
      </div>
    </section>
  `;
}

function renderEpisodeItem(item) {
  return `
    <a class="episode-link${item.read ? " is-read" : ""}" href="${escapeHtml(item.url)}" target="_blank" rel="noopener" data-reader-episode="${item.episode}" aria-label="${escapeHtml(`${item.title}を公式サイトで開き、読了位置を更新する`)}">
      <span>${escapeHtml(item.title)}</span>
      <span>${item.read ? "読了" : "未読"}</span>
    </a>
  `;
}

function bindReaderActions() {
  elements.readerPanel.querySelectorAll("[data-reader-action='back']").forEach((button) => {
    button.addEventListener("click", () => switchView("library"));
  });
  elements.readerPanel.querySelectorAll("[data-reader-episode]").forEach((link) => {
    link.addEventListener("click", () => markEpisodeRead(Number(link.dataset.readerEpisode)));
  });
}

function markEpisodeRead(episode) {
  const novel = state.novels.find((item) => item.id === state.readerNovelId);
  if (!novel || !episode) return;
  const readChapter = Math.max(toChapterNumber(novel.lastReadEpisode ?? novel.readChapter), episode);
  updateNovel(novel.id, {
    lastReadEpisode: readChapter,
    readChapter,
    position: formatChapter(readChapter),
    lastOpenedChapter: episode,
    lastViewedAt: new Date().toISOString(),
    unread: (novel.generalAllNo || novel.latestChapter || 0) > readChapter,
    lastCheckDiff: (novel.generalAllNo || novel.latestChapter || 0) > readChapter ? novel.lastCheckDiff : 0,
  });
}

function getUnreadChapterCount(novel) {
  return Math.max(0, Number(novel.generalAllNo ?? novel.latestChapter ?? 0) - Number(novel.lastReadEpisode ?? novel.readChapter ?? 0));
}

function getProgressText(novel, unreadCount) {
  const latestEpisode = toChapterNumber(novel.generalAllNo ?? novel.latestChapter);
  const lastReadEpisode = toChapterNumber(novel.lastReadEpisode ?? novel.readChapter);
  if (!latestEpisode && !lastReadEpisode) return isExternalManagedNovel(novel) ? "API未対応サイトのため、更新は外部リンクで確認します" : "";
  if (unreadCount > 0) return `未読: ${unreadCount}話（${lastReadEpisode}話 → ${latestEpisode}話）`;
  if (lastReadEpisode > 0) return `最新話まで読了済み（${lastReadEpisode}話）`;
  return `更新話数：${latestEpisode}話`;
}

function getViewedText(novel) {
  if (!novel.lastViewedAt) return novel.lastReadEpisodeId ? `読了エピソードID：${novel.lastReadEpisodeId}` : "";
  const chapter = novel.lastOpenedChapter ? ` / 最後に開いた話：${novel.lastOpenedChapter}話` : "";
  const episodeId = novel.lastReadEpisodeId ? ` / 読了エピソードID：${novel.lastReadEpisodeId}` : "";
  return `最終閲覧：${formatUpdatedAt(novel.lastViewedAt)}${chapter}${episodeId}`;
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
    case "reader":
      openReader(novel);
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

function getNextReadableChapter(novel) {
  const latestChapter = novel.generalAllNo || novel.latestChapter || 0;
  const readChapter = novel.lastReadEpisode || novel.readChapter || 0;
  if (!latestChapter) return readChapter || 1;
  return Math.min(latestChapter, readChapter + 1 || 1);
}

function getContinueUrl(novel, chapter) {
  if (novel.ncode && novel.site === DEFAULT_SITE) {
    return `https://ncode.syosetu.com/${novel.ncode.toLowerCase()}/${chapter}/`;
  }
  return novel.url || SITE_HOME_URLS[novel.site] || "#";
}

function markNovelRead(novel) {
  const readChapter = getReadableLatestChapter(novel);
  updateNovel(novel.id, {
    lastReadEpisode: readChapter,
    readChapter,
    position: formatChapter(readChapter),
    unread: false,
    lastCheckDiff: 0,
  });
}

function getReadableLatestChapter(novel) {
  return Math.max(novel.lastReadEpisode || novel.readChapter || 0, novel.generalAllNo || novel.latestChapter || 0);
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
      lastReadEpisode: readChapter,
      readChapter,
      position: formatChapter(readChapter),
      unread: false,
      lastCheckDiff: 0,
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
  const latestEpisode = novel.generalAllNo || novel.latestChapter || 0;

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
          <span class="badge">更新 ${latestEpisode}話</span>
          <span class="badge unread">未読: ${unreadCount}話</span>
          <span class="badge">次 ${nextChapter}話</span>
        </div>
        <p class="update-diff">${escapeHtml(getUpdateDiffText(novel, unreadCount))}</p>
        <p class="update-time">最終更新：${escapeHtml(formatUpdatedAt(novel.generalLastup || novel.updatedAt))}</p>
        ${novel.lastViewedAt ? `<p class="update-time">最終巡回：${escapeHtml(formatUpdatedAt(novel.lastViewedAt))}</p>` : ""}
        <div class="card-actions update-actions">
          ${continueButton}
          <button class="text-button" type="button" data-action="read" aria-label="${escapeHtml(`${novel.title}を既読にする`)}">既読</button>
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
