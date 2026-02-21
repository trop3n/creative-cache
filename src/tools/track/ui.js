// ============================================================
// Tweakpane UI Setup - TRACK
// ============================================================

import { Pane } from 'tweakpane';
import {
  canvas, motion, shape, region, connection, filterEffect, source, exportSettings,
  aspectRatioOptions, shapeOptions, regionStyleOptions, connectionStyleOptions,
  filterEffectOptions, playbackSpeedOptions,
  updateCanvasSize,
} from './state.js';
import { startWebcam, stopVideo, loadVideoFile } from './media.js';

let pane = null;
let callbacks = {};

export function setupUI(container, cbs) {
  callbacks = cbs;
  if (!container) return null;

  pane = new Pane({ container, title: 'TRACK' });

  // ---- Import/Export ----
  const ioFolder = pane.addFolder({ title: 'IMPORT / EXPORT', expanded: true });
  
  ioFolder.addButton({ title: 'Upload Video' }).on('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        loadVideoFile(file, (video) => callbacks.onSourceReady?.(video));
      }
    };
    input.click();
  });
  
  ioFolder.addButton({ title: 'Open Camera' }).on('click', () => {
    startWebcam(
      (video) => callbacks.onSourceReady?.(video),
      (err) => alert('Could not access camera: ' + err.message)
    );
  });
  
  ioFolder.addButton({ title: 'Stop' }).on('click', () => {
    stopVideo();
    callbacks.onSourceStop?.();
  });
  
  ioFolder.addButton({ title: 'Export PNG' }).on('click', () => {
    callbacks.onExport?.('png');
  });
  
  ioFolder.addButton({ title: 'Export WebM' }).on('click', () => {
    callbacks.onExport?.('webm');
  });
  
  ioFolder.addBinding(exportSettings, 'highQuality', { label: 'High Quality' });

  // ---- Video Speed ----
  const speedFolder = pane.addFolder({ title: 'VIDEO SPEED', expanded: false });
  speedFolder.addBinding(source, 'playbackSpeed', {
    label: 'Speed',
    options: Object.fromEntries(Object.entries(playbackSpeedOptions).map(([k, v]) => [k, v.toString()])),
  }).on('change', (ev) => callbacks.onSpeedChange?.(ev.value));

  // ---- Performance ----
  const perfFolder = pane.addFolder({ title: 'PERFORMANCE', expanded: false });
  perfFolder.addBinding(motion, 'performance', { 
    label: 'Quality', 
    min: 1, 
    max: 6, 
    step: 1 
  }).on('change', () => callbacks.onParamChange?.());

  // ---- Motion Detection ----
  const motionFolder = pane.addFolder({ title: 'MOTION DETECTION', expanded: true });
  motionFolder.addBinding(motion, 'showVideo', { label: 'Show Video' })
    .on('change', () => callbacks.onParamChange?.());
  motionFolder.addBinding(motion, 'threshold', { label: 'Threshold', min: 5, max: 100, step: 1 })
    .on('change', () => callbacks.onParamChange?.());
  motionFolder.addBinding(motion, 'blur', { label: 'Blur', min: 0, max: 10, step: 1 })
    .on('change', () => callbacks.onParamChange?.());
  motionFolder.addBinding(motion, 'minBlobSize', { label: 'Min Blob Size', min: 10, max: 500, step: 10 })
    .on('change', () => callbacks.onParamChange?.());

  // ---- Shape ----
  const shapeFolder = pane.addFolder({ title: 'SHAPE', expanded: true });
  shapeFolder.addBinding(shape, 'type', { label: 'Type', options: shapeOptions })
    .on('change', () => callbacks.onParamChange?.());
  shapeFolder.addBinding(shape, 'size', { label: 'Size', min: 4, max: 40, step: 2 })
    .on('change', () => callbacks.onParamChange?.());
  shapeFolder.addBinding(shape, 'strokeWidth', { label: 'Stroke', min: 1, max: 5, step: 1 })
    .on('change', () => callbacks.onParamChange?.());
  shapeFolder.addBinding(shape, 'color', { label: 'Color', view: 'color' })
    .on('change', () => callbacks.onParamChange?.());

  // ---- Region Style ----
  const regionFolder = pane.addFolder({ title: 'REGION STYLE', expanded: true });
  regionFolder.addBinding(region, 'style', { label: 'Style', options: regionStyleOptions })
    .on('change', () => callbacks.onParamChange?.());
  regionFolder.addBinding(region, 'label', { label: 'Label' })
    .on('change', () => callbacks.onParamChange?.());
  regionFolder.addBinding(region, 'labelSize', { label: 'Label Size', min: 8, max: 24, step: 2 })
    .on('change', () => callbacks.onParamChange?.());
  regionFolder.addBinding(region, 'frameThickness', { label: 'Frame Width', min: 1, max: 5, step: 1 })
    .on('change', () => callbacks.onParamChange?.());
  regionFolder.addBinding(region, 'gridSpacing', { label: 'Grid Spacing', min: 5, max: 30, step: 5 })
    .on('change', () => callbacks.onParamChange?.());
  regionFolder.addBinding(region, 'particleCount', { label: 'Particle Count', min: 3, max: 20, step: 1 })
    .on('change', () => callbacks.onParamChange?.());
  regionFolder.addBinding(region, 'dashLength', { label: 'Dash Length', min: 4, max: 20, step: 2 })
    .on('change', () => callbacks.onParamChange?.());
  regionFolder.addBinding(region, 'glowIntensity', { label: 'Glow Intensity', min: 0.1, max: 1.0, step: 0.1 })
    .on('change', () => callbacks.onParamChange?.());

  // ---- Connection ----
  const connFolder = pane.addFolder({ title: 'CONNECTION', expanded: true });
  connFolder.addBinding(connection, 'enabled', { label: 'Enabled' })
    .on('change', () => callbacks.onParamChange?.());
  connFolder.addBinding(connection, 'style', { label: 'Style', options: connectionStyleOptions })
    .on('change', () => callbacks.onParamChange?.());
  connFolder.addBinding(connection, 'maxDistance', { label: 'Max Distance', min: 50, max: 300, step: 10 })
    .on('change', () => callbacks.onParamChange?.());
  connFolder.addBinding(connection, 'strokeWidth', { label: 'Stroke', min: 1, max: 4, step: 1 })
    .on('change', () => callbacks.onParamChange?.());
  connFolder.addBinding(connection, 'color', { label: 'Color', view: 'color' })
    .on('change', () => callbacks.onParamChange?.());
  connFolder.addBinding(connection, 'opacity', { label: 'Opacity', min: 0.1, max: 1.0, step: 0.1 })
    .on('change', () => callbacks.onParamChange?.());
  connFolder.addBinding(connection, 'waveAmplitude', { label: 'Wave Amplitude', min: 2, max: 20, step: 2 })
    .on('change', () => callbacks.onParamChange?.());
  connFolder.addBinding(connection, 'waveFrequency', { label: 'Wave Frequency', min: 1, max: 8, step: 1 })
    .on('change', () => callbacks.onParamChange?.());
  connFolder.addBinding(connection, 'pulseSpeed', { label: 'Pulse Speed', min: 0.5, max: 5, step: 0.5 })
    .on('change', () => callbacks.onParamChange?.());

  // ---- Filter Effects ----
  const filterFolder = pane.addFolder({ title: 'FILTER EFFECTS', expanded: false });
  filterFolder.addBinding(filterEffect, 'type', { label: 'Effect', options: filterEffectOptions })
    .on('change', () => callbacks.onParamChange?.());
  filterFolder.addBinding(filterEffect, 'invert', { label: 'Invert' })
    .on('change', () => callbacks.onParamChange?.());
  filterFolder.addBinding(filterEffect, 'fusion', { label: 'Fusion' })
    .on('change', () => callbacks.onParamChange?.());
  filterFolder.addBinding(filterEffect, 'intensity', { label: 'Intensity', min: 0, max: 1, step: 0.1 })
    .on('change', () => callbacks.onParamChange?.());

  // ---- Canvas ----
  const canvasFolder = pane.addFolder({ title: 'CANVAS', expanded: false });
  canvasFolder.addBinding(canvas, 'aspectRatio', {
    label: 'Aspect Ratio',
    options: Object.fromEntries(Object.keys(aspectRatioOptions).map(k => [k, k])),
  }).on('change', () => callbacks.onCanvasChange?.());
  canvasFolder.addBinding(canvas, 'background', { label: 'Background', view: 'color' })
    .on('change', () => callbacks.onParamChange?.());

  // ---- Status ----
  const statusFolder = pane.addFolder({ title: 'STATUS', expanded: false });
  statusFolder.addBinding(exportSettings, 'status', { label: 'Status', readonly: true });

  return pane;
}

export function refreshUI() {
  if (pane) pane.refresh();
}

export function setStatus(msg) {
  exportSettings.status = msg;
  refreshUI();
}

export function dispose() {
  if (pane) {
    pane.dispose();
    pane = null;
  }
}
