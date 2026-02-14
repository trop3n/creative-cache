import p5 from 'p5';
import paper from 'paper';
import {
  canvas, shape, duplication, transform, animation, split, color, interactive,
  animState, exportSettings, customSvg, calculateCanvasSize
} from './state.js';
import { setupUI, refreshUI, setStatus } from './ui.js';
import { setupMedia } from './media.js';
import { createNoise3D } from 'simplex-noise';

// ============================================================
// SPLITX Main Application
// ============================================================

const noise3D = createNoise3D();

let isSetup = false;
let needsResize = true;
let isRecording = false;
let mediaRecorder = null;
let recordedChunks = [];

// Setup media handlers
const mediaHandlers = setupMedia({
  onSvgLoaded: () => {
    refreshUI();
    if (window.p5Instance) window.p5Instance.redraw();
  },
  onPresetLoaded: () => {
    refreshUI();
    needsResize = true;
    if (window.p5Instance) window.p5Instance.redraw();
  },
  onSuccess: (msg) => setStatus(msg),
  onError: (msg) => setStatus('Error: ' + msg),
});

// p5.js sketch
const sketch = (p) => {
  p.setup = () => {
    calculateCanvasSize();
    
    const cnv = p.createCanvas(canvas.width, canvas.height);
    cnv.parent('canvas-container');
    p.pixelDensity(1);
    
    // Initialize Paper.js
    paper.setup(p.canvas);
    
    // Setup UI
    setupUI(p, mediaHandlers, {
      onParamChange: () => p.redraw(),
      onResize: () => { needsResize = true; },
      onAnimationChange: (enabled) => {
        if (enabled) p.loop();
        else p.noLoop();
      },
      onExport: () => handleExport(p),
    });
    
    isSetup = true;
    
    if (animation.enabled) {
      p.loop();
    } else {
      p.noLoop();
    }
  };
  
  p.draw = () => {
    if (!isSetup) return;
    
    if (needsResize) {
      handleResize(p);
      needsResize = false;
    }
    
    // Update animation time
    if (animation.enabled) {
      animState.time += animation.speed * 0.016;
      animState.frameCount++;
    }
    
    // Clear background
    p.background(canvas.background);
    
    // Clear Paper.js and regenerate
    paper.project.clear();
    generateComposition();
    paper.view.update();
    
    // Handle recording
    if (isRecording && mediaRecorder && mediaRecorder.state === 'recording') {
      // Recording happens automatically via canvas.captureStream
    }
  };
  
  p.windowResized = () => {
    needsResize = true;
  };
};

function handleResize(p) {
  calculateCanvasSize();
  p.resizeCanvas(canvas.width, canvas.height);
  paper.view.viewSize = new paper.Size(canvas.width, canvas.height);
}

window.p5Instance = new p5(sketch);

// ============================================================
// Composition Generation
// ============================================================

function generateComposition() {
  if (!paper.project) return;
  
  // Create split groups
  const sections = getSplitSections();
  
  sections.forEach((section, index) => {
    generateShapesForSection(section);
  });
}

function getSplitSections() {
  const w = canvas.width;
  const h = canvas.height;
  const gap = split.gap;
  
  switch (split.mode) {
    case 'horizontal':
      return [
        { x: 0, y: 0, width: w, height: (h - gap) / 2, mirrorY: false },
        { x: 0, y: (h + gap) / 2, width: w, height: (h - gap) / 2, mirrorY: true },
      ];
    case 'vertical':
      return [
        { x: 0, y: 0, width: (w - gap) / 2, height: h, mirrorX: false },
        { x: (w + gap) / 2, y: 0, width: (w - gap) / 2, height: h, mirrorX: true },
      ];
    case 'four':
      const halfW = (w - gap) / 2;
      const halfH = (h - gap) / 2;
      return [
        { x: 0, y: 0, width: halfW, height: halfH, mirrorX: false, mirrorY: false },
        { x: halfW + gap, y: 0, width: halfW, height: halfH, mirrorX: true, mirrorY: false },
        { x: 0, y: halfH + gap, width: halfW, height: halfH, mirrorX: false, mirrorY: true },
        { x: halfW + gap, y: halfH + gap, width: halfW, height: halfH, mirrorX: true, mirrorY: true },
      ];
    default:
      return [{ x: 0, y: 0, width: w, height: h, mirrorX: false, mirrorY: false }];
  }
}

function generateShapesForSection(section) {
  const centerX = section.x + section.width / 2;
  const centerY = section.y + section.height / 2;
  const offsetPosX = centerX + interactive.posX;
  const offsetPosY = centerY + interactive.posY;
  
  const group = new paper.Group();
  
  for (let i = 0; i < duplication.count; i++) {
    const t = i / (duplication.count - 1 || 1);
    
    // Calculate animation offsets
    let animOffsetX = 0, animOffsetY = 0, animScale = 1, animRotation = 0;
    
    if (animation.enabled) {
      const time = animState.time;
      const freq = animation.frequency;
      const amp = animation.amplitude;
      
      switch (animation.mode) {
        case 'noise':
          animOffsetX = noise3D(i * animation.noiseScale, time * 0.5, animState.seed) * amp;
          animOffsetY = noise3D(i * animation.noiseScale + 100, time * 0.5, animState.seed) * amp;
          animScale = 1 + noise3D(i * animation.noiseScale + 200, time * 0.3, animState.seed) * 0.3;
          animRotation = noise3D(i * animation.noiseScale + 300, time * 0.4, animState.seed) * amp;
          break;
        case 'sine':
          animOffsetX = Math.sin(time + i * freq) * amp;
          animOffsetY = Math.sin(time + i * freq + Math.PI / 2) * amp;
          animScale = 1 + Math.sin(time * 0.5 + i * freq) * 0.2;
          animRotation = Math.sin(time * 0.3 + i * freq) * amp;
          break;
        case 'cosine':
          animOffsetX = Math.cos(time + i * freq) * amp;
          animOffsetY = Math.cos(time + i * freq + Math.PI / 2) * amp;
          animScale = 1 + Math.cos(time * 0.5 + i * freq) * 0.2;
          animRotation = Math.cos(time * 0.3 + i * freq) * amp;
          break;
        case 'combined':
          animOffsetX = (Math.sin(time + i * freq) + noise3D(i * 0.01, time * 0.5, 0) * 0.5) * amp;
          animOffsetY = (Math.cos(time + i * freq) + noise3D(i * 0.01 + 100, time * 0.5, 0) * 0.5) * amp;
          animScale = 1 + Math.sin(time * 0.5 + i * freq) * 0.15;
          animRotation = (Math.sin(time * 0.3 + i * freq) + noise3D(i * 0.01 + 200, time * 0.3, 0)) * amp * 0.5;
          break;
      }
    }
    
    // Calculate position
    const spreadT = (t - 0.5) * 2;
    const spacingOffset = i * duplication.spacing;
    
    const x = offsetPosX + spreadT * duplication.spread * 0.5 + transform.offsetX * i + animOffsetX;
    const y = offsetPosY + spacingOffset * 0.1 + transform.offsetY * i + animOffsetY;
    
    // Calculate scale
    const scaleT = transform.scaleMin + t * (transform.scaleMax - transform.scaleMin);
    const finalScale = scaleT * animScale * interactive.canvasScale;
    
    // Calculate rotation
    const baseRotation = transform.rotation + i * transform.rotationStep;
    const finalRotation = baseRotation + animRotation + interactive.canvasRotation;
    
    // Create shape
    const shapeItem = createShape(x, y, finalScale, finalRotation, t, i);
    if (shapeItem) {
      group.addChild(shapeItem);
    }
  }
  
  // Apply mirror transform
  if (section.mirrorX || section.mirrorY) {
    const matrix = new paper.Matrix();
    if (section.mirrorX) {
      matrix.scale(-1, 1, section.x + section.width / 2, section.y + section.height / 2);
    }
    if (section.mirrorY) {
      matrix.scale(1, -1, section.x + section.width / 2, section.y + section.height / 2);
    }
    group.transform(matrix);
  }
  
  // Clip to section bounds
  const clipRect = new paper.Path.Rectangle(
    new paper.Point(section.x, section.y),
    new paper.Size(section.width, section.height)
  );
  group.clipped = true;
}

function createShape(x, y, scale, rotation, t, index) {
  const size = shape.size * scale;
  const path = new paper.Path();
  
  // Get colors
  let strokeColor = shape.strokeColor;
  let fillColor = shape.fillColor;
  
  if (color.useGradient) {
    const r = t;
    strokeColor = interpolateColor(color.gradientStart, color.gradientEnd, r);
    fillColor = interpolateColor(color.gradientStart, color.gradientEnd, r);
  }
  
  if (color.hueShift) {
    const hueShift = (animState.time * color.hueSpeed * 50 + index * 5) % 360;
    strokeColor = shiftHue(strokeColor, hueShift);
    fillColor = shiftHue(fillColor, hueShift);
  }
  
  path.strokeColor = strokeColor;
  path.strokeWidth = shape.strokeWeight;
  path.strokeCap = 'round';
  path.strokeJoin = 'round';
  
  if (shape.fillOpacity > 0) {
    path.fillColor = fillColor;
  }
  
  path.opacity = shape.strokeOpacity;
  
  // Create shape geometry
  switch (shape.type) {
    case 'circle':
      path.add(new paper.Point(x + size / 2, y));
      path.arcTo(new paper.Point(x, y + size / 2), new paper.Point(x - size / 2, y));
      path.arcTo(new paper.Point(x, y - size / 2), new paper.Point(x + size / 2, y));
      path.closePath();
      break;
      
    case 'square':
      path.add(new paper.Point(x - size / 2, y - size / 2));
      path.add(new paper.Point(x + size / 2, y - size / 2));
      path.add(new paper.Point(x + size / 2, y + size / 2));
      path.add(new paper.Point(x - size / 2, y + size / 2));
      path.closePath();
      break;
      
    case 'triangle':
      path.add(new paper.Point(x, y - size / 2));
      path.add(new paper.Point(x + size / 2, y + size / 2));
      path.add(new paper.Point(x - size / 2, y + size / 2));
      path.closePath();
      break;
      
    case 'hexagon':
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60 - 90) * Math.PI / 180;
        const px = x + Math.cos(angle) * size / 2;
        const py = y + Math.sin(angle) * size / 2;
        path.add(new paper.Point(px, py));
      }
      path.closePath();
      break;
      
    case 'star':
      const outerRadius = size / 2;
      const innerRadius = size / 4;
      for (let i = 0; i < 10; i++) {
        const angle = (i * 36 - 90) * Math.PI / 180;
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        const px = x + Math.cos(angle) * r;
        const py = y + Math.sin(angle) * r;
        path.add(new paper.Point(px, py));
      }
      path.closePath();
      break;
      
    case 'diamond':
      path.add(new paper.Point(x, y - size / 2));
      path.add(new paper.Point(x + size / 2, y));
      path.add(new paper.Point(x, y + size / 2));
      path.add(new paper.Point(x - size / 2, y));
      path.closePath();
      break;
      
    case 'cross':
      const t2 = size / 6;
      path.add(new paper.Point(x - t2, y - size / 2));
      path.add(new paper.Point(x + t2, y - size / 2));
      path.add(new paper.Point(x + t2, y - t2));
      path.add(new paper.Point(x + size / 2, y - t2));
      path.add(new paper.Point(x + size / 2, y + t2));
      path.add(new paper.Point(x + t2, y + t2));
      path.add(new paper.Point(x + t2, y + size / 2));
      path.add(new paper.Point(x - t2, y + size / 2));
      path.add(new paper.Point(x - t2, y + t2));
      path.add(new paper.Point(x - size / 2, y + t2));
      path.add(new paper.Point(x - size / 2, y - t2));
      path.add(new paper.Point(x - t2, y - t2));
      path.closePath();
      break;
      
    case 'heart':
      path.add(new paper.Point(x, y + size / 3));
      path.cubicCurveTo(
        new paper.Point(x - size / 2, y - size / 3),
        new paper.Point(x - size / 2, y - size / 2),
        new paper.Point(x, y - size / 4)
      );
      path.cubicCurveTo(
        new paper.Point(x + size / 2, y - size / 2),
        new paper.Point(x + size / 2, y - size / 3),
        new paper.Point(x, y + size / 3)
      );
      break;
      
    case 'custom':
      if (customSvg.loaded && customSvg.pathData) {
        return createCustomShape(x, y, size, scale, rotation);
      }
      // Fallback to circle
      path.add(new paper.Point(x + size / 2, y));
      path.arcTo(new paper.Point(x, y + size / 2), new paper.Point(x - size / 2, y));
      path.arcTo(new paper.Point(x, y - size / 2), new paper.Point(x + size / 2, y));
      path.closePath();
      break;
      
    default:
      path.add(new paper.Point(x + size / 2, y));
      path.arcTo(new paper.Point(x, y + size / 2), new paper.Point(x - size / 2, y));
      path.arcTo(new paper.Point(x, y - size / 2), new paper.Point(x + size / 2, y));
      path.closePath();
  }
  
  path.rotate(rotation, new paper.Point(x, y));
  return path;
}

function createCustomShape(x, y, size, scale, rotation) {
  const group = new paper.Group();
  
  if (!customSvg.pathData) return group;
  
  customSvg.pathData.forEach(item => {
    let path;
    const normalizedSize = size / 100;
    
    switch (item.type) {
      case 'path':
        path = new paper.Path(item.d);
        path.scale(normalizedSize);
        break;
      case 'poly':
        path = new paper.Path();
        const points = item.points.split(/[\s,]+/).map(parseFloat);
        for (let i = 0; i < points.length; i += 2) {
          path.add(new paper.Point(points[i] * normalizedSize, points[i + 1] * normalizedSize));
        }
        path.closePath();
        break;
      case 'circle':
        path = new paper.Path.Circle(
          new paper.Point(item.cx * normalizedSize, item.cy * normalizedSize),
          item.r * normalizedSize
        );
        break;
      case 'rect':
        path = new paper.Path.Rectangle(
          new paper.Point(item.x * normalizedSize, item.y * normalizedSize),
          new paper.Size(item.width * normalizedSize, item.height * normalizedSize)
        );
        break;
    }
    
    if (path) {
      path.strokeColor = shape.strokeColor;
      path.strokeWidth = shape.strokeWeight;
      if (shape.fillOpacity > 0) {
        path.fillColor = shape.fillColor;
      }
      group.addChild(path);
    }
  });
  
  const bounds = group.bounds;
  group.position = new paper.Point(x, y);
  group.scale(scale);
  group.rotate(rotation);
  
  return group;
}

// ============================================================
// Color Utilities
// ============================================================

function interpolateColor(color1, color2, factor) {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  
  if (!c1 || !c2) return color1;
  
  const r = Math.round(c1.r + (c2.r - c1.r) * factor);
  const g = Math.round(c1.g + (c2.g - c1.g) * factor);
  const b = Math.round(c1.b + (c2.b - c1.b) * factor);
  
  return new paper.Color(r / 255, g / 255, b / 255);
}

function shiftHue(hex, shift) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.h = (hsl.h + shift) % 360;
  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  
  return new paper.Color(newRgb.r / 255, newRgb.g / 255, newRgb.b / 255);
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return { r: r * 255, g: g * 255, b: b * 255 };
}

// ============================================================
// Export Functions
// ============================================================

function handleExport(p) {
  const format = exportSettings.format;
  setStatus('Exporting...');
  
  switch (format) {
    case 'PNG':
    case 'JPG':
      exportImage(p);
      break;
    case 'SVG':
      exportSVG();
      break;
    case 'MP4':
    case 'WebM':
      exportVideo(p, format.toLowerCase());
      break;
    default:
      exportImage(p);
  }
}

function exportImage(p) {
  p.saveCanvas('splitx-export', exportSettings.format.toLowerCase());
  setStatus('Image exported');
}

function exportSVG() {
  if (!paper.project) return;
  
  generateComposition();
  const svg = paper.project.exportSVG({ asString: true });
  
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = 'splitx-export.svg';
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
  
  setStatus('SVG exported');
}

async function exportVideo(p, format) {
  if (isRecording) return;
  
  const canvas = p.canvas;
  const stream = canvas.captureStream(exportSettings.fps);
  const mimeType = 'video/webm;codecs=vp9';
  
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    setStatus('Video recording not supported');
    return;
  }
  
  mediaRecorder = new MediaRecorder(stream, { mimeType });
  recordedChunks = [];
  
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };
  
  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'splitx-export.webm';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    isRecording = false;
    setStatus('Video exported');
  };
  
  isRecording = true;
  mediaRecorder.start();
  setStatus('Recording...');
  
  setTimeout(() => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  }, exportSettings.duration * 1000);
}
