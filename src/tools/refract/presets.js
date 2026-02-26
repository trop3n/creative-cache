// ============================================================
// REFRACT Tool — Presets
// ============================================================

import { canvas, transform, refract, cloneState, applyState } from './state.js';

// ── Built-in presets ─────────────────────────────────────────
const builtinPresets = {
  'Preset 1': {
    canvas:    { textureWrap: 'mirror', contentScaleX: 1.0, contentScaleY: 1.0, background: 'custom', canvasColor: '#ffffff' },
    transform: { displaceType: 'box', seed: 0,
                 box: { x: { amplify: 2.0, frequency: 4.0, speed: 0.0 },
                        y: { amplify: 2.0, frequency: 4.0, speed: 0.0 } } },
    refract:   { type: 'none' },
  },

  'Preset 2': {
    canvas:    { textureWrap: 'mirror', contentScaleX: 1.0, contentScaleY: 1.0, background: 'custom', canvasColor: '#ffffff' },
    transform: { displaceType: 'box', seed: 42,
                 box: { x: { amplify: 6.0, frequency: 20.0, speed: 8.0 },
                        y: { amplify: 6.0, frequency: 25.0, speed: 10.0 } } },
    refract:   { type: 'none' },
  },

  'Preset 3': {
    canvas:    { textureWrap: 'mirror', contentScaleX: 1.0, contentScaleY: 1.0, background: 'custom', canvasColor: '#ffffff' },
    transform: { displaceType: 'flow', seed: 12,
                 flow: { complexity: 3, frequency: 3.0,
                         x: { amplify: 5.0, speed: 5.0 },
                         y: { amplify: 5.0, speed: 3.0 } } },
    refract:   { type: 'none' },
  },

  'Preset 4': {
    canvas:    { textureWrap: 'mirror', contentScaleX: 1.0, contentScaleY: 1.0, background: 'custom', canvasColor: '#ffffff' },
    transform: { displaceType: 'flow', seed: 77,
                 flow: { complexity: 2, frequency: 1.5,
                         x: { amplify: 12.0, speed: 8.0 },
                         y: { amplify: 3.0,  speed: 4.0 } } },
    refract:   { type: 'none' },
  },

  'Preset 5': {
    canvas:    { textureWrap: 'mirror', contentScaleX: 1.0, contentScaleY: 1.0, background: 'custom', canvasColor: '#ffffff' },
    transform: { displaceType: 'sine', seed: 0,
                 sine: { x: { amplify: 3.0, frequency: 8.0,  speed: 0.0 },
                         y: { amplify: 3.0, frequency: 8.0,  speed: 0.0 } } },
    refract:   { type: 'none' },
  },

  'Preset 6': {
    canvas:    { textureWrap: 'mirror', contentScaleX: 1.0, contentScaleY: 1.0, background: 'custom', canvasColor: '#ffffff' },
    transform: { displaceType: 'sine', seed: 0,
                 sine: { x: { amplify: 1.5, frequency: 30.0, speed: 10.0 },
                         y: { amplify: 1.5, frequency: 30.0, speed: 10.0 } } },
    refract:   { type: 'none' },
  },

  'Preset 7': {
    canvas:    { textureWrap: 'mirror', contentScaleX: 1.0, contentScaleY: 1.0, background: 'custom', canvasColor: '#ffffff' },
    transform: { displaceType: 'box', seed: 33,
                 box: { x: { amplify: 4.0, frequency: 10.0, speed: 5.0 },
                        y: { amplify: 4.0, frequency: 10.0, speed: 5.0 } } },
    refract:   { type: 'grid', grid: { x: { skewLevel: 1.25, gridAmount: 20 },
                                       y: { skewLevel: 1.25, gridAmount: 20 } } },
  },

  'Preset 8': {
    canvas:    { textureWrap: 'mirror', contentScaleX: 1.0, contentScaleY: 1.0, background: 'custom', canvasColor: '#ffffff' },
    transform: { displaceType: 'flow', seed: 601,
                 flow: { complexity: 3, frequency: 15.1,
                         x: { amplify: 20.0, speed: 33.0 },
                         y: { amplify: 5.0,  speed: 15.0 } } },
    refract:   { type: 'grid', grid: { x: { skewLevel: 1.25, gridAmount: 20 },
                                       y: { skewLevel: 1.25, gridAmount: 20 } } },
  },

  'Preset 9': {
    canvas:    { textureWrap: 'mirror', contentScaleX: 1.0, contentScaleY: 1.0, background: 'custom', canvasColor: '#ffffff' },
    transform: { displaceType: 'flow', seed: 200,
                 flow: { complexity: 6, frequency: 5.0,
                         x: { amplify: 8.0, speed: 0.0 },
                         y: { amplify: 8.0, speed: 0.0 } } },
    refract:   { type: 'none' },
  },

  'Preset 10': {
    canvas:    { textureWrap: 'mirror', contentScaleX: 1.0, contentScaleY: 1.0, background: 'custom', canvasColor: '#ffffff' },
    transform: { displaceType: 'box', seed: 601,
                 box: { x: { amplify: 8.0, frequency: 40.0, speed: 35.0 },
                        y: { amplify: 7.0, frequency: 50.0, speed: 50.0 } } },
    refract:   { type: 'none' },
  },
};

// ── User presets (localStorage) ───────────────────────────────
let userPresets = {};
try {
  const saved = localStorage.getItem('refract_user_presets_v2');
  if (saved) userPresets = JSON.parse(saved);
} catch (e) {
  console.warn('Could not load user presets:', e);
}

// ── Preset options map for Tweakpane ──────────────────────────
// Mutable object — mutated in-place by refreshPresetOptions so
// Tweakpane picks up changes on the next pane.refresh() call.
export const presetOptions = _buildOptions();

function _buildOptions() {
  const opts = {};
  for (const k of Object.keys(builtinPresets)) opts[k] = k;
  for (const k of Object.keys(userPresets))    opts[k] = k;
  return opts;
}

export function refreshPresetOptions() {
  // Mutate in-place so the Tweakpane binding's captured reference stays valid
  for (const k of Object.keys(presetOptions)) delete presetOptions[k];
  Object.assign(presetOptions, _buildOptions());
}

// ── Load ──────────────────────────────────────────────────────
export function loadPreset(name) {
  const data = builtinPresets[name] ?? userPresets[name];
  if (!data) return false;
  if (data.canvas)    applyState(canvas,    data.canvas);
  if (data.transform) applyState(transform, data.transform);
  if (data.refract)   applyState(refract,   data.refract);
  return true;
}

// ── Save ──────────────────────────────────────────────────────
export function saveUserPreset() {
  let i = 1;
  let name = `User Preset ${i}`;
  while (userPresets[name]) { i++; name = `User Preset ${i}`; }
  userPresets[name] = {
    canvas:    cloneState(canvas),
    transform: cloneState(transform),
    refract:   cloneState(refract),
  };
  try {
    localStorage.setItem('refract_user_presets_v2', JSON.stringify(userPresets));
  } catch (e) {
    console.warn('Could not save user presets:', e);
  }
  return name;
}
