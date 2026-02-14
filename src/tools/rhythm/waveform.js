// ============================================================
// Waveform Generator - Noise and wave-based line rendering
// ============================================================

import { createNoise2D, createNoise3D, createNoise4D } from 'simplex-noise';
import { waveform, canvas, composition, effects } from './state.js';

// Initialize noise functions
const noise2D = createNoise2D();
const noise3D = createNoise3D();

/**
 * Generate a waveform value at a given x position
 * @param {number} x - x position
 * @param {number} lineIndex - line index (0 to count-1)
 * @param {number} time - animation time (0-1)
 * @returns {number} - y offset
 */
export function getWaveformValue(x, lineIndex, time) {
  const { 
    mode, amplitude, frequency, noiseScale, noiseOctaves, 
    noisePersistence, noiseLacunarity, phaseOffset 
  } = waveform;
  
  const phase = lineIndex * phaseOffset + time * waveform.speed;
  const yBase = lineIndex * waveform.spacing;
  
  switch (mode) {
    case 'noise':
      return getNoiseWave(x, phase, time);
    case 'sine':
      return getSineWave(x, phase);
    case 'square':
      return getSquareWave(x, phase);
    case 'sawtooth':
      return getSawtoothWave(x, phase);
    case 'triangle':
      return getTriangleWave(x, phase);
    default:
      return getNoiseWave(x, phase, time);
  }
}

/**
 * Simplex noise-based waveform
 */
function getNoiseWave(x, phase, time) {
  const { 
    amplitude, noiseScale, noiseOctaves, 
    noisePersistence, noiseLacunarity 
  } = waveform;
  
  let value = 0;
  let amplitudeSum = 0;
  let currentAmplitude = 1;
  let currentScale = noiseScale;
  
  // Fractal Brownian Motion (fBm)
  for (let i = 0; i < noiseOctaves; i++) {
    const nx = x * currentScale;
    const ny = phase;
    const nz = time * waveform.speed;
    
    value += noise3D(nx, ny, nz) * currentAmplitude;
    amplitudeSum += currentAmplitude;
    
    currentAmplitude *= noisePersistence;
    currentScale *= noiseLacunarity;
  }
  
  // Normalize
  value /= amplitudeSum;
  
  // Apply amplitude
  return value * amplitude;
}

/**
 * Sine wave
 */
function getSineWave(x, phase) {
  const { amplitude, frequency } = waveform;
  return Math.sin(x * frequency + phase) * amplitude;
}

/**
 * Square wave
 */
function getSquareWave(x, phase) {
  const { amplitude, frequency } = waveform;
  const sine = Math.sin(x * frequency + phase);
  return (sine >= 0 ? 1 : -1) * amplitude;
}

/**
 * Sawtooth wave
 */
function getSawtoothWave(x, phase) {
  const { amplitude, frequency } = waveform;
  const period = 2 * Math.PI / frequency;
  const pos = (x + phase / frequency) % period;
  const normalized = (pos / period) * 2 - 1;
  return normalized * amplitude;
}

/**
 * Triangle wave
 */
function getTriangleWave(x, phase) {
  const { amplitude, frequency } = waveform;
  const period = 2 * Math.PI / frequency;
  const pos = (x + phase / frequency) % period;
  const normalized = (pos / period) * 2 - 1;
  return (Math.abs(normalized) * 2 - 1) * amplitude;
}

/**
 * Apply effects to waveform value
 * @param {number} value - base value
 * @param {number} x - x position
 * @param {number} y - y position
 * @param {number} time - animation time
 * @returns {number} - modified value
 */
export function applyEffects(value, x, y, time) {
  let result = value;
  
  // Ripple effect
  if (effects.rippleEnabled) {
    const { rippleStrength, rippleFrequency, rippleSpeed } = effects;
    const dist = Math.sqrt(x * x + y * y);
    const ripple = Math.sin(dist * rippleFrequency - time * rippleSpeed) * rippleStrength;
    result += ripple;
  }
  
  // Glitch effect
  if (effects.glitchEnabled && Math.random() < effects.glitchProbability) {
    result += (Math.random() - 0.5) * effects.glitchAmount * 10;
  }
  
  return result;
}

/**
 * Apply symmetry to a point
 * @param {number} x - x coordinate
 * @param {number} y - y coordinate
 * @param {string} symmetry - symmetry mode
 * @returns {Array} - array of {x, y} points
 */
export function applySymmetry(x, y, symmetry = waveform.symmetry) {
  const points = [{ x, y }];
  
  const centerX = canvas.width * composition.centerX;
  const centerY = canvas.height * composition.centerY;
  
  switch (symmetry) {
    case 'horizontal':
      points.push({
        x: centerX * 2 - x,
        y: y
      });
      break;
      
    case 'vertical':
      points.push({
        x: x,
        y: centerY * 2 - y
      });
      break;
      
    case 'both':
      points.push({ x: centerX * 2 - x, y: y });
      points.push({ x: x, y: centerY * 2 - y });
      points.push({ x: centerX * 2 - x, y: centerY * 2 - y });
      break;
  }
  
  return points;
}

/**
 * Transform a point based on composition settings
 * @param {number} x - x coordinate
 * @param {number} y - y coordinate
 * @returns {Object} - transformed {x, y}
 */
export function transformPoint(x, y) {
  const { offsetX, offsetY, scaleX, scaleY, rotation, perspective } = composition;
  
  // Apply offset
  let tx = x + offsetX;
  let ty = y + offsetY;
  
  // Apply scale
  tx *= scaleX;
  ty *= scaleY;
  
  // Apply rotation
  if (rotation !== 0) {
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const rx = tx * cos - ty * sin;
    const ry = tx * sin + ty * cos;
    tx = rx;
    ty = ry;
  }
  
  // Apply perspective (simple 3D effect)
  if (perspective > 0) {
    const centerY = canvas.height / 2;
    const distFromCenter = (ty - centerY) / centerY;
    const scale = 1 - distFromCenter * perspective * 0.01;
    tx = canvas.width / 2 + (tx - canvas.width / 2) * scale;
  }
  
  return { x: tx, y: ty };
}

/**
 * Get all waveform lines data
 * @param {number} time - animation time (0-1)
 * @returns {Array} - array of line data: { points: [{x, y}], color }
 */
export function getWaveformLines(time) {
  const lines = [];
  const { count, resolution } = waveform;
  const step = resolution;
  const width = canvas.width;
  
  // Center vertically
  const startY = (canvas.height - (count - 1) * waveform.spacing) / 2;
  
  for (let i = 0; i < count; i++) {
    const points = [];
    const baseY = startY + i * waveform.spacing;
    
    for (let x = 0; x <= width; x += step) {
      let value = getWaveformValue(x, i, time);
      
      // Apply effects
      value = applyEffects(value, x, baseY, time);
      
      // Transform point
      const transformed = transformPoint(x, baseY + value);
      points.push(transformed);
    }
    
    lines.push({
      points,
      lineIndex: i,
      baseY,
    });
  }
  
  return lines;
}

/**
 * Generate SVG path string from points
 * @param {Array} points - array of {x, y}
 * @returns {string} - SVG path d attribute
 */
export function pointsToSVGPath(points) {
  if (points.length === 0) return '';
  
  // Use L (line) commands for simplicity
  // For smoother curves, could use S or C commands
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)}`;
  }
  
  return d;
}

/**
 * Calculate canvas size based on aspect ratio
 */
export function updateCanvasSize() {
  const ratio = canvas.aspectRatio;
  const dims = aspectRatioOptions[ratio];
  if (dims) {
    canvas.width = dims.w;
    canvas.height = dims.h;
  }
}

import { aspectRatioOptions } from './state.js';
