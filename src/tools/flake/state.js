// ============================================================
// Central State Store - All parameters for FLAKE Tool
// ============================================================

// Canvas/Export settings
export const canvas = {
  width: 800,
  height: 800,
  scale: 0.95,
  ratio: '1:1',
  background: '#111111',
  showGrid: false,
  gridColor: '#333333',
};

// Aspect ratio presets
export const ratioOptions = {
  '1:1': '1:1',
  '4:3': '4:3',
  '3:2': '3:2',
  '16:9': '16:9',
  '2:1': '2:1',
  '3:4': '3:4',
  '2:3': '2:3',
  '9:16': '9:16',
};

// Grid settings
export const grid = {
  cols: 12,
  rows: 12,
  cellSize: 60,
  offsetX: 0,
  offsetY: 0,
  symmetry: 'none', // none, horizontal, vertical, both, radial
  symmetryCount: 6, // for radial symmetry
};

export const symmetryOptions = {
  'None': 'none',
  'Horizontal': 'horizontal',
  'Vertical': 'vertical',
  'Both (4-way)': 'both',
  'Radial': 'radial',
};

// Shape settings
export const shape = {
  type: 'circle', // circle, square, triangle, hexagon, star, heart, custom
  size: 0.8, // 0-1 relative to cell size
  rotation: 0,
  rotationAuto: false,
  rotationSpeed: 0.5,
  
  // Distance-based scaling (SDF-inspired)
  scaleMode: 'linear', // none, linear, easeIn, easeOut, easeInOut, step
  scaleMin: 0.2,
  scaleMax: 1.0,
  scalePower: 1.0,
  
  // Distance-based rotation
  rotateMode: 'none', // none, linear, easeIn, easeOut
  rotateMin: 0,
  rotateMax: 360,
  
  // Stroke/fill
  fillMode: 'solid', // solid, gradient, distance, random
  fillColor: '#4a9eff',
  fillOpacity: 1.0,
  strokeMode: 'none', // none, solid, gradient, distance
  strokeColor: '#ffffff',
  strokeWeight: 1,
  strokeOpacity: 1.0,
  
  // Blend mode
  blendMode: 'blend', // blend, add, multiply, screen, overlay, difference
};

export const shapeTypeOptions = {
  'Circle': 'circle',
  'Square': 'square',
  'Triangle': 'triangle',
  'Hexagon': 'hexagon',
  'Star': 'star',
  'Diamond': 'diamond',
  'Cross': 'cross',
  'Heart': 'heart',
  'Custom SVG': 'custom',
};

export const scaleModeOptions = {
  'None (Uniform)': 'none',
  'Linear': 'linear',
  'Ease In': 'easeIn',
  'Ease Out': 'easeOut',
  'Ease In-Out': 'easeInOut',
  'Step': 'step',
  'Swirl': 'swirl',
};

export const fillModeOptions = {
  'Solid': 'solid',
  'Distance Gradient': 'distance',
  'Palette Cycle': 'palette',
  'Random': 'random',
};

export const blendModeOptions = {
  'Normal': 'blend',
  'Add': 'add',
  'Multiply': 'multiply',
  'Screen': 'screen',
  'Overlay': 'overlay',
  'Difference': 'difference',
  'XOR': 'xor',
};

// Pattern/Noise settings
export const pattern = {
  enabled: false,
  seed: 1,
  noiseScale: 0.1,
  noiseIntensity: 0.5,
  noiseOctaves: 1,
  seedRandom: true,
};

// Animation settings
export const animation = {
  enabled: false,
  speed: 1.0,
  loopDuration: 120, // frames
  currentFrame: 0,
  playing: false,
  record: false,
  
  // What to animate
  animateSize: true,
  animateRotation: false,
  animateColor: false,
  animatePosition: false,
  
  // Animation range
  sizeRange: 0.3,
  rotationRange: 180,
  colorShift: 0.1,
  positionRange: 10,
};

// Color palette
export const palette = {
  colors: ['#4a9eff', '#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf'],
  useGradient: false,
  gradientAngle: 0,
};

// Mask settings
export const mask = {
  enabled: false,
  image: null,
  brightnessMode: 'scale', // scale, opacity, both
  brightnessInvert: false,
  threshold: 0.5,
  smoothness: 0.1,
};

// Custom shape (SVG)
export const customShape = {
  svgData: null,
  paths: [],
  bounds: { x: 0, y: 0, width: 1, height: 1 },
  name: '',
};

// Export settings
export const exportSettings = {
  format: 'png', // png, svg, sequence, webm, gif
  scale: 1,
  quality: 0.92,
  status: 'Ready',
};

// Preset management
export const preset = {
  current: '** Default **',
};

// Deep clone utility
export function cloneState(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Apply state with deep merge
export function applyState(target, source) {
  for (const key of Object.keys(source)) {
    if (
      typeof source[key] === 'object' &&
      source[key] !== null &&
      !Array.isArray(source[key]) &&
      typeof target[key] === 'object' &&
      target[key] !== null
    ) {
      applyState(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

// Easing functions for distance-based transforms
export const easings = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => 1 - (1 - t) * (1 - t),
  easeInOut: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  step: (t) => t > 0.5 ? 1 : 0,
  swirl: (t, power = 1) => {
    // Special swirl function combining distance and angle
    return Math.sin(t * Math.PI * power) * 0.5 + 0.5;
  },
};

// Calculate scale based on normalized distance (0-1) from center
export function calculateScale(distNormalized) {
  const mode = shape.scaleMode;
  if (mode === 'none') return shape.size;
  
  const t = 1 - distNormalized; // Invert so center is 1, edges are 0
  let eased;
  
  switch (mode) {
    case 'easeIn': eased = easings.easeIn(t); break;
    case 'easeOut': eased = easings.easeOut(t); break;
    case 'easeInOut': eased = easings.easeInOut(t); break;
    case 'step': eased = easings.step(t); break;
    case 'swirl': eased = easings.swirl(t, shape.scalePower); break;
    default: eased = easings.linear(t);
  }
  
  return shape.scaleMin + (shape.scaleMax - shape.scaleMin) * eased;
}

// Calculate rotation based on normalized distance
export function calculateRotation(distNormalized, baseRotation) {
  const mode = shape.rotateMode;
  if (mode === 'none') return baseRotation;
  
  const t = 1 - distNormalized;
  let eased;
  
  switch (mode) {
    case 'easeIn': eased = easings.easeIn(t); break;
    case 'easeOut': eased = easings.easeOut(t); break;
    default: eased = easings.linear(t);
  }
  
  return baseRotation + shape.rotateMin + (shape.rotateMax - shape.rotateMin) * eased;
}
