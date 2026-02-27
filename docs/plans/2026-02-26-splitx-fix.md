# SPLITX Tool — Formula & Rendering Fix Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the SPLITX tool to match the reference implementation at antlii.work/SPLITX-Tool v0.25 — correct rendering formulas, XOR drawing mode, palette toggle system, and accurate UI controls.

**Architecture:** Switch copy rendering from paper.js scene graph to Canvas2D (using `drawingContext` on an offscreen buffer), which enables XOR compositing and matches the reference's transform stack exactly. Paper.js is kept only for SVG import (media.js) and SVG export. All 6 source files require rewriting; `export.js` and `media.js` need minor updates only.

**Tech Stack:** p5.js v2 (canvas lifecycle, animation loop), Canvas2D API (copy rendering, transforms, compositing), simplex-noise (createNoise3D), Tweakpane v4 (UI), paper.js (SVG import/export only)

**Reference source files studied:**
- `form.js` — rendering loop, all math formulas
- `color.js` — color modes, palette.temp filtering, LCH via colorjs
- `allpresets.js` — 21 preset definitions and state schema

---

## Key Formulas (read before implementing)

### Normalized time
```js
const t = animState.time / Math.max(exportSettings.length, 0.001); // 0→1 per recording length
```

### Scale sequence (linear, NOT geometric)
```js
// form.sequence in state
const seqStart = form.sequence >= 0 ? 1 : form.sequence + 1;
const seqEnd   = form.sequence >= 0 ? 1 - form.sequence : 1;
// Per copy i:
const seqScale = seqStart + (seqEnd - seqStart) * (i / Math.max(count - 1, 1));
```

### Transition (symmetric spread, canvas-relative)
```js
// form.transition.x is a fraction; multiply by halfWidth for pixels
const tDataX = halfW * form.transition.x;
const tDataY = halfH * form.transition.y;
// Per copy i:
const tx = -tDataX + (2 * tDataX) * (i / Math.max(count - 1, 1));
const ty = -tDataY + (2 * tDataY) * (i / Math.max(count - 1, 1));
```

### Position (canvas-relative)
```js
const posX = halfW * transform.position.x;
const posY = halfH * transform.position.y;
```

### 3D noise motion value (−1 to 1)
```js
// createNoise3D from simplex-noise
const noiseFreq = (i / Math.max(count - 1, 1)) * ch.freq;
const tRad      = Math.PI * 2 * t;
const rawNoise  = noise3D(ch.seed * 19.8 + noiseFreq,
                          ch.speed * 5 * Math.sin(tRad),
                          ch.speed * 5 * Math.cos(tRad));
```

### Sinusoidal motion value (−1 to 1)
```js
const sinFreq = (i / Math.max(count - 1, 1)) * Math.PI * 2 * ch.freq;
const rawSine = Math.sin(Math.PI * 2 * t * ch.cycle + sinFreq + Math.PI * 2 * ch.phase);
```

### Effect order wrappers
```js
function applyMoveOrder(i, count, order, rawValue) {
  const v = rawValue;
  if (order === 'forward')  return lerp(0, v, i / Math.max(count - 1, 1));
  if (order === 'backward') return lerp(v, 0, i / Math.max(count - 1, 1));
  if (order === 'equal')    return lerp(-v, v, i / Math.max(count - 1, 1));
  return 0;
}
function applyScaleOrder(i, count, order, rawValue, amp) {
  const v = rawValue * amp;
  if (order === 'forward')  return lerp(0, v, i / Math.max(count - 1, 1));
  if (order === 'backward') return lerp(v, 0, i / Math.max(count - 1, 1));
  if (order === 'equal')    return v; // same for ALL copies
  return 0;
}
const MAX_ROT = Math.PI / 2; // 90° in radians
function applyRotateOrder(i, count, order, rawValue, amp) {
  const v = MAX_ROT * rawValue * amp;
  if (order === 'forward')  return lerp(0,  v, i / Math.max(count - 1, 1));
  if (order === 'backward') return lerp(-v, 0, i / Math.max(count - 1, 1));
  if (order === 'equal')    return lerp(-v, v, i / Math.max(count - 1, 1));
  return 0;
}
function lerp(a, b, t) { return a + (b - a) * t; }
```

### Scale motion: normalize before applyScaleOrder
```js
// noise: normalize to 0→1
const scaledNoise = (rawNoise + 1) / 2;
// sine: normalize to 0→0.5
const scaledSine  = (rawSine + 1) / 4;
```

### Move/xmove/ymove amplitude: fraction of halfWidth
```js
const moveX = applyMoveOrder(i, count, ch.order, rawValue) * halfW * ch.amp;
```

### Rotation: degrees → radians
```js
ctx.rotate(transform.rotation * Math.PI / 180); // global
// per-copy rotate[i] is already in radians (from rotateOrder)
```

---

## Task 1: Rewrite state.js

**Files:**
- Modify: `src/tools/split/state.js` (full rewrite)

**What changes:**
- `shape.sequence` replaces `shape.scaleSequence`
- `color.drawingMode` options: remove `'single'`, add `'xor'`
- `color.paletteIndex` (0–4): which slot is selected for editing
- `color.paletteUse` (`[bool×5]`): active toggle per slot
- `transform.position` and `transform.transition` values are **fractions** (−1 to 1 range)
- Motion channels: rename `noise.amplitude` → `noise.amp`, `sine.amplitude` → `sine.amp`; add `seed` to sine sub-object; rename `sine.cycles` → `sine.cycle`; add `sine.speed` (stored but unused by sine)
- `animState.frame` (integer tick counter) alongside `animState.time`
- `cloneState`/`applyState` updated for new structure

**Step 1: Write state.js**

```js
// ============================================================
// SPLITX Tool — State
// ============================================================

// ── Canvas ───────────────────────────────────────────────────
export const canvas = {
  width:       800,
  height:      800,
  ratio:       '1:1',
  background:  'custom',   // 'custom' | 'palette' | 'transparent'
  canvasColor: '#111111',
  paletteBgSlot: 0,        // which palette index to use for bg
  scale:       0.95,
};

export const ratioOptions = {
  '2:1': [2,1], '16:9': [16,9], '3:2': [3,2], '4:3': [4,3], '5:4': [5,4],
  '1:1': [1,1], '4:5': [4,5],  '3:4': [3,4], '2:3': [2,3], '9:16': [9,16], '1:2': [1,2],
};

export function computeCanvasSize() {
  const [rw, rh] = ratioOptions[canvas.ratio];
  const aspect   = rw / rh;
  const maxW = window.innerWidth  * 0.72 * canvas.scale;
  const maxH = window.innerHeight * canvas.scale;
  let w = maxW, h = w / aspect;
  if (h > maxH) { h = maxH; w = h * aspect; }
  w = Math.floor(w) - (Math.floor(w) % 2);
  h = Math.floor(h) - (Math.floor(h) % 2);
  canvas.width  = Math.max(w, 2);
  canvas.height = Math.max(h, 2);
}

// ── Shape ────────────────────────────────────────────────────
export const shape = {
  type:     'circle',
  count:    20,
  sequence: 0.5,    // scale sequence (fraction; can be negative)
};

export const shapeTypeOptions = {
  Rectangle: 'rectangle', Circle: 'circle',   Ring:    'ring',
  Oval:      'oval',      Triangle: 'triangle', Rhombus: 'rhombus',
  Cross:     'cross',     Star: 'star',         Hexagon: 'hexagon',
  Petals:    'petals',    Checker: 'checker',   Blob:    'blob',
  Organic:   'organic',   Custom:  'custom',
};

// ── Color ────────────────────────────────────────────────────
export const color = {
  stylingType:  'stroke',
  strokeWidth:  2,
  drawingMode:  'sequence', // 'xor' | 'sequence' | 'rgb' | 'lch'
  paletteIndex: 0,          // which slot is selected for editing
  paletteUse:   [true, true, true, true, true],
  palette:      ['#4a9eff', '#ff4a9e', '#ffe04a', '#4affc3', '#ff7a4a'],
};

export const drawingModeOptions = {
  'Cutout (XOR)':     'xor',
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
  position:   { x: 0.0, y: 0.0 },    // canvas-relative fractions (× halfWidth)
  transition: { x: 0.0, y: 0.5 },    // canvas-relative fractions (× halfWidth)
};

export const splitMaskOptions = {
  None: 'none', Horizontal: 'horizontal', Vertical: 'vertical', Quad: 'quad',
};

// ── Motion (4 channels) ───────────────────────────────────────
function makeChannel() {
  return {
    type:  'off',
    // All params stored for both noise and sine (preserved when switching types)
    order: 'forward',
    amp:   0.3,
    freq:  0.5,
    cycle: 2,
    phase: 0.0,
    speed: 0.3,
    seed:  Math.floor(Math.random() * 1000),
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
  margins:     20,
  wheelSens:   1.0,
  browserColor: 10,
};

// ── Runtime (not serialized) ──────────────────────────────────
export const animState = {
  time:  0,   // seconds elapsed
  frame: 0,   // integer tick counter
};

export const customSvg = {
  item: null,  // paper.js Item set by media.js when an SVG is loaded
};

// ── Preset helpers ───────────────────────────────────────────
export function cloneState() {
  return JSON.parse(JSON.stringify({ canvas, shape, color, transform, motion, exportSettings }));
}

export function applyState(saved) {
  function deepMerge(target, source) {
    for (const key of Object.keys(source)) {
      if (
        typeof source[key] === 'object' && source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof target[key] === 'object' && target[key] !== null
      ) {
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  if (saved.canvas)         deepMerge(canvas,         saved.canvas);
  if (saved.shape)          deepMerge(shape,           saved.shape);
  if (saved.color)          deepMerge(color,           saved.color);
  if (saved.transform)      deepMerge(transform,       saved.transform);
  if (saved.motion)         deepMerge(motion,          saved.motion);
  if (saved.exportSettings) deepMerge(exportSettings,  saved.exportSettings);
}
```

**Step 2: Verify build passes**
```bash
npm run build
```
Expected: clean build, no errors.

**Step 3: Commit**
```bash
git add src/tools/split/state.js
git commit -m "feat(splitx): rewrite state.js — new schema with palette.use, fraction units, flat motion channels"
```

---

## Task 2: Rewrite color.js

**Files:**
- Modify: `src/tools/split/color.js` (full rewrite)

**What changes:**
- `buildPaletteTemp(palette, useFlags)` — returns filtered array of active colors
- `colorForCopy(i, count, colorState)` updated:
  - `'xor'` mode: returns `colorState.palette[colorState.paletteIndex]` (single color)
  - `'sequence'`: cycles through `paletteTemp` (active colors only)
  - `'rgb'`/`'lch'`: interpolate across `paletteTemp`
- Remove `'single'` mode

**Step 1: Write color.js**

```js
// ============================================================
// SPLITX Tool — Color System
// ============================================================

// ── Palette temp (active colors only) ────────────────────────
/**
 * Returns the filtered list of active palette colors.
 * For XOR mode, all colors are included regardless of use flags.
 */
export function buildPaletteTemp(palette, useFlags, mode) {
  if (mode === 'xor') return [...palette];
  return palette.filter((_, i) => useFlags[i]);
}

// ── Hex/RGB conversion ────────────────────────────────────────
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
function toLinear(v) { return v <= 0.04045 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); }
function fromLinear(v) { return v <= 0.0031308 ? v*12.92 : 1.055*Math.pow(Math.max(0,v),1/2.4)-0.055; }

function rgbToXyz(r, g, b) {
  r = toLinear(r); g = toLinear(g); b = toLinear(b);
  return [r*0.4124564+g*0.3575761+b*0.1804375, r*0.2126729+g*0.7151522+b*0.0721750, r*0.0193339+g*0.1191920+b*0.9503041];
}
function xyzToRgb(x, y, z) {
  return [fromLinear(x*3.2404542+y*-1.5371385+z*-0.4985314), fromLinear(x*-0.9692660+y*1.8760108+z*0.0415560), fromLinear(x*0.0556434+y*-0.2040259+z*1.0572252)];
}
const D65=[0.95047,1.00000,1.08883];
function fwd(t) { return t>0.008856?Math.cbrt(t):7.787*t+16/116; }
function inv(t) { return t>0.206897?t**3:(t-16/116)/7.787; }
function xyzToLab(x,y,z) { const [fx,fy,fz]=[fwd(x/D65[0]),fwd(y/D65[1]),fwd(z/D65[2])]; return [116*fy-16,500*(fx-fy),200*(fy-fz)]; }
function labToXyz(L,a,b) { const fy=(L+16)/116; return [D65[0]*inv(fy+a/500),D65[1]*inv(fy),D65[2]*inv(fy-b/200)]; }
function labToLch(L,a,b) { return [L,Math.sqrt(a*a+b*b),((Math.atan2(b,a)*180)/Math.PI+360)%360]; }
function lchToLab(L,C,H) { const hr=(H*Math.PI)/180; return [L,C*Math.cos(hr),C*Math.sin(hr)]; }
function hexToLch(hex) { const [r,g,b]=hexToRgb(hex); const [x,y,z]=rgbToXyz(r,g,b); const [L,a,lb]=xyzToLab(x,y,z); return labToLch(L,a,lb); }
function lchToHex(L,C,H) { const [La,a,b]=lchToLab(L,C,H); const [x,y,z]=labToXyz(La,a,b); const [r,g,bl]=xyzToRgb(x,y,z); return rgbToHex(r,g,bl); }

function lerpRgb(hexA, hexB, t) {
  const [r1,g1,b1]=hexToRgb(hexA), [r2,g2,b2]=hexToRgb(hexB);
  return rgbToHex(r1+(r2-r1)*t, g1+(g2-g1)*t, b1+(b2-b1)*t);
}
function lerpLch(hexA, hexB, t) {
  const [L1,C1,H1]=hexToLch(hexA), [L2,C2,H2]=hexToLch(hexB);
  let dH=H2-H1; if(dH>180)dH-=360; if(dH<-180)dH+=360;
  return lchToHex(L1+(L2-L1)*t, C1+(C2-C1)*t, H1+dH*t);
}

function paletteInterp(palette, t, lerpFn) {
  if (palette.length < 2) return palette[0] ?? '#000000';
  const n=palette.length-1, seg=n*t, idx=Math.min(Math.floor(seg),n-1), frac=seg-idx;
  return lerpFn(palette[idx], palette[idx+1], frac);
}

// ── Public API ────────────────────────────────────────────────
/**
 * Return hex color for copy i out of count total.
 * paletteTemp = pre-filtered active colors (from buildPaletteTemp).
 */
export function colorForCopy(i, count, colorState, paletteTemp) {
  const { drawingMode, palette, paletteIndex } = colorState;
  switch (drawingMode) {
    case 'xor':
      return palette[paletteIndex] ?? palette[0];
    case 'sequence': {
      const temp = paletteTemp.length > 0 ? paletteTemp : palette;
      return temp[i % temp.length];
    }
    case 'rgb': {
      const temp = paletteTemp.length > 0 ? paletteTemp : palette;
      if (count <= 1) return temp[0];
      return paletteInterp(temp, i / (count - 1), lerpRgb);
    }
    case 'lch': {
      const temp = paletteTemp.length > 0 ? paletteTemp : palette;
      if (count <= 1) return temp[0];
      return paletteInterp(temp, i / (count - 1), lerpLch);
    }
    default:
      return palette[0];
  }
}
```

**Step 2: Verify build**
```bash
npm run build
```

**Step 3: Commit**
```bash
git add src/tools/split/color.js
git commit -m "feat(splitx): rewrite color.js — XOR mode, palette.use filtering, remove single mode"
```

---

## Task 3: Rewrite shapes.js (Path2D generator)

**Files:**
- Modify: `src/tools/split/shapes.js` (full rewrite)

**What changes:**
- Remove paper.js dependency entirely from shapes.js
- Export `getShapePath2D(type, r, customSvg)` returning a `Path2D`
- Shapes are built as SVG path strings (no paper.js in the hot path)
- `customSvg` is a paper.js item (imported via media.js); extract `.pathData` for custom type
- Cache the last shape to avoid rebuilding every frame

**Step 1: Write shapes.js**

```js
// ============================================================
// SPLITX Tool — Shape Generators (Path2D for Canvas2D)
// ============================================================

import { createNoise2D } from 'simplex-noise';

const noise2D = createNoise2D();

// Cache: rebuild only when type or r changes
let _cache = { type: null, r: null, path2d: null };

/**
 * Returns a Path2D for the given shape type, centered at origin (0,0).
 * r = base radius in pixels.
 * customSvgItem = paper.js item (only used for 'custom' type).
 */
export function getShapePath2D(type, r, customSvgItem = null) {
  if (_cache.type === type && _cache.r === r && type !== 'blob' && type !== 'organic') {
    return _cache.path2d;
  }
  const path2d = buildPath2D(type, r, customSvgItem);
  _cache = { type, r, path2d };
  return path2d;
}

/** Invalidate the cache (call when canvas is resized). */
export function invalidateShapeCache() {
  _cache = { type: null, r: null, path2d: null };
}

function buildPath2D(type, r, customSvgItem) {
  switch (type) {
    case 'rectangle': return rectPath(r * 2, r * 1.3);
    case 'circle':    return circlePath(r);
    case 'ring':      return ringPath(r, r * 0.58);
    case 'oval':      return rectEllipsePath(r * 3.1, r * 1.2);
    case 'triangle':  return polygonPath(3, r, -Math.PI / 2);
    case 'rhombus':   return rhombusPath(r * 0.65, r);
    case 'cross':     return crossPath(r);
    case 'star':      return starPath(5, r * 0.4, r);
    case 'hexagon':   return polygonPath(6, r, -Math.PI / 6);
    case 'petals':    return petalsPath(6, r);
    case 'checker':   return checkerPath(r, 4);
    case 'blob':      return blobPath(r, 8);
    case 'organic':   return organicPath(r, 12);
    case 'custom':    return customPath(r, customSvgItem);
    default:          return circlePath(r);
  }
}

// ── Shape builders ────────────────────────────────────────────

function circlePath(r) {
  const p = new Path2D();
  p.arc(0, 0, r, 0, Math.PI * 2);
  return p;
}

function rectPath(w, h) {
  const p = new Path2D();
  p.rect(-w / 2, -h / 2, w, h);
  return p;
}

function rectEllipsePath(w, h) {
  const p = new Path2D();
  p.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
  return p;
}

function ringPath(outer, inner) {
  const p = new Path2D();
  p.arc(0, 0, outer, 0, Math.PI * 2);
  p.arc(0, 0, inner, 0, Math.PI * 2, true); // clockwise=true cuts hole
  return p;
}

function polygonPath(sides, r, startAngle = 0) {
  const p = new Path2D();
  for (let i = 0; i < sides; i++) {
    const a = startAngle + (i / sides) * Math.PI * 2;
    if (i === 0) p.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else         p.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  p.closePath();
  return p;
}

function rhombusPath(hw, hh) {
  const p = new Path2D();
  p.moveTo(0, -hh); p.lineTo(hw, 0); p.lineTo(0, hh); p.lineTo(-hw, 0);
  p.closePath();
  return p;
}

function crossPath(r) {
  const t = r * 0.32;
  const p = new Path2D();
  p.moveTo(-t, -r); p.lineTo(t, -r); p.lineTo(t, -t); p.lineTo(r, -t);
  p.lineTo(r, t);   p.lineTo(t, t);  p.lineTo(t, r);  p.lineTo(-t, r);
  p.lineTo(-t, t);  p.lineTo(-r, t); p.lineTo(-r, -t);p.lineTo(-t, -t);
  p.closePath();
  return p;
}

function starPath(points, innerR, outerR) {
  const p = new Path2D();
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const rv = i % 2 === 0 ? outerR : innerR;
    if (i === 0) p.moveTo(Math.cos(a) * rv, Math.sin(a) * rv);
    else         p.lineTo(Math.cos(a) * rv, Math.sin(a) * rv);
  }
  p.closePath();
  return p;
}

function petalsPath(count, r) {
  const p = new Path2D();
  const w = r * 0.44, h = r;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    // Rotated ellipse petal centered at origin, tip at angle
    // Use parametric ellipse points rotated
    const steps = 36;
    for (let j = 0; j <= steps; j++) {
      const theta = (j / steps) * Math.PI * 2;
      const ex = (w / 2) * Math.cos(theta);
      const ey = (h / 2) * Math.sin(theta) + h / 2; // offset up
      // rotate by angle
      const rx = ex * cos - ey * sin;
      const ry = ex * sin + ey * cos;
      if (j === 0) p.moveTo(rx, ry);
      else         p.lineTo(rx, ry);
    }
    p.closePath();
  }
  return p;
}

function checkerPath(r, grid) {
  const cell = r / grid;
  const p = new Path2D();
  for (let row = 0; row < grid * 2; row++) {
    for (let col = 0; col < grid * 2; col++) {
      if ((row + col) % 2 === 0) {
        const x = (col - grid) * cell;
        const y = (row - grid) * cell;
        p.rect(x, y, cell, cell);
      }
    }
  }
  return p;
}

function blobPath(r, pts) {
  const p = new Path2D();
  const angles = Array.from({ length: pts }, (_, i) => (i / pts) * Math.PI * 2);
  const radii  = angles.map(a => r * (0.75 + noise2D(Math.cos(a) * 2, Math.sin(a) * 2) * 0.32));
  smoothCurvePath(p, angles, radii);
  return p;
}

function organicPath(r, pts) {
  const p = new Path2D();
  const angles = Array.from({ length: pts }, (_, i) => (i / pts) * Math.PI * 2);
  const radii  = angles.map(a => r * (0.5 + noise2D(Math.cos(a) * 3 + 100, Math.sin(a) * 3) * 0.55));
  smoothCurvePath(p, angles, radii);
  return p;
}

function smoothCurvePath(p, angles, radii) {
  const n = angles.length;
  const pts = angles.map((a, i) => [Math.cos(a) * radii[i], Math.sin(a) * radii[i]]);
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const cur  = pts[i];
    const next = pts[(i + 1) % n];
    const cp1x = cur[0] + (next[0] - prev[0]) * 0.2;
    const cp1y = cur[1] + (next[1] - prev[1]) * 0.2;
    if (i === 0) p.moveTo(cur[0], cur[1]);
    else         p.bezierCurveTo(prev[0] + (cur[0] - pts[(i-2+n)%n][0])*0.2,
                                  prev[1] + (cur[1] - pts[(i-2+n)%n][1])*0.2,
                                  cp1x - (next[0] - cur[0])*0.2,
                                  cp1y - (next[1] - cur[1])*0.2,
                                  cur[0], cur[1]);
  }
  p.closePath();
}

function customPath(r, svgItem) {
  if (!svgItem) return circlePath(r);
  try {
    // paper.js item has pathData getter (SVG path string)
    const svgStr = svgItem.pathData ?? svgItem.exportSVG({ asString: true });
    if (svgStr) return new Path2D(svgStr);
  } catch (e) {
    // fall through
  }
  return circlePath(r);
}
```

**Step 2: Verify build**
```bash
npm run build
```

**Step 3: Commit**
```bash
git add src/tools/split/shapes.js
git commit -m "feat(splitx): rewrite shapes.js — Canvas2D Path2D generators, remove paper.js dependency"
```

---

## Task 4: Rewrite index.js

**Files:**
- Modify: `src/tools/split/index.js` (full rewrite)

**What changes (critical):**
- Canvas2D rendering via offscreen canvas buffer (`gForm`) — matches reference architecture
- XOR compositing: set `gForm.globalCompositeOperation = 'xor'` before copy loop
- Correct transform stack order (center → position → global scale/rotate → per-copy)
- Scale sequence: linear interpolation, not geometric
- Transition: symmetric spread × halfWidth
- Position: fraction × halfWidth
- Motion: 3D simplex noise (createNoise3D), frame-normalized sine
- Effect orders: applyMoveOrder / applyScaleOrder / applyRotateOrder
- Split mask: drawImage with flip transforms on main canvas
- Paper.js: kept only for SVG export (paper.setup still called for media.js SVG import)
- Animation: `paper.view.onFrame` advances `animState.time` and `animState.frame`

**Step 1: Write index.js**

```js
// ============================================================
// SPLITX Tool — Entry Point
// ============================================================

import p5    from 'p5';
import paper from 'paper';
import { createNoise3D } from 'simplex-noise';

import {
  canvas, shape, color, transform, motion, animState, options, exportSettings,
  computeCanvasSize,
} from './state.js';
import { getShapePath2D, invalidateShapeCache } from './shapes.js';
import { colorForCopy, buildPaletteTemp }       from './color.js';
import { setupUI }                              from './ui.js';
import { setupMedia }                           from './media.js';
import { exportComposition }                    from './export.js';
import { customSvg }                            from './state.js';

// ── Noise instances (one per motion channel) ──────────────────
const noise3D = {
  scale:  createNoise3D(),
  xMove:  createNoise3D(),
  yMove:  createNoise3D(),
  rotate: createNoise3D(),
};

export async function loadSplitTool(canvasContainer, paneContainer) {
  let p5Instance    = null;
  let uiInstance    = null;
  let cnvEl         = null;
  let mediaInstance = null;

  // Offscreen buffer for copy rendering (enables XOR compositing + split mask)
  let gForm = null;

  // ── Interactive drag state ────────────────────────────────
  let isDragging = false, isTransitionDrag = false, lastMx = 0, lastMy = 0;

  const onMouseDown = (e) => {
    isDragging = true;
    isTransitionDrag = e.shiftKey;
    lastMx = e.clientX; lastMy = e.clientY;
  };
  const onMouseMove = (e) => {
    if (!isDragging) return;
    const dx = (e.clientX - lastMx) * options.wheelSens;
    const dy = (e.clientY - lastMy) * options.wheelSens;
    lastMx = e.clientX; lastMy = e.clientY;
    const halfW = canvas.width  / 2;
    const halfH = canvas.height / 2;
    if (isTransitionDrag) {
      transform.transition.x += dx / halfW;
      transform.transition.y += dy / halfH;
    } else {
      transform.position.x += dx / halfW;
      transform.position.y += dy / halfH;
    }
    render();
    uiInstance?.refresh();
  };
  const onMouseUp = () => { isDragging = false; };
  const onWheel   = (e) => {
    if (!e.shiftKey && !e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const delta = e.deltaY * 0.001 * options.wheelSens;
    if (e.shiftKey)              transform.scale    = Math.max(0.01, transform.scale - delta);
    else if (e.ctrlKey || e.metaKey) transform.rotation = transform.rotation + delta * 100;
    render();
    uiInstance?.refresh();
  };

  // ── p5 sketch ──────────────────────────────────────────────
  const sketch = (p) => {
    p.setup = () => {
      computeCanvasSize();
      p.pixelDensity(1);
      const cnv = p.createCanvas(canvas.width, canvas.height);
      cnv.parent(canvasContainer);
      p.noLoop();

      cnvEl = cnv.elt;

      // paper.js: init for SVG import/export only (not used for rendering)
      paper.setup(cnvEl);

      // Build offscreen form buffer
      gForm = document.createElement('canvas');
      gForm.width  = canvas.width;
      gForm.height = canvas.height;

      // Animation via paper.js onFrame (still works even without paper rendering)
      paper.view.onFrame = (event) => {
        if (anyMotionActive()) {
          animState.time  += event.delta;
          animState.frame += 1;
          render();
        }
      };

      uiInstance = setupUI(paneContainer, {
        onParamChange: () => render(),
        onCanvasChange: () => {
          computeCanvasSize();
          p.resizeCanvas(canvas.width, canvas.height);
          gForm.width  = canvas.width;
          gForm.height = canvas.height;
          invalidateShapeCache();
          render();
        },
        onAnimationChange: () => { if (!anyMotionActive()) render(); },
        onExport: () => {
          exportComposition(cnvEl, paper.project, {
            startLoop:    () => {},
            stopLoop:     () => {},
            advanceFrame: (dt) => { animState.time += dt; animState.frame += 1; render(); },
            renderForSVG: () => renderToPaper(),
          });
        },
      });

      mediaInstance = setupMedia(canvasContainer, {
        onSvgLoaded: () => { invalidateShapeCache(); render(); },
        onPresetLoaded: () => {
          computeCanvasSize();
          p.resizeCanvas(canvas.width, canvas.height);
          gForm.width  = canvas.width;
          gForm.height = canvas.height;
          invalidateShapeCache();
          uiInstance?.refresh();
          render();
        },
      });

      canvasContainer.addEventListener('mousedown', onMouseDown);
      canvasContainer.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup',            onMouseUp);
      canvasContainer.addEventListener('wheel',     onWheel, { passive: false });

      render();
    };

    p.draw = () => {}; // paper.js onFrame drives animation
  };

  p5Instance = new p5(sketch, canvasContainer);

  return {
    p5Instance,
    get uiInstance() { return uiInstance; },
    handleFile: (file) => { if (mediaInstance) mediaInstance.handleFile(file); },
    dispose: () => {
      paper.view.onFrame = null;
      paper.view.remove();
      uiInstance?.dispose();
      mediaInstance?.dispose();
      canvasContainer.removeEventListener('mousedown', onMouseDown);
      canvasContainer.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',            onMouseUp);
      canvasContainer.removeEventListener('wheel',     onWheel);
    },
  };

  // ── Rendering ──────────────────────────────────────────────

  function render() {
    if (!cnvEl || !gForm) return;

    const mainCtx = cnvEl.getContext('2d');
    const halfW   = canvas.width  / 2;
    const halfH   = canvas.height / 2;
    const count   = shape.count;
    const t       = animState.time / Math.max(exportSettings.length, 0.001);

    // Clear main canvas and draw background
    mainCtx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground(mainCtx);

    // Build shape (cached)
    const r         = Math.min(canvas.width, canvas.height) * 0.08;
    const shapePath = getShapePath2D(shape.type, r, customSvg.item);

    // Precompute palette temp (active colors)
    const paletteTemp = buildPaletteTemp(color.palette, color.paletteUse, color.drawingMode);

    // Scale sequence bounds
    const seqStart = shape.sequence >= 0 ? 1 : shape.sequence + 1;
    const seqEnd   = shape.sequence >= 0 ? 1 - shape.sequence : 1;

    // Precompute per-copy values
    const transitions = [], moves = [], scales = [], rotates = [], colors = [];

    for (let i = 0; i < count; i++) {
      const fi = count > 1 ? i / (count - 1) : 0; // 0→1

      // Transition (symmetric spread, canvas-relative)
      transitions.push({
        x: lerp(-halfW * transform.transition.x, halfW * transform.transition.x, fi),
        y: lerp(-halfH * transform.transition.y, halfH * transform.transition.y, fi),
      });

      // Motion — xMove
      moves.push({
        x: computeMoveOffset('xMove', i, count, t, halfW),
        y: computeMoveOffset('yMove', i, count, t, halfW),
      });

      // Scale sequence + motion
      const seqBase    = lerp(seqStart, seqEnd, fi);
      const scaleMotion = computeScaleOffset('scale', i, count, t);
      scales.push(Math.max(0.001, seqBase + scaleMotion));

      // Rotation motion
      rotates.push(computeRotateOffset('rotate', i, count, t));

      // Color
      colors.push(colorForCopy(i, count, color, paletteTemp));
    }

    // ── Draw copies to offscreen gForm buffer ────────────────
    const gCtx = gForm.getContext('2d');
    gCtx.clearRect(0, 0, gForm.width, gForm.height);

    // XOR compositing: set before drawing any copies
    if (color.drawingMode === 'xor' && color.stylingType === 'fill') {
      gCtx.globalCompositeOperation = 'xor';
    } else {
      gCtx.globalCompositeOperation = 'source-over';
    }

    gCtx.save();
    gCtx.translate(halfW, halfH);                                          // center origin
    gCtx.translate(halfW * transform.position.x, halfH * transform.position.y); // global position
    gCtx.scale(transform.scale, transform.scale);                          // global scale
    gCtx.rotate(transform.rotation * Math.PI / 180);                       // global rotation

    for (let i = 0; i < count; i++) {
      gCtx.save();
      gCtx.translate(transitions[i].x, transitions[i].y);
      gCtx.translate(moves[i].x, moves[i].y);
      gCtx.scale(scales[i], scales[i]);
      gCtx.rotate(rotates[i]);

      gCtx.beginPath();
      if (color.stylingType === 'fill') {
        gCtx.fillStyle = colors[i];
        gCtx.fill(shapePath, 'evenodd');
      } else {
        gCtx.strokeStyle = colors[i];
        gCtx.lineWidth   = color.strokeWidth / scales[i]; // compensate for scale
        gCtx.stroke(shapePath);
      }
      gCtx.restore();
    }

    gCtx.restore();
    gCtx.globalCompositeOperation = 'source-over'; // always reset

    // ── Composite gForm onto main canvas with split mask ─────
    applyMirror(mainCtx);
  }

  function drawBackground(ctx) {
    if (canvas.background === 'transparent') return;
    ctx.fillStyle = canvas.background === 'palette'
      ? (color.palette[canvas.paletteBgSlot] ?? '#000000')
      : canvas.canvasColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function applyMirror(ctx) {
    const w = canvas.width, h = canvas.height;

    // Original
    ctx.drawImage(gForm, 0, 0);

    if (transform.splitMask === 'horizontal') {
      ctx.save();
      ctx.translate(w, 0); ctx.scale(-1, 1);
      ctx.drawImage(gForm, 0, 0);
      ctx.restore();
    } else if (transform.splitMask === 'vertical') {
      ctx.save();
      ctx.translate(0, h); ctx.scale(1, -1);
      ctx.drawImage(gForm, 0, 0);
      ctx.restore();
    } else if (transform.splitMask === 'quad') {
      ctx.save(); ctx.translate(w, 0); ctx.scale(-1,  1); ctx.drawImage(gForm, 0, 0); ctx.restore();
      ctx.save(); ctx.translate(0, h); ctx.scale( 1, -1); ctx.drawImage(gForm, 0, 0); ctx.restore();
      ctx.save(); ctx.translate(w, h); ctx.scale(-1, -1); ctx.drawImage(gForm, 0, 0); ctx.restore();
    }
  }

  // ── Motion helpers ────────────────────────────────────────

  function lerp(a, b, t) { return a + (b - a) * t; }

  function rawMotionValue(chKey, i, count, t, noise3DFn) {
    const ch = motion[chKey];
    if (ch.type === 'off') return 0;
    const fi     = count > 1 ? i / (count - 1) : 0;
    const tRad   = Math.PI * 2 * t;
    if (ch.type === 'noise') {
      const noiseFreq = fi * ch.freq;
      const speedVal  = ch.speed * 5;
      return noise3DFn(ch.seed * 19.8 + noiseFreq,
                       speedVal * Math.sin(tRad),
                       speedVal * Math.cos(tRad));
    }
    // sinusoidal
    const sinFreq = fi * Math.PI * 2 * ch.freq;
    return Math.sin(Math.PI * 2 * t * ch.cycle + sinFreq + Math.PI * 2 * ch.phase);
  }

  function computeMoveOffset(chKey, i, count, t, halfW) {
    const ch = motion[chKey];
    const raw = rawMotionValue(chKey, i, count, t, noise3D[chKey]);
    const fi  = count > 1 ? i / (count - 1) : 0;
    let ordered;
    if      (ch.order === 'forward')  ordered = lerp(0, raw, fi);
    else if (ch.order === 'backward') ordered = lerp(raw, 0, fi);
    else                              ordered = lerp(-raw, raw, fi); // equal
    return ordered * halfW * ch.amp;
  }

  function computeScaleOffset(chKey, i, count, t) {
    const ch  = motion[chKey];
    const raw = rawMotionValue(chKey, i, count, t, noise3D[chKey]);
    // Normalize: noise → 0..1, sine → 0..0.5
    const norm = ch.type === 'noise' ? (raw + 1) / 2 : (raw + 1) / 4;
    const fi   = count > 1 ? i / (count - 1) : 0;
    const v    = norm * ch.amp;
    if      (ch.order === 'forward')  return lerp(0, v, fi);
    else if (ch.order === 'backward') return lerp(v, 0, fi);
    else                              return v; // equal = same for all
  }

  const MAX_ROT = Math.PI / 2;
  function computeRotateOffset(chKey, i, count, t) {
    const ch  = motion[chKey];
    const raw = rawMotionValue(chKey, i, count, t, noise3D[chKey]);
    const v   = MAX_ROT * raw * ch.amp;
    const fi  = count > 1 ? i / (count - 1) : 0;
    if      (ch.order === 'forward')  return lerp(0,  v, fi);
    else if (ch.order === 'backward') return lerp(-v, 0, fi);
    else                              return lerp(-v, v, fi); // equal
  }

  function anyMotionActive() {
    return Object.values(motion).some(ch => ch.type !== 'off');
  }

  // ── SVG export: rebuild paper.js scene then export ──────────
  function renderToPaper() {
    paper.project.activeLayer.removeChildren();
    const halfW = canvas.width  / 2;
    const halfH = canvas.height / 2;
    const count = shape.count;
    const t     = animState.time / Math.max(exportSettings.length, 0.001);

    if (canvas.background !== 'transparent') {
      const bg = new paper.Path.Rectangle(new paper.Rectangle(0, 0, canvas.width, canvas.height));
      bg.fillColor = canvas.background === 'palette'
        ? (color.palette[canvas.paletteBgSlot] ?? '#000000')
        : canvas.canvasColor;
    }

    const paletteTemp = buildPaletteTemp(color.palette, color.paletteUse, color.drawingMode);
    const seqStart = shape.sequence >= 0 ? 1 : shape.sequence + 1;
    const seqEnd   = shape.sequence >= 0 ? 1 - shape.sequence : 1;
    const r = Math.min(canvas.width, canvas.height) * 0.08;

    // Import shapes.js getShapePath (paper.js) if available; fall back to circle
    // Note: we lazily import to avoid circular deps
    const copies = [];
    for (let i = 0; i < count; i++) {
      const fi = count > 1 ? i / (count - 1) : 0;
      const tx = lerp(-halfW * transform.transition.x, halfW * transform.transition.x, fi);
      const ty = lerp(-halfH * transform.transition.y, halfH * transform.transition.y, fi);
      const mx = computeMoveOffset('xMove', i, count, t, halfW);
      const my = computeMoveOffset('yMove', i, count, t, halfW);
      const sc = Math.max(0.001, lerp(seqStart, seqEnd, fi) + computeScaleOffset('scale', i, count, t));
      const ro = computeRotateOffset('rotate', i, count, t);
      const col = colorForCopy(i, count, color, paletteTemp);

      const cx = halfW + halfW * transform.position.x + tx + mx;
      const cy = halfH + halfH * transform.position.y + ty + my;

      const circle = new paper.Path.Circle(new paper.Point(cx, cy), r * transform.scale * sc);
      if (color.stylingType === 'fill') {
        circle.fillColor   = col;
        circle.strokeColor = null;
      } else {
        circle.strokeColor = col;
        circle.strokeWidth = color.strokeWidth;
        circle.fillColor   = null;
      }
      copies.push(circle);
    }
  }
}
```

**Step 2: Verify build**
```bash
npm run build
```
Expected: clean build.

**Step 3: Visual check in browser**
```bash
npm run dev
```
Open http://localhost:5173, switch to SPLITX tool. Verify:
- Canvas renders (shapes visible)
- Split Vibration preset: orange/black XOR pattern
- Quad split mask: 4-quadrant mirror

**Step 4: Commit**
```bash
git add src/tools/split/index.js
git commit -m "feat(splitx): rewrite index.js — Canvas2D rendering, XOR mode, correct formulas"
```

---

## Task 5: Rewrite ui.js

**Files:**
- Modify: `src/tools/split/ui.js` (full rewrite)

**What changes:**
- Drawing mode options: Cutout (XOR) / Sequence / Transition (RGB) / Transition (LCH)
- Palette UX: 5 swatch selector buttons (click to set `color.paletteIndex`) + 5 toggle buttons (click to toggle `color.paletteUse[i]`) + single `Set Color` picker bound to `color.palette[paletteIndex]`
- Motion "Off": keep param controls visible but `disabled = true` — do NOT hide/dispose them
- Scale Sequence range: min -1, max 1, step 0.01
- Amplitude range: min -2, max 2, step 0.01 (allows negative)
- Phase range: min -1, max 1, step 0.01 (allows negative)
- Position/Transition: labeled as fractions (no min/max constraint needed, let users type freely)
- `onParamChange` called through canvas-relative position/transition (already handled in state)
- Remove `palColorIndexBlade` slider — replace with dropdown "Color 1"…"Color 5"
- Motion channel: single flat set of params (order, amp, freq, cycle, phase, speed, seed) not split into noise/sine sub-objects

**Step 1: Write ui.js**

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
import { presetOptions, loadPreset, saveUserPreset, exportPresetJSON } from './presets.js';

let pane = null;
let cbs  = {};

// Blade refs for conditional visibility / rebuild
let strokeWidthBlade   = null;
let paletteBgBlade     = null;   // "Palette Color" dropdown for background slot
const motionFolders = {};
const motionTypeBlades = {};

// Color section handles
let setColorBlade    = null;  // single color picker for selected slot
let swatchButtons    = [];    // 5 swatch selector buttons
let toggleButtons    = [];    // 5 toggle-active buttons

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
  updatePaletteBgVisibility();

  return pane;
}

export function refreshUI() {
  if (pane) pane.refresh();
  updateSwatchUI();
}

// ── MAIN tab ──────────────────────────────────────────────────

function buildMain(page) {
  buildPresets(page);
  buildCanvas(page);
  buildShape(page);
  buildColor(page);
  buildTransform(page);
  buildMotion(page);
}

function buildPresets(page) {
  const proxy = { value: '— Select —' };
  const folder = page.addFolder({ title: 'PRESETS', expanded: true });

  folder.addBinding(proxy, 'value', { label: 'Preset List', options: presetOptions })
    .on('change', ({ value }) => {
      if (value === '— Select —') return;
      if (loadPreset(value)) {
        pane.refresh();
        updateStrokeWidthVisibility();
        updatePaletteBgVisibility();
        rebuildAllMotionParams();
        updateSwatchUI();
        cbs.onCanvasChange?.();
      }
    });

  folder.addButton({ title: 'Restart Preset' }).on('click', () => {
    if (loadPreset(proxy.value)) {
      pane.refresh();
      updateStrokeWidthVisibility();
      updatePaletteBgVisibility();
      rebuildAllMotionParams();
      updateSwatchUI();
      cbs.onCanvasChange?.();
    }
  });

  folder.addBlade({ view: 'separator' });
  folder.addButton({ title: 'Save User Preset' }).on('click', saveUserPreset);
  folder.addButton({ title: 'Export Preset JSON' }).on('click', exportPresetJSON);
}

function buildCanvas(page) {
  const folder = page.addFolder({ title: 'CANVAS', expanded: true });

  folder.addBinding(canvas, 'ratio', {
    label: 'Canvas Ratio',
    options: Object.fromEntries(Object.keys(ratioOptions).map(k => [k, k])),
  }).on('change', () => cbs.onCanvasChange?.());

  folder.addBinding(canvas, 'background', {
    label: 'Background',
    options: { Custom: 'custom', 'Use Palette Color': 'palette', Transparent: 'transparent' },
  }).on('change', () => { updatePaletteBgVisibility(); cbs.onParamChange?.(); });

  // Palette Color: dropdown "Color 1"…"Color 5"
  paletteBgBlade = folder.addBinding(canvas, 'paletteBgSlot', {
    label: 'Palette Color',
    options: { 'Color 1': 0, 'Color 2': 1, 'Color 3': 2, 'Color 4': 3, 'Color 5': 4 },
  }).on('change', () => cbs.onParamChange?.());

  folder.addBinding(canvas, 'canvasColor', { label: 'Canvas Color', view: 'color' })
    .on('change', () => cbs.onParamChange?.());

  updatePaletteBgVisibility();
}

function buildShape(page) {
  const folder = page.addFolder({ title: 'SHAPE', expanded: true });
  folder.addBinding(shape, 'type',     { label: 'Choose Type',    options: shapeTypeOptions })
    .on('change', () => cbs.onParamChange?.());
  folder.addBinding(shape, 'count',    { label: 'Shape Count',    min: 1, max: 100, step: 1 })
    .on('change', () => cbs.onParamChange?.());
  folder.addBinding(shape, 'sequence', { label: 'Scale Sequence', min: -1, max: 1, step: 0.01 })
    .on('change', () => cbs.onParamChange?.());
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

  // 5 swatch selector buttons (click to select which slot to edit)
  const swatchRow = folder.addBlade({ view: 'separator' }); // placeholder spacing
  swatchButtons = [];
  for (let i = 0; i < 5; i++) {
    const btn = folder.addButton({ title: `●` }).on('click', () => {
      color.paletteIndex = i;
      rebuildSetColorBlade(folder);
      updateSwatchUI();
    });
    swatchButtons.push(btn);
  }

  folder.addBlade({ view: 'separator' });

  // 5 toggle buttons (active/inactive per slot)
  toggleButtons = [];
  for (let i = 0; i < 5; i++) {
    const btn = folder.addButton({ title: `Use ${i + 1}` }).on('click', () => {
      // Ensure at least 1 color stays active
      const active = color.paletteUse.filter(Boolean).length;
      if (active === 1 && color.paletteUse[i]) return; // can't deactivate last
      color.paletteUse[i] = !color.paletteUse[i];
      updateSwatchUI();
      cbs.onParamChange?.();
    });
    toggleButtons.push(btn);
  }

  folder.addBlade({ view: 'separator' });

  // Set Color: single picker bound to currently selected palette slot
  buildSetColorBlade(folder);

  folder.addBlade({ view: 'separator' });

  // Color Preset quick-apply buttons
  for (let pi = 0; pi < colorPresets.length; pi++) {
    folder.addButton({ title: `Palette ${pi + 1}` }).on('click', () => {
      colorPresets[pi].forEach((hex, i) => { color.palette[i] = hex; });
      rebuildSetColorBlade(folder);
      updateSwatchUI();
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
    rebuildSetColorBlade(folder);
    updateSwatchUI();
    pane.refresh();
    cbs.onParamChange?.();
  });

  // Initial swatch visual update
  updateSwatchUI();
}

let _setColorFolder = null;
function buildSetColorBlade(folder) {
  _setColorFolder = folder;
  if (setColorBlade) { try { setColorBlade.dispose(); } catch {} }
  const proxy = {
    get val() { return color.palette[color.paletteIndex]; },
    set val(v) { color.palette[color.paletteIndex] = v; },
  };
  setColorBlade = folder.addBinding(proxy, 'val', { label: 'Set Color', view: 'color' })
    .on('change', () => { updateSwatchUI(); cbs.onParamChange?.(); });
}

function rebuildSetColorBlade(folder) {
  buildSetColorBlade(folder ?? _setColorFolder);
}

function updateSwatchUI() {
  // Update swatch button labels with color names and active state
  for (let i = 0; i < 5; i++) {
    if (swatchButtons[i]) {
      const el = swatchButtons[i].element;
      if (el) {
        const btn = el.querySelector('button') ?? el;
        btn.style.backgroundColor = color.palette[i];
        btn.style.outline = i === color.paletteIndex ? '2px solid white' : 'none';
        btn.style.opacity = color.paletteUse[i] ? '1' : '0.35';
      }
    }
    if (toggleButtons[i]) {
      const el = toggleButtons[i].element;
      if (el) {
        const btn = el.querySelector('button') ?? el;
        btn.style.backgroundColor = color.paletteUse[i] ? '#666' : '#333';
      }
    }
  }
}

function buildTransform(page) {
  const folder = page.addFolder({ title: 'TRANSFORM', expanded: true });

  folder.addBinding(transform, 'splitMask', { label: 'Split Mask', options: splitMaskOptions })
    .on('change', () => cbs.onParamChange?.());
  folder.addBinding(transform, 'scale',    { label: 'Scale',    min: 0.01, max: 5,    step: 0.01 })
    .on('change', () => cbs.onParamChange?.());
  folder.addBinding(transform, 'rotation', { label: 'Rotation', min: -360, max: 360, step: 1 })
    .on('change', () => cbs.onParamChange?.());
  folder.addBinding(transform.position,   'x', { label: 'Position X',   min: -2, max: 2, step: 0.01 })
    .on('change', () => cbs.onParamChange?.());
  folder.addBinding(transform.position,   'y', { label: 'Position Y',   min: -2, max: 2, step: 0.01 })
    .on('change', () => cbs.onParamChange?.());
  folder.addBinding(transform.transition, 'x', { label: 'Transition X', min: -2, max: 2, step: 0.01 })
    .on('change', () => cbs.onParamChange?.());
  folder.addBinding(transform.transition, 'y', { label: 'Transition Y', min: -2, max: 2, step: 0.01 })
    .on('change', () => cbs.onParamChange?.());

  folder.addBlade({ view: 'separator' });

  folder.addButton({ title: 'Get Random Values' }).on('click', () => {
    const masks = Object.values(splitMaskOptions);
    transform.splitMask    = masks[Math.floor(Math.random() * masks.length)];
    transform.scale        = 0.3 + Math.random() * 2;
    transform.rotation     = Math.floor(Math.random() * 360) - 180;
    transform.transition.x = (Math.random() - 0.5) * 2;
    transform.transition.y = (Math.random() - 0.5) * 2;
    pane.refresh();
    cbs.onParamChange?.();
  });

  folder.addButton({ title: 'Reset to Default' }).on('click', () => {
    transform.splitMask    = 'none';
    transform.scale        = 1.0;
    transform.rotation     = 0;
    transform.position.x   = 0;
    transform.position.y   = 0;
    transform.transition.x = 0;
    transform.transition.y = 0.5;
    pane.refresh();
    cbs.onParamChange?.();
  });
}

function buildMotion(page) {
  for (const [key, label] of [
    ['scale', 'SCALE'], ['xMove', 'X MOVE'], ['yMove', 'Y MOVE'], ['rotate', 'ROTATE'],
  ]) {
    const folder = page.addFolder({ title: label, expanded: false });
    motionFolders[key] = folder;

    const typeBlade = folder.addBinding(motion[key], 'type', {
      label: 'Motion Type', options: motionTypeOptions,
    }).on('change', () => {
      updateMotionParamState(key);
      cbs.onAnimationChange?.();
    });
    motionTypeBlades[key] = typeBlade;

    buildMotionParams(folder, key);
  }
}

function buildMotionParams(folder, key) {
  const ch = motion[key];

  // All params always visible; disabled when type === 'off'
  const disabled = ch.type === 'off';

  // Shared across noise and sine
  folder.addBinding(ch, 'order', { label: 'Effect Order', options: effectOrderOptions, disabled })
    .on('change', () => cbs.onParamChange?.());
  folder.addBinding(ch, 'amp',   { label: 'Amplitude',   min: -2,    max: 2,     step: 0.01, disabled })
    .on('change', () => cbs.onParamChange?.());
  folder.addBinding(ch, 'freq',  { label: 'Frequency',   min: 0,     max: 5,     step: 0.01, disabled })
    .on('change', () => cbs.onParamChange?.());
  folder.addBinding(ch, 'cycle', { label: 'Cycles',      min: 1,     max: 20,    step: 1,    disabled })
    .on('change', () => cbs.onParamChange?.());
  folder.addBinding(ch, 'phase', { label: 'Phase',       min: -1,    max: 1,     step: 0.01, disabled })
    .on('change', () => cbs.onParamChange?.());
  folder.addBinding(ch, 'speed', { label: 'Speed',       min: 0,     max: 1,     step: 0.01, disabled })
    .on('change', () => cbs.onParamChange?.());
  folder.addBinding(ch, 'seed',  { label: 'Noise Seed',  min: 0,     max: 10000, step: 1,    disabled })
    .on('change', () => cbs.onParamChange?.());

  folder.addButton({ title: 'Get Random Values', disabled }).on('click', () => {
    if (ch.type === 'off') return;
    ch.amp   = (Math.random() - 0.5) * 1.6;
    ch.freq  = Math.random() * 2;
    ch.cycle = 1 + Math.floor(Math.random() * 8);
    ch.phase = (Math.random() - 0.5) * 1;
    ch.speed = Math.random();
    ch.seed  = Math.floor(Math.random() * 10000);
    pane.refresh();
    cbs.onParamChange?.();
  });
}

function updateMotionParamState(key) {
  // Re-render the motion folder with updated disabled states
  const folder = motionFolders[key];
  if (!folder) return;
  // Remove all children except the type blade (first child)
  const typeBlade = motionTypeBlades[key];
  const toRemove = folder.children.filter(c => c !== typeBlade);
  toRemove.forEach(c => { try { c.dispose(); } catch {} });
  buildMotionParams(folder, key);
}

function rebuildAllMotionParams() {
  for (const key of ['scale', 'xMove', 'yMove', 'rotate']) {
    if (motionFolders[key]) updateMotionParamState(key);
  }
}

// ── EXPORT tab ────────────────────────────────────────────────

function buildExport(page) {
  const statusProxy = { get val() { return exportSettings.status; } };
  page.addBinding(statusProxy, 'val', { label: 'Status', readonly: true });
  page.addBinding(exportSettings, 'fileType', { label: 'File Type',       options: fileTypeOptions });
  page.addBinding(exportSettings, 'size',     { label: 'Export Size',     min: 0.25, max: 4,   step: 0.25 });
  page.addBinding(exportSettings, 'length',   { label: 'Export Length',   min: 1,    max: 60,  step: 1 });
  page.addBinding(exportSettings, 'quality',  { label: 'Export Quality',  min: 1,    max: 100, step: 1 });
  page.addBlade({ view: 'separator' });
  page.addButton({ title: 'Export Graphics' }).on('click', () => cbs.onExport?.());
}

// ── OPTIONS tab ───────────────────────────────────────────────

function buildOptions(page) {
  page.addButton({ title: 'Fullscreen' }).on('click', () => {
    document.documentElement.requestFullscreen?.();
  });
  page.addBinding(options, 'margins',     { label: 'Canvas Margins',    min: 0,   max: 100, step: 1 })
    .on('change', () => cbs.onParamChange?.());
  page.addBinding(options, 'wheelSens',   { label: 'Wheel Sensitivity', min: 0.1, max: 5,   step: 0.1 });
  page.addBinding(options, 'browserColor', { label: 'Browser Color',    min: 0,   max: 100, step: 1 })
    .on('change', () => {
      const v = Math.round(options.browserColor * 2.55);
      document.body.style.backgroundColor = `rgb(${v},${v},${v})`;
    });
}

// ── Conditional visibility ─────────────────────────────────────

function updateStrokeWidthVisibility() {
  if (strokeWidthBlade) strokeWidthBlade.hidden = color.stylingType !== 'stroke';
}

function updatePaletteBgVisibility() {
  if (paletteBgBlade) paletteBgBlade.hidden = canvas.background !== 'palette';
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

**Step 2: Verify build and browser test**
```bash
npm run build && npm run dev
```
Check: Motion Off shows grayed-out controls. Color palette swatch buttons show colors.

**Step 3: Commit**
```bash
git add src/tools/split/ui.js
git commit -m "feat(splitx): rewrite ui.js — palette selector/toggle UX, motion disabled state, corrected ranges"
```

---

## Task 6: Rewrite presets.js

**Files:**
- Modify: `src/tools/split/presets.js` (full rewrite)

**What changes:**
- New state schema (flat motion channels, fraction units, sequence not scaleSequence)
- Port 10 key presets from reference `allpresets.js` (Split Vibration, Lotus, Star Trails, Wall Art Dynamics, Radical Vortex, Hypnotic Garden, Butterfly Effect, Cutout Progression, Funky Beats, Prismatic Mandala)
- `STORAGE_KEY` bumped to `splitx-user-preset-v2` (schema changed)

**Step 1: Write presets.js**

```js
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
```

**Step 2: Verify build**
```bash
npm run build
```

**Step 3: Visual check — load Split Vibration preset**
```bash
npm run dev
```
Open SPLITX, select Split Vibration. Expected: orange/black XOR triangle pattern with Quad split mask.

**Step 4: Commit**
```bash
git add src/tools/split/presets.js
git commit -m "feat(splitx): rewrite presets.js — 10 reference presets, new schema, v2 storage key"
```

---

## Task 7: Update export.js for new rendering

**Files:**
- Modify: `src/tools/split/export.js` (minor update)

**What changes:**
- SVG export: calls `renderFn.renderForSVG()` to rebuild paper.js scene, then exports
- PNG/MP4/sequence: unchanged (already use `canvasEl.toBlob()` / `canvasEl.captureStream()`)

**Step 1: Update export.js**

Read the file first, then update only the `exportSVG` function and the `exportComposition` signature to accept `renderFn.renderForSVG`:

```js
// In exportComposition, change:
case 'svg': return exportSVG(paperProj, renderFn.renderForSVG);

// Update exportSVG:
function exportSVG(paperProj, renderForSVG) {
  if (renderForSVG) renderForSVG(); // rebuild paper.js scene
  const svg = paperProj.exportSVG({ asString: true });
  downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), 'splitx-export.svg');
  paperProj.activeLayer.removeChildren(); // clean up after export
}
```

**Step 2: Verify build**
```bash
npm run build
```
Expected: 0 errors.

**Step 3: Full visual test**
```bash
npm run dev
```
- Load Split Vibration → orange XOR pattern ✓
- Load Lotus Metamorphosis → organic stroked shapes ✓
- Load Star Trails → star strokes spreading ✓
- Check Quad split mask mirrors correctly ✓
- Change drawing mode to Cutout XOR → XOR pattern ✓
- Toggle palette use buttons → colors update ✓
- Motion Off type → controls visible but disabled ✓
- Scale Sequence negative value works ✓

**Step 4: Commit**
```bash
git add src/tools/split/export.js
git commit -m "feat(splitx): update export.js — renderForSVG callback for paper.js SVG rebuild"
```
