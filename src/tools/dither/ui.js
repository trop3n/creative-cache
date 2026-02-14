// ============================================================
// Tweakpane UI Setup - All controls, folders, visibility logic
// ============================================================

import { Pane } from 'tweakpane';
import {
  cnv, dither, gradient, ascii, rec,
  ditherTypeOptions, matrixOptions, noiseOptions,
  ratioOptions, fontTypes, asciiColorModes,
} from './state.js';
import { palettes } from './palettes.js';
import { presetNames, presetOptions, loadPreset, saveUserPreset, exportPreset, importPreset } from './presets.js';

let pane = null;
let callbacks = {};

// References to folders/bindings for visibility toggling
let ditherFolder = null;
let levelsFolder = null;
let colorsFolder = null;
let paletteFolder = null;

// Dither sub-controls (toggled by type)
let matrixBlade = null;
let matrixScaleBlade = null;
let noiseBlade = null;
let noiseTextureBlade = null;
let noiseScaleBlade = null;
let halftoneScaleBlade = null;
let halftoneSmoothBlade = null;
let halftoneXBlade = null;
let halftoneYBlade = null;
let halftoneZBlade = null;
let asciiFontBlade = null;
let asciiTextBlade = null;
let asciiScaleBlade = null;
let asciiColorModeBlade = null;
let asciiCharColorBlade = null;
let asciiBgColorBlade = null;

// Palette color bindings
let paletteBindings = [];

// Export status monitor
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
    title: 'DITHR TOOL',
  });

  // --- Upload Media Button ---
  pane.addButton({ title: 'Upload Media' }).on('click', () => {
    // Update file input to accept both images and videos
    const input = document.getElementById('fileInput');
    if (input) input.setAttribute('accept', 'image/*, video/*');
    callbacks.onMediaUpload?.();
  });

  // --- PRESETS / SETTINGS Tab ---
  const tab = pane.addTab({
    pages: [{ title: 'PRESETS' }, { title: 'SETTINGS' }],
  });

  // Presets page
  const presetsPage = tab.pages[0];
  const presetBinding = { value: cnv.preset };
  presetsPage.addBinding(presetBinding, 'value', {
    label: 'Preset',
    options: presetOptions,
  }).on('change', (ev) => {
    cnv.preset = ev.value;
    if (loadPreset(ev.value)) {
      rebuildUI();
      callbacks.onResize?.();
      callbacks.onPaletteChange?.();
      callbacks.onAsciiTextChange?.();
    }
  });

  presetsPage.addButton({ title: 'Restart Preset' }).on('click', () => {
    if (loadPreset(cnv.preset)) {
      rebuildUI();
      callbacks.onResize?.();
      callbacks.onPaletteChange?.();
    }
  });

  const presetActions = presetsPage.addFolder({ title: 'Import / Export', expanded: false });
  presetActions.addButton({ title: 'Export Preset JSON' }).on('click', () => {
    const json = exportPreset();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dithr-preset.json';
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
          callbacks.onResize?.();
          callbacks.onPaletteChange?.();
          callbacks.onAsciiTextChange?.();
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });

  presetActions.addButton({ title: 'Save as User Preset' }).on('click', () => {
    saveUserPreset();
    cnv.preset = '** User Preset **';
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

  const browserColorBinding = { value: cnv.windowColor };
  settingsPage.addBinding(browserColorBinding, 'value', {
    label: 'Browser Color',
    view: 'color',
  }).on('change', (ev) => {
    cnv.windowColor = ev.value;
    document.body.style.backgroundColor = ev.value;
  });

  // --- CANVAS Folder ---
  const canvasFolder = pane.addFolder({ title: 'CANVAS', expanded: false });

  canvasFolder.addBinding(cnv, 'ratio', {
    label: 'Ratio',
    options: ratioOptions,
  }).on('change', () => {
    callbacks.onResize?.();
  });

  canvasFolder.addBinding(cnv, 'scale', {
    label: 'Scale',
    min: 0.5, max: 1.0, step: 0.01,
  }).on('change', () => {
    callbacks.onResize?.();
  });

  canvasFolder.addBinding(cnv, 'transparent', {
    label: 'Transparency',
  }).on('change', () => callbacks.onParamChange?.());

  canvasFolder.addBinding(cnv, 'backColor', {
    label: 'Back Color',
    view: 'color',
  }).on('change', () => callbacks.onParamChange?.());

  // --- DITHER Folder ---
  ditherFolder = pane.addFolder({ title: 'DITHER', expanded: true });

  ditherFolder.addBinding(dither, 'type', {
    label: 'Type',
    options: ditherTypeOptions,
  }).on('change', () => {
    updateDitherVisibility();
    callbacks.onParamChange?.();
  });

  // Matrix sub-controls
  matrixBlade = ditherFolder.addBinding(dither, 'matrix', {
    label: 'Matrix',
    options: matrixOptions,
  });
  matrixBlade.on('change', () => callbacks.onParamChange?.());

  matrixScaleBlade = ditherFolder.addBinding(dither, 'scale', {
    label: 'Scale',
    min: 1, max: 8, step: 1,
  });
  matrixScaleBlade.on('change', () => callbacks.onParamChange?.());

  // Noise sub-controls
  noiseBlade = ditherFolder.addBinding(dither, 'noise', {
    label: 'Noise Size',
    options: noiseOptions,
  });
  noiseBlade.on('change', () => callbacks.onParamChange?.());

  noiseTextureBlade = ditherFolder.addBinding(dither, 'texture', {
    label: 'Texture #',
    min: 0, max: 3, step: 1,
  });
  noiseTextureBlade.on('change', () => callbacks.onParamChange?.());

  noiseScaleBlade = ditherFolder.addBinding(dither, 'scale', {
    label: 'Scale',
    min: 1, max: 8, step: 1,
  });
  noiseScaleBlade.on('change', () => callbacks.onParamChange?.());

  // Halftone sub-controls
  halftoneScaleBlade = ditherFolder.addBinding(dither.halftone, 'scale', {
    label: 'Scale',
    min: 3, max: 24, step: 1,
  });
  halftoneScaleBlade.on('change', () => callbacks.onParamChange?.());

  halftoneSmoothBlade = ditherFolder.addBinding(dither.halftone, 'smooth', {
    label: 'Smooth',
    min: 0, max: 10, step: 0.5,
  });
  halftoneSmoothBlade.on('change', () => callbacks.onParamChange?.());

  halftoneXBlade = ditherFolder.addBinding(dither.halftone, 'x', {
    label: 'R Scale',
    min: 0, max: 2, step: 0.1,
  });
  halftoneXBlade.on('change', () => callbacks.onParamChange?.());

  halftoneYBlade = ditherFolder.addBinding(dither.halftone, 'y', {
    label: 'G Scale',
    min: 0, max: 2, step: 0.1,
  });
  halftoneYBlade.on('change', () => callbacks.onParamChange?.());

  halftoneZBlade = ditherFolder.addBinding(dither.halftone, 'z', {
    label: 'B Scale',
    min: 0, max: 2, step: 0.1,
  });
  halftoneZBlade.on('change', () => callbacks.onParamChange?.());

  // ASCII sub-controls
  asciiFontBlade = ditherFolder.addBinding(ascii, 'fontname', {
    label: 'Font',
    options: fontTypes,
  });
  asciiFontBlade.on('change', (ev) => {
    callbacks.onFontChange?.(ev.value);
  });

  asciiTextBlade = ditherFolder.addBinding(ascii, 'text', {
    label: 'Characters',
  });
  asciiTextBlade.on('change', () => {
    callbacks.onAsciiTextChange?.();
    callbacks.onParamChange?.();
  });

  asciiScaleBlade = ditherFolder.addBinding(ascii, 'scale', {
    label: 'Scale',
    min: 4, max: 64, step: 2,
  });
  asciiScaleBlade.on('change', () => {
    callbacks.onAsciiTextChange?.(); // Rebuild atlas at new size
    callbacks.onParamChange?.();
  });

  asciiColorModeBlade = ditherFolder.addBinding(ascii.color, 'mode', {
    label: 'Color Mode',
    options: asciiColorModes,
  });
  asciiColorModeBlade.on('change', () => {
    updateAsciiColorVisibility();
    callbacks.onParamChange?.();
  });

  asciiCharColorBlade = ditherFolder.addBinding(ascii.color, 'char', {
    label: 'Char Color',
    view: 'color',
  });
  asciiCharColorBlade.on('change', () => callbacks.onParamChange?.());

  asciiBgColorBlade = ditherFolder.addBinding(ascii.color, 'bg', {
    label: 'Bg Color',
    view: 'color',
  });
  asciiBgColorBlade.on('change', () => callbacks.onParamChange?.());

  // --- LEVELS Folder ---
  levelsFolder = pane.addFolder({ title: 'LEVELS', expanded: true });

  levelsFolder.addBinding(dither, 'step', {
    label: 'Posterize',
    min: 1, max: 32, step: 1,
  }).on('change', () => callbacks.onParamChange?.());

  levelsFolder.addBinding(dither, 'brightness', {
    label: 'Brightness',
    min: 0.5, max: 1.5, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.());

  levelsFolder.addBinding(dither, 'contrast', {
    label: 'Contrast',
    min: 0.5, max: 4.0, step: 0.05,
  }).on('change', () => callbacks.onParamChange?.());

  levelsFolder.addButton({ title: 'Restore Defaults' }).on('click', () => {
    dither.step = 16;
    dither.brightness = 1.0;
    dither.contrast = 1.0;
    pane.refresh();
    callbacks.onParamChange?.();
  });

  // --- COLORS Folder ---
  colorsFolder = pane.addFolder({ title: 'COLORS', expanded: true });

  colorsFolder.addBinding(gradient, 'type', {
    label: 'Mode',
    options: { 'Original': 'original', 'Gradient': 'gradient' },
  }).on('change', () => {
    updateColorVisibility();
    callbacks.onPaletteChange?.();
    callbacks.onParamChange?.();
  });

  colorsFolder.addBinding(gradient, 'saturation', {
    label: 'Saturation',
    min: 0, max: 1, step: 0.01,
  }).on('change', () => callbacks.onParamChange?.());

  // Palette selector
  const paletteOpts = {};
  palettes.forEach((_, i) => {
    paletteOpts[`Palette ${i + 1}`] = i;
  });
  colorsFolder.addBinding(gradient, 'palette', {
    label: 'Palette',
    options: paletteOpts,
  }).on('change', () => {
    updatePaletteBindings();
    callbacks.onPaletteChange?.();
    callbacks.onParamChange?.();
  });

  colorsFolder.addBinding(gradient, 'reverse', {
    label: 'Reverse',
  }).on('change', () => {
    callbacks.onPaletteChange?.();
    callbacks.onParamChange?.();
  });

  // --- PALETTE Folder (5 color stops with use toggles) ---
  paletteFolder = pane.addFolder({ title: 'PALETTE', expanded: false });
  buildPaletteBindings();

  // --- EXPORT Folder ---
  const exportFolder = pane.addFolder({ title: 'EXPORT', expanded: false });

  exportFolder.addBinding(rec, 'status', {
    label: 'Status',
    readonly: true,
  });

  exportFolder.addBinding(rec, 'exportSize', {
    label: 'Export Size',
    options: { '1x': 1, '2x': 2, '3x': 3 },
  });

  // --- Export Button ---
  pane.addButton({ title: 'Export PNG Image' }).on('click', () => {
    callbacks.onExport?.();
  });

  // Set initial visibility
  updateDitherVisibility();
  updateColorVisibility();
  updateAsciiColorVisibility();

  // Listen for preset imports via drag-drop
  window.addEventListener('dithr-import-preset', (e) => {
    const json = JSON.stringify(e.detail);
    if (importPreset(json)) {
      rebuildUI();
      callbacks.onResize?.();
      callbacks.onPaletteChange?.();
      callbacks.onAsciiTextChange?.();
    }
  });
}

/**
 * Refresh all pane bindings (after loading a preset).
 */
export function refreshUI() {
  if (pane) pane.refresh();
}

/**
 * Full UI rebuild after preset load.
 */
function rebuildUI() {
  updateDitherVisibility();
  updateColorVisibility();
  updateAsciiColorVisibility();
  updatePaletteBindings();
  if (pane) pane.refresh();
}

/**
 * Show/hide dither sub-controls based on current type.
 */
function updateDitherVisibility() {
  const type = dither.type;

  // Matrix controls
  const showMatrix = type === 'matrix';
  setBladeHidden(matrixBlade, !showMatrix);
  setBladeHidden(matrixScaleBlade, !showMatrix);

  // Noise controls
  const showNoise = type === 'noise';
  setBladeHidden(noiseBlade, !showNoise);
  setBladeHidden(noiseTextureBlade, !showNoise);
  setBladeHidden(noiseScaleBlade, !showNoise);

  // Halftone controls
  const showHalftone = type === 'halftone';
  setBladeHidden(halftoneScaleBlade, !showHalftone && type !== 'halftoneCMYK');
  setBladeHidden(halftoneSmoothBlade, !showHalftone);
  setBladeHidden(halftoneXBlade, !showHalftone);
  setBladeHidden(halftoneYBlade, !showHalftone);
  setBladeHidden(halftoneZBlade, !showHalftone);

  // ASCII controls
  const showAscii = type === 'ascii';
  setBladeHidden(asciiFontBlade, !showAscii);
  setBladeHidden(asciiTextBlade, !showAscii);
  setBladeHidden(asciiScaleBlade, !showAscii);
  setBladeHidden(asciiColorModeBlade, !showAscii);
  setBladeHidden(asciiCharColorBlade, !showAscii);
  setBladeHidden(asciiBgColorBlade, !showAscii);

  if (showAscii) updateAsciiColorVisibility();
}

/**
 * Show/hide ASCII color controls based on color mode.
 */
function updateAsciiColorVisibility() {
  if (dither.type !== 'ascii') return;
  const mode = ascii.color.mode;
  setBladeHidden(asciiCharColorBlade, mode === 'chars');
  setBladeHidden(asciiBgColorBlade, mode === 'chars');
}

/**
 * Show/hide color controls based on gradient mode.
 */
function updateColorVisibility() {
  // Saturation is only useful in original mode
  // Palette/reverse are always shown
}

// Proxy object for palette bindings (Tweakpane needs named properties)
let paletteProxy = {
  c0: '#000000', c1: '#000000', c2: '#000000', c3: '#000000', c4: '#000000',
  u0: true, u1: true, u2: true, u3: true, u4: true,
};

function syncPaletteProxy() {
  const pal = palettes[gradient.palette];
  if (!pal) return;
  for (let i = 0; i < 5; i++) {
    paletteProxy[`c${i}`] = pal.colors[i];
    paletteProxy[`u${i}`] = pal.use[i];
  }
}

function writePaletteBack() {
  const pal = palettes[gradient.palette];
  if (!pal) return;
  for (let i = 0; i < 5; i++) {
    pal.colors[i] = paletteProxy[`c${i}`];
    pal.use[i] = paletteProxy[`u${i}`];
  }
}

/**
 * Build palette color stop bindings.
 */
function buildPaletteBindings() {
  // Remove old bindings
  for (const b of paletteBindings) {
    b.dispose();
  }
  paletteBindings = [];

  syncPaletteProxy();

  for (let i = 0; i < 5; i++) {
    const colorBinding = paletteFolder.addBinding(paletteProxy, `c${i}`, {
      label: `Color ${i + 1}`,
    });
    colorBinding.on('change', () => {
      writePaletteBack();
      callbacks.onPaletteChange?.();
      callbacks.onParamChange?.();
    });
    paletteBindings.push(colorBinding);

    const useBinding = paletteFolder.addBinding(paletteProxy, `u${i}`, {
      label: `Use ${i + 1}`,
    });
    useBinding.on('change', () => {
      writePaletteBack();
      callbacks.onPaletteChange?.();
      callbacks.onParamChange?.();
    });
    paletteBindings.push(useBinding);
  }
}

/**
 * Update palette bindings when palette changes.
 */
function updatePaletteBindings() {
  buildPaletteBindings();
}

/**
 * Helper to show/hide a Tweakpane blade element.
 */
function setBladeHidden(blade, hidden) {
  if (!blade) return;
  blade.hidden = hidden;
}
