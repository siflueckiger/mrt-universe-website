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
  const nextLinkButton = document.getElementById("next-link-button");

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
    activateLink();
  });

  actionButton.addEventListener("click", (e) => {
    e.preventDefault();
    if (!gameState.appReady) return;
    activateLink();
  });

  // Next link button
  nextLinkButton.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (!gameState.appReady) return;
    selectNextLink();
  });

  nextLinkButton.addEventListener("click", (e) => {
    e.preventDefault();
    if (!gameState.appReady) return;
    selectNextLink();
  });

  // Update button appearances based on link proximity
  function updateActionButton() {
    if (!gameState.appReady) {
      actionButton.classList.add("inactive");
      nextLinkButton.classList.add("inactive");
      return;
    }

    let selectedLink = null;
    if (
      gameState.selectedLinkIndex !== null &&
      gameState.selectedLinkIndex < links.length
    ) {
      selectedLink = links[gameState.selectedLinkIndex];
    }

    // Action button state — allow opening nearest link if within activationDistance
    let actionable = false;
    if (selectedLink) {
      let d = selectedLink.getDistance(ship.x, ship.y);
      actionable = d < GAME_CONFIG.activationDistance;
    } else if (gameState.nearestLink) {
      let d = gameState.nearestLink.getDistance(ship.x, ship.y);
      actionable = d < GAME_CONFIG.activationDistance;
    }
    if (actionable && gameState.appReady) {
      actionButton.classList.remove("inactive");
    } else {
      actionButton.classList.add("inactive");
    }

    // Next link button state
    if (links.length > 0) {
      nextLinkButton.classList.remove("inactive");
    } else {
      nextLinkButton.classList.add("inactive");
    }
  }

  // Call this in draw loop
  window.updateActionButton = updateActionButton;
}
