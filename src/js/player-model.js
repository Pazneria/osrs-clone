const PLAYER_APPEARANCE_CATALOG = window.PlayerAppearanceCatalog || null;
if (!PLAYER_APPEARANCE_CATALOG) {
    throw new Error('PlayerAppearanceCatalog missing. Load src/js/content/player-appearance-catalog.js before player-model.js.');
}

const PLAYER_APPEARANCE_SLOT_ORDER = Array.isArray(PLAYER_APPEARANCE_CATALOG.slotOrder)
    ? PLAYER_APPEARANCE_CATALOG.slotOrder.slice()
    : [];
const PLAYER_BODY_COLOR_FIND = Array.isArray(PLAYER_APPEARANCE_CATALOG.bodyColorFind)
    ? PLAYER_APPEARANCE_CATALOG.bodyColorFind.slice()
    : [];
const PLAYER_BODY_COLOR_PALETTES = Array.isArray(PLAYER_APPEARANCE_CATALOG.bodyColorPalettes)
    ? PLAYER_APPEARANCE_CATALOG.bodyColorPalettes.map((palette) => Array.isArray(palette) ? palette.slice() : [])
    : [];
const PLAYER_DEFAULT_SLOT_KITS = PLAYER_APPEARANCE_CATALOG.defaultSlotKits || {};
const PLAYER_KIT_DEFS = PLAYER_APPEARANCE_CATALOG.kitDefs || {};
const PLAYER_ITEM_DEFS = PLAYER_APPEARANCE_CATALOG.itemDefs || {};

if (!PLAYER_APPEARANCE_SLOT_ORDER.length || !PLAYER_BODY_COLOR_FIND.length || !PLAYER_BODY_COLOR_PALETTES.length) {
    throw new Error('PlayerAppearanceCatalog is malformed: missing slot order or body color palettes.');
}
const PLAYER_MODEL_CACHE = new Map();
const NPC_HUMANOID_RIG_CACHE = new Map();
let PLAYER_SHARED_MATERIAL = null;
const PLAYER_ELBOW_CONTACT_OVERLAP = 0.006;
const PLAYER_ELBOW_DEPTH_BIAS = -0.02;
const PLAYER_ARM_FALLBACK_UPPER_FRAGMENT = { size: [0.20, 0.36, 0.20], offset: [0, -0.18, -0.08] };
const PLAYER_ARM_FALLBACK_LOWER_FRAGMENT = { size: [0.16, 0.34, 0.16], offset: [0, -0.17, 0.0] };

window.playerAppearanceState = {
    gender: 0,
    colors: [0, 0, 0, 0, 0],
    slots: []
};

function packJagexHsl(h, s, l) {
    return ((h & 63) << 10) | ((s & 7) << 7) | (l & 127);
}

function unpackJagexHsl(packed) {
    return {
        h: (packed >> 10) & 63,
        s: (packed >> 7) & 7,
        l: packed & 127
    };
}

function jagexHslToRgb(packed) {
    const hsl = unpackJagexHsl(packed);
    const h = hsl.h / 63;
    const s = hsl.s / 7;
    const l = hsl.l / 127;
    const rgb = hslToRgb(h, s, l);
    return { r: rgb[0] / 255, g: rgb[1] / 255, b: rgb[2] / 255 };
}

function hexColorToRgb(hex) {
    if (typeof hex !== 'string') return null;
    const normalized = hex.trim().replace(/^#/, '');
    if (normalized.length !== 6) return null;
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    if (![r, g, b].every((value) => Number.isFinite(value))) return null;
    return { r: r / 255, g: g / 255, b: b / 255 };
}

function resolveFragmentRgb(fragment, packedColor) {
    if (fragment && typeof fragment.rgbColor === 'string') {
        const rgb = hexColorToRgb(fragment.rgbColor);
        if (rgb) return rgb;
    }
    return jagexHslToRgb(packedColor);
}

function hslToRgb(h, s, l) {
    if (s === 0) {
        const v = Math.round(l * 255);
        return [v, v, v];
    }
    const hue2rgb = function hueToRgb(p, q, t) {
        let wrappedT = t;
        if (wrappedT < 0) wrappedT += 1;
        if (wrappedT > 1) wrappedT -= 1;
        if (wrappedT < 1 / 6) return p + (q - p) * 6 * wrappedT;
        if (wrappedT < 1 / 2) return q;
        if (wrappedT < 2 / 3) return p + (q - p) * (2 / 3 - wrappedT) * 6;
        return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = hue2rgb(p, q, h + 1 / 3);
    const g = hue2rgb(p, q, h);
    const b = hue2rgb(p, q, h - 1 / 3);
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function getPlayerMaterial() {
    if (!PLAYER_SHARED_MATERIAL) {
        PLAYER_SHARED_MATERIAL = new THREE.MeshLambertMaterial({
            vertexColors: true,
            flatShading: false
        });
    }
    return PLAYER_SHARED_MATERIAL;
}

function createColorizedMesh(shape, size, packedColor, fragment) {
    let geometry = createGeometry(shape, size, fragment);
    if (geometry.index) geometry = geometry.toNonIndexed();
    const rgb = resolveFragmentRgb(fragment, packedColor);
    const positions = geometry.getAttribute('position');
    const colors = new Float32Array(positions.count * 3);
    for (let i = 0; i < positions.count; i++) {
        colors[i * 3] = rgb.r;
        colors[i * 3 + 1] = rgb.g;
        colors[i * 3 + 2] = rgb.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    return new THREE.Mesh(geometry, getPlayerMaterial());
}

function createPixelSourceVisualMeshes(pixelSource, options = {}) {
    if (!pixelSource || typeof pixelSource !== 'object') return [];
    const rows = Array.isArray(pixelSource.pixels) ? pixelSource.pixels : [];
    const palette = pixelSource.palette && typeof pixelSource.palette === 'object' ? pixelSource.palette : null;
    if (!rows.length || !palette) return [];

    const width = Number.isFinite(pixelSource.width) ? pixelSource.width : (typeof rows[0] === 'string' ? rows[0].length : 0);
    const height = Number.isFinite(pixelSource.height) ? pixelSource.height : rows.length;
    const model = pixelSource.model && typeof pixelSource.model === 'object' ? pixelSource.model : {};
    const modelScale = Number.isFinite(model.scale) && model.scale > 0 ? model.scale : 0.05;
    const modelDepth = Number.isFinite(model.depth) && model.depth > 0 ? model.depth : 1;
    const scaleMultiplier = Number.isFinite(options.scaleMultiplier) && options.scaleMultiplier > 0 ? options.scaleMultiplier : 1;
    const depthMultiplier = Number.isFinite(options.depthMultiplier) && options.depthMultiplier > 0 ? options.depthMultiplier : 1;
    const pixelSize = Number.isFinite(options.pixelSize) && options.pixelSize > 0
        ? options.pixelSize
        : (modelScale * scaleMultiplier);
    const defaultDepth = pixelSize * modelDepth * depthMultiplier;
    const origin = Array.isArray(options.origin) ? options.origin.slice() : [width / 2, height / 2];
    const rotation = Array.isArray(options.rotation) ? options.rotation.slice() : [0, 0, 0];
    const offset = Array.isArray(options.offset) ? options.offset.slice() : [0, 0, 0];
    const flipY = options.flipY == null ? false : !!options.flipY;
    const depthBySymbol = options.depthBySymbol && typeof options.depthBySymbol === 'object'
        ? options.depthBySymbol
        : null;
    const localRotationAxis = Array.isArray(options.localRotationAxis) ? options.localRotationAxis.slice() : null;
    const localRotationAngle = Number.isFinite(options.localRotationAngle) ? options.localRotationAngle : 0;
    const meshes = [];
    const symbols = Object.keys(palette);

    for (let symbolIndex = 0; symbolIndex < symbols.length; symbolIndex++) {
        const symbol = symbols[symbolIndex];
        const colorHex = palette[symbol];
        if (symbol === '.' || colorHex === 'transparent') continue;
        const voxels = [];
        for (let y = 0; y < rows.length; y++) {
            const row = typeof rows[y] === 'string' ? rows[y] : '';
            for (let x = 0; x < row.length; x++) {
                if (row.charAt(x) === symbol) voxels.push([x, y]);
            }
        }
        if (!voxels.length) continue;
        const depth = depthBySymbol && Number.isFinite(depthBySymbol[symbol]) && depthBySymbol[symbol] > 0
            ? depthBySymbol[symbol]
            : defaultDepth;
        const fragment = {
            shape: 'pixelExtrude',
            size: [pixelSize, depth],
            origin,
            rotation,
            offset,
            flipY,
            localRotationAxis,
            localRotationAngle,
            voxels,
            rgbColor: colorHex
        };
        meshes.push(createColorizedMesh('pixelExtrude', [pixelSize, depth], packJagexHsl(0, 0, 64), fragment));
    }

    return meshes;
}

function createPixelExtrudeGeometry(fragment, size) {
    const voxelSize = Array.isArray(size) ? Number(size[0]) : NaN;
    const depth = Array.isArray(size) ? Number(size[1]) : NaN;
    const safeVoxelSize = Number.isFinite(voxelSize) && voxelSize > 0 ? voxelSize : 0.02;
    const safeDepth = Number.isFinite(depth) && depth > 0 ? depth : safeVoxelSize;
    const origin = Array.isArray(fragment && fragment.origin) ? fragment.origin : [0.5, 0.5];
    const originX = Number.isFinite(origin[0]) ? origin[0] : 0.5;
    const originY = Number.isFinite(origin[1]) ? origin[1] : 0.5;
    const flipY = !!(fragment && fragment.flipY);
    const voxelsIn = Array.isArray(fragment && fragment.voxels) ? fragment.voxels : [];
    const voxels = [];
    const localRotationAxis = Array.isArray(fragment && fragment.localRotationAxis) ? fragment.localRotationAxis : null;
    const localRotationAngle = Number(fragment && fragment.localRotationAngle);

    for (let i = 0; i < voxelsIn.length; i++) {
        const voxel = voxelsIn[i];
        if (!Array.isArray(voxel) || voxel.length < 2) continue;
        const x = Number(voxel[0]);
        const y = Number(voxel[1]);
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        voxels.push([x, y]);
    }

    if (!voxels.length) return new THREE.BoxGeometry(safeVoxelSize, safeVoxelSize, safeDepth);

    const template = new THREE.BoxGeometry(safeVoxelSize, safeVoxelSize, safeDepth).toNonIndexed();
    const templatePositions = template.getAttribute('position');
    const templateNormals = template.getAttribute('normal');
    const verticesPerVoxel = templatePositions.count;
    const positions = new Float32Array(verticesPerVoxel * 3 * voxels.length);
    const normals = new Float32Array(verticesPerVoxel * 3 * voxels.length);

    for (let voxelIndex = 0; voxelIndex < voxels.length; voxelIndex++) {
        const voxel = voxels[voxelIndex];
        const centerX = ((voxel[0] + 0.5) - originX) * safeVoxelSize;
        const centerY = flipY
            ? (((voxel[1] + 0.5) - originY) * safeVoxelSize)
            : ((originY - (voxel[1] + 0.5)) * safeVoxelSize);
        const baseOffset = voxelIndex * verticesPerVoxel * 3;
        for (let vertexIndex = 0; vertexIndex < verticesPerVoxel; vertexIndex++) {
            const outputIndex = baseOffset + (vertexIndex * 3);
            positions[outputIndex] = templatePositions.getX(vertexIndex) + centerX;
            positions[outputIndex + 1] = templatePositions.getY(vertexIndex) + centerY;
            positions[outputIndex + 2] = templatePositions.getZ(vertexIndex);
            normals[outputIndex] = templateNormals.getX(vertexIndex);
            normals[outputIndex + 1] = templateNormals.getY(vertexIndex);
            normals[outputIndex + 2] = templateNormals.getZ(vertexIndex);
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    if (localRotationAxis && Number.isFinite(localRotationAngle) && Math.abs(localRotationAngle) > 1e-6) {
        const axis = new THREE.Vector3(
            Number(localRotationAxis[0]) || 0,
            Number(localRotationAxis[1]) || 0,
            Number(localRotationAxis[2]) || 0
        );
        if (axis.lengthSq() > 1e-6) {
            axis.normalize();
            const rotation = new THREE.Quaternion().setFromAxisAngle(axis, localRotationAngle);
            const positionAttr = geometry.getAttribute('position');
            const normalAttr = geometry.getAttribute('normal');
            const temp = new THREE.Vector3();
            for (let i = 0; i < positionAttr.count; i++) {
                temp.set(positionAttr.getX(i), positionAttr.getY(i), positionAttr.getZ(i));
                temp.applyQuaternion(rotation);
                positionAttr.setXYZ(i, temp.x, temp.y, temp.z);
                temp.set(normalAttr.getX(i), normalAttr.getY(i), normalAttr.getZ(i));
                temp.applyQuaternion(rotation);
                normalAttr.setXYZ(i, temp.x, temp.y, temp.z);
            }
            positionAttr.needsUpdate = true;
            normalAttr.needsUpdate = true;
        }
    }
    return geometry;
}

function createGeometry(shape, size, fragment) {
    if (shape === 'box') return new THREE.BoxGeometry(size[0], size[1], size[2]);
    if (shape === 'cylinder4') return new THREE.CylinderGeometry(size[0], size[2], size[1], 4, 1);
    if (shape === 'cylinder') return new THREE.CylinderGeometry(size[0], size[2], size[1], 16, 1);
    if (shape === 'cone') return new THREE.ConeGeometry(size[0], size[1], size[2] || 16, 1);
    if (shape === 'sphere') return new THREE.SphereGeometry(size[0], 14, 10);
    if (shape === 'torusArc') return new THREE.TorusGeometry(size[0], size[1], 12, 28, size[2] || Math.PI);
    if (shape === 'torusArcTaper') {
        const radius = size[0];
        const tube = size[1];
        const arc = size[2] || Math.PI;
        const radialSeg = size[3] || 12;
        const tubularSeg = size[4] || 32;
        const taperPow = size[5] || 1.4;
        const g = new THREE.TorusGeometry(radius, tube, radialSeg, tubularSeg, arc);
        const pos = g.getAttribute('position');
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const z = pos.getZ(i);
            let u = Math.atan2(y, x);
            if (u < 0) u += Math.PI * 2;
            let t = arc > 1e-5 ? (u / arc) : 0.5;
            t = Math.max(0, Math.min(1, t));
            const taper = Math.pow(Math.sin(Math.PI * t), taperPow);
            const cx = radius * Math.cos(u);
            const cy = radius * Math.sin(u);
            const dx = x - cx;
            const dy = y - cy;
            const dz = z;
            pos.setXYZ(i, cx + dx * taper, cy + dy * taper, dz * taper);
        }
        pos.needsUpdate = true;
        g.computeVertexNormals();
        return g;
    }
    if (shape === 'latheTaper') {
        const midRadius = size[0];
        const halfLen = size[1];
        const tipRadius = size[2] || 0.01;
        const tipInset = size[3] || (halfLen * 0.4);
        const segments = size[4] || 20;
        const profile = [
            new THREE.Vector2(0, -halfLen),
            new THREE.Vector2(tipRadius, -halfLen + tipInset),
            new THREE.Vector2(midRadius, 0),
            new THREE.Vector2(tipRadius, halfLen - tipInset),
            new THREE.Vector2(0, halfLen)
        ];
        return new THREE.LatheGeometry(profile, segments);
    }
    if (shape === 'pixelExtrude') return createPixelExtrudeGeometry(fragment, size);
    return new THREE.BoxGeometry(0.2, 0.2, 0.2);
}

function ensureSlotComposition(entry, index, gender) {
    if (entry && (entry.kind === 'kit' || entry.kind === 'item') && typeof entry.id === 'string') {
        return { kind: entry.kind, id: entry.id };
    }
    const defaults = PLAYER_DEFAULT_SLOT_KITS[gender] || PLAYER_DEFAULT_SLOT_KITS[0];
    const fallbackKit = defaults[index];
    if (fallbackKit) return { kind: 'kit', id: fallbackKit };
    return null;
}

function normalizeAppearance(appearance) {
    const gender = appearance && appearance.gender === 1 ? 1 : 0;
    const colorsIn = appearance && Array.isArray(appearance.colors) ? appearance.colors : [];
    const colors = [0, 0, 0, 0, 0];
    for (let i = 0; i < 5; i++) {
        const palette = PLAYER_BODY_COLOR_PALETTES[i];
        const raw = Number(colorsIn[i]);
        const safe = Number.isFinite(raw) ? Math.floor(raw) : 0;
        colors[i] = ((safe % palette.length) + palette.length) % palette.length;
    }
    const slotsIn = appearance && Array.isArray(appearance.slots) ? appearance.slots : [];
    const slots = [];
    for (let i = 0; i < PLAYER_APPEARANCE_SLOT_ORDER.length; i++) {
        slots.push(ensureSlotComposition(slotsIn[i], i, gender));
    }
    return { gender, colors, slots };
}

function applyPackedRecolors(baseColor, bodyColorIndex, bodyColors, recolors) {
    let color = baseColor;
    if (Number.isInteger(bodyColorIndex) && PLAYER_BODY_COLOR_FIND[bodyColorIndex] !== undefined) {
        const find = PLAYER_BODY_COLOR_FIND[bodyColorIndex];
        const palette = PLAYER_BODY_COLOR_PALETTES[bodyColorIndex];
        const replace = palette[bodyColors[bodyColorIndex] || 0];
        if (color === find) color = replace;
    }
    if (Array.isArray(recolors)) {
        recolors.forEach((pair) => {
            if (pair && color === pair.find) color = pair.replace;
        });
    }
    return color;
}

function getAppearanceCacheKey(appearance) {
    const normalized = normalizeAppearance(appearance);
    const slotKey = normalized.slots.map((slot) => {
        if (!slot) return 'n';
        return `${slot.kind}:${slot.id}`;
    }).join(',');
    return `g${normalized.gender}|c${normalized.colors.join('-')}|s${slotKey}`;
}

function createRigBones(armRigDefaults) {
    const root = new THREE.Group();
    root.rotation.order = 'YXZ';

    const elbowPivot = armRigDefaults && armRigDefaults.elbowPivot ? armRigDefaults.elbowPivot : { x: 0, y: -0.35, z: -0.1 };
    const elbowX = Number.isFinite(elbowPivot.x) ? elbowPivot.x : 0;
    const elbowY = Number.isFinite(elbowPivot.y) ? elbowPivot.y : -0.35;
    const elbowZ = Number.isFinite(elbowPivot.z) ? elbowPivot.z : -0.1;

    const head = new THREE.Group();
    head.name = 'pm-head';
    head.position.y = 0.5;

    const torso = new THREE.Group();
    torso.name = 'pm-torso';
    torso.position.y = 1.05;
    const shoulderLocalY = PLAYER_SHOULDER_PIVOT.y - torso.position.y;

    const leftArm = new THREE.Group();
    leftArm.name = 'pm-leftArm';
    leftArm.position.set(PLAYER_SHOULDER_PIVOT.x, shoulderLocalY, PLAYER_SHOULDER_PIVOT.z);

    const leftLowerArm = new THREE.Group();
    leftLowerArm.name = 'pm-leftLowerArm';
    leftLowerArm.position.set(elbowX, elbowY, elbowZ);
    leftArm.add(leftLowerArm);

    const rightArm = new THREE.Group();
    rightArm.name = 'pm-rightArm';
    rightArm.position.set(-PLAYER_SHOULDER_PIVOT.x, shoulderLocalY, PLAYER_SHOULDER_PIVOT.z);

    const rightLowerArm = new THREE.Group();
    rightLowerArm.name = 'pm-rightLowerArm';
    rightLowerArm.position.set(-elbowX, elbowY, elbowZ);
    rightArm.add(rightLowerArm);

    const leftTool = new THREE.Group();
    leftTool.name = 'pm-leftTool';
    leftTool.position.set(0, -0.35, 0);
    leftTool.visible = false;
    leftLowerArm.add(leftTool);

    const leftLeg = new THREE.Group();
    leftLeg.name = 'pm-leftLeg';
    leftLeg.position.set(0.14, 0.7, 0);
    const leftLowerLeg = new THREE.Group();
    leftLowerLeg.name = 'pm-leftLowerLeg';
    leftLowerLeg.position.set(0, -0.35, 0);
    leftLeg.add(leftLowerLeg);

    const rightLeg = new THREE.Group();
    rightLeg.name = 'pm-rightLeg';
    rightLeg.position.set(-0.14, 0.7, 0);
    const rightLowerLeg = new THREE.Group();
    rightLowerLeg.name = 'pm-rightLowerLeg';
    rightLowerLeg.position.set(0, -0.35, 0);
    rightLeg.add(rightLowerLeg);

    const axe = new THREE.Group();
    axe.name = 'pm-axe';
    axe.position.set(0, -0.35, 0);
    rightLowerArm.add(axe);

    torso.add(head, leftArm, rightArm);
    root.add(torso, leftLeg, rightLeg);
    return root;
}

function rigNodeMap(rigRoot) {
    return {
        head: rigRoot.getObjectByName('pm-head'),
        torso: rigRoot.getObjectByName('pm-torso'),
        leftArm: rigRoot.getObjectByName('pm-leftArm'),
        rightArm: rigRoot.getObjectByName('pm-rightArm'),
        leftLowerArm: rigRoot.getObjectByName('pm-leftLowerArm'),
        rightLowerArm: rigRoot.getObjectByName('pm-rightLowerArm'),
        leftLeg: rigRoot.getObjectByName('pm-leftLeg'),
        rightLeg: rigRoot.getObjectByName('pm-rightLeg'),
        leftLowerLeg: rigRoot.getObjectByName('pm-leftLowerLeg'),
        rightLowerLeg: rigRoot.getObjectByName('pm-rightLowerLeg'),
        leftTool: rigRoot.getObjectByName('pm-leftTool'),
        rightTool: rigRoot.getObjectByName('pm-axe'),
        axe: rigRoot.getObjectByName('pm-axe')
    };
}

function buildHandleFrame(fragment) {
    if (!fragment || !Array.isArray(fragment.offset)) return null;
    const center = new THREE.Vector3(fragment.offset[0], fragment.offset[1], fragment.offset[2]);
    const handleAxis = new THREE.Vector3(0, 1, 0);
    if (Array.isArray(fragment.rotation)) {
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(fragment.rotation[0], fragment.rotation[1], fragment.rotation[2]));
        handleAxis.applyQuaternion(q);
    }
    if (handleAxis.lengthSq() < 1e-6) return null;
    handleAxis.normalize();

    const length = Array.isArray(fragment.size) ? Number(fragment.size[1]) || 0 : 0;
    const anchorAlong = Number.isFinite(fragment.headAnchorAlong) ? fragment.headAnchorAlong : (length * 0.33);
    const anchor = center.clone().addScaledVector(handleAxis, anchorAlong);

    const outwardHint = new THREE.Vector3(-1, 0, 0);
    const outward = outwardHint.clone().addScaledVector(handleAxis, -outwardHint.dot(handleAxis));
    if (outward.lengthSq() < 1e-6) outward.set(0, 0, 1).addScaledVector(handleAxis, -handleAxis.z);
    outward.normalize();
    const side = new THREE.Vector3().crossVectors(handleAxis, outward).normalize();

    return { anchor, handleAxis, outward, side };
}

function resolveFragmentPosition(fragment, handleFrame) {
    if (Array.isArray(fragment.handleRelative) && handleFrame) {
        const along = Number(fragment.handleRelative[0]) || 0;
        const out = Number(fragment.handleRelative[1]) || 0;
        const side = Number(fragment.handleRelative[2]) || 0;
        return handleFrame.anchor.clone()
            .addScaledVector(handleFrame.handleAxis, along)
            .addScaledVector(handleFrame.outward, out)
            .addScaledVector(handleFrame.side, side);
    }
    if (Array.isArray(fragment.offset)) {
        return new THREE.Vector3(fragment.offset[0], fragment.offset[1], fragment.offset[2]);
    }
    return null;
}

function createMeshesForTarget(targetName, fragments, bodyColors, recolors) {
    if (!targetName || !Array.isArray(fragments)) return [];
    const targetFragments = [];
    const handleFrames = new Map();

    fragments.forEach((fragment) => {
        if (!fragment || fragment.target !== targetName) return;
        targetFragments.push(fragment);
        if (fragment.isHandle) handleFrames.set(fragment.target, buildHandleFrame(fragment));
    });

    const meshes = [];
    targetFragments.forEach((fragment) => {
        const finalPacked = applyPackedRecolors(fragment.color, fragment.bodyColorIndex, bodyColors, recolors);
        const mesh = createColorizedMesh(fragment.shape, fragment.size, finalPacked, fragment);
        const pos = resolveFragmentPosition(fragment, handleFrames.get(fragment.target));
        if (pos) mesh.position.copy(pos);
        if (Array.isArray(fragment.rotation)) mesh.rotation.set(fragment.rotation[0], fragment.rotation[1], fragment.rotation[2]);
        mesh.castShadow = true;
        meshes.push(mesh);
    });
    return meshes;
}

function addFragmentsToRig(rigRoot, fragments, bodyColors, recolors) {
    const nodes = rigNodeMap(rigRoot);
    const targetNames = Object.keys(nodes);
    for (let i = 0; i < targetNames.length; i++) {
        const targetName = targetNames[i];
        const targetNode = nodes[targetName];
        if (!targetNode) continue;
        const meshes = createMeshesForTarget(targetName, fragments, bodyColors, recolors);
        for (let meshIndex = 0; meshIndex < meshes.length; meshIndex++) targetNode.add(meshes[meshIndex]);
    }
}

function getItemAppearanceFragments(itemDef, gender) {
    if (!itemDef || typeof itemDef !== 'object') return [];
    const preferred = gender === 1 ? itemDef.femaleFragments : itemDef.maleFragments;
    if (Array.isArray(preferred) && preferred.length) return preferred;
    return Array.isArray(itemDef.fragments) ? itemDef.fragments : [];
}

function resolveSlotFragments(slotEntry, slotName, normalizedAppearance) {
    if (!slotEntry) return [];
    if (slotEntry.kind === 'kit') {
        const kit = PLAYER_KIT_DEFS[slotEntry.id];
        if (!kit || kit.slot !== slotName) return [];
        return [{ fragments: kit.fragments, recolors: kit.recolors || [] }];
    }
    if (slotEntry.kind === 'item') {
        const item = PLAYER_ITEM_DEFS[slotEntry.id];
        if (!item || item.slot !== slotName) return [];
        const fragments = getItemAppearanceFragments(item, normalizedAppearance.gender);
        if (!fragments.length) return [];
        return [{ fragments, recolors: item.recolors || [] }];
    }
    return [];
}

function fragmentAxisOr(fragment, key, axis, fallback) {
    if (!fragment || !Array.isArray(fragment[key])) return fallback;
    const value = Number(fragment[key][axis]);
    return Number.isFinite(value) ? value : fallback;
}

function primaryFragmentForTarget(fragments, target, fallback) {
    let best = null;
    let bestLength = -1;
    for (let i = 0; i < fragments.length; i++) {
        const fragment = fragments[i];
        if (!fragment || fragment.target !== target) continue;
        const len = fragmentAxisOr(fragment, 'size', 1, 0);
        if (len > bestLength) {
            best = fragment;
            bestLength = len;
        }
    }
    return best || fallback;
}

function collectAppearanceFragments(normalizedAppearance) {
    const fragments = [];
    for (let slotIndex = 0; slotIndex < PLAYER_APPEARANCE_SLOT_ORDER.length; slotIndex++) {
        const slotName = PLAYER_APPEARANCE_SLOT_ORDER[slotIndex];
        const slotEntry = normalizedAppearance.slots[slotIndex];
        const groups = resolveSlotFragments(slotEntry, slotName, normalizedAppearance);
        groups.forEach((group) => {
            if (!group || !Array.isArray(group.fragments)) return;
            group.fragments.forEach((fragment) => {
                if (fragment) fragments.push(fragment);
            });
        });
    }
    return fragments;
}

function computeArmRigDefaults(normalizedAppearance) {
    const fragments = collectAppearanceFragments(normalizedAppearance);
    const upper = primaryFragmentForTarget(fragments, 'leftArm', PLAYER_ARM_FALLBACK_UPPER_FRAGMENT);
    const lower = primaryFragmentForTarget(fragments, 'leftLowerArm', PLAYER_ARM_FALLBACK_LOWER_FRAGMENT);

    const upperLen = Math.max(0.01, fragmentAxisOr(upper, 'size', 1, PLAYER_ARM_FALLBACK_UPPER_FRAGMENT.size[1]));
    const upperOffsetY = fragmentAxisOr(upper, 'offset', 1, PLAYER_ARM_FALLBACK_UPPER_FRAGMENT.offset[1]);
    const upperOffsetZ = fragmentAxisOr(upper, 'offset', 2, PLAYER_ARM_FALLBACK_UPPER_FRAGMENT.offset[2]);

    const lowerLen = Math.max(0.01, fragmentAxisOr(lower, 'size', 1, PLAYER_ARM_FALLBACK_LOWER_FRAGMENT.size[1]));
    const lowerOffsetY = fragmentAxisOr(lower, 'offset', 1, PLAYER_ARM_FALLBACK_LOWER_FRAGMENT.offset[1]);
    const lowerOffsetZ = fragmentAxisOr(lower, 'offset', 2, PLAYER_ARM_FALLBACK_LOWER_FRAGMENT.offset[2]);

    const lowerTopY = lowerOffsetY + (lowerLen * 0.5);
    const elbowY = (upperOffsetY - (upperLen * 0.5)) + PLAYER_ELBOW_CONTACT_OVERLAP - lowerTopY;
    const elbowZ = upperOffsetZ + PLAYER_ELBOW_DEPTH_BIAS - lowerOffsetZ;

    return {
        elbowPivot: {
            x: 0,
            y: elbowY,
            z: elbowZ
        }
    };
}

function buildPlayerRigTemplate(normalizedAppearance) {
    const armRigDefaults = computeArmRigDefaults(normalizedAppearance);
    const rigRoot = createRigBones(armRigDefaults);
    for (let slotIndex = 0; slotIndex < PLAYER_APPEARANCE_SLOT_ORDER.length; slotIndex++) {
        const slotName = PLAYER_APPEARANCE_SLOT_ORDER[slotIndex];
        const slotEntry = normalizedAppearance.slots[slotIndex];
        const groups = resolveSlotFragments(slotEntry, slotName, normalizedAppearance);
        groups.forEach((group) => addFragmentsToRig(rigRoot, group.fragments, normalizedAppearance.colors, group.recolors));
    }
    const nodes = rigNodeMap(rigRoot);
    const equippedWeaponSlot = normalizedAppearance.slots[3] && normalizedAppearance.slots[3].kind === 'item' ? normalizedAppearance.slots[3].id : null;
    nodes.axe.visible = !!equippedWeaponSlot;
    if (nodes.leftTool) nodes.leftTool.visible = hasBaseToolVisual(nodes.leftTool);
    rigRoot.userData.armRigDefaults = armRigDefaults;
    rigRoot.userData.baseY = 0;
    return rigRoot;
}

function bindRigUserData(rigRoot) {
    const nodes = rigNodeMap(rigRoot);
    const armRigDefaults = rigRoot.userData && rigRoot.userData.armRigDefaults ? rigRoot.userData.armRigDefaults : {};
    const elbowDefaults = armRigDefaults && armRigDefaults.elbowPivot ? armRigDefaults.elbowPivot : {};
    const elbowPivot = {
        x: Number.isFinite(elbowDefaults.x) ? elbowDefaults.x : 0,
        y: Number.isFinite(elbowDefaults.y) ? elbowDefaults.y : -0.35,
        z: Number.isFinite(elbowDefaults.z) ? elbowDefaults.z : -0.1
    };
    rigRoot.userData.rig = {
        head: nodes.head,
        torso: nodes.torso,
        leftArm: nodes.leftArm,
        rightArm: nodes.rightArm,
        leftLowerArm: nodes.leftLowerArm,
        rightLowerArm: nodes.rightLowerArm,
        leftLeg: nodes.leftLeg,
        rightLeg: nodes.rightLeg,
        leftLowerLeg: nodes.leftLowerLeg,
        rightLowerLeg: nodes.rightLowerLeg,
        leftTool: nodes.leftTool,
        rightTool: nodes.rightTool || nodes.axe,
        axe: nodes.axe,
        elbowPivot,
        attackTick: -1,
        attackAnimationStartedAt: -1,
        hitReactionTick: -1,
        hitReactionStartedAt: -1
    };
    rigRoot.userData.animationRigId = 'player_humanoid_v1';
    rigRoot.userData.animationHeldItemSlot = 'rightHand';
    rigRoot.userData.animationHeldItems = { rightHand: null, leftHand: null };
    rigRoot.traverse((child) => {
        if (child.isMesh) child.castShadow = true;
    });
    return rigRoot;
}

function createPlayerRigFromAppearance(appearance) {
    const normalized = normalizeAppearance(appearance);
    const cacheKey = getAppearanceCacheKey(normalized);
    let template = PLAYER_MODEL_CACHE.get(cacheKey);
    if (!template) {
        template = buildPlayerRigTemplate(normalized);
        PLAYER_MODEL_CACHE.set(cacheKey, template);
    }
    const clone = template.clone(true);
    clone.userData.appearanceKey = cacheKey;
    return bindRigUserData(clone);
}

function buildAppearanceFromEquipment() {
    const gender = playerAppearanceState.gender === 1 ? 1 : 0;
    const defaults = PLAYER_DEFAULT_SLOT_KITS[gender] || PLAYER_DEFAULT_SLOT_KITS[0];
    const slots = PLAYER_APPEARANCE_SLOT_ORDER.map((slotName, index) => {
        const equipped = equipment && equipment[slotName];
        if (equipped && PLAYER_ITEM_DEFS[equipped.id]) {
            return { kind: 'item', id: equipped.id };
        }
        const defaultKit = defaults[index];
        if (defaultKit) return { kind: 'kit', id: defaultKit };
        return null;
    });
    return {
        gender,
        colors: Array.isArray(playerAppearanceState.colors) ? playerAppearanceState.colors.slice(0, 5) : [0, 0, 0, 0, 0],
        slots
    };
}

function syncPlayerAppearanceFromEquipment() {
    const updated = normalizeAppearance(buildAppearanceFromEquipment());
    playerAppearanceState.gender = updated.gender;
    playerAppearanceState.colors = updated.colors.slice();
    playerAppearanceState.slots = updated.slots.slice();
    return playerAppearanceState;
}

function createPlayerRigFromCurrentAppearance() {
    const appearance = syncPlayerAppearanceFromEquipment();
    return createPlayerRigFromAppearance(appearance);
}

function createPlayerRigForAnimationStudio() {
    const appearance = syncPlayerAppearanceFromEquipment();
    const previewAppearance = {
        gender: appearance.gender,
        colors: Array.isArray(appearance.colors) ? appearance.colors.slice() : [0, 0, 0, 0, 0],
        slots: Array.isArray(appearance.slots) ? appearance.slots.slice() : []
    };
    const weaponSlotIndex = PLAYER_APPEARANCE_SLOT_ORDER.indexOf('weapon');
    if (weaponSlotIndex >= 0 && weaponSlotIndex < previewAppearance.slots.length) {
        previewAppearance.slots[weaponSlotIndex] = null;
    }
    return createPlayerRigFromAppearance(previewAppearance);
}

function createLiteralRgbFragment(target, shape, size, offset, rgbColor, extras) {
    const fragment = {
        target,
        shape,
        size: Array.isArray(size) ? size.slice() : [0.1, 0.1, 0.1],
        offset: Array.isArray(offset) ? offset.slice() : [0, 0, 0],
        color: packJagexHsl(0, 0, 64),
        rgbColor: typeof rgbColor === 'string' ? rgbColor : '#ffffff'
    };
    if (extras && typeof extras === 'object') Object.assign(fragment, extras);
    return fragment;
}

function createGoblinHumanoidFragments() {
    const skin = '#6fa74d';
    const skinDark = '#4f7c36';
    const tunic = '#7a4c2d';
    const tunicDark = '#53311b';
    const cloth = '#6f6044';
    const foot = '#3d3327';
    const eye = '#111111';
    return [
        createLiteralRgbFragment('head', 'box', [0.42, 0.4, 0.36], [0, 0.0, 0.0], skin),
        createLiteralRgbFragment('head', 'box', [0.34, 0.08, 0.1], [0, 0.1, 0.13], skinDark),
        createLiteralRgbFragment('head', 'box', [0.14, 0.1, 0.17], [0, -0.02, 0.19], skinDark),
        createLiteralRgbFragment('head', 'box', [0.08, 0.24, 0.08], [0.24, 0.06, -0.02], skin, {
            rotation: [0, 0, -0.46]
        }),
        createLiteralRgbFragment('head', 'box', [0.08, 0.24, 0.08], [-0.24, 0.06, -0.02], skin, {
            rotation: [0, 0, 0.46]
        }),
        createLiteralRgbFragment('head', 'box', [0.045, 0.045, 0.03], [0.09, 0.03, 0.19], eye),
        createLiteralRgbFragment('head', 'box', [0.045, 0.045, 0.03], [-0.09, 0.03, 0.19], eye),
        createLiteralRgbFragment('torso', 'box', [0.56, 0.5, 0.34], [0, 0, 0], tunic),
        createLiteralRgbFragment('torso', 'box', [0.42, 0.24, 0.12], [0, -0.02, 0.11], tunicDark),
        createLiteralRgbFragment('torso', 'box', [0.3, 0.14, 0.08], [0, -0.18, 0.12], cloth),
        createLiteralRgbFragment('leftArm', 'box', [0.2, 0.28, 0.2], [0, -0.14, -0.02], tunic),
        createLiteralRgbFragment('rightArm', 'box', [0.2, 0.28, 0.2], [0, -0.14, -0.02], tunic),
        createLiteralRgbFragment('leftLowerArm', 'box', [0.17, 0.28, 0.17], [0, -0.14, 0], skin),
        createLiteralRgbFragment('rightLowerArm', 'box', [0.17, 0.28, 0.17], [0, -0.14, 0], skin),
        createLiteralRgbFragment('leftLeg', 'box', [0.2, 0.32, 0.22], [0, -0.16, 0], cloth),
        createLiteralRgbFragment('rightLeg', 'box', [0.2, 0.32, 0.22], [0, -0.16, 0], cloth),
        createLiteralRgbFragment('leftLowerLeg', 'box', [0.18, 0.28, 0.18], [0, -0.14, 0], skinDark),
        createLiteralRgbFragment('rightLowerLeg', 'box', [0.18, 0.28, 0.18], [0, -0.14, 0], skinDark),
        createLiteralRgbFragment('leftLowerLeg', 'box', [0.2, 0.1, 0.28], [0, -0.26, 0.05], foot),
        createLiteralRgbFragment('rightLowerLeg', 'box', [0.2, 0.1, 0.28], [0, -0.26, 0.05], foot)
    ];
}

function createGuardHumanoidFragments() {
    const steel = '#8e98a2';
    const steelDark = '#5e6871';
    const steelTrim = '#d0b05a';
    const tabard = '#274f86';
    const tabardDark = '#17365e';
    const cloth = '#6d5c3c';
    const leather = '#4b3f2e';
    const wood = '#6b4a2e';
    const boot = '#2f261c';
    return [
        createLiteralRgbFragment('head', 'box', [0.5, 0.4, 0.42], [0, 0.08, 0], steel),
        createLiteralRgbFragment('head', 'box', [0.38, 0.12, 0.2], [0, 0.05, 0.18], steelDark),
        createLiteralRgbFragment('head', 'box', [0.18, 0.08, 0.16], [0, 0.16, 0.2], steelTrim),
        createLiteralRgbFragment('head', 'box', [0.12, 0.16, 0.08], [0.18, 0.08, -0.02], steelTrim, {
            rotation: [0, 0, -0.28]
        }),
        createLiteralRgbFragment('head', 'box', [0.12, 0.16, 0.08], [-0.18, 0.08, -0.02], steelTrim, {
            rotation: [0, 0, 0.28]
        }),
        createLiteralRgbFragment('torso', 'box', [0.64, 0.5, 0.38], [0, 0.01, 0], steel),
        createLiteralRgbFragment('torso', 'box', [0.46, 0.36, 0.2], [0, 0, 0.08], tabard),
        createLiteralRgbFragment('torso', 'box', [0.34, 0.1, 0.12], [0, -0.18, 0.08], tabardDark),
        createLiteralRgbFragment('torso', 'box', [0.22, 0.08, 0.16], [0, -0.28, 0.08], leather),
        createLiteralRgbFragment('torso', 'box', [0.52, 0.1, 0.16], [0, 0.2, 0.05], steelTrim),
        createLiteralRgbFragment('leftArm', 'box', [0.26, 0.2, 0.26], [0.03, 0.08, 0.01], steel),
        createLiteralRgbFragment('rightArm', 'box', [0.26, 0.2, 0.26], [-0.03, 0.08, 0.01], steel),
        createLiteralRgbFragment('leftLowerArm', 'box', [0.2, 0.3, 0.18], [0, -0.08, 0], leather),
        createLiteralRgbFragment('rightLowerArm', 'box', [0.2, 0.3, 0.18], [0, -0.08, 0], leather),
        createLiteralRgbFragment('leftLowerArm', 'box', [0.46, 0.52, 0.08], [0.22, -0.01, 0.03], wood, {
            rotation: [0, 0, 0.14]
        }),
        createLiteralRgbFragment('leftLowerArm', 'box', [0.28, 0.34, 0.04], [0.2, 0, 0.08], steel, {
            rotation: [0, 0, 0.12]
        }),
        createLiteralRgbFragment('rightLowerArm', 'box', [0.08, 0.64, 0.08], [0.14, -0.02, 0], wood, {
            rotation: [0, 0, 0.24]
        }),
        createLiteralRgbFragment('rightLowerArm', 'box', [0.1, 0.16, 0.1], [0.15, -0.3, 0], steelTrim, {
            rotation: [0, 0, 0.24]
        }),
        createLiteralRgbFragment('leftLeg', 'box', [0.22, 0.34, 0.24], [0.01, -0.12, 0], cloth),
        createLiteralRgbFragment('rightLeg', 'box', [0.22, 0.34, 0.24], [-0.01, -0.12, 0], cloth),
        createLiteralRgbFragment('leftLowerLeg', 'box', [0.2, 0.26, 0.2], [0, -0.12, 0], steelDark),
        createLiteralRgbFragment('rightLowerLeg', 'box', [0.2, 0.26, 0.2], [0, -0.12, 0], steelDark),
        createLiteralRgbFragment('leftLowerLeg', 'box', [0.22, 0.1, 0.3], [0, -0.26, 0.05], boot),
        createLiteralRgbFragment('rightLowerLeg', 'box', [0.22, 0.1, 0.3], [0, -0.26, 0.05], boot)
    ];
}

function createTannerHumanoidFragments() {
    const skin = '#d6a37a';
    const skinDark = '#8e5f44';
    const hair = '#5a3926';
    const beard = '#4a2f20';
    const shirt = '#6f8b5e';
    const shirtDark = '#4d6341';
    const apron = '#9d6b3c';
    const apronDark = '#6f4726';
    const trousers = '#53483d';
    const boot = '#34281f';
    const glove = '#7b5632';
    return [
        createLiteralRgbFragment('head', 'box', [0.46, 0.42, 0.38], [0, 0.01, 0], skin),
        createLiteralRgbFragment('head', 'box', [0.38, 0.12, 0.24], [0, 0.14, 0.05], hair),
        createLiteralRgbFragment('head', 'box', [0.14, 0.08, 0.18], [0, -0.1, 0.18], beard),
        createLiteralRgbFragment('head', 'box', [0.1, 0.06, 0.08], [0.15, 0.06, 0.16], skinDark),
        createLiteralRgbFragment('head', 'box', [0.1, 0.06, 0.08], [-0.15, 0.06, 0.16], skinDark),
        createLiteralRgbFragment('torso', 'box', [0.6, 0.48, 0.34], [0, 0, 0], shirt),
        createLiteralRgbFragment('torso', 'box', [0.46, 0.24, 0.18], [0, -0.02, 0.09], shirtDark),
        createLiteralRgbFragment('torso', 'box', [0.42, 0.42, 0.28], [0, -0.04, 0.04], apron),
        createLiteralRgbFragment('torso', 'box', [0.3, 0.14, 0.14], [0, 0.16, 0.08], apronDark),
        createLiteralRgbFragment('torso', 'box', [0.16, 0.08, 0.1], [0, -0.2, 0.12], glove),
        createLiteralRgbFragment('leftArm', 'box', [0.22, 0.3, 0.2], [0.02, -0.03, 0], shirt),
        createLiteralRgbFragment('rightArm', 'box', [0.22, 0.3, 0.2], [-0.02, -0.03, 0], shirt),
        createLiteralRgbFragment('leftLowerArm', 'box', [0.18, 0.28, 0.18], [0, -0.1, 0], skin),
        createLiteralRgbFragment('rightLowerArm', 'box', [0.18, 0.28, 0.18], [0, -0.1, 0], skin),
        createLiteralRgbFragment('leftLowerArm', 'box', [0.12, 0.18, 0.12], [0.01, -0.26, 0.02], glove),
        createLiteralRgbFragment('rightLowerArm', 'box', [0.12, 0.18, 0.12], [-0.01, -0.26, 0.02], glove),
        createLiteralRgbFragment('leftLeg', 'box', [0.22, 0.34, 0.24], [0.01, -0.1, 0], trousers),
        createLiteralRgbFragment('rightLeg', 'box', [0.22, 0.34, 0.24], [-0.01, -0.1, 0], trousers),
        createLiteralRgbFragment('leftLowerLeg', 'box', [0.18, 0.28, 0.18], [0, -0.12, 0], skinDark),
        createLiteralRgbFragment('rightLowerLeg', 'box', [0.18, 0.28, 0.18], [0, -0.12, 0], skinDark),
        createLiteralRgbFragment('leftLowerLeg', 'box', [0.22, 0.1, 0.3], [0, -0.26, 0.05], boot),
        createLiteralRgbFragment('rightLowerLeg', 'box', [0.22, 0.1, 0.3], [0, -0.26, 0.05], boot)
    ];
}

function applyTannerRigBasePose(rigRoot) {
    const nodes = rigNodeMap(rigRoot);
    if (!nodes.torso || !nodes.head || !nodes.leftArm || !nodes.rightArm || !nodes.leftLeg || !nodes.rightLeg) return;
    rigRoot.position.set(0, 0, 0);
    rigRoot.scale.set(0.99, 0.99, 0.99);
    nodes.torso.position.set(0, 1.01, 0);
    nodes.head.position.set(0, 0.5, 0);
    nodes.leftArm.position.set(0.36, 0.25, 0.02);
    nodes.rightArm.position.set(-0.36, 0.25, 0.02);
    if (nodes.leftLowerArm) nodes.leftLowerArm.position.set(0, -0.27, -0.02);
    if (nodes.rightLowerArm) nodes.rightLowerArm.position.set(0, -0.27, -0.02);
    nodes.leftLeg.position.set(0.16, 0.69, 0);
    nodes.rightLeg.position.set(-0.16, 0.69, 0);
    if (nodes.leftLowerLeg) nodes.leftLowerLeg.position.set(0, -0.31, 0);
    if (nodes.rightLowerLeg) nodes.rightLowerLeg.position.set(0, -0.31, 0);
}

function applyGoblinRigBasePose(rigRoot) {
    const nodes = rigNodeMap(rigRoot);
    if (!nodes.torso || !nodes.head || !nodes.leftArm || !nodes.rightArm || !nodes.leftLeg || !nodes.rightLeg) return;
    rigRoot.position.set(0, 0, 0);
    rigRoot.scale.set(0.94, 0.94, 0.94);
    nodes.torso.position.set(0, 0.98, 0);
    nodes.head.position.set(0, 0.42, 0.01);
    nodes.leftArm.position.set(0.34, 0.24, 0.06);
    nodes.rightArm.position.set(-0.34, 0.24, 0.06);
    if (nodes.leftLowerArm) nodes.leftLowerArm.position.set(0, -0.31, -0.06);
    if (nodes.rightLowerArm) nodes.rightLowerArm.position.set(0, -0.31, -0.06);
    nodes.leftLeg.position.set(0.13, 0.67, 0);
    nodes.rightLeg.position.set(-0.13, 0.67, 0);
    if (nodes.leftLowerLeg) nodes.leftLowerLeg.position.set(0, -0.31, 0);
    if (nodes.rightLowerLeg) nodes.rightLowerLeg.position.set(0, -0.31, 0);
}

function applyGuardRigBasePose(rigRoot) {
    const nodes = rigNodeMap(rigRoot);
    if (!nodes.torso || !nodes.head || !nodes.leftArm || !nodes.rightArm || !nodes.leftLeg || !nodes.rightLeg) return;
    rigRoot.position.set(0, 0, 0);
    rigRoot.scale.set(1.01, 1.01, 1.01);
    nodes.torso.position.set(0, 1.03, 0);
    nodes.head.position.set(0, 0.48, 0);
    nodes.leftArm.position.set(0.37, 0.28, 0.01);
    nodes.rightArm.position.set(-0.37, 0.28, 0.01);
    if (nodes.leftLowerArm) nodes.leftLowerArm.position.set(0, -0.28, -0.01);
    if (nodes.rightLowerArm) nodes.rightLowerArm.position.set(0, -0.28, -0.01);
    nodes.leftLeg.position.set(0.15, 0.69, 0);
    nodes.rightLeg.position.set(-0.15, 0.69, 0);
    if (nodes.leftLowerLeg) nodes.leftLowerLeg.position.set(0, -0.3, 0);
    if (nodes.rightLowerLeg) nodes.rightLowerLeg.position.set(0, -0.3, 0);
}

function buildNpcHumanoidRigTemplate(presetId) {
    const normalizedPresetId = typeof presetId === 'string' ? presetId.trim().toLowerCase() : '';
    if (normalizedPresetId !== 'goblin' && normalizedPresetId !== 'guard' && normalizedPresetId !== 'tanner_rusk' && normalizedPresetId !== 'tanner') return null;
    const rigRoot = createRigBones({
        elbowPivot: {
            x: 0,
            y: -0.31,
            z: -0.06
        }
    });
    if (normalizedPresetId === 'goblin') {
        applyGoblinRigBasePose(rigRoot);
        addFragmentsToRig(rigRoot, createGoblinHumanoidFragments(), [0, 0, 0, 0, 0], []);
    } else if (normalizedPresetId === 'guard') {
        applyGuardRigBasePose(rigRoot);
        addFragmentsToRig(rigRoot, createGuardHumanoidFragments(), [0, 0, 0, 0, 0], []);
    } else {
        applyTannerRigBasePose(rigRoot);
        addFragmentsToRig(rigRoot, createTannerHumanoidFragments(), [0, 0, 0, 0, 0], []);
    }
    const nodes = rigNodeMap(rigRoot);
    if (nodes.axe) nodes.axe.visible = false;
    if (nodes.leftTool) nodes.leftTool.visible = false;
    rigRoot.userData.baseY = 0;
    rigRoot.userData.npcPresetId = normalizedPresetId;
    return rigRoot;
}

function createNpcHumanoidRigFromPreset(presetId) {
    const normalizedPresetId = typeof presetId === 'string' ? presetId.trim().toLowerCase() : '';
    if (!normalizedPresetId) return null;
    let template = NPC_HUMANOID_RIG_CACHE.get(normalizedPresetId);
    if (!template) {
        template = buildNpcHumanoidRigTemplate(normalizedPresetId);
        if (!template) return null;
        NPC_HUMANOID_RIG_CACHE.set(normalizedPresetId, template);
    }
    const clone = template.clone(true);
    clone.userData.npcPresetId = normalizedPresetId;
    return bindRigUserData(clone);
}

function listAnimationStudioPreviewActors() {
    return [
        { actorId: 'player', label: 'Player' },
        { actorId: 'goblin', label: 'Goblin' },
        { actorId: 'guard', label: 'Guard' },
        { actorId: 'tanner_rusk', label: 'Tanner Rusk' }
    ];
}

function createAnimationStudioPreviewRig(actorId) {
    const normalizedActorId = typeof actorId === 'string' ? actorId.trim().toLowerCase() : '';
    if (normalizedActorId === 'goblin') return createNpcHumanoidRigFromPreset('goblin');
    if (normalizedActorId === 'guard') return createNpcHumanoidRigFromPreset('guard');
    if (normalizedActorId === 'tanner_rusk' || normalizedActorId === 'tanner') return createNpcHumanoidRigFromPreset('tanner_rusk');
    return createPlayerRigForAnimationStudio();
}

function rebuildRigInstance(oldRig, parentScene) {
    if (!oldRig || !parentScene) return null;
    const nextRig = createPlayerRigFromCurrentAppearance();
    nextRig.position.copy(oldRig.position);
    nextRig.rotation.copy(oldRig.rotation);
    nextRig.scale.copy(oldRig.scale);
    parentScene.add(nextRig);
    parentScene.remove(oldRig);
    return nextRig;
}

function rebuildPlayerRigsFromAppearance() {
    if (typeof playerRig !== 'undefined' && playerRig && typeof scene !== 'undefined' && scene) {
        const updatedRig = rebuildRigInstance(playerRig, scene);
        if (updatedRig) playerRig = updatedRig;
    }
    if (typeof uiPlayerRig !== 'undefined' && uiPlayerRig && typeof uiScene !== 'undefined' && uiScene) {
        const updatedUiRig = rebuildRigInstance(uiPlayerRig, uiScene);
        if (updatedUiRig) uiPlayerRig = updatedUiRig;
    }
}

window.syncPlayerAppearanceFromEquipment = syncPlayerAppearanceFromEquipment;
window.rebuildPlayerRigsFromAppearance = rebuildPlayerRigsFromAppearance;
window.createPlayerRigFromCurrentAppearance = createPlayerRigFromCurrentAppearance;
window.createPlayerRigForAnimationStudio = createPlayerRigForAnimationStudio;
window.createNpcHumanoidRigFromPreset = createNpcHumanoidRigFromPreset;
window.listAnimationStudioPreviewActors = listAnimationStudioPreviewActors;
window.createAnimationStudioPreviewRig = createAnimationStudioPreviewRig;
















































const SKILLING_TOOL_VISUAL_GROUP_NAME = 'pm-skillingToolVisual';
const RIGHT_HAND_HELD_ITEM_SLOT = 'rightHand';
const LEFT_HAND_HELD_ITEM_SLOT = 'leftHand';

function normalizeHeldItemSlot(slot) {
    return slot === LEFT_HAND_HELD_ITEM_SLOT ? LEFT_HAND_HELD_ITEM_SLOT : RIGHT_HAND_HELD_ITEM_SLOT;
}

function createEmptyHeldItemVisualMap() {
    return {
        rightHand: null,
        leftHand: null
    };
}

function normalizeHeldItemVisualId(itemId) {
    return (typeof itemId === 'string' && itemId) ? itemId : null;
}

function normalizeHeldItemVisualMap(heldItems) {
    const normalized = createEmptyHeldItemVisualMap();
    if (!heldItems || typeof heldItems !== 'object') return normalized;
    normalized.rightHand = normalizeHeldItemVisualId(heldItems.rightHand);
    normalized.leftHand = normalizeHeldItemVisualId(heldItems.leftHand);
    return normalized;
}

function areHeldItemVisualMapsEqual(left, right) {
    return (!!left ? left.rightHand : null) === (!!right ? right.rightHand : null)
        && (!!left ? left.leftHand : null) === (!!right ? right.leftHand : null);
}

function resolvePrimaryHeldItemVisualSlot(heldItems, preferredSlot = null) {
    const normalizedPreferredSlot = preferredSlot ? normalizeHeldItemSlot(preferredSlot) : null;
    if (normalizedPreferredSlot && heldItems[normalizedPreferredSlot]) return normalizedPreferredSlot;
    if (heldItems.rightHand) return RIGHT_HAND_HELD_ITEM_SLOT;
    if (heldItems.leftHand) return LEFT_HAND_HELD_ITEM_SLOT;
    return normalizedPreferredSlot || RIGHT_HAND_HELD_ITEM_SLOT;
}

function ensureSkillingToolVisualGroup(anchorNode) {
    if (!anchorNode) return null;
    let group = anchorNode.getObjectByName(SKILLING_TOOL_VISUAL_GROUP_NAME);
    if (group && group.parent === anchorNode) return group;
    group = new THREE.Group();
    group.name = SKILLING_TOOL_VISUAL_GROUP_NAME;
    anchorNode.add(group);
    return group;
}

function clearObjectChildren(node) {
    if (!node) return;
    while (node.children.length > 0) {
        node.remove(node.children[node.children.length - 1]);
    }
}

function setBaseToolVisualVisibility(axeNode, visible) {
    if (!axeNode) return;
    for (let i = 0; i < axeNode.children.length; i++) {
        const child = axeNode.children[i];
        if (!child || child.name === SKILLING_TOOL_VISUAL_GROUP_NAME) continue;
        child.visible = !!visible;
    }
}

function hasBaseToolVisual(axeNode) {
    if (!axeNode) return false;
    for (let i = 0; i < axeNode.children.length; i++) {
        const child = axeNode.children[i];
        if (!child || child.name === SKILLING_TOOL_VISUAL_GROUP_NAME) continue;
        return true;
    }
    return false;
}

function resolveRigToolAnchors(rigRoot) {
    const rig = rigRoot && rigRoot.userData ? rigRoot.userData.rig : null;
    if (!rig) return { right: null, left: null };
    return {
        right: rig.rightTool || rig.axe || null,
        left: rig.leftTool || null
    };
}

function resolveRigToolAnchorBySlot(anchors, slot) {
    return normalizeHeldItemSlot(slot) === LEFT_HAND_HELD_ITEM_SLOT
        ? anchors.left
        : anchors.right;
}

function setPlayerRigToolVisuals(rigRoot, heldItems, primaryHeldItemSlot = null) {
    if (!rigRoot || !rigRoot.userData || !rigRoot.userData.rig) return;
    const anchors = resolveRigToolAnchors(rigRoot);
    const rightAnchor = anchors.right;
    const leftAnchor = anchors.left;
    if (!rightAnchor && !leftAnchor) return;
    const desiredHeldItems = normalizeHeldItemVisualMap(heldItems);
    const desiredSlot = resolvePrimaryHeldItemVisualSlot(
        desiredHeldItems,
        primaryHeldItemSlot || rigRoot.userData.animationHeldItemSlot || null
    );
    const rightSkillingToolGroup = ensureSkillingToolVisualGroup(rightAnchor);
    const leftSkillingToolGroup = ensureSkillingToolVisualGroup(leftAnchor);
    const suppressBaseToolVisual = !!rigRoot.userData.suppressBaseToolVisual;
    const rightBaseToolVisible = hasBaseToolVisual(rightAnchor) && !suppressBaseToolVisual;
    const leftBaseToolVisible = hasBaseToolVisual(leftAnchor);

    if (areHeldItemVisualMapsEqual(rigRoot.userData.skillingToolVisuals, desiredHeldItems)
        && rigRoot.userData.skillingToolVisualSlot === desiredSlot
        && !!rigRoot.userData.appliedSuppressBaseToolVisual === suppressBaseToolVisual) return;

    clearObjectChildren(rightSkillingToolGroup);
    clearObjectChildren(leftSkillingToolGroup);
    rigRoot.userData.skillingToolVisuals = {
        rightHand: desiredHeldItems.rightHand,
        leftHand: desiredHeldItems.leftHand
    };
    rigRoot.userData.animationHeldItems = {
        rightHand: desiredHeldItems.rightHand,
        leftHand: desiredHeldItems.leftHand
    };
    rigRoot.userData.animationHeldItemSlot = desiredSlot;
    rigRoot.userData.skillingToolVisualId = desiredHeldItems[desiredSlot] || null;
    rigRoot.userData.skillingToolVisualSlot = desiredSlot;
    rigRoot.userData.appliedSuppressBaseToolVisual = suppressBaseToolVisual;
    if (rightSkillingToolGroup) rightSkillingToolGroup.visible = !!desiredHeldItems.rightHand;
    if (leftSkillingToolGroup) leftSkillingToolGroup.visible = !!desiredHeldItems.leftHand;
    setBaseToolVisualVisibility(rightAnchor, !desiredHeldItems.rightHand && !suppressBaseToolVisual);
    setBaseToolVisualVisibility(leftAnchor, !desiredHeldItems.leftHand);
    if (rightAnchor) rightAnchor.visible = !!desiredHeldItems.rightHand || rightBaseToolVisible;
    if (leftAnchor) leftAnchor.visible = !!desiredHeldItems.leftHand || leftBaseToolVisible;

    const populateAnchor = (itemId, skillingToolGroup) => {
        const desiredId = normalizeHeldItemVisualId(itemId);
        if (!desiredId || !skillingToolGroup) return;
        let toolMeshes = createEquipmentVisualMeshes(desiredId, 'axe');
        let fallbackId = null;
        if (/_pickaxe$/.test(desiredId)) fallbackId = 'pickaxe_base_reference';
        else if (/_axe$/.test(desiredId)) fallbackId = 'axe_base_reference';
        else if (/_sword$/.test(desiredId)) fallbackId = 'sword_base_reference';
        if (toolMeshes.length === 0 && fallbackId && desiredId !== fallbackId) {
            toolMeshes = createEquipmentVisualMeshes(fallbackId, 'axe');
        }
        for (let i = 0; i < toolMeshes.length; i++) skillingToolGroup.add(toolMeshes[i]);
    };

    populateAnchor(desiredHeldItems.rightHand, rightSkillingToolGroup);
    populateAnchor(desiredHeldItems.leftHand, leftSkillingToolGroup);
}

function setPlayerRigToolVisual(rigRoot, itemId, heldItemSlot = null) {
    const desiredId = normalizeHeldItemVisualId(itemId);
    if (!desiredId) {
        setPlayerRigToolVisuals(rigRoot, null, heldItemSlot);
        return;
    }
    const desiredSlot = normalizeHeldItemSlot(heldItemSlot);
    const desiredHeldItems = createEmptyHeldItemVisualMap();
    desiredHeldItems[desiredSlot] = desiredId;
    setPlayerRigToolVisuals(rigRoot, desiredHeldItems, desiredSlot);
}

function createEquipmentVisualMeshes(itemId, targetName = 'axe', bodyColorsOverride = null) {
    const itemDef = PLAYER_ITEM_DEFS[itemId] || null;
    const fragments = getItemAppearanceFragments(itemDef, playerAppearanceState && playerAppearanceState.gender === 1 ? 1 : 0);
    if (!itemDef || !fragments.length) return [];
    const bodyColors = Array.isArray(bodyColorsOverride)
        ? bodyColorsOverride
        : (Array.isArray(playerAppearanceState.colors) ? playerAppearanceState.colors : [0, 0, 0, 0, 0]);
    return createMeshesForTarget(targetName, fragments, bodyColors, itemDef.recolors || []);
}

window.setPlayerRigToolVisuals = setPlayerRigToolVisuals;
window.setPlayerRigToolVisual = setPlayerRigToolVisual;
window.createEquipmentVisualMeshes = createEquipmentVisualMeshes;
window.createPixelSourceVisualMeshes = createPixelSourceVisualMeshes;
