// ============================================================
// Effects Rendering - Overlays, Connections, Filters
// ============================================================

import { shape, region, connection, filterEffect } from './state.js';

export class EffectRenderer {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.time = 0;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
  }

  update() {
    this.time++;
  }

  render(p, blobs) {
    this.update();

    if (connection.enabled && blobs.length > 1) {
      this.renderConnections(p, blobs);
    }

    for (const blob of blobs) {
      this.renderRegion(p, blob);
    }
  }

  // ============================================================
  // Filter Effects - applied to canvas pixels before overlays
  // ============================================================

  /**
   * Apply the active pixel filter to whatever is currently on the p5 canvas.
   * @param {object} p - p5 instance
   * @param {Uint8ClampedArray} diffBuffer - motion diff at performance resolution
   * @param {{ width: number, height: number }} perfRes - performance resolution dimensions
   */
  applyFilter(p, diffBuffer, perfRes) {
    const type = filterEffect.type;
    const hasFusion = filterEffect.fusion;
    const hasInvert = filterEffect.invert;

    if (type === 'none' && !hasFusion && !hasInvert) return;

    p.loadPixels();
    const pixels = p.pixels;
    const w = p.width;
    const h = p.height;
    const intensity = filterEffect.intensity;

    // Fusion: blend video with colorized motion diff
    if (hasFusion && diffBuffer && perfRes) {
      const sx = w / perfRes.width;
      const sy = h / perfRes.height;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const di = Math.floor(y / sy) * perfRes.width + Math.floor(x / sx);
          const d = Math.min(1, diffBuffer[di] / 128) * intensity;
          const pi = (y * w + x) * 4;
          pixels[pi]     = Math.round(pixels[pi]     * (1 - d));
          pixels[pi + 1] = Math.round(pixels[pi + 1] * (1 - d) + 255 * d);
          pixels[pi + 2] = Math.round(pixels[pi + 2] * (1 - d) + 136 * d);
        }
      }
    }

    switch (type) {
      case 'invert': {
        for (let i = 0; i < pixels.length; i += 4) {
          pixels[i]     = 255 - pixels[i];
          pixels[i + 1] = 255 - pixels[i + 1];
          pixels[i + 2] = 255 - pixels[i + 2];
        }
        break;
      }

      case 'thermal': {
        // Remap luminance to cold (blue) → warm (red) spectrum
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
          const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
          let nr, ng, nb;
          if (lum < 0.25) {
            nr = 0; ng = 0; nb = Math.round(lum * 4 * 255);
          } else if (lum < 0.5) {
            const t = (lum - 0.25) * 4;
            nr = 0; ng = Math.round(t * 255); nb = Math.round((1 - t) * 255);
          } else if (lum < 0.75) {
            const t = (lum - 0.5) * 4;
            nr = Math.round(t * 255); ng = 255; nb = 0;
          } else {
            const t = (lum - 0.75) * 4;
            nr = 255; ng = Math.round((1 - t) * 255); nb = Math.round(t * 80);
          }
          pixels[i]     = Math.round(nr * intensity + r * (1 - intensity));
          pixels[i + 1] = Math.round(ng * intensity + g * (1 - intensity));
          pixels[i + 2] = Math.round(nb * intensity + b * (1 - intensity));
        }
        break;
      }

      case 'pixel': {
        const blockSize = Math.max(4, Math.round(intensity * 24 + 2));
        for (let y = 0; y < h; y += blockSize) {
          for (let x = 0; x < w; x += blockSize) {
            const sx = Math.min(w - 1, x + Math.floor(blockSize / 2));
            const sy = Math.min(h - 1, y + Math.floor(blockSize / 2));
            const si = (sy * w + sx) * 4;
            const sr = pixels[si], sg = pixels[si + 1], sb = pixels[si + 2];
            for (let by = y; by < Math.min(y + blockSize, h); by++) {
              for (let bx = x; bx < Math.min(x + blockSize, w); bx++) {
                const di = (by * w + bx) * 4;
                pixels[di]     = sr;
                pixels[di + 1] = sg;
                pixels[di + 2] = sb;
              }
            }
          }
        }
        break;
      }

      case 'tone': {
        for (let i = 0; i < pixels.length; i += 4) {
          const gray = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
          pixels[i]     = Math.round(gray * intensity + pixels[i]     * (1 - intensity));
          pixels[i + 1] = Math.round(gray * intensity + pixels[i + 1] * (1 - intensity));
          pixels[i + 2] = Math.round(gray * intensity + pixels[i + 2] * (1 - intensity));
        }
        break;
      }

      case 'blur': {
        // Separable box blur — horizontal pass then vertical pass
        const radius = Math.max(1, Math.round(intensity * 10));
        const hPass = new Uint8ClampedArray(pixels.length);
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            let r = 0, g = 0, b = 0, count = 0;
            for (let dx = -radius; dx <= radius; dx++) {
              const sx = Math.max(0, Math.min(w - 1, x + dx));
              const si = (y * w + sx) * 4;
              r += pixels[si]; g += pixels[si + 1]; b += pixels[si + 2];
              count++;
            }
            const di = (y * w + x) * 4;
            hPass[di] = r / count; hPass[di + 1] = g / count; hPass[di + 2] = b / count; hPass[di + 3] = 255;
          }
        }
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            let r = 0, g = 0, b = 0, count = 0;
            for (let dy = -radius; dy <= radius; dy++) {
              const sy = Math.max(0, Math.min(h - 1, y + dy));
              const si = (sy * w + x) * 4;
              r += hPass[si]; g += hPass[si + 1]; b += hPass[si + 2];
              count++;
            }
            const di = (y * w + x) * 4;
            pixels[di] = r / count; pixels[di + 1] = g / count; pixels[di + 2] = b / count;
          }
        }
        break;
      }

      case 'xray': {
        for (let i = 0; i < pixels.length; i += 4) {
          const ir = 255 - pixels[i];
          const ig = 255 - pixels[i + 1];
          const ib = 255 - pixels[i + 2];
          // Boost contrast on inverted image
          pixels[i]     = Math.round(Math.min(255, ir * 1.4) * intensity + pixels[i]     * (1 - intensity));
          pixels[i + 1] = Math.round(Math.min(255, ig * 1.4) * intensity + pixels[i + 1] * (1 - intensity));
          pixels[i + 2] = Math.round(Math.min(255, ib * 1.4) * intensity + pixels[i + 2] * (1 - intensity));
        }
        break;
      }

      case 'crt': {
        // Scanlines: darken every third row, slight blue boost on middle rows
        for (let y = 0; y < h; y++) {
          const rowMod = y % 3;
          if (rowMod === 0) {
            const dim = 1 - intensity * 0.45;
            for (let x = 0; x < w; x++) {
              const i = (y * w + x) * 4;
              pixels[i]     = Math.round(pixels[i]     * dim);
              pixels[i + 1] = Math.round(pixels[i + 1] * dim);
              pixels[i + 2] = Math.round(pixels[i + 2] * dim);
            }
          } else if (rowMod === 2) {
            for (let x = 0; x < w; x++) {
              const i = (y * w + x) * 4;
              pixels[i + 2] = Math.min(255, Math.round(pixels[i + 2] * (1 + intensity * 0.15)));
            }
          }
        }
        break;
      }

      case 'glitch': {
        const orig = new Uint8ClampedArray(pixels);
        const slices = Math.round(intensity * 20 + 5);
        for (let s = 0; s < slices; s++) {
          if (Math.random() > intensity * 0.4) continue;
          const sliceY   = Math.floor(Math.random() * h);
          const sliceH   = Math.floor(Math.random() * 20 + 2);
          const offsetX  = Math.floor((Math.random() - 0.5) * 60 * intensity);
          const channelShift = Math.random() < 0.3;
          for (let y = sliceY; y < Math.min(sliceY + sliceH, h); y++) {
            for (let x = 0; x < w; x++) {
              const srcX = Math.max(0, Math.min(w - 1, x + offsetX));
              const di = (y * w + x) * 4;
              const si = (y * w + srcX) * 4;
              if (channelShift) {
                // Red channel only shift for RGB aberration look
                pixels[di] = orig[si];
              } else {
                pixels[di]     = orig[si];
                pixels[di + 1] = orig[si + 1];
                pixels[di + 2] = orig[si + 2];
              }
            }
          }
        }
        break;
      }

      case 'edge': {
        const orig = new Uint8ClampedArray(pixels);
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const i  = (y * w + x) * 4;
            const il = (y * w + x - 1) * 4;
            const ir = (y * w + x + 1) * 4;
            const iu = ((y - 1) * w + x) * 4;
            const id = ((y + 1) * w + x) * 4;
            for (let c = 0; c < 3; c++) {
              const gx = orig[ir + c] - orig[il + c];
              const gy = orig[id + c] - orig[iu + c];
              const mag = Math.min(255, Math.sqrt(gx * gx + gy * gy));
              pixels[i + c] = Math.round(mag * intensity + orig[i + c] * (1 - intensity));
            }
          }
        }
        break;
      }

      case 'zoom': {
        const orig = new Uint8ClampedArray(pixels);
        const scale = 1 + intensity * 0.5;
        const cx = w / 2, cy = h / 2;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const sx = Math.floor(cx + (x - cx) / scale);
            const sy = Math.floor(cy + (y - cy) / scale);
            const di = (y * w + x) * 4;
            if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
              const si = (sy * w + sx) * 4;
              pixels[di]     = orig[si];
              pixels[di + 1] = orig[si + 1];
              pixels[di + 2] = orig[si + 2];
            }
          }
        }
        break;
      }

      case 'water': {
        const orig = new Uint8ClampedArray(pixels);
        const amp = intensity * 12;
        const t = this.time;
        for (let y = 0; y < h; y++) {
          const offX = Math.round(Math.sin(y * 0.05 + t * 0.05) * amp);
          for (let x = 0; x < w; x++) {
            const sx = Math.max(0, Math.min(w - 1, x + offX));
            const di = (y * w + x) * 4;
            const si = (y * w + sx) * 4;
            pixels[di]     = orig[si];
            pixels[di + 1] = orig[si + 1];
            pixels[di + 2] = orig[si + 2];
          }
        }
        break;
      }

      case 'mask': {
        // Show only motion regions; black out static areas
        if (diffBuffer && perfRes) {
          const sx = w / perfRes.width;
          const sy = h / perfRes.height;
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const di = Math.floor(y / sy) * perfRes.width + Math.floor(x / sx);
              const motionWeight = Math.min(1, diffBuffer[di] / 100) * intensity;
              const pi = (y * w + x) * 4;
              pixels[pi]     = Math.round(pixels[pi]     * motionWeight);
              pixels[pi + 1] = Math.round(pixels[pi + 1] * motionWeight);
              pixels[pi + 2] = Math.round(pixels[pi + 2] * motionWeight);
            }
          }
        }
        break;
      }

      case 'dither': {
        // Ordered (Bayer matrix) dither
        const bayer = [
          [ 0,  8,  2, 10],
          [12,  4, 14,  6],
          [ 3, 11,  1,  9],
          [15,  7, 13,  5],
        ];
        const levels = Math.max(2, Math.round((1 - intensity) * 6 + 2));
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            const threshold = bayer[y % 4][x % 4] / 16 - 0.5;
            for (let c = 0; c < 3; c++) {
              const v = pixels[i + c] / 255 + threshold * 0.25;
              pixels[i + c] = Math.round(Math.round(Math.max(0, Math.min(1, v)) * (levels - 1)) / (levels - 1) * 255);
            }
          }
        }
        break;
      }
    }

    // Invert toggle (applied on top of any effect, except if effect is already invert)
    if (hasInvert && type !== 'invert') {
      for (let i = 0; i < pixels.length; i += 4) {
        pixels[i]     = 255 - pixels[i];
        pixels[i + 1] = 255 - pixels[i + 1];
        pixels[i + 2] = 255 - pixels[i + 2];
      }
    }

    p.updatePixels();
  }

  // ============================================================
  // Connection Lines
  // ============================================================

  renderConnections(p, blobs) {
    const maxDist = connection.maxDistance;
    p.noFill();
    p.strokeWeight(connection.strokeWidth);

    const col = p.color(connection.color);

    for (let i = 0; i < blobs.length; i++) {
      for (let j = i + 1; j < blobs.length; j++) {
        const a = blobs[i];
        const b = blobs[j];
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        if (dist >= maxDist) continue;

        // Alpha fades with distance; setAlpha expects 0-255
        const alpha = (1 - dist / maxDist) * connection.opacity * 255;
        col.setAlpha(alpha);
        p.stroke(col);

        switch (connection.style) {
          case 'straight':
            p.line(a.x, a.y, b.x, b.y);
            break;
          case 'curved':
            this.drawCurvedLine(p, a, b);
            break;
          case 'waveform':
            this.drawWaveform(p, a, b, dist);
            break;
          case 'pulse':
            this.drawPulse(p, a, b, dist);
            break;
        }
      }
    }
  }

  drawCurvedLine(p, a, b) {
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    const offset = Math.sin(this.time * 0.05) * 20;
    p.noFill();
    p.beginShape();
    p.curveVertex(a.x, a.y);
    p.curveVertex(a.x, a.y);
    p.curveVertex(midX + offset, midY - offset);
    p.curveVertex(b.x, b.y);
    p.curveVertex(b.x, b.y);
    p.endShape();
  }

  drawWaveform(p, a, b, dist) {
    const steps = Math.max(10, Math.floor(dist / 10));
    const dx = (b.x - a.x) / steps;
    const dy = (b.y - a.y) / steps;
    const perpX = -dy / dist * connection.waveAmplitude;
    const perpY =  dx / dist * connection.waveAmplitude;
    p.noFill();
    p.beginShape();
    for (let i = 0; i <= steps; i++) {
      const wave = Math.sin((i / steps) * Math.PI * connection.waveFrequency * 2 + this.time * 0.1);
      p.vertex(a.x + dx * i + perpX * wave, a.y + dy * i + perpY * wave);
    }
    p.endShape();
  }

  drawPulse(p, a, b, dist) {
    const steps = Math.max(10, Math.floor(dist / 8));
    const dx = (b.x - a.x) / steps;
    const dy = (b.y - a.y) / steps; // was (b.y - b.y) — fixed
    p.noFill();
    p.beginShape();
    for (let i = 0; i <= steps; i++) {
      const x = a.x + dx * i;
      let y = a.y + dy * i;
      const mod = i % 4;
      if (mod === 0)      y -= 5 + Math.sin(this.time * 0.2 * connection.pulseSpeed) * 3;
      else if (mod === 2) y += 5 - Math.sin(this.time * 0.2 * connection.pulseSpeed) * 3;
      p.vertex(x, y);
    }
    p.endShape();
  }

  // ============================================================
  // Region / Blob Overlays
  // ============================================================

  renderRegion(p, blob) {
    p.stroke(shape.color);
    p.strokeWeight(shape.strokeWidth);
    p.noFill();

    switch (region.style) {
      case 'basic':    this.drawBasicRegion(p, blob);    break;
      case 'label':    this.drawLabelRegion(p, blob);    break;
      case 'frame':    this.drawFrameRegion(p, blob);    break;
      case 'lframe':   this.drawLFrameRegion(p, blob);   break;
      case 'xframe':   this.drawXFrameRegion(p, blob);   break;
      case 'grid':     this.drawGridRegion(p, blob);     break;
      case 'particle': this.drawParticleRegion(p, blob); break;
      case 'dash':     this.drawDashRegion(p, blob);     break;
      case 'scope':    this.drawScopeRegion(p, blob);    break;
      case 'win2k':    this.drawWin2KRegion(p, blob);    break;
      case 'label2':   this.drawLabel2Region(p, blob);   break;
      case 'glow':     this.drawGlowRegion(p, blob);     break;
      default:         this.drawBasicRegion(p, blob);
    }

    // Blob ID badge (top-left corner of bounding box)
    if (blob.id !== undefined) {
      p.fill(shape.color);
      p.noStroke();
      p.textSize(9);
      p.textAlign(p.LEFT, p.TOP);
      p.text(`#${blob.id}`, blob.bounds.x + 3, blob.bounds.y + 2);
    }
  }

  drawShape(p, x, y, scale) {
    const s = scale * shape.size;
    switch (shape.type) {
      case 'square':
        p.rectMode(p.CENTER);
        p.rect(x, y, s, s);
        break;
      case 'circle':
        p.ellipse(x, y, s, s);
        break;
      case 'rectangle':
        p.rectMode(p.CENTER);
        p.rect(x, y, s * 1.5, s);
        break;
    }
  }

  drawBasicRegion(p, blob) {
    this.drawShape(p, blob.x, blob.y, 1);
  }

  drawLabelRegion(p, blob) {
    this.drawShape(p, blob.x, blob.y, 1);
    p.fill(shape.color);
    p.noStroke();
    p.textSize(region.labelSize);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text(region.label, blob.x, blob.y - shape.size);
  }

  drawFrameRegion(p, blob) {
    const b = blob.bounds;
    p.noFill();
    p.rect(b.x, b.y, b.w, b.h);
    this.drawShape(p, blob.x, blob.y, 0.5);
  }

  drawLFrameRegion(p, blob) {
    const b = blob.bounds;
    const t = region.frameThickness;
    const cLen = Math.max(10, Math.min(b.w, b.h) * 0.3);

    p.noFill();
    p.stroke(shape.color);
    p.strokeWeight(t);

    // Top-left
    p.line(b.x, b.y, b.x + cLen, b.y);
    p.line(b.x, b.y, b.x, b.y + cLen);
    // Top-right
    p.line(b.x + b.w, b.y, b.x + b.w - cLen, b.y);
    p.line(b.x + b.w, b.y, b.x + b.w, b.y + cLen);
    // Bottom-left
    p.line(b.x, b.y + b.h, b.x + cLen, b.y + b.h);
    p.line(b.x, b.y + b.h, b.x, b.y + b.h - cLen);
    // Bottom-right
    p.line(b.x + b.w, b.y + b.h, b.x + b.w - cLen, b.y + b.h);
    p.line(b.x + b.w, b.y + b.h, b.x + b.w, b.y + b.h - cLen);

    this.drawShape(p, blob.x, blob.y, 0.5);
  }

  drawXFrameRegion(p, blob) {
    const b = blob.bounds;
    p.noFill();
    p.line(b.x, b.y, b.x + b.w, b.y + b.h);
    p.line(b.x + b.w, b.y, b.x, b.y + b.h);
    this.drawShape(p, blob.x, blob.y, 0.5);
  }

  drawGridRegion(p, blob) {
    const b = blob.bounds;
    const spacing = region.gridSpacing;
    p.noFill();
    p.strokeWeight(1);
    for (let gx = b.x; gx < b.x + b.w; gx += spacing) {
      p.line(gx, b.y, gx, b.y + b.h);
    }
    for (let gy = b.y; gy < b.y + b.h; gy += spacing) {
      p.line(b.x, gy, b.x + b.w, gy);
    }
    this.drawShape(p, blob.x, blob.y, 0.5);
  }

  drawParticleRegion(p, blob) {
    const b = blob.bounds;
    p.fill(shape.color);
    p.noStroke();
    for (let i = 0; i < region.particleCount; i++) {
      p.ellipse(b.x + Math.random() * b.w, b.y + Math.random() * b.h, 3, 3);
    }
    this.drawShape(p, blob.x, blob.y, 0.5);
  }

  drawDashRegion(p, blob) {
    const b = blob.bounds;
    const dashLen = region.dashLength;
    p.noFill();
    p.strokeWeight(2);
    const perimeter = 2 * (b.w + b.h);
    const dashes = Math.floor(perimeter / (dashLen * 2));
    for (let i = 0; i < dashes; i++) {
      const t = (i * 2 + 0.5) / dashes;
      const pos  = this.getPerimeterPoint(b, t);
      const next = this.getPerimeterPoint(b, t + 0.5 / dashes);
      if (pos && next) p.line(pos.x, pos.y, next.x, next.y);
    }
    this.drawShape(p, blob.x, blob.y, 0.5);
  }

  getPerimeterPoint(b, t) {
    const perim = 2 * (b.w + b.h);
    const d = ((t % 1) + 1) % 1 * perim;
    if (d < b.w)              return { x: b.x + d,                    y: b.y };
    if (d < b.w + b.h)        return { x: b.x + b.w,                  y: b.y + (d - b.w) };
    if (d < 2 * b.w + b.h)    return { x: b.x + b.w - (d - b.w - b.h), y: b.y + b.h };
    return                           { x: b.x,                         y: b.y + b.h - (d - 2 * b.w - b.h) };
  }

  drawScopeRegion(p, blob) {
    const b = blob.bounds;
    p.noFill();
    p.ellipse(blob.x, blob.y, b.w, b.h);
    p.line(blob.x - b.w / 2, blob.y, blob.x + b.w / 2, blob.y);
    p.line(blob.x, blob.y - b.h / 2, blob.x, blob.y + b.h / 2);
    p.fill(shape.color);
    p.noStroke();
    p.ellipse(blob.x, blob.y, 4, 4);
  }

  drawWin2KRegion(p, blob) {
    const b = blob.bounds;
    const titleH = 16;
    p.fill('#000080');
    p.noStroke();
    p.rect(b.x, b.y, b.w, titleH);
    p.fill(shape.color);
    p.textSize(10);
    p.textAlign(p.LEFT, p.CENTER);
    p.text(region.label || 'Window', b.x + 4, b.y + titleH / 2);
    p.noFill();
    p.stroke(shape.color);
    p.rect(b.x, b.y + titleH, b.w, b.h - titleH);
    p.line(b.x + b.w - 12, b.y + 4, b.x + b.w - 4, b.y + 12);
    p.line(b.x + b.w - 4,  b.y + 4, b.x + b.w - 12, b.y + 12);
  }

  drawLabel2Region(p, blob) {
    this.drawShape(p, blob.x, blob.y, 1);
    p.fill('#000000aa');
    p.noStroke();
    p.rect(blob.x - 24, blob.y + shape.size / 2, 48, 14);
    p.fill(shape.color);
    p.textSize(10);
    p.textAlign(p.CENTER, p.TOP);
    p.text(`${Math.round(blob.x)},${Math.round(blob.y)}`, blob.x, blob.y + shape.size / 2 + 2);
  }

  drawGlowRegion(p, blob) {
    const intensity = region.glowIntensity;
    p.noStroke();
    for (let i = 3; i >= 0; i--) {
      // setAlpha expects 0-255
      const alpha = intensity * (1 - i / 4) * 255;
      const c = p.color(shape.color);
      c.setAlpha(alpha);
      p.fill(c);
      this.drawShape(p, blob.x, blob.y, 1 + i * 0.5);
    }
    p.fill(shape.color);
    this.drawShape(p, blob.x, blob.y, 0.5);
  }

  dispose() {}
}
