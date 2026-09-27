// ==================== GAME STATE ====================
// Central mutable state — single source of truth shared across files.

const gameState = {
  // the game is playable immediately; the info menu is optional (I key)
  appReady: true,
  nearestLink: null,
  selectedLinkIndex: null,
  // current extra acceleration multiplier (0..maxAccMultiplier)
  accelerationFactor: 0,
  // autopilot hyperdrive toward the pinned link (J)
  warpActive: false,
  // end-game reward: cat-headed ship of destruction (C toggles for debug)
  catMode: false,
  laserTarget: null,
  laserFrames: 0,
  screenShakeFrames: 0,
  // rapid/auto fire state (F toggles auto; holding SPACE rapid-fires)
  autoFire: false,
  fireCooldown: 0,
  // end state: everything destroyed -> giant cat over the void (+ rebirth)
  voidReached: false,
  voidFade: 0,
};

// ==================== GLOBALS ====================

let stars = [];
let ship;
let links = [];
let navi = [];
let planets = [];
let nebulae = [];
let asteroids = [];
let particles = [];
let trash = [];

// Number of trash pieces collected this session (depletes; resets on reload)
let trashCollected = 0;

// Cat-mode explosion shards + shockwave rings
let explosions = [];

// Screen-space hyperspace streaks shown while warping
let warpStreaks = [];

// Debounce for the J toggle so OS key-repeat doesn't flicker the warp
let lastWarpToggle = 0;

// Titles of links the player has opened (session-only, resets on reload)
let visited = new Set();

// ==================== P5.JS SETUP ====================

function setup() {
  createCanvas(windowWidth, windowHeight);
  smooth();
  textAlign(CENTER, CENTER);

  // Auto-fire starts from config (debug helper / ?chaos runs)
  gameState.autoFire = GAME_CONFIG.catMode.autoFire;

  // Ship + optional external art are created once; the world itself can be
  // rebuilt by rebirthUniverse().
  ship = new Ship(width / 2, height / 2);
  loadTrashImages();
  loadCatImage();
  spawnWorld();

  // Debug: boot straight into Cat Chaos via ?chaos=1 / ?cat=1
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("chaos") === "1" || params.get("cat") === "1") {
      setCatMode(true);
    }
    // Debug: jump to the end state via ?void=1 (nothing left to destroy)
    if (params.get("void") === "1") {
      links = [];
      navi = [];
      planets = [];
      asteroids = [];
      setCatMode(true);
    }
  } catch (e) {
    // URLSearchParams unavailable: ignore
  }

  // Mobile controls
  setupMobileControls();
}

// (Re)build the cosmos from scratch. Used by setup() and rebirth.
function spawnWorld() {
  stars = [];
  links = [];
  navi = [];
  planets = [];
  nebulae = [];
  asteroids = [];
  particles = [];
  explosions = [];
  trash = [];
  warpStreaks = [];
  trashCollected = 0;
  visited = new Set();

  // Stars
  for (let i = 0; i < GAME_CONFIG.counts.stars; i++) {
    stars.push(new Star(random(width), random(height)));
  }

  // Links — rejection-sample positions so links never spawn too close to
  // each other or to the ship (falls back to the most spaced candidate).
  for (let i = 0; i < linkData.length; i++) {
    const minLink = GAME_CONFIG.link.minDistance;
    const minShip = GAME_CONFIG.link.minShipDistance;
    let bestX = 0;
    let bestY = 0;
    let bestScore = -1;
    for (let attempt = 0; attempt < 200; attempt++) {
      let cx = random(
        GAME_CONFIG.worldBounds.minX,
        width + GAME_CONFIG.worldBounds.maxX
      );
      let cy = random(
        GAME_CONFIG.worldBounds.minY,
        height + GAME_CONFIG.worldBounds.maxY
      );
      let closestLink = Infinity;
      for (let other of links) {
        closestLink = Math.min(closestLink, dist(cx, cy, other.x, other.y));
      }
      let shipDist = dist(cx, cy, ship.x, ship.y);
      let score = Math.min(closestLink, shipDist);
      if (score > bestScore) {
        bestScore = score;
        bestX = cx;
        bestY = cy;
      }
      if (closestLink >= minLink && shipDist >= minShip) {
        bestX = cx;
        bestY = cy;
        break;
      }
    }
    links.push(new Link(bestX, bestY, linkData[i]));
    navi.push(new Navigator());
  }

  // Planets
  for (let i = 0; i < GAME_CONFIG.counts.planets; i++) {
    let x = random(GAME_CONFIG.worldBounds.minX, width + GAME_CONFIG.worldBounds.maxX);
    let y = random(GAME_CONFIG.worldBounds.minY, height + GAME_CONFIG.worldBounds.maxY);
    planets.push(new Planet(x, y));
  }

  // Nebulae (background space clouds)
  for (let i = 0; i < GAME_CONFIG.counts.nebulae; i++) {
    let x = random(GAME_CONFIG.worldBounds.minX, width + GAME_CONFIG.worldBounds.maxX);
    let y = random(GAME_CONFIG.worldBounds.minY, height + GAME_CONFIG.worldBounds.maxY);
    nebulae.push(new Nebula(x, y));
  }

  // Asteroids (space rocks)
  for (let i = 0; i < GAME_CONFIG.counts.asteroids; i++) {
    let x = random(GAME_CONFIG.worldBounds.minX, width + GAME_CONFIG.worldBounds.maxX);
    let y = random(GAME_CONFIG.worldBounds.minY, height + GAME_CONFIG.worldBounds.maxY);
    asteroids.push(new Asteroid(x, y));
  }

  // Trash collectibles — rejection-sampled away from links and the ship
  for (let i = 0; i < GAME_CONFIG.counts.trash; i++) {
    let tx = 0;
    let ty = 0;
    let bestScore = -1;
    for (let attempt = 0; attempt < 120; attempt++) {
      let cx = random(GAME_CONFIG.worldBounds.minX, width + GAME_CONFIG.worldBounds.maxX);
      let cy = random(GAME_CONFIG.worldBounds.minY, height + GAME_CONFIG.worldBounds.maxY);
      let closest = Infinity;
      for (let link of links) {
        closest = Math.min(closest, dist(cx, cy, link.x, link.y));
      }
      let shipDist = dist(cx, cy, ship.x, ship.y);
      let score = Math.min(closest, shipDist);
      if (score > bestScore) {
        bestScore = score;
        tx = cx;
        ty = cy;
      }
      if (closest >= GAME_CONFIG.link.minDistance && shipDist >= GAME_CONFIG.link.minShipDistance) {
        break;
      }
    }
    trash.push(new Trash(tx, ty));
  }

  // Fresh state for the new cosmos
  gameState.nearestLink = null;
  gameState.selectedLinkIndex = null;
  gameState.accelerationFactor = 0;
  gameState.warpActive = false;
  gameState.voidReached = false;
}

// ==================== P5.JS DRAW ====================

function draw() {
  background(10, 10, 30);

  // Cat-mode destruction screen shake (world only; HUD/minimap stay stable)
  let shakeX = 0;
  let shakeY = 0;
  if (gameState.screenShakeFrames > 0) {
    const s = GAME_CONFIG.catMode.screenShake;
    shakeX = random(-s, s);
    shakeY = random(-s, s);
    gameState.screenShakeFrames--;
  }
  // Endless ambient dread rattle that grows as the cosmos is destroyed
  if (gameState.catMode) {
    const ambient = chaosProgress() * GAME_CONFIG.catMode.ambientShakeMax;
    if (ambient > 0) {
      shakeX += random(-ambient, ambient);
      shakeY += random(-ambient, ambient);
    }
  }
  const shaking = shakeX !== 0 || shakeY !== 0;
  if (shaking) {
    push();
    translate(shakeX, shakeY);
  }
  if (gameState.laserFrames > 0) gameState.laserFrames--;
  if (gameState.fireCooldown > 0) gameState.fireCooldown--;

  // Detect the "everything destroyed" end state
  updateVoid();

  // Stars
  for (let star of stars) {
    star.display();
    star.checkBorder();
  }

  // Nebulae (rendered behind celestial bodies)
  for (let nebula of nebulae) {
    nebula.update();
    nebula.display();
  }
  // Guard against any blend-mode leakage from the nebula pass
  blendMode(BLEND);

  // Asteroids
  for (let asteroid of asteroids) {
    asteroid.update();
    asteroid.display();
  }

  // Planets
  for (let planet of planets) {
    planet.display();
  }

  // Trash collectibles (update, draw, and check for pickups)
  for (let i = trash.length - 1; i >= 0; i--) {
    let t = trash[i];
    t.update();
    t.display();
    if (t.getDistance(ship.x, ship.y) <= GAME_CONFIG.trash.pickupDistance) {
      collectTrash(i);
    }
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

  // Navigators - show direction to links (silenced in Cat Chaos; the
  // on-screen target chevrons take over there)
  if (!gameState.catMode)
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

  // Update & display thruster particles (behind the ship)
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.update();
    p.display();
    if (p.isDead()) {
      particles.splice(i, 1);
    }
  }

  // Cat-mode explosion shards + shockwaves
  for (let i = explosions.length - 1; i >= 0; i--) {
    let e = explosions[i];
    e.update();
    e.display();
    if (e.isDead()) explosions.splice(i, 1);
  }

  // Hyperspace streaks while warping (behind the ship)
  drawWarpStreaks();

  // Ship
  ship.display();

  // Cat-mode laser beam (from the cat's eyes to the locked target)
  drawLaser();

  // Floating ENTER / V prompts when a link is in reach
  drawShipPrompt();

  if (shaking) pop();

  // On-screen guidance toward off-screen victims (Cat Chaos only)
  drawTargetGuidance();

  // End-state: giant cat face fading over the void
  drawVoidCat();

  // Mini-map of the world (hidden in Cat Chaos — guidance moves on-screen)
  if (!gameState.catMode) drawMinimap();

  // Chaos wrath drone swells with destruction progress (silent outside cat mode)
  if (typeof setChaosDrone === "function") {
    setChaosDrone(gameState.catMode ? chaosProgress() : 0);
  }

  // Handle input
  handleInput();

  // Update HUD
  updateHUD();

  // Update mobile action button state
  if (window.updateActionButton) {
    window.updateActionButton();
  }
}

// ==================== INPUT HANDLING ====================

function handleInput() {
  // Ignore input until app is ready or while an overlay is open
  if (!gameState.appReady || linksListOpen || infoMenuOpen || previewOpen) {
    setFlying(false);
    return;
  }

  // Autopilot hyperdrive takes over all movement while active
  if (gameState.warpActive) {
    updateWarp();
    return;
  }

  // Rapid fire: holding SPACE (or auto-fire on) pumps the laser every
  // fireRate frames. Movement still works while firing.
  if (gameState.catMode && (gameState.autoFire || keyIsDown(32))) {
    if (gameState.fireCooldown <= 0) {
      fireCatLaser();
      gameState.fireCooldown = GAME_CONFIG.catMode.fireRate;
    }
  }

  // Determine input direction from keyboard (arrows or WASD) and joystick
  let inputX = 0;
  let inputY = 0;
  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) {
    inputX -= 1; // left / A
  }
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) {
    inputX += 1; // right / D
  }
  if (keyIsDown(UP_ARROW) || keyIsDown(87)) {
    inputY -= 1; // up / W
  }
  if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) {
    inputY += 1; // down / S
  }

  // Add joystick direction (analog)
  if (joystick.active) {
    if (Math.abs(joystick.deltaX) > GAME_CONFIG.joystick.deadzone)
      inputX += Math.sign(joystick.deltaX);
    if (Math.abs(joystick.deltaY) > GAME_CONFIG.joystick.deadzone)
      inputY += Math.sign(joystick.deltaY);
  }

  let moving = inputX !== 0 || inputY !== 0;

  // If the pinned link is within activation distance, stop movement,
  // reset acceleration and deselect
  let blocked = false;
  if (
    gameState.selectedLinkIndex !== null &&
    gameState.selectedLinkIndex < links.length
  ) {
    let selReach = links[gameState.selectedLinkIndex];
    let dReach = selReach.getDistance(ship.x, ship.y);
    if (dReach <= GAME_CONFIG.activationDistance) {
      // we reached the link; stop movement, reset acceleration and deselect it
      gameState.accelerationFactor = 0;
      gameState.selectedLinkIndex = null;
      playSound("reach");
      blocked = true;
    }
  }

  if (!blocked) {
    let hasTarget =
      gameState.selectedLinkIndex !== null &&
      gameState.selectedLinkIndex < links.length;

    if (!moving) {
      // Braking: drop straight back to basic speed so the next
      // movement always starts from baseSpeed again.
      gameState.accelerationFactor = 0;
    } else if (hasTarget) {
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

        if (dot > 0.4) {
          // moving towards the pinned link: ramp up smoothly
          gameState.accelerationFactor = Math.min(
            GAME_CONFIG.movement.maxAccMultiplier,
            gameState.accelerationFactor + GAME_CONFIG.movement.accRate
          );
        } else {
          // steering away: also counts as braking
          gameState.accelerationFactor = 0;
        }
      } else {
        gameState.accelerationFactor = 0;
      }
    } else {
      // moving without a pinned link: let the stored speed decay
      gameState.accelerationFactor = Math.max(
        0,
        gameState.accelerationFactor - GAME_CONFIG.movement.decRate
      );
    }

    // Compute move speeds including acceleration. Cat mode is frantic:
    // everything is faster and the world whips past.
    const catSpeed = gameState.catMode
      ? GAME_CONFIG.catMode.moveSpeedMultiplier
      : 1;
    let moveSpeed =
      GAME_CONFIG.movement.baseSpeed *
      (1 + gameState.accelerationFactor) *
      catSpeed;

    // Keyboard movement (arrows or WASD; preserve original sign convention)
    let movedX = 0;
    let movedY = 0;
    if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) {
      moveObjects("x", moveSpeed);
      movedX += 1;
    }
    if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) {
      moveObjects("x", -moveSpeed);
      movedX -= 1;
    }
    if (keyIsDown(UP_ARROW) || keyIsDown(87)) {
      moveObjects("y", moveSpeed);
      movedY += 1;
    }
    if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) {
      moveObjects("y", -moveSpeed);
      movedY -= 1;
    }

    // Joystick controls (scaled and affected by acceleration)
    if (joystick.active) {
      let speedMultiplier =
        GAME_CONFIG.joystick.speedScale * (1 + gameState.accelerationFactor) * catSpeed;
      if (Math.abs(joystick.deltaX) > GAME_CONFIG.joystick.deadzone) {
        let amt = -joystick.deltaX * speedMultiplier;
        moveObjects("x", amt);
        movedX += amt > 0 ? 1 : -1;
      }
      if (Math.abs(joystick.deltaY) > GAME_CONFIG.joystick.deadzone) {
        let amt = -joystick.deltaY * speedMultiplier;
        moveObjects("y", amt);
        movedY += amt > 0 ? 1 : -1;
      }
    }

    // Spawn thruster particles opposite of movement direction
    if (movedX !== 0 || movedY !== 0) {
      let angle = Math.atan2(movedY, movedX);
      // Cat mode spews far more exhaust for that frantic "AAAAA" feel
      const thrusterMult = gameState.catMode
        ? GAME_CONFIG.catMode.thrusterMultiplier
        : 1;
      const emitCount = Math.round(thrusterMult);
      for (let k = 0; k < emitCount; k++) {
        if (particles.length >= GAME_CONFIG.particles.maxCount) break;
        // Particle shoots opposite the world movement vector
        let pSpeed = random(1.5, 3.5) * catSpeed;
        let pvx = Math.cos(angle) * pSpeed;
        let pvy = Math.sin(angle) * pSpeed;
        // UFO underside emitter position
        let emitX = ship.x + random(-8, 8);
        let emitY = ship.y + 10 + random(-2, 4);
        particles.push(new ThrusterParticle(emitX, emitY, pvx, pvy));
      }
    }
  }

  // UFO hum while the ship is moving
  setFlying(!blocked && moving);
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
  for (let nebula of nebulae) {
    nebula[axis] += nebula.speed * speed;
  }
  for (let asteroid of asteroids) {
    asteroid[axis] += asteroid.speed * speed;
  }
  for (let t of trash) {
    t[axis] += t.speed * speed;
  }
}

// Pick up a trash piece: remove it, bump the counter, blip and burst
function collectTrash(i) {
  const t = trash[i];
  if (!t) return;
  trash.splice(i, 1);
  trashCollected++;
  playSound("pickup");
  for (let k = 0; k < 8; k++) {
    if (particles.length >= GAME_CONFIG.particles.maxCount) break;
    let a = random(TWO_PI);
    let sp = random(1, 3);
    particles.push(
      new ThrusterParticle(t.x, t.y, Math.cos(a) * sp, Math.sin(a) * sp)
    );
  }
  // Collected everything: CAT CHAOS MODE!
  if (trashCollected >= GAME_CONFIG.counts.trash && !gameState.catMode) {
    setCatMode(true);
    gameState.screenShakeFrames = GAME_CONFIG.catMode.screenShake;
  }
}

// ==================== WARP / AUTOPILOT ====================
// J engages a hyperdrive toward the pinned link. Any key cancels it.
// While active the world streams past the centered ship and a set of
// screen-space streaks sells the speed.

function initWarpStreaks() {
  warpStreaks = [];
  for (let i = 0; i < GAME_CONFIG.warp.streaks; i++) {
    warpStreaks.push({
      angle: random(TWO_PI),
      radius: random(40, 800),
      length: random(60, 240),
      speed: random(GAME_CONFIG.warp.streakSpeedMin, GAME_CONFIG.warp.streakSpeedMax),
      alpha: random(50, 170),
    });
  }
}

function startWarp() {
  if (gameState.warpActive) return;
  // Prefer the pinned link; fall back to the nearest one so J always works
  if (gameState.selectedLinkIndex === null) {
    if (!gameState.nearestLink) return;
    gameState.selectedLinkIndex = links.indexOf(gameState.nearestLink);
  }
  gameState.warpActive = true;
  gameState.accelerationFactor = 0;
  initWarpStreaks();
  playSound("warp");
}

function endWarp(silent) {
  if (!gameState.warpActive) return;
  gameState.warpActive = false;
  gameState.accelerationFactor = 0;
  warpStreaks = [];
  if (!silent) playSound("warpEnd");
}

function updateWarp() {
  if (
    gameState.selectedLinkIndex === null ||
    gameState.selectedLinkIndex >= links.length
  ) {
    endWarp();
    return;
  }

  const target = links[gameState.selectedLinkIndex];
  const dx = target.x - ship.x;
  const dy = target.y - ship.y;
  const d = Math.sqrt(dx * dx + dy * dy);

  if (d <= GAME_CONFIG.activationDistance) {
    endWarp();
    playSound("reach");
    return;
  }

  const nx = dx / d;
  const ny = dy / d;
  const speed =
    GAME_CONFIG.movement.baseSpeed * GAME_CONFIG.warp.speedMultiplier;

  // Move the world opposite the target vector so the link streams toward
  // the centered ship.
  moveObjects("x", -nx * speed);
  moveObjects("y", -ny * speed);

  // Exhaust kicked out the back while warping (opposite the travel direction)
  for (let i = 0; i < GAME_CONFIG.warp.emissiveParticles; i++) {
    if (particles.length >= GAME_CONFIG.particles.maxCount) break;
    let pSpeed = random(3, 7);
    particles.push(
      new ThrusterParticle(
        ship.x + random(-10, 10),
        ship.y + 10 + random(-4, 6),
        -nx * pSpeed,
        -ny * pSpeed
      )
    );
  }

  // Advance the hyperspace streaks outward
  for (let s of warpStreaks) {
    s.radius += s.speed;
    if (s.radius > 900) {
      s.radius = random(30, 120);
      s.angle = random(TWO_PI);
      s.length = random(60, 240);
    }
  }

  setFlying(true);
}

function drawWarpStreaks() {
  if (!gameState.warpActive) return;
  push();
  strokeWeight(1.5);
  for (let s of warpStreaks) {
    let x1 = ship.x + cos(s.angle) * s.radius;
    let y1 = ship.y + sin(s.angle) * s.radius;
    let x2 = ship.x + cos(s.angle) * (s.radius + s.length);
    let y2 = ship.y + sin(s.angle) * (s.radius + s.length);
    stroke(150, 220, 255, s.alpha);
    line(x1, y1, x2, y2);
  }
  pop();
}

// ==================== SHIP ACTION PROMPT ====================
// Floating "[ENTER] Open · [V] Preview" pill next to the UFO whenever the
// nearest link is within activationDistance. Hidden during overlays/warp.

function drawShipPrompt() {
  if (
    !gameState.appReady ||
    gameState.catMode ||
    previewOpen ||
    linksListOpen ||
    infoMenuOpen ||
    gameState.warpActive
  ) {
    return;
  }
  const link = gameState.nearestLink;
  if (!link) return;
  if (link.getDistance(ship.x, ship.y) > GAME_CONFIG.activationDistance) return;

  const cfg = GAME_CONFIG.prompt;
  const canPreview = !!getYouTubeId(link.data.url);
  const segments = canPreview
    ? [
        ["[ENTER]", [0, 255, 0]],
        [" Open", [230, 240, 250]],
        ["  ", [0, 0, 0]],
        ["[V]", [0, 255, 0]],
        [" Preview", [230, 240, 250]],
      ]
    : [
        ["[ENTER]", [0, 255, 0]],
        [" Open", [230, 240, 250]],
      ];

  push();
  textFont("Courier New");
  textSize(cfg.fontSize);
  textAlign(LEFT, CENTER);

  let totalW = 0;
  for (let s of segments) totalW += textWidth(s[0]);
  const w = totalW + cfg.paddingX * 2;
  const h = cfg.fontSize + cfg.paddingY * 2;
  const py =
    ship.y -
    cfg.offsetY +
    sin(frameCount * 0.08) * cfg.bobAmplitude;

  // Retro pill background + neon border
  rectMode(CENTER);
  noStroke();
  fill(0, 0, 0, 185);
  rect(ship.x, py, w, h, 6);
  stroke(0, 255, 255, 200);
  strokeWeight(1);
  noFill();
  rect(ship.x, py, w, h, 6);

  // Two-tone label: keys in green, actions in near-white
  noStroke();
  let cursor = ship.x - totalW / 2;
  for (let s of segments) {
    const col = s[1];
    fill(col[0], col[1], col[2]);
    text(s[0], cursor, py);
    cursor += textWidth(s[0]);
  }
  pop();
}

// ==================== CAT CHAOS MODE ====================
// Collecting all trash transforms the ship into a cat-headed engine of
// destruction: SPACE auto-targets the nearest on-screen object and fires.
// C (or ?chaos=1) toggles it directly for testing.

function setCatMode(on) {
  gameState.catMode = !!on;
  if (gameState.catMode) {
    // Awakening fanfare + aggressive roar
    playSound("chaos");
    playSound("roar");
  } else {
    gameState.laserTarget = null;
    gameState.laserFrames = 0;
    gameState.fireCooldown = 0;
    if (typeof stopChaosDrone === "function") stopChaosDrone();
  }
}

function toggleCatMode() {
  setCatMode(!gameState.catMode);
  playSound(gameState.catMode ? "select" : "deselect");
}

// Total destructible objects still standing
function chaosRemaining() {
  return links.length + planets.length + asteroids.length;
}

// Starting number of destructibles (linkData/counts are never mutated)
function chaosTotal() {
  return linkData.length + GAME_CONFIG.counts.planets + GAME_CONFIG.counts.asteroids;
}

// Destruction progress 0..1 (feeds overlay escalation + ambient shake)
function chaosProgress() {
  const total = chaosTotal();
  if (total <= 0) return 1;
  return constrain(1 - chaosRemaining() / total, 0, 1);
}

// Once every destructible is gone the cat ascends over the void
function updateVoid() {
  if (
    gameState.catMode &&
    !gameState.voidReached &&
    chaosRemaining() === 0
  ) {
    gameState.voidReached = true;
    gameState.voidFade = 0;
    gameState.autoFire = false;
    playSound("void");
  }
  if (gameState.voidReached) {
    gameState.voidFade = Math.min(1, gameState.voidFade + 0.012);
  }
}

// Giant translucent cat face fading in over the empty cosmos
function drawVoidCat() {
  if (!gameState.voidReached || gameState.voidFade <= 0) return;
  const f = gameState.voidFade;
  const r = Math.min(width, height) * 0.42;
  const a = f * 200;
  push();
  translate(width / 2, height / 2);
  noStroke();
  // Ears
  fill(40, 8, 28, a);
  triangle(-r * 0.62, -r * 0.3, -r * 0.82, -r * 1.0, -r * 0.12, -r * 0.5);
  triangle(r * 0.62, -r * 0.3, r * 0.82, -r * 1.0, r * 0.12, -r * 0.5);
  // Head
  fill(28, 0, 18, a);
  ellipse(0, 0, r * 1.6, r * 1.4);
  // Glowing eyes
  const glow = 0.6 + 0.4 * sin(frameCount * 0.08);
  fill(255, 30, 30, a * glow);
  ellipse(-r * 0.32, -r * 0.06, r * 0.3, r * 0.34);
  ellipse(r * 0.32, -r * 0.06, r * 0.3, r * 0.34);
  // Nose
  fill(255, 120, 200, a * 0.8);
  triangle(0, r * 0.22, -r * 0.08, r * 0.34, r * 0.08, r * 0.34);
  // Pulsating rebirth prompt beneath the giant cat head
  const pulse = 0.6 + 0.4 * sin(frameCount * 0.12);
  textAlign(CENTER, CENTER);
  textSize(Math.min(width, height) * 0.038);
  fill(0, 255, 255, f * 255 * pulse);
  text("[R] Rebirth the Universe", 0, r * 0.95);
  pop();
}

// ==================== TARGET GUIDANCE ====================
// With the minimap hidden in Cat Chaos, off-screen victims are called out
// on the main screen: an arrow orbiting the cat points at the nearest one
// and neon chevrons sit on the viewport edge for the closest few.

// Palette shared with destruction FX so kinds read consistently
const CAT_TARGET_COLORS = {
  link: [255, 60, 180],
  planet: [255, 160, 40],
  asteroid: [175, 175, 175],
  nebula: [190, 100, 255],
  trash: [0, 255, 255],
};

function isTargetOnScreen(obj, margin) {
  const m = margin || 0;
  return (
    obj.x >= -m && obj.x <= width + m && obj.y >= -m && obj.y <= height + m
  );
}

function drawTargetGuidance() {
  if (!gameState.catMode || gameState.voidReached) return;
  // Keep the screen clear while a pause overlay is up
  if (linksListOpen || infoMenuOpen || previewOpen) return;

  const cfg = GAME_CONFIG.catMode.markers;

  // Gather off-screen finite targets (stars are ignored — they wrap around)
  const offscreen = [];
  const consider = function (obj, kind) {
    if (!obj || typeof obj.x !== "number") return;
    if (isTargetOnScreen(obj, cfg.screenMargin)) return;
    offscreen.push({
      obj: obj,
      kind: kind,
      d: dist(ship.x, ship.y, obj.x, obj.y),
    });
  };
  for (let l of links) consider(l, "link");
  for (let p of planets) consider(p, "planet");
  for (let a of asteroids) consider(a, "asteroid");
  for (let n of nebulae) consider(n, "nebula");
  for (let t of trash) consider(t, "trash");
  if (offscreen.length === 0) return;
  offscreen.sort(function (a, b) {
    return a.d - b.d;
  });

  // Edge chevrons for the nearest off-screen targets
  const shown = offscreen.slice(0, cfg.edgeMarkers);
  for (let m of shown) drawEdgeChevron(m, cfg);

  // Orbiting arrow on the cat pointing at the closest off-screen target
  drawOrbitArrow(offscreen[0], cfg);
}

// Neon triangle pinned to the viewport edge in the target's direction
function drawEdgeChevron(m, cfg) {
  const ang = Math.atan2(m.obj.y - ship.y, m.obj.x - ship.x);
  const dx = Math.cos(ang);
  const dy = Math.sin(ang);
  const left = cfg.edgeInset;
  const right = width - cfg.edgeInset;
  const top = cfg.edgeInset;
  const bottom = height - cfg.edgeInset;
  // Distance along the ray to the first viewport edge it hits
  let s = Infinity;
  if (dx > 0) s = Math.min(s, (right - ship.x) / dx);
  if (dx < 0) s = Math.min(s, (left - ship.x) / dx);
  if (dy > 0) s = Math.min(s, (bottom - ship.y) / dy);
  if (dy < 0) s = Math.min(s, (top - ship.y) / dy);
  if (!isFinite(s) || s <= 0) return;

  const ex = ship.x + dx * s;
  const ey = ship.y + dy * s;
  const col = CAT_TARGET_COLORS[m.kind] || [255, 60, 60];
  const pulse = 0.55 + 0.45 * sin(frameCount * 0.16 + m.d * 0.01);

  push();
  translate(ex, ey);
  rotate(ang);
  noStroke();
  const a = cfg.arrowSize * (0.85 + 0.25 * pulse);
  fill(col[0], col[1], col[2], 220 * pulse);
  triangle(a, 0, -a * 0.7, -a * 0.62, -a * 0.7, a * 0.62);
  pop();
}

// Pulsing arrow orbiting the cat head, aimed at the nearest off-screen target
function drawOrbitArrow(m, cfg) {
  const ang = Math.atan2(m.obj.y - ship.y, m.obj.x - ship.x);
  const pulse = 1 + 0.16 * sin(frameCount * 0.2);
  const col = CAT_TARGET_COLORS[m.kind] || [255, 60, 60];
  const px = ship.x + Math.cos(ang) * cfg.orbitRadius;
  const py = ship.y + Math.sin(ang) * cfg.orbitRadius;

  push();
  translate(px, py);
  rotate(ang);
  noStroke();
  const s = cfg.arrowSize * pulse;
  fill(255, 40, 40, 90);
  triangle(s * 1.3, 0, -s * 0.9, -s * 0.9, -s * 0.9, s * 0.9);
  fill(col[0], col[1], col[2], 240);
  triangle(s, 0, -s * 0.6, -s * 0.6, -s * 0.6, s * 0.6);
  pop();
}

// R respawns the cosmos after the void is reached
function rebirthUniverse() {
  if (!gameState.voidReached) return;
  setCatMode(false);
  spawnWorld();
  ship.x = width / 2;
  ship.y = height / 2;
  gameState.voidFade = 0;
  gameState.screenShakeFrames = GAME_CONFIG.catMode.screenShake * 2;
  playSound("chaos");
  // Big-bang flash from the center of the newborn universe
  explosions.push(new SupernovaFlash(width / 2, height / 2, [255, 255, 255]));
  explosions.push(new Shockwave(width / 2, height / 2, [255, 240, 200], 6));
}

// Nearest destructible object that is currently on screen. Major bodies
// (links/planets/asteroids) always win so the cat doesn't waste shots on
// the starfield; nebulae -> trash -> stars are bonus targets of last resort.
function getNearestOnScreenTarget() {
  let best = null;
  let bestDist = Infinity;
  const consider = function (obj, kind) {
    if (!obj || typeof obj.x !== "number") return;
    if (obj.x < 0 || obj.x > width || obj.y < 0 || obj.y > height) return;
    const d = dist(ship.x, ship.y, obj.x, obj.y);
    if (d < bestDist) {
      bestDist = d;
      best = { obj: obj, kind: kind };
    }
  };
  for (let p of planets) consider(p, "planet");
  for (let a of asteroids) consider(a, "asteroid");
  for (let l of links) consider(l, "link");
  if (best) return best;
  for (let n of nebulae) consider(n, "nebula");
  if (best) return best;
  for (let t of trash) consider(t, "trash");
  if (best) return best;
  for (let s of stars) consider(s, "star");
  return best;
}

// Per-destruction color palette (shards, shockwave, flash)
const CAT_FX_COLORS = {
  planet: [[200, 130, 70], [255, 180, 90], [150, 100, 80], [120, 90, 70]],
  asteroid: [[130, 120, 110], [100, 90, 80], [170, 150, 130]],
  link: [[255, 80, 190], [90, 255, 255], [255, 220, 80], [160, 120, 255]],
  star: [[255, 255, 255], [255, 240, 160], [180, 220, 255]],
  nebula: [[180, 120, 255], [255, 120, 220], [120, 220, 255]],
  trash: [[190, 220, 220], [255, 130, 130], [255, 220, 120]],
};

function createExplosion(x, y, kind, source) {
  kind = kind || "planet";
  const colors = CAT_FX_COLORS[kind] || CAT_FX_COLORS.planet;
  const scale = kind === "planet" ? 1.5 : kind === "star" ? 1.2 : 1;
  explosions.push(new Shockwave(x, y, colors[0], scale));

  // Lighter objects throw fewer shards
  let count = GAME_CONFIG.catMode.explosionParticles;
  if (kind === "asteroid") count = Math.round(count * 0.7);
  else if (kind === "star") count = Math.round(count * 0.55);
  else if (kind === "nebula" || kind === "trash") {
    count = Math.round(count * 0.4);
  }
  for (let i = 0; i < count; i++) {
    explosions.push(new ExplosionShard(x, y, random(colors)));
  }

  if (kind === "star") {
    explosions.push(new SupernovaFlash(x, y, colors[0]));
  } else if (kind === "nebula" && source) {
    explosions.push(new GasBurst(x, y, source.hue, source.size));
  } else if (kind === "link" && source && source.data) {
    spawnTitleShards(x, y, source.data.title);
  }

  // Big kills throw a wide shockwave, scatter persistent wreckage and shove
  // nearby objects outward.
  if (kind === "planet" || kind === "link") {
    explosions.push(new Shockwave(x, y, colors[0], 2.4));
    for (let i = 0; i < GAME_CONFIG.catMode.wreckagePieces; i++) {
      explosions.push(new Wreckage(x, y));
    }
    nudgeNearby(
      x,
      y,
      GAME_CONFIG.catMode.bigShockRadius,
      GAME_CONFIG.catMode.bigShockStrength
    );
  }
}

// Shove world objects away from a big-kill epicenter
function nudgeNearby(x, y, radius, strength) {
  const shove = function (obj) {
    if (!obj || typeof obj.x !== "number") return;
    const d = dist(x, y, obj.x, obj.y);
    if (d <= 0 || d > radius) return;
    const f = (1 - d / radius) * strength;
    obj.x += ((obj.x - x) / d) * f;
    obj.y += ((obj.y - y) / d) * f;
  };
  for (let s of stars) shove(s);
  for (let p of planets) shove(p);
  for (let a of asteroids) shove(a);
  for (let n of nebulae) shove(n);
  for (let t of trash) shove(t);
  for (let l of links) shove(l);
}

// Nearby finite destructibles (stars excluded so cascades can't run away)
function findNearbyTargets(x, y, radius) {
  const found = [];
  const check = function (obj, kind) {
    if (!obj || typeof obj.x !== "number") return;
    if (dist(x, y, obj.x, obj.y) <= radius) found.push({ obj: obj, kind: kind });
  };
  for (let p of planets) check(p, "planet");
  for (let a of asteroids) check(a, "asteroid");
  for (let l of links) check(l, "link");
  for (let n of nebulae) check(n, "nebula");
  for (let t of trash) check(t, "trash");
  return found;
}

// A blast can set off nearby objects, which can set off further ones
function igniteCascade(x, y, depth) {
  if (depth > GAME_CONFIG.catMode.cascadeMaxDepth) return;
  const nearby = findNearbyTargets(x, y, GAME_CONFIG.catMode.cascadeRadius);
  for (let t of nearby) {
    if (random() < GAME_CONFIG.catMode.cascadeChance) {
      createExplosion(t.obj.x, t.obj.y, t.kind, t.obj);
      playSound("explosion");
      destroyTarget(t);
      igniteCascade(t.obj.x, t.obj.y, depth + 1);
    }
  }
}

// Scatter a destroyed link's title as spinning, fading letters
function spawnTitleShards(x, y, title) {
  const chars = String(title || "").split("");
  let placed = 0;
  const total = chars.length;
  for (let i = 0; i < total; i++) {
    const ch = chars[i];
    if (ch === " ") continue;
    const col = random(CAT_FX_COLORS.link);
    const s = new TextShard(x, y, ch, col);
    // Fan the letters out in reading order (-PI/2 is straight up)
    const a =
      map(placed, 0, Math.max(1, total - 1), -PI * 0.9, -PI * 0.1) +
      random(-0.2, 0.2);
    const sp = random(2.5, 5.5);
    s.vx = Math.cos(a) * sp;
    s.vy = Math.sin(a) * sp;
    explosions.push(s);
    placed++;
  }
}

function destroyTarget(t) {
  if (t.kind === "link") {
    const idx = links.indexOf(t.obj);
    if (idx >= 0) {
      links.splice(idx, 1);
      navi.splice(idx, 1);
    }
    if (gameState.selectedLinkIndex === idx) {
      gameState.selectedLinkIndex = null;
    } else if (
      gameState.selectedLinkIndex !== null &&
      gameState.selectedLinkIndex > idx
    ) {
      gameState.selectedLinkIndex--;
    }
    if (gameState.nearestLink === t.obj) gameState.nearestLink = null;
  } else if (t.kind === "planet") {
    const idx = planets.indexOf(t.obj);
    if (idx >= 0) planets.splice(idx, 1);
  } else if (t.kind === "asteroid") {
    const idx = asteroids.indexOf(t.obj);
    if (idx >= 0) asteroids.splice(idx, 1);
  } else if (t.kind === "nebula") {
    const idx = nebulae.indexOf(t.obj);
    if (idx >= 0) nebulae.splice(idx, 1);
  } else if (t.kind === "trash") {
    const idx = trash.indexOf(t.obj);
    if (idx >= 0) trash.splice(idx, 1);
  } else if (t.kind === "star") {
    const idx = stars.indexOf(t.obj);
    if (idx >= 0) stars.splice(idx, 1);
  }
}

function fireCatLaser() {
  if (!gameState.catMode) return;

  const target = getNearestOnScreenTarget();
  if (!target) {
    // Nothing to hit: don't shake, spark or blip (matters for auto-fire)
    gameState.laserTarget = null;
    return;
  }

  gameState.laserFrames = GAME_CONFIG.catMode.laserFrames;
  gameState.screenShakeFrames = GAME_CONFIG.catMode.screenShake;
  playSound("laser");
  gameState.laserTarget = { x: target.obj.x, y: target.obj.y };
  createExplosion(target.obj.x, target.obj.y, target.kind, target.obj);
  const destroySound = {
    star: "star",
    planet: "planet",
    nebula: "nebula",
    link: "linkPop",
  };
  playSound(destroySound[target.kind] || "explosion");
  const hx = target.obj.x;
  const hy = target.obj.y;
  destroyTarget(target);
  igniteCascade(hx, hy, 1);
}

function drawLaser() {
  const t = gameState.laserTarget;
  if (!t || gameState.laserFrames <= 0) return;
  const r = ship.size * GAME_CONFIG.catMode.scale;
  const eyeY = ship.y - r * 0.06;
  const exL = ship.x - r * 0.32;
  const exR = ship.x + r * 0.32;
  const a = map(
    gameState.laserFrames,
    0,
    GAME_CONFIG.catMode.laserFrames,
    0,
    255
  );
  push();
  strokeCap(ROUND);
  stroke(255, 60, 60, a * 0.5);
  strokeWeight(9);
  line(exL, eyeY, t.x, t.y);
  line(exR, eyeY, t.x, t.y);
  stroke(255, 255, 255, a);
  strokeWeight(3);
  line(exL, eyeY, t.x, t.y);
  line(exR, eyeY, t.x, t.y);
  pop();
}

// F toggles continuous auto-fire while in cat mode
function toggleAutoFire() {
  gameState.autoFire = !gameState.autoFire;
  playSound(gameState.autoFire ? "select" : "deselect");
}

function keyPressed(e) {
  if (!gameState.appReady) return; // ignore keys until the game is ready
  // While the preview modal is open, ENTER opens the link in a new tab;
  // ESC or V closes it. All other keys ignored.
  if (previewOpen) {
    if (key === "Escape" || key === "v" || key === "V") {
      closePreview();
    } else if (key === "Enter" || key === " ") {
      openPreviewLinkInTab();
    }
    return;
  }
  // Cat Chaos: C toggles the mode (debug), F toggles auto-fire
  if (key === "c" || key === "C") {
    if (!(e && e.repeat)) toggleCatMode();
    return;
  }
  if (gameState.catMode && (key === "f" || key === "F")) {
    if (!(e && e.repeat)) toggleAutoFire();
    return;
  }
  // R rebirths the cosmos once nothing remains
  if (gameState.catMode && gameState.voidReached && (key === "r" || key === "R")) {
    if (!(e && e.repeat)) rebirthUniverse();
    return;
  }
  // Info/how-to-play toggle (I). The link list handles I in its own listener.
  if (!linksListOpen && (key === "i" || key === "I")) {
    toggleInfoMenu();
    return;
  }
  // While the info menu is open, only ESC and M do anything
  if (infoMenuOpen) {
    if (key === "Escape") closeInfoMenu();
    if (key === "m" || key === "M") toggleSound();
    return;
  }
  // Toggle the link list on L key
  if (key === "l" || key === "L") {
    toggleLinksList();
    return;
  }
  // Ignore other keys while the link list is open (ESC is handled in ui.js)
  if (linksListOpen) return;
  // J toggles the autopilot warp (ignore auto-repeat while held)
  if (key === "j" || key === "J") {
    if (e && e.repeat) return;
    const now = Date.now();
    if (now - lastWarpToggle < 300) return;
    lastWarpToggle = now;
    if (gameState.warpActive) {
      endWarp();
    } else {
      startWarp();
    }
    return;
  }
  // Any other key cancels an active warp (ignore auto-repeat)
  if (gameState.warpActive) {
    if (!(e && e.repeat)) endWarp();
    return;
  }
  // V previews the target link in the CRT modal when close enough
  if (key === "v" || key === "V") {
    let target = getTargetLink();
    if (
      target &&
      target.getDistance(ship.x, ship.y) < GAME_CONFIG.activationDistance
    ) {
      openPreview(target);
    }
    return;
  }
  // Open link on ENTER or SPACE (not while in cat mode — SPACE fires there)
  if (
    !gameState.catMode &&
    (key === "Enter" || key === " ") &&
    gameState.nearestLink
  ) {
    tryOpenLink(gameState.nearestLink);
  }
  // Deselect on ESC key
  if (key === "Escape") {
    if (gameState.selectedLinkIndex !== null) {
      playSound("deselect");
    }
    gameState.selectedLinkIndex = null;
    gameState.accelerationFactor = 0;
  }
  // Toggle sound on M key
  if (key === "m" || key === "M") {
    toggleSound();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  ship.x = width / 2;
  ship.y = height / 2;
}

// ==================== LINK SELECTION / ACTIVATION ====================

// Single entry point for opening a link (keyboard + mobile button)
function tryOpenLink(link) {
  if (!link) return;
  let d = link.getDistance(ship.x, ship.y);
  if (d < GAME_CONFIG.activationDistance) {
    window.open(link.data.url, "_blank", "noopener");
    // reset acceleration when a link is reached/opened
    gameState.accelerationFactor = 0;
    gameState.selectedLinkIndex = null;
    markVisited(link);
    playSound("open");
  }
}

// The link the player is currently targeting: selected one, else nearest
function getTargetLink() {
  if (
    gameState.selectedLinkIndex !== null &&
    gameState.selectedLinkIndex < links.length
  ) {
    return links[gameState.selectedLinkIndex];
  }
  return gameState.nearestLink || null;
}

function activateLink() {
  if (!gameState.appReady) return;
  tryOpenLink(getTargetLink());
}

// ==================== VISITED LINKS ====================
// Session-only: the set starts empty on every page load.

function isVisited(link) {
  return visited.has(link.data.title);
}

function markVisited(link) {
  if (visited.has(link.data.title)) return false;
  visited.add(link.data.title);
  return true;
}

// ==================== MINI-MAP ====================

function drawMinimap() {
  const cfg = GAME_CONFIG.minimap;
  const isMobile =
    typeof mobileQuery !== "undefined" && mobileQuery.matches;
  const x = width - cfg.size - cfg.margin;
  const y = isMobile ? cfg.topMobile : cfg.top;

  // World bounds = bounding box of all links + ship
  let minX = ship.x;
  let minY = ship.y;
  let maxX = ship.x;
  let maxY = ship.y;
  for (let l of links) {
    minX = Math.min(minX, l.x);
    minY = Math.min(minY, l.y);
    maxX = Math.max(maxX, l.x);
    maxY = Math.max(maxY, l.y);
  }

  push();
  noStroke();
  fill(0, 0, 20, 180);
  rect(x, y, cfg.size, cfg.size, 4);
  stroke(0, 255, 255, 90);
  strokeWeight(1);
  noFill();
  rect(x, y, cfg.size, cfg.size, 4);
  noStroke();

  for (let i = 0; i < links.length; i++) {
    let l = links[i];
    let mx = map(l.x, minX, maxX, x + 4, x + cfg.size - 4);
    let my = map(l.y, minY, maxY, y + 4, y + cfg.size - 4);
    if (l === gameState.nearestLink) {
      fill(0, 255, 255);
      rect(mx - 2, my - 2, 4, 4);
    } else if (
      gameState.selectedLinkIndex !== null &&
      links[gameState.selectedLinkIndex] === l
    ) {
      fill(0, 255, 0);
      rect(mx - 2, my - 2, 4, 4);
    } else if (isVisited(l)) {
      // visited: small and faint
      fill(120, 120, 120, 90);
      rect(mx - 1.5, my - 1.5, 3, 3);
    } else {
      // unvisited: bright yellow and pulsing so it stands out
      let pulse = 1 + 0.35 * sin(frameCount * 0.1 + i * 1.7);
      let s = 5 * pulse;
      fill(255, 220, 0);
      rect(mx - s / 2, my - s / 2, s, s);
    }
  }

  fill(255, 0, 255);
  let sx = map(ship.x, minX, maxX, x + 4, x + cfg.size - 4);
  let sy = map(ship.y, minY, maxY, y + 4, y + cfg.size - 4);
  rect(sx - 2, sy - 2, 4, 4);

  // Legend: yellow = unvisited, gray = visited
  textAlign(LEFT, TOP);
  textSize(10);
  let lx = x;
  let ly = y + cfg.size + 8;
  fill(255, 220, 0);
  text("●", lx, ly);
  fill(255, 255, 255, 180);
  text("new", lx + 12, ly);
  fill(120, 120, 120);
  text("●", lx + 40, ly);
  fill(255, 255, 255, 180);
  text("visited", lx + 52, ly);

  pop();
}

// ==================== BOOT ====================
// p5.js loads from CDN; fail loudly instead of a silent black screen
// if the network is unavailable.

function bootGame() {
  if (typeof p5 === "undefined") {
    const hud = document.getElementById("nearest-link");
    if (hud) {
      hud.innerHTML =
        '<strong style="color: #ff5555">Error:</strong> p5.js could not be loaded. Please check your internet connection and reload the page.';
    }
    return;
  }
  if (!GAME_CONFIG.visual.crtOverlay) {
    const crt = document.getElementById("crt-overlay");
    if (crt) crt.remove();
  }
  initInfoMenu();
  initLinksList();
  initWarpButton();
  initPreviewModal();
  initSoundButton();
}
bootGame();
