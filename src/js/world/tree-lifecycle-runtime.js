(function () {
    const DEFAULT_TREE_RESPAWN_TICKS = 18;
    const DEFAULT_STUMP_TILE_ID = 4;
    const DEFAULT_TREE_TILE_ID = 1;

    function getRespawningTrees(context = {}) {
        return Array.isArray(context.respawningTrees) ? context.respawningTrees : [];
    }

    function resolveTreeRespawnTicks(context = {}, gridX, gridY, z) {
        const registry = context.skillSpecRegistry || window.SkillSpecRegistry || null;
        if (!registry || typeof registry.getNodeTable !== 'function') return DEFAULT_TREE_RESPAWN_TICKS;
        const nodeTable = registry.getNodeTable('woodcutting');
        if (!nodeTable) return DEFAULT_TREE_RESPAWN_TICKS;

        const treeNode = typeof context.getTreeNodeAt === 'function'
            ? context.getTreeNodeAt(gridX, gridY, z)
            : null;
        const nodeId = treeNode && treeNode.nodeId ? treeNode.nodeId : 'normal_tree';
        const nodeSpec = nodeTable[nodeId] || nodeTable.normal_tree;
        if (!nodeSpec || !Number.isFinite(nodeSpec.respawnTicks)) return DEFAULT_TREE_RESPAWN_TICKS;
        return Math.max(1, Math.floor(nodeSpec.respawnTicks));
    }

    function getLoadedPlaneGroup(context = {}, gridX, gridY, z) {
        const chunkSize = Number.isFinite(context.chunkSize) ? context.chunkSize : 1;
        const cx = Math.floor(gridX / chunkSize);
        const cy = Math.floor(gridY / chunkSize);
        const chunkRuntime = typeof context.getWorldChunkSceneRuntime === 'function'
            ? context.getWorldChunkSceneRuntime()
            : null;
        const group = chunkRuntime && typeof chunkRuntime.getNearChunkGroup === 'function'
            ? chunkRuntime.getNearChunkGroup(`${cx},${cy}`)
            : null;
        if (!group || !Array.isArray(group.children)) return null;
        return group.children.find((child) => child && child.userData && child.userData.z === z) || null;
    }

    function updateTreeStumpVisual(context = {}, gridX, gridY, z, isStump) {
        const planeGroup = getLoadedPlaneGroup(context, gridX, gridY, z);
        const resourceRuntime = context.worldChunkResourceRenderRuntime || null;
        if (!planeGroup || !resourceRuntime || typeof resourceRuntime.setChunkTreeStumpVisual !== 'function') return false;
        resourceRuntime.setChunkTreeStumpVisual({
            THREE: context.THREE,
            planeGroup,
            heightMap: context.heightMap,
            gridX,
            gridY,
            z,
            isStump,
            getTreeNodeAt: context.getTreeNodeAt,
            setTreeVisualState: context.setTreeVisualState,
            markTreeVisualsDirty: context.markTreeVisualsDirty
        });
        return true;
    }

    function setLogicalTreeTile(context = {}, gridX, gridY, z, tileId) {
        const logicalMap = context.logicalMap || [];
        if (!logicalMap[z] || !logicalMap[z][gridY]) return false;
        logicalMap[z][gridY][gridX] = tileId;
        return true;
    }

    function chopDownTree(context = {}, gridX, gridY, z) {
        const respawnTicks = resolveTreeRespawnTicks(context, gridX, gridY, z);
        updateTreeStumpVisual(context, gridX, gridY, z, true);
        const stumpTileId = context.tileIds && Number.isFinite(context.tileIds.DIRT)
            ? context.tileIds.DIRT
            : DEFAULT_STUMP_TILE_ID;
        setLogicalTreeTile(context, gridX, gridY, z, stumpTileId);
        getRespawningTrees(context).push({
            x: gridX,
            y: gridY,
            z,
            respawnTick: context.currentTick + respawnTicks
        });
    }

    function respawnTree(context = {}, gridX, gridY, z) {
        updateTreeStumpVisual(context, gridX, gridY, z, false);
        const treeTileId = context.tileIds && Number.isFinite(context.tileIds.GRASS)
            ? context.tileIds.GRASS
            : DEFAULT_TREE_TILE_ID;
        setLogicalTreeTile(context, gridX, gridY, z, treeTileId);
    }

    function tickTreeLifecycle(context = {}) {
        const respawningTrees = getRespawningTrees(context);
        const currentTick = Number.isFinite(context.currentTick) ? context.currentTick : 0;
        let respawned = 0;
        for (let i = respawningTrees.length - 1; i >= 0; i--) {
            const entry = respawningTrees[i];
            if (!entry || currentTick < entry.respawnTick) continue;
            respawnTree(context, entry.x, entry.y, entry.z);
            respawningTrees.splice(i, 1);
            respawned++;
        }
        return respawned;
    }

    window.WorldTreeLifecycleRuntime = {
        chopDownTree,
        resolveTreeRespawnTicks,
        respawnTree,
        tickTreeLifecycle,
        updateTreeStumpVisual
    };
})();
