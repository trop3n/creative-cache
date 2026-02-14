// ============================================================
// Main Entry Point - TEXTR Tool
// p5.js + Paper.js integration for typography art
// ============================================================

import p5 from 'p5';
import paper from 'paper';
import { createNoise3D } from 'simplex-noise';
import {
  canvas, text, duplication, transform, color, distribution, animation,
  effects, customFont, getFontFamily, calculateCanvasSize, animState
} from './state.js';
import { setupUI, refreshUI, setStatus } from './ui.js';
import { setupMedia } from './media.js';
import { exportComposition } from './export.js';

const noise3D = createNoise3D();

let isSetup = false;
let needsResize = true;
let isRecording = false;

// Store text paths for reuse
let textPaths = [];
let letterPaths = [];

// Setup media handlers
const mediaHandlers = setupMedia({
  onFontLoaded: () => {
    refreshUI();
    updateTextPaths();
    if (window.p5Instance) window.p5Instance.redraw();
  },
  onPresetLoaded: () => {
    refreshUI();
    needsResize = true;
    updateTextPaths();
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
    
    // Load initial font and create paths
    loadFontAndCreatePaths();
    
    // Setup UI
    setupUI(p, mediaHandlers, {
      onParamChange: () => {
        updateTextPaths();
        p.redraw();
      },
      onTextChange: () => {
        updateTextPaths();
        p.redraw();
      },
      onFontChange: () => {
        loadFontAndCreatePaths();
      },
      onResize: () => {
        needsResize = true;
      },
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
    generateComposition(p);
    paper.view.update();
    
    // Apply effects
    if (effects.blurEnabled && effects.blurAmount > 0) {
      // Post-processing blur would go here
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
  updateTextPaths();
}

window.p5Instance = new p5(sketch);

// ============================================================
// Font Loading & Text Path Generation
// ============================================================

async function loadFontAndCreatePaths() {
  const fontFamily = getFontFamily();
  
  // Show loading indicator
  const loadingEl = document.getElementById('font-loading');
  if (loadingEl) loadingEl.classList.add('visible');
  
  try {
    // Load font using FontFace API
    const fontFace = new FontFace(fontFamily, `url(https://fonts.gstatic.com/s/${fontFamily.toLowerCase().replace(/\s+/g, '')}/v1/${fontFamily.toLowerCase().replace(/\s+/g, '')}-regular.woff2)`);
    
    // For Google Fonts, we need to add the link tag
    const linkId = 'google-fonts-link';
    let link = document.getElementById(linkId);
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
    
    // Wait for font to load
    await document.fonts.ready;
    
    // Create text paths
    updateTextPaths();
    
    if (window.p5Instance) window.p5Instance.redraw();
    
    setStatus(`Font loaded: ${fontFamily}`);
    setTimeout(() => setStatus('Ready'), 2000);
  } catch (err) {
    console.error('Font loading error:', err);
    setStatus('Font loading failed');
  } finally {
    if (loadingEl) loadingEl.classList.remove('visible');
  }
}

function updateTextPaths() {
  // Create text using Paper.js PointText for vector manipulation
  textPaths = [];
  letterPaths = [];
  
  const content = text.content;
  const fontFamily = getFontFamily();
  
  if (duplication.mode === 'letter' || duplication.mode === 'glyph') {
    // Create individual letter paths
    for (let i = 0; i < content.length; i++) {
      const letter = content[i];
      if (letter === ' ') continue;
      
      const letterPath = createLetterPath(letter, fontFamily, i);
      letterPaths.push(letterPath);
    }
  } else {
    // Create word path
    const wordPath = createWordPath(content, fontFamily);
    textPaths.push(wordPath);
  }
}

function createLetterPath(letter, fontFamily, index) {
  const path = new paper.PointText({
    content: letter,
    fontFamily: fontFamily,
    fontSize: text.fontSize,
    fillColor: color.solid,
  });
  
  // Store original position
  path.data = {
    originalX: 0,
    originalY: 0,
    index: index,
  };
  
  return path;
}

function createWordPath(word, fontFamily) {
  const path = new paper.PointText({
    content: word,
    fontFamily: fontFamily,
    fontSize: text.fontSize,
    fillColor: color.solid,
  });
  
  path.data = {
    originalX: 0,
    originalY: 0,
    index: 0,
  };
  
  return path;
}

// ============================================================
// Composition Generation
// ============================================================

function generateComposition(p) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  if (duplication.mode === 'word') {
    generateWordComposition(p, centerX, centerY);
  } else if (duplication.mode === 'letter') {
    generateLetterComposition(p, centerX, centerY);
  } else if (duplication.mode === 'glyph') {
    generateGlyphComposition(p, centerX, centerY);
  }
}

function generateWordComposition(p, centerX, centerY) {
  const count = duplication.count;
  const paths = textPaths;
  
  if (paths.length === 0) return;
  
  const basePath = paths[0];
  
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1 || 1);
    
    // Calculate position based on distribution mode
    const pos = getDistributionPosition(t, i, count, centerX, centerY);
    
    // Calculate animation offsets
    const animOffset = getAnimationOffset(t, i, count);
    
    // Calculate transformation values
    const scale = getScale(t, i, count);
    const rotation = getRotation(t, i, count);
    
    // Calculate color
    const fillColor = getColor(t, i, count);
    
    // Create the text item
    const item = basePath.clone();
    item.position = new paper.Point(
      pos.x + animOffset.x + transform.offsetX * i,
      pos.y + animOffset.y + transform.offsetY * i
    );
    
    // Apply transformations
    item.scale(scale);
    item.rotate(rotation);
    
    // Apply skew
    if (transform.skewX !== 0 || transform.skewY !== 0) {
      const matrix = new paper.Matrix();
      matrix.skew(transform.skewX, transform.skewY);
      item.transform(matrix);
    }
    
    // Set color
    item.fillColor = fillColor;
    item.opacity = color.fillOpacity;
    
    // Apply stroke
    if (color.strokeWeight > 0) {
      item.strokeColor = color.strokeColor;
      item.strokeWidth = color.strokeWeight;
      
      // Create outline effect by drawing stroked version
      const strokeItem = item.clone();
      strokeItem.fillColor = null;
      strokeItem.strokeColor = color.strokeColor;
      strokeItem.strokeWidth = color.strokeWeight;
      strokeItem.opacity = color.strokeOpacity;
    }
    
    // Apply shadow effect
    if (effects.shadowEnabled) {
      const shadowItem = item.clone();
      shadowItem.fillColor = effects.shadowColor;
      shadowItem.opacity = 0.3;
      shadowItem.translate(new paper.Point(
        effects.shadowOffsetX,
        effects.shadowOffsetY
      ));
      shadowItem.insertBelow(item);
    }
  }
}

function generateLetterComposition(p, centerX, centerY) {
  const count = duplication.count;
  const letters = letterPaths;
  
  if (letters.length === 0) return;
  
  const content = text.content.replace(/\s/g, '');
  
  for (let i = 0; i < count; i++) {
    const letterIndex = i % letters.length;
    const letter = content[letterIndex];
    const t = i / (count - 1 || 1);
    
    // Get position with stagger based on letter index
    const staggerOffset = letterIndex * duplication.stagger;
    const pos = getDistributionPosition(t, i, count, centerX, centerY, staggerOffset);
    
    // Calculate animation offsets
    const animOffset = getAnimationOffset(t, i, count);
    
    // Calculate transformations
    const scale = getScale(t, i, count);
    const rotation = getRotation(t, i, count);
    
    // Calculate color
    const fillColor = getColor(t, i, count);
    
    // Create letter
    const baseLetter = letters[letterIndex];
    if (!baseLetter) continue;
    
    const item = baseLetter.clone();
    item.position = new paper.Point(
      pos.x + animOffset.x + transform.offsetX * i,
      pos.y + animOffset.y + transform.offsetY * i
    );
    
    item.scale(scale);
    item.rotate(rotation);
    
    // Apply skew
    if (transform.skewX !== 0 || transform.skewY !== 0) {
      const matrix = new paper.Matrix();
      matrix.skew(transform.skewX, transform.skewY);
      item.transform(matrix);
    }
    
    item.fillColor = fillColor;
    item.opacity = color.fillOpacity;
    
    if (color.strokeWeight > 0) {
      const strokeItem = item.clone();
      strokeItem.fillColor = null;
      strokeItem.strokeColor = color.strokeColor;
      strokeItem.strokeWidth = color.strokeWeight;
      strokeItem.opacity = color.strokeOpacity;
    }
  }
}

function generateGlyphComposition(p, centerX, centerY) {
  // Similar to letter composition but with path manipulation
  generateLetterComposition(p, centerX, centerY);
}

// ============================================================
// Distribution Functions
// ============================================================

function getDistributionPosition(t, index, total, centerX, centerY, staggerOffset = 0) {
  const mode = distribution.mode;
  const spacing = duplication.spacing;
  
  switch (mode) {
    case 'linear':
      return getLinearPosition(t, index, total, centerX, centerY, spacing, staggerOffset);
    
    case 'grid':
      return getGridPosition(index, centerX, centerY);
    
    case 'circular':
      return getCircularPosition(t, index, total, centerX, centerY);
    
    case 'wave':
      return getWavePosition(t, index, total, centerX, centerY, spacing);
    
    case 'spiral':
      return getSpiralPosition(t, index, total, centerX, centerY);
    
    case 'random':
      return getRandomPosition(index, centerX, centerY);
    
    default:
      return { x: centerX, y: centerY };
  }
}

function getLinearPosition(t, index, total, centerX, centerY, spacing, staggerOffset) {
  const spreadX = duplication.spreadX;
  const spreadY = duplication.spreadY;
  
  const x = centerX + (t - 0.5) * spreadX + staggerOffset;
  const y = centerY + index * spacing + (t - 0.5) * spreadY;
  
  return { x, y };
}

function getGridPosition(index, centerX, centerY) {
  const cols = distribution.gridCols;
  const rows = distribution.gridRows;
  const gapX = distribution.gridGapX;
  const gapY = distribution.gridGapY;
  
  const col = index % cols;
  const row = Math.floor(index / cols);
  
  const totalWidth = (cols - 1) * gapX;
  const totalHeight = (rows - 1) * gapY;
  
  const x = centerX - totalWidth / 2 + col * gapX;
  const y = centerY - totalHeight / 2 + row * gapY;
  
  return { x, y };
}

function getCircularPosition(t, index, total, centerX, centerY) {
  const radius = distribution.circularRadius;
  const startAngle = (distribution.circularStartAngle * Math.PI) / 180;
  const endAngle = (distribution.circularEndAngle * Math.PI) / 180;
  
  const angle = startAngle + t * (endAngle - startAngle);
  
  const x = centerX + Math.cos(angle) * radius;
  const y = centerY + Math.sin(angle) * radius;
  
  return { x, y };
}

function getWavePosition(t, index, total, centerX, centerY, spacing) {
  const amplitude = distribution.waveAmplitude;
  const frequency = distribution.waveFrequency;
  const phase = distribution.wavePhase;
  
  const x = centerX + (t - 0.5) * duplication.spreadX;
  const y = centerY + index * spacing + Math.sin(x * frequency + phase) * amplitude;
  
  return { x, y };
}

function getSpiralPosition(t, index, total, centerX, centerY) {
  const turns = distribution.spiralTurns;
  const maxRadius = distribution.spiralRadius;
  
  const angle = t * turns * Math.PI * 2;
  const radius = t * maxRadius;
  
  const x = centerX + Math.cos(angle) * radius;
  const y = centerY + Math.sin(angle) * radius;
  
  return { x, y };
}

function getRandomPosition(index, centerX, centerY) {
  // Use seeded random
  const seed = distribution.randomSeed + index;
  const random1 = seededRandom(seed);
  const random2 = seededRandom(seed + 1000);
  
  const spreadX = duplication.spreadX || canvas.width * 0.8;
  const spreadY = duplication.spreadY || canvas.height * 0.8;
  
  const x = centerX + (random1 - 0.5) * spreadX;
  const y = centerY + (random2 - 0.5) * spreadY;
  
  return { x, y };
}

function seededRandom(seed) {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

// ============================================================
// Animation Functions
// ============================================================

function getAnimationOffset(t, index, total) {
  if (!animation.enabled) return { x: 0, y: 0 };
  
  const time = animState.time;
  const amp = animation.amplitude;
  const freq = animation.frequency;
  
  let x = 0, y = 0;
  
  switch (animation.mode) {
    case 'wave':
      x = Math.sin(time + index * freq) * amp;
      y = Math.cos(time + index * freq) * amp * 0.5;
      break;
    
    case 'pulse':
      // Handled in scale
      break;
    
    case 'rotate':
      // Handled in rotation
      break;
    
    case 'noise':
      x = noise3D(index * 0.1, time * 0.5, animState.seed) * amp;
      y = noise3D(index * 0.1 + 100, time * 0.5, animState.seed) * amp;
      break;
    
    case 'bounce':
      y = Math.abs(Math.sin(time * 2 + index * freq)) * -amp;
      break;
  }
  
  return { x, y };
}

// ============================================================
// Transformation Functions
// ============================================================

function getScale(t, index, total) {
  let scale;
  
  switch (transform.scaleMode) {
    case 'linear':
      scale = transform.scaleMin + t * (transform.scaleMax - transform.scaleMin);
      break;
    
    case 'random':
      scale = transform.scaleMin + seededRandom(index) * (transform.scaleMax - transform.scaleMin);
      break;
    
    case 'sine':
      scale = transform.scaleMin + (Math.sin(t * Math.PI) * 0.5 + 0.5) * (transform.scaleMax - transform.scaleMin);
      break;
    
    case 'noise':
      const noiseVal = noise3D(index * 0.1, t, animState.seed);
      scale = transform.scaleMin + (noiseVal * 0.5 + 0.5) * (transform.scaleMax - transform.scaleMin);
      break;
    
    default:
      scale = 1;
  }
  
  // Apply pulse animation
  if (animation.enabled && animation.mode === 'pulse') {
    const pulse = 1 + Math.sin(animState.time * 3 + index * animation.frequency) * animation.amplitude * 0.01;
    scale *= pulse;
  }
  
  return scale;
}

function getRotation(t, index, total) {
  let rotation = transform.rotation;
  
  if (transform.rotationRandom) {
    rotation += seededRandom(index) * 360;
  } else {
    rotation += index * transform.rotationStep;
  }
  
  // Apply rotate animation
  if (animation.enabled && animation.mode === 'rotate') {
    rotation += animState.time * 50 + index * animation.frequency * 100;
  }
  
  return rotation;
}

// ============================================================
// Color Functions
// ============================================================

function getColor(t, index, total) {
  switch (color.mode) {
    case 'solid':
      return color.solid;
    
    case 'gradient':
      return interpolateColor(color.gradientStart, color.gradientEnd, t);
    
    case 'rainbow':
      const hue = (color.rainbowHueStart + t * color.rainbowHueRange) % 360;
      return `hsl(${hue}, ${color.rainbowSaturation}%, ${color.rainbowLightness}%)`;
    
    default:
      return color.solid;
  }
}

function interpolateColor(color1, color2, factor) {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  
  if (!c1 || !c2) return color1;
  
  const r = Math.round(c1.r + (c2.r - c1.r) * factor);
  const g = Math.round(c1.g + (c2.g - c1.g) * factor);
  const b = Math.round(c1.b + (c2.b - c1.b) * factor);
  
  return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// ============================================================
// Export Functions
// ============================================================

function handleExport(p) {
  exportComposition(p, paper, animState);
}

// Export functions for external use
export { loadFontAndCreatePaths, updateTextPaths };
