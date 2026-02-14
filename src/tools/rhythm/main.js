// ============================================================
// Main Entry Point - RhythmGenerator
// ============================================================

import p5 from 'p5';
import {
  canvas, waveform, colorPalette, animation,
  generatePalette, getLineColor,
} from './state.js';
import { updateCanvasSize } from './waveform.js';
import { setupUI, refreshUI, setStatus } from './ui.js';
import { getWaveformLines, updateCanvasSize as updateWaveformCanvas } from './waveform.js';
import { exportComposition, stopRecording, getIsRecording } from './export.js';

// Global state
let isSetup = false;
let currentTime = 0;

const sketch = (p) => {
  // --- Setup ---
  p.setup = () => {
    // Calculate initial canvas size
    updateCanvasSize();
    updateWaveformCanvas();
    
    // Generate initial palette
    generatePalette();
    
    // Create canvas
    const cnv = p.createCanvas(canvas.width, canvas.height);
    cnv.parent('canvas-container');
    p.pixelDensity(1);
    
    // Set up UI
    setupUI({
      onParamChange: () => p.redraw(),
      onSettingsChange: () => {
        updateCanvasSize();
        updateWaveformCanvas();
        p.resizeCanvas(canvas.width, canvas.height);
        generatePalette();
        p.redraw();
      },
      onCanvasChange: () => {
        updateCanvasSize();
        updateWaveformCanvas();
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
    
    // Start loop if animation enabled
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
    
    // Calculate animation time
    if (animation.playing) {
      const frame = p.frameCount * animation.speed;
      currentTime = (frame % animation.loopDuration) / animation.loopDuration;
    }
    
    // Clear background
    p.background(canvas.background);
    
    // Draw waveforms
    drawWaveforms(p, currentTime);
    
    // Update frame counter
    animation.currentFrame = p.frameCount;
    
  };

  // --- Waveform Drawing ---
  function drawWaveforms(p, time) {
    const lines = getWaveformLines(time);
    
    // Set line style
    p.strokeCap(waveform.strokeCap === 'round' ? p.ROUND : p.SQUARE);
    p.noFill();
    
    lines.forEach((line, i) => {
      // Get color for this line
      const color = getLineColor(i, waveform.count, time);
      
      p.stroke(color);
      p.strokeWeight(waveform.strokeWeight);
      
      // Apply opacity
      const c = p.color(color);
      c.setAlpha(waveform.strokeOpacity * 255);
      p.stroke(c);
      
      // Draw line
      p.beginShape();
      line.points.forEach(pt => {
        p.vertex(pt.x, pt.y);
      });
      p.endShape();
    });
  }

  // --- Window Resize ---
  p.windowResized = () => {
    // Keep canvas size, just redraw
    p.redraw();
  };
};

// Initialize p5 instance
new p5(sketch, document.getElementById('canvas-container'));
