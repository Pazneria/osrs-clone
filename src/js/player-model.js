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
const PLAYER_CREATOR_SLOT_ORDER = Array.isArray(PLAYER_APPEARANCE_CATALOG.creatorSlotOrder)
    ? PLAYER_APPEARANCE_CATALOG.creatorSlotOrder.slice()
    : [];
const PLAYER_CREATOR_SLOTS = PLAYER_APPEARANCE_CATALOG.creatorSlots || {};
const PLAYER_CREATOR_DEFAULTS = PLAYER_APPEARANCE_CATALOG.creatorDefaults || {};
const PLAYER_CREATOR_KIT_DEFS = PLAYER_APPEARANCE_CATALOG.creatorKitDefs || {};

if (!PLAYER_APPEARANCE_SLOT_ORDER.length || !PLAYER_BODY_COLOR_FIND.length || !PLAYER_BODY_COLOR_PALETTES.length) {
    throw new Error('PlayerAppearanceCatalog is malformed: missing slot order or body color palettes.');
}
const PLAYER_MODEL_CACHE = new Map();
const PLAYER_MODEL_VISUAL_MATERIAL_CACHE = {};
const PLAYER_ELBOW_CONTACT_OVERLAP = 0.006;
const PLAYER_ELBOW_DEPTH_BIAS = -0.02;
const PLAYER_ARM_FALLBACK_UPPER_FRAGMENT = { size: [0.20, 0.36, 0.20], offset: [0, -0.18, -0.08] };
const PLAYER_ARM_FALLBACK_LOWER_FRAGMENT = { size: [0.16, 0.34, 0.16], offset: [0, -0.17, 0.0] };

function resolveCreatorSlotOption(creatorSlot, optionId) {
    const slotDef = PLAYER_CREATOR_SLOTS[creatorSlot] || {};
    const options = Array.isArray(slotDef.options) ? slotDef.options : [];
    const requestedId = typeof optionId === 'string' ? optionId : '';
    const defaultId = typeof PLAYER_CREATOR_DEFAULTS[creatorSlot] === 'string' ? PLAYER_CREATOR_DEFAULTS[creatorSlot] : '';
    return options.find((option) => option && option.id === requestedId)
        || options.find((option) => option && option.id === defaultId)
        || options[0]
        || null;
}

function sanitizeCreatorSelections(selections) {
    const safeSelections = {};
    const input = selections && typeof selections === 'object' ? selections : {};
    for (let i = 0; i < PLAYER_CREATOR_SLOT_ORDER.length; i++) {
        const creatorSlot = PLAYER_CREATOR_SLOT_ORDER[i];
        const option = resolveCreatorSlotOption(creatorSlot, input[creatorSlot]);
        if (option && typeof option.id === 'string') safeSelections[creatorSlot] = option.id;
    }
    return safeSelections;
}

window.playerAppearanceState = {
    gender: 0,
    colors: [0, 2, 3, 1, 7],
    creatorSelections: sanitizeCreatorSelections(null),
    slots: []
};

function getPlayerModelVisualRuntime() {
    const runtime = window.PlayerModelVisualRuntime || null;
    if (!runtime) throw new Error('PlayerModelVisualRuntime missing. Load src/js/player-model-visual-runtime.js before player-model.js.');
    return runtime;
}

function buildPlayerModelVisualRuntimeOptions() {
    return {
        THREERef: THREE,
        materialCache: PLAYER_MODEL_VISUAL_MATERIAL_CACHE
    };
}

function packJagexHsl(h, s, l) {
    return getPlayerModelVisualRuntime().packJagexHsl(h, s, l);
}

function createColorizedMesh(shape, size, packedColor, fragment) {
    return getPlayerModelVisualRuntime().createColorizedMesh(buildPlayerModelVisualRuntimeOptions(), shape, size, packedColor, fragment);
}

function createPixelSourceVisualMeshes(pixelSource, options = {}) {
    return getPlayerModelVisualRuntime().createPixelSourceVisualMeshes(buildPlayerModelVisualRuntimeOptions(), pixelSource, options);
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
    const creatorSelections = sanitizeCreatorSelections(appearance && appearance.creatorSelections);
    return { gender, colors, creatorSelections, slots };
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
    const creatorKey = PLAYER_CREATOR_SLOT_ORDER.map((slotName) => `${slotName}:${normalized.creatorSelections[slotName] || ''}`).join(',');
    return `g${normalized.gender}|c${normalized.colors.join('-')}|cr${creatorKey}|s${slotKey}`;
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
    return mergeTargetMeshes(meshes);
}

function copyBufferAttribute(attribute, target, offset) {
    if (!attribute || !target || !attribute.array) return;
    target.set(attribute.array, offset);
}

function mergeTargetMeshBucket(meshes) {
    if (!Array.isArray(meshes) || meshes.length <= 1) return meshes || [];
    let vertexCount = 0;
    const geometries = [];
    for (let i = 0; i < meshes.length; i++) {
        const mesh = meshes[i];
        if (!mesh || !mesh.geometry || !mesh.geometry.attributes || !mesh.geometry.attributes.position) return meshes;
        const geometry = mesh.geometry.clone();
        mesh.updateMatrix();
        geometry.applyMatrix4(mesh.matrix);
        geometries.push(geometry);
        vertexCount += geometry.attributes.position.count;
    }
    if (vertexCount <= 0) return meshes;

    const positions = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);
    const colors = new Float32Array(vertexCount * 3);
    let vertexOffset = 0;
    for (let i = 0; i < geometries.length; i++) {
        const geometry = geometries[i];
        const attrOffset = vertexOffset * 3;
        copyBufferAttribute(geometry.attributes.position, positions, attrOffset);
        copyBufferAttribute(geometry.attributes.normal, normals, attrOffset);
        copyBufferAttribute(geometry.attributes.color, colors, attrOffset);
        vertexOffset += geometry.attributes.position.count;
        geometry.dispose();
    }

    const mergedGeometry = new THREE.BufferGeometry();
    mergedGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    mergedGeometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    mergedGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    mergedGeometry.computeBoundingBox();
    mergedGeometry.computeBoundingSphere();

    const mergedMesh = new THREE.Mesh(mergedGeometry, meshes[0].material);
    mergedMesh.castShadow = true;
    return [mergedMesh];
}

function mergeTargetMeshes(meshes) {
    if (!Array.isArray(meshes) || meshes.length <= 1) return meshes || [];
    const buckets = new Map();
    for (let i = 0; i < meshes.length; i++) {
        const mesh = meshes[i];
        const key = mesh && mesh.material && mesh.material.uuid ? mesh.material.uuid : `mesh-${i}`;
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(mesh);
    }
    const mergedMeshes = [];
    buckets.forEach((bucket) => {
        const merged = mergeTargetMeshBucket(bucket);
        for (let i = 0; i < merged.length; i++) mergedMeshes.push(merged[i]);
    });
    return mergedMeshes;
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

function getCreatorKitAppearanceFragments(kitDef, gender) {
    if (!kitDef || typeof kitDef !== 'object') return [];
    const preferred = gender === 1 ? kitDef.femaleFragments : kitDef.maleFragments;
    if (Array.isArray(preferred) && preferred.length) return preferred;
    return Array.isArray(kitDef.fragments) ? kitDef.fragments : [];
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

function isAppearanceSlotEquipped(normalizedAppearance, slotName) {
    const slotIndex = PLAYER_APPEARANCE_SLOT_ORDER.indexOf(slotName);
    const slotEntry = slotIndex >= 0 ? normalizedAppearance.slots[slotIndex] : null;
    return !!(slotEntry && slotEntry.kind === 'item');
}

function isCreatorSlotSuppressedByEquipment(normalizedAppearance, creatorSlot) {
    if (creatorSlot === 'hairStyle' || creatorSlot === 'faceStyle' || creatorSlot === 'facialHair') {
        return isAppearanceSlotEquipped(normalizedAppearance, 'head');
    }
    if (creatorSlot === 'bodyStyle') return isAppearanceSlotEquipped(normalizedAppearance, 'body');
    if (creatorSlot === 'legStyle') return isAppearanceSlotEquipped(normalizedAppearance, 'legs');
    if (creatorSlot === 'feetStyle') return isAppearanceSlotEquipped(normalizedAppearance, 'feet');
    return false;
}

function collectCreatorFragmentGroups(normalizedAppearance) {
    const groups = [];
    for (let i = 0; i < PLAYER_CREATOR_SLOT_ORDER.length; i++) {
        const creatorSlot = PLAYER_CREATOR_SLOT_ORDER[i];
        if (isCreatorSlotSuppressedByEquipment(normalizedAppearance, creatorSlot)) continue;
        const option = resolveCreatorSlotOption(creatorSlot, normalizedAppearance.creatorSelections[creatorSlot]);
        if (!option || typeof option.kitId !== 'string') continue;
        const kitDef = PLAYER_CREATOR_KIT_DEFS[option.kitId];
        if (!kitDef || kitDef.creatorSlot !== creatorSlot) continue;
        const fragments = getCreatorKitAppearanceFragments(kitDef, normalizedAppearance.gender);
        if (fragments.length) groups.push({ fragments, recolors: kitDef.recolors || [] });
    }
    return groups;
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
    collectCreatorFragmentGroups(normalizedAppearance).forEach((group) => {
        group.fragments.forEach((fragment) => {
            if (fragment) fragments.push(fragment);
        });
    });
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

function hasBaseToolVisual(node) {
    return !!(node && Array.isArray(node.children) && node.children.length > 0);
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
    collectCreatorFragmentGroups(normalizedAppearance).forEach((group) => {
        addFragmentsToRig(rigRoot, group.fragments, normalizedAppearance.colors, group.recolors);
    });
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
        attackStyleFamily: 'melee',
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

function getEquipmentEntryItemData(entry) {
    if (!entry || typeof entry !== 'object') return null;
    if (entry.itemData && typeof entry.itemData === 'object') return entry.itemData;
    return entry;
}

function buildAppearanceFromEquipment() {
    const gender = playerAppearanceState.gender === 1 ? 1 : 0;
    const defaults = PLAYER_DEFAULT_SLOT_KITS[gender] || PLAYER_DEFAULT_SLOT_KITS[0];
    const slots = PLAYER_APPEARANCE_SLOT_ORDER.map((slotName, index) => {
        const equipped = getEquipmentEntryItemData(equipment && equipment[slotName]);
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
        creatorSelections: sanitizeCreatorSelections(playerAppearanceState.creatorSelections),
        slots
    };
}

function syncPlayerAppearanceFromEquipment() {
    const updated = normalizeAppearance(buildAppearanceFromEquipment());
    playerAppearanceState.gender = updated.gender;
    playerAppearanceState.colors = updated.colors.slice();
    playerAppearanceState.creatorSelections = Object.assign({}, updated.creatorSelections);
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
        creatorSelections: sanitizeCreatorSelections(appearance.creatorSelections),
        slots: Array.isArray(appearance.slots) ? appearance.slots.slice() : []
    };
    const weaponSlotIndex = PLAYER_APPEARANCE_SLOT_ORDER.indexOf('weapon');
    if (weaponSlotIndex >= 0 && weaponSlotIndex < previewAppearance.slots.length) {
        previewAppearance.slots[weaponSlotIndex] = null;
    }
    return createPlayerRigFromAppearance(previewAppearance);
}

function getPlayerNpcHumanoidRuntime() {
    const runtime = window.PlayerNpcHumanoidRuntime || null;
    if (!runtime) throw new Error('PlayerNpcHumanoidRuntime missing. Load src/js/player-npc-humanoid-runtime.js before player-model.js.');
    return runtime;
}

function buildPlayerNpcHumanoidRuntimeOptions() {
    return {
        createRigBones,
        addFragmentsToRig,
        bindRigUserData,
        createPlayerRigForAnimationStudio,
        rigNodeMap,
        packJagexHsl
    };
}

function createNpcHumanoidRigFromPreset(presetId) {
    return getPlayerNpcHumanoidRuntime().createNpcHumanoidRigFromPreset(buildPlayerNpcHumanoidRuntimeOptions(), presetId);
}

function listAnimationStudioPreviewActors() {
    return getPlayerNpcHumanoidRuntime().listAnimationStudioPreviewActors();
}

function createAnimationStudioPreviewRig(actorId) {
    return getPlayerNpcHumanoidRuntime().createAnimationStudioPreviewRig(buildPlayerNpcHumanoidRuntimeOptions(), actorId);
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

window.rebuildPlayerRigsFromAppearance = rebuildPlayerRigsFromAppearance;
window.createPlayerRigFromAppearance = createPlayerRigFromAppearance;
window.createPlayerRigFromCurrentAppearance = createPlayerRigFromCurrentAppearance;
window.createPlayerRigForAnimationStudio = createPlayerRigForAnimationStudio;
const playerNpcHumanoidRuntimeForPublication = window.PlayerNpcHumanoidRuntime || null;
if (playerNpcHumanoidRuntimeForPublication && typeof playerNpcHumanoidRuntimeForPublication.publishNpcHumanoidHooks === 'function') {
    playerNpcHumanoidRuntimeForPublication.publishNpcHumanoidHooks({
        windowRef: window,
        createNpcHumanoidRigFromPreset,
        listAnimationStudioPreviewActors,
        createAnimationStudioPreviewRig
    });
}


function setPlayerRigToolVisuals(rigRoot, heldItems, primaryHeldItemSlot = null) {
    const runtime = window.PlayerHeldItemRuntime || null;
    if (!runtime || typeof runtime.setPlayerRigToolVisuals !== 'function') return;
    runtime.setPlayerRigToolVisuals({
        THREERef: THREE,
        createEquipmentVisualMeshes
    }, rigRoot, heldItems, primaryHeldItemSlot);
}

function setPlayerRigToolVisual(rigRoot, itemId, heldItemSlot = null) {
    const runtime = window.PlayerHeldItemRuntime || null;
    if (!runtime || typeof runtime.setPlayerRigToolVisual !== 'function') return;
    runtime.setPlayerRigToolVisual({
        THREERef: THREE,
        createEquipmentVisualMeshes
    }, rigRoot, itemId, heldItemSlot);
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

const playerHeldItemRuntimeForPublication = window.PlayerHeldItemRuntime || null;
if (playerHeldItemRuntimeForPublication && typeof playerHeldItemRuntimeForPublication.publishHeldItemVisualHooks === 'function') {
    playerHeldItemRuntimeForPublication.publishHeldItemVisualHooks({
        windowRef: window,
        setPlayerRigToolVisuals,
        setPlayerRigToolVisual
    });
}
const playerModelVisualRuntimeForPublication = window.PlayerModelVisualRuntime || null;
if (playerModelVisualRuntimeForPublication && typeof playerModelVisualRuntimeForPublication.publishPixelSourceVisualHooks === 'function') {
    playerModelVisualRuntimeForPublication.publishPixelSourceVisualHooks({
        windowRef: window,
        createPixelSourceVisualMeshes
    });
}
window.createEquipmentVisualMeshes = createEquipmentVisualMeshes;
