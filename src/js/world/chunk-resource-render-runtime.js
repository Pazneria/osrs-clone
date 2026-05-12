(function () {
    function requireThree(three) {
        if (!three) throw new Error('World chunk resource render runtime requires THREE.');
        return three;
    }

    function createEmptyResourceVisualCounts() {
        return {
            treeCount: 0,
            rockVisualCounts: Object.create(null)
        };
    }

    function countChunkResourceVisualTile(counts, options = {}, tile, x, y, z) {
        const targetCounts = counts || createEmptyResourceVisualCounts();
        const TileId = options.TileId || {};
        const isTreeTileId = typeof options.isTreeTileId === 'function' ? options.isTreeTileId : () => false;
        const getRockNodeAt = typeof options.getRockNodeAt === 'function' ? options.getRockNodeAt : () => null;
        const getRockVisualIdForNode = typeof options.getRockVisualIdForNode === 'function' ? options.getRockVisualIdForNode : () => 'copper';
        const currentTick = Number.isFinite(options.currentTick) ? options.currentTick : 0;
        if (isTreeTileId(tile)) {
            targetCounts.treeCount += 1;
            return targetCounts;
        }
        if (tile === TileId.ROCK) {
            const rockNode = getRockNodeAt(x, y, z);
            const depleted = !!(rockNode && rockNode.depletedUntilTick > currentTick);
            const visualId = getRockVisualIdForNode(rockNode, depleted);
            targetCounts.rockVisualCounts[visualId] = (targetCounts.rockVisualCounts[visualId] || 0) + 1;
        }
        return targetCounts;
    }

    function collectChunkResourceVisualCounts(options = {}) {
        const counts = createEmptyResourceVisualCounts();
        const logicalMap = options.logicalMap || [];
        const getVisualTileId = typeof options.getVisualTileId === 'function' ? options.getVisualTileId : (tile) => tile;
        const z = options.z;
        const startX = options.startX;
        const startY = options.startY;
        const endX = options.endX;
        const endY = options.endY;
        if (!logicalMap[z]) return counts;

        for (let y = startY; y < endY; y++) {
            if (!logicalMap[z][y]) continue;
            for (let x = startX; x < endX; x++) {
                const tile = getVisualTileId(logicalMap[z][y][x], x, y, z);
                countChunkResourceVisualTile(counts, options, tile, x, y, z);
            }
        }
        return counts;
    }

    function createChunkResourceRenderState(options = {}) {
        const createTreeRenderData = typeof options.createTreeRenderData === 'function'
            ? options.createTreeRenderData
            : () => null;
        const createRockRenderData = typeof options.createRockRenderData === 'function'
            ? options.createRockRenderData
            : () => null;
        const counts = options.counts || createEmptyResourceVisualCounts();
        return {
            treeData: createTreeRenderData(counts.treeCount || 0, options.planeGroup),
            treeIndex: 0,
            rockData: createRockRenderData(counts.rockVisualCounts || Object.create(null), options.planeGroup),
            rockVisualIndices: Object.create(null)
        };
    }

    function sampleGroundTileCenterHeight(options = {}, tileX, tileY, layerZ) {
        const heightMap = options.heightMap || [];
        const logicalMap = options.logicalMap || [];
        const mapSize = Number.isFinite(options.mapSize) ? options.mapSize : 0;
        const activePierConfig = options.activePierConfig || null;
        const isPierVisualCoverageTile = typeof options.isPierVisualCoverageTile === 'function' ? options.isPierVisualCoverageTile : () => false;
        const getVisualTileId = typeof options.getVisualTileId === 'function' ? options.getVisualTileId : (tile) => tile;
        const isWaterTileId = typeof options.isWaterTileId === 'function' ? options.isWaterTileId : () => false;
        if (!heightMap[layerZ] || !heightMap[layerZ][tileY]) return 0;
        if (layerZ !== 0 || tileX <= 0 || tileY <= 0 || tileX >= mapSize - 1 || tileY >= mapSize - 1) {
            return heightMap[layerZ][tileY][tileX];
        }

        let weightedSum = 0;
        let weightedWeight = 0;
        for (let oy = -1; oy <= 1; oy++) {
            for (let ox = -1; ox <= 1; ox++) {
                const nx = tileX + ox;
                const ny = tileY + oy;
                if (nx < 0 || ny < 0 || nx >= mapSize || ny >= mapSize) continue;
                if (isPierVisualCoverageTile(activePierConfig, nx, ny, 0)) continue;
                if (!logicalMap[0] || !logicalMap[0][ny]) continue;
                const tileType = getVisualTileId(logicalMap[0][ny][nx], nx, ny, 0);
                if (isWaterTileId(tileType)) continue;
                const weight = (ox === 0 && oy === 0) ? 0.25 : ((ox === 0 || oy === 0) ? 0.125 : 0.0625);
                weightedSum += heightMap[0][ny][nx] * weight;
                weightedWeight += weight;
            }
        }

        if (weightedWeight > 0) return weightedSum / weightedWeight;
        return heightMap[layerZ][tileY][tileX];
    }

    function appendChunkResourceVisual(options = {}) {
        const THREE = requireThree(options.THREE);
        const TileId = options.TileId || {};
        const state = options.state || {};
        const logicalMap = options.logicalMap || [];
        const heightMap = options.heightMap || [];
        const getVisualTileId = typeof options.getVisualTileId === 'function' ? options.getVisualTileId : (tile) => tile;
        const isTreeTileId = typeof options.isTreeTileId === 'function' ? options.isTreeTileId : () => false;
        const getTreeNodeAt = typeof options.getTreeNodeAt === 'function' ? options.getTreeNodeAt : () => null;
        const getRockNodeAt = typeof options.getRockNodeAt === 'function' ? options.getRockNodeAt : () => null;
        const getRockVisualIdForNode = typeof options.getRockVisualIdForNode === 'function' ? options.getRockVisualIdForNode : () => 'copper';
        const getRockDisplayName = typeof options.getRockDisplayName === 'function' ? options.getRockDisplayName : (oreType) => oreType;
        const setTreeVisualState = typeof options.setTreeVisualState === 'function' ? options.setTreeVisualState : () => {};
        const setRockVisualState = typeof options.setRockVisualState === 'function' ? options.setRockVisualState : () => false;
        const hash2D = typeof options.hash2D === 'function' ? options.hash2D : () => 0;
        const currentTick = Number.isFinite(options.currentTick) ? options.currentTick : 0;
        const x = options.x;
        const y = options.y;
        const z = options.z;
        const zOffset = Number.isFinite(options.zOffset) ? options.zOffset : 0;
        if (!logicalMap[z] || !logicalMap[z][y]) return false;
        const tile = getVisualTileId(logicalMap[z][y][x], x, y, z);
        const tileHeight = heightMap[z] && heightMap[z][y] ? heightMap[z][y][x] : 0;

        if (isTreeTileId(tile)) {
            const treeNode = getTreeNodeAt(x, y, z);
            const treeNodeId = treeNode && treeNode.nodeId ? treeNode.nodeId : 'normal_tree';
            const dummyTransform = options.dummyTransform || new THREE.Object3D();
            dummyTransform.position.set(x, tileHeight + zOffset, y);
            dummyTransform.rotation.set(0, hash2D(x, y, 331.71) * Math.PI * 2, 0);
            setTreeVisualState(state.treeData, state.treeIndex, {
                nodeId: treeNodeId,
                position: dummyTransform.position.clone(),
                quaternion: dummyTransform.quaternion.clone(),
                isStump: tile === TileId.STUMP
            });
            if (state.treeData && Array.isArray(state.treeData.treeMap)) {
                state.treeData.treeMap[state.treeIndex] = { type: 'TREE', gridX: x, gridY: y, z, nodeId: treeNodeId };
            }
            state.treeIndex += 1;
            return true;
        }

        if (tile === TileId.ROCK) {
            const rockNode = getRockNodeAt(x, y, z);
            const depleted = !!(rockNode && rockNode.depletedUntilTick > currentTick);
            const rockGroundY = sampleGroundTileCenterHeight(options, x, y, z) + zOffset - 0.01;
            const oreType = depleted ? 'depleted' : ((rockNode && rockNode.oreType) ? rockNode.oreType : 'copper');
            const visualId = getRockVisualIdForNode(rockNode, depleted);
            const rockIndex = state.rockVisualIndices[visualId] || 0;
            const rockUpdated = setRockVisualState(state.rockData, visualId, rockIndex, {
                dummyTransform: options.dummyTransform,
                x,
                y,
                z,
                groundY: rockGroundY,
                rotationY: hash2D(x, y, 702.17) * Math.PI * 2,
                oreType,
                name: depleted ? 'Depleted rock' : getRockDisplayName(oreType)
            });
            if (rockUpdated) {
                state.rockVisualIndices[visualId] = rockIndex + 1;
            }
            return true;
        }

        return false;
    }

    function markChunkResourceVisualsDirty(options = {}) {
        const state = options.state || {};
        const markTreeVisualsDirty = typeof options.markTreeVisualsDirty === 'function' ? options.markTreeVisualsDirty : () => {};
        const markRockVisualsDirty = typeof options.markRockVisualsDirty === 'function' ? options.markRockVisualsDirty : () => {};
        if (state.treeIndex > 0) markTreeVisualsDirty(state.treeData);
        markRockVisualsDirty(state.rockData);
    }

    function setChunkTreeStumpVisual(options = {}) {
        const THREE = requireThree(options.THREE);
        const planeGroup = options.planeGroup || null;
        const heightMap = options.heightMap || [];
        const gridX = options.gridX;
        const gridY = options.gridY;
        const z = options.z;
        const isStump = options.isStump === true;
        const getTreeNodeAt = typeof options.getTreeNodeAt === 'function' ? options.getTreeNodeAt : () => null;
        const setTreeVisualState = typeof options.setTreeVisualState === 'function' ? options.setTreeVisualState : () => {};
        const markTreeVisualsDirty = typeof options.markTreeVisualsDirty === 'function' ? options.markTreeVisualsDirty : () => {};
        if (!planeGroup || !planeGroup.userData || !planeGroup.userData.trees || !planeGroup.userData.trees.iTrunk) return false;

        const treeData = planeGroup.userData.trees;
        const treeIndex = treeData.treeMap.findIndex((entry) => entry && entry.gridX === gridX && entry.gridY === gridY);
        if (treeIndex === -1) return false;

        const treeEntry = treeData.treeMap[treeIndex] || {};
        const treeNode = getTreeNodeAt(gridX, gridY, z);
        const treeNodeId = treeEntry.nodeId || (treeNode && treeNode.nodeId ? treeNode.nodeId : 'normal_tree');
        const matrix = new THREE.Matrix4();
        const quaternion = new THREE.Quaternion();
        treeData.iTrunk.getMatrixAt(treeIndex, matrix);
        matrix.decompose(new THREE.Vector3(), quaternion, new THREE.Vector3());
        const tileHeight = heightMap[z] && heightMap[z][gridY] ? heightMap[z][gridY][gridX] : 0;
        const basePosition = new THREE.Vector3(gridX, tileHeight + (z * 3.0), gridY);
        setTreeVisualState(treeData, treeIndex, { nodeId: treeNodeId, position: basePosition, quaternion, isStump });
        markTreeVisualsDirty(treeData);
        return true;
    }

    window.WorldChunkResourceRenderRuntime = {
        appendChunkResourceVisual,
        collectChunkResourceVisualCounts,
        countChunkResourceVisualTile,
        createChunkResourceRenderState,
        createEmptyResourceVisualCounts,
        markChunkResourceVisualsDirty,
        sampleGroundTileCenterHeight,
        setChunkTreeStumpVisual
    };
})();
