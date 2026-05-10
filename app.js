const STORAGE_KEY = "yomikaze-state-v1";

const SITE_PATTERNS = [
  { name: "小説家になろう", pattern: /ncode\.syosetu\.com|syosetu\.com/i },
  { name: "カクヨム", pattern: /kakuyomu\.jp/i },
  { name: "ハーメルン", pattern: /syosetu\.org/i },
  { name: "Arcadia", pattern: /mai-net\.net/i },
  { name: "暁", pattern: /akatsuki-novels\.com/i },
  { name: "ノベルアップ+", pattern: /novelup\.plus/i },
  { name: "pixiv小説", pattern: /pixiv\.net\/novel/i }
];

const STATUS_LABELS = {
  reading: "読書中",
  queued: "あとで読む",
  finished: "読了",
  paused: "保留"
};

const DEFAULT_STATE = {
  books: [],
  selectedBookId: null,
  settings: {
    proxy: "",
    openMode: "tab",
    notifications: false,
    cacheTitle: false
  }
};

let state = loadState();

const elements = {
  navItems: document.querySelectorAll(".nav-item"),
  views: {
    library: document.querySelector("#library-view"),
    updates: document.querySelector("#updates-view"),
    reader: document.querySelector("#reader-view"),
    settings: document.querySelector("#settings-view")
  },
  title: document.querySelector("#view-title"),
  bookGrid: document.querySelector("#book-grid"),
  emptyLibrary: document.querySelector("#empty-library"),
  updateList: document.querySelector("#update-list"),
  readerList: document.querySelector("#reader-list"),
  readerForm: document.querySelector("#reader-form"),
  readerTitle: document.querySelector("#reader-title"),
  readerSubtitle: document.querySelector("#reader-subtitle"),
  readerPosition: document.querySelector("#reader-position"),
  readerNote: document.querySelector("#reader-note"),
  readerOpenOriginal: document.querySelector("#reader-open-original"),
  search: document.querySelector("#search-input"),
  siteFilter: document.querySelector("#filter-site"),
  statusFilter: document.querySelector("#filter-status"),
  metricTotal: document.querySelector("#metric-total"),
  metricUnread: document.querySelector("#metric-unread"),
  dialog: document.querySelector("#book-dialog"),
  bookForm: document.querySelector("#book-form"),
  bookId: document.querySelector("#book-id"),
  bookUrl: document.querySelector("#book-url"),
  bookTitle: document.querySelector("#book-title"),
  bookSite: document.querySelector("#book-site"),
  bookStatus: document.querySelector("#book-status"),
  bookRss: document.querySelector("#book-rss"),
  bookTags: document.querySelector("#book-tags"),
  settingsForm: document.querySelector("#settings-form"),
  settingProxy: document.querySelector("#setting-proxy"),
  settingOpenMode: document.querySelector("#setting-open-mode"),
  settingNotifications: document.querySelector("#setting-notifications"),
  settingCacheTitle: document.querySelector("#setting-cache-title"),
  exportData: document.querySelector("#export-data"),
  importData: document.querySelector("#import-data"),
  checkAll: document.querySelector("#check-all"),
  toast: document.querySelector("#toast")
};

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(stored);
    return {
      ...structuredClone(DEFAULT_STATE),
      ...parsed,
      settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) },
      books: Array.isArray(parsed.books) ? parsed.books : []
    };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeUrl(url) {
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function inferSite(url) {
  const found = SITE_PATTERNS.find((site) => site.pattern.test(url));
  if (found) return found.name;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "未分類";
  }
}

function inferTitle(url) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    return decodeURIComponent(parts.at(-1) || parsed.hostname);
  } catch {
    return "無題";
  }
}

function inferRss(url) {
  const kakuyomu = url.match(/kakuyomu\.jp\/works\/(\d+)/i);
  if (kakuyomu) return `https://kakuyomu.jp/works/${kakuyomu[1]}.rss`;
  return "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => elements.toast.classList.remove("visible"), 3000);
}

function setView(viewName) {
  Object.entries(elements.views).forEach(([name, view]) => {
    view.classList.toggle("active", name === viewName);
  });
  document.querySelectorAll("[data-view-section]").forEach((section) => {
    section.hidden = section.dataset.viewSection !== viewName;
  });
  elements.navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.view === viewName);
  });
  elements.title.textContent = {
    library: "ライブラリ",
    updates: "更新",
    reader: "読書メモ",
    settings: "設定"
  }[viewName];
}

function filteredBooks() {
  const query = elements.search.value.trim().toLowerCase();
  const site = elements.siteFilter.value;
  const status = elements.statusFilter.value;
  return state.books.filter((book) => {
    const haystack = `${book.title} ${book.site} ${(book.tags || []).join(" ")}`.toLowerCase();
    return (!query || haystack.includes(query))
      && (!site || book.site === site)
      && (!status || book.status === status);
  });
}

function render() {
  renderMetrics();
  renderFilters();
  renderLibrary();
  renderUpdates();
  renderReaderList();
  renderSettings();
}

function renderMetrics() {
  elements.metricTotal.textContent = state.books.length;
  elements.metricUnread.textContent = state.books.filter((book) => book.hasUpdate).length;
}

function renderFilters() {
  const current = elements.siteFilter.value;
  const sites = [...new Set(state.books.map((book) => book.site).filter(Boolean))].sort();
  elements.siteFilter.innerHTML = '<option value="">すべてのサイト</option>'
    + sites.map((site) => `<option value="${escapeHtml(site)}">${escapeHtml(site)}</option>`).join("");
  elements.siteFilter.value = sites.includes(current) ? current : "";
}

function renderLibrary() {
  const books = filteredBooks();
  elements.emptyLibrary.classList.toggle("visible", state.books.length === 0);
  elements.bookGrid.innerHTML = books.map((book) => `
    <article class="book-card" data-id="${book.id}">
      <div class="book-title-line">
        <h3>${escapeHtml(book.title)}</h3>
        <button class="icon-button favorite ${book.favorite ? "active" : ""}" title="お気に入り" data-action="favorite" type="button">${book.favorite ? "★" : "☆"}</button>
      </div>
      <div class="card-meta">
        <span class="site-badge">${escapeHtml(book.site)}</span>
        <span class="status-pill">${STATUS_LABELS[book.status] || book.status}</span>
        ${book.hasUpdate ? '<span class="status-pill">更新あり</span>' : ""}
      </div>
      <div class="tag-row">
        ${(book.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
      </div>
      <p>読了位置: ${escapeHtml(book.position || "未記録")}</p>
      <div class="card-actions">
        <button data-action="open" type="button">開く</button>
        <button data-action="mark-read" type="button">確認済</button>
        <button data-action="edit" type="button">編集</button>
        <button data-action="delete" type="button">削除</button>
      </div>
    </article>
  `).join("");
}

function renderUpdates() {
  const sorted = [...state.books].sort((a, b) => Number(b.hasUpdate) - Number(a.hasUpdate));
  elements.updateList.innerHTML = sorted.length ? sorted.map((book) => `
    <article class="update-item" data-id="${book.id}">
      <div>
        <h4>${escapeHtml(book.title)}</h4>
        <p>${escapeHtml(book.latestTitle || "更新情報なし")} / ${escapeHtml(book.checkedAt ? new Date(book.checkedAt).toLocaleString() : "未確認")}</p>
      </div>
      <div class="form-row">
        <button class="ghost-button" data-action="check-one" type="button">確認</button>
        <button class="primary-button" data-action="open" type="button">原典</button>
      </div>
    </article>
  `).join("") : '<div class="empty-state visible"><h3>登録作品がありません</h3><p>RSS URLを登録すると更新確認できます。</p></div>';
}

function renderReaderList() {
  if (!state.selectedBookId && state.books[0]) state.selectedBookId = state.books[0].id;
  elements.readerList.innerHTML = state.books.map((book) => `
    <button class="reader-item ${book.id === state.selectedBookId ? "active" : ""}" data-id="${book.id}" data-action="select-reader" type="button">
      <span>
        <h4>${escapeHtml(book.title)}</h4>
        <p>${escapeHtml(book.position || "未記録")}</p>
      </span>
    </button>
  `).join("");
  const selected = getSelectedBook();
  elements.readerTitle.textContent = selected ? selected.title : "作品を選択";
  elements.readerSubtitle.textContent = selected ? selected.url : "読了位置とメモは端末内に保存されます。";
  elements.readerPosition.value = selected?.position || "";
  elements.readerNote.value = selected?.note || "";
  elements.readerForm.querySelectorAll("input, textarea, button").forEach((control) => {
    control.disabled = !selected;
  });
}

function renderSettings() {
  elements.settingProxy.value = state.settings.proxy;
  elements.settingOpenMode.value = state.settings.openMode;
  elements.settingNotifications.checked = state.settings.notifications;
  elements.settingCacheTitle.checked = state.settings.cacheTitle;
}

function getBookFromEvent(event) {
  const card = event.target.closest("[data-id]");
  return state.books.find((book) => book.id === card?.dataset.id);
}

function getSelectedBook() {
  return state.books.find((book) => book.id === state.selectedBookId);
}

function openBook(book) {
  if (!book?.url) return;
  book.hasUpdate = false;
  book.lastOpenedAt = new Date().toISOString();
  saveState();
  render();
  if (state.settings.openMode === "current") {
    window.location.href = book.url;
  } else {
    window.open(book.url, "_blank", "noopener,noreferrer");
  }
}

function openBookDialog(book) {
  elements.bookForm.reset();
  elements.bookId.value = book?.id || "";
  elements.bookUrl.value = book?.url || "";
  elements.bookTitle.value = book?.title || "";
  elements.bookSite.value = book?.site || "";
  elements.bookStatus.value = book?.status || "reading";
  elements.bookRss.value = book?.rssUrl || "";
  elements.bookTags.value = (book?.tags || []).join(", ");
  document.querySelector("#dialog-title").textContent = book ? "登録内容を編集" : "URL登録";
  elements.dialog.showModal();
}

function closeBookDialog() {
  elements.dialog.close();
}

async function checkBook(book) {
  if (!book.rssUrl) {
    book.checkedAt = new Date().toISOString();
    return { book, changed: false, message: "RSS URLが未設定です" };
  }
  const feedUrl = state.settings.proxy ? `${state.settings.proxy}${encodeURIComponent(book.rssUrl)}` : book.rssUrl;
  const response = await fetch(feedUrl);
  if (!response.ok) throw new Error(`RSS取得に失敗しました (${response.status})`);
  const xml = await response.text();
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) throw new Error("RSSの解析に失敗しました");
  const entry = doc.querySelector("item, entry");
  const latestTitle = entry?.querySelector("title")?.textContent?.trim() || "";
  const latestLink = entry?.querySelector("link")?.getAttribute("href")
    || entry?.querySelector("link")?.textContent?.trim()
    || "";
  const latestPublished = entry?.querySelector("pubDate, published, updated")?.textContent?.trim() || "";
  const latestKey = `${latestTitle}|${latestLink}|${latestPublished}`;
  const changed = Boolean(book.latestKey && book.latestKey !== latestKey);
  book.latestTitle = latestTitle || book.latestTitle || "フィード取得済み";
  book.latestLink = latestLink || book.latestLink || "";
  book.latestPublished = latestPublished;
  book.latestKey = latestKey || book.latestKey || "";
  book.checkedAt = new Date().toISOString();
  book.hasUpdate = changed || book.hasUpdate;
  return { book, changed };
}

async function checkBooks(books) {
  let changedCount = 0;
  let failedCount = 0;
  for (const book of books) {
    try {
      const result = await checkBook(book);
      if (result.changed) changedCount += 1;
    } catch (error) {
      failedCount += 1;
      book.checkedAt = new Date().toISOString();
      book.lastError = error.message;
    }
  }
  saveState();
  render();
  if (changedCount && state.settings.notifications) notifyUpdates(changedCount);
  showToast(`RSS確認完了: 更新 ${changedCount} 件 / 失敗 ${failedCount} 件`);
}

async function notifyUpdates(count) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") await Notification.requestPermission();
  if (Notification.permission === "granted") {
    new Notification("Yomikaze", { body: `${count}件の更新があります` });
  }
}

function exportState() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `yomikaze-backup-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function importState(file) {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      state = {
        ...structuredClone(DEFAULT_STATE),
        ...parsed,
        settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) },
        books: Array.isArray(parsed.books) ? parsed.books : []
      };
      saveState();
      render();
      showToast("データを読み込みました");
    } catch {
      showToast("JSONを読み込めませんでした");
    }
  });
  reader.readAsText(file);
}

elements.navItems.forEach((item) => {
  item.addEventListener("click", () => setView(item.dataset.view));
});

document.addEventListener("click", (event) => {
  const action = event.target.dataset.action;
  if (action === "open-add") openBookDialog();
  if (action === "close-dialog") closeBookDialog();
});

document.querySelector("#open-add-dialog").addEventListener("click", () => openBookDialog());

elements.bookUrl.addEventListener("blur", () => {
  const url = normalizeUrl(elements.bookUrl.value);
  if (!elements.bookUrl.value) return;
  elements.bookUrl.value = url;
  if (!elements.bookSite.value) elements.bookSite.value = inferSite(url);
  if (!elements.bookTitle.value) elements.bookTitle.value = inferTitle(url);
  if (!elements.bookRss.value) elements.bookRss.value = inferRss(url);
});

elements.bookForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const url = normalizeUrl(elements.bookUrl.value);
  const id = elements.bookId.value || uid();
  const existing = state.books.find((book) => book.id === id);
  const next = {
    ...(existing || {}),
    id,
    url,
    title: elements.bookTitle.value.trim() || inferTitle(url),
    site: elements.bookSite.value.trim() || inferSite(url),
    status: elements.bookStatus.value,
    rssUrl: elements.bookRss.value.trim(),
    tags: elements.bookTags.value.split(",").map((tag) => tag.trim()).filter(Boolean),
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    favorite: existing?.favorite || false,
    position: existing?.position || "",
    note: existing?.note || ""
  };
  if (existing) {
    state.books = state.books.map((book) => book.id === id ? next : book);
  } else {
    state.books.unshift(next);
    state.selectedBookId = next.id;
  }
  saveState();
  closeBookDialog();
  render();
  showToast("登録内容を保存しました");
});

elements.bookGrid.addEventListener("click", (event) => {
  const action = event.target.dataset.action;
  if (!action) return;
  const book = getBookFromEvent(event);
  if (!book) return;
  if (action === "open") openBook(book);
  if (action === "favorite") {
    book.favorite = !book.favorite;
    saveState();
    render();
  }
  if (action === "mark-read") {
    book.hasUpdate = false;
    saveState();
    render();
  }
  if (action === "edit") openBookDialog(book);
  if (action === "delete" && confirm(`「${book.title}」を削除しますか？`)) {
    state.books = state.books.filter((item) => item.id !== book.id);
    if (state.selectedBookId === book.id) state.selectedBookId = state.books[0]?.id || null;
    saveState();
    render();
  }
});

elements.updateList.addEventListener("click", (event) => {
  const action = event.target.dataset.action;
  const book = getBookFromEvent(event);
  if (!book) return;
  if (action === "open") openBook(book);
  if (action === "check-one") checkBooks([book]);
});

elements.readerList.addEventListener("click", (event) => {
  const book = getBookFromEvent(event);
  if (!book) return;
  state.selectedBookId = book.id;
  saveState();
  renderReaderList();
});

elements.readerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const selected = getSelectedBook();
  if (!selected) return;
  selected.position = elements.readerPosition.value.trim();
  selected.note = elements.readerNote.value.trim();
  selected.updatedAt = new Date().toISOString();
  saveState();
  render();
  showToast("読書メモを保存しました");
});

elements.readerOpenOriginal.addEventListener("click", () => openBook(getSelectedBook()));
elements.search.addEventListener("input", renderLibrary);
elements.siteFilter.addEventListener("change", renderLibrary);
elements.statusFilter.addEventListener("change", renderLibrary);
elements.checkAll.addEventListener("click", () => checkBooks(state.books));

elements.settingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  state.settings = {
    proxy: elements.settingProxy.value.trim(),
    openMode: elements.settingOpenMode.value,
    notifications: elements.settingNotifications.checked,
    cacheTitle: elements.settingCacheTitle.checked
  };
  if (state.settings.notifications && "Notification" in window && Notification.permission === "default") {
    await Notification.requestPermission();
  }
  saveState();
  renderSettings();
  showToast("設定を保存しました");
});

elements.exportData.addEventListener("click", exportState);
elements.importData.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (file) importState(file);
  event.target.value = "";
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

render();
setView("library");
