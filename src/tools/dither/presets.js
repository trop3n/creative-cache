// ============================================================
// Preset Definitions + Load/Export Logic
// ============================================================

import { dither, gradient, ascii, cnv, cloneState, applyState } from './state.js';

// Each preset stores dither, gradient, ascii, and canvas settings.
// Only fields that differ from defaults need to be specified.
const presetData = {
  'ASCII8 Digital Future': {
    cnv: { ratio: '1:1', scale: 0.95, backColor: '#828282' },
    dither: { type: 'ascii', step: 4, contrast: 1.2, brightness: 1.05, scale: 2 },
    ascii: { fontname: 'Press Start 2P', text: '.+0#%@$&!*', scale: 8, color: { limit: 2, mode: 'chars', char: '#ffffff', bg: '#828282' } },
    gradient: { type: 'original', saturation: 0.75, palette: 27 },
  },
  'ASCII8 Blocky Grain': {
    cnv: { ratio: '1:1', scale: 0.95 },
    dither: { type: 'ascii', step: 8, contrast: 1.1, brightness: 1.0, scale: 1 },
    ascii: { fontname: 'VT323', text: ' .:;+=xX$#@', scale: 8, color: { limit: 4, mode: 'custom', char: '#00ff88', bg: '#111111' } },
    gradient: { type: 'original', saturation: 0.5, palette: 13 },
  },
  'ASCII8 Gradient Text': {
    cnv: { ratio: '4:3', scale: 0.95 },
    dither: { type: 'ascii', step: 6, contrast: 1.0, brightness: 1.0, scale: 2 },
    ascii: { fontname: 'Press Start 2P', text: ' .:-=+*#%@', scale: 8, color: { limit: 4, mode: 'chars', char: '#ffffff', bg: '#000000' } },
    gradient: { type: 'gradient', saturation: 1.0, palette: 10 },
  },
  'ASCII8 Camo Texture': {
    cnv: { ratio: '1:1', scale: 0.95 },
    dither: { type: 'ascii', step: 3, contrast: 1.3, brightness: 0.95, scale: 1 },
    ascii: { fontname: 'Share Tech Mono', text: '.oO08@#', scale: 8, color: { limit: 3, mode: 'chars', char: '#556b2f', bg: '#2d3a1a' } },
    gradient: { type: 'gradient', saturation: 1.0, palette: 5 },
  },
  'ASCII16 Black Label': {
    cnv: { ratio: '3:2', scale: 0.95 },
    dither: { type: 'ascii', step: 4, contrast: 1.4, brightness: 1.0, scale: 1 },
    ascii: { fontname: 'Press Start 2P', text: ' .,:;!|+*=#%@', scale: 16, color: { limit: 2, mode: 'custom', char: '#ffffff', bg: '#000000' } },
    gradient: { type: 'original', saturation: 0.0, palette: 0 },
  },
  'ASCII16 Random Wave': {
    cnv: { ratio: '16:9', scale: 0.95 },
    dither: { type: 'ascii', step: 8, contrast: 1.0, brightness: 1.05, scale: 2 },
    ascii: { fontname: 'VT323', text: '~-=+*%#@', scale: 16, color: { limit: 4, mode: 'chars', char: '#ff6600', bg: '#1a0a00' } },
    gradient: { type: 'gradient', saturation: 1.0, palette: 17 },
  },
  'ASCII16 Shading Filter': {
    cnv: { ratio: '1:1', scale: 0.95 },
    dither: { type: 'ascii', step: 6, contrast: 1.15, brightness: 1.0, scale: 1 },
    ascii: { fontname: 'IBM Plex Mono', text: ' ._-~:;=!*#$@', scale: 16, color: { limit: 4, mode: 'duotone', char: '#cccccc', bg: '#222222' } },
    gradient: { type: 'original', saturation: 0.5, palette: 22 },
  },
  'ASCII20 Retro Gaming': {
    cnv: { ratio: '4:3', scale: 0.95 },
    dither: { type: 'ascii', step: 4, contrast: 1.2, brightness: 1.1, scale: 2 },
    ascii: { fontname: 'Press Start 2P', text: ' .oO0@#$%&', scale: 20, color: { limit: 4, mode: 'chars', char: '#33ff33', bg: '#001100' } },
    gradient: { type: 'gradient', saturation: 1.0, palette: 19 },
  },
  'Halftone Basic Neon': {
    cnv: { ratio: '1:1', scale: 0.95 },
    dither: { type: 'halftone', step: 16, contrast: 1.2, brightness: 1.0, scale: 1, halftone: { scale: 6, smooth: 3, x: 1.2, y: 0.8, z: 1.0 } },
    gradient: { type: 'gradient', saturation: 1.0, palette: 17 },
  },
  'Halftone Basic Candy': {
    cnv: { ratio: '3:2', scale: 0.95 },
    dither: { type: 'halftone', step: 16, contrast: 1.0, brightness: 1.05, scale: 1, halftone: { scale: 8, smooth: 2, x: 1.0, y: 1.0, z: 1.0 } },
    gradient: { type: 'gradient', saturation: 1.0, palette: 23 },
  },
  'Halftone CMYK Original': {
    cnv: { ratio: '1:1', scale: 0.95 },
    dither: { type: 'halftoneCMYK', step: 16, contrast: 1.0, brightness: 1.0, scale: 1, halftone: { scale: 8, smooth: 2, x: 1, y: 1, z: 1 } },
    gradient: { type: 'original', saturation: 1.0, palette: 9 },
  },
  'Halftone CMYK Gradient': {
    cnv: { ratio: '4:3', scale: 0.95 },
    dither: { type: 'halftoneCMYK', step: 16, contrast: 1.1, brightness: 1.0, scale: 1, halftone: { scale: 6, smooth: 2, x: 1, y: 1, z: 1 } },
    gradient: { type: 'gradient', saturation: 1.0, palette: 11 },
  },
  'Halftone CMYK Pop-Up': {
    cnv: { ratio: '1:1', scale: 0.95 },
    dither: { type: 'halftoneCMYK', step: 8, contrast: 1.3, brightness: 1.05, scale: 1, halftone: { scale: 10, smooth: 1, x: 1, y: 1, z: 1 } },
    gradient: { type: 'gradient', saturation: 1.0, palette: 23 },
  },
  'Bayer2 Rough Gradient': {
    cnv: { ratio: '1:1', scale: 0.95 },
    dither: { type: 'matrix', matrix: 'bayer2', step: 4, contrast: 1.1, brightness: 1.0, scale: 3 },
    gradient: { type: 'gradient', saturation: 1.0, palette: 9 },
  },
  'Bayer4 Fine Grayscale': {
    cnv: { ratio: '3:2', scale: 0.95 },
    dither: { type: 'matrix', matrix: 'bayer4', step: 8, contrast: 1.0, brightness: 1.0, scale: 2 },
    gradient: { type: 'original', saturation: 0.0, palette: 0 },
  },
  'Bayer16 Fine Original': {
    cnv: { ratio: '1:1', scale: 0.95 },
    dither: { type: 'matrix', matrix: 'bayer16', step: 16, contrast: 1.0, brightness: 1.0, scale: 1 },
    gradient: { type: 'original', saturation: 1.0, palette: 0 },
  },
  'Matrix Fine Checker': {
    cnv: { ratio: '4:3', scale: 0.95 },
    dither: { type: 'matrix', matrix: 'checker', step: 8, contrast: 1.1, brightness: 1.0, scale: 2 },
    gradient: { type: 'gradient', saturation: 1.0, palette: 2 },
  },
  'Matrix Diagonal Contrast': {
    cnv: { ratio: '1:1', scale: 0.95 },
    dither: { type: 'matrix', matrix: 'diagonal', step: 6, contrast: 1.3, brightness: 0.95, scale: 2 },
    gradient: { type: 'original', saturation: 0.5, palette: 26 },
  },
  'Matrix Grid Gradient': {
    cnv: { ratio: '16:9', scale: 0.95 },
    dither: { type: 'matrix', matrix: 'grid', step: 10, contrast: 1.0, brightness: 1.0, scale: 3 },
    gradient: { type: 'gradient', saturation: 1.0, palette: 18 },
  },
  'Noise16 Fine Contrast': {
    cnv: { ratio: '1:1', scale: 0.95 },
    dither: { type: 'noise', noise: 'noise16', texture: 0, step: 8, contrast: 1.3, brightness: 1.0, scale: 1 },
    gradient: { type: 'original', saturation: 0.5, palette: 16 },
  },
  'Noise64 Grainy Repetitive': {
    cnv: { ratio: '3:2', scale: 0.95 },
    dither: { type: 'noise', noise: 'noise64', texture: 1, step: 12, contrast: 1.0, brightness: 1.0, scale: 1 },
    gradient: { type: 'original', saturation: 1.0, palette: 0 },
  },
  'Noise64 Blue Contrast': {
    cnv: { ratio: '1:1', scale: 0.95 },
    dither: { type: 'noise', noise: 'noise64', texture: 2, step: 6, contrast: 1.2, brightness: 1.0, scale: 2 },
    gradient: { type: 'gradient', saturation: 1.0, palette: 11 },
  },
  'Noise128 Duotone Gradient': {
    cnv: { ratio: '4:5', scale: 0.95 },
    dither: { type: 'noise', noise: 'noise128', texture: 0, step: 4, contrast: 1.0, brightness: 1.0, scale: 1 },
    gradient: { type: 'gradient', saturation: 1.0, palette: 7 },
  },
  'Noise128 Rough Original': {
    cnv: { ratio: '1:1', scale: 0.95 },
    dither: { type: 'noise', noise: 'noise128', texture: 3, step: 16, contrast: 1.0, brightness: 1.0, scale: 2 },
    gradient: { type: 'original', saturation: 1.0, palette: 0 },
  },
};

export const presetNames = [...Object.keys(presetData), '** User Preset **'];

export const presetOptions = {};
for (const name of presetNames) {
  presetOptions[name] = name;
}

// Store for user preset (saved state)
let userPreset = null;

/**
 * Load a preset by name, applying its values to the global state objects.
 * Returns true if a preset was found and applied.
 */
export function loadPreset(name) {
  let data;
  if (name === '** User Preset **') {
    data = userPreset;
    if (!data) return false;
  } else {
    data = presetData[name];
    if (!data) return false;
  }

  if (data.cnv) applyState(cnv, data.cnv);
  if (data.dither) applyState(dither, data.dither);
  if (data.gradient) applyState(gradient, data.gradient);
  if (data.ascii) applyState(ascii, data.ascii);

  cnv.preset = name;
  return true;
}

/**
 * Save current state as user preset.
 */
export function saveUserPreset() {
  userPreset = {
    cnv: cloneState({ ratio: cnv.ratio, scale: cnv.scale }),
    dither: cloneState(dither),
    gradient: cloneState(gradient),
    ascii: cloneState(ascii),
  };
}

/**
 * Export current settings as JSON string.
 */
export function exportPreset() {
  return JSON.stringify({
    cnv: { ratio: cnv.ratio, scale: cnv.scale },
    dither: cloneState(dither),
    gradient: cloneState(gradient),
    ascii: cloneState(ascii),
  }, null, 2);
}

/**
 * Import a preset from JSON string.
 */
export function importPreset(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    if (data.cnv) applyState(cnv, data.cnv);
    if (data.dither) applyState(dither, data.dither);
    if (data.gradient) applyState(gradient, data.gradient);
    if (data.ascii) applyState(ascii, data.ascii);
    cnv.preset = '** User Preset **';
    return true;
  } catch (e) {
    console.error('Failed to import preset:', e);
    return false;
  }
}
