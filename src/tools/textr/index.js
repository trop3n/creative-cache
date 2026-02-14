// ============================================================
// Textr Tool Adapter for Creative Suite
// ============================================================

import p5 from 'p5';
import paper from 'paper';

const state = {
  text: 'TEXTR',
  font: null,
  fontName: 'Inter',
  fontSize: 120,
  letterSpacing: 0,
  lineHeight: 1.2,
  fillColor: '#4a9eff',
  strokeColor: '#ffffff',
  strokeWidth: 0,
  background: '#0a0a0a',
  canvas: { width: 800, height: 400 }
};

export async function loadTextrTool(canvasContainer, paneContainer) {
  let p5Instance = null;
  let paperProject = null;

  const sketch = (p) => {
    p.setup = () => {
      const canvas = p.createCanvas(state.canvas.width, state.canvas.height);
      canvas.parent(canvasContainer);
      p.pixelDensity(1);

      const canvasEl = canvas.elt;
      paper.setup(canvasEl);
      paperProject = paper.project;

      setupUI();
      render();
    };

    function setupUI() {
      paneContainer.innerHTML = `
        <div style="padding: 20px; color: #e0e0e0;">
          <h2 style="font-size: 16px; margin-bottom: 16px; font-weight: 600;">TEXTR</h2>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-size: 12px; color: #a0a0a0; margin-bottom: 8px;">Text</label>
            <input type="text" id="textr-text" value="TEXTR" style="width: 100%; padding: 8px; background: #1a1a1a; border: 1px solid #333; color: #e0e0e0; border-radius: 4px;">
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-size: 12px; color: #a0a0a0; margin-bottom: 8px;">Font Size</label>
            <input type="range" id="textr-size" min="20" max="300" value="120" style="width: 100%;">
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-size: 12px; color: #a0a0a0; margin-bottom: 8px;">Letter Spacing</label>
            <input type="range" id="textr-spacing" min="-20" max="50" value="0" style="width: 100%;">
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-size: 12px; color: #a0a0a0; margin-bottom: 8px;">Fill Color</label>
            <input type="color" id="textr-fill" value="#4a9eff" style="width: 100%; height: 36px; border: none; border-radius: 4px; cursor: pointer;">
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-size: 12px; color: #a0a0a0; margin-bottom: 8px;">Stroke Color</label>
            <input type="color" id="textr-stroke" value="#ffffff" style="width: 100%; height: 36px; border: none; border-radius: 4px; cursor: pointer;">
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-size: 12px; color: #a0a0a0; margin-bottom: 8px;">Stroke Width</label>
            <input type="range" id="textr-strokeW" min="0" max="20" value="0" style="width: 100%;">
          </div>
          
          <div style="display: flex; gap: 8px; margin-top: 24px;">
            <button id="textr-clear" style="flex: 1; padding: 10px; background: #2a2a2a; border: none; color: #e0e0e0; border-radius: 4px; cursor: pointer;">Clear</button>
            <button id="textr-export" style="flex: 1; padding: 10px; background: #4a9eff; border: none; color: white; border-radius: 4px; cursor: pointer;">Export SVG</button>
          </div>
        </div>
      `;

      document.getElementById('textr-text')?.addEventListener('input', (e) => {
        state.text = e.target.value;
        render();
      });

      document.getElementById('textr-size')?.addEventListener('input', (e) => {
        state.fontSize = parseInt(e.target.value);
        render();
      });

      document.getElementById('textr-spacing')?.addEventListener('input', (e) => {
        state.letterSpacing = parseInt(e.target.value);
        render();
      });

      document.getElementById('textr-fill')?.addEventListener('input', (e) => {
        state.fillColor = e.target.value;
        render();
      });

      document.getElementById('textr-stroke')?.addEventListener('input', (e) => {
        state.strokeColor = e.target.value;
        render();
      });

      document.getElementById('textr-strokeW')?.addEventListener('input', (e) => {
        state.strokeWidth = parseInt(e.target.value);
        render();
      });

      document.getElementById('textr-clear')?.addEventListener('click', () => {
        paperProject.clear();
        p.background(state.background);
      });

      document.getElementById('textr-export')?.addEventListener('click', () => {
        const svg = paperProject.exportSVG({ asString: true });
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'textr-export.svg';
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    function render() {
      paperProject.clear();
      p.background(state.background);

      if (!state.text) return;

      const textItem = new paper.PointText({
        point: paper.view.center,
        content: state.text,
        justification: 'center',
        fontFamily: state.fontName,
        fontSize: state.fontSize,
        fillColor: state.fillColor,
        strokeColor: state.strokeWidth > 0 ? state.strokeColor : null,
        strokeWidth: state.strokeWidth
      });

      // Apply letter spacing
      if (state.letterSpacing !== 0) {
        const children = textItem.children;
        if (children) {
          for (let i = 1; i < children.length; i++) {
            children[i].position.x += state.letterSpacing * i;
          }
        }
      }

      paper.view.update();
    }
  };

  p5Instance = new p5(sketch, canvasContainer);

  return {
    p5Instance,
    handleFile: async (file) => {
      // Handle font file uploads
      if (file.name.match(/\.(ttf|otf|woff|woff2)$/i)) {
        const url = URL.createObjectURL(file);
        const fontFace = new FontFace('custom-font', `url(${url})`);
        await fontFace.load();
        document.fonts.add(fontFace);
        state.fontName = 'custom-font';
        p5Instance.redraw();
      }
    }
  };
}
