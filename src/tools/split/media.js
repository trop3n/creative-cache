import { customSvg, shape } from './state.js';
import { importPreset } from './presets.js';

// ============================================================
// Media Handling - SVG Drop and File Import
// ============================================================

export function setupMedia(callbacks = {}) {
  const container = document.getElementById('canvas-container');
  const fileInput = document.getElementById('fileInput');
  
  // Create drag overlay
  const overlay = document.createElement('div');
  overlay.className = 'drag-overlay';
  overlay.textContent = 'Drop SVG or Preset file here';
  container.appendChild(overlay);
  
  // File input change handler
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file, callbacks);
    fileInput.value = ''; // Reset for reuse
  });
  
  // Drag events
  container.addEventListener('dragenter', (e) => {
    e.preventDefault();
    container.classList.add('drag-over');
  });
  
  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    container.classList.add('drag-over');
  });
  
  container.addEventListener('dragleave', (e) => {
    e.preventDefault();
    if (!container.contains(e.relatedTarget)) {
      container.classList.remove('drag-over');
    }
  });
  
  container.addEventListener('drop', (e) => {
    e.preventDefault();
    container.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0], callbacks);
    }
  });
  
  return {
    triggerFileSelect: () => fileInput.click(),
  };
}

function handleFile(file, callbacks) {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.svg')) {
    handleSvgFile(file, callbacks);
  } else if (fileName.endsWith('.json')) {
    handlePresetFile(file, callbacks);
  } else {
    console.warn('Unsupported file type:', file.type);
    callbacks.onError?.('Unsupported file type. Please use .svg or .json files.');
  }
}

function handleSvgFile(file, callbacks) {
  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const svgString = e.target.result;
      customSvg.data = svgString;
      customSvg.loaded = true;
      shape.type = 'custom';
      
      extractPathData(svgString);
      
      callbacks.onSvgLoaded?.(svgString);
      callbacks.onSuccess?.('SVG loaded successfully');
    } catch (err) {
      console.error('Error parsing SVG:', err);
      callbacks.onError?.('Error parsing SVG file');
    }
  };
  
  reader.onerror = () => {
    callbacks.onError?.('Error reading file');
  };
  
  reader.readAsText(file);
}

function handlePresetFile(file, callbacks) {
  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const jsonString = e.target.result;
      const result = importPreset(jsonString);
      
      if (result.success) {
        callbacks.onPresetLoaded?.();
        callbacks.onSuccess?.('Preset loaded successfully');
      } else {
        callbacks.onError?.(result.message);
      }
    } catch (err) {
      console.error('Error parsing preset:', err);
      callbacks.onError?.('Error parsing preset file');
    }
  };
  
  reader.onerror = () => {
    callbacks.onError?.('Error reading file');
  };
  
  reader.readAsText(file);
}

function extractPathData(svgString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  
  if (!svg) {
    console.warn('No SVG element found');
    return;
  }
  
  const viewBox = svg.getAttribute('viewBox');
  if (viewBox) {
    const parts = viewBox.split(/\s+/).map(parseFloat);
    if (parts.length === 4) {
      customSvg.viewBox = { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
    }
  }
  
  const paths = [];
  
  svg.querySelectorAll('path').forEach(path => {
    const d = path.getAttribute('d');
    if (d) paths.push({ type: 'path', d });
  });
  
  svg.querySelectorAll('polygon, polyline').forEach(poly => {
    const points = poly.getAttribute('points');
    if (points) paths.push({ type: 'poly', points });
  });
  
  svg.querySelectorAll('circle').forEach(circle => {
    const cx = parseFloat(circle.getAttribute('cx')) || 0;
    const cy = parseFloat(circle.getAttribute('cy')) || 0;
    const r = parseFloat(circle.getAttribute('r')) || 0;
    paths.push({ type: 'circle', cx, cy, r });
  });
  
  svg.querySelectorAll('rect').forEach(rect => {
    const x = parseFloat(rect.getAttribute('x')) || 0;
    const y = parseFloat(rect.getAttribute('y')) || 0;
    const width = parseFloat(rect.getAttribute('width')) || 0;
    const height = parseFloat(rect.getAttribute('height')) || 0;
    paths.push({ type: 'rect', x, y, width, height });
  });
  
  customSvg.pathData = paths.length > 0 ? paths : null;
}

export function getDefaultSvgShape(type) {
  const shapes = {
    circle: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45"/></svg>',
    square: '<svg viewBox="0 0 100 100"><rect x="5" y="5" width="90" height="90"/></svg>',
    triangle: '<svg viewBox="0 0 100 100"><polygon points="50,5 95,95 5,95"/></svg>',
    hexagon: '<svg viewBox="0 0 100 100"><polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5"/></svg>',
    star: '<svg viewBox="0 0 100 100"><polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35"/></svg>',
    heart: '<svg viewBox="0 0 100 100"><path d="M50,25 C50,10 35,5 25,15 C15,25 20,40 50,85 C80,40 85,25 75,15 C65,5 50,10 50,25 Z"/></svg>',
    cross: '<svg viewBox="0 0 100 100"><polygon points="35,5 65,5 65,35 95,35 95,65 65,65 65,95 35,95 35,65 5,65 5,35 35,35"/></svg>',
    diamond: '<svg viewBox="0 0 100 100"><polygon points="50,5 95,50 50,95 5,50"/></svg>',
  };
  return shapes[type] || shapes.circle;
}
