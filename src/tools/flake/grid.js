// ============================================================
// Grid System - Distance-based pattern generation
// ============================================================

import { grid, shape, canvas, calculateScale, calculateRotation, palette, pattern, mask } from './state.js';
import { createNoise2D, createNoise3D } from 'simplex-noise';

// Initialize noise
const noise2D = createNoise2D();
const noise3D = createNoise3D();

/**
 * Calculate the center point of the grid
 * @returns {Object} - {x, y}
 */
export function getGridCenter() {
  return {
    x: (grid.cols * grid.cellSize) / 2 + grid.offsetX,
    y: (grid.rows * grid.cellSize) / 2 + grid.offsetY,
  };
}

/**
 * Calculate distance from a point to the grid center
 * @param {number} x - point x
 * @param {number} y - point y
 * @returns {number} - normalized distance (0-1)
 */
export function getNormalizedDistance(x, y) {
  const center = getGridCenter();
  const maxDist = Math.sqrt(
    Math.pow(grid.cols * grid.cellSize / 2, 2) +
    Math.pow(grid.rows * grid.cellSize / 2, 2)
  );
  
  const dist = Math.sqrt(
    Math.pow(x - center.x, 2) +
    Math.pow(y - center.y, 2)
  );
  
  return Math.min(dist / maxDist, 1);
}

/**
 * Get all cell positions for the grid considering symmetry
 * @returns {Array} - array of cell data: {x, y, col, row, dist, isOriginal}
 */
export function getGridCells() {
  const cells = [];
  const center = getGridCenter();
  
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const x = col * grid.cellSize + grid.cellSize / 2 + grid.offsetX;
      const y = row * grid.cellSize + grid.cellSize / 2 + grid.offsetY;
      const dist = getNormalizedDistance(x, y);
      
      // Check if this cell should be rendered (based on symmetry)
      const cellData = applySymmetry(x, y, col, row, dist, center);
      cells.push(...cellData);
    }
  }
  
  return cells;
}

/**
 * Apply symmetry transformations to a cell
 * @param {number} x - original x
 * @param {number} y - original y
 * @param {number} col - column index
 * @param {number} row - row index
 * @param {number} dist - normalized distance
 * @param {Object} center - grid center
 * @returns {Array} - array of cell positions
 */
function applySymmetry(x, y, col, row, dist, center) {
  const cells = [{ x, y, col, row, dist, isOriginal: true }];
  
  switch (grid.symmetry) {
    case 'horizontal':
      cells.push({
        x: center.x * 2 - x,
        y: y,
        col: grid.cols - 1 - col,
        row,
        dist,
        isOriginal: false,
      });
      break;
      
    case 'vertical':
      cells.push({
        x: x,
        y: center.y * 2 - y,
        col,
        row: grid.rows - 1 - row,
        dist,
        isOriginal: false,
      });
      break;
      
    case 'both':
      // Mirror horizontally
      cells.push({
        x: center.x * 2 - x,
        y: y,
        col: grid.cols - 1 - col,
        row,
        dist,
        isOriginal: false,
      });
      // Mirror vertically
      cells.push({
        x: x,
        y: center.y * 2 - y,
        col,
        row: grid.rows - 1 - row,
        dist,
        isOriginal: false,
      });
      // Mirror both
      cells.push({
        x: center.x * 2 - x,
        y: center.y * 2 - y,
        col: grid.cols - 1 - col,
        row: grid.rows - 1 - row,
        dist,
        isOriginal: false,
      });
      break;
      
    case 'radial':
      // Create radial symmetry around center
      const dx = x - center.x;
      const dy = y - center.y;
      const baseAngle = Math.atan2(dy, dx);
      const radius = Math.sqrt(dx * dx + dy * dy);
      
      for (let i = 1; i < grid.symmetryCount; i++) {
        const angle = baseAngle + (Math.PI * 2 * i) / grid.symmetryCount;
        cells.push({
          x: center.x + Math.cos(angle) * radius,
          y: center.y + Math.sin(angle) * radius,
          col,
          row,
          dist,
          isOriginal: false,
          rotation: (360 * i) / grid.symmetryCount,
        });
      }
      break;
  }
  
  return cells;
}

/**
 * Calculate the actual size for a shape at a given distance
 * @param {number} dist - normalized distance (0-1)
 * @param {number} time - animation time (0-1)
 * @returns {number} - actual size
 */
export function getShapeSize(dist, time = 0) {
  const baseSize = grid.cellSize * shape.size;
  let scale = calculateScale(dist);
  
  // Apply pattern noise
  if (pattern.enabled) {
    const noiseVal = getNoiseValue(dist, time);
    scale *= 0.5 + noiseVal * 0.5;
  }
  
  return baseSize * scale;
}

/**
 * Calculate the rotation for a shape
 * @param {number} dist - normalized distance
 * @param {number} baseRotation - base rotation
 * @param {number} time - animation time
 * @returns {number} - final rotation
 */
export function getShapeRotation(dist, baseRotation, time = 0) {
  let rotation = calculateRotation(dist, baseRotation);
  
  if (shape.rotationAuto) {
    rotation += time * 360 * shape.rotationSpeed;
  }
  
  return rotation;
}

/**
 * Get noise value for a position
 * @param {number} dist - normalized distance
 * @param {number} time - time value
 * @returns {number} - noise value (0-1)
 */
export function getNoiseValue(dist, time = 0) {
  if (!pattern.enabled) return 0.5;
  
  const scale = pattern.noiseScale;
  const seed = pattern.seed;
  
  // Use distance and seed for noise
  const nx = dist * scale * 10 + seed;
  const ny = time * scale + seed;
  
  const val = noise2D(nx, ny);
  return (val + 1) * 0.5; // Normalize to 0-1
}

/**
 * Get the fill color for a shape
 * @param {number} dist - normalized distance
 * @param {number} index - shape index
 * @param {number} time - animation time
 * @returns {string} - color string
 */
export function getFillColor(dist, index, time = 0) {
  switch (shape.fillMode) {
    case 'solid':
      return shape.fillColor;
      
    case 'distance': {
      // Interpolate between palette colors based on distance
      const colors = palette.colors;
      const t = dist * (colors.length - 1);
      const i = Math.floor(t);
      const frac = t - i;
      
      if (i >= colors.length - 1) return colors[colors.length - 1];
      return interpolateColor(colors[i], colors[i + 1], frac);
    }
      
    case 'palette': {
      // Cycle through palette based on index
      const colors = palette.colors;
      return colors[index % colors.length];
    }
      
    case 'random': {
      // Deterministic random based on index
      const colors = palette.colors;
      return colors[(index * 7) % colors.length];
    }
      
    default:
      return shape.fillColor;
  }
}

/**
 * Get stroke color for a shape
 * @param {number} dist - normalized distance
 * @param {number} index - shape index
 * @returns {string} - color string
 */
export function getStrokeColor(dist, index) {
  if (shape.strokeMode === 'none') return null;
  if (shape.strokeMode === 'solid') return shape.strokeColor;
  
  // For gradient/distance modes, same logic as fill
  return getFillColor(dist, index);
}

/**
 * Interpolate between two hex colors
 * @param {string} c1 - first color
 * @param {string} c2 - second color
 * @param {number} t - interpolation factor (0-1)
 * @returns {string} - interpolated color
 */
function interpolateColor(c1, c2, t) {
  const r1 = parseInt(c1.slice(1, 3), 16);
  const g1 = parseInt(c1.slice(3, 5), 16);
  const b1 = parseInt(c1.slice(5, 7), 16);
  
  const r2 = parseInt(c2.slice(1, 3), 16);
  const g2 = parseInt(c2.slice(3, 5), 16);
  const b2 = parseInt(c2.slice(5, 7), 16);
  
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Get mask value for a position
 * @param {number} x - x position
 * @param {number} y - y position
 * @returns {number} - mask value (0-1)
 */
export function getMaskValue(x, y) {
  if (!mask.enabled || !mask.image) return 1;
  
  // Map position to mask image coordinates
  const imgW = mask.image.width;
  const imgH = mask.image.height;
  
  const mx = Math.floor((x / canvas.width) * imgW);
  const my = Math.floor((y / canvas.height) * imgH);
  
  if (mx < 0 || mx >= imgW || my < 0 || my >= imgH) return 1;
  
  // Get pixel brightness (would need actual image data)
  // For now, return 1
  return 1;
}

/**
 * Update canvas size based on grid settings
 */
export function updateCanvasSize() {
  canvas.width = grid.cols * grid.cellSize + Math.abs(grid.offsetX) * 2;
  canvas.height = grid.rows * grid.cellSize + Math.abs(grid.offsetY) * 2;
}

/**
 * Get animation time value (0-1 loop)
 * @param {number} frameCount - current frame
 * @returns {number} - normalized time (0-1)
 */
export function getAnimationTime(frameCount) {
  if (!animation.enabled) return 0;
  
  const loopFrames = animation.loopDuration;
  const frame = frameCount % loopFrames;
  return frame / loopFrames;
}
