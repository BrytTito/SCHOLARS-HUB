// Packs PNGs into the multi-resolution .ico that sits at app/favicon.ico.
// Browsers accept PNG-compressed ICO entries (Vista and later), so no BMP
// encoding is needed.
//
//   node brand/make-ico.mjs app/favicon.ico 16:render/ico-16.png 32:render/ico-32.png
//
// Entries must be named "<size>:<path>"; the size is checked against the PNG's
// own header so a wrong file fails here instead of in a browser tab.

import { readFileSync, statSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

const [outFile, ...specs] = process.argv.slice(2);

if (!outFile || specs.length === 0) {
  console.error(
    "usage: node brand/make-ico.mjs <out.ico> <size>:<png> [<size>:<png> ...]",
  );
  process.exit(1);
}

const entries = specs
  .map((spec) => {
    const index = spec.indexOf(":");
    if (index === -1) throw new Error(`"${spec}" is not <size>:<png>`);
    const size = Number(spec.slice(0, index));
    const file = spec.slice(index + 1);
    const data = readFileSync(file);

    if (data.readUInt32BE(0) !== 0x89504e47) {
      throw new Error(`${file} is not a PNG`);
    }
    const width = data.readUInt32BE(16);
    const height = data.readUInt32BE(20);
    if (width !== size || height !== size) {
      throw new Error(`${file} is ${width}x${height}, expected ${size}x${size}`);
    }
    if (size > 256) {
      throw new Error(`${size}px cannot be stored in an ICO entry (256 max)`);
    }
    return { size, data };
  })
  .sort((a, b) => a.size - b.size);

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: 1 = icon
header.writeUInt16LE(entries.length, 4);

let offset = 6 + 16 * entries.length;
const directory = entries.map(({ size, data }) => {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size === 256 ? 0 : size, 0); // width, 0 means 256
  entry.writeUInt8(size === 256 ? 0 : size, 1); // height
  entry.writeUInt8(0, 2); // palette size
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(data.length, 8); // bytes in resource
  entry.writeUInt32LE(offset, 12); // offset of image data
  offset += data.length;
  return entry;
});

writeFileSync(
  outFile,
  Buffer.concat([header, ...directory, ...entries.map((e) => e.data)]),
);

console.log(
  `${outFile}: ${entries.map((e) => e.size).join("/")} — ${statSync(outFile).size} bytes (${basename(outFile)})`,
);
