// ============================================================
// Tweakpane UI Setup - BOIDS
// ============================================================

import { Pane } from 'tweakpane';
import {
  canvas, flock, visual, animation, exportSettings,
  aspectRatioOptions, boundaryOptions, shapeOptions, colorModeOptions,
  updateCanvasSize,
} from './state.js';
import { getPresetNames, loadPreset, saveUserPreset, exportCurrentState, importState } from './presets.js';

let pane = null;
let callbacks = {};

/**
 * Set up the Tweakpane panel.
 * @param {HTMLElement} container
 * @param {Object}      cbs
 * @returns {Pane}
 */
export function setupUI(container, cbs) {
  callbacks = cbs;
  if (!container) return null;

  pane = new Pane({ container, title: 'BOIDS' });

  // ---- Presets ----
  const presetFolder = pane.addFolder({ title: 'PRESETS', expanded: true });
  const presetOptions = getPresetNames().reduce((acc, n) => { acc[n] = n; return acc; }, {});
  const presetBinding = { value: '** Default **' };
  presetFolder.addBinding(presetBinding, 'value', { label: 'Load Preset', options: presetOptions })
    .on('change', (ev) => {
      if (loadPreset(ev.value)) {
        callbacks.onFullReset?.();
        pane.refresh();
      }
    });

  presetFolder.addButton({ title: 'Save Preset' }).on('click', () => {
    const name = prompt('Preset name:');
    if (name) saveUserPreset(name);
  });
  presetFolder.addButton({ title: 'Export JSON' }).on('click', () => {
    const blob = new Blob([exportCurrentState()], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `boids-preset-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
  presetFolder.addButton({ title: 'Import JSON' }).on('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (importState(ev.target.result)) {
          callbacks.onFullReset?.();
          pane.refresh();
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });

  // ---- Canvas ----
  const canvasFolder = pane.addFolder({ title: 'CANVAS', expanded: false });
  canvasFolder.addBinding(canvas, 'aspectRatio', {
    label: 'Aspect Ratio',
    options: Object.fromEntries(Object.keys(aspectRatioOptions).map(k => [k, k])),
  }).on('change', () => callbacks.onCanvasChange?.());
  canvasFolder.addBinding(canvas, 'background', { label: 'Background', view: 'color' })
    .on('change', () => callbacks.onParamChange?.());
  canvasFolder.addBinding(canvas, 'trailAlpha', { label: 'Trail Length', min: 0, max: 255, step: 1 })
    .on('change', () => callbacks.onParamChange?.());

  // ---- Flock ----
  const flockFolder = pane.addFolder({ title: 'FLOCK', expanded: true });
  flockFolder.addBinding(flock, 'count', { label: 'Count', min: 10, max: 500, step: 10 })
    .on('change', () => callbacks.onCountChange?.());
  flockFolder.addBinding(flock, 'boundary', { label: 'Boundary', options: boundaryOptions })
    .on('change', () => callbacks.onParamChange?.());

  const forcesFolder = flockFolder.addFolder({ title: 'Forces', expanded: true });
  forcesFolder.addBinding(flock, 'separationRadius', { label: 'Separation R', min: 5,  max: 100, step: 1 })
    .on('change', () => callbacks.onParamChange?.());
  forcesFolder.addBinding(flock, 'separationWeight', { label: 'Separation W', min: 0,  max: 5,   step: 0.1 })
    .on('change', () => callbacks.onParamChange?.());
  forcesFolder.addBinding(flock, 'alignmentRadius',  { label: 'Alignment R',  min: 5,  max: 150, step: 1 })
    .on('change', () => callbacks.onParamChange?.());
  forcesFolder.addBinding(flock, 'alignmentWeight',  { label: 'Alignment W',  min: 0,  max: 5,   step: 0.1 })
    .on('change', () => callbacks.onParamChange?.());
  forcesFolder.addBinding(flock, 'cohesionRadius',   { label: 'Cohesion R',   min: 5,  max: 150, step: 1 })
    .on('change', () => callbacks.onParamChange?.());
  forcesFolder.addBinding(flock, 'cohesionWeight',   { label: 'Cohesion W',   min: 0,  max: 5,   step: 0.1 })
    .on('change', () => callbacks.onParamChange?.());

  const speedFolder = flockFolder.addFolder({ title: 'Speed', expanded: false });
  speedFolder.addBinding(flock, 'maxSpeed', { label: 'Max Speed', min: 0.5, max: 12,  step: 0.5 })
    .on('change', () => callbacks.onParamChange?.());
  speedFolder.addBinding(flock, 'minSpeed', { label: 'Min Speed', min: 0,   max: 5,   step: 0.1 })
    .on('change', () => callbacks.onParamChange?.());
  speedFolder.addBinding(flock, 'maxForce', { label: 'Max Force', min: 0.01, max: 0.8, step: 0.01 })
    .on('change', () => callbacks.onParamChange?.());

  // ---- Visual ----
  const visualFolder = pane.addFolder({ title: 'VISUAL', expanded: true });
  visualFolder.addBinding(visual, 'shape',    { label: 'Shape',   options: shapeOptions })
    .on('change', () => callbacks.onParamChange?.());
  visualFolder.addBinding(visual, 'boidSize', { label: 'Size',    min: 2,  max: 30,  step: 1 })
    .on('change', () => callbacks.onParamChange?.());
  visualFolder.addBinding(visual, 'opacity',  { label: 'Opacity', min: 0.1, max: 1.0, step: 0.05 })
    .on('change', () => callbacks.onParamChange?.());

  const colorFolder = visualFolder.addFolder({ title: 'Color', expanded: true });
  colorFolder.addBinding(visual, 'colorMode', { label: 'Mode', options: colorModeOptions })
    .on('change', () => callbacks.onParamChange?.());
  colorFolder.addBinding(visual, 'color',      { label: 'Color',      view: 'color' })
    .on('change', () => callbacks.onParamChange?.());
  colorFolder.addBinding(visual, 'hueStart',   { label: 'Hue Start',  min: 0,   max: 360, step: 5 })
    .on('change', () => callbacks.onParamChange?.());
  colorFolder.addBinding(visual, 'hueRange',   { label: 'Hue Range',  min: 0,   max: 360, step: 5 })
    .on('change', () => callbacks.onParamChange?.());
  colorFolder.addBinding(visual, 'saturation', { label: 'Saturation', min: 0,   max: 100, step: 5 })
    .on('change', () => callbacks.onParamChange?.());
  colorFolder.addBinding(visual, 'lightness',  { label: 'Lightness',  min: 0,   max: 100, step: 5 })
    .on('change', () => callbacks.onParamChange?.());

  // ---- Export ----
  const exportFolder = pane.addFolder({ title: 'EXPORT', expanded: false });
  exportFolder.addBinding(exportSettings, 'format', {
    label: 'Format',
    options: { 'PNG': 'png', 'WebM Video': 'webm' },
  });
  exportFolder.addBinding(exportSettings, 'scale', { label: 'Scale', min: 1, max: 4, step: 1 });
  exportFolder.addBinding(exportSettings, 'status', { label: 'Status', readonly: true });
  exportFolder.addButton({ title: 'Export' }).on('click', () => callbacks.onExport?.());

  // ---- Actions ----
  const actionsFolder = pane.addFolder({ title: 'ACTIONS', expanded: false });
  actionsFolder.addButton({ title: 'Randomize' }).on('click', () => {
    randomize();
    callbacks.onFullReset?.();
    pane.refresh();
  });
  actionsFolder.addButton({ title: 'Scatter' }).on('click', () => callbacks.onScatter?.());
  actionsFolder.addButton({ title: 'Reset Defaults' }).on('click', () => {
    loadPreset('** Default **');
    callbacks.onFullReset?.();
    pane.refresh();
  });

  return pane;
}

function randomize() {
  flock.count            = Math.floor(Math.random() * 300) + 50;
  flock.separationRadius = Math.floor(Math.random() * 50) + 10;
  flock.alignmentRadius  = Math.floor(Math.random() * 80) + 20;
  flock.cohesionRadius   = Math.floor(Math.random() * 80) + 20;
  flock.separationWeight = +(Math.random() * 3 + 0.5).toFixed(1);
  flock.alignmentWeight  = +(Math.random() * 2 + 0.3).toFixed(1);
  flock.cohesionWeight   = +(Math.random() * 2 + 0.3).toFixed(1);
  flock.maxSpeed         = +(Math.random() * 6 + 2).toFixed(1);
  flock.maxForce         = +(Math.random() * 0.3 + 0.05).toFixed(2);

  visual.hueStart   = Math.floor(Math.random() * 360);
  visual.hueRange   = Math.floor(Math.random() * 200) + 60;
  visual.colorMode  = ['velocity', 'heading', 'palette'][Math.floor(Math.random() * 3)];
  canvas.trailAlpha = Math.floor(Math.random() * 40) + 5;
}

/** @returns {Pane} */
export function refreshUI() {
  if (pane) pane.refresh();
}

export function setStatus(msg) {
  exportSettings.status = msg;
  refreshUI();
}
