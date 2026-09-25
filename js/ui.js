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

function updateHUD() {
  let hudElement = document.getElementById("nearest-link");

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

  updateWarpButton();

  // Trash progress is always visible, even with no link in range
  const trashEl = document.getElementById("trash-count");
  if (trashEl) {
    const total = trashCollected + trash.length;
    const txt = "Trash: " + trashCollected + " / " + total;
    if (trashEl.textContent !== txt) trashEl.textContent = txt;
  }
}

// ==================== VIDEO PREVIEW MODAL ====================
// V near a link embeds a YouTube player right inside the CRT screen.
// Non-embeddable links (e.g. Flickr) fall back to an "open in new tab"
// button. Closing clears the iframe src so playback/audio stops.

let previewOpen = false;
// Link currently shown in the modal (so ENTER/the fallback button can open it)
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

function openPreview(link) {
  if (!link || previewOpen) return;
  const overlay = document.getElementById("preview-modal");
  const frame = document.getElementById("preview-frame");
  const title = document.getElementById("preview-title");
  const fallback = document.getElementById("preview-fallback");
  if (!overlay || !frame || !fallback) return;

  // Never preview mid-warp
  if (typeof endWarp === "function" && gameState.warpActive) endWarp(true);

  previewOpen = true;
  previewLink = link;
  if (title) title.textContent = link.data.title || "Preview";

  const videoId = getYouTubeId(link.data.url);
  if (videoId) {
    frame.style.display = "block";
    fallback.style.display = "none";
    frame.src =
      "https://www.youtube-nocookie.com/embed/" +
      videoId +
      "?autoplay=1&rel=0";
  } else {
    // Can't embed — offer a new-tab fallback instead of a blank frame
    frame.removeAttribute("src");
    frame.style.display = "none";
    fallback.style.display = "flex";
    fallback.innerHTML =
      '<div>This link can\'t be previewed in-game.<br>Press ENTER to open it in a new tab.</div>' +
      '<button type="button" class="preview-open-tab" id="preview-open-tab">Open in new tab</button>';
    const openTab = document.getElementById("preview-open-tab");
    if (openTab) {
      openTab.addEventListener("click", openPreviewLinkInTab);
    }
  }

  overlay.style.display = "flex";
  document.body.classList.add("preview-open");
  playSound("select");
}

// Open the previewed link in a browser tab, then close the modal
function openPreviewLinkInTab() {
  if (!previewLink) return;
  window.open(previewLink.data.url, "_blank", "noopener");
  closePreview();
}

function closePreview() {
  if (!previewOpen) return;
  const overlay = document.getElementById("preview-modal");
  const frame = document.getElementById("preview-frame");
  previewOpen = false;
  previewLink = null;
  // Clearing src tears down the player so audio stops immediately
  if (frame) frame.removeAttribute("src");
  if (overlay) overlay.style.display = "none";
  document.body.classList.remove("preview-open");
  playSound("deselect");
}

function initPreviewModal() {
  const overlay = document.getElementById("preview-modal");
  const closeBtn = document.getElementById("preview-close");
  if (!overlay) return;
  if (closeBtn) closeBtn.addEventListener("click", closePreview);
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
