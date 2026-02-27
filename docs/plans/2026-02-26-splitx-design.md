# SPLITX Tool — Rebuild Design

**Date:** 2026-02-26
**Status:** Approved — ready for implementation planning

---

## Summary

Full rewrite of `src/tools/split/` to match the reference tool (https://antlii.work/SPLITX-Tool v0.25).
All existing files are non-functional placeholders. Every file needs a complete rewrite.

---

## Architecture

**Rendering engine:** paper.js owns all drawing. p5.js provides the animation clock only —
`p.draw()` calls `paper.view.update()`. Paper.js is initialized on the p5 canvas element
via `paper.setup(canvas.elt)`.

**Per-frame pipeline:**
1. `buildCopies()` — generates N paper.js paths, each with accumulated Scale Sequence +
   Transition XY + per-copy motion offsets applied
2. `applyMask()` — mirrors the stack into 2 or 4 quadrants via paper.js Group transforms
   based on `transform.splitMask`
3. `paper.view.update()` — composites to screen

**Animation:** `p.loop()`/`p.noLoop()` based on whether any motion channel is active.
4 independent motion channels each output a float per copy per frame.

---

## File Structure

```
src/tools/split/
  index.js      p5 sketch, paper.js render loop, animation, split mask, interactive controls
  state.js      all mutable state objects
  ui.js         Tweakpane MAIN/EXPORT/OPTIONS tabs, dynamic motion sub-tabs
  presets.js    8 built-in presets + localStorage user preset + JSON import/export
  media.js      SVG drag-drop, JSON preset import, file picker
  color.js      palette management, 4 drawing modes, manual LCH interpolation
  shapes.js     paper.js path generators for all 14 shape types
  export.js     SVG, PNG, MP4, PNG sequence, WEBP sequence
```

Files to delete: `main.js`, `style.css`

---

## State Structure

```js
// Canvas
canvas: { width, height, ratio, background, paletteColorIndex, scale }
// background: 'custom' | 'palette' | 'transparent'
// ratio options: '2:1','16:9','3:2','4:3','5:4','1:1','4:5','3:4','2:3','9:16','1:2'

// Shape
shape: { type, count, scaleSequence }
// type: 'rectangle'|'circle'|'ring'|'oval'|'triangle'|'rhombus'|'cross'|
//       'star'|'hexagon'|'petals'|'checker'|'blob'|'organic'|'custom'

// Color
color: { stylingType, strokeWidth, drawingMode, palette }
// stylingType: 'fill' | 'stroke'
// drawingMode: 'single' | 'sequence' | 'rgb' | 'lch'
// palette: [c1, c2, c3, c4, c5]  (hex strings)

// Transform
transform: { splitMask, scale, rotation, position: {x,y}, transition: {x,y} }
// splitMask: 'none' | 'horizontal' | 'vertical' | 'quad'

// Motion (4 independent channels, identical structure)
motion: {
  scale:  { type, noise: { effectOrder, amplitude, frequency, speed, seed }, sine: { effectOrder, amplitude, frequency, cycles, phase } },
  xMove:  { ... },
  yMove:  { ... },
  rotate: { ... }
}
// type: 'off' | 'noise' | 'sinusoidal'
// effectOrder: 'forward' | 'backward' | 'equal'

// Export
exportSettings: { fileType, size, length, quality, status }
// fileType: 'svg' | 'png' | 'mp4' | 'png-sequence' | 'webp-sequence'
```

---

## Core Rendering Logic

```js
function render() {
  paperProject.clear();
  drawBackground();

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const baseShape = getShapePath();  // paper.Path from shapes.js
  let accScale = transform.scale;
  const copies = [];

  for (let i = 0; i < shape.count; i++) {
    const copy = baseShape.clone();
    const s  = accScale + motionValue('scale', i);
    const mx = motionValue('xMove', i);
    const my = motionValue('yMove', i);
    const mr = motionValue('rotate', i);

    copy.scale(s, new paper.Point(cx, cy));
    copy.rotate(transform.rotation + mr, new paper.Point(cx, cy));
    copy.translate(new paper.Point(
      transform.transition.x * i + transform.position.x + mx,
      transform.transition.y * i + transform.position.y + my
    ));
    applyColor(copy, i);
    copies.push(copy);
    accScale *= shape.scaleSequence;
  }

  applyMask(copies);
  paper.view.update();
}
```

**Motion value formula:**
- `noise`:  `simplex.noise2D(effectI * freq + seed, time * speed) * amplitude`
- `sine`:   `Math.sin(effectI * freq * cycles + phase + time) * amplitude`
- `effectI`: `i` (forward), `count - i` (backward), `0` (equal)

---

## Color System

- **Single:** all copies use `palette[0]`
- **Sequence:** `palette[i % 5]`
- **Transition RGB:** lerp from `palette[0]` to `palette[4]` across N copies using RGB
- **Transition LCH:** same, using manual LCH conversion (RGB→XYZ→Lab→LCH and back, ~30 lines)

---

## Split Mask

```js
function applyMask(copies) {
  const group = new paper.Group(copies);
  if (splitMask === 'horizontal') {
    // original + mirror: scale(-1,1) around center
    const mirror = group.clone();
    mirror.scale(-1, 1, paper.view.center);
  } else if (splitMask === 'vertical') {
    const mirror = group.clone();
    mirror.scale(1, -1, paper.view.center);
  } else if (splitMask === 'quad') {
    // 4 quadrants: original + 3 mirrors
    const h = group.clone(); h.scale(-1, 1, paper.view.center);
    const v = group.clone(); v.scale(1, -1, paper.view.center);
    const d = group.clone(); d.scale(-1, -1, paper.view.center);
  }
}
```

---

## Interactive Canvas Controls

| Input | Effect |
|---|---|
| Click + Drag | Adjust `transform.position` |
| Click + Shift + Drag | Adjust `transform.transition` |
| Scroll + Shift | Adjust `transform.scale` |
| Scroll + Ctrl/Cmd | Adjust `transform.rotation` |
| Drop SVG | Load custom shape |
| Drop JSON | Import preset |

All interactive changes call `p.redraw()` immediately.

---

## UI Structure

**MAIN tab:**
- Presets section: dropdown (8 built-in + User), Restart, Import/Export JSON buttons
- CANVAS folder: ratio, background, palette color index (conditional on background=palette)
- SHAPE folder: type, count, scaleSequence
- COLOR folder: stylingType, strokeWidth (conditional), drawingMode, 5 swatches,
  5 quick-palette buttons, Get Random Palette
- TRANSFORM folder: splitMask, scale, rotation, position XY, transition XY,
  Get Random Values, Reset to Default
- MOTION section: 4 sub-folders (SCALE / X MOVE / Y MOVE / ROTATE),
  each with Motion Type dropdown and conditional noise or sine param blades

**EXPORT tab:** status (readonly), fileType, size, length, quality, Export button

**OPTIONS tab:** fullscreen button, canvas margins, wheel sensitivity, browser color

---

## Export Implementation

- **SVG:** `paperProject.exportSVG({ asString: true })` → Blob download
- **PNG:** draw paper.js to offscreen canvas at `size` multiplier → `canvas.toBlob()`
- **MP4 / WEBP Sequence / PNG Sequence:** `MediaRecorder` with canvas stream; frame capture loop
  for `length` seconds at 30fps; sequences save individual frames as Blob downloads

---

## Presets (8 built-in)

Names drawn from the reference list, values tuned for visual quality:
Split Vibration, Star Trails, Prismatic Mandala, Lotus Metamorphosis,
Hypnotic Garden, Butterfly Effect, Radical Vortex, Funky Beats
