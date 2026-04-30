(function () {
    function requireThree(three) {
        if (!three) throw new Error('World chunk tier render runtime requires THREE.');
        return three;
    }

    function ensureChunkTierRenderAssets(options = {}) {
        const THREE = requireThree(options.THREE);
        const sharedMaterials = options.sharedMaterials || {};
        const sharedGeometries = options.sharedGeometries || {};

        if (!sharedMaterials.chunkMidTerrain) {
            sharedMaterials.chunkMidTerrain = new THREE.MeshLambertMaterial({ color: 0xffffff });
            sharedMaterials.chunkMidTerrain.map = sharedMaterials.grassTile ? sharedMaterials.grassTile.map : null;
        }
        if (!sharedMaterials.chunkFarTerrain) {
            sharedMaterials.chunkFarTerrain = new THREE.MeshLambertMaterial({ color: 0xffffff });
            sharedMaterials.chunkFarTerrain.map = sharedMaterials.grassTile ? sharedMaterials.grassTile.map : null;
        }
        if (!sharedMaterials.chunkMidFeatureTree) {
            sharedMaterials.chunkMidFeatureTree = new THREE.MeshLambertMaterial({ color: 0x4f6a3f, flatShading: true });
        }
        if (!sharedMaterials.chunkMidFeatureRock) {
            sharedMaterials.chunkMidFeatureRock = new THREE.MeshLambertMaterial({ color: 0x7a7f89, flatShading: true });
        }
        if (!sharedMaterials.chunkMidFeatureStone) {
            sharedMaterials.chunkMidFeatureStone = new THREE.MeshLambertMaterial({ color: 0x6f7278, flatShading: true });
        }
        if (!sharedMaterials.chunkFarFeatureTree) {
            sharedMaterials.chunkFarFeatureTree = new THREE.MeshLambertMaterial({ color: 0x43583a, flatShading: true });
        }
        if (!sharedMaterials.chunkFarFeatureRock) {
            sharedMaterials.chunkFarFeatureRock = new THREE.MeshLambertMaterial({ color: 0x666b74, flatShading: true });
        }
        if (!sharedMaterials.chunkFarFeatureStone) {
            sharedMaterials.chunkFarFeatureStone = new THREE.MeshLambertMaterial({ color: 0x5d6066, flatShading: true });
        }

        if (!sharedGeometries.chunkTierTree) {
            sharedGeometries.chunkTierTree = new THREE.ConeGeometry(0.34, 1.24, 6).translate(0, 0.62, 0);
        }
        if (!sharedGeometries.chunkTierRock) {
            sharedGeometries.chunkTierRock = new THREE.DodecahedronGeometry(0.28, 0).scale(1, 0.72, 0.95).translate(0, 0.24, 0);
        }
        if (!sharedGeometries.chunkTierWall) {
            sharedGeometries.chunkTierWall = new THREE.BoxGeometry(1.0, 2.0, 0.34).translate(0, 1.0, 0);
        }
        if (!sharedGeometries.chunkTierTower) {
            sharedGeometries.chunkTierTower = new THREE.CylinderGeometry(0.6, 0.7, 2.8, 8).translate(0, 1.4, 0);
        }

        const grassMap = sharedMaterials.grassTile && sharedMaterials.grassTile.map
            ? sharedMaterials.grassTile.map
            : null;
        if (grassMap) {
            if (sharedMaterials.chunkMidTerrain.map !== grassMap) {
                sharedMaterials.chunkMidTerrain.map = grassMap;
                sharedMaterials.chunkMidTerrain.needsUpdate = true;
            }
            if (sharedMaterials.chunkFarTerrain.map !== grassMap) {
                sharedMaterials.chunkFarTerrain.map = grassMap;
                sharedMaterials.chunkFarTerrain.needsUpdate = true;
            }
        }
    }

    function createSimplifiedTerrainMesh(options = {}) {
        const THREE = requireThree(options.THREE);
        const CHUNK_SIZE = options.CHUNK_SIZE;
        const MAP_SIZE = options.MAP_SIZE;
        const CHUNK_TIER_FAR = options.CHUNK_TIER_FAR;
        const CHUNK_TIER_MID = options.CHUNK_TIER_MID;
        const sharedMaterials = options.sharedMaterials || {};
        const heightMap = options.heightMap || [];
        const startX = options.startX;
        const startY = options.startY;
        const tier = options.tier;
        const segments = tier === CHUNK_TIER_FAR ? 10 : 18;
        const terrainGeo = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, segments, segments);
        terrainGeo.rotateX(-Math.PI / 2);
        const positions = terrainGeo.attributes.position;
        for (let vy = 0; vy <= segments; vy++) {
            for (let vx = 0; vx <= segments; vx++) {
                const idx = (vy * (segments + 1)) + vx;
                const worldX = startX - 0.5 + ((vx / segments) * CHUNK_SIZE);
                const worldY = startY - 0.5 + ((vy / segments) * CHUNK_SIZE);
                const sampleX = Math.max(0, Math.min(MAP_SIZE - 1, Math.floor(worldX + 0.5)));
                const sampleY = Math.max(0, Math.min(MAP_SIZE - 1, Math.floor(worldY + 0.5)));
                const h = (heightMap[0] && heightMap[0][sampleY]) ? heightMap[0][sampleY][sampleX] : 0;
                positions.setY(idx, h);
            }
        }
        positions.needsUpdate = true;
        terrainGeo.computeVertexNormals();
        const terrainMat = tier === CHUNK_TIER_FAR ? sharedMaterials.chunkFarTerrain : sharedMaterials.chunkMidTerrain;
        const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
        terrainMesh.position.set(startX + CHUNK_SIZE / 2 - 0.5, 0, startY + CHUNK_SIZE / 2 - 0.5);
        terrainMesh.castShadow = false;
        terrainMesh.receiveShadow = tier === CHUNK_TIER_MID;
        terrainMesh.userData = { type: 'GROUND', z: 0, tier };
        return terrainMesh;
    }

    function addSimplifiedChunkFeatures(options = {}) {
        const THREE = requireThree(options.THREE);
        const TileId = options.TileId || {};
        const CHUNK_TIER_FAR = options.CHUNK_TIER_FAR;
        const CHUNK_TIER_MID = options.CHUNK_TIER_MID;
        const sharedMaterials = options.sharedMaterials || {};
        const sharedGeometries = options.sharedGeometries || {};
        const logicalMap = options.logicalMap || [];
        const heightMap = options.heightMap || [];
        const getVisualTileId = typeof options.getVisualTileId === 'function' ? options.getVisualTileId : (tile) => tile;
        const isTreeTileId = typeof options.isTreeTileId === 'function' ? options.isTreeTileId : () => false;
        const planeGroup = options.planeGroup;
        const startX = options.startX;
        const startY = options.startY;
        const endX = options.endX;
        const endY = options.endY;
        const z = options.z;
        const tier = options.tier;
        const stride = tier === CHUNK_TIER_FAR ? 4 : 2;
        let treeCount = 0;
        let rockCount = 0;
        let wallCount = 0;
        let towerCount = 0;
        for (let y = startY; y < endY; y += stride) {
            for (let x = startX; x < endX; x += stride) {
                const tile = getVisualTileId(logicalMap[z][y][x], x, y, z);
                if (z === 0 && isTreeTileId(tile)) treeCount += 1;
                else if (z === 0 && tile === TileId.ROCK) rockCount += 1;
                else if (tile === TileId.WALL) wallCount += 1;
                else if (tile === TileId.TOWER) towerCount += 1;
            }
        }
        const allowReceiveShadow = tier === CHUNK_TIER_MID;
        const treeMat = tier === CHUNK_TIER_FAR ? sharedMaterials.chunkFarFeatureTree : sharedMaterials.chunkMidFeatureTree;
        const rockMat = tier === CHUNK_TIER_FAR ? sharedMaterials.chunkFarFeatureRock : sharedMaterials.chunkMidFeatureRock;
        const stoneMat = tier === CHUNK_TIER_FAR ? sharedMaterials.chunkFarFeatureStone : sharedMaterials.chunkMidFeatureStone;
        const dummy = new THREE.Object3D();
        const zOffset = z * 3.0;

        const fillInstances = (mesh, matchFn) => {
            if (!mesh) return;
            let idx = 0;
            for (let y = startY; y < endY; y += stride) {
                for (let x = startX; x < endX; x += stride) {
                    const tile = getVisualTileId(logicalMap[z][y][x], x, y, z);
                    if (!matchFn(tile, x, y)) continue;
                    const tileHeight = heightMap[z] && heightMap[z][y] ? heightMap[z][y][x] : 0;
                    dummy.position.set(x, tileHeight + zOffset, y);
                    dummy.rotation.set(0, ((x * 13.7) + (y * 7.9)) % (Math.PI * 2), 0);
                    dummy.updateMatrix();
                    mesh.setMatrixAt(idx, dummy.matrix);
                    idx += 1;
                }
            }
            mesh.instanceMatrix.needsUpdate = true;
        };

        if (treeCount > 0) {
            const trees = new THREE.InstancedMesh(sharedGeometries.chunkTierTree, treeMat, treeCount);
            trees.castShadow = false;
            trees.receiveShadow = allowReceiveShadow;
            trees.matrixAutoUpdate = false;
            fillInstances(trees, (tile) => z === 0 && isTreeTileId(tile));
            planeGroup.add(trees);
        }
        if (rockCount > 0) {
            const rocks = new THREE.InstancedMesh(sharedGeometries.chunkTierRock, rockMat, rockCount);
            rocks.castShadow = false;
            rocks.receiveShadow = allowReceiveShadow;
            rocks.matrixAutoUpdate = false;
            fillInstances(rocks, (tile) => z === 0 && tile === TileId.ROCK);
            planeGroup.add(rocks);
        }
        if (wallCount > 0) {
            const walls = new THREE.InstancedMesh(sharedGeometries.chunkTierWall, stoneMat, wallCount);
            walls.castShadow = false;
            walls.receiveShadow = allowReceiveShadow;
            walls.matrixAutoUpdate = false;
            fillInstances(walls, (tile) => tile === TileId.WALL);
            planeGroup.add(walls);
        }
        if (towerCount > 0) {
            const towers = new THREE.InstancedMesh(sharedGeometries.chunkTierTower, stoneMat, towerCount);
            towers.castShadow = false;
            towers.receiveShadow = allowReceiveShadow;
            towers.matrixAutoUpdate = false;
            fillInstances(towers, (tile) => tile === TileId.TOWER);
            planeGroup.add(towers);
        }
    }

    function createSimplifiedChunkGroup(options = {}) {
        const THREE = requireThree(options.THREE);
        const CHUNK_SIZE = options.CHUNK_SIZE;
        const PLANES = options.PLANES;
        const CHUNK_TIER_MID = options.CHUNK_TIER_MID;
        const tier = options.tier || CHUNK_TIER_MID;
        const cx = options.cx;
        const cy = options.cy;
        const playerState = options.playerState || {};
        ensureChunkTierRenderAssets(options);
        const group = new THREE.Group();
        group.userData = { chunkTier: tier, chunkX: cx, chunkY: cy };
        const startX = cx * CHUNK_SIZE;
        const startY = cy * CHUNK_SIZE;
        const endX = startX + CHUNK_SIZE;
        const endY = startY + CHUNK_SIZE;
        for (let z = 0; z < PLANES; z++) {
            const planeGroup = new THREE.Group();
            planeGroup.userData.z = z;
            planeGroup.visible = z <= playerState.z;
            if (z === 0) {
                planeGroup.add(createSimplifiedTerrainMesh(Object.assign({}, options, { startX, startY, tier })));
            }
            addSimplifiedChunkFeatures(Object.assign({}, options, { planeGroup, startX, startY, endX, endY, z, tier }));
            group.add(planeGroup);
        }
        return group;
    }

    window.WorldChunkTierRenderRuntime = {
        addSimplifiedChunkFeatures,
        createSimplifiedChunkGroup,
        createSimplifiedTerrainMesh,
        ensureChunkTierRenderAssets
    };
})();
