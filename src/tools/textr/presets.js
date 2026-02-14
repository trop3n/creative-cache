// ============================================================
// Preset System - TEXTR Tool
// ============================================================

import {
  canvas, text, duplication, transform, color, distribution, animation, effects,
  applyState, cloneState, animState
} from './state.js';

// Preset definitions
export const presetOptions = {
  'Default': 'default',
  'Wave Flow': 'waveFlow',
  'Circular Burst': 'circularBurst',
  'Spiral Galaxy': 'spiralGalaxy',
  'Grid Matrix': 'gridMatrix',
  'Rainbow Stack': 'rainbowStack',
  'Kinetic Type': 'kineticType',
  'Scatter': 'scatter',
  'Tunnel': 'tunnel',
  'Pulse': 'pulse',
  '** User Preset **': 'user',
};

// Default preset
const defaultPreset = {
  canvas: {
    background: '#050505',
    ratio: '1:1',
  },
  text: {
    content: 'TEXTR',
    font: 'Inter',
    fontSize: 200,
    letterSpacing: 0,
  },
  duplication: {
    mode: 'word',
    count: 20,
    spacing: 10,
    spreadX: 0,
    spreadY: 0,
    stagger: 0,
  },
  transform: {
    offsetX: 0,
    offsetY: 0,
    scaleMin: 0.5,
    scaleMax: 1.5,
    scaleMode: 'linear',
    rotation: 0,
    rotationStep: 5,
    rotationRandom: false,
    skewX: 0,
    skewY: 0,
  },
  color: {
    mode: 'solid',
    solid: '#ffffff',
    gradientStart: '#4a9eff',
    gradientEnd: '#ff4a9e',
    fillOpacity: 1,
    strokeWeight: 0,
    strokeColor: '#000000',
    strokeOpacity: 1,
  },
  distribution: {
    mode: 'linear',
  },
  animation: {
    enabled: true,
    mode: 'wave',
    speed: 0.5,
    amplitude: 30,
    frequency: 0.01,
  },
  effects: {
    shadowEnabled: false,
  },
};

// Wave Flow preset
const waveFlowPreset = {
  ...defaultPreset,
  text: {
    ...defaultPreset.text,
    content: 'WAVE',
    fontSize: 150,
  },
  duplication: {
    mode: 'letter',
    count: 50,
    spacing: 5,
    spreadX: 600,
    spreadY: 0,
    stagger: 10,
  },
  distribution: {
    mode: 'wave',
    waveAmplitude: 80,
    waveFrequency: 0.015,
  },
  color: {
    mode: 'gradient',
    gradientStart: '#00d4ff',
    gradientEnd: '#ff00d4',
    fillOpacity: 0.9,
  },
  animation: {
    enabled: true,
    mode: 'wave',
    speed: 0.8,
    amplitude: 40,
    frequency: 0.02,
  },
};

// Circular Burst preset
const circularBurstPreset = {
  ...defaultPreset,
  text: {
    ...defaultPreset.text,
    content: 'BURST',
    fontSize: 120,
  },
  duplication: {
    mode: 'word',
    count: 30,
    spacing: 0,
    spreadX: 0,
    spreadY: 0,
    stagger: 0,
  },
  distribution: {
    mode: 'circular',
    circularRadius: 250,
    circularStartAngle: 0,
    circularEndAngle: 360,
  },
  transform: {
    offsetX: 0,
    offsetY: 0,
    scaleMin: 0.3,
    scaleMax: 1.2,
    scaleMode: 'sine',
    rotation: 0,
    rotationStep: 12,
    rotationRandom: false,
  },
  color: {
    mode: 'rainbow',
    rainbowHueStart: 0,
    rainbowHueRange: 360,
    rainbowSaturation: 90,
    rainbowLightness: 60,
    fillOpacity: 1,
  },
  animation: {
    enabled: true,
    mode: 'rotate',
    speed: 0.3,
    amplitude: 50,
  },
};

// Spiral Galaxy preset
const spiralGalaxyPreset = {
  ...defaultPreset,
  text: {
    ...defaultPreset.text,
    content: 'GALAXY',
    fontSize: 100,
  },
  duplication: {
    mode: 'letter',
    count: 60,
    spacing: 2,
    spreadX: 0,
    spreadY: 0,
    stagger: 5,
  },
  distribution: {
    mode: 'spiral',
    spiralTurns: 3,
    spiralRadius: 350,
  },
  transform: {
    offsetX: 0,
    offsetY: 0,
    scaleMin: 0.4,
    scaleMax: 1.3,
    scaleMode: 'linear',
    rotation: 0,
    rotationStep: 8,
    rotationRandom: true,
  },
  color: {
    mode: 'gradient',
    gradientStart: '#ff006e',
    gradientEnd: '#8338ec',
    fillOpacity: 0.85,
    strokeWeight: 1,
    strokeColor: '#ffffff',
    strokeOpacity: 0.3,
  },
  animation: {
    enabled: true,
    mode: 'noise',
    speed: 0.4,
    amplitude: 20,
  },
};

// Grid Matrix preset
const gridMatrixPreset = {
  ...defaultPreset,
  canvas: {
    ...defaultPreset.canvas,
    background: '#000000',
  },
  text: {
    ...defaultPreset.text,
    content: 'MATRIX',
    font: 'Space Mono',
    fontSize: 80,
  },
  duplication: {
    mode: 'word',
    count: 40,
    spacing: 0,
    spreadX: 0,
    spreadY: 0,
    stagger: 0,
  },
  distribution: {
    mode: 'grid',
    gridCols: 5,
    gridRows: 8,
    gridGapX: 30,
    gridGapY: 30,
  },
  transform: {
    offsetX: 0,
    offsetY: 0,
    scaleMin: 0.8,
    scaleMax: 1.0,
    scaleMode: 'random',
    rotation: 0,
    rotationStep: 0,
    rotationRandom: false,
    skewX: 0,
    skewY: 0,
  },
  color: {
    mode: 'solid',
    solid: '#00ff00',
    fillOpacity: 0.8,
    strokeWeight: 0,
  },
  animation: {
    enabled: true,
    mode: 'pulse',
    speed: 1,
    amplitude: 30,
    frequency: 0.05,
  },
};

// Rainbow Stack preset
const rainbowStackPreset = {
  ...defaultPreset,
  text: {
    ...defaultPreset.text,
    content: 'RAINBOW',
    fontSize: 180,
  },
  duplication: {
    mode: 'word',
    count: 25,
    spacing: 8,
    spreadX: 0,
    spreadY: 300,
    stagger: 0,
  },
  distribution: {
    mode: 'linear',
  },
  transform: {
    offsetX: 0,
    offsetY: 0,
    scaleMin: 0.6,
    scaleMax: 1.4,
    scaleMode: 'linear',
    rotation: 0,
    rotationStep: 2,
    rotationRandom: false,
  },
  color: {
    mode: 'rainbow',
    rainbowHueStart: 0,
    rainbowHueRange: 360,
    rainbowSaturation: 85,
    rainbowLightness: 65,
    fillOpacity: 0.9,
  },
  animation: {
    enabled: true,
    mode: 'wave',
    speed: 0.6,
    amplitude: 25,
    frequency: 0.015,
  },
};

// Kinetic Type preset
const kineticTypePreset = {
  ...defaultPreset,
  text: {
    ...defaultPreset.text,
    content: 'KINETIC',
    font: 'Bebas Neue',
    fontSize: 200,
  },
  duplication: {
    mode: 'letter',
    count: 35,
    spacing: 15,
    spreadX: 500,
    spreadY: 0,
    stagger: 15,
  },
  distribution: {
    mode: 'wave',
    waveAmplitude: 100,
    waveFrequency: 0.02,
  },
  transform: {
    offsetX: -5,
    offsetY: 0,
    scaleMin: 0.5,
    scaleMax: 1.8,
    scaleMode: 'sine',
    rotation: 0,
    rotationStep: 10,
    rotationRandom: false,
    skewX: 15,
    skewY: 0,
  },
  color: {
    mode: 'gradient',
    gradientStart: '#f72585',
    gradientEnd: '#4cc9f0',
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: '#ffffff',
    strokeOpacity: 0.5,
  },
  animation: {
    enabled: true,
    mode: 'bounce',
    speed: 0.8,
    amplitude: 40,
    frequency: 0.03,
  },
};

// Scatter preset
const scatterPreset = {
  ...defaultPreset,
  canvas: {
    ...defaultPreset.canvas,
    background: '#1a1a2e',
  },
  text: {
    ...defaultPreset.text,
    content: 'SCATTER',
    fontSize: 100,
  },
  duplication: {
    mode: 'letter',
    count: 45,
    spacing: 0,
    spreadX: 0,
    spreadY: 0,
    stagger: 20,
  },
  distribution: {
    mode: 'random',
    randomSeed: 42,
  },
  transform: {
    offsetX: 0,
    offsetY: 0,
    scaleMin: 0.4,
    scaleMax: 1.6,
    scaleMode: 'random',
    rotation: 0,
    rotationStep: 0,
    rotationRandom: true,
  },
  color: {
    mode: 'solid',
    solid: '#e94560',
    fillOpacity: 0.85,
    strokeWeight: 1,
    strokeColor: '#0f3460',
    strokeOpacity: 0.8,
  },
  animation: {
    enabled: true,
    mode: 'noise',
    speed: 0.3,
    amplitude: 35,
  },
};

// Tunnel preset
const tunnelPreset = {
  ...defaultPreset,
  canvas: {
    ...defaultPreset.canvas,
    background: '#0a0a0a',
  },
  text: {
    ...defaultPreset.text,
    content: 'TUNNEL',
    fontSize: 160,
  },
  duplication: {
    mode: 'word',
    count: 30,
    spacing: 2,
    spreadX: 0,
    spreadY: 0,
    stagger: 0,
  },
  distribution: {
    mode: 'linear',
  },
  transform: {
    offsetX: 0,
    offsetY: 0,
    scaleMin: 0.1,
    scaleMax: 2.5,
    scaleMode: 'linear',
    rotation: 0,
    rotationStep: 0,
    rotationRandom: false,
  },
  color: {
    mode: 'gradient',
    gradientStart: '#ff00ff',
    gradientEnd: '#00ffff',
    fillOpacity: 0.7,
    strokeWeight: 0,
  },
  animation: {
    enabled: true,
    mode: 'pulse',
    speed: 0.5,
    amplitude: 20,
    frequency: 0.02,
  },
  effects: {
    shadowEnabled: true,
    shadowColor: '#ff00ff',
    shadowBlur: 20,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
  },
};

// Pulse preset
const pulsePreset = {
  ...defaultPreset,
  text: {
    ...defaultPreset.text,
    content: 'PULSE',
    font: 'Montserrat',
    fontSize: 220,
  },
  duplication: {
    mode: 'word',
    count: 15,
    spacing: 5,
    spreadX: 0,
    spreadY: 0,
    stagger: 0,
  },
  distribution: {
    mode: 'linear',
  },
  transform: {
    offsetX: 0,
    offsetY: 0,
    scaleMin: 0.7,
    scaleMax: 1.3,
    scaleMode: 'linear',
    rotation: 0,
    rotationStep: 0,
    rotationRandom: false,
  },
  color: {
    mode: 'solid',
    solid: '#ffffff',
    fillOpacity: 0.3,
    strokeWeight: 2,
    strokeColor: '#ffffff',
    strokeOpacity: 1,
  },
  animation: {
    enabled: true,
    mode: 'pulse',
    speed: 1.2,
    amplitude: 50,
    frequency: 0.05,
  },
};

// Preset storage
const presets = {
  default: defaultPreset,
  waveFlow: waveFlowPreset,
  circularBurst: circularBurstPreset,
  spiralGalaxy: spiralGalaxyPreset,
  gridMatrix: gridMatrixPreset,
  rainbowStack: rainbowStackPreset,
  kineticType: kineticTypePreset,
  scatter: scatterPreset,
  tunnel: tunnelPreset,
  pulse: pulsePreset,
};

// Load a preset by name
export function loadPreset(name) {
  const preset = presets[name];
  if (!preset) {
    console.warn(`Preset "${name}" not found`);
    return;
  }
  
  // Apply preset to state
  if (preset.canvas) applyState(canvas, preset.canvas);
  if (preset.text) applyState(text, preset.text);
  if (preset.duplication) applyState(duplication, preset.duplication);
  if (preset.transform) applyState(transform, preset.transform);
  if (preset.color) applyState(color, preset.color);
  if (preset.distribution) applyState(distribution, preset.distribution);
  if (preset.animation) applyState(animation, preset.animation);
  if (preset.effects) applyState(effects, preset.effects);
  
  // Reset animation state
  animState.time = 0;
  animState.frameCount = 0;
  
  console.log(`Loaded preset: ${name}`);
}

// Export current settings as preset JSON
export function exportPreset() {
  const preset = {
    canvas: cloneState(canvas),
    text: cloneState(text),
    duplication: cloneState(duplication),
    transform: cloneState(transform),
    color: cloneState(color),
    distribution: cloneState(distribution),
    animation: cloneState(animation),
    effects: cloneState(effects),
  };
  
  // Remove non-serializable properties
  delete preset.canvas.width;
  delete preset.canvas.height;
  
  return JSON.stringify(preset, null, 2);
}

// Import preset from JSON string
export function importPreset(json) {
  try {
    const preset = JSON.parse(json);
    
    if (preset.canvas) applyState(canvas, preset.canvas);
    if (preset.text) applyState(text, preset.text);
    if (preset.duplication) applyState(duplication, preset.duplication);
    if (preset.transform) applyState(transform, preset.transform);
    if (preset.color) applyState(color, preset.color);
    if (preset.distribution) applyState(distribution, preset.distribution);
    if (preset.animation) applyState(animation, preset.animation);
    if (preset.effects) applyState(effects, preset.effects);
    
    animState.time = 0;
    animState.frameCount = 0;
    
    return true;
  } catch (err) {
    console.error('Failed to import preset:', err);
    return false;
  }
}

// Randomize settings for creative exploration
export function randomizeSettings() {
  const distModes = ['linear', 'grid', 'circular', 'wave', 'spiral', 'random'];
  const colorModes = ['solid', 'gradient', 'rainbow'];
  const animModes = ['wave', 'pulse', 'rotate', 'noise', 'bounce'];
  const scaleModes = ['linear', 'random', 'sine', 'noise'];
  
  // Random distribution
  distribution.mode = distModes[Math.floor(Math.random() * distModes.length)];
  
  // Random color mode
  color.mode = colorModes[Math.floor(Math.random() * colorModes.length)];
  
  // Random colors
  color.solid = randomColor();
  color.gradientStart = randomColor();
  color.gradientEnd = randomColor();
  
  // Random transform
  transform.scaleMode = scaleModes[Math.floor(Math.random() * scaleModes.length)];
  transform.scaleMin = 0.3 + Math.random() * 0.5;
  transform.scaleMax = 1.0 + Math.random() * 1.5;
  transform.rotationStep = Math.floor(Math.random() * 30) - 15;
  transform.rotationRandom = Math.random() > 0.5;
  transform.skewX = Math.floor(Math.random() * 40) - 20;
  
  // Random animation
  animation.mode = animModes[Math.floor(Math.random() * animModes.length)];
  animation.speed = 0.3 + Math.random() * 0.7;
  animation.amplitude = 20 + Math.random() * 60;
  
  // Random duplication
  duplication.count = 15 + Math.floor(Math.random() * 40);
  duplication.spacing = Math.floor(Math.random() * 20);
  duplication.spreadX = Math.random() > 0.5 ? Math.floor(Math.random() * 600) : 0;
  duplication.spreadY = Math.random() > 0.5 ? Math.floor(Math.random() * 600) : 0;
  
  // Distribution-specific randomization
  switch (distribution.mode) {
    case 'grid':
      distribution.gridCols = 3 + Math.floor(Math.random() * 5);
      distribution.gridRows = 3 + Math.floor(Math.random() * 5);
      break;
    case 'circular':
      distribution.circularRadius = 150 + Math.random() * 200;
      break;
    case 'spiral':
      distribution.spiralTurns = 1 + Math.random() * 3;
      distribution.spiralRadius = 200 + Math.random() * 200;
      break;
    case 'wave':
      distribution.waveAmplitude = 30 + Math.random() * 100;
      break;
    case 'random':
      distribution.randomSeed = Math.floor(Math.random() * 1000);
      break;
  }
  
  animState.time = 0;
  animState.frameCount = 0;
}

// Generate random hex color
function randomColor() {
  const letters = '0123456789abcdef';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
