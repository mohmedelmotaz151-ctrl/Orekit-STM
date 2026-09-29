import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Function to compute CRC32 for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function createPng(width, height, drawFn) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8 bits per channel
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw image data with filter byte 0 at start of each scanline
  const rowBytes = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowBytes);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter 0 (None)
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const idatCompressed = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = makeChunk('IDAT', idatCompressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Drawing logic: Oriket Safety theme (Dark navy background #0f172a, safety orange shield/flame motif)
function drawOriketIcon(x, y, w, h, isMaskable = false) {
  // Center coordinates
  const cx = w / 2;
  const cy = h / 2;
  const dx = (x - cx) / (w / 2);
  const dy = (y - cy) / (h / 2);
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background: Deep safety navy #0f172a
  let r = 15, g = 23, b = 42, a = 255;

  // Outer rounded square / squircle for standard icons
  if (!isMaskable) {
    const cornerRadius = 0.22;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    // Squircle falloff
    if (Math.pow(ax, 4) + Math.pow(ay, 4) > 1.05) {
      return [0, 0, 0, 0]; // Transparent outside icon boundary
    }
  }

  // Draw Shield / Badge (Central 60-70% area)
  // Shield coordinates: top at dy = -0.55, bottom point at dy = 0.55, width = 0.48
  const shieldScale = isMaskable ? 0.6 : 0.75;
  const sx = dx / shieldScale;
  const sy = (dy + 0.05) / shieldScale;

  // Shield boundary function
  const insideShield = (Math.abs(sx) <= 0.6 && sy >= -0.65 && sy <= 0.1) ||
    (sy > 0.1 && sy <= 0.75 && Math.abs(sx) <= 0.6 * (1 - Math.pow((sy - 0.1) / 0.65, 1.6)));

  if (insideShield) {
    // Shield gradient: Vibrant safety orange (#ea580c to #c2410c)
    const t = (sy + 0.65) / 1.4;
    r = Math.round(234 * (1 - t * 0.25));
    g = Math.round(88 * (1 - t * 0.35));
    b = Math.round(12);

    // Inner Flame / Fire symbol inside shield
    // Flame core
    const fx = sx;
    const fy = sy - 0.05;
    const fDist = Math.sqrt(fx * fx + fy * fy * 1.3);

    // Inner core white/amber flame
    if (fDist < 0.28 && fy < 0.28) {
      r = 255;
      g = 245;
      b = 210;
    } else if (fDist < 0.38 && fy < 0.36) {
      r = 254;
      g = 215;
      b = 100;
    }
  }

  return [r, g, b, a];
}

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// Generate Icons
console.log('Generating PWA icons...');

// 1. pwa-192x192.png
const icon192 = createPng(192, 192, (x, y, w, h) => drawOriketIcon(x, y, w, h, false));
fs.writeFileSync(path.join(PUBLIC_DIR, 'pwa-192x192.png'), icon192);

// 2. pwa-512x512.png
const icon512 = createPng(512, 512, (x, y, w, h) => drawOriketIcon(x, y, w, h, false));
fs.writeFileSync(path.join(PUBLIC_DIR, 'pwa-512x512.png'), icon512);

// 3. pwa-maskable-512x512.png (full bleed background, padded safe zone)
const iconMaskable = createPng(512, 512, (x, y, w, h) => drawOriketIcon(x, y, w, h, true));
fs.writeFileSync(path.join(PUBLIC_DIR, 'pwa-maskable-512x512.png'), iconMaskable);

// 4. apple-touch-icon.png (180x180 for iOS Safari)
const appleIcon = createPng(180, 180, (x, y, w, h) => drawOriketIcon(x, y, w, h, false));
fs.writeFileSync(path.join(PUBLIC_DIR, 'apple-touch-icon.png'), appleIcon);

console.log('Icons generated successfully in public/');
