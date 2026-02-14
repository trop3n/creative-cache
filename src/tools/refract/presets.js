// ============================================================
// Preset Management for REFRACT Tool
// ============================================================

import { distortion, processing, canvas, cloneState, applyState } from './state.js';

// Built-in presets
export const builtinPresets = {
  'Liquid Glass': {
    distortion: {
      type: 'refraction',
      amount: 0.6,
      scale: 2.5,
      refraction: {
        index: 1.8,
        thickness: 0.4,
        chromaticAberration: 0.15,
      },
    },
    processing: {
      brightness: 1.05,
      contrast: 1.1,
      saturation: 1.2,
    },
  },
  
  'Water Ripple': {
    distortion: {
      type: 'ripple',
      amount: 0.8,
      ripple: {
        frequency: 15,
        amplitude: 0.15,
        phase: 0,
        centerX: 0.5,
        centerY: 0.5,
        damping: 0.4,
      },
    },
    processing: {
      brightness: 1.0,
      contrast: 1.0,
      saturation: 1.1,
    },
  },
  
  'Heat Wave': {
    distortion: {
      type: 'wave',
      amount: 0.7,
      scale: 1.0,
      wave: {
        frequencyX: 20,
        frequencyY: 5,
        amplitudeX: 0.08,
        amplitudeY: 0.02,
        phase: 0,
      },
    },
    processing: {
      brightness: 1.1,
      contrast: 0.95,
      saturation: 0.9,
    },
  },
  
  'Magnifying Glass': {
    distortion: {
      type: 'lens',
      amount: 1.0,
      lens: {
        strength: 1.5,
        radius: 0.35,
        centerX: 0.5,
        centerY: 0.5,
      },
    },
    processing: {
      brightness: 1.15,
      contrast: 1.1,
      saturation: 1.1,
    },
  },
  
  'Swirl Vortex': {
    distortion: {
      type: 'twirl',
      amount: 1.0,
      twirl: {
        angle: 360,
        radius: 0.5,
        centerX: 0.5,
        centerY: 0.5,
      },
    },
    processing: {
      brightness: 1.0,
      contrast: 1.05,
      saturation: 1.15,
    },
  },
  
  'Barrel Distortion': {
    distortion: {
      type: 'barrel',
      amount: 1.0,
      barrel: {
        strength: 0.5,
      },
    },
    processing: {
      brightness: 1.0,
      contrast: 1.0,
      saturation: 1.0,
    },
  },
  
  'Noise Displacement': {
    distortion: {
      type: 'displacement',
      amount: 0.4,
      scale: 3.0,
      displacement: {
        source: 'noise',
        noiseType: 'simplex',
        intensity: 0.6,
        offsetX: 0,
        offsetY: 0,
        animate: true,
        speed: 0.3,
      },
    },
    processing: {
      brightness: 1.0,
      contrast: 1.1,
      saturation: 1.0,
    },
  },
  
  'Checkerboard Warp': {
    distortion: {
      type: 'displacement',
      amount: 0.5,
      scale: 2.0,
      displacement: {
        source: 'checker',
        intensity: 0.4,
        offsetX: 0,
        offsetY: 0,
        animate: false,
        speed: 0,
      },
    },
    processing: {
      brightness: 1.0,
      contrast: 1.2,
      saturation: 0.9,
    },
  },
  
  'Fish Eye': {
    distortion: {
      type: 'pinch',
      amount: 1.0,
      pinch: {
        strength: -0.8,
        radius: 0.6,
        centerX: 0.5,
        centerY: 0.5,
      },
    },
    processing: {
      brightness: 1.1,
      contrast: 1.15,
      saturation: 1.2,
    },
  },
  
  'Pincushion': {
    distortion: {
      type: 'pinch',
      amount: 1.0,
      pinch: {
        strength: 0.7,
        radius: 0.5,
        centerX: 0.5,
        centerY: 0.5,
      },
    },
    processing: {
      brightness: 1.0,
      contrast: 1.1,
      saturation: 0.95,
    },
  },
};

// User presets storage
let userPresets = {};

// Load user presets from localStorage
try {
  const saved = localStorage.getItem('refract_user_presets');
  if (saved) {
    userPresets = JSON.parse(saved);
  }
} catch (e) {
  console.warn('Could not load user presets:', e);
}

// Get preset names for dropdown
export const presetNames = Object.keys(builtinPresets);
export const userPresetNames = () => Object.keys(userPresets);

// Build options object for Tweakpane
export const presetOptions = {
  '** User Preset **': '** User Preset **',
  ...Object.fromEntries(Object.keys(builtinPresets).map(k => [k, k])),
  ...(Object.keys(userPresets).length > 0 ? { '---': '---' } : {}),
  ...Object.fromEntries(Object.keys(userPresets).map(k => [k, k])),
};

// Load a preset
export function loadPreset(name) {
  if (name === '** User Preset **') return false;
  if (name === '---') return false;
  
  let presetData;
  if (builtinPresets[name]) {
    presetData = builtinPresets[name];
  } else if (userPresets[name]) {
    presetData = userPresets[name];
  } else {
    return false;
  }
  
  // Apply preset data
  if (presetData.distortion) {
    applyState(distortion, presetData.distortion);
  }
  if (presetData.processing) {
    applyState(processing, presetData.processing);
  }
  
  return true;
}

// Save current settings as user preset
export function saveUserPreset(name) {
  if (!name || name === '** User Preset **' || name === '---') {
    // Generate unique name
    let i = 1;
    name = `User Preset ${i}`;
    while (userPresets[name]) {
      i++;
      name = `User Preset ${i}`;
    }
  }
  
  userPresets[name] = {
    distortion: cloneState(distortion),
    processing: cloneState(processing),
  };
  
  // Save to localStorage
  try {
    localStorage.setItem('refract_user_presets', JSON.stringify(userPresets));
  } catch (e) {
    console.warn('Could not save user presets:', e);
  }
  
  return name;
}

// Delete a user preset
export function deleteUserPreset(name) {
  if (userPresets[name]) {
    delete userPresets[name];
    try {
      localStorage.setItem('refract_user_presets', JSON.stringify(userPresets));
    } catch (e) {
      console.warn('Could not save user presets:', e);
    }
    return true;
  }
  return false;
}

// Export preset to JSON string
export function exportPreset() {
  const data = {
    distortion: cloneState(distortion),
    processing: cloneState(processing),
    canvas: {
      ratio: canvas.ratio,
      scale: canvas.scale,
    },
  };
  return JSON.stringify(data, null, 2);
}

// Import preset from JSON string
export function importPreset(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    
    if (data.distortion) {
      applyState(distortion, data.distortion);
    }
    if (data.processing) {
      applyState(processing, data.processing);
    }
    if (data.canvas) {
      if (data.canvas.ratio) canvas.ratio = data.canvas.ratio;
      if (data.canvas.scale !== undefined) canvas.scale = data.canvas.scale;
    }
    
    return true;
  } catch (e) {
    console.error('Failed to import preset:', e);
    return false;
  }
}

// Refresh preset options (call after adding/deleting user presets)
export function refreshPresetOptions() {
  Object.assign(presetOptions, {
    '** User Preset **': '** User Preset **',
    ...Object.fromEntries(Object.keys(builtinPresets).map(k => [k, k])),
    ...(Object.keys(userPresets).length > 0 ? { '---': '---' } : {}),
    ...Object.fromEntries(Object.keys(userPresets).map(k => [k, k])),
  });
}
