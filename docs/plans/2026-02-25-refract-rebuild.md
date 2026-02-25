# REFRACT Tool — Full Rebuild Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the REFRACT tool from the old 8-effect placeholder into the two-filter architecture (Box/Flow/Sine Displace + Grid Refract) described in the design doc.

**Architecture:** Two-pass WebGL render — Pass 1 runs a unified displacement shader (3 modes selected by `u_displaceType`), Pass 2 optionally runs a grid-lens shader. Mirror UV wrapping is implemented in-shader via `abs(mod(uv - 1.0, 2.0) - 1.0)`.

**Tech Stack:** p5.js v2 (WEBGL `createGraphics` buffers), Tweakpane v4, plain ES modules, no build step beyond Vite.

**Design doc:** `docs/plans/2026-02-25-refract-rebuild-design.md`

---

## Task 1: Rewrite `state.js`

**Files:**
- Modify: `src/tools/refract/state.js`

**Step 1: Replace the file contents**

Completely replace `src/tools/refract/state.js` with:

```js
// ============================================================
// REFRACT Tool — State
// ============================================================

export const canvas = {
  width:          1024,
  height:         1024,
  ratio:          '1:1',
  preset:         'Preset 1',
  textureWrap:    'mirror',   // 'mirror' | 'repeat' | 'clamp'
  contentScaleX:  1.0,
  contentScaleY:  1.0,
  background:     'custom',   // 'custom' | 'transparent'
  canvasColor:    '#ffffff',
};

export const options = {
  margin:       16,           // px — blank space around preview canvas
  browserColor: '#1a1a1a',    // background of non-rendered area
  maxImageSize: 2048,         // buffer cap, range 1024–4096
};

export const transform = {
  displaceType: 'box',        // 'box' | 'flow' | 'sine'
  seed:         0,
  box: {
    x: { amplify: 1.0, frequency:  1.0, speed: 0.0 },
    y: { amplify: 1.0, frequency:  1.0, speed: 0.0 },
  },
  flow: {
    complexity:  3,
    frequency:   1.0,
    x: { amplify: 1.0, speed: 0.0 },
    y: { amplify: 1.0, speed: 0.0 },
  },
  sine: {
    x: { amplify: 1.0, frequency:  1.0, speed: 0.0 },
    y: { amplify: 1.0, frequency:  1.0, speed: 0.0 },
  },
};

export const refract = {
  type: 'none',               // 'none' | 'grid'
  grid: {
    x: { skewLevel: 1.25, gridAmount: 20 },
    y: { skewLevel: 1.25, gridAmount: 20 },
  },
};

export const animation = {
  playing: false,
};

export const exportSettings = {
  status:  'Ready',
  format:  'png',
  quality: 0.95,
  scale:   1,
};

export const media = {
  type:   null,
  source: null,
  fileName: '',
};

// Dropdown option maps for Tweakpane
export const textureWrapOptions  = { Mirror: 'mirror', Repeat: 'repeat', Clamp: 'clamp' };
export const backgroundOptions   = { Custom: 'custom', Transparent: 'transparent' };
export const displaceTypeOptions = { 'Box Displace': 'box', 'Flow Displace': 'flow', 'Sine Displace': 'sine' };
export const refractTypeOptions  = { None: 'none', Grid: 'grid' };

/**
 * Deep clone a state object.
 */
export function cloneState(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Deep merge source onto target.
 */
export function applyState(target, source) {
  for (const key of Object.keys(source)) {
    if (
      typeof source[key] === 'object' && source[key] !== null &&
      !Array.isArray(source[key]) &&
      typeof target[key] === 'object' && target[key] !== null
    ) {
      applyState(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}
```

**Step 2: Verify no syntax errors**

Run: `npm run lint`
Expected: no errors in `src/tools/refract/state.js`

**Step 3: Commit**

```bash
git add src/tools/refract/state.js
git commit -m "refract: rewrite state.js — new transform/refract/options structure"
```

---

## Task 2: Rewrite `shaders.js`

**Files:**
- Modify: `src/tools/refract/shaders.js`

This is the most important file. Two shaders only: `displaceFrag` and `gridRefractFrag`. All old shaders are removed.

**Step 1: Replace the file contents**

```js
// ============================================================
// REFRACT Tool — Shaders
// ============================================================

// --- Vertex Shader (shared) ---
export const vertShader = `
attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

void main() {
  vTexCoord = aTexCoord;
  gl_Position = vec4(aPosition.xy * 2.0 - 1.0, aPosition.z, 1.0);
}
`;

// --- Mirror UV Wrap helper (inlined into both frag shaders) ---
const mirrorWrapGLSL = `
vec2 mirrorWrap(vec2 uv) {
  return abs(mod(uv - 1.0, 2.0) - 1.0);
}
`;

// --- Simplex noise (used by flow displace) ---
const simplexGLSL = `
vec3 _snPerm(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1  = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy  -= i1;
  i = mod(i, 289.0);
  vec3 p = _snPerm(_snPerm(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x  = 2.0 * fract(p * C.www) - 1.0;
  vec3 h  = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x   + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// fBm with dynamic octave count (max 8)
float fbm(vec2 p, int octaves) {
  float val = 0.0;
  float amp = 0.5;
  float frq = 1.0;
  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    val += amp * snoise(p * frq);
    amp *= 0.5;
    frq *= 2.0;
  }
  return val;
}
`;

// --- Pass 1: Unified Displacement Shader ---
// u_displaceType: 0=Box, 1=Flow, 2=Sine
export const displaceFrag = `
precision highp float;

varying vec2 vTexCoord;
uniform sampler2D u_image;
uniform vec2      u_resolution;
uniform int       u_displaceType;
uniform float     u_seed;
uniform float     u_contentScaleX;
uniform float     u_contentScaleY;
uniform float     u_time;

// Box uniforms
uniform float u_box_ampX;
uniform float u_box_ampY;
uniform float u_box_freqX;
uniform float u_box_freqY;
uniform float u_box_speedX;
uniform float u_box_speedY;

// Flow uniforms
uniform int   u_flow_complexity;
uniform float u_flow_freq;
uniform float u_flow_ampX;
uniform float u_flow_ampY;
uniform float u_flow_speedX;
uniform float u_flow_speedY;

// Sine uniforms
uniform float u_sine_ampX;
uniform float u_sine_ampY;
uniform float u_sine_freqX;
uniform float u_sine_freqY;
uniform float u_sine_speedX;
uniform float u_sine_speedY;

${mirrorWrapGLSL}
${simplexGLSL}

// Per-cell hash for Box displace
float cellHash(vec2 cell) {
  return fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 uv = vec2(vTexCoord.x, 1.0 - vTexCoord.y);

  // Apply content scale (zooms the source image)
  vec2 scaledSrcUV = (uv - 0.5) / vec2(u_contentScaleX, u_contentScaleY) + 0.5;

  vec2 disp = vec2(0.0);

  if (u_displaceType == 0) {
    // ── Box Displace ──
    // Speed scrolls the cell grid over time
    float sx = u_time * u_box_speedX * 0.002;
    float sy = u_time * u_box_speedY * 0.002;
    vec2 shiftedUV = uv + vec2(sx, sy);
    vec2 cell = floor(shiftedUV * vec2(u_box_freqX, u_box_freqY));
    float hx = cellHash(cell + u_seed)       * 2.0 - 1.0;
    float hy = cellHash(cell + u_seed + 31.41) * 2.0 - 1.0;
    disp = vec2(hx * u_box_ampX, hy * u_box_ampY);

  } else if (u_displaceType == 1) {
    // ── Flow Displace ──
    // Speed scrolls the noise field over time (per-axis)
    float sx = u_time * u_flow_speedX * 0.002;
    float sy = u_time * u_flow_speedY * 0.002;
    vec2 p = uv * u_flow_freq + vec2(sx, sy) + u_seed * 0.01;
    float nx = fbm(p,                      u_flow_complexity);
    float ny = fbm(p + vec2(31.41, 17.32), u_flow_complexity);
    disp = vec2(nx * u_flow_ampX, ny * u_flow_ampY);

  } else {
    // ── Sine Displace ──
    // Independent per-axis sine waves; speed advances phase over time
    float phaseX = u_time * u_sine_speedX * 0.05;
    float phaseY = u_time * u_sine_speedY * 0.05;
    float dx = sin(uv.x * u_sine_freqX + phaseX) * u_sine_ampX;
    float dy = sin(uv.y * u_sine_freqY + phaseY) * u_sine_ampY;
    disp = vec2(dx, dy);
  }

  vec2 distortedUV = mirrorWrap(scaledSrcUV + disp);
  gl_FragColor = texture2D(u_image, distortedUV);
}
`;

// --- Pass 2: Grid Refract Shader ---
// Divides UV space into gridAmtX × gridAmtY cells and applies
// a radial lens warp inside each cell using skewLevel as strength.
export const gridRefractFrag = `
precision highp float;

varying vec2 vTexCoord;
uniform sampler2D u_image;       // displaced result from pass 1
uniform vec2      u_resolution;
uniform float     u_gridAmtX;
uniform float     u_gridAmtY;
uniform float     u_skewX;
uniform float     u_skewY;

${mirrorWrapGLSL}

void main() {
  vec2 uv = vec2(vTexCoord.x, 1.0 - vTexCoord.y);

  vec2 cellSize  = vec2(1.0 / u_gridAmtX, 1.0 / u_gridAmtY);
  vec2 cellIndex = floor(uv / cellSize);
  vec2 cellUV    = fract(uv / cellSize);          // 0–1 within cell

  vec2 fromCenter = cellUV - 0.5;
  float dist = length(fromCenter);

  // Radial lens: push UVs away from cell centre proportionally to dist
  vec2 lensOffset = fromCenter * dist * vec2(u_skewX, u_skewY);
  vec2 warpedCellUV = clamp(cellUV + lensOffset, 0.0, 1.0);

  vec2 finalUV = mirrorWrap((cellIndex + warpedCellUV) * cellSize);
  gl_FragColor = texture2D(u_image, finalUV);
}
`;
```

**Step 2: Verify no syntax errors**

Run: `npm run lint`
Expected: no errors in `src/tools/refract/shaders.js`

**Step 3: Commit**

```bash
git add src/tools/refract/shaders.js
git commit -m "refract: rewrite shaders.js — unified displace + grid refract, mirror UV wrap"
```

---

## Task 3: Rewrite `index.js`

**Files:**
- Modify: `src/tools/refract/index.js`

**Step 1: Replace the file contents**

```js
// ============================================================
// REFRACT Tool — Entry Point
// ============================================================

import p5 from 'p5';
import { vertShader, displaceFrag, gridRefractFrag } from './shaders.js';
import { canvas, options, transform, refract, animation, exportSettings, media } from './state.js';
import { setupUI, refreshUI } from './ui.js';
import { setupMedia } from './media.js';

export async function loadRefractTool(canvasContainer, paneContainer) {
  let p5Instance = null;
  let uiInstance  = null;

  const sketch = (p) => {
    let srcImg        = null;
    let dispBuffer    = null;   // Pass 1 — displacement
    let refractBuffer = null;   // Pass 2 — grid refract (only when needed)
    let dispShader    = null;
    let gridShader    = null;
    let needsUpdate   = true;
    let animTime      = 0;

    // ── setup ──────────────────────────────────────────────────
    p.setup = () => {
      syncCanvasSize();
      const cv = p.createCanvas(canvas.width, canvas.height);
      cv.parent(canvasContainer);
      p.pixelDensity(1);

      srcImg = createPlaceholder(p);
      createBuffers(p);
      applyBrowserColor();

      setupMedia(p, canvasContainer, (type, source) => {
        if (type === 'image') {
          srcImg = source;
          resizeForImage(p, source);
          needsUpdate = true;
        }
      });

      uiInstance = setupUI(paneContainer, {
        onParamChange:    () => { needsUpdate = true; },
        onRefractChange:  () => { createBuffers(p); needsUpdate = true; },
        onCanvasChange:   () => {
          syncCanvasSize();
          p.resizeCanvas(canvas.width, canvas.height);
          createBuffers(p);
          needsUpdate = true;
        },
        onAnimationChange: () => {
          if (animation.playing) p.loop();
          else { p.noLoop(); needsUpdate = true; }
        },
        onBrowserColor:   applyBrowserColor,
        onMediaUpload:    () => {
          const input = document.getElementById('fileInput');
          if (input) input.click();
        },
        onExport:         () => handleExport(p),
      });

      p.noLoop();
      needsUpdate = true;
    };

    // ── draw ───────────────────────────────────────────────────
    p.draw = () => {
      if (animation.playing) {
        animTime  += 0.016;
        needsUpdate = true;
      }
      if (!needsUpdate) return;
      needsUpdate = false;

      if (canvas.background === 'transparent') p.clear();
      else p.background(canvas.canvasColor);

      renderPass1(animTime);

      const final = (refract.type === 'grid' && refractBuffer)
        ? renderPass2()
        : dispBuffer;

      p.image(final, 0, 0, p.width, p.height);
    };

    p.windowResized = () => {
      syncCanvasSize();
      p.resizeCanvas(canvas.width, canvas.height);
      createBuffers(p);
      needsUpdate = true;
    };

    // ── buffers & shaders ──────────────────────────────────────
    function createBuffers(p) {
      if (dispBuffer)    dispBuffer.remove();
      if (refractBuffer) refractBuffer.remove();
      refractBuffer = null;

      dispBuffer = p.createGraphics(canvas.width, canvas.height, p.WEBGL);
      dispBuffer.pixelDensity(1);
      dispShader = dispBuffer.createShader(vertShader, displaceFrag);

      if (refract.type === 'grid') {
        refractBuffer = p.createGraphics(canvas.width, canvas.height, p.WEBGL);
        refractBuffer.pixelDensity(1);
        gridShader = refractBuffer.createShader(vertShader, gridRefractFrag);
      }
    }

    // ── pass 1: displacement ───────────────────────────────────
    function renderPass1(time) {
      if (!srcImg || !dispBuffer) return;
      const w = dispBuffer.width;
      const h = dispBuffer.height;
      const t = transform;
      const typeMap = { box: 0, flow: 1, sine: 2 };

      dispBuffer.shader(dispShader);
      dispShader.setUniform('u_image',         srcImg);
      dispShader.setUniform('u_resolution',    [w, h]);
      dispShader.setUniform('u_displaceType',  typeMap[t.displaceType] ?? 0);
      dispShader.setUniform('u_seed',          t.seed);
      dispShader.setUniform('u_contentScaleX', canvas.contentScaleX);
      dispShader.setUniform('u_contentScaleY', canvas.contentScaleY);
      dispShader.setUniform('u_time',          time);

      // Box
      dispShader.setUniform('u_box_ampX',  t.box.x.amplify);
      dispShader.setUniform('u_box_ampY',  t.box.y.amplify);
      dispShader.setUniform('u_box_freqX', t.box.x.frequency);
      dispShader.setUniform('u_box_freqY', t.box.y.frequency);
      dispShader.setUniform('u_box_speedX', t.box.x.speed);
      dispShader.setUniform('u_box_speedY', t.box.y.speed);

      // Flow
      dispShader.setUniform('u_flow_complexity', t.flow.complexity);
      dispShader.setUniform('u_flow_freq',       t.flow.frequency);
      dispShader.setUniform('u_flow_ampX',       t.flow.x.amplify);
      dispShader.setUniform('u_flow_ampY',       t.flow.y.amplify);
      dispShader.setUniform('u_flow_speedX',     t.flow.x.speed);
      dispShader.setUniform('u_flow_speedY',     t.flow.y.speed);

      // Sine
      dispShader.setUniform('u_sine_ampX',  t.sine.x.amplify);
      dispShader.setUniform('u_sine_ampY',  t.sine.y.amplify);
      dispShader.setUniform('u_sine_freqX', t.sine.x.frequency);
      dispShader.setUniform('u_sine_freqY', t.sine.y.frequency);
      dispShader.setUniform('u_sine_speedX', t.sine.x.speed);
      dispShader.setUniform('u_sine_speedY', t.sine.y.speed);

      dispBuffer.rect(-w / 2, -h / 2, w, h);
    }

    // ── pass 2: grid refract ───────────────────────────────────
    function renderPass2() {
      const w = refractBuffer.width;
      const h = refractBuffer.height;
      refractBuffer.shader(gridShader);
      gridShader.setUniform('u_image',      dispBuffer);
      gridShader.setUniform('u_resolution', [w, h]);
      gridShader.setUniform('u_gridAmtX',   refract.grid.x.gridAmount);
      gridShader.setUniform('u_gridAmtY',   refract.grid.y.gridAmount);
      gridShader.setUniform('u_skewX',      refract.grid.x.skewLevel);
      gridShader.setUniform('u_skewY',      refract.grid.y.skewLevel);
      refractBuffer.rect(-w / 2, -h / 2, w, h);
      return refractBuffer;
    }

    // ── helpers ────────────────────────────────────────────────
    function createPlaceholder(p) {
      const w = canvas.width;
      const h = canvas.height;
      const img = p.createImage(w, h);
      img.loadPixels();
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const t   = (x + y) / (w + h);
          const v   = Math.floor(t * 255);
          img.pixels[idx]     = v;
          img.pixels[idx + 1] = Math.floor(v * 0.7);
          img.pixels[idx + 2] = Math.floor(255 - v * 0.5);
          img.pixels[idx + 3] = 255;
        }
      }
      img.updatePixels();
      return img;
    }

    function resizeForImage(p, img) {
      const maxPx  = options.maxImageSize;
      const aspect = img.width / img.height;
      let w = maxPx;
      let h = Math.round(w / aspect);
      if (h > maxPx) { h = maxPx; w = Math.round(h * aspect); }
      canvas.width  = w;
      canvas.height = h;
      p.resizeCanvas(w, h);
      createBuffers(p);
    }

    function syncCanvasSize() {
      const avail  = options.maxImageSize;
      const margin = options.margin * 2;
      const maxW   = window.innerWidth  - 280 - 320 - margin;
      const maxH   = window.innerHeight - 40  - margin;
      canvas.width  = Math.min(canvas.width  || 1024, avail, maxW);
      canvas.height = Math.min(canvas.height || 1024, avail, maxH);
    }

    function applyBrowserColor() {
      document.body.style.backgroundColor = options.browserColor;
    }

    function handleExport(p) {
      if (refract.type === 'grid' && refractBuffer) {
        refractBuffer.save('refract-export', exportSettings.format);
      } else if (dispBuffer) {
        dispBuffer.save('refract-export', exportSettings.format);
      }
    }
  };

  p5Instance = new p5(sketch, canvasContainer);

  return {
    p5Instance,
    uiInstance,
    handleFile(file) {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        p5Instance.loadImage(url, (img) => {
          URL.revokeObjectURL(url);
          media.source = img;
          media.fileName = file.name;
        });
      }
    },
  };
}
```

**Step 2: Verify no syntax errors**

Run: `npm run lint`
Expected: no errors in `src/tools/refract/index.js`

**Step 3: Start dev server and load the REFRACT tool**

Run: `npm run dev`

Open http://localhost:5173 → click REFRACT in the sidebar.
Expected: tool loads without console errors, placeholder gradient is visible and displaced.

**Step 4: Commit**

```bash
git add src/tools/refract/index.js
git commit -m "refract: rewrite index.js — two-pass render, mirror UV, animation loop"
```

---

## Task 4: Rewrite `ui.js`

**Files:**
- Modify: `src/tools/refract/ui.js`

The UI has three tabs (MAIN, EXPORT, OPTIONS) plus an Upload button outside the tabs. TRANSFORM FILTERS and REFRACT FILTER are folders below the tabs on the MAIN page. Sub-controls show/hide based on the selected displace type and refract type.

**Step 1: Replace the file contents**

```js
// ============================================================
// REFRACT Tool — UI (Tweakpane v4)
// ============================================================

import { Pane } from 'tweakpane';
import {
  canvas, options, transform, refract, animation, exportSettings,
  textureWrapOptions, backgroundOptions,
  displaceTypeOptions, refractTypeOptions,
} from './state.js';
import { loadPreset, saveUserPreset, refreshPresetOptions, presetOptions } from './presets.js';

let pane = null;
let cbs  = {};

// Folder refs for show/hide
let boxFolder   = null;
let flowFolder  = null;
let sineFolder  = null;
let gridFolder  = null;
let colorPicker = null;  // canvas color blade

/**
 * Build the entire Tweakpane panel.
 * @param {HTMLElement} container
 * @param {Object}      callbacks  — { onParamChange, onRefractChange, onCanvasChange,
 *                                     onAnimationChange, onBrowserColor,
 *                                     onMediaUpload, onExport }
 */
export function setupUI(container, callbacks) {
  cbs = callbacks;
  if (!container) return null;

  pane = new Pane({ container, title: 'REFRACT' });

  // Upload button (outside tabs)
  pane.addButton({ title: 'Upload Image' }).on('click', () => cbs.onMediaUpload?.());

  // ── Tabs ────────────────────────────────────────────────────
  const tabs = pane.addTab({ pages: [{ title: 'MAIN' }, { title: 'EXPORT' }, { title: 'OPTIONS' }] });
  const [mainPage, exportPage, optionsPage] = tabs.pages;

  buildMain(mainPage);
  buildExport(exportPage);
  buildOptions(optionsPage);

  updateDisplaceVisibility();
  updateRefractVisibility();
  updateColorPickerVisibility();

  return pane;
}

/**
 * Refresh all bindings (call after preset load).
 */
export function refreshUI() {
  if (pane) pane.refresh();
}

// ── MAIN page ────────────────────────────────────────────────

function buildMain(page) {
  // Preset dropdown
  const presetProxy = { value: canvas.preset };
  page.addBinding(presetProxy, 'value', { label: 'Preset', options: presetOptions })
    .on('change', (ev) => {
      canvas.preset = ev.value;
      if (loadPreset(ev.value)) {
        refreshUI();
        updateDisplaceVisibility();
        updateRefractVisibility();
        updateColorPickerVisibility();
        cbs.onRefractChange?.();
      }
    });

  page.addButton({ title: 'Save User Preset' }).on('click', () => {
    const name = saveUserPreset();
    canvas.preset = name;
    refreshPresetOptions();
    refreshUI();
  });

  page.addSeparator();

  // Canvas settings
  page.addBinding(canvas, 'textureWrap', { label: 'Texture Wrap', options: textureWrapOptions })
    .on('change', () => cbs.onParamChange?.());

  page.addBinding(canvas, 'contentScaleX', { label: 'Content Scale X', min: 0.1, max: 4.0, step: 0.01 })
    .on('change', () => cbs.onParamChange?.());

  page.addBinding(canvas, 'contentScaleY', { label: 'Content Scale Y', min: 0.1, max: 4.0, step: 0.01 })
    .on('change', () => cbs.onParamChange?.());

  page.addBinding(canvas, 'background', { label: 'Background', options: backgroundOptions })
    .on('change', () => { updateColorPickerVisibility(); cbs.onParamChange?.(); });

  colorPicker = page.addBinding(canvas, 'canvasColor', { label: 'Canvas Color', view: 'color' })
    .on('change', () => cbs.onParamChange?.());

  page.addSeparator();

  // ── TRANSFORM FILTERS folder ──
  const transformFolder = page.addFolder({ title: 'TRANSFORM FILTERS', expanded: true });

  transformFolder.addBinding(transform, 'displaceType', { label: 'Displace Type', options: displaceTypeOptions })
    .on('change', () => { updateDisplaceVisibility(); cbs.onParamChange?.(); });

  transformFolder.addBinding(transform, 'seed', { label: 'Noise Seed', min: 0, max: 9999, step: 1 })
    .on('change', () => cbs.onParamChange?.());

  // Box sub-folder
  boxFolder = transformFolder.addFolder({ title: 'Box Settings', expanded: true });
  addAxisControls(boxFolder, transform.box.x, 'X Axis', { hasFreq: true });
  addAxisControls(boxFolder, transform.box.y, 'Y Axis', { hasFreq: true });

  // Flow sub-folder
  flowFolder = transformFolder.addFolder({ title: 'Flow Settings', expanded: true });
  flowFolder.addBinding(transform.flow, 'complexity', { label: 'Complexity', min: 1, max: 8, step: 1 })
    .on('change', () => cbs.onParamChange?.());
  flowFolder.addBinding(transform.flow, 'frequency', { label: 'Frequency', min: 0.1, max: 50.0, step: 0.1 })
    .on('change', () => cbs.onParamChange?.());
  addAxisControls(flowFolder, transform.flow.x, 'X Axis', { hasFreq: false });
  addAxisControls(flowFolder, transform.flow.y, 'Y Axis', { hasFreq: false });

  // Sine sub-folder
  sineFolder = transformFolder.addFolder({ title: 'Sine Settings', expanded: true });
  addAxisControls(sineFolder, transform.sine.x, 'X Axis', { hasFreq: true });
  addAxisControls(sineFolder, transform.sine.y, 'Y Axis', { hasFreq: true });

  // Animation toggle
  transformFolder.addBinding(animation, 'playing', { label: 'Animate' })
    .on('change', () => cbs.onAnimationChange?.());

  page.addSeparator();

  // ── REFRACT FILTER folder ──
  const refractFolder = page.addFolder({ title: 'REFRACT FILTER', expanded: true });

  refractFolder.addBinding(refract, 'type', { label: 'Refract Type', options: refractTypeOptions })
    .on('change', () => { updateRefractVisibility(); cbs.onRefractChange?.(); });

  gridFolder = refractFolder.addFolder({ title: 'Grid Settings', expanded: true });
  gridFolder.addBinding(refract.grid.x, 'skewLevel',  { label: 'X Skew Level',  min: 0, max: 5.0, step: 0.01 })
    .on('change', () => cbs.onParamChange?.());
  gridFolder.addBinding(refract.grid.x, 'gridAmount', { label: 'X Grid Amount', min: 1, max: 80, step: 1 })
    .on('change', () => cbs.onParamChange?.());
  gridFolder.addBinding(refract.grid.y, 'skewLevel',  { label: 'Y Skew Level',  min: 0, max: 5.0, step: 0.01 })
    .on('change', () => cbs.onParamChange?.());
  gridFolder.addBinding(refract.grid.y, 'gridAmount', { label: 'Y Grid Amount', min: 1, max: 80, step: 1 })
    .on('change', () => cbs.onParamChange?.());
}

// ── EXPORT page ──────────────────────────────────────────────

function buildExport(page) {
  page.addBinding(exportSettings, 'status',  { label: 'Status', readonly: true });
  page.addBinding(exportSettings, 'format',  { label: 'Format',  options: { PNG: 'png', JPG: 'jpg', WebP: 'webp' } });
  page.addBinding(exportSettings, 'quality', { label: 'Quality', min: 0.1, max: 1.0, step: 0.05 });
  page.addBinding(exportSettings, 'scale',   { label: 'Scale',   options: { '1×': 1, '2×': 2, '3×': 3, '4×': 4 } });
  page.addButton({ title: 'Export Image' }).on('click', () => cbs.onExport?.());
}

// ── OPTIONS page ─────────────────────────────────────────────

function buildOptions(page) {
  page.addBinding(options, 'margin', {
    label: 'Canvas Margins', min: 0, max: 120, step: 4,
  }).on('change', () => cbs.onCanvasChange?.());

  page.addBinding(options, 'browserColor', { label: 'Browser Color', view: 'color' })
    .on('change', () => cbs.onBrowserColor?.());

  page.addBinding(options, 'maxImageSize', {
    label: 'Max Image Size', min: 1024, max: 4096, step: 128,
  }).on('change', () => cbs.onCanvasChange?.());
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Add Amplify, [Frequency], Speed bindings for one axis sub-object.
 */
function addAxisControls(folder, axisObj, label, { hasFreq }) {
  const sub = folder.addFolder({ title: label, expanded: true });
  sub.addBinding(axisObj, 'amplify',   { label: 'Amplify',   min: 0, max: 30.0, step: 0.1 })
    .on('change', () => cbs.onParamChange?.());
  if (hasFreq) {
    sub.addBinding(axisObj, 'frequency', { label: 'Frequency', min: 0.1, max: 60.0, step: 0.1 })
      .on('change', () => cbs.onParamChange?.());
  }
  sub.addBinding(axisObj, 'speed',     { label: 'Speed',     min: 0, max: 60.0, step: 0.5 })
    .on('change', () => cbs.onParamChange?.());
}

function updateDisplaceVisibility() {
  if (!boxFolder) return;
  const t = transform.displaceType;
  boxFolder.hidden  = t !== 'box';
  flowFolder.hidden = t !== 'flow';
  sineFolder.hidden = t !== 'sine';
}

function updateRefractVisibility() {
  if (!gridFolder) return;
  gridFolder.hidden = refract.type !== 'grid';
}

function updateColorPickerVisibility() {
  if (!colorPicker) return;
  colorPicker.hidden = canvas.background !== 'custom';
}
```

**Step 2: Verify no syntax errors**

Run: `npm run lint`
Expected: no errors.

**Step 3: Verify in browser**

With `npm run dev` running, open REFRACT.
Expected:
- Upload Image button at top
- Three tabs: MAIN, EXPORT, OPTIONS
- MAIN tab shows Preset, Texture Wrap, Content Scale X/Y, Background, Canvas Color
- TRANSFORM FILTERS folder with Displace Type dropdown — switching between Box/Flow/Sine shows only the relevant sub-folder
- REFRACT FILTER folder — selecting Grid shows Grid Settings sub-folder
- EXPORT and OPTIONS tabs contain correct controls

**Step 4: Commit**

```bash
git add src/tools/refract/ui.js
git commit -m "refract: rewrite ui.js — MAIN/EXPORT/OPTIONS tabs, dynamic displace/refract controls"
```

---

## Task 5: Rewrite `presets.js`

**Files:**
- Modify: `src/tools/refract/presets.js`

**Step 1: Replace the file contents**

```js
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
export const presetOptions = buildOptions();

function buildOptions() {
  const opts = {};
  for (const k of Object.keys(builtinPresets)) opts[k] = k;
  for (const k of Object.keys(userPresets))    opts[k] = k;
  return opts;
}

export function refreshPresetOptions() {
  const fresh = buildOptions();
  Object.keys(presetOptions).forEach(k => delete presetOptions[k]);
  Object.assign(presetOptions, fresh);
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
```

**Step 2: Verify no syntax errors**

Run: `npm run lint`
Expected: no errors.

**Step 3: Verify presets load in browser**

With `npm run dev` running, open REFRACT → MAIN tab → Preset dropdown.
Expected:
- Dropdown shows Preset 1 through Preset 10
- Selecting Preset 10 sets Box Displace with seed 601, visible dramatic boxy displacement with mirror folding
- Selecting Preset 8 sets Flow Displace + Grid Refract, activates the Grid Settings folder

**Step 4: Commit**

```bash
git add src/tools/refract/presets.js
git commit -m "refract: rewrite presets.js — 10 built-in presets using new transform/refract state"
```

---

## Task 6: End-to-End Verification & Cleanup

**Step 1: Full smoke test in browser**

Run: `npm run dev`, navigate to REFRACT.

Check the following:
- [ ] Placeholder image is displayed and displaced on load
- [ ] Upload an image — canvas resizes to match aspect ratio, displacement applies
- [ ] Box Displace at high Amplify + Frequency produces boxy, mirror-folded cells
- [ ] Flow Displace produces organic, flowing folds
- [ ] Sine Displace produces ripple/ring patterns
- [ ] Enabling Grid Refract adds lens-per-cell effect on top
- [ ] Animation (Animate toggle) plays and advances displacement smoothly
- [ ] Texture Wrap: Mirror (default) produces folded-paper look; Repeat and Clamp behave differently
- [ ] Content Scale X/Y zooms the source image
- [ ] OPTIONS tab: Canvas Margins, Browser Color, Max Image Size all update the UI
- [ ] EXPORT tab: Export Image downloads a file
- [ ] All 10 presets load without error
- [ ] Switching away from REFRACT and back works cleanly (no console errors)

**Step 2: Lint**

Run: `npm run lint`
Expected: no errors across any refract files.

**Step 3: Final commit**

```bash
git add src/tools/refract/
git commit -m "refract: complete rebuild — two-filter architecture (displace + grid refract)"
```
