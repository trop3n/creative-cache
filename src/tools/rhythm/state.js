// ============================================================
// Central State Store - RhythmGenerator
// ============================================================

// Canvas settings
export const canvas = {
  width: 800,
  height: 600,
  aspectRatio: '4:3',
  background: '#050505',
  scale: 0.95,
};

export const aspectRatioOptions = {
  '1:1': { w: 800, h: 800 },
  '4:3': { w: 800, h: 600 },
  '16:9': { w: 800, h: 450 },
  '2:1': { w: 800, h: 400 },
  '3:4': { w: 600, h: 800 },
  '9:16': { w: 450, h: 800 },
};

// Waveform/Line settings
export const waveform = {
  // Basic properties
  count: 20,              // Number of lines
  spacing: 8,             // Vertical spacing between lines
  amplitude: 100,         // Wave height
  frequency: 0.01,        // Base frequency
  speed: 1,               // Animation speed
  
  // Noise properties
  noiseScale: 0.005,      // Noise coordinate scale
  noiseOctaves: 2,        // Number of noise octaves
  noisePersistence: 0.5,  // How much each octave contributes
  noiseLacunarity: 2,     // Frequency multiplier per octave
  noiseOffset: 0,         // Time offset
  
  // Line properties
  strokeWeight: 2,        // Line thickness
  strokeOpacity: 1.0,     // Line opacity
  strokeCap: 'round',     // Line cap style
  
  // Waveform type
  mode: 'noise',          // 'noise', 'sine', 'square', 'sawtooth', 'triangle'
  
  // Symmetry
  symmetry: 'none',       // 'none', 'horizontal', 'vertical', 'both'
  
  // Phase offset between lines
  phaseOffset: 0.1,       // Phase difference between lines
  
  // Smoothing
  smoothness: 0.5,        // Line smoothing (0-1)
  resolution: 2,          // Points per pixel (higher = smoother)
};

export const waveformModeOptions = {
  'Simplex Noise': 'noise',
  'Sine Wave': 'sine',
  'Square Wave': 'square',
  'Sawtooth Wave': 'sawtooth',
  'Triangle Wave': 'triangle',
};

export const symmetryOptions = {
  'None': 'none',
  'Horizontal': 'horizontal',
  'Vertical': 'vertical',
  'Both': 'both',
};

// Color palette settings
export const colorPalette = {
  mode: 'hsluv',          // 'hsluv', 'hsl', 'rgb', 'gradient'
  
  // HSLuv colors (perceptually uniform)
  hueStart: 200,          // Starting hue (0-360)
  hueRange: 60,           // Hue range/spread
  saturation: 85,         // Saturation (0-100)
  lightness: 65,          // Lightness (0-100)
  
  // Gradient options
  gradientMode: 'linear', // 'linear', 'radial', 'wave'
  gradientAngle: 0,       // Gradient angle in degrees
  
  // Color cycling
  cycleEnabled: false,    // Animate colors
  cycleSpeed: 0.5,        // Color cycle speed
  
  // Palette array (computed)
  colors: [],
};

export const colorModeOptions = {
  'HSLuv': 'hsluv',
  'HSL': 'hsl',
  'RGB': 'rgb',
};

export const gradientModeOptions = {
  'Linear': 'linear',
  'Radial': 'radial',
  'Wave': 'wave',
};

// Animation settings
export const animation = {
  enabled: true,
  playing: true,
  speed: 1.0,
  direction: 1,           // 1 or -1 for reverse
  
  // Loop settings
  loopDuration: 120,      // Frames for one loop
  seamless: true,         // Seamless looping
  
  // Recording
  recording: false,
  recordFormat: 'png',    // 'png', 'webm' (future)
  recordQuality: 'high',
  
  // Frame counter
  currentFrame: 0,
};

// Distortion/Effects
export const effects = {
  // Ripple effect
  rippleEnabled: false,
  rippleStrength: 20,
  rippleFrequency: 0.02,
  rippleSpeed: 1,
  
  // Glitch effect
  glitchEnabled: false,
  glitchAmount: 5,
  glitchProbability: 0.1,
  
  // Blur/Glow
  glowEnabled: false,
  glowAmount: 10,
  glowColor: '#ffffff',
};

// Composition settings
export const composition = {
  // Offset
  offsetX: 0,
  offsetY: 0,
  
  // Scale
  scaleX: 1,
  scaleY: 1,
  
  // Rotation
  rotation: 0,
  
  // Center point
  centerX: 0.5,           // 0-1 relative to canvas
  centerY: 0.5,
  
  // Perspective (3D effect)
  perspective: 0,         // 0 = flat, higher = more perspective
  perspectiveAngle: 0,
};

// Export settings
export const exportSettings = {
  format: 'png',          // 'png', 'svg', 'sequence', 'webm', 'gif'
  scale: 1,               // 1-4x
  status: 'Ready',
  
  // PNG/JPG options
  quality: 0.95,
  
  // Sequence options
  startFrame: 0,
  endFrame: 120,
  fps: 30,
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

// Generate palette colors based on current settings
export function generatePalette(count = 10) {
  const colors = [];
  const { hueStart, hueRange, saturation, lightness, mode } = colorPalette;
  
  for (let i = 0; i < count; i++) {
    const t = i / Math.max(count - 1, 1);
    const hue = (hueStart + t * hueRange) % 360;
    
    if (mode === 'hsl') {
      colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    } else if (mode === 'hsluv') {
      // HSLuv approximation (we'll use HSL as it's close enough for this)
      colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    } else {
      // RGB mode - convert HSL to RGB
      colors.push(hslToHex(hue, saturation, lightness));
    }
  }
  
  colorPalette.colors = colors;
  return colors;
}

// Convert HSL to Hex
function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Get color for a specific line index
export function getLineColor(index, totalLines, time = 0) {
  const colors = colorPalette.colors.length > 0 
    ? colorPalette.colors 
    : generatePalette(totalLines);
  
  let colorIndex;
  
  switch (colorPalette.gradientMode) {
    case 'linear':
      colorIndex = Math.floor((index / totalLines) * colors.length) % colors.length;
      break;
    case 'radial':
      // Center-out coloring
      const centerDist = Math.abs(index - totalLines / 2) / (totalLines / 2);
      colorIndex = Math.floor(centerDist * colors.length) % colors.length;
      break;
    case 'wave':
      // Wave-based coloring
      const wavePos = Math.sin(index * 0.5 + time * colorPalette.cycleSpeed) * 0.5 + 0.5;
      colorIndex = Math.floor(wavePos * colors.length) % colors.length;
      break;
    default:
      colorIndex = index % colors.length;
  }
  
  // Handle color cycling animation
  if (colorPalette.cycleEnabled) {
    const cycleOffset = Math.floor(time * colorPalette.cycleSpeed * colors.length);
    colorIndex = (colorIndex + cycleOffset) % colors.length;
  }
  
  return colors[colorIndex] || colors[0] || '#ffffff';
}

// Reset to defaults
export function resetToDefaults() {
  canvas.width = 800;
  canvas.height = 600;
  canvas.aspectRatio = '4:3';
  canvas.background = '#050505';
  
  waveform.count = 20;
  waveform.spacing = 8;
  waveform.amplitude = 100;
  waveform.frequency = 0.01;
  waveform.speed = 1;
  waveform.noiseScale = 0.005;
  waveform.noiseOctaves = 2;
  waveform.strokeWeight = 2;
  waveform.mode = 'noise';
  waveform.symmetry = 'none';
  
  colorPalette.hueStart = 200;
  colorPalette.hueRange = 60;
  colorPalette.saturation = 85;
  colorPalette.lightness = 65;
  colorPalette.mode = 'hsluv';
  colorPalette.cycleEnabled = false;
  
  animation.enabled = true;
  animation.playing = true;
  animation.speed = 1;
  animation.loopDuration = 120;
  
  generatePalette(10);
}
