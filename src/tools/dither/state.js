// ============================================================
// Mutable State Objects - central store for all parameters
// ============================================================

// Canvas resolution presets per aspect ratio
export const resolutions = {
  '2:1':  { width: 1920, height: 960 },
  '16:9': { width: 1920, height: 1080 },
  '3:2':  { width: 1440, height: 960 },
  '4:3':  { width: 1280, height: 960 },
  '5:4':  { width: 1280, height: 1024 },
  '1:1':  { width: 1280, height: 1280 },
  '4:5':  { width: 1024, height: 1280 },
  '3:4':  { width: 960, height: 1280 },
  '2:3':  { width: 960, height: 1440 },
  '9:16': { width: 1080, height: 1920 },
  '1:2':  { width: 960, height: 1920 },
};

export const ratioOptions = {
  '2:1': '2:1', '16:9': '16:9', '3:2': '3:2', '4:3': '4:3',
  '5:4': '5:4', '1:1': '1:1', '4:5': '4:5', '3:4': '3:4',
  '2:3': '2:3', '9:16': '9:16', '1:2': '1:2',
};

// Font options - names mapped to Google Fonts / system fonts
export const fontTypes = {
  'Press Start 2P': 'Press Start 2P',
  'VT323': 'VT323',
  'Courier Prime': 'Courier Prime',
  'IBM Plex Mono': 'IBM Plex Mono',
  'Space Mono': 'Space Mono',
  'Share Tech Mono': 'Share Tech Mono',
  'monospace': 'monospace',
};

// Dither type options for UI
export const ditherTypeOptions = {
  'None': 'none',
  'Matrix': 'matrix',
  'Noise': 'noise',
  'Halftone': 'halftone',
  'CMYK Halftone': 'halftoneCMYK',
  'ASCII': 'ascii',
};

export const matrixOptions = {
  'Pixel': 'pixel',
  'Diagonal': 'diagonal',
  'Checker': 'checker',
  'Grid': 'grid',
  'Bayer 2x2': 'bayer2',
  'Bayer 4x4': 'bayer4',
  'Bayer 8x8': 'bayer8',
  'Bayer 16x16': 'bayer16',
};

export const noiseOptions = {
  '16px': 'noise16',
  '32px': 'noise32',
  '64px': 'noise64',
  '128px': 'noise128',
};

export const asciiColorModes = {
  'Image Colors': 'chars',
  'Custom Color': 'custom',
  'Duotone': 'duotone',
};

// Canvas state
export const cnv = {
  width: 640,
  height: 640,
  scale: 0.95,
  ratio: '1:1',
  preset: '** User Preset **',
  transparent: false,
  backColor: '#111111',
  windowColor: '#282828',
  panelWidth: 335,
};

// Dither state
export const dither = {
  type: 'matrix',
  matrix: 'bayer8',
  noise: 'noise64',
  texture: 0,       // which noise variant (0-3)
  step: 16,         // posterization level
  contrast: 1.0,
  brightness: 1.0,
  scale: 1,         // pixel scale for matrix/noise
  halftone: {
    scale: 5,
    scaleMin: 3,
    scaleMax: 24,
    smooth: 2,
    x: 1, y: 1, z: 1,  // per-channel halftone scale
  },
};

// Gradient / color mapping state
export const gradient = {
  type: 'original',   // 'original' or 'gradient'
  saturation: 1.0,
  palette: 9,         // index into palettes array (0-based)
  reverse: false,
};

// ASCII state
export const ascii = {
  fontname: 'Press Start 2P',
  text: ' .:-=+*#%@',
  cols: 1,
  rows: 1,
  scale: 8,
  maxScale: 64,
  box: [8, 8],  // character cell dimensions [w, h]
  ratio: 1,
  color: {
    limit: 4,
    mode: 'chars',   // 'chars', 'custom', 'duotone'
    char: '#ffffff',
    bg: '#000000',
  },
};

// Recording / export state
export const rec = {
  status: 'Ready',
  exportSize: 1,   // multiplier: 1x, 2x, 3x
};

// Media state (managed at runtime)
export const media = {
  type: null,       // 'image', 'video', or null
  source: null,     // p5.Image or video element
  video: null,      // HTML video element if video
  fileName: '',
};

/**
 * Deep clone a state object for preset save/restore.
 */
export function cloneState(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Apply values from source onto target (shallow merge per key).
 */
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
