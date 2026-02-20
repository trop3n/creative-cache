// ============================================================
// FLAKE Tool — Preset system
// ============================================================

import {
  canvas, pattern, style, noiseParams, swirl, motion,
  cloneState, applyState,
} from './state.js';

// ── Built-in presets ──────────────────────────────────────────

const builtInPresets = {

  'Motion Ripples Waves': {
    canvas:  { background: '#111111', ratio: '4:3' },
    pattern: { cols: 10, cellSize: 48, cellOffset: 0, seedNoise: 3, seedFrom: 0 },
    style:   { shapeType: 'arrow', fillMapping: 2, colors: ['#6c5ce7', '#ffffff', '#b2bec3', '#fdcb6e'],
               shapeScale: 0.75, scalingEase: 'easeOut', baseRotation: 0, angleMult: -7, strokeWidth: 0 },
    noise:   { symmetry: 'standard', branchAhead: 1.0, branchAngle: 0, freqLayers: 3, freqAmply: 0.5 },
  },

  'Radial Kaleidoscope': {
    canvas:  { background: '#1a1a1a', ratio: '1:1' },
    pattern: { cols: 14, cellSize: 36, cellOffset: 0, seedNoise: 7, seedFrom: 0 },
    style:   { shapeType: 'square', fillMapping: 4, colors: ['#e84393', '#e17055', '#fdcb6e', '#00b894'],
               shapeScale: 0.9, scalingEase: 'easeOut', baseRotation: 45, angleMult: 4, strokeWidth: 0 },
    noise:   { symmetry: '4way', branchAhead: 0.5, branchAngle: 45, freqLayers: 4, freqAmply: 0.6 },
  },

  'Geometric Bloom': {
    canvas:  { background: '#0d1117', ratio: '4:3' },
    pattern: { cols: 8, cellSize: 56, cellOffset: 0, seedNoise: 12, seedFrom: 2 },
    style:   { shapeType: 'hexagon', fillMapping: 3, colors: ['#00cec9', '#0984e3', '#6c5ce7', '#a29bfe'],
               shapeScale: 0.85, scalingEase: 'linear', baseRotation: 30, angleMult: 6, strokeWidth: 0.5, strokeColor: '#ffffff' },
    noise:   { symmetry: '2way', branchAhead: 1.5, branchAngle: 30, freqLayers: 3, freqAmply: 0.45 },
  },

  'Star Burst Field': {
    canvas:  { background: '#111111', ratio: '16:9' },
    pattern: { cols: 12, cellSize: 40, cellOffset: 0, seedNoise: 42, seedFrom: 0 },
    style:   { shapeType: 'star', fillMapping: 2, colors: ['#ffeaa7', '#fdcb6e', '#e17055', '#d63031'],
               shapeScale: 0.8, scalingEase: 'easeIn', baseRotation: -20, angleMult: 5, strokeWidth: 0 },
    noise:   { symmetry: 'standard', branchAhead: 0.8, branchAngle: 0, freqLayers: 2, freqAmply: 0.4 },
  },

  'Mirror Diamonds': {
    canvas:  { background: '#1a1a2e', ratio: '4:3' },
    pattern: { cols: 16, cellSize: 32, cellOffset: 0.5, seedNoise: 5, seedFrom: 1 },
    style:   { shapeType: 'diamond', fillMapping: 4, colors: ['#e94560', '#0f3460', '#533483', '#16213e'],
               shapeScale: 0.7, scalingEase: 'step', baseRotation: 0, angleMult: -3, strokeWidth: 0 },
    noise:   { symmetry: 'mirror', branchAhead: 0.0, branchAngle: 0, freqLayers: 5, freqAmply: 0.7 },
  },

  'Organic Circles': {
    canvas:  { background: '#222034', ratio: '4:3' },
    pattern: { cols: 18, cellSize: 28, cellOffset: 0, seedNoise: 77, seedFrom: 0 },
    style:   { shapeType: 'circle', fillMapping: 2, colors: ['#ff79c6', '#bd93f9', '#8be9fd', '#50fa7b'],
               shapeScale: 0.9, scalingEase: 'easeInOut', baseRotation: 0, angleMult: 0, strokeWidth: 0 },
    noise:   { symmetry: 'standard', branchAhead: 2.0, branchAngle: 90, freqLayers: 4, freqAmply: 0.55 },
  },

  'Triangular Flow': {
    canvas:  { background: '#111111', ratio: '3:2' },
    pattern: { cols: 10, cellSize: 44, cellOffset: 0, seedNoise: 21, seedFrom: 3 },
    style:   { shapeType: 'triangle', fillMapping: 3, colors: ['#a8e6cf', '#dcedc1', '#ffd3b6', '#ffaaa5'],
               shapeScale: 0.75, scalingEase: 'easeOut', baseRotation: 0, angleMult: -9, strokeWidth: 0 },
    noise:   { symmetry: 'standard', branchAhead: 1.2, branchAngle: -20, freqLayers: 3, freqAmply: 0.5 },
    swirl:   { applyEffect: true, swirlMode: 'rotary', swirlStart: 0.1, frequency: 1.5 },
  },

  'Neon Cross Grid': {
    canvas:  { background: '#000000', ratio: '1:1' },
    pattern: { cols: 8, cellSize: 64, cellOffset: 0, seedNoise: 1, seedFrom: 0 },
    style:   { shapeType: 'cross', fillMapping: 1, colors: ['#ff00ff', '#00ffff', '#ffff00', '#ff0080'],
               shapeScale: 0.6, scalingEase: 'linear', baseRotation: 45, angleMult: 2, strokeWidth: 0 },
    noise:   { symmetry: '4way', branchAhead: 0, branchAngle: 45, freqLayers: 1, freqAmply: 0.3 },
  },

  'Swirling Hearts': {
    canvas:  { background: '#1a0a00', ratio: '4:3' },
    pattern: { cols: 9, cellSize: 52, cellOffset: 0, seedNoise: 88, seedFrom: 0 },
    style:   { shapeType: 'heart', fillMapping: 2, colors: ['#ff9a9e', '#fecfef', '#fad0c4', '#ffecd2'],
               shapeScale: 0.7, scalingEase: 'easeOut', baseRotation: 0, angleMult: -5, strokeWidth: 0 },
    noise:   { symmetry: 'standard', branchAhead: 1.5, branchAngle: 30, freqLayers: 3, freqAmply: 0.6 },
    swirl:   { applyEffect: true, swirlMode: 'rotary', swirlStart: 0, frequency: 2.0 },
  },

  'Free Noise Field': {
    canvas:  { background: '#282828', ratio: '16:9' },
    pattern: { cols: 20, cellSize: 24, cellOffset: 0, seedNoise: 55, seedFrom: 5 },
    style:   { shapeType: 'arrow', fillMapping: 0, colors: ['#50fa7b', '#f8f8f2', '#6272a4', '#bd93f9'],
               shapeScale: 0.65, scalingEase: 'none', baseRotation: 0, angleMult: 10, strokeWidth: 0 },
    noise:   { symmetry: 'standard', branchAhead: 3.0, branchAngle: 0, freeMode: true, freqLayers: 6, freqAmply: 0.8 },
  },
};

// ── User presets (session memory) ─────────────────────────────
let userPresets = {};

// ── Public API ────────────────────────────────────────────────

export function getPresetNames() {
  return [
    '** Default **',
    ...Object.keys(builtInPresets),
    ...Object.keys(userPresets),
  ];
}

export function loadPreset(name) {
  if (name === '** Default **') {
    resetToDefault();
    return true;
  }
  const data = builtInPresets[name] || userPresets[name];
  if (!data) return false;
  applyPreset(data);
  return true;
}

export function saveUserPreset(name) {
  userPresets[name] = captureState();
}

export function exportCurrentState() {
  return JSON.stringify(captureState(), null, 2);
}

export function importState(json) {
  try {
    applyPreset(JSON.parse(json));
    return true;
  } catch (e) {
    console.error('FLAKE: failed to import preset', e);
    return false;
  }
}

// ── Helpers ───────────────────────────────────────────────────

function applyPreset(data) {
  if (data.canvas)  applyState(canvas,      data.canvas);
  if (data.pattern) applyState(pattern,     data.pattern);
  if (data.style)   applyState(style,       data.style);
  if (data.noise)   applyState(noiseParams, data.noise);
  if (data.swirl)   applyState(swirl,       data.swirl);
  if (data.motion)  applyState(motion,      data.motion);
}

function captureState() {
  return {
    canvas:  cloneState({ background: canvas.background, ratio: canvas.ratio }),
    pattern: cloneState(pattern),
    style:   cloneState(style),
    noise:   cloneState(noiseParams),
    swirl:   cloneState(swirl),
    motion:  cloneState({ motionType: motion.motionType, speed: motion.speed }),
  };
}

function resetToDefault() {
  canvas.background   = '#111111';
  canvas.ratio        = '4:3';

  pattern.cols        = 10;
  pattern.cellSize    = 48;
  pattern.cellOffset  = 0;
  pattern.seedFrom    = 0;
  pattern.seedNoise   = 3;
  pattern.cellDivider = false;

  style.shapeType     = 'arrow';
  style.fillMapping   = 2;
  style.colors        = ['#6c5ce7', '#ffffff', '#b2bec3', '#fdcb6e'];
  style.shapeScale    = 0.75;
  style.scalingEase   = 'easeOut';
  style.baseRotation  = 0;
  style.angleMult     = -7;
  style.strokeWidth   = 0;
  style.strokeColor   = '#ffffff';
  style.blendMode     = 'blend';

  noiseParams.symmetry    = 'standard';
  noiseParams.branchAhead = 1.0;
  noiseParams.branchAngle = 0;
  noiseParams.freqComp    = 'none';
  noiseParams.freeMode    = false;
  noiseParams.freqLayers  = 3;
  noiseParams.freqAmply   = 0.5;

  swirl.applyEffect   = false;
  swirl.swirlMode     = 'none';
  swirl.swirlStart    = 0;
  swirl.frequency     = 1.0;

  motion.motionType   = 'none';
  motion.speed        = 1.0;
  motion.playing      = false;
}
