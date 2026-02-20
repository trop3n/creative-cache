// ============================================================
// FLAKE Tool — Color computation
// ============================================================

/**
 * Get fill color for a cell.
 * @param {number} dist   normalised distance from tile centre (0–1)
 * @param {number} index  cell index (for palette cycling)
 * @param {Object} st     style state object
 * @returns {string} hex color
 */
export function getFillColor(dist, index, st) {
  const { colors, fillMapping } = st;
  if (!colors || colors.length === 0) return '#ffffff';

  // fillMapping 0 → solid first color; 1–4 → gradient across N colors
  if (fillMapping <= 0) return colors[0];

  const numColors = Math.min(Math.round(fillMapping) + 1, colors.length);

  if (numColors === 1) return colors[0];

  const t = dist * (numColors - 1);
  const i = Math.min(Math.floor(t), numColors - 2);
  const frac = t - i;

  return interpolateHex(colors[i], colors[Math.min(i + 1, colors.length - 1)], frac);
}

function interpolateHex(a, b, t) {
  const r1 = parseInt(a.slice(1, 3), 16);
  const g1 = parseInt(a.slice(3, 5), 16);
  const b1 = parseInt(a.slice(5, 7), 16);
  const r2 = parseInt(b.slice(1, 3), 16);
  const g2 = parseInt(b.slice(3, 5), 16);
  const b2 = parseInt(b.slice(5, 7), 16);
  const r  = Math.round(r1 + (r2 - r1) * t).toString(16).padStart(2, '0');
  const g  = Math.round(g1 + (g2 - g1) * t).toString(16).padStart(2, '0');
  const bh = Math.round(b1 + (b2 - b1) * t).toString(16).padStart(2, '0');
  return `#${r}${g}${bh}`;
}
