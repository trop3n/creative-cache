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
  '1:1':  { w: 960,  h: 960  },
  '4:3':  { w: 1280, h: 960  },
  '16:9': { w: 1280, h: 720  },
  '9:16': { w: 720,  h: 1280 },
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
  sensitivity: 1.5,
  blur: 3,
  minBlobSize: 50,
  maxBlobs: 8,
  smooth: 0.4,
  performance: 4,
  showVideo: true,
  countMode: 'size',
  countValue: 64,
  singleTracking: false,
};

export const shape = {
  type: 'circle',
  size: 12,
  strokeWidth: 2,
  color: '#00ff88',
  fillColor: '#00ff8833',
  crazy: false,
  showText: true,
  textPosition: 'center',
  textContent: 'random',
  fontSize: 12,
  separateColors: false,
  palette: ['#00ff88'],
};

export const audio = {
  type: 'none',
};

export const colorPalette = [
  '#ffffff', '#00d4d4', '#00cc88', '#44cc44', '#88cc00', '#aaaa00', '#cc8800', '#ff6600',
  '#ff44aa', '#cc44cc', '#aa44ff', '#8844ff', '#6644cc', '#444488', '#0088cc', '#00aacc',
  '#cccc00', '#ff8800', '#ff4466', '#cc0044',
];

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
  boundingSize: 128,
  sameSize: false,
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

export const blink = {
  enabled: false,
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
  rate: 0.25,
  centralHub: false,
  dashed: false,
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
  'Blur': 'blur',
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

/**
 * Update canvas dimensions.
 * When a video source is available, pass its native dimensions so the canvas
 * renders 1:1 with the source (capped at 1280px on the longer side).
 * Without arguments, falls back to the preset for the current aspect ratio.
 * @param {number} [videoWidth]
 * @param {number} [videoHeight]
 */
export function updateCanvasSize(videoWidth, videoHeight) {
  if (videoWidth && videoHeight) {
    const maxDim = 1280;
    const scale = Math.min(1, maxDim / Math.max(videoWidth, videoHeight));
    canvas.width  = Math.round(videoWidth  * scale);
    canvas.height = Math.round(videoHeight * scale);

    // Keep the aspect ratio label roughly in sync for the UI dropdown
    const ratio = videoWidth / videoHeight;
    if (Math.abs(ratio - 1) < 0.1)  canvas.aspectRatio = '1:1';
    else if (ratio > 1.5)            canvas.aspectRatio = '16:9';
    else if (ratio > 1)              canvas.aspectRatio = '4:3';
    else                             canvas.aspectRatio = '9:16';
  } else {
    const dims = aspectRatioOptions[canvas.aspectRatio];
    if (dims) {
      canvas.width  = dims.w;
      canvas.height = dims.h;
    }
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
