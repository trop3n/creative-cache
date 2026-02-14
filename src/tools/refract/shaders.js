// ============================================================
// GLSL Shader Sources for REFRACT Tool
// Various displacement and refraction effects
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

// --- Simplex Noise Functions (shared) ---
const noiseFunctions = `
// Simplex 2D noise
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// Fractal Brownian Motion
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 5; i++) {
    value += amplitude * snoise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  return value;
}

// Voronoi noise
vec2 hash2(vec2 p) {
  return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

float voronoi(vec2 x) {
  vec2 n = floor(x);
  vec2 f = fract(x);
  float md = 8.0;
  for(int j = -1; j <= 1; j++) {
    for(int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = hash2(n + g);
      vec2 r = g + o - f;
      float d = dot(r, r);
      if(d < md) md = d;
    }
  }
  return sqrt(md);
}
`;

// --- Displacement Map Fragment Shader ---
export const displacementFrag = `
precision highp float;

varying vec2 vTexCoord;
uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform float u_amount;
uniform float u_scale;
uniform float u_intensity;
uniform float u_offsetX;
uniform float u_offsetY;
uniform float u_time;
uniform int u_source;       // 0=noise, 1=sine, 2=radial, 3=checker, 4=image
uniform int u_noiseType;    // 0=simplex, 1=perlin, 2=voronoi, 3=fractal
uniform sampler2D u_displacementMap;
uniform bool u_hasDisplacementMap;

${noiseFunctions}

// Generate displacement value based on source type
vec2 getDisplacement(vec2 uv) {
  vec2 disp = vec2(0.0);
  vec2 scaledUV = (uv + vec2(u_offsetX, u_offsetY)) * u_scale;
  
  if (u_source == 4 && u_hasDisplacementMap) {
    // Use custom displacement map
    vec4 mapColor = texture2D(u_displacementMap, uv);
    disp = (mapColor.rg - 0.5) * 2.0;
  }
  else if (u_source == 0) {
    // Noise-based displacement
    float n1, n2;
    if (u_noiseType == 0) {
      n1 = snoise(scaledUV + u_time);
      n2 = snoise(scaledUV + vec2(100.0) + u_time);
    } else if (u_noiseType == 1) {
      n1 = sin(scaledUV.x * 3.14159) * cos(scaledUV.y * 3.14159);
      n2 = cos(scaledUV.x * 3.14159) * sin(scaledUV.y * 3.14159);
    } else if (u_noiseType == 2) {
      n1 = voronoi(scaledUV * 3.0) - 0.5;
      n2 = voronoi(scaledUV * 3.0 + vec2(100.0)) - 0.5;
    } else {
      n1 = fbm(scaledUV + u_time * 0.1);
      n2 = fbm(scaledUV + vec2(100.0) + u_time * 0.1);
    }
    disp = vec2(n1, n2);
  }
  else if (u_source == 1) {
    // Sine wave displacement
    float sx = sin(scaledUV.x * 10.0 + u_time) * 0.5 + 0.5;
    float sy = sin(scaledUV.y * 10.0 + u_time * 1.3) * 0.5 + 0.5;
    disp = vec2(sx - 0.5, sy - 0.5);
  }
  else if (u_source == 2) {
    // Radial displacement
    vec2 center = vec2(0.5);
    float angle = atan(uv.y - center.y, uv.x - center.x);
    float radius = length(uv - center);
    disp = vec2(cos(angle + radius * 10.0 + u_time), sin(angle + radius * 10.0 + u_time)) * 0.5;
  }
  else if (u_source == 3) {
    // Checkerboard displacement
    vec2 check = floor(scaledUV * 8.0);
    float val = mod(check.x + check.y, 2.0) - 0.5;
    disp = vec2(val, val);
  }
  
  return disp * u_intensity * u_amount;
}

void main() {
  vec2 uv = vec2(vTexCoord.x, 1.0 - vTexCoord.y);
  
  vec2 displacement = getDisplacement(uv);
  vec2 distortedUV = uv + displacement;
  
  // Clamp to prevent sampling outside
  distortedUV = clamp(distortedUV, 0.0, 1.0);
  
  vec4 color = texture2D(u_image, distortedUV);
  gl_FragColor = color;
}
`;

// --- Refraction/Glass Fragment Shader ---
export const refractionFrag = `
precision highp float;

varying vec2 vTexCoord;
uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform float u_amount;
uniform float u_scale;
uniform float u_index;              // Refractive index
uniform float u_thickness;
uniform float u_chromatic;
uniform float u_time;
uniform int u_noiseType;

${noiseFunctions}

void main() {
  vec2 uv = vec2(vTexCoord.x, 1.0 - vTexCoord.y);
  vec2 scaledUV = uv * u_scale + u_time * 0.1;
  
  // Generate normal map from noise
  float n1, n2;
  if (u_noiseType == 0) {
    n1 = snoise(scaledUV);
    n2 = snoise(scaledUV + vec2(100.0));
  } else if (u_noiseType == 1) {
    n1 = sin(scaledUV.x * 3.14159) * cos(scaledUV.y * 3.14159);
    n2 = cos(scaledUV.x * 3.14159) * sin(scaledUV.y * 3.14159);
  } else if (u_noiseType == 2) {
    n1 = voronoi(scaledUV * 3.0) - 0.5;
    n2 = voronoi(scaledUV * 3.0 + vec2(100.0)) - 0.5;
  } else {
    n1 = fbm(scaledUV);
    n2 = fbm(scaledUV + vec2(100.0));
  }
  
  vec2 normal = vec2(n1, n2) * u_amount;
  
  // Calculate refraction offset
  vec2 refractOffset = normal * u_thickness * (u_index - 1.0);
  
  // Sample with chromatic aberration
  float r = texture2D(u_image, uv + refractOffset * (1.0 + u_chromatic)).r;
  float g = texture2D(u_image, uv + refractOffset).g;
  float b = texture2D(u_image, uv + refractOffset * (1.0 - u_chromatic)).b;
  
  gl_FragColor = vec4(r, g, b, 1.0);
}
`;

// --- Water Ripple Fragment Shader ---
export const rippleFrag = `
precision highp float;

varying vec2 vTexCoord;
uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform float u_amount;
uniform float u_frequency;
uniform float u_amplitude;
uniform float u_phase;
uniform float u_damping;
uniform float u_centerX;
uniform float u_centerY;
uniform float u_time;

void main() {
  vec2 uv = vec2(vTexCoord.x, 1.0 - vTexCoord.y);
  
  vec2 center = vec2(u_centerX, u_centerY);
  vec2 toCenter = uv - center;
  float dist = length(toCenter);
  float angle = atan(toCenter.y, toCenter.x);
  
  // Ripple function
  float ripple = sin(dist * u_frequency - u_phase - u_time * 2.0) * u_amplitude;
  ripple *= exp(-dist * u_damping * 3.0);  // Damping
  
  // Displace along the radial direction
  vec2 displacement = normalize(toCenter) * ripple * u_amount;
  
  // Handle center point
  if (dist < 0.001) displacement = vec2(0.0);
  
  vec2 distortedUV = uv + displacement;
  distortedUV = clamp(distortedUV, 0.0, 1.0);
  
  gl_FragColor = texture2D(u_image, distortedUV);
}
`;

// --- Wave Distortion Fragment Shader ---
export const waveFrag = `
precision highp float;

varying vec2 vTexCoord;
uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform float u_amount;
uniform float u_freqX;
uniform float u_freqY;
uniform float u_ampX;
uniform float u_ampY;
uniform float u_phase;
uniform float u_time;

void main() {
  vec2 uv = vec2(vTexCoord.x, 1.0 - vTexCoord.y);
  
  // Sine wave distortion
  float waveX = sin(uv.y * u_freqX + u_phase + u_time) * u_ampX * u_amount;
  float waveY = sin(uv.x * u_freqY + u_phase + u_time * 1.3) * u_ampY * u_amount;
  
  vec2 distortedUV = uv + vec2(waveX, waveY);
  distortedUV = clamp(distortedUV, 0.0, 1.0);
  
  gl_FragColor = texture2D(u_image, distortedUV);
}
`;

// --- Pinch/Bulge Fragment Shader ---
export const pinchFrag = `
precision highp float;

varying vec2 vTexCoord;
uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform float u_amount;
uniform float u_strength;
uniform float u_radius;
uniform float u_centerX;
uniform float u_centerY;

void main() {
  vec2 uv = vec2(vTexCoord.x, 1.0 - vTexCoord.y);
  
  vec2 center = vec2(u_centerX, u_centerY);
  vec2 toCenter = uv - center;
  float dist = length(toCenter);
  
  if (dist < u_radius && dist > 0.001) {
    float t = dist / u_radius;
    // Pinch: pull towards center, Bulge: push away
    float factor = 1.0 - u_strength * (1.0 - t) * u_amount;
    factor = clamp(factor, 0.1, 2.0);
    toCenter = toCenter / dist * dist * factor;
    uv = center + toCenter;
  }
  
  uv = clamp(uv, 0.0, 1.0);
  gl_FragColor = texture2D(u_image, uv);
}
`;

// --- Twirl Fragment Shader ---
export const twirlFrag = `
precision highp float;

varying vec2 vTexCoord;
uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform float u_amount;
uniform float u_angle;
uniform float u_radius;
uniform float u_centerX;
uniform float u_centerY;

void main() {
  vec2 uv = vec2(vTexCoord.x, 1.0 - vTexCoord.y);
  
  vec2 center = vec2(u_centerX, u_centerY);
  vec2 toCenter = uv - center;
  float dist = length(toCenter);
  
  if (dist < u_radius && dist > 0.001) {
    float angle = atan(toCenter.y, toCenter.x);
    float t = 1.0 - dist / u_radius;
    // Apply twirl rotation
    angle += u_angle * t * u_amount * 0.0174533;  // Convert degrees to radians
    
    uv = center + vec2(cos(angle), sin(angle)) * dist;
  }
  
  uv = clamp(uv, 0.0, 1.0);
  gl_FragColor = texture2D(u_image, uv);
}
`;

// --- Lens/Magnification Fragment Shader ---
export const lensFrag = `
precision highp float;

varying vec2 vTexCoord;
uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform float u_amount;
uniform float u_strength;
uniform float u_radius;
uniform float u_centerX;
uniform float u_centerY;

void main() {
  vec2 uv = vec2(vTexCoord.x, 1.0 - vTexCoord.y);
  
  vec2 center = vec2(u_centerX, u_centerY);
  vec2 toCenter = uv - center;
  float dist = length(toCenter);
  
  if (dist < u_radius && dist > 0.001) {
    float t = dist / u_radius;
    // Lens effect: magnify or demagnify
    float magnification = 1.0 + u_strength * (1.0 - t) * u_amount;
    toCenter = toCenter * magnification;
    uv = center + toCenter;
  }
  
  uv = clamp(uv, 0.0, 1.0);
  gl_FragColor = texture2D(u_image, uv);
}
`;

// --- Barrel/Pincushion Fragment Shader ---
export const barrelFrag = `
precision highp float;

varying vec2 vTexCoord;
uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform float u_amount;
uniform float u_strength;

void main() {
  vec2 uv = vec2(vTexCoord.x, 1.0 - vTexCoord.y);
  
  // Center coordinates
  vec2 center = vec2(0.5);
  vec2 toCenter = uv - center;
  float dist = length(toCenter);
  float r2 = dist * dist;
  float r4 = r2 * r2;
  
  // Barrel/Pincushion formula
  float factor = 1.0 + u_strength * r2 * u_amount + u_strength * 0.5 * r4 * u_amount;
  
  uv = center + toCenter * factor;
  
  // Check if we're still in bounds
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  } else {
    gl_FragColor = texture2D(u_image, uv);
  }
}
`;

// --- Image Processing Fragment Shader ---
export const processFrag = `
precision highp float;

varying vec2 vTexCoord;
uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_saturation;
uniform float u_hue;

// RGB to HSV conversion
vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

// HSV to RGB conversion
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  vec2 uv = vec2(vTexCoord.x, 1.0 - vTexCoord.y);
  vec4 color = texture2D(u_image, uv);
  
  // Apply contrast
  color.rgb = (color.rgb - 0.5) * u_contrast + 0.5;
  
  // Apply brightness
  color.rgb *= u_brightness;
  
  // Apply saturation
  float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  color.rgb = mix(vec3(gray), color.rgb, u_saturation);
  
  // Apply hue shift
  if (u_hue != 0.0) {
    vec3 hsv = rgb2hsv(color.rgb);
    hsv.x = fract(hsv.x + u_hue / 360.0);
    color.rgb = hsv2rgb(hsv);
  }
  
  gl_FragColor = color;
}
`;
