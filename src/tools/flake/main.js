// ============================================================
// Main Entry Point - FLAKE Tool
// ============================================================

import p5 from 'p5';
import {
  canvas, grid, shape, pattern, animation, customShape, mask,
} from './state.js';
import { updateCanvasSize, getAnimationTime } from './grid.js';
import { setupUI, refreshUI, setStatus } from './ui.js';
import {
  getGridCells, getShapeSize, getShapeRotation, getFillColor, getStrokeColor,
} from './grid.js';
import { drawShape } from './shapes/library.js';
import { drawSVGPath, loadSVGFile, parseSVG } from './shapes/svg.js';
import { exportComposition, getIsRecording } from './export.js';

// Global state
let isSetup = false;
let frameCount = 0;

const sketch = (p) => {
  // --- Setup ---
  p.setup = () => {
    // Calculate initial canvas size
    updateCanvasSize();
    
    // Create canvas
    const cnv = p.createCanvas(canvas.width, canvas.height);
    cnv.parent('canvas-container');
    p.pixelDensity(1);
    
    // Set up UI
    setupUI({
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
    
    // Set up drag and drop
    setupDragDrop(p);
    
    // Initial draw
    p.noLoop();
    isSetup = true;
  };

  // --- Draw Loop ---
  p.draw = () => {
    if (!isSetup) return;
    
    // Clear background
    p.background(canvas.background);
    
    // Calculate animation time
    const time = animation.enabled ? getAnimationTime(frameCount) : 0;
    
    // Draw grid if enabled
    if (canvas.showGrid) {
      drawGrid(p);
    }
    
    // Get all cells
    const cells = getGridCells();
    
    // Draw all shapes
    for (let i = 0; i < cells.length; i++) {
      drawCell(p, cells[i], i, time);
    }
    
    // Update animation frame
    if (animation.playing) {
      frameCount += animation.speed;
    }
    
  };

  // --- Cell Drawing ---
  function drawCell(p, cell, index, time) {
    const { x, y, dist } = cell;
    
    // Calculate animated properties
    let size = getShapeSize(dist, time);
    let rotation = getShapeRotation(dist, shape.rotation, time);
    
    // Apply additional animation
    if (animation.enabled && animation.playing) {
      if (animation.animateSize) {
        const noise = Math.sin(time * Math.PI * 2 + index * 0.1) * 0.5 + 0.5;
        size *= 0.7 + noise * 0.6;
      }
      if (animation.animateRotation) {
        rotation += time * 360 * animation.speed;
      }
      if (animation.animateColor) {
        // Color shifting handled in getFillColor
      }
    }
    
    // Get colors
    const fill = getFillColor(dist, index, time);
    const stroke = getStrokeColor(dist, index);
    
    // Apply blend mode
    const blendMode = shape.blendMode;
    if (blendMode !== 'blend' && p[blendMode.toUpperCase()]) {
      p.blendMode(p[blendMode.toUpperCase()]);
    }
    
    // Set fill
    const fillColor = p.color(fill);
    fillColor.setAlpha(shape.fillOpacity * 255);
    p.fill(fillColor);
    
    // Set stroke
    if (stroke && shape.strokeMode !== 'none') {
      const strokeColor = p.color(stroke);
      strokeColor.setAlpha(shape.strokeOpacity * 255);
      p.stroke(strokeColor);
      p.strokeWeight(shape.strokeWeight);
    } else {
      p.noStroke();
    }
    
    // Draw the shape
    if (shape.type === 'custom' && customShape.paths.length > 0) {
      // Draw custom SVG shape
      const path = customShape.paths[0];
      drawSVGPath(p, path, x, y, size, customShape.bounds, rotation);
    } else {
      drawShape(p, shape.type, x, y, size, rotation);
    }
    
    // Reset blend mode
    p.blendMode(p.BLEND);
  }

  // --- Grid Drawing ---
  function drawGrid(p) {
    p.stroke(canvas.gridColor);
    p.strokeWeight(1);
    p.noFill();
    
    // Draw cell grid
    for (let col = 0; col <= grid.cols; col++) {
      const x = col * grid.cellSize + grid.offsetX;
      p.line(x, grid.offsetY, x, grid.rows * grid.cellSize + grid.offsetY);
    }
    
    for (let row = 0; row <= grid.rows; row++) {
      const y = row * grid.cellSize + grid.offsetY;
      p.line(grid.offsetX, y, grid.cols * grid.cellSize + grid.offsetX, y);
    }
    
    // Draw center point
    const center = {
      x: (grid.cols * grid.cellSize) / 2 + grid.offsetX,
      y: (grid.rows * grid.cellSize) / 2 + grid.offsetY,
    };
    p.fill('#ff0000');
    p.noStroke();
    p.ellipse(center.x, center.y, 8, 8);
  }

  // --- Window Resize ---
  p.windowResized = () => {
    // Keep canvas size, just redraw
    p.redraw();
  };
};

// --- Drag and Drop Setup ---
function setupDragDrop(p) {
  const container = document.getElementById('canvas-container');
  const fileInput = document.getElementById('fileInput');
  const dropIndicator = container.querySelector('.drop-indicator');
  
  if (!container || !fileInput) return;
  
  // File input change handler
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFile(p, file);
    fileInput.value = '';
  });
  
  // Drag events
  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    container.classList.add('drag-over');
    if (dropIndicator) dropIndicator.classList.add('visible');
  });
  
  container.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    container.classList.remove('drag-over');
    if (dropIndicator) dropIndicator.classList.remove('visible');
  });
  
  container.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    container.classList.remove('drag-over');
    if (dropIndicator) dropIndicator.classList.remove('visible');
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(p, file);
  });
}

// --- File Handler ---
async function handleFile(p, file) {
  const type = file.type;
  const name = file.name.toLowerCase();
  
  try {
    if (type === 'image/svg+xml' || name.endsWith('.svg')) {
      // Load SVG shape
      setStatus('Loading SVG...');
      const data = await loadSVGFile(file);
      customShape.paths = data.paths;
      customShape.bounds = data.bounds;
      customShape.name = file.name;
      customShape.svgData = data;
      
      // Switch to custom shape
      shape.type = 'custom';
      refreshUI();
      
      // Trigger redraw
      const p5Instance = window._p5Instance;
      if (p5Instance) p5Instance.redraw();
      
      setStatus('SVG loaded!');
      setTimeout(() => setStatus('Ready'), 2000);
      
    } else if (type.startsWith('image/')) {
      // Load as mask
      setStatus('Loading image...');
      const img = await loadImage(p, file);
      mask.image = img;
      mask.enabled = true;
      
      const p5Instance = window._p5Instance;
      if (p5Instance) p5Instance.redraw();
      
      setStatus('Image loaded!');
      setTimeout(() => setStatus('Ready'), 2000);
    }
  } catch (err) {
    console.error('Failed to load file:', err);
    setStatus('Error loading file');
    setTimeout(() => setStatus('Ready'), 2000);
  }
}

// --- Image Loader ---
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

// Initialize p5 instance
new p5(sketch, document.getElementById('canvas-container'));
