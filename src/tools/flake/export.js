// ============================================================
// Export System - SVG, PNG, PNG Sequence, and VIDEO export
// ============================================================

import { canvas, animation, exportSettings, grid, shape, palette, customShape } from './state.js';
import { generateSVG } from './shapes/svg.js';
import { getGridCells, getShapeSize, getShapeRotation, getFillColor, getStrokeColor } from './grid.js';
import { drawShape } from './shapes/library.js';
import { drawSVGPath } from './shapes/svg.js';

// Video recording state
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
let recordStartFrame = 0;

/**
 * Export current composition
 * @param {p5} p - p5 instance
 * @param {number} frameCount - current frame count (for animation)
 * @returns {Promise<void>}
 */
export async function exportComposition(p, frameCount = 0) {
  const format = exportSettings.format;
  
  if (format === 'webm') {
    await exportWebM(p);
    return;
  }
  
  exportSettings.status = 'Exporting...';
  
  try {
    switch (format) {
      case 'png':
        await exportPNG(p);
        break;
      case 'svg':
        await exportSVG(p);
        break;
      case 'sequence':
        await exportSequence(p);
        break;
      default:
        await exportPNG(p);
    }
    exportSettings.status = 'Done!';
  } catch (err) {
    console.error('Export failed:', err);
    exportSettings.status = 'Error!';
  }
  
  setTimeout(() => {
    exportSettings.status = 'Ready';
  }, 2000);
}

/**
 * Export as PNG image
 * @param {p5} p - p5 instance
 */
async function exportPNG(p) {
  const scale = exportSettings.scale;
  const w = canvas.width * scale;
  const h = canvas.height * scale;
  
  // Create offscreen graphics
  const pg = p.createGraphics(w, h);
  pg.pixelDensity(1);
  
  // Draw background
  pg.background(canvas.background);
  
  // Draw grid at scaled size
  const cells = getGridCells();
  const time = animation.enabled ? 0 : 0;
  
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    drawCell(pg, cell, i, scale, time);
  }
  
  // Save
  pg.save(`flake-export-${Date.now()}.png`);
  pg.remove();
}

/**
 * Export as SVG
 * @param {p5} p - p5 instance
 */
async function exportSVG(p) {
  const cells = getGridCells();
  const shapes = [];
  
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const dist = cell.dist;
    
    const size = getShapeSize(dist, 0) * shape.size;
    const rotation = getShapeRotation(dist, shape.rotation, 0);
    const fill = getFillColor(dist, i, 0);
    const stroke = getStrokeColor(dist, i);
    
    shapes.push({
      type: shape.type,
      x: cell.x,
      y: cell.y,
      size: size,
      rotation: rotation,
      fill: fill,
      stroke: stroke,
      strokeWidth: shape.strokeMode !== 'none' ? shape.strokeWeight : 0,
      opacity: shape.fillOpacity,
    });
  }
  
  const svgString = generateSVG(shapes, {
    width: canvas.width,
    height: canvas.height,
    background: canvas.background,
  });
  
  // Download
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `flake-export-${Date.now()}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export PNG sequence for animation
 * @param {p5} p - p5 instance
 */
async function exportSequence(p) {
  if (!animation.enabled) {
    alert('Enable animation first to export a sequence');
    return;
  }
  
  const totalFrames = animation.loopDuration;
  const scale = exportSettings.scale;
  const w = canvas.width * scale;
  const h = canvas.height * scale;
  
  exportSettings.status = `Exporting 0/${totalFrames}...`;
  
  for (let frame = 0; frame < totalFrames; frame++) {
    const time = frame / totalFrames;
    
    // Create offscreen graphics
    const pg = p.createGraphics(w, h);
    pg.pixelDensity(1);
    pg.background(canvas.background);
    
    // Draw all cells
    const cells = getGridCells();
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      drawCell(pg, cell, i, scale, time);
    }
    
    // Save frame
    const frameNum = frame.toString().padStart(4, '0');
    pg.save(`flake-frame-${frameNum}.png`);
    pg.remove();
    
    // Update status
    exportSettings.status = `Exporting ${frame + 1}/${totalFrames}...`;
    
    // Small delay to prevent freezing
    await new Promise(r => setTimeout(r, 10));
  }
  
  exportSettings.status = 'Sequence complete!';
}

/**
 * Export WebM video using MediaRecorder API
 * @param {p5} p - p5 instance
 */
async function exportWebM(p) {
  if (isRecording) {
    stopRecording();
    return;
  }
  
  // Check for MediaRecorder support
  if (!MediaRecorder.isTypeSupported('video/webm')) {
    alert('WebM video recording is not supported in this browser. Try Chrome or Firefox.');
    return;
  }
  
  // Get canvas stream
  const stream = p.canvas.captureStream(30); // 30 fps
  
  // Create MediaRecorder
  mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: 5000000, // 5 Mbps
  });
  
  recordedChunks = [];
  
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };
  
  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flake-animation-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
    
    exportSettings.status = 'Video saved!';
    setTimeout(() => {
      exportSettings.status = 'Ready';
    }, 2000);
  };
  
  // Start recording
  mediaRecorder.start();
  isRecording = true;
  recordStartFrame = p.frameCount;
  
  exportSettings.status = 'Recording WebM... Click Export again to stop';
  
  // Ensure animation is playing
  if (!animation.playing) {
    animation.playing = true;
    p.loop();
  }
}

/**
 * Stop video recording
 */
export function stopRecording() {
  if (!isRecording || !mediaRecorder) return;
  
  isRecording = false;
  mediaRecorder.stop();
  mediaRecorder = null;
}

/**
 * Check if currently recording
 * @returns {boolean}
 */
export function getIsRecording() {
  return isRecording;
}

/**
 * Draw a single cell
 * @param {p5.Graphics} pg - graphics buffer
 * @param {Object} cell - cell data
 * @param {number} index - cell index
 * @param {number} scale - scale factor
 * @param {number} time - animation time
 */
function drawCell(pg, cell, index, scale, time) {
  const x = cell.x * scale;
  const y = cell.y * scale;
  const dist = cell.dist;
  
  // Apply animation
  let size = getShapeSize(dist, time) * scale;
  let rotation = getShapeRotation(dist, shape.rotation, time);
  
  if (animation.enabled) {
    if (animation.animateSize) {
      const noise = Math.sin(time * Math.PI * 2 + index * 0.1) * 0.5 + 0.5;
      size *= 0.7 + noise * 0.6;
    }
    if (animation.animateRotation) {
      rotation += time * 360;
    }
  }
  
  // Get colors
  const fill = getFillColor(dist, index, time);
  const stroke = getStrokeColor(dist, index);
  
  // Apply blend mode
  const blendMode = shape.blendMode;
  if (blendMode !== 'blend') {
    pg.blendMode(pg[blendMode.toUpperCase()] || pg.BLEND);
  }
  
  // Set styles
  const c = pg.color(fill);
  c.setAlpha(shape.fillOpacity * 255);
  pg.fill(c);
  
  if (stroke && shape.strokeMode !== 'none') {
    const s = pg.color(stroke);
    s.setAlpha(shape.strokeOpacity * 255);
    pg.stroke(s);
    pg.strokeWeight(shape.strokeWeight * scale);
  } else {
    pg.noStroke();
  }
  
  // Draw shape
  if (shape.type === 'custom' && customShape.paths.length > 0) {
    // Draw custom SVG
    const path = customShape.paths[0]; // Use first path
    drawSVGPath(pg, path, x, y, size, customShape.bounds, rotation);
  } else {
    drawShape(pg, shape.type, x, y, size, rotation);
  }
  
  // Reset blend mode
  pg.blendMode(pg.BLEND);
}
