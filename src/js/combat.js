(function () {
    const combatRuntime = window.CombatRuntime || null;
    const PLAYER_TARGET_ID = 'player';
    const PLAYER_TARGET_KIND = 'enemy';
    const PLAYER_DEFEAT_MESSAGE = 'You were defeated and return to safety.';

    let activeCombatWorldId = null;
    let combatEnemySpawnNodesById = Object.create(null);
    let combatEnemyStates = [];
    let combatEnemyStateById = Object.create(null);
    let combatEnemyRenderLayer = null;
    let combatEnemyRenderersById = Object.create(null);
    let combatEnemyOccupiedTiles = new Map();
    let combatEnemyOccupancyDirty = true;

    function clonePoint(point) {
        return {
            x: Number.isFinite(point && point.x) ? Math.floor(point.x) : 0,
            y: Number.isFinite(point && point.y) ? Math.floor(point.y) : 0,
            z: Number.isFinite(point && point.z) ? Math.floor(point.z) : 0
        };
    }

    function getCurrentWorldId() {
        if (window.GameSessionRuntime && typeof window.GameSessionRuntime.resolveCurrentWorldId === 'function') {
            return window.GameSessionRuntime.resolveCurrentWorldId();
        }
        return 'starter_town';
    }

    function getEnemyDefinition(enemyId) {
        if (!combatRuntime || typeof combatRuntime.getEnemyTypeDefinition !== 'function') return null;
        return combatRuntime.getEnemyTypeDefinition(enemyId);
    }

    function getPlayerCombatSnapshot() {
        if (!combatRuntime || typeof combatRuntime.computePlayerMeleeCombatSnapshot !== 'function') return null;
        return combatRuntime.computePlayerMeleeCombatSnapshot({
            playerSkills: playerSkills || {},
            equipment: equipment || {},
            playerState
        });
    }

    function getEnemyCombatSnapshot(enemyState) {
        if (!combatRuntime || typeof combatRuntime.computeEnemyMeleeCombatSnapshot !== 'function') return null;
        return combatRuntime.computeEnemyMeleeCombatSnapshot(getEnemyDefinition(enemyState.enemyId));
    }

    function isEnemyAlive(enemyState) {
        return !!(enemyState && enemyState.currentState !== 'dead' && enemyState.currentHealth > 0);
    }

    function getCombatEnemyState(enemyId) {
        return combatEnemyStateById[String(enemyId || '').trim()] || null;
    }

    function clearEnemyRenderer(enemyId) {
        const renderer = combatEnemyRenderersById[enemyId];
        if (!renderer) return;
        if (renderer.group && renderer.group.parent) renderer.group.parent.remove(renderer.group);
        environmentMeshes = environmentMeshes.filter((mesh) => mesh !== renderer.hitbox);
        delete combatEnemyRenderersById[enemyId];
    }

    function clearCombatEnemyRenderers() {
        const enemyIds = Object.keys(combatEnemyRenderersById);
        for (let i = 0; i < enemyIds.length; i++) clearEnemyRenderer(enemyIds[i]);
        if (combatEnemyRenderLayer && combatEnemyRenderLayer.parent) combatEnemyRenderLayer.parent.remove(combatEnemyRenderLayer);
        combatEnemyRenderLayer = null;
    }

    function clearCombatEnemyOccupancy() {
        combatEnemyOccupiedTiles.forEach((baseTile, key) => {
            const parts = key.split(':');
            if (parts.length !== 3) return;
            const z = parseInt(parts[0], 10);
            const x = parseInt(parts[1], 10);
            const y = parseInt(parts[2], 10);
            if (!logicalMap[z] || !logicalMap[z][y]) return;
            if (logicalMap[z][y][x] === TileId.SOLID_NPC) logicalMap[z][y][x] = baseTile;
        });
        combatEnemyOccupiedTiles.clear();
    }

    function markCombatEnemyOccupancyDirty() {
        combatEnemyOccupancyDirty = true;
    }

    function refreshCombatEnemyOccupancy() {
        if (!combatEnemyOccupancyDirty) return;
        clearCombatEnemyOccupancy();
        for (let i = 0; i < combatEnemyStates.length; i++) {
            const enemyState = combatEnemyStates[i];
            if (!isEnemyAlive(enemyState)) continue;
            const z = enemyState.z;
            const x = enemyState.x;
            const y = enemyState.y;
            if (!logicalMap[z] || !logicalMap[z][y]) continue;
            const key = `${z}:${x}:${y}`;
            if (!combatEnemyOccupiedTiles.has(key)) combatEnemyOccupiedTiles.set(key, logicalMap[z][y][x]);
            logicalMap[z][y][x] = TileId.SOLID_NPC;
        }
        combatEnemyOccupancyDirty = false;
    }

    function resetCombatStateCollections() {
        combatEnemySpawnNodesById = Object.create(null);
        combatEnemyStateById = Object.create(null);
        combatEnemyStates = [];
    }

    function clearPlayerCombatTarget() {
        playerState.lockedTargetId = null;
        playerState.combatTargetKind = null;
        playerState.inCombat = false;
        if (playerState.targetObj === 'ENEMY') {
            playerState.targetObj = null;
            playerState.targetUid = null;
        }
        if (playerState.action === 'COMBAT: MELEE') playerState.action = 'IDLE';
    }

    function lockPlayerCombatTarget(enemyId) {
        const resolvedEnemyId = String(enemyId || '').trim();
        if (!resolvedEnemyId) return false;
        const enemyState = getCombatEnemyState(resolvedEnemyId);
        if (!isEnemyAlive(enemyState)) return false;
        if (playerState.lockedTargetId === resolvedEnemyId && playerState.combatTargetKind === PLAYER_TARGET_KIND) return true;
        playerState.lockedTargetId = resolvedEnemyId;
        playerState.combatTargetKind = PLAYER_TARGET_KIND;
        playerState.inCombat = true;
        playerState.targetObj = 'ENEMY';
        playerState.targetUid = {
            enemyId: resolvedEnemyId,
            name: getEnemyDefinition(enemyState.enemyId)?.displayName || enemyState.enemyId
        };
        playerState.targetX = enemyState.x;
        playerState.targetY = enemyState.y;
        return true;
    }

    function getPlayerLockedEnemy() {
        if (playerState.combatTargetKind !== PLAYER_TARGET_KIND || !playerState.lockedTargetId) return null;
        return getCombatEnemyState(playerState.lockedTargetId);
    }

    function resolveRespawnLocation() {
        const worldId = getCurrentWorldId();
        if (window.LegacyWorldAdapterRuntime && typeof window.LegacyWorldAdapterRuntime.getWorldDefaultSpawn === 'function') {
            return clonePoint(window.LegacyWorldAdapterRuntime.getWorldDefaultSpawn(worldId, {
                mapSize: MAP_SIZE,
                planes: PLANES
            }));
        }
        return { x: 205, y: 210, z: 0 };
    }

    function initCombatWorldState() {
        activeCombatWorldId = getCurrentWorldId();
        clearCombatEnemyRenderers();
        clearCombatEnemyOccupancy();
        resetCombatStateCollections();
        combatEnemyOccupancyDirty = true;
        clearPlayerCombatTarget();
        playerState.lastDamagerEnemyId = null;

        if (!combatRuntime || typeof combatRuntime.listEnemySpawnNodesForWorld !== 'function' || typeof combatRuntime.createEnemyRuntimeState !== 'function') {
            return;
        }

        const spawnNodes = combatRuntime.listEnemySpawnNodesForWorld(activeCombatWorldId);
        for (let i = 0; i < spawnNodes.length; i++) {
            const spawnNode = spawnNodes[i];
            if (!spawnNode || !spawnNode.spawnEnabled) continue;
            combatEnemySpawnNodesById[spawnNode.spawnNodeId] = spawnNode;
            const enemyState = combatRuntime.createEnemyRuntimeState(spawnNode, 0);
            enemyState.prevX = enemyState.x;
            enemyState.prevY = enemyState.y;
            enemyState.moveTriggerAt = 0;
            enemyState.homeReachedAt = 0;
            combatEnemyStates.push(enemyState);
            combatEnemyStateById[enemyState.runtimeId] = enemyState;
        }

        refreshCombatEnemyOccupancy();
    }

    function ensureCombatEnemyWorldReady() {
        const currentWorldId = getCurrentWorldId();
        if (activeCombatWorldId !== currentWorldId) initCombatWorldState();
    }

    function getSquareRange(attacker, target, range) {
        if (combatRuntime && typeof combatRuntime.isWithinSquareRange === 'function') {
            return combatRuntime.isWithinSquareRange(attacker, target, range);
        }
        const dx = Math.abs(attacker.x - target.x);
        const dy = Math.abs(attacker.y - target.y);
        return Math.max(dx, dy) <= range;
    }

    function isWithinMeleeRange(attacker, target) {
        if (combatRuntime && typeof combatRuntime.isWithinMeleeRange === 'function') {
            return combatRuntime.isWithinMeleeRange(attacker, target);
        }
        return getSquareRange(attacker, target, 1);
    }

    function isPlayerAlive() {
        return typeof getCurrentHitpoints === 'function' ? getCurrentHitpoints() > 0 : playerState.currentHitpoints > 0;
    }

    function resolvePathToEnemy(enemyState) {
        if (!enemyState || !isEnemyAlive(enemyState)) return null;
        if (enemyState.z !== playerState.z) return null;
        if (isWithinMeleeRange(playerState, enemyState)) return [];
        if (typeof findPath !== 'function') return null;
        const path = findPath(playerState.x, playerState.y, enemyState.x, enemyState.y, true, 'ENEMY');
        return path.length > 0 ? path : null;
    }

    function resolvePathToPlayer(enemyState) {
        if (!enemyState || !isEnemyAlive(enemyState) || !isPlayerAlive()) return null;
        if (enemyState.z !== playerState.z) return null;
        if (isWithinMeleeRange(enemyState, playerState)) return [];
        if (typeof findPath !== 'function') return null;
        const path = findPath(enemyState.x, enemyState.y, playerState.x, playerState.y, true, 'ENEMY');
        return path.length > 0 ? path : null;
    }

    function resolvePathToHome(enemyState) {
        if (!enemyState) return null;
        const homeTile = enemyState.resolvedHomeTile || enemyState.resolvedSpawnTile;
        if (!homeTile || enemyState.z !== homeTile.z) return null;
        if (enemyState.x === homeTile.x && enemyState.y === homeTile.y) return [];
        if (typeof findPath !== 'function') return null;
        const path = findPath(enemyState.x, enemyState.y, homeTile.x, homeTile.y, false, null);
        return path.length > 0 ? path : null;
    }

    function facePlayerTowards(tile) {
        if (!tile) return;
        const dx = tile.x - playerState.x;
        const dy = tile.y - playerState.y;
        if (dx === 0 && dy === 0) return;
        playerState.targetRotation = Math.atan2(dx, dy);
    }

    function faceEnemyTowards(enemyState, tile) {
        if (!enemyState || !tile) return;
        const dx = tile.x - enemyState.x;
        const dy = tile.y - enemyState.y;
        if (dx === 0 && dy === 0) return;
        enemyState.facingYaw = Math.atan2(dx, dy);
    }

    function beginEnemyReturn(enemyState) {
        if (!enemyState || enemyState.currentState === 'dead') return;
        enemyState.currentState = 'returning';
        enemyState.lockedTargetId = null;
        enemyState.remainingAttackCooldown = 0;
        enemyState.lastDamagerId = null;
    }

    function restoreEnemyAtHome(enemyState) {
        const enemyType = getEnemyDefinition(enemyState.enemyId);
        if (!enemyType) return;
        const homeTile = enemyState.resolvedHomeTile || enemyState.resolvedSpawnTile;
        enemyState.prevX = enemyState.x;
        enemyState.prevY = enemyState.y;
        enemyState.x = homeTile.x;
        enemyState.y = homeTile.y;
        enemyState.z = homeTile.z;
        enemyState.currentHealth = enemyType.stats.hitpoints;
        enemyState.currentState = 'idle';
        enemyState.lockedTargetId = null;
        enemyState.remainingAttackCooldown = 0;
        enemyState.lastDamagerId = null;
        enemyState.attackTriggerAt = 0;
        enemyState.homeReachedAt = Date.now();
        faceEnemyTowards(enemyState, homeTile);
        markCombatEnemyOccupancyDirty();
    }

    function rollInclusive(minimum, maximum) {
        const low = Number.isFinite(minimum) ? Math.floor(minimum) : 0;
        const high = Number.isFinite(maximum) ? Math.floor(maximum) : low;
        if (high <= low) return Math.max(0, low);
        return low + Math.floor(Math.random() * ((high - low) + 1));
    }

    function spawnEnemyDrop(enemyState) {
        const enemyType = getEnemyDefinition(enemyState.enemyId);
        if (!enemyType || typeof spawnGroundItem !== 'function') return;
        if (!combatRuntime || typeof combatRuntime.pickDropEntry !== 'function') return;
        const dropEntry = combatRuntime.pickDropEntry(enemyType.dropTable || []);
        if (!dropEntry || dropEntry.kind === 'nothing') return;

        if (dropEntry.kind === 'coins' && ITEM_DB && ITEM_DB.coins) {
            const amount = rollInclusive(dropEntry.minAmount, dropEntry.maxAmount);
            if (amount > 0) spawnGroundItem(ITEM_DB.coins, enemyState.x, enemyState.y, enemyState.z, amount);
            return;
        }

        if (dropEntry.kind === 'item' && dropEntry.itemId && ITEM_DB && ITEM_DB[dropEntry.itemId]) {
            const amount = rollInclusive(dropEntry.minAmount, dropEntry.maxAmount);
            if (amount > 0) spawnGroundItem(ITEM_DB[dropEntry.itemId], enemyState.x, enemyState.y, enemyState.z, amount);
        }
    }

    function defeatEnemy(enemyState) {
        const enemyType = getEnemyDefinition(enemyState.enemyId);
        enemyState.currentState = 'dead';
        enemyState.currentHealth = 0;
        enemyState.lockedTargetId = null;
        enemyState.remainingAttackCooldown = 0;
        enemyState.attackTriggerAt = 0;
        enemyState.lastDamagerId = null;
        enemyState.respawnAtTick = currentTick + Math.max(1, Math.floor(
            (combatEnemySpawnNodesById[enemyState.spawnNodeId] && combatEnemySpawnNodesById[enemyState.spawnNodeId].respawnTicks)
            || (enemyType && enemyType.respawnTicks)
            || 1
        ));
        if (playerState.lockedTargetId === enemyState.runtimeId) clearPlayerCombatTarget();
        spawnEnemyDrop(enemyState);
        clearEnemyRenderer(enemyState.runtimeId);
        markCombatEnemyOccupancyDirty();
    }

    function respawnEnemy(enemyState) {
        const spawnNode = combatEnemySpawnNodesById[enemyState.spawnNodeId];
        const enemyType = getEnemyDefinition(enemyState.enemyId);
        if (!spawnNode || !enemyType) return;
        const spawnTile = clonePoint(spawnNode.spawnTile);
        const homeTile = spawnNode.homeTileOverride ? clonePoint(spawnNode.homeTileOverride) : clonePoint(spawnTile);
        enemyState.prevX = spawnTile.x;
        enemyState.prevY = spawnTile.y;
        enemyState.x = spawnTile.x;
        enemyState.y = spawnTile.y;
        enemyState.z = spawnTile.z;
        enemyState.currentHealth = enemyType.stats.hitpoints;
        enemyState.currentState = 'idle';
        enemyState.lockedTargetId = null;
        enemyState.remainingAttackCooldown = 0;
        enemyState.resolvedHomeTile = homeTile;
        enemyState.resolvedSpawnTile = clonePoint(spawnTile);
        enemyState.resolvedRoamingRadius = enemyType.behavior.roamingRadius;
        enemyState.resolvedChaseRange = enemyType.behavior.chaseRange;
        enemyState.resolvedAggroRadius = enemyType.behavior.aggroRadius;
        enemyState.defaultMovementSpeed = enemyType.behavior.defaultMovementSpeed;
        enemyState.combatMovementSpeed = enemyType.behavior.combatMovementSpeed;
        enemyState.facingYaw = Number.isFinite(spawnNode.facingYaw)
            ? Number(spawnNode.facingYaw)
            : (Number.isFinite(enemyType.appearance.facingYaw) ? Number(enemyType.appearance.facingYaw) : Math.PI);
        enemyState.respawnAtTick = null;
        enemyState.lastDamagerId = null;
        enemyState.attackTriggerAt = 0;
        enemyState.moveTriggerAt = 0;
        enemyState.homeReachedAt = 0;
        markCombatEnemyOccupancyDirty();
    }

    function resolvePlayerAttackSkill() {
        if (playerState.selectedMeleeStyle === 'strength') return 'strength';
        if (playerState.selectedMeleeStyle === 'defense') return 'defense';
        return 'attack';
    }

    function applyPlayerDefeat() {
        const respawn = resolveRespawnLocation();
        const maxHitpoints = typeof getMaxHitpoints === 'function' ? getMaxHitpoints() : Math.max(1, playerState.currentHitpoints || 10);
        playerState.currentHitpoints = maxHitpoints;
        playerState.remainingAttackCooldown = 0;
        playerState.lastDamagerEnemyId = null;
        playerState.eatingCooldownEndTick = 0;
        playerState.path = [];
        playerState.x = respawn.x;
        playerState.y = respawn.y;
        playerState.z = respawn.z;
        playerState.prevX = respawn.x;
        playerState.prevY = respawn.y;
        playerState.midX = null;
        playerState.midY = null;
        playerState.targetX = respawn.x;
        playerState.targetY = respawn.y;
        playerState.action = 'IDLE';
        playerState.turnLock = false;
        playerState.actionVisualReady = true;
        clearPlayerCombatTarget();
        if (typeof clearMinimapDestination === 'function') clearMinimapDestination();
        if (typeof addChatMessage === 'function') addChatMessage(PLAYER_DEFEAT_MESSAGE, 'warn');

        for (let i = 0; i < combatEnemyStates.length; i++) {
            const enemyState = combatEnemyStates[i];
            if (enemyState.lockedTargetId === PLAYER_TARGET_ID) beginEnemyReturn(enemyState);
        }
    }

    function validatePlayerTargetLock() {
        const lockedEnemy = getPlayerLockedEnemy();
        if (!lockedEnemy) {
            clearPlayerCombatTarget();
            return null;
        }
        if (!isEnemyAlive(lockedEnemy)) {
            clearPlayerCombatTarget();
            return null;
        }
        const pursuitPath = resolvePathToEnemy(lockedEnemy);
        if (pursuitPath === null) {
            clearPlayerCombatTarget();
            return null;
        }
        playerState.targetX = lockedEnemy.x;
        playerState.targetY = lockedEnemy.y;
        return {
            enemyState: lockedEnemy,
            pursuitPath
        };
    }

    function validateEnemyTargetLock(enemyState) {
        if (!isEnemyAlive(enemyState)) return null;
        if (!isPlayerAlive()) {
            beginEnemyReturn(enemyState);
            return null;
        }
        const playerTile = { x: playerState.x, y: playerState.y, z: playerState.z };
        const homeTile = enemyState.resolvedHomeTile || enemyState.resolvedSpawnTile;
        if (!getSquareRange(homeTile, playerTile, enemyState.resolvedChaseRange)) {
            beginEnemyReturn(enemyState);
            return null;
        }
        return enemyState;
    }

    function acquireAggressiveEnemyTargets() {
        if (!isPlayerAlive()) return;
        const playerTile = { x: playerState.x, y: playerState.y, z: playerState.z };
        for (let i = 0; i < combatEnemyStates.length; i++) {
            const enemyState = combatEnemyStates[i];
            if (!isEnemyAlive(enemyState)) continue;
            if (enemyState.currentState !== 'idle') continue;
            const enemyType = getEnemyDefinition(enemyState.enemyId);
            if (!enemyType || enemyType.behavior.aggroType !== 'aggressive') continue;
            if (!getSquareRange(enemyState, playerTile, enemyState.resolvedAggroRadius)) continue;
            const pursuitPath = resolvePathToPlayer(enemyState);
            if (pursuitPath === null) continue;
            enemyState.currentState = 'aggroed';
            enemyState.lockedTargetId = PLAYER_TARGET_ID;
            enemyState.lastDamagerId = PLAYER_TARGET_ID;
        }
    }

    function collectReadyAttacks(playerLockState) {
        const attacks = [];
        const playerSnapshot = getPlayerCombatSnapshot();
        if (playerLockState && playerSnapshot && playerSnapshot.canAttack && playerState.remainingAttackCooldown === 0) {
            if (isWithinMeleeRange(playerState, playerLockState.enemyState)) {
                facePlayerTowards(playerLockState.enemyState);
                attacks.push({
                    attackerKind: 'player',
                    attackerId: PLAYER_TARGET_ID,
                    targetKind: 'enemy',
                    targetId: playerLockState.enemyState.runtimeId,
                    snapshot: playerSnapshot
                });
            }
        }

        for (let i = 0; i < combatEnemyStates.length; i++) {
            const enemyState = combatEnemyStates[i];
            if (!isEnemyAlive(enemyState)) continue;
            if (enemyState.currentState !== 'aggroed' || enemyState.lockedTargetId !== PLAYER_TARGET_ID) continue;
            if (enemyState.remainingAttackCooldown > 0 || !isPlayerAlive()) continue;
            const enemySnapshot = getEnemyCombatSnapshot(enemyState);
            if (!enemySnapshot) continue;
            if (!isWithinMeleeRange(enemyState, playerState)) continue;
            faceEnemyTowards(enemyState, playerState);
            attacks.push({
                attackerKind: 'enemy',
                attackerId: enemyState.runtimeId,
                targetKind: 'player',
                targetId: PLAYER_TARGET_ID,
                snapshot: enemySnapshot
            });
        }

        return attacks;
    }

    function resolveAttackBatch(attacks) {
        const results = [];
        let playerDamageTotal = 0;
        const playerAttackers = [];

        for (let i = 0; i < attacks.length; i++) {
            const attack = attacks[i];
            if (attack.attackerKind === 'player') {
                const enemyState = getCombatEnemyState(attack.targetId);
                if (!isEnemyAlive(enemyState)) continue;
                const enemySnapshot = getEnemyCombatSnapshot(enemyState);
                if (!enemySnapshot) continue;
                const landed = combatRuntime.rollOpposedHitCheck(attack.snapshot.attackValue, enemySnapshot.defenseValue);
                const damage = landed ? combatRuntime.rollDamage(attack.snapshot.maxHit) : 0;
                results.push({
                    attackerKind: 'player',
                    attackerId: PLAYER_TARGET_ID,
                    targetKind: 'enemy',
                    targetId: enemyState.runtimeId,
                    landed,
                    damage,
                    tickCycle: attack.snapshot.attackTickCycle
                });
                continue;
            }

            const enemyState = getCombatEnemyState(attack.attackerId);
            if (!isEnemyAlive(enemyState) || !isPlayerAlive()) continue;
            const playerSnapshot = getPlayerCombatSnapshot();
            if (!playerSnapshot) continue;
            const landed = combatRuntime.rollOpposedHitCheck(attack.snapshot.attackValue, playerSnapshot.defenseValue);
            const damage = landed ? combatRuntime.rollDamage(attack.snapshot.maxHit) : 0;
            playerDamageTotal += damage;
            playerAttackers.push(enemyState.runtimeId);
            results.push({
                attackerKind: 'enemy',
                attackerId: enemyState.runtimeId,
                targetKind: 'player',
                targetId: PLAYER_TARGET_ID,
                landed,
                damage,
                tickCycle: attack.snapshot.attackTickCycle
            });
        }

        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (result.attackerKind === 'player') {
                playerState.lastAttackTick = currentTick;
                playerState.remainingAttackCooldown = Math.max(1, Math.floor(result.tickCycle));
                playerState.inCombat = true;
                if (playerRig && playerRig.userData && playerRig.userData.rig) {
                    playerRig.userData.rig.attackTrigger = Date.now();
                }
                const enemyState = getCombatEnemyState(result.targetId);
                if (!enemyState || !isEnemyAlive(enemyState)) continue;
                enemyState.lastDamagerId = PLAYER_TARGET_ID;
                if (typeof spawnHitsplat === 'function') spawnHitsplat(result.damage, enemyState.x, enemyState.y);
                if (result.damage > 0) {
                    enemyState.currentHealth = Math.max(0, enemyState.currentHealth - result.damage);
                    if (typeof addSkillXp === 'function') {
                        addSkillXp(resolvePlayerAttackSkill(), result.damage * 4);
                        addSkillXp('hitpoints', result.damage);
                    }
                }
                if (enemyState.currentHealth > 0) {
                    const shouldSetOpeningCooldown = enemyState.currentState !== 'aggroed' || enemyState.lockedTargetId !== PLAYER_TARGET_ID;
                    enemyState.currentState = 'aggroed';
                    enemyState.lockedTargetId = PLAYER_TARGET_ID;
                    enemyState.lastDamagerId = PLAYER_TARGET_ID;
                    if (shouldSetOpeningCooldown) enemyState.remainingAttackCooldown = 1;
                }
            } else {
                const enemyState = getCombatEnemyState(result.attackerId);
                if (!enemyState || !isEnemyAlive(enemyState)) continue;
                enemyState.attackTriggerAt = Date.now();
                enemyState.remainingAttackCooldown = Math.max(1, Math.floor(result.tickCycle));
                enemyState.currentState = 'aggroed';
                enemyState.lockedTargetId = PLAYER_TARGET_ID;
                enemyState.lastDamagerId = PLAYER_TARGET_ID;
                playerState.lastDamagerEnemyId = enemyState.runtimeId;
                playerState.inCombat = true;
                if (typeof spawnHitsplat === 'function') spawnHitsplat(result.damage, playerState.x, playerState.y);
            }
        }

        if (playerDamageTotal > 0 && typeof applyHitpointDamage === 'function') {
            applyHitpointDamage(playerDamageTotal, 0);
        }

        for (let i = 0; i < combatEnemyStates.length; i++) {
            const enemyState = combatEnemyStates[i];
            if (!isEnemyAlive(enemyState) && enemyState.currentState !== 'dead') defeatEnemy(enemyState);
        }

        if (!isPlayerAlive()) {
            applyPlayerDefeat();
        } else if (!getPlayerLockedEnemy() && playerState.autoRetaliateEnabled && playerAttackers.length > 0) {
            lockPlayerCombatTarget(playerAttackers[0]);
        }

        return results;
    }

    function movePlayerTowardLockedTarget(playerLockState, attackedThisTick) {
        if (!playerLockState || attackedThisTick) return;
        if (playerState.action === 'SKILLING: FLETCHING') return;
        if (playerLockState.pursuitPath && playerLockState.pursuitPath.length > 0) {
            playerState.path = playerLockState.pursuitPath;
            playerState.action = 'WALKING';
            playerState.inCombat = true;
        } else if (isWithinMeleeRange(playerState, playerLockState.enemyState)) {
            facePlayerTowards(playerLockState.enemyState);
            playerState.action = 'COMBAT: MELEE';
            playerState.inCombat = true;
        }
    }

    function moveEnemyToStep(enemyState, nextStep) {
        if (!enemyState || !nextStep) return false;
        const nextX = Number.isFinite(nextStep.x) ? Math.floor(nextStep.x) : enemyState.x;
        const nextY = Number.isFinite(nextStep.y) ? Math.floor(nextStep.y) : enemyState.y;
        if (nextX === enemyState.x && nextY === enemyState.y) return false;
        enemyState.prevX = enemyState.x;
        enemyState.prevY = enemyState.y;
        enemyState.x = nextX;
        enemyState.y = nextY;
        enemyState.moveTriggerAt = Date.now();
        faceEnemyTowards(enemyState, nextStep);
        markCombatEnemyOccupancyDirty();
        return true;
    }

    function updateEnemyMovement(attacks) {
        const attackedEnemyIds = new Set(attacks.filter((entry) => entry.attackerKind === 'enemy').map((entry) => entry.attackerId));
        const reservedTiles = new Set();
        for (let i = 0; i < combatEnemyStates.length; i++) {
            const enemyState = combatEnemyStates[i];
            if (isEnemyAlive(enemyState)) reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);
        }

        for (let i = 0; i < combatEnemyStates.length; i++) {
            const enemyState = combatEnemyStates[i];
            if (!isEnemyAlive(enemyState) || attackedEnemyIds.has(enemyState.runtimeId)) continue;
            reservedTiles.delete(`${enemyState.x},${enemyState.y},${enemyState.z}`);

            if (enemyState.currentState === 'returning') {
                const returnPath = resolvePathToHome(enemyState);
                if (returnPath === null || returnPath.length === 0) {
                    restoreEnemyAtHome(enemyState);
                    reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);
                    continue;
                }
                const homeStep = returnPath[0];
                const homeKey = `${homeStep.x},${homeStep.y},${enemyState.z}`;
                if (!reservedTiles.has(homeKey)) moveEnemyToStep(enemyState, homeStep);
                reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);
                continue;
            }

            if (enemyState.currentState !== 'aggroed' || enemyState.lockedTargetId !== PLAYER_TARGET_ID) {
                reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);
                continue;
            }

            if (!isPlayerAlive()) {
                beginEnemyReturn(enemyState);
                reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);
                continue;
            }

            if (isWithinMeleeRange(enemyState, playerState)) {
                faceEnemyTowards(enemyState, playerState);
                reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);
                continue;
            }

            const pursuitPath = resolvePathToPlayer(enemyState);
            if (pursuitPath === null) {
                beginEnemyReturn(enemyState);
                reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);
                continue;
            }
            if (pursuitPath.length === 0) {
                reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);
                continue;
            }

            const nextStep = pursuitPath[0];
            const nextKey = `${nextStep.x},${nextStep.y},${enemyState.z}`;
            if (!reservedTiles.has(nextKey)) moveEnemyToStep(enemyState, nextStep);
            reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);
        }
    }

    function processCombatTick() {
        ensureCombatEnemyWorldReady();
        if (!combatRuntime || !Array.isArray(combatEnemyStates)) return;
        if (!isPlayerAlive()) {
            applyPlayerDefeat();
            refreshCombatEnemyOccupancy();
            return;
        }

        playerState.remainingAttackCooldown = combatRuntime.decrementCooldown(playerState.remainingAttackCooldown || 0);

        for (let i = 0; i < combatEnemyStates.length; i++) {
            const enemyState = combatEnemyStates[i];
            if (enemyState.currentState === 'dead' && Number.isFinite(enemyState.respawnAtTick) && currentTick >= enemyState.respawnAtTick) {
                respawnEnemy(enemyState);
                continue;
            }
            if (isEnemyAlive(enemyState)) {
                enemyState.remainingAttackCooldown = combatRuntime.decrementCooldown(enemyState.remainingAttackCooldown || 0);
            }
        }

        for (let i = 0; i < combatEnemyStates.length; i++) {
            const enemyState = combatEnemyStates[i];
            if (enemyState.currentState === 'aggroed') validateEnemyTargetLock(enemyState);
        }

        acquireAggressiveEnemyTargets();

        const playerLockState = validatePlayerTargetLock();
        const attacks = collectReadyAttacks(playerLockState);
        const attackResults = resolveAttackBatch(attacks);
        const playerAttackedThisTick = attackResults.some((entry) => entry.attackerKind === 'player');

        if (playerAttackedThisTick && isPlayerAlive()) {
            playerState.action = 'COMBAT: MELEE';
            playerState.path = [];
        }

        if (isPlayerAlive()) {
            movePlayerTowardLockedTarget(playerLockState, playerAttackedThisTick);
        }

        updateEnemyMovement(attackResults);
        refreshCombatEnemyOccupancy();

        if (!playerState.lockedTargetId && playerState.action === 'COMBAT: MELEE') playerState.action = 'IDLE';
    }

    function ensureCombatEnemyRenderLayer() {
        if (!scene || typeof THREE === 'undefined') return null;
        if (!combatEnemyRenderLayer) {
            combatEnemyRenderLayer = new THREE.Group();
            combatEnemyRenderLayer.name = 'combat-enemies';
            scene.add(combatEnemyRenderLayer);
        }
        return combatEnemyRenderLayer;
    }

    function createRatRenderer(enemyState, enemyType) {
        const group = new THREE.Group();
        group.rotation.order = 'YXZ';

        const furMaterial = new THREE.MeshLambertMaterial({ color: 0x6b6258, flatShading: true });
        const bellyMaterial = new THREE.MeshLambertMaterial({ color: 0xcbb7a2, flatShading: true });
        const tailMaterial = new THREE.MeshLambertMaterial({ color: 0xa7847a, flatShading: true });

        const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 10), furMaterial);
        body.scale.set(1.35, 0.72, 1.75);
        body.position.set(0, 0.2, 0);

        const belly = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), bellyMaterial);
        belly.scale.set(1.0, 0.55, 1.1);
        belly.position.set(0, 0.12, 0.1);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), furMaterial);
        head.scale.set(1.0, 0.92, 1.15);
        head.position.set(0, 0.24, 0.34);

        const earLeft = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), furMaterial);
        const earRight = earLeft.clone();
        earLeft.position.set(0.09, 0.35, 0.35);
        earRight.position.set(-0.09, 0.35, 0.35);

        const tailGeometry = new THREE.CylinderGeometry(0.022, 0.012, 0.48, 5);
        tailGeometry.rotateX(Math.PI / 2);
        const tail = new THREE.Mesh(tailGeometry, tailMaterial);
        tail.position.set(0, 0.14, -0.42);
        tail.rotation.x = Math.PI / 8;

        const hitbox = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.5, 0.9),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        hitbox.position.y = 0.24;
        hitbox.userData = {
            type: 'ENEMY',
            gridX: enemyState.x,
            gridY: enemyState.y,
            z: enemyState.z,
            name: enemyType.displayName,
            uid: enemyState.runtimeId
        };

        group.add(body, belly, head, earLeft, earRight, tail, hitbox);
        return { group, hitbox, kind: 'rat', body, head, tail };
    }

    function createHumanoidEnemyRenderer(enemyState, enemyType) {
        const group = createHumanoidModel(enemyType.appearance && Number.isFinite(enemyType.appearance.npcType) ? enemyType.appearance.npcType : 3);
        const hitbox = new THREE.Mesh(
            new THREE.BoxGeometry(1.0, 2.0, 1.0),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        hitbox.position.y = 1.0;
        hitbox.userData = {
            type: 'ENEMY',
            gridX: enemyState.x,
            gridY: enemyState.y,
            z: enemyState.z,
            name: enemyType.displayName,
            uid: enemyState.runtimeId
        };
        group.add(hitbox);
        return { group, hitbox, kind: 'humanoid' };
    }

    function createEnemyRenderer(enemyState) {
        const layer = ensureCombatEnemyRenderLayer();
        const enemyType = getEnemyDefinition(enemyState.enemyId);
        if (!layer || !enemyType) return null;

        let renderer = null;
        if (enemyType.appearance && enemyType.appearance.kind === 'rat') renderer = createRatRenderer(enemyState, enemyType);
        else renderer = createHumanoidEnemyRenderer(enemyState, enemyType);

        renderer.group.position.set(enemyState.x, 0, enemyState.y);
        renderer.group.rotation.y = enemyState.facingYaw || 0;
        layer.add(renderer.group);
        environmentMeshes.push(renderer.hitbox);
        combatEnemyRenderersById[enemyState.runtimeId] = renderer;
        return renderer;
    }

    function updateEnemyRenderer(enemyState, renderer, frameNow) {
        const terrainHeight = getVisualHeight(enemyState.x, enemyState.y, enemyState.z);
        const idlePhase = ((frameNow + (enemyState.x * 37) + (enemyState.y * 19)) % 1200) / 1200 * Math.PI * 2;
        const idleBob = Math.sin(idlePhase) * 0.04;
        renderer.group.position.set(enemyState.x, terrainHeight + idleBob, enemyState.y);

        if (enemyState.facingYaw !== undefined) {
            let diff = enemyState.facingYaw - renderer.group.rotation.y;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            renderer.group.rotation.y += diff * 0.25;
        }

        renderer.hitbox.userData.gridX = enemyState.x;
        renderer.hitbox.userData.gridY = enemyState.y;
        renderer.hitbox.userData.z = enemyState.z;

        if (renderer.kind === 'rat') {
            const attackAge = frameNow - (enemyState.attackTriggerAt || 0);
            const attackPulse = attackAge >= 0 && attackAge < 420 ? Math.sin((attackAge / 420) * Math.PI) : 0;
            renderer.body.scale.set(1.35, 0.72 + (attackPulse * 0.08), 1.75 - (attackPulse * 0.08));
            renderer.head.position.z = 0.34 + (attackPulse * 0.14);
            renderer.tail.rotation.y = Math.sin(idlePhase * 2) * 0.35;
            renderer.tail.rotation.x = Math.PI / 8;
            return;
        }

        const rig = renderer.group.userData && renderer.group.userData.rig ? renderer.group.userData.rig : null;
        if (!rig) return;
        const attackAge = frameNow - (enemyState.attackTriggerAt || 0);
        const attackPulse = attackAge >= 0 && attackAge < 420 ? Math.sin((attackAge / 420) * Math.PI) : 0;

        rig.leftArm.rotation.set(Math.sin(idlePhase) * 0.06, 0, 0);
        rig.rightArm.rotation.set(-Math.sin(idlePhase) * 0.06, 0, 0);
        rig.leftLowerArm.rotation.set(-0.04, 0, 0);
        rig.rightLowerArm.rotation.set(-0.04, 0, 0);
        rig.leftLeg.rotation.x = 0;
        rig.rightLeg.rotation.x = 0;
        if (rig.leftLowerLeg) rig.leftLowerLeg.rotation.x = 0;
        if (rig.rightLowerLeg) rig.rightLowerLeg.rotation.x = 0;
        if (rig.torso) rig.torso.rotation.set(-0.02, attackPulse * 0.24, 0);
        if (rig.head) rig.head.rotation.set(-0.02, -attackPulse * 0.12, 0);
        if (attackPulse > 0) {
            rig.rightArm.rotation.x = -attackPulse * 1.45;
            rig.rightArm.rotation.z = -attackPulse * 0.18;
            rig.leftArm.rotation.x = attackPulse * 0.2;
        }
    }

    function updateCombatRenderers(frameNow) {
        ensureCombatEnemyWorldReady();
        if (!scene || typeof THREE === 'undefined') return;

        for (let i = 0; i < combatEnemyStates.length; i++) {
            const enemyState = combatEnemyStates[i];
            if (!isEnemyAlive(enemyState)) {
                clearEnemyRenderer(enemyState.runtimeId);
                continue;
            }
            let renderer = combatEnemyRenderersById[enemyState.runtimeId];
            if (!renderer) renderer = createEnemyRenderer(enemyState);
            if (!renderer) continue;
            updateEnemyRenderer(enemyState, renderer, frameNow);
        }
    }

    window.initCombatWorldState = initCombatWorldState;
    window.processCombatTick = processCombatTick;
    window.updateCombatRenderers = updateCombatRenderers;
    window.clearCombatEnemyRenderers = clearCombatEnemyRenderers;
    window.clearPlayerCombatTarget = clearPlayerCombatTarget;
    window.lockPlayerCombatTarget = lockPlayerCombatTarget;
    window.getCombatEnemyState = getCombatEnemyState;
})();
