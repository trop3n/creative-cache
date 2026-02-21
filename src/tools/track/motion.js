// ============================================================
// Motion Detection - Frame Differencing & Blob Detection
// ============================================================

import { motion } from './state.js';

export class MotionDetector {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.prevFrame = null;
    this.diffBuffer = new Uint8ClampedArray(width * height);
    this.blobs = [];
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.prevFrame = null;
    this.diffBuffer = new Uint8ClampedArray(width * height);
    this.blobs = [];
  }

  detect(currentFrame) {
    if (!currentFrame) return [];
    
    const { width, height, diffBuffer } = this;
    const data = currentFrame.data;
    
    if (!this.prevFrame) {
      this.prevFrame = new Uint8ClampedArray(data.length);
      this.prevFrame.set(data);
      return [];
    }

    const threshold = motion.threshold;
    const sensitivity = motion.sensitivity;
    
    for (let i = 0; i < width * height; i++) {
      const idx = i * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      const gray = (r * 0.299 + g * 0.587 + b * 0.114);
      
      const prevIdx = idx;
      const prevGray = (
        this.prevFrame[prevIdx] * 0.299 +
        this.prevFrame[prevIdx + 1] * 0.587 +
        this.prevFrame[prevIdx + 2] * 0.114
      );
      
      let diff = Math.abs(gray - prevGray) * sensitivity;
      diffBuffer[i] = diff > threshold ? Math.min(255, diff * 2) : 0;
    }

    if (motion.blur > 0) {
      this.applyBlur(diffBuffer, width, height, motion.blur);
    }

    this.prevFrame.set(data);
    
    this.blobs = this.findBlobs(diffBuffer, width, height);
    
    return this.blobs;
  }

  applyBlur(buffer, width, height, radius) {
    const temp = new Uint8ClampedArray(buffer.length);
    const r = Math.ceil(radius);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let count = 0;
        
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              sum += buffer[ny * width + nx];
              count++;
            }
          }
        }
        
        temp[y * width + x] = Math.round(sum / count);
      }
    }
    
    buffer.set(temp);
  }

  findBlobs(buffer, width, height) {
    const labels = new Int32Array(width * height);
    let currentLabel = 0;
    const minSize = motion.minBlobSize;
    
    const parent = [];
    
    function find(x) {
      if (parent[x] !== x) {
        parent[x] = find(parent[x]);
      }
      return parent[x];
    }
    
    function union(a, b) {
      const rootA = find(a);
      const rootB = find(b);
      if (rootA !== rootB) {
        parent[rootB] = rootA;
      }
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        
        if (buffer[idx] === 0) {
          labels[idx] = 0;
          continue;
        }
        
        const left = x > 0 ? labels[idx - 1] : 0;
        const top = y > 0 ? labels[idx - width] : 0;
        
        if (left === 0 && top === 0) {
          currentLabel++;
          parent[currentLabel] = currentLabel;
          labels[idx] = currentLabel;
        } else if (left !== 0 && top === 0) {
          labels[idx] = left;
        } else if (left === 0 && top !== 0) {
          labels[idx] = top;
        } else {
          labels[idx] = Math.min(left, top);
          if (left !== top) {
            union(left, top);
          }
        }
      }
    }

    const blobData = new Map();
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        let label = labels[idx];
        
        if (label === 0) continue;
        
        label = find(label);
        labels[idx] = label;
        
        if (!blobData.has(label)) {
          blobData.set(label, {
            minX: x, maxX: x,
            minY: y, maxY: y,
            sumX: 0, sumY: 0,
            count: 0,
            totalIntensity: 0
          });
        }
        
        const blob = blobData.get(label);
        blob.minX = Math.min(blob.minX, x);
        blob.maxX = Math.max(blob.maxX, x);
        blob.minY = Math.min(blob.minY, y);
        blob.maxY = Math.max(blob.maxY, y);
        blob.sumX += x;
        blob.sumY += y;
        blob.count++;
        blob.totalIntensity += buffer[idx];
      }
    }

    const blobs = [];
    for (const [label, data] of blobData) {
      if (data.count >= minSize) {
        blobs.push({
          x: data.sumX / data.count,
          y: data.sumY / data.count,
          width: data.maxX - data.minX + 1,
          height: data.maxY - data.minY + 1,
          size: data.count,
          intensity: data.totalIntensity / data.count,
          bounds: {
            x: data.minX,
            y: data.minY,
            w: data.maxX - data.minX + 1,
            h: data.maxY - data.minY + 1
          }
        });
      }
    }
    
    return blobs.sort((a, b) => b.size - a.size);
  }

  getDiffBuffer() {
    return this.diffBuffer;
  }

  getDiffImageData() {
    const imageData = new ImageData(this.width, this.height);
    const data = imageData.data;
    
    for (let i = 0; i < this.diffBuffer.length; i++) {
      const idx = i * 4;
      const val = this.diffBuffer[i];
      data[idx] = val;
      data[idx + 1] = val;
      data[idx + 2] = val;
      data[idx + 3] = 255;
    }
    
    return imageData;
  }

  dispose() {
    this.prevFrame = null;
    this.diffBuffer = null;
    this.blobs = [];
  }
}
