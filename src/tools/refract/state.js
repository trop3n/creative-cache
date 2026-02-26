// ============================================================
// REFRACT Tool — State
// ============================================================

export const canvas = {
  width:          1024,
  height:         1024,
  ratio:          '1:1',
  preset:         'Preset 1',
  textureWrap:    'mirror',   // 'mirror' | 'repeat' | 'clamp'
  contentScaleX:  1.0,
  contentScaleY:  1.0,
  background:     'custom',   // 'custom' | 'transparent'
  canvasColor:    '#ffffff',
};

export const options = {
  margin:       16,           // px — blank space around preview canvas
  browserColor: '#1a1a1a',    // background of non-rendered area
  maxImageSize: 2048,         // buffer cap, range 1024–4096
};

export const transform = {
  displaceType: 'box',        // 'box' | 'flow' | 'sine'
  seed:         601,
  box: {
    x: { amplify: 3.0, frequency:  8.0, speed: 0.0 },
    y: { amplify: 3.0, frequency:  8.0, speed: 0.0 },
  },
  flow: {
    complexity:  3,
    frequency:   3.0,
    x: { amplify: 5.0, speed: 0.0 },
    y: { amplify: 5.0, speed: 0.0 },
  },
  sine: {
    x: { amplify: 3.0, frequency:  8.0, speed: 0.0 },
    y: { amplify: 3.0, frequency:  8.0, speed: 0.0 },
  },
};

export const refract = {
  type: 'none',               // 'none' | 'grid'
  grid: {
    x: { skewLevel: 1.25, gridAmount: 20 },
    y: { skewLevel: 1.25, gridAmount: 20 },
  },
};

export const animation = {
  playing: false,
};

export const exportSettings = {
  status:  'Ready',
  format:  'png',
  quality: 0.95,
  scale:   1,
};

export const media = {
  type:   null,
  source: null,
  fileName: '',
};

// Dropdown option maps for Tweakpane
export const textureWrapOptions  = { Mirror: 'mirror', Repeat: 'repeat', Clamp: 'clamp' };
export const backgroundOptions   = { Custom: 'custom', Transparent: 'transparent' };
export const displaceTypeOptions = { 'Box Displace': 'box', 'Flow Displace': 'flow', 'Sine Displace': 'sine' };
export const refractTypeOptions  = { None: 'none', Grid: 'grid' };

/**
 * Deep clone a state object.
 */
export function cloneState(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Deep merge source onto target.
 */
export function applyState(target, source) {
  for (const key of Object.keys(source)) {
    if (
      typeof source[key] === 'object' && source[key] !== null &&
      !Array.isArray(source[key]) &&
      typeof target[key] === 'object' && target[key] !== null
    ) {
      applyState(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}
