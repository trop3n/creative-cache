// ============================================================
// Mutable State Objects - central store for all parameters
// ============================================================

// Canvas resolution presets per aspect ratio
export const resolutions = {
  '2:1':   { width: 1920, height: 960 },
  '16:9':  { width: 1920, height: 1080 },
  '3:2':   { width: 1440, height: 960 },
  '4:3':   { width: 1280, height: 960 },
  '5:4':   { width: 1280, height: 1024 },
  '1:1':   { width: 1280, height: 1280 },
  '4:5':   { width: 1024, height: 1280 },
  '3:4':   { width: 960, height: 1280 },
  '2:3':   { width: 960, height: 1440 },
  '9:16':  { width: 1080, height: 1920 },
  '1:2':   { width: 960, height: 1920 },
};

export const ratioOptions = {
  '2:1': '2:1', '16:9': '16:9', '3:2': '3:2', '4:3': '4:3',
  '5:4': '5:4', '1:1': '1:1', '4:5': '4:5', '3:4': '3:4',
  '2:3': '2:3', '9:16': '9:16', '1:2': '1:2',
};

// Distortion type options
export const distortionTypeOptions = {
  'Displacement Map': 'displacement',
  'Refraction (Glass)': 'refraction',
  'Water Ripple': 'ripple',
  'Wave Distortion': 'wave',
  'Pinch/Bulge': 'pinch',
  'Twirl': 'twirl',
  'Lens': 'lens',
  'Barrel/Pincushion': 'barrel',
};

// Displacement map source options
export const displacementSourceOptions = {
  'Noise': 'noise',
  'Sine Waves': 'sine',
  'Radial': 'radial',
  'Checkerboard': 'checker',
  'Custom Image': 'image',
};

// Noise type options
export const noiseTypeOptions = {
  'Simplex': 'simplex',
  'Perlin': 'perlin',
  'Voronoi': 'voronoi',
  'Fractal': 'fractal',
};

// Blend mode options
export const blendModeOptions = {
  'Normal': 'normal',
  'Add': 'add',
  'Multiply': 'multiply',
  'Screen': 'screen',
  'Overlay': 'overlay',
  'Difference': 'difference',
};

// Edge behavior options
export const edgeModeOptions = {
  'Clamp': 'clamp',
  'Wrap': 'wrap',
  'Mirror': 'mirror',
  'Transparent': 'transparent',
};

// Canvas state
export const canvas = {
  width: 640,
  height: 640,
  scale: 0.95,
  ratio: '1:1',
  preset: '** User Preset **',
  transparent: false,
  backColor: '#111111',
  windowColor: '#1a1a1a',
  panelWidth: 340,
  showOriginal: false,
};

// Distortion/Refract state
export const distortion = {
  type: 'displacement',
  enabled: true,
  amount: 0.5,          // Overall distortion strength
  scale: 1.0,           // Scale of the distortion pattern
  
  // Displacement map specific
  displacement: {
    source: 'noise',
    noiseType: 'simplex',
    intensity: 0.5,     // How much the map affects the image
    offsetX: 0,         // Pattern offset
    offsetY: 0,
    animate: false,
    speed: 0.5,
  },
  
  // Refraction specific
  refraction: {
    index: 1.5,         // Refractive index
    thickness: 0.3,     // Material thickness
    chromaticAberration: 0.1,  // RGB shift amount
  },
  
  // Ripple specific
  ripple: {
    frequency: 10,
    amplitude: 0.1,
    phase: 0,
    centerX: 0.5,
    centerY: 0.5,
    damping: 0.5,
  },
  
  // Wave specific
  wave: {
    frequencyX: 10,
    frequencyY: 0,
    amplitudeX: 0.05,
    amplitudeY: 0.05,
    phase: 0,
  },
  
  // Pinch/Bulge specific
  pinch: {
    strength: 0.5,      // Positive = bulge, negative = pinch
    radius: 0.5,
    centerX: 0.5,
    centerY: 0.5,
  },
  
  // Twirl specific
  twirl: {
    angle: 180,         // Degrees
    radius: 0.5,
    centerX: 0.5,
    centerY: 0.5,
  },
  
  // Lens specific
  lens: {
    strength: 0.5,
    radius: 0.4,
    centerX: 0.5,
    centerY: 0.5,
  },
  
  // Barrel/Pincushion specific
  barrel: {
    strength: 0.3,      // Positive = barrel, negative = pincushion
  },
};

// Image processing state
export const processing = {
  brightness: 1.0,
  contrast: 1.0,
  saturation: 1.0,
  hue: 0,
  blur: 0,
  sharpen: 0,
  
  // Color grading
  shadows: '#000000',
  midtones: '#808080',
  highlights: '#ffffff',
  shadowAmount: 0.5,
  highlightAmount: 0.5,
};

// Animation state
export const animation = {
  enabled: false,
  playing: false,
  speed: 1.0,
  time: 0,
  loop: true,
  duration: 5,          // seconds
};

// Export state
export const exportSettings = {
  status: 'Ready',
  format: 'png',        // png, jpg, webp
  quality: 0.95,
  scale: 1,
};

// Media state (managed at runtime)
export const media = {
  type: null,           // 'image' or null
  source: null,         // p5.Image
  fileName: '',
  displacementMap: null, // p5.Image for custom displacement
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
