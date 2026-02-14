// ============================================================
// Preset System - RhythmGenerator
// ============================================================

import { 
  canvas, waveform, colorPalette, animation, effects, composition,
  cloneState, applyState, generatePalette 
} from './state.js';

// Built-in presets
const builtInPresets = {
  'Classic Noise Waves': {
    waveform: {
      mode: 'noise',
      count: 25,
      spacing: 10,
      amplitude: 80,
      frequency: 0.01,
      speed: 1,
      noiseScale: 0.005,
      noiseOctaves: 2,
      phaseOffset: 0.1,
      strokeWeight: 2,
    },
    colorPalette: {
      hueStart: 200,
      hueRange: 60,
      saturation: 85,
      lightness: 65,
    },
    canvas: { background: '#050505' },
  },
  
  'Sine Flow': {
    waveform: {
      mode: 'sine',
      count: 30,
      spacing: 12,
      amplitude: 60,
      frequency: 0.02,
      speed: 1.5,
      phaseOffset: 0.2,
      strokeWeight: 1.5,
      symmetry: 'none',
    },
    colorPalette: {
      hueStart: 280,
      hueRange: 120,
      saturation: 90,
      lightness: 70,
      gradientMode: 'linear',
    },
    canvas: { background: '#0a0510' },
  },
  
  'Glitch Grid': {
    waveform: {
      mode: 'square',
      count: 40,
      spacing: 6,
      amplitude: 40,
      frequency: 0.03,
      speed: 2,
      phaseOffset: 0.05,
      strokeWeight: 1,
    },
    effects: {
      glitchEnabled: true,
      glitchAmount: 15,
      glitchProbability: 0.1,
    },
    colorPalette: {
      hueStart: 120,
      hueRange: 40,
      saturation: 100,
      lightness: 50,
    },
    canvas: { background: '#000000' },
  },
  
  'Organic Ripple': {
    waveform: {
      mode: 'noise',
      count: 20,
      spacing: 15,
      amplitude: 100,
      frequency: 0.008,
      speed: 0.8,
      noiseScale: 0.003,
      noiseOctaves: 3,
      noisePersistence: 0.6,
    },
    effects: {
      rippleEnabled: true,
      rippleStrength: 30,
      rippleFrequency: 0.02,
    },
    colorPalette: {
      hueStart: 30,
      hueRange: 90,
      saturation: 80,
      lightness: 60,
      gradientMode: 'radial',
    },
    canvas: { background: '#100805' },
  },
  
  'Neon Pulse': {
    waveform: {
      mode: 'sawtooth',
      count: 15,
      spacing: 20,
      amplitude: 120,
      frequency: 0.015,
      speed: 1.2,
      strokeWeight: 3,
      strokeOpacity: 0.8,
    },
    colorPalette: {
      hueStart: 320,
      hueRange: 60,
      saturation: 100,
      lightness: 65,
      cycleEnabled: true,
      cycleSpeed: 0.5,
    },
    canvas: { background: '#050210' },
  },
  
  'Triangle Mirror': {
    waveform: {
      mode: 'triangle',
      count: 24,
      spacing: 8,
      amplitude: 70,
      frequency: 0.025,
      speed: 0.8,
      symmetry: 'horizontal',
      phaseOffset: 0.15,
    },
    colorPalette: {
      hueStart: 180,
      hueRange: 100,
      saturation: 75,
      lightness: 70,
    },
    canvas: { background: '#051010' },
  },
  
  'Minimal Lines': {
    waveform: {
      mode: 'sine',
      count: 10,
      spacing: 25,
      amplitude: 50,
      frequency: 0.008,
      speed: 0.5,
      strokeWeight: 1,
      strokeOpacity: 0.6,
    },
    colorPalette: {
      hueStart: 0,
      hueRange: 0,
      saturation: 0,
      lightness: 90,
    },
    canvas: { background: '#0a0a0a' },
  },
  
  'Chaos Theory': {
    waveform: {
      mode: 'noise',
      count: 50,
      spacing: 5,
      amplitude: 150,
      frequency: 0.04,
      speed: 2.5,
      noiseScale: 0.008,
      noiseOctaves: 4,
      noisePersistence: 0.7,
      phaseOffset: 0.3,
      strokeWeight: 0.8,
    },
    colorPalette: {
      hueStart: 60,
      hueRange: 200,
      saturation: 90,
      lightness: 55,
      gradientMode: 'wave',
      cycleEnabled: true,
      cycleSpeed: 1,
    },
    canvas: { background: '#000000' },
  },
  
  'Ocean Depths': {
    waveform: {
      mode: 'noise',
      count: 35,
      spacing: 8,
      amplitude: 90,
      frequency: 0.012,
      speed: 0.6,
      noiseScale: 0.004,
      noiseOctaves: 3,
    },
    colorPalette: {
      hueStart: 180,
      hueRange: 40,
      saturation: 70,
      lightness: 50,
      gradientMode: 'linear',
    },
    canvas: { background: '#020810' },
  },
  
  'Sunset Waves': {
    waveform: {
      mode: 'sine',
      count: 28,
      spacing: 11,
      amplitude: 75,
      frequency: 0.018,
      speed: 0.9,
      phaseOffset: 0.12,
    },
    colorPalette: {
      hueStart: 10,
      hueRange: 80,
      saturation: 85,
      lightness: 60,
      gradientMode: 'linear',
    },
    canvas: { background: '#0d0505' },
  },
  
  'Cyber Grid': {
    waveform: {
      mode: 'square',
      count: 32,
      spacing: 7,
      amplitude: 55,
      frequency: 0.022,
      speed: 1.8,
      symmetry: 'both',
      strokeWeight: 1.2,
    },
    colorPalette: {
      hueStart: 140,
      hueRange: 30,
      saturation: 100,
      lightness: 55,
    },
    canvas: { background: '#000502' },
  },
  
  'Dream State': {
    waveform: {
      mode: 'noise',
      count: 18,
      spacing: 18,
      amplitude: 110,
      frequency: 0.006,
      speed: 0.4,
      noiseScale: 0.002,
      noiseOctaves: 2,
      noisePersistence: 0.5,
      strokeWeight: 2.5,
      strokeOpacity: 0.7,
    },
    colorPalette: {
      hueStart: 260,
      hueRange: 100,
      saturation: 60,
      lightness: 75,
      gradientMode: 'wave',
    },
    canvas: { background: '#080510' },
  },
};

// User presets storage
let userPresets = {};

/**
 * Get all preset names
 * @returns {Array}
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
 * @param {string} name 
 * @returns {boolean}
 */
export function loadPreset(name) {
  if (name === '** Default **') {
    resetToDefaults();
    return true;
  }
  
  const preset = builtInPresets[name] || userPresets[name];
  if (!preset) return false;
  
  applyPreset(preset);
  return true;
}

/**
 * Apply preset data
 * @param {Object} preset 
 */
function applyPreset(preset) {
  if (preset.canvas) applyState(canvas, preset.canvas);
  if (preset.waveform) applyState(waveform, preset.waveform);
  if (preset.colorPalette) applyState(colorPalette, preset.colorPalette);
  if (preset.animation) applyState(animation, preset.animation);
  if (preset.effects) applyState(effects, preset.effects);
  if (preset.composition) applyState(composition, preset.composition);
}

/**
 * Save current state as user preset
 * @param {string} name 
 */
export function saveUserPreset(name) {
  userPresets[name] = {
    canvas: cloneState(canvas),
    waveform: cloneState(waveform),
    colorPalette: cloneState(colorPalette),
    animation: cloneState(animation),
    effects: cloneState(effects),
    composition: cloneState(composition),
  };
}

/**
 * Export current state as JSON
 * @returns {string}
 */
export function exportCurrentState() {
  const data = {
    canvas: cloneState(canvas),
    waveform: cloneState(waveform),
    colorPalette: cloneState(colorPalette),
    animation: cloneState(animation),
    effects: cloneState(effects),
    composition: cloneState(composition),
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Import state from JSON
 * @param {string} json 
 * @returns {boolean}
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
 * @param {string} name 
 */
export function deleteUserPreset(name) {
  delete userPresets[name];
}

/**
 * Reset all to defaults
 */
function resetToDefaults() {
  canvas.width = 800;
  canvas.height = 600;
  canvas.aspectRatio = '4:3';
  canvas.background = '#050505';
  
  waveform.count = 20;
  waveform.spacing = 8;
  waveform.amplitude = 100;
  waveform.frequency = 0.01;
  waveform.speed = 1;
  waveform.mode = 'noise';
  waveform.noiseScale = 0.005;
  waveform.noiseOctaves = 2;
  waveform.strokeWeight = 2;
  waveform.symmetry = 'none';
  
  colorPalette.hueStart = 200;
  colorPalette.hueRange = 60;
  colorPalette.saturation = 85;
  colorPalette.lightness = 65;
  colorPalette.cycleEnabled = false;
  
  effects.rippleEnabled = false;
  effects.glitchEnabled = false;
  
  animation.playing = true;
  animation.speed = 1;
}
