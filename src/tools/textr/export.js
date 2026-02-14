// ============================================================
// Export Functions - TEXTR Tool
// Supports PNG, JPG, SVG, MP4, WebM, and image sequences
// ============================================================

import { canvas, exportSettings, animState } from './state.js';

let isRecording = false;
let mediaRecorder = null;
let recordedChunks = [];

export function exportComposition(p, paper, animState) {
  const format = exportSettings.format;
  
  // Update status
  setExportStatus('Exporting...');
  
  switch (format) {
    case 'PNG':
    case 'JPG':
      exportImage(p, format);
      break;
    case 'SVG':
      exportSVG(paper);
      break;
    case 'MP4':
    case 'WebM':
      exportVideo(p, format.toLowerCase());
      break;
    case 'PNGSequence':
      exportSequence(p, 'png');
      break;
    case 'WebPSequence':
      exportSequence(p, 'webp');
      break;
    default:
      exportImage(p, 'PNG');
  }
}

function exportImage(p, format) {
  const scale = exportSettings.scale;
  
  if (scale === 1) {
    // Simple export at current resolution
    p.saveCanvas(`txtr-export.${format.toLowerCase()}`, format.toLowerCase());
    setExportStatus('Exported!');
    setTimeout(() => setExportStatus('Ready'), 2000);
    return;
  }
  
  // High-resolution export
  const originalWidth = p.width;
  const originalHeight = p.height;
  const expWidth = Math.floor(originalWidth * scale);
  const expHeight = Math.floor(originalHeight * scale);
  
  // Create high-res canvas
  const expCanvas = document.createElement('canvas');
  expCanvas.width = expWidth;
  expCanvas.height = expHeight;
  const expCtx = expCanvas.getContext('2d');
  
  // Scale and draw
  expCtx.scale(scale, scale);
  expCtx.drawImage(p.canvas, 0, 0);
  
  // Export
  const mimeType = format === 'JPG' ? 'image/jpeg' : 'image/png';
  const quality = format === 'JPG' ? exportSettings.quality : undefined;
  
  expCanvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `txtr-export.${format.toLowerCase()}`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    
    setExportStatus('Exported!');
    setTimeout(() => setExportStatus('Ready'), 2000);
  }, mimeType, quality);
}

function exportSVG(paper) {
  if (!paper.project) {
    setExportStatus('No SVG to export');
    setTimeout(() => setExportStatus('Ready'), 2000);
    return;
  }
  
  // Export SVG from Paper.js
  const svg = paper.project.exportSVG({ asString: true });
  
  // Add viewBox and dimensions
  const svgWithDims = svg.replace(
    '<svg',
    `<svg width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}"`
  );
  
  const blob = new Blob([svgWithDims], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = 'txtr-export.svg';
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
  
  setExportStatus('SVG exported!');
  setTimeout(() => setExportStatus('Ready'), 2000);
}

async function exportVideo(p, format) {
  if (isRecording) {
    setExportStatus('Already recording');
    return;
  }
  
  const fps = exportSettings.fps;
  const duration = exportSettings.duration;
  const totalFrames = fps * duration;
  
  // Set up MediaRecorder
  const canvas = p.canvas;
  const stream = canvas.captureStream(fps);
  
  // Determine MIME type
  let mimeType = 'video/webm;codecs=vp9';
  if (format === 'mp4') {
    // MP4 may not be supported in all browsers
    if (MediaRecorder.isTypeSupported('video/mp4')) {
      mimeType = 'video/mp4';
    } else {
      // Fall back to WebM, user can convert later
      mimeType = 'video/webm;codecs=vp9';
      format = 'webm';
    }
  }
  
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    setExportStatus('Video format not supported');
    setTimeout(() => setExportStatus('Ready'), 3000);
    return;
  }
  
  mediaRecorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 5000000, // 5 Mbps
  });
  
  recordedChunks = [];
  
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };
  
  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `txtr-export.${format}`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    
    isRecording = false;
    setExportStatus('Video exported!');
    setTimeout(() => setExportStatus('Ready'), 3000);
  };
  
  // Start recording
  isRecording = true;
  mediaRecorder.start();
  setExportStatus('Recording...');
  
  // Stop after duration
  setTimeout(() => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  }, duration * 1000);
}

async function exportSequence(p, format) {
  const fps = exportSettings.fps;
  const duration = exportSettings.duration;
  const totalFrames = fps * duration;
  
  setExportStatus(`Exporting ${totalFrames} frames...`);
  
  // Create a ZIP file containing all frames
  const JSZip = await loadJSZip();
  const zip = new JSZip();
  const framesFolder = zip.folder('frames');
  
  // Store original animation state
  const originalTime = animState.time;
  const originalFrameCount = animState.frameCount;
  
  // Pause animation during export
  const wasPlaying = p.isLooping();
  p.noLoop();
  
  // Export each frame
  for (let i = 0; i < totalFrames; i++) {
    // Update animation time
    animState.time = (i / fps) * 0.5; // Adjust speed as needed
    animState.frameCount = i;
    
    // Redraw
    p.redraw();
    
    // Capture frame
    const mimeType = format === 'webp' ? 'image/webp' : 'image/png';
    const dataUrl = p.canvas.toDataURL(mimeType, exportSettings.quality);
    const base64Data = dataUrl.split(',')[1];
    
    // Add to ZIP
    const frameNum = String(i).padStart(4, '0');
    framesFolder.file(`frame-${frameNum}.${format}`, base64Data, { base64: true });
    
    // Update status
    if (i % 10 === 0) {
      setExportStatus(`Exporting... ${Math.round((i / totalFrames) * 100)}%`);
    }
    
    // Allow UI to update
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  // Restore animation state
  animState.time = originalTime;
  animState.frameCount = originalFrameCount;
  
  if (wasPlaying) {
    p.loop();
  }
  
  // Generate and download ZIP
  setExportStatus('Compressing...');
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.download = 'txtr-frames.zip';
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
  
  setExportStatus('Frames exported!');
  setTimeout(() => setExportStatus('Ready'), 3000);
}

// Load JSZip library dynamically
function loadJSZip() {
  return new Promise((resolve, reject) => {
    if (window.JSZip) {
      resolve(window.JSZip);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.onload = () => resolve(window.JSZip);
    script.onerror = () => reject(new Error('Failed to load JSZip'));
    document.head.appendChild(script);
  });
}

// Update export status - delegates to UI module
import { setStatus } from './ui.js';

function setExportStatus(status) {
  setStatus(status);
}
