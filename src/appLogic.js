import init, { to_json } from "../uesave-wasm/pkg/uesave_wasm.js";
import { analyzeUeSaveJson } from "../dwarfFilter.js";

export async function initializeApp() {
  // DOM elements - Shared
  const $log = document.getElementById("log");
  const $statusDot = document.getElementById("statusDot");
  const $statusText = document.getElementById("statusText");
  const $platformBadge = document.getElementById("platformBadge");
  const $platformIcon = document.getElementById("platformIcon");
  const $platformName = document.getElementById("platformName");
  const $fileInput = document.getElementById("fileInput");
  const $dirInput = document.getElementById("dirInput");

  // DOM elements - Tabs
  const $tabBtns = document.querySelectorAll(".tab-btn");
  const $tabContents = document.querySelectorAll(".tab-content");

  // DOM elements - Character Tab
  const $pickFileChar = document.getElementById("pickFileChar");
  const $pickDirChar = document.getElementById("pickDirChar");
  const $clearChar = document.getElementById("clearChar");
  const $toggleLogChar = document.getElementById("toggleLogChar");
  const $dropChar = document.getElementById("dropChar");
  const $characterPanel = document.getElementById("characterPanel");
  const $charPlaceholder = document.getElementById("charPlaceholder");
  const $charName = document.getElementById("charName");
  const $charClass = document.getElementById("charClass");
  const $equippedGrid = document.getElementById("equippedGrid");
  const $inventoryGrid = document.getElementById("inventoryGrid");

  // DOM elements - Filter Tab
  const $resultsContainer = document.getElementById("resultsContainer");
  const $pickFile = document.getElementById("pickFile");
  const $pickDir = document.getElementById("pickDir");
  const $startWatch = document.getElementById("startWatch");
  const $rerunLast = document.getElementById("rerunLast");
  const $clearResults = document.getElementById("clearResults");
  const $toggleLog = document.getElementById("toggleLog");
  const $toggleConfig = document.getElementById("toggleConfig");
  const $configPanel = document.getElementById("configPanel");
  const $filterConfig = document.getElementById("filterConfig");
  const $applyConfig = document.getElementById("applyConfig");
  const $resetConfig = document.getElementById("resetConfig");
  const $drop = document.getElementById("drop");

  // State
  let dirHandle = null;
  let lastProcessedFiles = [];
  let lastJsonData = new Map();
  const seen = new Map();
  const hasDirPicker = "showDirectoryPicker" in window;
  let timer = null;
  const itemResults = new Map();
  let activeTab = "character";
  let currentFileInputCallback = null;

  // Character tab state
  let characterData = null;

  // Configuration state
  const defaultFilters = [
    "Fiery*Totem*Damage",
    "Wisdom",
    "MageryCriticalDamage",
    "MageryCriticalChance",
    "\bLifeSteal\b",
    "LifeStealAmount",
    "\bCriticalChance",
  ].join(", ");

  let currentFilterPatterns = [];

  function parseFilterString(filterStr) {
    if (!filterStr || filterStr.trim() === "") return [];

    return filterStr
      .split(",")
      .map((pattern) => pattern.trim())
      .filter(Boolean);
  }

  function initializeConfig() {
    currentFilterPatterns = parseFilterString(defaultFilters);
    $filterConfig.value = defaultFilters;
    log("⚙️ Filters initialized:", currentFilterPatterns.join(", "));
  }

  function switchTab(tabName) {
    activeTab = tabName;

    $tabBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tabName);
    });

    $tabContents.forEach((content) => {
      content.classList.toggle("active", content.id === `tab-${tabName}`);
    });

    log(`📑 Switched to ${tabName} tab`);
  }

  $tabBtns.forEach((btn) => {
    btn.onclick = () => switchTab(btn.dataset.tab);
  });

  function detectPlatform() {
    const ua = navigator.userAgent;
    const isChromium = hasDirPicker;

    if (ua.includes("Safari") && !ua.includes("Chrome")) {
      $platformIcon.textContent = "🧭";
      $platformName.textContent = "Safari";
    } else if (ua.includes("Firefox")) {
      $platformIcon.textContent = "🦊";
      $platformName.textContent = "Firefox";
    } else if (isChromium) {
      $platformIcon.textContent = "⚡";
      $platformName.textContent = "Chromium";
      $pickDir.style.display = "inline-flex";
      $pickDirChar.style.display = "inline-flex";
      $startWatch.style.display = "inline-flex";
    }

    if (!isChromium) {
      $drop.querySelector(".drop-text").textContent =
        'Drop .sav files here or click "Pick .sav File" above';
      $dropChar.querySelector(".drop-text").textContent =
        'Drop a .sav file here or click "Pick .sav File" above';
    }
  }

  function log(...args) {
    const time = new Date().toLocaleTimeString();
    $log.textContent += `[${time}] ${args.join(" ")}\n`;
    $log.scrollTop = $log.scrollHeight;
  }

  function setStatus(text, type = "ready") {
    $statusText.textContent = text;
    $statusDot.className = "status-dot";
    if (type === "active") $statusDot.classList.add("active");
    if (type === "scanning") $statusDot.classList.add("scanning");
  }

  async function initialize() {
    await init();
    log("✅ Wasm module loaded");
    detectPlatform();
    initializeConfig();
    setStatus("Ready");
  }

  $pickFile.onclick = () => {
    currentFileInputCallback = "filter";
    $fileInput.click();
  };

  $pickDir.onclick = async () => {
    if (hasDirPicker) {
      try {
        dirHandle = await showDirectoryPicker({ mode: "read" });
        log("📁 Folder granted (Chromium)");
        setStatus("Folder selected", "active");

        await scanOnce();
      } catch (e) {
        log("❌ Pick canceled:", e?.message || e);
      }
    } else {
      $dirInput.click();
    }
  };

  $pickFileChar.onclick = () => {
    currentFileInputCallback = "character";
    $fileInput.click();
  };

  $pickDirChar.onclick = async () => {
    if (hasDirPicker) {
      try {
        const handle = await showDirectoryPicker({ mode: "read" });
        log("📁 Folder granted for character (Chromium)");
        setStatus("Scanning for character...", "scanning");

        const files = [];
        for await (const [name, h] of handle.entries()) {
          if (/\.sav$/i.test(name)) {
            const file = await h.getFile();
            files.push(file);
          }
        }

        if (files.length > 0) {
          files.sort((a, b) => b.lastModified - a.lastModified);
          await processCharacterFile(files[0]);
        } else {
          log("⚠️ No .sav files found in folder");
          setStatus("No files found");
        }
      } catch (e) {
        log("❌ Pick canceled:", e?.message || e);
      }
    }
  };

  $clearChar.onclick = () => {
    characterData = null;
    $characterPanel.style.display = "none";
    $charPlaceholder.style.display = "block";
    $equippedGrid.innerHTML = "";
    $inventoryGrid.innerHTML = "";
    log("🗑️ Character data cleared");
  };

  $toggleLogChar.onclick = () => {
    $log.style.display = $log.style.display === "none" ? "block" : "none";
  };

  $fileInput.onchange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!/\.sav$/i.test(file.name)) {
      log("⚠️ Selected file is not a .sav file");
      setStatus("Invalid file type");
      return;
    }

    log(`📄 Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    setStatus("Processing...", "scanning");

    if (currentFileInputCallback === "character") {
      await processCharacterFile(file);
    } else {
      await processFiles([file], false);
    }
    setStatus("Ready");

    $fileInput.value = "";
    currentFileInputCallback = null;
  };

  $dirInput.onchange = async (e) => {
    const files = Array.from(e.target.files || []);
    const savFiles = files.filter((f) => /\.sav$/i.test(f.name));

    if (savFiles.length === 0) {
      log("⚠️ No .sav files found in folder");
      setStatus("No .sav files found");
      return;
    }

    savFiles.sort((a, b) => b.lastModified - a.lastModified);
    const mostRecent = savFiles[0];

    log(
      `📁 Found ${savFiles.length} .sav files, using most recent: ${mostRecent.name}`
    );
    setStatus("Processing...", "scanning");

    await processFiles([mostRecent], false);
    setStatus("Ready");
  };

  $startWatch.onclick = async () => {
    if (!hasDirPicker) return alert("Directory watching requires Chrome/Edge/Brave.");
    if (!dirHandle) {
      try {
        dirHandle = await showDirectoryPicker({ mode: "read" });
      } catch {
        return;
      }
    }

    if (timer) {
      clearInterval(timer);
      timer = null;
      log("⏹️ Stopped watching");
      setStatus("Ready");
      $startWatch.innerHTML = '<span class="btn-icon">👁️</span> Start Watching';
    } else {
      log("👁️ Watching... (poll every 10s)");
      setStatus("Watching", "active");
      $startWatch.innerHTML = '<span class="btn-icon">⏹️</span> Stop Watching';
      timer = setInterval(() => scanOnce(), 10000);
      await scanOnce();
    }
  };

  $rerunLast.onclick = async () => {
    if (lastProcessedFiles.length === 0) {
      log("⚠️ No files to re-run");
      return;
    }
    log(`🔄 Re-running ${lastProcessedFiles.length} file(s)`);
    setStatus("Re-running...", "scanning");

    for (const file of lastProcessedFiles) {
      const key = (file.webkitRelativePath || file.name) || file.name;
      seen.delete(key);
    }

    await processFiles(lastProcessedFiles, false);
    setStatus("Ready");
  };

  $clearResults.onclick = () => {
    itemResults.clear();
    lastProcessedFiles = [];
    lastJsonData.clear();
    seen.clear();
    renderResults();
    log("🗑️ Results and file history cleared");
  };

  $toggleLog.onclick = () => {
    $log.style.display = $log.style.display === "none" ? "block" : "none";
  };

  $toggleConfig.onclick = () => {
    $configPanel.style.display =
      $configPanel.style.display === "none" ? "block" : "none";
  };

  $applyConfig.onclick = async () => {
    const newPatterns = parseFilterString($filterConfig.value);

    if (newPatterns.length === 0) {
      log("⚠️ No valid filters provided, keeping current configuration");
      return;
    }

    currentFilterPatterns = newPatterns;
    log("⚙️ Filters updated:", currentFilterPatterns.join(", "));

    if (lastProcessedFiles.length > 0) {
      log("🔄 Re-scanning with new filters...");
      setStatus("Applying filters...", "scanning");
      await processFiles(lastProcessedFiles, true);
      setStatus("Ready");
    } else {
      itemResults.clear();
      renderResults();
    }

    $configPanel.style.display = "none";
  };

  $resetConfig.onclick = async () => {
    $filterConfig.value = defaultFilters;
    currentFilterPatterns = parseFilterString(defaultFilters);

    log("🔄 Filters reset to defaults");

    if (lastProcessedFiles.length > 0) {
      log("🔄 Re-scanning with default filters...");
      setStatus("Applying default filters...", "scanning");
      await processFiles(lastProcessedFiles, true);
      setStatus("Ready");
    } else {
      itemResults.clear();
      renderResults();
    }

    $configPanel.style.display = "none";
  };

  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    $drop.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    $drop.addEventListener(eventName, () => $drop.classList.add("drag-over"));
  });

  ["dragleave", "drop"].forEach((eventName) => {
    $drop.addEventListener(eventName, () => $drop.classList.remove("drag-over"));
  });

  $drop.addEventListener("drop", async (e) => {
    $drop.classList.remove("drag-over");
    const files = [...e.dataTransfer.files].filter((f) => /\.sav$/i.test(f.name));
    if (!files.length) {
      log("⚠️ No .sav files in drop");
      return;
    }
    log(`📦 Processing ${files.length} dropped file(s)`);
    setStatus("Processing dropped files...", "scanning");

    await processFiles(files, false);
    setStatus("Ready");
  });

  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    $dropChar.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    $dropChar.addEventListener(eventName, () => $dropChar.classList.add("drag-over"));
  });

  ["dragleave", "drop"].forEach((eventName) => {
    $dropChar.addEventListener(eventName, () => $dropChar.classList.remove("drag-over"));
  });

  $dropChar.addEventListener("drop", async (e) => {
    $dropChar.classList.remove("drag-over");
    const files = [...e.dataTransfer.files].filter((f) => /\.sav$/i.test(f.name));
    if (!files.length) {
      log("⚠️ No .sav files in drop");
      return;
    }
    setStatus("Processing character...", "scanning");
    await processCharacterFile(files[0]);
    setStatus("Ready");
  });

  async function scanOnce() {
    if (!hasDirPicker || !dirHandle) return;

    setStatus("Scanning...", "scanning");

    const files = [];
    for await (const [name, handle] of dirHandle.entries()) {
      if (!/\.sav$/i.test(name)) continue;
      const file = await handle.getFile();
      files.push(file);
    }

    if (!files.length) {
      log("⚠️ No .sav files found");
      setStatus("No files found");
      return;
    }

    const changedFiles = [];
    for (const file of files) {
      const key = file.name;
      const stat = { size: file.size, mtime: file.lastModified };
      const prev = seen.get(key);

      if (!prev || prev.size !== stat.size || prev.mtime !== stat.mtime) {
        changedFiles.push(file);
      }
    }

    if (changedFiles.length > 0) {
      log(`📂 Found ${changedFiles.length} new/changed file(s)`);
      await processFiles(changedFiles, false);
    } else {
      log("⏭️ No changes detected");
    }

    setStatus("Watching", "active");
  }

  async function processFiles(files, clearPrevious = false) {
    if (clearPrevious) {
      itemResults.clear();
      lastJsonData.clear();
    }

    if (clearPrevious) {
      lastProcessedFiles = files;
    } else {
      for (const file of files) {
        const existingIndex = lastProcessedFiles.findIndex((f) => f.name === file.name);
        if (existingIndex >= 0) {
          lastProcessedFiles[existingIndex] = file;
        } else {
          lastProcessedFiles.push(file);
        }
      }
    }

    for (const f of files) {
      const key = (f.webkitRelativePath || f.name) || f.name;
      const stat = { size: f.size, mtime: f.lastModified };
      seen.set(key, stat);

      log(`📄 Converting: ${key} (${(f.size / 1024).toFixed(1)} KB)`);
      const bytes = new Uint8Array(await f.arrayBuffer());

      let json;
      try {
        json = to_json(bytes);
      } catch (e) {
        console.error(e);
        log(`❌ Conversion failed: ${e.message || e}`);
        continue;
      }

      const filterOptions = {
        slot1: currentFilterPatterns,
        slot2: currentFilterPatterns,
        slot3: currentFilterPatterns,
        includeWeapons: true,
        showClose: true,
        closeMinTotal: 2,
        debug: false,
      };

      const { hits, close, totalItems } = analyzeUeSaveJson(json, filterOptions);

      itemResults.set(key, {
        hits,
        close,
        totalItems,
        timestamp: Date.now(),
        filters: [...currentFilterPatterns],
      });

      lastJsonData.set(key, json);

      log(`✅ Found ${hits.length} matches, ${close.length} near-misses from ${totalItems} items`);

      if (hits.length > 0) {
        try {
          await playSound();
        } catch {}
      }
    }

    renderResults();
  }

  async function processCharacterFile(file) {
    log(`🧙 Loading character: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);

    const bytes = new Uint8Array(await file.arrayBuffer());

    let json;
    try {
      json = to_json(bytes);
    } catch (e) {
      console.error(e);
      log(`❌ Conversion failed: ${e.message || e}`);
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(json);
    } catch (e) {
      log(`❌ JSON parse failed: ${e.message || e}`);
      return;
    }

    characterData = {
      filename: file.name,
      raw: parsed,
      timestamp: Date.now(),
    };

    log("✅ Character file loaded successfully");
    renderCharacter();
  }

  function renderCharacter() {
    if (!characterData) {
      $characterPanel.style.display = "none";
      $charPlaceholder.style.display = "block";
      return;
    }

    $charPlaceholder.style.display = "none";
    $characterPanel.style.display = "block";

    const baseName = characterData.filename.replace(/\.sav$/i, "");
    $charName.textContent = baseName;
    $charClass.textContent = "Unknown Class";

    const equippedSlots = [
      { label: "Main Hand", name: "Equipped Weapon", type: "Weapon" },
      { label: "Off Hand", name: "Equipped Shield", type: "Shield" },
      { label: "Head", name: "Equipped Helm", type: "Armor" },
      { label: "Chest", name: "Equipped Chest", type: "Armor" },
      { label: "Hands", name: "Equipped Gloves", type: "Armor" },
      { label: "Feet", name: "Equipped Boots", type: "Armor" },
      { label: "Ring 1", name: "Empty", type: "", empty: true },
      { label: "Ring 2", name: "Empty", type: "", empty: true },
    ];

    $equippedGrid.innerHTML = equippedSlots
      .map(
        (slot) => `
          <div class="inventory-slot${slot.empty ? " empty" : ""}">
            <div class="slot-label">${slot.label}</div>
            <div class="slot-item-name">${slot.name}</div>
            ${slot.type ? `<div class="slot-item-type">${slot.type}</div>` : ""}
          </div>
        `
      )
      .join("");

    const inventoryItems = [
      { name: "Health Potion", type: "Consumable" },
      { name: "Mana Potion", type: "Consumable" },
      { name: "Gold Ring", type: "Accessory" },
      { name: "Iron Ore", type: "Material" },
    ];

    $inventoryGrid.innerHTML = inventoryItems
      .map(
        (item) => `
          <div class="inventory-slot">
            <div class="slot-item-name">${item.name}</div>
            <div class="slot-item-type">${item.type}</div>
          </div>
        `
      )
      .join("");

    log(`🧙 Rendered character: ${baseName} (mockup data - awaiting real test data)`);
  }

  function renderResults() {
    if (itemResults.size === 0) {
      $resultsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔭</div>
          <div>No results yet. Select a .sav file or drop one here to begin.</div>
        </div>
      `;
      return;
    }

    let html = "";

    html += `
      <div class="filter-display">
        <strong>Active Filters:</strong> ${currentFilterPatterns.join(", ")}
        <div style="margin-top: 0.5rem; font-size: 0.9em; color: var(--text-secondary);">
          ${itemResults.size} file(s) processed | ${lastProcessedFiles.length} file(s) in memory
        </div>
      </div>
    `;

    const sortedResults = Array.from(itemResults.entries()).sort(
      (a, b) => b[1].timestamp - a[1].timestamp
    );

    for (const [filename, data] of sortedResults) {
      const { hits, close, totalItems, timestamp } = data;
      const timeStr = new Date(timestamp).toLocaleTimeString();

      if (hits.length > 0) {
        html += `
          <div class="results-section">
            <div class="section-header">
              <span>✅</span>
              <span>Matches - ${filename}</span>
              <span style="margin-left: auto; font-size: 0.8rem; color: var(--text-secondary);">
                ${hits.length} of ${totalItems} items | ${timeStr}
              </span>
            </div>
            <div class="item-grid">
              ${hits.map((item) => createItemCard(item, "hit")).join("")}
            </div>
          </div>
        `;
      }

      if (close.length > 0) {
        html += `
          <div class="results-section">
            <div class="section-header">
              <span>⚡</span>
              <span>Near Misses - ${filename}</span>
              <span style="margin-left: auto; font-size: 0.8rem; color: var(--text-secondary);">
                ${close.length} of ${totalItems} items | ${timeStr}
              </span>
            </div>
            <div class="item-grid">
              ${close.map((item) => createItemCard(item, "close")).join("")}
            </div>
          </div>
        `;
      }

      if (hits.length === 0 && close.length === 0) {
        html += `
          <div class="results-section">
            <div class="section-header">
              <span>📭</span>
              <span>${filename}</span>
              <span style="margin-left: auto; font-size: 0.8rem; color: var(--text-secondary);">
                0 matches from ${totalItems} items | ${timeStr}
              </span>
            </div>
            <div style="padding: 1rem; text-align: center; color: var(--text-secondary);">
              No items matched the current filters
            </div>
          </div>
        `;
      }
    }

    $resultsContainer.innerHTML = html;
  }

  function createItemCard(item, type) {
    const scoreClass = (val) => (val >= 2 ? "good" : val === 1 ? "partial" : "zero");

    const isMatch = (attr) => {
      return currentFilterPatterns.some((pattern) => {
        const regex = new RegExp(pattern.replace(/\*/g, ".*"), "i");
        return regex.test(attr);
      });
    };

    const pool1Attrs = item.item?.pool1_attributes || [];
    const pool2Attrs = item.item?.pool2_attributes || [];
    const pool3Attrs = item.item?.pool3_attributes || [];
    const inherentAttrs = item.item?.inherent_attributes || [];

    let poolsHtml = "";

    if (pool1Attrs.length > 0) {
      poolsHtml += `
        <div class="attribute-pool">
          <div class="pool-header">Pool 1 (${pool1Attrs.length})</div>
          <div class="pool-attributes">
            ${pool1Attrs
              .map(
                (a) => `<span class="attribute-pill${isMatch(a) ? " match" : ""}">${a}</span>`
              )
              .join("")}
          </div>
        </div>
      `;
    }

    if (pool2Attrs.length > 0) {
      poolsHtml += `
        <div class="attribute-pool">
          <div class="pool-header">Pool 2 (${pool2Attrs.length})</div>
          <div class="pool-attributes">
            ${pool2Attrs
              .map(
                (a) => `<span class="attribute-pill${isMatch(a) ? " match" : ""}">${a}</span>`
              )
              .join("")}
          </div>
        </div>
      `;
    }

    if (pool3Attrs.length > 0) {
      poolsHtml += `
        <div class="attribute-pool">
          <div class="pool-header">Pool 3 (${pool3Attrs.length})</div>
          <div class="pool-attributes">
            ${pool3Attrs
              .map(
                (a) => `<span class="attribute-pill${isMatch(a) ? " match" : ""}">${a}</span>`
              )
              .join("")}
          </div>
        </div>
      `;
    }

    if (inherentAttrs.length > 0) {
      poolsHtml += `
        <div class="attribute-pool">
          <div class="pool-header">Inherent (${inherentAttrs.length})</div>
          <div class="pool-attributes">
            ${inherentAttrs
              .map((a) => `<span class="attribute-pill inherent">${a}</span>`)
              .join("")}
          </div>
        </div>
      `;
    }

    const attrHtml = poolsHtml ? `<div class="item-attributes">${poolsHtml}</div>` : "";

    return `
      <div class="item-card ${type}">
        <div class="item-header">
          <div class="item-name">${item.name}</div>
          <div class="item-type">${item.type}</div>
        </div>
        <div class="item-scores">
          <div class="score-badge">
            <div class="score-label">Pool 1</div>
            <div class="score-value ${scoreClass(item.s1)}">${item.s1}</div>
          </div>
          <div class="score-badge">
            <div class="score-label">Pool 2</div>
            <div class="score-value ${scoreClass(item.s2)}">${item.s2}</div>
          </div>
          <div class="score-badge">
            <div class="score-label">Pool 3</div>
            <div class="score-value ${scoreClass(item.s3)}">${item.s3}</div>
          </div>
        </div>
        ${attrHtml}
      </div>
    `;
  }

  async function playSound() {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = 760;
    gain.gain.value = 0.1;

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, 150);
  }

  await initialize();
}
