// ============================================================
// Preset System - Save/Load configurations
// ============================================================

import { canvas, grid, shape, pattern, animation, palette, customShape, cloneState, applyState } from './state.js';

// Built-in presets
const builtInPresets = {
  'Radial Gradient': {
    grid: { cols: 15, rows: 15, cellSize: 40, symmetry: 'radial', symmetryCount: 8 },
    shape: { type: 'circle', size: 0.9, scaleMode: 'easeOut', scaleMin: 0.1, scaleMax: 1.0 },
    palette: { colors: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff'] },
  },
  
  'Geometric Mandala': {
    grid: { cols: 12, rows: 12, cellSize: 50, symmetry: 'radial', symmetryCount: 12 },
    shape: { type: 'hexagon', size: 0.7, rotation: 30, scaleMode: 'linear', scaleMin: 0.3, scaleMax: 0.9 },
    palette: { colors: ['#2d3436', '#636e72', '#b2bec3', '#dfe6e9', '#74b9ff'] },
  },
  
  'Organic Swirl': {
    grid: { cols: 20, rows: 20, cellSize: 30, symmetry: 'none' },
    shape: { type: 'circle', size: 0.6, scaleMode: 'swirl', scaleMin: 0.2, scaleMax: 1.0, scalePower: 2 },
    pattern: { enabled: true, noiseScale: 0.2, noiseIntensity: 0.6, seed: 42 },
    palette: { colors: ['#00b894', '#00cec9', '#0984e3', '#6c5ce7', '#fd79a8'] },
  },
  
  'Star Burst': {
    grid: { cols: 10, rows: 10, cellSize: 60, symmetry: 'radial', symmetryCount: 6 },
    shape: { type: 'star', size: 0.8, rotation: 0, scaleMode: 'easeIn', scaleMin: 0.1, scaleMax: 1.2 },
    palette: { colors: ['#ffeaa7', '#fdcb6e', '#e17055', '#d63031', '#e84393'] },
  },
  
  'Minimal Cross': {
    grid: { cols: 8, rows: 8, cellSize: 70, symmetry: 'both' },
    shape: { type: 'cross', size: 0.6, rotation: 45, scaleMode: 'linear', scaleMin: 0.4, scaleMax: 1.0 },
    palette: { colors: ['#2d3436', '#636e72', '#b2bec3', '#dfe6e9', '#ffffff'] },
  },
  
  'Triangular Flow': {
    grid: { cols: 16, rows: 16, cellSize: 35, symmetry: 'vertical' },
    shape: { type: 'triangle', size: 0.75, rotation: 0, scaleMode: 'easeInOut', scaleMin: 0.3, scaleMax: 1.0 },
    palette: { colors: ['#a8e6cf', '#dcedc1', '#ffd3b6', '#ffaaa5', '#ff8b94'] },
  },
  
  'Neon Circles': {
    grid: { cols: 8, rows: 8, cellSize: 80, symmetry: 'none' },
    shape: { type: 'circle', size: 1.2, scaleMode: 'linear', scaleMin: 0.2, scaleMax: 1.0, blendMode: 'add' },
    palette: { colors: ['#ff00ff', '#00ffff', '#ffff00', '#ff0080', '#8000ff'] },
  },
  
  'Diamond Echo': {
    grid: { cols: 14, rows: 14, cellSize: 45, symmetry: 'horizontal' },
    shape: { type: 'diamond', size: 0.65, rotation: 0, scaleMode: 'step', scaleMin: 0.2, scaleMax: 1.0 },
    palette: { colors: ['#2c3e50', '#34495e', '#7f8c8d', '#95a5a6', '#bdc3c7'] },
  },
  
  'Hearts Bloom': {
    grid: { cols: 10, rows: 10, cellSize: 55, symmetry: 'radial', symmetryCount: 8 },
    shape: { type: 'heart', size: 0.7, rotation: 0, scaleMode: 'easeOut', scaleMin: 0.15, scaleMax: 0.9 },
    palette: { colors: ['#ff9a9e', '#fecfef', '#fad0c4', '#ffecd2', '#fcb69f'] },
  },
  
  'Noise Texture': {
    grid: { cols: 25, rows: 25, cellSize: 24, symmetry: 'none' },
    shape: { type: 'square', size: 0.9, rotation: 45, scaleMode: 'linear', scaleMin: 0.1, scaleMax: 0.5 },
    pattern: { enabled: true, noiseScale: 0.3, noiseIntensity: 0.8, seed: 123 },
    palette: { colors: ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560'] },
  },
  
  'Retro Grid': {
    grid: { cols: 12, rows: 8, cellSize: 60, symmetry: 'horizontal' },
    shape: { type: 'square', size: 0.5, rotation: 0, scaleMode: 'linear', scaleMin: 0.3, scaleMax: 1.0 },
    palette: { colors: ['#ff006e', '#8338ec', '#3a86ff', '#06ffa5', '#ffbe0b'] },
  },
  
  'Spiral Galaxy': {
    grid: { cols: 20, rows: 20, cellSize: 30, symmetry: 'radial', symmetryCount: 5 },
    shape: { type: 'circle', size: 0.5, rotation: 0, scaleMode: 'swirl', scaleMin: 0.1, scaleMax: 0.8, scalePower: 3 },
    pattern: { enabled: true, noiseScale: 0.15, noiseIntensity: 0.4, seed: 777 },
    palette: { colors: ['#0c0c1d', '#16213e', '#4a1c40', '#c7417b', '#ff9a8b'] },
  },
};

// User saved presets (stored in memory during session)
let userPresets = {};

/**
 * Get list of all preset names
 * @returns {Array} - preset names
 */
export function getPresetNames() {
  return [
    '** Default **',
    ...Object.keys(builtInPresets),
    '--- User Presets ---',
    ...Object.keys(userPresets),
  ];
}

/**
 * Load a preset by name
 * @param {string} name - preset name
 * @returns {boolean} - success
 */
export function loadPreset(name) {
  if (name === '** Default **') {
    resetToDefault();
    return true;
  }
  
  const preset = builtInPresets[name] || userPresets[name];
  if (!preset) return false;
  
  applyPreset(preset);
  return true;
}

/**
 * Apply preset data to state
 * @param {Object} preset - preset data
 */
function applyPreset(preset) {
  if (preset.grid) applyState(grid, preset.grid);
  if (preset.shape) applyState(shape, preset.shape);
  if (preset.pattern) applyState(pattern, preset.pattern);
  if (preset.animation) applyState(animation, preset.animation);
  if (preset.palette) {
    if (preset.palette.colors) {
      palette.colors = [...preset.palette.colors];
    }
  }
  if (preset.canvas) applyState(canvas, preset.canvas);
}

/**
 * Save current state as a user preset
 * @param {string} name - preset name
 */
export function saveUserPreset(name) {
  userPresets[name] = {
    grid: cloneState(grid),
    shape: cloneState(shape),
    pattern: cloneState(pattern),
    animation: cloneState(animation),
    palette: { colors: [...palette.colors] },
    canvas: { background: canvas.background },
  };
}

/**
 * Export current state as JSON
 * @returns {string} - JSON string
 */
export function exportCurrentState() {
  const data = {
    grid: cloneState(grid),
    shape: cloneState(shape),
    pattern: cloneState(pattern),
    animation: cloneState(animation),
    palette: { colors: [...palette.colors] },
    canvas: { background: canvas.background },
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Import state from JSON
 * @param {string} json - JSON string
 * @returns {boolean} - success
 */
export function importState(json) {
  try {
    const data = JSON.parse(json);
    applyPreset(data);
    return true;
  } catch (e) {
    console.error('Failed to import preset:', e);
    return false;
  }
}

/**
 * Delete a user preset
 * @param {string} name - preset name
 */
export function deleteUserPreset(name) {
  delete userPresets[name];
}

/**
 * Reset to default state
 */
function resetToDefault() {
  // Grid defaults
  grid.cols = 12;
  grid.rows = 12;
  grid.cellSize = 60;
  grid.offsetX = 0;
  grid.offsetY = 0;
  grid.symmetry = 'none';
  grid.symmetryCount = 6;
  
  // Shape defaults
  shape.type = 'circle';
  shape.size = 0.8;
  shape.rotation = 0;
  shape.rotationAuto = false;
  shape.scaleMode = 'linear';
  shape.scaleMin = 0.2;
  shape.scaleMax = 1.0;
  shape.fillMode = 'solid';
  shape.fillColor = '#4a9eff';
  shape.strokeMode = 'none';
  shape.blendMode = 'blend';
  
  // Pattern defaults
  pattern.enabled = false;
  pattern.seed = 1;
  pattern.noiseScale = 0.1;
  pattern.noiseIntensity = 0.5;
  
  // Animation defaults
  animation.enabled = false;
  animation.playing = false;
  animation.speed = 1;
  animation.loopDuration = 120;
  
  // Palette defaults
  palette.colors = ['#4a9eff', '#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf'];
  
  // Canvas defaults
  canvas.background = '#111111';
}
