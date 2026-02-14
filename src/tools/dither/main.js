// ============================================================
// Main Entry Point - p5.js Instance Mode + WebGL Shader Pipeline
// ============================================================

import p5 from 'p5';
import { dithVert, gradVert, dithFrag, halfFrag, cmykFrag, asciiFrag, gradFrag } from './shaders.js';
import { matrixTypes, matrixToImage, generateNoiseTextures, createFlatTexture } from './matrices.js';
import { getActiveColors } from './palettes.js';
import { cnv, dither, gradient, ascii, media, rec, resolutions } from './state.js';
import { setupUI, refreshUI } from './ui.js';
import { setupMedia } from './media.js';

/** Parse hex color string to normalized [r, g, b] array (0-1 range). */
function hexToRGB(hex) {
  hex = hex.replace('#', '');
  return [
    parseInt(hex.slice(0, 2), 16) / 255,
    parseInt(hex.slice(2, 4), 16) / 255,
    parseInt(hex.slice(4, 6), 16) / 255,
  ];
}

const sketch = (p) => {
  // --- Buffers & Shaders ---
  let gImg = null;           // Source image graphics buffer (2D)
  let dithBuffer = null;     // WebGL buffer for dither shaders
  let gradBuffer = null;     // WebGL buffer for gradient shader

  let ditherShader = null;
  let halftoneShader = null;
  let cmykShader = null;
  let asciiShader = null;
  let gradientShader = null;

  // --- Textures ---
  let matrixTextures = {};   // Bayer matrix images keyed by name
  let noiseTextures = {};    // Noise images: { noise16: [...], noise32: [...], ... }
  let flatTexture = null;    // 1x1 mid-gray for "none" mode
  let gradientTexture = null; // 1D gradient for color mapping
  let asciiAtlas = null;     // Glyph atlas texture

  // --- Font ---
  let currentFont = null;

  // --- State ---
  let needsResize = true;
  let isSetup = false;

  // Expose p instance for other modules
  window._p5Instance = p;

  p.setup = async () => {
    // Create main canvas (2D) - will be resized
    const canvas = p.createCanvas(640, 640);
    canvas.parent('canvas-container');
    p.pixelDensity(1);

    // Generate matrix textures
    for (const [name, matrix] of Object.entries(matrixTypes)) {
      matrixTextures[name] = matrixToImage(p, matrix);
    }

    // Generate noise textures
    noiseTextures = generateNoiseTextures(p);

    // Flat texture for "none" mode
    flatTexture = createFlatTexture(p);

    // Load default font
    try {
      currentFont = await loadGoogleFont('Press Start 2P');
    } catch (e) {
      console.warn('Could not load default font, using fallback');
    }

    // Build initial ASCII atlas
    buildAsciiAtlas();

    // Create initial gradient texture
    updateGradientTexture();

    // Create WebGL buffers + shaders
    createBuffers(cnv.width, cnv.height);

    // Set up media handling (drag-drop, etc.)
    setupMedia(p, handleMediaLoaded);

    // Set up Tweakpane UI
    setupUI(p, {
      onParamChange: () => { /* draw loop handles it */ },
      onResize: () => { needsResize = true; },
      onFontChange: handleFontChange,
      onAsciiTextChange: () => { buildAsciiAtlas(); },
      onPaletteChange: () => { updateGradientTexture(); },
      onMediaUpload: triggerFileUpload,
      onExport: handleExport,
    });

    // Create placeholder gradient image
    createPlaceholder();

    isSetup = true;
    p.loop();
  };

  /**
   * Load a Google Font by name. Returns a p5.Font or null.
   */
  async function loadGoogleFont(name) {
    if (name === 'monospace') return null;
    try {
      // Use CSS Font Loading API
      const fontFace = new FontFace(name, `url(https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}&display=swap)`);
      // For Google Fonts, we rely on the <link> tag in HTML
      // Just check if font is available after a delay
      await document.fonts.ready;
      return name;
    } catch (e) {
      return null;
    }
  }

  /**
   * Create WebGL buffers and compile shaders.
   */
  function createBuffers(w, h) {
    // Clean up old buffers
    if (dithBuffer) dithBuffer.remove();
    if (gradBuffer) gradBuffer.remove();

    dithBuffer = p.createGraphics(w, h, p.WEBGL);
    gradBuffer = p.createGraphics(w, h, p.WEBGL);

    for (const buf of [dithBuffer, gradBuffer]) {
      buf.pixelDensity(1);
    }

    // Create shaders on dithBuffer
    ditherShader = dithBuffer.createShader(dithVert, dithFrag);
    halftoneShader = dithBuffer.createShader(dithVert, halfFrag);
    cmykShader = dithBuffer.createShader(gradVert, cmykFrag);
    asciiShader = dithBuffer.createShader(dithVert, asciiFrag);

    // Create gradient shader on gradBuffer
    gradientShader = gradBuffer.createShader(gradVert, gradFrag);

    // Set texture wrapping for tiling dither patterns
    dithBuffer.textureWrap(p.REPEAT);
  }

  /**
   * Create a placeholder gradient image for initial display.
   */
  function createPlaceholder() {
    const w = cnv.width;
    const h = cnv.height;
    const img = p.createImage(w, h);
    img.loadPixels();
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const t = (x + y) / (w + h);
        const v = Math.floor(t * 255);
        img.pixels[idx] = v;
        img.pixels[idx + 1] = Math.floor(v * 0.7);
        img.pixels[idx + 2] = Math.floor(255 - v * 0.5);
        img.pixels[idx + 3] = 255;
      }
    }
    img.updatePixels();

    gImg = p.createGraphics(w, h);
    gImg.pixelDensity(1);
    gImg.image(img, 0, 0, w, h);
    media.type = 'image';
    media.source = img;
  }

  /**
   * Handle loaded media (image or video).
   */
  function handleMediaLoaded(type, source) {
    media.type = type;
    media.source = source;

    if (type === 'video') {
      media.video = source;
    }

    // Resize canvas to fit media aspect ratio
    resizeForMedia(source);
    needsResize = true;
  }

  /**
   * Resize canvas and buffers to fit media.
   */
  function resizeForMedia(source) {
    let srcW, srcH;
    if (source && source.videoWidth) {
      srcW = source.videoWidth || 640;
      srcH = source.videoHeight || 480;
    } else if (source && source.width) {
      srcW = source.width;
      srcH = source.height;
    } else {
      srcW = 640;
      srcH = 480;
    }

    // Use the current ratio setting to determine canvas size
    calculateCanvasSize();

    // Recreate buffers at new size
    createBuffers(cnv.width, cnv.height);

    // Recreate source buffer
    if (gImg) gImg.remove();
    gImg = p.createGraphics(cnv.width, cnv.height);
    gImg.pixelDensity(1);

    // Draw source into gImg
    updateSourceImage();

    p.resizeCanvas(cnv.width, cnv.height);
  }

  /**
   * Calculate canvas dimensions from ratio and scale.
   */
  function calculateCanvasSize() {
    const [rw, rh] = cnv.ratio.split(':').map(Number);
    const maxRes = resolutions[cnv.ratio] || { width: 1280, height: 1280 };
    const panelW = cnv.panelWidth;

    const availW = (window.innerWidth - panelW) * cnv.scale;
    const availH = window.innerHeight * cnv.scale;

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

    cnv.width = w;
    cnv.height = h;
  }

  /**
   * Update source image buffer from current media.
   */
  function updateSourceImage() {
    if (!gImg || !media.source) return;

    if (media.type === 'video' && media.video) {
      gImg.image(media.video, 0, 0, gImg.width, gImg.height);
    } else if (media.source) {
      gImg.image(media.source, 0, 0, gImg.width, gImg.height);
    }
  }

  /**
   * Build the ASCII glyph atlas texture.
   */
  function buildAsciiAtlas() {
    const chars = ascii.text || ' .:-=+*#%@';
    const totalChars = chars.length;
    if (totalChars === 0) return;

    // Determine grid layout for atlas
    const cols = Math.ceil(Math.sqrt(totalChars));
    const rows = Math.ceil(totalChars / cols);

    // Character cell size
    const cellSize = ascii.scale * 4; // Scale up for quality
    const cellW = cellSize;
    const cellH = cellSize;

    ascii.cols = cols;
    ascii.rows = rows;
    ascii.box = [cellW, cellH];

    // Create atlas graphics
    if (asciiAtlas) asciiAtlas.remove();
    asciiAtlas = p.createGraphics(cellW * cols, cellH * rows);
    asciiAtlas.pixelDensity(1);
    asciiAtlas.background(0);
    asciiAtlas.fill(255);
    asciiAtlas.noStroke();
    asciiAtlas.textAlign(p.CENTER, p.CENTER);
    asciiAtlas.textSize(cellSize * 0.8);

    // Set font
    if (ascii.fontname && ascii.fontname !== 'monospace') {
      asciiAtlas.textFont(ascii.fontname);
    }

    // Render each character
    for (let i = 0; i < totalChars; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      asciiAtlas.text(chars[i], col * cellW + cellW / 2, row * cellH + cellH / 2);
    }
  }

  /**
   * Update the gradient texture from current palette settings.
   */
  function updateGradientTexture() {
    const colors = getActiveColors(gradient.palette);
    if (gradient.reverse) colors.reverse();

    const texWidth = colors.length * 16;
    if (gradientTexture) gradientTexture.remove();
    gradientTexture = p.createGraphics(texWidth, 1);
    gradientTexture.pixelDensity(1);

    // Draw gradient using canvas 2D API
    const ctx = gradientTexture.drawingContext;
    const grad = ctx.createLinearGradient(0, 0, texWidth, 0);

    for (let i = 0; i < colors.length; i++) {
      grad.addColorStop(i / Math.max(1, colors.length - 1), colors[i]);
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, texWidth, 1);
  }

  /**
   * Handle font change from UI.
   */
  async function handleFontChange(fontName) {
    ascii.fontname = fontName;
    await document.fonts.ready;
    buildAsciiAtlas();
  }

  /**
   * Trigger file upload dialog.
   */
  function triggerFileUpload() {
    const input = document.getElementById('fileInput');
    if (input) input.click();
  }

  /**
   * Handle PNG export.
   */
  function handleExport() {
    rec.status = 'Exporting...';
    refreshUI();

    // For higher resolution export, render at multiplied size
    const mult = rec.exportSize || 1;
    if (mult === 1) {
      p.saveCanvas('dithr-export', 'png');
      rec.status = 'Exported!';
      setTimeout(() => { rec.status = 'Ready'; refreshUI(); }, 2000);
      return;
    }

    // Create high-res export
    const expW = cnv.width * mult;
    const expH = cnv.height * mult;
    const expDith = p.createGraphics(expW, expH, p.WEBGL);
    expDith.pixelDensity(1);

    const expShader = expDith.createShader(dithVert, dithFrag);
    expDith.textureWrap(p.REPEAT);
    expDith.shader(expShader);

    const ditherTex = getCurrentDitherTexture();
    expShader.setUniform('u_texture', gImg);
    expShader.setUniform('u_dither_tex', ditherTex);
    expShader.setUniform('u_resolution', [expW, expH]);
    expShader.setUniform('u_dither_size', [ditherTex.width, ditherTex.height]);
    expShader.setUniform('u_density', 1);
    expShader.setUniform('u_scale', dither.scale * mult);
    expShader.setUniform('u_steps', 0.2 + dither.step * 0.1);
    expShader.setUniform('u_contrast', getContrastValue());
    expShader.setUniform('u_saturation', getSaturationValue());
    expShader.setUniform('u_brightness', dither.brightness);

    expDith.rect(-expW / 2, -expH / 2, expW, expH);

    // If gradient mode, apply gradient
    if (gradient.type === 'gradient') {
      const expGrad = p.createGraphics(expW, expH, p.WEBGL);
      expGrad.pixelDensity(1);
      const expGradShader = expGrad.createShader(gradVert, gradFrag);
      expGrad.shader(expGradShader);
      expGradShader.setUniform('u_texture', expDith);
      expGradShader.setUniform('u_gradient', gradientTexture);
      expGrad.rect(-expW / 2, -expH / 2, expW, expH);
      expGrad.save('dithr-export', 'png');
      expGrad.remove();
    } else {
      expDith.save('dithr-export', 'png');
    }

    expDith.remove();
    rec.status = 'Exported!';
    setTimeout(() => { rec.status = 'Ready'; refreshUI(); }, 2000);
  }

  /**
   * Get the current dither texture based on type settings.
   */
  function getCurrentDitherTexture() {
    if (dither.type === 'matrix') {
      return matrixTextures[dither.matrix] || matrixTextures.bayer8;
    }
    if (dither.type === 'noise') {
      const noiseArr = noiseTextures[dither.noise] || noiseTextures.noise64;
      const idx = Math.min(dither.texture, noiseArr.length - 1);
      return noiseArr[idx];
    }
    return flatTexture;
  }

  /**
   * Map contrast value (non-linear mapping from original).
   */
  function getContrastValue() {
    if (dither.contrast <= 1) {
      return p.map(dither.contrast, 0.5, 1, 0.25, 1);
    }
    return p.map(dither.contrast, 1, 4, 1, 12);
  }

  /**
   * Get saturation uniform value.
   * In "original" mode: user saturation 0->1 maps to uniform 1->0
   * In "gradient" mode: always 1 (grayscale for gradient lookup)
   */
  function getSaturationValue() {
    if (gradient.type !== 'original') return 1.0;
    return p.map(gradient.saturation, 0, 1, 1, 0);
  }

  /**
   * Map CMYK halftone scale with exponential easing.
   */
  function getCMYKScale() {
    const { scale, scaleMin, scaleMax } = dither.halftone;
    // Exponential mapping: small scale values -> high frequency, large -> low frequency
    const t = (scale - scaleMin) / (scaleMax - scaleMin);
    const eased = Math.pow(t, 2); // quadratic for exponential-like feel
    return 500 * (1 - eased) + 5 * eased;
  }

  /**
   * Get posterization step value.
   */
  function getStepValue() {
    return 0.2 + dither.step * 0.1;
  }

  // ============================================================
  // DRAW LOOP - Main rendering pipeline
  // ============================================================
  p.draw = () => {
    if (!isSetup || !gImg) return;

    // Handle canvas resize
    if (needsResize) {
      calculateCanvasSize();
      p.resizeCanvas(cnv.width, cnv.height);
      createBuffers(cnv.width, cnv.height);

      if (gImg.width !== cnv.width || gImg.height !== cnv.height) {
        const oldGImg = gImg;
        gImg = p.createGraphics(cnv.width, cnv.height);
        gImg.pixelDensity(1);
        if (media.source) {
          gImg.image(media.source, 0, 0, cnv.width, cnv.height);
        }
        oldGImg.remove();
      }
      needsResize = false;
    }

    // Update source for video
    if (media.type === 'video' && media.video) {
      gImg.image(media.video, 0, 0, gImg.width, gImg.height);
    }

    // Background
    p.background(cnv.backColor);

    // Compute shared uniform values
    const contrastVal = getContrastValue();
    const saturationVal = getSaturationValue();
    const stepVal = getStepValue();
    const brightnessVal = dither.brightness;

    // --- Dither pass ---
    switch (dither.type) {
      case 'matrix':
      case 'noise':
      case 'none': {
        const ditherTex = getCurrentDitherTexture();
        dithBuffer.shader(ditherShader);
        ditherShader.setUniform('u_texture', gImg);
        ditherShader.setUniform('u_dither_tex', ditherTex);
        ditherShader.setUniform('u_resolution', [dithBuffer.width, dithBuffer.height]);
        ditherShader.setUniform('u_dither_size', [ditherTex.width, ditherTex.height]);
        ditherShader.setUniform('u_density', 1);
        ditherShader.setUniform('u_scale', dither.type === 'none' ? 1 : dither.scale);
        ditherShader.setUniform('u_steps', dither.type === 'none' ? 25.6 : stepVal);
        ditherShader.setUniform('u_contrast', contrastVal);
        ditherShader.setUniform('u_saturation', saturationVal);
        ditherShader.setUniform('u_brightness', brightnessVal);
        dithBuffer.rect(-dithBuffer.width / 2, -dithBuffer.height / 2, dithBuffer.width, dithBuffer.height);
        break;
      }

      case 'halftone': {
        dithBuffer.shader(halftoneShader);
        halftoneShader.setUniform('u_texture', gImg);
        halftoneShader.setUniform('u_resolution', [dithBuffer.width, dithBuffer.height]);
        halftoneShader.setUniform('u_size', dither.halftone.scale);
        halftoneShader.setUniform('u_smooth', dither.halftone.smooth);
        halftoneShader.setUniform('u_brightness', brightnessVal);
        halftoneShader.setUniform('u_contrast', contrastVal);
        halftoneShader.setUniform('u_saturation', saturationVal);
        halftoneShader.setUniform('u_density', 1.0);
        halftoneShader.setUniform('u_halfscale', [dither.halftone.x, dither.halftone.y, dither.halftone.z]);
        dithBuffer.rect(-dithBuffer.width / 2, -dithBuffer.height / 2, dithBuffer.width, dithBuffer.height);
        break;
      }

      case 'halftoneCMYK': {
        dithBuffer.shader(cmykShader);
        cmykShader.setUniform('u_texture', gImg);
        cmykShader.setUniform('u_resolution', [dithBuffer.width, dithBuffer.height]);
        cmykShader.setUniform('u_scale', 1.0 / getCMYKScale());
        cmykShader.setUniform('u_brightness', brightnessVal);
        cmykShader.setUniform('u_contrast', contrastVal);
        cmykShader.setUniform('u_saturation', saturationVal);
        dithBuffer.rect(-dithBuffer.width / 2, -dithBuffer.height / 2, dithBuffer.width, dithBuffer.height);
        break;
      }

      case 'ascii': {
        if (!asciiAtlas) break;
        const chars = ascii.text || ' .:-=+*#%@';
        const gridW = Math.floor(dithBuffer.width / ascii.scale);
        const gridH = Math.floor(dithBuffer.height / ascii.scale);
        const offsetX = dithBuffer.width - gridW * ascii.scale;
        const offsetY = dithBuffer.height - gridH * ascii.scale;

        dithBuffer.shader(asciiShader);
        asciiShader.setUniform('u_asciiTexture', asciiAtlas);
        asciiShader.setUniform('u_imageTexture', gImg);
        asciiShader.setUniform('u_asciiCols', ascii.cols);
        asciiShader.setUniform('u_asciiRows', ascii.rows);
        asciiShader.setUniform('u_totalChars', chars.length);
        asciiShader.setUniform('u_gridCells', [gridW * ascii.scale, gridH * ascii.scale]);
        asciiShader.setUniform('u_gridOffset', [offsetX, offsetY]);
        asciiShader.setUniform('u_gridSize', [gridW, gridH]);
        asciiShader.setUniform('u_brightness', brightnessVal);
        asciiShader.setUniform('u_contrast', contrastVal);
        asciiShader.setUniform('u_saturation', saturationVal);
        asciiShader.setUniform('u_steps', stepVal);

        // Color mode: 0 = image colors, 1 = custom
        const charMode = ascii.color.mode === 'chars' ? 0 : 1;
        const bgMode = ascii.color.mode === 'duotone' ? 1 : (ascii.color.mode === 'custom' ? 1 : 0);

        asciiShader.setUniform('u_charColorMode', charMode);
        asciiShader.setUniform('u_bgColorMode', bgMode);
        asciiShader.setUniform('u_charColor', hexToRGB(ascii.color.char));
        asciiShader.setUniform('u_bgColor', hexToRGB(ascii.color.bg));

        dithBuffer.rect(-dithBuffer.width / 2, -dithBuffer.height / 2, dithBuffer.width, dithBuffer.height);
        break;
      }
    }

    // --- Gradient pass ---
    if (gradient.type === 'gradient' && gradientTexture) {
      gradBuffer.shader(gradientShader);
      gradientShader.setUniform('u_texture', dithBuffer);
      gradientShader.setUniform('u_gradient', gradientTexture);
      gradBuffer.rect(-gradBuffer.width / 2, -gradBuffer.height / 2, gradBuffer.width, gradBuffer.height);
      p.image(gradBuffer, 0, 0, p.width, p.height);
    } else {
      p.image(dithBuffer, 0, 0, p.width, p.height);
    }
  };

  // Handle window resize
  p.windowResized = () => {
    needsResize = true;
  };
};

// Create p5 instance attached to canvas container
new p5(sketch, document.getElementById('canvas-container'));
