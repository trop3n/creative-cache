# SPLITX Tool — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild `src/tools/split/` from a non-functional placeholder to a fully working vector art tool matching the reference at https://antlii.work/SPLITX-Tool v0.25.

**Architecture:** p5.js creates the canvas element; paper.js takes it over for all rendering via `paper.setup(cnv.elt)`. p5 runs in `noLoop` mode and is used only for lifecycle management (the tool registry expects a `p5Instance` to call `.remove()` on tool switch). Animation is driven by `paper.view.onFrame`. All rendering is done by paper.js clearing and rebuilding its active layer each frame.

**Tech Stack:** p5.js v2 (instance mode, canvas creation only), paper.js 0.12 (vector rendering), simplex-noise (motion), Tweakpane v4 (UI), no new dependencies (LCH implemented manually).

---

## Reading Before Starting

Study these files to understand the patterns used across this codebase:
- `src/tools/refract/index.js` — uiInstance closure pattern, setupMedia pattern, dispose pattern
- `src/tools/refract/ui.js` — Tweakpane tab setup, conditional visibility, pane.refresh()
- `src/tools/refract/presets.js` — built-in presets, cloneState/applyState helpers, localStorage
- `CLAUDE.md` — Tweakpane v4 patterns (separator blades, color pickers, etc.)

---

## Task 1: Rewrite `state.js`

**Files:**
- Rewrite: `src/tools/split/state.js`

**Step 1: Write the file**

```js
// ============================================================
// SPLITX Tool — State
// ============================================================

// ── Canvas ───────────────────────────────────────────────────
export const canvas = {
  width:             800,
  height:            800,
  ratio:             '1:1',
  background:        'custom',
  canvasColor:       '#111111',
  paletteColorIndex: 0,
  scale:             0.95,
};

export const ratioOptions = {
  '2:1': [2, 1], '16:9': [16, 9], '3:2': [3, 2], '4:3': [4, 3], '5:4': [5, 4],
  '1:1': [1, 1], '4:5': [4, 5], '3:4': [3, 4], '2:3': [2, 3], '9:16': [9, 16], '1:2': [1, 2],
};

export function computeCanvasSize() {
  const [rw, rh] = ratioOptions[canvas.ratio];
  const aspect   = rw / rh;
  // 72% of window width accounts for left sidebar + right pane
  const maxW = window.innerWidth  * 0.72 * canvas.scale;
  const maxH = window.innerHeight * canvas.scale;
  let w = maxW;
  let h = w / aspect;
  if (h > maxH) { h = maxH; w = h * aspect; }
  // Even dimensions for video encoding
  w = Math.floor(w) - (Math.floor(w) % 2);
  h = Math.floor(h) - (Math.floor(h) % 2);
  canvas.width  = Math.max(w, 2);
  canvas.height = Math.max(h, 2);
}

// ── Shape ────────────────────────────────────────────────────
export const shape = {
  type:          'circle',
  count:         20,
  scaleSequence: 0.88,
};

export const shapeTypeOptions = {
  Rectangle: 'rectangle', Circle: 'circle',    Ring: 'ring',
  Oval:      'oval',      Triangle: 'triangle', Rhombus: 'rhombus',
  Cross:     'cross',     Star: 'star',         Hexagon: 'hexagon',
  Petals:    'petals',    Checker: 'checker',   Blob: 'blob',
  Organic:   'organic',   Custom:  'custom',
};

// ── Color ────────────────────────────────────────────────────
export const color = {
  stylingType: 'stroke',
  strokeWidth: 2,
  drawingMode: 'sequence',
  palette:     ['#4a9eff', '#ff4a9e', '#ffe04a', '#4affc3', '#ff7a4a'],
};

export const drawingModeOptions = {
  'Single Color':     'single',
  'Sequence':         'sequence',
  'Transition (RGB)': 'rgb',
  'Transition (LCH)': 'lch',
};

export const colorPresets = [
  ['#4a9eff', '#ff4a9e', '#ffe04a', '#4affc3', '#ff7a4a'],
  ['#f72585', '#7209b7', '#3a0ca3', '#4361ee', '#4cc9f0'],
  ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#c77dff'],
  ['#ffffff', '#c8c8c8', '#909090', '#484848', '#111111'],
  ['#2d00f7', '#6a00f4', '#8900f2', '#bc00dd', '#e500a4'],
];

// ── Transform ────────────────────────────────────────────────
export const transform = {
  splitMask:  'none',
  scale:      1.0,
  rotation:   0,
  position:   { x: 0, y: 0 },
  transition: { x: 0, y: 20 },
};

export const splitMaskOptions = {
  None: 'none', Horizontal: 'horizontal', Vertical: 'vertical', Quad: 'quad',
};

// ── Motion ───────────────────────────────────────────────────
function makeChannel() {
  return {
    type:  'off',
    noise: { effectOrder: 'forward', amplitude: 30, frequency: 0.5, speed: 0.5, seed: Math.floor(Math.random() * 1000) },
    sine:  { effectOrder: 'forward', amplitude: 30, frequency: 1.0, cycles: 1,  phase: 0 },
  };
}

export const motion = {
  scale:  makeChannel(),
  xMove:  makeChannel(),
  yMove:  makeChannel(),
  rotate: makeChannel(),
};

export const motionTypeOptions  = { Off: 'off', Noise: 'noise', Sinusoidal: 'sinusoidal' };
export const effectOrderOptions = { Forward: 'forward', Backward: 'backward', Equal: 'equal' };

// ── Export ───────────────────────────────────────────────────
export const exportSettings = {
  fileType: 'png',
  size:     1.0,
  length:   5,
  quality:  90,
  status:   'Ready',
};

export const fileTypeOptions = {
  'SVG File': 'svg', 'PNG File': 'png', 'MP4 File': 'mp4',
  'PNG Sequence': 'png-sequence', 'WEBP Sequence': 'webp-sequence',
};

// ── Options ──────────────────────────────────────────────────
export const options = {
  margins:    20,
  wheelSens:  1.0,
  browserColor: 10,
};

// ── Runtime (not serialized) ──────────────────────────────────
export const animState = {
  time: 0,
};

export const customSvg = {
  item: null,   // paper.js Item set by media.js when an SVG is loaded
};

// ── Preset helpers ───────────────────────────────────────────
export function cloneState() {
  return JSON.parse(JSON.stringify({
    canvas: { ...canvas }, shape: { ...shape },
    color:  { ...color, palette: [...color.palette] },
    transform: {
      ...transform,
      position:   { ...transform.position },
      transition: { ...transform.transition },
    },
    motion: JSON.parse(JSON.stringify(motion)),
  }));
}

export function applyState(saved) {
  if (saved.canvas)    Object.assign(canvas, saved.canvas);
  if (saved.shape)     Object.assign(shape, saved.shape);
  if (saved.color) {
    Object.assign(color, saved.color);
    if (saved.color.palette) color.palette = [...saved.color.palette];
  }
  if (saved.transform) {
    Object.assign(transform, saved.transform);
    if (saved.transform.position)   Object.assign(transform.position,   saved.transform.position);
    if (saved.transform.transition) Object.assign(transform.transition, saved.transform.transition);
  }
  if (saved.motion) {
    for (const key of ['scale', 'xMove', 'yMove', 'rotate']) {
      if (saved.motion[key]) {
        Object.assign(motion[key],       saved.motion[key]);
        Object.assign(motion[key].noise, saved.motion[key].noise ?? {});
        Object.assign(motion[key].sine,  saved.motion[key].sine  ?? {});
      }
    }
  }
}
```

**Step 2: Verify**

Open the browser dev console after the next task has a working index.js. Verify `canvas`, `shape`, `transform`, `motion` are accessible by importing state.js.

---

## Task 2: Write `color.js`

**Files:**
- Create: `src/tools/split/color.js`

**Step 1: Write the file**

```js
// ============================================================
// SPLITX Tool — Color System (palette, 4 drawing modes, LCH)
// ============================================================

// ── Hex / RGB conversion ─────────────────────────────────────
function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

function rgbToHex(r, g, b) {
  const ch = v => Math.max(0, Math.min(255, Math.round(v * 255))).toString(16).padStart(2, '0');
  return `#${ch(r)}${ch(g)}${ch(b)}`;
}

// ── LCH math ─────────────────────────────────────────────────
function toLinear(v) {
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
function fromLinear(v) {
  return v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(Math.max(0, v), 1 / 2.4) - 0.055;
}

function rgbToXyz(r, g, b) {
  r = toLinear(r); g = toLinear(g); b = toLinear(b);
  return [
    r * 0.4124564 + g * 0.3575761 + b * 0.1804375,
    r * 0.2126729 + g * 0.7151522 + b * 0.0721750,
    r * 0.0193339 + g * 0.1191920 + b * 0.9503041,
  ];
}

function xyzToRgb(x, y, z) {
  return [
    fromLinear( x *  3.2404542 + y * -1.5371385 + z * -0.4985314),
    fromLinear( x * -0.9692660 + y *  1.8760108 + z *  0.0415560),
    fromLinear( x *  0.0556434 + y * -0.2040259 + z *  1.0572252),
  ];
}

const D65 = [0.95047, 1.00000, 1.08883];
function fwd(t) { return t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116; }
function inv(t) { return t > 0.206897 ? t ** 3 : (t - 16 / 116) / 7.787; }

function xyzToLab(x, y, z) {
  const [fx, fy, fz] = [fwd(x / D65[0]), fwd(y / D65[1]), fwd(z / D65[2])];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function labToXyz(L, a, b) {
  const fy = (L + 16) / 116;
  return [D65[0] * inv(fy + a / 500), D65[1] * inv(fy), D65[2] * inv(fy - b / 200)];
}

function labToLch(L, a, b) {
  return [L, Math.sqrt(a * a + b * b), ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360];
}

function lchToLab(L, C, H) {
  const hr = (H * Math.PI) / 180;
  return [L, C * Math.cos(hr), C * Math.sin(hr)];
}

function hexToLch(hex) {
  const [r, g, b] = hexToRgb(hex);
  const [x, y, z] = rgbToXyz(r, g, b);
  const [L, a, lb] = xyzToLab(x, y, z);
  return labToLch(L, a, lb);
}

function lchToHex(L, C, H) {
  const [La, a, b] = lchToLab(L, C, H);
  const [x, y, z]  = labToXyz(La, a, b);
  const [r, g, bl] = xyzToRgb(x, y, z);
  return rgbToHex(r, g, bl);
}

function lerpRgb(hexA, hexB, t) {
  const [r1, g1, b1] = hexToRgb(hexA);
  const [r2, g2, b2] = hexToRgb(hexB);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

function lerpLch(hexA, hexB, t) {
  const [L1, C1, H1] = hexToLch(hexA);
  const [L2, C2, H2] = hexToLch(hexB);
  let dH = H2 - H1;
  if (dH >  180) dH -= 360;
  if (dH < -180) dH += 360;
  return lchToHex(L1 + (L2 - L1) * t, C1 + (C2 - C1) * t, H1 + dH * t);
}

// ── Palette interpolation helper ─────────────────────────────
function paletteInterp(palette, t, lerpFn) {
  const n    = palette.length - 1;
  const seg  = n * t;
  const idx  = Math.min(Math.floor(seg), n - 1);
  const frac = seg - idx;
  return lerpFn(palette[idx], palette[idx + 1], frac);
}

// ── Public API ───────────────────────────────────────────────
/**
 * Return the hex color for copy index `i` out of `count` total copies.
 * @param {number} i
 * @param {number} count
 * @param {{ drawingMode: string, palette: string[] }} colorState
 */
export function colorForCopy(i, count, colorState) {
  const { drawingMode, palette } = colorState;
  switch (drawingMode) {
    case 'single':
      return palette[0];
    case 'sequence':
      return palette[i % palette.length];
    case 'rgb': {
      if (count <= 1) return palette[0];
      return paletteInterp(palette, i / (count - 1), lerpRgb);
    }
    case 'lch': {
      if (count <= 1) return palette[0];
      return paletteInterp(palette, i / (count - 1), lerpLch);
    }
    default:
      return palette[0];
  }
}

/** Generate a random visually distinct hex color. */
export function randomColor() {
  const h = Math.random() * 360;
  const s = 60 + Math.random() * 40;
  const l = 40 + Math.random() * 30;
  // HSL → hex via CSS
  const el = document.createElement('canvas').getContext('2d');
  el.fillStyle = `hsl(${h},${s}%,${l}%)`;
  return el.fillStyle;
}
```

**Step 2: Verify**

No direct browser verification yet. Will be exercised in Task 7 (index.js).

---

## Task 3: Write `shapes.js`

**Files:**
- Create: `src/tools/split/shapes.js`

**Step 1: Write the file**

```js
// ============================================================
// SPLITX Tool — Paper.js Shape Generators
// ============================================================

import paper from 'paper';
import { createNoise2D } from 'simplex-noise';
import { canvas, customSvg } from './state.js';

const noise2D = createNoise2D();

/**
 * Return a paper.js path for the given shape type, centered at origin (0,0).
 * The render loop handles positioning and scaling.
 *
 * @param {string} type - Shape type key from shapeTypeOptions
 * @param {number} seed - Seed offset for organic/blob shapes
 * @returns {paper.Item}
 */
export function getShapePath(type, seed = 0) {
  // Base radius scales with the smaller canvas dimension
  const r = Math.min(canvas.width, canvas.height) * 0.08;
  const c = new paper.Point(0, 0);

  switch (type) {
    case 'rectangle': {
      const rect = new paper.Rectangle(
        new paper.Point(-r, -r * 0.65),
        new paper.Size(r * 2, r * 1.3)
      );
      return new paper.Path.Rectangle(rect);
    }

    case 'circle':
      return new paper.Path.Circle(c, r);

    case 'ring': {
      const outer = new paper.Path.Circle(c, r);
      const inner = new paper.Path.Circle(c, r * 0.58);
      const ring  = new paper.CompoundPath({ children: [outer, inner] });
      ring.fillRule = 'evenodd';
      return ring;
    }

    case 'oval':
      return new paper.Path.Ellipse(
        new paper.Rectangle(new paper.Point(-r * 1.55, -r * 0.6), new paper.Size(r * 3.1, r * 1.2))
      );

    case 'triangle': {
      const path = new paper.Path();
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
        path.add(new paper.Point(Math.cos(a) * r, Math.sin(a) * r));
      }
      path.closed = true;
      return path;
    }

    case 'rhombus': {
      const path = new paper.Path([
        new paper.Point(0, -r),
        new paper.Point(r * 0.65, 0),
        new paper.Point(0, r),
        new paper.Point(-r * 0.65, 0),
      ]);
      path.closed = true;
      return path;
    }

    case 'cross': {
      const t = r * 0.32;
      const path = new paper.Path([
        new paper.Point(-t, -r),  new paper.Point(t, -r),
        new paper.Point(t, -t),   new paper.Point(r, -t),
        new paper.Point(r, t),    new paper.Point(t, t),
        new paper.Point(t, r),    new paper.Point(-t, r),
        new paper.Point(-t, t),   new paper.Point(-r, t),
        new paper.Point(-r, -t),  new paper.Point(-t, -t),
      ]);
      path.closed = true;
      return path;
    }

    case 'star':
      return new paper.Path.Star(c, 5, r * 0.4, r);

    case 'hexagon': {
      const path = new paper.Path();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
        path.add(new paper.Point(Math.cos(a) * r, Math.sin(a) * r));
      }
      path.closed = true;
      return path;
    }

    case 'petals': {
      const petalCount = 6;
      const paths = [];
      for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * 360;
        const petal = new paper.Path.Ellipse(
          new paper.Rectangle(new paper.Point(-r * 0.22, 0), new paper.Size(r * 0.44, r))
        );
        petal.rotate(angle, c);
        paths.push(petal);
      }
      return new paper.Group(paths);
    }

    case 'checker': {
      const grid = 4;
      const cell = r / grid;
      const paths = [];
      for (let row = 0; row < grid * 2; row++) {
        for (let col = 0; col < grid * 2; col++) {
          if ((row + col) % 2 === 0) {
            paths.push(new paper.Path.Rectangle(
              new paper.Rectangle(
                new paper.Point((col - grid) * cell, (row - grid) * cell),
                new paper.Size(cell, cell)
              )
            ));
          }
        }
      }
      return new paper.CompoundPath({ children: paths });
    }

    case 'blob': {
      const pts = 8;
      const path = new paper.Path();
      for (let i = 0; i < pts; i++) {
        const a  = (i / pts) * Math.PI * 2;
        const nr = r * (0.75 + noise2D(Math.cos(a) * 2 + seed, Math.sin(a) * 2) * 0.32);
        path.add(new paper.Point(Math.cos(a) * nr, Math.sin(a) * nr));
      }
      path.closed = true;
      path.smooth({ type: 'continuous' });
      return path;
    }

    case 'organic': {
      const pts = 12;
      const path = new paper.Path();
      for (let i = 0; i < pts; i++) {
        const a  = (i / pts) * Math.PI * 2;
        const nr = r * (0.5 + noise2D(Math.cos(a) * 3 + seed + 100, Math.sin(a) * 3) * 0.55);
        path.add(new paper.Point(Math.cos(a) * nr, Math.sin(a) * nr));
      }
      path.closed = true;
      path.smooth({ type: 'catmull-rom', factor: 0.5 });
      return path;
    }

    case 'custom': {
      if (customSvg.item) {
        const clone  = customSvg.item.clone({ insert: false });
        clone.position = c;
        const maxDim = Math.max(clone.bounds.width, clone.bounds.height);
        if (maxDim > 0.001) clone.scale((r * 2) / maxDim, c);
        return clone;
      }
      // Fallback if no SVG is loaded yet
      return new paper.Path.Circle(c, r);
    }

    default:
      return new paper.Path.Circle(c, r);
  }
}
```

**Step 2: Verify**

Will be exercised in Task 7 (index.js).

---

## Task 4: Write `export.js`

**Files:**
- Create: `src/tools/split/export.js`

**Step 1: Write the file**

```js
// ============================================================
// SPLITX Tool — Export
// ============================================================

import { exportSettings } from './state.js';

/**
 * Run the appropriate export based on exportSettings.fileType.
 * @param {HTMLCanvasElement} canvasEl  — the live paper.js canvas
 * @param {object}           paperProj — paper.project
 * @param {object}           renderFn  — { render, startLoop, stopLoop }
 */
export async function exportComposition(canvasEl, paperProj, renderFn) {
  const { fileType, size, length, quality } = exportSettings;

  switch (fileType) {
    case 'svg':           return exportSVG(paperProj);
    case 'png':           return exportPNG(canvasEl, size);
    case 'mp4':           return exportVideo(canvasEl, length, quality, renderFn);
    case 'png-sequence':  return exportSequence(canvasEl, length, 'png', renderFn);
    case 'webp-sequence': return exportSequence(canvasEl, length, 'webp', renderFn);
  }
}

// ── SVG ──────────────────────────────────────────────────────
function exportSVG(paperProj) {
  const svg = paperProj.exportSVG({ asString: true });
  downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), 'splitx-export.svg');
}

// ── PNG ──────────────────────────────────────────────────────
function exportPNG(canvasEl, sizeMult) {
  const off = document.createElement('canvas');
  off.width  = Math.floor(canvasEl.width  * sizeMult);
  off.height = Math.floor(canvasEl.height * sizeMult);
  const ctx = off.getContext('2d');
  ctx.scale(sizeMult, sizeMult);
  ctx.drawImage(canvasEl, 0, 0);
  off.toBlob(blob => downloadBlob(blob, 'splitx-export.png'), 'image/png');
}

// ── Video (MP4 / WebM fallback) ───────────────────────────────
async function exportVideo(canvasEl, length, quality, renderFn) {
  renderFn.startLoop();

  const stream   = canvasEl.captureStream(30);
  const mimeType = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm';
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: quality * 80000,
  });

  const chunks = [];
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

  const done = new Promise(resolve => {
    recorder.onstop = () => {
      const ext  = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const blob = new Blob(chunks, { type: mimeType });
      downloadBlob(blob, `splitx-export.${ext}`);
      resolve();
    };
  });

  exportSettings.status = 'Recording…';
  recorder.start();
  await new Promise(r => setTimeout(r, length * 1000));
  recorder.stop();
  renderFn.stopLoop();
  await done;
  exportSettings.status = 'Done';
  setTimeout(() => { exportSettings.status = 'Ready'; }, 2000);
}

// ── Frame sequence ────────────────────────────────────────────
async function exportSequence(canvasEl, length, format, renderFn) {
  const fps         = 30;
  const totalFrames = Math.floor(length * fps);
  const dt          = 1 / fps;

  renderFn.startLoop();
  exportSettings.status = `Exporting 0 / ${totalFrames}…`;

  for (let frame = 0; frame < totalFrames; frame++) {
    renderFn.advanceFrame(dt);
    await new Promise(r => requestAnimationFrame(r));

    await new Promise(resolve => {
      const mime = format === 'webp' ? 'image/webp' : 'image/png';
      canvasEl.toBlob(blob => {
        const n = frame.toString().padStart(5, '0');
        downloadBlob(blob, `splitx-frame-${n}.${format}`);
        resolve();
      }, mime, 0.9);
    });

    exportSettings.status = `Exporting ${frame + 1} / ${totalFrames}…`;
  }

  renderFn.stopLoop();
  exportSettings.status = 'Done';
  setTimeout(() => { exportSettings.status = 'Ready'; }, 2000);
}

// ── Utility ───────────────────────────────────────────────────
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}
```

**Step 2: Verify**

Will be exercised after the full tool is wired up in Task 9.

---

## Task 5: Write `presets.js`

**Files:**
- Rewrite: `src/tools/split/presets.js`

**Step 1: Write the file**

```js
// ============================================================
// SPLITX Tool — Presets (built-in + localStorage user preset)
// ============================================================

import { cloneState, applyState } from './state.js';

const STORAGE_KEY = 'splitx-user-preset-v1';

// ── Built-in presets ──────────────────────────────────────────
// All presets assume default canvas (1:1, ~800px). Scale/transition values
// are tuned for visual quality; adjust as desired.
const BUILTIN = {
  'Split Vibration': {
    shape:     { type: 'circle',    count: 20, scaleSequence: 0.92 },
    color:     { stylingType: 'stroke', strokeWidth: 1.5, drawingMode: 'sequence', palette: ['#4a9eff','#ff4a9e','#ffe04a','#4affc3','#ff7a4a'] },
    transform: { splitMask: 'quad', scale: 1.0, rotation: 0, position: { x: 0, y: 0 }, transition: { x: 0, y: 22 } },
    motion: {
      scale:  { type: 'noise',      noise: { effectOrder: 'forward', amplitude: 0.12, frequency: 0.4, speed: 0.8, seed: 42 },  sine: { effectOrder: 'forward', amplitude: 30, frequency: 1, cycles: 1, phase: 0 } },
      xMove:  { type: 'sinusoidal', noise: { effectOrder: 'forward', amplitude: 30, frequency: 0.5, speed: 0.5, seed: 0 },    sine: { effectOrder: 'forward', amplitude: 18, frequency: 1.2, cycles: 2, phase: 0 } },
      yMove:  { type: 'off',        noise: { effectOrder: 'forward', amplitude: 30, frequency: 0.5, speed: 0.5, seed: 0 },    sine: { effectOrder: 'forward', amplitude: 30, frequency: 1, cycles: 1, phase: 0 } },
      rotate: { type: 'off',        noise: { effectOrder: 'forward', amplitude: 30, frequency: 0.5, speed: 0.5, seed: 0 },    sine: { effectOrder: 'forward', amplitude: 30, frequency: 1, cycles: 1, phase: 0 } },
    },
  },

  'Star Trails': {
    shape:     { type: 'star',      count: 16, scaleSequence: 0.86 },
    color:     { stylingType: 'fill',   strokeWidth: 2,   drawingMode: 'lch',      palette: ['#2d00f7','#6a00f4','#8900f2','#bc00dd','#e500a4'] },
    transform: { splitMask: 'quad', scale: 1.0, rotation: 22, position: { x: 0, y: 0 }, transition: { x: 14, y: 14 } },
    motion: {
      scale:  { type: 'off',        noise: { effectOrder: 'forward', amplitude: 30,  frequency: 0.5, speed: 0.5, seed: 0 },  sine: { effectOrder: 'forward', amplitude: 30, frequency: 1, cycles: 1, phase: 0 } },
      xMove:  { type: 'off',        noise: { effectOrder: 'forward', amplitude: 30,  frequency: 0.5, speed: 0.5, seed: 0 },  sine: { effectOrder: 'forward', amplitude: 30, frequency: 1, cycles: 1, phase: 0 } },
      yMove:  { type: 'off',        noise: { effectOrder: 'forward', amplitude: 30,  frequency: 0.5, speed: 0.5, seed: 0 },  sine: { effectOrder: 'forward', amplitude: 30, frequency: 1, cycles: 1, phase: 0 } },
      rotate: { type: 'sinusoidal', noise: { effectOrder: 'forward', amplitude: 30,  frequency: 0.5, speed: 0.5, seed: 0 },  sine: { effectOrder: 'forward', amplitude: 45, frequency: 0.8, cycles: 1, phase: 0 } },
    },
  },

  'Prismatic Mandala': {
    shape:     { type: 'hexagon',   count: 14, scaleSequence: 0.84 },
    color:     { stylingType: 'stroke', strokeWidth: 2,   drawingMode: 'rgb',      palette: ['#f72585','#7209b7','#3a0ca3','#4361ee','#4cc9f0'] },
    transform: { splitMask: 'quad', scale: 1.2, rotation: 30, position: { x: 0, y: 0 }, transition: { x: 0, y: 26 } },
    motion: {
      scale:  { type: 'off',  noise: { effectOrder: 'forward', amplitude: 30, frequency: 0.5, speed: 0.5, seed: 0 }, sine: { effectOrder: 'forward', amplitude: 30, frequency: 1, cycles: 1, phase: 0 } },
      xMove:  { type: 'off',  noise: { effectOrder: 'forward', amplitude: 30, frequency: 0.5, speed: 0.5, seed: 0 }, sine: { effectOrder: 'forward', amplitude: 30, frequency: 1, cycles: 1, phase: 0 } },
      yMove:  { type: 'off',  noise: { effectOrder: 'forward', amplitude: 30, frequency: 0.5, speed: 0.5, seed: 0 }, sine: { effectOrder: 'forward', amplitude: 30, frequency: 1, cycles: 1, phase: 0 } },
      rotate: { type: 'noise', noise: { effectOrder: 'equal', amplitude: 60, frequency: 0.2, speed: 0.3, seed: 77 }, sine: { effectOrder: 'forward', amplitude: 30, frequency: 1, cycles: 1, phase: 0 } },
    },
  },

  'Lotus Metamorphosis': {
    shape:     { type: 'petals',    count: 12, scaleSequence: 0.90 },
    color:     { stylingType: 'fill',   strokeWidth: 1,   drawingMode: 'lch',      palette: ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#c77dff'] },
    transform: { splitMask: 'none', scale: 1.0, rotation: 0, position: { x: 0, y: 0 }, transition: { x: 0, y: 30 } },
    motion: {
      scale:  { type: 'off',   noise: { effectOrder: 'forward', amplitude: 30, frequency: 0.5, speed: 0.5, seed: 0 }, sine: { effectOrder: 'forward', amplitude: 30, frequency: 1, cycles: 1, phase: 0 } },
      xMove:  { type: 'noise', noise: { effectOrder: 'forward', amplitude: 15, frequency: 0.3, speed: 0.4, seed: 12 }, sine: { effectOrder: 'forward', amplitude: 30, frequency: 1, cycles: 1, phase: 0 } },
      yMove:  { type: 'noise', noise: { effectOrder: 'forward', amplitude: 10, frequency: 0.3, speed: 0.3, seed: 55 }, sine: { effectOrder: 'forward', amplitude: 30, frequency: 1, cycles: 1, phase: 0 } },
      rotate: { type: 'noise', noise: { effectOrder: 'forward', amplitude: 25, frequency: 0.2, speed: 0.5, seed: 33 }, sine: { effectOrder: 'forward', amplitude: 30, frequency: 1, cycles: 1, phase: 0 } },
    },
  },

  'Hypnotic Garden': {
    shape:     { type: 'ring',      count: 18, scaleSequence: 0.93 },
    color:     { stylingType: 'stroke', strokeWidth: 1,   drawingMode: 'sequence', palette: ['#ffffff','#c8c8c8','#909090','#484848','#111111'] },
    transform: { splitMask: 'horizontal', scale: 1.1, rotation: 0, position: { x: 0, y: 0 }, transition: { x: 5, y: 18 } },
    motion: {
      scale:  { type: 'sinusoidal', noise: { effectOrder: 'forward', amplitude: 30, frequency: 0.5, speed: 0.5, seed: 0 }, sine: { effectOrder: 'forward', amplitude: 0.08, frequency: 1.0, cycles: 2, phase: 0 } },
      xMove:  { type: 'off',        noise: { effectOrder: 'forward', amplitude: 30, frequency: 0.5, speed: 0.5, seed: 0 }, sine: { effectOrder: 'forward', amplitude: 30,   frequency: 1,   cycles: 1, phase: 0 } },
      yMove:  { type: 'off',        noise: { effectOrder: 'forward', amplitude: 30, frequency: 0.5, speed: 0.5, seed: 0 }, sine: { effectOrder: 'forward', amplitude: 30,   frequency: 1,   cycles: 1, phase: 0 } },
      rotate: { type: 'off',        noise: { effectOrder: 'forward', amplitude: 30, frequency: 0.5, speed: 0.5, seed: 0 }, sine: { effectOrder: 'forward', amplitude: 30,   frequency: 1,   cycles: 1, phase: 0 } },
    },
  },

  'Butterfly Effect': {
    shape:     { type: 'oval',      count: 22, scaleSequence: 0.91 },
    color:     { stylingType: 'fill',   strokeWidth: 2,   drawingMode: 'lch',      palette: ['#4a9eff','#ff4a9e','#ffe04a','#4affc3','#ff7a4a'] },
    transform: { splitMask: 'vertical', scale: 0.9, rotation: 45, position: { x: 0, y: 0 }, transition: { x: 20, y: 10 } },
    motion: {
      scale:  { type: 'off',   noise: { effectOrder: 'forward', amplitude: 30, frequency: 0.5, speed: 0.5, seed: 0 }, sine: { effectOrder: 'forward', amplitude: 30, frequency: 1, cycles: 1, phase: 0 } },
      xMove:  { type: 'noise', noise: { effectOrder: 'backward', amplitude: 20, frequency: 0.4, speed: 0.6, seed: 88 }, sine: { effectOrder: 'forward', amplitude: 30, frequency: 1, cycles: 1, phase: 0 } },
      yMove:  { type: 'noise', noise: { effectOrder: 'backward', amplitude: 20, frequency: 0.4, speed: 0.6, seed: 99 }, sine: { effectOrder: 'forward', amplitude: 30, frequency: 1, cycles: 1, phase: 0 } },
      rotate: { type: 'off',   noise: { effectOrder: 'forward', amplitude: 30, frequency: 0.5, speed: 0.5, seed: 0 }, sine: { effectOrder: 'forward', amplitude: 30, frequency: 1, cycles: 1, phase: 0 } },
    },
  },

  'Radical Vortex': {
    shape:     { type: 'triangle',  count: 24, scaleSequence: 0.95 },
    color:     { stylingType: 'stroke', strokeWidth: 1.5, drawingMode: 'rgb',      palette: ['#f72585','#7209b7','#3a0ca3','#4361ee','#4cc9f0'] },
    transform: { splitMask: 'none', scale: 1.3, rotation: 0, position: { x: 0, y: 0 }, transition: { x: 0, y: 12 } },
    motion: {
      scale:  { type: 'off',        noise: { effectOrder: 'forward', amplitude: 30, frequency: 0.5, speed: 0.5, seed: 0 }, sine: { effectOrder: 'forward', amplitude: 30,  frequency: 1,   cycles: 1, phase: 0 } },
      xMove:  { type: 'sinusoidal', noise: { effectOrder: 'forward', amplitude: 30, frequency: 0.5, speed: 0.5, seed: 0 }, sine: { effectOrder: 'forward', amplitude: 22,  frequency: 1.5, cycles: 3, phase: 0 } },
      yMove:  { type: 'off',        noise: { effectOrder: 'forward', amplitude: 30, frequency: 0.5, speed: 0.5, seed: 0 }, sine: { effectOrder: 'forward', amplitude: 30,  frequency: 1,   cycles: 1, phase: 0 } },
      rotate: { type: 'sinusoidal', noise: { effectOrder: 'forward', amplitude: 30, frequency: 0.5, speed: 0.5, seed: 0 }, sine: { effectOrder: 'forward', amplitude: 180, frequency: 1,   cycles: 1, phase: 0 } },
    },
  },

  'Funky Beats': {
    shape:     { type: 'cross',     count: 15, scaleSequence: 0.87 },
    color:     { stylingType: 'fill',   strokeWidth: 2,   drawingMode: 'sequence', palette: ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#c77dff'] },
    transform: { splitMask: 'quad', scale: 0.85, rotation: 0, position: { x: 0, y: 0 }, transition: { x: 0, y: 28 } },
    motion: {
      scale:  { type: 'noise', noise: { effectOrder: 'equal', amplitude: 0.15, frequency: 0.5, speed: 2.0, seed: 11 }, sine: { effectOrder: 'forward', amplitude: 30, frequency: 1, cycles: 1, phase: 0 } },
      xMove:  { type: 'noise', noise: { effectOrder: 'equal', amplitude: 18,   frequency: 0.8, speed: 2.0, seed: 22 }, sine: { effectOrder: 'forward', amplitude: 30, frequency: 1, cycles: 1, phase: 0 } },
      yMove:  { type: 'off',   noise: { effectOrder: 'forward', amplitude: 30, frequency: 0.5, speed: 0.5, seed: 0 }, sine: { effectOrder: 'forward', amplitude: 30, frequency: 1, cycles: 1, phase: 0 } },
      rotate: { type: 'noise', noise: { effectOrder: 'equal', amplitude: 20,   frequency: 0.6, speed: 1.5, seed: 33 }, sine: { effectOrder: 'forward', amplitude: 30, frequency: 1, cycles: 1, phase: 0 } },
    },
  },
};

// ── Public API ────────────────────────────────────────────────
export const presetNames = ['— Select —', ...Object.keys(BUILTIN), 'User Preset'];

export const presetOptions = Object.fromEntries(
  presetNames.map(n => [n, n])
);

/** Load a preset by name into state. Returns true if found. */
export function loadPreset(name) {
  let data = null;
  if (BUILTIN[name]) {
    data = JSON.parse(JSON.stringify(BUILTIN[name]));
  } else if (name === 'User Preset') {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { data = JSON.parse(raw); }
      catch { return false; }
    }
  }
  if (!data) return false;
  applyState(data);
  return true;
}

/** Save current state to localStorage as user preset. */
export function saveUserPreset() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cloneState()));
}

/** Export current state as a downloaded JSON file. */
export function exportPresetJSON() {
  const json = JSON.stringify(cloneState(), null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: 'splitx-preset.json' });
  a.click();
  URL.revokeObjectURL(url);
}

/** Import state from a JSON object (already parsed). */
export function importPresetJSON(data) {
  applyState(data);
}
```

**Step 2: Verify**

Will be exercised in Task 9.

---

## Task 6: Write `media.js`

**Files:**
- Rewrite: `src/tools/split/media.js`

**Step 1: Write the file**

```js
// ============================================================
// SPLITX Tool — File Handling (SVG, JSON preset, drag-drop)
// ============================================================

import paper from 'paper';
import { customSvg } from './state.js';
import { importPresetJSON } from './presets.js';

/**
 * Set up drag-drop and the global fileInput for this tool.
 *
 * @param {HTMLElement} canvasContainer
 * @param {{ onSvgLoaded: Function, onPresetLoaded: Function }} callbacks
 * @returns {{ handleFile: Function }}
 */
export function setupMedia(canvasContainer, callbacks) {
  const fileInput = document.getElementById('fileInput');

  // File picker → handleFile
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) dispatchFile(file, callbacks);
      fileInput.value = '';
    });
  }

  // Drag-and-drop onto canvas
  canvasContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    canvasContainer.classList.add('drag-over');
  });
  canvasContainer.addEventListener('dragleave', () => {
    canvasContainer.classList.remove('drag-over');
  });
  canvasContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    canvasContainer.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) dispatchFile(file, callbacks);
  });

  return {
    handleFile: (file) => dispatchFile(file, callbacks),
  };
}

// ── Internal ─────────────────────────────────────────────────
function dispatchFile(file, callbacks) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.svg')) {
    loadSVG(file, callbacks.onSvgLoaded);
  } else if (name.endsWith('.json')) {
    loadJSON(file, callbacks.onPresetLoaded);
  }
}

function loadSVG(file, onDone) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const svgString = e.target.result;
    // Import into paper.js (off-screen — insert: false keeps it out of the active layer)
    const imported = paper.project.importSVG(svgString, { expandShapes: true, insert: false });
    if (imported) {
      // Discard previous custom SVG item if it exists
      if (customSvg.item) customSvg.item.remove();
      customSvg.item = imported;
      onDone?.();
    }
  };
  reader.readAsText(file);
}

function loadJSON(file, onDone) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      importPresetJSON(data);
      onDone?.();
    } catch (err) {
      console.error('SPLITX: failed to parse preset JSON', err);
    }
  };
  reader.readAsText(file);
}
```

**Step 2: Verify**

Will be exercised in Task 9.

---

## Task 7: Rewrite `index.js`

This is the core rendering module. p5 creates and owns the canvas element; paper.js handles all drawing. The `paper.view.onFrame` callback drives animation when any motion channel is active.

**Files:**
- Rewrite: `src/tools/split/index.js`

**Step 1: Write the file**

```js
// ============================================================
// SPLITX Tool — Entry Point
// ============================================================

import p5    from 'p5';
import paper from 'paper';
import { createNoise2D } from 'simplex-noise';

import {
  canvas, shape, color, transform, motion, animState, options,
  computeCanvasSize,
} from './state.js';
import { getShapePath }   from './shapes.js';
import { colorForCopy }   from './color.js';
import { setupUI }        from './ui.js';
import { setupMedia }     from './media.js';
import { exportComposition } from './export.js';

const noise2D = createNoise2D();

export async function loadSplitTool(canvasContainer, paneContainer) {
  let p5Instance  = null;
  let uiInstance  = null;
  let paperProj   = null;
  let cnvEl       = null;  // raw HTMLCanvasElement

  // Interactive drag state
  let isDragging       = false;
  let isTransitionDrag = false;
  let lastMx = 0, lastMy = 0;

  // Event listeners (stored for dispose)
  const onMouseDown = (e) => {
    isDragging       = true;
    isTransitionDrag = e.shiftKey;
    lastMx = e.clientX; lastMy = e.clientY;
  };
  const onMouseMove = (e) => {
    if (!isDragging) return;
    const dx = (e.clientX - lastMx) * options.wheelSens;
    const dy = (e.clientY - lastMy) * options.wheelSens;
    lastMx = e.clientX; lastMy = e.clientY;
    if (isTransitionDrag) {
      transform.transition.x += dx;
      transform.transition.y += dy;
    } else {
      transform.position.x += dx;
      transform.position.y += dy;
    }
    render();
    uiInstance?.refresh();
  };
  const onMouseUp   = () => { isDragging = false; };
  const onWheel     = (e) => {
    e.preventDefault();
    const delta = e.deltaY * 0.001 * options.wheelSens;
    if (e.shiftKey) {
      transform.scale = Math.max(0.01, transform.scale - delta);
    } else if (e.ctrlKey || e.metaKey) {
      transform.rotation = ((transform.rotation + delta * 100) % 360 + 360) % 360;
    }
    render();
    uiInstance?.refresh();
  };

  // ── p5 sketch ─────────────────────────────────────────────
  const sketch = (p) => {
    p.setup = () => {
      computeCanvasSize();
      const cnv = p.createCanvas(canvas.width, canvas.height);
      cnv.parent(canvasContainer);
      p.pixelDensity(1);
      p.noLoop(); // p5 is just a canvas holder; paper.js drives rendering

      cnvEl = cnv.elt;
      paper.setup(cnvEl);
      paperProj = paper.project;

      // Animation via paper.js onFrame
      paper.view.onFrame = (event) => {
        if (anyMotionActive()) {
          animState.time += event.delta;
          render();
        }
      };

      // UI
      uiInstance = setupUI(paneContainer, {
        onParamChange: () => render(),
        onCanvasChange: () => {
          computeCanvasSize();
          p.resizeCanvas(canvas.width, canvas.height);
          paper.view.viewSize = new paper.Size(canvas.width, canvas.height);
          render();
        },
        onAnimationChange: () => {
          if (!anyMotionActive()) render();
        },
        onExport: () => {
          exportComposition(cnvEl, paperProj, {
            startLoop:    () => { /* paper onFrame already handles it */ },
            stopLoop:     () => { /* noop */ },
            advanceFrame: (dt) => { animState.time += dt; render(); },
          });
        },
      });

      // Media / file handling
      setupMedia(canvasContainer, {
        onSvgLoaded:    () => render(),
        onPresetLoaded: () => {
          computeCanvasSize();
          p.resizeCanvas(canvas.width, canvas.height);
          paper.view.viewSize = new paper.Size(canvas.width, canvas.height);
          uiInstance?.refresh();
          render();
        },
      });

      // Interactive controls
      canvasContainer.addEventListener('mousedown', onMouseDown);
      canvasContainer.addEventListener('mousemove', onMouseMove);
      canvasContainer.addEventListener('mouseup',   onMouseUp);
      canvasContainer.addEventListener('wheel',     onWheel, { passive: false });

      render();
    };

    p.draw = () => {}; // paper.js drives all rendering
  };

  p5Instance = new p5(sketch, canvasContainer);

  return {
    p5Instance,
    get uiInstance() { return uiInstance; },
    handleFile: (file) => {
      // Dispatch to media.js via the fileInput change event or directly
      const media = setupMedia._instance;
      if (media) media.handleFile(file);
    },
    dispose: () => {
      paper.view.onFrame = null;
      paper.view.remove();
      canvasContainer.removeEventListener('mousedown', onMouseDown);
      canvasContainer.removeEventListener('mousemove', onMouseMove);
      canvasContainer.removeEventListener('mouseup',   onMouseUp);
      canvasContainer.removeEventListener('wheel',     onWheel);
    },
  };

  // ── Rendering ─────────────────────────────────────────────
  function render() {
    if (!paperProj) return;
    paperProj.activeLayer.removeChildren();
    drawBackground();

    const cx = canvas.width  / 2 + transform.position.x;
    const cy = canvas.height / 2 + transform.position.y;

    const baseShape = getShapePath(shape.type, 0);
    baseShape.remove(); // built at origin; we'll clone it
    let accScale = transform.scale;
    const copies = [];

    for (let i = 0; i < shape.count; i++) {
      const copy = baseShape.clone({ insert: false });
      const ms = motionValue('scale',  i);
      const mx = motionValue('xMove',  i);
      const my = motionValue('yMove',  i);
      const mr = motionValue('rotate', i);

      const s = Math.max(0.001, accScale + ms);
      copy.scale(s, new paper.Point(0, 0));
      copy.rotate(transform.rotation + mr, new paper.Point(0, 0));
      copy.translate(new paper.Point(
        cx + transform.transition.x * i + mx,
        cy + transform.transition.y * i + my
      ));
      applyColor(copy, i);
      copies.push(copy);
      accScale *= shape.scaleSequence;
    }

    applyMask(copies);
    paper.view.update();
  }

  function drawBackground() {
    if (canvas.background === 'transparent') return;
    const bg = new paper.Path.Rectangle(
      new paper.Rectangle(0, 0, canvas.width, canvas.height)
    );
    bg.fillColor = canvas.background === 'palette'
      ? (color.palette[canvas.paletteColorIndex] ?? '#000000')
      : canvas.canvasColor;
  }

  function motionValue(channel, i) {
    const ch = motion[channel];
    if (ch.type === 'off') return 0;
    const params = ch[ch.type];
    const count  = shape.count;
    const effectI =
      params.effectOrder === 'forward'  ? i :
      params.effectOrder === 'backward' ? (count - 1 - i) :
      0; // equal

    if (ch.type === 'noise') {
      return noise2D(effectI * params.frequency + params.seed, animState.time * params.speed)
             * params.amplitude;
    }
    if (ch.type === 'sinusoidal') {
      return Math.sin(effectI * params.frequency * params.cycles + params.phase + animState.time)
             * params.amplitude;
    }
    return 0;
  }

  function applyColor(item, i) {
    const hex = colorForCopy(i, shape.count, color);
    if (color.stylingType === 'fill') {
      item.fillColor   = hex;
      item.strokeColor = null;
    } else {
      item.strokeColor = hex;
      item.strokeWidth = color.strokeWidth;
      item.fillColor   = null;
    }
  }

  function applyMask(copies) {
    const group  = new paper.Group(copies); // inserts all into active layer
    const center = new paper.Point(canvas.width / 2, canvas.height / 2);
    if (transform.splitMask === 'horizontal') {
      group.clone().scale(-1, 1, center);
    } else if (transform.splitMask === 'vertical') {
      group.clone().scale(1, -1, center);
    } else if (transform.splitMask === 'quad') {
      group.clone().scale(-1,  1, center);
      group.clone().scale( 1, -1, center);
      group.clone().scale(-1, -1, center);
    }
  }

  function anyMotionActive() {
    return Object.values(motion).some(ch => ch.type !== 'off');
  }
}
```

**Step 2: Verify**

Load the tool in the browser (`npm run dev`, switch to SPLITX). Confirm:
- Canvas renders with default circle shapes
- Browser console has no errors
- Shapes are visible on canvas

---

## Task 8: Rewrite `ui.js`

**Files:**
- Rewrite: `src/tools/split/ui.js`

This is the longest file. Key patterns:
- Three Tweakpane tabs via `pane.addTab({ pages: [...] })`
- Conditional visibility: dispose and recreate blades when a type dropdown changes (same as REFRACT)
- `pane.refresh()` syncs all bindings after preset load
- Palette proxy: since `color.palette` is an array, use a proxy object keyed by index

**Step 1: Write the file**

```js
// ============================================================
// SPLITX Tool — UI (Tweakpane v4)
// ============================================================

import { Pane } from 'tweakpane';
import {
  canvas, shape, color, transform, motion, exportSettings, options,
  ratioOptions, shapeTypeOptions, drawingModeOptions, splitMaskOptions,
  motionTypeOptions, effectOrderOptions, fileTypeOptions, colorPresets,
} from './state.js';
import {
  presetOptions, loadPreset, saveUserPreset, exportPresetJSON,
} from './presets.js';

let pane = null;
let cbs  = {};

// Blade refs that are conditionally shown/hidden
const motionBlades = { scale: [], xMove: [], yMove: [], rotate: [] };
let strokeWidthBlade    = null;
let palColorIndexBlade  = null;

/**
 * @param {HTMLElement} container
 * @param {{
 *   onParamChange: Function,
 *   onCanvasChange: Function,
 *   onAnimationChange: Function,
 *   onExport: Function,
 * }} callbacks
 */
export function setupUI(container, callbacks) {
  cbs = callbacks;
  if (!container) return null;

  pane = new Pane({ container, title: 'SPLITX' });

  const tabs = pane.addTab({
    pages: [{ title: 'MAIN' }, { title: 'EXPORT' }, { title: 'OPTIONS' }],
  });
  const [mainPage, exportPage, optionsPage] = tabs.pages;

  buildMain(mainPage);
  buildExport(exportPage);
  buildOptions(optionsPage);

  updateStrokeWidthVisibility();
  updatePalColorVisibility();

  return pane;
}

// ── MAIN tab ─────────────────────────────────────────────────
function buildMain(page) {
  buildPresets(page);
  buildCanvas(page);
  buildShape(page);
  buildColor(page);
  buildTransform(page);
  buildMotion(page);
}

function buildPresets(page) {
  const presetProxy = { value: '— Select —' };
  const presetsFolder = page.addFolder({ title: 'PRESETS', expanded: true });

  presetsFolder.addBinding(presetProxy, 'value', { label: 'Preset', options: presetOptions })
    .on('change', ({ value }) => {
      if (value === '— Select —') return;
      if (loadPreset(value)) {
        pane.refresh();
        updateStrokeWidthVisibility();
        updatePalColorVisibility();
        rebuildAllMotionBlades(page);
        cbs.onCanvasChange?.();
      }
    });

  presetsFolder.addButton({ title: 'Restart Preset' }).on('click', () => {
    const name = presetProxy.value;
    if (loadPreset(name)) {
      pane.refresh();
      updateStrokeWidthVisibility();
      updatePalColorVisibility();
      rebuildAllMotionBlades(page);
      cbs.onCanvasChange?.();
    }
  });

  presetsFolder.addBlade({ view: 'separator' });

  presetsFolder.addButton({ title: 'Save User Preset' }).on('click', saveUserPreset);
  presetsFolder.addButton({ title: 'Export Preset JSON' }).on('click', exportPresetJSON);
}

function buildCanvas(page) {
  const folder = page.addFolder({ title: 'CANVAS', expanded: true });

  folder.addBinding(canvas, 'ratio', { label: 'Canvas Ratio', options: Object.fromEntries(Object.keys(ratioOptions).map(k => [k, k])) })
    .on('change', () => cbs.onCanvasChange?.());

  folder.addBinding(canvas, 'background', {
    label: 'Background',
    options: { Custom: 'custom', 'Use Palette Color': 'palette', Transparent: 'transparent' },
  }).on('change', () => { updatePalColorVisibility(); cbs.onParamChange?.(); });

  palColorIndexBlade = folder.addBinding(canvas, 'paletteColorIndex', {
    label: 'Palette Color', min: 0, max: 4, step: 1,
  }).on('change', () => cbs.onParamChange?.());

  folder.addBinding(canvas, 'canvasColor', { label: 'Canvas Color', view: 'color' })
    .on('change', () => cbs.onParamChange?.());

  updatePalColorVisibility();
}

function buildShape(page) {
  const folder = page.addFolder({ title: 'SHAPE', expanded: true });
  folder.addBinding(shape, 'type',          { label: 'Choose Type', options: shapeTypeOptions }).on('change', () => cbs.onParamChange?.());
  folder.addBinding(shape, 'count',         { label: 'Shape Count', min: 1, max: 60, step: 1 }).on('change', () => cbs.onParamChange?.());
  folder.addBinding(shape, 'scaleSequence', { label: 'Scale Sequence', min: 0.5, max: 1.5, step: 0.01 }).on('change', () => cbs.onParamChange?.());
}

function buildColor(page) {
  const folder = page.addFolder({ title: 'COLOR', expanded: true });

  folder.addBinding(color, 'stylingType', {
    label: 'Styling Type',
    options: { Fill: 'fill', Stroke: 'stroke' },
  }).on('change', () => { updateStrokeWidthVisibility(); cbs.onParamChange?.(); });

  strokeWidthBlade = folder.addBinding(color, 'strokeWidth', {
    label: 'Stroke Width', min: 0.5, max: 20, step: 0.5,
  }).on('change', () => cbs.onParamChange?.());

  folder.addBinding(color, 'drawingMode', { label: 'Drawing Mode', options: drawingModeOptions })
    .on('change', () => cbs.onParamChange?.());

  folder.addBlade({ view: 'separator' });

  // 5 palette color swatches via proxy objects
  for (let i = 0; i < 5; i++) {
    const proxy = {
      get val() { return color.palette[i]; },
      set val(v) { color.palette[i] = v; },
    };
    folder.addBinding(proxy, 'val', { label: `Color ${i + 1}`, view: 'color' })
      .on('change', () => cbs.onParamChange?.());
  }

  folder.addBlade({ view: 'separator' });

  // Quick-apply color preset buttons
  for (let pi = 0; pi < colorPresets.length; pi++) {
    folder.addButton({ title: `Palette ${pi + 1}` }).on('click', () => {
      colorPresets[pi].forEach((hex, i) => { color.palette[i] = hex; });
      pane.refresh();
      cbs.onParamChange?.();
    });
  }

  folder.addButton({ title: 'Get Random Palette' }).on('click', () => {
    const hue = Math.random() * 360;
    for (let i = 0; i < 5; i++) {
      const h = (hue + i * 55) % 360;
      color.palette[i] = hslToHex(h, 70, 50);
    }
    pane.refresh();
    cbs.onParamChange?.();
  });
}

function buildTransform(page) {
  const folder = page.addFolder({ title: 'TRANSFORM', expanded: true });

  folder.addBinding(transform, 'splitMask', { label: 'Split Mask', options: splitMaskOptions })
    .on('change', () => cbs.onParamChange?.());
  folder.addBinding(transform, 'scale',    { label: 'Scale',    min: 0.05, max: 5, step: 0.01 }).on('change', () => cbs.onParamChange?.());
  folder.addBinding(transform, 'rotation', { label: 'Rotation', min: 0, max: 360, step: 1 }).on('change', () => cbs.onParamChange?.());
  folder.addBinding(transform.position,   'x', { label: 'Position X', min: -500, max: 500, step: 1 }).on('change', () => cbs.onParamChange?.());
  folder.addBinding(transform.position,   'y', { label: 'Position Y', min: -500, max: 500, step: 1 }).on('change', () => cbs.onParamChange?.());
  folder.addBinding(transform.transition, 'x', { label: 'Transition X', min: -200, max: 200, step: 0.5 }).on('change', () => cbs.onParamChange?.());
  folder.addBinding(transform.transition, 'y', { label: 'Transition Y', min: -200, max: 200, step: 0.5 }).on('change', () => cbs.onParamChange?.());

  folder.addBlade({ view: 'separator' });

  folder.addButton({ title: 'Get Random Values' }).on('click', () => {
    transform.splitMask  = Object.values(splitMaskOptions)[Math.floor(Math.random() * 4)];
    transform.scale      = 0.5 + Math.random() * 1.5;
    transform.rotation   = Math.floor(Math.random() * 360);
    transform.transition.x = (Math.random() - 0.5) * 80;
    transform.transition.y = (Math.random() - 0.5) * 80;
    pane.refresh();
    cbs.onParamChange?.();
  });
  folder.addButton({ title: 'Reset to Default' }).on('click', () => {
    transform.splitMask    = 'none';
    transform.scale        = 1.0;
    transform.rotation     = 0;
    transform.position.x   = 0; transform.position.y   = 0;
    transform.transition.x = 0; transform.transition.y = 20;
    pane.refresh();
    cbs.onParamChange?.();
  });
}

function buildMotion(page) {
  for (const [key, label] of [['scale','SCALE'],['xMove','X MOVE'],['yMove','Y MOVE'],['rotate','ROTATE']]) {
    const folder = page.addFolder({ title: label, expanded: false });
    const ch     = motion[key];

    folder.addBinding(ch, 'type', { label: 'Motion Type', options: motionTypeOptions })
      .on('change', () => {
        rebuildMotionBlades(folder, key);
        cbs.onAnimationChange?.();
      });

    buildMotionParamBlades(folder, key);
  }
}

function buildMotionParamBlades(folder, key) {
  const ch = motion[key];
  clearMotionBlades(key);

  if (ch.type === 'noise') {
    const nb = ch.noise;
    const add = (binding) => motionBlades[key].push(binding);
    add(folder.addBinding(nb, 'effectOrder', { label: 'Effect Order', options: effectOrderOptions }).on('change', () => cbs.onParamChange?.()));
    add(folder.addBinding(nb, 'amplitude',   { label: 'Amplitude',   min: 0, max: 200, step: 0.5 }).on('change', () => cbs.onParamChange?.()));
    add(folder.addBinding(nb, 'frequency',   { label: 'Frequency',   min: 0.01, max: 5, step: 0.01 }).on('change', () => cbs.onParamChange?.()));
    add(folder.addBinding(nb, 'speed',       { label: 'Speed',       min: 0, max: 5, step: 0.01 }).on('change', () => cbs.onParamChange?.()));
    add(folder.addBinding(nb, 'seed',        { label: 'Noise Seed',  min: 0, max: 10000, step: 1 }).on('change', () => cbs.onParamChange?.()));
    add(folder.addButton({ title: 'Get Random Values' }).on('click', () => {
      nb.amplitude = Math.random() * 80;
      nb.frequency = 0.1 + Math.random() * 2;
      nb.speed     = 0.1 + Math.random() * 2;
      nb.seed      = Math.floor(Math.random() * 10000);
      pane.refresh(); cbs.onParamChange?.();
    }));
  } else if (ch.type === 'sinusoidal') {
    const sb = ch.sine;
    const add = (binding) => motionBlades[key].push(binding);
    add(folder.addBinding(sb, 'effectOrder', { label: 'Effect Order', options: effectOrderOptions }).on('change', () => cbs.onParamChange?.()));
    add(folder.addBinding(sb, 'amplitude',   { label: 'Amplitude',   min: 0, max: 200, step: 0.5 }).on('change', () => cbs.onParamChange?.()));
    add(folder.addBinding(sb, 'frequency',   { label: 'Frequency',   min: 0.01, max: 5, step: 0.01 }).on('change', () => cbs.onParamChange?.()));
    add(folder.addBinding(sb, 'cycles',      { label: 'Cycles',      min: 1, max: 20, step: 1 }).on('change', () => cbs.onParamChange?.()));
    add(folder.addBinding(sb, 'phase',       { label: 'Phase',       min: 0, max: Math.PI * 2, step: 0.01 }).on('change', () => cbs.onParamChange?.()));
    add(folder.addButton({ title: 'Get Random Values' }).on('click', () => {
      sb.amplitude = Math.random() * 80;
      sb.frequency = 0.1 + Math.random() * 2;
      sb.cycles    = 1 + Math.floor(Math.random() * 8);
      sb.phase     = Math.random() * Math.PI * 2;
      pane.refresh(); cbs.onParamChange?.();
    }));
  }
}

function clearMotionBlades(key) {
  motionBlades[key].forEach(b => b.dispose());
  motionBlades[key] = [];
}

function rebuildMotionBlades(folder, key) {
  clearMotionBlades(key);
  buildMotionParamBlades(folder, key);
}

function rebuildAllMotionBlades(page) {
  // After a preset load, all motion folders need their blades refreshed.
  // Tweakpane doesn't expose a way to get folder references after creation,
  // so re-running pane.refresh() is sufficient here because we're keeping
  // the existing blades. If the type changed, the user will see new blades
  // on next interaction. For full immediate sync, re-create the UI.
  // Simplest approach: dispose + rebuild all motion folders.
  // (We don't store folder refs, so just call pane.refresh instead.)
  pane.refresh();
}

// ── EXPORT tab ───────────────────────────────────────────────
function buildExport(page) {
  const statusProxy = { get val() { return exportSettings.status; } };
  page.addBinding(statusProxy, 'val', { label: 'Status', readonly: true });

  page.addBinding(exportSettings, 'fileType', { label: 'File Type', options: fileTypeOptions })
    .on('change', () => {});

  page.addBinding(exportSettings, 'size',    { label: 'Export Size',    min: 0.25, max: 4, step: 0.25 });
  page.addBinding(exportSettings, 'length',  { label: 'Export Length',  min: 1, max: 60, step: 1 });
  page.addBinding(exportSettings, 'quality', { label: 'Export Quality', min: 1, max: 100, step: 1 });

  page.addBlade({ view: 'separator' });
  page.addButton({ title: 'Export Graphics' }).on('click', () => cbs.onExport?.());
}

// ── OPTIONS tab ───────────────────────────────────────────────
function buildOptions(page) {
  page.addButton({ title: 'Fullscreen' }).on('click', () => {
    document.documentElement.requestFullscreen?.();
  });
  page.addBinding(options, 'margins',     { label: 'Canvas Margins',   min: 0, max: 100, step: 1 })
    .on('change', () => cbs.onParamChange?.());
  page.addBinding(options, 'wheelSens',   { label: 'Wheel Sensitivity', min: 0.1, max: 5, step: 0.1 });
  page.addBinding(options, 'browserColor',{ label: 'Browser Color',    min: 0, max: 100, step: 1 })
    .on('change', () => {
      const v = Math.round(options.browserColor * 2.55);
      const hex = `rgb(${v},${v},${v})`;
      document.body.style.backgroundColor = hex;
    });
}

// ── Conditional visibility ────────────────────────────────────
function updateStrokeWidthVisibility() {
  if (strokeWidthBlade) {
    strokeWidthBlade.hidden = color.stylingType !== 'stroke';
  }
}

function updatePalColorVisibility() {
  if (palColorIndexBlade) {
    palColorIndexBlade.hidden = canvas.background !== 'palette';
  }
}

// ── Helpers ───────────────────────────────────────────────────
function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const col = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * col).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
```

**Step 2: Verify**

With all files in place, load the tool in the browser. Confirm:
- Tweakpane panel renders with MAIN/EXPORT/OPTIONS tabs
- Preset dropdown is visible and populated
- Changing Motion Type shows/hides noise or sine controls

---

## Task 9: Wire Up `handleFile` and Verify

The `handleFile` returned from `loadSplitTool` needs to reach `media.js`. Currently the media setup happens inside `p.setup`, and `handleFile` is returned from the outer function. Fix the closure so they share a reference.

**Files:**
- Modify: `src/tools/split/index.js`

**Step 1: Fix the `handleFile` closure**

In `index.js`, replace the `handleFile` return value with a proper closure. In `p.setup`, store the media instance:

```js
// At loadSplitTool scope:
let mediaInstance = null;

// In p.setup, change setupMedia call to:
mediaInstance = setupMedia(canvasContainer, {
  onSvgLoaded:    () => render(),
  onPresetLoaded: () => { /* ... as before */ },
});

// In the return object, change handleFile to:
handleFile: (file) => {
  if (mediaInstance) mediaInstance.handleFile(file);
},
```

Also remove the erroneous `setupMedia._instance` reference from the original.

**Step 2: Verify in browser**

Run `npm run dev` and open http://localhost:5173.

1. Switch to SPLITX — canvas shows circles, no console errors
2. Open MAIN tab → Presets → select "Split Vibration" — composition changes
3. Click "Star Trails" preset — star shapes appear
4. Change Motion Type to "Sinusoidal" in SCALE motion folder — animation starts
5. Hold click + drag on canvas — position moves
6. Hold Shift + drag on canvas — transition adjusts
7. Drop an SVG file on the canvas — custom shape loads
8. Drop a preset JSON on the canvas — preset loads
9. EXPORT tab → SVG File → Export Graphics — file downloads

---

## Task 10: Cleanup

Delete the obsolete files that are no longer used:

**Files:**
- Delete: `src/tools/split/main.js`
- Delete: `src/tools/split/style.css`

**Step 1: Delete `main.js`**

```bash
rm src/tools/split/main.js
```

**Step 2: Delete `style.css`**

```bash
rm src/tools/split/style.css
```

**Step 3: Verify no broken imports**

```bash
npm run lint
```

Confirm no "module not found" errors in console when switching tools.

---

## Final Verification Checklist

- [ ] Tool switches cleanly (no memory leaks or console errors on switch away and back)
- [ ] All 8 presets load and render correctly
- [ ] All 14 shape types render without errors (cycle through in Shape dropdown)
- [ ] All 4 drawing modes work (Single/Sequence/RGB/LCH)
- [ ] Both Styling Types (Fill/Stroke) work
- [ ] All 3 Split Mask modes work (Horizontal/Vertical/Quad)
- [ ] Motion channels animate when set to Noise or Sinusoidal
- [ ] Motion stops (static render) when all channels are Off
- [ ] Interactive canvas controls work (drag position, shift+drag transition, scroll+shift scale, scroll+ctrl rotation)
- [ ] SVG drag-drop loads custom shape
- [ ] JSON drag-drop imports preset
- [ ] Export: SVG and PNG download files
- [ ] Export: MP4 records and downloads
- [ ] Disposing the tool (switching away) removes paper.js onFrame and event listeners
