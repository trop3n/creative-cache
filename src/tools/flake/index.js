// ============================================================
// Flake Tool Adapter for Creative Suite
// ============================================================

import p5 from 'p5';
import { canvas, grid, shape, pattern, animation, customShape, mask } from './state.js';
import { updateCanvasSize, getAnimationTime, getGridCells, getShapeSize, getShapeRotation, getFillColor, getStrokeColor } from './grid.js';
import { setupUI, refreshUI, setStatus } from './ui.js';
import { drawShape } from './shapes/library.js';
import { drawSVGPath, loadSVGFile, parseSVG } from './shapes/svg.js';
import { exportComposition, getIsRecording } from './export.js';

export async function loadFlakeTool(canvasContainer, paneContainer) {
  let p5Instance = null;
  let uiInstance = null;
  let frameCount = 0;
  let isSetup = false;

  const sketch = (p) => {
    p.setup = () => {
      updateCanvasSize();
      
      const cnv = p.createCanvas(canvas.width, canvas.height);
      cnv.parent(canvasContainer);
      p.pixelDensity(1);
      
      uiInstance = setupUI({
        onParamChange: () => p.redraw(),
        onGridChange: () => {
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
        onExport: () => exportComposition(p, frameCount),
      });
      
      setupDragDrop(p);
      
      p.noLoop();
      isSetup = true;
    };

    p.draw = () => {
      if (!isSetup) return;
      
      p.background(canvas.background);
      
      const time = animation.enabled ? getAnimationTime(frameCount) : 0;
      
      if (canvas.showGrid) {
        drawGrid(p);
      }
      
      const cells = getGridCells();
      
      for (let i = 0; i < cells.length; i++) {
        drawCell(p, cells[i], i, time);
      }
      
      if (animation.playing) {
        frameCount += animation.speed;
      }
    };

    p.windowResized = () => {
      p.redraw();
    };
  };

  function drawCell(p, cell, index, time) {
    const { x, y, dist } = cell;
    
    let size = getShapeSize(dist, time);
    let rotation = getShapeRotation(dist, shape.rotation, time);
    
    if (animation.enabled && animation.playing) {
      if (animation.animateSize) {
        const noise = Math.sin(time * Math.PI * 2 + index * 0.1) * 0.5 + 0.5;
        size *= 0.7 + noise * 0.6;
      }
      if (animation.animateRotation) {
        rotation += time * 360 * animation.speed;
      }
    }
    
    const fill = getFillColor(dist, index, time);
    const stroke = getStrokeColor(dist, index);
    
    const blendMode = shape.blendMode;
    if (blendMode !== 'blend' && p[blendMode.toUpperCase()]) {
      p.blendMode(p[blendMode.toUpperCase()]);
    }
    
    const fillColor = p.color(fill);
    fillColor.setAlpha(shape.fillOpacity * 255);
    p.fill(fillColor);
    
    if (stroke && shape.strokeMode !== 'none') {
      const strokeColor = p.color(stroke);
      strokeColor.setAlpha(shape.strokeOpacity * 255);
      p.stroke(strokeColor);
      p.strokeWeight(shape.strokeWeight);
    } else {
      p.noStroke();
    }
    
    if (shape.type === 'custom' && customShape.paths.length > 0) {
      const path = customShape.paths[0];
      drawSVGPath(p, path, x, y, size, customShape.bounds, rotation);
    } else {
      drawShape(p, shape.type, x, y, size, rotation);
    }
    
    p.blendMode(p.BLEND);
  }

  function drawGrid(p) {
    p.stroke(canvas.gridColor);
    p.strokeWeight(1);
    p.noFill();
    
    for (let col = 0; col <= grid.cols; col++) {
      const x = col * grid.cellSize + grid.offsetX;
      p.line(x, grid.offsetY, x, grid.rows * grid.cellSize + grid.offsetY);
    }
    
    for (let row = 0; row <= grid.rows; row++) {
      const y = row * grid.cellSize + grid.offsetY;
      p.line(grid.offsetX, y, grid.cols * grid.cellSize + grid.offsetX, y);
    }
    
    const center = {
      x: (grid.cols * grid.cellSize) / 2 + grid.offsetX,
      y: (grid.rows * grid.cellSize) / 2 + grid.offsetY,
    };
    p.fill('#ff0000');
    p.noStroke();
    p.ellipse(center.x, center.y, 8, 8);
  }

  function setupDragDrop(p) {
    const container = canvasContainer;
    const fileInput = document.getElementById('fileInput');
    
    if (!container || !fileInput) return;
    
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handleFile(p, file);
      fileInput.value = '';
    });
    
    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      container.classList.add('drag-over');
    });
    
    container.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      container.classList.remove('drag-over');
    });
    
    container.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      container.classList.remove('drag-over');
      
      const file = e.dataTransfer.files[0];
      if (file) handleFile(p, file);
    });
  }

  async function handleFile(p, file) {
    const type = file.type;
    const name = file.name.toLowerCase();
    
    try {
      if (type === 'image/svg+xml' || name.endsWith('.svg')) {
        setStatus('Loading SVG...');
        const data = await loadSVGFile(file);
        customShape.paths = data.paths;
        customShape.bounds = data.bounds;
        customShape.name = file.name;
        customShape.svgData = data;
        
        shape.type = 'custom';
        refreshUI();
        
        p.redraw();
        
        setStatus('SVG loaded!');
        setTimeout(() => setStatus('Ready'), 2000);
        
      } else if (type.startsWith('image/')) {
        setStatus('Loading image...');
        const img = await loadImage(p, file);
        mask.image = img;
        mask.enabled = true;
        
        p.redraw();
        
        setStatus('Image loaded!');
        setTimeout(() => setStatus('Ready'), 2000);
      }
    } catch (err) {
      console.error('Failed to load file:', err);
      setStatus('Error loading file');
      setTimeout(() => setStatus('Ready'), 2000);
    }
  }

  function loadImage(p, file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      p.loadImage(url, 
        (img) => {
          URL.revokeObjectURL(url);
          resolve(img);
        },
        () => {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to load image'));
        }
      );
    });
  }

  p5Instance = new p5(sketch, canvasContainer);

  return {
    p5Instance,
    uiInstance,
    handleFile: (file) => {
      handleFile(p5Instance, file);
    }
  };
}
