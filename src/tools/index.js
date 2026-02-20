// ============================================================
// Creative Suite - Tool Registry
// ============================================================

/**
 * Tool Configuration:
 * - id: unique identifier
 * - name: display name
 * - description: short description
 * - accept: file input accept attribute
 * - load: async function that loads and returns the tool instance
 */

export const tools = {
  dither: {
    id: 'dither',
    name: 'DITHR',
    description: 'Image dithering & effects',
    accept: 'image/*,video/*',
    load: async (canvasContainer, paneContainer) => {
      const { loadDitherTool } = await import('./dither/index.js');
      return loadDitherTool(canvasContainer, paneContainer);
    }
  },
  
  flake: {
    id: 'flake',
    name: 'FLAKE',
    description: 'Generative grid patterns',
    accept: '.svg,image/*',
    load: async (canvasContainer, paneContainer) => {
      const { loadFlakeTool } = await import('./flake/index.js');
      return loadFlakeTool(canvasContainer, paneContainer);
    }
  },
  
  refract: {
    id: 'refract',
    name: 'REFRACT',
    description: 'Image displacement & refraction',
    accept: 'image/*,.json',
    load: async (canvasContainer, paneContainer) => {
      const { loadRefractTool } = await import('./refract/index.js');
      return loadRefractTool(canvasContainer, paneContainer);
    }
  },
  
  split: {
    id: 'split',
    name: 'SPLITX',
    description: 'Generative vector art',
    accept: '.svg,.json',
    load: async (canvasContainer, paneContainer) => {
      const { loadSplitTool } = await import('./split/index.js');
      return loadSplitTool(canvasContainer, paneContainer);
    }
  },
  
  textr: {
    id: 'textr',
    name: 'TEXTR',
    description: 'Typography generator',
    accept: '.ttf,.otf,.woff,.woff2,.json',
    load: async (canvasContainer, paneContainer) => {
      const { loadTextrTool } = await import('./textr/index.js');
      return loadTextrTool(canvasContainer, paneContainer);
    }
  },
  
  rhythm: {
    id: 'rhythm',
    name: 'RITM',
    description: 'Waveform visualizer',
    accept: '.json',
    load: async (canvasContainer, paneContainer) => {
      const { loadRhythmTool } = await import('./rhythm/index.js');
      return loadRhythmTool(canvasContainer, paneContainer);
    }
  },

  boids: {
    id: 'boids',
    name: 'BOIDS',
    description: 'Flocking simulation',
    accept: '.json',
    load: async (canvasContainer, paneContainer) => {
      const { loadBoidsTool } = await import('./boids/index.js');
      return loadBoidsTool(canvasContainer, paneContainer);
    }
  }
};

// Tool order for navigation
export const toolOrder = ['dither', 'flake', 'refract', 'split', 'textr', 'rhythm', 'boids'];
