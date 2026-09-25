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

function toggleSound() {
  soundMuted = !soundMuted;
  try {
    if (soundMuted) {
      playSound("deselect");
      stopFlySound();
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

// Stop the hum when the tab loses focus so it doesn't drone in the background
window.addEventListener("blur", stopFlySound);
