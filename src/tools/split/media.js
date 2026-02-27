// ============================================================
// SPLITX Tool — File Handling (SVG, JSON preset, drag-drop)
// ============================================================

import paper from 'paper';
import { customSvg } from './state.js';
import { importPresetJSON } from './presets.js';

/**
 * Set up drag-drop and the global fileInput for this tool.
 *
 * @param {HTMLElement} canvasContainer
 * @param {{ onSvgLoaded: Function, onPresetLoaded: Function }} callbacks
 * @returns {{ handleFile: Function }}
 */
export function setupMedia(canvasContainer, callbacks) {
  const fileInput = document.getElementById('fileInput');

  // Named references so they can be removed on dispose
  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) dispatchFile(file, callbacks);
    fileInput.value = '';   // clear before async read (File object already captured)
  };
  const onDragOver  = (e) => { e.preventDefault(); canvasContainer.classList.add('drag-over'); };
  const onDragLeave = ()  => { canvasContainer.classList.remove('drag-over'); };
  const onDrop      = (e) => {
    e.preventDefault();
    canvasContainer.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) dispatchFile(file, callbacks);
  };

  // File picker → handleFile
  if (fileInput) fileInput.addEventListener('change', onFileChange);

  // Drag-and-drop onto canvas
  canvasContainer.addEventListener('dragover',   onDragOver);
  canvasContainer.addEventListener('dragleave',  onDragLeave);
  canvasContainer.addEventListener('drop',       onDrop);

  return {
    handleFile: (file) => dispatchFile(file, callbacks),
    dispose() {
      if (fileInput) fileInput.removeEventListener('change', onFileChange);
      canvasContainer.removeEventListener('dragover',  onDragOver);
      canvasContainer.removeEventListener('dragleave', onDragLeave);
      canvasContainer.removeEventListener('drop',      onDrop);
    },
  };
}

// ── Internal ─────────────────────────────────────────────────
function dispatchFile(file, callbacks) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.svg')) {
    loadSVG(file, callbacks.onSvgLoaded);
  } else if (name.endsWith('.json')) {
    loadJSON(file, callbacks.onPresetLoaded);
  }
}

function loadSVG(file, onDone) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const svgString = e.target.result;
      // Import into paper.js (off-screen — insert: false keeps it out of the active layer)
      const imported = paper.project.importSVG(svgString, { expandShapes: true, insert: false });
      if (imported) {
        // Discard previous custom SVG item if it exists
        if (customSvg.item) customSvg.item.remove();
        customSvg.item = imported;
        onDone?.();
      }
    } catch (err) {
      console.error('SPLITX: failed to import SVG', err);
    }
  };
  reader.onerror = (e) => console.error('SPLITX: failed to read SVG file', e);
  reader.readAsText(file);
}

function loadJSON(file, onDone) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      importPresetJSON(data);
      onDone?.();
    } catch (err) {
      console.error('SPLITX: failed to parse preset JSON', err);
    }
  };
  reader.onerror = (e) => console.error('SPLITX: failed to read JSON file', e);
  reader.readAsText(file);
}
