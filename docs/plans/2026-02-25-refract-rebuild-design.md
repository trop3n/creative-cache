# REFRACT Tool — Full Rebuild Design

**Date:** 2026-02-25
**Status:** Approved

---

## Problem

The current REFRACT implementation is a placeholder using an 8-effect architecture (displacement, refraction, ripple, wave, pinch, twirl, lens, barrel). It does not match the target design. Infrastructure bugs (hardcoded DOM IDs in `media.js` and `ui.js`) were fixed in a prior session, but the architecture, shaders, state, and UI were never rebuilt.

---

## Target Architecture

Two stacked filters:

1. **TRANSFORM FILTERS** — primary displacement engine, single shader with 3 modes (Box, Flow, Sine)
2. **REFRACT FILTER** — optional secondary pass (None or Grid) applied on top of the displaced result

Mirror UV wrapping is the defining visual characteristic. All presets use Mirror. Implementation: `abs(mod(uv - 1.0, 2.0) - 1.0)` applied in the shader, not via p5's `textureWrap`.

---

## Files

| File | Action |
|---|---|
| `state.js` | Full rewrite |
| `shaders.js` | Full rewrite — 2 shaders only |
| `index.js` | Full rewrite — two-pass render |
| `ui.js` | Full rewrite — 3 tabs, dynamic sub-controls |
| `presets.js` | Full rewrite — 10 presets using new state structure |
| `media.js` | Keep as-is (already fixed) |

---

## State Structure

```js
// canvas
{
  width, height,           // runtime, derived from maxImageSize + aspect
  ratio: '1:1',
  preset: 'Preset 1',
  textureWrap: 'mirror',   // 'mirror' | 'repeat' | 'clamp'
  contentScaleX: 1.0,
  contentScaleY: 1.0,
  background: 'custom',    // 'custom' | 'transparent'
  canvasColor: '#ffffff',
}

// options
{
  margin: 16,              // px — increases preview canvas blank space
  browserColor: '#1a1a1a', // background of non-rendered area
  maxImageSize: 2048,      // px — cap on canvas buffer size, range 1024–4096
}

// transform
{
  displaceType: 'box',     // 'box' | 'flow' | 'sine'
  seed: 0,
  box: {
    x: { amplify: 1.0, frequency: 1.0, speed: 0.0 },
    y: { amplify: 1.0, frequency: 1.0, speed: 0.0 },
  },
  flow: {
    complexity: 3,         // octave count
    frequency: 1.0,        // global
    x: { amplify: 1.0, speed: 0.0 },
    y: { amplify: 1.0, speed: 0.0 },
  },
  sine: {
    x: { amplify: 1.0, frequency: 1.0, speed: 0.0 },
    y: { amplify: 1.0, frequency: 1.0, speed: 0.0 },
  },
}

// refract
{
  type: 'none',            // 'none' | 'grid'
  grid: {
    x: { skewLevel: 1.25, gridAmount: 20 },
    y: { skewLevel: 1.25, gridAmount: 20 },
  },
}
```

---

## Shaders

### Pass 1 — `displaceFrag`

Single fragment shader. `u_displaceType` int selects mode:

- **0 = Box**: `floor(uv * freq)` → per-cell hash → random offset vector. Per-axis frequency, amplify, speed.
- **1 = Flow**: simplex noise fBm, `u_complexity` octaves, global `u_frequency`. Per-axis amplify and speed.
- **2 = Sine**: radial sine wave per axis. Per-axis frequency, amplify, speed.

All modes use mirror UV wrapping on the final distorted coordinate.

### Pass 2 — `gridRefractFrag`

Only rendered when `refract.type === 'grid'`. Divides UV into `gridAmountX × gridAmountY` cells, applies radial lens displacement within each cell using `skewLevel` as strength. Composited on top of pass 1 result.

---

## Render Loop (`index.js`)

```
setup:
  create dispBuffer (WEBGL)
  if refract.type === 'grid': create refractBuffer (WEBGL)
  compile shaders
  p.noLoop()

draw:
  if animating: advance animTime, needsUpdate = true
  if !needsUpdate: return
  render pass 1 → dispBuffer
  if refract.type === 'grid': render pass 2 → refractBuffer using dispBuffer as input
  p.image(finalBuffer, 0, 0)
  needsUpdate = false
```

Canvas sizing: image load resizes canvas to match aspect ratio, capped at `options.maxImageSize`.

---

## UI — Three Tabs

### MAIN Tab

- Preset dropdown (Preset 1–10 + user presets)
- Texture Wrap dropdown (Mirror / Repeat / Clamp)
- Content Scale X, Content Scale Y (floats)
- Background dropdown (Custom / Transparent)
- Canvas Color picker (shown when background = Custom)

**TRANSFORM FILTERS** folder:
- Displace Type dropdown (Box Displace / Flow Displace / Sine Displace)
- Noise Seed
- Dynamic sub-controls per type (show/hide based on selected type)

**REFRACT FILTER** folder:
- Refract Type dropdown (None / Grid)
- Grid sub-controls (X/Y Skew Level + Grid Amount) shown only when Grid selected

### EXPORT Tab

- Format (PNG / JPG / WebP)
- Quality slider
- Export Scale (1x / 2x / 3x / 4x)
- Export button

### OPTIONS Tab

- Canvas Margins slider (px, increases blank space around preview canvas)
- Browser Color picker (background of non-rendered area)
- Max Image Size (number, 1024–4096 px)

---

## Presets (10 built-in)

| # | Name | Type | Notes |
|---|---|---|---|
| 1 | Default | Box Displace | Low amp, visible but subtle |
| 2 | Box Heavy | Box Displace | High amp + freq, dramatic boxy cells |
| 3 | Flow Petals | Flow Displace | Organic blobs, mid complexity |
| 4 | Flow Ribbons | Flow Displace | High amp, low freq, flowing bands |
| 5 | Sine Rings | Sine Displace | Concentric ring pattern |
| 6 | Sine Ripple | Sine Displace | Fine ripple, high freq |
| 7 | Grid Warp | Box Displace + Grid Refract | Box displace with 20×20 grid |
| 8 | Lens Field | Flow Displace + Grid Refract | Flow displace with wide grid |
| 9 | Topographic | Flow Displace | High complexity, map-like contours |
| 10 | Box Max | Box Displace | Seed 601, X amp 8/freq 40/speed 35, Y amp 7/freq 50/speed 50 |

---

## Out of Scope

- Image processing (brightness, contrast, saturation, hue) — dropped entirely
- LICENSE tab — omitted
- Old 8-effect types — removed completely
