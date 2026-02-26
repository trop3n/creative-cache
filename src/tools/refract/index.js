// ============================================================
// REFRACT Tool — Entry Point
// ============================================================

import p5 from 'p5';
import { vertShader, displaceFrag, gridRefractFrag } from './shaders.js';
import { canvas, options, transform, refract, animation, exportSettings, media } from './state.js';
import { setupUI, refreshUI } from './ui.js';
import { setupMedia } from './media.js';

export async function loadRefractTool(canvasContainer, paneContainer) {
  let p5Instance    = null;
  let uiInstance    = null;
  let _onMedia      = null;   // shared between setupMedia and handleFile

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

      _onMedia = (type, source) => {
        if (type === 'image') {
          srcImg = source;
          resizeForImage(p, source);
          needsUpdate = true;
        }
      };
      setupMedia(p, canvasContainer, _onMedia);

      uiInstance = setupUI(paneContainer, {
        onParamChange:    () => { needsUpdate = true; p.redraw(); },
        onRefractChange:  () => { createBuffers(p); needsUpdate = true; p.redraw(); },
        onCanvasChange:   () => {
          syncCanvasSize();
          p.resizeCanvas(canvas.width, canvas.height);
          createBuffers(p);
          needsUpdate = true;
          p.redraw();
        },
        onAnimationChange: () => {
          if (animation.playing) p.loop();
          else { p.noLoop(); needsUpdate = true; p.redraw(); }
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
      dispShader.setUniform('u_box_ampX',   t.box.x.amplify);
      dispShader.setUniform('u_box_ampY',   t.box.y.amplify);
      dispShader.setUniform('u_box_freqX',  t.box.x.frequency);
      dispShader.setUniform('u_box_freqY',  t.box.y.frequency);
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
      dispShader.setUniform('u_sine_ampX',   t.sine.x.amplify);
      dispShader.setUniform('u_sine_ampY',   t.sine.y.amplify);
      dispShader.setUniform('u_sine_freqX',  t.sine.x.frequency);
      dispShader.setUniform('u_sine_freqY',  t.sine.y.frequency);
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
          media.source   = img;
          media.fileName = file.name;
          _onMedia?.('image', img);
        });
      }
    },
  };
}
