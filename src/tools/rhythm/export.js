// ============================================================
// Export System - PNG, SVG, PNG Sequence, and VIDEO export
// ============================================================

import { canvas, waveform, colorPalette, animation, exportSettings } from './state.js';
import { getWaveformLines, pointsToSVGPath } from './waveform.js';
import { getLineColor } from './state.js';

// Video recording state
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;

/**
 * Export current composition
 * @param {p5} p - p5 instance
 * @param {number} currentTime - current animation time
 */
export async function exportComposition(p, currentTime = 0) {
  const format = exportSettings.format;
  
  if (format === 'webm') {
    await exportWebM(p);
    return;
  }
  
  setStatus('Exporting...');
  
  try {
    switch (format) {
      case 'png':
        await exportPNG(p, currentTime);
        break;
      case 'svg':
        await exportSVG(currentTime);
        break;
      case 'sequence':
        await exportSequence(p);
        break;
      default:
        await exportPNG(p, currentTime);
    }
    setStatus('Done!');
  } catch (err) {
    console.error('Export failed:', err);
    setStatus('Error!');
  }
  
  setTimeout(() => setStatus('Ready'), 2000);
}

/**
 * Export as PNG image
 * @param {p5} p - p5 instance
 * @param {number} time - animation time
 */
async function exportPNG(p, time) {
  const scale = exportSettings.scale;
  const w = canvas.width * scale;
  const h = canvas.height * scale;
  
  // Create offscreen graphics
  const pg = p.createGraphics(w, h);
  pg.pixelDensity(1);
  
  // Draw background
  pg.background(canvas.background);
  
  // Draw waveforms at scaled size
  drawWaveforms(pg, time, scale);
  
  // Save
  pg.save(`ritm-export-${Date.now()}.png`);
  pg.remove();
}

/**
 * Export as SVG
 * @param {number} time - animation time
 */
async function exportSVG(time) {
  const lines = getWaveformLines(time);
  const colors = colorPalette.colors.length > 0 ? colorPalette.colors : generateColors();
  
  let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  svg += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas.width} ${canvas.height}" width="${canvas.width}" height="${canvas.height}">\n`;
  
  // Background
  svg += `  <rect width="${canvas.width}" height="${canvas.height}" fill="${canvas.background}"/>\n`;
  
  // Lines
  lines.forEach((line, i) => {
    const color = colors[i % colors.length];
    const d = pointsToSVGPath(line.points);
    const strokeWidth = waveform.strokeWeight;
    const opacity = waveform.strokeOpacity;
    
    svg += `  <path d="${d}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" opacity="${opacity}"/>\n`;
  });
  
  svg += `</svg>`;
  
  // Download
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ritm-export-${Date.now()}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export PNG sequence
 * @param {p5} p - p5 instance
 */
async function exportSequence(p) {
  const totalFrames = animation.loopDuration;
  const scale = exportSettings.scale;
  const w = canvas.width * scale;
  const h = canvas.height * scale;
  
  setStatus(`Exporting 0/${totalFrames}...`);
  
  for (let frame = 0; frame < totalFrames; frame++) {
    const time = frame / totalFrames;
    
    // Create offscreen graphics
    const pg = p.createGraphics(w, h);
    pg.pixelDensity(1);
    pg.background(canvas.background);
    
    // Draw waveforms
    drawWaveforms(pg, time, scale);
    
    // Save frame
    const frameNum = frame.toString().padStart(4, '0');
    pg.save(`ritm-frame-${frameNum}.png`);
    pg.remove();
    
    // Update status
    setStatus(`Exporting ${frame + 1}/${totalFrames}...`);
    
    // Small delay to prevent freezing
    await new Promise(r => setTimeout(r, 10));
  }
  
  setStatus('Sequence complete!');
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
    a.download = `ritm-animation-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
    
    setStatus('Video saved!');
    setTimeout(() => setStatus('Ready'), 2000);
  };
  
  // Start recording
  mediaRecorder.start();
  isRecording = true;
  
  setStatus('Recording WebM... Click Export again to stop');
  
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
 * Draw waveforms to a graphics buffer
 * @param {p5.Graphics} pg - graphics buffer
 * @param {number} time - animation time
 * @param {number} scale - scale factor
 */
function drawWaveforms(pg, time, scale = 1) {
  const lines = getWaveformLines(time);
  
  pg.push();
  pg.scale(scale);
  
  // Set line style
  pg.strokeCap(waveform.strokeCap === 'round' ? pg.ROUND : pg.SQUARE);
  
  lines.forEach((line, i) => {
    // Get color for this line
    const color = getLineColor(i, waveform.count, time);
    
    pg.stroke(color);
    pg.strokeWeight(waveform.strokeWeight);
    
    const c = pg.color(color);
    c.setAlpha(waveform.strokeOpacity * 255);
    pg.stroke(c);
    
    // Draw line
    pg.noFill();
    pg.beginShape();
    line.points.forEach(pt => {
      pg.vertex(pt.x, pt.y);
    });
    pg.endShape();
  });
  
  pg.pop();
}

/**
 * Generate colors if palette is empty
 * @returns {Array}
 */
function generateColors() {
  const colors = [];
  const count = waveform.count;
  const { hueStart, hueRange, saturation, lightness } = colorPalette;
  
  for (let i = 0; i < count; i++) {
    const t = i / Math.max(count - 1, 1);
    const hue = (hueStart + t * hueRange) % 360;
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }
  
  return colors;
}

/**
 * Set export status
 * @param {string} status 
 */
function setStatus(status) {
  exportSettings.status = status;
}
