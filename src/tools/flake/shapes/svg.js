// ============================================================
// SVG Import/Export Handler
// ============================================================

import { customShape } from '../state.js';

/**
 * Parse an SVG file and extract paths
 * @param {string} svgString - SVG XML string
 * @returns {Object} - parsed paths and bounds
 */
export function parseSVG(svgString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  
  if (!svg) {
    throw new Error('Invalid SVG file');
  }
  
  // Get viewBox or calculate bounds
  let viewBox = svg.viewBox.baseVal;
  if (!viewBox || viewBox.width === 0) {
    // Try to get from width/height attributes
    const width = parseFloat(svg.getAttribute('width')) || 100;
    const height = parseFloat(svg.getAttribute('height')) || 100;
    viewBox = { x: 0, y: 0, width, height };
  }
  
  // Extract all paths
  const paths = [];
  const pathElements = svg.querySelectorAll('path, circle, rect, ellipse, polygon, polyline');
  
  pathElements.forEach(el => {
    const pathData = elementToPath(el);
    if (pathData) {
      paths.push(pathData);
    }
  });
  
  // If no paths found, try to get outline from shapes
  if (paths.length === 0) {
    // Create a simple rectangle as fallback
    paths.push({
      type: 'rect',
      x: viewBox.x,
      y: viewBox.y,
      width: viewBox.width,
      height: viewBox.height,
    });
  }
  
  return {
    paths,
    bounds: {
      x: viewBox.x,
      y: viewBox.y,
      width: viewBox.width,
      height: viewBox.height,
    },
  };
}

/**
 * Convert SVG element to path data
 * @param {Element} el - SVG element
 * @returns {Object|null} - path data
 */
function elementToPath(el) {
  const tagName = el.tagName.toLowerCase();
  
  switch (tagName) {
    case 'path':
      return {
        type: 'path',
        d: el.getAttribute('d'),
      };
      
    case 'circle':
      const cx = parseFloat(el.getAttribute('cx')) || 0;
      const cy = parseFloat(el.getAttribute('cy')) || 0;
      const r = parseFloat(el.getAttribute('r')) || 0;
      return {
        type: 'circle',
        cx, cy, r,
      };
      
    case 'rect':
      const x = parseFloat(el.getAttribute('x')) || 0;
      const y = parseFloat(el.getAttribute('y')) || 0;
      const width = parseFloat(el.getAttribute('width')) || 0;
      const height = parseFloat(el.getAttribute('height')) || 0;
      const rx = parseFloat(el.getAttribute('rx')) || 0;
      return {
        type: 'rect',
        x, y, width, height, rx,
      };
      
    case 'ellipse': {
      const ecx = parseFloat(el.getAttribute('cx')) || 0;
      const ecy = parseFloat(el.getAttribute('cy')) || 0;
      const erx = parseFloat(el.getAttribute('rx')) || 0;
      const ery = parseFloat(el.getAttribute('ry')) || 0;
      return {
        type: 'ellipse',
        cx: ecx, cy: ecy, rx: erx, ry: ery,
      };
    }
      
    case 'polygon':
    case 'polyline':
      const points = el.getAttribute('points') || '';
      return {
        type: tagName,
        points: parsePoints(points),
      };
      
    default:
      return null;
  }
}

/**
 * Parse points attribute
 * @param {string} pointsStr - points string
 * @returns {Array} - array of {x, y} points
 */
function parsePoints(pointsStr) {
  const coords = pointsStr.trim().split(/[\s,]+/);
  const points = [];
  for (let i = 0; i < coords.length; i += 2) {
    points.push({
      x: parseFloat(coords[i]) || 0,
      y: parseFloat(coords[i + 1]) || 0,
    });
  }
  return points;
}

/**
 * Draw a parsed SVG path in p5
 * @param {p5} p - p5 instance
 * @param {Object} pathData - path data from parseSVG
 * @param {number} x - center x position
 * @param {number} y - center y position
 * @param {number} size - target size
 * @param {Object} bounds - original bounds
 * @param {number} rotation - rotation in degrees
 */
export function drawSVGPath(p, pathData, x, y, size, bounds, rotation = 0) {
  p.push();
  p.translate(x, y);
  p.rotate(p.radians(rotation));
  
  // Calculate scale to fit within size while maintaining aspect ratio
  const scaleX = size / bounds.width;
  const scaleY = size / bounds.height;
  const scale = Math.min(scaleX, scaleY);
  
  p.scale(scale);
  p.translate(-bounds.x - bounds.width / 2, -bounds.y - bounds.height / 2);
  
  switch (pathData.type) {
    case 'path':
      drawPathString(p, pathData.d);
      break;
    case 'circle':
      p.ellipse(pathData.cx, pathData.cy, pathData.r * 2, pathData.r * 2);
      break;
    case 'rect':
      if (pathData.rx > 0) {
        p.rect(pathData.x, pathData.y, pathData.width, pathData.height, pathData.rx);
      } else {
        p.rect(pathData.x, pathData.y, pathData.width, pathData.height);
      }
      break;
    case 'ellipse':
      p.ellipse(pathData.cx, pathData.cy, pathData.rx * 2, pathData.ry * 2);
      break;
    case 'polygon':
    case 'polyline':
      p.beginShape();
      if (pathData.type === 'polygon') {
        // Polygon closes automatically
      }
      pathData.points.forEach(pt => p.vertex(pt.x, pt.y));
      if (pathData.type === 'polygon') {
        p.endShape(p.CLOSE);
      } else {
        p.endShape();
      }
      break;
  }
  
  p.pop();
}

/**
 * Parse and draw SVG path string
 * This is a simplified parser - for complex paths, consider using paper.js
 * @param {p5} p - p5 instance
 * @param {string} d - path data string
 */
function drawPathString(p, d) {
  // For now, use a simplified approach
  // In production, you might want to use a full SVG path parser
  // or integrate with paper.js for full path support
  
  const commands = d.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || [];
  
  p.beginShape();
  let x = 0, y = 0;
  let startX = 0, startY = 0;
  
  for (const cmd of commands) {
    const type = cmd[0];
    const args = cmd.slice(1).trim().split(/[\s,]+/).filter(s => s).map(parseFloat);
    
    switch (type) {
      case 'M':
        x = args[0];
        y = args[1];
        startX = x;
        startY = y;
        p.vertex(x, y);
        break;
      case 'm':
        x += args[0];
        y += args[1];
        startX = x;
        startY = y;
        p.vertex(x, y);
        break;
      case 'L':
        x = args[0];
        y = args[1];
        p.vertex(x, y);
        break;
      case 'l':
        x += args[0];
        y += args[1];
        p.vertex(x, y);
        break;
      case 'H':
        x = args[0];
        p.vertex(x, y);
        break;
      case 'h':
        x += args[0];
        p.vertex(x, y);
        break;
      case 'V':
        y = args[0];
        p.vertex(x, y);
        break;
      case 'v':
        y += args[0];
        p.vertex(x, y);
        break;
      case 'Z':
      case 'z':
        p.vertex(startX, startY);
        break;
      // Curves (simplified - using control points as vertices)
      case 'C':
        if (args.length >= 6) {
          p.bezierVertex(args[0], args[1], args[2], args[3], args[4], args[5]);
          x = args[4];
          y = args[5];
        }
        break;
      case 'Q':
        if (args.length >= 4) {
          p.quadraticVertex(args[0], args[1], args[2], args[3]);
          x = args[2];
          y = args[3];
        }
        break;
    }
  }
  
  p.endShape();
}

/**
 * Load SVG from file
 * @param {File} file - File object
 * @returns {Promise<Object>} - parsed SVG data
 */
export function loadSVGFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = parseSVG(e.target.result);
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Generate SVG string from current composition
 * @param {Array} shapes - array of shape data
 * @param {Object} options - export options
 * @returns {string} - SVG XML string
 */
export function generateSVG(shapes, options) {
  const { width, height, background } = options;
  
  let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  svg += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n`;
  
  // Background
  if (background) {
    svg += `  <rect width="${width}" height="${height}" fill="${background}"/>\n`;
  }
  
  // Shapes
  for (const shape of shapes) {
    svg += shapeToSVG(shape);
  }
  
  svg += `</svg>`;
  return svg;
}

/**
 * Convert a shape to SVG element string
 * @param {Object} shape - shape data
 * @returns {string} - SVG element
 */
function shapeToSVG(shape) {
  const { type, x, y, size, rotation, fill, stroke, strokeWidth, opacity } = shape;
  
  const fillStr = fill || 'none';
  const strokeStr = stroke || 'none';
  const strokeWidthStr = strokeWidth || 0;
  const opacityStr = opacity !== undefined ? opacity : 1;
  
  const attrs = `fill="${fillStr}" stroke="${strokeStr}" stroke-width="${strokeWidthStr}" opacity="${opacityStr}"`;
  
  switch (type) {
    case 'circle':
      return `  <circle cx="${x}" cy="${y}" r="${size / 2}" ${attrs}/>\n`;
    case 'square': {
      const half = size / 2;
      if (rotation) {
        return `  <rect x="${x - half}" y="${y - half}" width="${size}" height="${size}" transform="rotate(${rotation} ${x} ${y})" ${attrs}/>\n`;
      }
      return `  <rect x="${x - half}" y="${y - half}" width="${size}" height="${size}" ${attrs}/>\n`;
    }
    case 'triangle': {
      const r = size / 2;
      const points = [
        [x, y - r],
        [x - r * 0.866, y + r * 0.5],
        [x + r * 0.866, y + r * 0.5],
      ];
      if (rotation) {
        // Apply rotation to points
        const rad = (rotation - 90) * Math.PI / 180;
        const rotated = points.map(([px, py]) => {
          const dx = px - x;
          const dy = py - y;
          return [
            x + dx * Math.cos(rad) - dy * Math.sin(rad),
            y + dx * Math.sin(rad) + dy * Math.cos(rad),
          ];
        });
        return `  <polygon points="${rotated.map(p => p.join(',')).join(' ')}" ${attrs}/>\n`;
      }
      return `  <polygon points="${points.map(p => p.join(',')).join(' ')}" ${attrs}/>\n`;
    }
    default:
      // Default to circle
      return `  <circle cx="${x}" cy="${y}" r="${size / 2}" ${attrs}/>\n`;
  }
}
