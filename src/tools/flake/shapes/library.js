// ============================================================
// Shape Library - Built-in geometric shapes for FLAKE Tool
// ============================================================

/**
 * Draw a circle shape
 * @param {p5} p - p5 instance
 * @param {number} x - center x
 * @param {number} y - center y
 * @param {number} size - diameter
 */
export function drawCircle(p, x, y, size) {
  p.ellipse(x, y, size, size);
}

/**
 * Draw a square shape
 * @param {p5} p - p5 instance
 * @param {number} x - center x
 * @param {number} y - center y
 * @param {number} size - width/height
 * @param {number} rotation - rotation in degrees
 */
export function drawSquare(p, x, y, size, rotation = 0) {
  p.push();
  p.translate(x, y);
  p.rotate(p.radians(rotation));
  p.rectMode(p.CENTER);
  p.rect(0, 0, size, size);
  p.pop();
}

/**
 * Draw a triangle shape
 * @param {p5} p - p5 instance
 * @param {number} x - center x
 * @param {number} y - center y
 * @param {number} size - size
 * @param {number} rotation - rotation in degrees
 */
export function drawTriangle(p, x, y, size, rotation = 0) {
  p.push();
  p.translate(x, y);
  p.rotate(p.radians(rotation));
  const r = size / 2;
  p.triangle(
    0, -r,
    -r * 0.866, r * 0.5,
    r * 0.866, r * 0.5
  );
  p.pop();
}

/**
 * Draw a hexagon shape
 * @param {p5} p - p5 instance
 * @param {number} x - center x
 * @param {number} y - center y
 * @param {number} size - diameter
 * @param {number} rotation - rotation in degrees
 */
export function drawHexagon(p, x, y, size, rotation = 0) {
  p.push();
  p.translate(x, y);
  p.rotate(p.radians(rotation));
  const r = size / 2;
  p.beginShape();
  for (let i = 0; i < 6; i++) {
    const angle = (p.TWO_PI / 6) * i;
    p.vertex(p.cos(angle) * r, p.sin(angle) * r);
  }
  p.endShape(p.CLOSE);
  p.pop();
}

/**
 * Draw a star shape
 * @param {p5} p - p5 instance
 * @param {number} x - center x
 * @param {number} y - center y
 * @param {number} size - outer diameter
 * @param {number} rotation - rotation in degrees
 * @param {number} points - number of points (default 5)
 * @param {number} innerRatio - inner radius ratio (default 0.5)
 */
export function drawStar(p, x, y, size, rotation = 0, points = 5, innerRatio = 0.5) {
  p.push();
  p.translate(x, y);
  p.rotate(p.radians(rotation - 90)); // -90 to point upward
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

/**
 * Draw a diamond shape
 * @param {p5} p - p5 instance
 * @param {number} x - center x
 * @param {number} y - center y
 * @param {number} size - size
 * @param {number} rotation - rotation in degrees
 */
export function drawDiamond(p, x, y, size, rotation = 0) {
  p.push();
  p.translate(x, y);
  p.rotate(p.radians(rotation));
  const r = size / 2;
  p.beginShape();
  p.vertex(0, -r);
  p.vertex(r * 0.7, 0);
  p.vertex(0, r);
  p.vertex(-r * 0.7, 0);
  p.endShape(p.CLOSE);
  p.pop();
}

/**
 * Draw a cross/plus shape
 * @param {p5} p - p5 instance
 * @param {number} x - center x
 * @param {number} y - center y
 * @param {number} size - size
 * @param {number} rotation - rotation in degrees
 * @param {number} thickness - thickness ratio (default 0.3)
 */
export function drawCross(p, x, y, size, rotation = 0, thickness = 0.3) {
  p.push();
  p.translate(x, y);
  p.rotate(p.radians(rotation));
  p.rectMode(p.CENTER);
  const t = size * thickness;
  const r = size / 2;
  p.rect(0, 0, t, size);
  p.rect(0, 0, size, t);
  p.pop();
}

/**
 * Draw a heart shape
 * @param {p5} p - p5 instance
 * @param {number} x - center x
 * @param {number} y - center y
 * @param {number} size - size
 * @param {number} rotation - rotation in degrees
 */
export function drawHeart(p, x, y, size, rotation = 0) {
  p.push();
  p.translate(x, y);
  p.rotate(p.radians(rotation));
  const r = size / 2;
  
  p.beginShape();
  for (let a = 0; a < p.TWO_PI; a += 0.1) {
    // Heart parametric equation
    const hx = r * 0.8 * (16 * Math.pow(Math.sin(a), 3)) / 16;
    const hy = -r * 0.8 * (13 * Math.cos(a) - 5 * Math.cos(2*a) - 2 * Math.cos(3*a) - Math.cos(4*a)) / 16;
    p.vertex(hx, hy);
  }
  p.endShape(p.CLOSE);
  p.pop();
}

/**
 * Main shape drawing function - dispatches to specific shape
 * @param {p5} p - p5 instance
 * @param {string} type - shape type
 * @param {number} x - center x
 * @param {number} y - center y
 * @param {number} size - size
 * @param {number} rotation - rotation in degrees
 */
export function drawShape(p, type, x, y, size, rotation = 0) {
  switch (type) {
    case 'circle':
      drawCircle(p, x, y, size);
      break;
    case 'square':
      drawSquare(p, x, y, size, rotation);
      break;
    case 'triangle':
      drawTriangle(p, x, y, size, rotation);
      break;
    case 'hexagon':
      drawHexagon(p, x, y, size, rotation);
      break;
    case 'star':
      drawStar(p, x, y, size, rotation);
      break;
    case 'diamond':
      drawDiamond(p, x, y, size, rotation);
      break;
    case 'cross':
      drawCross(p, x, y, size, rotation);
      break;
    case 'heart':
      drawHeart(p, x, y, size, rotation);
      break;
    default:
      drawCircle(p, x, y, size);
  }
}

/**
 * Get the number of points for a shape (for optimization)
 * @param {string} type - shape type
 * @returns {number} - approximate vertex count
 */
export function getShapeVertexCount(type) {
  switch (type) {
    case 'circle': return 32;
    case 'square': return 4;
    case 'triangle': return 3;
    case 'hexagon': return 6;
    case 'star': return 10;
    case 'diamond': return 4;
    case 'cross': return 8;
    case 'heart': return 64;
    default: return 32;
  }
}
