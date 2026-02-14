import { 
  canvas, shape, duplication, transform, animation, 
  split, color, interactive, applyState, cloneState 
} from './state.js';

// ============================================================
// Built-in Presets
// ============================================================

const presetData = {
  'Hypnotic Rings': {
    canvas: { ratio: '1:1' },
    shape: { 
      type: 'circle', 
      size: 80, 
      strokeWeight: 2,
      strokeColor: '#00ffff',
      fillColor: '#000000',
      fillOpacity: 0,
      strokeOpacity: 1,
    },
    duplication: { count: 30, spacing: 10, spread: 300 },
    transform: { offsetX: 0, offsetY: 0, scaleMin: 0.2, scaleMax: 2, rotation: 0, rotationStep: 0 },
    animation: { enabled: true, mode: 'sine', speed: 0.3, amplitude: 30, frequency: 0.02, noiseScale: 0.01 },
    split: { mode: 'four', gap: 0 },
    color: { useGradient: true, gradientStart: '#00ffff', gradientEnd: '#ff00ff', hueShift: true, hueSpeed: 0.3 },
    interactive: { posX: 0, posY: 0, transition: 0, canvasScale: 1, canvasRotation: 0 },
  },
  
  'Noise Swarm': {
    canvas: { ratio: '1:1' },
    shape: { 
      type: 'hexagon', 
      size: 40, 
      strokeWeight: 1,
      strokeColor: '#ffffff',
      fillColor: '#4a9eff',
      fillOpacity: 0.3,
      strokeOpacity: 0.8,
    },
    duplication: { count: 50, spacing: 5, spread: 400 },
    transform: { offsetX: 20, offsetY: 10, scaleMin: 0.3, scaleMax: 1.5, rotation: 45, rotationStep: 15 },
    animation: { enabled: true, mode: 'noise', speed: 0.8, amplitude: 80, frequency: 0.01, noiseScale: 0.008 },
    split: { mode: 'none', gap: 0 },
    color: { useGradient: false, gradientStart: '#4a9eff', gradientEnd: '#ff4a9e', hueShift: true, hueSpeed: 0.5 },
    interactive: { posX: 0, posY: 0, transition: 0, canvasScale: 1, canvasRotation: 0 },
  },
  
  'Kaleidoscope': {
    canvas: { ratio: '1:1' },
    shape: { 
      type: 'triangle', 
      size: 120, 
      strokeWeight: 3,
      strokeColor: '#ffcc00',
      fillColor: '#ff0066',
      fillOpacity: 0.2,
      strokeOpacity: 1,
    },
    duplication: { count: 12, spacing: 20, spread: 250 },
    transform: { offsetX: 0, offsetY: 0, scaleMin: 0.1, scaleMax: 1.2, rotation: 30, rotationStep: 30 },
    animation: { enabled: true, mode: 'combined', speed: 0.4, amplitude: 60, frequency: 0.015, noiseScale: 0.005 },
    split: { mode: 'four', gap: 10 },
    color: { useGradient: true, gradientStart: '#ffcc00', gradientEnd: '#ff0066', hueShift: false, hueSpeed: 0.2 },
    interactive: { posX: 0, posY: 0, transition: 0, canvasScale: 1, canvasRotation: 0 },
  },
  
  'Vertical Mirror': {
    canvas: { ratio: '9:16' },
    shape: { 
      type: 'diamond', 
      size: 60, 
      strokeWeight: 2,
      strokeColor: '#00ff88',
      fillColor: '#000000',
      fillOpacity: 0,
      strokeOpacity: 1,
    },
    duplication: { count: 25, spacing: 15, spread: 350 },
    transform: { offsetX: 10, offsetY: 5, scaleMin: 0.4, scaleMax: 1.3, rotation: 15, rotationStep: 8 },
    animation: { enabled: true, mode: 'cosine', speed: 0.5, amplitude: 40, frequency: 0.025, noiseScale: 0.01 },
    split: { mode: 'vertical', gap: 0 },
    color: { useGradient: true, gradientStart: '#00ff88', gradientEnd: '#0088ff', hueShift: true, hueSpeed: 0.4 },
    interactive: { posX: 0, posY: 0, transition: 0, canvasScale: 1, canvasRotation: 0 },
  },
  
  'Horizontal Wave': {
    canvas: { ratio: '16:9' },
    shape: { 
      type: 'star', 
      size: 50, 
      strokeWeight: 1.5,
      strokeColor: '#ff4444',
      fillColor: '#ff8800',
      fillOpacity: 0.4,
      strokeOpacity: 0.9,
    },
    duplication: { count: 40, spacing: 8, spread: 300 },
    transform: { offsetX: 15, offsetY: 25, scaleMin: 0.2, scaleMax: 1.4, rotation: 72, rotationStep: 10 },
    animation: { enabled: true, mode: 'sine', speed: 0.6, amplitude: 50, frequency: 0.02, noiseScale: 0.006 },
    split: { mode: 'horizontal', gap: 5 },
    color: { useGradient: true, gradientStart: '#ff4444', gradientEnd: '#ff8800', hueShift: false, hueSpeed: 0.3 },
    interactive: { posX: 0, posY: 0, transition: 0, canvasScale: 1, canvasRotation: 0 },
  },
  
  'Minimal Static': {
    canvas: { ratio: '1:1' },
    shape: { 
      type: 'square', 
      size: 100, 
      strokeWeight: 4,
      strokeColor: '#ffffff',
      fillColor: '#333333',
      fillOpacity: 0.5,
      strokeOpacity: 1,
    },
    duplication: { count: 5, spacing: 30, spread: 150 },
    transform: { offsetX: 0, offsetY: 0, scaleMin: 0.5, scaleMax: 1, rotation: 0, rotationStep: 0 },
    animation: { enabled: false, mode: 'none', speed: 0, amplitude: 0, frequency: 0, noiseScale: 0 },
    split: { mode: 'none', gap: 0 },
    color: { useGradient: false, gradientStart: '#ffffff', gradientEnd: '#000000', hueShift: false, hueSpeed: 0 },
    interactive: { posX: 0, posY: 0, transition: 0, canvasScale: 1, canvasRotation: 0 },
  },
  
  'Organic Flow': {
    canvas: { ratio: '4:3' },
    shape: { 
      type: 'circle', 
      size: 30, 
      strokeWeight: 0.5,
      strokeColor: '#88ff00',
      fillColor: '#44aa00',
      fillOpacity: 0.6,
      strokeOpacity: 0.5,
    },
    duplication: { count: 80, spacing: 3, spread: 500 },
    transform: { offsetX: 8, offsetY: 12, scaleMin: 0.1, scaleMax: 2, rotation: 0, rotationStep: 5 },
    animation: { enabled: true, mode: 'noise', speed: 1.2, amplitude: 100, frequency: 0.008, noiseScale: 0.003 },
    split: { mode: 'horizontal', gap: 20 },
    color: { useGradient: true, gradientStart: '#88ff00', gradientEnd: '#00ff44', hueShift: true, hueSpeed: 0.8 },
    interactive: { posX: 0, posY: 0, transition: 0, canvasScale: 1, canvasRotation: 0 },
  },
  
  'Geometric Precision': {
    canvas: { ratio: '1:1' },
    shape: { 
      type: 'hexagon', 
      size: 70, 
      strokeWeight: 2.5,
      strokeColor: '#aa66ff',
      fillColor: '#440088',
      fillOpacity: 0.3,
      strokeOpacity: 1,
    },
    duplication: { count: 15, spacing: 25, spread: 200 },
    transform: { offsetX: 0, offsetY: 0, scaleMin: 0.6, scaleMax: 1.1, rotation: 60, rotationStep: 60 },
    animation: { enabled: true, mode: 'combined', speed: 0.2, amplitude: 20, frequency: 0.03, noiseScale: 0.01 },
    split: { mode: 'four', gap: 15 },
    color: { useGradient: true, gradientStart: '#aa66ff', gradientEnd: '#ff66aa', hueShift: false, hueSpeed: 0.1 },
    interactive: { posX: 0, posY: 0, transition: 0, canvasScale: 1, canvasRotation: 0 },
  },
};

// Generate preset options for dropdown
export const presetOptions = Object.keys(presetData).reduce((acc, name) => {
  acc[name] = name;
  return acc;
}, { '** User Preset **': '** User Preset **' });

// Load a preset by name
export function loadPreset(name) {
  const data = presetData[name];
  if (!data) return false;
  
  if (data.canvas) applyState(canvas, data.canvas);
  if (data.shape) applyState(shape, data.shape);
  if (data.duplication) applyState(duplication, data.duplication);
  if (data.transform) applyState(transform, data.transform);
  if (data.animation) applyState(animation, data.animation);
  if (data.split) applyState(split, data.split);
  if (data.color) applyState(color, data.color);
  if (data.interactive) applyState(interactive, data.interactive);
  
  return true;
}

// Export current settings as JSON
export function exportPreset() {
  return JSON.stringify({
    canvas: cloneState(canvas),
    shape: cloneState(shape),
    duplication: cloneState(duplication),
    transform: cloneState(transform),
    animation: cloneState(animation),
    split: cloneState(split),
    color: cloneState(color),
    interactive: cloneState(interactive),
  }, null, 2);
}

// Import settings from JSON
export function importPreset(json) {
  try {
    const data = JSON.parse(json);
    
    if (data.canvas) applyState(canvas, data.canvas);
    if (data.shape) applyState(shape, data.shape);
    if (data.duplication) applyState(duplication, data.duplication);
    if (data.transform) applyState(transform, data.transform);
    if (data.animation) applyState(animation, data.animation);
    if (data.split) applyState(split, data.split);
    if (data.color) applyState(color, data.color);
    if (data.interactive) applyState(interactive, data.interactive);
    
    return { success: true, message: 'Preset loaded successfully' };
  } catch (e) {
    return { success: false, message: 'Invalid preset file: ' + e.message };
  }
}

// Randomize settings for creative exploration
export function randomizeSettings() {
  const shapes = ['circle', 'square', 'triangle', 'hexagon', 'star', 'diamond'];
  const splits = ['none', 'horizontal', 'vertical', 'four'];
  const anims = ['none', 'noise', 'sine', 'cosine', 'combined'];
  
  shape.type = shapes[Math.floor(Math.random() * shapes.length)];
  shape.size = 20 + Math.random() * 100;
  shape.strokeWeight = 0.5 + Math.random() * 4;
  shape.fillOpacity = Math.random() * 0.5;
  
  duplication.count = Math.floor(5 + Math.random() * 50);
  duplication.spacing = 2 + Math.random() * 20;
  duplication.spread = 100 + Math.random() * 400;
  
  transform.scaleMin = 0.1 + Math.random() * 0.5;
  transform.scaleMax = 0.8 + Math.random() * 1.2;
  transform.rotationStep = Math.floor(Math.random() * 45);
  
  animation.enabled = Math.random() > 0.3;
  animation.mode = anims[Math.floor(Math.random() * anims.length)];
  animation.speed = 0.2 + Math.random() * 1.5;
  animation.amplitude = 20 + Math.random() * 100;
  
  split.mode = splits[Math.floor(Math.random() * splits.length)];
  split.gap = Math.random() > 0.5 ? Math.floor(Math.random() * 30) : 0;
  
  color.useGradient = Math.random() > 0.5;
  color.hueShift = Math.random() > 0.5;
}
