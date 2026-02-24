// ============================================================
// FLAKE Tool — Preset system
// ============================================================

import {
  canvas, pattern, style, shape, noiseParams, swirl, mask, motion,
  cloneState, applyState,
} from './state.js';

// ── Built-in presets ──────────────────────────────────────────

const builtInPresets = {

  'Motion: Techno Flake': {
    canvas:  { ratio: '4:3', scale: 0.97, background: '#dfded5' },
    style:   { renderStyle: 'fill', blendMode: 'multiply', colorType: 'paletteTransition',
               colors: ['#dfded5', '#d4c5c5', '#f7345b', '#8b3a3a'] },
    pattern: { cells: { x: 8, y: 8 }, cellOffset: { x: 0.01, y: 0.11 },
               seed: -1, seedRandom: 0, cellRotation: 0 },
    shape:   { shapeType: 'flake', shapeScale: 0.70, scalePower: 0,
               scalingEase: 'none', baseRotation: 0, angleMult: -1,
               gridMapping: { x: 6, y: 6 }, shapeCount: 5000 },
    noise:   { symmetry: 'standard', branchAmount: 6.0, branchAngle: 1.00,
               freqEasing: 'none', freqMode: 'cos', freqLayers: 10,
               freqBase: 0.30, freqAmplify: 0.50 },
    swirl:   { swirlMode: 'none', baseSwirl: 0, amplifyEffect: 0, frequency: 1 },
    mask:    { maskType: 'parametric', addBranches: 6, roundBranches: 0.5,
               maskMargins: { min: 0.05, max: 0.85 }, branchMode: 'ignore' },
    motion:  { motionType: 'noiseLoop', amplifyLevel: 30 },
  },

  'Motion Ripples Waves': {
    canvas:  { background: '#111111', ratio: '4:3' },
    style:   { renderStyle: 'fill', colorType: 'paletteTransition', blendMode: 'source-over',
               colors: ['#6c5ce7', '#ffffff', '#b2bec3', '#fdcb6e'] },
    pattern: { cells: { x: 10, y: 10 }, cellOffset: { x: 0, y: 0 },
               seed: 3, seedRandom: 0, cellRotation: 0 },
    shape:   { shapeType: 'arrow', shapeScale: 0.75, scalePower: 0,
               scalingEase: 'quadOut', baseRotation: 0, angleMult: -7 },
    noise:   { symmetry: 'standard', branchAmount: 1.0, branchAngle: 0,
               freqEasing: 'none', freqMode: 'cos', freqLayers: 3,
               freqBase: 0.07, freqAmplify: 0.5 },
    swirl:   { swirlMode: 'none' },
    motion:  { motionType: 'none', amplifyLevel: 20 },
  },

  'Radial Kaleidoscope': {
    canvas:  { background: '#1a1a1a', ratio: '1:1' },
    style:   { renderStyle: 'fill', colorType: 'paletteTransition', blendMode: 'source-over',
               colors: ['#e84393', '#e17055', '#fdcb6e', '#00b894'] },
    pattern: { cells: { x: 14, y: 14 }, cellOffset: { x: 0, y: 0 },
               seed: 7, seedRandom: 0, cellRotation: 0 },
    shape:   { shapeType: 'square', shapeScale: 0.9, scalePower: 0,
               scalingEase: 'quadOut', baseRotation: 45, angleMult: 4 },
    noise:   { symmetry: 'mirrored', branchAmount: 0.5, branchAngle: 0.785,
               freqEasing: 'none', freqMode: 'cos', freqLayers: 4,
               freqBase: 0.07, freqAmplify: 0.6 },
    swirl:   { swirlMode: 'none' },
    motion:  { motionType: 'none', amplifyLevel: 20 },
  },

  'Geometric Bloom': {
    canvas:  { background: '#0d1117', ratio: '4:3' },
    style:   { renderStyle: 'mixed', colorType: 'paletteTransition', blendMode: 'source-over',
               colors: ['#00cec9', '#0984e3', '#6c5ce7', '#a29bfe'] },
    pattern: { cells: { x: 8, y: 8 }, cellOffset: { x: 0, y: 0 },
               seed: 12, seedRandom: 2, cellRotation: 0 },
    shape:   { shapeType: 'flower', shapeScale: 0.85, scalePower: 0,
               scalingEase: 'linear', baseRotation: 30, angleMult: 6 },
    noise:   { symmetry: 'mirrored', branchAmount: 1.5, branchAngle: 0.524,
               freqEasing: 'none', freqMode: 'cos', freqLayers: 3,
               freqBase: 0.07, freqAmplify: 0.45 },
    swirl:   { swirlMode: 'none' },
    motion:  { motionType: 'none', amplifyLevel: 20 },
  },

  'Star Burst Field': {
    canvas:  { background: '#111111', ratio: '16:9' },
    style:   { renderStyle: 'fill', colorType: 'paletteTransition', blendMode: 'source-over',
               colors: ['#ffeaa7', '#fdcb6e', '#e17055', '#d63031'] },
    pattern: { cells: { x: 12, y: 12 }, cellOffset: { x: 0, y: 0 },
               seed: 42, seedRandom: 0, cellRotation: 0 },
    shape:   { shapeType: 'star', shapeScale: 0.8, scalePower: 0,
               scalingEase: 'quadIn', baseRotation: -20, angleMult: 5 },
    noise:   { symmetry: 'standard', branchAmount: 0.8, branchAngle: 0,
               freqEasing: 'none', freqMode: 'cos', freqLayers: 2,
               freqBase: 0.07, freqAmplify: 0.4 },
    swirl:   { swirlMode: 'none' },
    motion:  { motionType: 'none', amplifyLevel: 20 },
  },

  'Mirror Diamonds': {
    canvas:  { background: '#1a1a2e', ratio: '4:3' },
    style:   { renderStyle: 'fill', colorType: 'paletteTransition', blendMode: 'source-over',
               colors: ['#e94560', '#0f3460', '#533483', '#16213e'] },
    pattern: { cells: { x: 16, y: 16 }, cellOffset: { x: 0.5, y: 0 },
               seed: 5, seedRandom: 1, cellRotation: 0 },
    shape:   { shapeType: 'spark', shapeScale: 0.7, scalePower: 0,
               scalingEase: 'none', baseRotation: 0, angleMult: -3 },
    noise:   { symmetry: 'mirrored', branchAmount: 0, branchAngle: 0,
               freqEasing: 'none', freqMode: 'cos', freqLayers: 5,
               freqBase: 0.07, freqAmplify: 0.7 },
    swirl:   { swirlMode: 'none' },
    motion:  { motionType: 'none', amplifyLevel: 20 },
  },

  'Organic Circles': {
    canvas:  { background: '#222034', ratio: '4:3' },
    style:   { renderStyle: 'fill', colorType: 'paletteTransition', blendMode: 'source-over',
               colors: ['#ff79c6', '#bd93f9', '#8be9fd', '#50fa7b'] },
    pattern: { cells: { x: 18, y: 18 }, cellOffset: { x: 0, y: 0 },
               seed: 77, seedRandom: 0, cellRotation: 0 },
    shape:   { shapeType: 'circle', shapeScale: 0.9, scalePower: 0,
               scalingEase: 'quadInOut', baseRotation: 0, angleMult: 0 },
    noise:   { symmetry: 'standard', branchAmount: 2.0, branchAngle: 1.571,
               freqEasing: 'none', freqMode: 'cos', freqLayers: 4,
               freqBase: 0.07, freqAmplify: 0.55 },
    swirl:   { swirlMode: 'none' },
    motion:  { motionType: 'none', amplifyLevel: 20 },
  },

  'Triangular Flow': {
    canvas:  { background: '#111111', ratio: '3:2' },
    style:   { renderStyle: 'fill', colorType: 'paletteTransition', blendMode: 'source-over',
               colors: ['#a8e6cf', '#dcedc1', '#ffd3b6', '#ffaaa5'] },
    pattern: { cells: { x: 10, y: 10 }, cellOffset: { x: 0, y: 0 },
               seed: 21, seedRandom: 3, cellRotation: 0 },
    shape:   { shapeType: 'triangle', shapeScale: 0.75, scalePower: 0,
               scalingEase: 'quadOut', baseRotation: 0, angleMult: -9 },
    noise:   { symmetry: 'standard', branchAmount: 1.2, branchAngle: -0.349,
               freqEasing: 'none', freqMode: 'cos', freqLayers: 3,
               freqBase: 0.07, freqAmplify: 0.5 },
    swirl:   { swirlMode: 'rotary', baseSwirl: 0.1, amplifyEffect: 0, frequency: 1.5 },
    motion:  { motionType: 'none', amplifyLevel: 20 },
  },

  'Neon Cross Grid': {
    canvas:  { background: '#000000', ratio: '1:1' },
    style:   { renderStyle: 'fill', colorType: 'paletteSequence', blendMode: 'lighter',
               colors: ['#ff00ff', '#00ffff', '#ffff00', '#ff0080'] },
    pattern: { cells: { x: 8, y: 8 }, cellOffset: { x: 0, y: 0 },
               seed: 1, seedRandom: 0, cellRotation: 0 },
    shape:   { shapeType: 'cross', shapeScale: 0.6, scalePower: 0,
               scalingEase: 'linear', baseRotation: 45, angleMult: 2 },
    noise:   { symmetry: 'mirrored', branchAmount: 0, branchAngle: 0.785,
               freqEasing: 'none', freqMode: 'cos', freqLayers: 1,
               freqBase: 0.07, freqAmplify: 0.3 },
    swirl:   { swirlMode: 'none' },
    motion:  { motionType: 'none', amplifyLevel: 20 },
  },

  'Swirling Hearts': {
    canvas:  { background: '#1a0a00', ratio: '4:3' },
    style:   { renderStyle: 'fill', colorType: 'paletteTransition', blendMode: 'source-over',
               colors: ['#ff9a9e', '#fecfef', '#fad0c4', '#ffecd2'] },
    pattern: { cells: { x: 9, y: 9 }, cellOffset: { x: 0, y: 0 },
               seed: 88, seedRandom: 0, cellRotation: 0 },
    shape:   { shapeType: 'heart', shapeScale: 0.7, scalePower: 0,
               scalingEase: 'quadOut', baseRotation: 0, angleMult: -5 },
    noise:   { symmetry: 'standard', branchAmount: 1.5, branchAngle: 0.524,
               freqEasing: 'none', freqMode: 'cos', freqLayers: 3,
               freqBase: 0.07, freqAmplify: 0.6 },
    swirl:   { swirlMode: 'rotary', baseSwirl: 0, amplifyEffect: 0, frequency: 2.0 },
    motion:  { motionType: 'none', amplifyLevel: 20 },
  },

  'Free Noise Field': {
    canvas:  { background: '#282828', ratio: '16:9' },
    style:   { renderStyle: 'fill', colorType: 'solidColor', blendMode: 'source-over',
               colors: ['#50fa7b', '#f8f8f2', '#6272a4', '#bd93f9'] },
    pattern: { cells: { x: 20, y: 20 }, cellOffset: { x: 0, y: 0 },
               seed: 55, seedRandom: 5, cellRotation: 0 },
    shape:   { shapeType: 'arrow', shapeScale: 0.65, scalePower: 0,
               scalingEase: 'none', baseRotation: 0, angleMult: 10 },
    noise:   { symmetry: 'standard', branchAmount: 3.0, branchAngle: 0,
               freqEasing: 'none', freqMode: 'cos', freqLayers: 6,
               freqBase: 0.07, freqAmplify: 0.8 },
    swirl:   { swirlMode: 'none' },
    motion:  { motionType: 'none', amplifyLevel: 20 },
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
  if (data.shape)   applyState(shape,       data.shape);
  if (data.noise)   applyState(noiseParams, data.noise);
  if (data.swirl)   applyState(swirl,       data.swirl);
  if (data.mask)    applyState(mask,        data.mask);
  if (data.motion)  applyState(motion,      data.motion);
}

function captureState() {
  return {
    canvas:  cloneState({ background: canvas.background, ratio: canvas.ratio, scale: canvas.scale }),
    style:   cloneState({ renderStyle: style.renderStyle, colorType: style.colorType,
                          blendMode: style.blendMode, colors: style.colors }),
    pattern: cloneState(pattern),
    shape:   cloneState(shape),
    noise:   cloneState(noiseParams),
    swirl:   cloneState(swirl),
    mask:    cloneState({ maskType: mask.maskType, branchMode: mask.branchMode,
                          addBranches: mask.addBranches, roundBranches: mask.roundBranches,
                          maskMargins: mask.maskMargins }),
    motion:  cloneState({ motionType: motion.motionType, amplifyLevel: motion.amplifyLevel }),
  };
}

function resetToDefault() {
  canvas.background = '#ffffff';
  canvas.ratio      = '4:3';
  canvas.scale      = 0.97;

  pattern.cells.x       = 10;
  pattern.cells.y       = 10;
  pattern.cellOffset.x  = 0;
  pattern.cellOffset.y  = 0;
  pattern.seed          = 0;
  pattern.seedRandom    = 0;
  pattern.cellRotation  = 0;

  style.renderStyle = 'fill';
  style.colorType   = 'paletteTransition';
  style.colors      = ['#6c5ce7', '#ffffff', '#b2bec3', '#fdcb6e'];
  style.blendMode   = 'multiply';

  shape.shapeType    = 'flake';
  shape.gridMapping.x = 6;
  shape.gridMapping.y = 6;
  shape.shapeCount   = 5000;
  shape.shapeScale   = 0.75;
  shape.scalePower   = 0;
  shape.scalingEase  = 'none';
  shape.baseRotation = 0;
  shape.angleMult    = 1.0;

  noiseParams.symmetry     = 'standard';
  noiseParams.branchAmount = 1.0;
  noiseParams.branchAngle  = 0;
  noiseParams.freqEasing   = 'none';
  noiseParams.freqMode     = 'cos';
  noiseParams.freqLayers   = 4;
  noiseParams.freqBase     = 0.07;
  noiseParams.freqAmplify  = 0.5;

  swirl.baseSwirl     = 0;
  swirl.swirlMode     = 'none';
  swirl.amplifyEffect = 0;
  swirl.frequency     = 1.0;

  mask.maskType      = 'none';
  mask.branchMode    = 'ignore';
  mask.addBranches   = 6;
  mask.roundBranches = 0;
  mask.maskMargins.min = 0.1;
  mask.maskMargins.max = 0.9;
  mask.image         = null;

  motion.motionType   = 'none';
  motion.amplifyLevel = 20;
}
