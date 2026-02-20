// ============================================================
// Tweakpane UI Setup - RhythmGenerator
// ============================================================

import { Pane } from 'tweakpane';
import {
  canvas, waveform, colorPalette, animation, effects, composition, exportSettings,
  waveformModeOptions, symmetryOptions, colorModeOptions, gradientModeOptions,
  generatePalette, resetToDefaults,
} from './state.js';
import { getPresetNames, loadPreset, saveUserPreset, exportCurrentState, importState } from './presets.js';

let pane = null;
let callbacks = {};

/**
 * Set up the entire Tweakpane panel
 * @param {HTMLElement} container - pane container element
 * @param {Object} cbs - callback functions
 * @returns {Pane}
 */
export function setupUI(container, cbs) {
  callbacks = cbs;
  if (!container) return null;

  pane = new Pane({
    container,
    title: 'RITM GENERATOR',
  });

  // --- Presets ---
  const presetFolder = pane.addFolder({ title: 'PRESETS', expanded: true });
  
  const presetOptions = getPresetNames().reduce((acc, name) => {
    acc[name] = name;
    return acc;
  }, {});
  
  const presetBinding = { value: '** Default **' };
  presetFolder.addBinding(presetBinding, 'value', {
    label: 'Load Preset',
    options: presetOptions,
  }).on('change', (ev) => {
    if (loadPreset(ev.value)) {
      generatePalette();
      callbacks.onSettingsChange?.();
      pane.refresh();
    }
  });
  
  presetFolder.addButton({ title: 'Save User Preset' }).on('click', () => {
    const name = prompt('Enter preset name:');
    if (name) {
      saveUserPreset(name);
      callbacks.onSettingsChange?.();
    }
  });
  
  presetFolder.addButton({ title: 'Export JSON' }).on('click', () => {
    const json = exportCurrentState();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ritm-preset-${Date.now()}.json`;
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
            generatePalette();
            callbacks.onSettingsChange?.();
            pane.refresh();
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  });

  // --- Canvas Settings ---
  const canvasFolder = pane.addFolder({ title: 'CANVAS', expanded: false });
  
  canvasFolder.addBinding(canvas, 'aspectRatio', {
    label: 'Aspect Ratio',
    options: {
      '1:1': '1:1',
      '4:3': '4:3',
      '16:9': '16:9',
      '2:1': '2:1',
      '3:4': '3:4',
      '9:16': '9:16',
    },
  }).on('change', () => {
    callbacks.onCanvasChange?.();
  });
  
  canvasFolder.addBinding(canvas, 'background', {
    label: 'Background',
    view: 'color',
  }).on('change', () => callbacks.onParamChange?.());

  // --- Waveform Settings ---
  const waveformFolder = pane.addFolder({ title: 'WAVEFORM', expanded: true });
  
  waveformFolder.addBinding(waveform, 'mode', {
    label: 'Mode',
    options: waveformModeOptions,
  }).on('change', () => callbacks.onParamChange?.());
  
  waveformFolder.addBinding(waveform, 'count', {
    label: 'Line Count',
    min: 1, max: 100, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  
  waveformFolder.addBinding(waveform, 'spacing', {
    label: 'Spacing',
    min: 1, max: 50, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  
  waveformFolder.addBinding(waveform, 'amplitude', {
    label: 'Amplitude',
    min: 0, max: 300, step: 5,
  }).on('change', () => callbacks.onParamChange?.());
  
  waveformFolder.addBinding(waveform, 'frequency', {
    label: 'Frequency',
    min: 0.001, max: 0.1, step: 0.001,
  }).on('change', () => callbacks.onParamChange?.());
  
  waveformFolder.addBinding(waveform, 'speed', {
    label: 'Speed',
    min: 0, max: 5, step: 0.1,
  }).on('change', () => callbacks.onParamChange?.());
  
  waveformFolder.addBinding(waveform, 'phaseOffset', {
    label: 'Phase Offset',
    min: 0, max: 1, step: 0.05,
  }).on('change', () => callbacks.onParamChange?.());
  
  waveformFolder.addBinding(waveform, 'symmetry', {
    label: 'Symmetry',
    options: symmetryOptions,
  }).on('change', () => callbacks.onParamChange?.());

  // Noise settings (only for noise mode)
  const noiseFolder = waveformFolder.addFolder({ title: 'Noise Settings', expanded: false });
  
  noiseFolder.addBinding(waveform, 'noiseScale', {
    label: 'Scale',
    min: 0.0001, max: 0.05, step: 0.0001,
  }).on('change', () => callbacks.onParamChange?.());
  
  noiseFolder.addBinding(waveform, 'noiseOctaves', {
    label: 'Octaves',
    min: 1, max: 8, step: 1,
  }).on('change', () => callbacks.onParamChange?.());
  
  noiseFolder.addBinding(waveform, 'noisePersistence', {
    label: 'Persistence',
    min: 0, max: 1, step: 0.05,
  }).on('change', () => callbacks.onParamChange?.());

  // Style settings
  const styleFolder = waveformFolder.addFolder({ title: 'Line Style', expanded: false });
  
  styleFolder.addBinding(waveform, 'strokeWeight', {
    label: 'Weight',
    min: 0.5, max: 10, step: 0.5,
  }).on('change', () => callbacks.onParamChange?.());
  
  styleFolder.addBinding(waveform, 'strokeOpacity', {
    label: 'Opacity',
    min: 0.1, max: 1, step: 0.05,
  }).on('change', () => callbacks.onParamChange?.());
  
  styleFolder.addBinding(waveform, 'resolution', {
    label: 'Resolution',
    min: 1, max: 10, step: 1,
  }).on('change', () => callbacks.onParamChange?.());

  // --- Color Settings ---
  const colorFolder = pane.addFolder({ title: 'COLOR', expanded: true });
  
  colorFolder.addBinding(colorPalette, 'mode', {
    label: 'Mode',
    options: colorModeOptions,
  }).on('change', () => {
    generatePalette();
    callbacks.onParamChange?.();
  });
  
  colorFolder.addBinding(colorPalette, 'hueStart', {
    label: 'Hue Start',
    min: 0, max: 360, step: 5,
  }).on('change', () => {
    generatePalette();
    callbacks.onParamChange?.();
  });
  
  colorFolder.addBinding(colorPalette, 'hueRange', {
    label: 'Hue Range',
    min: 0, max: 360, step: 5,
  }).on('change', () => {
    generatePalette();
    callbacks.onParamChange?.();
  });
  
  colorFolder.addBinding(colorPalette, 'saturation', {
    label: 'Saturation',
    min: 0, max: 100, step: 5,
  }).on('change', () => {
    generatePalette();
    callbacks.onParamChange?.();
  });
  
  colorFolder.addBinding(colorPalette, 'lightness', {
    label: 'Lightness',
    min: 0, max: 100, step: 5,
  }).on('change', () => {
    generatePalette();
    callbacks.onParamChange?.();
  });
  
  colorFolder.addBinding(colorPalette, 'gradientMode', {
    label: 'Gradient',
    options: gradientModeOptions,
  }).on('change', () => callbacks.onParamChange?.());
  
  colorFolder.addBinding(colorPalette, 'cycleEnabled', {
    label: 'Animate Colors',
  }).on('change', () => callbacks.onParamChange?.());
  
  colorFolder.addBinding(colorPalette, 'cycleSpeed', {
    label: 'Cycle Speed',
    min: 0.1, max: 5, step: 0.1,
  }).on('change', () => callbacks.onParamChange?.());
  
  colorFolder.addButton({ title: 'Randomize Colors' }).on('click', () => {
    colorPalette.hueStart = Math.floor(Math.random() * 360);
    colorPalette.hueRange = 30 + Math.floor(Math.random() * 120);
    colorPalette.saturation = 50 + Math.floor(Math.random() * 50);
    generatePalette();
    pane.refresh();
    callbacks.onParamChange?.();
  });

  // --- Effects ---
  const effectsFolder = pane.addFolder({ title: 'EFFECTS', expanded: false });
  
  effectsFolder.addBinding(effects, 'rippleEnabled', {
    label: 'Ripple',
  }).on('change', () => callbacks.onParamChange?.());
  
  effectsFolder.addBinding(effects, 'rippleStrength', {
    label: 'Ripple Strength',
    min: 0, max: 100, step: 5,
  }).on('change', () => callbacks.onParamChange?.());
  
  effectsFolder.addBinding(effects, 'glitchEnabled', {
    label: 'Glitch',
  }).on('change', () => callbacks.onParamChange?.());
  
  effectsFolder.addBinding(effects, 'glitchAmount', {
    label: 'Glitch Amount',
    min: 0, max: 50, step: 1,
  }).on('change', () => callbacks.onParamChange?.());

  // --- Animation ---
  const animationFolder = pane.addFolder({ title: 'ANIMATION', expanded: true });
  
  animationFolder.addBinding(animation, 'playing', {
    label: 'Playing',
  }).on('change', () => callbacks.onAnimationChange?.());
  
  animationFolder.addBinding(animation, 'speed', {
    label: 'Speed',
    min: 0.1, max: 3, step: 0.1,
  }).on('change', () => callbacks.onParamChange?.());
  
  animationFolder.addBinding(animation, 'loopDuration', {
    label: 'Loop Duration',
    min: 30, max: 300, step: 10,
  }).on('change', () => callbacks.onParamChange?.());

  // --- Export ---
  const exportFolder = pane.addFolder({ title: 'EXPORT', expanded: false });
  
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
    generatePalette();
    pane.refresh();
    callbacks.onParamChange?.();
  });
  
  actionsFolder.addButton({ title: 'Reset to Default' }).on('click', () => {
    resetToDefaults();
    generatePalette();
    pane.refresh();
    callbacks.onSettingsChange?.();
  });
  
  actionsFolder.addButton({ title: 'Toggle Fullscreen' }).on('click', () => {
    toggleFullscreen();
  });

  return pane;
}

/**
 * Randomize all parameters
 */
function randomizeAll() {
  // Waveform
  const modes = Object.keys(waveformModeOptions);
  waveform.mode = waveformModeOptions[modes[Math.floor(Math.random() * modes.length)]];
  waveform.count = Math.floor(Math.random() * 40) + 10;
  waveform.amplitude = Math.floor(Math.random() * 150) + 50;
  waveform.frequency = 0.005 + Math.random() * 0.03;
  waveform.spacing = Math.floor(Math.random() * 15) + 3;
  waveform.speed = 0.5 + Math.random() * 2;
  
  // Colors
  colorPalette.hueStart = Math.floor(Math.random() * 360);
  colorPalette.hueRange = 30 + Math.floor(Math.random() * 150);
  
  // Animation
  animation.speed = 0.5 + Math.random() * 1.5;
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
 * Refresh UI
 */
export function refreshUI() {
  if (pane) pane.refresh();
}

/**
 * Set export status
 * @param {string} status - status message
 */
export function setStatus(status) {
  exportSettings.status = status;
  refreshUI();
}
