// ============================================================
// SPLITX Tool — Shape Generators (Path2D for Canvas2D)
// ============================================================

import { createNoise2D } from 'simplex-noise';

const noise2D = createNoise2D();

// Cache: rebuild only when type or r changes
let _cache = { type: null, r: null, path2d: null };

/**
 * Returns a Path2D for the given shape type, centered at origin (0,0).
 * r = base radius in pixels.
 * customSvgItem = paper.js item (only used for 'custom' type).
 */
export function getShapePath2D(type, r, customSvgItem = null) {
  if (_cache.type === type && _cache.r === r && type !== 'blob' && type !== 'organic') {
    return _cache.path2d;
  }
  const path2d = buildPath2D(type, r, customSvgItem);
  _cache = { type, r, path2d };
  return path2d;
}

/** Invalidate the cache (call when canvas is resized). */
export function invalidateShapeCache() {
  _cache = { type: null, r: null, path2d: null };
}

function buildPath2D(type, r, customSvgItem) {
  switch (type) {
    case 'rectangle': return rectPath(r * 2, r * 1.3);
    case 'circle':    return circlePath(r);
    case 'ring':      return ringPath(r, r * 0.58);
    case 'oval':      return rectEllipsePath(r * 3.1, r * 1.2);
    case 'triangle':  return polygonPath(3, r, -Math.PI / 2);
    case 'rhombus':   return rhombusPath(r * 0.65, r);
    case 'cross':     return crossPath(r);
    case 'star':      return starPath(5, r * 0.4, r);
    case 'hexagon':   return polygonPath(6, r, -Math.PI / 6);
    case 'petals':    return petalsPath(6, r);
    case 'checker':   return checkerPath(r, 4);
    case 'blob':      return blobPath(r, 8);
    case 'organic':   return organicPath(r, 12);
    case 'custom':    return customPath(r, customSvgItem);
    default:          return circlePath(r);
  }
}

// ── Shape builders ────────────────────────────────────────────

function circlePath(r) {
  const p = new Path2D();
  p.arc(0, 0, r, 0, Math.PI * 2);
  return p;
}

function rectPath(w, h) {
  const p = new Path2D();
  p.rect(-w / 2, -h / 2, w, h);
  return p;
}

function rectEllipsePath(w, h) {
  const p = new Path2D();
  p.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
  return p;
}

function ringPath(outer, inner) {
  const p = new Path2D();
  p.arc(0, 0, outer, 0, Math.PI * 2);
  p.arc(0, 0, inner, 0, Math.PI * 2, true); // clockwise=true cuts hole
  return p;
}

function polygonPath(sides, r, startAngle = 0) {
  const p = new Path2D();
  for (let i = 0; i < sides; i++) {
    const a = startAngle + (i / sides) * Math.PI * 2;
    if (i === 0) p.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else         p.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  p.closePath();
  return p;
}

function rhombusPath(hw, hh) {
  const p = new Path2D();
  p.moveTo(0, -hh); p.lineTo(hw, 0); p.lineTo(0, hh); p.lineTo(-hw, 0);
  p.closePath();
  return p;
}

function crossPath(r) {
  const t = r * 0.32;
  const p = new Path2D();
  p.moveTo(-t, -r); p.lineTo(t, -r); p.lineTo(t, -t); p.lineTo(r, -t);
  p.lineTo(r, t);   p.lineTo(t, t);  p.lineTo(t, r);  p.lineTo(-t, r);
  p.lineTo(-t, t);  p.lineTo(-r, t); p.lineTo(-r, -t);p.lineTo(-t, -t);
  p.closePath();
  return p;
}

function starPath(points, innerR, outerR) {
  const p = new Path2D();
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const rv = i % 2 === 0 ? outerR : innerR;
    if (i === 0) p.moveTo(Math.cos(a) * rv, Math.sin(a) * rv);
    else         p.lineTo(Math.cos(a) * rv, Math.sin(a) * rv);
  }
  p.closePath();
  return p;
}

function petalsPath(count, r) {
  const p = new Path2D();
  const w = r * 0.44, h = r;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    // Rotated ellipse petal centered at origin, tip at angle
    // Use parametric ellipse points rotated
    const steps = 36;
    for (let j = 0; j <= steps; j++) {
      const theta = (j / steps) * Math.PI * 2;
      const ex = (w / 2) * Math.cos(theta);
      const ey = (h / 2) * Math.sin(theta) + h / 2; // offset up
      // rotate by angle
      const rx = ex * cos - ey * sin;
      const ry = ex * sin + ey * cos;
      if (j === 0) p.moveTo(rx, ry);
      else         p.lineTo(rx, ry);
    }
    p.closePath();
  }
  return p;
}

function checkerPath(r, grid) {
  const cell = r / grid;
  const p = new Path2D();
  for (let row = 0; row < grid * 2; row++) {
    for (let col = 0; col < grid * 2; col++) {
      if ((row + col) % 2 === 0) {
        const x = (col - grid) * cell;
        const y = (row - grid) * cell;
        p.rect(x, y, cell, cell);
      }
    }
  }
  return p;
}

function blobPath(r, pts) {
  const p = new Path2D();
  const angles = Array.from({ length: pts }, (_, i) => (i / pts) * Math.PI * 2);
  const radii  = angles.map(a => r * (0.75 + noise2D(Math.cos(a) * 2, Math.sin(a) * 2) * 0.32));
  smoothCurvePath(p, angles, radii);
  return p;
}

function organicPath(r, pts) {
  const p = new Path2D();
  const angles = Array.from({ length: pts }, (_, i) => (i / pts) * Math.PI * 2);
  const radii  = angles.map(a => r * (0.5 + noise2D(Math.cos(a) * 3 + 100, Math.sin(a) * 3) * 0.55));
  smoothCurvePath(p, angles, radii);
  return p;
}

function smoothCurvePath(p, angles, radii) {
  const n = angles.length;
  const pts = angles.map((a, i) => [Math.cos(a) * radii[i], Math.sin(a) * radii[i]]);
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const cur  = pts[i];
    const next = pts[(i + 1) % n];
    const cp1x = cur[0] + (next[0] - prev[0]) * 0.2;
    const cp1y = cur[1] + (next[1] - prev[1]) * 0.2;
    if (i === 0) p.moveTo(cur[0], cur[1]);
    else         p.bezierCurveTo(prev[0] + (cur[0] - pts[(i-2+n)%n][0])*0.2,
                                  prev[1] + (cur[1] - pts[(i-2+n)%n][1])*0.2,
                                  cp1x - (next[0] - cur[0])*0.2,
                                  cp1y - (next[1] - cur[1])*0.2,
                                  cur[0], cur[1]);
  }
  p.closePath();
}

function customPath(r, svgItem) {
  if (!svgItem) return circlePath(r);
  try {
    // paper.js item has pathData getter (SVG path string)
    const svgStr = svgItem.pathData ?? svgItem.exportSVG({ asString: true });
    if (svgStr) return new Path2D(svgStr);
  } catch (e) {
    // fall through
  }
  return circlePath(r);
}
