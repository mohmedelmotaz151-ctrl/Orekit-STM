import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { deflateSync } from 'node:zlib';

const width = 192;
const height = 192;
const pixels = Buffer.alloc(width * height * 4);
const navy = [11, 45, 91, 255];
const gold = [224, 177, 77, 255];
const white = [255, 255, 255, 255];

function setPixel(x, y, color) {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const i = (y * width + x) * 4;
  pixels[i] = color[0]; pixels[i + 1] = color[1];
  pixels[i + 2] = color[2]; pixels[i + 3] = color[3];
}

function line(x1, y1, x2, y2, thickness, color) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  const radius = thickness / 2;
  for (let step = 0; step <= steps; step++) {
    const t = steps ? step / steps : 0;
    const cx = x1 + (x2 - x1) * t;
    const cy = y1 + (y2 - y1) * t;
    for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++) {
      for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2) setPixel(x, y, color);
      }
    }
  }
}

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) setPixel(x, y, navy);
}

// Gold rounded-square frame.
for (let y = 12; y < 180; y++) {
  for (let x = 12; x < 180; x++) {
    const cx = x < 40 ? 40 : x > 152 ? 152 : x;
    const cy = y < 40 ? 40 : y > 152 ? 152 : y;
    const d = Math.hypot(x - cx, y - cy);
    if (d >= 27 && d <= 34) setPixel(x, y, gold);
  }
}

// Clean ORKEIT-inspired circular mark and safety cross.
for (let y = 36; y < 144; y++) {
  for (let x = 36; x < 156; x++) {
    const d = Math.hypot(x - 96, y - 90);
    if (d >= 43 && d <= 53) setPixel(x, y, white);
  }
}
line(96, 62, 96, 118, 12, gold);
line(70, 90, 122, 90, 10, gold);

// PNG encoder using only Node built-ins.
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[n] = c >>> 0;
}
function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, crc]);
}
const scanlines = Buffer.alloc(height * (1 + width * 4));
for (let y = 0; y < height; y++) {
  const row = y * (1 + width * 4);
  scanlines[row] = 0;
  pixels.copy(scanlines, row + 1, y * width * 4, (y + 1) * width * 4);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(scanlines, { level: 9 })),
  chunk('IEND', Buffer.alloc(0))
]);
const output = resolve('public/pwa-192x192.png');
await mkdir(dirname(output), { recursive: true });
await writeFile(output, png);
console.log('Generated public/pwa-192x192.png (192x192 PNG)');
