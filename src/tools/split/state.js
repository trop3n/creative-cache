// ============================================================
// Mutable State Objects - Central Store for All Parameters
// ============================================================

// Canvas settings
export const canvas = {
  width: 800,
  height: 800,
  scale: 0.9,
  ratio: '1:1',
  background: '#111111',
};

// Available aspect ratios
export const resolutions = {
  '1:1': { width: 1200, height: 1200 },
  '4:3': { width: 1200, height: 900 },
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '3:4': { width: 900, height: 1200 },
  '2:1': { width: 1600, height: 800 },
  '1:2': { width: 800, height: 1600 },
};

// Built-in shape options
export const shapeOptions = {
  'Circle': 'circle',
  'Square': 'square',
  'Triangle': 'triangle',
  'Hexagon': 'hexagon',
  'Star': 'star',
  'Heart': 'heart',
  'Cross': 'cross',
  'Diamond': 'diamond',
  'Custom SVG': 'custom',
};

// Split mode options
export const splitOptions = {
  'None': 'none',
  'Horizontal': 'horizontal',
  'Vertical': 'vertical',
  'Four Sections': 'four',
};

// Animation mode options
export const animOptions = {
  'None': 'none',
  'Noise': 'noise',
  'Sine': 'sine',
  'Cosine': 'cosine',
  'Combined': 'combined',
};

// Blend mode options
export const blendOptions = {
  'Normal': 'normal',
  'Multiply': 'multiply',
  'Screen': 'screen',
  'Overlay': 'overlay',
  'Difference': 'difference',
};

// Shape settings
export const shape = {
  type: 'circle',
  size: 100,
  strokeWeight: 2,
  strokeColor: '#ffffff',
  fillColor: '#4a9eff',
  fillOpacity: 0,
  strokeOpacity: 1,
};

// Duplication settings
export const duplication = {
  count: 20,
  spacing: 15,
  spread: 200,
};

// Transformation settings
export const transform = {
  offsetX: 0,
  offsetY: 0,
  scaleMin: 0.5,
  scaleMax: 1.5,
  rotation: 0,
  rotationStep: 5,
};

// Animation settings
export const animation = {
  enabled: true,
  mode: 'noise',
  speed: 0.5,
  amplitude: 50,
  frequency: 0.01,
  noiseScale: 0.005,
};

// Split settings
export const split = {
  mode: 'none',
  gap: 0,
};

// Color settings
export const color = {
  useGradient: false,
  gradientStart: '#4a9eff',
  gradientEnd: '#ff4a9e',
  hueShift: false,
  hueSpeed: 0.5,
};

// Interactive controls
export const interactive = {
  posX: 0,
  posY: 0,
  transition: 0,
  canvasScale: 1,
  canvasRotation: 0,
};

// Export settings
export const exportSettings = {
  format: 'PNG',
  scale: 1,
  fps: 30,
  duration: 3,
  quality: 0.92,
  status: 'Ready',
};

// Export format options
export const exportFormatOptions = {
  'PNG': 'PNG',
  'JPG': 'JPG',
  'SVG': 'SVG',
  'MP4': 'MP4',
  'WebM': 'WebM',
  'PNG Sequence': 'PNGSequence',
  'WebP Sequence': 'WebPSequence',
};

// State for custom SVG
export const customSvg = {
  data: null,
  pathData: null,
  loaded: false,
};

// Animation state (not exposed in UI)
export const animState = {
  time: 0,
  frameCount: 0,
  isPlaying: true,
  seed: Math.random() * 1000,
};

// Utility functions
export function cloneState(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function applyState(target, source) {
  for (const key of Object.keys(source)) {
    if (typeof source[key] === 'object' && !Array.isArray(source[key]) && source[key] !== null) {
      if (!target[key]) target[key] = {};
      applyState(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

// Calculate canvas size based on window and aspect ratio
export function calculateCanvasSize() {
  const [rw, rh] = canvas.ratio.split(':').map(Number);
  const maxRes = resolutions[canvas.ratio];
  const panelW = 340; // UI panel width
  
  const availW = (window.innerWidth - panelW) * canvas.scale;
  const availH = window.innerHeight * canvas.scale;
  
  const aspectRatio = rw / rh;
  let w = availW;
  let h = w / aspectRatio;
  
  if (h > availH) {
    h = availH;
    w = h * aspectRatio;
  }
  
  // Cap at max resolution
  w = Math.min(w, maxRes.width);
  h = Math.min(h, maxRes.height);
  
  // Even dimensions for video encoding
  w = Math.floor(w) - (Math.floor(w) % 2);
  h = Math.floor(h) - (Math.floor(h) % 2);
  
  canvas.width = w;
  canvas.height = h;
  
  return { width: w, height: h };
}
