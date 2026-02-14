// ============================================================
// Tweakpane UI Setup - All controls for FLAKE Tool
// ============================================================

import { Pane } from 'tweakpane';
import {
  canvas, grid, shape, pattern, animation, palette, mask, preset, exportSettings,
  ratioOptions, symmetryOptions, shapeTypeOptions,
  scaleModeOptions, fillModeOptions, blendModeOptions,
} from './state.js';
import { getPresetNames, loadPreset, saveUserPreset, exportCurrentState, importState } from './presets.js';

let pane = null;
let callbacks = {};

// Blade references for visibility toggling
let gridFolder, shapeFolder, patternFolder, animationFolder, colorFolder, exportFolder;
let presetSelector;

/**
 * Set up the entire Tweakpane panel
 * @param {Object} cbs - callback functions
 */
export function setupUI(cbs) {
  callbacks = cbs;
  const container = document.getElementById('pane-container');
  if (!container) return;

  pane = new Pane({
    container,
    title: 'FLAKE TOOL',
  });

  // --- Upload Section ---
  const uploadFolder = pane.addFolder({ title: 'UPLOAD', expanded: true });
  
  uploadFolder.addButton({ title: 'Upload SVG Shape' }).on('click', () => {
    triggerFileUpload('.svg');
  });
  
  uploadFolder.addButton({ title: 'Upload Mask Image' }).on('click', () => {
    triggerFileUpload('image/*');
  });

  // --- Presets ---
  const presetFolder = pane.addFolder({ title: 'PRESETS', expanded: true });
  
  const presetNames = getPresetNames();
  const presetOptions = {};
  presetNames.forEach(name => {
    presetOptions[name] = name;
  });
  
  const presetBinding = { value: '** Default **' };
  presetSelector = presetFolder.addBinding(presetBinding, 'value', {
    label: 'Load Preset',
    options: presetOptions,
  }).on('change', (ev) => {
    if (loadPreset(ev.value)) {
      callbacks.onGridChange?.();
      pane.refresh();
    }
  });
  
  presetFolder.addButton({ title: 'Save as User Preset' }).on('click', () => {
    const name = prompt('Enter preset name:');
    if (name) {
      saveUserPreset(name);
      // Update preset list
      presetBinding.value = name;
      presetSelector.options = getPresetNames().reduce((acc, n) => {
        acc[n] = n;
        return acc;
      }, {});
      pane.refresh();
    }
  });
  
  presetFolder.addButton({ title: 'Export JSON' }).on('click', () => {
    const json = exportCurrentState();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flake-preset-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
  
  presetFolder.addButton({ title: 'Import JSON' }).on('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (importState(ev.target.result)) {
            callbacks.onGridChange?.();
            pane.refresh();
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  });

  // --- Grid Settings ---
  gridFolder = pane.addFolder({ title: 'GRID', expanded: true });
  
  gridFolder.addBinding(grid, 'cols', {
    label: 'Columns',
    min: 1, max: 50, step: 1,
  }).on('change', () => callbacks.onGridChange?.());
  
  gridFolder.addBinding(grid, 'rows', {
    label: 'Rows',
    min: 1, max: 50, step: 1,
  }).on('change', () => callbacks.onGridChange?.());
  
  gridFolder.addBinding(grid, 'cellSize', {
    label: 'Cell Size',
    min: 10, max: 200, step: 5,
  }).on('change', () => callbacks.onGridChange?.());
  
  gridFolder.addBinding(grid, 'offsetX', {
    label: 'Offset X',
    min: -200, max: 200, step: 5,
  }).on('change', () => callbacks.onGridChange?.());
  
  gridFolder.addBinding(grid, 'offsetY', {
    label: 'Offset Y',
    min: -200, max: 200, step: 5,
  }).on('change', () => callbacks.onGridChange?.());
  
  gridFolder.addBinding(grid, 'symmetry', {
    label: 'Symmetry',
    options: symmetryOptions,
  }).on('change', () => callbacks.onParamChange?.());
  
  gridFolder.addBinding(grid, 'symmetryCount', {
    label: 'Radial Count',
    min: 3, max: 24, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  
  gridFolder.addBinding(canvas, 'showGrid', {
    label: 'Show Grid',
  }).on('change', () => callbacks.onParamChange?.());

  // --- Shape Settings ---
  shapeFolder = pane.addFolder({ title: 'SHAPE', expanded: true });
  
  shapeFolder.addBinding(shape, 'type', {
    label: 'Type',
    options: shapeTypeOptions,
  }).on('change', () => callbacks.onParamChange?.());
  
  shapeFolder.addBinding(shape, 'size', {
    label: 'Size',
    min: 0.1, max: 1.5, step: 0.05,
  }).on('change', () => callbacks.onParamChange?.());
  
  shapeFolder.addBinding(shape, 'rotation', {
    label: 'Rotation',
    min: 0, max: 360, step: 5,
  }).on('change', () => callbacks.onParamChange?.());
  
  shapeFolder.addBinding(shape, 'rotationAuto', {
    label: 'Auto Rotate',
  }).on('change', () => callbacks.onParamChange?.());
  
  shapeFolder.addBinding(shape, 'rotationSpeed', {
    label: 'Rot Speed',
    min: -2, max: 2, step: 0.1,
  }).on('change', () => callbacks.onParamChange?.());

  // Scale Mode
  shapeFolder.addBinding(shape, 'scaleMode', {
    label: 'Scale Mode',
    options: scaleModeOptions,
  }).on('change', () => callbacks.onParamChange?.());
  
  shapeFolder.addBinding(shape, 'scaleMin', {
    label: 'Scale Min',
    min: 0, max: 1, step: 0.05,
  }).on('change', () => callbacks.onParamChange?.());
  
  shapeFolder.addBinding(shape, 'scaleMax', {
    label: 'Scale Max',
    min: 0, max: 2, step: 0.05,
  }).on('change', () => callbacks.onParamChange?.());
  
  shapeFolder.addBinding(shape, 'scalePower', {
    label: 'Scale Power',
    min: 0.5, max: 5, step: 0.1,
  }).on('change', () => callbacks.onParamChange?.());

  // Fill/Stroke
  shapeFolder.addBinding(shape, 'fillMode', {
    label: 'Fill Mode',
    options: fillModeOptions,
  }).on('change', () => callbacks.onParamChange?.());
  
  shapeFolder.addBinding(shape, 'fillColor', {
    label: 'Fill Color',
    view: 'color',
  }).on('change', () => callbacks.onParamChange?.());
  
  shapeFolder.addBinding(shape, 'fillOpacity', {
    label: 'Fill Opacity',
    min: 0, max: 1, step: 0.05,
  }).on('change', () => callbacks.onParamChange?.());
  
  shapeFolder.addBinding(shape, 'strokeMode', {
    label: 'Stroke Mode',
    options: { 'None': 'none', 'Solid': 'solid', 'Match Fill': 'distance' },
  }).on('change', () => callbacks.onParamChange?.());
  
  shapeFolder.addBinding(shape, 'strokeColor', {
    label: 'Stroke Color',
    view: 'color',
  }).on('change', () => callbacks.onParamChange?.());
  
  shapeFolder.addBinding(shape, 'strokeWeight', {
    label: 'Stroke Weight',
    min: 0, max: 10, step: 0.5,
  }).on('change', () => callbacks.onParamChange?.());
  
  shapeFolder.addBinding(shape, 'blendMode', {
    label: 'Blend Mode',
    options: blendModeOptions,
  }).on('change', () => callbacks.onParamChange?.());

  // --- Pattern/Noise Settings ---
  patternFolder = pane.addFolder({ title: 'PATTERN', expanded: false });
  
  patternFolder.addBinding(pattern, 'enabled', {
    label: 'Enable',
  }).on('change', () => callbacks.onParamChange?.());
  
  patternFolder.addBinding(pattern, 'seed', {
    label: 'Seed',
    min: 1, max: 1000, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  
  patternFolder.addBinding(pattern, 'noiseScale', {
    label: 'Scale',
    min: 0.01, max: 1, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.());
  
  patternFolder.addBinding(pattern, 'noiseIntensity', {
    label: 'Intensity',
    min: 0, max: 1, step: 0.05,
  }).on('change', () => callbacks.onParamChange?.());

  // --- Animation Settings ---
  animationFolder = pane.addFolder({ title: 'ANIMATION', expanded: false });
  
  animationFolder.addBinding(animation, 'enabled', {
    label: 'Enable',
  }).on('change', () => callbacks.onAnimationChange?.());
  
  animationFolder.addBinding(animation, 'playing', {
    label: 'Playing',
  }).on('change', () => callbacks.onAnimationChange?.());
  
  animationFolder.addBinding(animation, 'speed', {
    label: 'Speed',
    min: 0.1, max: 5, step: 0.1,
  }).on('change', () => callbacks.onParamChange?.());
  
  animationFolder.addBinding(animation, 'loopDuration', {
    label: 'Loop (frames)',
    min: 30, max: 600, step: 10,
  }).on('change', () => callbacks.onParamChange?.());
  
  animationFolder.addBinding(animation, 'animateSize', {
    label: 'Animate Size',
  }).on('change', () => callbacks.onParamChange?.());
  
  animationFolder.addBinding(animation, 'animateRotation', {
    label: 'Animate Rot',
  }).on('change', () => callbacks.onParamChange?.());
  
  animationFolder.addBinding(animation, 'animateColor', {
    label: 'Animate Color',
  }).on('change', () => callbacks.onParamChange?.());

  // --- Color Palette ---
  colorFolder = pane.addFolder({ title: 'PALETTE', expanded: false });
  
  // Color pickers for each palette color
  for (let i = 0; i < 5; i++) {
    const colorBinding = { value: palette.colors[i] };
    colorFolder.addBinding(colorBinding, 'value', {
      label: `Color ${i + 1}`,
      view: 'color',
    }).on('change', (ev) => {
      palette.colors[i] = ev.value;
      callbacks.onParamChange?.();
    });
  }
  
  colorFolder.addBinding(canvas, 'background', {
    label: 'Background',
    view: 'color',
  }).on('change', () => callbacks.onParamChange?.());

  // --- Export ---
  exportFolder = pane.addFolder({ title: 'EXPORT', expanded: false });
  
  exportFolder.addBinding(exportSettings, 'format', {
    label: 'Format',
    options: { 
      'PNG': 'png', 
      'SVG': 'svg', 
      'PNG Sequence': 'sequence',
      'WebM Video': 'webm',
      'GIF Animation': 'gif'
    },
  });
  
  exportFolder.addBinding(exportSettings, 'scale', {
    label: 'Scale',
    min: 1, max: 4, step: 1,
  });
  
  exportFolder.addBinding(exportSettings, 'status', {
    label: 'Status',
    readonly: true,
  });
  
  exportFolder.addButton({ title: 'Export' }).on('click', () => {
    callbacks.onExport?.();
  });

  // --- Actions ---
  const actionsFolder = pane.addFolder({ title: 'ACTIONS', expanded: false });
  
  actionsFolder.addButton({ title: 'Randomize All' }).on('click', () => {
    randomizeAll();
    pane.refresh();
    callbacks.onParamChange?.();
  });
  
  actionsFolder.addButton({ title: 'Randomize Colors' }).on('click', () => {
    randomizeColors();
    pane.refresh();
    callbacks.onParamChange?.();
  });
  
  actionsFolder.addButton({ title: 'Reset to Default' }).on('click', () => {
    resetToDefault();
    pane.refresh();
    callbacks.onParamChange?.();
    callbacks.onGridChange?.();
  });
  
  actionsFolder.addButton({ title: 'Toggle Fullscreen' }).on('click', () => {
    toggleFullscreen();
  });

  // Set up keyboard shortcuts
  setupKeyboardShortcuts();
}

/**
 * Trigger file upload dialog
 * @param {string} accept - file types to accept
 */
function triggerFileUpload(accept) {
  const input = document.getElementById('fileInput');
  if (input) {
    input.setAttribute('accept', accept);
    input.click();
  }
}

/**
 * Randomize all parameters
 */
function randomizeAll() {
  // Grid
  grid.cols = Math.floor(Math.random() * 20) + 5;
  grid.rows = Math.floor(Math.random() * 20) + 5;
  grid.cellSize = Math.floor(Math.random() * 60) + 30;
  
  // Shape
  const shapeTypes = Object.keys(shapeTypeOptions);
  shape.type = shapeTypeOptions[shapeTypes[Math.floor(Math.random() * (shapeTypes.length - 1))]]; // Exclude custom
  shape.size = 0.3 + Math.random() * 0.7;
  shape.rotation = Math.floor(Math.random() * 8) * 45;
  
  // Scale mode
  const scaleModes = Object.keys(scaleModeOptions);
  shape.scaleMode = scaleModeOptions[scaleModes[Math.floor(Math.random() * scaleModes.length)]];
  shape.scaleMin = Math.random() * 0.5;
  shape.scaleMax = 0.5 + Math.random() * 1;
  
  // Colors
  randomizeColors();
  
  // Pattern
  pattern.enabled = Math.random() > 0.7;
  pattern.seed = Math.floor(Math.random() * 1000);
  pattern.noiseScale = 0.1 + Math.random() * 0.4;
  
  // Notify
  callbacks.onGridChange?.();
}

/**
 * Randomize palette colors
 */
function randomizeColors() {
  const hue = Math.random() * 360;
  for (let i = 0; i < 5; i++) {
    const h = (hue + i * 30) % 360;
    const s = 50 + Math.random() * 50;
    const l = 40 + Math.random() * 40;
    palette.colors[i] = hslToHex(h, s, l);
  }
}

/**
 * Reset to default settings
 */
function resetToDefault() {
  // Grid defaults
  grid.cols = 12;
  grid.rows = 12;
  grid.cellSize = 60;
  grid.offsetX = 0;
  grid.offsetY = 0;
  grid.symmetry = 'none';
  grid.symmetryCount = 6;
  
  // Shape defaults
  shape.type = 'circle';
  shape.size = 0.8;
  shape.rotation = 0;
  shape.rotationAuto = false;
  shape.scaleMode = 'linear';
  shape.scaleMin = 0.2;
  shape.scaleMax = 1.0;
  shape.fillMode = 'solid';
  shape.fillColor = '#4a9eff';
  shape.strokeMode = 'none';
  
  // Reset pattern
  pattern.enabled = false;
  
  // Reset animation
  animation.enabled = false;
  animation.playing = false;
  
  // Default palette
  palette.colors = ['#4a9eff', '#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf'];
}

/**
 * Toggle fullscreen
 */
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

/**
 * Set up keyboard shortcuts
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Space to play/pause animation
    if (e.code === 'Space' && !e.target.matches('input, textarea')) {
      e.preventDefault();
      animation.playing = !animation.playing;
      pane.refresh();
      callbacks.onAnimationChange?.();
    }
    
    // R to randomize
    if (e.code === 'KeyR' && e.shiftKey) {
      randomizeAll();
      pane.refresh();
      callbacks.onParamChange?.();
    }
    
    // S to export
    if (e.code === 'KeyS' && e.ctrlKey) {
      e.preventDefault();
      callbacks.onExport?.();
    }
  });
}

/**
 * Refresh UI bindings
 */
export function refreshUI() {
  if (pane) pane.refresh();
}

/**
 * Update status text
 * @param {string} status - status message
 */
export function setStatus(status) {
  exportSettings.status = status;
  refreshUI();
}

/**
 * Convert HSL to hex color
 * @param {number} h - hue (0-360)
 * @param {number} s - saturation (0-100)
 * @param {number} l - lightness (0-100)
 * @returns {string} - hex color
 */
function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}


