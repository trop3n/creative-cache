// ============================================================
// FLAKE Tool — Central State Store
// ============================================================

// ── Canvas ───────────────────────────────────────────────────
export const canvas = {
  width: 800,
  height: 600,
  ratio: '4:3',
  background: '#111111',
};

export const ratioOptions = {
  '1:1':  '1:1',
  '4:3':  '4:3',
  '3:2':  '3:2',
  '16:9': '16:9',
  '2:1':  '2:1',
  '3:4':  '3:4',
  '2:3':  '2:3',
  '9:16': '9:16',
};

// ── Pattern / Sections ────────────────────────────────────────
// "Pattern Cols" is the tile size: the grid repeats every N cells in X and Y.
export const pattern = {
  cols: 10,          // cells per tile (square tile)
  cellSize: 48,      // pixel size of one cell
  cellOffset: 0,     // alternate-row brick offset (0–2 relative cell units)
  seedFrom: 0,       // starting value added to seedNoise for variety
  seedNoise: 3,      // base seed for the noise field
  cellDivider: false, // draw cell grid lines
};

// ── Style ─────────────────────────────────────────────────────
export const style = {
  shapeType: 'arrow',          // see shapeTypeOptions
  fillMapping: 2,              // 0 = solid first color, 1–4 = N colors by distance
  colors: ['#6c5ce7', '#ffffff', '#b2bec3', '#fdcb6e'],
  shapeScale: 0.75,            // size relative to cellSize (0–2)
  scalingEase: 'easeOut',      // how size falls off from tile center
  baseRotation: 0,             // constant rotation added to every shape (degrees)
  angleMult: -7,               // multiplier on the computed angle field
  strokeWidth: 0,              // stroke weight (0 = no stroke)
  strokeColor: '#ffffff',
  blendMode: 'blend',
};

export const shapeTypeOptions = {
  'Arrow':      'arrow',
  'Circle':     'circle',
  'Square':     'square',
  'Triangle':   'triangle',
  'Hexagon':    'hexagon',
  'Star':       'star',
  'Diamond':    'diamond',
  'Cross':      'cross',
  'Heart':      'heart',
  'Custom SVG': 'custom',
};

export const scalingEaseOptions = {
  'None (Flat)':  'none',
  'Linear':       'linear',
  'Ease In':      'easeIn',
  'Ease Out':     'easeOut',
  'Ease In-Out':  'easeInOut',
  'Step':         'step',
};

export const blendModeOptions = {
  'Normal':     'blend',
  'Add':        'add',
  'Multiply':   'multiply',
  'Screen':     'screen',
  'Overlay':    'overlay',
  'Difference': 'difference',
};

// ── Noise ─────────────────────────────────────────────────────
export const noiseParams = {
  symmetry:    'standard',  // standard, 2way, 4way, mirror
  branchAhead: 1.0,         // look-ahead factor for flow-field sampling
  branchAngle: 0,           // extra angle offset in degrees
  freqComp:    'none',      // frequency composition mode
  freeMode:    false,       // ignore tile-center radial when true
  freqLayers:  3,           // noise octaves (1–8)
  freqAmply:   0.5,         // per-layer amplitude (0–1)
};

export const noiseSymmetryOptions = {
  'Standard': 'standard',
  '2-Way':    '2way',
  '4-Way':    '4way',
  'Mirror':   'mirror',
};

export const freqCompOptions = {
  'None':     'none',
  'Add':      'add',
  'Subtract': 'subtract',
  'Multiply': 'multiply',
};

// ── Swirl ─────────────────────────────────────────────────────
export const swirl = {
  swirlStart:  0,       // distance from tile edge where swirl begins (0–1)
  swirlMode:   'none',  // none, rotary, wave
  applyEffect: false,
  frequency:   1.0,     // swirl cycles per tile radius
};

export const swirlModeOptions = {
  'None':   'none',
  'Rotary': 'rotary',
  'Wave':   'wave',
};

// ── Mask ──────────────────────────────────────────────────────
export const mask = {
  maskTool: 'none',  // none, image
  image:    null,    // p5.Image when loaded
  invert:   false,
};

export const maskToolOptions = {
  'None':  'none',
  'Image': 'image',
};

// ── Motion ────────────────────────────────────────────────────
export const motion = {
  motionType:   'none',   // none, noise, rotate
  opacityLevel: 1.0,
  speed:        1.0,
  playing:      false,
};

export const motionTypeOptions = {
  'None':        'none',
  'Noise Driven':'noise',
  'Rotate':      'rotate',
};

// ── Random section flags ──────────────────────────────────────
export const random = {
  canvas:        false,
  style:         false,
  pattern:       false,
  shape:         false,
  noiseItems:    false,
  noiseBranches: false,
  noiseFreq:     false,
  shapeEffect:   false,
  swirlEffect:   false,
};

// ── Custom SVG shape ──────────────────────────────────────────
export const customShape = {
  svgData: null,
  paths:   [],
  bounds:  { x: 0, y: 0, width: 1, height: 1 },
  name:    '',
};

// ── Export ────────────────────────────────────────────────────
export const exportSettings = {
  format: 'png',   // png, svg, sequence, webm
  scale:  1,
  status: 'Ready',
};

// ── Preset label ──────────────────────────────────────────────
export const presetState = {
  current: '** Default **',
};

// ── Utilities ─────────────────────────────────────────────────
export function cloneState(obj) {
  return JSON.parse(JSON.stringify(obj));
}

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

// ── Easing functions (distance from tile center, t = 0..1) ───
export const easings = {
  none:      ()  => 1,
  linear:    (t) => t,
  easeIn:    (t) => t * t,
  easeOut:   (t) => 1 - (1 - t) * (1 - t),
  easeInOut: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  step:      (t) => t > 0.5 ? 1 : 0,
};

/** Apply selected easing to a 0–1 value. */
export function applyEasing(t, mode) {
  const fn = easings[mode] || easings.linear;
  return fn(Math.max(0, Math.min(1, t)));
}

/** Canvas size computation from ratio string. */
export function computeCanvasSize(availW, availH) {
  const [rw, rh] = canvas.ratio.split(':').map(Number);
  const aspect = rw / rh;
  let w = availW;
  let h = w / aspect;
  if (h > availH) {
    h = availH;
    w = h * aspect;
  }
  canvas.width  = Math.max(Math.floor(w), 200);
  canvas.height = Math.max(Math.floor(h), 200);
}
