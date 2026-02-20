// ============================================================
// Preset System - BOIDS
// ============================================================

import { canvas, flock, visual, animation } from './state.js';

function applyDeep(target, source) {
  for (const key of Object.keys(source)) {
    if (
      typeof source[key] === 'object' && source[key] !== null &&
      typeof target[key] === 'object' && target[key] !== null
    ) {
      applyDeep(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

// ============================================================
// Built-in Presets
// ============================================================

const builtInPresets = {
  'Classic Flock': {
    canvas:  { background: '#050505', trailAlpha: 20 },
    flock:   { count: 150, separationRadius: 28, alignmentRadius: 50, cohesionRadius: 50,
               separationWeight: 1.5, alignmentWeight: 1.0, cohesionWeight: 1.0,
               maxSpeed: 4.0, minSpeed: 0.5, maxForce: 0.15, boundary: 'wrap' },
    visual:  { shape: 'triangle', boidSize: 8, colorMode: 'velocity',
               hueStart: 200, hueRange: 140, saturation: 85, lightness: 65, opacity: 1.0 },
  },

  'Dense Swarm': {
    canvas:  { background: '#000000', trailAlpha: 10 },
    flock:   { count: 300, separationRadius: 18, alignmentRadius: 35, cohesionRadius: 60,
               separationWeight: 2.0, alignmentWeight: 0.8, cohesionWeight: 1.4,
               maxSpeed: 3.5, minSpeed: 1.0, maxForce: 0.2, boundary: 'wrap' },
    visual:  { shape: 'circle', boidSize: 5, colorMode: 'palette',
               hueStart: 280, hueRange: 80, saturation: 90, lightness: 60, opacity: 0.9 },
  },

  'Murmuration': {
    canvas:  { background: '#050208', trailAlpha: 8 },
    flock:   { count: 400, separationRadius: 20, alignmentRadius: 80, cohesionRadius: 80,
               separationWeight: 1.2, alignmentWeight: 1.8, cohesionWeight: 0.8,
               maxSpeed: 5.0, minSpeed: 2.0, maxForce: 0.08, boundary: 'wrap' },
    visual:  { shape: 'triangle', boidSize: 6, colorMode: 'heading',
               hueStart: 0, hueRange: 360, saturation: 70, lightness: 70, opacity: 0.85 },
  },

  'Schools of Fish': {
    canvas:  { background: '#020810', trailAlpha: 30 },
    flock:   { count: 200, separationRadius: 22, alignmentRadius: 45, cohesionRadius: 45,
               separationWeight: 1.3, alignmentWeight: 2.0, cohesionWeight: 1.1,
               maxSpeed: 6.0, minSpeed: 2.5, maxForce: 0.12, boundary: 'bounce' },
    visual:  { shape: 'triangle', boidSize: 9, colorMode: 'palette',
               hueStart: 180, hueRange: 60, saturation: 80, lightness: 65, opacity: 1.0 },
  },

  'Scattered': {
    canvas:  { background: '#0a0a0a', trailAlpha: 40 },
    flock:   { count: 80, separationRadius: 60, alignmentRadius: 30, cohesionRadius: 20,
               separationWeight: 2.5, alignmentWeight: 0.5, cohesionWeight: 0.3,
               maxSpeed: 3.0, minSpeed: 0.5, maxForce: 0.1, boundary: 'wrap' },
    visual:  { shape: 'line', boidSize: 12, colorMode: 'velocity',
               hueStart: 30, hueRange: 180, saturation: 90, lightness: 60, opacity: 0.8 },
  },

  'Neon Trails': {
    canvas:  { background: '#000000', trailAlpha: 6 },
    flock:   { count: 120, separationRadius: 25, alignmentRadius: 55, cohesionRadius: 55,
               separationWeight: 1.4, alignmentWeight: 1.2, cohesionWeight: 1.0,
               maxSpeed: 4.5, minSpeed: 1.5, maxForce: 0.14, boundary: 'wrap' },
    visual:  { shape: 'circle', boidSize: 7, colorMode: 'heading',
               hueStart: 300, hueRange: 220, saturation: 100, lightness: 65, opacity: 0.9 },
  },

  'Minimal': {
    canvas:  { background: '#0a0a0a', trailAlpha: 255 },
    flock:   { count: 60, separationRadius: 30, alignmentRadius: 50, cohesionRadius: 50,
               separationWeight: 1.5, alignmentWeight: 1.0, cohesionWeight: 1.0,
               maxSpeed: 3.0, minSpeed: 0.5, maxForce: 0.1, boundary: 'avoid' },
    visual:  { shape: 'triangle', boidSize: 10, colorMode: 'uniform',
               color: '#e0e0e0', opacity: 1.0 },
  },
};

let userPresets = {};

export function getPresetNames() {
  return [
    '** Default **',
    ...Object.keys(builtInPresets),
    ...Object.keys(userPresets),
  ];
}

export function loadPreset(name) {
  if (name === '** Default **') {
    resetToDefaults();
    return true;
  }

  const preset = builtInPresets[name] || userPresets[name];
  if (!preset) return false;

  if (preset.canvas)  applyDeep(canvas, preset.canvas);
  if (preset.flock)   applyDeep(flock,  preset.flock);
  if (preset.visual)  applyDeep(visual, preset.visual);
  return true;
}

export function saveUserPreset(name) {
  userPresets[name] = {
    canvas:  JSON.parse(JSON.stringify(canvas)),
    flock:   JSON.parse(JSON.stringify(flock)),
    visual:  JSON.parse(JSON.stringify(visual)),
  };
}

export function exportCurrentState() {
  return JSON.stringify({
    canvas:  JSON.parse(JSON.stringify(canvas)),
    flock:   JSON.parse(JSON.stringify(flock)),
    visual:  JSON.parse(JSON.stringify(visual)),
  }, null, 2);
}

export function importState(json) {
  try {
    const data = JSON.parse(json);
    if (data.canvas)  applyDeep(canvas, data.canvas);
    if (data.flock)   applyDeep(flock,  data.flock);
    if (data.visual)  applyDeep(visual, data.visual);
    return true;
  } catch {
    return false;
  }
}

function resetToDefaults() {
  canvas.background = '#050505';
  canvas.trailAlpha = 20;
  canvas.aspectRatio = '4:3';

  flock.count              = 150;
  flock.separationRadius   = 28;
  flock.alignmentRadius    = 50;
  flock.cohesionRadius     = 50;
  flock.separationWeight   = 1.5;
  flock.alignmentWeight    = 1.0;
  flock.cohesionWeight     = 1.0;
  flock.maxSpeed           = 4.0;
  flock.minSpeed           = 0.5;
  flock.maxForce           = 0.15;
  flock.boundary           = 'wrap';

  visual.shape     = 'triangle';
  visual.boidSize  = 8;
  visual.colorMode = 'velocity';
  visual.color     = '#4a9eff';
  visual.hueStart  = 200;
  visual.hueRange  = 140;
  visual.saturation = 85;
  visual.lightness  = 65;
  visual.opacity    = 1.0;
}
