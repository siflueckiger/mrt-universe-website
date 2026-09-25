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

  // Stars
  for (let i = 0; i < GAME_CONFIG.counts.stars; i++) {
    stars.push(new Star(random(width), random(height)));
  }

  // Ship
  ship = new Ship(width / 2, height / 2);

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

  // Trash collectibles — optional external sprites plus procedural fallback
  loadTrashImages();
  loadCatImage();
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

  // Debug: boot straight into Cat Chaos via ?chaos=1 / ?cat=1
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("chaos") === "1" || params.get("cat") === "1") {
      setCatMode(true);
    }
  } catch (e) {
    // URLSearchParams unavailable: ignore
  }

  // Mobile controls
  setupMobileControls();
}

// ==================== P5.JS DRAW ====================

function draw() {
  background(10, 10, 30);

  // Cat-mode destruction screen shake (world only; HUD/minimap stay stable)
  const shaking = gameState.screenShakeFrames > 0;
  if (shaking) {
    const s = GAME_CONFIG.catMode.screenShake;
    push();
    translate(random(-s, s), random(-s, s));
    gameState.screenShakeFrames--;
  }
  if (gameState.laserFrames > 0) gameState.laserFrames--;

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

  // Mini-map of the world
  drawMinimap();

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

  // Debug helper: keep firing automatically while enabled
  if (
    gameState.catMode &&
    GAME_CONFIG.catMode.autoFire &&
    gameState.laserFrames <= 0
  ) {
    fireCatLaser();
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

    // Compute move speeds including acceleration
    let moveSpeed =
      GAME_CONFIG.movement.baseSpeed * (1 + gameState.accelerationFactor);

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
        GAME_CONFIG.joystick.speedScale * (1 + gameState.accelerationFactor);
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
    if ((movedX !== 0 || movedY !== 0) && particles.length < GAME_CONFIG.particles.maxCount) {
      let angle = Math.atan2(movedY, movedX);
      // Particle shoots opposite the world movement vector
      let pSpeed = random(1.5, 3.5);
      let pvx = Math.cos(angle) * pSpeed;
      let pvy = Math.sin(angle) * pSpeed;
      // UFO underside emitter position
      let emitX = ship.x + random(-8, 8);
      let emitY = ship.y + 10 + random(-2, 4);
      particles.push(new ThrusterParticle(emitX, emitY, pvx, pvy));
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
    playSound("chaos");
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
  if (!gameState.catMode) {
    gameState.laserTarget = null;
    gameState.laserFrames = 0;
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

// Nearest destructible object that is currently on screen
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
  return best;
}

function createExplosion(x, y) {
  explosions.push(new Shockwave(x, y));
  for (let i = 0; i < GAME_CONFIG.catMode.explosionParticles; i++) {
    explosions.push(new ExplosionShard(x, y));
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
  }
}

function fireCatLaser() {
  if (!gameState.catMode) return;
  gameState.laserFrames = GAME_CONFIG.catMode.laserFrames;
  gameState.screenShakeFrames = GAME_CONFIG.catMode.screenShake;
  playSound("laser");

  const target = getNearestOnScreenTarget();
  if (!target) {
    gameState.laserTarget = null;
    return;
  }

  gameState.laserTarget = { x: target.obj.x, y: target.obj.y };
  createExplosion(target.obj.x, target.obj.y);
  playSound("explosion");
  destroyTarget(target);
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
  // Cat Chaos: C toggles the mode (debug), SPACE fires the auto-laser
  if (key === "c" || key === "C") {
    if (!(e && e.repeat)) toggleCatMode();
    return;
  }
  if (gameState.catMode && key === " " && !linksListOpen && !infoMenuOpen) {
    fireCatLaser();
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
  // Open link on ENTER or SPACE
  if ((key === "Enter" || key === " ") && gameState.nearestLink) {
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
