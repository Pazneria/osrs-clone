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
    const SIMPLIFIED_TERRAIN_SKIRT_DROP = 0.26;
    const SIMPLIFIED_TERRAIN_RUN_UNDERLAY_DROP = 0.075;
    const SIMPLIFIED_TERRAIN_RUN_UNDERLAY_OVERLAP = 0.075;
    const SIMPLIFIED_TERRAIN_BASE_UNDERLAY_DROP = 0.09;
    const SIMPLIFIED_TERRAIN_BASE_UNDERLAY_OVERLAP = 0.12;
    const SIMPLIFIED_TERRAIN_SAMPLED_UNDERLAY_DROP = 0.065;
    const SIMPLIFIED_TERRAIN_VOID_SEAL_SEGMENTS = 4;
    const SIMPLIFIED_WATER_SKIRT_DROP = 0.18;
    const SIMPLIFIED_WATER_SKIRT_UNDERLAP = 0.035;
    const SIMPLIFIED_WATER_SEAM_BACKFILL_DROP = 0.06;
    const SIMPLIFIED_WATER_SEAM_BACKFILL_OVERLAP = 0.11;
    const SIMPLIFIED_TERRAIN_HEIGHT_SEAM_EPSILON = 0.08;
    const SIMPLIFIED_TERRAIN_HEIGHT_SEAM_UNDERLAP = 0.045;
    const SIMPLIFIED_TERRAIN_MID_HEIGHT_FLATTEN = 0.46;
    const SIMPLIFIED_TERRAIN_FAR_HEIGHT_FLATTEN = 0.72;
    const SIMPLIFIED_TERRAIN_MID_HEIGHT_SAMPLE_RADIUS = 2;
    const SIMPLIFIED_TERRAIN_FAR_HEIGHT_SAMPLE_RADIUS = 4;

    function clampIndex(value, max) {
        return Math.max(0, Math.min(Math.max(0, max - 1), Math.floor(Number.isFinite(value) ? value : 0)));
    }

    function createSimplifiedTerrainHeightSampler(options = {}) {
        const MAP_SIZE = Math.max(1, Math.floor(Number.isFinite(options.MAP_SIZE) ? options.MAP_SIZE : 1));
        const CHUNK_TIER_FAR = options.CHUNK_TIER_FAR;
        const TileId = options.TileId || {};
        const logicalMap = options.logicalMap || [];
        const heightMap = options.heightMap || [];
        const tier = options.tier;
        const activePierConfig = options.activePierConfig || null;
        const getVisualTileId = typeof options.getTerrainVisualTileId === 'function'
            ? options.getTerrainVisualTileId
            : (typeof options.getVisualTileId === 'function' ? options.getVisualTileId : (tile) => tile);
        const isWaterTileId = typeof options.isWaterTileId === 'function' ? options.isWaterTileId : () => false;
        const isPierVisualCoverageTile = typeof options.isPierVisualCoverageTile === 'function'
            ? options.isPierVisualCoverageTile
            : () => false;
        const flattenFactor = tier === CHUNK_TIER_FAR
            ? SIMPLIFIED_TERRAIN_FAR_HEIGHT_FLATTEN
            : SIMPLIFIED_TERRAIN_MID_HEIGHT_FLATTEN;
        const sampleRadius = tier === CHUNK_TIER_FAR
            ? SIMPLIFIED_TERRAIN_FAR_HEIGHT_SAMPLE_RADIUS
            : SIMPLIFIED_TERRAIN_MID_HEIGHT_SAMPLE_RADIUS;
        const heightCache = new Map();

        const isInBounds = (tileX, tileY) => (
            tileX >= 0
            && tileY >= 0
            && tileX < MAP_SIZE
            && tileY < MAP_SIZE
            && logicalMap[0]
            && logicalMap[0][tileY]
        );
        const sampleRawHeightAtTile = (tileX, tileY) => {
            const x = clampIndex(tileX, MAP_SIZE);
            const y = clampIndex(tileY, MAP_SIZE);
            const value = heightMap[0] && heightMap[0][y] ? heightMap[0][y][x] : 0;
            return Number.isFinite(value) ? value : 0;
        };
        const isWaterLikeTile = (tile) => isWaterTileId(tile)
            || tile === TileId.WATER_SHALLOW
            || tile === TileId.WATER_DEEP;
        const isLandHeightSampleTile = (tileX, tileY) => {
            if (!isInBounds(tileX, tileY)) return false;
            if (isPierVisualCoverageTile(activePierConfig, tileX, tileY, 0)) return false;
            const tile = getVisualTileId(logicalMap[0][tileY][tileX], tileX, tileY, 0);
            return !isWaterLikeTile(tile);
        };
        const sampleSmoothedHeightAtTile = (tileX, tileY) => {
            const x = clampIndex(tileX, MAP_SIZE);
            const y = clampIndex(tileY, MAP_SIZE);
            const key = `${x},${y}`;
            if (heightCache.has(key)) return heightCache.get(key);
            const rawHeight = sampleRawHeightAtTile(x, y);
            let weightedHeight = 0;
            let totalWeight = 0;
            for (let ny = Math.max(0, y - sampleRadius); ny <= Math.min(MAP_SIZE - 1, y + sampleRadius); ny++) {
                for (let nx = Math.max(0, x - sampleRadius); nx <= Math.min(MAP_SIZE - 1, x + sampleRadius); nx++) {
                    if (!isLandHeightSampleTile(nx, ny)) continue;
                    const distance = Math.hypot(nx - x, ny - y);
                    if (distance > sampleRadius + 0.001) continue;
                    const weight = 1 / (1 + distance);
                    weightedHeight += sampleRawHeightAtTile(nx, ny) * weight;
                    totalWeight += weight;
                }
            }
            const smoothedHeight = totalWeight > 0 ? weightedHeight / totalWeight : rawHeight;
            const height = rawHeight + ((smoothedHeight - rawHeight) * flattenFactor);
            heightCache.set(key, height);
            return height;
        };

        return (worldX, worldY) => {
            const tileX = clampIndex(Math.floor(worldX + 0.5), MAP_SIZE);
            const tileY = clampIndex(Math.floor(worldY + 0.5), MAP_SIZE);
            return sampleSmoothedHeightAtTile(tileX, tileY);
        };
    }

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

    function ensureSimplifiedTerrainSkirtMaterial(THREE, sharedMaterials, tier, CHUNK_TIER_FAR) {
        const far = tier === CHUNK_TIER_FAR;
        const key = far ? 'chunkFarTerrainSkirt' : 'chunkMidTerrainSkirt';
        if (!sharedMaterials[key] || !sharedMaterials[key].isMeshBasicMaterial) {
            sharedMaterials[key] = new THREE.MeshBasicMaterial({
                color: far ? 0x687a3e : 0x657544,
                side: THREE.DoubleSide
            });
        }
        const material = sharedMaterials[key];
        if (material.color && typeof material.color.setHex === 'function') {
            material.color.setHex(far ? 0x687a3e : 0x657544);
        }
        if (material.map !== null) {
            material.map = null;
            material.needsUpdate = true;
        }
        material.side = THREE.DoubleSide;
        return material;
    }

    function getSimplifiedTerrainUnderlayColor(materialIndex, far) {
        const farColors = [
            0x6b7f42,
            0x6e5638,
            0x8d8159,
            0x5e5d55,
            0x61472d,
            0x62625d,
            0x684037
        ];
        const midColors = [
            0x667a3f,
            0x765c3d,
            0x9a8b63,
            0x67665d,
            0x765638,
            0x6d6d67,
            0x75463c
        ];
        const colors = far ? farColors : midColors;
        return colors[Math.max(0, Math.min(colors.length - 1, materialIndex))] || colors[0];
    }

    function ensureSimplifiedTerrainBaseUnderlayMaterial(THREE, sharedMaterials, tier, CHUNK_TIER_FAR, materialIndex) {
        const far = tier === CHUNK_TIER_FAR;
        const key = `${far ? 'chunkFar' : 'chunkMid'}TerrainBaseUnderlay${Math.max(0, materialIndex)}`;
        const color = getSimplifiedTerrainUnderlayColor(materialIndex, far);
        if (!sharedMaterials[key] || !sharedMaterials[key].isMeshBasicMaterial) {
            sharedMaterials[key] = new THREE.MeshBasicMaterial({
                color,
                side: THREE.DoubleSide
            });
        }
        const material = sharedMaterials[key];
        if (material.color && typeof material.color.setHex === 'function') material.color.setHex(color);
        if (material.map !== null) {
            material.map = null;
            material.needsUpdate = true;
        }
        material.side = THREE.DoubleSide;
        return material;
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

    function getSimplifiedWaterStyleTokens(tokens, tier, CHUNK_TIER_FAR) {
        if (tier !== CHUNK_TIER_FAR || !tokens) return tokens;
        const shallowColor = Number.isFinite(tokens.shallowColor) ? tokens.shallowColor : 0x78b3c4;
        const deepColor = Number.isFinite(tokens.deepColor) ? tokens.deepColor : 0x3f748d;
        return Object.assign({}, tokens, {
            rippleColor: shallowColor,
            highlightColor: shallowColor,
            foamColor: deepColor
        });
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
        const getVisualTileId = typeof options.getTerrainVisualTileId === 'function'
            ? options.getTerrainVisualTileId
            : (typeof options.getVisualTileId === 'function' ? options.getVisualTileId : (tile) => tile);
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
        const sampleSimplifiedTerrainHeightAtWorld = createSimplifiedTerrainHeightSampler(Object.assign({}, options, {
            activePierConfig,
            getTerrainVisualTileId: getVisualTileId,
            tier
        }));
        const chunkMaxX = Math.min(MAP_SIZE, startX + CHUNK_SIZE);
        const chunkMaxY = Math.min(MAP_SIZE, startY + CHUNK_SIZE);
        let hasLandCoverage = false;
        let hasWaterCoverage = false;
        const terrainMaterialCoverage = new Set();
        const terrainMaterialCounts = new Map();
        for (let y = startY; y < chunkMaxY; y++) {
            for (let x = startX; x < chunkMaxX; x++) {
                const tile = getVisualTileId(logicalMap[0][y][x], x, y, 0);
                if (isPierVisualCoverageTile(activePierConfig, x, y, 0) || isWaterTileId(tile) || tile === TileId.WATER_SHALLOW || tile === TileId.WATER_DEEP) {
                    hasWaterCoverage = true;
                } else {
                    hasLandCoverage = true;
                    const materialIndex = getSimplifiedTerrainMaterialIndex(tile, TileId);
                    terrainMaterialCoverage.add(materialIndex);
                    terrainMaterialCounts.set(materialIndex, (terrainMaterialCounts.get(materialIndex) || 0) + 1);
                }
            }
        }
        if (!hasLandCoverage) return null;
        const hasTerrainMaterialVariation = terrainMaterialCoverage.size > 1
            || !terrainMaterialCoverage.has(SIMPLIFIED_TERRAIN_MATERIAL_INDEX.grass);
        const terrainMaterials = ensureSimplifiedTerrainMaterialSet(THREE, sharedMaterials, tier, CHUNK_TIER_FAR);
        const meshOriginX = startX + (CHUNK_SIZE / 2) - 0.5;
        const meshOriginY = startY + (CHUNK_SIZE / 2) - 0.5;
        const sampleHeightAtWorld = sampleSimplifiedTerrainHeightAtWorld;
        const pushRunTerrainVertex = (positions, uvs, worldX, worldY, heightOffset = 0) => {
            positions.push(worldX - meshOriginX, sampleHeightAtWorld(worldX, worldY) + heightOffset, worldY - meshOriginY);
            const warpU = sampleTerrainUvWarp(sampleFractalNoise2D, worldX + 31.7, worldY - 14.3, 173.41);
            const warpV = sampleTerrainUvWarp(sampleFractalNoise2D, worldX - 48.9, worldY + 22.5, 281.73);
            uvs.push((worldX / CHUNK_SIZE) + warpU, (worldY / CHUNK_SIZE) + warpV);
        };
        const createSimplifiedTerrainRunMesh = () => {
            const materialPositions = terrainMaterials.map(() => []);
            const materialUvs = terrainMaterials.map(() => []);
            const runs = [];
            let dominantMaterialIndex = SIMPLIFIED_TERRAIN_MATERIAL_INDEX.grass;
            let dominantMaterialCount = -1;
            terrainMaterialCounts.forEach((count, materialIndex) => {
                if (count > dominantMaterialCount) {
                    dominantMaterialIndex = Math.max(0, Math.min(terrainMaterials.length - 1, materialIndex));
                    dominantMaterialCount = count;
                }
            });
            for (let y = startY; y < chunkMaxY; y++) {
                let run = null;
                for (let x = startX; x <= chunkMaxX; x++) {
                    let nextRun = null;
                    if (x < chunkMaxX) {
                        const tile = getVisualTileId(logicalMap[0][y][x], x, y, 0);
                        const waterCovered = isPierVisualCoverageTile(activePierConfig, x, y, 0)
                            || isWaterTileId(tile)
                            || tile === TileId.WATER_SHALLOW
                            || tile === TileId.WATER_DEEP;
                        if (!waterCovered) {
                            nextRun = {
                                materialIndex: Math.max(0, Math.min(
                                    terrainMaterials.length - 1,
                                    getSimplifiedTerrainMaterialIndex(tile, TileId)
                                ))
                            };
                        }
                    }
                    const nextKey = nextRun ? String(nextRun.materialIndex) : null;
                    const runKey = run ? String(run.materialIndex) : null;
                    if (run && nextKey !== runKey) {
                        const x0 = run.startX - 0.5;
                        const x1 = x - 0.5;
                        const y0 = y - 0.5;
                        const y1 = y + 0.5;
                        runs.push({
                            materialIndex: run.materialIndex,
                            x0,
                            x1,
                            y0,
                            y1
                        });
                        run = null;
                    }
                    if (!run && nextRun) {
                        run = Object.assign({ startX: x }, nextRun);
                    }
                }
            }

            const groups = new Map();
            for (let i = 0; i < runs.length; i++) {
                const run = runs[i];
                const key = [run.materialIndex, run.x0, run.x1].join('|');
                if (!groups.has(key)) groups.set(key, []);
                groups.get(key).push(run);
            }
            const appendMergedRun = (run) => {
                const positions = materialPositions[run.materialIndex];
                const uvs = materialUvs[run.materialIndex];
                pushRunTerrainVertex(positions, uvs, run.x0, run.y0);
                pushRunTerrainVertex(positions, uvs, run.x1, run.y1);
                pushRunTerrainVertex(positions, uvs, run.x1, run.y0);
                pushRunTerrainVertex(positions, uvs, run.x0, run.y0);
                pushRunTerrainVertex(positions, uvs, run.x0, run.y1);
                pushRunTerrainVertex(positions, uvs, run.x1, run.y1);
                const underlayX0 = run.x0 - SIMPLIFIED_TERRAIN_RUN_UNDERLAY_OVERLAP;
                const underlayX1 = run.x1 + SIMPLIFIED_TERRAIN_RUN_UNDERLAY_OVERLAP;
                const underlayY0 = run.y0 - SIMPLIFIED_TERRAIN_RUN_UNDERLAY_OVERLAP;
                const underlayY1 = run.y1 + SIMPLIFIED_TERRAIN_RUN_UNDERLAY_OVERLAP;
                pushRunTerrainVertex(positions, uvs, underlayX0, underlayY0, -SIMPLIFIED_TERRAIN_RUN_UNDERLAY_DROP);
                pushRunTerrainVertex(positions, uvs, underlayX1, underlayY1, -SIMPLIFIED_TERRAIN_RUN_UNDERLAY_DROP);
                pushRunTerrainVertex(positions, uvs, underlayX1, underlayY0, -SIMPLIFIED_TERRAIN_RUN_UNDERLAY_DROP);
                pushRunTerrainVertex(positions, uvs, underlayX0, underlayY0, -SIMPLIFIED_TERRAIN_RUN_UNDERLAY_DROP);
                pushRunTerrainVertex(positions, uvs, underlayX0, underlayY1, -SIMPLIFIED_TERRAIN_RUN_UNDERLAY_DROP);
                pushRunTerrainVertex(positions, uvs, underlayX1, underlayY1, -SIMPLIFIED_TERRAIN_RUN_UNDERLAY_DROP);
            };
            groups.forEach((groupRuns) => {
                groupRuns.sort((left, right) => left.y0 - right.y0);
                let merged = null;
                const flushMerged = () => {
                    if (merged) appendMergedRun(merged);
                };
                for (let i = 0; i < groupRuns.length; i++) {
                    const run = groupRuns[i];
                    if (merged && Math.abs(run.y0 - merged.y1) <= 0.0001) {
                        merged.y1 = run.y1;
                        continue;
                    }
                    flushMerged();
                    merged = Object.assign({}, run);
                }
                flushMerged();
            });

            const appendChunkVoidSeal = () => {
                const positions = materialPositions[dominantMaterialIndex] || materialPositions[SIMPLIFIED_TERRAIN_MATERIAL_INDEX.grass];
                const uvs = materialUvs[dominantMaterialIndex] || materialUvs[SIMPLIFIED_TERRAIN_MATERIAL_INDEX.grass];
                if (!positions || !uvs) return;
                const segments = SIMPLIFIED_TERRAIN_VOID_SEAL_SEGMENTS;
                const overlap = SIMPLIFIED_TERRAIN_BASE_UNDERLAY_OVERLAP;
                const x0 = startX - 0.5 - overlap;
                const x1 = chunkMaxX - 0.5 + overlap;
                const y0 = startY - 0.5 - overlap;
                const y1 = chunkMaxY - 0.5 + overlap;
                const sampleX = (vx) => x0 + ((vx / segments) * (x1 - x0));
                const sampleY = (vy) => y0 + ((vy / segments) * (y1 - y0));
                for (let vy = 0; vy < segments; vy++) {
                    for (let vx = 0; vx < segments; vx++) {
                        const cellX0 = sampleX(vx);
                        const cellX1 = sampleX(vx + 1);
                        const cellY0 = sampleY(vy);
                        const cellY1 = sampleY(vy + 1);
                        pushRunTerrainVertex(positions, uvs, cellX0, cellY0, -SIMPLIFIED_TERRAIN_SAMPLED_UNDERLAY_DROP);
                        pushRunTerrainVertex(positions, uvs, cellX1, cellY1, -SIMPLIFIED_TERRAIN_SAMPLED_UNDERLAY_DROP);
                        pushRunTerrainVertex(positions, uvs, cellX1, cellY0, -SIMPLIFIED_TERRAIN_SAMPLED_UNDERLAY_DROP);
                        pushRunTerrainVertex(positions, uvs, cellX0, cellY0, -SIMPLIFIED_TERRAIN_SAMPLED_UNDERLAY_DROP);
                        pushRunTerrainVertex(positions, uvs, cellX0, cellY1, -SIMPLIFIED_TERRAIN_SAMPLED_UNDERLAY_DROP);
                        pushRunTerrainVertex(positions, uvs, cellX1, cellY1, -SIMPLIFIED_TERRAIN_SAMPLED_UNDERLAY_DROP);
                    }
                }
            };
            appendChunkVoidSeal();

            const allPositions = [];
            const allUvs = [];
            const geometry = new THREE.BufferGeometry();
            for (let materialIndex = 0; materialIndex < materialPositions.length; materialIndex++) {
                const positions = materialPositions[materialIndex];
                const uvs = materialUvs[materialIndex];
                if (positions.length <= 0) continue;
                const groupStart = allPositions.length / 3;
                for (let i = 0; i < positions.length; i++) allPositions.push(positions[i]);
                for (let i = 0; i < uvs.length; i++) allUvs.push(uvs[i]);
                geometry.addGroup(groupStart, positions.length / 3, materialIndex);
            }
            if (allPositions.length <= 0) return null;
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(allPositions, 3));
            geometry.setAttribute('uv', new THREE.Float32BufferAttribute(allUvs, 2));
            geometry.computeVertexNormals();
            geometry.computeBoundingSphere();
            const terrainMesh = new THREE.Mesh(geometry, terrainMaterials);
            terrainMesh.position.set(meshOriginX, 0, meshOriginY);
            terrainMesh.castShadow = false;
            terrainMesh.receiveShadow = tier === CHUNK_TIER_MID;
            terrainMesh.userData = { type: 'GROUND', z: 0, tier, runMerged: true, terrainVoidSeal: true };
            return terrainMesh;
        };
        if (hasLandCoverage && (hasWaterCoverage || hasTerrainMaterialVariation)) {
            return createSimplifiedTerrainRunMesh();
        }
        const segments = hasTerrainMaterialVariation
            ? Math.min(CHUNK_SIZE, tier === CHUNK_TIER_FAR ? 16 : CHUNK_SIZE)
            : (tier === CHUNK_TIER_FAR ? 10 : 18);
        const terrainGeo = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, segments, segments);
        terrainGeo.rotateX(-Math.PI / 2);
        applyWorldSpaceTerrainUvs(terrainGeo, startX, startY, segments, CHUNK_SIZE, sampleFractalNoise2D);
        const positions = terrainGeo.attributes.position;
        for (let vy = 0; vy <= segments; vy++) {
            for (let vx = 0; vx <= segments; vx++) {
                const idx = (vy * (segments + 1)) + vx;
                const worldX = startX - 0.5 + ((vx / segments) * CHUNK_SIZE);
                const worldY = startY - 0.5 + ((vy / segments) * CHUNK_SIZE);
                positions.setY(idx, sampleSimplifiedTerrainHeightAtWorld(worldX, worldY));
            }
        }
        positions.needsUpdate = true;
        const baseTerrainIndices = terrainGeo.index ? Array.from(terrainGeo.index.array) : [];
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

    function createSimplifiedTerrainBaseUnderlayMesh(options = {}) {
        const THREE = requireThree(options.THREE);
        const CHUNK_SIZE = options.CHUNK_SIZE;
        const MAP_SIZE = options.MAP_SIZE;
        const CHUNK_TIER_FAR = options.CHUNK_TIER_FAR;
        const TileId = options.TileId || {};
        const sharedMaterials = options.sharedMaterials || {};
        const logicalMap = options.logicalMap || [];
        const heightMap = options.heightMap || [];
        const startX = options.startX;
        const startY = options.startY;
        const tier = options.tier;
        const getVisualTileId = typeof options.getTerrainVisualTileId === 'function'
            ? options.getTerrainVisualTileId
            : (typeof options.getVisualTileId === 'function' ? options.getVisualTileId : (tile) => tile);
        const isWaterTileId = typeof options.isWaterTileId === 'function' ? options.isWaterTileId : () => false;
        const isPierVisualCoverageTile = typeof options.isPierVisualCoverageTile === 'function'
            ? options.isPierVisualCoverageTile
            : () => false;
        const getActivePierConfig = typeof options.getActivePierConfig === 'function'
            ? options.getActivePierConfig
            : () => null;
        const activePierConfig = getActivePierConfig();
        const chunkMaxX = Math.min(MAP_SIZE, startX + CHUNK_SIZE);
        const chunkMaxY = Math.min(MAP_SIZE, startY + CHUNK_SIZE);
        let hasLandCoverage = false;
        let hasWaterCoverage = false;
        let minHeight = Infinity;
        const terrainMaterialCoverage = new Set();
        for (let y = startY; y < chunkMaxY; y++) {
            for (let x = startX; x < chunkMaxX; x++) {
                const tile = getVisualTileId(logicalMap[0][y][x], x, y, 0);
                const waterCovered = isPierVisualCoverageTile(activePierConfig, x, y, 0)
                    || isWaterTileId(tile)
                    || tile === TileId.WATER_SHALLOW
                    || tile === TileId.WATER_DEEP;
                if (waterCovered) {
                    hasWaterCoverage = true;
                    continue;
                }
                hasLandCoverage = true;
                terrainMaterialCoverage.add(getSimplifiedTerrainMaterialIndex(tile, TileId));
                const h = heightMap[0] && heightMap[0][y] && Number.isFinite(heightMap[0][y][x])
                    ? heightMap[0][y][x]
                    : 0;
                minHeight = Math.min(minHeight, h);
            }
        }
        const meshOriginX = startX + (CHUNK_SIZE / 2) - 0.5;
        const meshOriginY = startY + (CHUNK_SIZE / 2) - 0.5;
        if (!hasLandCoverage || hasWaterCoverage || terrainMaterialCoverage.size !== 1) return null;

        const materialIndex = Array.from(terrainMaterialCoverage)[0];
        const material = ensureSimplifiedTerrainBaseUnderlayMaterial(THREE, sharedMaterials, tier, CHUNK_TIER_FAR, materialIndex);
        const x0 = startX - 0.5 - SIMPLIFIED_TERRAIN_BASE_UNDERLAY_OVERLAP;
        const x1 = chunkMaxX - 0.5 + SIMPLIFIED_TERRAIN_BASE_UNDERLAY_OVERLAP;
        const y0 = startY - 0.5 - SIMPLIFIED_TERRAIN_BASE_UNDERLAY_OVERLAP;
        const y1 = chunkMaxY - 0.5 + SIMPLIFIED_TERRAIN_BASE_UNDERLAY_OVERLAP;
        const surfaceY = (Number.isFinite(minHeight) ? minHeight : 0) - SIMPLIFIED_TERRAIN_BASE_UNDERLAY_DROP;
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute([
            x0 - meshOriginX, surfaceY, y0 - meshOriginY,
            x1 - meshOriginX, surfaceY, y1 - meshOriginY,
            x1 - meshOriginX, surfaceY, y0 - meshOriginY,
            x0 - meshOriginX, surfaceY, y0 - meshOriginY,
            x0 - meshOriginX, surfaceY, y1 - meshOriginY,
            x1 - meshOriginX, surfaceY, y1 - meshOriginY
        ], 3));
        geometry.computeBoundingSphere();
        const underlay = new THREE.Mesh(geometry, material);
        underlay.position.set(meshOriginX, 0, meshOriginY);
        underlay.castShadow = false;
        underlay.receiveShadow = false;
        underlay.renderOrder = -1;
        underlay.userData = { type: 'GROUND_VISUAL_UNDERLAY', z: 0, tier, baseChunkUnderlay: true };
        return underlay;
    }

    function createSimplifiedTerrainSkirtMesh(options = {}) {
        const THREE = requireThree(options.THREE);
        const CHUNK_SIZE = options.CHUNK_SIZE;
        const MAP_SIZE = options.MAP_SIZE;
        const CHUNK_TIER_FAR = options.CHUNK_TIER_FAR;
        const TileId = options.TileId || {};
        const sharedMaterials = options.sharedMaterials || {};
        const logicalMap = options.logicalMap || [];
        const heightMap = options.heightMap || [];
        const waterRenderBodies = Array.isArray(options.waterRenderBodies) ? options.waterRenderBodies : [];
        const startX = options.startX;
        const startY = options.startY;
        const tier = options.tier;
        const getVisualTileId = typeof options.getTerrainVisualTileId === 'function'
            ? options.getTerrainVisualTileId
            : (typeof options.getVisualTileId === 'function' ? options.getVisualTileId : (tile) => tile);
        const isWaterTileId = typeof options.isWaterTileId === 'function' ? options.isWaterTileId : () => false;
        const isPierVisualCoverageTile = typeof options.isPierVisualCoverageTile === 'function'
            ? options.isPierVisualCoverageTile
            : () => false;
        const getActivePierConfig = typeof options.getActivePierConfig === 'function'
            ? options.getActivePierConfig
            : () => null;
        const resolveVisualWaterRenderBodyForTile = typeof options.resolveVisualWaterRenderBodyForTile === 'function'
            ? options.resolveVisualWaterRenderBodyForTile
            : () => null;
        const activePierConfig = getActivePierConfig();
        const sampleSimplifiedTerrainHeightAtWorld = createSimplifiedTerrainHeightSampler(Object.assign({}, options, {
            activePierConfig,
            getTerrainVisualTileId: getVisualTileId,
            tier
        }));
        const chunkMaxX = Math.min(MAP_SIZE, startX + CHUNK_SIZE);
        const chunkMaxY = Math.min(MAP_SIZE, startY + CHUNK_SIZE);

        const isInBounds = (x, y) => (
            x >= 0
            && y >= 0
            && x < MAP_SIZE
            && y < MAP_SIZE
            && logicalMap[0]
            && logicalMap[0][y]
        );
        const getTileAt = (x, y) => {
            if (!isInBounds(x, y)) return null;
            return getVisualTileId(logicalMap[0][y][x], x, y, 0);
        };
        const isWaterLikeTile = (tile) => isWaterTileId(tile)
            || tile === TileId.WATER_SHALLOW
            || tile === TileId.WATER_DEEP;
        const isLandAt = (x, y) => {
            const tile = getTileAt(x, y);
            if (tile === null) return false;
            if (isPierVisualCoverageTile(activePierConfig, x, y, 0)) return false;
            return !isWaterLikeTile(tile);
        };
        const sampleHeight = sampleSimplifiedTerrainHeightAtWorld;
        const sampleTileHeight = (x, y) => (
            sampleSimplifiedTerrainHeightAtWorld(x, y)
        );
        const sampleLandEdgeTop = (worldX, worldY, landX, landY) => {
            const landHeight = sampleTileHeight(landX, landY);
            return Math.max(sampleHeight(worldX, worldY), landHeight);
        };
        const getWaterSurfaceAt = (x, y) => {
            if (!isInBounds(x, y)) return null;
            const body = resolveVisualWaterRenderBodyForTile(waterRenderBodies, x, y, 0);
            return body && Number.isFinite(body.surfaceY) ? body.surfaceY : null;
        };
        const isWaterEdge = (x, y) => {
            if (!isInBounds(x, y)) return false;
            const tile = getTileAt(x, y);
            return tile !== null && (isWaterLikeTile(tile) || getWaterSurfaceAt(x, y) !== null);
        };
        const sampleBottom = (worldX, worldY, neighborX, neighborY) => {
            const topHeight = sampleHeight(worldX, worldY);
            const waterEdge = isWaterEdge(neighborX, neighborY);
            let bottom = topHeight - (waterEdge ? SIMPLIFIED_WATER_SKIRT_DROP : SIMPLIFIED_TERRAIN_SKIRT_DROP);
            const waterSurface = getWaterSurfaceAt(neighborX, neighborY);
            if (waterSurface !== null) bottom = Math.min(bottom, waterSurface - SIMPLIFIED_WATER_SKIRT_UNDERLAP);
            return bottom;
        };

        const positions = [];
        const uvs = [];
        const meshOriginX = startX + (CHUNK_SIZE / 2) - 0.5;
        const meshOriginY = startY + (CHUNK_SIZE / 2) - 0.5;
        const pushVertex = (worldX, height, worldY) => {
            positions.push(worldX - meshOriginX, height, worldY - meshOriginY);
            uvs.push(worldX / CHUNK_SIZE, worldY / CHUNK_SIZE);
        };
        const appendSegment = (x0, y0, x1, y1, landX, landY, neighborX, neighborY, bottomOverride = null) => {
            const top0 = sampleLandEdgeTop(x0, y0, landX, landY);
            const top1 = sampleLandEdgeTop(x1, y1, landX, landY);
            const bottom0 = Number.isFinite(bottomOverride)
                ? bottomOverride
                : sampleBottom(x0, y0, neighborX, neighborY);
            const bottom1 = Number.isFinite(bottomOverride)
                ? bottomOverride
                : sampleBottom(x1, y1, neighborX, neighborY);
            pushVertex(x0, top0, y0);
            pushVertex(x1, bottom1, y1);
            pushVertex(x1, top1, y1);
            pushVertex(x0, top0, y0);
            pushVertex(x0, bottom0, y0);
            pushVertex(x1, bottom1, y1);
        };
        const appendHeightSeamIfNeeded = (x0, y0, x1, y1, landX, landY, neighborX, neighborY) => {
            if (!isLandAt(neighborX, neighborY)) return;
            const landHeight = sampleTileHeight(landX, landY);
            const neighborHeight = sampleTileHeight(neighborX, neighborY);
            if (!Number.isFinite(landHeight) || !Number.isFinite(neighborHeight)) return;
            if (landHeight - neighborHeight <= SIMPLIFIED_TERRAIN_HEIGHT_SEAM_EPSILON) return;
            appendSegment(
                x0,
                y0,
                x1,
                y1,
                landX,
                landY,
                neighborX,
                neighborY,
                neighborHeight - SIMPLIFIED_TERRAIN_HEIGHT_SEAM_UNDERLAP
            );
        };

        for (let y = startY; y < chunkMaxY; y++) {
            for (let x = startX; x < chunkMaxX; x++) {
                if (!isLandAt(x, y)) continue;
                const x0 = x - 0.5;
                const x1 = x + 0.5;
                const y0 = y - 0.5;
                const y1 = y + 0.5;
                if (!isLandAt(x, y - 1)) appendSegment(x0, y0, x1, y0, x, y, x, y - 1);
                else appendHeightSeamIfNeeded(x0, y0, x1, y0, x, y, x, y - 1);
                if (!isLandAt(x + 1, y)) appendSegment(x1, y0, x1, y1, x, y, x + 1, y);
                else appendHeightSeamIfNeeded(x1, y0, x1, y1, x, y, x + 1, y);
                if (!isLandAt(x, y + 1)) appendSegment(x1, y1, x0, y1, x, y, x, y + 1);
                else appendHeightSeamIfNeeded(x1, y1, x0, y1, x, y, x, y + 1);
                if (!isLandAt(x - 1, y)) appendSegment(x0, y1, x0, y0, x, y, x - 1, y);
                else appendHeightSeamIfNeeded(x0, y1, x0, y0, x, y, x - 1, y);
            }
        }
        if (positions.length <= 0) return null;
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.computeVertexNormals();
        geometry.computeBoundingSphere();
        const mesh = new THREE.Mesh(geometry, ensureSimplifiedTerrainSkirtMaterial(THREE, sharedMaterials, tier, CHUNK_TIER_FAR));
        mesh.position.set(startX + CHUNK_SIZE / 2 - 0.5, 0, startY + CHUNK_SIZE / 2 - 0.5);
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        mesh.renderOrder = -0.85;
        mesh.userData = { type: 'GROUND_VISUAL_SKIRT', z: 0, tier };
        return mesh;
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
        const islandWater = options.islandWater || null;
        const isIslandCoastlineWaterTile = typeof options.isIslandCoastlineWaterTile === 'function'
            ? options.isIslandCoastlineWaterTile
            : () => false;
        const getVisualTileId = typeof options.getTerrainVisualTileId === 'function'
            ? options.getTerrainVisualTileId
            : (typeof options.getVisualTileId === 'function' ? options.getVisualTileId : (tile) => tile);
        const builders = new Map();
        const activePierConfig = getActivePierConfig();
        const chunkMaxX = Math.min(MAP_SIZE, startX + CHUNK_SIZE);
        const chunkMaxY = Math.min(MAP_SIZE, startY + CHUNK_SIZE);
        let hasLandCoverage = false;
        let hasWaterCoverage = false;
        let hasSuppressedCoastWaterCoverage = false;
        const suppressedCoastWaterBodyIds = new Set();
        const suppressedCoastWaterBodies = new Map();

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
        const shouldSuppressSimplifiedWaterTile = (body, x, y) => (
            body
            && islandWater
            && body.id !== 'legacy-water-fallback'
            && isIslandCoastlineWaterTile({ islandWater, MAP_SIZE }, x, y)
        );
        const shouldSuppressSimplifiedWaterRunTile = (body, x, y) => {
            if (!body) return false;
            const bodyId = body.id || 'simplified-water';
            return suppressedCoastWaterBodyIds.has(bodyId)
                || shouldSuppressSimplifiedWaterTile(body, x, y);
        };

        for (let y = startY; y < chunkMaxY; y++) {
            for (let x = startX; x < chunkMaxX; x++) {
                const tile = getVisualTileId(logicalMap[0][y][x], x, y, 0);
                const waterCovered = isWaterTileId(tile)
                    || tile === TileId.WATER_SHALLOW
                    || tile === TileId.WATER_DEEP
                    || isPierVisualCoverageTile(activePierConfig, x, y, 0);
                const body = waterCovered ? resolveVisualWaterRenderBodyForTile(waterRenderBodies, x, y, 0) : null;
                if (waterCovered && body) {
                    hasWaterCoverage = true;
                    if (shouldSuppressSimplifiedWaterTile(body, x, y)) {
                        hasSuppressedCoastWaterCoverage = true;
                        const bodyId = body.id || 'simplified-water';
                        suppressedCoastWaterBodyIds.add(bodyId);
                        suppressedCoastWaterBodies.set(bodyId, body);
                    }
                } else {
                    hasLandCoverage = true;
                }
            }
        }
        if (!hasWaterCoverage) return [];

        const appendWaterQuad = (builder, x0, x1, y0, y1, surfaceY, depthWeight, shoreStrength) => {
            const backfillY = surfaceY - SIMPLIFIED_WATER_SEAM_BACKFILL_DROP;
            const backfillX0 = x0 - SIMPLIFIED_WATER_SEAM_BACKFILL_OVERLAP;
            const backfillX1 = x1 + SIMPLIFIED_WATER_SEAM_BACKFILL_OVERLAP;
            const backfillY0 = y0 - SIMPLIFIED_WATER_SEAM_BACKFILL_OVERLAP;
            const backfillY1 = y1 + SIMPLIFIED_WATER_SEAM_BACKFILL_OVERLAP;
            builder.positions.push(
                backfillX0, backfillY, backfillY0,
                backfillX1, backfillY, backfillY1,
                backfillX1, backfillY, backfillY0,
                backfillX0, backfillY, backfillY0,
                backfillX0, backfillY, backfillY1,
                backfillX1, backfillY, backfillY1,
                x0, surfaceY, y0,
                x1, surfaceY, y1,
                x1, surfaceY, y0,
                x0, surfaceY, y0,
                x0, surfaceY, y1,
                x1, surfaceY, y1
            );
            for (let i = 0; i < 12; i++) {
                builder.waterData.push(depthWeight, shoreStrength);
            }
        };

        const appendMergedSimplifiedWaterRuns = (runs) => {
            if (!Array.isArray(runs) || runs.length <= 0) return;
            const groups = new Map();
            for (let i = 0; i < runs.length; i++) {
                const run = runs[i];
                if (!run || !run.body) continue;
                const key = [
                    run.body.id || 'simplified-water',
                    run.x0,
                    run.x1,
                    run.surfaceY,
                    run.depthWeight,
                    run.shoreStrength
                ].join('|');
                if (!groups.has(key)) groups.set(key, []);
                groups.get(key).push(run);
            }
            groups.forEach((groupRuns) => {
                groupRuns.sort((left, right) => left.y0 - right.y0);
                let merged = null;
                const flushMerged = () => {
                    if (!merged) return;
                    appendWaterQuad(
                        getBuilder(merged.body),
                        merged.x0,
                        merged.x1,
                        merged.y0,
                        merged.y1,
                        merged.surfaceY,
                        merged.depthWeight,
                        merged.shoreStrength
                    );
                };
                for (let i = 0; i < groupRuns.length; i++) {
                    const run = groupRuns[i];
                    if (
                        merged
                        && Math.abs(run.y0 - merged.y1) <= 0.0001
                    ) {
                        merged.y1 = run.y1;
                        continue;
                    }
                    flushMerged();
                    merged = Object.assign({}, run);
                }
                flushMerged();
            });
        };

        const isMixedChunk = (hasLandCoverage || hasSuppressedCoastWaterCoverage) && hasWaterCoverage;
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
        if (isMixedChunk && suppressedCoastWaterBodies.size > 0) {
            suppressedCoastWaterBodies.forEach((body) => {
                const surfaceY = (Number.isFinite(body.surfaceY) ? body.surfaceY : -0.075) - 0.028;
                appendWaterQuad(
                    getBuilder(body),
                    -CHUNK_SIZE / 2,
                    (chunkMaxX - startX) - (CHUNK_SIZE / 2),
                    -CHUNK_SIZE / 2,
                    (chunkMaxY - startY) - (CHUNK_SIZE / 2),
                    surfaceY,
                    0.82,
                    0.12
                );
            });
        }

        const mixedWaterRuns = [];
        for (let y = startY; y < chunkMaxY && isMixedChunk; y++) {
            let run = null;
            for (let x = startX; x <= chunkMaxX; x++) {
                let nextRun = null;
                if (x < chunkMaxX) {
                    const tile = getVisualTileId(logicalMap[0][y][x], x, y, 0);
                    const pierCovered = isPierVisualCoverageTile(activePierConfig, x, y, 0);
                    if (isWaterTileId(tile) || pierCovered) {
                        const body = resolveVisualWaterRenderBodyForTile(waterRenderBodies, x, y, 0);
                        if (body && !shouldSuppressSimplifiedWaterRunTile(body, x, y)) {
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
                    const x0 = run.startX - startX - (CHUNK_SIZE / 2);
                    const x1 = x - startX - (CHUNK_SIZE / 2);
                    const y0 = y - startY - (CHUNK_SIZE / 2);
                    const y1 = y + 1 - startY - (CHUNK_SIZE / 2);
                    const surfaceY = Number.isFinite(run.body.surfaceY) ? run.body.surfaceY : -0.075;
                    mixedWaterRuns.push({
                        body: run.body,
                        x0,
                        x1,
                        y0,
                        y1,
                        surfaceY,
                        depthWeight: run.depthWeight,
                        shoreStrength: run.shoreStrength
                    });
                    run = null;
                }
                if (!run && nextRun) {
                    run = Object.assign({ startX: x }, nextRun);
                }
            }
        }
        appendMergedSimplifiedWaterRuns(mixedWaterRuns);

        const meshes = [];
        builders.forEach((builder) => {
            if (!builder || builder.positions.length <= 0) return;
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(builder.positions, 3));
            geometry.setAttribute('waterData', new THREE.Float32BufferAttribute(builder.waterData, 2));
            geometry.computeBoundingSphere();
            const mesh = new THREE.Mesh(geometry, getWaterSurfaceMaterial(getSimplifiedWaterStyleTokens(builder.body.styleTokens, tier, CHUNK_TIER_FAR)));
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
                const terrainBaseUnderlayMesh = createSimplifiedTerrainBaseUnderlayMesh(Object.assign({}, options, { startX, startY, tier }));
                if (terrainBaseUnderlayMesh) planeGroup.add(terrainBaseUnderlayMesh);
                if (terrainMesh) planeGroup.add(terrainMesh);
                const terrainSkirtMesh = createSimplifiedTerrainSkirtMesh(Object.assign({}, options, { startX, startY, tier }));
                if (terrainSkirtMesh) planeGroup.add(terrainSkirtMesh);
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
        createSimplifiedTerrainBaseUnderlayMesh,
        createSimplifiedTerrainMesh,
        createSimplifiedTerrainSkirtMesh,
        createSimplifiedWaterMeshes,
        ensureChunkTierRenderAssets
    };
})();
