// ==================== MOBILE CONTROLS ====================

// Joystick input state (read by handleInput in game.js)
let joystick = {
  active: false,
  startX: 0,
  startY: 0,
  deltaX: 0,
  deltaY: 0,
};

function setupMobileControls() {
  const joystickBase = document.getElementById("joystick-base");
  const joystickStick = document.getElementById("joystick-stick");
  const actionButton = document.getElementById("action-button");

  // Joystick controls
  function handleJoystickStart(e) {
    e.preventDefault();
    joystick.active = true;
    const rect = joystickBase.getBoundingClientRect();
    joystick.startX = rect.left + rect.width / 2;
    joystick.startY = rect.top + rect.height / 2;
  }

  function handleJoystickMove(e) {
    if (!joystick.active) return;
    e.preventDefault();

    const touch = e.touches ? e.touches[0] : e;
    const rect = joystickBase.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate delta from center
    let deltaX = touch.clientX - centerX;
    let deltaY = touch.clientY - centerY;

    // Limit to max distance
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distance > GAME_CONFIG.joystick.maxDistance) {
      const angle = Math.atan2(deltaY, deltaX);
      deltaX = Math.cos(angle) * GAME_CONFIG.joystick.maxDistance;
      deltaY = Math.sin(angle) * GAME_CONFIG.joystick.maxDistance;
    }

    joystick.deltaX = deltaX;
    joystick.deltaY = deltaY;

    // Update stick position
    joystickStick.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
  }

  function handleJoystickEnd(e) {
    e.preventDefault();
    joystick.active = false;
    joystick.deltaX = 0;
    joystick.deltaY = 0;
    joystickStick.style.transform = "translate(-50%, -50%)";
  }

  // Touch events for joystick
  joystickBase.addEventListener("touchstart", handleJoystickStart);
  document.addEventListener("touchmove", handleJoystickMove);
  document.addEventListener("touchend", handleJoystickEnd);

  // Mouse events for testing on desktop
  joystickBase.addEventListener("mousedown", handleJoystickStart);
  document.addEventListener("mousemove", handleJoystickMove);
  document.addEventListener("mouseup", handleJoystickEnd);

  // Action button
  actionButton.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (!gameState.appReady) return;
    if (gameState.catMode) {
      fireCatLaser();
      return;
    }
    activateLink();
  });

  actionButton.addEventListener("click", (e) => {
    e.preventDefault();
    if (!gameState.appReady) return;
    if (gameState.catMode) {
      fireCatLaser();
      return;
    }
    activateLink();
  });

  // Update button appearances based on link proximity / cat mode
  let lastActionable = null;
  let lastGlyph = "⏎";

  function updateActionButton() {
    // In cat mode the button is always a fire trigger
    if (gameState.appReady && gameState.catMode) {
      if (lastGlyph !== "🔥") {
        lastGlyph = "🔥";
        actionButton.textContent = "🔥";
      }
      if (lastActionable !== true) {
        lastActionable = true;
        actionButton.classList.remove("inactive");
      }
      return;
    }

    if (lastGlyph !== "⏎") {
      lastGlyph = "⏎";
      actionButton.textContent = "⏎";
    }

    // Action button state — allow opening the target link if within activationDistance
    let actionable = false;
    if (gameState.appReady) {
      let target = getTargetLink();
      if (target) {
        let d = target.getDistance(ship.x, ship.y);
        actionable = d < GAME_CONFIG.activationDistance;
      }
    }

    // Only touch the DOM when the state actually changed
    if (actionable !== lastActionable) {
      lastActionable = actionable;
      actionButton.classList.toggle("inactive", !actionable);
    }
  }

  // Call this in draw loop
  window.updateActionButton = updateActionButton;
}
