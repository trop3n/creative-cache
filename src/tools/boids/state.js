// ============================================================
// Central State Store - BOIDS
// ============================================================

// Canvas settings
export const canvas = {
  width: 800,
  height: 600,
  aspectRatio: '4:3',
  background: '#050505',
  trailAlpha: 20,       // Background fill alpha each frame (low = long trail, 255 = no trail)
};

export const aspectRatioOptions = {
  '1:1': { w: 800, h: 800 },
  '4:3': { w: 800, h: 600 },
  '16:9': { w: 800, h: 450 },
  '2:1': { w: 800, h: 400 },
  '3:4': { w: 600, h: 800 },
  '9:16': { w: 450, h: 800 },
};

// Flock parameters
export const flock = {
  count: 150,

  // Perception radii
  separationRadius: 28,
  alignmentRadius:  50,
  cohesionRadius:   50,

  // Steering weights
  separationWeight: 1.5,
  alignmentWeight:  1.0,
  cohesionWeight:   1.0,

  // Speed
  maxSpeed: 4.0,
  minSpeed: 0.5,
  maxForce: 0.15,

  // Boundary behaviour
  boundary: 'wrap',     // 'wrap' | 'bounce' | 'avoid'
};

export const boundaryOptions = {
  'Wrap':        'wrap',
  'Bounce':      'bounce',
  'Avoid Edges': 'avoid',
};

// Visual parameters
export const visual = {
  shape:     'triangle',   // 'triangle' | 'circle' | 'line'
  boidSize:  8,

  // Color
  colorMode:   'velocity',  // 'velocity' | 'heading' | 'palette' | 'uniform'
  color:       '#4a9eff',   // used when colorMode === 'uniform'
  hueStart:    200,
  hueRange:    140,
  saturation:  85,
  lightness:   65,
  opacity:     1.0,
};

export const shapeOptions = {
  'Triangle': 'triangle',
  'Circle':   'circle',
  'Line':     'line',
};

export const colorModeOptions = {
  'Velocity': 'velocity',
  'Heading':  'heading',
  'Palette':  'palette',
  'Uniform':  'uniform',
};

// Animation / playback
export const animation = {
  playing: true,
};

// Export
export const exportSettings = {
  format: 'png',
  scale:  1,
  status: 'Ready',
};

// ============================================================
// Helpers
// ============================================================

export function updateCanvasSize() {
  const dims = aspectRatioOptions[canvas.aspectRatio];
  if (dims) {
    canvas.width  = dims.w;
    canvas.height = dims.h;
  }
}

/** Return an HSL color string for a boid given its speed (0–maxSpeed) or heading (-π to π). */
export function getBoidColor(speed, heading, paletteIndex, totalBoids) {
  const { colorMode, hueStart, hueRange, saturation, lightness, color } = visual;

  switch (colorMode) {
    case 'velocity': {
      const t = Math.min(speed / flock.maxSpeed, 1);
      const hue = (hueStart + t * hueRange) % 360;
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
    case 'heading': {
      const t = (heading + Math.PI) / (2 * Math.PI);
      const hue = (hueStart + t * hueRange) % 360;
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
    case 'palette': {
      const t = paletteIndex / Math.max(totalBoids - 1, 1);
      const hue = (hueStart + t * hueRange) % 360;
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
    case 'uniform':
    default:
      return color;
  }
}
