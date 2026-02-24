// ============================================================
// Creative Suite - Main Entry Point
// ============================================================

import { tools } from './tools/index.js';

// ============================================================
// State Management
// ============================================================

const state = {
  currentTool: null,
  currentToolId: null,
  p5Instance: null,
  uiInstance: null,
  isTransitioning: false
};

// ============================================================
// DOM Elements
// ============================================================

const elements = {
  canvasWrapper: document.getElementById('canvas-wrapper'),
  paneWrapper: document.getElementById('pane-wrapper'),
  toolButtons: document.querySelectorAll('.tool-btn'),
  fileInput: document.getElementById('fileInput')
};

// ============================================================
// Tool Loading
// ============================================================

async function loadTool(toolId) {
  if (state.isTransitioning) return;
  if (state.currentToolId === toolId) return;
  
  state.isTransitioning = true;
  
  // Show loading state
  showLoading();
  
  // Cleanup current tool
  await cleanupCurrentTool();
  
  // Get tool configuration
  const toolConfig = tools[toolId];
  if (!toolConfig) {
    console.error(`Tool "${toolId}" not found`);
    state.isTransitioning = false;
    return;
  }
  
  try {
    // Update UI
    updateActiveButton(toolId);
    
    // Configure file input for this tool
    configureFileInput(toolConfig);
    
    // Load the tool
    const tool = await toolConfig.load(elements.canvasWrapper, elements.paneWrapper);
    
    state.currentTool = tool;
    state.currentToolId = toolId;
    state.p5Instance = tool.p5Instance || null;
    state.uiInstance = tool.uiInstance || null;
    
    // Update document title
    document.title = `${toolConfig.name} - Creative Suite`;
    
  } catch (error) {
    console.error('Failed to load tool:', error);
    showError('Failed to load tool. Please try again.');
  } finally {
    hideLoading();
    state.isTransitioning = false;
  }
}

async function cleanupCurrentTool() {
  // Cleanup tool (stops media, releases resources)
  if (state.currentTool && state.currentTool.dispose) {
    state.currentTool.dispose();
  }

  // Cleanup p5 instance
  if (state.p5Instance) {
    state.p5Instance.remove();
  }

  // Clear containers
  elements.canvasWrapper.innerHTML = '';
  elements.paneWrapper.innerHTML = '';

  // Reset state
  state.currentTool = null;
  state.p5Instance = null;
  state.uiInstance = null;
}

// ============================================================
// UI Management
// ============================================================

function updateActiveButton(toolId) {
  elements.toolButtons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.tool === toolId) {
      btn.classList.add('active');
    }
  });
}

function showLoading() {
  elements.canvasWrapper.innerHTML = `
    <div class="tool-loading">
      <div>Loading tool...</div>
    </div>
  `;
}

function hideLoading() {
  const loading = elements.canvasWrapper.querySelector('.tool-loading');
  if (loading) {
    loading.remove();
  }
}

function showError(message) {
  elements.canvasWrapper.innerHTML = `
    <div class="tool-loading">
      <div style="color: #ff6b6b;">⚠ ${message}</div>
    </div>
  `;
}

function configureFileInput(toolConfig) {
  const input = elements.fileInput;
  input.accept = toolConfig.accept || '*';
  input.multiple = toolConfig.multiple || false;
}

// ============================================================
// Event Handlers
// ============================================================

function setupEventListeners() {
  // Tool button clicks
  elements.toolButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const toolId = btn.dataset.tool;
      loadTool(toolId);
    });
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Cmd/Ctrl + number to switch tools
    if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '8') {
      e.preventDefault();
      const toolIds = ['dither', 'flake', 'refract', 'split', 'textr', 'rhythm', 'boids', 'track'];
      const index = parseInt(e.key) - 1;
      if (toolIds[index]) {
        loadTool(toolIds[index]);
      }
    }
  });
  
  // File input change
  elements.fileInput.addEventListener('change', (e) => {
    if (state.currentTool && state.currentTool.handleFile) {
      const file = e.target.files[0];
      if (file) {
        state.currentTool.handleFile(file);
      }
    }
    e.target.value = ''; // Reset for next selection
  });
  
  // Global drag and drop prevention (except for tool containers)
  document.addEventListener('dragover', (e) => {
    if (!e.target.closest('#canvas-wrapper')) {
      e.preventDefault();
    }
  });
  
  document.addEventListener('drop', (e) => {
    if (!e.target.closest('#canvas-wrapper')) {
      e.preventDefault();
    }
  });
}

// ============================================================
// Electron Integration
// ============================================================

function setupElectronIntegration() {
  // Check if running in Electron
  if (typeof window.electronAPI !== 'undefined') {
    console.log('Running in Electron');
    
    // Listen for menu events
    window.electronAPI.onSwitchTool((event, toolId) => {
      loadTool(toolId);
    });
    
    window.electronAPI.onOpenFile((event, filePath) => {
      // Handle file open from menu
      console.log('Open file:', filePath);
    });
    
    window.electronAPI.onMenuSaveExport(() => {
      // Trigger save export on current tool
      console.log('Save export requested');
    });
  }
}

// ============================================================
// Public API for Tools
// ============================================================

export function triggerFileUpload() {
  elements.fileInput.click();
}

export function getCurrentTool() {
  return state.currentTool;
}

export function getCurrentToolId() {
  return state.currentToolId;
}

// ============================================================
// Canvas Fitting — scale canvas CSS dimensions to fill wrapper
// ============================================================

let _canvasAttrObserver = null;

function fitCanvasToWrapper() {
  const canvas = elements.canvasWrapper.querySelector('canvas');
  if (!canvas || !canvas.width || !canvas.height) return;

  // Leave 16px on each side so the box-shadow isn't flush against the panel edges
  const margin = 32;
  const availW = elements.canvasWrapper.clientWidth  - margin;
  const availH = elements.canvasWrapper.clientHeight - margin;

  const scale = Math.min(availW / canvas.width, availH / canvas.height);
  canvas.style.width  = `${Math.round(canvas.width  * scale)}px`;
  canvas.style.height = `${Math.round(canvas.height * scale)}px`;
}

function setupCanvasFitting() {
  // Re-fit whenever the wrapper itself is resized (window resize, panel toggle, etc.)
  const resizeObserver = new ResizeObserver(fitCanvasToWrapper);
  resizeObserver.observe(elements.canvasWrapper);

  // Re-fit whenever a canvas is added/removed or its buffer dimensions change
  const mutationObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.removedNodes) {
        if (node.tagName === 'CANVAS') {
          _canvasAttrObserver?.disconnect();
          _canvasAttrObserver = null;
        }
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === 'CANVAS') {
          fitCanvasToWrapper();
          _canvasAttrObserver?.disconnect();
          _canvasAttrObserver = new MutationObserver(fitCanvasToWrapper);
          _canvasAttrObserver.observe(node, { attributes: true, attributeFilter: ['width', 'height'] });
        }
      }
    }
  });
  mutationObserver.observe(elements.canvasWrapper, { childList: true });
}

// ============================================================
// Initialization
// ============================================================

function init() {
  setupEventListeners();
  setupElectronIntegration();
  setupCanvasFitting();

  // Load first tool (Dither)
  loadTool('dither');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
