// ============================================================
// SPLITX Tool — Presets
// ============================================================

import { cloneState, applyState } from './state.js';

const STORAGE_KEY = 'splitx-user-preset-v2';

// ── Helper: make a flat motion channel ───────────────────────
function ch(type, order, amp, freq, cycle, phase, speed, seed) {
  return { type, order, amp, freq, cycle, phase, speed, seed };
}

// ── Built-in presets (ported from reference allpresets.js) ───
const BUILTIN = {
  'Split Vibration': {
    canvas:    { ratio: '1:1', background: 'palette', paletteBgSlot: 2, canvasColor: '#000000' },
    shape:     { type: 'triangle', count: 40, sequence: -0.09 },
    color:     { stylingType: 'fill', strokeWidth: 5, drawingMode: 'xor',
                 paletteIndex: 2, paletteUse: [false, true, true, false, false],
                 palette: ['#f19601', '#f21f26', '#251819', '#ebc83a', '#73b295'] },
    transform: { splitMask: 'quad', scale: 0.48, rotation: 84,
                 position: { x: -0.06, y: -0.24 }, transition: { x: 0.84, y: -1.0 } },
    motion: {
      scale:  ch('noise',      'equal',    -0.32, 0.38, 2,  0.50, 0.28, 679),
      xMove:  ch('sinusoidal', 'forward',   0.15, 0.25, 2,  0.06, 0.27, 266),
      yMove:  ch('sinusoidal', 'backward',  0.19, 0.36, 3,  0.00, 0.23, 602),
      rotate: ch('sinusoidal', 'forward',   0.10, 0.75, 4,  0.43, 0.17, 665),
    },
  },

  'Lotus Metamorphosis': {
    canvas:    { ratio: '1:1', background: 'palette', paletteBgSlot: 1, canvasColor: '#000000' },
    shape:     { type: 'organic', count: 100, sequence: 0.76 },
    color:     { stylingType: 'stroke', strokeWidth: 3, drawingMode: 'lch',
                 paletteIndex: 1, paletteUse: [true, true, true, true, true],
                 palette: ['#fffdc0', '#b9d7a1', '#fead26', '#ca221f', '#590f0c'] },
    transform: { splitMask: 'quad', scale: 1.0, rotation: 0,
                 position: { x: 0, y: 0 }, transition: { x: 0, y: 0 } },
    motion: {
      scale:  ch('off',   'forward', 0.29, 0.00, 9, 0.13, 0.63, 729),
      xMove:  ch('noise', 'equal',   0.44, 0.86, 7, 0.50, 0.27, 101),
      yMove:  ch('noise', 'equal',   0.29, 0.99, 2, 0.32, 0.20, 551),
      rotate: ch('noise', 'equal',   0.41, 0.54, 9, 0.40, 0.49, 471),
    },
  },

  'Star Trails': {
    canvas:    { ratio: '1:1', background: 'palette', paletteBgSlot: 4, canvasColor: '#000000' },
    shape:     { type: 'star', count: 100, sequence: 0.5 },
    color:     { stylingType: 'stroke', strokeWidth: 10, drawingMode: 'lch',
                 paletteIndex: 0, paletteUse: [true, true, true, true, true],
                 palette: ['#dbff0e', '#ffffff', '#f84d4d', '#003deb', '#000000'] },
    transform: { splitMask: 'none', scale: 1.0, rotation: 0,
                 position: { x: 0, y: 0 }, transition: { x: 0, y: 0 } },
    motion: {
      scale:  ch('off',        'forward',  0.27, 0.52, 8,  -0.27, 0.68, 333),
      xMove:  ch('sinusoidal', 'forward',  0.39, 0.68, 4,  -0.24, 0.82, 13),
      yMove:  ch('noise',      'equal',    0.18, 0.00, 6,   0.46, 0.14, 152),
      rotate: ch('sinusoidal', 'forward',  0.16, 0.77, 4,  -0.03, 0.45, 221),
    },
  },

  'Wall Art Dynamics': {
    canvas:    { ratio: '4:3', background: 'custom', paletteBgSlot: 4, canvasColor: '#000000' },
    shape:     { type: 'checker', count: 50, sequence: 0.3 },
    color:     { stylingType: 'fill', strokeWidth: 1.5, drawingMode: 'lch',
                 paletteIndex: 4, paletteUse: [true, true, true, true, true],
                 palette: ['#66a5ff', '#fffff8', '#deca95', '#d62e2e', '#123d3f'] },
    transform: { splitMask: 'quad', scale: 1.5, rotation: 20,
                 position: { x: -0.5, y: 0 }, transition: { x: 0, y: -0.1 } },
    motion: {
      scale:  ch('off',        'backward', 0.26, 0.81, 4, -0.47, 0.00, 230),
      xMove:  ch('sinusoidal', 'equal',    0.28, 0.02, 3, -0.06, 0.35, 159),
      yMove:  ch('noise',      'forward',  0.26, 0.62, 4, -0.13, 0.19, 592),
      rotate: ch('off',        'equal',    0.20, 1.00, 0, -0.12, 0.24, 538),
    },
  },

  'Radical Vortex': {
    canvas:    { ratio: '1:1', background: 'palette', paletteBgSlot: 0, canvasColor: '#ffffff' },
    shape:     { type: 'triangle', count: 40, sequence: 0.4 },
    color:     { stylingType: 'fill', strokeWidth: 2, drawingMode: 'lch',
                 paletteIndex: 4, paletteUse: [true, true, true, true, true],
                 palette: ['#493341', '#554865', '#cd5b51', '#f3a36b', '#eee6d7'] },
    transform: { splitMask: 'quad', scale: 1.6, rotation: 0,
                 position: { x: 0, y: 0 }, transition: { x: 0, y: 0 } },
    motion: {
      scale:  ch('noise',      'equal',   0.19, 0.62, 4, -0.27, 0.30, 477),
      xMove:  ch('sinusoidal', 'equal',   0.19, 0.37, 4,  0.31, 0.31, 245),
      yMove:  ch('sinusoidal', 'equal',   0.11, 0.43, 2,  0.00, 0.18, 519),
      rotate: ch('noise',      'equal',   0.14, 0.26, 2,  0.47, 0.30, 341),
    },
  },

  'Hypnotic Garden': {
    canvas:    { ratio: '1:1', background: 'custom', paletteBgSlot: 0, canvasColor: '#0a0a0a' },
    shape:     { type: 'ring', count: 60, sequence: 0.5 },
    color:     { stylingType: 'stroke', strokeWidth: 2, drawingMode: 'sequence',
                 paletteIndex: 0, paletteUse: [true, true, true, true, true],
                 palette: ['#e8f4f8', '#a8d8ea', '#aa96da', '#fcbad3', '#ffffd2'] },
    transform: { splitMask: 'horizontal', scale: 1.1, rotation: 0,
                 position: { x: 0, y: 0 }, transition: { x: 0.05, y: 0.18 } },
    motion: {
      scale:  ch('sinusoidal', 'forward',  0.08, 1.0, 2, 0.0,  0.3,  0),
      xMove:  ch('off',        'forward',  0.30, 0.5, 1, 0.0,  0.5,  0),
      yMove:  ch('off',        'forward',  0.30, 0.5, 1, 0.0,  0.5,  0),
      rotate: ch('off',        'forward',  0.30, 0.5, 1, 0.0,  0.5,  0),
    },
  },

  'Butterfly Effect': {
    canvas:    { ratio: '1:1', background: 'palette', paletteBgSlot: 0, canvasColor: '#000000' },
    shape:     { type: 'oval', count: 24, sequence: 0.9 },
    color:     { stylingType: 'fill', strokeWidth: 2, drawingMode: 'lch',
                 paletteIndex: 0, paletteUse: [true, true, true, true, true],
                 palette: ['#fffdc0', '#b9d7a1', '#fead26', '#ca221f', '#590f0c'] },
    transform: { splitMask: 'vertical', scale: 0.9, rotation: -81,
                 position: { x: -0.25, y: -0.30 }, transition: { x: 0, y: 0 } },
    motion: {
      scale:  ch('off',        'forward',  0.29, 0.00, 9,  0.13, 0.63, 729),
      xMove:  ch('noise',      'equal',    0.29, 0.62, 7,  0.49, 0.26, 374),
      yMove:  ch('noise',      'equal',    0.21, 0.73, 5,  0.27, 0.19, 621),
      rotate: ch('sinusoidal', 'forward',  0.10, 0.50, 3,  0.20, 0.25, 412),
    },
  },

  'Cutout Progression': {
    canvas:    { ratio: '1:1', background: 'custom', paletteBgSlot: 0, canvasColor: '#ffffff' },
    shape:     { type: 'circle', count: 30, sequence: 0.6 },
    color:     { stylingType: 'fill', strokeWidth: 2, drawingMode: 'xor',
                 paletteIndex: 0, paletteUse: [true, false, false, false, false],
                 palette: ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560'] },
    transform: { splitMask: 'quad', scale: 0.9, rotation: 0,
                 position: { x: 0, y: 0 }, transition: { x: 0.6, y: 0.6 } },
    motion: {
      scale:  ch('sinusoidal', 'equal',   0.12, 0.5, 3, 0.0,  0.4, 0),
      xMove:  ch('off',        'forward', 0.30, 0.5, 1, 0.0,  0.5, 0),
      yMove:  ch('off',        'forward', 0.30, 0.5, 1, 0.0,  0.5, 0),
      rotate: ch('off',        'forward', 0.30, 0.5, 1, 0.0,  0.5, 0),
    },
  },

  'Funky Beats': {
    canvas:    { ratio: '1:1', background: 'custom', paletteBgSlot: 0, canvasColor: '#1a0533' },
    shape:     { type: 'rhombus', count: 20, sequence: -0.05 },
    color:     { stylingType: 'fill', strokeWidth: 2, drawingMode: 'sequence',
                 paletteIndex: 0, paletteUse: [true, true, true, true, true],
                 palette: ['#ff006e', '#fb5607', '#ffbe0b', '#8338ec', '#3a86ff'] },
    transform: { splitMask: 'quad', scale: 0.85, rotation: 0,
                 position: { x: 0, y: 0 }, transition: { x: 0, y: 0.28 } },
    motion: {
      scale:  ch('noise', 'equal',   0.15, 0.5, 2, 0.0, 2.0, 11),
      xMove:  ch('noise', 'equal',   0.18, 0.8, 2, 0.0, 2.0, 22),
      yMove:  ch('off',   'forward', 0.30, 0.5, 1, 0.0, 0.5, 0),
      rotate: ch('noise', 'equal',   0.20, 0.6, 2, 0.0, 1.5, 33),
    },
  },

  'Prismatic Mandala': {
    canvas:    { ratio: '1:1', background: 'custom', paletteBgSlot: 0, canvasColor: '#0d0d0d' },
    shape:     { type: 'hexagon', count: 50, sequence: 0.5 },
    color:     { stylingType: 'stroke', strokeWidth: 1.5, drawingMode: 'rgb',
                 paletteIndex: 0, paletteUse: [true, true, true, true, true],
                 palette: ['#f72585', '#7209b7', '#3a0ca3', '#4361ee', '#4cc9f0'] },
    transform: { splitMask: 'quad', scale: 1.2, rotation: 30,
                 position: { x: 0, y: 0 }, transition: { x: 0, y: 0 } },
    motion: {
      scale:  ch('off',   'forward', 0.30, 0.5, 1, 0.0, 0.5, 0),
      xMove:  ch('off',   'forward', 0.30, 0.5, 1, 0.0, 0.5, 0),
      yMove:  ch('off',   'forward', 0.30, 0.5, 1, 0.0, 0.5, 0),
      rotate: ch('noise', 'equal',   0.60, 0.2, 2, 0.0, 0.3, 77),
    },
  },
};

// ── Public API ────────────────────────────────────────────────
export const presetNames = ['— Select —', ...Object.keys(BUILTIN), '** User Preset **'];

export const presetOptions = Object.fromEntries(presetNames.map(n => [n, n]));

export function loadPreset(name) {
  let data = null;
  if (BUILTIN[name]) {
    data = JSON.parse(JSON.stringify(BUILTIN[name]));
  } else if (name === '** User Preset **') {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) { try { data = JSON.parse(raw); } catch { return false; } }
  }
  if (!data) return false;
  applyState(data);
  return true;
}

export function saveUserPreset() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cloneState()));
}

export function exportPresetJSON() {
  const json = JSON.stringify(cloneState(), null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: 'splitx-preset.json' });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export function importPresetJSON(data) {
  applyState(data);
}
