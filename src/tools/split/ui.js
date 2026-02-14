import { Pane } from 'tweakpane';
import {
  canvas, shape, duplication, transform, animation, split, color, interactive,
  shapeOptions, splitOptions, animOptions, resolutions, exportFormatOptions,
  calculateCanvasSize, animState, exportSettings
} from './state.js';
import { presetOptions, loadPreset, exportPreset, randomizeSettings } from './presets.js';

// ============================================================
// UI Setup with Tweakpane
// ============================================================

let pane = null;
let callbacks = {};
let mediaHandlers = null;

// Blade references for conditional visibility
let blades = {
  animControls: [],
  gradientControls: [],
  splitGap: null,
};

export function setupUI(p5Instance, media, cbs) {
  callbacks = cbs;
  mediaHandlers = media;
  
  pane = new Pane({
    container: document.getElementById('pane-container'),
    title: 'SPLITX',
  });
  
  // ========================================
  // PRESETS Section
  // ========================================
  const presetFolder = pane.addFolder({ title: 'PRESETS', expanded: true });
  
  let currentPreset = 'Hypnotic Rings';
  
  presetFolder.addBinding({ preset: currentPreset }, 'preset', {
    label: 'Load Preset',
    options: presetOptions,
  }).on('change', (ev) => {
    if (ev.value !== '** User Preset **') {
      loadPreset(ev.value);
      refreshUI();
      callbacks.onParamChange?.();
    }
  });
  
  presetFolder.addButton({ title: 'Randomize' }).on('click', () => {
    randomizeSettings();
    refreshUI();
    callbacks.onParamChange?.();
  });
  
  presetFolder.addButton({ title: 'Export Preset' }).on('click', () => {
    const json = exportPreset();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'splitx-preset.json';
    a.click();
    URL.revokeObjectURL(url);
    setStatus('Preset exported');
  });
  
  presetFolder.addButton({ title: 'Import Preset / SVG' }).on('click', () => {
    mediaHandlers?.triggerFileSelect();
  });
  
  // ========================================
  // CANVAS Section
  // ========================================
  const canvasFolder = pane.addFolder({ title: 'CANVAS', expanded: true });
  
  canvasFolder.addBinding(canvas, 'ratio', {
    label: 'Aspect Ratio',
    options: Object.keys(resolutions).reduce((acc, r) => ({ ...acc, [r]: r }), {}),
  }).on('change', () => {
    callbacks.onResize?.();
  });
  
  canvasFolder.addBinding(canvas, 'scale', {
    label: 'Display Scale',
    min: 0.5, max: 1, step: 0.05,
  }).on('change', () => {
    callbacks.onResize?.();
  });
  
  canvasFolder.addBinding(canvas, 'background', {
    label: 'Background',
    view: 'color',
  }).on('change', () => callbacks.onParamChange?.());
  
  // ========================================
  // SHAPE Section
  // ========================================
  const shapeFolder = pane.addFolder({ title: 'SHAPE', expanded: true });
  
  shapeFolder.addBinding(shape, 'type', {
    label: 'Shape Type',
    options: shapeOptions,
  }).on('change', () => callbacks.onParamChange?.());
  
  shapeFolder.addBinding(shape, 'size', {
    label: 'Size',
    min: 5, max: 300, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  
  shapeFolder.addBinding(shape, 'strokeWeight', {
    label: 'Stroke Weight',
    min: 0, max: 20, step: 0.5,
  }).on('change', () => callbacks.onParamChange?.());
  
  shapeFolder.addBinding(shape, 'strokeColor', {
    label: 'Stroke Color',
    view: 'color',
  }).on('change', () => callbacks.onParamChange?.());
  
  shapeFolder.addBinding(shape, 'fillColor', {
    label: 'Fill Color',
    view: 'color',
  }).on('change', () => callbacks.onParamChange?.());
  
  shapeFolder.addBinding(shape, 'fillOpacity', {
    label: 'Fill Opacity',
    min: 0, max: 1, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.());
  
  shapeFolder.addBinding(shape, 'strokeOpacity', {
    label: 'Stroke Opacity',
    min: 0, max: 1, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.());
  
  // ========================================
  // DUPLICATION Section
  // ========================================
  const dupFolder = pane.addFolder({ title: 'DUPLICATION', expanded: true });
  
  dupFolder.addBinding(duplication, 'count', {
    label: 'Count',
    min: 1, max: 200, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  
  dupFolder.addBinding(duplication, 'spacing', {
    label: 'Spacing',
    min: 0, max: 100, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  
  dupFolder.addBinding(duplication, 'spread', {
    label: 'Spread',
    min: 0, max: 800, step: 10,
  }).on('change', () => callbacks.onParamChange?.());
  
  // ========================================
  // TRANSFORM Section
  // ========================================
  const transFolder = pane.addFolder({ title: 'TRANSFORM', expanded: false });
  
  transFolder.addBinding(transform, 'offsetX', {
    label: 'Offset X',
    min: -100, max: 100, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  
  transFolder.addBinding(transform, 'offsetY', {
    label: 'Offset Y',
    min: -100, max: 100, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  
  transFolder.addBinding(transform, 'scaleMin', {
    label: 'Scale Min',
    min: 0.1, max: 3, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.());
  
  transFolder.addBinding(transform, 'scaleMax', {
    label: 'Scale Max',
    min: 0.1, max: 3, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.());
  
  transFolder.addBinding(transform, 'rotation', {
    label: 'Base Rotation',
    min: -180, max: 180, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  
  transFolder.addBinding(transform, 'rotationStep', {
    label: 'Rotation Step',
    min: -90, max: 90, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  
  // ========================================
  // ANIMATION Section
  // ========================================
  const animFolder = pane.addFolder({ title: 'ANIMATION', expanded: true });
  
  animFolder.addBinding(animation, 'enabled', {
    label: 'Enabled',
  }).on('change', (ev) => {
    updateVisibility();
    callbacks.onAnimationChange?.(ev.value);
  });
  
  const animModeBlade = animFolder.addBinding(animation, 'mode', {
    label: 'Mode',
    options: animOptions,
  }).on('change', () => callbacks.onParamChange?.());
  blades.animControls.push(animModeBlade);
  
  const speedBlade = animFolder.addBinding(animation, 'speed', {
    label: 'Speed',
    min: 0, max: 3, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.());
  blades.animControls.push(speedBlade);
  
  const ampBlade = animFolder.addBinding(animation, 'amplitude', {
    label: 'Amplitude',
    min: 0, max: 300, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  blades.animControls.push(ampBlade);
  
  const freqBlade = animFolder.addBinding(animation, 'frequency', {
    label: 'Frequency',
    min: 0.001, max: 0.1, step: 0.001,
  }).on('change', () => callbacks.onParamChange?.());
  blades.animControls.push(freqBlade);
  
  // ========================================
  // SPLIT Section
  // ========================================
  const splitFolder = pane.addFolder({ title: 'SPLIT', expanded: true });
  
  splitFolder.addBinding(split, 'mode', {
    label: 'Mirror Mode',
    options: splitOptions,
  }).on('change', () => {
    updateVisibility();
    callbacks.onParamChange?.();
  });
  
  blades.splitGap = splitFolder.addBinding(split, 'gap', {
    label: 'Gap',
    min: 0, max: 100, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  
  // ========================================
  // COLOR Section
  // ========================================
  const colorFolder = pane.addFolder({ title: 'COLOR', expanded: false });
  
  colorFolder.addBinding(color, 'useGradient', {
    label: 'Use Gradient',
  }).on('change', () => {
    updateVisibility();
    callbacks.onParamChange?.();
  });
  
  const gradStartBlade = colorFolder.addBinding(color, 'gradientStart', {
    label: 'Gradient Start',
    view: 'color',
  }).on('change', () => callbacks.onParamChange?.());
  blades.gradientControls.push(gradStartBlade);
  
  const gradEndBlade = colorFolder.addBinding(color, 'gradientEnd', {
    label: 'Gradient End',
    view: 'color',
  }).on('change', () => callbacks.onParamChange?.());
  blades.gradientControls.push(gradEndBlade);
  
  colorFolder.addBinding(color, 'hueShift', {
    label: 'Hue Shift',
  }).on('change', () => callbacks.onParamChange?.());
  
  const hueSpeedBlade = colorFolder.addBinding(color, 'hueSpeed', {
    label: 'Hue Speed',
    min: 0, max: 2, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.());
  blades.gradientControls.push(hueSpeedBlade);
  
  // ========================================
  // INTERACTIVE Section
  // ========================================
  const intFolder = pane.addFolder({ title: 'INTERACTIVE', expanded: false });
  
  intFolder.addBinding(interactive, 'posX', {
    label: 'Position X',
    min: -400, max: 400, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  
  intFolder.addBinding(interactive, 'posY', {
    label: 'Position Y',
    min: -400, max: 400, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  
  intFolder.addBinding(interactive, 'transition', {
    label: 'Transition',
    min: -200, max: 200, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  
  intFolder.addBinding(interactive, 'canvasScale', {
    label: 'Canvas Scale',
    min: 0.1, max: 3, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.());
  
  intFolder.addBinding(interactive, 'canvasRotation', {
    label: 'Canvas Rotation',
    min: -180, max: 180, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  
  // ========================================
  // EXPORT Section
  // ========================================
  const exportFolder = pane.addFolder({ title: 'EXPORT', expanded: false });
  
  exportFolder.addBinding(exportSettings, 'format', {
    label: 'Format',
    options: exportFormatOptions,
  });
  
  exportFolder.addBinding(exportSettings, 'scale', {
    label: 'Scale',
    min: 1, max: 4, step: 0.5,
  });
  
  exportFolder.addBinding(exportSettings, 'fps', {
    label: 'FPS',
    min: 15, max: 60, step: 1,
  });
  
  exportFolder.addBinding(exportSettings, 'duration', {
    label: 'Duration (sec)',
    min: 1, max: 10, step: 0.5,
  });
  
  exportFolder.addButton({ title: 'Export Image/Video' }).on('click', () => {
    callbacks.onExport?.();
  });
  
  // Status indicator
  exportFolder.addBinding(exportSettings, 'status', {
    label: 'Status',
    readonly: true,
  });
  
  // Initial visibility update
  updateVisibility();
}

function updateVisibility() {
  // Animation controls
  blades.animControls.forEach(blade => {
    blade.hidden = !animation.enabled;
  });
  
  // Gradient controls
  blades.gradientControls.forEach(blade => {
    blade.hidden = !color.useGradient;
  });
  
  // Split gap only visible when split mode is active
  if (blades.splitGap) {
    blades.splitGap.hidden = split.mode === 'none';
  }
}

export function refreshUI() {
  if (pane) {
    pane.refresh();
    updateVisibility();
  }
}

export function setStatus(status) {
  exportSettings.status = status;
  refreshUI();
}

export function getPane() {
  return pane;
}
