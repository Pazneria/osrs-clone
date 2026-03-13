const fs = require("fs");
const zlib = require("zlib");

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

let crcTable = null;

function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
}

function crc32(buffer) {
  if (!crcTable) crcTable = makeCrcTable();
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    c = crcTable[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crcBuffer = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcBuffer), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function encodePng(width, height, rgbaBuffer) {
  if (!Number.isInteger(width) || width <= 0) throw new Error("width must be a positive integer");
  if (!Number.isInteger(height) || height <= 0) throw new Error("height must be a positive integer");
  if (!rgbaBuffer || rgbaBuffer.length !== width * height * 4) {
    throw new Error("rgba buffer length must equal width * height * 4");
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rawOffset = y * (stride + 1);
    raw[rawOffset] = 0;
    const sourceOffset = y * stride;
    Buffer.from(rgbaBuffer.buffer, rgbaBuffer.byteOffset + sourceOffset, stride).copy(raw, rawOffset + 1);
  }

  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    PNG_SIGNATURE,
    createChunk("IHDR", ihdr),
    createChunk("IDAT", idat),
    createChunk("IEND", Buffer.alloc(0))
  ]);
}

function writePng(filePath, width, height, rgbaBuffer) {
  fs.writeFileSync(filePath, encodePng(width, height, rgbaBuffer));
}

function readPngSize(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length < 24 || !buffer.slice(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error(`invalid PNG: ${filePath}`);
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

module.exports = {
  encodePng,
  writePng,
  readPngSize
};
