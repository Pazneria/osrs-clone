(function () {
    function requireThree(three) {
        if (!three) throw new Error('World chunk terrain runtime requires THREE.');
        return three;
    }

    function buildChunkGroundMeshes(options = {}) {
        const THREE = requireThree(options.THREE);
        const CHUNK_SIZE = options.CHUNK_SIZE;
        const MAP_SIZE = options.MAP_SIZE;
        const TileId = options.TileId || {};
        const startX = options.startX;
        const startY = options.startY;
        const logicalMap = options.logicalMap || [];
        const heightMap = options.heightMap || [];
        const sharedMaterials = options.sharedMaterials || {};
        const waterRenderBodies = Array.isArray(options.waterRenderBodies) ? options.waterRenderBodies : [];
        const activePierConfig = options.activePierConfig || null;
        const planeGroup = options.planeGroup || null;
        const environmentMeshes = Array.isArray(options.environmentMeshes) ? options.environmentMeshes : null;
        const isNaturalTileId = typeof options.isNaturalTileId === 'function' ? options.isNaturalTileId : () => false;
        const isWaterTileId = typeof options.isWaterTileId === 'function' ? options.isWaterTileId : () => false;
        const isPierVisualCoverageTile = typeof options.isPierVisualCoverageTile === 'function' ? options.isPierVisualCoverageTile : () => false;
        const getVisualTileId = typeof options.getVisualTileId === 'function' ? options.getVisualTileId : (tile) => tile;
        const getWaterSurfaceHeightForTile = typeof options.getWaterSurfaceHeightForTile === 'function'
            ? options.getWaterSurfaceHeightForTile
            : () => null;
        const sampleFractalNoise2D = typeof options.sampleFractalNoise2D === 'function'
            ? options.sampleFractalNoise2D
            : () => 0.5;

        const isNaturalTile = (tileType) => isNaturalTileId(tileType);
        const isRenderableTerrainTile = (tileType) => isNaturalTile(tileType) && !isWaterTileId(tileType);
        const isRenderableUnderlayTile = (tileType) => !isWaterTileId(tileType);
        const isManmadeLandTile = (tileType) => !isNaturalTile(tileType) && !isWaterTileId(tileType);
        const UNDERLAY_DROP = 0.08;
        const TERRAIN_EDGE_BLEND_CAP = 0.28;
        const TERRAIN_EDGE_BLEND_FACTOR = 0.4;

        const sampleTerrainVertexHeight = (cornerX, cornerY) => {
            const tx0 = Math.floor(cornerX);
            const ty0 = Math.floor(cornerY);
            const sampleTiles = [
                { x: tx0, y: ty0 },
                { x: tx0 + 1, y: ty0 },
                { x: tx0, y: ty0 + 1 },
                { x: tx0 + 1, y: ty0 + 1 }
            ];
            let sum = 0;
            let count = 0;
            let waterSum = 0;
            let waterCount = 0;
            let manmadeSum = 0;
            let manmadeCount = 0;
            for (let i = 0; i < sampleTiles.length; i++) {
                const sample = sampleTiles[i];
                if (sample.x < 0 || sample.y < 0 || sample.x >= MAP_SIZE || sample.y >= MAP_SIZE) continue;
                if (isPierVisualCoverageTile(activePierConfig, sample.x, sample.y, 0)) continue;
                const tileType = getVisualTileId(logicalMap[0][sample.y][sample.x], sample.x, sample.y, 0);
                if (isRenderableTerrainTile(tileType)) {
                    sum += heightMap[0][sample.y][sample.x];
                    count++;
                    continue;
                }
                if (isManmadeLandTile(tileType)) {
                    manmadeSum += heightMap[0][sample.y][sample.x];
                    manmadeCount++;
                }

                const waterSurfaceY = getWaterSurfaceHeightForTile(waterRenderBodies, sample.x, sample.y, 0);
                if (waterSurfaceY === null) continue;
                waterSum += waterSurfaceY;
                waterCount++;
            }
            if (count > 0 && waterCount > 0) {
                const landHeight = sum / count;
                const waterHeight = waterSum / waterCount;
                return Math.min(landHeight, waterHeight + 0.012);
            }
            if (count > 0 && manmadeCount > 0) {
                const naturalHeight = sum / count;
                const manmadeHeight = manmadeSum / manmadeCount;
                const edgeDelta = THREE.MathUtils.clamp(
                    manmadeHeight - naturalHeight,
                    -TERRAIN_EDGE_BLEND_CAP,
                    TERRAIN_EDGE_BLEND_CAP
                );
                return naturalHeight + (edgeDelta * TERRAIN_EDGE_BLEND_FACTOR);
            }
            return count > 0 ? (sum / count) : 0;
        };

        const sampleUnderlayVertexHeight = (cornerX, cornerY) => {
            const tx0 = Math.floor(cornerX);
            const ty0 = Math.floor(cornerY);
            const sampleTiles = [
                { x: tx0, y: ty0 },
                { x: tx0 + 1, y: ty0 },
                { x: tx0, y: ty0 + 1 },
                { x: tx0 + 1, y: ty0 + 1 }
            ];
            let sum = 0;
            let count = 0;
            for (let i = 0; i < sampleTiles.length; i++) {
                const sample = sampleTiles[i];
                if (sample.x < 0 || sample.y < 0 || sample.x >= MAP_SIZE || sample.y >= MAP_SIZE) continue;
                if (isPierVisualCoverageTile(activePierConfig, sample.x, sample.y, 0)) continue;
                const tileType = getVisualTileId(logicalMap[0][sample.y][sample.x], sample.x, sample.y, 0);
                if (!isRenderableUnderlayTile(tileType)) continue;
                sum += heightMap[0][sample.y][sample.x];
                count++;
            }
            if (count <= 0) return -UNDERLAY_DROP;
            return (sum / count) - UNDERLAY_DROP;
        };

        const underlayGeo = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, CHUNK_SIZE, CHUNK_SIZE);
        underlayGeo.rotateX(-Math.PI / 2);
        const underlayPositions = underlayGeo.attributes.position;
        for (let vy = 0; vy <= CHUNK_SIZE; vy++) {
            for (let vx = 0; vx <= CHUNK_SIZE; vx++) {
                const idx = (vy * (CHUNK_SIZE + 1)) + vx;
                const cornerX = startX - 0.5 + vx;
                const cornerY = startY - 0.5 + vy;
                const h = sampleUnderlayVertexHeight(cornerX, cornerY);
                underlayPositions.setY(idx, h);
            }
        }
        underlayPositions.needsUpdate = true;

        const baseUnderlayIndices = underlayGeo.index ? Array.from(underlayGeo.index.array) : [];
        const underlayIndices = [];
        for (let tileY = 0; tileY < CHUNK_SIZE; tileY++) {
            for (let tileX = 0; tileX < CHUNK_SIZE; tileX++) {
                const worldTileX = startX + tileX;
                const worldTileY = startY + tileY;
                const tile = getVisualTileId(logicalMap[0][worldTileY][worldTileX], worldTileX, worldTileY, 0);
                if (!isRenderableUnderlayTile(tile)) continue;
                if (isPierVisualCoverageTile(activePierConfig, worldTileX, worldTileY, 0)) continue;
                const cellIndexOffset = ((tileY * CHUNK_SIZE) + tileX) * 6;
                for (let i = 0; i < 6; i++) {
                    underlayIndices.push(baseUnderlayIndices[cellIndexOffset + i]);
                }
            }
        }
        underlayGeo.setIndex(underlayIndices);
        underlayGeo.computeVertexNormals();
        if (underlayIndices.length > 0) {
            const underlayMesh = new THREE.Mesh(underlayGeo, sharedMaterials.terrainUnderlay);
            underlayMesh.position.set(startX + CHUNK_SIZE / 2 - 0.5, 0, startY + CHUNK_SIZE / 2 - 0.5);
            underlayMesh.receiveShadow = false;
            underlayMesh.castShadow = false;
            underlayMesh.renderOrder = -1;
            underlayMesh.userData = { type: 'GROUND', z: 0, underlay: true };
            if (planeGroup) planeGroup.add(underlayMesh);
            if (environmentMeshes) environmentMeshes.push(underlayMesh);
        }

        const terrainGeo = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, CHUNK_SIZE, CHUNK_SIZE);
        terrainGeo.rotateX(-Math.PI / 2);

        const positions = terrainGeo.attributes.position;
        for (let vy = 0; vy <= CHUNK_SIZE; vy++) {
            for (let vx = 0; vx <= CHUNK_SIZE; vx++) {
                const idx = (vy * (CHUNK_SIZE + 1)) + vx;
                const cornerX = startX - 0.5 + vx;
                const cornerY = startY - 0.5 + vy;
                const h = sampleTerrainVertexHeight(cornerX, cornerY);
                positions.setY(idx, h);
            }
        }
        positions.needsUpdate = true;
        const baseTerrainIndices = terrainGeo.index ? Array.from(terrainGeo.index.array) : [];
        const grassTerrainIndices = [];
        const dirtTerrainIndices = [];
        for (let tileY = 0; tileY < CHUNK_SIZE; tileY++) {
            for (let tileX = 0; tileX < CHUNK_SIZE; tileX++) {
                const worldTileX = startX + tileX;
                const worldTileY = startY + tileY;
                const tile = getVisualTileId(logicalMap[0][worldTileY][worldTileX], worldTileX, worldTileY, 0);
                if (!isRenderableTerrainTile(tile)) continue;
                if (isPierVisualCoverageTile(activePierConfig, worldTileX, worldTileY, 0)) continue;
                const cellIndexOffset = ((tileY * CHUNK_SIZE) + tileX) * 6;
                const destination = (tile === TileId.DIRT || tile === TileId.ROCK) ? dirtTerrainIndices : grassTerrainIndices;
                for (let i = 0; i < 6; i++) {
                    destination.push(baseTerrainIndices[cellIndexOffset + i]);
                }
            }
        }
        const filteredTerrainIndices = grassTerrainIndices.concat(dirtTerrainIndices);
        terrainGeo.setIndex(filteredTerrainIndices);
        terrainGeo.computeVertexNormals();

        if (filteredTerrainIndices.length > 0) {
            const normals = terrainGeo.attributes.normal;
            const vertexColors = new Float32Array((CHUNK_SIZE + 1) * (CHUNK_SIZE + 1) * 3);
            for (let vy = 0; vy <= CHUNK_SIZE; vy++) {
                for (let vx = 0; vx <= CHUNK_SIZE; vx++) {
                    const idx = (vy * (CHUNK_SIZE + 1)) + vx;
                    const worldX = startX - 0.5 + vx;
                    const worldY = startY - 0.5 + vy;
                    const macro = sampleFractalNoise2D(worldX * 0.12, worldY * 0.12, 29.71, 3, 2.0, 0.55);
                    const tint = sampleFractalNoise2D((worldX + 64) * 0.28, (worldY - 48) * 0.28, 83.17, 2, 2.0, 0.5);
                    const normalY = normals ? normals.getY(idx) : 1;
                    const slope = 1 - THREE.MathUtils.clamp(normalY, 0, 1);
                    const shade = THREE.MathUtils.clamp(0.85 + ((macro - 0.5) * 0.24) - (slope * 0.18), 0.62, 1.05);
                    const hueShift = (tint - 0.5) * 0.12;
                    const colorIndex = idx * 3;
                    vertexColors[colorIndex] = THREE.MathUtils.clamp(shade * (0.95 - (hueShift * 0.72)), 0, 1);
                    vertexColors[colorIndex + 1] = THREE.MathUtils.clamp(shade * (1.02 + (hueShift * 0.25)), 0, 1);
                    vertexColors[colorIndex + 2] = THREE.MathUtils.clamp(shade * (0.89 - (hueShift * 0.62)), 0, 1);
                }
            }
            terrainGeo.setAttribute('color', new THREE.Float32BufferAttribute(vertexColors, 3));

            let terrainMaterial = sharedMaterials.grassTile;
            if (grassTerrainIndices.length > 0 && dirtTerrainIndices.length > 0) {
                terrainGeo.clearGroups();
                terrainGeo.addGroup(0, grassTerrainIndices.length, 0);
                terrainGeo.addGroup(grassTerrainIndices.length, dirtTerrainIndices.length, 1);
                terrainMaterial = [sharedMaterials.grassTile, sharedMaterials.dirtTile];
            } else if (dirtTerrainIndices.length > 0) {
                terrainMaterial = sharedMaterials.dirtTile;
            }

            const terrainMesh = new THREE.Mesh(terrainGeo, terrainMaterial);
            terrainMesh.position.set(startX + CHUNK_SIZE / 2 - 0.5, 0, startY + CHUNK_SIZE / 2 - 0.5);
            terrainMesh.receiveShadow = true;
            terrainMesh.castShadow = false;
            terrainMesh.userData = { type: 'GROUND', z: 0 };
            if (planeGroup) planeGroup.add(terrainMesh);
            if (environmentMeshes) environmentMeshes.push(terrainMesh);
        }
    }

    window.WorldChunkTerrainRuntime = {
        buildChunkGroundMeshes
    };
})();
