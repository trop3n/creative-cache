// ============================================================
// Refract Tool Adapter for Creative Suite
// ============================================================

import p5 from 'p5';
import { vertShader, displacementFrag as fragShader } from './shaders.js';
import { canvas as cnv, distortion, media } from './state.js';
import { setupUI, refreshUI } from './ui.js';
import { setupMedia } from './media.js';

// Flat compatibility shim so the rest of the adapter code is unchanged.
const typeToMode = { displacement: 0, refraction: 1, ripple: 2, wave: 3, pinch: 4, twirl: 5, lens: 6, barrel: 7 };
const params = {
  get strength() { return distortion.amount; },
  get scale()    { return distortion.scale; },
  get offsetX()  { return distortion.displacement?.offsetX ?? 0; },
  get offsetY()  { return distortion.displacement?.offsetY ?? 0; },
  get mode()     { return typeToMode[distortion.type] ?? 0; },
};

export async function loadRefractTool(canvasContainer, paneContainer) {
  let p5Instance = null;
  let uiInstance = null;
  let isSetup = false;

  const sketch = (p) => {
    let srcImg = null;
    let dispImg = null;
    let resultBuffer = null;
    let dispShader = null;
    let needsUpdate = true;
    let fileHandler = null;

    p.setup = () => {
      const canvas = p.createCanvas(cnv.width, cnv.height);
      canvas.parent(canvasContainer);
      p.pixelDensity(1);

      createPlaceholder(p);
      createBuffers(p);

      fileHandler = (type, source) => {
        if (type === 'image') {
          srcImg = source;
          resizeForImage(p, source);
          needsUpdate = true;
        }
      };

      setupMedia(p, fileHandler);

      uiInstance = setupUI(p, {
        onParamChange: () => { needsUpdate = true; },
        onResize: () => { 
          calculateCanvasSize();
          p.resizeCanvas(cnv.width, cnv.height);
          createBuffers(p);
          needsUpdate = true;
        },
        onMediaUpload: () => {
          const input = document.getElementById('fileInput');
          if (input) input.click();
        },
        onExport: () => handleExport(p),
        onLoadPreset: (presetData) => {
          Object.assign(params, presetData);
          refreshUI();
          needsUpdate = true;
        }
      });

      isSetup = true;
    };

    p.draw = () => {
      if (!isSetup) return;

      if (needsUpdate) {
        render(p);
        needsUpdate = false;
      }

      p.image(resultBuffer, 0, 0, p.width, p.height);
    };

    p.windowResized = () => {
      calculateCanvasSize();
      p.resizeCanvas(cnv.width, cnv.height);
      createBuffers(p);
      needsUpdate = true;
    };

    function createBuffers(p) {
      if (resultBuffer) resultBuffer.remove();

      resultBuffer = p.createGraphics(cnv.width, cnv.height, p.WEBGL);
      resultBuffer.pixelDensity(1);

      dispShader = resultBuffer.createShader(vertShader, fragShader);
      resultBuffer.textureWrap(p.REPEAT);
    }

    function createPlaceholder(p) {
      const w = 640;
      const h = 480;
      const img = p.createImage(w, h);
      img.loadPixels();
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const t = (x + y) / (w + h);
          const v = Math.floor(t * 255);
          img.pixels[idx] = v;
          img.pixels[idx + 1] = Math.floor(v * 0.7);
          img.pixels[idx + 2] = Math.floor(255 - v * 0.5);
          img.pixels[idx + 3] = 255;
        }
      }
      img.updatePixels();
      srcImg = img;
    }

    function render(p) {
      if (!srcImg) return;

      resultBuffer.shader(dispShader);

      dispShader.setUniform('uSrc', srcImg);
      dispShader.setUniform('uDisp', srcImg);
      dispShader.setUniform('uResolution', [resultBuffer.width, resultBuffer.height]);
      dispShader.setUniform('uStrength', params.strength);
      dispShader.setUniform('uScale', params.scale);
      dispShader.setUniform('uOffset', [params.offsetX, params.offsetY]);
      dispShader.setUniform('uMode', params.mode);

      resultBuffer.rect(-resultBuffer.width / 2, -resultBuffer.height / 2, resultBuffer.width, resultBuffer.height);
    }

    function resizeForImage(p, img) {
      const aspect = img.width / img.height;
      const maxW = window.innerWidth - 280 - 320;
      const maxH = window.innerHeight - 40;

      let w = maxW;
      let h = w / aspect;

      if (h > maxH) {
        h = maxH;
        w = h * aspect;
      }

      cnv.width = Math.floor(w);
      cnv.height = Math.floor(h);

      p.resizeCanvas(cnv.width, cnv.height);
      createBuffers(p);
    }

    function calculateCanvasSize() {
      const maxW = window.innerWidth - 280 - 320;
      const maxH = window.innerHeight - 40;

      cnv.width = Math.min(cnv.width || 640, maxW);
      cnv.height = Math.min(cnv.height || 480, maxH);
    }

    function handleExport(p) {
      if (resultBuffer) {
        resultBuffer.save('refract-export', 'png');
      }
    }
  };

  p5Instance = new p5(sketch, canvasContainer);

  return {
    p5Instance,
    uiInstance,
    handleFile: (file) => {
      if (file.type.startsWith('image/')) {
        const input = document.getElementById('fileInput');
        if (input) {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          input.files = dataTransfer.files;
          input.dispatchEvent(new Event('change'));
        }
      }
    }
  };
}
