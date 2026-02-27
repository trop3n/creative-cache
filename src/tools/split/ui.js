// ============================================================
// SPLITX Tool — UI (Tweakpane v4)
// ============================================================

import { Pane } from 'tweakpane';
import {
  canvas, shape, color, transform, motion, exportSettings, options,
  ratioOptions, shapeTypeOptions, drawingModeOptions, splitMaskOptions,
  motionTypeOptions, effectOrderOptions, fileTypeOptions, colorPresets,
} from './state.js';
import { presetOptions, loadPreset, saveUserPreset, exportPresetJSON } from './presets.js';

let pane = null;
let cbs  = {};

// Blade refs for conditional visibility / rebuild
let strokeWidthBlade   = null;
let paletteBgBlade     = null;   // "Palette Color" dropdown for background slot
const motionFolders = {};
const motionTypeBlades = {};

// Color section handles
let setColorBlade    = null;  // single color picker for selected slot
let swatchButtons    = [];    // 5 swatch selector buttons
let toggleButtons    = [];    // 5 toggle-active buttons

export function setupUI(container, callbacks) {
  cbs = callbacks;
  if (!container) return null;
  pane = new Pane({ container, title: 'SPLITX' });

  const tabs = pane.addTab({
    pages: [{ title: 'MAIN' }, { title: 'EXPORT' }, { title: 'OPTIONS' }],
  });
  const [mainPage, exportPage, optionsPage] = tabs.pages;

  buildMain(mainPage);
  buildExport(exportPage);
  buildOptions(optionsPage);

  updateStrokeWidthVisibility();
  updatePaletteBgVisibility();

  return pane;
}

export function refreshUI() {
  if (pane) pane.refresh();
  updateSwatchUI();
}

// ── MAIN tab ──────────────────────────────────────────────────

function buildMain(page) {
  buildPresets(page);
  buildCanvas(page);
  buildShape(page);
  buildColor(page);
  buildTransform(page);
  buildMotion(page);
}

function buildPresets(page) {
  const proxy = { value: '— Select —' };
  const folder = page.addFolder({ title: 'PRESETS', expanded: true });

  folder.addBinding(proxy, 'value', { label: 'Preset List', options: presetOptions })
    .on('change', ({ value }) => {
      if (value === '— Select —') return;
      if (loadPreset(value)) {
        pane.refresh();
        updateStrokeWidthVisibility();
        updatePaletteBgVisibility();
        rebuildAllMotionParams();
        updateSwatchUI();
        cbs.onCanvasChange?.();
      }
    });

  folder.addButton({ title: 'Restart Preset' }).on('click', () => {
    if (loadPreset(proxy.value)) {
      pane.refresh();
      updateStrokeWidthVisibility();
      updatePaletteBgVisibility();
      rebuildAllMotionParams();
      updateSwatchUI();
      cbs.onCanvasChange?.();
    }
  });

  folder.addBlade({ view: 'separator' });
  folder.addButton({ title: 'Save User Preset' }).on('click', saveUserPreset);
  folder.addButton({ title: 'Export Preset JSON' }).on('click', exportPresetJSON);
}

function buildCanvas(page) {
  const folder = page.addFolder({ title: 'CANVAS', expanded: true });

  folder.addBinding(canvas, 'ratio', {
    label: 'Canvas Ratio',
    options: Object.fromEntries(Object.keys(ratioOptions).map(k => [k, k])),
  }).on('change', () => cbs.onCanvasChange?.());

  folder.addBinding(canvas, 'background', {
    label: 'Background',
    options: { Custom: 'custom', 'Use Palette Color': 'palette', Transparent: 'transparent' },
  }).on('change', () => { updatePaletteBgVisibility(); cbs.onParamChange?.(); });

  // Palette Color: dropdown "Color 1"…"Color 5"
  paletteBgBlade = folder.addBinding(canvas, 'paletteBgSlot', {
    label: 'Palette Color',
    options: { 'Color 1': 0, 'Color 2': 1, 'Color 3': 2, 'Color 4': 3, 'Color 5': 4 },
  }).on('change', () => cbs.onParamChange?.());

  folder.addBinding(canvas, 'canvasColor', { label: 'Canvas Color', view: 'color' })
    .on('change', () => cbs.onParamChange?.());

  updatePaletteBgVisibility();
}

function buildShape(page) {
  const folder = page.addFolder({ title: 'SHAPE', expanded: true });
  folder.addBinding(shape, 'type',     { label: 'Choose Type',    options: shapeTypeOptions })
    .on('change', () => cbs.onParamChange?.());
  folder.addBinding(shape, 'count',    { label: 'Shape Count',    min: 1, max: 100, step: 1 })
    .on('change', () => cbs.onParamChange?.());
  folder.addBinding(shape, 'sequence', { label: 'Scale Sequence', min: -1, max: 1, step: 0.01 })
    .on('change', () => cbs.onParamChange?.());
}

function buildColor(page) {
  const folder = page.addFolder({ title: 'COLOR', expanded: true });

  folder.addBinding(color, 'stylingType', {
    label: 'Styling Type',
    options: { Fill: 'fill', Stroke: 'stroke' },
  }).on('change', () => { updateStrokeWidthVisibility(); cbs.onParamChange?.(); });

  strokeWidthBlade = folder.addBinding(color, 'strokeWidth', {
    label: 'Stroke Width', min: 0.5, max: 20, step: 0.5,
  }).on('change', () => cbs.onParamChange?.());

  folder.addBinding(color, 'drawingMode', { label: 'Drawing Mode', options: drawingModeOptions })
    .on('change', () => cbs.onParamChange?.());

  folder.addBlade({ view: 'separator' });

  // 5 swatch selector buttons (click to select which slot to edit)
  swatchButtons = [];
  for (let i = 0; i < 5; i++) {
    const btn = folder.addButton({ title: `●` }).on('click', () => {
      color.paletteIndex = i;
      rebuildSetColorBlade(folder);
      updateSwatchUI();
    });
    swatchButtons.push(btn);
  }

  folder.addBlade({ view: 'separator' });

  // 5 toggle buttons (active/inactive per slot)
  toggleButtons = [];
  for (let i = 0; i < 5; i++) {
    const btn = folder.addButton({ title: `Use ${i + 1}` }).on('click', () => {
      // Ensure at least 1 color stays active
      const active = color.paletteUse.filter(Boolean).length;
      if (active === 1 && color.paletteUse[i]) return; // can't deactivate last
      color.paletteUse[i] = !color.paletteUse[i];
      updateSwatchUI();
      cbs.onParamChange?.();
    });
    toggleButtons.push(btn);
  }

  folder.addBlade({ view: 'separator' });

  // Set Color: single picker bound to currently selected palette slot
  buildSetColorBlade(folder);

  folder.addBlade({ view: 'separator' });

  // Color Preset quick-apply buttons
  for (let pi = 0; pi < colorPresets.length; pi++) {
    folder.addButton({ title: `Palette ${pi + 1}` }).on('click', () => {
      colorPresets[pi].forEach((hex, i) => { color.palette[i] = hex; });
      rebuildSetColorBlade(folder);
      updateSwatchUI();
      pane.refresh();
      cbs.onParamChange?.();
    });
  }

  folder.addButton({ title: 'Get Random Palette' }).on('click', () => {
    const hue = Math.random() * 360;
    for (let i = 0; i < 5; i++) {
      const h = (hue + i * 55) % 360;
      color.palette[i] = hslToHex(h, 70, 50);
    }
    rebuildSetColorBlade(folder);
    updateSwatchUI();
    pane.refresh();
    cbs.onParamChange?.();
  });

  // Initial swatch visual update
  updateSwatchUI();
}

let _setColorFolder = null;
function buildSetColorBlade(folder) {
  _setColorFolder = folder;
  if (setColorBlade) { try { setColorBlade.dispose(); } catch {} }
  const proxy = {
    get val() { return color.palette[color.paletteIndex]; },
    set val(v) { color.palette[color.paletteIndex] = v; },
  };
  setColorBlade = folder.addBinding(proxy, 'val', { label: 'Set Color', view: 'color' })
    .on('change', () => { updateSwatchUI(); cbs.onParamChange?.(); });
}

function rebuildSetColorBlade(folder) {
  buildSetColorBlade(folder ?? _setColorFolder);
}

function updateSwatchUI() {
  // Update swatch button labels with color names and active state
  for (let i = 0; i < 5; i++) {
    if (swatchButtons[i]) {
      const el = swatchButtons[i].element;
      if (el) {
        const btn = el.querySelector('button') ?? el;
        btn.style.backgroundColor = color.palette[i];
        btn.style.outline = i === color.paletteIndex ? '2px solid white' : 'none';
        btn.style.opacity = color.paletteUse[i] ? '1' : '0.35';
      }
    }
    if (toggleButtons[i]) {
      const el = toggleButtons[i].element;
      if (el) {
        const btn = el.querySelector('button') ?? el;
        btn.style.backgroundColor = color.paletteUse[i] ? '#666' : '#333';
      }
    }
  }
}

function buildTransform(page) {
  const folder = page.addFolder({ title: 'TRANSFORM', expanded: true });

  folder.addBinding(transform, 'splitMask', { label: 'Split Mask', options: splitMaskOptions })
    .on('change', () => cbs.onParamChange?.());
  folder.addBinding(transform, 'scale',    { label: 'Scale',    min: 0.01, max: 5,    step: 0.01 })
    .on('change', () => cbs.onParamChange?.());
  folder.addBinding(transform, 'rotation', { label: 'Rotation', min: -360, max: 360, step: 1 })
    .on('change', () => cbs.onParamChange?.());
  folder.addBinding(transform.position,   'x', { label: 'Position X',   min: -2, max: 2, step: 0.01 })
    .on('change', () => cbs.onParamChange?.());
  folder.addBinding(transform.position,   'y', { label: 'Position Y',   min: -2, max: 2, step: 0.01 })
    .on('change', () => cbs.onParamChange?.());
  folder.addBinding(transform.transition, 'x', { label: 'Transition X', min: -2, max: 2, step: 0.01 })
    .on('change', () => cbs.onParamChange?.());
  folder.addBinding(transform.transition, 'y', { label: 'Transition Y', min: -2, max: 2, step: 0.01 })
    .on('change', () => cbs.onParamChange?.());

  folder.addBlade({ view: 'separator' });

  folder.addButton({ title: 'Get Random Values' }).on('click', () => {
    const masks = Object.values(splitMaskOptions);
    transform.splitMask    = masks[Math.floor(Math.random() * masks.length)];
    transform.scale        = 0.3 + Math.random() * 2;
    transform.rotation     = Math.floor(Math.random() * 360) - 180;
    transform.transition.x = (Math.random() - 0.5) * 2;
    transform.transition.y = (Math.random() - 0.5) * 2;
    pane.refresh();
    cbs.onParamChange?.();
  });

  folder.addButton({ title: 'Reset to Default' }).on('click', () => {
    transform.splitMask    = 'none';
    transform.scale        = 1.0;
    transform.rotation     = 0;
    transform.position.x   = 0;
    transform.position.y   = 0;
    transform.transition.x = 0;
    transform.transition.y = 0.5;
    pane.refresh();
    cbs.onParamChange?.();
  });
}

function buildMotion(page) {
  for (const [key, label] of [
    ['scale', 'SCALE'], ['xMove', 'X MOVE'], ['yMove', 'Y MOVE'], ['rotate', 'ROTATE'],
  ]) {
    const folder = page.addFolder({ title: label, expanded: false });
    motionFolders[key] = folder;

    const typeBlade = folder.addBinding(motion[key], 'type', {
      label: 'Motion Type', options: motionTypeOptions,
    }).on('change', () => {
      updateMotionParamState(key);
      cbs.onAnimationChange?.();
    });
    motionTypeBlades[key] = typeBlade;

    buildMotionParams(folder, key);
  }
}

function buildMotionParams(folder, key) {
  const ch = motion[key];

  // All params always visible; disabled when type === 'off'
  const disabled = ch.type === 'off';

  // Shared across noise and sine
  folder.addBinding(ch, 'order', { label: 'Effect Order', options: effectOrderOptions, disabled })
    .on('change', () => cbs.onParamChange?.());
  folder.addBinding(ch, 'amp',   { label: 'Amplitude',   min: -2,    max: 2,     step: 0.01, disabled })
    .on('change', () => cbs.onParamChange?.());
  folder.addBinding(ch, 'freq',  { label: 'Frequency',   min: 0,     max: 5,     step: 0.01, disabled })
    .on('change', () => cbs.onParamChange?.());
  folder.addBinding(ch, 'cycle', { label: 'Cycles',      min: 1,     max: 20,    step: 1,    disabled })
    .on('change', () => cbs.onParamChange?.());
  folder.addBinding(ch, 'phase', { label: 'Phase',       min: -1,    max: 1,     step: 0.01, disabled })
    .on('change', () => cbs.onParamChange?.());
  folder.addBinding(ch, 'speed', { label: 'Speed',       min: 0,     max: 1,     step: 0.01, disabled })
    .on('change', () => cbs.onParamChange?.());
  folder.addBinding(ch, 'seed',  { label: 'Noise Seed',  min: 0,     max: 10000, step: 1,    disabled })
    .on('change', () => cbs.onParamChange?.());

  folder.addButton({ title: 'Get Random Values', disabled }).on('click', () => {
    if (ch.type === 'off') return;
    ch.amp   = (Math.random() - 0.5) * 1.6;
    ch.freq  = Math.random() * 2;
    ch.cycle = 1 + Math.floor(Math.random() * 8);
    ch.phase = (Math.random() - 0.5) * 1;
    ch.speed = Math.random();
    ch.seed  = Math.floor(Math.random() * 10000);
    pane.refresh();
    cbs.onParamChange?.();
  });
}

function updateMotionParamState(key) {
  // Re-render the motion folder with updated disabled states
  const folder = motionFolders[key];
  if (!folder) return;
  // Remove all children except the type blade (first child)
  const typeBlade = motionTypeBlades[key];
  const toRemove = folder.children.filter(c => c !== typeBlade);
  toRemove.forEach(c => { try { c.dispose(); } catch {} });
  buildMotionParams(folder, key);
}

function rebuildAllMotionParams() {
  for (const key of ['scale', 'xMove', 'yMove', 'rotate']) {
    if (motionFolders[key]) updateMotionParamState(key);
  }
}

// ── EXPORT tab ────────────────────────────────────────────────

function buildExport(page) {
  const statusProxy = { get val() { return exportSettings.status; } };
  page.addBinding(statusProxy, 'val', { label: 'Status', readonly: true });
  page.addBinding(exportSettings, 'fileType', { label: 'File Type',       options: fileTypeOptions });
  page.addBinding(exportSettings, 'size',     { label: 'Export Size',     min: 0.25, max: 4,   step: 0.25 });
  page.addBinding(exportSettings, 'length',   { label: 'Export Length',   min: 1,    max: 60,  step: 1 });
  page.addBinding(exportSettings, 'quality',  { label: 'Export Quality',  min: 1,    max: 100, step: 1 });
  page.addBlade({ view: 'separator' });
  page.addButton({ title: 'Export Graphics' }).on('click', () => cbs.onExport?.());
}

// ── OPTIONS tab ───────────────────────────────────────────────

function buildOptions(page) {
  page.addButton({ title: 'Fullscreen' }).on('click', () => {
    document.documentElement.requestFullscreen?.();
  });
  page.addBinding(options, 'margins',     { label: 'Canvas Margins',    min: 0,   max: 100, step: 1 })
    .on('change', () => cbs.onParamChange?.());
  page.addBinding(options, 'wheelSens',   { label: 'Wheel Sensitivity', min: 0.1, max: 5,   step: 0.1 });
  page.addBinding(options, 'browserColor', { label: 'Browser Color',    min: 0,   max: 100, step: 1 })
    .on('change', () => {
      const v = Math.round(options.browserColor * 2.55);
      document.body.style.backgroundColor = `rgb(${v},${v},${v})`;
    });
}

// ── Conditional visibility ─────────────────────────────────────

function updateStrokeWidthVisibility() {
  if (strokeWidthBlade) strokeWidthBlade.hidden = color.stylingType !== 'stroke';
}

function updatePaletteBgVisibility() {
  if (paletteBgBlade) paletteBgBlade.hidden = canvas.background !== 'palette';
}

// ── Helpers ───────────────────────────────────────────────────

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const col = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * col).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
