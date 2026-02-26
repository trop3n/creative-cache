// ============================================================
// REFRACT Tool — UI (Tweakpane v4)
// ============================================================

import { Pane } from 'tweakpane';
import {
  canvas, options, transform, refract, animation, exportSettings,
  textureWrapOptions, backgroundOptions,
  displaceTypeOptions, refractTypeOptions,
} from './state.js';
import { loadPreset, saveUserPreset, refreshPresetOptions, presetOptions } from './presets.js';

let pane = null;
let cbs  = {};

// Folder refs for show/hide
let boxFolder   = null;
let flowFolder  = null;
let sineFolder  = null;
let gridFolder  = null;
let colorPicker = null;  // canvas color blade

/**
 * Build the entire Tweakpane panel.
 * @param {HTMLElement} container
 * @param {Object}      callbacks  — { onParamChange, onRefractChange, onCanvasChange,
 *                                     onAnimationChange, onBrowserColor,
 *                                     onMediaUpload, onExport }
 */
export function setupUI(container, callbacks) {
  cbs = callbacks;
  if (!container) return null;

  pane = new Pane({ container, title: 'REFRACT' });

  // Upload button (outside tabs)
  pane.addButton({ title: 'Upload Image' }).on('click', () => cbs.onMediaUpload?.());

  // ── Tabs ────────────────────────────────────────────────────
  const tabs = pane.addTab({ pages: [{ title: 'MAIN' }, { title: 'EXPORT' }, { title: 'OPTIONS' }] });
  const [mainPage, exportPage, optionsPage] = tabs.pages;

  buildMain(mainPage);
  buildExport(exportPage);
  buildOptions(optionsPage);

  updateDisplaceVisibility();
  updateRefractVisibility();
  updateColorPickerVisibility();

  return pane;
}

/**
 * Refresh all bindings (call after preset load).
 */
export function refreshUI() {
  if (pane) pane.refresh();
}

// ── MAIN page ────────────────────────────────────────────────

function buildMain(page) {
  // Preset dropdown
  const presetProxy = { value: canvas.preset };
  page.addBinding(presetProxy, 'value', { label: 'Preset', options: presetOptions })
    .on('change', (ev) => {
      canvas.preset = ev.value;
      if (loadPreset(ev.value)) {
        refreshUI();
        updateDisplaceVisibility();
        updateRefractVisibility();
        updateColorPickerVisibility();
        cbs.onRefractChange?.();
      }
    });

  page.addButton({ title: 'Save User Preset' }).on('click', () => {
    const name = saveUserPreset();
    canvas.preset = name;
    refreshPresetOptions();
    refreshUI();
  });

  page.addBlade({ view: 'separator' });

  // Canvas settings
  page.addBinding(canvas, 'textureWrap', { label: 'Texture Wrap', options: textureWrapOptions })
    .on('change', () => cbs.onParamChange?.());

  page.addBinding(canvas, 'contentScaleX', { label: 'Content Scale X', min: 0.1, max: 4.0, step: 0.01 })
    .on('change', () => cbs.onParamChange?.());

  page.addBinding(canvas, 'contentScaleY', { label: 'Content Scale Y', min: 0.1, max: 4.0, step: 0.01 })
    .on('change', () => cbs.onParamChange?.());

  page.addBinding(canvas, 'background', { label: 'Background', options: backgroundOptions })
    .on('change', () => { updateColorPickerVisibility(); cbs.onParamChange?.(); });

  colorPicker = page.addBinding(canvas, 'canvasColor', { label: 'Canvas Color', view: 'color' })
    .on('change', () => cbs.onParamChange?.());

  page.addBlade({ view: 'separator' });

  // ── TRANSFORM FILTERS folder ──
  const transformFolder = page.addFolder({ title: 'TRANSFORM FILTERS', expanded: true });

  transformFolder.addBinding(transform, 'displaceType', { label: 'Displace Type', options: displaceTypeOptions })
    .on('change', () => { updateDisplaceVisibility(); cbs.onParamChange?.(); });

  transformFolder.addBinding(transform, 'seed', { label: 'Noise Seed', min: 0, max: 9999, step: 1 })
    .on('change', () => cbs.onParamChange?.());

  // Box sub-folder
  boxFolder = transformFolder.addFolder({ title: 'Box Settings', expanded: true });
  addAxisControls(boxFolder, transform.box.x, 'X Axis', { hasFreq: true });
  addAxisControls(boxFolder, transform.box.y, 'Y Axis', { hasFreq: true });

  // Flow sub-folder
  flowFolder = transformFolder.addFolder({ title: 'Flow Settings', expanded: true });
  flowFolder.addBinding(transform.flow, 'complexity', { label: 'Complexity', min: 1, max: 8, step: 1 })
    .on('change', () => cbs.onParamChange?.());
  flowFolder.addBinding(transform.flow, 'frequency', { label: 'Frequency', min: 0.1, max: 50.0, step: 0.1 })
    .on('change', () => cbs.onParamChange?.());
  addAxisControls(flowFolder, transform.flow.x, 'X Axis', { hasFreq: false });
  addAxisControls(flowFolder, transform.flow.y, 'Y Axis', { hasFreq: false });

  // Sine sub-folder
  sineFolder = transformFolder.addFolder({ title: 'Sine Settings', expanded: true });
  addAxisControls(sineFolder, transform.sine.x, 'X Axis', { hasFreq: true });
  addAxisControls(sineFolder, transform.sine.y, 'Y Axis', { hasFreq: true });

  // Animation toggle
  transformFolder.addBinding(animation, 'playing', { label: 'Animate' })
    .on('change', () => cbs.onAnimationChange?.());

  page.addBlade({ view: 'separator' });

  // ── REFRACT FILTER folder ──
  const refractFolder = page.addFolder({ title: 'REFRACT FILTER', expanded: true });

  refractFolder.addBinding(refract, 'type', { label: 'Refract Type', options: refractTypeOptions })
    .on('change', () => { updateRefractVisibility(); cbs.onRefractChange?.(); });

  gridFolder = refractFolder.addFolder({ title: 'Grid Settings', expanded: true });
  gridFolder.addBinding(refract.grid.x, 'skewLevel',  { label: 'X Skew Level',  min: 0, max: 5.0, step: 0.01 })
    .on('change', () => cbs.onParamChange?.());
  gridFolder.addBinding(refract.grid.x, 'gridAmount', { label: 'X Grid Amount', min: 1, max: 80, step: 1 })
    .on('change', () => cbs.onParamChange?.());
  gridFolder.addBinding(refract.grid.y, 'skewLevel',  { label: 'Y Skew Level',  min: 0, max: 5.0, step: 0.01 })
    .on('change', () => cbs.onParamChange?.());
  gridFolder.addBinding(refract.grid.y, 'gridAmount', { label: 'Y Grid Amount', min: 1, max: 80, step: 1 })
    .on('change', () => cbs.onParamChange?.());
}

// ── EXPORT page ──────────────────────────────────────────────

function buildExport(page) {
  page.addBinding(exportSettings, 'status',  { label: 'Status', readonly: true });
  page.addBinding(exportSettings, 'format',  { label: 'Format',  options: { PNG: 'png', JPG: 'jpg', WebP: 'webp' } });
  page.addBinding(exportSettings, 'quality', { label: 'Quality', min: 0.1, max: 1.0, step: 0.05 });
  page.addBinding(exportSettings, 'scale',   { label: 'Scale',   options: { '1×': 1, '2×': 2, '3×': 3, '4×': 4 } });
  page.addButton({ title: 'Export Image' }).on('click', () => cbs.onExport?.());
}

// ── OPTIONS page ─────────────────────────────────────────────

function buildOptions(page) {
  page.addBinding(options, 'margin', {
    label: 'Canvas Margins', min: 0, max: 120, step: 4,
  }).on('change', () => cbs.onCanvasChange?.());

  page.addBinding(options, 'browserColor', { label: 'Browser Color', view: 'color' })
    .on('change', () => cbs.onBrowserColor?.());

  page.addBinding(options, 'maxImageSize', {
    label: 'Max Image Size', min: 1024, max: 4096, step: 128,
  }).on('change', () => cbs.onCanvasChange?.());
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Add Amplify, [Frequency], Speed bindings for one axis sub-object.
 */
function addAxisControls(folder, axisObj, label, { hasFreq }) {
  const sub = folder.addFolder({ title: label, expanded: true });
  sub.addBinding(axisObj, 'amplify',   { label: 'Amplify',   min: 0, max: 30.0, step: 0.1 })
    .on('change', () => cbs.onParamChange?.());
  if (hasFreq) {
    sub.addBinding(axisObj, 'frequency', { label: 'Frequency', min: 0.1, max: 60.0, step: 0.1 })
      .on('change', () => cbs.onParamChange?.());
  }
  sub.addBinding(axisObj, 'speed',     { label: 'Speed',     min: 0, max: 60.0, step: 0.5 })
    .on('change', () => cbs.onParamChange?.());
}

function updateDisplaceVisibility() {
  if (!boxFolder) return;
  const t = transform.displaceType;
  boxFolder.hidden  = t !== 'box';
  flowFolder.hidden = t !== 'flow';
  sineFolder.hidden = t !== 'sine';
}

function updateRefractVisibility() {
  if (!gridFolder) return;
  gridFolder.hidden = refract.type !== 'grid';
}

function updateColorPickerVisibility() {
  if (!colorPicker) return;
  colorPicker.hidden = canvas.background !== 'custom';
}
