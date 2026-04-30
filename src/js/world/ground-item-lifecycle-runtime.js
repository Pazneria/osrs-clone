(function () {
    function getGroundItems(context) {
        return context && Array.isArray(context.groundItems) ? context.groundItems : [];
    }

    function removeEnvironmentMesh(context, mesh) {
        const environmentMeshes = context && Array.isArray(context.environmentMeshes) ? context.environmentMeshes : [];
        const index = environmentMeshes.indexOf(mesh);
        if (index !== -1) environmentMeshes.splice(index, 1);
    }

    function removeGroundItemEntryAt(context = {}, index) {
        const groundItems = getGroundItems(context);
        const entry = groundItems[index];
        if (!entry) return false;

        if (entry.mesh && entry.mesh.parent) entry.mesh.parent.remove(entry.mesh);
        else if (entry.mesh && context.scene) context.scene.remove(entry.mesh);

        if (entry.mesh && Array.isArray(entry.mesh.children)) {
            for (let i = 0; i < entry.mesh.children.length; i++) {
                removeEnvironmentMesh(context, entry.mesh.children[i]);
            }
        }

        groundItems.splice(index, 1);
        return true;
    }

    function removeGroundItemByUid(context = {}, uid) {
        const groundItems = getGroundItems(context);
        const index = groundItems.findIndex((entry) => entry && entry.uid === uid);
        if (index === -1) return false;
        return removeGroundItemEntryAt(context, index);
    }

    function updateGroundItems(context = {}) {
        const groundItems = getGroundItems(context);
        for (let i = groundItems.length - 1; i >= 0; i--) {
            const entry = groundItems[i];
            if (!entry || !Number.isFinite(entry.despawnTick)) continue;
            if (context.currentTick < entry.despawnTick) continue;
            removeGroundItemEntryAt(context, i);
        }
    }

    function addGroundItemVisual(context = {}, group, itemData) {
        return context.worldGroundItemRenderRuntime.addGroundItemVisual({
            THREE: context.THREE,
            group,
            itemData,
            createEquipmentVisualMeshes: context.createEquipmentVisualMeshes,
            createPixelSourceVisualMeshes: context.createPixelSourceVisualMeshes,
            fetchImpl: context.fetchImpl
        });
    }

    function createGroundItemUid(context) {
        const now = typeof context.now === 'function' ? context.now() : Date.now();
        const random = typeof context.random === 'function' ? context.random() : Math.random();
        return now + random;
    }

    function attachGroundItemGroup(context = {}, group, x, y, z) {
        const cx = Math.floor(x / context.chunkSize);
        const cy = Math.floor(y / context.chunkSize);
        const chunkRuntime = typeof context.getWorldChunkSceneRuntime === 'function'
            ? context.getWorldChunkSceneRuntime()
            : null;
        const chunkGroup = chunkRuntime && typeof chunkRuntime.getNearChunkGroup === 'function'
            ? chunkRuntime.getNearChunkGroup(`${cx},${cy}`)
            : null;
        if (chunkGroup) {
            const planeGroup = chunkGroup.children.find((pg) => pg.userData.z === z);
            if (planeGroup) {
                planeGroup.add(group);
                return;
            }
        }
        context.scene.add(group);
    }

    function spawnGroundItem(context = {}, itemData, x, y, z, amount = 1, options = {}) {
        const groundItems = getGroundItems(context);
        const despawnTick = Number.isFinite(options.despawnTick)
            ? options.despawnTick
            : (Number.isFinite(options.despawnTicks) ? context.currentTick + Math.max(0, Math.floor(options.despawnTicks)) : null);

        const existing = groundItems.find((entry) => (
            entry
            && entry.x === x
            && entry.y === y
            && entry.z === z
            && entry.itemData
            && itemData
            && entry.itemData.id === itemData.id
        ));
        if (existing && itemData.stackable) {
            existing.amount += amount;
            if (Number.isFinite(despawnTick)) {
                existing.despawnTick = Number.isFinite(existing.despawnTick)
                    ? Math.max(existing.despawnTick, despawnTick)
                    : despawnTick;
            }
            existing.mesh.children.forEach((child) => {
                child.userData.name = `${itemData.name} (${existing.amount})`;
            });
            return;
        }

        const THREE = context.THREE;
        const group = new THREE.Group();
        const terrainHeight = context.heightMap[z][y][x] + (z * 3.0);
        group.position.set(x, terrainHeight + 0.1, y);
        addGroundItemVisual(context, group, itemData);
        const hitbox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), context.sharedMaterials.hiddenHitbox);
        group.add(hitbox);
        const uid = createGroundItemUid(context);
        group.children.forEach((child) => {
            child.userData = {
                type: 'GROUND_ITEM',
                itemData,
                uid,
                gridX: x,
                gridY: y,
                z,
                name: amount > 1 ? `${itemData.name} (${amount})` : itemData.name
            };
            context.environmentMeshes.push(child);
        });
        attachGroundItemGroup(context, group, x, y, z);
        groundItems.push({ itemData, x, y, z, mesh: group, uid, amount, despawnTick });
    }

    function dropItem(context = {}, invIndex) {
        const inventory = Array.isArray(context.inventory) ? context.inventory : [];
        const playerState = context.playerState || {};
        const invSlot = inventory[invIndex];
        if (!invSlot) return false;
        const amount = invSlot.amount;
        inventory[invIndex] = null;
        if (context.selectedUse && context.selectedUse.invIndex === invIndex && typeof context.clearSelectedUse === 'function') {
            context.clearSelectedUse(false);
        }
        spawnGroundItem(context, invSlot.itemData, playerState.x, playerState.y, playerState.z, amount);
        if (typeof context.renderInventory === 'function') context.renderInventory();
        return true;
    }

    function takeGroundItemByUid(context = {}, uid) {
        const groundItems = getGroundItems(context);
        const entry = groundItems.find((item) => item && item.uid === uid);
        if (!entry || typeof context.giveItem !== 'function') return false;
        if (context.giveItem(entry.itemData, entry.amount) <= 0) return false;
        const removed = removeGroundItemByUid(context, entry.uid);
        if (removed && typeof context.renderInventory === 'function') context.renderInventory();
        return removed;
    }

    window.WorldGroundItemLifecycleRuntime = {
        addGroundItemVisual,
        attachGroundItemGroup,
        dropItem,
        removeGroundItemByUid,
        removeGroundItemEntryAt,
        spawnGroundItem,
        takeGroundItemByUid,
        updateGroundItems
    };
})();
