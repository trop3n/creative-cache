// ============================================================
// Tweakpane UI Setup for REFRACT Tool
// ============================================================

import { Pane } from 'tweakpane';
import { 
  canvas, distortion, processing, animation, exportSettings,
  distortionTypeOptions, displacementSourceOptions, noiseTypeOptions,
  ratioOptions
} from './state.js';
import { presetOptions, loadPreset, saveUserPreset, exportPreset, importPreset, refreshPresetOptions } from './presets.js';

let pane = null;
let callbacks = {};

// Folder references for visibility toggling
let distortionFolder = null;
let displacementSubFolder = null;
let refractionSubFolder = null;
let rippleSubFolder = null;
let waveSubFolder = null;
let pinchSubFolder = null;
let twirlSubFolder = null;
let lensSubFolder = null;
let barrelSubFolder = null;
let processingFolder = null;
let animationFolder = null;

// Blade references for type-specific controls
let displacementBlades = [];
let refractionBlades = [];
let rippleBlades = [];
let waveBlades = [];
let pinchBlades = [];
let twirlBlades = [];
let lensBlades = [];
let barrelBlades = [];

// Status monitor
let statusMonitor = null;

/**
 * Set up the entire Tweakpane panel.
 */
export function setupUI(p, cbs) {
  callbacks = cbs;
  const container = document.getElementById('pane-container');
  if (!container) return;
  
  pane = new Pane({
    container,
    title: 'REFRACT TOOL',
  });
  
  // --- Upload Media Button ---
  pane.addButton({ title: 'Upload Image' }).on('click', () => {
    callbacks.onMediaUpload?.();
  });
  
  // --- PRESETS Tab ---
  const tab = pane.addTab({
    pages: [{ title: 'PRESETS' }, { title: 'SETTINGS' }],
  });
  
  // Presets page
  const presetsPage = tab.pages[0];
  const presetBinding = { value: canvas.preset };
  presetsPage.addBinding(presetBinding, 'value', {
    label: 'Preset',
    options: presetOptions,
  }).on('change', (ev) => {
    canvas.preset = ev.value;
    if (loadPreset(ev.value)) {
      rebuildUI();
      callbacks.onParamChange?.();
    }
  });
  
  presetsPage.addButton({ title: 'Restart Preset' }).on('click', () => {
    if (loadPreset(canvas.preset)) {
      rebuildUI();
      callbacks.onParamChange?.();
    }
  });
  
  const presetActions = presetsPage.addFolder({ title: 'Import / Export', expanded: false });
  presetActions.addButton({ title: 'Export Preset JSON' }).on('click', () => {
    const json = exportPreset();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'refract-preset.json';
    a.click();
    URL.revokeObjectURL(url);
  });
  
  presetActions.addButton({ title: 'Import Preset JSON' }).on('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (importPreset(ev.target.result)) {
          rebuildUI();
          callbacks.onParamChange?.();
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
  
  presetActions.addButton({ title: 'Save as User Preset' }).on('click', () => {
    const name = saveUserPreset();
    canvas.preset = name;
    refreshPresetOptions();
    rebuildUI();
  });
  
  // Settings page
  const settingsPage = tab.pages[1];
  settingsPage.addButton({ title: 'Toggle Fullscreen' }).on('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  });
  
  const browserColorBinding = { value: canvas.windowColor };
  settingsPage.addBinding(browserColorBinding, 'value', {
    label: 'Background Color',
    view: 'color',
  }).on('change', (ev) => {
    canvas.windowColor = ev.value;
    document.body.style.backgroundColor = ev.value;
  });
  
  // --- CANVAS Folder ---
  const canvasFolder = pane.addFolder({ title: 'CANVAS', expanded: false });
  
  canvasFolder.addBinding(canvas, 'ratio', {
    label: 'Aspect Ratio',
    options: ratioOptions,
  }).on('change', () => {
    callbacks.onResize?.();
  });
  
  canvasFolder.addBinding(canvas, 'scale', {
    label: 'Display Scale',
    min: 0.5, max: 1.0, step: 0.01,
  }).on('change', () => {
    callbacks.onResize?.();
  });
  
  canvasFolder.addBinding(canvas, 'transparent', {
    label: 'Transparent BG',
  }).on('change', () => callbacks.onParamChange?.());
  
  canvasFolder.addBinding(canvas, 'backColor', {
    label: 'Background',
    view: 'color',
  }).on('change', () => callbacks.onParamChange?.());
  
  // --- DISTORTION Folder ---
  distortionFolder = pane.addFolder({ title: 'DISTORTION', expanded: true });
  
  distortionFolder.addBinding(distortion, 'enabled', {
    label: 'Enabled',
  }).on('change', () => callbacks.onParamChange?.());
  
  distortionFolder.addBinding(distortion, 'type', {
    label: 'Type',
    options: distortionTypeOptions,
  }).on('change', () => {
    updateDistortionVisibility();
    callbacks.onParamChange?.();
  });
  
  distortionFolder.addBinding(distortion, 'amount', {
    label: 'Amount',
    min: 0, max: 2, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.());
  
  distortionFolder.addBinding(distortion, 'scale', {
    label: 'Pattern Scale',
    min: 0.1, max: 10, step: 0.1,
  }).on('change', () => callbacks.onParamChange?.());
  
  // --- Displacement Map Sub-controls ---
  displacementSubFolder = distortionFolder.addFolder({ title: 'Displacement Settings', expanded: true });
  
  displacementBlades.push(displacementSubFolder.addBinding(distortion.displacement, 'source', {
    label: 'Source',
    options: displacementSourceOptions,
  }).on('change', () => {
    updateDisplacementVisibility();
    callbacks.onParamChange?.();
  }));
  
  displacementBlades.push(displacementSubFolder.addBinding(distortion.displacement, 'noiseType', {
    label: 'Noise Type',
    options: noiseTypeOptions,
  }).on('change', () => callbacks.onParamChange?.()));
  
  displacementBlades.push(displacementSubFolder.addBinding(distortion.displacement, 'intensity', {
    label: 'Intensity',
    min: 0, max: 1, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.()));
  
  displacementBlades.push(displacementSubFolder.addBinding(distortion.displacement, 'offsetX', {
    label: 'Offset X',
    min: -1, max: 1, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.()));
  
  displacementBlades.push(displacementSubFolder.addBinding(distortion.displacement, 'offsetY', {
    label: 'Offset Y',
    min: -1, max: 1, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.()));
  
  displacementBlades.push(displacementSubFolder.addBinding(distortion.displacement, 'animate', {
    label: 'Animate',
  }).on('change', () => callbacks.onAnimationChange?.()));
  
  displacementBlades.push(displacementSubFolder.addBinding(distortion.displacement, 'speed', {
    label: 'Anim Speed',
    min: 0, max: 2, step: 0.1,
  }).on('change', () => callbacks.onAnimationChange?.()));
  
  // --- Refraction Sub-controls ---
  refractionSubFolder = distortionFolder.addFolder({ title: 'Refraction Settings', expanded: true });
  
  refractionBlades.push(refractionSubFolder.addBinding(distortion.refraction, 'index', {
    label: 'Refractive Index',
    min: 1.0, max: 3.0, step: 0.1,
  }).on('change', () => callbacks.onParamChange?.()));
  
  refractionBlades.push(refractionSubFolder.addBinding(distortion.refraction, 'thickness', {
    label: 'Thickness',
    min: 0, max: 1, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.()));
  
  refractionBlades.push(refractionSubFolder.addBinding(distortion.refraction, 'chromaticAberration', {
    label: 'Chromatic Aberration',
    min: 0, max: 0.5, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.()));
  
  // --- Ripple Sub-controls ---
  rippleSubFolder = distortionFolder.addFolder({ title: 'Ripple Settings', expanded: true });
  
  rippleBlades.push(rippleSubFolder.addBinding(distortion.ripple, 'frequency', {
    label: 'Frequency',
    min: 1, max: 50, step: 1,
  }).on('change', () => callbacks.onParamChange?.()));
  
  rippleBlades.push(rippleSubFolder.addBinding(distortion.ripple, 'amplitude', {
    label: 'Amplitude',
    min: 0, max: 0.5, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.()));
  
  rippleBlades.push(rippleSubFolder.addBinding(distortion.ripple, 'centerX', {
    label: 'Center X',
    min: 0, max: 1, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.()));
  
  rippleBlades.push(rippleSubFolder.addBinding(distortion.ripple, 'centerY', {
    label: 'Center Y',
    min: 0, max: 1, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.()));
  
  rippleBlades.push(rippleSubFolder.addBinding(distortion.ripple, 'damping', {
    label: 'Damping',
    min: 0, max: 2, step: 0.1,
  }).on('change', () => callbacks.onParamChange?.()));
  
  // --- Wave Sub-controls ---
  waveSubFolder = distortionFolder.addFolder({ title: 'Wave Settings', expanded: true });
  
  waveBlades.push(waveSubFolder.addBinding(distortion.wave, 'frequencyX', {
    label: 'Freq X',
    min: 0, max: 50, step: 1,
  }).on('change', () => callbacks.onParamChange?.()));
  
  waveBlades.push(waveSubFolder.addBinding(distortion.wave, 'frequencyY', {
    label: 'Freq Y',
    min: 0, max: 50, step: 1,
  }).on('change', () => callbacks.onParamChange?.()));
  
  waveBlades.push(waveSubFolder.addBinding(distortion.wave, 'amplitudeX', {
    label: 'Amp X',
    min: 0, max: 0.2, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.()));
  
  waveBlades.push(waveSubFolder.addBinding(distortion.wave, 'amplitudeY', {
    label: 'Amp Y',
    min: 0, max: 0.2, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.()));
  
  // --- Pinch/Bulge Sub-controls ---
  pinchSubFolder = distortionFolder.addFolder({ title: 'Pinch/Bulge Settings', expanded: true });
  
  pinchBlades.push(pinchSubFolder.addBinding(distortion.pinch, 'strength', {
    label: 'Strength',
    min: -1, max: 1, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.()));
  
  pinchBlades.push(pinchSubFolder.addBinding(distortion.pinch, 'radius', {
    label: 'Radius',
    min: 0.1, max: 1, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.()));
  
  pinchBlades.push(pinchSubFolder.addBinding(distortion.pinch, 'centerX', {
    label: 'Center X',
    min: 0, max: 1, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.()));
  
  pinchBlades.push(pinchSubFolder.addBinding(distortion.pinch, 'centerY', {
    label: 'Center Y',
    min: 0, max: 1, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.()));
  
  // --- Twirl Sub-controls ---
  twirlSubFolder = distortionFolder.addFolder({ title: 'Twirl Settings', expanded: true });
  
  twirlBlades.push(twirlSubFolder.addBinding(distortion.twirl, 'angle', {
    label: 'Angle (degrees)',
    min: -720, max: 720, step: 10,
  }).on('change', () => callbacks.onParamChange?.()));
  
  twirlBlades.push(twirlSubFolder.addBinding(distortion.twirl, 'radius', {
    label: 'Radius',
    min: 0.1, max: 1, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.()));
  
  twirlBlades.push(twirlSubFolder.addBinding(distortion.twirl, 'centerX', {
    label: 'Center X',
    min: 0, max: 1, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.()));
  
  twirlBlades.push(twirlSubFolder.addBinding(distortion.twirl, 'centerY', {
    label: 'Center Y',
    min: 0, max: 1, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.()));
  
  // --- Lens Sub-controls ---
  lensSubFolder = distortionFolder.addFolder({ title: 'Lens Settings', expanded: true });
  
  lensBlades.push(lensSubFolder.addBinding(distortion.lens, 'strength', {
    label: 'Magnification',
    min: -1, max: 2, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.()));
  
  lensBlades.push(lensSubFolder.addBinding(distortion.lens, 'radius', {
    label: 'Radius',
    min: 0.1, max: 1, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.()));
  
  lensBlades.push(lensSubFolder.addBinding(distortion.lens, 'centerX', {
    label: 'Center X',
    min: 0, max: 1, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.()));
  
  lensBlades.push(lensSubFolder.addBinding(distortion.lens, 'centerY', {
    label: 'Center Y',
    min: 0, max: 1, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.()));
  
  // --- Barrel Sub-controls ---
  barrelSubFolder = distortionFolder.addFolder({ title: 'Barrel Settings', expanded: true });
  
  barrelBlades.push(barrelSubFolder.addBinding(distortion.barrel, 'strength', {
    label: 'Strength',
    min: -1, max: 1, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.()));
  
  // --- PROCESSING Folder ---
  processingFolder = pane.addFolder({ title: 'IMAGE PROCESSING', expanded: false });
  
  processingFolder.addBinding(processing, 'brightness', {
    label: 'Brightness',
    min: 0, max: 2, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.());
  
  processingFolder.addBinding(processing, 'contrast', {
    label: 'Contrast',
    min: 0, max: 3, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.());
  
  processingFolder.addBinding(processing, 'saturation', {
    label: 'Saturation',
    min: 0, max: 2, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.());
  
  processingFolder.addBinding(processing, 'hue', {
    label: 'Hue Shift',
    min: -180, max: 180, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  
  processingFolder.addButton({ title: 'Reset Adjustments' }).on('click', () => {
    processing.brightness = 1.0;
    processing.contrast = 1.0;
    processing.saturation = 1.0;
    processing.hue = 0;
    pane.refresh();
    callbacks.onParamChange?.();
  });
  
  // --- ANIMATION Folder ---
  animationFolder = pane.addFolder({ title: 'ANIMATION', expanded: false });
  
  animationFolder.addBinding(animation, 'enabled', {
    label: 'Enabled',
  }).on('change', () => callbacks.onAnimationChange?.());
  
  animationFolder.addBinding(animation, 'playing', {
    label: 'Playing',
  }).on('change', () => callbacks.onAnimationChange?.());
  
  animationFolder.addBinding(animation, 'speed', {
    label: 'Speed',
    min: 0.1, max: 3, step: 0.1,
  }).on('change', () => callbacks.onAnimationChange?.());
  
  // --- EXPORT Folder ---
  const exportFolder = pane.addFolder({ title: 'EXPORT', expanded: false });
  
  statusMonitor = exportFolder.addBinding(exportSettings, 'status', {
    label: 'Status',
    readonly: true,
  });
  
  exportFolder.addBinding(exportSettings, 'format', {
    label: 'Format',
    options: { 'PNG': 'png', 'JPG': 'jpg', 'WebP': 'webp' },
  });
  
  exportFolder.addBinding(exportSettings, 'quality', {
    label: 'Quality',
    min: 0.1, max: 1, step: 0.05,
  });
  
  exportFolder.addBinding(exportSettings, 'scale', {
    label: 'Export Scale',
    options: { '1x': 1, '2x': 2, '3x': 3, '4x': 4 },
  });
  
  // --- Export Button ---
  pane.addButton({ title: 'Export Image' }).on('click', () => {
    callbacks.onExport?.();
  });
  
  // Set initial visibility
  updateDistortionVisibility();
  
  // Listen for preset imports via drag-drop
  window.addEventListener('refract-import-preset', (e) => {
    const json = JSON.stringify(e.detail);
    if (importPreset(json)) {
      rebuildUI();
      callbacks.onParamChange?.();
    }
  });
}

/**
 * Refresh all pane bindings.
 */
export function refreshUI() {
  if (pane) pane.refresh();
}

/**
 * Set status message.
 */
export function setStatus(status) {
  exportSettings.status = status;
  refreshUI();
}

/**
 * Full UI rebuild after preset load.
 */
function rebuildUI() {
  updateDistortionVisibility();
  if (pane) pane.refresh();
}

/**
 * Show/hide distortion sub-controls based on current type.
 */
function updateDistortionVisibility() {
  const type = distortion.type;
  const enabled = distortion.enabled;
  
  // Hide all sub-folders first
  setFolderHidden(displacementSubFolder, true);
  setFolderHidden(refractionSubFolder, true);
  setFolderHidden(rippleSubFolder, true);
  setFolderHidden(waveSubFolder, true);
  setFolderHidden(pinchSubFolder, true);
  setFolderHidden(twirlSubFolder, true);
  setFolderHidden(lensSubFolder, true);
  setFolderHidden(barrelSubFolder, true);
  
  if (!enabled) return;
  
  // Show relevant sub-folder
  switch (type) {
    case 'displacement':
      setFolderHidden(displacementSubFolder, false);
      updateDisplacementVisibility();
      break;
    case 'refraction':
      setFolderHidden(refractionSubFolder, false);
      break;
    case 'ripple':
      setFolderHidden(rippleSubFolder, false);
      break;
    case 'wave':
      setFolderHidden(waveSubFolder, false);
      break;
    case 'pinch':
      setFolderHidden(pinchSubFolder, false);
      break;
    case 'twirl':
      setFolderHidden(twirlSubFolder, false);
      break;
    case 'lens':
      setFolderHidden(lensSubFolder, false);
      break;
    case 'barrel':
      setFolderHidden(barrelSubFolder, false);
      break;
  }
}

/**
 * Show/hide displacement source-specific controls.
 */
function updateDisplacementVisibility() {
  const source = distortion.displacement.source;
  const showNoise = source === 'noise';
  
  // Find the noise type blade and show/hide
  displacementBlades.forEach(blade => {
    if (blade.label === 'Noise Type') {
      blade.hidden = !showNoise;
    }
  });
}

/**
 * Helper to show/hide a folder.
 */
function setFolderHidden(folder, hidden) {
  if (!folder) return;
  folder.hidden = hidden;
}
