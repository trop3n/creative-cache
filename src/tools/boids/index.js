// ============================================================
// BOIDS Tool Adapter for Creative Suite
// ============================================================

import p5 from 'p5';
import { canvas, flock, visual, animation, exportSettings, updateCanvasSize, getBoidColor } from './state.js';
import { Flock } from './boids.js';
import { setupUI, setStatus } from './ui.js';

export async function loadBoidsTool(canvasContainer, paneContainer) {
  let p5Instance  = null;
  let uiInstance  = null;
  let flockInst   = null;
  let isSetup     = false;

  // Video recording state
  let mediaRecorder  = null;
  let recordedChunks = [];
  let isRecording    = false;

  updateCanvasSize();

  const sketch = (p) => {
    p.setup = () => {
      const cnv = p.createCanvas(canvas.width, canvas.height);
      cnv.parent(canvasContainer);
      p.pixelDensity(1);

      flockInst = new Flock(flock.count, canvas.width, canvas.height);

      uiInstance = setupUI(paneContainer, {
        // A parameter changed — no structural rebuild needed
        onParamChange: () => { /* draw loop picks up changes automatically */ },

        // Count changed — resize the flock
        onCountChange: () => {
          flockInst.resize(flock.count, canvas.width, canvas.height);
        },

        // Canvas size changed — resize canvas and scatter boids
        onCanvasChange: () => {
          updateCanvasSize();
          p.resizeCanvas(canvas.width, canvas.height);
          flockInst.scatter(canvas.width, canvas.height);
        },

        // Full reset (preset load / randomize / reset defaults)
        onFullReset: () => {
          updateCanvasSize();
          p.resizeCanvas(canvas.width, canvas.height);
          flockInst.resize(flock.count, canvas.width, canvas.height);
          flockInst.scatter(canvas.width, canvas.height);
        },

        // Scatter boids without resizing
        onScatter: () => {
          flockInst.scatter(canvas.width, canvas.height);
        },

        onExport: () => exportFrame(p),
      });

      // Draw the initial background
      p.background(canvas.background);

      p.loop();
      isSetup = true;
    };

    // --- Draw Loop ---
    p.draw = () => {
      if (!isSetup) return;

      // Trail effect: semi-transparent fill instead of a full clear
      const bgColor = p.color(canvas.background);
      bgColor.setAlpha(canvas.trailAlpha);
      p.noStroke();
      p.fill(bgColor);
      p.rect(0, 0, canvas.width, canvas.height);

      // Update and draw boids
      flockInst.update(flock, canvas.width, canvas.height);
      flockInst.draw(p, getBoidColor, visual);
    };

    p.windowResized = () => { /* canvas size is fixed, nothing to do */ };
  };

  // ---- Export ----
  function exportFrame(p) {
    if (exportSettings.format === 'webm') {
      toggleVideoRecording(p);
      return;
    }

    const scale = exportSettings.scale;
    const w = canvas.width  * scale;
    const h = canvas.height * scale;

    setStatus('Exporting…');

    const pg = p.createGraphics(w, h);
    pg.pixelDensity(1);
    pg.background(canvas.background);
    pg.scale(scale);
    flockInst.draw(pg, getBoidColor, visual);
    pg.save(`boids-export-${Date.now()}.png`);
    pg.remove();

    setStatus('Done!');
    setTimeout(() => setStatus('Ready'), 2000);
  }

  function toggleVideoRecording(p) {
    if (isRecording) {
      mediaRecorder?.stop();
      return;
    }

    if (!MediaRecorder.isTypeSupported('video/webm')) {
      alert('WebM recording is not supported in this browser.');
      return;
    }

    const stream = p.canvas.captureStream(30);
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 5_000_000,
    });
    recordedChunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `boids-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      isRecording = false;
      setStatus('Video saved!');
      setTimeout(() => setStatus('Ready'), 2000);
    };

    mediaRecorder.start();
    isRecording = true;
    setStatus('Recording… click Export to stop');
  }

  // ---- Initialise ----
  p5Instance = new p5(sketch, canvasContainer);

  return {
    p5Instance,
    get uiInstance() { return uiInstance; },
    handleFile: () => {},
  };
}
