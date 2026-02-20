// ============================================================
// FLAKE Tool — Tweakpane UI
// ============================================================

import { Pane } from 'tweakpane';
import {
  canvas, pattern, style, noiseParams, swirl, mask, motion, exportSettings, presetState,
  ratioOptions, shapeTypeOptions, scalingEaseOptions, blendModeOptions,
  noiseSymmetryOptions, freqCompOptions, swirlModeOptions, maskToolOptions, motionTypeOptions,
} from './state.js';
import { getPresetNames, loadPreset, saveUserPreset, exportCurrentState, importState } from './presets.js';

let pane = null;
let callbacks = {};

// Folder references for visibility control
let maskUploadBtn = null;
let motionSpeedBlade = null;
let motionPlayBlade = null;

// ── Public API ────────────────────────────────────────────────

/**
 * @param {HTMLElement} container  The pane-wrapper element
 * @param {Object}      cbs        Callback functions
 */
export function setupUI(container, cbs) {
  callbacks = cbs;
  if (!container) return null;

  pane = new Pane({ container, title: 'FLAKE TOOL' });

  buildPresetSection();
  buildCanvasSection();
  buildPatternSection();
  buildStyleSection();
  buildNoiseSection();
  buildSwirlSection();
  buildMaskSection();
  buildMotionSection();
  buildRandomSection();
  buildExportSection();

  pane.addButton({ title: 'Randomize Parameters' }).on('click', () => {
    randomizeAll();
    pane.refresh();
    callbacks.onGridChange?.();
  });

  return { dispose: () => { if (pane) { pane.dispose(); pane = null; } } };
}

export function refreshUI() {
  if (pane) pane.refresh();
}

export function setStatus(msg) {
  exportSettings.status = msg;
  refreshUI();
}

// ── Sections ──────────────────────────────────────────────────

function buildPresetSection() {
  const presetFolder = pane.addFolder({ title: 'PRESETS', expanded: true });

  const presetNames = getPresetNames();
  const presetOpts  = Object.fromEntries(presetNames.map(n => [n, n]));
  const proxy       = { value: presetState.current };

  presetFolder.addBinding(proxy, 'value', {
    label:   'Preset List',
    options: presetOpts,
  }).on('change', (ev) => {
    presetState.current = ev.value;
    if (loadPreset(ev.value)) {
      pane.refresh();
      callbacks.onGridChange?.();
    }
  });

  presetFolder.addButton({ title: 'Save as User Preset' }).on('click', () => {
    const name = prompt('Preset name:');
    if (name?.trim()) {
      saveUserPreset(name.trim());
      presetState.current = name.trim();
    }
  });

  const ioFolder = presetFolder.addFolder({ title: 'Import / Export', expanded: false });

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
      const reader    = new FileReader();
      reader.onload   = (ev) => {
        if (importState(ev.target.result)) {
          pane.refresh();
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

  f.addBinding(canvas, 'background', {
    label: 'Background', view: 'color',
  }).on('change', () => callbacks.onParamChange?.());
}

function buildPatternSection() {
  const f = pane.addFolder({ title: 'PATTERN', expanded: true });

  f.addBinding(pattern, 'cols', {
    label: 'Pattern Cols', min: 2, max: 40, step: 1,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(pattern, 'cellSize', {
    label: 'Cell Size', min: 8, max: 120, step: 2,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(pattern, 'cellOffset', {
    label: 'Cell Offset', min: 0, max: 2, step: 0.05,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(pattern, 'seedFrom', {
    label: 'Seed From', min: 0, max: 20, step: 1,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(pattern, 'seedNoise', {
    label: 'Pattern Seed', min: 0, max: 100, step: 1,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(pattern, 'cellDivider', {
    label: 'Cell Divider',
  }).on('change', () => callbacks.onParamChange?.());
}

function buildStyleSection() {
  const f = pane.addFolder({ title: 'STYLE', expanded: true });

  f.addBinding(style, 'shapeType', {
    label: 'Shape Type', options: shapeTypeOptions,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(style, 'fillMapping', {
    label: 'Fill Mapping', min: 0, max: 4, step: 1,
  }).on('change', () => callbacks.onParamChange?.());

  // Up to 4 color stops
  for (let i = 0; i < 4; i++) {
    const proxy = { value: style.colors[i] || '#ffffff' };
    f.addBinding(proxy, 'value', {
      label: `Color ${i + 1}`, view: 'color',
    }).on('change', (ev) => {
      style.colors[i] = ev.value;
      callbacks.onParamChange?.();
    });
  }

  f.addBinding(style, 'shapeScale', {
    label: 'Shape Scale', min: 0.05, max: 2.0, step: 0.05,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(style, 'scalingEase', {
    label: 'Scaling Ease', options: scalingEaseOptions,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(style, 'baseRotation', {
    label: 'Base Rotation', min: -180, max: 180, step: 1,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(style, 'angleMult', {
    label: 'Angle Multiplier', min: -20, max: 20, step: 0.5,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(style, 'strokeWidth', {
    label: 'Stroke Width', min: 0, max: 6, step: 0.5,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(style, 'strokeColor', {
    label: 'Stroke Color', view: 'color',
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(style, 'blendMode', {
    label: 'Blend Mode', options: blendModeOptions,
  }).on('change', () => callbacks.onParamChange?.());
}

function buildNoiseSection() {
  const f = pane.addFolder({ title: 'NOISE', expanded: false });

  f.addBinding(noiseParams, 'symmetry', {
    label: 'Symmetry', options: noiseSymmetryOptions,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(noiseParams, 'branchAhead', {
    label: 'Branch Ahead', min: 0, max: 5, step: 0.05,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(noiseParams, 'branchAngle', {
    label: 'Branch Angle', min: -180, max: 180, step: 1,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(noiseParams, 'freqComp', {
    label: 'Freq Comp', options: freqCompOptions,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(noiseParams, 'freeMode', {
    label: 'Free Mode',
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(noiseParams, 'freqLayers', {
    label: 'Freq Layers', min: 1, max: 8, step: 1,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(noiseParams, 'freqAmply', {
    label: 'Freq Amply', min: 0, max: 1, step: 0.02,
  }).on('change', () => callbacks.onParamChange?.());
}

function buildSwirlSection() {
  const f = pane.addFolder({ title: 'SWIRL', expanded: false });

  f.addBinding(swirl, 'applyEffect', {
    label: 'Apply Effect',
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(swirl, 'swirlMode', {
    label: 'Swirl Mode', options: swirlModeOptions,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(swirl, 'swirlStart', {
    label: 'Swirl Start', min: 0, max: 1, step: 0.02,
  }).on('change', () => callbacks.onParamChange?.());

  f.addBinding(swirl, 'frequency', {
    label: 'Frequency', min: 0, max: 10, step: 0.1,
  }).on('change', () => callbacks.onParamChange?.());
}

function buildMaskSection() {
  const f = pane.addFolder({ title: 'MASK', expanded: false });

  f.addBinding(mask, 'maskTool', {
    label: 'Mask Tool', options: maskToolOptions,
  }).on('change', (ev) => {
    if (maskUploadBtn) maskUploadBtn.hidden = (ev.value !== 'image');
    callbacks.onParamChange?.();
  });

  maskUploadBtn = f.addButton({ title: 'Upload Mask Image' });
  maskUploadBtn.on('click', () => callbacks.onMaskUpload?.());
  maskUploadBtn.hidden = (mask.maskTool !== 'image');

  f.addBinding(mask, 'invert', { label: 'Invert' })
    .on('change', () => callbacks.onParamChange?.());
}

function buildMotionSection() {
  const f = pane.addFolder({ title: 'MOTION', expanded: false });

  f.addBinding(motion, 'motionType', {
    label: 'Motion Type', options: motionTypeOptions,
  }).on('change', (ev) => {
    const active = ev.value !== 'none';
    if (motionSpeedBlade) motionSpeedBlade.hidden = !active;
    if (motionPlayBlade)  motionPlayBlade.hidden  = !active;
    callbacks.onAnimationChange?.();
  });

  f.addBinding(motion, 'opacityLevel', {
    label: 'Opacity Level', min: 0, max: 1, step: 0.02,
  }).on('change', () => callbacks.onParamChange?.());

  motionSpeedBlade = f.addBinding(motion, 'speed', {
    label: 'Speed', min: 0.1, max: 5, step: 0.1,
  });
  motionSpeedBlade.on('change', () => callbacks.onParamChange?.());

  motionPlayBlade = f.addBinding(motion, 'playing', { label: 'Playing' });
  motionPlayBlade.on('change', () => callbacks.onAnimationChange?.());

  const active = motion.motionType !== 'none';
  motionSpeedBlade.hidden = !active;
  motionPlayBlade.hidden  = !active;
}

function buildRandomSection() {
  const f = pane.addFolder({ title: 'RANDOM', expanded: false });

  const sections = [
    ['Canvas Noise',    'canvas'],
    ['Style Items',     'style'],
    ['Pattern Items',   'pattern'],
    ['Noise Items',     'noiseItems'],
    ['Shape Effect',    'shapeEffect'],
    ['Swirl Effect',    'swirlEffect'],
  ];

  for (const [label, key] of sections) {
    f.addButton({ title: label + ': Randomize' }).on('click', () => {
      randomizeSection(key);
      pane.refresh();
      callbacks.onParamChange?.();
    });
  }

  f.addButton({ title: 'Noise Branches: Separate All' }).on('click', () => {
    randomizeSection('noiseBranches');
    pane.refresh();
    callbacks.onParamChange?.();
  });
}

function buildExportSection() {
  const f = pane.addFolder({ title: 'EXPORT', expanded: false });

  f.addBinding(exportSettings, 'format', {
    label: 'Format',
    options: { 'PNG': 'png', 'SVG': 'svg', 'PNG Sequence': 'sequence', 'WebM': 'webm' },
  });

  f.addBinding(exportSettings, 'scale', {
    label: 'Scale', min: 1, max: 4, step: 1,
  });

  f.addBinding(exportSettings, 'status', { label: 'Status', readonly: true });

  f.addButton({ title: 'Export' }).on('click', () => callbacks.onExport?.());
}

// ── Randomization helpers ─────────────────────────────────────

function randomizeAll() {
  randomizeSection('canvas');
  randomizeSection('style');
  randomizeSection('pattern');
  randomizeSection('noiseItems');
  randomizeSection('noiseBranches');
  randomizeSection('swirlEffect');
}

function randomizeSection(key) {
  switch (key) {
    case 'canvas':
      canvas.background = randomHex();
      break;

    case 'style': {
      const types = Object.values(shapeTypeOptions).filter(t => t !== 'custom');
      style.shapeType   = types[randInt(types.length)];
      style.shapeScale  = rand(0.3, 1.2);
      style.baseRotation = randInt(360) - 180;
      style.angleMult   = rand(-12, 12);
      style.fillMapping = randInt(5);
      const hue = rand(0, 360);
      style.colors = [0, 80, 160, 220].map(offset => hslToHex((hue + offset) % 360, rand(50, 90), rand(35, 65)));
      break;
    }

    case 'pattern':
      pattern.cols      = randInt(20) + 4;
      pattern.cellSize  = (randInt(8) + 2) * 8;
      pattern.cellOffset = rand(0, 1);
      pattern.seedNoise = randInt(100);
      break;

    case 'noiseItems':
      noiseParams.freqLayers = randInt(7) + 1;
      noiseParams.freqAmply  = rand(0.2, 0.9);
      noiseParams.symmetry   = ['standard', '2way', '4way', 'mirror'][randInt(4)];
      break;

    case 'noiseBranches':
      noiseParams.branchAhead = rand(0, 3);
      noiseParams.branchAngle = randInt(360) - 180;
      break;

    case 'shapeEffect':
      style.scalingEase = Object.values(scalingEaseOptions)[randInt(Object.keys(scalingEaseOptions).length)];
      break;

    case 'swirlEffect':
      swirl.applyEffect = Math.random() > 0.5;
      swirl.swirlMode   = ['none', 'rotary', 'wave'][randInt(3)];
      swirl.frequency   = rand(0.5, 5);
      swirl.swirlStart  = rand(0, 0.5);
      break;
  }
}

// ── Color utilities ───────────────────────────────────────────

function rand(min, max) { return min + Math.random() * (max - min); }
function randInt(n)     { return Math.floor(Math.random() * n); }
function randomHex()    { return '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'); }

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
