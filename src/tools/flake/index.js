// ============================================================
// FLAKE Tool — Entry point for Creative Suite
// ============================================================

import p5 from 'p5';
import {
  canvas, pattern, style, motion, customShape, mask,
  computeCanvasSize,
} from './state.js';
import { renderPattern } from './grid.js';
import { setupUI, refreshUI, setStatus } from './ui.js';
import { loadSVGFile } from './shapes/svg.js';
import { exportComposition } from './export.js';
import { importState } from './presets.js';

export async function loadFlakeTool(canvasContainer, paneContainer) {
  let p5Instance  = null;
  let uiInstance  = null;
  let frameCount  = 0;
  let isSetup     = false;

  const sketch = (p) => {
    p.setup = () => {
      syncCanvasSize();

      const cnv = p.createCanvas(canvas.width, canvas.height);
      cnv.parent(canvasContainer);
      p.pixelDensity(1);

      uiInstance = setupUI(paneContainer, {
        onParamChange:     () => p.redraw(),
        onGridChange:      () => {
          syncCanvasSize();
          p.resizeCanvas(canvas.width, canvas.height);
          p.redraw();
        },
        onAnimationChange: () => {
          if (motion.playing && motion.motionType !== 'none') {
            p.loop();
          } else {
            p.noLoop();
            p.redraw();
          }
        },
        onExport:          () => exportComposition(p, frameCount),
        onMaskUpload:      () => {
          const input = document.getElementById('fileInput');
          if (input) {
            input.setAttribute('accept', 'image/*');
            input.click();
          }
        },
      });

      // Drag-and-drop on canvas area (file-input clicks are handled globally)
      setupDragDrop(p);

      p.noLoop();
      isSetup = true;
    };

    p.draw = () => {
      if (!isSetup) return;

      const time = (frameCount % 600) / 600;
      renderPattern(p, time);

      if (motion.playing && motion.motionType !== 'none') {
        frameCount += motion.speed;
      }
    };

    p.windowResized = () => {
      syncCanvasSize();
      p.resizeCanvas(canvas.width, canvas.height);
      p.redraw();
    };
  };

  // ── Canvas size helper ──────────────────────────────────────
  function syncCanvasSize() {
    const sidebarW = 280;
    const paneW    = 320;
    const availW   = (window.innerWidth  - sidebarW - paneW) * 0.97;
    const availH   = window.innerHeight * 0.97;
    computeCanvasSize(availW, availH);
  }

  // ── Drag-and-drop (canvas only — no duplicate fileInput listener) ──
  function setupDragDrop(p) {
    canvasContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      canvasContainer.classList.add('drag-over');
    });

    canvasContainer.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      canvasContainer.classList.remove('drag-over');
    });

    canvasContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      canvasContainer.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) processFile(p, file);
    });
  }

  // ── File handling ───────────────────────────────────────────
  async function processFile(p, file) {
    const name = file.name.toLowerCase();
    const type = file.type;

    try {
      if (type === 'image/svg+xml' || name.endsWith('.svg')) {
        setStatus('Loading SVG…');
        const data          = await loadSVGFile(file);
        customShape.paths   = data.paths;
        customShape.bounds  = data.bounds;
        customShape.name    = file.name;
        customShape.svgData = data;
        // Automatically switch to custom shape
        style.shapeType = 'custom';
        refreshUI();
        p.redraw();
        setStatus('SVG loaded!');
        setTimeout(() => setStatus('Ready'), 2000);

      } else if (type.startsWith('image/')) {
        setStatus('Loading mask…');
        const img       = await loadP5Image(p, file);
        mask.image      = img;
        mask.maskTool   = 'image';
        refreshUI();
        p.redraw();
        setStatus('Mask loaded!');
        setTimeout(() => setStatus('Ready'), 2000);

      } else if (name.endsWith('.json')) {
        const text = await file.text();
        if (importState(text)) {
          refreshUI();
          syncCanvasSize();
          p.resizeCanvas(canvas.width, canvas.height);
          p.redraw();
          setStatus('Preset imported!');
          setTimeout(() => setStatus('Ready'), 2000);
        }
      }
    } catch (err) {
      console.error('FLAKE: failed to load file', err);
      setStatus('Error loading file');
      setTimeout(() => setStatus('Ready'), 2000);
    }
  }

  function loadP5Image(p, file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      p.loadImage(url,
        (img) => { URL.revokeObjectURL(url); resolve(img); },
        ()    => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); }
      );
    });
  }

  // ── Boot ────────────────────────────────────────────────────
  p5Instance = new p5(sketch, canvasContainer);

  return {
    p5Instance,
    uiInstance,
    handleFile: (file) => {
      // Called by src/main.js when a file is chosen via the global file input
      processFile(p5Instance, file);
    },
  };
}
