// ============================================================
// FLAKE Tool — Tile-based angle-field rendering engine
// ============================================================
// Core concept:
//   • The canvas is filled by tiling a (pattern.cells.x × pattern.cells.y) sub-grid.
//   • Within each tile, shapes scale by distance from the tile centre (scalingEase).
//   • Every cell's rotation = shape.baseRotation + angleMult × angleField(col, row).
//   • The angle field = radial-from-tile-centre + multi-octave noise.
//   • Symmetry mirrors the noise sample coordinates inside each tile.
//   • Swirl adds a distance-proportional rotational offset.
//   • Motion animates the noise phase over time.
// ============================================================

import { createNoise2D } from 'simplex-noise';
import {
  canvas, pattern, style, shape, noiseParams, swirl, mask, motion,
  customShape, applyEasing,
} from './state.js';
import { drawShape } from './shapes/library.js';
import { drawSVGPath } from './shapes/svg.js';
import { getFillColor } from './color.js';

// One shared noise instance; seed via coordinate offset using pattern.seed.
const noise2D = createNoise2D();

// ── Blend mode mapping: CSS string → p5 constant name ────────
const blendModeMap = {
  'multiply':    'MULTIPLY',
  'xor':         'XOR',
  'source-over': 'BLEND',
  'lighter':     'ADD',
  'screen':      'SCREEN',
  'overlay':     'OVERLAY',
  'darken':      'DARKEST',
  'lighten':     'LIGHTEST',
  'color-dodge': 'DODGE',
  'color-burn':  'BURN',
  'hard-light':  'HARD_LIGHT',
  'soft-light':  'SOFT_LIGHT',
  'exclusion':   'EXCLUSION',
  'difference':  'DIFFERENCE',
};

// Line-based shapes that use stroke instead of fill
const LINE_SHAPES = new Set(['flake']);

// ── Public: render one frame ─────────────────────────────────

/**
 * Render the full pattern onto the p5 canvas.
 * @param {p5}    p
 * @param {number} time  normalised loop time 0–1 (for motion)
 */
export function renderPattern(p, time = 0) {
  p.background(canvas.background);

  // Auto-compute cell size from tile dimensions
  const cellSizeX = canvas.width  / pattern.cells.x;
  const cellSizeY = canvas.height / pattern.cells.y;
  const cellSize  = Math.min(cellSizeX, cellSizeY);

  // How many cells span the canvas (add 1 for partial tiles at edges)
  const numCols = Math.ceil(canvas.width  / cellSize) + 1;
  const numRows = Math.ceil(canvas.height / cellSize) + 1;

  // Motion scale multiplier for scalingLoop / scalingOneWay
  let scaleMult = 1;
  if (motion.motionType === 'scalingLoop') {
    scaleMult = 0.5 + 0.5 * Math.sin(time * Math.PI * 2);
  } else if (motion.motionType === 'scalingOneWay') {
    scaleMult = time;
  }

  // Pre-load mask pixels once per frame
  if (mask.image && mask.maskType === 'raster') {
    mask.image.loadPixels();
  }

  const maxShapes = Math.max(1, shape.shapeCount);
  let drawnCount = 0;

  outer:
  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
      // Cell center with brick-offset on alternate rows/cols
      const xOff = (row % 2 === 1) ? cellSize * pattern.cellOffset.x * 0.5 : 0;
      const yOff = (col % 2 === 1) ? cellSize * pattern.cellOffset.y * 0.5 : 0;
      const cx = col * cellSize + cellSize * 0.5 + xOff;
      const cy = row * cellSize + cellSize * 0.5 + yOff;

      // Tile-local indices (wrap to 0…cells-1)
      const tc = ((col % pattern.cells.x) + pattern.cells.x) % pattern.cells.x;
      const tr = ((row % pattern.cells.y) + pattern.cells.y) % pattern.cells.y;

      // Normalised position within tile (−1…+1, centre = 0)
      const halfX = pattern.cells.x * 0.5;
      const halfY = pattern.cells.y * 0.5;
      const tnx = (tc - halfX + 0.5) / halfX;
      const tny = (tr - halfY + 0.5) / halfY;

      // Euclidean distance from tile centre, clamped 0–1
      const dist = Math.min(Math.sqrt(tnx * tnx + tny * tny) / Math.SQRT2, 1.0);

      // Shape size with easing and scale power
      let scaledT = applyEasing(1 - dist, shape.scalingEase);
      if (shape.scalePower > 0) scaledT = Math.pow(scaledT, shape.scalePower + 1);
      const shapeSize = cellSize * shape.shapeScale * scaledT * scaleMult;

      if (shapeSize < 0.5) continue;

      // Rotation from angle field
      const fieldAngle = computeAngle(col, row, tnx, tny, dist, time);
      const rotDeg = shape.baseRotation + pattern.cellRotation
        + fieldAngle * shape.angleMult * (180 / Math.PI);

      // Mask
      const maskAlpha = getMaskAlpha(cx, cy);
      if (maskAlpha < 0.01) continue;

      // Color
      const color = getFillColor(dist, col + row * numCols, style);

      drawCell(p, cx, cy, shapeSize, rotDeg, color, maskAlpha);

      drawnCount++;
      if (drawnCount >= maxShapes) break outer;
    }
  }
}

// ── Angle field ───────────────────────────────────────────────

function computeAngle(col, row, tnx, tny, dist, time) {
  const {
    symmetry, branchAmount, branchAngle, freqEasing,
    freqMode, freqLayers, freqBase, freqAmplify,
  } = noiseParams;

  const seed = pattern.seed + pattern.seedRandom;

  // Symmetry: standard or mirrored
  let sx = tnx, sy = tny;
  if (symmetry === 'mirrored') {
    sx = Math.abs(tnx);
    sy = Math.abs(tny);
  }

  // Base radial direction from tile centre (points outward)
  const radial = Math.atan2(tny, tnx);

  // Multi-octave noise with freqBase instead of hardcoded 0.07
  let noiseAcc = 0;
  let freq = freqBase;
  let amp  = freqAmplify;
  for (let i = 0; i < freqLayers; i++) {
    const nx = (sx * shape.gridMapping.x + col * 0.1) * freq + seed * 13.7;
    const ny = (sy * shape.gridMapping.y + row * 0.1) * freq + seed * 7.31;
    noiseAcc += noise2D(nx, ny) * amp;
    freq *= 2.0;
    amp  *= 0.5;
  }

  // freqMode: cos or sin transformation
  noiseAcc = freqMode === 'cos'
    ? Math.cos(noiseAcc * Math.PI)
    : Math.sin(noiseAcc * Math.PI);

  // freqEasing: apply easing to noise strength based on distance
  const distWeight = applyEasing(1 - dist, freqEasing);
  noiseAcc *= distWeight;

  // Branch look-ahead with branchAmount (extended range 0–12)
  let branchContrib = 0;
  if (branchAmount > 0.01) {
    const lookNx = (sx + Math.cos(radial + noiseAcc) * branchAmount * 0.5) * freq * 0.5 + seed * 5.1;
    const lookNy = (sy + Math.sin(radial + noiseAcc) * branchAmount * 0.5) * freq * 0.5 + seed * 9.3;
    branchContrib = noise2D(lookNx, lookNy) * freqAmplify * branchAmount * 0.3;
  }

  // Swirl offset (swirlMode !== 'none' replaces applyEffect check)
  let swirlOff = 0;
  if (swirl.swirlMode !== 'none') {
    const sd = Math.max(0, dist - swirl.baseSwirl);
    const base = swirl.swirlMode === 'wave' ? Math.sin(dist * Math.PI * 4) : 1;
    swirlOff = sd * swirl.frequency * Math.PI * base * (1 + swirl.amplifyEffect);
  }

  // Motion: noiseLoop type affects angle; scaling types handled in renderPattern
  let timeOff = 0;
  if (motion.motionType === 'noiseLoop') {
    const t = motion.amplifyLevel / 100;
    timeOff = noise2D(col * 0.03 + time * t * 3, row * 0.03) * Math.PI;
  }

  // branchAngle is stored in radians
  return radial + (noiseAcc + branchContrib) * Math.PI + branchAngle + swirlOff + timeOff;
}

// ── Draw a single cell ────────────────────────────────────────

function drawCell(p, x, y, size, rotDeg, color, alpha) {
  // Apply blend mode
  const bmKey = blendModeMap[style.blendMode] || 'BLEND';
  p.blendMode(p[bmKey] || p.BLEND);

  const c = p.color(color);
  c.setAlpha(alpha * 255);

  const isLineShape = LINE_SHAPES.has(shape.shapeType);

  if (isLineShape) {
    // Line-based shapes: always render as stroke
    p.noFill();
    p.stroke(c);
    p.strokeWeight(Math.max(1, size * 0.06));
  } else {
    if (style.renderStyle === 'fill' || style.renderStyle === 'mixed') {
      p.fill(c);
    } else {
      p.noFill();
    }
    if (style.renderStyle === 'stroke' || style.renderStyle === 'mixed') {
      p.stroke(c);
      p.strokeWeight(1);
    } else {
      p.noStroke();
    }
  }

  if (shape.shapeType === 'custom' && customShape.paths.length > 0) {
    drawSVGPath(p, customShape.paths[0], x, y, size, customShape.bounds, rotDeg);
  } else {
    drawShape(p, shape.shapeType, x, y, size, rotDeg);
  }

  p.blendMode(p.BLEND);
}

// ── Mask sampling ─────────────────────────────────────────────

function getMaskAlpha(cx, cy) {
  if (mask.maskType === 'none') return 1;

  if (mask.maskType === 'raster') {
    if (!mask.image) return 1;
    const img = mask.image;
    const px  = Math.floor((cx / canvas.width)  * img.width);
    const py  = Math.floor((cy / canvas.height) * img.height);
    if (px < 0 || px >= img.width || py < 0 || py >= img.height) return 1;
    const idx = (py * img.width + px) * 4;
    const brightness = (img.pixels[idx] + img.pixels[idx + 1] + img.pixels[idx + 2]) / 765;
    return brightness;
  }

  if (mask.maskType === 'parametric') {
    // Polar coords relative to canvas center (−1..+1)
    const nx = (cx / canvas.width)  * 2 - 1;
    const ny = (cy / canvas.height) * 2 - 1;
    const r  = Math.sqrt(nx * nx + ny * ny);
    const theta = Math.atan2(ny, nx);

    // Branch petal function
    const n = mask.addBranches;
    const petal   = 0.5 + 0.5 * Math.cos(n * theta);
    const round   = Math.pow(petal, Math.max(0.1, mask.roundBranches + 1));
    const outerR  = mask.maskMargins.max * round;
    const innerR  = mask.maskMargins.min;

    if (r > outerR || r < innerR) return 0;

    // Soft edge falloff
    const edge = 0.05;
    const outerAlpha = Math.min(1, (outerR - r) / edge);
    const innerAlpha = Math.min(1, (r - innerR) / edge);
    return Math.min(outerAlpha, innerAlpha);
  }

  return 1;
}

// ── Export helper ─────────────────────────────────────────────
export { drawCell as drawCellExport };
