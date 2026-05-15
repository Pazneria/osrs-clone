(function () {
    let staticNpcBaseTiles = new Map();
    let staticObjectBaseTiles = new Map();
    let loadedChunkNpcActors = new Map();

    const TOWN_NPC_STEP_DIRS = Object.freeze([
        { x: 0, y: -1 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: -1, y: 0 }
    ]);
    const TOWN_NPC_SHADOW_CULL_DISTANCE = 38;
    const TOWN_NPC_SHADOW_CULL_DISTANCE_SQ = TOWN_NPC_SHADOW_CULL_DISTANCE * TOWN_NPC_SHADOW_CULL_DISTANCE;

    function occupiedTileKey(x, y, z = 0) {
        return `${z}:${x}:${y}`;
    }

    function resetStaticNpcBaseTiles() {
        staticNpcBaseTiles = new Map();
        staticObjectBaseTiles = new Map();
    }

    function resetLoadedChunkNpcActors() {
        loadedChunkNpcActors = new Map();
    }

    function rememberStaticNpcBaseTile(x, y, z, tileId) {
        if (!Number.isFinite(tileId)) return;
        staticNpcBaseTiles.set(occupiedTileKey(x, y, z), Math.floor(Number(tileId)));
    }

    function rememberStaticObjectBaseTile(x, y, z, tileId) {
        if (!Number.isFinite(tileId)) return;
        staticObjectBaseTiles.set(occupiedTileKey(x, y, z), Math.floor(Number(tileId)));
    }

    function resolveSolidNpcBaseTile(x, y, z) {
        const staticBaseTile = staticNpcBaseTiles.get(occupiedTileKey(x, y, z));
        if (Number.isFinite(staticBaseTile)) return staticBaseTile;
        if (window && typeof window.getCombatEnemyOccupiedBaseTileId === 'function') {
            const combatBaseTile = window.getCombatEnemyOccupiedBaseTileId(x, y, z);
            if (Number.isFinite(combatBaseTile)) return Math.floor(Number(combatBaseTile));
        }
        return null;
    }

    function resolveStaticObjectBaseTile(x, y, z) {
        const staticBaseTile = staticObjectBaseTiles.get(occupiedTileKey(x, y, z));
        return Number.isFinite(staticBaseTile) ? staticBaseTile : null;
    }

    function getVisualTileId(TileId, tileId, x, y, z) {
        if (!TileId) return tileId;
        let baseTile = null;
        if (tileId === TileId.SOLID_NPC) {
            baseTile = resolveSolidNpcBaseTile(x, y, z);
        } else if (tileId === TileId.OBSTACLE) {
            baseTile = resolveStaticObjectBaseTile(x, y, z);
        } else {
            return tileId;
        }
        return Number.isFinite(baseTile) ? baseTile : tileId;
    }

    function isWoodenGateTileIdSafe(TileId, tileId) {
        if (window && typeof window.isWoodenGateTileId === 'function') return window.isWoodenGateTileId(tileId);
        return !!TileId && (tileId === TileId.WOODEN_GATE_CLOSED || tileId === TileId.WOODEN_GATE_OPEN);
    }

    function isFenceConnectorTile(TileId, tileId) {
        return !!TileId && (tileId === TileId.FENCE || isWoodenGateTileIdSafe(TileId, tileId));
    }

    function getDoorClosedTileId(TileId, door) {
        return door && door.isWoodenGate ? TileId.WOODEN_GATE_CLOSED : TileId.DOOR_CLOSED;
    }

    function getDoorOpenTileId(TileId, door) {
        return door && door.isWoodenGate ? TileId.WOODEN_GATE_OPEN : TileId.DOOR_OPEN;
    }

    function normalizeAngleRadians(angle) {
        let value = Number.isFinite(angle) ? angle : 0;
        while (value <= -Math.PI) value += Math.PI * 2;
        while (value > Math.PI) value -= Math.PI * 2;
        return value;
    }

    function shortestAngleDelta(fromAngle, toAngle) {
        return normalizeAngleRadians((Number.isFinite(toAngle) ? toAngle : 0) - (Number.isFinite(fromAngle) ? fromAngle : 0));
    }

    function hashTownNpcSeed(text) {
        const source = typeof text === 'string' ? text : '';
        let hash = 2166136261;
        for (let i = 0; i < source.length; i++) {
            hash ^= source.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return hash >>> 0;
    }

    function resolveTownNpcDefaultFacingYaw(npc) {
        if (npc && Number.isFinite(npc.facingYaw)) return npc.facingYaw;
        if (npc && npc.name === 'Shopkeeper') return Math.PI / 2;
        if (npc && npc.name === 'Banker') return 0;
        return Math.PI;
    }

    function distanceToBounds(bounds, x, y) {
        if (!bounds) return Infinity;
        const dx = x < bounds.xMin ? (bounds.xMin - x) : (x > bounds.xMax ? (x - bounds.xMax) : 0);
        const dy = y < bounds.yMin ? (bounds.yMin - y) : (y > bounds.yMax ? (y - bounds.yMax) : 0);
        return Math.max(dx, dy);
    }

    function expandTownNpcRoamBounds(bounds, pad, mapSize) {
        const resolvedMapSize = Number.isFinite(mapSize) ? Math.max(3, Math.floor(mapSize)) : 512;
        const resolvedPad = Number.isFinite(pad) ? Math.max(0, Math.floor(pad)) : 0;
        return {
            xMin: Math.max(1, bounds.xMin - resolvedPad),
            xMax: Math.min(resolvedMapSize - 2, bounds.xMax + resolvedPad),
            yMin: Math.max(1, bounds.yMin - resolvedPad),
            yMax: Math.min(resolvedMapSize - 2, bounds.yMax + resolvedPad)
        };
    }

    function resolveTownNpcRoamBounds(options = {}) {
        const npc = options.npc;
        if (!npc) return null;
        const mapSize = Number.isFinite(options.mapSize) ? options.mapSize : 512;
        const structureBoundsList = Array.isArray(options.structureBoundsList) ? options.structureBoundsList : [];
        const actorZ = Number.isFinite(npc.z) ? npc.z : 0;
        const dialogueId = npc && typeof npc.dialogueId === 'string' ? npc.dialogueId.trim() : '';
        const roamPad = dialogueId ? 3 : (npc && npc.action === 'Travel' ? 2 : 1);
        for (let i = 0; i < structureBoundsList.length; i++) {
            const bounds = structureBoundsList[i];
            if (!bounds || bounds.z !== actorZ) continue;
            if (npc.x >= bounds.xMin && npc.x <= bounds.xMax && npc.y >= bounds.yMin && npc.y <= bounds.yMax) {
                return expandTownNpcRoamBounds(bounds, roamPad, mapSize);
            }
        }
        let nearestBounds = null;
        let nearestDistance = Infinity;
        for (let i = 0; i < structureBoundsList.length; i++) {
            const bounds = structureBoundsList[i];
            if (!bounds || bounds.z !== actorZ) continue;
            const distance = distanceToBounds(bounds, npc.x, npc.y);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestBounds = bounds;
            }
        }
        if (nearestBounds && nearestDistance <= Math.max(3, roamPad + 1)) {
            return expandTownNpcRoamBounds(nearestBounds, roamPad, mapSize);
        }
        const fallbackPad = dialogueId ? 4 : 2;
        return {
            xMin: Math.max(1, npc.x - fallbackPad),
            xMax: Math.min(mapSize - 2, npc.x + fallbackPad),
            yMin: Math.max(1, npc.y - fallbackPad),
            yMax: Math.min(mapSize - 2, npc.y + fallbackPad)
        };
    }

    function resolveTownNpcRoamingRadius(npc, roamBounds) {
        const npcName = npc && typeof npc.name === 'string' ? npc.name : '';
        const dialogueId = npc && typeof npc.dialogueId === 'string' ? npc.dialogueId.trim() : '';
        if (npc && Number.isFinite(npc.roamingRadiusOverride)) {
            return Math.max(0, Math.floor(Number(npc.roamingRadiusOverride)));
        }
        if (npcName === 'Banker') return 0;
        if (/^King\b/i.test(npcName) || /^Queen\b/i.test(npcName)) return 1;
        if (npc && npc.action === 'Travel') return dialogueId ? 2 : 1;
        if (dialogueId) {
            if (roamBounds) {
                const spanX = roamBounds.xMax - roamBounds.xMin + 1;
                const spanY = roamBounds.yMax - roamBounds.yMin + 1;
                return Math.max(3, Math.min(4, Math.floor(Math.min(spanX, spanY) / 2)));
            }
            return 3;
        }
        if (roamBounds) {
            const spanX = roamBounds.xMax - roamBounds.xMin + 1;
            const spanY = roamBounds.yMax - roamBounds.yMin + 1;
            return Math.max(1, Math.min(2, Math.floor(Math.min(spanX, spanY) / 2)));
        }
        return 2;
    }

    function buildTownNpcActorId(npc, index = 0) {
        if (npc && typeof npc.spawnId === 'string' && npc.spawnId) return npc.spawnId;
        if (npc && typeof npc.merchantId === 'string' && npc.merchantId) return `merchant:${npc.merchantId}`;
        const name = String(npc && npc.name ? npc.name : 'unknown')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_');
        const x = Number.isFinite(npc && npc.x) ? npc.x : index;
        const y = Number.isFinite(npc && npc.y) ? npc.y : 0;
        const z = Number.isFinite(npc && npc.z) ? npc.z : 0;
        return `npc:${name}:${x}:${y}:${z}`;
    }

    function buildStructureBoundsList(options = {}) {
        const stampedStructures = Array.isArray(options.stampedStructures) ? options.stampedStructures : [];
        const getStampBounds = typeof options.getStampBounds === 'function' ? options.getStampBounds : null;
        if (!getStampBounds) return [];
        const structureBoundsList = [];
        for (let i = 0; i < stampedStructures.length; i++) {
            const structure = stampedStructures[i];
            if (!structure) continue;
            const bounds = getStampBounds(structure.structureId);
            if (!bounds) continue;
            structureBoundsList.push({
                structureId: structure.structureId,
                z: Number.isFinite(structure.z) ? structure.z : 0,
                xMin: bounds.xMin,
                xMax: bounds.xMax,
                yMin: bounds.yMin,
                yMax: bounds.yMax
            });
        }
        return structureBoundsList;
    }

    function createTownNpcActorRecord(options = {}) {
        const npc = options.npc || {};
        const index = Number.isFinite(options.index) ? options.index : 0;
        const actorNowMs = Number.isFinite(options.actorNowMs) ? options.actorNowMs : 0;
        const getTileHeightSafe = typeof options.getTileHeightSafe === 'function' ? options.getTileHeightSafe : () => 0;
        const actorId = buildTownNpcActorId(npc, index);
        const z = Number.isFinite(npc.z) ? npc.z : 0;
        const x = Number.isFinite(npc.x) ? npc.x : index;
        const y = Number.isFinite(npc.y) ? npc.y : 0;
        const roamBounds = resolveTownNpcRoamBounds({
            mapSize: options.mapSize,
            npc,
            structureBoundsList: options.structureBoundsList
        });
        const facingYaw = resolveTownNpcDefaultFacingYaw(npc);
        const roamingRadius = resolveTownNpcRoamingRadius(npc, roamBounds);
        const baseHeight = getTileHeightSafe(x, y, z);
        return Object.assign({}, npc, {
            actorId,
            spawnId: typeof npc.spawnId === 'string' ? npc.spawnId : null,
            merchantId: typeof npc.merchantId === 'string' ? npc.merchantId : null,
            appearanceId: typeof npc.appearanceId === 'string' ? npc.appearanceId : null,
            dialogueId: typeof npc.dialogueId === 'string' ? npc.dialogueId : null,
            homeX: x,
            homeY: y,
            homeZ: z,
            roamBounds,
            roamingRadius,
            roamEnabled: roamingRadius > 0,
            facingYaw,
            targetFacingYaw: facingYaw,
            visualFacingYaw: facingYaw,
            visualX: x,
            visualY: y,
            visualBaseY: baseHeight + (z * 3.0),
            moveFromX: x,
            moveFromY: y,
            moveFromHeight: baseHeight,
            moveToHeight: baseHeight,
            moveStartedAtMs: 0,
            moveDurationMs: 0,
            idleUntilMs: actorNowMs + 400 + (hashTownNpcSeed(actorId) % 900),
            animationSeed: hashTownNpcSeed(actorId),
            mesh: null,
            hitbox: null,
            renderChunkKey: null
        });
    }

    function listQaNpcTargets(npcsToRender) {
        if (!Array.isArray(npcsToRender)) return [];
        return npcsToRender.map((npc) => ({
            actorId: npc && npc.actorId ? npc.actorId : '',
            spawnId: npc && npc.spawnId ? npc.spawnId : '',
            merchantId: npc && npc.merchantId ? npc.merchantId : '',
            name: npc && npc.name ? npc.name : '',
            action: npc && npc.action ? npc.action : '',
            dialogueId: npc && npc.dialogueId ? npc.dialogueId : '',
            x: Number.isFinite(npc && npc.x) ? npc.x : 0,
            y: Number.isFinite(npc && npc.y) ? npc.y : 0,
            z: Number.isFinite(npc && npc.z) ? npc.z : 0,
            visualX: Number.isFinite(npc && npc.visualX) ? npc.visualX : (Number.isFinite(npc && npc.x) ? npc.x : 0),
            visualY: Number.isFinite(npc && npc.visualY) ? npc.visualY : (Number.isFinite(npc && npc.y) ? npc.y : 0),
            rendered: !!(npc && npc.hitbox),
            tutorialVisibilityActive: npc && npc.tutorialVisibilityActive !== false,
            tutorialVisibleFromStep: normalizeTutorialStepValue(npc && npc.tutorialVisibleFromStep),
            tutorialVisibleUntilStep: normalizeTutorialStepValue(npc && npc.tutorialVisibleUntilStep)
        }));
    }

    function clearTownNpcRenderBindings(actor) {
        if (!actor || typeof actor !== 'object') return;
        actor.mesh = null;
        actor.hitbox = null;
        actor.renderChunkKey = null;
    }

    function findDoorStateAt(context, x, y, z = 0) {
        const doorsToRender = context && context.doorsToRender;
        if (!Array.isArray(doorsToRender)) return null;
        for (let i = 0; i < doorsToRender.length; i++) {
            const door = doorsToRender[i];
            if (!door) continue;
            if (door.x === x && door.y === y && door.z === z) return door;
        }
        return null;
    }

    function getTutorialStep(context) {
        const tutorial = context && context.TutorialRuntime ? context.TutorialRuntime : (window ? window.TutorialRuntime : null);
        return tutorial && typeof tutorial.getStep === 'function' ? tutorial.getStep() : 0;
    }

    function normalizeTutorialStepValue(value) {
        if (value === null || value === undefined || value === '') return null;
        const rawValue = Number(value);
        return Number.isFinite(rawValue) ? Math.max(0, Math.floor(rawValue)) : null;
    }

    function hasTutorialVisibilityWindow(actor) {
        if (!actor || typeof actor !== 'object') return false;
        return normalizeTutorialStepValue(actor.tutorialVisibleFromStep) !== null
            || normalizeTutorialStepValue(actor.tutorialVisibleUntilStep) !== null;
    }

    function isTutorialActorVisible(context, actor) {
        if (!hasTutorialVisibilityWindow(actor)) return true;
        const currentStep = Math.max(0, Math.floor(Number(getTutorialStep(context)) || 0));
        const fromStep = normalizeTutorialStepValue(actor.tutorialVisibleFromStep);
        const untilStep = normalizeTutorialStepValue(actor.tutorialVisibleUntilStep);
        if (fromStep !== null && currentStep < fromStep) return false;
        if (untilStep !== null && currentStep > untilStep) return false;
        return true;
    }

    function applyTownNpcActorVisibility(actor, visible) {
        if (!actor || typeof actor !== 'object') return;
        actor.tutorialVisibilityActive = !!visible;
        if (actor.mesh) actor.mesh.visible = !!visible;
        if (actor.hitbox) {
            actor.hitbox.visible = !!visible;
            if (!actor.hitbox.userData) actor.hitbox.userData = {};
            actor.hitbox.userData.ignoreRaycast = !visible;
            if (actor.hitbox.userData.uid && typeof actor.hitbox.userData.uid === 'object') {
                actor.hitbox.userData.uid.tutorialHidden = !visible;
            }
        }
    }

    function syncTutorialActorVisibility(context = {}, actor) {
        if (!actor || !hasTutorialVisibilityWindow(actor)) return true;
        const visible = isTutorialActorVisible(context, actor);
        const wasVisible = actor.tutorialVisibilityActive !== false;
        if (visible === wasVisible) {
            applyTownNpcActorVisibility(actor, visible);
            return visible;
        }
        if (!visible) {
            releaseTownNpcOccupiedTile(context, actor);
            actor.moveDurationMs = 0;
            actor.moveStartedAtMs = 0;
        } else {
            occupyTownNpcTile(context, actor, actor.x, actor.y);
            const getTileHeightSafe = typeof context.getTileHeightSafe === 'function' ? context.getTileHeightSafe : () => 0;
            const currentHeight = getTileHeightSafe(actor.x, actor.y, actor.z);
            actor.visualX = actor.x;
            actor.visualY = actor.y;
            actor.visualBaseY = currentHeight + (actor.z * 3.0);
            actor.idleUntilMs = (typeof context.now === 'function' ? context.now() : Date.now()) + 700;
        }
        applyTownNpcActorVisibility(actor, visible);
        return visible;
    }

    function refreshTutorialActorStates(context = {}) {
        const npcsToRender = Array.isArray(context.npcsToRender) ? context.npcsToRender : [];
        for (let i = 0; i < npcsToRender.length; i++) {
            syncTutorialActorVisibility(context, npcsToRender[i]);
        }
    }

    function isTutorialGateUnlocked(context, door) {
        if (!door || !Number.isFinite(door.tutorialRequiredStep)) return true;
        return getTutorialStep(context) >= door.tutorialRequiredStep;
    }

    function isTutorialGateLocked(context, door) {
        return !!(door && Number.isFinite(door.tutorialRequiredStep) && !isTutorialGateUnlocked(context, door));
    }

    function refreshTutorialGateStates(context = {}) {
        const doorsToRender = context.doorsToRender;
        const logicalMap = context.logicalMap;
        const TileId = context.TileId;
        if (!Array.isArray(doorsToRender)) return;
        for (let i = 0; i < doorsToRender.length; i++) {
            const door = doorsToRender[i];
            if (!door || !Number.isFinite(door.tutorialRequiredStep)) continue;
            const unlocked = isTutorialGateUnlocked(context, door);
            if (!unlocked) door.isOpen = false;
            else if (door.tutorialAutoOpenOnUnlock !== false) door.isOpen = true;
            door.targetRotation = door.isOpen ? door.openRot : door.closedRot;
            if (logicalMap && logicalMap[door.z] && logicalMap[door.z][door.y]) {
                logicalMap[door.z][door.y][door.x] = (unlocked && door.isOpen) ? getDoorOpenTileId(TileId, door) : getDoorClosedTileId(TileId, door);
            }
        }
        refreshTutorialActorStates(context);
        if (typeof context.updateMinimapCanvas === 'function') context.updateMinimapCanvas();
    }

    function resolvePublishedTownNpcContext(options) {
        if (!options) return {};
        if (typeof options.buildContext === 'function') {
            const context = options.buildContext();
            return context && typeof context === 'object' ? context : {};
        }
        return options.context && typeof options.context === 'object' ? options.context : {};
    }

    function publishTutorialGateHooks(options = {}) {
        const windowRef = options.windowRef || (typeof window !== 'undefined' ? window : {});
        const isGateLocked = isTutorialGateLocked;
        const refreshGateStates = refreshTutorialGateStates;
        windowRef.isTutorialGateLocked = function isTutorialGateLocked(door) {
            return isGateLocked(resolvePublishedTownNpcContext(options), door);
        };
        windowRef.refreshTutorialGateStates = function refreshTutorialGateStates() {
            return refreshGateStates(resolvePublishedTownNpcContext(options));
        };
    }

    function openTownNpcDoorAt(context = {}, x, y, z = 0) {
        const door = findDoorStateAt(context, x, y, z);
        const logicalMap = context.logicalMap;
        const TileId = context.TileId;
        if (!door || door.isOpen) return false;
        if (isTutorialGateLocked(context, door)) return false;
        door.isOpen = true;
        door.targetRotation = door.openRot;
        if (logicalMap && logicalMap[door.z] && logicalMap[door.z][door.y]) {
            logicalMap[door.z][door.y][door.x] = getDoorOpenTileId(TileId, door);
        }
        return true;
    }

    function releaseTownNpcOccupiedTile(context = {}, actor) {
        const logicalMap = context.logicalMap;
        if (!actor || !logicalMap || !logicalMap[actor.z] || !logicalMap[actor.z][actor.y]) return;
        const key = occupiedTileKey(actor.x, actor.y, actor.z);
        const baseTile = staticNpcBaseTiles.get(key);
        if (Number.isFinite(baseTile)) {
            logicalMap[actor.z][actor.y][actor.x] = Math.floor(Number(baseTile));
        }
        staticNpcBaseTiles.delete(key);
    }

    function occupyTownNpcTile(context = {}, actor, x, y) {
        const logicalMap = context.logicalMap;
        const TileId = context.TileId;
        if (!actor || !logicalMap || !logicalMap[actor.z] || !logicalMap[actor.z][y]) return false;
        rememberStaticNpcBaseTile(x, y, actor.z, logicalMap[actor.z][y][x]);
        logicalMap[actor.z][y][x] = TileId.SOLID_NPC;
        return true;
    }

    function isTownNpcStepWithinBounds(context = {}, actor, x, y) {
        if (!actor) return false;
        if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
        const mapSize = Number.isFinite(context.mapSize) ? context.mapSize : 0;
        if (x <= 0 || y <= 0 || x >= mapSize - 1 || y >= mapSize - 1) return false;
        if (actor.roamBounds) {
            if (x < actor.roamBounds.xMin || x > actor.roamBounds.xMax || y < actor.roamBounds.yMin || y > actor.roamBounds.yMax) return false;
        }
        const radius = Number.isFinite(actor.roamingRadius) ? Math.max(0, Math.floor(actor.roamingRadius)) : 0;
        if (radius > 0) {
            const homeX = Number.isFinite(actor.homeX) ? actor.homeX : actor.x;
            const homeY = Number.isFinite(actor.homeY) ? actor.homeY : actor.y;
            if (Math.max(Math.abs(x - homeX), Math.abs(y - homeY)) > radius) return false;
        }
        return true;
    }

    function isTownNpcStepTraversable(context = {}, actor, nextX, nextY) {
        const logicalMap = context.logicalMap;
        const TileId = context.TileId;
        if (!actor || !logicalMap || !logicalMap[actor.z] || !logicalMap[actor.z][nextY]) return false;
        if (!isTownNpcStepWithinBounds(context, actor, nextX, nextY)) return false;
        const nextTile = logicalMap[actor.z][nextY][nextX];
        const traversableDoorTile = nextTile === TileId.DOOR_CLOSED
            || nextTile === TileId.DOOR_OPEN
            || nextTile === TileId.WOODEN_GATE_OPEN;
        const isWalkableTileId = typeof context.isWalkableTileId === 'function'
            ? context.isWalkableTileId
            : (window && typeof window.isWalkableTileId === 'function' ? window.isWalkableTileId : null);
        if (!traversableDoorTile && (typeof isWalkableTileId !== 'function' || !isWalkableTileId(nextTile))) return false;
        const currentTile = logicalMap[actor.z][actor.y][actor.x];
        const getTileHeightSafe = typeof context.getTileHeightSafe === 'function' ? context.getTileHeightSafe : () => 0;
        const currentHeight = getTileHeightSafe(actor.x, actor.y, actor.z);
        const nextHeight = getTileHeightSafe(nextX, nextY, actor.z);
        const stairTransition = (currentTile === TileId.STAIRS_RAMP || nextTile === TileId.STAIRS_RAMP) && Math.abs(currentHeight - nextHeight) <= 0.6;
        return Math.abs(currentHeight - nextHeight) <= 0.3 || stairTransition;
    }

    function ensureTownNpcRigDefaults(actorMesh) {
        if (!actorMesh || !actorMesh.userData || !actorMesh.userData.rig) return null;
        if (actorMesh.userData.townNpcRigDefaults) return actorMesh.userData.townNpcRigDefaults;
        const rig = actorMesh.userData.rig;
        const nodeNames = [
            'head',
            'torso',
            'leftArm',
            'rightArm',
            'leftLowerArm',
            'rightLowerArm',
            'leftLeg',
            'rightLeg',
            'leftLowerLeg',
            'rightLowerLeg'
        ];
        const defaults = {
            nodes: {},
            baseY: Number.isFinite(actorMesh.userData.baseY) ? actorMesh.userData.baseY : 0
        };
        for (let i = 0; i < nodeNames.length; i++) {
            const nodeName = nodeNames[i];
            const node = rig[nodeName];
            if (!node) continue;
            defaults.nodes[nodeName] = {
                position: node.position.clone(),
                rotation: node.rotation.clone(),
                scale: node.scale.clone()
            };
        }
        actorMesh.userData.townNpcRigDefaults = defaults;
        return defaults;
    }

    function applyTownNpcRigAnimation(actor, frameNowMs, visualBaseY) {
        if (!actor || !actor.mesh || !actor.mesh.userData || !actor.mesh.userData.rig) return;
        const rig = actor.mesh.userData.rig;
        const defaults = ensureTownNpcRigDefaults(actor.mesh);
        if (!defaults) {
            actor.mesh.position.y = visualBaseY;
            return;
        }

        const defaultNodes = defaults.nodes || {};
        Object.keys(defaultNodes).forEach((nodeName) => {
            const node = rig[nodeName];
            const nodeDefaults = defaultNodes[nodeName];
            if (!node || !nodeDefaults) return;
            node.position.copy(nodeDefaults.position);
            node.rotation.copy(nodeDefaults.rotation);
            node.scale.copy(nodeDefaults.scale);
        });

        const walkActive = Number.isFinite(actor.moveDurationMs) && actor.moveDurationMs > 0;
        const phaseOffset = Number.isFinite(actor.animationSeed) ? (actor.animationSeed % 628) / 100 : 0;
        if (!walkActive) {
            actor.mesh.position.y = visualBaseY;
            if (actor.roamEnabled !== false) {
                const idlePhase = phaseOffset + (frameNowMs * 0.0038);
                const idleBreath = Math.sin(idlePhase * 0.65) * 0.01;
                const headNod = Math.sin(idlePhase * 0.8) * 0.015;
                if (rig.torso && defaultNodes.torso) {
                    rig.torso.position.y = defaultNodes.torso.position.y + (idleBreath * 0.45);
                }
                if (rig.head && defaultNodes.head) {
                    rig.head.position.y = defaultNodes.head.position.y + (idleBreath * 0.2);
                    rig.head.rotation.x = defaultNodes.head.rotation.x + headNod;
                }
            }
            return;
        }

        const phase = phaseOffset + (frameNowMs * 0.011);
        const stride = Math.sin(phase) * 0.52;
        const bounce = Math.abs(Math.sin(phase)) * 0.034;
        const armSwing = stride * 0.72;
        const torsoTilt = stride * 0.08;
        const headNod = Math.sin(phase * 2) * 0.04;
        const leftKnee = Math.max(0, -stride) * 0.78;
        const rightKnee = Math.max(0, stride) * 0.78;

        actor.mesh.position.y = visualBaseY + bounce;
        if (rig.torso && defaultNodes.torso) {
            rig.torso.position.y = defaultNodes.torso.position.y + (bounce * 0.45);
            rig.torso.rotation.z = defaultNodes.torso.rotation.z + torsoTilt;
        }
        if (rig.head && defaultNodes.head) {
            rig.head.position.y = defaultNodes.head.position.y + (bounce * 0.2);
            rig.head.rotation.x = defaultNodes.head.rotation.x + headNod;
        }
        if (rig.leftArm) rig.leftArm.rotation.x = (defaultNodes.leftArm ? defaultNodes.leftArm.rotation.x : 0) - armSwing;
        if (rig.rightArm) rig.rightArm.rotation.x = (defaultNodes.rightArm ? defaultNodes.rightArm.rotation.x : 0) + armSwing;
        if (rig.leftLowerArm) rig.leftLowerArm.rotation.x = (defaultNodes.leftLowerArm ? defaultNodes.leftLowerArm.rotation.x : 0) + Math.max(0, armSwing) * 0.18;
        if (rig.rightLowerArm) rig.rightLowerArm.rotation.x = (defaultNodes.rightLowerArm ? defaultNodes.rightLowerArm.rotation.x : 0) + Math.max(0, -armSwing) * 0.18;
        if (rig.leftLeg) rig.leftLeg.rotation.x = (defaultNodes.leftLeg ? defaultNodes.leftLeg.rotation.x : 0) + stride;
        if (rig.rightLeg) rig.rightLeg.rotation.x = (defaultNodes.rightLeg ? defaultNodes.rightLeg.rotation.x : 0) - stride;
        if (rig.leftLowerLeg) rig.leftLowerLeg.rotation.x = (defaultNodes.leftLowerLeg ? defaultNodes.leftLowerLeg.rotation.x : 0) + leftKnee;
        if (rig.rightLowerLeg) rig.rightLowerLeg.rotation.x = (defaultNodes.rightLowerLeg ? defaultNodes.rightLowerLeg.rotation.x : 0) + rightKnee;
    }

    function shouldCastTownNpcShadow(context = {}, actor, visualX, visualY) {
        if (!actor || !actor.mesh || actor.mesh.visible === false) return false;
        const playerState = context.playerState;
        if (!playerState || typeof playerState !== 'object') return true;
        if (Number.isFinite(actor.z) && Number.isFinite(playerState.z) && actor.z !== playerState.z) return false;
        const dx = (Number.isFinite(visualX) ? visualX : actor.x) - playerState.x;
        const dy = (Number.isFinite(visualY) ? visualY : actor.y) - playerState.y;
        if (!Number.isFinite(dx) || !Number.isFinite(dy)) return true;
        return ((dx * dx) + (dy * dy)) <= TOWN_NPC_SHADOW_CULL_DISTANCE_SQ;
    }

    function applyTownNpcShadowBudget(context = {}, actor, visualX, visualY) {
        if (!actor || !actor.mesh || typeof actor.mesh.traverse !== 'function') return;
        const shouldCastShadow = shouldCastTownNpcShadow(context, actor, visualX, visualY);
        if (actor.shadowCastingActive === shouldCastShadow) return;
        actor.mesh.traverse((child) => {
            if (!child || !child.isMesh) return;
            const userData = child.userData || {};
            if (userData.type === 'NPC') return;
            child.castShadow = shouldCastShadow;
        });
        actor.shadowCastingActive = shouldCastShadow;
    }

    function shouldPauseTownNpcRoaming(context = {}, actor) {
        const playerState = context.playerState;
        if (!actor || typeof playerState !== 'object' || playerState == null) return false;
        if (actor.z === playerState.z && Math.max(Math.abs(actor.x - playerState.x), Math.abs(actor.y - playerState.y)) <= 1) return true;
        const dialogueRuntime = context.NpcDialogueRuntime || (window ? window.NpcDialogueRuntime : null);
        if (dialogueRuntime && typeof dialogueRuntime.isOpen === 'function' && dialogueRuntime.isOpen()) {
            const activeNpc = typeof dialogueRuntime.getActiveNpc === 'function' ? dialogueRuntime.getActiveNpc() : null;
            const activeMerchantId = activeNpc && typeof activeNpc.merchantId === 'string' ? activeNpc.merchantId.trim() : '';
            const activeDialogueId = activeNpc && typeof activeNpc.dialogueId === 'string' ? activeNpc.dialogueId.trim() : '';
            const activeName = activeNpc && typeof activeNpc.name === 'string' ? activeNpc.name.trim() : '';
            if (actor.merchantId && activeMerchantId && actor.merchantId === activeMerchantId) return true;
            if (actor.dialogueId && activeDialogueId && actor.dialogueId === activeDialogueId) return true;
            if (actor.name && activeName && actor.name === activeName) return true;
        }
        const targetUid = playerState.targetUid;
        if (!targetUid || typeof targetUid !== 'object') return false;
        if (actor.spawnId && targetUid.spawnId === actor.spawnId) return true;
        if (actor.merchantId && targetUid.merchantId === actor.merchantId) return true;
        return !!(actor.name && targetUid.name === actor.name);
    }

    function chooseTownNpcNextStep(context = {}, actor, occupiedTiles, frameNowMs) {
        if (!actor || !actor.roamEnabled) return null;
        const roamingRadius = Number.isFinite(actor.roamingRadius) ? Math.max(0, Math.floor(actor.roamingRadius)) : 0;
        if (roamingRadius <= 0) return null;
        const currentKey = occupiedTileKey(actor.x, actor.y, actor.z);
        const seed = (Number.isFinite(actor.animationSeed) ? actor.animationSeed : 0) + Math.floor((Number.isFinite(frameNowMs) ? frameNowMs : 0) / 600);
        const candidateSteps = TOWN_NPC_STEP_DIRS
            .map((dir, index) => ({
                x: actor.x + dir.x,
                y: actor.y + dir.y,
                sortKey: ((seed + (index * 977)) % 104729)
            }))
            .sort((left, right) => left.sortKey - right.sortKey);

        for (let i = 0; i < candidateSteps.length; i++) {
            const step = candidateSteps[i];
            const nextKey = occupiedTileKey(step.x, step.y, actor.z);
            if (nextKey !== currentKey && occupiedTiles.has(nextKey)) continue;
            if (!isTownNpcStepTraversable(context, actor, step.x, step.y)) continue;
            return step;
        }
        return null;
    }

    function updateWorldNpcRuntime(context = {}, frameNowMs) {
        const npcsToRender = context.npcsToRender;
        if (!Array.isArray(npcsToRender) || npcsToRender.length === 0) return;
        const getTileHeightSafe = typeof context.getTileHeightSafe === 'function' ? context.getTileHeightSafe : () => 0;
        const now = typeof context.now === 'function' ? context.now : () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
        const frameNow = Number.isFinite(frameNowMs) ? frameNowMs : now();
        const occupiedTiles = new Set();
        for (let i = 0; i < npcsToRender.length; i++) {
            const actor = npcsToRender[i];
            if (!actor || !Number.isFinite(actor.x) || !Number.isFinite(actor.y) || !Number.isFinite(actor.z)) continue;
            if (!syncTutorialActorVisibility(context, actor)) continue;
            occupiedTiles.add(occupiedTileKey(actor.x, actor.y, actor.z));
        }

        for (let i = 0; i < npcsToRender.length; i++) {
            const actor = npcsToRender[i];
            if (!actor || !Number.isFinite(actor.x) || !Number.isFinite(actor.y) || !Number.isFinite(actor.z)) continue;
            if (!syncTutorialActorVisibility(context, actor)) continue;

            const currentHeight = getTileHeightSafe(actor.x, actor.y, actor.z);
            let visualX = Number.isFinite(actor.visualX) ? actor.visualX : actor.x;
            let visualY = Number.isFinite(actor.visualY) ? actor.visualY : actor.y;
            let visualBaseY = currentHeight + (actor.z * 3.0);
            let moving = Number.isFinite(actor.moveDurationMs) && actor.moveDurationMs > 0;

            if (moving && Number.isFinite(actor.moveStartedAtMs) && frameNow >= actor.moveStartedAtMs) {
                const moveProgress = Math.max(0, Math.min(1, (frameNow - actor.moveStartedAtMs) / actor.moveDurationMs));
                visualX = actor.moveFromX + ((actor.x - actor.moveFromX) * moveProgress);
                visualY = actor.moveFromY + ((actor.y - actor.moveFromY) * moveProgress);
                visualBaseY = actor.moveFromHeight + ((actor.moveToHeight - actor.moveFromHeight) * moveProgress) + (actor.z * 3.0);
                if (moveProgress >= 1) {
                    moving = false;
                    actor.moveDurationMs = 0;
                    actor.moveStartedAtMs = 0;
                    actor.facingYaw = actor.targetFacingYaw;
                    actor.idleUntilMs = frameNow + 900 + (Number.isFinite(actor.animationSeed) ? (actor.animationSeed % 900) : 0);
                }
            } else if (!moving && frameNow >= actor.idleUntilMs && !shouldPauseTownNpcRoaming(context, actor)) {
                const currentKey = occupiedTileKey(actor.x, actor.y, actor.z);
                const nextStep = chooseTownNpcNextStep(context, actor, occupiedTiles, frameNow);
                if (nextStep) {
                    const nextHeight = getTileHeightSafe(nextStep.x, nextStep.y, actor.z);
                    openTownNpcDoorAt(context, nextStep.x, nextStep.y, actor.z);
                    occupiedTiles.delete(currentKey);
                    releaseTownNpcOccupiedTile(context, actor);
                    actor.moveFromX = actor.x;
                    actor.moveFromY = actor.y;
                    actor.moveFromHeight = currentHeight;
                    actor.x = nextStep.x;
                    actor.y = nextStep.y;
                    actor.moveToHeight = nextHeight;
                    occupyTownNpcTile(context, actor, actor.x, actor.y);
                    occupiedTiles.add(occupiedTileKey(actor.x, actor.y, actor.z));
                    actor.targetFacingYaw = Math.atan2(actor.x - actor.moveFromX, actor.y - actor.moveFromY);
                    actor.moveStartedAtMs = frameNow;
                    actor.moveDurationMs = 720 + (Number.isFinite(actor.animationSeed) ? (actor.animationSeed % 180) : 120);
                    moving = true;
                    visualX = actor.moveFromX;
                    visualY = actor.moveFromY;
                    visualBaseY = actor.moveFromHeight + (actor.z * 3.0);
                } else {
                    actor.idleUntilMs = frameNow + 700 + (Number.isFinite(actor.animationSeed) ? (actor.animationSeed % 1200) : 600);
                }
            }

            actor.visualX = visualX;
            actor.visualY = visualY;
            actor.visualBaseY = visualBaseY;

            const desiredYaw = moving && Number.isFinite(actor.targetFacingYaw) ? actor.targetFacingYaw : actor.facingYaw;
            actor.visualFacingYaw = normalizeAngleRadians(
                (Number.isFinite(actor.visualFacingYaw) ? actor.visualFacingYaw : desiredYaw)
                + (shortestAngleDelta(actor.visualFacingYaw, desiredYaw) * 0.28)
            );

            if (actor.mesh) {
                actor.mesh.position.set(visualX, visualBaseY, visualY);
                actor.mesh.rotation.y = actor.visualFacingYaw;
                applyTownNpcShadowBudget(context, actor, visualX, visualY);
                applyTownNpcRigAnimation(actor, frameNow, visualBaseY);
            }
            if (actor.hitbox && actor.hitbox.userData) {
                actor.hitbox.userData.gridX = actor.x;
                actor.hitbox.userData.gridY = actor.y;
                if (actor.hitbox.userData.uid) {
                    actor.hitbox.userData.uid.gridX = actor.x;
                    actor.hitbox.userData.uid.gridY = actor.y;
                }
            }
        }
    }

    function setLoadedChunkNpcActors(key, actors) {
        loadedChunkNpcActors.set(key, Array.isArray(actors) ? actors : []);
    }

    function getLoadedChunkNpcActors(key) {
        return loadedChunkNpcActors.get(key) || [];
    }

    function deleteLoadedChunkNpcActors(key) {
        loadedChunkNpcActors.delete(key);
    }

    window.WorldTownNpcRuntime = {
        TOWN_NPC_STEP_DIRS,
        TOWN_NPC_SHADOW_CULL_DISTANCE,
        applyTownNpcShadowBudget,
        applyTownNpcRigAnimation,
        buildStructureBoundsList,
        buildTownNpcActorId,
        chooseTownNpcNextStep,
        clearTownNpcRenderBindings,
        createTownNpcActorRecord,
        deleteLoadedChunkNpcActors,
        distanceToBounds,
        expandTownNpcRoamBounds,
        findDoorStateAt,
        getDoorClosedTileId,
        getDoorOpenTileId,
        getLoadedChunkNpcActors,
        getVisualTileId,
        hashTownNpcSeed,
        isFenceConnectorTile,
        isTownNpcStepTraversable,
        isTownNpcStepWithinBounds,
        isTutorialActorVisible,
        isTutorialGateLocked,
        isTutorialGateUnlocked,
        isWoodenGateTileIdSafe,
        listQaNpcTargets,
        normalizeAngleRadians,
        occupiedTileKey,
        occupyTownNpcTile,
        openTownNpcDoorAt,
        publishTutorialGateHooks,
        refreshTutorialActorStates,
        refreshTutorialGateStates,
        releaseTownNpcOccupiedTile,
        rememberStaticObjectBaseTile,
        rememberStaticNpcBaseTile,
        resetLoadedChunkNpcActors,
        resetStaticNpcBaseTiles,
        resolveStaticObjectBaseTile,
        resolveSolidNpcBaseTile,
        resolveTownNpcDefaultFacingYaw,
        resolveTownNpcRoamBounds,
        resolveTownNpcRoamingRadius,
        setLoadedChunkNpcActors,
        shouldPauseTownNpcRoaming,
        shortestAngleDelta,
        updateWorldNpcRuntime
    };
})();
