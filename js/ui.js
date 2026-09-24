// ==================== START MENU ====================
// Shows start overlay on load and enforces a minimum loading duration.

function initStartMenu() {
  const menu = document.getElementById("start-menu");
  if (!menu) return;
  const btn = document.getElementById("start-button");
  const countdown = document.getElementById("start-countdown");
  const minLoad = GAME_CONFIG.startMenu.minLoadMs;
  let startAt = Date.now();

  // Start button is disabled until minLoad has passed
  btn.disabled = true;
  btn.style.opacity = "0.6";

  function updateCountdown() {
    const elapsed = Date.now() - startAt;
    const remaining = Math.max(0, Math.ceil((minLoad - elapsed) / 1000));
    if (elapsed < minLoad) {
      countdown.textContent = "Lädt… " + remaining + "s";
      return false;
    }
    countdown.textContent = "";
    btn.disabled = false;
    btn.style.opacity = "";
    return true;
  }

  updateCountdown();
  const ticker = setInterval(() => {
    if (updateCountdown()) {
      clearInterval(ticker);
    }
  }, 250);

  function hideMenu() {
    if (btn.disabled) return; // enforce minimum display time
    menu.style.display = "none";
    document.body.classList.remove("start-open");
    btn.blur();
    // mark app ready so input and buttons are active
    gameState.appReady = true;
  }

  btn.addEventListener("click", hideMenu);
  // Support touch and pointer devices so mobile taps are handled reliably
  btn.addEventListener(
    "touchstart",
    function (e) {
      if (btn.disabled) return;
      if (e.cancelable) e.preventDefault();
      hideMenu();
    },
    { passive: false }
  );
  btn.addEventListener("pointerdown", function (e) {
    if (btn.disabled) return;
    if (e.cancelable) e.preventDefault();
    hideMenu();
  });
  document.addEventListener("keydown", function (e) {
    if (menu.style.display === "none") return;
    if ((e.key === "Enter" || e.key === " ") && !btn.disabled) hideMenu();
    if (e.key === "Escape" && !btn.disabled) hideMenu();
  });

  // show and focus
  menu.style.display = "flex";
  document.body.classList.add("start-open");
  setTimeout(() => btn.focus(), 120);
}

// ==================== HUD UPDATE ====================

function updateHUD(distance) {
  let hudElement = document.getElementById("nearest-link");

  // Prioritize selected link over nearest link
  let displayLink = null;
  if (
    gameState.selectedLinkIndex !== null &&
    gameState.selectedLinkIndex < links.length
  ) {
    displayLink = links[gameState.selectedLinkIndex];
  } else if (gameState.nearestLink) {
    displayLink = gameState.nearestLink;
  }

  if (displayLink) {
    let isSelected =
      gameState.selectedLinkIndex !== null &&
      displayLink === links[gameState.selectedLinkIndex];
    let linkDistance = displayLink.getDistance(ship.x, ship.y);

    // Only show the S/Select instruction on desktop (not mobile)
    const isMobile =
      window.matchMedia &&
      window.matchMedia(
        "(max-width: " + GAME_CONFIG.mobileBreakpoint + "px)"
      ).matches;
    hudElement.innerHTML = `
          <div class="link-info">
            <strong style="color: ${isSelected ? "#00ff00" : "#00ffff"}">${
      displayLink.data.title
    }</strong>${isSelected ? " (SELECTED)" : ""}<br>
            ${displayLink.data.description}<br>
            <span style="color: #ffaa00;">${displayLink.data.category}</span>
          </div>
          <div class="distance">Distanz: ${Math.round(linkDistance)}px</div>
          <div style="color: #888; margin-top: 10px;">
            ${
              !isMobile
                ? isSelected
                  ? "S um zum nächsten Link zu wechseln"
                  : "S um Link zu wählen"
                : ""
            }
            ${
              linkDistance < GAME_CONFIG.activationDistance
                ? "<br>⏎ ENTER zum Öffnen"
                : ""
            }
          </div>
        `;
  } else {
    hudElement.innerHTML = `Erkunde den Raum...`;
  }
}
