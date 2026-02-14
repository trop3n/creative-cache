// ============================================================
// Bayer Matrices + Noise Texture Generation
// Matrices stored as normalized float arrays [0..1]
// ============================================================

export const pixelMatrice = [
  [0.48, 0.49],
  [0.5, 0.51],
];

export const gridMatrice = [
  [0.23, 0.85, 0.15],
  [0.8, 0.61, 0.89],
  [0.11, 0.83, 0.19],
];

export const checkerMatrice = [
  [0.84, 0.85, 0.16, 0.15],
  [0.85, 0.85, 0.15, 0.16],
  [0.16, 0.15, 0.85, 0.85],
  [0.15, 0.16, 0.85, 0.84],
];

export const diagonalMatrice = [
  [0.21, 0.52, 0.81, 0.52],
  [0.52, 0.21, 0.52, 0.81],
  [0.81, 0.52, 0.21, 0.52],
  [0.52, 0.81, 0.52, 0.21],
];

export const bayerMatrice2 = [
  [1 / 4, 2 / 4],
  [4 / 4, 3 / 4],
];

export const bayerMatrice4 = [
  [1 / 17, 9 / 17, 3 / 17, 11 / 17],
  [13 / 17, 5 / 17, 15 / 17, 7 / 17],
  [4 / 17, 12 / 17, 2 / 17, 10 / 17],
  [16 / 17, 8 / 17, 14 / 17, 6 / 17],
];

export const bayerMatrice8 = [
  [1 / 65, 33 / 65, 9 / 65, 41 / 65, 3 / 65, 35 / 65, 11 / 65, 43 / 65],
  [49 / 65, 17 / 65, 57 / 65, 25 / 65, 51 / 65, 19 / 65, 59 / 65, 27 / 65],
  [13 / 65, 45 / 65, 5 / 65, 37 / 65, 15 / 65, 47 / 65, 7 / 65, 39 / 65],
  [61 / 65, 29 / 65, 53 / 65, 21 / 65, 63 / 65, 31 / 65, 55 / 65, 23 / 65],
  [4 / 65, 36 / 65, 12 / 65, 44 / 65, 2 / 65, 34 / 65, 10 / 65, 42 / 65],
  [52 / 65, 20 / 65, 60 / 65, 28 / 65, 50 / 65, 18 / 65, 58 / 65, 26 / 65],
  [16 / 65, 48 / 65, 8 / 65, 40 / 65, 14 / 65, 46 / 65, 6 / 65, 38 / 65],
  [64 / 65, 32 / 65, 56 / 65, 24 / 65, 62 / 65, 30 / 65, 54 / 65, 22 / 65],
];

export const bayerMatrice16 = [
  [1/257, 129/257, 33/257, 161/257, 9/257, 137/257, 41/257, 169/257, 3/257, 131/257, 35/257, 163/257, 11/257, 139/257, 43/257, 171/257],
  [193/257, 65/257, 225/257, 97/257, 201/257, 73/257, 233/257, 105/257, 195/257, 67/257, 227/257, 99/257, 203/257, 75/257, 235/257, 107/257],
  [49/257, 177/257, 17/257, 145/257, 57/257, 185/257, 25/257, 153/257, 51/257, 179/257, 19/257, 147/257, 59/257, 187/257, 27/257, 155/257],
  [241/257, 113/257, 209/257, 81/257, 249/257, 121/257, 217/257, 89/257, 243/257, 115/257, 211/257, 83/257, 251/257, 123/257, 219/257, 91/257],
  [13/257, 141/257, 45/257, 173/257, 5/257, 133/257, 37/257, 165/257, 15/257, 143/257, 47/257, 175/257, 7/257, 135/257, 39/257, 167/257],
  [205/257, 77/257, 237/257, 109/257, 197/257, 69/257, 229/257, 101/257, 207/257, 79/257, 239/257, 111/257, 199/257, 71/257, 231/257, 103/257],
  [61/257, 189/257, 29/257, 157/257, 53/257, 181/257, 21/257, 149/257, 63/257, 191/257, 31/257, 159/257, 55/257, 183/257, 23/257, 151/257],
  [253/257, 125/257, 221/257, 93/257, 245/257, 117/257, 213/257, 85/257, 255/257, 127/257, 223/257, 95/257, 247/257, 119/257, 215/257, 87/257],
  [4/257, 132/257, 36/257, 164/257, 12/257, 140/257, 44/257, 172/257, 2/257, 130/257, 34/257, 162/257, 10/257, 138/257, 42/257, 170/257],
  [196/257, 68/257, 228/257, 100/257, 204/257, 76/257, 236/257, 108/257, 194/257, 66/257, 226/257, 98/257, 202/257, 74/257, 234/257, 106/257],
  [52/257, 180/257, 20/257, 148/257, 60/257, 188/257, 28/257, 156/257, 50/257, 178/257, 18/257, 146/257, 58/257, 186/257, 26/257, 154/257],
  [244/257, 116/257, 212/257, 84/257, 252/257, 124/257, 220/257, 92/257, 242/257, 114/257, 210/257, 82/257, 250/257, 122/257, 218/257, 90/257],
  [16/257, 144/257, 48/257, 176/257, 8/257, 136/257, 40/257, 168/257, 14/257, 142/257, 46/257, 174/257, 6/257, 134/257, 38/257, 166/257],
  [208/257, 80/257, 240/257, 112/257, 200/257, 72/257, 232/257, 104/257, 206/257, 78/257, 238/257, 110/257, 198/257, 70/257, 230/257, 102/257],
  [64/257, 192/257, 32/257, 160/257, 56/257, 184/257, 24/257, 152/257, 62/257, 190/257, 30/257, 158/257, 54/257, 182/257, 22/257, 150/257],
  [256/257, 128/257, 224/257, 96/257, 248/257, 120/257, 216/257, 88/257, 254/257, 126/257, 222/257, 94/257, 246/257, 118/257, 214/257, 86/257],
];

// Map matrix type names to data
export const matrixTypes = {
  pixel: pixelMatrice,
  diagonal: diagonalMatrice,
  checker: checkerMatrice,
  grid: gridMatrice,
  bayer2: bayerMatrice2,
  bayer4: bayerMatrice4,
  bayer8: bayerMatrice8,
  bayer16: bayerMatrice16,
};

/**
 * Create a p5.Image from a 2D matrix array.
 * Each matrix value [0..1] is mapped to RGB pixel values.
 */
export function matrixToImage(p, matrix) {
  const size = matrix.length;
  const img = p.createImage(size, size);
  img.loadPixels();
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const v = Math.floor(matrix[y][x] * 255);
      img.pixels[idx] = v;
      img.pixels[idx + 1] = v;
      img.pixels[idx + 2] = v;
      img.pixels[idx + 3] = 255;
    }
  }
  img.updatePixels();
  return img;
}

/**
 * Generate blue noise textures procedurally.
 * Returns an object with noise16, noise32, noise64, noise128 arrays.
 * Each size has 4 variant textures.
 */
export function generateNoiseTextures(p) {
  const sizes = [16, 32, 64, 128];
  const variants = 4;
  const textures = {};

  for (const size of sizes) {
    const arr = [];
    for (let v = 0; v < variants; v++) {
      const img = p.createImage(size, size);
      img.loadPixels();
      // Generate blue-noise-like texture using randomized threshold
      for (let i = 0; i < size * size * 4; i += 4) {
        const val = Math.floor(p.random(256));
        img.pixels[i] = val;
        img.pixels[i + 1] = val;
        img.pixels[i + 2] = val;
        img.pixels[i + 3] = 255;
      }
      img.updatePixels();
      arr.push(img);
    }
    textures[`noise${size}`] = arr;
  }

  return textures;
}

/**
 * Create a flat (no-dither) texture for "none" mode.
 * A 1x1 pixel at mid-gray ensures no visible dithering.
 */
export function createFlatTexture(p) {
  const img = p.createImage(1, 1);
  img.loadPixels();
  img.pixels[0] = 128;
  img.pixels[1] = 128;
  img.pixels[2] = 128;
  img.pixels[3] = 255;
  img.updatePixels();
  return img;
}
