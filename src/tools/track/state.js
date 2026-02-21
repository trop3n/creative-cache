// ============================================================
// Central State Store - TRACK
// ============================================================

export const canvas = {
  width: 640,
  height: 480,
  aspectRatio: '4:3',
  background: '#000000',
};

export const aspectRatioOptions = {
  '1:1': { w: 640, h: 640 },
  '4:3': { w: 640, h: 480 },
  '16:9': { w: 640, h: 360 },
  '9:16': { w: 360, h: 640 },
};

export const source = {
  type: 'none',
  video: null,
  stream: null,
  fileName: '',
  playbackSpeed: 1,
};

export const playbackSpeedOptions = {
  '1X': 1,
  '2X': 2,
  '3X': 3,
  '4X': 4,
};

export const motion = {
  threshold: 30,
  blur: 3,
  minBlobSize: 50,
  performance: 4,
  showVideo: false,
};

export const shape = {
  type: 'circle',
  size: 12,
  strokeWidth: 2,
  color: '#00ff88',
  fillColor: '#00ff8833',
};

export const shapeOptions = {
  'Square': 'square',
  'Circle': 'circle',
  'Rectangle': 'rectangle',
};

export const region = {
  style: 'basic',
  label: 'BLOB',
  labelSize: 10,
  frameThickness: 2,
  gridSpacing: 15,
  particleCount: 8,
  dashLength: 8,
  glowIntensity: 0.6,
};

export const regionStyleOptions = {
  'Basic': 'basic',
  'Label': 'label',
  'Frame': 'frame',
  'L-Frame': 'lframe',
  'X-Frame': 'xframe',
  'Grid': 'grid',
  'Particle': 'particle',
  'Dash': 'dash',
  'Scope': 'scope',
  'Win2K': 'win2k',
  'Label 2': 'label2',
  'Glow': 'glow',
};

export const connection = {
  enabled: true,
  style: 'straight',
  maxDistance: 120,
  strokeWidth: 1,
  color: '#00ff88',
  opacity: 0.5,
  waveAmplitude: 8,
  waveFrequency: 3,
  pulseSpeed: 2,
};

export const connectionStyleOptions = {
  'Straight': 'straight',
  'Curved': 'curved',
  'Waveform': 'waveform',
  'Pulse': 'pulse',
};

export const filterEffect = {
  type: 'none',
  invert: false,
  fusion: false,
  intensity: 0.5,
};

export const filterEffectOptions = {
  'None': 'none',
  'Inv': 'invert',
  'Glitch': 'glitch',
  'Thermal': 'thermal',
  'Pixel': 'pixel',
  'Tone': 'tone',
  'Blue': 'blue',
  'Dither': 'dither',
  'Zoom': 'zoom',
  'X-Ray': 'xray',
  'Water': 'water',
  'Mask': 'mask',
  'CRT': 'crt',
  'Edge': 'edge',
};

export const exportSettings = {
  format: 'webm',
  highQuality: false,
  status: 'Ready',
  recording: false,
};

// ============================================================
// Helpers
// ============================================================

export function updateCanvasSize() {
  const dims = aspectRatioOptions[canvas.aspectRatio];
  if (dims) {
    canvas.width = dims.w;
    canvas.height = dims.h;
  }
}

export function getPerformanceScale() {
  const scales = [0.25, 0.35, 0.5, 0.65, 0.8, 1.0];
  return scales[motion.performance - 1] || 0.5;
}

export function getPerformanceResolution() {
  const scale = getPerformanceScale();
  return {
    width: Math.floor(canvas.width * scale),
    height: Math.floor(canvas.height * scale)
  };
}
