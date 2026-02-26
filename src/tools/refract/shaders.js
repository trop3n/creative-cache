// ============================================================
// REFRACT Tool — Shaders
// ============================================================

// --- Vertex Shader (shared) ---
export const vertShader = `
attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

void main() {
  vTexCoord = aTexCoord;
  gl_Position = vec4(aPosition.xy * 2.0 - 1.0, aPosition.z, 1.0);
}
`;

// --- Mirror UV Wrap helper (inlined into both frag shaders) ---
const mirrorWrapGLSL = `
vec2 mirrorWrap(vec2 uv) {
  return abs(mod(uv - 1.0, 2.0) - 1.0);
}
`;

// --- Simplex noise (used by flow displace) ---
const simplexGLSL = `
vec3 _snPerm(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1  = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy  -= i1;
  i = mod(i, 289.0);
  vec3 p = _snPerm(_snPerm(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x  = 2.0 * fract(p * C.www) - 1.0;
  vec3 h  = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x   + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// fBm with dynamic octave count (max 8)
float fbm(vec2 p, int octaves) {
  float val = 0.0;
  float amp = 0.5;
  float frq = 1.0;
  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    val += amp * snoise(p * frq);
    amp *= 0.5;
    frq *= 2.0;
  }
  return val;
}
`;

// --- Pass 1: Unified Displacement Shader ---
// u_displaceType: 0=Box, 1=Flow, 2=Sine
export const displaceFrag = `
precision highp float;

varying vec2 vTexCoord;
uniform sampler2D u_image;
uniform vec2      u_resolution;
uniform int       u_displaceType;
uniform float     u_seed;
uniform float     u_contentScaleX;
uniform float     u_contentScaleY;
uniform float     u_time;

// Box uniforms
uniform float u_box_ampX;
uniform float u_box_ampY;
uniform float u_box_freqX;
uniform float u_box_freqY;
uniform float u_box_speedX;
uniform float u_box_speedY;

// Flow uniforms
uniform int   u_flow_complexity;
uniform float u_flow_freq;
uniform float u_flow_ampX;
uniform float u_flow_ampY;
uniform float u_flow_speedX;
uniform float u_flow_speedY;

// Sine uniforms
uniform float u_sine_ampX;
uniform float u_sine_ampY;
uniform float u_sine_freqX;
uniform float u_sine_freqY;
uniform float u_sine_speedX;
uniform float u_sine_speedY;

${mirrorWrapGLSL}
${simplexGLSL}

// Per-cell hash for Box displace
float cellHash(vec2 cell) {
  return fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 uv = vec2(vTexCoord.x, 1.0 - vTexCoord.y);

  // Apply content scale (zooms the source image)
  vec2 scaledSrcUV = (uv - 0.5) / vec2(u_contentScaleX, u_contentScaleY) + 0.5;

  vec2 disp = vec2(0.0);

  if (u_displaceType == 0) {
    // ── Box Displace ──
    // Speed scrolls the cell grid over time
    float sx = u_time * u_box_speedX * 0.002;
    float sy = u_time * u_box_speedY * 0.002;
    vec2 shiftedUV = uv + vec2(sx, sy);
    vec2 cell = floor(shiftedUV * vec2(u_box_freqX, u_box_freqY));
    float hx = cellHash(cell + u_seed)       * 2.0 - 1.0;
    float hy = cellHash(cell + u_seed + 31.41) * 2.0 - 1.0;
    disp = vec2(hx * u_box_ampX, hy * u_box_ampY);

  } else if (u_displaceType == 1) {
    // ── Flow Displace ──
    // Speed scrolls the noise field over time (per-axis)
    float sx = u_time * u_flow_speedX * 0.002;
    float sy = u_time * u_flow_speedY * 0.002;
    vec2 p = uv * u_flow_freq + vec2(sx, sy) + u_seed * 0.01;
    float nx = fbm(p,                      u_flow_complexity);
    float ny = fbm(p + vec2(31.41, 17.32), u_flow_complexity);
    disp = vec2(nx * u_flow_ampX, ny * u_flow_ampY);

  } else {
    // ── Sine Displace ──
    // Independent per-axis sine waves; speed advances phase over time
    float phaseX = u_time * u_sine_speedX * 0.05;
    float phaseY = u_time * u_sine_speedY * 0.05;
    float dx = sin(uv.x * u_sine_freqX + phaseX) * u_sine_ampX;
    float dy = sin(uv.y * u_sine_freqY + phaseY) * u_sine_ampY;
    disp = vec2(dx, dy);
  }

  vec2 distortedUV = mirrorWrap(scaledSrcUV + disp);
  gl_FragColor = texture2D(u_image, distortedUV);
}
`;

// --- Pass 2: Grid Refract Shader ---
// Divides UV space into gridAmtX x gridAmtY cells and applies
// a radial lens warp inside each cell using skewLevel as strength.
export const gridRefractFrag = `
precision highp float;

varying vec2 vTexCoord;
uniform sampler2D u_image;       // displaced result from pass 1
uniform vec2      u_resolution;
uniform float     u_gridAmtX;
uniform float     u_gridAmtY;
uniform float     u_skewX;
uniform float     u_skewY;

${mirrorWrapGLSL}

void main() {
  vec2 uv = vec2(vTexCoord.x, 1.0 - vTexCoord.y);

  vec2 cellSize  = vec2(1.0 / u_gridAmtX, 1.0 / u_gridAmtY);
  vec2 cellIndex = floor(uv / cellSize);
  vec2 cellUV    = fract(uv / cellSize);          // 0-1 within cell

  vec2 fromCenter = cellUV - 0.5;
  float dist = length(fromCenter);

  // Radial lens: push UVs away from cell centre proportionally to dist.
  // No clamp — let the lens sample across cell boundaries naturally;
  // mirrorWrap on the final UV handles out-of-image-bounds sampling.
  vec2 lensOffset   = fromCenter * dist * vec2(u_skewX, u_skewY);
  vec2 warpedCellUV = cellUV + lensOffset;

  vec2 finalUV = mirrorWrap((cellIndex + warpedCellUV) * cellSize);
  gl_FragColor = texture2D(u_image, finalUV);
}
`;
