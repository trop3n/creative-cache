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
