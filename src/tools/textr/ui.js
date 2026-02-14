// ============================================================
// UI Setup with Tweakpane - TEXTR Tool
// ============================================================

import { Pane } from 'tweakpane';
import {
  canvas, text, duplication, transform, color, distribution, animation,
  effects, customFont, exportSettings, resolutions, googleFonts,
  duplicationOptions, scaleModeOptions, colorModeOptions, distributionOptions,
  animationOptions, exportFormatOptions, calculateCanvasSize, animState
} from './state.js';
import { presetOptions, loadPreset, exportPreset, randomizeSettings } from './presets.js';

let pane = null;
let callbacks = {};
let mediaHandlers = null;

// Blade references for conditional visibility
let blades = {
  gradientControls: [],
  rainbowControls: [],
  gridControls: [],
  circularControls: [],
  waveControls: [],
  spiralControls: [],
  randomControls: [],
  animControls: [],
  shadowControls: [],
};

export function setupUI(p5Instance, media, cbs) {
  callbacks = cbs;
  mediaHandlers = media;
  
  pane = new Pane({
    container: document.getElementById('pane-container'),
    title: 'TEXTR',
  });
  
  // ========================================
  // PRESETS Section
  // ========================================
  const presetFolder = pane.addFolder({ title: 'PRESETS', expanded: true });
  
  let currentPreset = 'Default';
  
  presetFolder.addBinding({ preset: currentPreset }, 'preset', {
    label: 'Load Preset',
    options: presetOptions,
  }).on('change', (ev) => {
    if (ev.value !== '** User Preset **') {
      loadPreset(ev.value);
      refreshUI();
      callbacks.onTextChange?.();
    }
  });
  
  presetFolder.addButton({ title: 'Randomize' }).on('click', () => {
    randomizeSettings();
    refreshUI();
    callbacks.onTextChange?.();
  });
  
  presetFolder.addButton({ title: 'Export Preset' }).on('click', () => {
    const json = exportPreset();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'txtr-preset.json';
    a.click();
    URL.revokeObjectURL(url);
    setStatus('Preset exported');
  });
  
  presetFolder.addButton({ title: 'Import Preset / Font' }).on('click', () => {
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
  // TEXT Section
  // ========================================
  const textFolder = pane.addFolder({ title: 'TEXT', expanded: true });
  
  textFolder.addBinding(text, 'content', {
    label: 'Content',
  }).on('change', () => callbacks.onTextChange?.());
  
  // Build font options
  const fontOptions = googleFonts.reduce((acc, font) => ({ ...acc, [font]: font }), {});
  if (customFont.loaded) {
    fontOptions[customFont.name] = customFont.name;
  }
  
  textFolder.addBinding(text, 'font', {
    label: 'Font',
    options: fontOptions,
  }).on('change', () => callbacks.onFontChange?.());
  
  textFolder.addBinding(text, 'fontSize', {
    label: 'Font Size',
    min: 10, max: 500, step: 1,
  }).on('change', () => callbacks.onTextChange?.());
  
  textFolder.addBinding(text, 'letterSpacing', {
    label: 'Letter Spacing',
    min: -50, max: 100, step: 1,
  }).on('change', () => callbacks.onTextChange?.());
  
  // ========================================
  // DUPLICATION Section
  // ========================================
  const dupFolder = pane.addFolder({ title: 'DUPLICATION', expanded: true });
  
  dupFolder.addBinding(duplication, 'mode', {
    label: 'Mode',
    options: duplicationOptions,
  }).on('change', () => callbacks.onTextChange?.());
  
  dupFolder.addBinding(duplication, 'count', {
    label: 'Count',
    min: 1, max: 200, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  
  dupFolder.addBinding(duplication, 'spacing', {
    label: 'Spacing',
    min: 0, max: 100, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  
  dupFolder.addBinding(duplication, 'spreadX', {
    label: 'Spread X',
    min: 0, max: 1000, step: 10,
  }).on('change', () => callbacks.onParamChange?.());
  
  dupFolder.addBinding(duplication, 'spreadY', {
    label: 'Spread Y',
    min: 0, max: 1000, step: 10,
  }).on('change', () => callbacks.onParamChange?.());
  
  dupFolder.addBinding(duplication, 'stagger', {
    label: 'Stagger',
    min: 0, max: 100, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  
  // ========================================
  // DISTRIBUTION Section
  // ========================================
  const distFolder = pane.addFolder({ title: 'DISTRIBUTION', expanded: true });
  
  distFolder.addBinding(distribution, 'mode', {
    label: 'Mode',
    options: distributionOptions,
  }).on('change', () => {
    updateVisibility();
    callbacks.onParamChange?.();
  });
  
  // Grid controls
  const gridColsBlade = distFolder.addBinding(distribution, 'gridCols', {
    label: 'Grid Columns',
    min: 1, max: 20, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  blades.gridControls.push(gridColsBlade);
  
  const gridRowsBlade = distFolder.addBinding(distribution, 'gridRows', {
    label: 'Grid Rows',
    min: 1, max: 20, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  blades.gridControls.push(gridRowsBlade);
  
  const gridGapXBlade = distFolder.addBinding(distribution, 'gridGapX', {
    label: 'Grid Gap X',
    min: 0, max: 200, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  blades.gridControls.push(gridGapXBlade);
  
  const gridGapYBlade = distFolder.addBinding(distribution, 'gridGapY', {
    label: 'Grid Gap Y',
    min: 0, max: 200, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  blades.gridControls.push(gridGapYBlade);
  
  // Circular controls
  const circRadiusBlade = distFolder.addBinding(distribution, 'circularRadius', {
    label: 'Radius',
    min: 50, max: 500, step: 10,
  }).on('change', () => callbacks.onParamChange?.());
  blades.circularControls.push(circRadiusBlade);
  
  const circStartBlade = distFolder.addBinding(distribution, 'circularStartAngle', {
    label: 'Start Angle',
    min: 0, max: 360, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  blades.circularControls.push(circStartBlade);
  
  const circEndBlade = distFolder.addBinding(distribution, 'circularEndAngle', {
    label: 'End Angle',
    min: 0, max: 720, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  blades.circularControls.push(circEndBlade);
  
  // Wave controls
  const waveAmpBlade = distFolder.addBinding(distribution, 'waveAmplitude', {
    label: 'Amplitude',
    min: 0, max: 200, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  blades.waveControls.push(waveAmpBlade);
  
  const waveFreqBlade = distFolder.addBinding(distribution, 'waveFrequency', {
    label: 'Frequency',
    min: 0.001, max: 0.1, step: 0.001,
  }).on('change', () => callbacks.onParamChange?.());
  blades.waveControls.push(waveFreqBlade);
  
  // Spiral controls
  const spiralTurnsBlade = distFolder.addBinding(distribution, 'spiralTurns', {
    label: 'Turns',
    min: 0.5, max: 10, step: 0.5,
  }).on('change', () => callbacks.onParamChange?.());
  blades.spiralControls.push(spiralTurnsBlade);
  
  const spiralRadiusBlade = distFolder.addBinding(distribution, 'spiralRadius', {
    label: 'Max Radius',
    min: 100, max: 600, step: 10,
  }).on('change', () => callbacks.onParamChange?.());
  blades.spiralControls.push(spiralRadiusBlade);
  
  // Random controls
  const randomSeedBlade = distFolder.addBinding(distribution, 'randomSeed', {
    label: 'Random Seed',
    min: 1, max: 1000, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  blades.randomControls.push(randomSeedBlade);
  
  // ========================================
  // TRANSFORM Section
  // ========================================
  const transFolder = pane.addFolder({ title: 'TRANSFORM', expanded: false });
  
  transFolder.addBinding(transform, 'offsetX', {
    label: 'Offset X',
    min: -200, max: 200, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  
  transFolder.addBinding(transform, 'offsetY', {
    label: 'Offset Y',
    min: -200, max: 200, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  
  transFolder.addBinding(transform, 'scaleMode', {
    label: 'Scale Mode',
    options: scaleModeOptions,
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
  
  transFolder.addBinding(transform, 'rotationRandom', {
    label: 'Random Rotation',
  }).on('change', () => callbacks.onParamChange?.());
  
  transFolder.addBinding(transform, 'skewX', {
    label: 'Skew X',
    min: -60, max: 60, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  
  transFolder.addBinding(transform, 'skewY', {
    label: 'Skew Y',
    min: -60, max: 60, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  
  // ========================================
  // COLOR Section
  // ========================================
  const colorFolder = pane.addFolder({ title: 'COLOR', expanded: true });
  
  colorFolder.addBinding(color, 'mode', {
    label: 'Mode',
    options: colorModeOptions,
  }).on('change', () => {
    updateVisibility();
    callbacks.onParamChange?.();
  });
  
  const solidBlade = colorFolder.addBinding(color, 'solid', {
    label: 'Color',
    view: 'color',
  }).on('change', () => callbacks.onParamChange?.());
  
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
  
  const rainbowStartBlade = colorFolder.addBinding(color, 'rainbowHueStart', {
    label: 'Hue Start',
    min: 0, max: 360, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  blades.rainbowControls.push(rainbowStartBlade);
  
  const rainbowRangeBlade = colorFolder.addBinding(color, 'rainbowHueRange', {
    label: 'Hue Range',
    min: 0, max: 720, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  blades.rainbowControls.push(rainbowRangeBlade);
  
  colorFolder.addBinding(color, 'fillOpacity', {
    label: 'Fill Opacity',
    min: 0, max: 1, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.());
  
  colorFolder.addBinding(color, 'strokeWeight', {
    label: 'Stroke Weight',
    min: 0, max: 20, step: 0.5,
  }).on('change', () => callbacks.onParamChange?.());
  
  colorFolder.addBinding(color, 'strokeColor', {
    label: 'Stroke Color',
    view: 'color',
  }).on('change', () => callbacks.onParamChange?.());
  
  colorFolder.addBinding(color, 'strokeOpacity', {
    label: 'Stroke Opacity',
    min: 0, max: 1, step: 0.01,
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
    options: animationOptions,
  }).on('change', () => callbacks.onParamChange?.());
  blades.animControls.push(animModeBlade);
  
  const speedBlade = animFolder.addBinding(animation, 'speed', {
    label: 'Speed',
    min: 0, max: 3, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.());
  blades.animControls.push(speedBlade);
  
  const ampBlade = animFolder.addBinding(animation, 'amplitude', {
    label: 'Amplitude',
    min: 0, max: 200, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  blades.animControls.push(ampBlade);
  
  const freqBlade = animFolder.addBinding(animation, 'frequency', {
    label: 'Frequency',
    min: 0.001, max: 0.1, step: 0.001,
  }).on('change', () => callbacks.onParamChange?.());
  blades.animControls.push(freqBlade);
  
  // ========================================
  // EFFECTS Section
  // ========================================
  const effectsFolder = pane.addFolder({ title: 'EFFECTS', expanded: false });
  
  effectsFolder.addBinding(effects, 'shadowEnabled', {
    label: 'Shadow Enabled',
  }).on('change', () => {
    updateVisibility();
    callbacks.onParamChange?.();
  });
  
  const shadowColorBlade = effectsFolder.addBinding(effects, 'shadowColor', {
    label: 'Shadow Color',
    view: 'color',
  }).on('change', () => callbacks.onParamChange?.());
  blades.shadowControls.push(shadowColorBlade);
  
  const shadowBlurBlade = effectsFolder.addBinding(effects, 'shadowBlur', {
    label: 'Shadow Blur',
    min: 0, max: 50, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  blades.shadowControls.push(shadowBlurBlade);
  
  const shadowOffsetXBlade = effectsFolder.addBinding(effects, 'shadowOffsetX', {
    label: 'Shadow Offset X',
    min: -50, max: 50, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  blades.shadowControls.push(shadowOffsetXBlade);
  
  const shadowOffsetYBlade = effectsFolder.addBinding(effects, 'shadowOffsetY', {
    label: 'Shadow Offset Y',
    min: -50, max: 50, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  blades.shadowControls.push(shadowOffsetYBlade);
  
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
  
  exportFolder.addButton({ title: 'Export' }).on('click', () => {
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
  const distMode = distribution.mode;
  const colorMode = color.mode;
  
  // Grid controls
  blades.gridControls.forEach(blade => {
    blade.hidden = distMode !== 'grid';
  });
  
  // Circular controls
  blades.circularControls.forEach(blade => {
    blade.hidden = distMode !== 'circular';
  });
  
  // Wave controls
  blades.waveControls.forEach(blade => {
    blade.hidden = distMode !== 'wave';
  });
  
  // Spiral controls
  blades.spiralControls.forEach(blade => {
    blade.hidden = distMode !== 'spiral';
  });
  
  // Random controls
  blades.randomControls.forEach(blade => {
    blade.hidden = distMode !== 'random';
  });
  
  // Color controls
  blades.gradientControls.forEach(blade => {
    blade.hidden = colorMode !== 'gradient';
  });
  
  blades.rainbowControls.forEach(blade => {
    blade.hidden = colorMode !== 'rainbow';
  });
  
  // Animation controls
  blades.animControls.forEach(blade => {
    blade.hidden = !animation.enabled;
  });
  
  // Shadow controls
  blades.shadowControls.forEach(blade => {
    blade.hidden = !effects.shadowEnabled;
  });
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
