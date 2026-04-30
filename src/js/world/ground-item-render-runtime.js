(function () {
    const GROUND_ITEM_ICON_ASSET_VERSION = '20260317j';
    const GROUND_PIXEL_SOURCE_ASSET_VERSION = '20260317j';

    const FISH_GROUND_SPECIES_PROFILES = Object.freeze({
        shrimp: { scaleMultiplier: 0.34, depthMultiplier: 0.8, spriteY: 0.16, spriteScale: 0.38, pitch: -0.78 },
        trout: { scaleMultiplier: 0.35, depthMultiplier: 0.82, spriteY: 0.18, spriteScale: 0.42, pitch: -0.82 },
        salmon: { scaleMultiplier: 0.34, depthMultiplier: 0.84, spriteY: 0.19, spriteScale: 0.45, pitch: -0.84 },
        tuna: { scaleMultiplier: 0.33, depthMultiplier: 0.86, spriteY: 0.2, spriteScale: 0.47, pitch: -0.87 },
        swordfish: { scaleMultiplier: 0.31, depthMultiplier: 0.84, spriteY: 0.21, spriteScale: 0.5, pitch: -0.9 }
    });

    const ARMOR_GROUND_VISUAL_PROFILES = Object.freeze({
        boots: { scaleMultiplier: 0.32, depthMultiplier: 0.82, spriteY: 0.16, spriteScale: 0.38, pitch: -0.92, yOffset: 0.03, shadowRadius: 0.16 },
        helmet: { scaleMultiplier: 0.34, depthMultiplier: 0.88, spriteY: 0.18, spriteScale: 0.42, pitch: -0.52, yOffset: 0.05, shadowRadius: 0.16 },
        shield: { scaleMultiplier: 0.31, depthMultiplier: 0.92, spriteY: 0.2, spriteScale: 0.47, pitch: -0.18, yOffset: 0.055, shadowRadius: 0.18 },
        platelegs: { scaleMultiplier: 0.3, depthMultiplier: 0.88, spriteY: 0.2, spriteScale: 0.48, pitch: -0.72, yOffset: 0.045, shadowRadius: 0.18 },
        platebody: { scaleMultiplier: 0.29, depthMultiplier: 0.86, spriteY: 0.22, spriteScale: 0.5, pitch: -0.62, yOffset: 0.05, shadowRadius: 0.19 }
    });

    const groundItemSpriteTextureCache = {};
    const fishGroundPixelVisualCache = Object.create(null);
    const fishGroundPixelVisualPending = Object.create(null);
    const armorGroundPixelVisualCache = Object.create(null);
    const armorGroundPixelVisualPending = Object.create(null);

    function requireThree(three) {
        if (!three) throw new Error('World ground item render runtime requires THREE.');
        return three;
    }

    function getItemIconSpritePath(itemData, assetVersion = GROUND_ITEM_ICON_ASSET_VERSION) {
        if (!itemData || !itemData.icon || itemData.icon.kind !== 'pixel' || typeof itemData.icon.assetId !== 'string' || !itemData.icon.assetId) {
            return null;
        }
        return `./assets/pixel/${itemData.icon.assetId}.png?v=${assetVersion}`;
    }

    function getGroundItemSpriteTexture(three, path) {
        const THREE = requireThree(three);
        if (groundItemSpriteTextureCache[path]) return groundItemSpriteTextureCache[path];
        const texture = new THREE.TextureLoader().load(path);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.generateMipmaps = false;
        groundItemSpriteTextureCache[path] = texture;
        return texture;
    }

    function addGroundItemSprite(options) {
        const THREE = requireThree(options && options.THREE);
        const group = options && options.group;
        const path = options && options.path;
        const y = Number.isFinite(options && options.y) ? options.y : 0.2;
        const scale = Number.isFinite(options && options.scale) ? options.scale : 0.5;
        if (!group || !path) return null;
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: getGroundItemSpriteTexture(THREE, path),
            transparent: true,
            alphaTest: 0.15,
            depthWrite: false
        }));
        sprite.position.set(0, y, 0);
        sprite.scale.set(scale, scale, scale);
        group.add(sprite);
        return sprite;
    }

    function addAshesGroundVisual(options) {
        const THREE = requireThree(options && options.THREE);
        const group = options && options.group;
        const itemData = options && options.itemData;
        if (!group) return;
        const spritePath = getItemIconSpritePath(itemData);
        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(0.24, 0.28, 0.05, 12),
            new THREE.MeshLambertMaterial({ color: 0x5c5c5c })
        );
        base.position.set(0, -0.05, 0);

        const mound = new THREE.Mesh(
            new THREE.SphereGeometry(0.16, 14, 10),
            new THREE.MeshLambertMaterial({ color: 0x7a7a7a })
        );
        mound.scale.set(1.35, 0.55, 1.15);
        mound.position.set(0, -0.005, 0);

        const crest = new THREE.Mesh(
            new THREE.SphereGeometry(0.09, 12, 8),
            new THREE.MeshLambertMaterial({ color: 0xaaaaaa })
        );
        crest.scale.set(1.2, 0.4, 1.05);
        crest.position.set(0, 0.055, 0);

        group.add(base, mound, crest);

        if (spritePath) {
            addGroundItemSprite({ THREE, group, path: spritePath, y: 0.17, scale: 0.42 });
        }
    }

    function cloneGroundVisualMesh(mesh) {
        if (!mesh || typeof mesh.clone !== 'function') return null;
        const clone = mesh.clone();
        clone.geometry = mesh.geometry;
        clone.material = mesh.material;
        return clone;
    }

    function clearTaggedFallback(group, tag) {
        if (!group || !Array.isArray(group.children)) return;
        for (let i = group.children.length - 1; i >= 0; i--) {
            const child = group.children[i];
            if (!child || !child.userData || !child.userData[tag]) continue;
            group.remove(child);
        }
    }

    function applyTaggedPixelGroundVisual(group, meshes, fallbackTag, pixelTag) {
        if (!group || !Array.isArray(meshes) || !meshes.length) return;
        clearTaggedFallback(group, fallbackTag);
        for (let i = 0; i < meshes.length; i++) {
            const clone = cloneGroundVisualMesh(meshes[i]);
            if (!clone) continue;
            clone.userData = Object.assign({}, clone.userData, { [pixelTag]: true });
            group.add(clone);
        }
    }

    function buildFishPixelGroundVisualMeshes(pixelSource, visual, createPixelSourceVisualMeshes) {
        if (!pixelSource || typeof createPixelSourceVisualMeshes !== 'function') return [];
        const assetScale = Number.isFinite(pixelSource && pixelSource.model && pixelSource.model.scale)
            ? pixelSource.model.scale
            : 0.05;
        const meshes = createPixelSourceVisualMeshes(pixelSource, {
            scaleMultiplier: visual.scaleMultiplier,
            depthMultiplier: visual.depthMultiplier,
            rotation: [visual.pitch, 0, 0],
            offset: [0, 0.045, 0],
            origin: [pixelSource.width / 2, pixelSource.height / 2],
            depthBySymbol: {
                e: assetScale * visual.scaleMultiplier * 0.7
            }
        });
        for (let i = 0; i < meshes.length; i++) {
            meshes[i].userData = Object.assign({}, meshes[i].userData, { groundFishPixelVisual: true });
        }
        return meshes;
    }

    function buildArmorPixelGroundVisualMeshes(pixelSource, visual, createPixelSourceVisualMeshes) {
        if (!pixelSource || typeof createPixelSourceVisualMeshes !== 'function') return [];
        const meshes = createPixelSourceVisualMeshes(pixelSource, {
            scaleMultiplier: visual.scaleMultiplier,
            depthMultiplier: visual.depthMultiplier,
            rotation: [visual.pitch || 0, visual.yaw || 0, visual.roll || 0],
            offset: [0, Number.isFinite(visual.yOffset) ? visual.yOffset : 0.05, 0],
            origin: [pixelSource.width / 2, pixelSource.height / 2]
        });
        for (let i = 0; i < meshes.length; i++) {
            meshes[i].userData = Object.assign({}, meshes[i].userData, { groundArmorPixelVisual: true });
        }
        return meshes;
    }

    function queueFishGroundVisualMeshes(options) {
        const group = options && options.group;
        const visual = options && options.visual;
        const fetchImpl = options && options.fetchImpl;
        const createPixelSourceVisualMeshes = options && options.createPixelSourceVisualMeshes;
        const pixelSourceAssetVersion = (options && options.pixelSourceAssetVersion) || GROUND_PIXEL_SOURCE_ASSET_VERSION;
        const assetId = visual && typeof visual.assetId === 'string' ? visual.assetId : null;
        if (!assetId || !group || typeof fetchImpl !== 'function') return;
        if (Array.isArray(fishGroundPixelVisualCache[assetId])) {
            applyTaggedPixelGroundVisual(group, fishGroundPixelVisualCache[assetId], 'groundFishFallback', 'groundFishPixelVisual');
            return;
        }
        if (!fishGroundPixelVisualPending[assetId]) {
            fishGroundPixelVisualPending[assetId] = fetchImpl(`./assets/pixel-src/${assetId}.json?v=${pixelSourceAssetVersion}`)
                .then((response) => {
                    if (!response.ok) throw new Error(`failed to load ${assetId} pixel source`);
                    return response.json();
                })
                .then((pixelSource) => {
                    const meshes = buildFishPixelGroundVisualMeshes(pixelSource, visual, createPixelSourceVisualMeshes);
                    fishGroundPixelVisualCache[assetId] = meshes;
                    return meshes;
                })
                .catch((error) => {
                    console.warn('Failed to build fish ground visual from pixel source:', assetId, error);
                    fishGroundPixelVisualCache[assetId] = null;
                    return null;
                });
        }
        fishGroundPixelVisualPending[assetId].then((meshes) => {
            if (Array.isArray(meshes) && meshes.length) {
                applyTaggedPixelGroundVisual(group, meshes, 'groundFishFallback', 'groundFishPixelVisual');
            }
        });
    }

    function queueArmorGroundVisualMeshes(options) {
        const group = options && options.group;
        const visual = options && options.visual;
        const fetchImpl = options && options.fetchImpl;
        const createPixelSourceVisualMeshes = options && options.createPixelSourceVisualMeshes;
        const pixelSourceAssetVersion = (options && options.pixelSourceAssetVersion) || GROUND_PIXEL_SOURCE_ASSET_VERSION;
        const assetId = visual && typeof visual.assetId === 'string' ? visual.assetId : null;
        if (!assetId || !group || typeof fetchImpl !== 'function') return;
        if (Array.isArray(armorGroundPixelVisualCache[assetId])) {
            applyTaggedPixelGroundVisual(group, armorGroundPixelVisualCache[assetId], 'groundArmorFallback', 'groundArmorPixelVisual');
            return;
        }
        if (!armorGroundPixelVisualPending[assetId]) {
            armorGroundPixelVisualPending[assetId] = fetchImpl(`./assets/pixel-src/${assetId}.json?v=${pixelSourceAssetVersion}`)
                .then((response) => {
                    if (!response.ok) throw new Error(`failed to load ${assetId} pixel source`);
                    return response.json();
                })
                .then((pixelSource) => {
                    const meshes = buildArmorPixelGroundVisualMeshes(pixelSource, visual, createPixelSourceVisualMeshes);
                    armorGroundPixelVisualCache[assetId] = meshes;
                    return meshes;
                })
                .catch((error) => {
                    console.warn('Failed to build armor ground visual from pixel source:', assetId, error);
                    armorGroundPixelVisualCache[assetId] = null;
                    return null;
                });
        }
        armorGroundPixelVisualPending[assetId].then((meshes) => {
            if (Array.isArray(meshes) && meshes.length) {
                applyTaggedPixelGroundVisual(group, meshes, 'groundArmorFallback', 'groundArmorPixelVisual');
            }
        });
    }

    function resolveFishGroundVisual(itemData) {
        const itemId = itemData && typeof itemData.id === 'string' ? itemData.id : '';
        const match = /^(raw|cooked|burnt)_(shrimp|trout|salmon|tuna|swordfish)$/.exec(itemId);
        if (!match) return null;
        const species = match[2];
        const profile = FISH_GROUND_SPECIES_PROFILES[species] || null;
        const assetId = itemData && itemData.icon && itemData.icon.kind === 'pixel' && typeof itemData.icon.assetId === 'string'
            ? itemData.icon.assetId
            : itemId;
        if (!profile || !assetId) return null;
        return Object.assign({ state: match[1], species, assetId }, profile);
    }

    function resolveArmorGroundVisual(itemData) {
        const assetId = itemData && itemData.icon && itemData.icon.kind === 'pixel' && typeof itemData.icon.assetId === 'string'
            ? itemData.icon.assetId
            : (itemData && typeof itemData.id === 'string' ? itemData.id : '');
        const match = /_(boots|helmet|shield|platelegs|platebody)$/.exec(assetId);
        if (!match) return null;
        const profile = ARMOR_GROUND_VISUAL_PROFILES[match[1]] || null;
        if (!profile || !assetId) return null;
        const resolved = Object.assign({ assetId, category: match[1] }, profile);
        if (/^rune_/.test(assetId)) {
            resolved.scaleMultiplier *= 1.08;
            resolved.depthMultiplier *= 1.04;
            resolved.spriteScale += 0.03;
            resolved.spriteY += 0.01;
            resolved.yOffset += 0.005;
            resolved.shadowRadius += 0.015;
        }
        return resolved;
    }

    function addFishGroundVisual(options) {
        const THREE = requireThree(options && options.THREE);
        const group = options && options.group;
        const itemData = options && options.itemData;
        const visual = options && options.visual;
        if (!group || !itemData || !visual) return;
        const spritePath = getItemIconSpritePath(itemData);
        const shadow = new THREE.Mesh(
            new THREE.CircleGeometry(0.17, 18),
            new THREE.MeshLambertMaterial({ color: 0x2f2f2f, transparent: true, opacity: 0.28 })
        );
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.set(0, -0.045, 0);
        shadow.userData = { groundFishFallback: true };
        group.add(shadow);
        if (spritePath) {
            const sprite = addGroundItemSprite({ THREE, group, path: spritePath, y: visual.spriteY, scale: visual.spriteScale });
            if (sprite) sprite.userData = Object.assign({}, sprite.userData, { groundFishFallback: true });
        }
        queueFishGroundVisualMeshes(options);
    }

    function addArmorGroundVisual(options) {
        const THREE = requireThree(options && options.THREE);
        const group = options && options.group;
        const itemData = options && options.itemData;
        const visual = options && options.visual;
        if (!group || !itemData || !visual) return;
        const spritePath = getItemIconSpritePath(itemData);
        const shadowRadius = Number.isFinite(visual.shadowRadius) ? visual.shadowRadius : 0.17;
        const shadow = new THREE.Mesh(
            new THREE.CircleGeometry(shadowRadius, 18),
            new THREE.MeshLambertMaterial({ color: 0x2f2f2f, transparent: true, opacity: 0.24 })
        );
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.set(0, -0.045, 0);
        shadow.userData = { groundArmorFallback: true };
        group.add(shadow);
        if (spritePath) {
            const sprite = addGroundItemSprite({ THREE, group, path: spritePath, y: visual.spriteY, scale: visual.spriteScale });
            if (sprite) sprite.userData = Object.assign({}, sprite.userData, { groundArmorFallback: true });
        }
        queueArmorGroundVisualMeshes(options);
    }

    function addIronAxeVisual(THREE, group) {
        const handleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8);
        handleGeo.rotateX(Math.PI / 2);
        const handle = new THREE.Mesh(handleGeo, new THREE.MeshLambertMaterial({ color: 0x5c4033 }));
        const axeHead = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.25), new THREE.MeshLambertMaterial({ color: 0x999999 }));
        axeHead.position.set(0, -0.2, 0.3);
        group.add(handle, axeHead);
    }

    function addLogsVisual(THREE, group) {
        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.18, 0.06, 12),
            new THREE.MeshLambertMaterial({ color: 0x3d2a1c })
        );
        base.position.set(0, -0.05, 0);
        addGroundItemSprite({ THREE, group, path: './assets/pixel/logs.png?v=20260313a', y: 0.2, scale: 0.5 });
        group.add(base);
    }

    function addCoinsVisual(THREE, group) {
        const coinGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 8);
        const coinMat = new THREE.MeshLambertMaterial({ color: 0xffcc00 });
        const coinMesh = new THREE.Mesh(coinGeo, coinMat);
        coinMesh.position.set(0, 0, 0);
        group.add(coinMesh);
    }

    function addOreVisual(THREE, group, itemData) {
        const oreColor = itemData.id === 'copper_ore' ? 0xb56b3a : 0xcfd6dd;
        const oreMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 0), new THREE.MeshLambertMaterial({ color: 0x7c838c }));
        const vein1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.03), new THREE.MeshLambertMaterial({ color: oreColor }));
        const vein2 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.04, 0.03), new THREE.MeshLambertMaterial({ color: oreColor }));
        vein1.position.set(0.04, 0.03, 0.19);
        vein2.position.set(-0.05, -0.02, 0.18);
        group.add(oreMesh, vein1, vein2);
    }

    function addFallbackVisual(THREE, group) {
        const boxMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.3), new THREE.MeshLambertMaterial({ color: 0x888888 }));
        group.add(boxMesh);
    }

    function addEquipmentMeshes(group, meshes) {
        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            mesh.position.y += 0.06;
            group.add(mesh);
        }
    }

    function addGroundItemVisual(options) {
        const THREE = requireThree(options && options.THREE);
        const group = options && options.group;
        const itemData = options && options.itemData;
        if (!group || !itemData) return 'none';

        const createEquipmentVisualMeshes = options && options.createEquipmentVisualMeshes;
        const equipmentMeshes = itemData && typeof itemData.id === 'string' && typeof createEquipmentVisualMeshes === 'function'
            ? createEquipmentVisualMeshes(itemData.id, 'axe', [0, 0, 0, 0, 0])
            : [];
        const fishGroundVisual = resolveFishGroundVisual(itemData);
        const armorGroundVisual = resolveArmorGroundVisual(itemData);

        if (equipmentMeshes.length > 0) {
            addEquipmentMeshes(group, equipmentMeshes);
            return 'equipment';
        }
        if (fishGroundVisual) {
            addFishGroundVisual(Object.assign({}, options, { visual: fishGroundVisual }));
            return 'fish';
        }
        if (armorGroundVisual) {
            addArmorGroundVisual(Object.assign({}, options, { visual: armorGroundVisual }));
            return 'armor';
        }
        if (itemData.id === 'iron_axe') {
            addIronAxeVisual(THREE, group);
            return 'iron_axe';
        }
        if (itemData.id === 'logs') {
            addLogsVisual(THREE, group);
            return 'logs';
        }
        if (itemData.id === 'coins') {
            addCoinsVisual(THREE, group);
            return 'coins';
        }
        if (itemData.id === 'ashes') {
            addAshesGroundVisual({ THREE, group, itemData });
            return 'ashes';
        }
        if (itemData.id === 'copper_ore' || itemData.id === 'tin_ore') {
            addOreVisual(THREE, group, itemData);
            return 'ore';
        }

        addFallbackVisual(THREE, group);
        return 'fallback';
    }

    window.WorldGroundItemRenderRuntime = {
        addArmorGroundVisual,
        addAshesGroundVisual,
        addFishGroundVisual,
        addGroundItemSprite,
        addGroundItemVisual,
        buildArmorPixelGroundVisualMeshes,
        buildFishPixelGroundVisualMeshes,
        getGroundItemSpriteTexture,
        getItemIconSpritePath,
        queueArmorGroundVisualMeshes,
        queueFishGroundVisualMeshes,
        resolveArmorGroundVisual,
        resolveFishGroundVisual
    };
})();
