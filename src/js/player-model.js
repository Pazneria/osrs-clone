const PLAYER_APPEARANCE_SLOT_ORDER = ['head', 'cape', 'neck', 'weapon', 'body', 'shield', 'legs', 'hands', 'feet', 'ring'];

const PLAYER_BODY_COLOR_FIND = [
    packJagexHsl(2, 3, 64),  // hair
    packJagexHsl(10, 4, 72), // torso
    packJagexHsl(18, 4, 56), // legs
    packJagexHsl(22, 4, 44), // feet
    packJagexHsl(4, 2, 88)   // skin
];

const PLAYER_BODY_COLOR_PALETTES = [
    [packJagexHsl(2, 3, 64), packJagexHsl(3, 4, 58), packJagexHsl(5, 5, 52), packJagexHsl(7, 6, 50)],
    [packJagexHsl(10, 4, 72), packJagexHsl(16, 5, 60), packJagexHsl(21, 5, 58), packJagexHsl(31, 6, 52)],
    [packJagexHsl(18, 4, 56), packJagexHsl(25, 5, 50), packJagexHsl(36, 5, 48), packJagexHsl(45, 6, 42)],
    [packJagexHsl(22, 4, 44), packJagexHsl(30, 5, 40), packJagexHsl(41, 5, 36), packJagexHsl(52, 6, 34)],
    [packJagexHsl(4, 2, 88), packJagexHsl(5, 2, 78), packJagexHsl(6, 3, 66), packJagexHsl(7, 3, 54)]
];

const PLAYER_DEFAULT_SLOT_KITS = {
    0: ['kit_head_male', null, null, null, 'kit_body_male', null, 'kit_legs_male', 'kit_hands_male', 'kit_feet_male', null],
    1: ['kit_head_female', null, null, null, 'kit_body_female', null, 'kit_legs_female', 'kit_hands_female', 'kit_feet_female', null]
};

const PLAYER_KIT_DEFS = {
    kit_head_male: { slot: 'head', fragments: [{ target: 'head', shape: 'box', size: [0.34, 0.34, 0.34], offset: [0, 0, 0], color: PLAYER_BODY_COLOR_FIND[4], bodyColorIndex: 4 }] },
    kit_head_female: { slot: 'head', fragments: [{ target: 'head', shape: 'box', size: [0.32, 0.33, 0.33], offset: [0, 0, 0], color: PLAYER_BODY_COLOR_FIND[4], bodyColorIndex: 4 }] },
    kit_body_male: { slot: 'body', fragments: [{ target: 'torso', shape: 'box', size: [0.54, 0.68, 0.30], offset: [0, 0, 0], color: PLAYER_BODY_COLOR_FIND[1], bodyColorIndex: 1 }, { target: 'leftArm', shape: 'box', size: [0.20, 0.36, 0.20], offset: [0, -0.18, -0.08], color: PLAYER_BODY_COLOR_FIND[1], bodyColorIndex: 1 }, { target: 'rightArm', shape: 'box', size: [0.20, 0.36, 0.20], offset: [0, -0.18, -0.08], color: PLAYER_BODY_COLOR_FIND[1], bodyColorIndex: 1 }, { target: 'leftLowerArm', shape: 'box', size: [0.16, 0.34, 0.16], offset: [0, -0.17, 0.0], color: PLAYER_BODY_COLOR_FIND[4], bodyColorIndex: 4 }, { target: 'rightLowerArm', shape: 'box', size: [0.16, 0.34, 0.16], offset: [0, -0.17, 0.0], color: PLAYER_BODY_COLOR_FIND[4], bodyColorIndex: 4 }] },
    kit_body_female: { slot: 'body', fragments: [{ target: 'torso', shape: 'box', size: [0.50, 0.66, 0.28], offset: [0, 0, 0], color: PLAYER_BODY_COLOR_FIND[1], bodyColorIndex: 1 }, { target: 'leftArm', shape: 'box', size: [0.18, 0.34, 0.18], offset: [0, -0.17, -0.08], color: PLAYER_BODY_COLOR_FIND[1], bodyColorIndex: 1 }, { target: 'rightArm', shape: 'box', size: [0.18, 0.34, 0.18], offset: [0, -0.17, -0.08], color: PLAYER_BODY_COLOR_FIND[1], bodyColorIndex: 1 }, { target: 'leftLowerArm', shape: 'box', size: [0.15, 0.32, 0.15], offset: [0, -0.16, 0.0], color: PLAYER_BODY_COLOR_FIND[4], bodyColorIndex: 4 }, { target: 'rightLowerArm', shape: 'box', size: [0.15, 0.32, 0.15], offset: [0, -0.16, 0.0], color: PLAYER_BODY_COLOR_FIND[4], bodyColorIndex: 4 }] },
    kit_legs_male: { slot: 'legs', fragments: [{ target: 'leftLeg', shape: 'box', size: [0.24, 0.36, 0.24], offset: [0, -0.18, 0], color: PLAYER_BODY_COLOR_FIND[2], bodyColorIndex: 2 }, { target: 'rightLeg', shape: 'box', size: [0.24, 0.36, 0.24], offset: [0, -0.18, 0], color: PLAYER_BODY_COLOR_FIND[2], bodyColorIndex: 2 }, { target: 'leftLowerLeg', shape: 'box', size: [0.22, 0.34, 0.22], offset: [0, -0.17, 0], color: PLAYER_BODY_COLOR_FIND[2], bodyColorIndex: 2 }, { target: 'rightLowerLeg', shape: 'box', size: [0.22, 0.34, 0.22], offset: [0, -0.17, 0], color: PLAYER_BODY_COLOR_FIND[2], bodyColorIndex: 2 }] },
    kit_legs_female: { slot: 'legs', fragments: [{ target: 'leftLeg', shape: 'box', size: [0.22, 0.34, 0.22], offset: [0, -0.17, 0], color: PLAYER_BODY_COLOR_FIND[2], bodyColorIndex: 2 }, { target: 'rightLeg', shape: 'box', size: [0.22, 0.34, 0.22], offset: [0, -0.17, 0], color: PLAYER_BODY_COLOR_FIND[2], bodyColorIndex: 2 }, { target: 'leftLowerLeg', shape: 'box', size: [0.20, 0.32, 0.20], offset: [0, -0.16, 0], color: PLAYER_BODY_COLOR_FIND[2], bodyColorIndex: 2 }, { target: 'rightLowerLeg', shape: 'box', size: [0.20, 0.32, 0.20], offset: [0, -0.16, 0], color: PLAYER_BODY_COLOR_FIND[2], bodyColorIndex: 2 }] },
    kit_hands_male: { slot: 'hands', fragments: [{ target: 'leftLowerArm', shape: 'box', size: [0.16, 0.16, 0.16], offset: [0, -0.30, 0.02], color: PLAYER_BODY_COLOR_FIND[4], bodyColorIndex: 4 }, { target: 'rightLowerArm', shape: 'box', size: [0.16, 0.16, 0.16], offset: [0, -0.30, 0.02], color: PLAYER_BODY_COLOR_FIND[4], bodyColorIndex: 4 }] },
    kit_hands_female: { slot: 'hands', fragments: [{ target: 'leftLowerArm', shape: 'box', size: [0.15, 0.15, 0.15], offset: [0, -0.30, 0.02], color: PLAYER_BODY_COLOR_FIND[4], bodyColorIndex: 4 }, { target: 'rightLowerArm', shape: 'box', size: [0.15, 0.15, 0.15], offset: [0, -0.30, 0.02], color: PLAYER_BODY_COLOR_FIND[4], bodyColorIndex: 4 }] },
    kit_feet_male: { slot: 'feet', fragments: [{ target: 'leftLowerLeg', shape: 'box', size: [0.25, 0.10, 0.32], offset: [0, -0.28, 0.03], color: PLAYER_BODY_COLOR_FIND[3], bodyColorIndex: 3 }, { target: 'rightLowerLeg', shape: 'box', size: [0.25, 0.10, 0.32], offset: [0, -0.28, 0.03], color: PLAYER_BODY_COLOR_FIND[3], bodyColorIndex: 3 }] },
    kit_feet_female: { slot: 'feet', fragments: [{ target: 'leftLowerLeg', shape: 'box', size: [0.24, 0.10, 0.30], offset: [0, -0.26, 0.03], color: PLAYER_BODY_COLOR_FIND[3], bodyColorIndex: 3 }, { target: 'rightLowerLeg', shape: 'box', size: [0.24, 0.10, 0.30], offset: [0, -0.26, 0.03], color: PLAYER_BODY_COLOR_FIND[3], bodyColorIndex: 3 }] }
};

const PICKAXE_BASE_FRAGMENTS = [
    { target: 'axe', shape: 'cylinder4', size: [0.030, 0.66, 0.030], rotation: [Math.PI / 2, 0, 0], offset: [0, -0.02, 0.24], isHandle: true, headAnchorAlong: -0.33, color: packJagexHsl(12, 4, 35) },
    { target: 'axe', shape: 'torusArcTaper', size: [0.67, 0.05, 1.02, 14, 42, 1.55], rotation: [Math.PI / 2, -Math.PI / 2, 1.0507963268], handleRelative: [0.0, 0.0, 0.0], color: packJagexHsl(0, 0, 80) }
];

const PLAYER_ITEM_DEFS = {
    iron_axe: {
        slot: 'weapon',
        maleModelIds: [1100, -1, -1],
        femaleModelIds: [1200, -1, -1],
        recolors: [],
        fragments: [
            { target: 'axe', shape: 'cylinder4', size: [0.028, 0.62, 0.028], rotation: [Math.PI / 2, 0, 0], offset: [0, -0.02, 0.24], color: packJagexHsl(12, 4, 38) },
            { target: 'axe', shape: 'box', size: [0.06, 0.28, 0.18], offset: [0, -0.16, 0.48], color: packJagexHsl(0, 0, 76) },
            { target: 'axe', shape: 'box', size: [0.04, 0.18, 0.10], offset: [0, -0.02, 0.47], color: packJagexHsl(0, 0, 86) }
        ]
    },
    pickaxe_base_reference: {
        slot: 'weapon',
        maleModelIds: [1135, -1, -1],
        femaleModelIds: [1235, -1, -1],
        recolors: [],
        fragments: PICKAXE_BASE_FRAGMENTS
    },
    iron_pickaxe: {
        slot: 'weapon',
        maleModelIds: [1135, -1, -1],
        femaleModelIds: [1235, -1, -1],
        recolors: [],
        fragments: PICKAXE_BASE_FRAGMENTS
    }
};
const PLAYER_MODEL_CACHE = new Map();
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

function createColorizedMesh(shape, size, packedColor) {
    const geometry = createGeometry(shape, size).toNonIndexed();
    const rgb = jagexHslToRgb(packedColor);
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

function createGeometry(shape, size) {
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
    head.position.y = 1.55;

    const torso = new THREE.Group();
    torso.name = 'pm-torso';
    torso.position.y = 1.05;

    const leftArm = new THREE.Group();
    leftArm.name = 'pm-leftArm';
    leftArm.position.set(PLAYER_SHOULDER_PIVOT.x, PLAYER_SHOULDER_PIVOT.y, PLAYER_SHOULDER_PIVOT.z);

    const leftLowerArm = new THREE.Group();
    leftLowerArm.name = 'pm-leftLowerArm';
    leftLowerArm.position.set(elbowX, elbowY, elbowZ);
    leftArm.add(leftLowerArm);

    const rightArm = new THREE.Group();
    rightArm.name = 'pm-rightArm';
    rightArm.position.set(-PLAYER_SHOULDER_PIVOT.x, PLAYER_SHOULDER_PIVOT.y, PLAYER_SHOULDER_PIVOT.z);

    const rightLowerArm = new THREE.Group();
    rightLowerArm.name = 'pm-rightLowerArm';
    rightLowerArm.position.set(-elbowX, elbowY, elbowZ);
    rightArm.add(rightLowerArm);

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

    root.add(head, torso, leftArm, rightArm, leftLeg, rightLeg);
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

function addFragmentsToRig(rigRoot, fragments, bodyColors, recolors) {
    const nodes = rigNodeMap(rigRoot);
    const handleFrames = new Map();
    fragments.forEach((fragment) => {
        if (fragment && fragment.isHandle) {
            handleFrames.set(fragment.target, buildHandleFrame(fragment));
        }
    });

    fragments.forEach((fragment) => {
        const targetNode = nodes[fragment.target];
        if (!targetNode) return;
        const finalPacked = applyPackedRecolors(fragment.color, fragment.bodyColorIndex, bodyColors, recolors);
        const mesh = createColorizedMesh(fragment.shape, fragment.size, finalPacked);

        const pos = resolveFragmentPosition(fragment, handleFrames.get(fragment.target));
        if (pos) mesh.position.copy(pos);
        if (Array.isArray(fragment.rotation)) mesh.rotation.set(fragment.rotation[0], fragment.rotation[1], fragment.rotation[2]);
        targetNode.add(mesh);
    });
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
        const modelIds = normalizedAppearance.gender === 1 ? item.femaleModelIds : item.maleModelIds;
        if (!Array.isArray(modelIds) || modelIds.every((id) => id === -1)) return [];
        return [{ fragments: item.fragments, recolors: item.recolors || [] }];
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
        axe: nodes.axe,
        elbowPivot,
        attackTrigger: 0
    };
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















































