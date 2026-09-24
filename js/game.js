// ==================== GAME STATE ====================
// Central mutable state — single source of truth shared across files.

const gameState = {
  // whether the app has finished loading and user dismissed the start menu
  appReady: false,
  nearestLink: null,
  selectedLinkIndex: null,
  // current extra acceleration multiplier (0..maxAccMultiplier)
  accelerationFactor: 0,
};

// ==================== GLOBALS ====================

let stars = [];
let ship;
let links = [];
let navi = [];
let planets = [];

// ==================== P5.JS SETUP ====================

function setup() {
  createCanvas(windowWidth, windowHeight);
  smooth();
  textAlign(CENTER, CENTER);

  // Stars
  for (let i = 0; i < GAME_CONFIG.counts.stars; i++) {
    stars.push(new Star(random(width), random(height)));
  }

  // Ship
  ship = new Ship(width / 2, height / 2);

  // Links
  for (let i = 0; i < linkData.length; i++) {
    let x = random(GAME_CONFIG.worldBounds.minX, width + GAME_CONFIG.worldBounds.maxX);
    let y = random(GAME_CONFIG.worldBounds.minY, height + GAME_CONFIG.worldBounds.maxY);
    links.push(new Link(x, y, linkData[i]));
    navi.push(new Navigator());
  }

  // Planets
  for (let i = 0; i < GAME_CONFIG.counts.planets; i++) {
    let x = random(GAME_CONFIG.worldBounds.minX, width + GAME_CONFIG.worldBounds.maxX);
    let y = random(GAME_CONFIG.worldBounds.minY, height + GAME_CONFIG.worldBounds.maxY);
    planets.push(new Planet(x, y));
  }

  // Mobile controls
  setupMobileControls();
}

// ==================== P5.JS DRAW ====================

function draw() {
  background(10, 10, 30);

  // Stars
  for (let star of stars) {
    star.display();
    star.checkBorder();
  }

  // Planets
  for (let planet of planets) {
    planet.display();
  }

  // Find nearest link
  gameState.nearestLink = null;
  let minDist = Infinity;
  for (let link of links) {
    let d = link.getDistance(ship.x, ship.y);
    if (d < minDist) {
      minDist = d;
      gameState.nearestLink = link;
    }
  }

  // Navigators - show direction to links
  for (let i = 0; i < links.length; i++) {
    let isNearest = links[i] === gameState.nearestLink;
    let col = isNearest ? color(0, 255, 255, 180) : color(255, 0, 0, 180);
    let linkName = links[i].data.title;
    let nb = GAME_CONFIG.navBorder;

    // Draw indicators on borders
    navi[i].lineLine(
      links[i].x,
      links[i].y,
      ship.x,
      ship.y,
      nb,
      nb,
      nb,
      height - nb,
      col,
      linkName
    );
    navi[i].lineLine(
      links[i].x,
      links[i].y,
      ship.x,
      ship.y,
      width - nb,
      nb,
      width - nb,
      height - nb,
      col,
      linkName
    );
    navi[i].lineLine(
      links[i].x,
      links[i].y,
      ship.x,
      ship.y,
      nb,
      nb,
      width - nb,
      nb,
      col,
      linkName
    );
    navi[i].lineLine(
      links[i].x,
      links[i].y,
      ship.x,
      ship.y,
      nb,
      height - nb,
      width - nb,
      height - nb,
      col,
      linkName
    );
  }

  // Display links
  for (let link of links) {
    let isNearest = link === gameState.nearestLink;
    link.display(isNearest);
  }

  // Draw navigation line to selected link
  if (
    gameState.selectedLinkIndex !== null &&
    gameState.selectedLinkIndex < links.length
  ) {
    let selectedLink = links[gameState.selectedLinkIndex];
    // Random neon color
    let hue = random(360);
    colorMode(HSB);
    stroke(hue, 100, 100);
    colorMode(RGB);
    strokeWeight(4);
    line(ship.x, ship.y, selectedLink.x, selectedLink.y);
  }

  // Ship
  ship.display();

  // Handle input
  handleInput();

  // Update HUD
  updateHUD(minDist);

  // Update mobile action button state
  if (window.updateActionButton) {
    window.updateActionButton();
  }
}

// ==================== INPUT HANDLING ====================

function handleInput() {
  // Ignore input until app is ready
  if (!gameState.appReady) return;
  // Determine input direction from keyboard and joystick
  let inputX = 0;
  let inputY = 0;
  if (keyIsDown(LEFT_ARROW)) {
    inputX -= 1;
  }
  if (keyIsDown(RIGHT_ARROW)) {
    inputX += 1;
  }
  if (keyIsDown(UP_ARROW)) {
    inputY -= 1;
  }
  if (keyIsDown(DOWN_ARROW)) {
    inputY += 1;
  }

  // Add joystick direction (analog)
  if (joystick.active) {
    if (Math.abs(joystick.deltaX) > GAME_CONFIG.joystick.deadzone)
      inputX += Math.sign(joystick.deltaX);
    if (Math.abs(joystick.deltaY) > GAME_CONFIG.joystick.deadzone)
      inputY += Math.sign(joystick.deltaY);
  }

  let moving = inputX !== 0 || inputY !== 0;

  // If the selected link is on-screen or within activation distance, stop movement, reset acceleration and deselect
  if (
    gameState.selectedLinkIndex !== null &&
    gameState.selectedLinkIndex < links.length
  ) {
    let selReach = links[gameState.selectedLinkIndex];

    // On-screen check: deselect as soon as the link is visible on the canvas
    if (
      selReach.x >= 0 &&
      selReach.x <= width &&
      selReach.y >= 0 &&
      selReach.y <= height
    ) {
      gameState.accelerationFactor = 0;
      gameState.selectedLinkIndex = null;
      return;
    }

    let dReach = selReach.getDistance(ship.x, ship.y);
    if (dReach <= GAME_CONFIG.activationDistance) {
      // we reached the link; stop movement, reset acceleration and deselect it
      gameState.accelerationFactor = 0;
      gameState.selectedLinkIndex = null;
      return;
    }
  }

  // Acceleration towards selected link when moving in its direction
  if (
    gameState.selectedLinkIndex !== null &&
    gameState.selectedLinkIndex < links.length &&
    moving
  ) {
    let sel = links[gameState.selectedLinkIndex];
    let lx = sel.x - ship.x;
    let ly = sel.y - ship.y;
    let distToLink = Math.sqrt(lx * lx + ly * ly);

    if (distToLink > 0) {
      let nlx = lx / distToLink;
      let nly = ly / distToLink;

      let lenInput = Math.sqrt(inputX * inputX + inputY * inputY);
      let nix = inputX / lenInput;
      let niy = inputY / lenInput;

      // dot product: 1 means exact same direction
      let dot = nlx * nix + nly * niy;

      if (dot > 0.7) {
        gameState.accelerationFactor = Math.min(
          GAME_CONFIG.movement.maxAccMultiplier,
          gameState.accelerationFactor + GAME_CONFIG.movement.accRate
        );
      } else {
        gameState.accelerationFactor = Math.max(
          0,
          gameState.accelerationFactor - GAME_CONFIG.movement.decRate
        );
      }
    } else {
      gameState.accelerationFactor = 0;
    }
  } else {
    // decay acceleration when not moving toward selected link
    gameState.accelerationFactor = Math.max(
      0,
      gameState.accelerationFactor - GAME_CONFIG.movement.decRate
    );
  }

  // Compute move speeds including acceleration
  let moveSpeed =
    GAME_CONFIG.movement.baseSpeed * (1 + gameState.accelerationFactor);

  // Keyboard movement (preserve original sign convention)
  if (keyIsDown(LEFT_ARROW)) {
    moveObjects("x", moveSpeed);
  }
  if (keyIsDown(RIGHT_ARROW)) {
    moveObjects("x", -moveSpeed);
  }
  if (keyIsDown(UP_ARROW)) {
    moveObjects("y", moveSpeed);
  }
  if (keyIsDown(DOWN_ARROW)) {
    moveObjects("y", -moveSpeed);
  }

  // Joystick controls (scaled and affected by acceleration)
  if (joystick.active) {
    let speedMultiplier =
      GAME_CONFIG.joystick.speedScale * (1 + gameState.accelerationFactor);
    if (Math.abs(joystick.deltaX) > GAME_CONFIG.joystick.deadzone) {
      moveObjects("x", -joystick.deltaX * speedMultiplier);
    }
    if (Math.abs(joystick.deltaY) > GAME_CONFIG.joystick.deadzone) {
      moveObjects("y", -joystick.deltaY * speedMultiplier);
    }
  }
}

function moveObjects(axis, speed) {
  for (let star of stars) {
    star[axis] += star.speed * speed;
  }
  for (let link of links) {
    link[axis] += link.speed * speed;
  }
  for (let planet of planets) {
    planet[axis] += planet.speed * speed;
  }
}

function keyPressed() {
  if (!gameState.appReady) return; // ignore keys until start menu dismissed
  // Open link on ENTER or SPACE
  if ((key === "Enter" || key === " ") && gameState.nearestLink) {
    tryOpenLink(gameState.nearestLink);
  }
  // Next link on S key
  if (key === "s" || key === "S") {
    selectNextLink();
  }
  // Deselect on ESC key
  if (key === "Escape") {
    gameState.selectedLinkIndex = null;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  ship.x = width / 2;
  ship.y = height / 2;
}

// ==================== LINK SELECTION / ACTIVATION ====================

function selectNextLink() {
  if (links.length === 0) return;

  // Start searching after the current selection (or from 0 if none)
  let start =
    gameState.selectedLinkIndex === null
      ? 0
      : (gameState.selectedLinkIndex + 1) % links.length;
  let found = null;

  // Loop through all links at most once and pick the first off-screen link
  for (let i = 0; i < links.length; i++) {
    let idx = (start + i) % links.length;
    let l = links[idx];
    let onScreen = l.x >= 0 && l.x <= width && l.y >= 0 && l.y <= height;
    if (!onScreen) {
      found = idx;
      break;
    }
  }

  if (found !== null) {
    gameState.selectedLinkIndex = found;
  } else {
    // No off-screen links available — clear selection
    gameState.selectedLinkIndex = null;
  }
}

// Single entry point for opening a link (keyboard + mobile button)
function tryOpenLink(link) {
  if (!link) return;
  let d = link.getDistance(ship.x, ship.y);
  if (d < GAME_CONFIG.activationDistance) {
    window.open(link.data.url, "_blank");
    // reset acceleration when a link is reached/opened
    gameState.accelerationFactor = 0;
  }
}

function activateLink() {
  if (!gameState.appReady) return;
  // Prefer selected link, fall back to nearest link if close enough
  let linkToOpen = null;
  if (
    gameState.selectedLinkIndex !== null &&
    gameState.selectedLinkIndex < links.length
  ) {
    linkToOpen = links[gameState.selectedLinkIndex];
  } else if (gameState.nearestLink) {
    linkToOpen = gameState.nearestLink;
  }

  tryOpenLink(linkToOpen);
}

// ==================== BOOT ====================
// p5.js loads from CDN; fail loudly instead of a silent black screen
// if the network is unavailable.

function bootGame() {
  if (typeof p5 === "undefined") {
    const hud = document.getElementById("nearest-link");
    if (hud) {
      hud.innerHTML =
        '<strong style="color: #ff5555">Fehler:</strong> p5.js konnte nicht geladen werden. Bitte Internetverbindung prüfen und die Seite neu laden.';
    }
    return;
  }
  initStartMenu();
}
bootGame();
