(function () {
    const assetLoadState = Object.create(null);
    const waitingGroupsByAssetId = Object.create(null);
    const fallbackMaterialCache = Object.create(null);

    function getThreeRef(options = {}) {
        return options.THREERef || (typeof THREE !== 'undefined' ? THREE : null);
    }

    function getCatalog() {
        return (typeof window !== 'undefined' && window.Asset3DCatalog) ? window.Asset3DCatalog : null;
    }

    function getAssetDef(assetId) {
        const catalog = getCatalog();
        return catalog && catalog.assets && typeof assetId === 'string' ? catalog.assets[assetId] : null;
    }

    function getVersionTag() {
        const catalog = getCatalog();
        return catalog && typeof catalog.assetVersionTag === 'string' ? catalog.assetVersionTag : 'dev';
    }

    function normalizeHex(hex) {
        const raw = String(hex || '').trim().replace(/^#/, '');
        return /^[0-9a-fA-F]{6}$/.test(raw) ? raw.toLowerCase() : 'ff00ff';
    }

    function getFallbackMaterial(THREERef, materialName, hex) {
        const key = `${materialName}:${normalizeHex(hex)}`;
        if (fallbackMaterialCache[key]) return fallbackMaterialCache[key];
        const isMetal = /bronze|iron|steel|mithril|adamant|rune/i.test(materialName || '');
        const material = new THREERef.MeshLambertMaterial({
            color: parseInt(normalizeHex(hex), 16),
            flatShading: true
        });
        material.userData = Object.assign({}, material.userData, { asset3dMetal: isMetal });
        fallbackMaterialCache[key] = material;
        return material;
    }

    function applyPrimitiveTransform(mesh, primitive) {
        if (!mesh || !primitive) return;
        const position = Array.isArray(primitive.position) ? primitive.position : [0, 0, 0];
        const rotation = Array.isArray(primitive.rotation) ? primitive.rotation : [0, 0, 0];
        mesh.position.set(position[0] || 0, position[1] || 0, position[2] || 0);
        mesh.rotation.set(rotation[0] || 0, rotation[1] || 0, rotation[2] || 0);
    }

    function createPrismGeometry(THREERef, primitive) {
        const points = Array.isArray(primitive.points) ? primitive.points : [];
        if (points.length < 3 || typeof THREERef.Shape !== 'function' || typeof THREERef.ExtrudeGeometry !== 'function') return null;
        const shape = new THREERef.Shape();
        shape.moveTo(Number(points[0][0]) || 0, Number(points[0][1]) || 0);
        for (let i = 1; i < points.length; i++) {
            shape.lineTo(Number(points[i][0]) || 0, Number(points[i][1]) || 0);
        }
        shape.closePath();
        const depth = Number(primitive.depth) || 0.06;
        const geometry = new THREERef.ExtrudeGeometry(shape, {
            depth,
            bevelEnabled: false
        });
        geometry.translate(0, 0, -depth / 2);
        return geometry;
    }

    function createCylinderGeometry(THREERef, primitive) {
        const radius = Number(primitive.radius) || 0.05;
        const radiusTop = Number.isFinite(primitive.radiusTop) ? primitive.radiusTop : radius;
        const radiusBottom = Number.isFinite(primitive.radiusBottom) ? primitive.radiusBottom : radiusTop;
        const height = Number(primitive.height) || 1;
        const radialSegments = Math.max(5, Math.min(32, Math.floor(primitive.radialSegments || 8)));
        return new THREERef.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, 1, false);
    }

    function createPrimitiveGeometry(THREERef, primitive) {
        if (!primitive) return null;
        if (primitive.shape === 'box' && Array.isArray(primitive.size)) {
            return new THREERef.BoxGeometry(primitive.size[0] || 0.01, primitive.size[1] || 0.01, primitive.size[2] || 0.01);
        }
        if (primitive.shape === 'prism') return createPrismGeometry(THREERef, primitive);
        if (primitive.shape === 'cylinder') return createCylinderGeometry(THREERef, primitive);
        return null;
    }

    function createFallbackGroup(THREERef, assetDef) {
        const group = new THREERef.Group();
        group.name = `asset3d-fallback-${assetDef.id}`;
        group.userData.asset3dSource = 'fallback';
        const primitives = Array.isArray(assetDef.fallbackPrimitives) ? assetDef.fallbackPrimitives : [];
        const materials = assetDef.materials || {};

        for (let i = 0; i < primitives.length; i++) {
            const primitive = primitives[i];
            const geometry = createPrimitiveGeometry(THREERef, primitive);
            if (!geometry) continue;
            const material = getFallbackMaterial(THREERef, primitive.material, materials[primitive.material]);
            const mesh = new THREERef.Mesh(geometry, material);
            mesh.name = primitive.name || `primitive-${i}`;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            applyPrimitiveTransform(mesh, primitive);
            group.add(mesh);
        }

        return group;
    }

    function clearChildren(group) {
        if (!group) return;
        while (group.children.length > 0) group.remove(group.children[group.children.length - 1]);
    }

    function markRenderable(node) {
        if (!node || typeof node.traverse !== 'function') return;
        node.traverse((child) => {
            if (!child || !child.isMesh) return;
            child.castShadow = true;
            child.receiveShadow = true;
        });
    }

    function cloneLoadedScene(assetId) {
        const state = assetLoadState[assetId];
        const scene = state && state.scene;
        if (!scene || typeof scene.clone !== 'function') return null;
        const clone = scene.clone(true);
        markRenderable(clone);
        return clone;
    }

    function applyPoseTransform(group, pose) {
        if (!group || !pose) return;
        const position = Array.isArray(pose.position) ? pose.position : [0, 0, 0];
        const rotation = Array.isArray(pose.rotation) ? pose.rotation : [0, 0, 0];
        const gripPoint = Array.isArray(pose.gripPoint) ? pose.gripPoint : null;
        const scale = Number.isFinite(pose.scale) ? pose.scale : 1;
        group.position.set(position[0] || 0, position[1] || 0, position[2] || 0);
        group.rotation.set(rotation[0] || 0, rotation[1] || 0, rotation[2] || 0);
        group.scale.setScalar(scale);
        if (gripPoint) {
            const gripOffset = group.position.clone()
                .set(gripPoint[0] || 0, gripPoint[1] || 0, gripPoint[2] || 0)
                .multiplyScalar(scale)
                .applyEuler(group.rotation);
            group.position.sub(gripOffset);
        }
    }

    function populateGroupFromLoaded(assetId, group) {
        const loaded = cloneLoadedScene(assetId);
        if (!loaded || !group) return false;
        clearChildren(group);
        loaded.name = `asset3d-glb-${assetId}`;
        group.add(loaded);
        group.userData.asset3dSource = 'glb';
        group.userData.asset3dLoaded = true;
        return true;
    }

    function rememberWaitingGroup(assetId, group) {
        if (!waitingGroupsByAssetId[assetId]) waitingGroupsByAssetId[assetId] = [];
        waitingGroupsByAssetId[assetId].push(group);
    }

    function resolveRuntimePath(assetDef) {
        if (!assetDef || !assetDef.runtime || typeof assetDef.runtime.path !== 'string') return null;
        return `./${assetDef.runtime.path}?v=${getVersionTag()}`;
    }

    function beginLoad(assetDef) {
        if (!assetDef || !assetDef.id) return;
        const assetId = assetDef.id;
        const existing = assetLoadState[assetId];
        if (existing && (existing.status === 'loading' || existing.status === 'loaded')) return;
        const loaderCtor = typeof window !== 'undefined' ? window.GLTFLoader : null;
        const runtimePath = resolveRuntimePath(assetDef);
        if (typeof loaderCtor !== 'function' || !runtimePath) {
            assetLoadState[assetId] = { status: 'unavailable' };
            return;
        }

        assetLoadState[assetId] = { status: 'loading' };
        const loader = new loaderCtor();
        loader.load(
            runtimePath,
            (gltf) => {
                const scene = gltf && gltf.scene ? gltf.scene : null;
                if (!scene) {
                    assetLoadState[assetId] = { status: 'error' };
                    return;
                }
                markRenderable(scene);
                assetLoadState[assetId] = { status: 'loaded', scene };
                const waitingGroups = waitingGroupsByAssetId[assetId] || [];
                for (let i = 0; i < waitingGroups.length; i++) populateGroupFromLoaded(assetId, waitingGroups[i]);
                waitingGroupsByAssetId[assetId] = [];
            },
            undefined,
            () => {
                assetLoadState[assetId] = { status: 'error' };
            }
        );
    }

    function createAssetVisualGroup(assetId, poseName, options = {}) {
        const THREERef = getThreeRef(options);
        const assetDef = getAssetDef(assetId);
        if (!THREERef || !assetDef) return null;

        beginLoad(assetDef);
        const group = new THREERef.Group();
        group.name = `asset3d-${poseName}-${assetId}`;
        group.userData.asset3dId = assetId;
        group.userData.asset3dPose = poseName;

        if (!populateGroupFromLoaded(assetId, group)) {
            group.add(createFallbackGroup(THREERef, assetDef));
            group.userData.asset3dLoaded = false;
            group.userData.asset3dSource = 'fallback';
            rememberWaitingGroup(assetId, group);
        }

        const pose = poseName === 'ground' ? assetDef.groundPose : assetDef.attachment;
        applyPoseTransform(group, pose);
        return group;
    }

    function createEquipmentVisualMeshes(assetId, targetName = 'axe', options = {}) {
        const assetDef = getAssetDef(assetId);
        if (!assetDef || (assetDef.attachment && assetDef.attachment.target !== targetName)) return [];
        const group = createAssetVisualGroup(assetId, 'equipped', options);
        return group ? [group] : [];
    }

    function createGroundItemVisualMeshes(assetId, options = {}) {
        const group = createAssetVisualGroup(assetId, 'ground', options);
        return group ? [group] : [];
    }

    function getLoadState(assetId) {
        return assetLoadState[assetId] || { status: 'idle' };
    }

    window.Asset3DRuntime = {
        createEquipmentVisualMeshes,
        createGroundItemVisualMeshes,
        getAssetDef,
        getLoadState
    };
})();
