// ============================================================
// FLAKE Tool — Color computation
// ============================================================

/**
 * Get fill color for a cell.
 * @param {number} dist   normalised distance from tile centre (0–1)
 * @param {number} index  cell index (for palette cycling, currently unused)
 * @param {Object} st     style state object (uses st.colorType and st.colors)
 * @returns {string} hex color
 */
export function getFillColor(dist, index, st) {
  const { colors, colorType } = st;
  if (!colors || colors.length === 0) return '#ffffff';

  switch (colorType) {
    case 'solidColor':
      return colors[0];

    case 'paletteSequence': {
      const i = Math.min(Math.floor(dist * colors.length), colors.length - 1);
      return colors[i];
    }

    case 'paletteTransition':
    default: {
      const t = dist * (colors.length - 1);
      const i = Math.min(Math.floor(t), colors.length - 2);
      const frac = t - i;
      return interpolateHex(colors[i], colors[Math.min(i + 1, colors.length - 1)], frac);
    }
  }
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
