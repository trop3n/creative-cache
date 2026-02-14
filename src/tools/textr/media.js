// ============================================================
// Media Handling - TEXTR Tool
// Font loading and drag-drop functionality
// ============================================================

import { customFont } from './state.js';
import { importPreset } from './presets.js';

export function setupMedia(callbacks) {
  const container = document.getElementById('canvas-container');
  const fileInput = document.getElementById('fileInput');
  const dropIndicator = container?.querySelector('.drop-indicator');
  
  if (!container || !fileInput) {
    console.warn('Media elements not found');
    return {};
  }
  
  // File input change handler
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file, callbacks);
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
    if (file) handleFile(file, callbacks);
  });
  
  return {
    triggerFileSelect: () => fileInput.click(),
  };
}

async function handleFile(file, callbacks) {
  const name = file.name.toLowerCase();
  const type = file.type;
  
  try {
    if (name.endsWith('.json')) {
      // Load preset
      callbacks.onSuccess?.('Loading preset...');
      const text = await file.text();
      const success = importPreset(text);
      
      if (success) {
        callbacks.onPresetLoaded?.();
        callbacks.onSuccess?.('Preset loaded!');
      } else {
        callbacks.onError?.('Invalid preset file');
      }
      
    } else if (
      name.endsWith('.ttf') ||
      name.endsWith('.otf') ||
      name.endsWith('.woff') ||
      name.endsWith('.woff2')
    ) {
      // Load font
      callbacks.onSuccess?.('Loading font...');
      await loadCustomFont(file, callbacks);
      
    } else {
      callbacks.onError?.('Unsupported file type');
    }
  } catch (err) {
    console.error('File loading error:', err);
    callbacks.onError?.('Failed to load file');
  }
}

async function loadCustomFont(file, callbacks) {
  try {
    const fontName = file.name.replace(/\.[^/.]+$/, '');
    const arrayBuffer = await file.arrayBuffer();
    
    // Create font face
    const fontFace = new FontFace(fontName, arrayBuffer);
    const loadedFace = await fontFace.load();
    document.fonts.add(loadedFace);
    
    // Update custom font state
    customFont.name = fontName;
    customFont.data = arrayBuffer;
    customFont.loaded = true;
    
    callbacks.onFontLoaded?.();
    callbacks.onSuccess?.(`Font loaded: ${fontName}`);
    
  } catch (err) {
    console.error('Font loading error:', err);
    callbacks.onError?.('Failed to load font');
  }
}

// Load a Google Font by name
export async function loadGoogleFont(fontName) {
  try {
    // Add Google Fonts stylesheet
    const linkId = 'google-fonts-link';
    let link = document.getElementById(linkId);
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    
    // Construct URL for the font family
    const fontFamily = fontName.replace(/\s+/g, '+');
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
    
    // Wait for font to load
    await document.fonts.ready;
    
    return true;
  } catch (err) {
    console.error('Google Font loading error:', err);
    return false;
  }
}
