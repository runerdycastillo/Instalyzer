async function loadJson(path) {
  const cacheBuster = path.includes("?") ? "&" : "?";
  const res = await fetch(`${path}${cacheBuster}t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

function norm(s) {
  return String(s || "").trim().replace(/^@/, "").toLowerCase();
}

function unique(arr) {
  return [...new Set(arr)];
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sortUsernames(arr, order, followedAtByUsername = {}) {
  const sorted = [...arr];

  if (order === "latest" || order === "earliest") {
    sorted.sort((a, b) => {
      const ta = followedAtByUsername[a] || 0;
      const tb = followedAtByUsername[b] || 0;
      if (ta === tb) return a.localeCompare(b);
      return order === "latest" ? tb - ta : ta - tb;
    });
    return sorted;
  }

  sorted.sort((a, b) => a.localeCompare(b));
  return order === "za" ? sorted.reverse() : sorted;
}

const USERNAME_RE = /^[a-z0-9._]{1,30}$/;
const STORAGE_KEY_UNFOLLOWED = "ig_unfollowed_usernames_v1";
const STORAGE_KEY_TBD = "ig_tbd_usernames_v1";
const STORAGE_KEY_PNF = "ig_page_not_found_usernames_v1";
const STORAGE_KEY_RECENT_VISITS = "ig_recent_visit_timestamps_v1";
const STORAGE_KEY_PINNED = "ig_pinned_pending_usernames_v1";
const STORAGE_KEY_THEME = "ig_theme_v1";
const STORAGE_KEY_UNFOLLOW_EVENTS = "ig_unfollow_events_v1";
const STORAGE_KEY_SAFETY_MODE = "ig_safety_mode_v1";
const STORAGE_KEY_STRICT_COOLDOWN_UNTIL = "ig_strict_cooldown_until_v1";
const STORAGE_KEY_UPLOADED_DATA = "ff_uploaded_instagram_data_v1";

const LIMIT_90_MIN = 10;
const LIMIT_24_HOUR = 60;
const WINDOW_90_MIN_MS = 90 * 60 * 1000;
const WINDOW_24_HOUR_MS = 24 * 60 * 60 * 1000;
const RECENT_VISIT_WINDOW_MS = 15 * 60 * 1000;
const SEARCH_DEBOUNCE_MS = 180;
const SEARCH_SKELETON_MIN_MS = 650;
const SEARCH_SKELETON_ROWS = 7;
let safetyTickerId = null;
let searchDebounceTimer = null;

function loadSet(key) {
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveSet(key, set) {
  localStorage.setItem(key, JSON.stringify([...set]));
}

function loadVisitMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECENT_VISITS);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const entries = Object.entries(parsed).filter(([username, ts]) =>
      USERNAME_RE.test(username) && Number.isFinite(Number(ts)) && Number(ts) > 0
    );
    return Object.fromEntries(entries.map(([username, ts]) => [username, Number(ts)]));
  } catch {
    return {};
  }
}

function saveVisitMap(visitMap) {
  localStorage.setItem(STORAGE_KEY_RECENT_VISITS, JSON.stringify(visitMap));
}

function pruneVisitMap(visitMap, now = Date.now()) {
  return Object.fromEntries(
    Object.entries(visitMap).filter(([, ts]) => now - Number(ts) <= RECENT_VISIT_WINDOW_MS)
  );
}

function getRecentVisitedSet(visitMap, now = Date.now()) {
  const pruned = pruneVisitMap(visitMap, now);
  return new Set(Object.keys(pruned));
}

function loadUnfollowEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_UNFOLLOW_EVENTS);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr)
      ? arr.map((v) => Number(v)).filter((n) => Number.isFinite(n) && n > 0)
      : [];
  } catch {
    return [];
  }
}

function saveUnfollowEvents(events) {
  localStorage.setItem(STORAGE_KEY_UNFOLLOW_EVENTS, JSON.stringify(events));
}

function loadSafetyMode() {
  const saved = localStorage.getItem(STORAGE_KEY_SAFETY_MODE);
  return saved === "risk" ? "risk" : "strict";
}

function saveSafetyMode(mode) {
  localStorage.setItem(STORAGE_KEY_SAFETY_MODE, mode);
}

function loadStrictCooldownUntil() {
  const raw = Number(localStorage.getItem(STORAGE_KEY_STRICT_COOLDOWN_UNTIL) || 0);
  return Number.isFinite(raw) ? raw : 0;
}

function saveStrictCooldownUntil(ts) {
  localStorage.setItem(STORAGE_KEY_STRICT_COOLDOWN_UNTIL, String(ts || 0));
}

async function loadInstagramDataset() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_UPLOADED_DATA);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.followersData && parsed?.followingData) {
        return {
          followersData: parsed.followersData,
          followingData: parsed.followingData,
          source: "upload"
        };
      }
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY_UPLOADED_DATA);
  }

  return {
    followersData: await loadJson("./data/followers.json"),
    followingData: await loadJson("./data/following.json"),
    source: "local"
  };
}

function pruneUnfollowEvents(events, now = Date.now()) {
  return events.filter((ts) => now - ts <= WINDOW_24_HOUR_MS);
}

function msToShort(ms) {
  const mins = Math.max(1, Math.ceil(ms / 60000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem ? `${hours}h ${rem}m` : `${hours}h`;
}

function msToClock(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function getRateState(events, now = Date.now()) {
  const recent90 = events.filter((ts) => now - ts <= WINDOW_90_MIN_MS);
  const recent24 = events.filter((ts) => now - ts <= WINDOW_24_HOUR_MS);

  const can90 = recent90.length < LIMIT_90_MIN;
  const can24 = recent24.length < LIMIT_24_HOUR;

  const wait90 = can90 ? 0 : WINDOW_90_MIN_MS - (now - Math.min(...recent90));
  const wait24 = can24 ? 0 : WINDOW_24_HOUR_MS - (now - Math.min(...recent24));

  return {
    used90: recent90.length,
    used24: recent24.length,
    remaining90: Math.max(0, LIMIT_90_MIN - recent90.length),
    remaining24: Math.max(0, LIMIT_24_HOUR - recent24.length),
    canUnfollow: can90 && can24,
    wait90,
    wait24,
    waitText: !can90 ? msToShort(wait90) : !can24 ? msToShort(wait24) : ""
  };
}

function getStrictCooldownRemaining(now = Date.now()) {
  const until = loadStrictCooldownUntil();
  return Math.max(0, until - now);
}

function getSafetyStatusHtml(safetyMode, rate, cooldownRemaining) {
  if (safetyMode === "risk") return "risk mode active";

  if (cooldownRemaining > 0) {
    const clamped = Math.max(0, Math.min(WINDOW_90_MIN_MS, cooldownRemaining));
    const ringDeg = Math.round((clamped / WINDOW_90_MIN_MS) * 360);
    return `<span class="safety-status-with-ring"><span class="status-ring" style="--ring-deg:${ringDeg}deg" aria-hidden="true"></span><span>strict mode: <span class="status-locked-word">locked ${msToClock(cooldownRemaining)}</span></span></span>`;
  }

  if (rate.canUnfollow) {
    return 'strict mode: <span class="status-ready-word">ready</span>';
  }

  const waitMs = rate.wait90 > 0 ? rate.wait90 : rate.wait24;
  return `strict mode: <span class="status-locked-word">locked ${msToClock(waitMs)}</span>`;
}

function stopSafetyTicker() {
  if (safetyTickerId) {
    clearInterval(safetyTickerId);
    safetyTickerId = null;
  }
}

function updateSafetyStatus(safetyMode) {
  const statusEl = document.getElementById("safety-status");
  if (!statusEl) return;

  const events = pruneUnfollowEvents(loadUnfollowEvents());
  saveUnfollowEvents(events);
  const rate = getRateState(events);
  const cooldownRemaining = getStrictCooldownRemaining();
  updateSafetyMeters(rate, safetyMode, cooldownRemaining);
  statusEl.innerHTML = getSafetyStatusHtml(safetyMode, rate, cooldownRemaining);
}

function updateSafetyMeters(rate, safetyMode = "strict", cooldownRemaining = 0) {
  const ninetyLabel = document.getElementById("limit-90-label");
  const ninetyFill = document.getElementById("limit-90-fill");
  const forceNinetyFull = safetyMode === "strict" && cooldownRemaining > 0;
  const ninetyPct = forceNinetyFull ? 100 : Math.min(100, (rate.used90 / LIMIT_90_MIN) * 100);

  if (ninetyLabel) ninetyLabel.textContent = `90 min: ${rate.used90}/${LIMIT_90_MIN}`;
  if (ninetyFill) ninetyFill.style.width = `${ninetyPct}%`;
}

function startSafetyTicker(safetyMode) {
  stopSafetyTicker();
  updateSafetyStatus(safetyMode);

  if (safetyMode === "strict") {
    safetyTickerId = setInterval(() => updateSafetyStatus(safetyMode), 1000);
  }
}

function persistSets(unfollowedSet, tbdSet, pnfSet, visitMap, pinnedSet) {
  saveSet(STORAGE_KEY_UNFOLLOWED, unfollowedSet);
  saveSet(STORAGE_KEY_TBD, tbdSet);
  saveSet(STORAGE_KEY_PNF, pnfSet);
  saveVisitMap(pruneVisitMap(visitMap));
  saveSet(STORAGE_KEY_PINNED, pinnedSet);
}

function loadTheme() {
  const saved = localStorage.getItem(STORAGE_KEY_THEME);
  return saved === "dark" ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

function saveTheme(theme) {
  localStorage.setItem(STORAGE_KEY_THEME, theme);
}

function getNavLogoSrc(theme) {
  return theme === "light" ? "./assets/f&f-logo-light.png" : "./assets/f&f-logo.png";
}

function setNavLogo(theme) {
  const logo = document.querySelector(".top-nav-logo");
  if (!(logo instanceof HTMLImageElement)) return;
  logo.src = getNavLogoSrc(theme);
}

function setThemeToggleButton(theme) {
  const button = document.getElementById("toggle-theme");
  if (!(button instanceof HTMLButtonElement)) return;

  const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  button.setAttribute("aria-label", label);
  button.setAttribute("title", label);
  button.setAttribute("data-tip", label);
  button.innerHTML =
    theme === "dark"
      ? `<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>`
      : `<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9"></path></svg>`;
}

function setSafetyToggleButton(safetyMode) {
  const button = document.getElementById("toggle-safety");
  if (!(button instanceof HTMLButtonElement)) return;

  const locked = safetyMode === "strict";
  const label = locked ? "strict mode on" : "risk mode on";
  button.setAttribute("aria-label", label);
  button.removeAttribute("title");
  button.setAttribute("data-tip", label);
  button.innerHTML = locked
    ? `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="10" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`
    : `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="10" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>`;
}
function parseUsernameFromHref(href) {
  if (!href) return "";

  try {
    const url = new URL(href);
    const segments = url.pathname.split("/").filter(Boolean);
    if (!segments.length) return "";
    if (segments[0] === "_u" && segments[1]) return segments[1];
    return segments[0];
  } catch {
    const match = String(href).match(/instagram\.com\/(?:_u\/)?([^/?#]+)/i);
    return match?.[1] || "";
  }
}

function extractUsername(entry) {
  if (!entry || typeof entry !== "object") return "";

  const fromTitle = norm(entry.title);
  if (fromTitle) return fromTitle;

  const data0 = entry.string_list_data?.[0] || {};
  const fromValue = norm(data0.value);
  if (fromValue) return fromValue;

  const fromHref = norm(parseUsernameFromHref(data0.href));
  if (fromHref) return fromHref;

  return "";
}

function extractTimestamp(entry) {
  const ts = entry?.string_list_data?.[0]?.timestamp;
  const n = Number(ts);
  return Number.isFinite(n) ? n : 0;
}

function isValidUsername(username) {
  return USERNAME_RE.test(username);
}

function extractCandidateUsernames(entry) {
  const candidates = [
    norm(entry?.title),
    norm(entry?.string_list_data?.[0]?.value),
    norm(parseUsernameFromHref(entry?.string_list_data?.[0]?.href))
  ].filter((u) => u && isValidUsername(u));

  return unique(candidates);
}

function extractEntries(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  return [];
}

function parseUsernames(entries, label) {
  let total = 0;
  let parsed = 0;
  let invalid = 0;
  const raw = [];
  const followedAtByUsername = {};

  for (const entry of entries) {
    total += 1;
    const username = extractUsername(entry);
    if (!username) continue;

    parsed += 1;
    if (!USERNAME_RE.test(username)) {
      invalid += 1;
      continue;
    }

    raw.push(username);

    const ts = extractTimestamp(entry);
    if (!followedAtByUsername[username] || ts > followedAtByUsername[username]) {
      followedAtByUsername[username] = ts;
    }
  }

  const usernames = unique(raw);

  return {
    usernames,
    followedAtByUsername,
    stats: {
      label,
      total,
      parsed,
      invalid,
      unique: usernames.length
    }
  };
}

function listHtml(arr, type, visitedSet, strictActionLocked = false, pinnedSet = new Set()) {
  return arr
    .map((username) => {
      const encodedUser = encodeURIComponent(username);
      const id = `chk_${encodedUser}`;
      const safeUser = escapeHtml(username);
      const checked = type === "done";
      const pinned = type === "pending" && pinnedSet.has(username);

      const tbdButton =
        type === "pending"
          ? `<button class="mini-btn" data-action="to-tbd" data-username="${encodedUser}">later</button>`
          : "";

      const pendingButton =
        type === "tbd" || type === "pnf"
          ? `<button class="mini-btn" data-action="to-pending" data-username="${encodedUser}">pending</button>`
          : "";

      const pnfButton =
        type === "pending"
          ? `<button class="mini-btn" data-action="to-pnf" data-username="${encodedUser}">not found</button>`
          : "";
      const pinButton =
        type === "pending"
          ? `<button
              class="pin-toggle${pinned ? " is-pinned" : ""}"
              data-action="${pinned ? "unpin" : "pin"}"
              data-username="${encodedUser}"
              aria-label="${pinned ? "Unpin" : "Pin"} @${safeUser}"
              title="${pinned ? "Unpin" : "Pin"} @${safeUser}"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <g transform="translate(24 0) scale(-1 1) rotate(-28 12 12)">
                  <path d="M12 17v4"></path>
                  <path d="M7 3h10l-2 5 2 2v2h-4l-1 1-1-1H7v-2l2-2z"></path>
                </g>
              </svg>
            </button>`
          : "";
      const visitedClass = visitedSet.has(username) ? " visited-row" : "";
      const pinnedClass = pinned ? " pinned-row" : "";
      const disableUnfollow = strictActionLocked && type !== "done";
      const rowControl = disableUnfollow
        ? `<span class="row-lock" aria-label="Locked in strict mode" title="Locked in strict mode">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="4" y="11" width="16" height="10" rx="2"></rect>
              <path d="M8 11V8a4 4 0 0 1 8 0v3"></path>
            </svg>
          </span>`
        : `<input type="checkbox" id="${id}" data-username="${encodedUser}" ${checked ? "checked" : ""} />`;

      return `
        <div class="user-row${visitedClass}${pinnedClass}" data-row-username="${encodedUser}">
          ${rowControl}
          <button
            type="button"
            class="username-copy"
            data-copy-username="${encodedUser}"
            title="Copy @${safeUser}"
            aria-label="Copy @${safeUser}"
          >
            <span class="user-label">${safeUser}</span>
            <span class="copy-indicator" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </span>
          </button>
          <div class="row-tools">
            ${pinButton}
            ${pendingButton}
            ${tbdButton}
            ${pnfButton}
            <a href="https://www.instagram.com/${encodeURIComponent(username)}"
               target="_blank"
               rel="noopener noreferrer"
               data-open-username="${encodedUser}"
               class="user-link"
               title="open profile"
               aria-label="open profile for @${safeUser}">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3.5" y="3.5" width="17" height="17" rx="5"></rect>
                <circle cx="12" cy="12" r="4"></circle>
                <circle cx="17.6" cy="6.4" r="1"></circle>
              </svg>
            </a>
          </div>
        </div>
      `;
    })
    .join("");
}

async function copyTextToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

function renderError(message) {
  const root = document.getElementById("root") || document.body;
  root.innerHTML = `
    <section class="app-shell panel" style="max-width:920px; margin: 24px auto;">
      <h1>not following back</h1>
      <div class="error-box">
        <p><strong>could not load your instagram data.</strong></p>
        <p>${escapeHtml(message)}</p>
      </div>
    </section>
  `;
}

function renderResults({
  all,
  unfollowedSet,
  tbdSet,
  pnfSet,
  visitMap,
  pinnedSet,
  unfollowEvents,
  followedAtByUsername,
  verifyLookups,
  safetyMode = "strict",
  query = "",
  sort = "latest",
  verifyQuery = "",
  rateNotice = "",
  diagnostics,
  showDone = false,
  showTbd = false,
  showPnf = false,
  activeResultsView = "",
  theme = "light"
}) {
  const root = document.getElementById("root") || document.body;
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = null;
  }
  let activeTheme = theme;
  applyTheme(activeTheme);
  stopSafetyTicker();
  const visitedSet = getRecentVisitedSet(visitMap);
  const themeLabel = activeTheme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  const pendingAll = all.filter((u) => !unfollowedSet.has(u) && !tbdSet.has(u) && !pnfSet.has(u));
  const tbdAll = all.filter((u) => tbdSet.has(u) && !unfollowedSet.has(u) && !pnfSet.has(u));
  const pnfAll = all.filter((u) => pnfSet.has(u) && !unfollowedSet.has(u));
  const doneAll = all.filter((u) => unfollowedSet.has(u));

  const q = norm(query);
  const byQuery = (u) => !q || u.includes(q);

  const sortedPending = sortUsernames(pendingAll.filter(byQuery), sort, followedAtByUsername);
  const pendingPinned = sortedPending.filter((u) => pinnedSet.has(u));
  const pendingUnpinned = sortedPending.filter((u) => !pinnedSet.has(u));
  const pending = [...pendingPinned, ...pendingUnpinned];
  const tbd = sortUsernames(tbdAll.filter(byQuery), sort, followedAtByUsername);
  const pnf = sortUsernames(pnfAll.filter(byQuery), sort, followedAtByUsername);
  const done = sortUsernames(doneAll.filter(byQuery), sort, followedAtByUsername);

  const flaggedSet = new Set(all);
  const rateStateRaw = getRateState(unfollowEvents);
  const strictCooldownRemaining = getStrictCooldownRemaining();
  const strictLocked = strictCooldownRemaining > 0 || !rateStateRaw.canUnfollow;
  const rateState = safetyMode === "risk"
    ? { ...rateStateRaw, canUnfollow: true, waitText: "" }
    : rateStateRaw;
  const dailySegmentCount = 6;
  const filledDailySegments = Math.min(dailySegmentCount, Math.floor(rateState.used24 / 10));
  const ninetyFillPct = safetyMode === "strict" && strictCooldownRemaining > 0
    ? 100
    : Math.min(100, (rateState.used90 / LIMIT_90_MIN) * 100);
  const pendingSafetyCount = safetyMode === "strict" && strictCooldownRemaining > 0
    ? LIMIT_90_MIN
    : Math.min(LIMIT_90_MIN, rateState.used90);
  const pendingSafetyDotsHtml = Array.from({ length: LIMIT_90_MIN }, (_, i) =>
    `<span class="pending-safety-dot ${i < pendingSafetyCount ? "is-filled" : ""}" style="--dot-index:${i};"></span>`
  ).join("");
  const dailySegmentsHtml = Array.from({ length: dailySegmentCount }, (_, i) =>
    `<span class="daily-compact-segment ${i < filledDailySegments ? "is-filled" : ""}"></span>`
  ).join("");
  const dataLine = diagnostics
    ? `compared <strong>${diagnostics.followers.unique}</strong> followers vs <strong>${diagnostics.following.unique}</strong> following.`
    : "";
  const sortLabelByValue = {
    latest: "sort latest",
    earliest: "sort earliest",
    az: "sort a-z",
    za: "sort z-a"
  };
  const currentSortLabel = sortLabelByValue[sort] || sortLabelByValue.az;
  const resultsView = activeResultsView || "";
  const resultsMeta = {
    done: { title: "unfollowed", count: doneAll.length, empty: "nothing here yet.", note: "accounts you already marked done." },
    tbd: { title: "review later", count: tbdAll.length, empty: "nothing in review later.", note: "set aside to review later." },
    pnf: { title: "not found", count: pnfAll.length, empty: "nothing in page not found.", note: "profiles that could not be reached." }
  };

  root.innerHTML = `
    <div class="app-page">
      <nav class="top-nav panel" aria-label="Primary">
        <div class="top-nav-brand">
          <button type="button" class="top-nav-home top-nav-profile" aria-label="Profile">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 21a8 8 0 0 0-16 0"></path>
              <circle cx="12" cy="8" r="4"></circle>
            </svg>
          </button>
        </div>
        <div class="top-nav-center">
          <a href="./home.html" class="top-nav-logo-link" aria-label="Home">
            <img src="${getNavLogoSrc(activeTheme)}" alt="f&f logo" class="top-nav-logo" width="96" height="96" />
          </a>
        </div>
        <div class="top-nav-links">
          <button id="toggle-theme" class="mini-btn theme-btn top-nav-theme-btn" aria-label="${themeLabel}" title="${themeLabel}">
            <span class="theme-fallback">${activeTheme === "dark" ? "sun" : "moon"}</span>
          </button>
        </div>
      </nav>

      <section id="safety-panel" class="app-shell panel">
        <div class="title-row">
          <div class="title-action-left">
            <a href="./home.html" class="title-back-link theme-btn" aria-label="Back to overview" title="Back to overview">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6"></path>
              </svg>
            </a>
          </div>
          <div class="title-action-right">
            <button id="toggle-safety" class="mini-btn theme-btn" aria-label="Safety mode"></button>
          </div>
          <h1>not following back</h1>
        </div>

        <div class="limit-box ${safetyMode === "strict" && strictLocked ? "limit-box-warning" : ""}">
          <div class="limit-head">
            <b>safety system</b>
            <span id="safety-status">${getSafetyStatusHtml(safetyMode, rateStateRaw, strictCooldownRemaining)}</span>
          </div>
          <div class="limit-row">
            <div id="limit-90-label">90 min: ${rateState.used90}/${LIMIT_90_MIN}</div>
            <div class="limit-track"><div id="limit-90-fill" class="limit-fill" style="width:${ninetyFillPct}%"></div></div>
          </div>
          <div class="safety-compact-row">
            <div class="safety-compact-label">24 hr: ${rateState.used24}/${LIMIT_24_HOUR}</div>
            <div class="daily-compact-track" aria-label="daily unfollow pacing">
              ${dailySegmentsHtml}
            </div>
            <div class="safety-compact-value">
              <strong>${filledDailySegments}/6</strong>
              <span>blocks</span>
            </div>
          </div>
          <p class="meta-line safety-mode-copy">${escapeHtml(rateNotice || (safetyMode === "strict"
            ? "strict mode pauses for 90 minutes after 10 unfollows to reduce account risk."
            : "risk mode removes the pause. use carefully."))}</p>
        </div>

      </section>

      <section id="search-panel" class="panel search-panel">
        <div class="stats-row tool-stats-row">
          <div><span class="stats-label-help" data-tip="all flagged accounts currently in this sweep." tabindex="0">total</span><strong>${all.length}</strong></div>
          <div><span class="stats-label-help" data-tip="not checked yet." tabindex="0">pending</span><strong>${pendingAll.length}</strong></div>
          <div><span class="stats-label-help" data-tip="accounts you already marked done." tabindex="0">unfollowed</span><strong>${doneAll.length}</strong></div>
          <div><span class="stats-label-help" data-tip="set aside to review later." tabindex="0">review later</span><strong>${tbdAll.length}</strong></div>
          <div><span class="stats-label-help" data-tip="profile could not be reached." tabindex="0">not found</span><strong>${pnfAll.length}</strong></div>
        </div>
        ${dataLine ? `<p class="meta-line search-panel-headline tool-summary-line">${dataLine}</p>` : ""}
      </section>

      <div class="lists-grid">
        <section id="pending-panel" class="panel list-panel left-column">
          <h2 class="pending-heading">
              <span class="pending-heading-main">
                <span>pending</span>
              </span>
              <span class="pending-heading-tools">
              <span class="pending-flow">
                <span class="pending-step">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3h7v7"></path><path d="M10 14 21 3"></path><path d="M21 14v7h-7"></path><path d="M3 10V3h7"></path><path d="m3 3 7 7"></path></svg>
                  open
              </span>
              <span class="pending-sep" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"></path></svg>
              </span>
              <span class="pending-step">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16"></path><path d="m14 6 6 6-6 6"></path></svg>
                unfollow
              </span>
              <span class="pending-sep" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"></path></svg>
              </span>
                <span class="pending-step">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m20 6-11 11-5-5"></path></svg>
                  check
                </span>
              </span>
              <span class="pending-safety-chip" aria-label="90 minute safety counter">
                <span class="pending-safety-ring" aria-hidden="true">${pendingSafetyDotsHtml}</span>
              </span>
              </span>
          </h2>
          <div class="toolbar pending-toolbar">
            <input id="search-input" type="text" placeholder="search pending" value="${escapeHtml(query)}" autocomplete="off" autocapitalize="none" spellcheck="false" />
            <div id="sort-dropdown" class="sort-dropdown">
              <button id="sort-trigger" type="button" class="sort-trigger" aria-haspopup="listbox" aria-expanded="false">${currentSortLabel}</button>
              <div class="sort-options" role="listbox" aria-label="sort options">
                <button type="button" class="sort-option ${sort === "latest" ? "is-active" : ""}" data-sort="latest">sort latest</button>
                <button type="button" class="sort-option ${sort === "earliest" ? "is-active" : ""}" data-sort="earliest">sort earliest</button>
                <button type="button" class="sort-option ${sort === "az" ? "is-active" : ""}" data-sort="az">sort a-z</button>
                <button type="button" class="sort-option ${sort === "za" ? "is-active" : ""}" data-sort="za">sort z-a</button>
              </div>
              <select id="sort-select" class="sort-select-native" aria-hidden="true" tabindex="-1">
                <option value="latest" ${sort === "latest" ? "selected" : ""}>sort latest</option>
                <option value="earliest" ${sort === "earliest" ? "selected" : ""}>sort earliest</option>
                <option value="az" ${sort === "az" ? "selected" : ""}>sort a-z</option>
                <option value="za" ${sort === "za" ? "selected" : ""}>sort z-a</option>
              </select>
            </div>
          </div>
          <p id="search-status" class="meta-line search-status"></p>
          <div id="pendingList" class="list-box">
            <div class="list-scroll">
              ${safetyMode === "strict" && strictLocked ? `<p class="lock-banner">unfollow is locked right now. you can still move users to tbd or not found.</p>` : ""}
              ${pending.length ? listHtml(pending, "pending", visitedSet, strictLocked, pinnedSet) : `<div class="empty">no pending users.</div>`}
            </div>
          </div>
        </section>

        <section class="right-column">
          <section class="panel list-panel results-panel">
            ${resultsView
              ? `
                <div class="results-detail-head">
                  <button id="results-back" class="results-back" aria-label="back to lists">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m15 18-6-6 6-6"></path>
                    </svg>
                  </button>
                  <div class="results-detail-title-row">
                    <h2>${resultsMeta[resultsView].title}</h2>
                  </div>
                  <div class="results-detail-meta-row">
                    <p class="meta-line results-panel-copy">${resultsMeta[resultsView].note}</p>
                    <span class="results-count">${resultsMeta[resultsView].count}</span>
                  </div>
                </div>
                <div id="${resultsView === "done" ? "doneList" : resultsView === "tbd" ? "tbdList" : "pnfList"}" class="list-box">
                  <div class="list-scroll">
                    ${resultsView === "done"
                      ? (done.length ? listHtml(done, "done", visitedSet, strictLocked, pinnedSet) : `<div class="empty">${resultsMeta.done.empty}</div>`)
                      : resultsView === "tbd"
                        ? (tbd.length ? listHtml(tbd, "tbd", visitedSet, strictLocked, pinnedSet) : `<div class="empty">${resultsMeta.tbd.empty}</div>`)
                        : (pnf.length ? listHtml(pnf, "pnf", visitedSet, strictLocked, pinnedSet) : `<div class="empty">${resultsMeta.pnf.empty}</div>`)}
                  </div>
                </div>
              `
              : `
                <div class="section-head">
                  <h2>organized lists</h2>
                </div>
                <p class="meta-line results-panel-copy">review everything you moved out of pending.</p>
                <div class="results-overview-grid">
                  <button type="button" class="results-overview-card" data-results-view="done">
                    <span class="results-overview-body">
                      <span class="results-overview-text">
                        <span class="results-overview-title">unfollowed</span>
                        <span class="results-overview-copy">accounts you already marked done.</span>
                      </span>
                      <strong class="results-overview-value">${doneAll.length}</strong>
                    </span>
                  </button>
                  <button type="button" class="results-overview-card" data-results-view="tbd">
                    <span class="results-overview-body">
                      <span class="results-overview-text">
                        <span class="results-overview-title">review later</span>
                        <span class="results-overview-copy">set aside to review later.</span>
                      </span>
                      <strong class="results-overview-value">${tbdAll.length}</strong>
                    </span>
                  </button>
                  <button type="button" class="results-overview-card" data-results-view="pnf">
                    <span class="results-overview-body">
                      <span class="results-overview-text">
                        <span class="results-overview-title">not found</span>
                        <span class="results-overview-copy">profiles that could not be reached.</span>
                      </span>
                      <strong class="results-overview-value">${pnfAll.length}</strong>
                    </span>
                  </button>
                </div>
              `}
          </section>

        </section>
      </div>
    </div>
  `;
  setThemeToggleButton(activeTheme);
  setNavLogo(activeTheme);
  setSafetyToggleButton(safetyMode);
  startSafetyTicker(safetyMode);

  const rerender = (next) =>
    renderResults({
      all,
      unfollowedSet,
      tbdSet,
      pnfSet,
      visitMap,
      pinnedSet,
      unfollowEvents,
      followedAtByUsername,
      verifyLookups,
      safetyMode: next.safetyMode,
      diagnostics,
      query: next.query,
      sort: next.sort,
      verifyQuery: next.verifyQuery,
      rateNotice: next.rateNotice,
      showDone: next.showDone,
      showTbd: next.showTbd,
      showPnf: next.showPnf,
      activeResultsView: next.activeResultsView,
      theme: next.theme
    });

  const syncPendingListHeight = () => {
    if (window.matchMedia("(max-width: 640px)").matches) {
      const pendingListMobile = document.getElementById("pendingList");
      pendingListMobile?.style.setProperty("--pending-list-height", "390px");
      return;
    }

    const rightColumn = document.querySelector(".right-column");
    const leftPanel = document.querySelector(".left-column");
    const pendingList = document.getElementById("pendingList");
    const pendingScroller = pendingList?.querySelector(".list-scroll");
    if (!rightColumn || !leftPanel || !pendingList || !pendingScroller) return;

    const rightHeight = rightColumn.getBoundingClientRect().height;
    const leftHeight = leftPanel.getBoundingClientRect().height;
    const pendingHeight = pendingList.getBoundingClientRect().height;
    const chromeHeight = Math.max(0, leftHeight - pendingHeight);

    const targetHeight = Math.max(220, Math.round(rightHeight - chromeHeight));
    pendingList.style.setProperty("--pending-list-height", `${targetHeight}px`);
  };

  syncPendingListHeight();

  const getListScroller = (id) => {
    const list = document.getElementById(id);
    return list?.querySelector(".list-scroll") || list;
  };

  const captureListScroll = () => {
    const ids = ["pendingList", "tbdList", "pnfList", "doneList"];
    const state = {};
    for (const id of ids) {
      const el = getListScroller(id);
      state[id] = el ? el.scrollTop : 0;
    }
    return state;
  };

  const restoreListScroll = (state, defer = true) => {
    if (!state) return;
    const apply = () => {
      for (const [id, top] of Object.entries(state)) {
        const el = getListScroller(id);
        if (el) el.scrollTop = Number(top) || 0;
      }
    };
    if (defer) {
      requestAnimationFrame(apply);
      return;
    }
    apply();
  };

  const rerenderPreservingScroll = (next) => {
    const scrollState = captureListScroll();
    rerender(next);
    restoreListScroll(scrollState);
  };

  const animatePendingReorder = (next) => {
    const pendingBefore = document.getElementById("pendingList");
    const beforeRows = pendingBefore
      ? [...pendingBefore.querySelectorAll(".user-row[data-row-username]")]
      : [];
    const scrollState = captureListScroll();

    if (!beforeRows.length) {
      rerender(next);
      restoreListScroll(scrollState, false);
      return;
    }

    const firstTopByUser = new Map();
    for (const row of beforeRows) {
      const key = row.dataset.rowUsername || "";
      if (key) firstTopByUser.set(key, row.getBoundingClientRect().top);
    }

    rerender(next);
    restoreListScroll(scrollState, false);

    const pendingAfter = document.getElementById("pendingList");
    if (!pendingAfter) return;

    const afterRows = [...pendingAfter.querySelectorAll(".user-row[data-row-username]")];
    const movedRows = [];

    for (const row of afterRows) {
      const key = row.dataset.rowUsername || "";
      const firstTop = firstTopByUser.get(key);
      if (typeof firstTop !== "number") continue;

      const dy = firstTop - row.getBoundingClientRect().top;
      if (Math.abs(dy) < 1) continue;

      row.style.transition = "none";
      row.style.transform = `translateY(${dy}px)`;
      row.style.opacity = "0.55";
      movedRows.push(row);
    }

    if (!movedRows.length) return;

    requestAnimationFrame(() => {
      for (const row of movedRows) {
        row.style.transition = "transform 280ms cubic-bezier(0.22, 1, 0.36, 1), opacity 280ms ease";
        row.style.transform = "translateY(0)";
        row.style.opacity = "1";
        row.addEventListener(
          "transitionend",
          () => {
            row.style.removeProperty("transition");
            row.style.removeProperty("transform");
            row.style.removeProperty("opacity");
          },
          { once: true }
        );
      }
    });
  };

  const rerenderWithSearchFocus = (next, caretPos) => {
    rerender(next);
    const input = document.getElementById("search-input");
    if (!(input instanceof HTMLInputElement)) return;
    input.focus();
    const pos = Math.max(0, Math.min(caretPos ?? input.value.length, input.value.length));
    input.setSelectionRange(pos, pos);
  };

  const animateMove = (action, button, onDone) => {
    const row = button.closest(".user-row");
    const targetMap = {
      "to-tbd": "tbdList",
      "to-pnf": "pnfList",
      "to-pending": "pendingList"
    };
    const targetId = targetMap[action] || "";
    const targetList = targetId ? document.getElementById(targetId) : null;

    if (targetList) {
      targetList.classList.add("list-receive");
      setTimeout(() => targetList.classList.remove("list-receive"), 280);
    }

    if (!row) {
      onDone();
      return;
    }

    const dirClass = action === "to-pending" ? "move-left" : "move-right";
    row.classList.add("row-moving", dirClass);
    row.addEventListener("animationend", () => onDone(), { once: true });
  };

  const setSearchLoadingState = (isLoading) => {
    const ids = ["pendingList", "tbdList", "pnfList", "doneList"];
    for (const id of ids) {
      const list = document.getElementById(id);
      if (!list) continue;
      list.classList.toggle("search-loading", isLoading);
      list.style.setProperty("--skeleton-rows", String(SEARCH_SKELETON_ROWS));

      const existingSkeleton = list.querySelector(".skeleton-list");
      if (isLoading) {
        if (!existingSkeleton) {
          const skeleton = document.createElement("div");
          skeleton.className = "skeleton-list";
          skeleton.innerHTML = Array.from({ length: SEARCH_SKELETON_ROWS }, () =>
            `<div class="skeleton-row"><span class="skeleton-dot"></span><span class="skeleton-line"></span><span class="skeleton-chip"></span></div>`
          ).join("");
          list.appendChild(skeleton);
        }
      } else if (existingSkeleton) {
        existingSkeleton.remove();
      }
    }
  };

  const getUiState = () => ({
    query: document.getElementById("search-input")?.value || "",
    sort: document.getElementById("sort-select")?.value || "latest",
    verifyQuery: "",
    rateNotice,
    safetyMode,
    showDone,
    showTbd,
    showPnf,
    activeResultsView: resultsView,
    theme: activeTheme
  });

  root.onchange = (e) => {
    const el = e.target;
    if (!(el instanceof HTMLInputElement)) return;
    if (el.type !== "checkbox") return;

    const encodedUsername = el.dataset.username;
    if (!encodedUsername) return;

    const username = decodeURIComponent(encodedUsername);

    if (el.checked) {
      const latestEvents = pruneUnfollowEvents(loadUnfollowEvents());
      saveUnfollowEvents(latestEvents);
      const stateNow = getRateState(latestEvents);
      const strictCooldownRemaining = getStrictCooldownRemaining();
      if (safetyMode === "strict" && (strictCooldownRemaining > 0 || !stateNow.canUnfollow)) {
        el.checked = false;
        const blockedMsg = strictCooldownRemaining > 0
          ? `Limit reached. Try again in ${msToShort(strictCooldownRemaining)}.`
          : `Limit reached. Try again in ${stateNow.waitText}.`;
        rerender({ ...getUiState(), safetyMode, rateNotice: blockedMsg });
        return;
      }

      const row = el.closest(".user-row");
      const doneList = document.getElementById("doneList");
      if (doneList) {
        doneList.classList.add("list-receive");
        setTimeout(() => doneList.classList.remove("list-receive"), 280);
      }

      const commitChecked = () => {
        latestEvents.push(Date.now());
        const nextEvents = pruneUnfollowEvents(latestEvents);
        saveUnfollowEvents(nextEvents);
        unfollowEvents = nextEvents;
        if (safetyMode === "strict") {
          const nextState = getRateState(nextEvents);
          if (nextState.used90 >= LIMIT_90_MIN) {
            saveStrictCooldownUntil(Date.now() + WINDOW_90_MIN_MS);
          }
        }

        unfollowedSet.add(username);
        tbdSet.delete(username);
        pnfSet.delete(username);
        pinnedSet.delete(username);
        persistSets(unfollowedSet, tbdSet, pnfSet, visitMap, pinnedSet);
        rerenderPreservingScroll({ ...getUiState(), safetyMode, rateNotice: "" });
      };

      if (row) {
        row.classList.add("row-moving", "move-right");
        row.addEventListener("animationend", () => commitChecked(), { once: true });
        return;
      }

      commitChecked();
      return;
    } else {
      unfollowedSet.delete(username);
    }

    persistSets(unfollowedSet, tbdSet, pnfSet, visitMap, pinnedSet);
    rerenderPreservingScroll({ ...getUiState(), safetyMode, rateNotice: "" });
  };

  root.onclick = (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const sortDropdown = document.getElementById("sort-dropdown");
    const sortTriggerEl = document.getElementById("sort-trigger");
    if (sortDropdown && !target.closest("#sort-dropdown")) {
      sortDropdown.classList.remove("is-open");
      if (sortTriggerEl instanceof HTMLButtonElement) {
        sortTriggerEl.setAttribute("aria-expanded", "false");
      }
    }

    const copyButton = target.closest(".username-copy");
    if (copyButton instanceof HTMLButtonElement) {
      const blurAfterCopy = e instanceof MouseEvent && e.detail > 0;
      const encoded = copyButton.dataset.copyUsername;
      if (!encoded) return;
      const username = decodeURIComponent(encoded);
      if (blurAfterCopy) copyButton.blur();
      copyTextToClipboard(username).then((ok) => {
        const original = copyButton.title;
        copyButton.title = ok ? "Copied!" : "Copy failed";
        copyButton.classList.add(ok ? "copied" : "copy-failed");
        setTimeout(() => {
          copyButton.title = original;
          copyButton.classList.remove("copied", "copy-failed");
        }, 420);
      });
      return;
    }

    const sortTrigger = target.closest("button#sort-trigger");
    if (sortTrigger instanceof HTMLButtonElement) {
      const nextOpen = !sortDropdown?.classList.contains("is-open");
      sortDropdown?.classList.toggle("is-open", nextOpen);
      sortTrigger.setAttribute("aria-expanded", nextOpen ? "true" : "false");
      return;
    }

    const sortOption = target.closest("button.sort-option");
    if (sortOption instanceof HTMLButtonElement) {
      const nextSort = sortOption.dataset.sort;
      const sortSelectEl = document.getElementById("sort-select");
      if (!nextSort || !(sortSelectEl instanceof HTMLSelectElement)) return;
      if (sortSelectEl.value !== nextSort) {
        sortSelectEl.value = nextSort;
        sortSelectEl.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        sortDropdown?.classList.remove("is-open");
        if (sortTriggerEl instanceof HTMLButtonElement) {
          sortTriggerEl.setAttribute("aria-expanded", "false");
        }
      }
      return;
    }

    const resultsTrigger = target.closest("[data-results-view]");
    if (resultsTrigger instanceof HTMLButtonElement) {
      rerenderPreservingScroll({ ...getUiState(), activeResultsView: resultsTrigger.dataset.resultsView || "" });
      return;
    }

    const button = target.closest("button[data-action], button#results-back, button#toggle-theme, button#toggle-safety");
    const link = target.closest("a.user-link");
    if (link instanceof HTMLAnchorElement) {
      const encoded = link.dataset.openUsername;
      if (encoded) {
        const username = decodeURIComponent(encoded);
        visitMap[username] = Date.now();
        persistSets(unfollowedSet, tbdSet, pnfSet, visitMap, pinnedSet);
        const row = link.closest(".user-row");
        if (row) row.classList.add("visited-row");
      }
      return;
    }
    if (!(button instanceof HTMLButtonElement)) return;

    if (button.id === "results-back") {
      const ui = getUiState();
      rerenderPreservingScroll({ ...ui, activeResultsView: "" });
      return;
    }
    if (button.id === "toggle-theme") {
      activeTheme = activeTheme === "dark" ? "light" : "dark";
      applyTheme(activeTheme);
      saveTheme(activeTheme);
      setThemeToggleButton(activeTheme);
      setNavLogo(activeTheme);
      return;
    }
    if (button.id === "toggle-safety") {
      const nextMode = safetyMode === "strict" ? "risk" : "strict";
      saveSafetyMode(nextMode);
      rerenderPreservingScroll({ ...getUiState(), safetyMode: nextMode, rateNotice: "" });
      return;
    }
    const action = button.dataset.action;
    const encodedUsername = button.dataset.username;
    if (!action || !encodedUsername) return;

    const username = decodeURIComponent(encodedUsername);
    if (action === "pin" || action === "unpin") {
      if (action === "pin") {
        pinnedSet.add(username);
      } else {
        pinnedSet.delete(username);
      }
      persistSets(unfollowedSet, tbdSet, pnfSet, visitMap, pinnedSet);
      animatePendingReorder(getUiState());
      return;
    }

    animateMove(action, button, () => {
      if (action === "to-tbd") {
        tbdSet.add(username);
        unfollowedSet.delete(username);
        pnfSet.delete(username);
        pinnedSet.delete(username);
      }

      if (action === "to-pnf") {
        pnfSet.add(username);
        tbdSet.delete(username);
        unfollowedSet.delete(username);
        pinnedSet.delete(username);
      }

      if (action === "to-pending") {
        tbdSet.delete(username);
        pnfSet.delete(username);
        unfollowedSet.delete(username);
      }

      persistSets(unfollowedSet, tbdSet, pnfSet, visitMap, pinnedSet);
      rerenderPreservingScroll(getUiState());
    });
  };

  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.oninput = (e) => {
    const startedAt = Date.now();
    const nextQuery = e.target instanceof HTMLInputElement ? e.target.value : "";
    const caretPos = e.target instanceof HTMLInputElement
      ? (e.target.selectionStart ?? nextQuery.length)
      : nextQuery.length;
    const nextSort = document.getElementById("sort-select")?.value || "latest";
    setSearchLoadingState(true);
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      const elapsed = Date.now() - startedAt;
      const waitMore = Math.max(0, SEARCH_SKELETON_MIN_MS - elapsed);
      searchDebounceTimer = setTimeout(() => {
        searchDebounceTimer = null;
        rerenderWithSearchFocus(
          { query: nextQuery, sort: nextSort, verifyQuery: "", rateNotice, showDone, showTbd, showPnf, activeResultsView: resultsView, theme: activeTheme, safetyMode },
          caretPos
        );
      }, waitMore);
    }, SEARCH_DEBOUNCE_MS);
  };

  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) sortSelect.onchange = (e) => {
    const nextSort = e.target instanceof HTMLSelectElement ? e.target.value : "latest";
    const nextQuery = document.getElementById("search-input")?.value || "";
    rerender({ query: nextQuery, sort: nextSort, verifyQuery: "", rateNotice, showDone, showTbd, showPnf, activeResultsView: resultsView, theme: activeTheme, safetyMode });
  };

}
async function main() {
  try {
    const dataset = await loadInstagramDataset();
    const { followersData, followingData } = dataset;

    const followerEntries = extractEntries(followersData, "relationships_followers");
    const followingEntries = extractEntries(followingData, "relationships_following");

    const followersParsed = parseUsernames(followerEntries, "followers");
    const followingParsed = parseUsernames(followingEntries, "following");

    // Build a robust follower lookup from all valid username signals (title/value/href).
    const followerLookup = new Set();
    for (const entry of followerEntries) {
      for (const username of extractCandidateUsernames(entry)) {
        followerLookup.add(username);
      }
    }

    // Keep one row per following username (latest timestamp), but compare using all signals.
    const followingRowsByUsername = new Map();
    for (const entry of followingEntries) {
      const primary = extractUsername(entry);
      if (!isValidUsername(primary)) continue;

      const row = {
        username: primary,
        timestamp: extractTimestamp(entry),
        candidates: extractCandidateUsernames(entry)
      };

      const existing = followingRowsByUsername.get(primary);
      if (!existing || row.timestamp > existing.timestamp) {
        followingRowsByUsername.set(primary, row);
      }
    }

    const followingRows = [...followingRowsByUsername.values()];
    const followedAtByUsername = Object.fromEntries(
      followingRows.map((row) => [row.username, row.timestamp])
    );

    const notFollowingBackAll = followingRows
      .filter((row) => !row.candidates.some((candidate) => followerLookup.has(candidate)))
      .map((row) => row.username);

    const allSet = new Set(notFollowingBackAll);
    const unfollowedSet = loadSet(STORAGE_KEY_UNFOLLOWED);
    const tbdSet = loadSet(STORAGE_KEY_TBD);
    const pnfSet = loadSet(STORAGE_KEY_PNF);
    let visitMap = loadVisitMap();
    const pinnedSet = loadSet(STORAGE_KEY_PINNED);
    let unfollowEvents = pruneUnfollowEvents(loadUnfollowEvents());
    const safetyMode = loadSafetyMode();
    if (getStrictCooldownRemaining() <= 0) {
      saveStrictCooldownUntil(0);
    }

    for (const username of [...unfollowedSet]) {
      if (!allSet.has(username)) unfollowedSet.delete(username);
    }

    for (const username of [...tbdSet]) {
      if (!allSet.has(username) || unfollowedSet.has(username)) tbdSet.delete(username);
    }

    for (const username of [...pnfSet]) {
      if (!allSet.has(username) || unfollowedSet.has(username)) pnfSet.delete(username);
    }
    visitMap = Object.fromEntries(
      Object.entries(pruneVisitMap(visitMap)).filter(([username]) => allSet.has(username))
    );
    for (const username of [...pinnedSet]) {
      const isPending = allSet.has(username) && !unfollowedSet.has(username) && !tbdSet.has(username) && !pnfSet.has(username);
      if (!isPending) pinnedSet.delete(username);
    }

    persistSets(unfollowedSet, tbdSet, pnfSet, visitMap, pinnedSet);
    saveUnfollowEvents(unfollowEvents);

    renderResults({
      all: notFollowingBackAll,
      unfollowedSet,
      tbdSet,
      pnfSet,
      visitMap,
      pinnedSet,
      unfollowEvents,
      followedAtByUsername,
      verifyLookups: {
        following: new Set(followingRows.map((row) => row.username)),
        followers: followerLookup
      },
      safetyMode,
      query: "",
      sort: "latest",
      verifyQuery: "",
      rateNotice: "",
      showDone: false,
      showTbd: false,
      showPnf: false,
      theme: loadTheme(),
      diagnostics: {
        followers: followersParsed.stats,
        following: followingParsed.stats
      }
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    renderError(msg);
    console.error(err);
  }
}

main();


