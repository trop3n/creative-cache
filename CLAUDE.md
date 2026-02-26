# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start Vite dev server (http://localhost:5173)
npm run dev:electron     # Run Electron app against Vite dev server
npm run build            # Production web build → dist/
npm run build:electron   # Package desktop app → release/
npm run lint             # ESLint on .js files
```

No tests are configured yet (`npm test` is a placeholder).

## Architecture

Creative Suite is a modular Electron + Vite web app combining 8 generative art tools: DITHR (image dithering), FLAKE (grid patterns), REFRACT (image displacement), SPLITX (vector duplication), TEXTR (typography), RITM (rhythm visualizer), BOIDS (flocking simulation), and TRACK (motion tracking effects).

**Tool loading flow** — `src/main.js` is the app router. When the user switches tools, it:
1. Cleans up the current tool (calls `p5Instance.remove()`, disposes UI)
2. Dynamically imports the tool module
3. Calls `load(canvasContainer, paneContainer)` and stores the returned `{ p5Instance, uiInstance, handleFile, dispose? }`

**Tool structure** — Each tool in `src/tools/[tool]/` is self-contained. The only required file is:
- `index.js` — exports `loadToolName(canvasContainer, paneContainer)`, returns `{ p5Instance, uiInstance, handleFile, dispose? }` (dispose is called before p5Instance.remove() when switching tools)

Common optional files (use as needed):
- `state.js` — plain mutable config/state objects
- `ui.js` — Tweakpane control setup
- `main.js` — core rendering logic
- `media.js` — file/asset handling
- `presets.js` — named preset configurations
- `export.js` — export/save logic
- `shaders.js` — GLSL shader strings (used by dither, refract; these tools use p5.js WEBGL mode, not the default 2D renderer)
- `effects.js` — post-processing or visual effects pipeline
- `motion.js` — motion analysis / tracking logic

**Tool registry** — `src/tools/index.js` maps tool IDs to metadata and lazy-import loaders, and exports `toolOrder` for navigation. Adding a new tool requires: adding an entry here, adding a sidebar button in `index.html`, and creating the tool directory.

**Keyboard shortcuts** — `Ctrl/Cmd + 1–8` switches between tools in `toolOrder` sequence.

**Electron IPC** — `electron/preload.js` exposes `window.electronAPI` (tool switching, file open, save dialog). Always guard Electron-specific code:
```javascript
if (typeof window.electronAPI !== 'undefined') { ... }
```

**File handling** — A single hidden `#fileInput` element is shared globally. Tools should call `triggerFileUpload()` (exported from `src/main.js`) to open the file picker, not access `#fileInput` directly. Each tool's `handleFile(file)` method processes the selected file. The `accept` attribute is set per-tool from the registry.

## Key Dependencies

- **p5.js v2.x** — canvas rendering, always instance mode with `pixelDensity(1)`; v2 has API changes from v1
- **Tweakpane v4** — right-pane UI controls; v4 API differs significantly from v3
- **paper.js** — vector graphics (used by split/SPLITX)
- **simplex-noise** — noise generation

**Canvas sizing** — `setupCanvasFitting()` in `src/main.js` uses ResizeObserver + MutationObserver to automatically scale the canvas CSS to fill the available space. Tools should create canvases at their intended buffer resolution and let the fitting system handle display scaling — do not manually fit canvases to the container.

## Code Conventions

- **p5.js** always in instance mode with `pixelDensity(1)`; never use global mode
- **ES modules only** — no CommonJS `require()`
- **State** via plain mutable objects, never framework state managers
- **Section headers** use `// ============================================================`
- **Imports** grouped: external libraries first, then internal modules
- **Naming**: camelCase for functions/variables, kebab-case for CSS classes and CSS variables
- **JSDoc** for exported/public functions

## CSS Theme

All colors and layout dimensions are CSS variables in `styles/main.css` (e.g. `--bg-primary`, `--accent-primary: #4a9eff`, `--sidebar-width: 280px`, `--pane-width: 320px`). Dark theme throughout.

---

## REFRACT Tool — Rebuild Reference

The current REFRACT implementation (`src/tools/refract/`) is a placeholder that does not match the target architecture. A full rebuild is pending. All reference data is captured here.

### Target Architecture

Two stacked filters, not 8 separate effect types:

1. **TRANSFORM FILTERS** — primary displacement engine (single shader, 3 modes)
2. **REFRACT FILTER** — optional secondary pass applied on top of the displaced result

UI tab structure: **MAIN | EXPORT | OPTIONS | LICENSE**

### MAIN Tab — Canvas Settings

| Parameter | Type | Notes |
|---|---|---|
| Preset List | dropdown | Preset 1–10 + user presets |
| Texture Wrap | dropdown | **Mirror** (default) — also Repeat, Clamp |
| Content Scale | two floats (X, Y) | Scale of source image before displacement |
| Background | dropdown | Custom / transparent options |
| Canvas Color | color picker | #ffffff default |

**Texture Wrap: Mirror is critical.** All 10 reference presets use Mirror. The current shader does `clamp(distortedUV, 0.0, 1.0)` which is wrong — it must use mirror wrapping: `abs(mod(uv - 1.0, 2.0) - 1.0)`. This produces the "folded paper / topographic contour" look. Without it the outputs are flat and wrong.

### TRANSFORM FILTERS

**Displace Type options:** `Box Displace` | `Flow Displace` | `Sine Displace`

Parameters differ by type:

**Box Displace** (per-axis Frequency):
```
Noise Seed
X Axis: Amplify, Frequency, Speed
Y Axis: Amplify, Frequency, Speed
```

**Flow Displace** (global Frequency + Complexity, no per-axis Frequency):
```
Noise Seed
Complexity      ← octave count, global
Frequency       ← global (single value, not per-axis)
X Axis: Amplify, Speed
Y Axis: Amplify, Speed
```

**Sine Displace** (inferred same structure as Box):
```
Noise Seed
X Axis: Amplify, Frequency, Speed
Y Axis: Amplify, Frequency, Speed
```

**Preset 10 values (Box Displace):**
Seed: 601 | X: Amp 8.0, Freq 40.0, Speed 35 | Y: Amp 7.0, Freq 50.0, Speed 50

**A Flow Displace preset values:**
Seed: 601 | Complexity: 3 | Frequency: 15.1 | X: Amp 20.0, Speed 33 | Y: Amp 5.0, Speed 15

Parameter ranges are much higher than typical defaults — Amplify reaches 20+, Frequency reaches 40–50. The visual effect only becomes interesting above Amplify ~1.5.

### REFRACT FILTER

**Refract Type options:** `None` | `Grid`

**Grid settings (per-axis):**
```
X Axis: Skew Level, Grid Amount
Y Axis: Skew Level, Grid Amount
```
Grid Amount = number of lens cells across that axis. Grid Amount 20 = 20×20 grid.
Skew Level = refraction/lens strength within each cell.

**A Grid preset values:** X: Skew 1.25, Grid 20 | Y: Skew 1.25, Grid 20

### Displacement Type → Visual Output Mapping

| Type | Visual character | Mechanism |
|---|---|---|
| Box Displace | Rectangular nested forms, grid of boxy cells | Per-cell hash noise (`floor(uv * freq)` → random offset per cell) |
| Flow Displace | Organic blobs, petals, ribbon folds | Simplex noise flow field, `Complexity` octaves |
| Sine Displace | Concentric rings, ripple, radial patterns | Radial/directional sine wave per axis |

### Target State Structure

```js
// canvas additions
{ textureWrap: 'mirror', contentScaleX: 1.0, contentScaleY: 1.0,
  background: 'custom', canvasColor: '#ffffff' }

// transform (replaces current distortion object entirely)
{ displaceType: 'box',   // 'box' | 'flow' | 'sine'
  seed: 0,
  box:  { x: { amplify: 1.0, frequency: 1.0, speed: 0.0 },
          y: { amplify: 1.0, frequency: 1.0, speed: 0.0 } },
  flow: { complexity: 3, frequency: 1.0,
          x: { amplify: 1.0, speed: 0.0 },
          y: { amplify: 1.0, speed: 0.0 } },
  sine: { x: { amplify: 1.0, frequency: 1.0, speed: 0.0 },
          y: { amplify: 1.0, frequency: 1.0, speed: 0.0 } } }

// refract (replaces current distortion sub-types)
{ type: 'none',   // 'none' | 'grid'
  grid: { x: { skewLevel: 1.25, gridAmount: 20 },
          y: { skewLevel: 1.25, gridAmount: 20 } } }
```

### Shader Plan

**Pass 1 — Displacement shader** (single shader, `u_displaceType` int selects mode):
- `0 = Box`: `floor(uv * freq)` → per-cell hash → random offset vector per cell
- `1 = Flow`: simplex noise, `u_complexity` octaves, global `u_frequency`
- `2 = Sine`: radial sine wave per axis with independent frequency
- All modes: mirror UV wrapping, separate X/Y amplify and speed
- Animation: `u_time` drives Speed uniforms

**Pass 2 — Grid refract shader** (only when `refract.type === 'grid'`):
- Divide UV into `gridAmountX × gridAmountY` cells
- Apply radial lens displacement within each cell using `skewLevel` as strength
- Renders into a second WEBGL graphics buffer, composited on top

### Files to Rebuild

| File | Action |
|---|---|
| `state.js` | Full rewrite — replace `distortion` object with `transform` + `refract` + updated `canvas` |
| `shaders.js` | Full rewrite — one unified displacement shader + one grid refract shader |
| `index.js` | Rewrite — two-pass render, animation loop, mirror wrap |
| `ui.js` | Rewrite — MAIN/EXPORT/OPTIONS tabs, TRANSFORM FILTERS section, REFRACT FILTER section |
| `presets.js` | Rewrite — 10 presets using new state structure |
| `media.js` | Keep, already fixed (container parameter) |
| `main.js` | Deleted — rendering logic absorbed into `index.js` |

---

## SPLITX Tool — Rebuild Reference

**Full reference doc:** `docs/plans/2026-02-26-splitx-reference.md`

Current `src/tools/split/` is a non-functional placeholder (raw HTML sliders, no Tweakpane, no real rendering). All files need a full rewrite.

### Core Concept

Draws **N copies of a vector shape**, each offset by **Transition** XY and multiplied by **Scale Sequence**. The stack is mirrored by **Split Mask** and animated by **4 independent motion channels**.

### UI Structure: MAIN | EXPORT | OPTIONS

**CANVAS:** Canvas Ratio (11 options), Background (Custom / Use Palette Color / Transparent)

**SHAPE:** Choose Type (Rectangle, Circle, Ring, Oval, Triangle, Rhombus, Cross, Star, Hexagon, Petals, Checker, Blob, Organic, Custom SVG), Shape Count, Scale Sequence

**COLOR:** Styling Type (Fill/Stroke), Stroke Width, Drawing Mode (Single Color / Sequence / Transition RGB / Transition LCH), 5-color palette, Color Preset buttons, Get Random Palette

**TRANSFORM:** Split Mask (None/Horizontal/Vertical/Quad), Scale, Rotation, Position (XY), Transition (XY — the key creative parameter)

**Motion (4 tabs: SCALE | X MOVE | Y MOVE | ROTATE):** Each independent. Motion Type = Off / Noise / Sinusoidal.
- Noise params: Effect Order, Amplitude, Frequency, Speed, Noise Seed
- Sinusoidal params: Effect Order, Amplitude, Frequency, Cycles, Phase
- Effect Order: Forward (staggered per copy) / Backward / Equal (all copies move as one)

**EXPORT:** SVG File / PNG File / MP4 File / PNG Sequence / WEBP Sequence. Export Size, Length, Quality.

**OPTIONS:** Fullscreen, Canvas Margins, Wheel Sensitivity, Browser Color

### Interactive Controls
Hold Click+Drag → Position | Hold Click+Shift+Drag → Transition | Scroll+Shift → Scale | Scroll+Ctrl → Rotation | Drop SVG → load custom shape | Drop JSON → import preset

### Key Implementation Notes
- **paper.js** for rendering (already a dependency)
- **Split Mask** = mirror via paper.js transforms into quadrants
- **Scale Sequence** loop: `scale = initialScale * pow(scaleSequence, i)` per copy
- **LCH interpolation**: chroma.js supports `chroma.mix(c1, c2, t, 'lch')` — consider adding
- **Noise motion**: `simplex.noise2D(i * frequency + seed, time * speed) * amplitude` per copy
- **Sinusoidal motion**: `sin(i * frequency * cycles + phase + time) * amplitude` per copy
