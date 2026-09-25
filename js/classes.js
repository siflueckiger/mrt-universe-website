// ==================== CLASSES ====================

class Star {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.color = color(
      random(GAME_CONFIG.star.colorMin, GAME_CONFIG.star.colorMax)
    );
    this.size = random(GAME_CONFIG.star.sizeMin, GAME_CONFIG.star.sizeMax);
    this.speedMin = GAME_CONFIG.star.speedMin;
    this.speedMax = GAME_CONFIG.star.speedMax;
    this.speed = random(this.speedMin, this.speedMax);
  }

  display() {
    noStroke();
    fill(this.color);
    rect(this.x, this.y, this.size, this.size);
  }

  checkBorder() {
    if (this.x < 0) {
      this.x = width;
      this.y = random(height);
      this.color = color(random(200, 255));
      this.speed = random(this.speedMin, this.speedMax);
    } else if (this.x > width) {
      this.x = 0;
      this.y = random(height);
      this.color = color(random(200, 255));
      this.speed = random(this.speedMin, this.speedMax);
    } else if (this.y < 0) {
      this.x = random(width);
      this.y = height;
      this.color = color(random(200, 255));
      this.speed = random(this.speedMin, this.speedMax);
    } else if (this.y > height) {
      this.x = random(width);
      this.y = 0;
      this.color = color(random(200, 255));
      this.speed = random(this.speedMin, this.speedMax);
    }
  }
}

class Ship {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 40;
  }

  display() {
    push();
    translate(this.x, this.y);

    // UFO Body
    fill(255, 100, 255);
    stroke(255, 150, 255);
    strokeWeight(2);
    ellipse(0, 0, this.size * 2, this.size);

    // UFO Dome
    fill(150, 50, 150, 180);
    ellipse(0, -10, this.size, this.size * 0.6);

    // Lights
    fill(0, 255, 255);
    noStroke();
    ellipse(-15, 5, 5, 5);
    ellipse(0, 5, 5, 5);
    ellipse(15, 5, 5, 5);

    pop();
  }
}

class Link {
  constructor(x, y, data) {
    this.x = x;
    this.y = y;
    this.data = data;
    this.baseColor = color(
      random(100, 255),
      random(100, 255),
      random(100, 255)
    );
    this.currentColor = this.baseColor;
    this.txtSize = GAME_CONFIG.link.titleSize;
    this.speed = random(GAME_CONFIG.link.speedMin, GAME_CONFIG.link.speedMax);
    this.pulsePhase = random(TWO_PI);
  }

  display(isNearest) {
    push();

    if (isNearest) {
      // Pulsing effect for nearest link
      this.pulsePhase += 0.1;
      let pulse = sin(this.pulsePhase) * 0.3 + 1;

      // Glow effect
      drawingContext.shadowBlur = 30;
      drawingContext.shadowColor = "rgba(0, 255, 255, 0.8)";

      fill(0, 255, 255);
      textSize(this.txtSize * pulse);
    } else {
      fill(this.baseColor);
      textSize(this.txtSize);
    }

    noStroke();
    textAlign(CENTER, CENTER);
    text(this.data.title, this.x, this.y);

    // Category badge
    textSize(GAME_CONFIG.link.badgeSize);
    fill(255, 255, 0, 150);
    text(this.data.category, this.x, this.y + 25);

    pop();
  }

  getDistance(shipX, shipY) {
    return dist(this.x, this.y, shipX, shipY);
  }
}

class Navigator {
  lineLine(x1, y1, x2, y2, x3, y3, x4, y4, col, linkName) {
    let uA =
      ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) /
      ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
    let uB =
      ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) /
      ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));

    if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
      let intersectionX = x1 + uA * (x2 - x1);
      let intersectionY = y1 + uA * (y2 - y1);

      // Draw circle
      fill(col);
      noStroke();
      ellipse(intersectionX, intersectionY, 12);

      // Draw link name
      fill(255, 255, 255, 200);
      textSize(11);
      textAlign(CENTER, CENTER);

      // Position text based on border location
      let textX = intersectionX;
      let textY = intersectionY;

      // Left or right border
      if (intersectionX < GAME_CONFIG.navBorder + 10) {
        textAlign(LEFT, CENTER);
        textX = intersectionX + 10;
      } else if (intersectionX > width - GAME_CONFIG.navBorder - 10) {
        textAlign(RIGHT, CENTER);
        textX = intersectionX - 10;
      }

      // Top or bottom border
      if (intersectionY < GAME_CONFIG.navBorder + 10) {
        textY = intersectionY + 15;
      } else if (intersectionY > height - GAME_CONFIG.navBorder - 10) {
        textY = intersectionY - 15;
      }

      text(linkName, textX, textY);

      return true;
    }
    return false;
  }
}

class Planet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = random(GAME_CONFIG.planet.speedMin, GAME_CONFIG.planet.speedMax);
    this.size = random(GAME_CONFIG.planet.sizeMin, GAME_CONFIG.planet.sizeMax);
    this.hue = random(360);
    this.hasRing = random() < GAME_CONFIG.planet.ringChance;
  }

  display() {
    push();
    colorMode(HSB);
    fill(this.hue, 80, 80, GAME_CONFIG.planet.alpha);
    noStroke();
    ellipse(this.x, this.y, this.size, this.size);

    // Rings for some planets
    if (this.hasRing) {
      noFill();
      stroke(this.hue, 60, 90, 100);
      strokeWeight(3);
      ellipse(this.x, this.y, this.size * 1.5, this.size * 0.5);
    }
    pop();
  }
}

class Nebula {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = random(GAME_CONFIG.nebula.speedMin, GAME_CONFIG.nebula.speedMax);
    this.size = random(GAME_CONFIG.nebula.sizeMin, GAME_CONFIG.nebula.sizeMax);
    this.hue = random([260, 290, 320, 180, 200]); // violet, purple, magenta, cyan, teal
    // Independent ambient drift (world-space pixels per frame)
    let driftAngle = random(TWO_PI);
    this.driftX = cos(driftAngle) * GAME_CONFIG.nebula.driftSpeed;
    this.driftY = sin(driftAngle) * GAME_CONFIG.nebula.driftSpeed;
    this.puffs = [];
    const count = GAME_CONFIG.nebula.puffCount;
    for (let i = 0; i < count; i++) {
      this.puffs.push({
        offsetX: random(-this.size * 0.5, this.size * 0.5),
        offsetY: random(-this.size * 0.5, this.size * 0.5),
        radius: random(this.size * 0.3, this.size * 0.7),
        hueOffset: random(-25, 25),
      });
    }
  }

  update() {
    this.x += this.driftX;
    this.y += this.driftY;
  }

  display() {
    push();
    colorMode(HSB);
    blendMode(SCREEN);
    noStroke();
    for (let puff of this.puffs) {
      fill(
        (this.hue + puff.hueOffset + 360) % 360,
        80,
        70,
        GAME_CONFIG.nebula.alpha
      );
      ellipse(this.x + puff.offsetX, this.y + puff.offsetY, puff.radius, puff.radius);
    }
    pop();
  }
}

class Asteroid {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = random(GAME_CONFIG.asteroid.speedMin, GAME_CONFIG.asteroid.speedMax);
    this.size = random(GAME_CONFIG.asteroid.sizeMin, GAME_CONFIG.asteroid.sizeMax);
    this.angle = random(TWO_PI);
    this.rotSpeed = random(-GAME_CONFIG.asteroid.rotSpeedMax, GAME_CONFIG.asteroid.rotSpeedMax);
    this.shade = random(70, 130);
    this.vertices = [];
    const numVerts = Math.floor(
      random(GAME_CONFIG.asteroid.vertexMin, GAME_CONFIG.asteroid.vertexMax)
    );
    for (let i = 0; i < numVerts; i++) {
      let a = map(i, 0, numVerts, 0, TWO_PI);
      let r = (this.size / 2) * random(0.7, 1.25);
      this.vertices.push({ x: cos(a) * r, y: sin(a) * r });
    }
  }

  update() {
    this.angle += this.rotSpeed;
  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    fill(this.shade);
    stroke(this.shade + 40);
    strokeWeight(1.5);
    beginShape();
    for (let v of this.vertices) {
      vertex(v.x, v.y);
    }
    endShape(CLOSE);
    // Low-fi crater mark
    noStroke();
    fill(this.shade - 30, 180);
    ellipse(this.size * 0.15, -this.size * 0.1, this.size * 0.22, this.size * 0.18);
    pop();
  }
}

class ThrusterParticle {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx + random(-0.4, 0.4);
    this.vy = vy + random(-0.4, 0.4);
    this.lifespan = GAME_CONFIG.particles.lifespan;
    this.maxLife = GAME_CONFIG.particles.lifespan;
    this.size = GAME_CONFIG.particles.size * random(0.7, 1.3);
    this.colorType = random(["cyan", "magenta", "yellow"]);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.lifespan--;
  }

  isDead() {
    return this.lifespan <= 0;
  }

  display() {
    push();
    noStroke();
    let alpha = map(this.lifespan, 0, this.maxLife, 0, 230);
    if (this.colorType === "cyan") {
      fill(0, 255, 255, alpha);
    } else if (this.colorType === "magenta") {
      fill(255, 0, 220, alpha);
    } else {
      fill(255, 255, 100, alpha);
    }
    // Retro square pixel stardust
    rect(this.x, this.y, this.size, this.size);
    pop();
  }
}

// ==================== TRASH COLLECTIBLES ====================
// Optional external sprites from assets/trash/ (PNG or animated GIF). If
// none load (or GAME_CONFIG.trash.items is empty), each piece falls back
// to procedural pixel art so the feature works before any art exists.

let trashImages = [];

function loadTrashImages() {
  trashImages = [];
  const items = GAME_CONFIG.trash.items || [];
  for (let i = 0; i < items.length; i++) {
    loadImage(
      "assets/trash/" + items[i],
      function (img) {
        trashImages.push(img);
      },
      function () {
        // Missing/broken asset: ignore, procedural art is used instead
      }
    );
  }
}

class Trash {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = random(GAME_CONFIG.trash.speedMin, GAME_CONFIG.trash.speedMax);
    this.size = random(GAME_CONFIG.trash.sizeMin, GAME_CONFIG.trash.sizeMax);
    this.angle = random(TWO_PI);
    this.rotSpeed = random(
      -GAME_CONFIG.trash.rotSpeedMax,
      GAME_CONFIG.trash.rotSpeedMax
    );
    this.kind = random(["floppy", "can", "bottle", "monitor"]);
    this.imageIndex = Math.floor(random(1000));
  }

  update() {
    this.angle += this.rotSpeed;
  }

  getDistance(x, y) {
    return dist(this.x, this.y, x, y);
  }

  display() {
    const img = trashImages.length
      ? trashImages[this.imageIndex % trashImages.length]
      : null;
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    if (img) {
      imageMode(CENTER);
      image(img, 0, 0, this.size, this.size);
    } else {
      this.drawKind();
    }
    pop();
  }

  drawKind() {
    const s = this.size;
    noStroke();
    switch (this.kind) {
      case "floppy":
        fill(30, 30, 60);
        stroke(0, 200, 255);
        strokeWeight(1.5);
        rect(-s / 2, -s / 2, s, s, 3);
        noStroke();
        fill(200, 200, 210);
        rect(-s * 0.28, -s * 0.45, s * 0.4, s * 0.28);
        fill(255, 220, 0);
        rect(-s * 0.3, s * 0.05, s * 0.6, s * 0.3);
        break;
      case "can":
        fill(200, 40, 60);
        stroke(255, 150, 150);
        strokeWeight(1);
        rect(-s * 0.25, -s * 0.4, s * 0.5, s * 0.8, 4);
        noStroke();
        fill(220, 220, 220);
        ellipse(0, -s * 0.4, s * 0.5, s * 0.16);
        fill(255, 255, 255, 120);
        rect(-s * 0.15, -s * 0.3, s * 0.06, s * 0.6);
        break;
      case "bottle":
        fill(40, 160, 90);
        stroke(180, 255, 200);
        strokeWeight(1);
        rect(-s * 0.18, -s * 0.2, s * 0.36, s * 0.6, 3);
        rect(-s * 0.09, -s * 0.45, s * 0.18, s * 0.28);
        noStroke();
        fill(255, 255, 255, 100);
        rect(-s * 0.1, -s * 0.1, s * 0.06, s * 0.4);
        break;
      case "monitor":
        fill(120, 120, 130);
        stroke(200, 200, 210);
        strokeWeight(1.5);
        rect(-s * 0.45, -s * 0.4, s * 0.9, s * 0.66, 3);
        noStroke();
        fill(0, 60, 60);
        rect(-s * 0.36, -s * 0.32, s * 0.72, s * 0.5);
        fill(0, 255, 200);
        rect(-s * 0.3, -s * 0.26, s * 0.2, s * 0.08);
        break;
    }
  }
}


