// ============================================================
// Media Handling - Image loading, drag-drop, and file input
// ============================================================

import { media } from './state.js';

/**
 * Set up media handling including drag-drop and file input.
 */
export function setupMedia(p, container, onMediaLoaded) {
  const fileInput = document.getElementById('fileInput');
  const dropIndicator = container?.querySelector('.drop-indicator');

  if (!container || !fileInput) return;
  
  // File input change handler
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFile(p, file, onMediaLoaded);
    fileInput.value = '';
  });
  
  // Drag events
  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    container.classList.add('drag-over');
    if (dropIndicator) dropIndicator.classList.add('visible');
  });
  
  container.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    container.classList.remove('drag-over');
    if (dropIndicator) dropIndicator.classList.remove('visible');
  });
  
  container.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    container.classList.remove('drag-over');
    if (dropIndicator) dropIndicator.classList.remove('visible');
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(p, file, onMediaLoaded);
  });
  
  // Handle paste from clipboard
  document.addEventListener('paste', (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) handleFile(p, file, onMediaLoaded);
        break;
      }
    }
  });
}

/**
 * Handle a dropped or selected file.
 */
async function handleFile(p, file, onMediaLoaded) {
  const name = file.name.toLowerCase();
  const type = file.type;
  
  // Handle preset JSON files
  if (name.endsWith('.json')) {
    handlePresetFile(file);
    return;
  }
  
  // Handle image files
  if (type.startsWith('image/')) {
    await handleImageFile(p, file, onMediaLoaded);
    return;
  }
  
  console.warn('Unsupported file type:', type);
}

/**
 * Handle image file loading.
 */
async function handleImageFile(p, file, onMediaLoaded) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    
    p.loadImage(url, 
      (img) => {
        URL.revokeObjectURL(url);
        
        // Store media info
        media.type = 'image';
        media.source = img;
        media.fileName = file.name;
        
        onMediaLoaded?.('image', img);
        resolve(img);
      },
      () => {
        URL.revokeObjectURL(url);
        console.error('Failed to load image:', file.name);
        reject(new Error('Failed to load image'));
      }
    );
  });
}

/**
 * Handle preset JSON file.
 */
function handlePresetFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const json = e.target.result;
      // Dispatch custom event for preset import
      window.dispatchEvent(new CustomEvent('refract-import-preset', { 
        detail: JSON.parse(json) 
      }));
    } catch (err) {
      console.error('Failed to parse preset file:', err);
    }
  };
  reader.readAsText(file);
}

/**
 * Load an image from URL (for testing or samples).
 */
export function loadImageFromURL(p, url, onMediaLoaded) {
  return new Promise((resolve, reject) => {
    p.loadImage(url,
      (img) => {
        media.type = 'image';
        media.source = img;
        media.fileName = url.split('/').pop() || 'image.jpg';
        onMediaLoaded?.('image', img);
        resolve(img);
      },
      () => {
        console.error('Failed to load image from URL:', url);
        reject(new Error('Failed to load image'));
      }
    );
  });
}

/**
 * Load a displacement map image.
 */
export function loadDisplacementMap(p, file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    
    p.loadImage(url,
      (img) => {
        URL.revokeObjectURL(url);
        media.displacementMap = img;
        resolve(img);
      },
      () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load displacement map'));
      }
    );
  });
}

/**
 * Create a placeholder gradient image.
 */
export function createPlaceholderImage(p, w, h) {
  const img = p.createImage(w, h);
  img.loadPixels();
  
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      
      // Create a colorful gradient pattern
      const t = (x + y) / (w + h);
      const angle = Math.atan2(y - h/2, x - w/2);
      const dist = Math.sqrt((x - w/2)**2 + (y - h/2)**2) / Math.min(w, h);
      
      img.pixels[idx] = Math.floor(128 + 127 * Math.sin(t * Math.PI * 2));
      img.pixels[idx + 1] = Math.floor(128 + 127 * Math.cos(angle * 3));
      img.pixels[idx + 2] = Math.floor(255 * (1 - dist));
      img.pixels[idx + 3] = 255;
    }
  }
  
  img.updatePixels();
  return img;
}

/**
 * Resize image to fit within max dimensions while preserving aspect ratio.
 */
export function resizeImageToFit(img, maxWidth, maxHeight) {
  const aspect = img.width / img.height;
  let w = img.width;
  let h = img.height;
  
  if (w > maxWidth) {
    w = maxWidth;
    h = w / aspect;
  }
  if (h > maxHeight) {
    h = maxHeight;
    w = h * aspect;
  }
  
  // Ensure even dimensions for WebGL
  w = Math.floor(w) - (Math.floor(w) % 2);
  h = Math.floor(h) - (Math.floor(h) % 2);
  
  return { width: Math.max(w, 2), height: Math.max(h, 2) };
}
