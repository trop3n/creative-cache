// ============================================================
// GLSL Shader Sources for DITHR Tool
// All dithering/rendering happens on GPU via these shaders
// ============================================================

// --- Vertex Shaders ---

// Used by dither, halftone basic, and ASCII shaders
// Simple position transform, no texture coords needed
// (fragment shaders use gl_FragCoord for UV calculation)
export const dithVert = `
attribute vec3 aPosition;

void main() {
  vec4 positionVec4 = vec4(aPosition, 1.0);
  positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
  gl_Position = positionVec4;
}
`;

// Used by CMYK halftone and gradient shaders
// Passes texture coordinates to fragment shader
export const gradVert = `
attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

void main() {
  vTexCoord = aTexCoord;
  gl_Position = vec4(aPosition.xy * 2.0 - 1.0, aPosition.z, 1.0);
}
`;

// --- Fragment Shaders ---

// Ordered dither (Bayer matrix / noise texture based)
export const dithFrag = `
precision highp float;

uniform sampler2D u_texture;
uniform sampler2D u_dither_tex;
uniform vec2 u_resolution;
uniform vec2 u_dither_size;
uniform int u_density;
uniform float u_scale;
uniform float u_steps;
uniform float u_contrast;
uniform float u_saturation;
uniform float u_brightness;

void main() {
  vec2 coord = vec2(gl_FragCoord.x, 1.0 - gl_FragCoord.y);
  coord -= mod(coord, u_scale);
  if (u_density > 1) coord += u_scale * 0.5;

  vec2 uv_dither = fract((coord + vec2(0.5)) / u_dither_size.xy);
  vec2 uv_texture = coord.xy / u_resolution;

  float alpha = texture2D(u_texture, uv_texture).a;
  vec4 img = (texture2D(u_texture, uv_texture).rgba - 0.5 + (u_brightness - 1.0)) * u_contrast + 0.5;
  vec3 limit = texture2D(u_dither_tex, uv_dither).rgb;

  float grayscale = dot(img.rgb, vec3(0.299, 0.587, 0.114)) * img.a;
  vec3 mixed = mix(img.rgb, vec3(grayscale), u_saturation);
  vec3 processed = mixed - mod(mixed, 1.0 / u_steps);
  vec3 dither = step(limit, (mixed - processed) * u_steps) / u_steps;

  gl_FragColor = vec4(processed + dither, alpha);
}
`;

// Basic halftone (SDF circles per RGB channel)
export const halfFrag = `
precision highp float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_size;
uniform float u_smooth;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_saturation;
uniform float u_density;
uniform vec3 u_halfscale;

float sdCircle(vec2 p, vec2 c, float r) {
  return length(p - c) - r;
}

void main() {
  vec2 coord = vec2(gl_FragCoord.x, 1.0 - gl_FragCoord.y);
  vec2 uv_texture = coord.xy / u_resolution;

  float alpha = texture2D(u_texture, uv_texture).a;
  vec2 pattern = (floor(coord / u_size) + 0.5) * vec2(u_size);
  vec4 img = (texture2D(u_texture, pattern / u_resolution).rgba - 0.5 + (u_brightness - 1.0)) * u_contrast + 0.5;

  float r = img.r * u_size * u_halfscale.r;
  float g = img.g * u_size * u_halfscale.g;
  float b = img.b * u_size * u_halfscale.b;

  vec3 dots = vec3(
    sdCircle(coord, pattern, r),
    sdCircle(coord, pattern, g),
    sdCircle(coord, pattern, b)
  );
  vec3 col = smoothstep(0.0, -u_smooth * u_density, dots);

  float grayscale = dot(col, vec3(0.299, 0.587, 0.114)) * img.a;
  vec3 color = mix(col, vec3(grayscale), u_saturation);

  gl_FragColor = vec4(color, alpha);
}
`;

// CMYK halftone with simplex noise paper texture
export const cmykFrag = `
precision highp float;

varying vec2 vTexCoord;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_scale;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_saturation;

// --- Simplex Noise ---
vec3 mod289v3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289v2(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289v3(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187,
    0.366025403784439,
    -0.577350269189626,
    0.024390243902439
  );
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289v2(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x_p = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x_p) - 0.5;
  vec3 ox = floor(x_p + 0.5);
  vec3 a0 = x_p - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float aastep(float threshold, float value) {
  return smoothstep(threshold - 0.04, threshold + 0.04, value);
}

float halftone(vec2 coord, mat2 rotation, float frequency, float value) {
  vec2 rotated = rotation * coord;
  vec2 nearest = 2.0 * fract(frequency * rotated) - 1.0;
  float dist = length(nearest);
  float radius = sqrt(1.0 - value);
  return aastep(radius, dist);
}

void main() {
  vec2 uv = vec2(vTexCoord.x, 1.0 - vTexCoord.y);
  vec2 coord = uv * u_resolution;

  float alpha = texture2D(u_texture, uv).a;
  vec4 img = (texture2D(u_texture, uv).rgba - 0.5 + (u_brightness - 1.0)) * u_contrast + 0.5;

  float grayscale = dot(img.rgb, vec3(0.299, 0.587, 0.114)) * img.a;
  vec3 mixed = mix(img.rgb, vec3(grayscale), u_saturation);

  // RGB to CMYK
  float k = 1.0 - max(max(mixed.r, mixed.g), mixed.b);
  float invK = 1.0 / (1.0 - k + 0.001);
  float c = (1.0 - mixed.r - k) * invK;
  float m = (1.0 - mixed.g - k) * invK;
  float y = (1.0 - mixed.b - k) * invK;

  // Screen angles for each CMYK channel
  mat2 kRot = mat2(0.707, -0.707, 0.707, 0.707);    // 45 degrees
  mat2 cRot = mat2(0.966, -0.259, 0.259, 0.966);     // ~15 degrees
  mat2 mRot = mat2(0.966, 0.259, -0.259, 0.966);     // ~-15 degrees
  mat2 yRot = mat2(1.0, 0.0, 0.0, 1.0);              // 0 degrees

  float frequency = u_scale;

  float cH = halftone(coord, cRot, frequency, c);
  float mH = halftone(coord, mRot, frequency, m);
  float yH = halftone(coord, yRot, frequency, y);
  float kH = halftone(coord, kRot, frequency, k);

  // CMYK to RGB
  vec3 color = vec3(
    (1.0 - cH) * (1.0 - kH),
    (1.0 - mH) * (1.0 - kH),
    (1.0 - yH) * (1.0 - kH)
  );

  // Paper texture (simplex noise)
  float noise = snoise(coord * 0.015) * 0.04;
  color += noise;

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), alpha);
}
`;

// ASCII character rendering via glyph atlas
export const asciiFrag = `
precision highp float;

uniform sampler2D u_asciiTexture;
uniform sampler2D u_imageTexture;
uniform float u_asciiCols;
uniform float u_asciiRows;
uniform int u_totalChars;
uniform vec2 u_gridCells;
uniform vec2 u_gridOffset;
uniform vec2 u_gridSize;
uniform vec3 u_charColor;
uniform vec3 u_bgColor;
uniform int u_charColorMode;
uniform int u_bgColorMode;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_saturation;
uniform float u_steps;

void main() {
  vec2 coord = (gl_FragCoord.xy - u_gridOffset * 0.5) / u_gridCells;
  coord.y = 1.0 - coord.y;

  vec2 gridCoord = coord * u_gridSize;
  vec2 cellCoord = floor(gridCoord);
  vec2 centerCoord = cellCoord + vec2(0.5);
  vec2 baseCoord = centerCoord / u_gridSize;

  float alpha = texture2D(u_imageTexture, baseCoord).a;
  vec3 imageColor = (texture2D(u_imageTexture, baseCoord).rgb - 0.5 + (u_brightness - 1.0)) * u_contrast + 0.5;

  float grayscale = dot(imageColor.rgb, vec3(0.299, 0.587, 0.114)) * alpha;
  vec3 imageMixed = mix(imageColor.rgb, vec3(grayscale), u_saturation);
  vec3 processed = imageMixed - mod(imageMixed, 1.0 / u_steps);

  float idx = clamp(grayscale * float(u_totalChars), 0.0, float(u_totalChars - 1));
  int charIndex = int(idx - mod(idx, 1.0 / u_steps));

  int charCol = charIndex - int(u_asciiCols) * (charIndex / int(u_asciiCols));
  int charRow = charIndex / int(u_asciiCols);
  vec2 charCoord = vec2(float(charCol) / u_asciiCols, float(charRow) / u_asciiRows);
  vec2 fractCoord = fract(gridCoord) * vec2(1.0 / u_asciiCols, 1.0 / u_asciiRows);
  vec2 texCoord = charCoord + fractCoord;
  vec4 charSample = texture2D(u_asciiTexture, texCoord);

  vec4 finalColor = u_charColorMode == 0
    ? vec4(imageMixed.rgb * charSample.rgb, charSample.a)
    : vec4(u_charColor * charSample.rgb, charSample.a);

  vec4 finalMixed = u_bgColorMode == 0
    ? mix(vec4(imageMixed.rgb, 1.0), finalColor, charSample.a)
    : mix(vec4(u_bgColor, 1.0), finalColor, charSample.a);

  gl_FragColor = vec4(finalMixed.rgb, alpha);
}
`;

// Gradient color mapping (grayscale -> palette texture lookup)
export const gradFrag = `
precision highp float;

varying vec2 vTexCoord;
uniform sampler2D u_texture;
uniform sampler2D u_gradient;

void main() {
  vec2 uv = vec2(vTexCoord.x, 1.0 - vTexCoord.y);
  float grayscale = dot(texture2D(u_texture, uv).rgb, vec3(0.299, 0.587, 0.114));
  float alpha = texture2D(u_texture, uv).a;
  vec4 color = texture2D(u_gradient, vec2(grayscale, 0.5));
  gl_FragColor = vec4(color.rgb, alpha);
}
`;
