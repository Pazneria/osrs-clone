(function () {
    function requireThree(three) {
        if (!three) throw new Error('World chunk tier render runtime requires THREE.');
        return three;
    }

    function sampleTerrainUvWarp(sampleFractalNoise2D, worldX, worldY, seed) {
        if (typeof sampleFractalNoise2D !== 'function') return 0;
        return (sampleFractalNoise2D(worldX * 0.035, worldY * 0.035, seed, 3, 2.0, 0.56) - 0.5) * 0.09;
    }

    function applyWorldSpaceTerrainUvs(geometry, startX, startY, segments, chunkSize, sampleFractalNoise2D) {
        const uvs = geometry && geometry.attributes ? geometry.attributes.uv : null;
        if (!uvs || !Number.isFinite(segments) || segments <= 0 || !Number.isFinite(chunkSize) || chunkSize <= 0) return;
        for (let vy = 0; vy <= segments; vy++) {
            for (let vx = 0; vx <= segments; vx++) {
                const idx = (vy * (segments + 1)) + vx;
                const worldX = startX - 0.5 + ((vx / segments) * chunkSize);
                const worldY = startY - 0.5 + ((vy / segments) * chunkSize);
                const warpU = sampleTerrainUvWarp(sampleFractalNoise2D, worldX + 31.7, worldY - 14.3, 173.41);
                const warpV = sampleTerrainUvWarp(sampleFractalNoise2D, worldX - 48.9, worldY + 22.5, 281.73);
                uvs.setXY(idx, (worldX / chunkSize) + warpU, (worldY / chunkSize) + warpV);
            }
        }
        uvs.needsUpdate = true;
    }

    const SIMPLIFIED_TERRAIN_MATERIAL_INDEX = Object.freeze({
        grass: 0,
        dirt: 1,
        shore: 2,
        rock: 3,
        wood: 4,
        stone: 5,
        brick: 6
    });

    function syncChunkTierTerrainMaterial(THREE, sharedMaterials, key, colorHex, map) {
        if (!sharedMaterials[key]) {
            sharedMaterials[key] = new THREE.MeshLambertMaterial({ color: colorHex });
        }
        const material = sharedMaterials[key];
        if (material.color && typeof material.color.setHex === 'function') {
            material.color.setHex(colorHex);
        }
        const nextMap = map || null;
        if (material.map !== nextMap) {
            material.map = nextMap;
            material.needsUpdate = true;
        }
        return material;
    }

    function ensureSimplifiedTerrainMaterialSet(THREE, sharedMaterials, tier, CHUNK_TIER_FAR) {
        const far = tier === CHUNK_TIER_FAR;
        const prefix = far ? 'chunkFarTerrain' : 'chunkMidTerrain';
        const grassMap = sharedMaterials.grassTile && sharedMaterials.grassTile.map
            ? sharedMaterials.grassTile.map
            : null;
        const dirtMap = sharedMaterials.dirtTile && sharedMaterials.dirtTile.map
            ? sharedMaterials.dirtTile.map
            : grassMap;
        const woodMap = sharedMaterials.floor6 && sharedMaterials.floor6.map ? sharedMaterials.floor6.map : null;
        const stoneMap = sharedMaterials.floor7 && sharedMaterials.floor7.map ? sharedMaterials.floor7.map : null;
        const brickMap = sharedMaterials.floor8 && sharedMaterials.floor8.map ? sharedMaterials.floor8.map : null;
        const tint = far
            ? {
                grass: 0xd9ead0,
                dirt: 0xa08355,
                shore: 0xb9aa79,
                rock: 0x7a786e,
                wood: 0x8a663f,
                stone: 0x898982,
                brick: 0x8a4e42
            }
            : {
                grass: 0xffffff,
                dirt: 0xffffff,
                shore: 0xd2bd91,
                rock: 0x918c7f,
                wood: 0xffffff,
                stone: 0xffffff,
                brick: 0xffffff
            };
        const materials = [
            syncChunkTierTerrainMaterial(THREE, sharedMaterials, `${prefix}Grass`, tint.grass, grassMap),
            syncChunkTierTerrainMaterial(THREE, sharedMaterials, `${prefix}Dirt`, tint.dirt, dirtMap),
            syncChunkTierTerrainMaterial(THREE, sharedMaterials, `${prefix}Shore`, tint.shore, dirtMap),
            syncChunkTierTerrainMaterial(THREE, sharedMaterials, `${prefix}Rock`, tint.rock, dirtMap),
            syncChunkTierTerrainMaterial(THREE, sharedMaterials, `${prefix}Wood`, tint.wood, woodMap),
            syncChunkTierTerrainMaterial(THREE, sharedMaterials, `${prefix}Stone`, tint.stone, stoneMap),
            syncChunkTierTerrainMaterial(THREE, sharedMaterials, `${prefix}Brick`, tint.brick, brickMap)
        ];
        sharedMaterials[`${prefix}Materials`] = materials;
        sharedMaterials[prefix] = materials[SIMPLIFIED_TERRAIN_MATERIAL_INDEX.grass];
        return materials;
    }

    function getSimplifiedTerrainMaterialIndex(tile, TileId) {
        if (tile === TileId.DIRT) return SIMPLIFIED_TERRAIN_MATERIAL_INDEX.dirt;
        if (tile === TileId.SHORE) return SIMPLIFIED_TERRAIN_MATERIAL_INDEX.shore;
        if (tile === TileId.ROCK) return SIMPLIFIED_TERRAIN_MATERIAL_INDEX.rock;
        if (
            tile === TileId.FLOOR_WOOD
            || tile === TileId.SHOP_COUNTER
            || tile === TileId.BANK_BOOTH
            || tile === TileId.FENCE
            || tile === TileId.WOODEN_GATE_CLOSED
            || tile === TileId.WOODEN_GATE_OPEN
        ) {
            return SIMPLIFIED_TERRAIN_MATERIAL_INDEX.wood;
        }
        if (
            tile === TileId.FLOOR_STONE
            || tile === TileId.STAIRS_UP
            || tile === TileId.STAIRS_DOWN
            || tile === TileId.STAIRS_RAMP
            || tile === TileId.WALL
            || tile === TileId.TOWER
            || tile === TileId.DOOR_CLOSED
            || tile === TileId.DOOR_OPEN
            || tile === TileId.SOLID_NPC
        ) {
            return SIMPLIFIED_TERRAIN_MATERIAL_INDEX.stone;
        }
        if (tile === TileId.FLOOR_BRICK) return SIMPLIFIED_TERRAIN_MATERIAL_INDEX.brick;
        return SIMPLIFIED_TERRAIN_MATERIAL_INDEX.grass;
    }

    function syncChunkTierFlatMaterial(THREE, sharedMaterials, key, colorHex) {
        if (!sharedMaterials[key]) {
            sharedMaterials[key] = new THREE.MeshLambertMaterial({ color: colorHex, flatShading: true });
        } else if (sharedMaterials[key].color && typeof sharedMaterials[key].color.setHex === 'function') {
            sharedMaterials[key].color.setHex(colorHex);
        }
        return sharedMaterials[key];
    }

    function ensureSimplifiedStructureProxyAssets(THREE, sharedMaterials, sharedGeometries) {
        if (!sharedGeometries.chunkTierStructureBody) {
            sharedGeometries.chunkTierStructureBody = new THREE.BoxGeometry(1, 1, 1);
        }
        if (!sharedGeometries.chunkTierStructureRoof) {
            sharedGeometries.chunkTierStructureRoof = new THREE.BoxGeometry(1, 1, 1);
        }
        syncChunkTierFlatMaterial(THREE, sharedMaterials, 'chunkMidStructureWood', 0x7a5835);
        syncChunkTierFlatMaterial(THREE, sharedMaterials, 'chunkMidStructureStone', 0x7f8079);
        syncChunkTierFlatMaterial(THREE, sharedMaterials, 'chunkMidStructureRoof', 0x7f6536);
        syncChunkTierFlatMaterial(THREE, sharedMaterials, 'chunkFarStructureWood', 0x60482f);
        syncChunkTierFlatMaterial(THREE, sharedMaterials, 'chunkFarStructureStone', 0x696b67);
        syncChunkTierFlatMaterial(THREE, sharedMaterials, 'chunkFarStructureRoof', 0x66512e);
    }

    function getStampRows(stampMap, stampId) {
        const rows = stampMap && Array.isArray(stampMap[stampId]) ? stampMap[stampId] : [];
        return rows.filter((row) => typeof row === 'string');
    }

    function getStructureStampBounds(structure, stampMap) {
        if (!structure || !Number.isFinite(structure.x) || !Number.isFinite(structure.y)) return null;
        const rows = getStampRows(stampMap, structure.stampId);
        if (rows.length <= 0) return null;
        let width = 0;
        for (let i = 0; i < rows.length; i++) width = Math.max(width, rows[i].length);
        if (width <= 0) return null;
        return {
            xMin: structure.x,
            xMax: structure.x + width - 1,
            yMin: structure.y,
            yMax: structure.y + rows.length - 1,
            z: Number.isFinite(structure.z) ? structure.z : 0,
            width,
            depth: rows.length,
            rows
        };
    }

    function getBoundsOverlapArea(a, b) {
        if (!a || !b) return 0;
        const xOverlap = Math.max(0, Math.min(a.xMax, b.xMax) - Math.max(a.xMin, b.xMin) + 1);
        const yOverlap = Math.max(0, Math.min(a.yMax, b.yMax) - Math.max(a.yMin, b.yMin) + 1);
        return xOverlap * yOverlap;
    }

    function getRoofBounds(roof) {
        if (!roof || !Number.isFinite(roof.x) || !Number.isFinite(roof.y)) return null;
        const width = Math.max(1, Number.isFinite(roof.width) ? roof.width : 1);
        const depth = Math.max(1, Number.isFinite(roof.depth) ? roof.depth : 1);
        return {
            xMin: roof.x,
            xMax: roof.x + width - 1,
            yMin: roof.y,
            yMax: roof.y + depth - 1,
            z: Number.isFinite(roof.z) ? roof.z : 0,
            width,
            depth
        };
    }

    function findStructureProxyRoof(roofLandmarks, structureBounds) {
        const roofs = Array.isArray(roofLandmarks) ? roofLandmarks : [];
        let bestRoof = null;
        let bestOverlap = 0;
        for (let i = 0; i < roofs.length; i++) {
            const roof = roofs[i];
            const roofBounds = getRoofBounds(roof);
            if (!roofBounds || roofBounds.z !== structureBounds.z) continue;
            const overlap = getBoundsOverlapArea(roofBounds, structureBounds);
            if (overlap <= bestOverlap) continue;
            bestRoof = roof;
            bestOverlap = overlap;
        }
        return bestOverlap > 0 ? bestRoof : null;
    }

    function isWoodStructureProxy(structure, rows) {
        const id = `${structure && structure.stampId ? structure.stampId : ''} ${structure && structure.label ? structure.label : ''}`;
        if (/timber|hut|shack|cottage|cabin|longhouse|workshop/i.test(id)) return true;
        let wood = 0;
        let stone = 0;
        for (let y = 0; y < rows.length; y++) {
            for (let x = 0; x < rows[y].length; x++) {
                const char = rows[y][x];
                if (char === 'T' || char === 'L') wood++;
                else if (char === 'F' || char === 'P' || char === 'E' || char === 'B' || char === 'V') stone++;
            }
        }
        return wood > stone;
    }

    function chunkOwnsStructureProxy(bounds, startX, startY, endX, endY) {
        if (!bounds) return false;
        const centerX = (bounds.xMin + bounds.xMax) * 0.5;
        const centerY = (bounds.yMin + bounds.yMax) * 0.5;
        return centerX >= startX && centerX < endX && centerY >= startY && centerY < endY;
    }

    function collectStructureProxyBounds(stampedStructures, stampMap, z, startX, startY, endX, endY) {
        const structures = Array.isArray(stampedStructures) ? stampedStructures : [];
        const chunkBounds = {
            xMin: startX,
            xMax: endX - 1,
            yMin: startY,
            yMax: endY - 1,
            z
        };
        const bounds = [];
        for (let i = 0; i < structures.length; i++) {
            const structureBounds = getStructureStampBounds(structures[i], stampMap);
            if (!structureBounds || structureBounds.z !== z) continue;
            if (getBoundsOverlapArea(structureBounds, chunkBounds) <= 0) continue;
            bounds.push(structureBounds);
        }
        return bounds;
    }

    function isStructureProxyCoveredTile(structureBounds, x, y) {
        if (!Array.isArray(structureBounds) || structureBounds.length <= 0) return false;
        for (let i = 0; i < structureBounds.length; i++) {
            const bounds = structureBounds[i];
            if (x >= bounds.xMin && x <= bounds.xMax && y >= bounds.yMin && y <= bounds.yMax) return true;
        }
        return false;
    }

    function ensureChunkTierRenderAssets(options = {}) {
        const THREE = requireThree(options.THREE);
        const sharedMaterials = options.sharedMaterials || {};
        const sharedGeometries = options.sharedGeometries || {};

        ensureSimplifiedTerrainMaterialSet(THREE, sharedMaterials, options.CHUNK_TIER_MID, options.CHUNK_TIER_FAR);
        ensureSimplifiedTerrainMaterialSet(THREE, sharedMaterials, options.CHUNK_TIER_FAR, options.CHUNK_TIER_FAR);
        ensureSimplifiedStructureProxyAssets(THREE, sharedMaterials, sharedGeometries);
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
    }

    function createSimplifiedTerrainMesh(options = {}) {
        const THREE = requireThree(options.THREE);
        const CHUNK_SIZE = options.CHUNK_SIZE;
        const MAP_SIZE = options.MAP_SIZE;
        const CHUNK_TIER_FAR = options.CHUNK_TIER_FAR;
        const CHUNK_TIER_MID = options.CHUNK_TIER_MID;
        const TileId = options.TileId || {};
        const sharedMaterials = options.sharedMaterials || {};
        const logicalMap = options.logicalMap || [];
        const heightMap = options.heightMap || [];
        const startX = options.startX;
        const startY = options.startY;
        const tier = options.tier;
        const getVisualTileId = typeof options.getVisualTileId === 'function' ? options.getVisualTileId : (tile) => tile;
        const isWaterTileId = typeof options.isWaterTileId === 'function' ? options.isWaterTileId : () => false;
        const isPierVisualCoverageTile = typeof options.isPierVisualCoverageTile === 'function'
            ? options.isPierVisualCoverageTile
            : () => false;
        const sampleFractalNoise2D = typeof options.sampleFractalNoise2D === 'function'
            ? options.sampleFractalNoise2D
            : () => 0.5;
        const getActivePierConfig = typeof options.getActivePierConfig === 'function'
            ? options.getActivePierConfig
            : () => null;
        const activePierConfig = getActivePierConfig();
        let hasLandCoverage = false;
        let hasWaterCoverage = false;
        const terrainMaterialCoverage = new Set();
        for (let y = startY; y < Math.min(MAP_SIZE, startY + CHUNK_SIZE); y++) {
            for (let x = startX; x < Math.min(MAP_SIZE, startX + CHUNK_SIZE); x++) {
                const tile = getVisualTileId(logicalMap[0][y][x], x, y, 0);
                if (isPierVisualCoverageTile(activePierConfig, x, y, 0) || isWaterTileId(tile) || tile === TileId.WATER_SHALLOW || tile === TileId.WATER_DEEP) {
                    hasWaterCoverage = true;
                } else {
                    hasLandCoverage = true;
                    terrainMaterialCoverage.add(getSimplifiedTerrainMaterialIndex(tile, TileId));
                }
            }
        }
        if (!hasLandCoverage) return null;
        const hasTerrainMaterialVariation = terrainMaterialCoverage.size > 1
            || !terrainMaterialCoverage.has(SIMPLIFIED_TERRAIN_MATERIAL_INDEX.grass);
        const segments = (hasLandCoverage && hasWaterCoverage)
            ? CHUNK_SIZE
            : (hasTerrainMaterialVariation
                ? Math.min(CHUNK_SIZE, tier === CHUNK_TIER_FAR ? 16 : CHUNK_SIZE)
                : (tier === CHUNK_TIER_FAR ? 10 : 18));
        const terrainGeo = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, segments, segments);
        terrainGeo.rotateX(-Math.PI / 2);
        applyWorldSpaceTerrainUvs(terrainGeo, startX, startY, segments, CHUNK_SIZE, sampleFractalNoise2D);
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
        const baseTerrainIndices = terrainGeo.index ? Array.from(terrainGeo.index.array) : [];
        const terrainMaterials = ensureSimplifiedTerrainMaterialSet(THREE, sharedMaterials, tier, CHUNK_TIER_FAR);
        const terrainIndicesByMaterial = terrainMaterials.map(() => []);
        for (let cellY = 0; cellY < segments; cellY++) {
            for (let cellX = 0; cellX < segments; cellX++) {
                const sampleX = Math.max(0, Math.min(MAP_SIZE - 1, Math.floor(startX + (((cellX + 0.5) / segments) * CHUNK_SIZE))));
                const sampleY = Math.max(0, Math.min(MAP_SIZE - 1, Math.floor(startY + (((cellY + 0.5) / segments) * CHUNK_SIZE))));
                const tile = getVisualTileId(logicalMap[0][sampleY][sampleX], sampleX, sampleY, 0);
                if (isWaterTileId(tile)) continue;
                if (tile === TileId.WATER_SHALLOW || tile === TileId.WATER_DEEP) continue;
                if (isPierVisualCoverageTile(activePierConfig, sampleX, sampleY, 0)) continue;
                const cellIndexOffset = ((cellY * segments) + cellX) * 6;
                const materialIndex = Math.max(0, Math.min(
                    terrainMaterials.length - 1,
                    getSimplifiedTerrainMaterialIndex(tile, TileId)
                ));
                for (let i = 0; i < 6; i++) {
                    terrainIndicesByMaterial[materialIndex].push(baseTerrainIndices[cellIndexOffset + i]);
                }
            }
        }
        const filteredTerrainIndices = [];
        terrainGeo.clearGroups();
        for (let materialIndex = 0; materialIndex < terrainIndicesByMaterial.length; materialIndex++) {
            const indices = terrainIndicesByMaterial[materialIndex];
            if (indices.length <= 0) continue;
            const groupStart = filteredTerrainIndices.length;
            for (let i = 0; i < indices.length; i++) filteredTerrainIndices.push(indices[i]);
            terrainGeo.addGroup(groupStart, indices.length, materialIndex);
        }
        if (filteredTerrainIndices.length <= 0) return null;
        terrainGeo.setIndex(filteredTerrainIndices);
        terrainGeo.computeVertexNormals();
        const terrainMesh = new THREE.Mesh(terrainGeo, terrainMaterials);
        terrainMesh.position.set(startX + CHUNK_SIZE / 2 - 0.5, 0, startY + CHUNK_SIZE / 2 - 0.5);
        terrainMesh.castShadow = false;
        terrainMesh.receiveShadow = tier === CHUNK_TIER_MID;
        terrainMesh.userData = { type: 'GROUND', z: 0, tier };
        return terrainMesh;
    }

    function createSimplifiedWaterMeshes(options = {}) {
        const THREE = requireThree(options.THREE);
        const CHUNK_SIZE = options.CHUNK_SIZE;
        const MAP_SIZE = options.MAP_SIZE;
        const CHUNK_TIER_FAR = options.CHUNK_TIER_FAR;
        const TileId = options.TileId || {};
        const logicalMap = options.logicalMap || [];
        const waterRenderBodies = Array.isArray(options.waterRenderBodies) ? options.waterRenderBodies : [];
        const startX = options.startX;
        const startY = options.startY;
        const tier = options.tier;
        const isWaterTileId = typeof options.isWaterTileId === 'function' ? options.isWaterTileId : () => false;
        const isPierVisualCoverageTile = typeof options.isPierVisualCoverageTile === 'function'
            ? options.isPierVisualCoverageTile
            : () => false;
        const getActivePierConfig = typeof options.getActivePierConfig === 'function'
            ? options.getActivePierConfig
            : () => null;
        const getWaterSurfaceMaterial = typeof options.getWaterSurfaceMaterial === 'function'
            ? options.getWaterSurfaceMaterial
            : () => null;
        const resolveVisualWaterRenderBodyForTile = typeof options.resolveVisualWaterRenderBodyForTile === 'function'
            ? options.resolveVisualWaterRenderBodyForTile
            : () => null;
        const getVisualTileId = typeof options.getVisualTileId === 'function' ? options.getVisualTileId : (tile) => tile;
        const builders = new Map();
        const activePierConfig = getActivePierConfig();
        const chunkMaxX = Math.min(MAP_SIZE, startX + CHUNK_SIZE);
        const chunkMaxY = Math.min(MAP_SIZE, startY + CHUNK_SIZE);
        let hasLandCoverage = false;
        let hasWaterCoverage = false;

        const getBuilder = (body) => {
            const key = body && body.id ? body.id : 'simplified-water';
            if (!builders.has(key)) {
                builders.set(key, {
                    body,
                    positions: [],
                    waterData: []
                });
            }
            return builders.get(key);
        };

        for (let y = startY; y < chunkMaxY; y++) {
            for (let x = startX; x < chunkMaxX; x++) {
                const tile = getVisualTileId(logicalMap[0][y][x], x, y, 0);
                const waterCovered = isWaterTileId(tile)
                    || tile === TileId.WATER_SHALLOW
                    || tile === TileId.WATER_DEEP
                    || isPierVisualCoverageTile(activePierConfig, x, y, 0);
                if (waterCovered && resolveVisualWaterRenderBodyForTile(waterRenderBodies, x, y, 0)) {
                    hasWaterCoverage = true;
                } else {
                    hasLandCoverage = true;
                }
            }
        }
        if (!hasWaterCoverage) return [];

        const appendWaterQuad = (builder, x0, x1, y0, y1, surfaceY, depthWeight, shoreStrength) => {
            builder.positions.push(
                x0, surfaceY, y0,
                x1, surfaceY, y1,
                x1, surfaceY, y0,
                x0, surfaceY, y0,
                x0, surfaceY, y1,
                x1, surfaceY, y1
            );
            for (let i = 0; i < 6; i++) {
                builder.waterData.push(depthWeight, shoreStrength);
            }
        };

        const isMixedChunk = hasLandCoverage && hasWaterCoverage;
        if (!isMixedChunk) {
            const sampleX = Math.max(0, Math.min(MAP_SIZE - 1, Math.floor(startX + ((chunkMaxX - startX) / 2))));
            const sampleY = Math.max(0, Math.min(MAP_SIZE - 1, Math.floor(startY + ((chunkMaxY - startY) / 2))));
            const sampleBody = resolveVisualWaterRenderBodyForTile(waterRenderBodies, sampleX, sampleY, 0);
            if (!sampleBody) return [];
            const sampleTile = getVisualTileId(logicalMap[0][sampleY][sampleX], sampleX, sampleY, 0);
            const surfaceY = Number.isFinite(sampleBody.surfaceY) ? sampleBody.surfaceY : -0.075;
            appendWaterQuad(
                getBuilder(sampleBody),
                -CHUNK_SIZE / 2,
                (chunkMaxX - startX) - (CHUNK_SIZE / 2),
                -CHUNK_SIZE / 2,
                (chunkMaxY - startY) - (CHUNK_SIZE / 2),
                surfaceY,
                sampleTile === TileId.WATER_DEEP ? 1.0 : 0.36,
                sampleTile === TileId.WATER_SHALLOW ? 0.38 : 0.08
            );
        }

        for (let y = startY; y < chunkMaxY && isMixedChunk; y++) {
            let run = null;
            for (let x = startX; x <= chunkMaxX; x++) {
                let nextRun = null;
                if (x < chunkMaxX) {
                    const tile = getVisualTileId(logicalMap[0][y][x], x, y, 0);
                    const pierCovered = isPierVisualCoverageTile(activePierConfig, x, y, 0);
                    if (isWaterTileId(tile) || pierCovered) {
                        const body = resolveVisualWaterRenderBodyForTile(waterRenderBodies, x, y, 0);
                        if (body) {
                            nextRun = {
                                body,
                                depthWeight: tile === TileId.WATER_DEEP ? 1.0 : 0.36,
                                shoreStrength: tile === TileId.WATER_SHALLOW ? 0.38 : 0.08
                            };
                        }
                    }
                }
                const nextKey = nextRun ? `${nextRun.body.id}|${nextRun.depthWeight}|${nextRun.shoreStrength}` : null;
                const runKey = run ? `${run.body.id}|${run.depthWeight}|${run.shoreStrength}` : null;
                if (run && nextKey !== runKey) {
                    const builder = getBuilder(run.body);
                    const x0 = run.startX - startX - (CHUNK_SIZE / 2);
                    const x1 = x - startX - (CHUNK_SIZE / 2);
                    const y0 = y - startY - (CHUNK_SIZE / 2);
                    const y1 = y + 1 - startY - (CHUNK_SIZE / 2);
                    const surfaceY = Number.isFinite(run.body.surfaceY) ? run.body.surfaceY : -0.075;
                    appendWaterQuad(builder, x0, x1, y0, y1, surfaceY, run.depthWeight, run.shoreStrength);
                    run = null;
                }
                if (!run && nextRun) {
                    run = Object.assign({ startX: x }, nextRun);
                }
            }
        }

        const meshes = [];
        builders.forEach((builder) => {
            if (!builder || builder.positions.length <= 0) return;
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(builder.positions, 3));
            geometry.setAttribute('waterData', new THREE.Float32BufferAttribute(builder.waterData, 2));
            geometry.computeBoundingSphere();
            const mesh = new THREE.Mesh(geometry, getWaterSurfaceMaterial(builder.body.styleTokens));
            mesh.position.set(startX + CHUNK_SIZE / 2 - 0.5, 0, startY + CHUNK_SIZE / 2 - 0.5);
            mesh.castShadow = false;
            mesh.receiveShadow = false;
            mesh.renderOrder = 3;
            mesh.userData = { type: 'WATER', z: 0, tier, waterBodyId: builder.body.id };
            meshes.push(mesh);
        });
        return meshes;
    }

    function appendSimplifiedStructureProxies(options = {}) {
        const THREE = requireThree(options.THREE);
        const sharedMaterials = options.sharedMaterials || {};
        const sharedGeometries = options.sharedGeometries || {};
        const structures = Array.isArray(options.stampedStructures) ? options.stampedStructures : [];
        const stampMap = options.stampMap || {};
        const roofLandmarks = Array.isArray(options.roofLandmarks) ? options.roofLandmarks : [];
        const planeGroup = options.planeGroup;
        const startX = options.startX;
        const startY = options.startY;
        const endX = options.endX;
        const endY = options.endY;
        const z = options.z;
        const zOffset = z * 3.0;
        const tier = options.tier;
        const CHUNK_TIER_FAR = options.CHUNK_TIER_FAR;
        if (!planeGroup || structures.length <= 0) return;

        for (let i = 0; i < structures.length; i++) {
            const structure = structures[i];
            const bounds = getStructureStampBounds(structure, stampMap);
            if (!bounds || bounds.z !== z || !chunkOwnsStructureProxy(bounds, startX, startY, endX, endY)) continue;
            const roof = findStructureProxyRoof(roofLandmarks, bounds);
            const isWood = isWoodStructureProxy(structure, bounds.rows);
            const bodyMaterial = tier === CHUNK_TIER_FAR
                ? (isWood ? sharedMaterials.chunkFarStructureWood : sharedMaterials.chunkFarStructureStone)
                : (isWood ? sharedMaterials.chunkMidStructureWood : sharedMaterials.chunkMidStructureStone);
            const roofMaterial = tier === CHUNK_TIER_FAR
                ? sharedMaterials.chunkFarStructureRoof
                : sharedMaterials.chunkMidStructureRoof;
            const bodyHeight = roof && Number.isFinite(roof.height)
                ? Math.max(1.2, Math.min(2.35, roof.height - 0.38))
                : (isWood ? 1.75 : 2.15);
            const body = new THREE.Mesh(sharedGeometries.chunkTierStructureBody, bodyMaterial);
            body.position.set(
                (bounds.xMin + bounds.xMax) * 0.5,
                zOffset + (bodyHeight * 0.5),
                (bounds.yMin + bounds.yMax) * 0.5
            );
            body.scale.set(Math.max(1, bounds.width), bodyHeight, Math.max(1, bounds.depth));
            body.castShadow = false;
            body.receiveShadow = tier !== CHUNK_TIER_FAR;
            body.userData = {
                type: 'STRUCTURE_PROXY',
                proxyRole: 'body',
                structureId: structure.structureId || null,
                z,
                tier
            };
            planeGroup.add(body);

            if (roof) {
                const roofBounds = getRoofBounds(roof) || bounds;
                const roofThickness = tier === CHUNK_TIER_FAR ? 0.36 : 0.48;
                const roofMesh = new THREE.Mesh(sharedGeometries.chunkTierStructureRoof, roofMaterial);
                roofMesh.position.set(
                    (roofBounds.xMin + roofBounds.xMax) * 0.5,
                    zOffset + Math.max(bodyHeight + (roofThickness * 0.5), Number.isFinite(roof.height) ? roof.height : bodyHeight + roofThickness),
                    (roofBounds.yMin + roofBounds.yMax) * 0.5
                );
                roofMesh.scale.set(
                    Math.max(1, roofBounds.width + 1.0),
                    roofThickness,
                    Math.max(1, roofBounds.depth + 1.0)
                );
                roofMesh.castShadow = false;
                roofMesh.receiveShadow = tier !== CHUNK_TIER_FAR;
                roofMesh.userData = {
                    type: 'STRUCTURE_PROXY',
                    proxyRole: 'roof',
                    structureId: structure.structureId || null,
                    roofLandmarkId: roof.landmarkId || null,
                    z,
                    tier
                };
                planeGroup.add(roofMesh);
            }
        }
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
        const structureProxyBounds = collectStructureProxyBounds(options.stampedStructures, options.stampMap || {}, z, startX, startY, endX, endY);
        let treeCount = 0;
        let rockCount = 0;
        let wallCount = 0;
        let towerCount = 0;
        for (let y = startY; y < endY; y += stride) {
            for (let x = startX; x < endX; x += stride) {
                const tile = getVisualTileId(logicalMap[z][y][x], x, y, z);
                if (z === 0 && isTreeTileId(tile)) treeCount += 1;
                else if (z === 0 && tile === TileId.ROCK) rockCount += 1;
                else if (!isStructureProxyCoveredTile(structureProxyBounds, x, y) && tile === TileId.WALL) wallCount += 1;
                else if (!isStructureProxyCoveredTile(structureProxyBounds, x, y) && tile === TileId.TOWER) towerCount += 1;
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
            fillInstances(walls, (tile, x, y) => !isStructureProxyCoveredTile(structureProxyBounds, x, y) && tile === TileId.WALL);
            planeGroup.add(walls);
        }
        if (towerCount > 0) {
            const towers = new THREE.InstancedMesh(sharedGeometries.chunkTierTower, stoneMat, towerCount);
            towers.castShadow = false;
            towers.receiveShadow = allowReceiveShadow;
            towers.matrixAutoUpdate = false;
            fillInstances(towers, (tile, x, y) => !isStructureProxyCoveredTile(structureProxyBounds, x, y) && tile === TileId.TOWER);
            planeGroup.add(towers);
        }
        appendSimplifiedStructureProxies(options);
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
                const terrainMesh = createSimplifiedTerrainMesh(Object.assign({}, options, { startX, startY, tier }));
                if (terrainMesh) planeGroup.add(terrainMesh);
                const waterMeshes = createSimplifiedWaterMeshes(Object.assign({}, options, { startX, startY, tier }));
                waterMeshes.forEach((mesh) => planeGroup.add(mesh));
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
        createSimplifiedWaterMeshes,
        ensureChunkTierRenderAssets
    };
})();
