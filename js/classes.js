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
