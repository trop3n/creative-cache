// ============================================================
// FLAKE Tool — Tweakpane UI
// ============================================================

import { Pane } from 'tweakpane';
import {
  canvas, pattern, style, shape, noiseParams, swirl, mask, motion,
  exportSettings, presetState,
  ratioOptions, renderStyleOptions, colorTypeOptions, blendModeOptions,
  shapeTypeOptions, scalingEaseOptions,
  noiseSymmetryOptions, freqModeOptions,
  swirlModeOptions,
  maskTypeOptions, maskBranchModeOptions,
  motionTypeOptions,
} from './state.js';
import { getPresetNames, loadPreset, saveUserPreset, exportCurrentState, importState } from './presets.js';

let pane      = null;
let callbacks = {};

// Module-level color proxies (must stay in sync with style.colors on refresh)
const colorProxies = [
  { value: '#ffffff' },
  { value: '#ffffff' },
  { value: '#ffffff' },
  { value: '#ffffff' },
];

// Module-level preset proxy
const presetProxy = { value: '** Default **' };

// Blades that need conditional visibility
let maskParametricFolder = null;
let maskRasterBtn        = null;
let motionAmplifyBlade   = null;

// ── Public API ────────────────────────────────────────────────

/**
 * @param {HTMLElement} container  Pane wrapper element
 * @param {Object}      cbs        Callback functions
 */
export function setupUI(container, cbs) {
  callbacks = cbs;
  if (!container) return null;

  pane = new Pane({ container, title: 'FLAKE TOOL' });

  buildPresetSection();
  buildCanvasSection();
  buildStyleSection();
  buildPatternSection();
  buildShapeSection();
  buildNoiseSection();
  buildSwirlSection();
  buildMaskSection();
  buildMotionSection();
  buildRandomSection();
  buildExportSection();

  return { dispose: () => { if (pane) { pane.dispose(); pane = null; } } };
}

export function refreshUI() {
  if (!pane) return;
  // Sync color proxies from state before refresh
  for (let i = 0; i < 4; i++) {
    colorProxies[i].value = style.colors[i] || '#ffffff';
  }
  presetProxy.value = presetState.current;
  pane.refresh();
}

export function setStatus(msg) {
  exportSettings.status = msg;
  refreshUI();
}

// ── Sections ──────────────────────────────────────────────────

function buildPresetSection() {
  const f = pane.addFolder({ title: 'PRESETS', expanded: true });

  const names    = getPresetNames();
  const opts     = Object.fromEntries(names.map(n => [n, n]));
  presetProxy.value = presetState.current;

  f.addBinding(presetProxy, 'value', {
    label: 'Preset List', options: opts,
  }).on('change', (ev) => {
    presetState.current = ev.value;
    if (loadPreset(ev.value)) {
      refreshUI();
      callbacks.onGridChange?.();
    }
  });

  f.addButton({ title: 'Save as User Preset' }).on('click', () => {
    const name = prompt('Preset name:');
    if (name?.trim()) {
      saveUserPreset(name.trim());
      presetState.current = name.trim();
    }
  });

  const ioFolder = f.addFolder({ title: 'Import / Export', expanded: false });

  ioFolder.addButton({ title: 'Export JSON' }).on('click', () => {
    const blob = new Blob([exportCurrentState()], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `flake-preset-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  ioFolder.addButton({ title: 'Import JSON' }).on('click', () => {
    const input    = document.createElement('input');
    input.type     = 'file';
    input.accept   = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader  = new FileReader();
      reader.onload = (ev) => {
        if (importState(ev.target.result)) {
          refreshUI();
          callbacks.onGridChange?.();
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}

function buildCanvasSection() {
  const f = pane.addFolder({ title: 'CANVAS', expanded: false });

  f.addBinding(canvas, 'ratio', {
    label: 'Ratio', options: ratioOptions,
  }).on('change', () => callbacks.onGridChange?.());

  f.addBinding(canvas, 'scale', {
    label: 'Scale', min: 0.5, max: 1.0, step: 0.01,
  }).on('change', () => callbacks.onGridChange?.());

  f.addBinding(canvas, 'background', {
    label: 'Background', view: 'color',
  }).on('change', () => callbacks.onParamChange?.());
}

function buildStyleSection() {
  const f = pane.addFolder({ title: 'STYLE', expanded: true });

  f.addBinding(style, 'renderStyle', {
    label: 'Render Style', options: renderStyleOptions,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(style, 'blendMode', {
    label: 'Blend Mode', options: blendModeOptions,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(style, 'colorType', {
    label: 'Color Type', options: colorTypeOptions,
  }).on('change', () => callbacks.onParamChange?.());

  // Color pickers (use module-level proxies for reliable refresh)
  for (let i = 0; i < 4; i++) {
    colorProxies[i].value = style.colors[i] || '#ffffff';
    f.addBinding(colorProxies[i], 'value', {
      label: `Color ${i + 1}`, view: 'color',
    }).on('change', (ev) => {
      style.colors[i] = ev.value;
      callbacks.onParamChange?.();
    });
  }

  f.addButton({ title: 'Random Palette' }).on('click', () => {
    const hue = rand(0, 360);
    style.colors = [0, 80, 160, 220].map(
      offset => hslToHex((hue + offset) % 360, rand(50, 90), rand(35, 65)),
    );
    refreshUI();
    callbacks.onParamChange?.();
  });

  f.addButton({ title: 'Shuffle Colors' }).on('click', () => {
    for (let i = style.colors.length - 1; i > 0; i--) {
      const j = randInt(i + 1);
      [style.colors[i], style.colors[j]] = [style.colors[j], style.colors[i]];
    }
    refreshUI();
    callbacks.onParamChange?.();
  });
}

function buildPatternSection() {
  const f = pane.addFolder({ title: 'PATTERN', expanded: true });

  f.addBinding(pattern, 'cells', {
    label: 'Cells',
    x: { min: 1, max: 40, step: 1 },
    y: { min: 1, max: 40, step: 1 },
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(pattern, 'cellOffset', {
    label: 'Cell Offset',
    x: { min: -2, max: 2, step: 0.05 },
    y: { min: -2, max: 2, step: 0.05 },
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(pattern, 'seed', {
    label: 'Seed', min: -20, max: 20, step: 1,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(pattern, 'seedRandom', {
    label: 'Seed Random', min: 0, max: 100, step: 1,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(pattern, 'cellRotation', {
    label: 'Cell Rotation', min: -180, max: 180, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
}

function buildShapeSection() {
  const f = pane.addFolder({ title: 'SHAPE', expanded: true });

  f.addBinding(shape, 'shapeType', {
    label: 'Shape Type', options: shapeTypeOptions,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(shape, 'gridMapping', {
    label: 'Grid Mapping',
    x: { min: 0, max: 20, step: 0.5 },
    y: { min: 0, max: 20, step: 0.5 },
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(shape, 'shapeCount', {
    label: 'Shape Count', min: 100, max: 10000, step: 100,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(shape, 'shapeScale', {
    label: 'Shape Scale', min: 0.05, max: 2.0, step: 0.05,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(shape, 'scalePower', {
    label: 'Scale Power', min: 0, max: 5, step: 0.1,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(shape, 'scalingEase', {
    label: 'Scaling Ease', options: scalingEaseOptions,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(shape, 'baseRotation', {
    label: 'Base Rotation', min: -180, max: 180, step: 1,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(shape, 'angleMult', {
    label: 'Angle Multiplier', min: -20, max: 20, step: 0.5,
  }).on('change', () => callbacks.onParamChange?.());
}

function buildNoiseSection() {
  const f = pane.addFolder({ title: 'NOISE', expanded: false });

  f.addBinding(noiseParams, 'symmetry', {
    label: 'Symmetry', options: noiseSymmetryOptions,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(noiseParams, 'branchAmount', {
    label: 'Branch Amount', min: 0, max: 12, step: 0.1,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(noiseParams, 'branchAngle', {
    label: 'Branch Angle (rad)', min: -Math.PI * 2, max: Math.PI * 2, step: 0.05,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(noiseParams, 'freqEasing', {
    label: 'Freq Easing', options: scalingEaseOptions,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(noiseParams, 'freqMode', {
    label: 'Freq Mode', options: freqModeOptions,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(noiseParams, 'freqLayers', {
    label: 'Freq Layers', min: 1, max: 12, step: 1,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(noiseParams, 'freqBase', {
    label: 'Freq Base', min: 0.01, max: 1.0, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(noiseParams, 'freqAmplify', {
    label: 'Freq Amplify', min: 0, max: 1, step: 0.02,
  }).on('change', () => callbacks.onParamChange?.());
}

function buildSwirlSection() {
  const f = pane.addFolder({ title: 'SWIRL', expanded: false });

  f.addBinding(swirl, 'swirlMode', {
    label: 'Swirl Mode', options: swirlModeOptions,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(swirl, 'baseSwirl', {
    label: 'Base Swirl', min: 0, max: 1, step: 0.02,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(swirl, 'amplifyEffect', {
    label: 'Amplify Effect', min: -2, max: 2, step: 0.05,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(swirl, 'frequency', {
    label: 'Frequency', min: 0, max: 10, step: 0.1,
  }).on('change', () => callbacks.onParamChange?.());
}

function buildMaskSection() {
  const f = pane.addFolder({ title: 'MASK', expanded: false });

  f.addBinding(mask, 'maskType', {
    label: 'Mask Type', options: maskTypeOptions,
  }).on('change', (ev) => {
    updateMaskVisibility(ev.value);
    callbacks.onParamChange?.();
  });

  // Parametric controls (hidden unless maskType === 'parametric')
  maskParametricFolder = f.addFolder({ title: 'Parametric Settings', expanded: true });

  maskParametricFolder.addBinding(mask, 'branchMode', {
    label: 'Branch Mode', options: maskBranchModeOptions,
  }).on('change', () => callbacks.onParamChange?.());

  maskParametricFolder.addBinding(mask, 'addBranches', {
    label: 'Branches', min: 1, max: 12, step: 1,
  }).on('change', () => callbacks.onParamChange?.());

  maskParametricFolder.addBinding(mask, 'roundBranches', {
    label: 'Roundness', min: 0, max: 5, step: 0.1,
  }).on('change', () => callbacks.onParamChange?.());

  maskParametricFolder.addBinding(mask.maskMargins, 'min', {
    label: 'Inner Margin', min: 0, max: 1, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.());

  maskParametricFolder.addBinding(mask.maskMargins, 'max', {
    label: 'Outer Margin', min: 0, max: 1, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.());

  // Raster upload button (hidden unless maskType === 'raster')
  maskRasterBtn = f.addButton({ title: 'Upload Mask Image' });
  maskRasterBtn.on('click', () => callbacks.onMaskUpload?.());

  updateMaskVisibility(mask.maskType);
}

function updateMaskVisibility(maskType) {
  if (maskParametricFolder) maskParametricFolder.hidden = (maskType !== 'parametric');
  if (maskRasterBtn)        maskRasterBtn.hidden        = (maskType !== 'raster');
}

function buildMotionSection() {
  const f = pane.addFolder({ title: 'MOTION', expanded: false });

  f.addBinding(motion, 'motionType', {
    label: 'Motion Type', options: motionTypeOptions,
  }).on('change', (ev) => {
    const active = ev.value !== 'none';
    if (motionAmplifyBlade) motionAmplifyBlade.hidden = !active;
    callbacks.onAnimationChange?.();
  });

  motionAmplifyBlade = f.addBinding(motion, 'amplifyLevel', {
    label: 'Amplify Level', min: 0, max: 100, step: 1,
  });
  motionAmplifyBlade.on('change', () => callbacks.onParamChange?.());
  motionAmplifyBlade.hidden = (motion.motionType === 'none');
}

function buildRandomSection() {
  const f = pane.addFolder({ title: 'RANDOM', expanded: false });

  const sections = [
    ['Canvas',   'canvas'],
    ['Style',    'style'],
    ['Pattern',  'pattern'],
    ['Shape',    'shape'],
    ['Swirl',    'swirl'],
    ['Mask',     'mask'],
  ];

  for (const [label, key] of sections) {
    f.addButton({ title: `${label}: Randomize` }).on('click', () => {
      randomizeSection(key);
      refreshUI();
      callbacks.onParamChange?.();
    });
  }

  const noiseFolder = f.addFolder({ title: 'Noise Randomize', expanded: false });

  const noiseSubs = [
    ['Seed',   'noiseSeed'],
    ['Branch', 'noiseBranch'],
    ['Ease',   'noiseEase'],
    ['Freq',   'noiseFreq'],
  ];

  for (const [label, key] of noiseSubs) {
    noiseFolder.addButton({ title: `${label}: Randomize` }).on('click', () => {
      randomizeSection(key);
      refreshUI();
      callbacks.onParamChange?.();
    });
  }
}

function buildExportSection() {
  const f = pane.addFolder({ title: 'EXPORT', expanded: false });

  f.addBinding(exportSettings, 'format', {
    label: 'Format',
    options: { PNG: 'png', 'PNG Sequence': 'sequence', WebM: 'webm' },
  });

  f.addBinding(exportSettings, 'scale', {
    label: 'Scale', min: 1, max: 4, step: 1,
  });

  f.addBinding(exportSettings, 'status', { label: 'Status', readonly: true });

  f.addButton({ title: 'Export' }).on('click', () => callbacks.onExport?.());
}

// ── Randomization ─────────────────────────────────────────────

function randomizeSection(key) {
  switch (key) {
    case 'canvas':
      canvas.background = randomHex();
      break;

    case 'style': {
      const types = Object.values(renderStyleOptions);
      style.renderStyle = types[randInt(types.length)];
      const colorTypes  = Object.values(colorTypeOptions);
      style.colorType   = colorTypes[randInt(colorTypes.length)];
      const hue = rand(0, 360);
      style.colors = [0, 80, 160, 220].map(
        offset => hslToHex((hue + offset) % 360, rand(50, 90), rand(35, 65)),
      );
      break;
    }

    case 'pattern':
      pattern.cells.x     = randInt(30) + 4;
      pattern.cells.y     = randInt(30) + 4;
      pattern.cellOffset.x = rand(-1, 1);
      pattern.cellOffset.y = rand(-1, 1);
      pattern.seed        = randInt(41) - 20;
      pattern.seedRandom  = randInt(100);
      break;

    case 'shape': {
      const types = Object.values(shapeTypeOptions).filter(t => t !== 'custom');
      shape.shapeType   = types[randInt(types.length)];
      shape.shapeScale  = rand(0.3, 1.2);
      shape.baseRotation = randInt(360) - 180;
      shape.angleMult   = rand(-12, 12);
      shape.gridMapping.x = rand(1, 15);
      shape.gridMapping.y = rand(1, 15);
      break;
    }

    case 'swirl':
      swirl.swirlMode     = Object.values(swirlModeOptions)[randInt(3)];
      swirl.frequency     = rand(0.5, 5);
      swirl.baseSwirl     = rand(0, 0.5);
      swirl.amplifyEffect = rand(-1, 1);
      break;

    case 'mask':
      mask.addBranches   = randInt(10) + 2;
      mask.roundBranches = rand(0, 3);
      mask.maskMargins.min = rand(0, 0.2);
      mask.maskMargins.max = rand(0.5, 1.0);
      break;

    case 'noiseSeed':
      pattern.seed       = randInt(41) - 20;
      pattern.seedRandom = randInt(100);
      break;

    case 'noiseBranch':
      noiseParams.branchAmount = rand(0, 12);
      noiseParams.branchAngle  = rand(-Math.PI, Math.PI);
      break;

    case 'noiseEase': {
      const eases = Object.values(scalingEaseOptions);
      noiseParams.freqEasing  = eases[randInt(eases.length)];
      shape.scalingEase       = eases[randInt(eases.length)];
      break;
    }

    case 'noiseFreq':
      noiseParams.freqLayers  = randInt(10) + 1;
      noiseParams.freqAmplify = rand(0.2, 0.9);
      noiseParams.freqBase    = rand(0.02, 0.5);
      noiseParams.freqMode    = Math.random() > 0.5 ? 'cos' : 'sin';
      break;
  }
}

// ── Color utilities ───────────────────────────────────────────

function rand(min, max)  { return min + Math.random() * (max - min); }
function randInt(n)      { return Math.floor(Math.random() * n); }
function randomHex()     { return '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'); }

function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
