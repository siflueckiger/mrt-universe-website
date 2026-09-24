// ==================== GAME CONFIG ====================
// All tunables live here so future features can adjust game feel
// without touching game logic.

const GAME_CONFIG = {
  navBorder: 25,
  worldBounds: { minX: -3000, minY: -3000, maxX: 3000, maxY: 3000 },
  activationDistance: 150,
  counts: { stars: 333, planets: 15 },
  movement: {
    baseSpeed: 1,
    accRate: 0.2,
    decRate: 0.1,
    maxAccMultiplier: 10,
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
  // Must stay in sync with the @media (max-width: 768px) rule in css/style.css
  mobileBreakpoint: 768,
};
