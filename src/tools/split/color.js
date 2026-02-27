// ============================================================
// SPLITX Tool — Color System
// ============================================================

// ── Palette temp (active colors only) ────────────────────────
/**
 * Returns the filtered list of active palette colors.
 * For XOR mode, all colors are included regardless of use flags.
 */
export function buildPaletteTemp(palette, useFlags, mode) {
  if (mode === 'xor') return [...palette];
  return palette.filter((_, i) => useFlags[i]);
}

// ── Hex/RGB conversion ────────────────────────────────────────
function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}
function rgbToHex(r, g, b) {
  const ch = v => Math.max(0, Math.min(255, Math.round(v * 255))).toString(16).padStart(2, '0');
  return `#${ch(r)}${ch(g)}${ch(b)}`;
}

// ── LCH math ─────────────────────────────────────────────────
function toLinear(v) { return v <= 0.04045 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); }
function fromLinear(v) { return v <= 0.0031308 ? v*12.92 : 1.055*Math.pow(Math.max(0,v),1/2.4)-0.055; }

function rgbToXyz(r, g, b) {
  r = toLinear(r); g = toLinear(g); b = toLinear(b);
  return [r*0.4124564+g*0.3575761+b*0.1804375, r*0.2126729+g*0.7151522+b*0.0721750, r*0.0193339+g*0.1191920+b*0.9503041];
}
function xyzToRgb(x, y, z) {
  return [fromLinear(x*3.2404542+y*-1.5371385+z*-0.4985314), fromLinear(x*-0.9692660+y*1.8760108+z*0.0415560), fromLinear(x*0.0556434+y*-0.2040259+z*1.0572252)];
}
const D65=[0.95047,1.00000,1.08883];
function fwd(t) { return t>0.008856?Math.cbrt(t):7.787*t+16/116; }
function inv(t) { return t>0.206897?t**3:(t-16/116)/7.787; }
function xyzToLab(x,y,z) { const [fx,fy,fz]=[fwd(x/D65[0]),fwd(y/D65[1]),fwd(z/D65[2])]; return [116*fy-16,500*(fx-fy),200*(fy-fz)]; }
function labToXyz(L,a,b) { const fy=(L+16)/116; return [D65[0]*inv(fy+a/500),D65[1]*inv(fy),D65[2]*inv(fy-b/200)]; }
function labToLch(L,a,b) { return [L,Math.sqrt(a*a+b*b),((Math.atan2(b,a)*180)/Math.PI+360)%360]; }
function lchToLab(L,C,H) { const hr=(H*Math.PI)/180; return [L,C*Math.cos(hr),C*Math.sin(hr)]; }
function hexToLch(hex) { const [r,g,b]=hexToRgb(hex); const [x,y,z]=rgbToXyz(r,g,b); const [L,a,lb]=xyzToLab(x,y,z); return labToLch(L,a,lb); }
function lchToHex(L,C,H) { const [La,a,b]=lchToLab(L,C,H); const [x,y,z]=labToXyz(La,a,b); const [r,g,bl]=xyzToRgb(x,y,z); return rgbToHex(r,g,bl); }

function lerpRgb(hexA, hexB, t) {
  const [r1,g1,b1]=hexToRgb(hexA), [r2,g2,b2]=hexToRgb(hexB);
  return rgbToHex(r1+(r2-r1)*t, g1+(g2-g1)*t, b1+(b2-b1)*t);
}
function lerpLch(hexA, hexB, t) {
  const [L1,C1,H1]=hexToLch(hexA), [L2,C2,H2]=hexToLch(hexB);
  let dH=H2-H1; if(dH>180)dH-=360; if(dH<-180)dH+=360;
  return lchToHex(L1+(L2-L1)*t, C1+(C2-C1)*t, H1+dH*t);
}

function paletteInterp(palette, t, lerpFn) {
  if (palette.length < 2) return palette[0] ?? '#000000';
  const n=palette.length-1, seg=n*t, idx=Math.min(Math.floor(seg),n-1), frac=seg-idx;
  return lerpFn(palette[idx], palette[idx+1], frac);
}

// ── Public API ────────────────────────────────────────────────
/**
 * Return hex color for copy i out of count total.
 * paletteTemp = pre-filtered active colors (from buildPaletteTemp).
 */
export function colorForCopy(i, count, colorState, paletteTemp) {
  const { drawingMode, palette, paletteIndex } = colorState;
  switch (drawingMode) {
    case 'xor':
      return palette[paletteIndex] ?? palette[0];
    case 'sequence': {
      const temp = paletteTemp.length > 0 ? paletteTemp : palette;
      return temp[i % temp.length];
    }
    case 'rgb': {
      const temp = paletteTemp.length > 0 ? paletteTemp : palette;
      if (count <= 1) return temp[0];
      return paletteInterp(temp, i / (count - 1), lerpRgb);
    }
    case 'lch': {
      const temp = paletteTemp.length > 0 ? paletteTemp : palette;
      if (count <= 1) return temp[0];
      return paletteInterp(temp, i / (count - 1), lerpLch);
    }
    default:
      return palette[0];
  }
}
