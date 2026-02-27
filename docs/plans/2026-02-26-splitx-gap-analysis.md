# SPLITX — Gap Analysis: Our Implementation vs Reference

**Date:** 2026-02-26
**Reference:** https://antlii.work/SPLITX-Tool v0.25
**Method:** Playwright live inspection + fetched source (`form.js`, `allpresets.js`, color system)

---

## Critical Architecture Differences

### 1. Rendering Engine

| | Our Impl | Reference |
|---|---|---|
| Copy rendering | paper.js Group/Path | p5.js Canvas2D + **Path2D** + `drawingContext` |
| Transform system | paper.js matrix transforms | p5 `push()`/`pop()`/`translate()`/`scale()`/`rotate()` |
| Shape drawing | `paper.Path` objects | `gForm.drawingContext.fill(form.shape.path, "evenodd")` |
| SVG import | paper.js (correct) | paper.js (same) |

The reference uses a **p5.js graphics buffer** (`gForm`) as the canvas for all copy rendering. Shapes are stored as `Path2D` objects and drawn via `drawingContext.fill(path, "evenodd")`. This means Path2D from p5.js (Canvas2D API), not paper.js.

**Implication:** Our paper.js copy rendering produces different transform behavior and can't implement XOR compositing the same way.

---

### 2. Transform Stack Order (Critical)

**Reference transform order per frame:**

```js
// Globals applied ONCE before copy loop:
gForm.translate(halfWidth, halfHeight);          // move origin to center
gForm.translate(position.x, position.y);        // user position offset
gForm.scale(cnv.scale.value);                   // global scale
gForm.rotate(cnv.rotation.value);               // global rotation

// Per-copy i:
gForm.push();
gForm.translate(transition.x[i], transition.y[i]);  // spread offset
gForm.translate(move.x[i], move.y[i]);              // motion offset
gForm.scale(sequence[i]);                           // sequence scale
gForm.rotate(rotate[i]);                            // rotate motion
gForm.translate(-shape.width, -shape.height);       // center shape
// draw shape
gForm.pop();
```

**Our order:** We do it differently — scale/rotate/translate with paper.js and don't separate global scale from per-copy scale.

---

## Core Algorithm Differences

### 3. Scale Sequence: LINEAR, not Geometric

**Reference formula:**
```js
// seqCount: start and end scale for the copy range
const seqCount = form.sequence >= 0
  ? [1, 1 - form.sequence]      // positive: scale 1.0 → (1-seq)
  : [form.sequence + 1, 1];     // negative: scale (1+seq) → 1.0

// Per copy:
const sequence = map(i, 0, count - 1, seqCount[0], seqCount[1]);
// final scale = sequence + motion contribution (constrained 0–2)
```

**Examples:**
- `sequence = 0.5` → copies scale linearly from **1.0 → 0.5**
- `sequence = -0.09` → copies scale linearly from **0.91 → 1.0** (Split Vibration)
- `sequence = 0.76` → copies scale linearly from **1.0 → 0.24** (Lotus)

**Our formula (WRONG):**
```js
accScale *= shape.scaleSequence; // geometric — completely different curve
```

**Scale Sequence UI range:** Presets use values from **-1 to +1** (roughly). Phase can go negative. Our `min:0.5, max:1.5` is incorrect.

---

### 4. Transition: Symmetric Spread, not One-Directional

**Reference formula:**
```js
// data = halfWidth * form.transition.x  (canvas-relative!)
function getTransition(i, data, type) {
  return map(i, 0, count - 1, -data, data);
}
```

Copy 0 is at `-data`, copy N-1 is at `+data`. The spread is **symmetric around the origin**.

**Our formula (WRONG):**
```js
cx + transform.transition.x * i + mx  // starts at cx, spreads one direction
```

**Unit difference:** `form.transition.x = 0.84` means `0.84 × halfWidth` pixels per half-spread. Our transition values are raw pixels.

---

### 5. Position: Canvas-Relative Fractions

**Reference formula:**
```js
formData.position.x = halfWidth * cnv.position.x;
formData.position.y = halfHeight * cnv.position.y;
```

`cnv.position.x = -0.06` → `-0.06 × (canvasWidth/2)` pixels. Range typically -1 to +1.

**Ours:** Raw pixel values (min:-500, max:500). **Wrong units.**

---

### 6. Move (xmove/ymove) Amplitude: Also Canvas-Relative

**Reference formula:**
```js
formData.transform.move.x.push(
  getMoveOrder(i, form.xmove.order, xMove * formData.width * form.xmove.amp)
);
```

`xMove` = raw noise/sine value (~-1 to 1), then × `halfWidth` × `amp`. So `amp = 0.15` means ±15% of half-canvas-width.

**Ours:** Amplitude is used directly in pixels. Wrong units.

---

### 7. Noise: 3D Simplex, not 2D

**Reference formula:**
```js
const noiseFreq  = map(i, 0, count - 1, 0, 1) * freq;
const noiseSpeed = rec.length.value * rec.frameRate * map(speed, 0, 1, 0, 0.005);
const noiseValue = simplex.noise3D(
  seed + noiseFreq,
  noiseSpeed * sin(TWO_PI * formData.frame),   // circular time (sin)
  noiseSpeed * cos(TWO_PI * formData.frame)    // circular time (cos)
);
```

- **3D simplex** with circular time encoding (sin/cos of normalized frame)
- `formData.frame = cnv.frame / (rec.length.value * rec.frameRate)` — normalized 0.0→1.0 over recording length
- The circular time encoding means the animation loops seamlessly

**Ours:** `noise2D(effectI * freq + seed, time * speed)` — 2D, doesn't loop.

---

### 8. Sinusoidal: Frame-Normalized, No Speed Param

**Reference formula:**
```js
const sinFreq  = map(i, 0, count - 1, 0, TWO_PI) * freq;
const sinValue = sin(TWO_PI * formData.frame * cycle + sinFreq + TWO_PI * phase);
```

- Uses normalized `frame` (0→1 over rec.length)
- **No `speed` parameter** for sinusoidal — speed is fixed by `cycle` and `rec.length`
- Phase range: `TWO_PI * phase` where phase ∈ roughly -0.5 to 0.5

**Ours:** `sin(effectI * freq * cycles + phase + time)` — different argument structure, uses raw animState.time.

---

### 9. Effect Order for Scale/Rotate (Different from Move)

**Scale effect order:**
```js
function getScaleOrder(i, value) {
  switch (order) {
    case "forward":  return map(i, 0, count-1, 0, value * amp);
    case "backward": return map(i, 0, count-1, value * amp, 0);
    case "equal":    return map(i, 0, count-1, value * amp, value * amp); // constant!
  }
}
```
Note: "equal" for scale maps to the **same value** for all copies (not symmetric).

**Rotate effect order:**
```js
// maxRotateAngle = 90 (degrees)
case "forward":  return map(i, 0, count-1, 0, 90 * value * amp);
case "backward": return map(i, 0, count-1, -90 * value * amp, 0);
case "equal":    return map(i, 0, count-1, -90 * value * amp, 90 * value * amp);
```

**Move effect order:**
```js
case "forward":  return map(i, 0, count-1, 0, value);      // value = noise * halfW * amp
case "backward": return map(i, 0, count-1, value, 0);
case "equal":    return map(i, 0, count-1, -value, value);  // symmetric for move
```

**Our implementation** uses a simpler `effectI` approach that doesn't match these semantics.

---

## Drawing Mode Differences

### 10. No "Single Color" Mode

Reference drawing modes: **Cutout (XOR) | Sequence | Transition (RGB) | Transition (LCH)**

There is **no "Single Color" mode**. To use one color, use Sequence with only 1 color toggled active.

**Ours has `single` mode** — doesn't exist in reference. Must be replaced.

---

### 11. Cutout (XOR) Mode

```js
// In drawForms(), before the copy loop:
if (form.color.mode === "xor" && form.color.type === "fill")
  gForm.drawingContext.globalCompositeOperation = "xor";

// In generateForm(), per copy:
if (form.color.type === "fill") {
  gForm.fill(formData.color[i]);
  gForm.drawingContext.fill(form.shape.path, "evenodd");  // evenodd fill rule
}
```

Uses Canvas2D `globalCompositeOperation = "xor"` — this is what creates the "cutout" black-and-color alternating pattern seen in Split Vibration.

`getColorValue()` for XOR mode returns `palette.array[palette.index]` — a single color.

**We have NO XOR mode at all.** This is the signature effect of the most prominent preset.

---

## State/Data Structure Differences

### 12. Palette Toggle System

Reference state:
```js
palette: {
  index: 2,                           // currently selected slot (for Set Color)
  array: ["#f19601", "#f21f26", "#251819", "#ebc83a", "#73b295"],
  use:   [false, true, true, false, false]  // active toggle per color
}
```

`palette.temp` is computed from `array` filtered by `use` flags. Sequence/Transition modes use only active colors.

**Our state:** No `use` flags, no `index`. All 5 colors always used.

---

### 13. Preset State Schema (Full Reference Format)

```js
{
  cnv: {
    ratio: "1:1",
    color: { mode: "palette"|"custom"|"transparent", custom: "#000000", slot: 0 },
    frame: 117,              // current animation frame (stored in preset!)
    scale: { value: 0.48 },
    rotation: { value: 84 },
    position: { x: -0.06, y: -0.24 }
  },
  palette: {
    index: 2,
    array: ["#hex", ...],    // 5 colors
    use: [bool, bool, bool, bool, bool]
  },
  form: {
    type: "triangle",
    shape: { path: "", size: { width: 0, height: 0 } },  // Path2D (empty in JSON)
    color: { type: "fill"|"stroke", mode: "xor"|"sequence"|"transitionRGB"|"transitionLCH" },
    stroke: { width: 5 },    // stroke width lives here, not in color
    count: { base: 40 },
    sequence: -0.09,          // scale sequence value
    transition: { x: 0.84, y: -1.00 },
    scale:  { type, order, seed, amp, freq, cycle, phase, speed },
    xmove:  { type, order, seed, amp, freq, cycle, phase, speed },
    ymove:  { type, order, seed, amp, freq, cycle, phase, speed },
    rotate: { type, order, seed, amp, freq, cycle, phase, speed }
  },
  split: {
    type: "quad"|"horizontal"|"vertical"|"none",
    offset: { x: 0, y: 0 },   // extra fields in reference
    mask:   { x: 0, y: 0 }    // extra fields in reference
  },
  rec: {
    type: "mp4",
    length: { value: 4 }      // export length in seconds
  }
}
```

Key differences from our state:
- `stroke.width` is in `form`, not `color`
- `color.mode` is the drawing mode (`xor`/`sequence`/etc.)
- `cnv.color.slot` = palette index for background (not `paletteColorIndex`)
- `cnv.frame` = animation frame counter stored per preset
- `split` has `offset` and `mask` sub-objects
- `rec` = export settings at top level in preset

---

## UI Control Differences

### 14. Position/Transition: 2D Point Controls

Reference: Single row with `[+]` button + two inline textboxes (X, Y)
Position: (-0.06, -0.24) | Transition: (0.84, -1.00)

**Ours:** Separate X and Y slider bindings (4 controls instead of 2).

---

### 15. Color Section UX

Reference layout (in order):
1. **Styling Type** dropdown (Fill / Stroke)
2. **Drawing Mode** dropdown (Cutout XOR / Sequence / Transition RGB / Transition LCH)
3. **Row of 5 swatch selector buttons** (click to select which slot to edit; shows color, active=framed)
4. **Color Preset** — 5 toggle buttons (active/inactive per slot; darker=inactive)
5. **Set Color** — single color picker for currently-selected `palette.index` slot
6. **Get Random Palette** button

**Ours:** 5 inline color pickers + 5 palette preset buttons + random button. Wrong pattern entirely.

---

### 16. Motion "Off" Shows Disabled Controls

When Motion Type = "Off": the param controls (Effect Order, Amplitude, etc.) remain **visible but disabled** (grayed out), showing the last-used type's values.

**Ours:** Hides param controls entirely.

---

### 17. Numeric Ranges (Corrections Needed)

| Field | Ours | Correct |
|---|---|---|
| Scale Sequence | min:0.5, max:1.5 | approx -1 to 1 (presets use -0.09 to 0.76+) |
| Amplitude (motion) | min:0 | Can be negative (Scale Vibration uses -0.32) |
| Phase | min:0, max:2π | Can be negative (presets use -0.47 to +0.5) |
| Position X/Y | min:-500, max:500 (pixels) | canvas-relative fractions (approx -1 to 1) |
| Transition X/Y | min:-200, max:200 (pixels) | canvas-relative fractions (approx -2 to 2) |
| Rotation | min:0, max:360 | Can be negative |

---

## Preset Differences

### 18. 21 Presets (We Have 8)

Full reference list: Split Vibration, Lotus Metamorphosis, Star Trails, Wall Art Dynamics, Radical Vortex, Hypnotic Garden, Hype The Type, Butterfly Effect, Cutout Progression, Funky Beats, Cross Transition, Jelly Airflow, OMG, Star Force Credits, Glowing Vessel, Blossom Geomerty, Matrix Drawing, Pool Vibration, Unfolding Circles, Prismatic Mandala, Drop The SVG.

Note typo "Blossom Geomerty" matches reference exactly.

---

## Minor/Lower Priority Differences

| Item | Reference | Ours |
|---|---|---|
| Tab count | 4 (MAIN, EXPORT, OPTIONS, LICENSE) | 3 (no LICENSE) |
| Preset buttons | "Restart Preset" + "Preset Import/Export" | "Restart Preset" + "Save User Preset" + "Export Preset JSON" |
| Export status | Green text | No special styling |
| Canvas Color control | Only shown when Background = Custom | Always shown (but hidden via palColorIndexBlade logic) |
| Stroke Width | Shown for Stroke styling type | Same (correct) |

---

## Summary: What Needs to Change

### High Priority (wrong rendering / wrong visual output)
1. **Scale Sequence formula** — switch from geometric to linear map
2. **Transition formula** — switch from `transition.x * i` to symmetric `map(i, 0, n-1, -data, data)`
3. **Parameter units** — position/transition as canvas-relative fractions × halfWidth
4. **Add Cutout (XOR) drawing mode** — `globalCompositeOperation = "xor"`, fill with evenodd rule
5. **Remove "Single Color" mode** — replace with XOR or just use Sequence with 1 color active
6. **Noise formula** — switch to 3D simplex with circular time encoding for seamless looping

### Medium Priority (missing features, wrong UX)
7. **Palette toggle system** — `palette.use` flags, `palette.index`, `palette.temp` filtering
8. **Color UX overhaul** — swatch selector buttons + toggle buttons + single Set Color picker
9. **Motion "Off" → show disabled** — keep controls visible but disabled
10. **Scale Sequence / Amplitude / Phase ranges** — allow negative values

### Lower Priority (cosmetic/completeness)
11. **21 presets** from reference allpresets.js (can be ported directly)
12. **State schema alignment** — `stroke.width` location, `cnv.color.slot`, `rec` object
13. **LICENSE tab** — license key entry (can be stub)
14. **Position/Transition as 2D point controls**
15. **Sinusoidal formula alignment** (frame-normalized, no speed param)
