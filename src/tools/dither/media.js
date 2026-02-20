// ============================================================
// Media Handling - Image upload, video, drag-drop
// ============================================================

import { media } from './state.js';

/**
 * Set up drag-and-drop media input on the canvas container.
 * File input changes are handled globally by src/main.js which calls handleFile directly.
 * @param {p5} p - p5 instance
 * @param {Function} onLoaded - callback(type, source) when media is loaded
 */
export function setupMedia(p, onLoaded) {
  const container = document.getElementById('canvas-wrapper');

  // Drag and drop on canvas container
  if (container) {
    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      container.style.outline = '2px solid #666';
    });

    container.addEventListener('dragleave', (e) => {
      e.preventDefault();
      container.style.outline = '';
    });

    container.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      container.style.outline = '';

      const file = e.dataTransfer.files[0];
      if (file) handleFile(p, file, onLoaded);
    });
  }
}

/**
 * Handle a File object - determine if image or video and load it.
 * Exported so index.js can call it directly from the tool's handleFile callback.
 */
export function handleFile(p, file, onLoaded) {
  const type = file.type;
  media.fileName = file.name;

  if (type.startsWith('image/')) {
    loadImage(p, file, onLoaded);
  } else if (type.startsWith('video/')) {
    loadVideo(file, onLoaded);
  } else if (file.name.endsWith('.json')) {
    loadPresetFile(file);
  } else {
    console.warn('Unsupported file type:', type);
  }
}

/**
 * Load an image file into p5.Image.
 */
function loadImage(p, file, onLoaded) {
  const url = URL.createObjectURL(file);
  p.loadImage(url, (img) => {
    URL.revokeObjectURL(url);
    onLoaded('image', img);
  }, () => {
    URL.revokeObjectURL(url);
    console.error('Failed to load image');
  });
}

/**
 * Load a video file into an HTML video element.
 */
function loadVideo(file, onLoaded) {
  // Clean up old video
  if (media.video) {
    media.video.pause();
    if (media.video.parentNode) {
      media.video.parentNode.removeChild(media.video);
    }
  }

  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.src = url;
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.style.display = 'none';
  document.body.appendChild(video);

  video.addEventListener('loadeddata', () => {
    video.play();
    onLoaded('video', video);
  }, { once: true });

  video.addEventListener('error', () => {
    URL.revokeObjectURL(url);
    console.error('Failed to load video');
  }, { once: true });

  video.load();
}

/**
 * Load a preset JSON file.
 */
function loadPresetFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      // Import preset - dispatched via custom event
      window.dispatchEvent(new CustomEvent('dithr-import-preset', { detail: data }));
    } catch (err) {
      console.error('Failed to parse preset file:', err);
    }
  };
  reader.readAsText(file);
}
