// ============================================================
// SPLITX Tool — State
// ============================================================

// ── Canvas ───────────────────────────────────────────────────
export const canvas = {
  width:       800,
  height:      800,
  ratio:       '1:1',
  background:  'custom',   // 'custom' | 'palette' | 'transparent'
  canvasColor: '#111111',
  paletteBgSlot: 0,        // which palette index to use for bg
  scale:       0.95,
};

export const ratioOptions = {
  '2:1': [2,1], '16:9': [16,9], '3:2': [3,2], '4:3': [4,3], '5:4': [5,4],
  '1:1': [1,1], '4:5': [4,5],  '3:4': [3,4], '2:3': [2,3], '9:16': [9,16], '1:2': [1,2],
};

export function computeCanvasSize() {
  const [rw, rh] = ratioOptions[canvas.ratio];
  const aspect   = rw / rh;
  const maxW = window.innerWidth  * 0.72 * canvas.scale;
  const maxH = window.innerHeight * canvas.scale;
  let w = maxW, h = w / aspect;
  if (h > maxH) { h = maxH; w = h * aspect; }
  w = Math.floor(w) - (Math.floor(w) % 2);
  h = Math.floor(h) - (Math.floor(h) % 2);
  canvas.width  = Math.max(w, 2);
  canvas.height = Math.max(h, 2);
}

// ── Shape ────────────────────────────────────────────────────
export const shape = {
  type:     'circle',
  count:    20,
  sequence: 0.5,    // scale sequence (fraction; can be negative)
};

export const shapeTypeOptions = {
  Rectangle: 'rectangle', Circle: 'circle',   Ring:    'ring',
  Oval:      'oval',      Triangle: 'triangle', Rhombus: 'rhombus',
  Cross:     'cross',     Star: 'star',         Hexagon: 'hexagon',
  Petals:    'petals',    Checker: 'checker',   Blob:    'blob',
  Organic:   'organic',   Custom:  'custom',
};

// ── Color ────────────────────────────────────────────────────
export const color = {
  stylingType:  'stroke',
  strokeWidth:  2,
  drawingMode:  'sequence', // 'xor' | 'sequence' | 'rgb' | 'lch'
  paletteIndex: 0,          // which slot is selected for editing
  paletteUse:   [true, true, true, true, true],
  palette:      ['#4a9eff', '#ff4a9e', '#ffe04a', '#4affc3', '#ff7a4a'],
};

export const drawingModeOptions = {
  'Cutout (XOR)':     'xor',
  'Sequence':         'sequence',
  'Transition (RGB)': 'rgb',
  'Transition (LCH)': 'lch',
};

export const colorPresets = [
  ['#4a9eff', '#ff4a9e', '#ffe04a', '#4affc3', '#ff7a4a'],
  ['#f72585', '#7209b7', '#3a0ca3', '#4361ee', '#4cc9f0'],
  ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#c77dff'],
  ['#ffffff', '#c8c8c8', '#909090', '#484848', '#111111'],
  ['#2d00f7', '#6a00f4', '#8900f2', '#bc00dd', '#e500a4'],
];

// ── Transform ────────────────────────────────────────────────
export const transform = {
  splitMask:  'none',
  scale:      1.0,
  rotation:   0,
  position:   { x: 0.0, y: 0.0 },    // canvas-relative fractions (× halfWidth)
  transition: { x: 0.0, y: 0.5 },    // canvas-relative fractions (× halfWidth)
};

export const splitMaskOptions = {
  None: 'none', Horizontal: 'horizontal', Vertical: 'vertical', Quad: 'quad',
};

// ── Motion (4 channels) ───────────────────────────────────────
function makeChannel() {
  return {
    type:  'off',
    // All params stored for both noise and sine (preserved when switching types)
    order: 'forward',
    amp:   0.3,
    freq:  0.5,
    cycle: 2,
    phase: 0.0,
    speed: 0.3,
    seed:  Math.floor(Math.random() * 1000),
  };
}

export const motion = {
  scale:  makeChannel(),
  xMove:  makeChannel(),
  yMove:  makeChannel(),
  rotate: makeChannel(),
};

export const motionTypeOptions  = { Off: 'off', Noise: 'noise', Sinusoidal: 'sinusoidal' };
export const effectOrderOptions = { Forward: 'forward', Backward: 'backward', Equal: 'equal' };

// ── Export ───────────────────────────────────────────────────
export const exportSettings = {
  fileType: 'png',
  size:     1.0,
  length:   5,
  quality:  90,
  status:   'Ready',
};

export const fileTypeOptions = {
  'SVG File': 'svg', 'PNG File': 'png', 'MP4 File': 'mp4',
  'PNG Sequence': 'png-sequence', 'WEBP Sequence': 'webp-sequence',
};

// ── Options ──────────────────────────────────────────────────
export const options = {
  margins:     20,
  wheelSens:   1.0,
  browserColor: 10,
};

// ── Runtime (not serialized) ──────────────────────────────────
export const animState = {
  time:  0,   // seconds elapsed
  frame: 0,   // integer tick counter
};

export const customSvg = {
  item: null,  // paper.js Item set by media.js when an SVG is loaded
};

// ── Preset helpers ───────────────────────────────────────────
export function cloneState() {
  return JSON.parse(JSON.stringify({ canvas, shape, color, transform, motion, exportSettings }));
}

export function applyState(saved) {
  function deepMerge(target, source) {
    for (const key of Object.keys(source)) {
      if (
        typeof source[key] === 'object' && source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof target[key] === 'object' && target[key] !== null
      ) {
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  if (saved.canvas)         deepMerge(canvas,         saved.canvas);
  if (saved.shape)          deepMerge(shape,           saved.shape);
  if (saved.color)          deepMerge(color,           saved.color);
  if (saved.transform)      deepMerge(transform,       saved.transform);
  if (saved.motion)         deepMerge(motion,          saved.motion);
  if (saved.exportSettings) deepMerge(exportSettings,  saved.exportSettings);
}
