// ============================================================
// Rhythm Tool Adapter for Creative Suite
// ============================================================

import p5 from 'p5';
import {
  canvas, waveform, colorPalette, animation,
  generatePalette, getLineColor,
} from './state.js';
import { updateCanvasSize, getWaveformLines } from './waveform.js';
import { setupUI } from './ui.js';
import { exportComposition } from './export.js';

export async function loadRhythmTool(canvasContainer, paneContainer) {
  let p5Instance = null;
  let uiInstance = null;
  let currentTime = 0;
  let isSetup = false;

  // Initialise canvas size and colour palette for this session
  updateCanvasSize();
  generatePalette(waveform.count);

  const sketch = (p) => {
    p.setup = () => {
      const cnv = p.createCanvas(canvas.width, canvas.height);
      cnv.parent(canvasContainer);
      p.pixelDensity(1);

      uiInstance = setupUI(paneContainer, {
        onParamChange: () => {
          generatePalette(waveform.count);
          p.redraw();
        },
        onSettingsChange: () => {
          updateCanvasSize();
          p.resizeCanvas(canvas.width, canvas.height);
          generatePalette(waveform.count);
          p.redraw();
        },
        onCanvasChange: () => {
          updateCanvasSize();
          p.resizeCanvas(canvas.width, canvas.height);
          p.redraw();
        },
        onAnimationChange: () => {
          if (animation.playing) {
            p.loop();
          } else {
            p.noLoop();
            p.redraw();
          }
        },
        onExport: () => exportComposition(p, currentTime),
      });

      if (animation.playing) {
        p.loop();
      } else {
        p.noLoop();
      }

      isSetup = true;
    };

    // --- Draw Loop ---
    p.draw = () => {
      if (!isSetup) return;

      if (animation.playing) {
        const frame = p.frameCount * animation.speed;
        currentTime = (frame % animation.loopDuration) / animation.loopDuration;
      }

      p.background(canvas.background);
      drawWaveforms(p, currentTime);
      animation.currentFrame = p.frameCount;
    };

    // --- Waveform Rendering ---
    function drawWaveforms(p, time) {
      const lines = getWaveformLines(time);

      p.strokeCap(waveform.strokeCap === 'round' ? p.ROUND : p.SQUARE);
      p.noFill();

      lines.forEach((line, i) => {
        const color = getLineColor(i, waveform.count, time);
        const c = p.color(color);
        c.setAlpha(waveform.strokeOpacity * 255);
        p.stroke(c);
        p.strokeWeight(waveform.strokeWeight);

        p.beginShape();
        line.points.forEach(pt => p.vertex(pt.x, pt.y));
        p.endShape();
      });
    }

    p.windowResized = () => p.redraw();
  };

  p5Instance = new p5(sketch, canvasContainer);

  return {
    p5Instance,
    get uiInstance() { return uiInstance; },
    handleFile: () => {},
  };
}
