(function () {
    const ROCK_VISUAL_PROFILES = {
        clay: { geometryKey: 'rockClay', materialKey: 'rockClay', instanceScale: [1.16, 1.0, 0.96], silhouette: 'low_rounded_mound' },
        copper: { geometryKey: 'rockCopper', materialKey: 'rockCopper', instanceScale: [1.1, 1.0, 1.0], silhouette: 'chipped_copper_outcrop' },
        tin: { geometryKey: 'rockTin', materialKey: 'rockTin', instanceScale: [1.0, 1.08, 1.0], silhouette: 'broken_tin_shard_cluster' },
        iron: { geometryKey: 'rockIron', materialKey: 'rockIron', instanceScale: [1.05, 1.08, 0.88], silhouette: 'blocky_slab' },
        coal: { geometryKey: 'rockCoal', materialKey: 'rockCoal', instanceScale: [1.12, 0.92, 1.08], silhouette: 'jagged_black_shard' },
        silver: { geometryKey: 'rockSilver', materialKey: 'rockSilver', instanceScale: [0.94, 1.08, 1.04], silhouette: 'bright_octa_lump' },
        sapphire: { geometryKey: 'rockSapphire', materialKey: 'rockSapphire', instanceScale: [0.82, 1.2, 0.82], silhouette: 'blue_tall_crystal' },
        gold: { geometryKey: 'rockGold', materialKey: 'rockGold', instanceScale: [1.18, 0.98, 0.92], silhouette: 'wide_gold_nugget' },
        emerald: { geometryKey: 'rockEmerald', materialKey: 'rockEmerald', instanceScale: [0.72, 1.34, 0.72], silhouette: 'green_needle_crystal' },
        rune_essence: { geometryKey: 'rockRuneEssence', materialKey: 'rockRuneEssence', instanceScale: [1.0, 1.0, 1.0], silhouette: 'large_persistent_essence_boulder' },
        depleted: { geometryKey: 'rockDepleted', materialKey: 'rockDepleted', instanceScale: [1.08, 1.0, 1.02], silhouette: 'spent_chipped_slab' }
    };

    const ROCK_VISUAL_ORDER = Object.freeze([
        'clay',
        'copper',
        'tin',
        'iron',
        'coal',
        'silver',
        'sapphire',
        'gold',
        'emerald',
        'rune_essence',
        'depleted'
    ]);

    function requireThree(three) {
        if (!three) throw new Error('World rock render runtime requires THREE.');
        return three;
    }

    function getRockVisualProfile(visualId) {
        if (typeof visualId === 'string' && ROCK_VISUAL_PROFILES[visualId]) return ROCK_VISUAL_PROFILES[visualId];
        return ROCK_VISUAL_PROFILES.copper;
    }

    function getRockVisualIdForNode(rockNode, depleted) {
        if (depleted) return 'depleted';
        const oreType = rockNode && rockNode.oreType ? rockNode.oreType : 'copper';
        return ROCK_VISUAL_PROFILES[oreType] ? oreType : 'copper';
    }

    function createRockRenderData(options = {}) {
        const rockMapByVisualId = Object.create(null);
        const rockMeshByVisualId = Object.create(null);
        const hasMeshContext = options.THREE && options.sharedGeometries && options.sharedMaterials;
        const THREE = hasMeshContext ? requireThree(options.THREE) : null;
        const sharedGeometries = options.sharedGeometries || {};
        const sharedMaterials = options.sharedMaterials || {};
        const rockVisualCounts = options.rockVisualCounts || Object.create(null);
        const planeGroup = options.planeGroup || null;
        const environmentMeshes = options.environmentMeshes || null;

        for (let i = 0; i < ROCK_VISUAL_ORDER.length; i++) {
            const visualId = ROCK_VISUAL_ORDER[i];
            rockMapByVisualId[visualId] = [];
            rockMeshByVisualId[visualId] = null;
            const rockCount = rockVisualCounts[visualId] || 0;
            if (!hasMeshContext || rockCount <= 0) continue;
            const profile = getRockVisualProfile(visualId);
            const geometry = sharedGeometries[profile.geometryKey] || sharedGeometries.rockCopper;
            const material = sharedMaterials[profile.materialKey] || sharedMaterials.rockCopper;
            const mesh = new THREE.InstancedMesh(geometry, material, rockCount);
            mesh.castShadow = false;
            mesh.matrixAutoUpdate = false;
            mesh.userData = { instanceMap: rockMapByVisualId[visualId] };
            rockMeshByVisualId[visualId] = mesh;
            if (planeGroup) planeGroup.add(mesh);
            if (Array.isArray(environmentMeshes)) environmentMeshes.push(mesh);
        }

        return { rockMapByVisualId, rockMeshByVisualId };
    }

    function setRockVisualState(options) {
        const THREE = requireThree(options && options.THREE);
        const rData = options && options.rData;
        const visualId = options && options.visualId;
        const rockIndex = Number.isInteger(options && options.rockIndex) ? options.rockIndex : 0;
        if (!rData || !visualId) return false;
        const mesh = rData.rockMeshByVisualId && rData.rockMeshByVisualId[visualId];
        const map = rData.rockMapByVisualId && rData.rockMapByVisualId[visualId];
        if (!mesh || !map) return false;

        const profile = getRockVisualProfile(visualId);
        const instanceScale = Array.isArray(profile.instanceScale) ? profile.instanceScale : [1, 1, 1];
        const dummy = options.dummyTransform || new THREE.Object3D();
        dummy.position.set(options.x, options.groundY, options.y);
        dummy.rotation.set(0, Number.isFinite(options.rotationY) ? options.rotationY : 0, 0);
        dummy.scale.set(instanceScale[0] || 1, instanceScale[1] || 1, instanceScale[2] || 1);
        dummy.updateMatrix();

        mesh.setMatrixAt(rockIndex, dummy.matrix);
        map[rockIndex] = {
            type: 'ROCK',
            gridX: options.x,
            gridY: options.y,
            z: options.z,
            oreType: options.oreType,
            name: options.name
        };
        return true;
    }

    function markRockVisualsDirty(rData) {
        if (!rData || !rData.rockMeshByVisualId) return;
        for (let i = 0; i < ROCK_VISUAL_ORDER.length; i++) {
            const visualId = ROCK_VISUAL_ORDER[i];
            const mesh = rData.rockMeshByVisualId[visualId];
            if (mesh) mesh.instanceMatrix.needsUpdate = true;
        }
    }

    window.WorldRockRenderRuntime = {
        ROCK_VISUAL_ORDER,
        ROCK_VISUAL_PROFILES,
        createRockRenderData,
        getRockVisualIdForNode,
        getRockVisualProfile,
        markRockVisualsDirty,
        setRockVisualState
    };
})();
