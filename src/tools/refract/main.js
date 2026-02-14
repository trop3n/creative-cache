// ============================================================
// Main Entry Point - REFRACT Tool
// p5.js Instance Mode + WebGL Shader Pipeline
// ============================================================

import p5 from 'p5';
import { 
  vertShader, displacementFrag, refractionFrag, rippleFrag, 
  waveFrag, pinchFrag, twirlFrag, lensFrag, barrelFrag, processFrag 
} from './shaders.js';
import { canvas, distortion, processing, animation, exportSettings, media, resolutions } from './state.js';
import { setupUI, refreshUI, setStatus } from './ui.js';
import { setupMedia, createPlaceholderImage, resizeImageToFit } from './media.js';

const sketch = (p) => {
  // --- Buffers & Shaders ---
  let srcBuffer = null;      // Source image buffer
  let mainBuffer = null;     // Main WebGL buffer for distortion
  let processBuffer = null;  // Buffer for post-processing
  
  // Shader objects
  let displacementShader = null;
  let refractionShader = null;
  let rippleShader = null;
  let waveShader = null;
  let pinchShader = null;
  let twirlShader = null;
  let lensShader = null;
  let barrelShader = null;
  let processShader = null;
  
  // --- State ---
  let isSetup = false;
  let needsResize = true;
  let animationTime = 0;
  let lastFrameTime = 0;
  
  // Expose p instance for other modules
  window._p5Instance = p;
  
  p.setup = async () => {
    // Calculate initial canvas size
    calculateCanvasSize();
    
    // Create main canvas
    const cnv = p.createCanvas(canvas.width, canvas.height);
    cnv.parent('canvas-container');
    p.pixelDensity(1);
    
    // Create WebGL buffers
    createBuffers(canvas.width, canvas.height);
    
    // Create placeholder image
    createPlaceholder();
    
    // Set up media handling
    setupMedia(p, handleMediaLoaded);
    
    // Set up Tweakpane UI
    setupUI(p, {
      onParamChange: () => p.redraw(),
      onResize: () => { needsResize = true; },
      onAnimationChange: handleAnimationChange,
      onMediaUpload: triggerFileUpload,
      onExport: handleExport,
    });
    
    // Initial animation state
    handleAnimationChange();
    
    isSetup = true;
  };
  
  /**
   * Create WebGL buffers and compile shaders.
   */
  function createBuffers(w, h) {
    // Clean up old buffers
    if (mainBuffer) mainBuffer.remove();
    if (processBuffer) processBuffer.remove();
    
    // Create new buffers
    mainBuffer = p.createGraphics(w, h, p.WEBGL);
    processBuffer = p.createGraphics(w, h, p.WEBGL);
    
    for (const buf of [mainBuffer, processBuffer]) {
      buf.pixelDensity(1);
    }
    
    // Compile shaders
    displacementShader = mainBuffer.createShader(vertShader, displacementFrag);
    refractionShader = mainBuffer.createShader(vertShader, refractionFrag);
    rippleShader = mainBuffer.createShader(vertShader, rippleFrag);
    waveShader = mainBuffer.createShader(vertShader, waveFrag);
    pinchShader = mainBuffer.createShader(vertShader, pinchFrag);
    twirlShader = mainBuffer.createShader(vertShader, twirlFrag);
    lensShader = mainBuffer.createShader(vertShader, lensFrag);
    barrelShader = mainBuffer.createShader(vertShader, barrelFrag);
    processShader = processBuffer.createShader(vertShader, processFrag);
  }
  
  /**
   * Create a placeholder image for initial display.
   */
  function createPlaceholder() {
    const img = createPlaceholderImage(p, canvas.width, canvas.height);
    
    srcBuffer = p.createGraphics(canvas.width, canvas.height);
    srcBuffer.pixelDensity(1);
    srcBuffer.image(img, 0, 0, canvas.width, canvas.height);
    
    media.type = 'image';
    media.source = img;
  }
  
  /**
   * Handle loaded media.
   */
  function handleMediaLoaded(type, source) {
    media.type = type;
    media.source = source;
    
    // Resize canvas to fit media aspect ratio
    resizeForMedia(source);
    needsResize = true;
  }
  
  /**
   * Resize canvas and buffers to fit media.
   */
  function resizeForMedia(source) {
    let srcW, srcH;
    if (source && source.width) {
      srcW = source.width;
      srcH = source.height;
    } else {
      srcW = 640;
      srcH = 480;
    }
    
    // Determine appropriate ratio based on image dimensions
    const aspect = srcW / srcH;
    let closestRatio = '1:1';
    let closestDiff = Infinity;
    
    for (const [name, dims] of Object.entries(resolutions)) {
      const ratio = dims.width / dims.height;
      const diff = Math.abs(ratio - aspect);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestRatio = name;
      }
    }
    
    canvas.ratio = closestRatio;
    calculateCanvasSize();
    
    // Recreate buffers at new size
    createBuffers(canvas.width, canvas.height);
    
    // Recreate source buffer
    if (srcBuffer) srcBuffer.remove();
    srcBuffer = p.createGraphics(canvas.width, canvas.height);
    srcBuffer.pixelDensity(1);
    
    // Draw source into buffer
    updateSourceImage();
    
    p.resizeCanvas(canvas.width, canvas.height);
  }
  
  /**
   * Calculate canvas dimensions from ratio and scale.
   */
  function calculateCanvasSize() {
    const [rw, rh] = canvas.ratio.split(':').map(Number);
    const maxRes = resolutions[canvas.ratio] || { width: 1280, height: 1280 };
    const panelW = canvas.panelWidth;
    
    const availW = (window.innerWidth - panelW) * canvas.scale;
    const availH = window.innerHeight * canvas.scale;
    
    const aspectRatio = rw / rh;
    let w = availW;
    let h = w / aspectRatio;
    
    if (h > availH) {
      h = availH;
      w = h * aspectRatio;
    }
    
    // Cap at max resolution
    w = Math.min(w, maxRes.width);
    h = Math.min(h, maxRes.height);
    
    // Ensure even dimensions
    w = Math.floor(w) - (Math.floor(w) % 2);
    h = Math.floor(h) - (Math.floor(h) % 2);
    
    // Minimum size
    w = Math.max(w, 320);
    h = Math.max(h, 320);
    
    canvas.width = w;
    canvas.height = h;
  }
  
  /**
   * Update source image buffer from current media.
   */
  function updateSourceImage() {
    if (!srcBuffer || !media.source) return;
    srcBuffer.image(media.source, 0, 0, srcBuffer.width, srcBuffer.height);
  }
  
  /**
   * Handle animation state changes.
   */
  function handleAnimationChange() {
    if (animation.enabled && animation.playing) {
      p.loop();
    } else {
      p.noLoop();
      p.redraw();
    }
  }
  
  /**
   * Trigger file upload dialog.
   */
  function triggerFileUpload() {
    const input = document.getElementById('fileInput');
    if (input) input.click();
  }
  
  /**
   * Handle image export.
   */
  function handleExport() {
    setStatus('Exporting...');
    
    const mult = exportSettings.scale;
    const format = exportSettings.format;
    
    if (mult === 1) {
      // Simple export at current resolution
      p.saveCanvas(`refract-export.${format}`, format);
      setStatus('Exported!');
      setTimeout(() => setStatus('Ready'), 2000);
      return;
    }
    
    // High-res export
    const expW = canvas.width * mult;
    const expH = canvas.height * mult;
    
    // Create high-res buffers
    const expMainBuffer = p.createGraphics(expW, expH, p.WEBGL);
    const expProcessBuffer = p.createGraphics(expW, expH, p.WEBGL);
    expMainBuffer.pixelDensity(1);
    expProcessBuffer.pixelDensity(1);
    
    // Create high-res source buffer
    const expSrcBuffer = p.createGraphics(expW, expH);
    expSrcBuffer.pixelDensity(1);
    expSrcBuffer.image(media.source, 0, 0, expW, expH);
    
    // Compile shader for high-res
    const expShader = expMainBuffer.createShader(vertShader, getCurrentShaderSource());
    
    // Render at high resolution
    renderEffect(expSrcBuffer, expMainBuffer, expShader, expW, expH, 0);
    
    // Apply processing if needed
    if (processing.brightness !== 1.0 || processing.contrast !== 1.0 || 
        processing.saturation !== 1.0 || processing.hue !== 0) {
      const expProcessShader = expProcessBuffer.createShader(vertShader, processFrag);
      expProcessBuffer.shader(expProcessShader);
      expProcessShader.setUniform('u_image', expMainBuffer);
      expProcessShader.setUniform('u_resolution', [expW, expH]);
      expProcessShader.setUniform('u_brightness', processing.brightness);
      expProcessShader.setUniform('u_contrast', processing.contrast);
      expProcessShader.setUniform('u_saturation', processing.saturation);
      expProcessShader.setUniform('u_hue', processing.hue);
      expProcessBuffer.rect(-expW / 2, -expH / 2, expW, expH);
      expProcessBuffer.save(`refract-export.${format}`, format);
    } else {
      expMainBuffer.save(`refract-export.${format}`, format);
    }
    
    // Cleanup
    expMainBuffer.remove();
    expProcessBuffer.remove();
    expSrcBuffer.remove();
    
    setStatus('Exported!');
    setTimeout(() => setStatus('Ready'), 2000);
  }
  
  /**
   * Get the current shader source based on distortion type.
   */
  function getCurrentShaderSource() {
    switch (distortion.type) {
      case 'displacement': return displacementFrag;
      case 'refraction': return refractionFrag;
      case 'ripple': return rippleFrag;
      case 'wave': return waveFrag;
      case 'pinch': return pinchFrag;
      case 'twirl': return twirlFrag;
      case 'lens': return lensFrag;
      case 'barrel': return barrelFrag;
      default: return displacementFrag;
    }
  }
  
  /**
   * Get the current shader object.
   */
  function getCurrentShader() {
    switch (distortion.type) {
      case 'displacement': return displacementShader;
      case 'refraction': return refractionShader;
      case 'ripple': return rippleShader;
      case 'wave': return waveShader;
      case 'pinch': return pinchShader;
      case 'twirl': return twirlShader;
      case 'lens': return lensShader;
      case 'barrel': return barrelShader;
      default: return displacementShader;
    }
  }
  
  /**
   * Map source type to integer.
   */
  function getSourceType() {
    const map = { 'noise': 0, 'sine': 1, 'radial': 2, 'checker': 3, 'image': 4 };
    return map[distortion.displacement.source] || 0;
  }
  
  /**
   * Map noise type to integer.
   */
  function getNoiseType() {
    const map = { 'simplex': 0, 'perlin': 1, 'voronoi': 2, 'fractal': 3 };
    return map[distortion.displacement.noiseType] || 0;
  }
  
  /**
   * Render the distortion effect.
   */
  function renderEffect(src, dest, shader, w, h, time) {
    dest.shader(shader);
    
    // Common uniforms
    shader.setUniform('u_image', src);
    shader.setUniform('u_resolution', [w, h]);
    shader.setUniform('u_amount', distortion.amount);
    shader.setUniform('u_scale', distortion.scale);
    shader.setUniform('u_time', time);
    
    // Type-specific uniforms
    switch (distortion.type) {
      case 'displacement':
        shader.setUniform('u_source', getSourceType());
        shader.setUniform('u_noiseType', getNoiseType());
        shader.setUniform('u_intensity', distortion.displacement.intensity);
        shader.setUniform('u_offsetX', distortion.displacement.offsetX);
        shader.setUniform('u_offsetY', distortion.displacement.offsetY);
        shader.setUniform('u_hasDisplacementMap', media.displacementMap !== null);
        if (media.displacementMap) {
          shader.setUniform('u_displacementMap', media.displacementMap);
        }
        break;
        
      case 'refraction':
        shader.setUniform('u_noiseType', getNoiseType());
        shader.setUniform('u_index', distortion.refraction.index);
        shader.setUniform('u_thickness', distortion.refraction.thickness);
        shader.setUniform('u_chromatic', distortion.refraction.chromaticAberration);
        break;
        
      case 'ripple':
        shader.setUniform('u_frequency', distortion.ripple.frequency);
        shader.setUniform('u_amplitude', distortion.ripple.amplitude);
        shader.setUniform('u_phase', distortion.ripple.phase);
        shader.setUniform('u_damping', distortion.ripple.damping);
        shader.setUniform('u_centerX', distortion.ripple.centerX);
        shader.setUniform('u_centerY', distortion.ripple.centerY);
        break;
        
      case 'wave':
        shader.setUniform('u_freqX', distortion.wave.frequencyX);
        shader.setUniform('u_freqY', distortion.wave.frequencyY);
        shader.setUniform('u_ampX', distortion.wave.amplitudeX);
        shader.setUniform('u_ampY', distortion.wave.amplitudeY);
        shader.setUniform('u_phase', distortion.wave.phase);
        break;
        
      case 'pinch':
        shader.setUniform('u_strength', distortion.pinch.strength);
        shader.setUniform('u_radius', distortion.pinch.radius);
        shader.setUniform('u_centerX', distortion.pinch.centerX);
        shader.setUniform('u_centerY', distortion.pinch.centerY);
        break;
        
      case 'twirl':
        shader.setUniform('u_angle', distortion.twirl.angle);
        shader.setUniform('u_radius', distortion.twirl.radius);
        shader.setUniform('u_centerX', distortion.twirl.centerX);
        shader.setUniform('u_centerY', distortion.twirl.centerY);
        break;
        
      case 'lens':
        shader.setUniform('u_strength', distortion.lens.strength);
        shader.setUniform('u_radius', distortion.lens.radius);
        shader.setUniform('u_centerX', distortion.lens.centerX);
        shader.setUniform('u_centerY', distortion.lens.centerY);
        break;
        
      case 'barrel':
        shader.setUniform('u_strength', distortion.barrel.strength);
        break;
    }
    
    dest.rect(-w / 2, -h / 2, w, h);
  }
  
  // ============================================================
  // DRAW LOOP - Main rendering pipeline
  // ============================================================
  p.draw = () => {
    if (!isSetup || !srcBuffer) return;
    
    // Handle canvas resize
    if (needsResize) {
      calculateCanvasSize();
      p.resizeCanvas(canvas.width, canvas.height);
      createBuffers(canvas.width, canvas.height);
      
      if (srcBuffer.width !== canvas.width || srcBuffer.height !== canvas.height) {
        const oldSrc = srcBuffer;
        srcBuffer = p.createGraphics(canvas.width, canvas.height);
        srcBuffer.pixelDensity(1);
        if (media.source) {
          srcBuffer.image(media.source, 0, 0, canvas.width, canvas.height);
        }
        oldSrc.remove();
      }
      
      needsResize = false;
    }
    
    // Update animation time
    const now = performance.now() / 1000;
    const delta = now - lastFrameTime;
    lastFrameTime = now;
    
    if (animation.enabled && animation.playing) {
      animationTime += delta * animation.speed;
      if (animation.displacement?.animate) {
        distortion.displacement.offsetX += delta * animation.speed * 0.1;
      }
    }
    
    // Background
    if (canvas.transparent) {
      p.clear();
    } else {
      p.background(canvas.backColor);
    }
    
    // --- Distortion pass ---
    let finalBuffer = srcBuffer;
    
    if (distortion.enabled) {
      const shader = getCurrentShader();
      renderEffect(srcBuffer, mainBuffer, shader, canvas.width, canvas.height, animationTime);
      finalBuffer = mainBuffer;
    }
    
    // --- Post-processing pass ---
    if (processing.brightness !== 1.0 || processing.contrast !== 1.0 || 
        processing.saturation !== 1.0 || processing.hue !== 0) {
      processBuffer.shader(processShader);
      processShader.setUniform('u_image', finalBuffer);
      processShader.setUniform('u_resolution', [canvas.width, canvas.height]);
      processShader.setUniform('u_brightness', processing.brightness);
      processShader.setUniform('u_contrast', processing.contrast);
      processShader.setUniform('u_saturation', processing.saturation);
      processShader.setUniform('u_hue', processing.hue);
      processBuffer.rect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
      finalBuffer = processBuffer;
    }
    
    // Draw final result to main canvas
    p.image(finalBuffer, 0, 0, p.width, p.height);
  };
  
  // Handle window resize
  p.windowResized = () => {
    needsResize = true;
  };
};

// Create p5 instance attached to canvas container
new p5(sketch, document.getElementById('canvas-container'));
