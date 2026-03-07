const STORAGE_KEY_THEME = "ig_theme_v1";
const STORAGE_KEY_TUTORIAL_UNLOCKED = "ff_tutorial_unlocked_v1";
const STORAGE_KEY_UPLOADED_DATA = "ff_uploaded_instagram_data_v1";

function loadTheme() {
  const saved = localStorage.getItem(STORAGE_KEY_THEME);
  return saved === "dark" ? "dark" : "light";
}

function saveTheme(theme) {
  localStorage.setItem(STORAGE_KEY_THEME, theme);
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
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

function setTutorialUnlocked(unlocked) {
  const shell = document.querySelector("[data-tutorial-shell]");
  if (!(shell instanceof HTMLElement)) return;
  shell.classList.toggle("is-locked", !unlocked);
}

function extractEntries(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  return [];
}

function getUploadUi() {
  return {
    dropzone: document.querySelector("[data-upload-dropzone]"),
    filesInput: document.querySelector("[data-upload-files]"),
    folderInput: document.querySelector("[data-upload-folder]"),
    status: document.querySelector("[data-upload-status]"),
    results: document.querySelector("[data-upload-results]"),
    followersList: document.querySelector("[data-upload-followers-list]"),
    followingList: document.querySelector("[data-upload-following-list]"),
    readyCopy: document.querySelector("[data-upload-ready-copy]")
  };
}

function setUploadStatus(message, tone = "neutral") {
  const { status } = getUploadUi();
  if (!(status instanceof HTMLElement)) return;
  status.textContent = message;
  status.classList.remove("is-success", "is-error");
  if (tone === "success") status.classList.add("is-success");
  if (tone === "error") status.classList.add("is-error");
}

function setUploadResultsVisible(visible) {
  const { results } = getUploadUi();
  if (!(results instanceof HTMLElement)) return;
  results.hidden = !visible;
}

function renderUploadList(listEl, items) {
  if (!(listEl instanceof HTMLElement)) return;
  listEl.innerHTML = "";

  for (const item of items) {
    const li = document.createElement("li");
    li.textContent = `${item.path} (${item.count} entr${item.count === 1 ? "y" : "ies"})`;
    listEl.appendChild(li);
  }
}

function renderUploadSummary(summary) {
  const { followersList, followingList, readyCopy } = getUploadUi();
  renderUploadList(followersList, summary.followers);
  renderUploadList(followingList, summary.following);
  if (readyCopy instanceof HTMLElement) {
    readyCopy.textContent = `Ready. Found ${summary.followerEntryCount} follower entr${summary.followerEntryCount === 1 ? "y" : "ies"} and ${summary.followingEntryCount} following entr${summary.followingEntryCount === 1 ? "y" : "ies"}.`;
  }
  setUploadResultsVisible(true);
}

function loadSavedUploadSummary() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_UPLOADED_DATA);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.meta?.followersFiles) || !Array.isArray(parsed?.meta?.followingFiles)) return null;
    return {
      followers: parsed.meta.followersFiles,
      following: parsed.meta.followingFiles,
      followerEntryCount: Number(parsed.meta.followerEntryCount) || 0,
      followingEntryCount: Number(parsed.meta.followingEntryCount) || 0
    };
  } catch {
    return null;
  }
}

function normalizeUploadPath(file) {
  return file.webkitRelativePath || file.name;
}

function isZipFile(file) {
  return /\.zip$/i.test(file.name) || file.type === "application/zip" || file.type === "application/x-zip-compressed";
}

function classifyInstagramJson(data, file) {
  const followersEntries = extractEntries(data, "relationships_followers");
  if (followersEntries.length > 0) {
    return {
      type: "followers",
      entries: followersEntries,
      path: normalizeUploadPath(file)
    };
  }

  const followingEntries = extractEntries(data, "relationships_following");
  if (followingEntries.length > 0) {
    return {
      type: "following",
      entries: followingEntries,
      path: normalizeUploadPath(file)
    };
  }

  return null;
}

async function readDirectoryEntry(entry, prefix = "") {
  if (!entry) return [];

  if (entry.isFile) {
    return [
      await new Promise((resolve, reject) => {
        entry.file((file) => {
          try {
            const path = prefix ? `${prefix}/${file.name}` : file.name;
            Object.defineProperty(file, "webkitRelativePath", {
              configurable: true,
              value: path
            });
          } catch {
            // Ignore if the browser does not allow redefining this property.
          }
          resolve(file);
        }, reject);
      })
    ];
  }

  if (!entry.isDirectory) return [];

  const reader = entry.createReader();
  const children = [];

  while (true) {
    const batch = await new Promise((resolve, reject) => {
      reader.readEntries(resolve, reject);
    });
    if (!batch.length) break;
    children.push(...batch);
  }

  const nextPrefix = prefix ? `${prefix}/${entry.name}` : entry.name;
  const nested = await Promise.all(children.map((child) => readDirectoryEntry(child, nextPrefix)));
  return nested.flat();
}

async function collectDroppedFiles(dataTransfer) {
  const itemEntries = [...(dataTransfer?.items || [])]
    .map((item) => (typeof item.webkitGetAsEntry === "function" ? item.webkitGetAsEntry() : null))
    .filter(Boolean);

  if (itemEntries.length > 0) {
    const files = await Promise.all(itemEntries.map((entry) => readDirectoryEntry(entry)));
    return files.flat();
  }

  return [...(dataTransfer?.files || [])];
}

function buildUploadPayload(followerMatches, followingMatches) {
  const followersData = {
    relationships_followers: followerMatches.flatMap((match) => match.entries)
  };
  const followingData = {
    relationships_following: followingMatches.flatMap((match) => match.entries)
  };

  return {
    source: "upload",
    uploadedAt: Date.now(),
    followersData,
    followingData,
    meta: {
      followersFiles: followerMatches.map((match) => ({
        path: match.path,
        count: match.entries.length
      })),
      followingFiles: followingMatches.map((match) => ({
        path: match.path,
        count: match.entries.length
      })),
      followerEntryCount: followersData.relationships_followers.length,
      followingEntryCount: followingData.relationships_following.length
    }
  };
}

async function extractZipJsonFiles(file) {
  const fflate = window.fflate;
  if (!fflate?.unzipSync || !fflate?.strFromU8) {
    throw new Error("Zip support is unavailable right now.");
  }

  const archive = fflate.unzipSync(new Uint8Array(await file.arrayBuffer()));
  const extracted = [];

  for (const [path, bytes] of Object.entries(archive)) {
    if (!/\.json$/i.test(path)) continue;
    extracted.push({
      name: path.split("/").pop() || path,
      webkitRelativePath: `${file.name}/${path}`,
      text: async () => fflate.strFromU8(bytes)
    });
  }

  return extracted;
}

async function processSelectedFiles(fileList) {
  const files = [...fileList];
  const expandedFiles = [];
  let zipCount = 0;

  for (const file of files) {
    if (isZipFile(file)) {
      zipCount += 1;
      try {
        expandedFiles.push(...(await extractZipJsonFiles(file)));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not open that zip file.";
        setUploadResultsVisible(false);
        setUploadStatus(`${message} Try the extracted folder or JSON files instead.`, "error");
        return;
      }
      continue;
    }

    expandedFiles.push(file);
  }

  const jsonFiles = expandedFiles.filter((file) => /\.json$/i.test(file.name));

  if (!jsonFiles.length) {
    setUploadResultsVisible(false);
    setUploadStatus("No JSON files found. Drop the Instagram zip, the extracted export folder, or the followers and following JSON files.", "error");
    return;
  }

  const scanPrefix = zipCount
    ? `Opened ${zipCount} zip file${zipCount === 1 ? "" : "s"} and found ${jsonFiles.length} JSON file${jsonFiles.length === 1 ? "" : "s"}.`
    : `Scanning ${jsonFiles.length} JSON file${jsonFiles.length === 1 ? "" : "s"}...`;
  setUploadStatus(scanPrefix);

  const followerMatches = [];
  const followingMatches = [];

  for (const file of jsonFiles) {
    let parsed;

    try {
      parsed = JSON.parse(await file.text());
    } catch {
      continue;
    }

    const classified = classifyInstagramJson(parsed, file);
    if (!classified) continue;

    if (classified.type === "followers") followerMatches.push(classified);
    if (classified.type === "following") followingMatches.push(classified);
  }

  if (!followerMatches.length || !followingMatches.length) {
    setUploadResultsVisible(false);
    const missing = [
      followerMatches.length ? null : "followers",
      followingMatches.length ? null : "following"
    ].filter(Boolean).join(" and ");
    setUploadStatus(`Could not find the required ${missing} JSON. Make sure you selected the Instagram zip or extracted export in JSON format.`, "error");
    return;
  }

  const payload = buildUploadPayload(followerMatches, followingMatches);
  localStorage.setItem(STORAGE_KEY_UPLOADED_DATA, JSON.stringify(payload));

  renderUploadSummary({
    followers: payload.meta.followersFiles,
    following: payload.meta.followingFiles,
    followerEntryCount: payload.meta.followerEntryCount,
    followingEntryCount: payload.meta.followingEntryCount
  });

  setUploadStatus("Upload ready. We found the needed followers and following JSON files and saved them for the app.", "success");
}

function wireUploadFlow() {
  const ui = getUploadUi();
  const { dropzone, filesInput, folderInput } = ui;

  if (!(dropzone instanceof HTMLElement) || !(filesInput instanceof HTMLInputElement) || !(folderInput instanceof HTMLInputElement)) {
    return;
  }

  const openPicker = (mode) => {
    if (mode === "folder") {
      folderInput.value = "";
      folderInput.click();
      return;
    }

    filesInput.value = "";
    filesInput.click();
  };

  const savedSummary = loadSavedUploadSummary();
  if (savedSummary) {
    renderUploadSummary(savedSummary);
    setUploadStatus("Previous upload still available. You can open the app now or replace it with a new export.", "success");
  }

  document.querySelectorAll("[data-upload-trigger]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const trigger = event.currentTarget;
      const mode = trigger instanceof HTMLElement ? trigger.dataset.uploadTrigger : "files";
      openPicker(mode === "folder" ? "folder" : "files");
    });
  });

  dropzone.addEventListener("click", () => openPicker("folder"));
  dropzone.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openPicker("folder");
  });

  ["dragenter", "dragover"].forEach((type) => {
    dropzone.addEventListener(type, (event) => {
      event.preventDefault();
      dropzone.classList.add("is-dragover");
    });
  });

  ["dragleave", "dragend"].forEach((type) => {
    dropzone.addEventListener(type, () => {
      dropzone.classList.remove("is-dragover");
    });
  });

  dropzone.addEventListener("drop", async (event) => {
    event.preventDefault();
    dropzone.classList.remove("is-dragover");
    const files = await collectDroppedFiles(event.dataTransfer);
    await processSelectedFiles(files);
  });

  filesInput.addEventListener("change", async () => {
    if (!filesInput.files?.length) return;
    await processSelectedFiles(filesInput.files);
  });

  folderInput.addEventListener("change", async () => {
    if (!folderInput.files?.length) return;
    await processSelectedFiles(folderInput.files);
  });
}

let activeTheme = loadTheme();
applyTheme(activeTheme);
setNavLogo(activeTheme);
setThemeToggleButton(activeTheme);
setTutorialUnlocked(localStorage.getItem(STORAGE_KEY_TUTORIAL_UNLOCKED) === "true");
wireUploadFlow();

document.getElementById("toggle-theme")?.addEventListener("click", () => {
  activeTheme = activeTheme === "dark" ? "light" : "dark";
  applyTheme(activeTheme);
  saveTheme(activeTheme);
  setNavLogo(activeTheme);
  setThemeToggleButton(activeTheme);
});

document.querySelector("[data-tutorial-unlock]")?.addEventListener("click", () => {
  localStorage.setItem(STORAGE_KEY_TUTORIAL_UNLOCKED, "true");
  setTutorialUnlocked(true);
});
