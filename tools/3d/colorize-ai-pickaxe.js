"use strict";

const fs = require("fs");
const path = require("path");

const GLB_MAGIC = 0x46546c67;
const GLB_VERSION = 2;
const JSON_CHUNK_TYPE = 0x4e4f534a;
const BIN_CHUNK_TYPE = 0x004e4942;

const MATERIALS = [
  { name: "bronze_mid", color: "#a95e2d", metallic: 0.42, roughness: 0.56 },
  { name: "bronze_shadow", color: "#4f2716", metallic: 0.34, roughness: 0.68 },
  { name: "bronze_edge", color: "#cf8a3c", metallic: 0.5, roughness: 0.46 },
  { name: "wood_mid", color: "#87542d", metallic: 0, roughness: 0.82 },
  { name: "wood_light", color: "#b77a3d", metallic: 0, roughness: 0.78 },
  { name: "wood_dark", color: "#472816", metallic: 0, roughness: 0.88 },
  { name: "leather_dark", color: "#2a1710", metallic: 0, roughness: 0.9 }
];

function readGlb(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.readUInt32LE(0) !== GLB_MAGIC) throw new Error("input is not a GLB");
  if (buffer.readUInt32LE(4) !== GLB_VERSION) throw new Error("input must be GLB version 2");
  const jsonLength = buffer.readUInt32LE(12);
  const jsonType = buffer.readUInt32LE(16);
  if (jsonType !== JSON_CHUNK_TYPE) throw new Error("first GLB chunk must be JSON");
  const json = JSON.parse(buffer.subarray(20, 20 + jsonLength).toString("utf8").trim());
  const binHeaderOffset = 20 + jsonLength;
  const binLength = buffer.readUInt32LE(binHeaderOffset);
  const binType = buffer.readUInt32LE(binHeaderOffset + 4);
  if (binType !== BIN_CHUNK_TYPE) throw new Error("second GLB chunk must be BIN");
  const bin = buffer.subarray(binHeaderOffset + 8, binHeaderOffset + 8 + binLength);
  return { json, bin };
}

function getAccessorBytes(json, bin, accessorIndex) {
  const accessor = json.accessors[accessorIndex];
  const view = json.bufferViews[accessor.bufferView];
  const byteOffset = (view.byteOffset || 0) + (accessor.byteOffset || 0);
  return bin.subarray(byteOffset, byteOffset + view.byteLength);
}

function readPositions(json, bin, accessorIndex) {
  const accessor = json.accessors[accessorIndex];
  if (accessor.componentType !== 5126 || accessor.type !== "VEC3") {
    throw new Error("POSITION accessor must be Float32 VEC3");
  }
  const bytes = getAccessorBytes(json, bin, accessorIndex);
  return new Float32Array(bytes.buffer, bytes.byteOffset, accessor.count * 3);
}

function readIndices(json, bin, accessorIndex) {
  const accessor = json.accessors[accessorIndex];
  const bytes = getAccessorBytes(json, bin, accessorIndex);
  if (accessor.componentType === 5125) {
    return new Uint32Array(bytes.buffer, bytes.byteOffset, accessor.count);
  }
  if (accessor.componentType === 5123) {
    return new Uint16Array(bytes.buffer, bytes.byteOffset, accessor.count);
  }
  throw new Error("indices accessor must be Uint16 or Uint32");
}

function normalize(vector) {
  const length = Math.hypot(vector[0], vector[1], vector[2]);
  if (!Number.isFinite(length) || length <= 0) return [0, 1, 0];
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}

function subtract(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross(a, b) {
  return [
    (a[1] * b[2]) - (a[2] * b[1]),
    (a[2] * b[0]) - (a[0] * b[2]),
    (a[0] * b[1]) - (a[1] * b[0])
  ];
}

function getVertex(positions, index) {
  const offset = index * 3;
  return [positions[offset], positions[offset + 1], positions[offset + 2]];
}

function getBounds(positions) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    for (let axis = 0; axis < 3; axis += 1) {
      const value = positions[i + axis];
      if (value < min[axis]) min[axis] = value;
      if (value > max[axis]) max[axis] = value;
    }
  }
  return { min, max, span: [max[0] - min[0], max[1] - min[1], max[2] - min[2]] };
}

function classifyTriangle(centroid, normal, bounds) {
  const x = (centroid[0] - bounds.min[0]) / Math.max(bounds.span[0], 0.0001);
  const y = (centroid[1] - bounds.min[1]) / Math.max(bounds.span[1], 0.0001);
  const z = (centroid[2] - bounds.min[2]) / Math.max(bounds.span[2], 0.0001);
  const centeredX = Math.abs(x - 0.5);

  const isHead = y > 0.6 || (y > 0.5 && centeredX > 0.17);
  if (isHead) {
    if (centeredX > 0.45 || y > 0.92 || (z > 0.78 && normal[1] > 0.2)) return "bronze_edge";
    if (z < 0.35 || normal[1] < -0.25) return "bronze_shadow";
    return "bronze_mid";
  }

  const isLeatherBand = y < 0.16 || (y > 0.43 && y < 0.58 && centeredX < 0.2);
  if (isLeatherBand) return "leather_dark";

  const woodStripe = Math.floor((y * 18) + (z * 3));
  if (woodStripe % 5 === 0) return "wood_light";
  if (z < 0.32 || woodStripe % 7 === 0) return "wood_dark";
  return "wood_mid";
}

function computeNormalsAndGroups(positions, indices, bounds) {
  const normals = new Float32Array(positions.length);
  const groupedIndices = new Map(MATERIALS.map((material) => [material.name, []]));

  for (let i = 0; i < indices.length; i += 3) {
    const ia = indices[i];
    const ib = indices[i + 1];
    const ic = indices[i + 2];
    const a = getVertex(positions, ia);
    const b = getVertex(positions, ib);
    const c = getVertex(positions, ic);
    const faceNormal = normalize(cross(subtract(b, a), subtract(c, a)));
    const centroid = [
      (a[0] + b[0] + c[0]) / 3,
      (a[1] + b[1] + c[1]) / 3,
      (a[2] + b[2] + c[2]) / 3
    ];
    const materialName = classifyTriangle(centroid, faceNormal, bounds);
    groupedIndices.get(materialName).push(ia, ib, ic);

    for (const vertexIndex of [ia, ib, ic]) {
      const offset = vertexIndex * 3;
      normals[offset] += faceNormal[0];
      normals[offset + 1] += faceNormal[1];
      normals[offset + 2] += faceNormal[2];
    }
  }

  for (let i = 0; i < normals.length; i += 3) {
    const normal = normalize([normals[i], normals[i + 1], normals[i + 2]]);
    normals[i] = normal[0];
    normals[i + 1] = normal[1];
    normals[i + 2] = normal[2];
  }

  return {
    normals,
    groupedIndices: Array.from(groupedIndices.entries())
      .map(([materialName, values]) => ({ materialName, indices: new Uint32Array(values) }))
      .filter((group) => group.indices.length > 0)
  };
}

function hexToFactor(hex) {
  const raw = hex.replace(/^#/, "");
  return [
    parseInt(raw.slice(0, 2), 16) / 255,
    parseInt(raw.slice(2, 4), 16) / 255,
    parseInt(raw.slice(4, 6), 16) / 255,
    1
  ];
}

function bufferFromTypedArray(array) {
  return Buffer.from(array.buffer, array.byteOffset, array.byteLength);
}

function pad4(buffer, padByte = 0) {
  const padding = (4 - (buffer.length % 4)) % 4;
  return padding ? Buffer.concat([buffer, Buffer.alloc(padding, padByte)]) : buffer;
}

function append(chunks, buffer) {
  const offset = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const padding = (4 - (offset % 4)) % 4;
  if (padding) chunks.push(Buffer.alloc(padding));
  const alignedOffset = offset + padding;
  chunks.push(buffer);
  return alignedOffset;
}

function getMinMax(positions) {
  const bounds = getBounds(positions);
  return { min: bounds.min, max: bounds.max };
}

function writeColoredGlb(outputPath, positions, normals, groups) {
  const chunks = [];
  const bufferViews = [];
  const accessors = [];
  const primitives = [];

  function addBufferView(buffer, target) {
    const byteOffset = append(chunks, buffer);
    const bufferView = { buffer: 0, byteOffset, byteLength: buffer.length };
    if (target) bufferView.target = target;
    bufferViews.push(bufferView);
    return bufferViews.length - 1;
  }

  const positionView = addBufferView(bufferFromTypedArray(positions), 34962);
  accessors.push({
    bufferView: positionView,
    componentType: 5126,
    count: positions.length / 3,
    type: "VEC3",
    ...getMinMax(positions)
  });

  const normalView = addBufferView(bufferFromTypedArray(normals), 34962);
  accessors.push({
    bufferView: normalView,
    componentType: 5126,
    count: normals.length / 3,
    type: "VEC3"
  });

  for (const group of groups) {
    const materialIndex = MATERIALS.findIndex((material) => material.name === group.materialName);
    const indexView = addBufferView(bufferFromTypedArray(group.indices), 34963);
    accessors.push({
      bufferView: indexView,
      componentType: 5125,
      count: group.indices.length,
      type: "SCALAR",
      min: [0],
      max: [positions.length / 3 - 1]
    });
    primitives.push({
      attributes: { POSITION: 0, NORMAL: 1 },
      indices: accessors.length - 1,
      material: materialIndex,
      mode: 4
    });
  }

  const bin = Buffer.concat(chunks);
  const gltf = {
    asset: {
      version: "2.0",
      generator: "OSRS Clone tools/3d/colorize-ai-pickaxe.js"
    },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [
      { name: "world", children: [1] },
      { name: "bronze_pickaxe_ai_colored", mesh: 0 }
    ],
    meshes: [{ name: "bronze_pickaxe_ai_colored", primitives }],
    materials: MATERIALS.map((material) => ({
      name: material.name,
      pbrMetallicRoughness: {
        baseColorFactor: hexToFactor(material.color),
        metallicFactor: material.metallic,
        roughnessFactor: material.roughness
      },
      doubleSided: true
    })),
    buffers: [{ byteLength: bin.length }],
    bufferViews,
    accessors
  };

  const jsonChunk = pad4(Buffer.from(JSON.stringify(gltf), "utf8"), 0x20);
  const binChunk = pad4(bin, 0);
  const totalLength = 12 + 8 + jsonChunk.length + 8 + binChunk.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(GLB_MAGIC, 0);
  header.writeUInt32LE(GLB_VERSION, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(JSON_CHUNK_TYPE, 4);

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(BIN_CHUNK_TYPE, 4);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]));
}

function main() {
  const projectRoot = path.resolve(__dirname, "..", "..");
  const inputPath = path.join(projectRoot, "assets", "3d-src", "bronze_pickaxe", "bronze_pickaxe_ai_candidate.glb");
  const outputPath = path.join(projectRoot, "assets", "3d-src", "bronze_pickaxe", "bronze_pickaxe_ai_colored.glb");
  const { json, bin } = readGlb(inputPath);
  const primitive = json.meshes[0].primitives[0];
  const positions = new Float32Array(readPositions(json, bin, primitive.attributes.POSITION));
  const indices = new Uint32Array(readIndices(json, bin, primitive.indices));
  const bounds = getBounds(positions);
  const { normals, groupedIndices } = computeNormalsAndGroups(positions, indices, bounds);
  writeColoredGlb(outputPath, positions, normals, groupedIndices);
  console.log(`Colorized AI pickaxe GLB: ${path.relative(projectRoot, outputPath)}`);
  for (const group of groupedIndices) {
    console.log(`  ${group.materialName}: ${group.indices.length / 3} triangles`);
  }
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  }
}
