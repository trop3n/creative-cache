# SPLITX Tool — Reference Documentation

**Date:** 2026-02-26
**Source:** Live inspection of https://antlii.work/SPLITX-Tool (Version 0.25)
**Status:** Reference only — rebuild not yet started

---

## Core Concept

The tool draws **N copies of a vector shape**, each one transformed relative to the previous by:
- A per-copy **Transition** XY offset (creates the "path" copies follow)
- A **Scale Sequence** multiplier (each copy is a fraction of the previous size)
- The accumulated base **Rotation**

The entire stack can be **mirrored** via Split Mask, and animated by **4 independent motion channels** (Scale, X Move, Y Move, Rotate). Colors are spread across copies using a **5-color palette** with 4 drawing modes.

---

## Tab Structure

**MAIN | EXPORT | OPTIONS | LICENSE**

---

## MAIN Tab

### Presets
21 built-in presets + User Preset slot:

Split Vibration, Lotus Metamorphosis, Star Trails, Wall Art Dynamics, Radical Vortex, Hypnotic Garden, Hype The Type, Butterfly Effect, Cutout Progression, Funky Beats, Cross Transition, Jelly Airflow, OMG, Star Force Credits, Glowing Vessel, Blossom Geometry, Matrix Drawing, Pool Vibration, Unfolding Circles, Prismatic Mandala, Drop The SVG

- **Restart Preset** button — re-runs the current preset from scratch
- **Preset Import/Export** button — save/load presets as JSON

---

### CANVAS Section

| Parameter | Values |
|---|---|
| Canvas Ratio | 2:1, 16:9, 3:2, 4:3, 5:4, 1:1, 4:5, 3:4, 2:3, 9:16, 1:2 |
| Background | Custom / Use Palette Color / Transparent |
| Palette Color | Color 1–5 (which palette slot to use as BG; only shown when "Use Palette Color") |

---

### SHAPE Section

| Parameter | Type | Notes |
|---|---|---|
| Choose Type | dropdown | Rectangle, Circle, Ring, Oval, Triangle, Rhombus, Cross, Star, Hexagon, Petals, Checker, Blob, Organic, Custom |
| Shape Count | integer | Number of copies drawn |
| Scale Sequence | float | Each copy is this fraction of the previous (e.g. 0.76 = 76% of previous size) |

No shape-type-specific sub-parameters — all 14 types share the same 3 controls.
**Custom** type accepts drag-and-drop SVG files onto the canvas.

---

### COLOR Section

| Parameter | Values |
|---|---|
| Styling Type | Fill / Stroke |
| Stroke Width | float (only visible when Stroke) |
| Drawing Mode | Single Color / Sequence / Transition (RGB) / Transition (LCH) |
| Palette | 5 editable color swatches |
| Color Preset | 5 preset palette buttons (quick apply) |
| Set Color | color picker — sets the currently selected swatch |
| Get Random Palette | button |

**Drawing Mode details:**
- **Single Color** — all copies draw in the same color (first palette slot)
- **Sequence** — copies cycle through palette colors by index
- **Transition (RGB)** — interpolates across all copies using RGB color space
- **Transition (LCH)** — interpolates using LCH (perceptually uniform; produces more vivid, natural gradients — preferred for quality output)

---

### TRANSFORM Section

| Parameter | Type | Notes |
|---|---|---|
| Split Mask | dropdown | None / Horizontal / Vertical / Quad |
| Scale | float | Overall scale of the entire shape stack |
| Rotation | integer (degrees) | Base rotation of the whole composition |
| Position | XY vector | Overall position offset of the shape stack |
| Transition | XY vector | Per-copy XY offset — the key parameter that creates the "expanding path" |
| Get Random Values | button | |
| Reset to Default | button | |

**Split Mask** mirrors the generated content within the canvas:
- **Horizontal** — left/right mirror
- **Vertical** — top/bottom mirror
- **Quad** — all 4 quadrants (creates mandala-like symmetry)

**Transition** is the single most important creative parameter. It defines the XY offset applied to each successive copy. Combined with Scale Sequence, this creates the characteristic stacked/expanding form. Interactive: Hold Click + Shift + Drag on canvas adjusts Transition live.

**Position** — interactive: Hold Click + Drag on canvas adjusts Position live.

---

### Motion Sections (4 independent tabs)

Tabs: **SCALE | X MOVE | Y MOVE | ROTATE**

Each tab controls one animation channel. All 4 share identical structure:

**When Motion Type = Off:**
No parameters (channel is static).

**When Motion Type = Noise:**

| Parameter | Notes |
|---|---|
| Effect Order | Forward / Backward / Equal |
| Amplitude | float |
| Frequency | float |
| Speed | float |
| Noise Seed | integer |
| Get Random Values | button |

**When Motion Type = Sinusoidal:**

| Parameter | Notes |
|---|---|
| Effect Order | Forward / Backward / Equal |
| Amplitude | float |
| Frequency | float |
| Cycles | integer |
| Phase | float |
| Get Random Values | button |

**Effect Order** — how copies are spread through the animation parameter space:
- **Forward** — copy 0 has offset 0, copy N has offset N (progressive stagger)
- **Backward** — reversed stagger
- **Equal** — all copies animate identically (no stagger; whole stack moves as one)

---

## EXPORT Tab

| Parameter | Values |
|---|---|
| Export Status | readonly — shows type, canvas size, frame progress |
| File Type | SVG File / PNG File / MP4 File / PNG Sequence / WEBP Sequence |
| Export Size | float multiplier (scales the output resolution) |
| Export Length | integer seconds (for video/sequence exports) |
| Export Quality | 0–100 |
| Export Graphics | button |

---

## OPTIONS Tab

| Parameter | Notes |
|---|---|
| Fullscreen Mode | button |
| Canvas Margins | float — blank space around canvas in preview |
| Wheel Sens | float — mouse wheel sensitivity for interactive canvas controls |
| Browser Color | 0–100 grayscale — background of non-canvas area |

---

## Interactive Canvas Controls

| Input | Effect |
|---|---|
| Hold Click + Drag | Adjust shape Position |
| Hold Click + Shift + Drag | Adjust Transition XY |
| Scroll + Shift | Adjust canvas Scale |
| Scroll + Ctrl/Cmd | Adjust Rotation |
| Drag SVG file onto canvas | Load custom shape (sets Choose Type to Custom) |
| Drag JSON file onto canvas | Import saved preset |

---

## Current State of Our Implementation

`src/tools/split/` contains a **non-functional placeholder**:
- `index.js` — raw HTML sliders, no Tweakpane, basic paper.js setup, no real rendering
- `state.js` — partial scaffolding that doesn't match target architecture
- Other files (`ui.js`, `main.js`, `presets.js`, `media.js`) — incomplete stubs

**All files need a full rewrite.** The tool directory is `src/tools/split/` (not `splitx/`).

---

## Implementation Notes

### Rendering engine
**paper.js** is the correct choice (already a project dependency). It draws vector paths natively and handles SVG import. Each copy is a `paper.Path` or `paper.Group` clone with accumulated transforms.

### Split Mask
Implemented by rendering the base composition into one quadrant/half, then mirroring via paper.js `scale(-1, 1)` / `scale(1, -1)` transforms for the reflected copies. Quad = 4 reflected renders tiled into the canvas.

### Scale Sequence + Transition
The core rendering loop:
```
for i in 0..shapeCount:
  scale = initialScale * pow(scaleSequence, i)
  position = basePosition + transition * i
  draw copy i with accumulated scale, position, rotation
```

### Color across copies
- **Sequence**: `palette[i % palette.length]`
- **Transition (RGB/LCH)**: interpolate from `palette[0]` to `palette[last]` across N copies. For LCH, use a color library (chroma.js is already a candidate) or implement manually.

### 4 Motion Channels
Independent per-frame generators, each outputting a float that is added to its target parameter (Scale, X, Y, Rotation):
- **Noise**: `simplex.noise2D(i * frequency + seed, time * speed) * amplitude`
- **Sinusoidal**: `sin(i * frequency * cycles + phase + time) * amplitude`

Where `i` is the copy index (for Effect Order = Forward) or `(shapeCount - i)` (Backward) or `0` (Equal).

### LCH color interpolation
chroma.js supports LCH natively: `chroma.mix(c1, c2, t, 'lch')`. Consider adding it as a dependency, or implement a minimal LCH lerp.

### Files to create

| File | Action |
|---|---|
| `state.js` | Full rewrite |
| `index.js` | Full rewrite — paper.js render loop, animation, split mask |
| `ui.js` | Full rewrite — MAIN/EXPORT/OPTIONS tabs, motion sub-tabs |
| `presets.js` | Full rewrite — ~8–10 built-in presets |
| `media.js` | Rewrite — SVG drag-drop + file picker |
| `main.js` | Delete — absorb into index.js |
