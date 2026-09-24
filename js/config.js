// ==================== GAME CONFIG ====================
// All tunables live here so future features can adjust game feel
// without touching game logic.

const GAME_CONFIG = {
  navBorder: 25,
  worldBounds: { minX: -3000, minY: -3000, maxX: 3000, maxY: 3000 },
  activationDistance: 150,
  counts: { stars: 333, planets: 15 },
  startMenu: { minLoadMs: 5000 },
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
  // Must stay in sync with the @media (max-width: 768px) rule in css/style.css
  mobileBreakpoint: 768,
};
