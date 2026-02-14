// ============================================================
// Central State Store - TEXTR Tool
// ============================================================

// Canvas settings
export const canvas = {
  width: 1000,
  height: 1000,
  scale: 0.9,
  ratio: '1:1',
  background: '#050505',
  padding: 50,
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

// Text settings
export const text = {
  content: 'TEXTR',
  font: 'Inter',
  fontSize: 200,
  letterSpacing: 0,
  lineHeight: 1.2,
  align: 'center', // 'left', 'center', 'right'
};

// Google Fonts list (popular fonts)
export const googleFonts = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Montserrat',
  'Lato',
  'Poppins',
  'Oswald',
  'Playfair Display',
  'Raleway',
  'Nunito',
  'Merriweather',
  'Ubuntu',
  'Bebas Neue',
  'Space Grotesk',
  'Work Sans',
  'DM Sans',
  'Plus Jakarta Sans',
  'Sora',
  'Syne',
  'Space Mono',
];

// Duplication settings
export const duplication = {
  mode: 'word', // 'word', 'letter', 'glyph'
  count: 20,
  spacing: 10,
  spreadX: 0,
  spreadY: 0,
  stagger: 0,
};

// Duplication mode options
export const duplicationOptions = {
  'Word': 'word',
  'Letter': 'letter',
  'Glyph': 'glyph',
};

// Transformation settings
export const transform = {
  offsetX: 0,
  offsetY: 0,
  scaleMin: 0.5,
  scaleMax: 1.5,
  scaleMode: 'linear', // 'linear', 'random', 'sine'
  rotation: 0,
  rotationStep: 5,
  rotationRandom: false,
  skewX: 0,
  skewY: 0,
};

// Scale mode options
export const scaleModeOptions = {
  'Linear': 'linear',
  'Random': 'random',
  'Sine Wave': 'sine',
  'Noise': 'noise',
};

// Color settings
export const color = {
  mode: 'solid', // 'solid', 'gradient', 'rainbow', 'custom'
  solid: '#ffffff',
  gradientStart: '#4a9eff',
  gradientEnd: '#ff4a9e',
  gradientAngle: 0,
  rainbowHueStart: 0,
  rainbowHueRange: 360,
  rainbowSaturation: 80,
  rainbowLightness: 60,
  fillOpacity: 1,
  strokeColor: '#000000',
  strokeWeight: 0,
  strokeOpacity: 1,
};

// Color mode options
export const colorModeOptions = {
  'Solid': 'solid',
  'Gradient': 'gradient',
  'Rainbow': 'rainbow',
};

// Distribution settings
export const distribution = {
  mode: 'linear', // 'linear', 'grid', 'circular', 'wave', 'spiral', 'random'
  gridCols: 4,
  gridRows: 5,
  gridGapX: 20,
  gridGapY: 20,
  circularRadius: 200,
  circularStartAngle: 0,
  circularEndAngle: 360,
  waveAmplitude: 50,
  waveFrequency: 0.02,
  wavePhase: 0,
  spiralTurns: 2,
  spiralRadius: 300,
  randomSeed: 42,
};

// Distribution mode options
export const distributionOptions = {
  'Linear': 'linear',
  'Grid': 'grid',
  'Circular': 'circular',
  'Wave': 'wave',
  'Spiral': 'spiral',
  'Random': 'random',
};

// Animation settings
export const animation = {
  enabled: true,
  mode: 'wave', // 'wave', 'pulse', 'rotate', 'noise', 'bounce'
  speed: 0.5,
  amplitude: 30,
  frequency: 0.01,
  phase: 0,
  loopDuration: 120,
  easing: 'easeInOut',
};

// Animation mode options
export const animationOptions = {
  'Wave': 'wave',
  'Pulse': 'pulse',
  'Rotate': 'rotate',
  'Noise': 'noise',
  'Bounce': 'bounce',
};

// Effect settings
export const effects = {
  shadowEnabled: false,
  shadowColor: '#000000',
  shadowBlur: 10,
  shadowOffsetX: 5,
  shadowOffsetY: 5,
  blurEnabled: false,
  blurAmount: 0,
};

// Custom font settings
export const customFont = {
  loaded: false,
  name: '',
  data: null,
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

// Parse font family for CSS
export function getFontFamily() {
  if (customFont.loaded && customFont.name) {
    return customFont.name;
  }
  return text.font;
}
