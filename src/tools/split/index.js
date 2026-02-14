// ============================================================
// Split Tool Adapter for Creative Suite
// ============================================================

import p5 from 'p5';
import paper from 'paper';

// State
const state = {
  canvas: { width: 800, height: 600, bgColor: '#0a0a0a' },
  shapes: [],
  selectedShape: null,
  transforms: {
    copies: 3,
    offsetX: 20,
    offsetY: 0,
    rotation: 0,
    scale: 1.0,
    opacity: 1.0
  },
  splits: [],
  currentFile: null
};

export async function loadSplitTool(canvasContainer, paneContainer) {
  let p5Instance = null;
  let paperProject = null;
  let uiInstance = null;

  const sketch = (p) => {
    p.setup = () => {
      const canvas = p.createCanvas(state.canvas.width, state.canvas.height);
      canvas.parent(canvasContainer);
      p.pixelDensity(1);

      // Initialize paper.js
      const canvasEl = canvas.elt;
      paper.setup(canvasEl);
      paperProject = paper.project;

      setupUI();
      setupDragDrop();

      p.background(state.canvas.bgColor);
    };

    p.draw = () => {
      // Paper.js handles its own rendering
    };

    function setupUI() {
      paneContainer.innerHTML = `
        <div style="padding: 20px; color: #e0e0e0;">
          <h2 style="font-size: 16px; margin-bottom: 16px; font-weight: 600;">SPLITX</h2>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-size: 12px; color: #a0a0a0; margin-bottom: 8px;">Copies</label>
            <input type="range" id="split-copies" min="1" max="20" value="3" style="width: 100%;">
            <span id="split-copies-val" style="font-size: 11px; color: #606060;">3</span>
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-size: 12px; color: #a0a0a0; margin-bottom: 8px;">Offset X</label>
            <input type="range" id="split-offsetX" min="-100" max="100" value="20" style="width: 100%;">
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-size: 12px; color: #a0a0a0; margin-bottom: 8px;">Offset Y</label>
            <input type="range" id="split-offsetY" min="-100" max="100" value="0" style="width: 100%;">
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-size: 12px; color: #a0a0a0; margin-bottom: 8px;">Rotation</label>
            <input type="range" id="split-rotation" min="0" max="360" value="0" style="width: 100%;">
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-size: 12px; color: #a0a0a0; margin-bottom: 8px;">Scale</label>
            <input type="range" id="split-scale" min="0.1" max="2" step="0.1" value="1" style="width: 100%;">
          </div>
          
          <div style="display: flex; gap: 8px; margin-top: 24px;">
            <button id="split-clear" style="flex: 1; padding: 10px; background: #2a2a2a; border: none; color: #e0e0e0; border-radius: 4px; cursor: pointer;">Clear</button>
            <button id="split-export" style="flex: 1; padding: 10px; background: #4a9eff; border: none; color: white; border-radius: 4px; cursor: pointer;">Export SVG</button>
          </div>
          
          <div style="margin-top: 20px; padding: 12px; background: #1a1a1a; border-radius: 4px; font-size: 11px; color: #606060;">
            Drop SVG files to load shapes
          </div>
        </div>
      `;

      // Add event listeners
      const bindSlider = (id, key) => {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener('input', (e) => {
            state.transforms[key] = parseFloat(e.target.value);
            document.getElementById(id + '-val') && (document.getElementById(id + '-val').textContent = e.target.value);
            render();
          });
        }
      };

      bindSlider('split-copies', 'copies');
      bindSlider('split-offsetX', 'offsetX');
      bindSlider('split-offsetY', 'offsetY');
      bindSlider('split-rotation', 'rotation');
      bindSlider('split-scale', 'scale');

      document.getElementById('split-clear')?.addEventListener('click', () => {
        state.shapes = [];
        state.splits = [];
        paperProject.clear();
        p.background(state.canvas.bgColor);
      });

      document.getElementById('split-export')?.addEventListener('click', () => {
        const svg = paperProject.exportSVG({ asString: true });
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'splitx-export.svg';
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    function setupDragDrop() {
      const container = canvasContainer;
      
      container.addEventListener('dragover', (e) => {
        e.preventDefault();
        container.classList.add('drag-over');
      });
      
      container.addEventListener('dragleave', () => {
        container.classList.remove('drag-over');
      });
      
      container.addEventListener('drop', async (e) => {
        e.preventDefault();
        container.classList.remove('drag-over');
        
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.svg')) {
          await loadSVG(file);
        }
      });
    }

    async function loadSVG(file) {
      const text = await file.text();
      paperProject.clear();
      
      paper.importSVG(text, {
        expandShapes: true,
        onLoad: (item) => {
          state.shapes = [item];
          item.position = paper.view.center;
          render();
        }
      });
    }

    function render() {
      if (state.shapes.length === 0) return;
      
      paperProject.clear();
      
      const { copies, offsetX, offsetY, rotation, scale } = state.transforms;
      
      for (let i = 0; i < copies; i++) {
        state.shapes.forEach(shape => {
          const copy = shape.clone();
          copy.position = paper.view.center;
          copy.position.x += offsetX * i;
          copy.position.y += offsetY * i;
          copy.rotation = rotation * i;
          copy.scale(Math.pow(scale, i));
        });
      }
      
      paper.view.update();
    }
  };

  p5Instance = new p5(sketch, canvasContainer);

  return {
    p5Instance,
    uiInstance,
    handleFile: async (file) => {
      if (file.name.endsWith('.svg')) {
        const text = await file.text();
        paperProject.clear();
        paper.importSVG(text, {
          expandShapes: true,
          onLoad: (item) => {
            state.shapes = [item];
            item.position = paper.view.center;
          }
        });
      }
    }
  };
}
