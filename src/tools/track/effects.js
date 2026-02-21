// ============================================================
// Effects Rendering - Mesh/Connection Visualization
// ============================================================

import { shape, region, connection, filterEffect, canvas } from './state.js';

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

  renderConnections(p, blobs) {
    const maxDist = connection.maxDistance;
    
    p.stroke(connection.color);
    p.strokeWeight(connection.strokeWidth);
    
    const con = p.color(connection.color);
    con.setAlpha(connection.opacity);
    p.stroke(con);
    p.noFill();
    
    for (let i = 0; i < blobs.length; i++) {
      for (let j = i + 1; j < blobs.length; j++) {
        const a = blobs[i];
        const b = blobs[j];
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        
        if (dist < maxDist) {
          const alpha = 1 - (dist / maxDist);
          con.setAlpha(connection.opacity * alpha);
          p.stroke(con);
          
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
    const perpY = dx / dist * connection.waveAmplitude;
    
    p.noFill();
    p.beginShape();
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = a.x + dx * i;
      const y = a.y + dy * i;
      const wave = Math.sin(t * Math.PI * connection.waveFrequency * 2 + this.time * 0.1);
      p.vertex(x + perpX * wave, y + perpY * wave);
    }
    p.endShape();
  }

  drawPulse(p, a, b, dist) {
    const steps = Math.max(10, Math.floor(dist / 8));
    const dx = (b.x - a.x) / steps;
    const dy = (b.y - b.y) / steps;
    
    p.noFill();
    p.beginShape();
    
    let lastY = a.y;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = a.x + dx * i;
      
      let y;
      if (i % 4 === 0) {
        y = a.y + dy * i - 5 + Math.sin(this.time * 0.2 * connection.pulseSpeed) * 3;
      } else if (i % 4 === 2) {
        y = a.y + dy * i + 5 - Math.sin(this.time * 0.2 * connection.pulseSpeed) * 3;
      } else {
        y = a.y + dy * i;
      }
      
      p.vertex(x, y);
      lastY = y;
    }
    p.endShape();
  }

  renderRegion(p, blob) {
    const { x, y, bounds } = blob;
    const { w, h } = bounds;
    
    p.stroke(shape.color);
    p.strokeWeight(shape.strokeWidth);
    p.noFill();
    
    switch (region.style) {
      case 'basic':
        this.drawBasicRegion(p, blob);
        break;
      case 'label':
        this.drawLabelRegion(p, blob);
        break;
      case 'frame':
        this.drawFrameRegion(p, blob);
        break;
      case 'lframe':
        this.drawLFrameRegion(p, blob);
        break;
      case 'xframe':
        this.drawXFrameRegion(p, blob);
        break;
      case 'grid':
        this.drawGridRegion(p, blob);
        break;
      case 'particle':
        this.drawParticleRegion(p, blob);
        break;
      case 'dash':
        this.drawDashRegion(p, blob);
        break;
      case 'scope':
        this.drawScopeRegion(p, blob);
        break;
      case 'win2k':
        this.drawWin2KRegion(p, blob);
        break;
      case 'label2':
        this.drawLabel2Region(p, blob);
        break;
      case 'glow':
        this.drawGlowRegion(p, blob);
        break;
      default:
        this.drawBasicRegion(p, blob);
    }
  }

  drawShape(p, x, y, size) {
    const s = size * shape.size;
    
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
    
    p.noFill();
    p.stroke(shape.color);
    p.strokeWeight(t);
    
    p.line(b.x, b.y, b.x + b.w, b.y);
    p.line(b.x, b.y, b.x, b.y + b.h);
    
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
    const count = region.particleCount;
    
    p.fill(shape.color);
    p.noStroke();
    
    for (let i = 0; i < count; i++) {
      const px = b.x + Math.random() * b.w;
      const py = b.y + Math.random() * b.h;
      p.ellipse(px, py, 3, 3);
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
      const pos = this.getPerimeterPoint(b, t);
      const nextPos = this.getPerimeterPoint(b, t + 0.5 / dashes);
      
      if (pos && nextPos) {
        p.line(pos.x, pos.y, nextPos.x, nextPos.y);
      }
    }
    
    this.drawShape(p, blob.x, blob.y, 0.5);
  }

  getPerimeterPoint(b, t) {
    const perimeter = 2 * (b.w + b.h);
    const d = t * perimeter;
    
    if (d < b.w) return { x: b.x + d, y: b.y };
    if (d < b.w + b.h) return { x: b.x + b.w, y: b.y + (d - b.w) };
    if (d < 2 * b.w + b.h) return { x: b.x + b.w - (d - b.w - b.h), y: b.y + b.h };
    return { x: b.x, y: b.y + b.h - (d - 2 * b.w - b.h) };
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
    p.line(b.x + b.w - 4, b.y + 4, b.x + b.w - 12, b.y + 12);
  }

  drawLabel2Region(p, blob) {
    this.drawShape(p, blob.x, blob.y, 1);
    
    const b = blob.bounds;
    p.fill('#000000aa');
    p.noStroke();
    p.rect(blob.x - 20, blob.y + shape.size / 2, 40, 14);
    
    p.fill(shape.color);
    p.textSize(10);
    p.textAlign(p.CENTER, p.TOP);
    p.text(`${Math.round(blob.x)},${Math.round(blob.y)}`, blob.x, blob.y + shape.size / 2 + 2);
  }

  drawGlowRegion(p, blob) {
    const intensity = region.glowIntensity;
    const baseSize = shape.size;
    
    p.noStroke();
    
    for (let i = 3; i >= 0; i--) {
      const alpha = intensity * (1 - i / 4);
      const c = p.color(shape.color);
      c.setAlpha(alpha);
      p.fill(c);
      this.drawShape(p, blob.x, blob.y, 1 + i * 0.5);
    }
    
    p.fill(shape.color);
    this.drawShape(p, blob.x, blob.y, 0.5);
  }

  dispose() {
  }
}
