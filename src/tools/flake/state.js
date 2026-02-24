// ============================================================
// FLAKE Tool — Central State Store
// ============================================================

// ── Canvas ───────────────────────────────────────────────────
export const canvas = {
  width:      800,
  height:     600,
  ratio:      '4:3',
  scale:      0.97,
  background: '#ffffff',
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

// ── Pattern ───────────────────────────────────────────────────
export const pattern = {
  cells:        { x: 10, y: 10 },
  cellOffset:   { x: 0, y: 0 },
  seed:         0,
  seedRandom:   0,
  cellRotation: 0,
};

// ── Style (visual / color only) ───────────────────────────────
export const style = {
  renderStyle: 'fill',               // fill | stroke | mixed
  colorType:   'paletteTransition',  // solidColor | paletteSequence | paletteTransition
  colors:      ['#6c5ce7', '#ffffff', '#b2bec3', '#fdcb6e'],
  blendMode:   'multiply',
};

export const renderStyleOptions = {
  'Fill':   'fill',
  'Stroke': 'stroke',
  'Mixed':  'mixed',
};

export const colorTypeOptions = {
  'Solid Color':         'solidColor',
  'Palette Sequence':    'paletteSequence',
  'Palette Transition':  'paletteTransition',
};

export const blendModeOptions = {
  'Multiply':    'multiply',
  'XOR':         'xor',
  'Normal':      'source-over',
  'Lighter':     'lighter',
  'Screen':      'screen',
  'Overlay':     'overlay',
  'Darken':      'darken',
  'Lighten':     'lighten',
  'Color Dodge': 'color-dodge',
  'Color Burn':  'color-burn',
  'Hard Light':  'hard-light',
  'Soft Light':  'soft-light',
  'Exclusion':   'exclusion',
  'Difference':  'difference',
};

// ── Shape (NEW — split out from style) ────────────────────────
export const shape = {
  shapeType:    'flake',
  gridMapping:  { x: 6, y: 6 },
  shapeCount:   5000,
  shapeScale:   0.75,
  scalePower:   0.0,
  scalingEase:  'none',
  baseRotation: 0,
  angleMult:    1.0,
};

export const shapeTypeOptions = {
  'Square':       'square',
  'Circle':       'circle',
  'Oval':         'oval',
  'Checker':      'checker',
  'Triangle':     'triangle',
  'Quad Circle':  'quadCircle',
  'Three Dots':   'threeDots',
  'Spark':        'spark',
  'Cross':        'cross',
  'Star':         'star',
  'Heart':        'heart',
  'Flash':        'flash',
  'Pinhole':      'pinholeIndex',
  'Arrow':        'arrow',
  'Flower':       'flower',
  'Flake':        'flake',
  'Clips':        'clips',
  'Custom SVG':   'custom',
};

export const scalingEaseOptions = {
  'None':        'none',
  'Linear':      'linear',
  'Sine In':     'sineIn',
  'Sine Out':    'sineOut',
  'Quad In':     'quadIn',
  'Quad Out':    'quadOut',
  'Quad In-Out': 'quadInOut',
  'Cubic In':    'cubicIn',
  'Cubic Out':   'cubicOut',
  'Cubic In-Out':'cubicInOut',
  'Expo In':     'expoIn',
  'Expo Out':    'expoOut',
  'Expo In-Out': 'expoInOut',
  'Circ In':     'circIn',
  'Circ Out':    'circOut',
  'Circ In-Out': 'circInOut',
};

// ── Noise Params ──────────────────────────────────────────────
export const noiseParams = {
  symmetry:     'standard',  // standard | mirrored
  branchAmount: 1.0,         // 0–12
  branchAngle:  0,           // radians
  freqEasing:   'none',      // same 15-option set as scalingEase
  freqMode:     'cos',       // cos | sin
  freqLayers:   4,
  freqBase:     0.07,
  freqAmplify:  0.5,
};

export const noiseSymmetryOptions = {
  'Standard': 'standard',
  'Mirrored': 'mirrored',
};

export const freqModeOptions = {
  'Cos': 'cos',
  'Sin': 'sin',
};

// ── Swirl ─────────────────────────────────────────────────────
export const swirl = {
  baseSwirl:     0,
  swirlMode:     'none',   // none | rotary | wave
  amplifyEffect: 0,
  frequency:     1.0,
};

export const swirlModeOptions = {
  'None':          'none',
  'Rotary Effect': 'rotary',
  'Wave Effect':   'wave',
};

// ── Mask ──────────────────────────────────────────────────────
export const mask = {
  maskType:      'none',       // none | parametric | raster
  branchMode:    'ignore',     // ignore | apply
  addBranches:   6,
  roundBranches: 0,
  maskMargins:   { min: 0.1, max: 0.9 },
  image:         null,         // p5.Image for raster mode
};

export const maskTypeOptions = {
  'None':          'none',
  'Parametric':    'parametric',
  'Raster Image':  'raster',
};

export const maskBranchModeOptions = {
  'Ignore': 'ignore',
  'Apply':  'apply',
};

// ── Motion ────────────────────────────────────────────────────
export const motion = {
  motionType:   'none',   // none | noiseLoop | scalingLoop | scalingOneWay
  amplifyLevel: 20,       // 0–100
};

export const motionTypeOptions = {
  'None':             'none',
  'Noise Loop':       'noiseLoop',
  'Scaling Loop':     'scalingLoop',
  'Scaling One Way':  'scalingOneWay',
};

// ── Random section flags ──────────────────────────────────────
export const random = {
  canvas:      false,
  style:       false,
  pattern:     false,
  shape:       false,
  noiseSeed:   false,
  noiseBranch: false,
  noiseEase:   false,
  noiseFreq:   false,
  swirlEffect: false,
  maskEffect:  false,
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
  format: 'png',
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

// ── Easing functions ──────────────────────────────────────────
export const easings = {
  none:       ()  => 1,
  linear:     (t) => t,
  sineIn:     (t) => 1 - Math.cos(t * Math.PI / 2),
  sineOut:    (t) => Math.sin(t * Math.PI / 2),
  quadIn:     (t) => t * t,
  quadOut:    (t) => 1 - (1 - t) * (1 - t),
  quadInOut:  (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  cubicIn:    (t) => t * t * t,
  cubicOut:   (t) => 1 - Math.pow(1 - t, 3),
  cubicInOut: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  expoIn:     (t) => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
  expoOut:    (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  expoInOut:  (t) => t === 0 ? 0 : t === 1 ? 1 : t < 0.5
    ? Math.pow(2, 20 * t - 10) / 2
    : (2 - Math.pow(2, -20 * t + 10)) / 2,
  circIn:     (t) => 1 - Math.sqrt(1 - t * t),
  circOut:    (t) => Math.sqrt(1 - Math.pow(t - 1, 2)),
  circInOut:  (t) => t < 0.5
    ? (1 - Math.sqrt(1 - 4 * t * t)) / 2
    : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,
};

/** Apply selected easing to a 0–1 value. */
export function applyEasing(t, mode) {
  const fn = easings[mode] || easings.none;
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
