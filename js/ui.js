// ==================== INFO / HOW-TO-PLAY MENU ====================
// Hidden on load; toggled with the I key or the HUD Info button.
// Pauses the game while open (like the link list).

let infoMenuOpen = false;

function openInfoMenu() {
  if (infoMenuOpen) return;
  if (typeof endWarp === "function" && gameState.warpActive) endWarp(true);
  const menu = document.getElementById("start-menu");
  if (!menu) return;
  infoMenuOpen = true;
  menu.style.display = "flex";
  document.body.classList.add("start-open");
  playSound("select");
}

function closeInfoMenu() {
  if (!infoMenuOpen) return;
  const menu = document.getElementById("start-menu");
  infoMenuOpen = false;
  if (menu) menu.style.display = "none";
  document.body.classList.remove("start-open");
  const btn = document.getElementById("start-button");
  if (btn) btn.blur();
  playSound("deselect");
}

function toggleInfoMenu() {
  if (infoMenuOpen) {
    closeInfoMenu();
  } else {
    openInfoMenu();
  }
}

function initInfoMenu() {
  const menu = document.getElementById("start-menu");
  if (!menu) return;
  const btn = document.getElementById("start-button");
  const hudBtn = document.getElementById("info-button");

  if (btn) {
    btn.addEventListener("click", closeInfoMenu);
    btn.addEventListener(
      "touchstart",
      function (e) {
        if (e.cancelable) e.preventDefault();
        closeInfoMenu();
      },
      { passive: false }
    );
  }
  // Click on the dimmed backdrop closes the menu
  menu.addEventListener("click", function (e) {
    if (e.target === menu) closeInfoMenu();
  });
  if (hudBtn) hudBtn.addEventListener("click", toggleInfoMenu);
}

// ==================== WARP BUTTON ====================
// HUD button mirror of the J key (also usable on touch devices).

function updateWarpButton() {
  const btn = document.getElementById("warp-button");
  if (!btn) return;
  const hasTarget =
    gameState.selectedLinkIndex !== null &&
    gameState.selectedLinkIndex < links.length;
  btn.classList.toggle("warping", gameState.warpActive);
  btn.classList.toggle("disabled", !hasTarget && !gameState.warpActive);
  btn.textContent = gameState.warpActive ? "Warp (J): ON" : "Warp (J)";
}

function initWarpButton() {
  const btn = document.getElementById("warp-button");
  if (!btn) return;
  let lastToggle = 0;
  function onToggle(e) {
    if (e && e.cancelable) e.preventDefault();
    const now = Date.now();
    if (now - lastToggle < 350) return; // swallow synthetic click after touch/pointer
    lastToggle = now;
    initAudio();
    if (gameState.warpActive) {
      endWarp();
    } else {
      startWarp();
    }
    btn.blur();
  }
  btn.addEventListener("click", onToggle);
  btn.addEventListener("pointerdown", onToggle);
  btn.addEventListener(
    "touchstart",
    function (e) {
      onToggle(e);
    },
    { passive: false }
  );
}

// ==================== HUD UPDATE ====================

// Link data comes from a hand-edited array; escape it before it goes
// into innerHTML so a stray tag can never run markup.
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function (ch) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
  });
}

// Convert raw world pixels into the configured display unit (e.g. lightyears)
function formatDistance(pixelDist) {
  const cfg = GAME_CONFIG.distance;
  const value = pixelDist / cfg.pixelsPerUnit;
  return value.toFixed(1) + " " + cfg.unit;
}

// Single MediaQueryList for the whole app instead of one per frame
let mobileQuery =
  window.matchMedia &&
  window.matchMedia("(max-width: " + GAME_CONFIG.mobileBreakpoint + "px)");

// Last HUD markup; skip the innerHTML write when nothing changed
let lastHudHtml = null;

// Cat Chaos red glimmer overlay: body class + intensity custom property.
// Change-only DOM writes, mirroring the HUD caching above.
let chaosOverlayActive = null;
let chaosOverlayLevel = -1;

function updateChaosOverlay() {
  const active = gameState.catMode;
  if (active !== chaosOverlayActive) {
    chaosOverlayActive = active;
    document.body.classList.toggle("chaos-active", active);
  }
  if (!active) return;
  const min = GAME_CONFIG.catMode.overlayIntensityMin;
  const max = GAME_CONFIG.catMode.overlayIntensityMax;
  // Once only the cat remains the red dims to a brooding glow
  const base = gameState.voidReached
    ? GAME_CONFIG.catMode.overlayVoidIntensity
    : min + (max - min) * chaosProgress();
  // Round so we only touch the DOM when the level visibly changes
  const level = Math.round(base * 1000) / 1000;
  if (level !== chaosOverlayLevel) {
    chaosOverlayLevel = level;
    document.body.style.setProperty("--chaos-level", level);
  }
}

// Big centered chaos readout (title / targets remaining / key hints).
// Only the live parts are written, and only when they change.
let lastChaosStatus = null;
let lastChaosAuto = null;

function updateChaosHud() {
  if (!gameState.catMode) return;
  const statusEl = document.getElementById("chaos-status");
  if (statusEl) {
    const remaining = chaosRemaining();
    const txt =
      remaining === 0
        ? "[ NOTHING REMAINS. ONLY THE CAT. ]"
        : "[ TARGETS REMAINING: " + remaining + " ]";
    if (txt !== lastChaosStatus) {
      lastChaosStatus = txt;
      statusEl.textContent = txt;
    }
  }
  const autoEl = document.getElementById("chaos-autofire");
  if (autoEl) {
    const txt = gameState.autoFire ? "[ON]" : "[OFF]";
    if (txt !== lastChaosAuto) {
      lastChaosAuto = txt;
      autoEl.textContent = txt;
    }
  }
}

function updateHUD() {
  updateChaosOverlay();
  updateChaosHud();
  let hudElement = document.getElementById("nearest-link");

  if (gameState.catMode) {
    const remaining = chaosRemaining();
    let chaosHtml =
      '<div style="color: #ff5555; font-weight: bold; font-size: 15px;">🔥 CAT CHAOS ENGAGED</div>' +
      '<div style="color: #888; font-size: 11px; margin-top: 4px;">SPACE = fire · F = auto ' +
      (gameState.autoFire ? "ON" : "OFF") +
      " · C = toggle (debug)</div>" +
      '<div class="distance">Targets remaining: ' +
      remaining +
      "</div>";
    if (remaining === 0) {
      chaosHtml +=
        '<div style="color: #00ffff; margin-top: 10px;">Nothing remains. Only the cat.</div>';
    }
    if (chaosHtml !== lastHudHtml) {
      hudElement.innerHTML = chaosHtml;
      lastHudHtml = chaosHtml;
    }
  } else {
    // Prioritize selected link over nearest link
    let displayLink = getTargetLink();

    if (displayLink) {
      let isSelected =
        gameState.selectedLinkIndex !== null &&
        displayLink === links[gameState.selectedLinkIndex];
      let linkDistance = displayLink.getDistance(ship.x, ship.y);

      let html = `
          <div class="link-info">
            <strong style="color: ${isSelected ? "#00ff00" : "#00ffff"}">${escapeHtml(
        displayLink.data.title
      )}${
        isVisited(displayLink)
          ? ' <span style="color: #00ff00">✓</span>'
          : ""
      }</strong>${isSelected ? " (SELECTED)" : ""}<br>
            ${escapeHtml(displayLink.data.description || "")}<br>
            <span style="color: #ffaa00;">${escapeHtml(displayLink.data.category)}</span>
          </div>
          <div class="distance">Distance: ${formatDistance(linkDistance)}</div>
          <div style="color: #888; font-size: 11px; margin-top: 4px;">Discovered: ${
            visited.size
          } / ${links.length}</div>
          ${
            gameState.warpActive
              ? '<div style="color: #00ffff; margin-top: 10px;">🛸 WARP ENGAGED — any key to cancel</div>'
              : linkDistance < GAME_CONFIG.activationDistance
              ? ""
              : gameState.selectedLinkIndex !== null
              ? '<div style="color: #888; margin-top: 10px;">J warp · ⏎ open when close</div>'
              : ""
          }
        `;
      if (html !== lastHudHtml) {
        hudElement.innerHTML = html;
        lastHudHtml = html;
      }
    } else {
      if (lastHudHtml !== "Explore the space...") {
        hudElement.innerHTML = `Explore the space...`;
        lastHudHtml = "Explore the space...";
      }
    }
  }

  updateWarpButton();

  // Trash progress is always visible, even with no link in range
  const trashEl = document.getElementById("trash-count");
  if (trashEl) {
    const total = trashCollected + trash.length;
    const txt =
      trashCollected >= GAME_CONFIG.counts.trash && trash.length === 0
        ? "Trash: " + trashCollected + " / " + total + " ✓"
        : "Trash: " + trashCollected + " / " + total;
    if (trashEl.textContent !== txt) trashEl.textContent = txt;
  }
}

// ==================== PREVIEW MODAL ====================
// V near a YouTube link embeds the player right inside the CRT screen.
// ENTER (or V) near an installation renders its markdown body in the same
// window (ESC back, ENTER opens the external link). Other links fall back
// to an "open in new tab" prompt.

let previewOpen = false;
// Link currently shown in the modal (so ENTER/the button can open it)
let previewLink = null;

// Extract a YouTube video id from watch / youtu.be / embed / shorts URLs
function getYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?[^#]*\bv=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  ];
  for (let re of patterns) {
    const m = String(url).match(re);
    if (m) return m[1];
  }
  return null;
}

// An installation is anything flagged by category or carrying a markdown body
function isInstallationLink(link) {
  if (!link || !link.data) return false;
  return (
    link.data.category === "Installation" ||
    typeof link.data.markdown === "string"
  );
}

// Custom markdown body, or a generated template so every installation has one
function getInstallationMarkdown(link) {
  const data = (link && link.data) || {};
  if (typeof data.markdown === "string" && data.markdown.trim() !== "") {
    return data.markdown;
  }
  let md = "# " + (data.title || "Installation") + "\n\n";
  if (data.description) md += data.description + "\n\n";
  if (data.category) md += "**Category:** " + data.category + "\n\n";
  if (data.url) md += "[Open the original link](" + data.url + ")\n";
  return md;
}

// Inline markdown (already HTML-escaped input): code, links, bold, italic
function inlineMarkdown(text) {
  let s = escapeHtml(text);
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (_match, label, url) {
    return '<a href="' + url + '">' + label + "</a>";
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return s;
}

// Minimal offline-safe markdown parser used when the marked CDN is missing
function fallbackMarkdown(src) {
  const lines = String(src).replace(/\r\n?/g, "\n").split("\n");
  let html = "";
  let listOpen = false;
  let para = [];
  function closeList() {
    if (listOpen) {
      html += "</ul>";
      listOpen = false;
    }
  }
  function flushPara() {
    if (para.length) {
      html += "<p>" + para.map(inlineMarkdown).join("<br>") + "</p>";
      para = [];
    }
  }
  lines.forEach(function (line) {
    const t = line.trim();
    if (t === "") {
      flushPara();
      closeList();
      return;
    }
    let m = t.match(/^(#{1,6})\s+(.*)$/);
    if (m) {
      flushPara();
      closeList();
      const level = m[1].length;
      html += "<h" + level + ">" + inlineMarkdown(m[2]) + "</h" + level + ">";
      return;
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) {
      flushPara();
      closeList();
      html += "<hr>";
      return;
    }
    m = t.match(/^>\s?(.*)$/);
    if (m) {
      flushPara();
      closeList();
      html += "<blockquote>" + inlineMarkdown(m[1]) + "</blockquote>";
      return;
    }
    m = t.match(/^[-*]\s+(.*)$/);
    if (m) {
      flushPara();
      if (!listOpen) {
        html += "<ul>";
        listOpen = true;
      }
      html += "<li>" + inlineMarkdown(m[1]) + "</li>";
      return;
    }
    flushPara();
    para.push(t);
  });
  flushPara();
  closeList();
  return html;
}

// Markdown -> HTML. Prefers marked (CDN), falls back to the tiny parser.
// Every link is forced to open in a new tab.
function renderMarkdown(src) {
  let html = null;
  if (
    typeof marked !== "undefined" &&
    marked &&
    typeof marked.parse === "function"
  ) {
    try {
      html = marked.parse(String(src == null ? "" : src));
    } catch (err) {
      html = null;
    }
  }
  if (html == null) html = fallbackMarkdown(src);
  return html.replace(/<a\s/gi, '<a target="_blank" rel="noopener" ');
}

// Show/hide the modal's video, markdown or fallback pane via a data-mode flag
function setPreviewMode(mode) {
  const overlay = document.getElementById("preview-modal");
  if (overlay) overlay.dataset.mode = mode;
}

function setPreviewFooterHint(html) {
  const hint = document.getElementById("preview-footer-hint");
  if (hint) hint.innerHTML = html;
}

function openPreview(link) {
  if (!link || previewOpen) return;
  const overlay = document.getElementById("preview-modal");
  const frame = document.getElementById("preview-frame");
  const title = document.getElementById("preview-title");
  const markdown = document.getElementById("preview-markdown");
  const fallback = document.getElementById("preview-fallback");
  if (!overlay || !frame || !markdown || !fallback) return;

  // Never preview mid-warp
  if (typeof endWarp === "function" && gameState.warpActive) endWarp(true);

  previewOpen = true;
  previewLink = link;
  if (title) title.textContent = link.data.title || "Preview";
  // Tear down any previous video before switching panes
  frame.removeAttribute("src");

  const videoId = getYouTubeId(link.data.url);
  if (videoId) {
    setPreviewMode("video");
    frame.src =
      "https://www.youtube-nocookie.com/embed/" +
      videoId +
      "?autoplay=1&rel=0";
  } else if (isInstallationLink(link)) {
    setPreviewMode("markdown");
    markdown.innerHTML = renderMarkdown(getInstallationMarkdown(link));
    try {
      markdown.scrollTop = 0;
      markdown.focus();
    } catch (err) {
      /* focus is best-effort */
    }
    setPreviewFooterHint(
      '<span class="key">ESC</span> Back · <span class="key">ENTER</span> Open link'
    );
  } else {
    // Can't embed — offer a new-tab fallback instead of a blank frame
    setPreviewMode("fallback");
    fallback.innerHTML =
      '<div>This link can\'t be previewed in-game.<br>Press ENTER to open it in a new tab.</div>';
    setPreviewFooterHint(
      '<span class="key">ESC</span> Back · <span class="key">ENTER</span> Open link'
    );
  }

  overlay.style.display = "flex";
  document.body.classList.add("preview-open");
  playSound("select");
}

// Open the previewed link in a browser tab, then close the modal
function openPreviewLinkInTab() {
  if (!previewLink) return;
  window.open(previewLink.data.url, "_blank", "noopener");
  if (typeof markVisited === "function") markVisited(previewLink);
  closePreview();
}

function closePreview() {
  if (!previewOpen) return;
  const overlay = document.getElementById("preview-modal");
  const frame = document.getElementById("preview-frame");
  const markdown = document.getElementById("preview-markdown");
  previewOpen = false;
  previewLink = null;
  // Clearing src tears down the player so audio stops immediately
  if (frame) frame.removeAttribute("src");
  if (markdown) markdown.innerHTML = "";
  if (overlay) {
    overlay.style.display = "none";
    overlay.removeAttribute("data-mode");
  }
  document.body.classList.remove("preview-open");
  playSound("deselect");
}

function initPreviewModal() {
  const overlay = document.getElementById("preview-modal");
  const closeBtn = document.getElementById("preview-close");
  const openBtn = document.getElementById("preview-open-tab");
  if (!overlay) return;
  if (closeBtn) closeBtn.addEventListener("click", closePreview);
  if (openBtn) openBtn.addEventListener("click", openPreviewLinkInTab);
  // Click on the dimmed backdrop closes the modal
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) closePreview();
  });
}

// ==================== LINK LIST ====================
// HUD button or L key opens an overlay listing all links; picking one
// pins it as the navigation target. The game pauses while it is open.
// Keyboard: ↑/↓ move the cursor, ENTER picks, ESC closes.

let linksListOpen = false;
let listCursor = 0;

function initLinksList() {
  const overlay = document.getElementById("links-list");
  const closeBtn = document.getElementById("links-list-close");
  const infoBtn = document.getElementById("links-list-info");
  const hudBtn = document.getElementById("links-button");
  if (!overlay || !closeBtn || !hudBtn) return;

  hudBtn.addEventListener("click", toggleLinksList);
  closeBtn.addEventListener("click", closeLinksList);
  if (infoBtn) {
    infoBtn.addEventListener("click", function () {
      closeLinksList();
      openInfoMenu();
    });
  }
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) closeLinksList();
  });

  // Keyboard navigation while the list is open. stopImmediatePropagation
  // keeps p5's key handler from also reacting to these keys.
  document.addEventListener("keydown", function (e) {
    if (!linksListOpen || links.length === 0) return;
    if (e.key === "Escape") {
      e.stopImmediatePropagation();
      closeLinksList();
    } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
      e.stopImmediatePropagation();
      e.preventDefault();
      listCursor = (listCursor + 1) % links.length;
      updateListCursor();
    } else if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
      e.stopImmediatePropagation();
      e.preventDefault();
      listCursor = (listCursor - 1 + links.length) % links.length;
      updateListCursor();
    } else if (e.key === "Enter") {
      e.stopImmediatePropagation();
      pickLink(listCursor);
    } else if (e.key === "i" || e.key === "I") {
      e.stopImmediatePropagation();
      closeLinksList();
      openInfoMenu();
    }
  });
}

// Pin a link as navigation target and close the list
function pickLink(i) {
  const l = links[i];
  if (!l) return;
  gameState.selectedLinkIndex = i;
  // pinning a new target always starts from basic speed
  gameState.accelerationFactor = 0;
  playSound("select");
  closeLinksList();
}

function updateListCursor() {
  const ul = document.getElementById("links-list-items");
  if (!ul) return;
  const items = ul.children;
  for (let i = 0; i < items.length; i++) {
    items[i].classList.toggle("cursor", i === listCursor);
  }
  if (items[listCursor]) {
    items[listCursor].scrollIntoView({ block: "nearest" });
  }
}

function buildLinksList() {
  const ul = document.getElementById("links-list-items");
  if (!ul) return;
  ul.innerHTML = "";

  // Start the cursor on the currently pinned link (or the first row)
  if (
    gameState.selectedLinkIndex !== null &&
    gameState.selectedLinkIndex < links.length
  ) {
    listCursor = gameState.selectedLinkIndex;
  } else {
    listCursor = 0;
  }

  for (let i = 0; i < links.length; i++) {
    const l = links[i];
    const li = document.createElement("li");
    if (gameState.selectedLinkIndex === i) {
      li.classList.add("selected");
    }
    if (i === listCursor) {
      li.classList.add("cursor");
    }

    const state = document.createElement("span");
    state.className = "li-state";
    state.textContent = isVisited(l) ? "✓" : "new";
    state.style.color = isVisited(l) ? "#888" : "#ffdc00";

    const title = document.createElement("strong");
    title.textContent = l.data.title;

    const cat = document.createElement("span");
    cat.className = "li-cat";
    cat.textContent = l.data.category;

    const dist = document.createElement("span");
    dist.className = "li-dist";
    dist.textContent =
      " · Distance: " + formatDistance(l.getDistance(ship.x, ship.y));

    li.appendChild(state);
    li.appendChild(title);
    li.appendChild(document.createElement("br"));
    li.appendChild(cat);
    li.appendChild(dist);

    li.addEventListener("click", function () {
      pickLink(i);
    });
    li.addEventListener("mousemove", function () {
      if (listCursor !== i) {
        listCursor = i;
        updateListCursor();
      }
    });

    ul.appendChild(li);
  }
}

function openLinksList() {
  if (!gameState.appReady) return;
  if (typeof endWarp === "function" && gameState.warpActive) endWarp(true);
  const overlay = document.getElementById("links-list");
  if (!overlay || linksListOpen) return;
  linksListOpen = true;
  buildLinksList();
  overlay.style.display = "flex";
  playSound("select");
}

function closeLinksList() {
  if (!linksListOpen) return;
  linksListOpen = false;
  const overlay = document.getElementById("links-list");
  if (overlay) overlay.style.display = "none";
  playSound("deselect");
}

function toggleLinksList() {
  if (linksListOpen) {
    closeLinksList();
  } else {
    openLinksList();
  }
}
