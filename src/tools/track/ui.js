// ============================================================
// TRACK — Custom Panel UI
// ============================================================

import './style.css';
import { motion, shape, region, filterEffect, source, exportSettings, connection, blink, audio, colorPalette } from './state.js';
import { startWebcam, stopVideo, loadVideoFile } from './media.js';

let _container = null;
let _callbacks  = {};

// ============================================================
// Public API
// ============================================================

/**
 * @param {HTMLElement} container
 * @param {object} callbacks
 */
export function setupUI(container, callbacks) {
  _callbacks  = callbacks;
  _container  = container;
  if (!container) return null;

  container.innerHTML = '';
  container.classList.add('tr-panel');

  _buildSourceSection(container);
  _buildSpeedSection(container);
  _buildPerformanceSection(container);
  _buildShapeSection(container);
  _buildRegionSection(container);
  _buildBlinkSection(container);
  _buildConnectionSection(container);
  _buildStrokeWidthSection(container);
  _buildBoundingSizeSection(container);
  _buildBlobCountSection(container);
  _buildAudioSection(container);
  _buildSingleTrackingSection(container);
  _buildColorTextSection(container);

  return { dispose };
}

export function refreshUI() {
  if (!_container) return;

  // Speed
  _container.querySelectorAll('.tr-speed-btn').forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.speed) === source.playbackSpeed);
  });
  // Shape
  _container.querySelectorAll('.tr-shape-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.shape === shape.type);
  });
  // Region
  _container.querySelectorAll('.tr-grid-btn[data-region]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.region === region.style);
  });
  // Filter
  _container.querySelectorAll('.tr-grid-btn[data-filter]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filterEffect.type);
  });
  // Toggles
  const invertCb = _container.querySelector('#tr-invert');
  const fusionCb = _container.querySelector('#tr-fusion');
  if (invertCb) invertCb.checked = filterEffect.invert;
  if (fusionCb) fusionCb.checked = filterEffect.fusion;
}

export function setStatus(msg) {
  exportSettings.status = msg;
}

export function dispose() {
  if (_container) {
    _container.innerHTML = '';
    _container.classList.remove('tr-panel');
    _container = null;
  }
}

// ============================================================
// Section builders
// ============================================================

function _buildSourceSection(root) {
  const sec = _section(root);

  // Upload + Camera
  const row1 = _row(sec);
  _btn(row1, '↑ Upload Video', 'upload', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) loadVideoFile(file, (video) => _callbacks.onSourceReady?.(video));
    };
    input.click();
  });
  _btn(row1, '⊙ Open Camera', 'camera', () => {
    startWebcam(
      (video) => _callbacks.onSourceReady?.(video),
      (err) => alert('Camera error: ' + err.message)
    );
  });

  // Export MP4 + WebM
  const row2 = _row(sec);
  _btn(row2, '↓ Export MP4', 'export', () => _callbacks.onExport?.('png'));
  _btn(row2, '↓ Export WebM', 'export', () => _callbacks.onExport?.('webm'));
}

// ---- Video Speed ----

function _buildSpeedSection(root) {
  const sec = _section(root);
  _sectionHdr(sec, '▷▷', 'Video Speed');

  const row = _el('div', 'tr-speed-row', sec);
  [1, 2, 3, 4].forEach(s => {
    const btn = _el('button', 'tr-speed-btn', row);
    btn.textContent = s + 'X';
    btn.dataset.speed = s;
    if (source.playbackSpeed === s) btn.classList.add('active');
    btn.addEventListener('click', () => {
      source.playbackSpeed = s;
      row.querySelectorAll('.tr-speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _callbacks.onSpeedChange?.(s);
    });
  });
}

// ---- Performance ----

const PERF_LABELS = ['Ultra Fast', 'Fast', 'Balanced', 'Good', 'High', 'No Skip'];

function _buildPerformanceSection(root) {
  const sec = _section(root);

  const hdr = _el('div', 'tr-section-hdr', sec);
  _span(hdr, 'tr-hdr-icon', '◈');
  _span(hdr, '', 'Performance');
  const label = _span(hdr, 'tr-perf-label', PERF_LABELS[motion.performance - 1]);

  const slider = _el('input', 'tr-slider', sec);
  slider.type  = 'range';
  slider.min   = 1;
  slider.max   = 6;
  slider.step  = 1;
  slider.value = motion.performance;
  _updateSliderFill(slider);

  slider.addEventListener('input', () => {
    motion.performance = Number(slider.value);
    label.textContent  = PERF_LABELS[motion.performance - 1];
    _updateSliderFill(slider);
    _callbacks.onParamChange?.();
  });
}

function _updateSliderFill(slider) {
  const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
  slider.style.background =
    `linear-gradient(to right, #666 0%, #666 ${pct}%, #2a2a2a ${pct}%)`;
}

// ---- Shape ----

const SHAPES = [
  { id: 'square',    cls: 'square',  title: 'Square'    },
  { id: 'circle',    cls: 'circle',  title: 'Circle'    },
  { id: 'rectangle', cls: 'rect',    title: 'Rectangle' },
];

function _buildShapeSection(root) {
  const sec = _section(root);
  _sectionHdr(sec, '◻', 'Shape');

  const row = _el('div', 'tr-shape-row', sec);
  SHAPES.forEach(({ id, cls }) => {
    const btn = _el('button', 'tr-shape-btn', row);
    btn.dataset.shape = id;
    if (shape.type === id) btn.classList.add('active');

    const icon = _el('span', `tr-shape-icon ${cls}`, btn);
    icon.setAttribute('aria-hidden', 'true');

    btn.addEventListener('click', () => {
      shape.type = id;
      row.querySelectorAll('.tr-shape-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _callbacks.onParamChange?.();
    });
  });
}

// ---- Region Style + Filter Effects ----

const REGION_STYLES = [
  { id: 'basic',    label: 'Basic'    },
  { id: 'label',    label: 'Label'    },
  { id: 'frame',    label: 'Frame'    },
  { id: 'lframe',   label: 'L-Frame'  },
  { id: 'xframe',   label: 'X-Frame'  },
  { id: 'grid',     label: 'Grid'     },
  { id: 'particle', label: 'Particle' },
  { id: 'dash',     label: 'Dash'     },
  { id: 'scope',    label: 'Scope'    },
  { id: 'win2k',    label: 'Win2K'    },
  { id: 'label2',   label: 'Label 2'  },
  { id: 'glow',     label: 'Glow'     },
];

const FILTER_EFFECTS = [
  { id: 'invert',  label: 'Inv'     },
  { id: 'glitch',  label: 'Glitch'  },
  { id: 'thermal', label: 'Thermal' },
  { id: 'pixel',   label: 'Pixel'   },
  { id: 'tone',    label: 'Tone'    },
  { id: 'blur',    label: 'Blur'    },
  { id: 'dither',  label: 'Dither'  },
  { id: 'zoom',    label: 'Zoom'    },
  { id: 'xray',    label: 'X-Ray'   },
  { id: 'water',   label: 'Water'   },
  { id: 'mask',    label: 'Mask'    },
  { id: 'crt',     label: 'CRT'     },
  { id: 'edge',    label: 'Edge'    },
];

function _buildRegionSection(root) {
  const sec = _section(root);

  // Header with Random button
  const hdr = _el('div', 'tr-section-hdr', sec);
  _span(hdr, 'tr-hdr-icon', '◑');
  _span(hdr, '', 'Region Style');
  const randomBtn = _el('button', 'tr-random-btn', hdr);
  randomBtn.textContent = 'Random';
  randomBtn.addEventListener('click', () => {
    const pick = REGION_STYLES[Math.floor(Math.random() * REGION_STYLES.length)];
    region.style = pick.id;
    sec.querySelectorAll('.tr-grid-btn[data-region]').forEach(b => {
      b.classList.toggle('active', b.dataset.region === pick.id);
    });
    _callbacks.onParamChange?.();
  });

  // Basic Effects grid
  _subsectionLabel(sec, 'Basic Effects');
  const regionGrid = _el('div', 'tr-grid', sec);
  REGION_STYLES.forEach(({ id, label }) => {
    const btn = _el('button', 'tr-grid-btn', regionGrid);
    btn.dataset.region = id;
    btn.textContent = label;
    if (region.style === id) btn.classList.add('active');
    btn.addEventListener('click', () => {
      region.style = id;
      regionGrid.querySelectorAll('.tr-grid-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _callbacks.onParamChange?.();
    });
  });

  // Filter Effects header with Invert + Fusion toggles
  const filterHdr = _el('div', 'tr-filter-hdr', sec);
  _span(filterHdr, 'tr-filter-label', 'Filter Effects');

  const toggles = _el('div', 'tr-toggles', filterHdr);

  const invertWrap = _el('label', 'tr-toggle-wrap', toggles);
  const invertCb = _el('input', 'tr-toggle', invertWrap);
  invertCb.type = 'checkbox';
  invertCb.id   = 'tr-invert';
  invertCb.checked = filterEffect.invert;
  invertCb.addEventListener('change', () => {
    filterEffect.invert = invertCb.checked;
    _callbacks.onParamChange?.();
  });
  _span(invertWrap, '', 'Invert');

  const fusionWrap = _el('label', 'tr-toggle-wrap', toggles);
  const fusionCb = _el('input', 'tr-toggle', fusionWrap);
  fusionCb.type = 'checkbox';
  fusionCb.id   = 'tr-fusion';
  fusionCb.checked = filterEffect.fusion;
  fusionCb.addEventListener('change', () => {
    filterEffect.fusion = fusionCb.checked;
    _callbacks.onParamChange?.();
  });
  _span(fusionWrap, '', 'Fusion');

  // Filter Effects grid — click active to deselect (back to 'none')
  const filterGrid = _el('div', 'tr-grid', sec);
  FILTER_EFFECTS.forEach(({ id, label }) => {
    const btn = _el('button', 'tr-grid-btn', filterGrid);
    btn.dataset.filter = id;
    btn.textContent = label;
    if (filterEffect.type === id) btn.classList.add('active');
    btn.addEventListener('click', () => {
      if (filterEffect.type === id) {
        filterEffect.type = 'none';
        btn.classList.remove('active');
      } else {
        filterEffect.type = id;
        filterGrid.querySelectorAll('.tr-grid-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
      _callbacks.onParamChange?.();
    });
  });
}

// ---- Blink ----

function _buildBlinkSection(root) {
  const sec = _section(root);
  const hdr = _el('div', 'tr-section-hdr', sec);
  _span(hdr, 'tr-hdr-icon', '⚡');
  _span(hdr, '', 'Blink');
  _badge(hdr, 'New', 'tr-badge-new');
  _switch(hdr, blink.enabled, (v) => {
    blink.enabled = v;
    _callbacks.onParamChange?.();
  });
}

// ---- Connection ----

const LINE_STYLES = [
  { id: 'straight', svg: '<line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="2"/>' },
  { id: 'curved',   svg: '<path d="M4 16 Q12 4 20 16" fill="none" stroke="currentColor" stroke-width="2"/>' },
  { id: 'waveform', svg: '<path d="M2 12 Q5 6 8 12 Q11 18 14 12 Q17 6 22 12" fill="none" stroke="currentColor" stroke-width="2"/>' },
  { id: 'pulse',    svg: '<polyline points="2,12 7,12 9,5 11,19 13,5 15,19 17,12 22,12" fill="none" stroke="currentColor" stroke-width="2"/>' },
];

const CONN_RATES = [0, 0.25, 0.5, 0.75, 1];

function _buildConnectionSection(root) {
  const sec = _section(root);

  // Header
  const hdr = _el('div', 'tr-section-hdr', sec);
  _span(hdr, 'tr-hdr-icon', '⌖');
  _span(hdr, '', 'Connection');
  _badge(hdr, 'PRO', 'tr-badge-pro');
  _span(hdr, 'tr-spacer', '');
  _inlineToggle(hdr, 'Central Hub', connection.centralHub, (v) => {
    connection.centralHub = v;
    _callbacks.onParamChange?.();
  });

  // Line Style row header
  const lsLabel = _el('div', 'tr-subsection-inline', sec);
  _span(lsLabel, '', 'Line Style');
  _badge(lsLabel, 'PRO', 'tr-badge-pro');
  _span(lsLabel, 'tr-spacer', '');
  _inlineToggle(lsLabel, 'Dashed', connection.dashed, (v) => {
    connection.dashed = v;
    _callbacks.onParamChange?.();
  });

  // Line Style icon grid
  const lsGrid = _el('div', 'tr-line-style-grid', sec);
  LINE_STYLES.forEach(({ id, svg }) => {
    const btn = _el('button', 'tr-line-btn', lsGrid);
    btn.dataset.lineStyle = id;
    btn.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="18" xmlns="http://www.w3.org/2000/svg">${svg}</svg>`;
    if (connection.style === id) btn.classList.add('active');
    btn.addEventListener('click', () => {
      connection.style = id;
      lsGrid.querySelectorAll('.tr-line-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _callbacks.onParamChange?.();
    });
  });

  // Connection Rate
  _subsectionLabel(sec, 'Connection Rate');
  const rateRow = _el('div', 'tr-rate-row', sec);
  CONN_RATES.forEach(r => {
    const btn = _el('button', 'tr-rate-btn', rateRow);
    btn.textContent = r;
    btn.dataset.rate = r;
    if (connection.rate === r) btn.classList.add('active');
    btn.addEventListener('click', () => {
      connection.rate = r;
      rateRow.querySelectorAll('.tr-rate-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _callbacks.onParamChange?.();
    });
  });
}

// ---- Stroke Width ----

function _buildStrokeWidthSection(root) {
  const sec = _section(root);

  const hdr = _el('div', 'tr-section-hdr', sec);
  _span(hdr, 'tr-hdr-icon', '⊟');
  _span(hdr, '', 'Stroke Width');
  const label = _span(hdr, 'tr-perf-label', connection.strokeWidth + 'px');

  const slider = _el('input', 'tr-slider', sec);
  slider.type  = 'range';
  slider.min   = 1;
  slider.max   = 10;
  slider.step  = 1;
  slider.value = connection.strokeWidth;
  _updateSliderFill(slider);

  slider.addEventListener('input', () => {
    connection.strokeWidth = Number(slider.value);
    label.textContent = connection.strokeWidth + 'px';
    _updateSliderFill(slider);
    _callbacks.onParamChange?.();
  });
}

// ---- Bounding Size ----

const BOUNDING_SIZES = [0, 32, 64, 128, 256, 512];

function _buildBoundingSizeSection(root) {
  const sec = _section(root);

  const hdr = _el('div', 'tr-section-hdr', sec);
  _span(hdr, 'tr-hdr-icon', '⊡');
  _span(hdr, '', 'Bounding Size');
  _badge(hdr, 'PRO', 'tr-badge-pro');
  _span(hdr, 'tr-spacer', '');
  _inlineToggle(hdr, 'Same Size', region.sameSize, (v) => {
    region.sameSize = v;
    _callbacks.onParamChange?.();
  });

  const row = _el('div', 'tr-count-row', sec);
  BOUNDING_SIZES.forEach(s => {
    const btn = _el('button', 'tr-count-btn', row);
    btn.textContent = s;
    btn.dataset.size = s;
    if (region.boundingSize === s) btn.classList.add('active');
    btn.addEventListener('click', () => {
      region.boundingSize = s;
      row.querySelectorAll('.tr-count-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _callbacks.onParamChange?.();
    });
  });
}

// ---- Blob Count Control ----

const COUNT_VALUES = [16, 32, 64, 128, 256, 512];

function _buildBlobCountSection(root) {
  const sec = _section(root);
  _sectionHdr(sec, '◎', 'Blob Count Control');

  // Mode buttons
  const modeRow = _el('div', 'tr-mode-row two-col', sec);
  ['size', 'count'].forEach(mode => {
    const btn = _el('button', 'tr-mode-btn', modeRow);
    btn.textContent = mode === 'size' ? 'By Size' : 'By Count';
    btn.dataset.mode = mode;
    if (motion.countMode === mode) btn.classList.add('active');
    btn.addEventListener('click', () => {
      motion.countMode = mode;
      modeRow.querySelectorAll('.tr-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _callbacks.onParamChange?.();
    });
  });

  // Count value buttons
  const countRow = _el('div', 'tr-count-row', sec);
  COUNT_VALUES.forEach(v => {
    const btn = _el('button', 'tr-count-btn', countRow);
    btn.textContent = v;
    btn.dataset.count = v;
    if (motion.countValue === v) btn.classList.add('active');
    btn.addEventListener('click', () => {
      motion.countValue = v;
      countRow.querySelectorAll('.tr-count-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _callbacks.onParamChange?.();
    });
  });
}

// ---- Audio ----

const AUDIO_TYPES = ['none', 'computer', 'beep', 'bird'];
const AUDIO_LABELS = { none: 'None', computer: 'Computer', beep: 'Beep', bird: 'Bird' };

function _buildAudioSection(root) {
  const sec = _section(root);

  const hdr = _el('div', 'tr-section-hdr', sec);
  _span(hdr, 'tr-hdr-icon', '♪');
  _span(hdr, '', 'Audio');
  _badge(hdr, 'PRO', 'tr-badge-pro');

  const row = _el('div', 'tr-audio-row', sec);
  AUDIO_TYPES.forEach(t => {
    const btn = _el('button', 'tr-audio-btn', row);
    btn.textContent = AUDIO_LABELS[t];
    btn.dataset.audio = t;
    if (audio.type === t) btn.classList.add('active');
    btn.addEventListener('click', () => {
      audio.type = t;
      row.querySelectorAll('.tr-audio-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _callbacks.onParamChange?.();
    });
  });

  const uploadRow = _el('div', 'tr-btn-row', sec);
  uploadRow.style.gridTemplateColumns = '1fr';
  const uploadBtn = _el('button', 'tr-btn tr-btn-upload', uploadRow);
  uploadBtn.textContent = '↓ Upload Audio';
  uploadBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) _callbacks.onAudioFile?.(file);
    };
    input.click();
  });
}

// ---- Single Tracking ----

function _buildSingleTrackingSection(root) {
  const sec = _section(root);
  const hdr = _el('div', 'tr-section-hdr', sec);
  _span(hdr, 'tr-hdr-icon', '⊕');
  _span(hdr, '', 'Single Tracking');
  _switch(hdr, motion.singleTracking, (v) => {
    motion.singleTracking = v;
    _callbacks.onParamChange?.();
  });
}

// ---- Color & Text ----

const TEXT_POSITIONS = ['center', 'top', 'bottom'];
const TEXT_CONTENTS  = ['random', 'position', 'count'];
const FONT_SIZES     = [10, 12, 16, 18, 20];

function _buildColorTextSection(root) {
  const sec = _section(root);

  // Header with Crazy + Text toggles
  const hdr = _el('div', 'tr-section-hdr', sec);
  _span(hdr, 'tr-hdr-icon', '◐');
  _span(hdr, '', 'Color & Text');
  _span(hdr, 'tr-spacer', '');
  _inlineToggle(hdr, 'Crazy', shape.crazy, (v) => {
    shape.crazy = v;
    _callbacks.onParamChange?.();
  });
  _inlineToggle(hdr, 'Text', shape.showText, (v) => {
    shape.showText = v;
    _callbacks.onParamChange?.();
  });

  // Text Position
  _subsectionLabel(sec, 'Text Position');
  const posRow = _el('div', 'tr-mode-row', sec);
  TEXT_POSITIONS.forEach(pos => {
    const btn = _el('button', 'tr-mode-btn', posRow);
    btn.textContent = pos.charAt(0).toUpperCase() + pos.slice(1);
    btn.dataset.pos = pos;
    if (shape.textPosition === pos) btn.classList.add('active');
    btn.addEventListener('click', () => {
      shape.textPosition = pos;
      posRow.querySelectorAll('.tr-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _callbacks.onParamChange?.();
    });
  });

  // Text Content
  _subsectionLabel(sec, 'Text Content');
  const contentRow = _el('div', 'tr-mode-row', sec);
  TEXT_CONTENTS.forEach(c => {
    const btn = _el('button', 'tr-mode-btn', contentRow);
    btn.textContent = c.charAt(0).toUpperCase() + c.slice(1);
    btn.dataset.content = c;
    if (shape.textContent === c) btn.classList.add('active');
    btn.addEventListener('click', () => {
      shape.textContent = c;
      contentRow.querySelectorAll('.tr-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _callbacks.onParamChange?.();
    });
  });

  // Font Size
  _subsectionLabel(sec, 'Font Size');
  const fsRow = _el('div', 'tr-count-row', sec);
  fsRow.style.gridTemplateColumns = `repeat(${FONT_SIZES.length}, 1fr)`;
  FONT_SIZES.forEach(fs => {
    const btn = _el('button', 'tr-count-btn', fsRow);
    btn.textContent = fs + 'px';
    btn.dataset.fs = fs;
    if (shape.fontSize === fs) btn.classList.add('active');
    btn.addEventListener('click', () => {
      shape.fontSize = fs;
      fsRow.querySelectorAll('.tr-count-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _callbacks.onParamChange?.();
    });
  });

  // Color
  const colorHdr = _el('div', 'tr-filter-hdr', sec);
  _span(colorHdr, 'tr-filter-label', 'Color');
  _badge(colorHdr, 'PRO', 'tr-badge-pro');
  _span(colorHdr, 'tr-spacer', '');
  _inlineToggle(colorHdr, 'Separate Colors', shape.separateColors, (v) => {
    shape.separateColors = v;
    _callbacks.onParamChange?.();
  });

  const paletteGrid = _el('div', 'tr-palette-grid', sec);
  colorPalette.forEach(hex => {
    const swatch = _el('button', 'tr-swatch', paletteGrid);
    swatch.style.background = hex;
    swatch.dataset.color = hex;
    if (shape.separateColors ? shape.palette.includes(hex) : shape.color === hex) swatch.classList.add('active');
    if (hex === '#ffffff') {
      const check = _el('span', 'tr-swatch-check', swatch);
      check.textContent = '✓';
    }
    swatch.addEventListener('click', () => {
      if (shape.separateColors) {
        swatch.classList.toggle('active');
        const active = paletteGrid.querySelectorAll('.tr-swatch.active');
        shape.palette = Array.from(active).map(s => s.dataset.color);
      } else {
        shape.color = hex;
        paletteGrid.querySelectorAll('.tr-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
      }
      _callbacks.onParamChange?.();
    });
  });
}

// ============================================================
// DOM helpers
// ============================================================

function _section(parent) {
  return _el('div', 'tr-section', parent);
}

function _row(parent) {
  return _el('div', 'tr-btn-row', parent);
}

function _sectionHdr(parent, icon, text) {
  const hdr = _el('div', 'tr-section-hdr', parent);
  _span(hdr, 'tr-hdr-icon', icon);
  _span(hdr, '', text);
  return hdr;
}

function _subsectionLabel(parent, text) {
  const el = _el('div', 'tr-subsection-label', parent);
  el.textContent = text;
  return el;
}

function _btn(parent, label, type, onClick) {
  const btn = _el('button', `tr-btn tr-btn-${type}`, parent);
  btn.textContent = label;
  btn.addEventListener('click', onClick);
  return btn;
}

function _el(tag, className, parent) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (parent) parent.appendChild(el);
  return el;
}

function _span(parent, className, text) {
  const el = document.createElement('span');
  if (className) el.className = className;
  el.textContent = text;
  parent.appendChild(el);
  return el;
}

function _badge(parent, text, cls = 'tr-badge-pro') {
  const el = document.createElement('span');
  el.className = cls;
  el.textContent = text;
  parent.appendChild(el);
  return el;
}

/**
 * iOS-style pill toggle switch.
 * @param {HTMLElement} parent - element to append into (or null to just return)
 * @param {boolean} checked
 * @param {function} onChange
 */
function _switch(parent, checked, onChange) {
  const label = document.createElement('label');
  label.className = 'tr-switch';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = checked;
  input.addEventListener('change', () => onChange(input.checked));
  const track = document.createElement('span');
  track.className = 'tr-switch-track';
  label.appendChild(input);
  label.appendChild(track);
  if (parent) parent.appendChild(label);
  return label;
}

/**
 * Small inline checkbox + label combo (for header toggles).
 */
function _inlineToggle(parent, text, checked, onChange) {
  const wrap = document.createElement('label');
  wrap.className = 'tr-inline-toggle';
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = checked;
  cb.addEventListener('change', () => onChange(cb.checked));
  wrap.appendChild(cb);
  const sp = document.createElement('span');
  sp.textContent = text;
  wrap.appendChild(sp);
  parent.appendChild(wrap);
  return wrap;
}
