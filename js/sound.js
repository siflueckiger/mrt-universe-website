// ==================== SOUND ====================
// Chiptune-style blips generated with p5.sound oscillators — no audio
// files needed. Browsers block audio until a user gesture, so the
// context is resumed on the first key/tap (listeners below). Disable
// all audio via GAME_CONFIG.sound.enabled, or toggle at runtime with M.

let audioReady = false;
let soundMuted = false;
let flyOscs = null;

function initAudio() {
  if (!GAME_CONFIG.sound.enabled) return false;
  if (typeof p5 === "undefined" || typeof p5.Oscillator === "undefined") {
    return false;
  }
  try {
    userStartAudio();
  } catch (e) {
    // audio stays muted if the browser refuses
  }
  audioReady = true;
  return true;
}

// First key/tap anywhere unlocks audio (autoplay policy)
window.addEventListener("keydown", function () {
  initAudio();
});
window.addEventListener("pointerdown", function () {
  initAudio();
});

function blip(freqStart, freqEnd, duration, type, volume) {
  let osc = new p5.Oscillator(freqStart, type);
  osc.amp(GAME_CONFIG.sound.volume * (volume || 1));
  osc.freq(freqStart);
  osc.start();
  if (freqEnd && freqEnd !== freqStart) {
    osc.freq(freqEnd, duration);
  }
  osc.amp(0, duration);
  setTimeout(function () {
    osc.dispose();
  }, duration * 1000 + 50);
}

function playSound(name) {
  if (!audioReady || soundMuted) return;
  switch (name) {
    case "select":
      blip(520, 780, 0.09, "square", 0.8);
      break;
    case "deselect":
      blip(520, 260, 0.09, "square", 0.6);
      break;
    case "reach":
      blip(1100, 1100, 0.06, "sine", 0.7);
      break;
    case "open":
      blip(523, 523, 0.08, "square", 1);
      setTimeout(function () {
        blip(784, 784, 0.14, "square", 1);
      }, 80);
      break;
    case "warp":
      blip(180, 1400, 0.5, "sawtooth", 0.7);
      setTimeout(function () {
        blip(900, 1400, 0.2, "square", 0.5);
      }, 260);
      break;
    case "warpEnd":
      blip(900, 200, 0.28, "square", 0.6);
      break;
    case "pickup":
      blip(660, 660, 0.06, "square", 0.7);
      setTimeout(function () {
        blip(990, 990, 0.12, "square", 0.7);
      }, 60);
      break;
    case "laser":
      blip(1800, 220, 0.12, "sawtooth", 0.9);
      break;
    case "explosion":
      blip(140, 22, 0.36, "triangle", 1);
      blip(320, 60, 0.22, "sawtooth", 0.5);
      break;
    case "chaos":
      // Triumphant little fanfare when the cat awakens
      blip(523, 523, 0.1, "square", 1);
      setTimeout(function () {
        blip(659, 659, 0.1, "square", 1);
      }, 100);
      setTimeout(function () {
        blip(784, 784, 0.1, "square", 1);
      }, 200);
      setTimeout(function () {
        blip(1047, 1047, 0.32, "square", 1);
      }, 300);
      break;
    case "roar":
      // Aggressive cat stinger the moment chaos awakens
      blip(320, 70, 0.6, "sawtooth", 1);
      blip(140, 40, 0.8, "triangle", 0.9);
      setTimeout(function () {
        blip(600, 120, 0.35, "square", 0.5);
      }, 60);
      break;
    case "star":
      // Crystalline sparkle for a supernova
      blip(1600, 2200, 0.08, "sine", 0.8);
      setTimeout(function () {
        blip(2400, 2600, 0.1, "sine", 0.6);
      }, 50);
      break;
    case "planet":
      // Deep crushing boom
      blip(90, 24, 0.5, "triangle", 1);
      blip(220, 50, 0.3, "sawtooth", 0.5);
      break;
    case "nebula":
      // Spatial whoosh as gas dissipates
      blip(300, 900, 0.4, "sine", 0.5);
      setTimeout(function () {
        blip(800, 200, 0.5, "sine", 0.4);
      }, 120);
      break;
    case "linkPop":
      // Digital shatter for a destroyed link
      blip(1200, 300, 0.16, "square", 0.8);
      setTimeout(function () {
        blip(900, 200, 0.14, "square", 0.6);
      }, 60);
      break;
    case "void":
      // Hollow descending tone as the last object dies
      blip(220, 55, 1.2, "triangle", 0.9);
      setTimeout(function () {
        blip(110, 40, 1.4, "sawtooth", 0.5);
      }, 180);
      break;
  }
}

// Looping UFO hum while the ship moves: two detuned oscillators whose
// beating creates a slow warble. Called every frame from handleInput.
function setFlying(on) {
  if (on) {
    if (!audioReady || soundMuted || flyOscs) return;
    flyOscs = [
      new p5.Oscillator(95, "triangle"),
      new p5.Oscillator(98.4, "triangle"),
    ];
    for (let o of flyOscs) {
      o.amp(0);
      o.amp(GAME_CONFIG.sound.volume * 0.4, 0.2);
      o.start();
    }
  } else {
    stopFlySound();
  }
}

function stopFlySound() {
  if (!flyOscs) return;
  const oscs = flyOscs;
  flyOscs = null;
  for (let o of oscs) {
    o.amp(0, 0.12);
  }
  setTimeout(function () {
    for (let o of oscs) {
      o.dispose();
    }
  }, 250);
}

// ==================== CAT CHAOS DRONE ====================
// A droning "wrath" pad that swells as more of the universe is destroyed.
// Lazy-started/stopped so mute, tab-blur and rebirth all silence it.

let chaosDrone = null;
let lastChaosLevel = -1;

function startChaosDrone() {
  if (chaosDrone) return;
  if (!GAME_CONFIG.sound.enabled || !audioReady || soundMuted) return;
  if (typeof p5 === "undefined" || typeof p5.Oscillator === "undefined") return;
  chaosDrone = [
    new p5.Oscillator(55, "sawtooth"),
    new p5.Oscillator(82.5, "sawtooth"),
    new p5.Oscillator(110, "triangle"),
  ];
  for (let o of chaosDrone) {
    o.amp(0);
    o.start();
  }
}

function stopChaosDrone() {
  if (!chaosDrone) return;
  const oscs = chaosDrone;
  chaosDrone = null;
  lastChaosLevel = -1;
  for (let o of oscs) {
    o.amp(0, 0.3);
  }
  setTimeout(function () {
    for (let o of oscs) {
      o.dispose();
    }
  }, 400);
}

// level 0..1 — safe to call every frame; only touches oscillators on change
function setChaosDrone(level) {
  if (!GAME_CONFIG.sound.enabled || !audioReady || soundMuted) {
    stopChaosDrone();
    return;
  }
  const l = constrain(level || 0, 0, 1);
  if (l <= 0.001) {
    stopChaosDrone();
    return;
  }
  if (Math.abs(l - lastChaosLevel) < 0.03) return;
  lastChaosLevel = l;
  if (!chaosDrone) startChaosDrone();
  if (!chaosDrone) return;
  const base = GAME_CONFIG.sound.volume;
  chaosDrone[0].amp(base * (0.15 + 0.5 * l), 0.15);
  chaosDrone[1].amp(base * (0.1 + 0.4 * l), 0.15);
  chaosDrone[2].amp(base * (0.08 + 0.3 * l), 0.15);
}

function toggleSound() {
  soundMuted = !soundMuted;
  try {
    if (soundMuted) {
      playSound("deselect");
      stopFlySound();
      stopChaosDrone();
    } else {
      playSound("select");
    }
  } catch (err) {
    // audio context may be suspended/refused; never block the UI toggle
  }
  updateSoundButton();
}

// HUD Music button (M) — toggles mute like the Links/Info buttons
function updateSoundButton() {
  const btn = document.getElementById("music-button");
  if (!btn) return;
  btn.classList.toggle("muted", soundMuted);
  btn.textContent = soundMuted ? "Music (M): OFF" : "Music (M): ON";
}

function initSoundButton() {
  const btn = document.getElementById("music-button");
  if (!btn) return;
  let lastToggle = 0;
  function onToggle(e) {
    if (e && e.cancelable) e.preventDefault();
    const now = Date.now();
    if (now - lastToggle < 350) return; // swallow synthetic click after touch/pointer
    lastToggle = now;
    initAudio();
    toggleSound();
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
  updateSoundButton();
}

// Stop sustained sounds when the tab loses focus so they don't drone on
window.addEventListener("blur", function () {
  stopFlySound();
  stopChaosDrone();
});
