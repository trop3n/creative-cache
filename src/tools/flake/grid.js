// ============================================================
// FLAKE Tool — Tile-based angle-field rendering engine
// ============================================================
// Core concept:
//   • The canvas is filled by tiling a square sub-grid of (pattern.cols × pattern.cols) cells.
//   • Within each tile, shapes scale by distance from the tile centre (scalingEase).
//   • Every cell's rotation = baseRotation + angleMult × angleField(col, row).
//   • The angle field = radial-from-tile-centre + multi-octave noise.
//   • Symmetry mirrors the noise sample coordinates inside each tile.
//   • Swirl adds a distance-proportional rotational offset.
//   • Motion animates the noise phase over time.
// ============================================================

import { createNoise2D } from 'simplex-noise';
import {
  canvas, pattern, style, noiseParams, swirl, mask, motion,
  customShape, applyEasing,
} from './state.js';
import { drawShape } from './shapes/library.js';
import { drawSVGPath } from './shapes/svg.js';
import { getFillColor } from './color.js';

// One shared noise instance; we seed via coordinate offset using pattern.seedNoise.
const noise2D = createNoise2D();

// ── Public: render one frame ─────────────────────────────────

/**
 * Render the full pattern onto the p5 canvas.
 * @param {p5} p
 * @param {number} time  normalised loop time 0–1 (for motion)
 */
export function renderPattern(p, time = 0) {
  // Trail/ghost effect: when motion is active and opacityLevel < 1,
  // overlay a semi-transparent background instead of fully clearing.
  if (motion.playing && motion.motionType !== 'none' && motion.opacityLevel < 0.99) {
    const bg = p.color(canvas.background);
    bg.setAlpha(Math.round(motion.opacityLevel * 255));
    p.noStroke();
    p.fill(bg);
    p.blendMode(p.BLEND);
    p.rect(0, 0, canvas.width, canvas.height);
  } else {
    p.background(canvas.background);
  }

  const { cols, cellSize, cellOffset, cellDivider } = pattern;

  // How many cells span the canvas (add 1 for partial tiles at edges)
  const numCols = Math.ceil(canvas.width  / cellSize) + 1;
  const numRows = Math.ceil(canvas.height / cellSize) + 1;

  // Pre-load mask pixels once per frame (not per cell)
  if (mask.image && mask.maskTool === 'image') {
    mask.image.loadPixels();
  }

  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {

      // Brick-offset alternate rows
      const xOff = (row % 2 === 1) ? cellSize * cellOffset * 0.5 : 0;
      const cx = col * cellSize + cellSize * 0.5 + xOff;
      const cy = row * cellSize + cellSize * 0.5;

      // Tile-local indices (wrap to 0…cols-1)
      const tc = ((col % cols) + cols) % cols;
      const tr = ((row % cols) + cols) % cols;

      // Normalised position within tile (−1…+1, centre = 0)
      const half = cols * 0.5;
      const tnx = (tc - half + 0.5) / half;
      const tny = (tr - half + 0.5) / half;

      // Euclidean distance from tile centre, clamped 0–1
      const dist = Math.min(Math.sqrt(tnx * tnx + tny * tny) / Math.SQRT2, 1.0);

      // --- Shape size (max at centre, falls off with easing) ---
      const scaledT  = applyEasing(1 - dist, style.scalingEase);
      const shapeSize = cellSize * style.shapeScale * scaledT;

      if (shapeSize < 0.5) continue;

      // --- Rotation from angle field ---
      const fieldAngle = computeAngle(col, row, tnx, tny, dist, time); // radians
      const rotDeg = style.baseRotation + fieldAngle * style.angleMult * (180 / Math.PI);

      // --- Mask ---
      const maskAlpha = getMaskAlpha(cx, cy);
      if (maskAlpha < 0.01) continue;

      // --- Color ---
      const color = getFillColor(dist, col + row * numCols, style);
      drawCell(p, cx, cy, shapeSize, rotDeg, color, maskAlpha);
    }
  }

  // Grid overlay
  if (cellDivider) {
    drawCellGrid(p, numCols, numRows, cellSize);
  }
}

// ── Angle field ───────────────────────────────────────────────

/**
 * Returns the angle (radians) for the cell at global (col, row).
 * Combines: radial from tile centre + multi-octave noise + swirl + motion.
 */
function computeAngle(col, row, tnx, tny, dist, time) {
  const {
    symmetry, branchAhead, branchAngle, freeMode,
    freqLayers, freqAmply,
  } = noiseParams;
  const seed = pattern.seedNoise + pattern.seedFrom;

  // Apply symmetry to tile-local coords for noise sampling only
  let sx = tnx, sy = tny;
  switch (symmetry) {
    case '2way':   sx = Math.abs(tnx); break;
    case '4way':   sx = Math.abs(tnx); sy = Math.abs(tny); break;
    case 'mirror': sx = 1 - Math.abs(Math.abs(tnx) - 1); break;
  }

  // Base radial direction from tile centre (points outward)
  const radial = freeMode ? 0 : Math.atan2(tny, tnx);

  // Multi-octave noise (using global col/row for cross-tile continuity)
  let noiseAcc = 0;
  let freq = 0.07;
  let amp  = freqAmply;
  for (let i = 0; i < freqLayers; i++) {
    const nx = (sx * pattern.cols + col * 0.1) * freq + seed * 13.7;
    const ny = (sy * pattern.cols + row * 0.1) * freq + seed * 7.31;
    noiseAcc += noise2D(nx, ny) * amp;
    freq *= 2.0;
    amp  *= 0.5;
  }

  // Branch look-ahead: sample noise slightly ahead for flow coherence
  let branchContrib = 0;
  if (branchAhead > 0.01) {
    const lookNx = (sx + Math.cos(radial + noiseAcc) * branchAhead * 0.5) * freq * 0.5 + seed * 5.1;
    const lookNy = (sy + Math.sin(radial + noiseAcc) * branchAhead * 0.5) * freq * 0.5 + seed * 9.3;
    branchContrib = noise2D(lookNx, lookNy) * freqAmply * branchAhead * 0.3;
  }

  // Swirl offset (distance-based rotational push)
  let swirlOff = 0;
  if (swirl.applyEffect && swirl.swirlMode !== 'none') {
    const sd = Math.max(0, dist - swirl.swirlStart);
    swirlOff = sd * swirl.frequency * Math.PI * (swirl.swirlMode === 'wave' ? Math.sin(dist * Math.PI * 4) : 1);
  }

  // Motion over time
  let timeOff = 0;
  if (motion.playing && motion.motionType !== 'none') {
    if (motion.motionType === 'rotate') {
      timeOff = time * Math.PI * 2 * motion.speed;
    } else if (motion.motionType === 'noise') {
      timeOff = noise2D(col * 0.03 + time * motion.speed, row * 0.03) * Math.PI;
    }
  }

  const branchOff = branchAngle * (Math.PI / 180);

  return radial + (noiseAcc + branchContrib) * Math.PI + branchOff + swirlOff + timeOff;
}

// ── Draw a single cell ────────────────────────────────────────

function drawCell(p, x, y, size, rotDeg, color, alpha) {
  // Apply blend mode
  const bm = style.blendMode;
  if (bm !== 'blend' && p[bm.toUpperCase()]) {
    p.blendMode(p[bm.toUpperCase()]);
  }

  const c = p.color(color);
  c.setAlpha(alpha * 255);
  p.fill(c);

  if (style.strokeWidth > 0) {
    const sc = p.color(style.strokeColor || '#ffffff');
    sc.setAlpha(alpha * 255);
    p.stroke(sc);
    p.strokeWeight(style.strokeWidth);
  } else {
    p.noStroke();
  }

  if (style.shapeType === 'custom' && customShape.paths.length > 0) {
    drawSVGPath(p, customShape.paths[0], x, y, size, customShape.bounds, rotDeg);
  } else {
    drawShape(p, style.shapeType, x, y, size, rotDeg);
  }

  p.blendMode(p.BLEND);
}

// ── Mask sampling ─────────────────────────────────────────────

function getMaskAlpha(x, y) {
  if (!mask.image || mask.maskTool !== 'image') return 1;

  const img = mask.image;
  const px  = Math.floor((x / canvas.width)  * img.width);
  const py  = Math.floor((y / canvas.height) * img.height);

  if (px < 0 || px >= img.width || py < 0 || py >= img.height) return 1;

  const idx = (py * img.width + px) * 4;
  const brightness = (img.pixels[idx] + img.pixels[idx + 1] + img.pixels[idx + 2]) / 765;
  return mask.invert ? 1 - brightness : brightness;
}

// ── Cell grid overlay ─────────────────────────────────────────

function drawCellGrid(p, numCols, numRows, cellSize) {
  p.push();
  p.stroke(60, 60, 60, 100);
  p.strokeWeight(0.5);
  p.noFill();
  for (let c = 0; c <= numCols; c++) {
    p.line(c * cellSize, 0, c * cellSize, numRows * cellSize);
  }
  for (let r = 0; r <= numRows; r++) {
    p.line(0, r * cellSize, numCols * cellSize, r * cellSize);
  }
  p.pop();
}

// ── Export helper: draw a cell onto an offscreen buffer ───────
// (used by export.js to render scaled versions)

export { drawCell as drawCellExport };
