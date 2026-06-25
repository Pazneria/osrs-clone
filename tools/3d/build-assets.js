"use strict";

const fs = require("fs");
const path = require("path");
const { writePng } = require("../pixel/pixel-png");

const GLB_MAGIC = 0x46546c67;
const GLB_VERSION = 2;
const JSON_CHUNK_TYPE = 0x4e4f534a;
const BIN_CHUNK_TYPE = 0x004e4942;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function normalizeHex(hex) {
  const raw = String(hex || "").trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) throw new Error(`invalid hex color '${hex}'`);
  return `#${raw.toLowerCase()}`;
}

function hexToRgb(hex) {
  const normalized = normalizeHex(hex).slice(1);
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16)
  ];
}

function hexToFactor(hex) {
  const rgb = hexToRgb(hex);
  return [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, 1];
}

function add(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function sub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function scale(a, scalar) {
  return [a[0] * scalar, a[1] * scalar, a[2] * scalar];
}

function dot(a, b) {
  return (a[0] * b[0]) + (a[1] * b[1]) + (a[2] * b[2]);
}

function cross(a, b) {
  return [
    (a[1] * b[2]) - (a[2] * b[1]),
    (a[2] * b[0]) - (a[0] * b[2]),
    (a[0] * b[1]) - (a[1] * b[0])
  ];
}

function length(a) {
  return Math.sqrt(dot(a, a));
}

function normalize(a) {
  const len = length(a);
  if (!Number.isFinite(len) || len <= 0) return [0, 0, 0];
  return [a[0] / len, a[1] / len, a[2] / len];
}

function rotateVector(vector, rotation) {
  const rx = Number(rotation && rotation[0]) || 0;
  const ry = Number(rotation && rotation[1]) || 0;
  const rz = Number(rotation && rotation[2]) || 0;
  let x = vector[0];
  let y = vector[1];
  let z = vector[2];

  if (rx) {
    const c = Math.cos(rx);
    const s = Math.sin(rx);
    const nextY = (y * c) - (z * s);
    const nextZ = (y * s) + (z * c);
    y = nextY;
    z = nextZ;
  }
  if (ry) {
    const c = Math.cos(ry);
    const s = Math.sin(ry);
    const nextX = (x * c) + (z * s);
    const nextZ = (-x * s) + (z * c);
    x = nextX;
    z = nextZ;
  }
  if (rz) {
    const c = Math.cos(rz);
    const s = Math.sin(rz);
    const nextX = (x * c) - (y * s);
    const nextY = (x * s) + (y * c);
    x = nextX;
    y = nextY;
  }
  return [x, y, z];
}

function transformPoint(point, primitive) {
  const rotated = rotateVector(point, primitive.rotation || [0, 0, 0]);
  return add(rotated, primitive.position || [0, 0, 0]);
}

function createBoxGeometry(primitive) {
  const size = primitive.size || [1, 1, 1];
  const hx = size[0] / 2;
  const hy = size[1] / 2;
  const hz = size[2] / 2;
  const faces = [
    { normal: [0, 0, 1], corners: [[-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz]] },
    { normal: [0, 0, -1], corners: [[hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz]] },
    { normal: [1, 0, 0], corners: [[hx, -hy, hz], [hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz]] },
    { normal: [-1, 0, 0], corners: [[-hx, -hy, -hz], [-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz]] },
    { normal: [0, 1, 0], corners: [[-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz], [-hx, hy, -hz]] },
    { normal: [0, -1, 0], corners: [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz]] }
  ];
  const positions = [];
  const normals = [];
  const indices = [];

  for (let faceIndex = 0; faceIndex < faces.length; faceIndex += 1) {
    const face = faces[faceIndex];
    const base = positions.length / 3;
    const normal = normalize(rotateVector(face.normal, primitive.rotation || [0, 0, 0]));
    for (let i = 0; i < face.corners.length; i += 1) {
      const point = transformPoint(face.corners[i], primitive);
      positions.push(point[0], point[1], point[2]);
      normals.push(normal[0], normal[1], normal[2]);
    }
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  return { positions, normals, indices };
}

function addFace(positions, normals, indices, primitive, corners, faceNormal) {
  const base = positions.length / 3;
  const normal = normalize(rotateVector(faceNormal, primitive.rotation || [0, 0, 0]));
  for (let i = 0; i < corners.length; i += 1) {
    const point = transformPoint(corners[i], primitive);
    positions.push(point[0], point[1], point[2]);
    normals.push(normal[0], normal[1], normal[2]);
  }

  for (let i = 1; i < corners.length - 1; i += 1) {
    indices.push(base, base + i, base + i + 1);
  }
}

function getPolygonArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    area += (current[0] * next[1]) - (next[0] * current[1]);
  }
  return area / 2;
}

function normalizePolygonPoints(points) {
  if (!Array.isArray(points) || points.length < 3) {
    throw new Error("prism primitive requires at least three points");
  }
  const normalized = points.map((point) => {
    if (!Array.isArray(point) || point.length < 2) throw new Error("prism points must be [x, y] pairs");
    return [Number(point[0]) || 0, Number(point[1]) || 0];
  });
  return getPolygonArea(normalized) >= 0 ? normalized : normalized.reverse();
}

function createPrismGeometry(primitive) {
  const depth = Number(primitive.depth) || 0.06;
  const halfDepth = depth / 2;
  const points = normalizePolygonPoints(primitive.points);
  const positions = [];
  const normals = [];
  const indices = [];

  const front = points.map((point) => [point[0], point[1], halfDepth]);
  const back = points.map((point) => [point[0], point[1], -halfDepth]);
  addFace(positions, normals, indices, primitive, front, [0, 0, 1]);
  addFace(positions, normals, indices, primitive, back.slice().reverse(), [0, 0, -1]);

  for (let i = 0; i < points.length; i += 1) {
    const nextIndex = (i + 1) % points.length;
    const current = points[i];
    const next = points[nextIndex];
    const edge = [next[0] - current[0], next[1] - current[1], 0];
    const outward = normalize([edge[1], -edge[0], 0]);
    addFace(
      positions,
      normals,
      indices,
      primitive,
      [
        [current[0], current[1], -halfDepth],
        [next[0], next[1], -halfDepth],
        [next[0], next[1], halfDepth],
        [current[0], current[1], halfDepth]
      ],
      outward
    );
  }

  return { positions, normals, indices };
}

function createCylinderGeometry(primitive) {
  const height = Number(primitive.height) || 1;
  const halfHeight = height / 2;
  const radiusTop = Number.isFinite(primitive.radiusTop) ? primitive.radiusTop : (Number(primitive.radius) || 0.05);
  const radiusBottom = Number.isFinite(primitive.radiusBottom) ? primitive.radiusBottom : (Number(primitive.radius) || radiusTop);
  const radialSegments = Math.max(5, Math.min(32, Math.floor(primitive.radialSegments || 8)));
  const positions = [];
  const normals = [];
  const indices = [];

  for (let i = 0; i < radialSegments; i += 1) {
    const nextIndex = (i + 1) % radialSegments;
    const angle = (i / radialSegments) * Math.PI * 2;
    const nextAngle = (nextIndex / radialSegments) * Math.PI * 2;
    const bottomA = [Math.cos(angle) * radiusBottom, -halfHeight, Math.sin(angle) * radiusBottom];
    const bottomB = [Math.cos(nextAngle) * radiusBottom, -halfHeight, Math.sin(nextAngle) * radiusBottom];
    const topB = [Math.cos(nextAngle) * radiusTop, halfHeight, Math.sin(nextAngle) * radiusTop];
    const topA = [Math.cos(angle) * radiusTop, halfHeight, Math.sin(angle) * radiusTop];
    const normalAngle = angle + ((nextAngle - angle) / 2);
    addFace(
      positions,
      normals,
      indices,
      primitive,
      [bottomA, bottomB, topB, topA],
      [Math.cos(normalAngle), 0, Math.sin(normalAngle)]
    );

    addFace(
      positions,
      normals,
      indices,
      primitive,
      [[0, halfHeight, 0], topA, topB],
      [0, 1, 0]
    );
    addFace(
      positions,
      normals,
      indices,
      primitive,
      [[0, -halfHeight, 0], bottomB, bottomA],
      [0, -1, 0]
    );
  }

  return { positions, normals, indices };
}

function createGeometry(primitive) {
  if (!primitive) {
    throw new Error("missing 3D source primitive");
  }
  if (primitive.shape === "box") return createBoxGeometry(primitive);
  if (primitive.shape === "prism") return createPrismGeometry(primitive);
  if (primitive.shape === "cylinder") return createCylinderGeometry(primitive);
  throw new Error(`unsupported 3D source primitive '${primitive.shape}'`);
}

function getMinMax(positions) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    for (let axis = 0; axis < 3; axis += 1) {
      const value = positions[i + axis];
      if (value < min[axis]) min[axis] = value;
      if (value > max[axis]) max[axis] = value;
    }
  }
  return { min, max };
}

function alignBufferParts(parts, alignment = 4) {
  let lengthSoFar = 0;
  const aligned = [];
  for (let i = 0; i < parts.length; i += 1) {
    const padding = (alignment - (lengthSoFar % alignment)) % alignment;
    if (padding) {
      aligned.push(Buffer.alloc(padding));
      lengthSoFar += padding;
    }
    aligned.push(parts[i]);
    lengthSoFar += parts[i].length;
  }
  return Buffer.concat(aligned);
}

function appendAlignedBuffer(chunks, buffer) {
  const currentLength = chunks.reduce((sum, item) => sum + item.length, 0);
  const padding = (4 - (currentLength % 4)) % 4;
  if (padding) chunks.push(Buffer.alloc(padding));
  const byteOffset = currentLength + padding;
  chunks.push(buffer);
  return byteOffset;
}

function typedArrayBuffer(array) {
  return Buffer.from(array.buffer, array.byteOffset, array.byteLength);
}

function readGlb(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.readUInt32LE(0) !== GLB_MAGIC) throw new Error(`${filePath} is not a GLB`);
  if (buffer.readUInt32LE(4) !== GLB_VERSION) throw new Error(`${filePath} must be GLB version 2`);
  const jsonLength = buffer.readUInt32LE(12);
  const jsonType = buffer.readUInt32LE(16);
  if (jsonType !== JSON_CHUNK_TYPE) throw new Error(`${filePath} first GLB chunk must be JSON`);
  const json = JSON.parse(buffer.subarray(20, 20 + jsonLength).toString("utf8").trim());
  const binHeaderOffset = 20 + jsonLength;
  if (binHeaderOffset + 8 > buffer.length) return { json, bin: Buffer.alloc(0) };
  const binLength = buffer.readUInt32LE(binHeaderOffset);
  const binType = buffer.readUInt32LE(binHeaderOffset + 4);
  if (binType !== BIN_CHUNK_TYPE) throw new Error(`${filePath} second GLB chunk must be BIN`);
  const bin = buffer.subarray(binHeaderOffset + 8, binHeaderOffset + 8 + binLength);
  return { json, bin };
}

function getAccessorComponentCount(type) {
  if (type === "SCALAR") return 1;
  if (type === "VEC2") return 2;
  if (type === "VEC3") return 3;
  if (type === "VEC4" || type === "MAT2") return 4;
  if (type === "MAT3") return 9;
  if (type === "MAT4") return 16;
  throw new Error(`unsupported accessor type '${type}'`);
}

function getComponentByteSize(componentType) {
  if (componentType === 5120 || componentType === 5121) return 1;
  if (componentType === 5122 || componentType === 5123) return 2;
  if (componentType === 5125 || componentType === 5126) return 4;
  throw new Error(`unsupported accessor component type '${componentType}'`);
}

function readComponent(buffer, byteOffset, componentType) {
  if (componentType === 5120) return buffer.readInt8(byteOffset);
  if (componentType === 5121) return buffer.readUInt8(byteOffset);
  if (componentType === 5122) return buffer.readInt16LE(byteOffset);
  if (componentType === 5123) return buffer.readUInt16LE(byteOffset);
  if (componentType === 5125) return buffer.readUInt32LE(byteOffset);
  if (componentType === 5126) return buffer.readFloatLE(byteOffset);
  throw new Error(`unsupported accessor component type '${componentType}'`);
}

function readAccessorValues(json, bin, accessorIndex) {
  const accessor = json.accessors && json.accessors[accessorIndex];
  if (!accessor) throw new Error(`missing accessor ${accessorIndex}`);
  const view = json.bufferViews && json.bufferViews[accessor.bufferView];
  if (!view) throw new Error(`missing bufferView ${accessor.bufferView}`);
  if (accessor.sparse) throw new Error("sparse GLB accessors are not supported for icon rendering");
  const componentCount = getAccessorComponentCount(accessor.type);
  const componentByteSize = getComponentByteSize(accessor.componentType);
  const naturalStride = componentByteSize * componentCount;
  const stride = view.byteStride || naturalStride;
  const start = (view.byteOffset || 0) + (accessor.byteOffset || 0);
  const values = new Array(accessor.count * componentCount);

  for (let i = 0; i < accessor.count; i += 1) {
    const elementOffset = start + (i * stride);
    for (let component = 0; component < componentCount; component += 1) {
      values[(i * componentCount) + component] = readComponent(
        bin,
        elementOffset + (component * componentByteSize),
        accessor.componentType
      );
    }
  }

  return {
    values,
    count: accessor.count,
    componentCount,
    componentType: accessor.componentType,
    type: accessor.type
  };
}

function readVec3(values, index) {
  const offset = index * 3;
  return [values[offset] || 0, values[offset + 1] || 0, values[offset + 2] || 0];
}

function identityMat4() {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

function multiplyMat4(a, b) {
  const out = new Array(16);
  for (let col = 0; col < 4; col += 1) {
    for (let row = 0; row < 4; row += 1) {
      out[(col * 4) + row] =
        (a[row] * b[col * 4]) +
        (a[4 + row] * b[(col * 4) + 1]) +
        (a[8 + row] * b[(col * 4) + 2]) +
        (a[12 + row] * b[(col * 4) + 3]);
    }
  }
  return out;
}

function composeTrsMatrix(node) {
  if (Array.isArray(node.matrix) && node.matrix.length === 16) return node.matrix.map((value) => Number(value) || 0);
  const translation = Array.isArray(node.translation) ? node.translation : [0, 0, 0];
  const rotation = Array.isArray(node.rotation) ? node.rotation : [0, 0, 0, 1];
  const scaleValue = Array.isArray(node.scale) ? node.scale : [1, 1, 1];
  const x = Number(rotation[0]) || 0;
  const y = Number(rotation[1]) || 0;
  const z = Number(rotation[2]) || 0;
  const w = Number.isFinite(rotation[3]) ? rotation[3] : 1;
  const sx = Number.isFinite(scaleValue[0]) ? scaleValue[0] : 1;
  const sy = Number.isFinite(scaleValue[1]) ? scaleValue[1] : 1;
  const sz = Number.isFinite(scaleValue[2]) ? scaleValue[2] : 1;
  const x2 = x + x;
  const y2 = y + y;
  const z2 = z + z;
  const xx = x * x2;
  const xy = x * y2;
  const xz = x * z2;
  const yy = y * y2;
  const yz = y * z2;
  const zz = z * z2;
  const wx = w * x2;
  const wy = w * y2;
  const wz = w * z2;

  return [
    (1 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0,
    (xy - wz) * sy, (1 - (xx + zz)) * sy, (yz + wx) * sy, 0,
    (xz + wy) * sz, (yz - wx) * sz, (1 - (xx + yy)) * sz, 0,
    Number(translation[0]) || 0, Number(translation[1]) || 0, Number(translation[2]) || 0, 1
  ];
}

function transformMat4Point(matrix, point) {
  const x = point[0];
  const y = point[1];
  const z = point[2];
  return [
    (matrix[0] * x) + (matrix[4] * y) + (matrix[8] * z) + matrix[12],
    (matrix[1] * x) + (matrix[5] * y) + (matrix[9] * z) + matrix[13],
    (matrix[2] * x) + (matrix[6] * y) + (matrix[10] * z) + matrix[14]
  ];
}

function factorToHex(factor) {
  const channels = [0, 1, 2].map((index) => {
    const value = Array.isArray(factor) ? Number(factor[index]) : 1;
    return Math.max(0, Math.min(255, Math.round((Number.isFinite(value) ? value : 1) * 255)));
  });
  return `#${channels.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function getGlbMaterialColors(json) {
  const materials = Array.isArray(json.materials) ? json.materials : [];
  return materials.map((material) => {
    const pbr = material && material.pbrMetallicRoughness ? material.pbrMetallicRoughness : {};
    return factorToHex(Array.isArray(pbr.baseColorFactor) ? pbr.baseColorFactor : [1, 1, 1, 1]);
  });
}

function getSceneRootNodeIndices(json) {
  const sceneIndex = Number.isInteger(json.scene) ? json.scene : 0;
  const scene = Array.isArray(json.scenes) ? json.scenes[sceneIndex] : null;
  if (scene && Array.isArray(scene.nodes) && scene.nodes.length > 0) return scene.nodes;
  return Array.isArray(json.nodes) ? json.nodes.map((_, index) => index) : [];
}

function collectGlbTriangles(glbPath) {
  const { json, bin } = readGlb(glbPath);
  const materialColors = getGlbMaterialColors(json);
  const triangles = [];
  const nodes = Array.isArray(json.nodes) ? json.nodes : [];
  const meshes = Array.isArray(json.meshes) ? json.meshes : [];

  function visitNode(nodeIndex, parentMatrix) {
    const node = nodes[nodeIndex];
    if (!node) return;
    const matrix = multiplyMat4(parentMatrix, composeTrsMatrix(node));
    if (Number.isInteger(node.mesh) && meshes[node.mesh]) {
      const mesh = meshes[node.mesh];
      const primitives = Array.isArray(mesh.primitives) ? mesh.primitives : [];
      for (let primitiveIndex = 0; primitiveIndex < primitives.length; primitiveIndex += 1) {
        const primitive = primitives[primitiveIndex];
        const positionAccessor = primitive.attributes && primitive.attributes.POSITION;
        if (!Number.isInteger(positionAccessor)) continue;
        const positions = readAccessorValues(json, bin, positionAccessor);
        if (positions.type !== "VEC3") throw new Error(`${glbPath} POSITION accessor must be VEC3`);
        const indices = Number.isInteger(primitive.indices)
          ? readAccessorValues(json, bin, primitive.indices).values
          : null;
        const materialColor = materialColors[primitive.material] || "#ff00ff";
        const indexCount = indices ? indices.length : positions.count;
        for (let i = 0; i < indexCount - 2; i += 3) {
          const ia = indices ? indices[i] : i;
          const ib = indices ? indices[i + 1] : i + 1;
          const ic = indices ? indices[i + 2] : i + 2;
          const a = transformMat4Point(matrix, readVec3(positions.values, ia));
          const b = transformMat4Point(matrix, readVec3(positions.values, ib));
          const c = transformMat4Point(matrix, readVec3(positions.values, ic));
          triangles.push({
            vertices: [a, b, c],
            normal: normalize(cross(sub(b, a), sub(c, a))),
            materialColor
          });
        }
      }
    }
    const children = Array.isArray(node.children) ? node.children : [];
    for (let i = 0; i < children.length; i += 1) visitNode(children[i], matrix);
  }

  const roots = getSceneRootNodeIndices(json);
  for (let i = 0; i < roots.length; i += 1) visitNode(roots[i], identityMat4());
  if (triangles.length === 0) throw new Error(`${glbPath} did not yield renderable icon triangles`);
  return triangles;
}

function buildGlb(source) {
  const materialNames = Object.keys(source.materials || {});
  const materialIndexByName = new Map();
  materialNames.forEach((name, index) => materialIndexByName.set(name, index));

  const bufferChunks = [];
  const bufferViews = [];
  const accessors = [];
  const meshes = [];
  const nodes = [];

  function addAccessor(buffer, target, componentType, count, type, minMax = null) {
    const byteOffset = appendAlignedBuffer(bufferChunks, buffer);
    const bufferView = {
      buffer: 0,
      byteOffset,
      byteLength: buffer.length,
      target
    };
    const bufferViewIndex = bufferViews.length;
    bufferViews.push(bufferView);
    const accessor = {
      bufferView: bufferViewIndex,
      componentType,
      count,
      type
    };
    if (minMax) {
      accessor.min = minMax.min;
      accessor.max = minMax.max;
    }
    const accessorIndex = accessors.length;
    accessors.push(accessor);
    return accessorIndex;
  }

  for (let i = 0; i < source.primitives.length; i += 1) {
    const primitive = source.primitives[i];
    const geometry = createGeometry(primitive);
    const positions = new Float32Array(geometry.positions);
    const normals = new Float32Array(geometry.normals);
    const indices = new Uint16Array(geometry.indices);
    const positionAccessor = addAccessor(
      typedArrayBuffer(positions),
      34962,
      5126,
      positions.length / 3,
      "VEC3",
      getMinMax(geometry.positions)
    );
    const normalAccessor = addAccessor(typedArrayBuffer(normals), 34962, 5126, normals.length / 3, "VEC3");
    const indexAccessor = addAccessor(typedArrayBuffer(indices), 34963, 5123, indices.length, "SCALAR");
    const materialIndex = materialIndexByName.has(primitive.material)
      ? materialIndexByName.get(primitive.material)
      : 0;

    meshes.push({
      name: primitive.name || `primitive_${i}`,
      primitives: [
        {
          attributes: {
            POSITION: positionAccessor,
            NORMAL: normalAccessor
          },
          indices: indexAccessor,
          material: materialIndex
        }
      ]
    });
    nodes.push({ name: primitive.name || `primitive_${i}`, mesh: meshes.length - 1 });
  }

  const bin = Buffer.concat(bufferChunks);
  const gltf = {
    asset: {
      version: "2.0",
      generator: "OSRS Clone tools/3d/build-assets.js"
    },
    scene: 0,
    scenes: [{ nodes: nodes.map((_, index) => index) }],
    nodes,
    meshes,
    materials: materialNames.map((name) => {
      const color = source.materials[name];
      const isMetal = /bronze|iron|steel|mithril|adamant|rune/i.test(name);
      return {
        name,
        doubleSided: true,
        pbrMetallicRoughness: {
          baseColorFactor: hexToFactor(color),
          metallicFactor: isMetal ? 0.22 : 0,
          roughnessFactor: 0.82
        }
      };
    }),
    buffers: [{ byteLength: bin.length }],
    bufferViews,
    accessors
  };

  const json = Buffer.from(JSON.stringify(gltf), "utf8");
  const jsonChunk = alignBufferParts([json], 4);
  const binChunk = alignBufferParts([bin], 4);
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

  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]);
}

function collectTriangles(source) {
  const triangles = [];
  for (let i = 0; i < source.primitives.length; i += 1) {
    const primitive = source.primitives[i];
    const geometry = createGeometry(primitive);
    for (let index = 0; index < geometry.indices.length; index += 3) {
      const vertexIndices = [
        geometry.indices[index],
        geometry.indices[index + 1],
        geometry.indices[index + 2]
      ];
      const vertices = vertexIndices.map((vertexIndex) => {
        const offset = vertexIndex * 3;
        return [
          geometry.positions[offset],
          geometry.positions[offset + 1],
          geometry.positions[offset + 2]
        ];
      });
      const normalOffset = vertexIndices[0] * 3;
      const normal = normalize([
        geometry.normals[normalOffset],
        geometry.normals[normalOffset + 1],
        geometry.normals[normalOffset + 2]
      ]);
      triangles.push({
        vertices,
        normal,
        material: primitive.material
      });
    }
  }
  return triangles;
}

function getTriangleBounds(triangles) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < triangles.length; i += 1) {
    for (let vertexIndex = 0; vertexIndex < triangles[i].vertices.length; vertexIndex += 1) {
      const vertex = triangles[i].vertices[vertexIndex];
      for (let axis = 0; axis < 3; axis += 1) {
        if (vertex[axis] < min[axis]) min[axis] = vertex[axis];
        if (vertex[axis] > max[axis]) max[axis] = vertex[axis];
      }
    }
  }
  return {
    min,
    max,
    center: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2],
    span: [Math.max(0.001, max[0] - min[0]), Math.max(0.001, max[1] - min[1]), Math.max(0.001, max[2] - min[2])]
  };
}

function resolveIconCamera(triangles, cameraName) {
  if (cameraName === "tool_side") {
    const bounds = getTriangleBounds(triangles);
    const distance = Math.max(bounds.span[0], bounds.span[1], bounds.span[2]) * 2.5;
    return {
      target: bounds.center,
      camera: [bounds.center[0], bounds.center[1], bounds.center[2] + distance],
      worldUp: [0, 1, 0],
      fitScale: 0.88
    };
  }

  return {
    target: [0.07, 0.31, 0],
    camera: [1.08, 0.94, 1.55],
    worldUp: [0, 1, 0],
    fitScale: 0.78
  };
}

function projectVertices(triangles, width, height, cameraName = "tool_3q") {
  const cameraConfig = resolveIconCamera(triangles, cameraName);
  const target = cameraConfig.target;
  const camera = cameraConfig.camera;
  const worldUp = cameraConfig.worldUp;
  const forward = normalize(sub(target, camera));
  const right = normalize(cross(forward, worldUp));
  const up = normalize(cross(right, forward));

  const projected = [];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < triangles.length; i += 1) {
    const tri = triangles[i];
    const projectedVertices = tri.vertices.map((point) => {
      const rel = sub(point, target);
      const x = dot(rel, right);
      const y = dot(rel, up);
      const depth = dot(rel, forward);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      return { x, y, depth };
    });
    projected.push(Object.assign({}, tri, { projectedVertices }));
  }

  const spanX = Math.max(0.001, maxX - minX);
  const spanY = Math.max(0.001, maxY - minY);
  const fit = Math.min(width / spanX, height / spanY) * cameraConfig.fitScale;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  for (let i = 0; i < projected.length; i += 1) {
    projected[i].projectedVertices = projected[i].projectedVertices.map((point) => ({
      x: ((point.x - centerX) * fit) + (width / 2),
      y: (height / 2) - ((point.y - centerY) * fit),
      depth: point.depth
    }));
  }
  return projected;
}

function edge(a, b, x, y) {
  return ((x - a.x) * (b.y - a.y)) - ((y - a.y) * (b.x - a.x));
}

function rasterTriangle(rgba, zBuffer, width, height, tri, color) {
  const a = tri.projectedVertices[0];
  const b = tri.projectedVertices[1];
  const c = tri.projectedVertices[2];
  const area = edge(a, b, c.x, c.y);
  if (!Number.isFinite(area) || Math.abs(area) < 0.00001) return;

  const minX = Math.max(0, Math.floor(Math.min(a.x, b.x, c.x)));
  const maxX = Math.min(width - 1, Math.ceil(Math.max(a.x, b.x, c.x)));
  const minY = Math.max(0, Math.floor(Math.min(a.y, b.y, c.y)));
  const maxY = Math.min(height - 1, Math.ceil(Math.max(a.y, b.y, c.y)));

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const px = x + 0.5;
      const py = y + 0.5;
      const w0 = edge(b, c, px, py);
      const w1 = edge(c, a, px, py);
      const w2 = edge(a, b, px, py);
      const hasPositive = w0 > 0 || w1 > 0 || w2 > 0;
      const hasNegative = w0 < 0 || w1 < 0 || w2 < 0;
      if (hasPositive && hasNegative) continue;
      const b0 = w0 / area;
      const b1 = w1 / area;
      const b2 = w2 / area;
      const depth = (a.depth * b0) + (b.depth * b1) + (c.depth * b2);
      const zIndex = (y * width) + x;
      if (depth >= zBuffer[zIndex]) continue;
      zBuffer[zIndex] = depth;
      const offset = zIndex * 4;
      rgba[offset] = color[0];
      rgba[offset + 1] = color[1];
      rgba[offset + 2] = color[2];
      rgba[offset + 3] = 255;
    }
  }
}

function shadeColor(hex, normal) {
  const rgb = hexToRgb(hex);
  const lightDir = normalize([0.35, 0.8, 0.72]);
  const light = Math.max(0, dot(normalize(normal), lightDir));
  const shade = 0.52 + (light * 0.48);
  return rgb.map((value) => Math.max(0, Math.min(255, Math.round(value * shade))));
}

function downsampleRgba(source, sourceSize, targetSize) {
  const factor = sourceSize / targetSize;
  const target = Buffer.alloc(targetSize * targetSize * 4);
  for (let y = 0; y < targetSize; y += 1) {
    for (let x = 0; x < targetSize; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let count = 0;
      for (let sy = 0; sy < factor; sy += 1) {
        for (let sx = 0; sx < factor; sx += 1) {
          const sourceX = (x * factor) + sx;
          const sourceY = (y * factor) + sy;
          const offset = ((sourceY * sourceSize) + sourceX) * 4;
          r += source[offset];
          g += source[offset + 1];
          b += source[offset + 2];
          a += source[offset + 3];
          count += 1;
        }
      }
      const targetOffset = ((y * targetSize) + x) * 4;
      target[targetOffset] = Math.round(r / count);
      target[targetOffset + 1] = Math.round(g / count);
      target[targetOffset + 2] = Math.round(b / count);
      target[targetOffset + 3] = Math.round(a / count);
    }
  }
  return target;
}

function renderTrianglesIcon(triangles, outputPath, reviewPath, cameraName) {
  const iconSize = 32;
  const superSize = 128;
  const rgba = Buffer.alloc(superSize * superSize * 4);
  const zBuffer = new Float32Array(superSize * superSize);
  zBuffer.fill(Infinity);
  const projectedTriangles = projectVertices(triangles, superSize, superSize, cameraName);
  for (let i = 0; i < projectedTriangles.length; i += 1) {
    const tri = projectedTriangles[i];
    const materialColor = tri.materialColor || "#ff00ff";
    rasterTriangle(rgba, zBuffer, superSize, superSize, tri, shadeColor(materialColor, tri.normal));
  }

  const icon = downsampleRgba(rgba, superSize, iconSize);
  ensureDir(path.dirname(outputPath));
  writePng(outputPath, iconSize, iconSize, icon);
  if (reviewPath) {
    ensureDir(path.dirname(reviewPath));
    writePng(reviewPath, iconSize, iconSize, icon);
  }
}

function renderIcon(source, outputPath, reviewPath, cameraName) {
  const triangles = collectTriangles(source).map((triangle) => Object.assign({}, triangle, {
    materialColor: source.materials[triangle.material] || "#ff00ff"
  }));
  renderTrianglesIcon(triangles, outputPath, reviewPath, cameraName);
}

function renderGlbIcon(glbPath, outputPath, reviewPath, cameraName) {
  renderTrianglesIcon(collectGlbTriangles(glbPath), outputPath, reviewPath, cameraName);
}

function buildRuntimeCatalog(projectRoot, manifest, sourceByAssetId) {
  const assets = {};
  for (const [assetId, def] of Object.entries(manifest.assets || {})) {
    const source = sourceByAssetId[assetId];
    assets[assetId] = {
      id: def.id,
      name: def.name,
      kind: def.kind,
      family: def.family,
      tier: def.tier,
      runtime: def.runtime,
      inventoryIcon: def.inventoryIcon,
      attachment: def.attachment,
      groundPose: def.groundPose,
      bounds: def.bounds,
      sourceKind: source.kind,
      materials: source.materials,
      fallbackPrimitives: source.primitives
    };
  }

  const payload = {
    schemaVersion: manifest.schemaVersion,
    assetVersionTag: manifest.assetVersionTag,
    assets
  };

  const outPath = path.join(projectRoot, "src", "js", "content", "asset-3d-catalog.js");
  const body = [
    "(function () {",
    "    window.Asset3DCatalog = ",
    JSON.stringify(payload, null, 2).split("\n").map((line) => `    ${line}`).join("\n"),
    "    ;",
    "})();",
    ""
  ].join("\n");
  ensureDir(path.dirname(outPath));
  fs.writeFileSync(outPath, body);
  return outPath;
}

function loadAssetSource(projectRoot, assetDef) {
  if (!assetDef.source || !["procedural_pickaxe", "ai_image_to_3d_glb"].includes(assetDef.source.kind)) {
    throw new Error(`unsupported source kind for ${assetDef.id}`);
  }
  const sourcePath = path.join(projectRoot, assetDef.source.path);
  const source = readJson(sourcePath);
  if (source.kind !== assetDef.source.kind) {
    throw new Error(`source kind mismatch for ${assetDef.id}: manifest=${assetDef.source.kind}, source=${source.kind}`);
  }
  return source;
}

function buildAsset(projectRoot, assetDef, source) {
  const glbPath = path.join(projectRoot, assetDef.runtime.path);
  let iconSourceGlbPath = null;
  ensureDir(path.dirname(glbPath));
  if (source.kind === "ai_image_to_3d_glb") {
    if (!source.runtimeGlb || typeof source.runtimeGlb !== "string") {
      throw new Error(`${source.id} ai_image_to_3d_glb source requires runtimeGlb`);
    }
    const sourceGlbPath = path.join(projectRoot, source.runtimeGlb);
    if (!fs.existsSync(sourceGlbPath)) {
      throw new Error(`${source.id} runtime source GLB missing: ${source.runtimeGlb}`);
    }
    fs.copyFileSync(sourceGlbPath, glbPath);
    iconSourceGlbPath = glbPath;
  } else {
    fs.writeFileSync(glbPath, buildGlb(source));
  }

  const iconPath = path.join(projectRoot, assetDef.inventoryIcon.path);
  const reviewPath = path.join(projectRoot, assetDef.inventoryIcon.reviewPath);
  const iconCamera = (assetDef.inventoryIcon && assetDef.inventoryIcon.camera) || "tool_3q";
  if (iconSourceGlbPath) {
    renderGlbIcon(iconSourceGlbPath, iconPath, reviewPath, iconCamera);
  } else {
    renderIcon(source, iconPath, reviewPath, iconCamera);
  }

  return { glbPath, iconPath, reviewPath };
}

function main() {
  const projectRoot = path.resolve(__dirname, "..", "..");
  const manifestPath = path.join(projectRoot, "content", "assets", "3d-assets.json");
  const manifest = readJson(manifestPath);
  const sourceByAssetId = {};
  const requestedAssetIndex = process.argv.indexOf("--asset");
  const requestedAsset = requestedAssetIndex >= 0 ? process.argv[requestedAssetIndex + 1] : null;
  const entries = Object.entries(manifest.assets || {})
    .filter(([assetId]) => !requestedAsset || requestedAsset === assetId);

  if (requestedAsset && entries.length === 0) {
    throw new Error(`unknown 3D asset '${requestedAsset}'`);
  }

  const built = [];
  for (const [assetId, assetDef] of entries) {
    const source = loadAssetSource(projectRoot, assetDef);
    sourceByAssetId[assetId] = source;
    const result = buildAsset(projectRoot, assetDef, source);
    built.push({ assetId, result });
  }

  const runtimeCatalogPath = buildRuntimeCatalog(projectRoot, manifest, sourceByAssetId);
  for (const item of built) {
    console.log(
      `Built 3D asset ${item.assetId}: ${path.relative(projectRoot, item.result.glbPath)}, ${path.relative(projectRoot, item.result.iconPath)}`
    );
  }
  console.log(`Synced 3D asset runtime catalog to ${path.relative(projectRoot, runtimeCatalogPath)}.`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  }
}
