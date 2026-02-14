// ============================================================
// Rhythm Tool Adapter for Creative Suite
// ============================================================

import p5 from 'p5';

const state = {
  bpm: 120,
  steps: 16,
  currentStep: 0,
  isPlaying: false,
  lastStepTime: 0,
  tracks: [
    { name: 'Kick', active: true, steps: Array(16).fill(false) },
    { name: 'Snare', active: true, steps: Array(16).fill(false) },
    { name: 'HiHat', active: true, steps: Array(16).fill(false) },
    { name: 'OpenHat', active: true, steps: Array(16).fill(false) }
  ],
  colors: {
    bg: '#0a0a0a',
    grid: '#1a1a1a',
    step: '#333',
    stepActive: '#4a9eff',
    stepCurrent: '#6b5ce7',
    track: '#e0e0e0'
  }
};

export async function loadRhythmTool(canvasContainer, paneContainer) {
  let p5Instance = null;
  let animationId = null;

  const sketch = (p) => {
    const cellSize = 32;
    const padding = 60;

    p.setup = () => {
      const width = state.steps * cellSize + padding * 2;
      const height = state.tracks.length * cellSize + padding * 2;
      
      const canvas = p.createCanvas(width, height);
      canvas.parent(canvasContainer);
      p.pixelDensity(1);

      setupUI();
      
      // Set default pattern
      state.tracks[0].steps[0] = true;
      state.tracks[0].steps[4] = true;
      state.tracks[0].steps[8] = true;
      state.tracks[0].steps[12] = true;
      state.tracks[1].steps[4] = true;
      state.tracks[1].steps[12] = true;
      state.tracks[2].steps = Array(16).fill(true);
      
      p.noLoop();
    };

    p.draw = () => {
      p.background(state.colors.bg);

      const startX = padding;
      const startY = padding;

      // Draw grid
      for (let t = 0; t < state.tracks.length; t++) {
        const track = state.tracks[t];
        const y = startY + t * cellSize;

        // Track label
        p.fill(state.colors.track);
        p.noStroke();
        p.textAlign(p.RIGHT, p.CENTER);
        p.textSize(12);
        p.text(track.name, startX - 10, y + cellSize / 2);

        // Steps
        for (let s = 0; s < state.steps; s++) {
          const x = startX + s * cellSize;
          const isCurrent = s === state.currentStep;
          const isActive = track.steps[s];

          if (isCurrent && isActive) {
            p.fill(state.colors.stepCurrent);
          } else if (isCurrent) {
            p.fill(state.colors.stepActive);
          } else if (isActive) {
            p.fill(state.colors.stepActive);
          } else {
            p.fill(state.colors.step);
          }

          p.rect(x + 2, y + 2, cellSize - 4, cellSize - 4, 4);
        }
      }

      // Draw beat numbers
      p.fill(state.colors.track);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(10);
      for (let s = 0; s < state.steps; s++) {
        const x = startX + s * cellSize + cellSize / 2;
        p.text(s + 1, x, startY - 20);
      }

      // Update sequencer
      if (state.isPlaying) {
        const now = p.millis();
        const stepDuration = 60000 / state.bpm / 4; // 16th notes

        if (now - state.lastStepTime >= stepDuration) {
          state.currentStep = (state.currentStep + 1) % state.steps;
          state.lastStepTime = now;
        }
      }
    };

    p.mousePressed = () => {
      const startX = padding;
      const startY = padding;

      for (let t = 0; t < state.tracks.length; t++) {
        const y = startY + t * cellSize;
        for (let s = 0; s < state.steps; s++) {
          const x = startX + s * cellSize;
          
          if (p.mouseX > x && p.mouseX < x + cellSize &&
              p.mouseY > y && p.mouseY < y + cellSize) {
            state.tracks[t].steps[s] = !state.tracks[t].steps[s];
            p.redraw();
            return;
          }
        }
      }
    };

    function setupUI() {
      paneContainer.innerHTML = `
        <div style="padding: 20px; color: #e0e0e0;">
          <h2 style="font-size: 16px; margin-bottom: 16px; font-weight: 600;">RITM</h2>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-size: 12px; color: #a0a0a0; margin-bottom: 8px;">BPM: <span id="rhythm-bpm-val">120</span></label>
            <input type="range" id="rhythm-bpm" min="60" max="200" value="120" style="width: 100%;">
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-size: 12px; color: #a0a0a0; margin-bottom: 8px;">Steps</label>
            <select id="rhythm-steps" style="width: 100%; padding: 8px; background: #1a1a1a; border: 1px solid #333; color: #e0e0e0; border-radius: 4px;">
              <option value="8">8</option>
              <option value="16" selected>16</option>
              <option value="32">32</option>
            </select>
          </div>
          
          <div style="display: flex; gap: 8px; margin-top: 24px;">
            <button id="rhythm-play" style="flex: 1; padding: 10px; background: #4a9eff; border: none; color: white; border-radius: 4px; cursor: pointer;">▶ Play</button>
            <button id="rhythm-stop" style="flex: 1; padding: 10px; background: #2a2a2a; border: none; color: #e0e0e0; border-radius: 4px; cursor: pointer;">⏹ Stop</button>
          </div>
          
          <div style="display: flex; gap: 8px; margin-top: 8px;">
            <button id="rhythm-clear" style="flex: 1; padding: 10px; background: #2a2a2a; border: none; color: #e0e0e0; border-radius: 4px; cursor: pointer;">Clear</button>
            <button id="rhythm-random" style="flex: 1; padding: 10px; background: #2a2a2a; border: none; color: #e0e0e0; border-radius: 4px; cursor: pointer;">Random</button>
          </div>
          
          <div style="margin-top: 20px; padding: 12px; background: #1a1a1a; border-radius: 4px; font-size: 11px; color: #606060;">
            Click grid cells to toggle beats
          </div>
        </div>
      `;

      document.getElementById('rhythm-bpm')?.addEventListener('input', (e) => {
        state.bpm = parseInt(e.target.value);
        document.getElementById('rhythm-bpm-val').textContent = state.bpm;
      });

      document.getElementById('rhythm-steps')?.addEventListener('change', (e) => {
        const newSteps = parseInt(e.target.value);
        state.steps = newSteps;
        state.tracks.forEach(track => {
          track.steps = Array(newSteps).fill(false);
        });
        state.currentStep = 0;
        p.resizeCanvas(newSteps * cellSize + padding * 2, state.tracks.length * cellSize + padding * 2);
        p.redraw();
      });

      document.getElementById('rhythm-play')?.addEventListener('click', () => {
        state.isPlaying = true;
        state.lastStepTime = p.millis();
        p.loop();
      });

      document.getElementById('rhythm-stop')?.addEventListener('click', () => {
        state.isPlaying = false;
        state.currentStep = 0;
        p.noLoop();
        p.redraw();
      });

      document.getElementById('rhythm-clear')?.addEventListener('click', () => {
        state.tracks.forEach(track => {
          track.steps.fill(false);
        });
        p.redraw();
      });

      document.getElementById('rhythm-random')?.addEventListener('click', () => {
        state.tracks.forEach(track => {
          track.steps = track.steps.map(() => Math.random() > 0.7);
        });
        p.redraw();
      });
    }
  };

  p5Instance = new p5(sketch, canvasContainer);

  return {
    p5Instance,
    handleFile: () => {
      // Rhythm generator doesn't handle file uploads
    }
  };
}
