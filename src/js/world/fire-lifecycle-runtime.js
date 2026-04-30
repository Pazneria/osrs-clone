(function () {
    let activeFiremakingLogPreview = null;

    const FIRE_STEP_DIR = { x: 0, y: 1 };

    function getActiveFires(context) {
        return context && Array.isArray(context.activeFires) ? context.activeFires : [];
    }

    function isFireOccupiedAt(context = {}, x, y, z) {
        return getActiveFires(context).some((fire) => fire && fire.x === x && fire.y === y && fire.z === z);
    }

    function createFireVisualAt(context = {}, x, y, z) {
        return context.worldFireRenderRuntime.createFireVisual({
            THREE: context.THREE,
            x,
            y,
            z,
            terrainHeight: context.heightMap[z][y][x] + (z * 3.0)
        });
    }

    function createFiremakingLogPreviewAt(context = {}, x, y, z, itemId) {
        const itemData = context.ITEM_DB && typeof itemId === 'string' ? context.ITEM_DB[itemId] : null;
        return context.worldFireRenderRuntime.createFiremakingLogPreview({
            THREE: context.THREE,
            x,
            y,
            z,
            terrainHeight: context.heightMap[z][y][x] + (z * 3.0),
            itemData,
            getItemIconSpritePath: context.worldGroundItemRenderRuntime.getItemIconSpritePath,
            addGroundItemSprite(group, path, yOffset, scale) {
                return context.worldGroundItemRenderRuntime.addGroundItemSprite({
                    THREE: context.THREE,
                    group,
                    path,
                    y: yOffset,
                    scale
                });
            }
        });
    }

    function attachFireVisualGroup(context = {}, group, x, y, z, preferChunkParent = true) {
        if (preferChunkParent) {
            const cx = Math.floor(x / context.chunkSize);
            const cy = Math.floor(y / context.chunkSize);
            const chunkRuntime = typeof context.getWorldChunkSceneRuntime === 'function'
                ? context.getWorldChunkSceneRuntime()
                : null;
            const chunkGroup = chunkRuntime && typeof chunkRuntime.getNearChunkGroup === 'function'
                ? chunkRuntime.getNearChunkGroup(`${cx},${cy}`)
                : null;
            if (chunkGroup) {
                const pGroup = chunkGroup.children.find((pg) => pg.userData.z === z);
                if (pGroup) {
                    pGroup.add(group);
                    return;
                }
            }
        }
        context.scene.add(group);
    }

    function removeFiremakingLogPreview(context = {}) {
        if (!activeFiremakingLogPreview) return;
        const preview = activeFiremakingLogPreview;
        if (preview.mesh && preview.mesh.parent) preview.mesh.parent.remove(preview.mesh);
        else if (preview.mesh && context.scene) context.scene.remove(preview.mesh);
        activeFiremakingLogPreview = null;
    }

    function syncFiremakingLogPreview(context = {}) {
        const playerState = context.playerState;
        const session = playerState && playerState.firemakingSession ? playerState.firemakingSession : null;
        const target = session && session.target && typeof session.target === 'object' ? session.target : null;
        const shouldShow = !!(
            context.scene
            && session
            && session.phase === 'attempting'
            && playerState.action === 'SKILLING: FIREMAKING'
            && target
            && Number.isFinite(target.x)
            && Number.isFinite(target.y)
            && Number.isFinite(target.z)
            && !isFireOccupiedAt(context, target.x, target.y, target.z)
        );

        if (!shouldShow) {
            removeFiremakingLogPreview(context);
            return;
        }

        const itemId = typeof session.sourceItemId === 'string' && session.sourceItemId ? session.sourceItemId : 'logs';
        if (
            activeFiremakingLogPreview
            && activeFiremakingLogPreview.x === target.x
            && activeFiremakingLogPreview.y === target.y
            && activeFiremakingLogPreview.z === target.z
            && activeFiremakingLogPreview.itemId === itemId
        ) {
            return;
        }

        removeFiremakingLogPreview(context);
        const mesh = createFiremakingLogPreviewAt(context, target.x, target.y, target.z, itemId);
        attachFireVisualGroup(context, mesh, target.x, target.y, target.z, true);
        activeFiremakingLogPreview = { x: target.x, y: target.y, z: target.z, itemId, mesh };
    }

    function spawnFireAtTile(context = {}, x, y, z, options = {}) {
        const activeFires = getActiveFires(context);
        if (isFireOccupiedAt(context, x, y, z)) return false;
        if (!context.scene) return false;
        if (activeFiremakingLogPreview && activeFiremakingLogPreview.x === x && activeFiremakingLogPreview.y === y && activeFiremakingLogPreview.z === z) {
            removeFiremakingLogPreview(context);
        }

        const fireVisual = createFireVisualAt(context, x, y, z);
        const expiresTick = Number.isFinite(options.expiresTick)
            ? options.expiresTick
            : context.currentTick + context.fireLifetimeTicks;
        const preferChunkParent = options.preferChunkParent !== false;

        attachFireVisualGroup(context, fireVisual.group, x, y, z, preferChunkParent);
        context.environmentMeshes.push(...fireVisual.hitMeshes);
        activeFires.push({
            x,
            y,
            z,
            mesh: fireVisual.group,
            flame: fireVisual.flame,
            hitMeshes: fireVisual.hitMeshes,
            expiresTick,
            phase: Math.random() * Math.PI * 2,
            routeId: options.routeId || null
        });
        return true;
    }

    function seedCookingTrainingFires(context = {}) {
        const spots = Array.isArray(context.cookingFireSpotsToRender) ? context.cookingFireSpotsToRender : [];
        if (spots.length === 0) return;
        for (let i = 0; i < spots.length; i++) {
            const spot = spots[i];
            if (!spot) continue;
            spawnFireAtTile(context, spot.x, spot.y, spot.z, {
                expiresTick: Number.POSITIVE_INFINITY,
                preferChunkParent: false,
                routeId: spot.routeId || null
            });
        }
    }

    function lightFireAtCurrentTile(context = {}, x, y, z) {
        const playerState = context.playerState || {};
        x = Number.isFinite(x) ? Math.floor(x) : playerState.x;
        y = Number.isFinite(y) ? Math.floor(y) : playerState.y;
        z = Number.isFinite(z) ? Math.floor(z) : playerState.z;

        if (isFireOccupiedAt(context, x, y, z)) {
            if (typeof context.addChatMessage === 'function') context.addChatMessage('There is already a fire here.', 'warn');
            return false;
        }

        return spawnFireAtTile(context, x, y, z, {
            expiresTick: context.currentTick + context.fireLifetimeTicks,
            preferChunkParent: true
        });
    }

    function expireFireAtIndex(context = {}, index) {
        const activeFires = getActiveFires(context);
        const fire = activeFires[index];
        if (!fire) return false;

        if (fire.mesh && fire.mesh.parent) fire.mesh.parent.remove(fire.mesh);
        else if (fire.mesh && context.scene) context.scene.remove(fire.mesh);

        if (Array.isArray(fire.hitMeshes)) {
            for (let j = 0; j < fire.hitMeshes.length; j++) {
                const idx = context.environmentMeshes.indexOf(fire.hitMeshes[j]);
                if (idx !== -1) context.environmentMeshes.splice(idx, 1);
            }
        }

        const ashesItem = context.ITEM_DB && context.ITEM_DB.ashes ? context.ITEM_DB.ashes : null;
        if (ashesItem && typeof context.spawnGroundItem === 'function') {
            context.spawnGroundItem(ashesItem, fire.x, fire.y, fire.z, 1, {
                despawnTicks: context.ashesDespawnTicks
            });
        }

        activeFires.splice(index, 1);
        return true;
    }

    function tickFireLifecycle(context = {}) {
        const activeFires = getActiveFires(context);
        for (let i = activeFires.length - 1; i >= 0; i--) {
            const fire = activeFires[i];
            if (!fire || context.currentTick < fire.expiresTick) continue;
            expireFireAtIndex(context, i);
        }
    }

    function updateFires(context = {}, frameNow) {
        tickFireLifecycle(context);
        syncFiremakingLogPreview(context);
        const activeFires = getActiveFires(context);
        for (let i = 0; i < activeFires.length; i++) {
            const fire = activeFires[i];
            context.worldFireRenderRuntime.updateFireFlameVisual(fire, frameNow);
        }
    }

    function findFireStepDestination(context = {}) {
        const playerState = context.playerState;
        const z = playerState.z;
        const currentH = context.heightMap[z][playerState.y][playerState.x];
        const candidates = [
            { direction: 'east', x: playerState.x + FIRE_STEP_DIR.x, y: playerState.y + FIRE_STEP_DIR.y },
            { direction: 'west', x: playerState.x - FIRE_STEP_DIR.x, y: playerState.y - FIRE_STEP_DIR.y }
        ];
        const failureReasons = [];

        for (let i = 0; i < candidates.length; i++) {
            const candidate = candidates[i];
            const nx = candidate.x;
            const ny = candidate.y;

            if (nx < 0 || ny < 0 || nx >= context.mapSize || ny >= context.mapSize) {
                failureReasons.push('out_of_bounds');
                continue;
            }
            if (!context.isWalkableTileId(context.logicalMap[z][ny][nx])) {
                failureReasons.push('blocked_tile');
                continue;
            }

            const nextH = context.heightMap[z][ny][nx];
            const tileIsRamp = context.logicalMap[z][playerState.y][playerState.x] === context.TileId.STAIRS_RAMP
                || context.logicalMap[z][ny][nx] === context.TileId.STAIRS_RAMP;
            if (Math.abs(nextH - currentH) > 0.3 && !tileIsRamp) {
                failureReasons.push('height_mismatch');
                continue;
            }

            if (isFireOccupiedAt(context, nx, ny, z)) {
                failureReasons.push('fire_occupied');
                continue;
            }

            return { stepped: true, direction: candidate.direction, x: nx, y: ny };
        }

        let reason = 'blocked_tile';
        if (failureReasons.includes('fire_occupied')) reason = 'fire_occupied';
        else if (failureReasons.includes('height_mismatch')) reason = 'height_mismatch';
        else if (failureReasons.includes('out_of_bounds')) reason = 'out_of_bounds';

        return { stepped: false, reason };
    }

    function applyFireStepDestination(context = {}, stepResult) {
        if (!stepResult || !stepResult.stepped) return stepResult;
        const playerState = context.playerState;
        playerState.prevX = playerState.x;
        playerState.prevY = playerState.y;
        playerState.x = stepResult.x;
        playerState.y = stepResult.y;
        playerState.targetX = stepResult.x;
        playerState.targetY = stepResult.y;
        playerState.midX = null;
        playerState.midY = null;
        playerState.path = [];
        return stepResult;
    }

    function tryStepAfterFire(context = {}) {
        return applyFireStepDestination(context, findFireStepDestination(context));
    }

    function tryStepBeforeFiremaking(context = {}) {
        return applyFireStepDestination(context, findFireStepDestination(context));
    }

    function startFiremaking(context = {}, sourceItemId = null) {
        const skillRuntime = context.SkillRuntime || (window ? window.SkillRuntime : null);
        if (!(skillRuntime && typeof skillRuntime.tryStartSkillById === 'function')) return false;
        const payload = { skillId: 'firemaking' };
        if (typeof sourceItemId === 'string' && sourceItemId) payload.sourceItemId = sourceItemId;
        return skillRuntime.tryStartSkillById('firemaking', payload);
    }

    function getFiremakingLogItemIdForPair(context = {}, itemA, itemB) {
        const a = String(itemA || '');
        const b = String(itemB || '');
        if (!a || !b) return null;

        const skillSpecRegistry = context.SkillSpecRegistry || (window ? window.SkillSpecRegistry : null);
        const firemakingRecipes = (skillSpecRegistry && typeof skillSpecRegistry.getRecipeSet === 'function')
            ? skillSpecRegistry.getRecipeSet('firemaking')
            : null;
        if (!firemakingRecipes || typeof firemakingRecipes !== 'object') return null;

        const logItemIds = new Set();
        const recipeIds = Object.keys(firemakingRecipes);
        for (let i = 0; i < recipeIds.length; i++) {
            const recipe = firemakingRecipes[recipeIds[i]];
            const sourceItemId = typeof (recipe && recipe.sourceItemId) === 'string' ? recipe.sourceItemId : '';
            if (sourceItemId) logItemIds.add(sourceItemId);
        }

        if (a === 'tinderbox' && logItemIds.has(b)) return b;
        if (b === 'tinderbox' && logItemIds.has(a)) return a;
        return null;
    }

    function resolveFireTargetFromHit(context = {}, hitData) {
        const activeFires = getActiveFires(context);
        if (!hitData || activeFires.length === 0) return null;

        const z = context.playerState.z;
        let x = Number.isInteger(hitData.gridX) ? hitData.gridX : null;
        let y = Number.isInteger(hitData.gridY) ? hitData.gridY : null;

        if ((x === null || y === null) && hitData.point) {
            x = Math.floor(hitData.point.x + 0.5);
            y = Math.floor(hitData.point.z + 0.5);
        }

        if (x !== null && y !== null) {
            const direct = activeFires.find((f) => f.x === x && f.y === y && f.z === z) || null;
            if (direct) return { x: direct.x, y: direct.y, z: direct.z };
        }

        if (!hitData.point) return null;

        let nearest = null;
        let nearestDist = Infinity;
        for (let i = 0; i < activeFires.length; i++) {
            const fire = activeFires[i];
            if (!fire || fire.z !== z) continue;
            const d = Math.hypot((fire.x + 0.5) - hitData.point.x, (fire.y + 0.5) - hitData.point.z);
            if (d < nearestDist) {
                nearestDist = d;
                nearest = fire;
            }
        }

        if (!nearest || nearestDist > 1.35) return null;
        return { x: nearest.x, y: nearest.y, z: nearest.z };
    }

    window.WorldFireLifecycleRuntime = {
        applyFireStepDestination,
        attachFireVisualGroup,
        createFiremakingLogPreviewAt,
        createFireVisualAt,
        expireFireAtIndex,
        findFireStepDestination,
        getFiremakingLogItemIdForPair,
        isFireOccupiedAt,
        lightFireAtCurrentTile,
        removeFiremakingLogPreview,
        resolveFireTargetFromHit,
        seedCookingTrainingFires,
        spawnFireAtTile,
        startFiremaking,
        syncFiremakingLogPreview,
        tickFireLifecycle,
        tryStepAfterFire,
        tryStepBeforeFiremaking,
        updateFires
    };
})();
