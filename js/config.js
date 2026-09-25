// ==================== GAME CONFIG ====================
// All tunables live here so future features can adjust game feel
// without touching game logic.

const GAME_CONFIG = {
  navBorder: 25,
  worldBounds: { minX: -3000, minY: -3000, maxX: 3000, maxY: 3000 },
  activationDistance: 150,
  counts: { stars: 333, planets: 15, nebulae: 8, asteroids: 25, trash: 20 },
  movement: {
    baseSpeed: 1,
    accRate: 0.2,
    decRate: 0.1,
    maxAccMultiplier: 10,
  },
  warp: {
    // Autopilot hyperdrive toward the pinned link (J)
    speedMultiplier: 16,
    streaks: 90,
    streakSpeedMin: 18,
    streakSpeedMax: 38,
    emissiveParticles: 3,
  },
  joystick: {
    maxDistance: 35,
    speedScale: 0.03,
    deadzone: 5,
  },
  star: {
    speedMin: 1,
    speedMax: 25,
    sizeMin: 1,
    sizeMax: 4,
    colorMin: 200,
    colorMax: 255,
  },
  link: {
    speedMin: 7,
    speedMax: 10,
    titleSize: 24,
    badgeSize: 12,
    // Keep links from spawning on top of each other or the ship
    minDistance: 800,
    minShipDistance: 400,
  },
  planet: {
    speedMin: 7,
    speedMax: 10,
    sizeMin: 50,
    sizeMax: 350,
    ringChance: 0.3,
    alpha: 150,
  },
  nebula: {
    speedMin: 4,
    speedMax: 6,
    sizeMin: 250,
    sizeMax: 550,
    puffCount: 9,
    alpha: 16,
    // Slow independent drift so the clouds feel alive even when idle
    driftSpeed: 0.18,
  },
  asteroid: {
    speedMin: 7,
    speedMax: 10,
    sizeMin: 20,
    sizeMax: 65,
    vertexMin: 5,
    vertexMax: 9,
    rotSpeedMax: 0.02,
  },
  particles: {
    maxCount: 160,
    lifespan: 70,
    size: 5,
  },
  trash: {
    speedMin: 5,
    speedMax: 8,
    sizeMin: 22,
    sizeMax: 38,
    rotSpeedMax: 0.03,
    pickupDistance: 42,
    // Optional PNG/GIF filenames inside assets/trash/. Empty = procedural
    // pixel-art junk (floppy, can, bottle, monitor).
    items: [],
  },
  minimap: {
    size: 120,
    margin: 20,
    top: 20,
    topMobile: 180,
  },
  sound: {
    enabled: true,
    volume: 0.15,
  },
  distance: {
    // Displayed distance unit and how many world pixels equal one unit
    unit: "lightyears",
    pixelsPerUnit: 100,
  },
  visual: {
    crtOverlay: true,
  },
  // Floating action prompts drawn next to the UFO when a link is in range
  prompt: {
    offsetY: 46,
    fontSize: 13,
    paddingX: 10,
    paddingY: 6,
    bobAmplitude: 3,
  },
  // Must stay in sync with the @media (max-width: 768px) rule in css/style.css
  mobileBreakpoint: 768,
};
