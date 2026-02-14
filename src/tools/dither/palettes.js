// ============================================================
// 30 Color Palettes - each with 5 colors, use flags, reverse
// ============================================================

export const palettes = [
  { colors: ['#2e3336', '#358e7e', '#e57e3a', '#f883d6', '#CAD2D6'], use: [true, true, true, true, true], reverse: false },
  { colors: ['#2c426f', '#403d3d', '#db622d', '#d14e9b', '#CCC5C5'], use: [true, true, true, true, true], reverse: false },
  { colors: ['#303134', '#e15934', '#355ccd', '#348443', '#d2b58a'], use: [true, true, true, true, true], reverse: false },
  { colors: ['#2d2d2d', '#616f59', '#e8e0df', '#eeb2d0', '#e25d57'], use: [true, true, true, true, true], reverse: false },
  { colors: ['#353f37', '#744498', '#2f8088', '#fb8727', '#ece7f4'], use: [true, true, true, true, false], reverse: false },
  { colors: ['#363534', '#45936f', '#d28581', '#f2dc18', '#dae3ff'], use: [true, true, true, true, false], reverse: false },
  { colors: ['#3d3f43', '#77609f', '#9ca558', '#5286b5', '#cccbd5'], use: [true, false, false, true, true], reverse: false },
  { colors: ['#2f2727', '#2169d8', '#ff3b0e', '#a7723b', '#f4caf0'], use: [true, true, true, false, false], reverse: false },
  { colors: ['#0e301e', '#4e3fe4', '#2fa257', '#d2cfbf', '#9d7d37'], use: [false, true, true, true, false], reverse: false },
  { colors: ['#3c2706', '#7a5649', '#cc3904', '#e5cf0a', '#faf5c6'], use: [true, true, true, true, true], reverse: false },
  { colors: ['#d27099', '#8f64b0', '#4060a5', '#609dc5', '#9ddbc3'], use: [true, true, true, true, true], reverse: false },
  { colors: ['#117092', '#11c3ef', '#cca8e1', '#e9d13e', '#e7f6fe'], use: [true, true, true, true, true], reverse: false },
  { colors: ['#2a2955', '#6612ff', '#e12955', '#d19ef6', '#fac4ac'], use: [true, true, true, true, false], reverse: false },
  { colors: ['#000000', '#db4b3d', '#ff7b05', '#7dcfa7', '#b2ccff'], use: [true, true, true, true, true], reverse: false },
  { colors: ['#252c32', '#387d1f', '#f0a8ce', '#eee1da', '#eef1df'], use: [false, true, true, true, false], reverse: false },
  { colors: ['#5f5f65', '#ac5cc3', '#db5e51', '#5fa26a', '#a3d4c6'], use: [true, true, true, false, false], reverse: false },
  { colors: ['#050006', '#395e54', '#e55486', '#e77b4d', '#a1b8cf'], use: [true, true, true, true, false], reverse: false },
  { colors: ['#118ab2', '#ef476f', '#f78c6b', '#ffd166', '#06d6a0'], use: [true, true, true, true, true], reverse: false },
  { colors: ['#032472', '#3a678f', '#8D69DE', '#ffa900', '#FFD200'], use: [true, true, true, true, true], reverse: false },
  { colors: ['#401469', '#9d246f', '#df1260', '#398a9b', '#10bbb1'], use: [true, true, true, true, true], reverse: false },
  { colors: ['#8d0805', '#d55f32', '#5396ba', '#8bbdd3', '#ef9fa0'], use: [true, true, true, true, false], reverse: false },
  { colors: ['#5f5050', '#03abc2', '#5dd24f', '#cdff19', '#cdfaff'], use: [false, true, true, true, true], reverse: false },
  { colors: ['#0B3039', '#705771', '#B06683', '#E5B5B7', '#F2F5E7'], use: [true, true, true, true, true], reverse: false },
  { colors: ['#FF5181', '#FFB7BC', '#FFCF49', '#FFA43F', '#5CCAEF'], use: [true, true, true, true, true], reverse: false },
  { colors: ['#3e3700', '#ca2e2c', '#388a85', '#8ca79e', '#ccb000'], use: [true, true, true, false, true], reverse: false },
  { colors: ['#6f4c32', '#cd5845', '#d85da0', '#cdb337', '#C2CCC6'], use: [true, true, true, true, true], reverse: false },
  { colors: ['#c0311e', '#c53a5b', '#202020', '#d54a1f', '#2b5584'], use: [true, true, true, true, true], reverse: false },
  { colors: ['#1B1C19', '#5F2398', '#1CA56E', '#F0E800', '#DEDBC1'], use: [true, true, true, true, true], reverse: false },
  { colors: ['#1b1b2f', '#245a69', '#8198a5', '#b789e5', '#dbc064'], use: [true, true, true, true, true], reverse: false },
  { colors: ['#2B5F8F', '#818014', '#E87031', '#C27E97', '#CC9F7E'], use: [true, true, true, true, true], reverse: false },
];

/**
 * Get the active colors from a palette (only those with use=true).
 * If reverse is set, reverses the order.
 */
export function getActiveColors(paletteIndex) {
  const pal = palettes[paletteIndex];
  if (!pal) return ['#000000', '#ffffff'];
  const active = pal.colors.filter((_, i) => pal.use[i]);
  if (active.length === 0) return ['#000000', '#ffffff'];
  return [...active];
}
