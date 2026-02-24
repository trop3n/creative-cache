// ============================================================
// Shape Library — Built-in geometric shapes for FLAKE Tool
// ============================================================

// All shape functions follow signature: (p, x, y, size, rotation)
// rotation is in degrees

// ── Existing shapes ───────────────────────────────────────────

export function drawCircle(p, x, y, size) {
  p.ellipse(x, y, size, size);
}

export function drawOval(p, x, y, size, rotation = 0) {
  p.push();
  p.translate(x, y);
  p.rotate(p.radians(rotation));
  p.ellipse(0, 0, size, size * 0.5);
  p.pop();
}

export function drawSquare(p, x, y, size, rotation = 0) {
  p.push();
  p.translate(x, y);
  p.rotate(p.radians(rotation));
  p.rectMode(p.CENTER);
  p.rect(0, 0, size, size);
  p.pop();
}

export function drawTriangle(p, x, y, size, rotation = 0) {
  p.push();
  p.translate(x, y);
  p.rotate(p.radians(rotation));
  const r = size / 2;
  p.triangle(
    0, -r,
    -r * 0.866, r * 0.5,
    r * 0.866, r * 0.5,
  );
  p.pop();
}

export function drawStar(p, x, y, size, rotation = 0, points = 5, innerRatio = 0.5) {
  p.push();
  p.translate(x, y);
  p.rotate(p.radians(rotation - 90));
  const outerR = size / 2;
  const innerR = outerR * innerRatio;
  p.beginShape();
  for (let i = 0; i < points * 2; i++) {
    const angle = (p.PI / points) * i;
    const r = i % 2 === 0 ? outerR : innerR;
    p.vertex(p.cos(angle) * r, p.sin(angle) * r);
  }
  p.endShape(p.CLOSE);
  p.pop();
}

export function drawCross(p, x, y, size, rotation = 0, thickness = 0.3) {
  p.push();
  p.translate(x, y);
  p.rotate(p.radians(rotation));
  p.rectMode(p.CENTER);
  const t = size * thickness;
  p.rect(0, 0, t, size);
  p.rect(0, 0, size, t);
  p.pop();
}

export function drawHeart(p, x, y, size, rotation = 0) {
  p.push();
  p.translate(x, y);
  p.rotate(p.radians(rotation));
  const r = size / 2;
  p.beginShape();
  for (let a = 0; a < p.TWO_PI; a += 0.1) {
    const hx = r * 0.8 * (16 * Math.pow(Math.sin(a), 3)) / 16;
    const hy = -r * 0.8 * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 16;
    p.vertex(hx, hy);
  }
  p.endShape(p.CLOSE);
  p.pop();
}

export function drawArrow(p, x, y, size, rotation = 0) {
  p.push();
  p.translate(x, y);
  p.rotate(p.radians(rotation));
  const h = size * 0.48;
  const w = size * 0.30;
  const notch = h * 0.30;
  p.beginShape();
  p.vertex(h, 0);
  p.vertex(0, -w);
  p.vertex(-notch, -w * 0.45);
  p.vertex(-h * 0.7, -w * 0.45);
  p.vertex(-h * 0.7, w * 0.45);
  p.vertex(-notch, w * 0.45);
  p.vertex(0, w);
  p.endShape(p.CLOSE);
  p.pop();
}

// ── New shapes ────────────────────────────────────────────────

export function drawChecker(p, x, y, size, rotation = 0) {
  p.push();
  p.translate(x, y);
  p.rotate(p.radians(rotation));
  p.rectMode(p.CENTER);
  const h = size / 2;
  const q = h / 2;
  // Top-left and bottom-right squares filled (checker pattern)
  p.rect(-q, -q, h, h);
  p.rect(q, q, h, h);
  p.pop();
}

export function drawQuadCircle(p, x, y, size, rotation = 0) {
  p.push();
  p.translate(x, y);
  p.rotate(p.radians(rotation));
  const offset = size * 0.27;
  const dotSize = size * 0.32;
  p.ellipse(-offset, -offset, dotSize, dotSize);
  p.ellipse(offset, -offset, dotSize, dotSize);
  p.ellipse(-offset, offset, dotSize, dotSize);
  p.ellipse(offset, offset, dotSize, dotSize);
  p.pop();
}

export function drawThreeDots(p, x, y, size, rotation = 0) {
  p.push();
  p.translate(x, y);
  p.rotate(p.radians(rotation));
  const r = size * 0.35;
  const dotSize = size * 0.28;
  // Equilateral triangle arrangement
  p.ellipse(0, -r, dotSize, dotSize);
  p.ellipse(-r * 0.866, r * 0.5, dotSize, dotSize);
  p.ellipse(r * 0.866, r * 0.5, dotSize, dotSize);
  p.pop();
}

export function drawSpark(p, x, y, size, rotation = 0) {
  // Thin elongated diamond (aspect ~4:1)
  p.push();
  p.translate(x, y);
  p.rotate(p.radians(rotation));
  const long = size * 0.5;
  const narrow = size * 0.12;
  p.beginShape();
  p.vertex(0, -long);
  p.vertex(narrow, 0);
  p.vertex(0, long);
  p.vertex(-narrow, 0);
  p.endShape(p.CLOSE);
  p.pop();
}

export function drawFlash(p, x, y, size, rotation = 0) {
  // Lightning bolt Z-shape
  p.push();
  p.translate(x, y);
  p.rotate(p.radians(rotation));
  const h = size * 0.5;
  const w = size * 0.4;
  p.beginShape();
  p.vertex(w * 0.4, -h);       // top-right
  p.vertex(-w * 0.1, -h * 0.1); // middle-left top
  p.vertex(w * 0.2, -h * 0.1);  // middle-right top
  p.vertex(-w * 0.4, h);        // bottom-left
  p.vertex(w * 0.1, h * 0.1);   // middle-right bottom
  p.vertex(-w * 0.2, h * 0.1);  // middle-left bottom
  p.endShape(p.CLOSE);
  p.pop();
}

export function drawPinholeIndex(p, x, y, size) {
  const dotSize = size * 0.15;
  p.ellipse(x, y, dotSize, dotSize);
}

export function drawFlower(p, x, y, size, rotation = 0) {
  // 6 overlapping circles arranged radially (petals)
  p.push();
  p.translate(x, y);
  p.rotate(p.radians(rotation));
  const petalR = size * 0.35;
  const petalSize = size * 0.4;
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 / 6) * i;
    p.ellipse(
      Math.cos(angle) * petalR,
      Math.sin(angle) * petalR,
      petalSize, petalSize,
    );
  }
  // Center circle
  p.ellipse(0, 0, size * 0.25, size * 0.25);
  p.pop();
}

export function drawFlakeShape(p, x, y, size, rotation = 0) {
  // 6 lines radiating from center, each with 2 small side branches
  // Caller is responsible for setting stroke color and weight
  p.push();
  p.translate(x, y);
  p.rotate(p.radians(rotation));
  const arm = size * 0.47;
  const branchLen = arm * 0.35;
  const branchPos = arm * 0.55;

  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const ax = Math.cos(angle);
    const ay = Math.sin(angle);
    // Main arm
    p.line(0, 0, ax * arm, ay * arm);
    // Two side branches at branchPos along the arm
    const bx = ax * branchPos;
    const by = ay * branchPos;
    const perp = angle + Math.PI / 2;
    p.line(bx, by, bx + Math.cos(perp) * branchLen, by + Math.sin(perp) * branchLen);
    p.line(bx, by, bx - Math.cos(perp) * branchLen, by - Math.sin(perp) * branchLen);
  }
  p.pop();
}

export function drawClips(p, x, y, size, rotation = 0) {
  // Cross/plus shape with rounded bar ends (like paperclip profile)
  p.push();
  p.translate(x, y);
  p.rotate(p.radians(rotation));
  const barLen = size * 0.5;
  const barW = size * 0.22;
  const r = barW / 2;
  p.rectMode(p.CENTER);
  // Vertical bar with rounded ends
  p.rect(0, 0, barW, barLen, r);
  // Horizontal bar with rounded ends
  p.rect(0, 0, barLen, barW, r);
  p.pop();
}

// ── Dispatcher ────────────────────────────────────────────────

/**
 * Draw a shape by type name.
 * @param {p5}    p        p5 instance
 * @param {string} type   shape type key
 * @param {number} x      center x
 * @param {number} y      center y
 * @param {number} size   bounding size
 * @param {number} rotation  degrees
 */
export function drawShape(p, type, x, y, size, rotation = 0) {
  switch (type) {
    case 'square':       drawSquare(p, x, y, size, rotation);       break;
    case 'circle':       drawCircle(p, x, y, size);                 break;
    case 'oval':         drawOval(p, x, y, size, rotation);         break;
    case 'checker':      drawChecker(p, x, y, size, rotation);      break;
    case 'triangle':     drawTriangle(p, x, y, size, rotation);     break;
    case 'quadCircle':   drawQuadCircle(p, x, y, size, rotation);   break;
    case 'threeDots':    drawThreeDots(p, x, y, size, rotation);    break;
    case 'spark':        drawSpark(p, x, y, size, rotation);        break;
    case 'cross':        drawCross(p, x, y, size, rotation);        break;
    case 'star':         drawStar(p, x, y, size, rotation);         break;
    case 'heart':        drawHeart(p, x, y, size, rotation);        break;
    case 'flash':        drawFlash(p, x, y, size, rotation);        break;
    case 'pinholeIndex': drawPinholeIndex(p, x, y, size);           break;
    case 'arrow':        drawArrow(p, x, y, size, rotation);        break;
    case 'flower':       drawFlower(p, x, y, size, rotation);       break;
    case 'flake':        drawFlakeShape(p, x, y, size, rotation);   break;
    case 'clips':        drawClips(p, x, y, size, rotation);        break;
    default:             drawCircle(p, x, y, size);                 break;
  }
}
