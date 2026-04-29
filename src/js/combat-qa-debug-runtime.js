(function () {
    function getWindowRef(context = {}) {
        return context.windowRef || (typeof window !== 'undefined' ? window : {});
    }

    function getNowMs(context = {}) {
        return Number.isFinite(context.nowMs) ? context.nowMs : Date.now();
    }

    function addChat(context, message, type = 'info') {
        if (context && typeof context.addChatMessage === 'function') {
            context.addChatMessage(message, type);
        }
    }

    function getSnapshot(context = {}) {
        const windowRef = getWindowRef(context);
        const playerState = context.playerState || {};
        const playerRig = context.playerRig || null;
        const hudSnapshot = (typeof context.getCombatHudSnapshot === 'function')
            ? context.getCombatHudSnapshot()
            : null;
        const animationBridge = context.animationBridge || windowRef.AnimationRuntimeBridge || null;
        const lockedTargetId = playerState && playerState.lockedTargetId
            ? String(playerState.lockedTargetId)
            : '';
        const lockedEnemy = (lockedTargetId && typeof context.getCombatEnemyState === 'function')
            ? context.getCombatEnemyState(lockedTargetId)
            : null;
        const lockedEnemyAnimation = (lockedTargetId && typeof context.getCombatEnemyAnimationDebugState === 'function')
            ? context.getCombatEnemyAnimationDebugState(lockedTargetId, getNowMs(context))
            : null;
        const playerRigRuntime = playerRig && playerRig.userData ? playerRig.userData.rig : null;
        const animationRigId = (playerRig && playerRig.userData && playerRig.userData.animationRigId)
            ? playerRig.userData.animationRigId
            : 'player_humanoid_v1';
        const animationController = (animationBridge
            && playerRig
            && typeof animationBridge.getLegacyControllerDebugState === 'function')
            ? animationBridge.getLegacyControllerDebugState(playerRig, animationRigId, getNowMs(context))
            : null;
        const pursuitDebugState = windowRef.__qaCombatDebugLastPlayerPursuitState
            ? {
                tick: Number.isFinite(windowRef.__qaCombatDebugLastPlayerPursuitState.tick)
                    ? Math.floor(windowRef.__qaCombatDebugLastPlayerPursuitState.tick)
                    : null,
                runtimeId: windowRef.__qaCombatDebugLastPlayerPursuitState.runtimeId || null,
                enemyId: windowRef.__qaCombatDebugLastPlayerPursuitState.enemyId || null,
                state: windowRef.__qaCombatDebugLastPlayerPursuitState.state || null,
                pathLength: Number.isFinite(windowRef.__qaCombatDebugLastPlayerPursuitState.pathLength)
                    ? Math.floor(windowRef.__qaCombatDebugLastPlayerPursuitState.pathLength)
                    : null,
                occupancyIgnoredPathLength: Number.isFinite(windowRef.__qaCombatDebugLastPlayerPursuitState.occupancyIgnoredPathLength)
                    ? Math.floor(windowRef.__qaCombatDebugLastPlayerPursuitState.occupancyIgnoredPathLength)
                    : null
            }
            : null;
        const autoRetaliateDebugState = windowRef.__qaCombatDebugLastAutoRetaliateSelection
            ? {
                tick: Number.isFinite(windowRef.__qaCombatDebugLastAutoRetaliateSelection.tick)
                    ? Math.floor(windowRef.__qaCombatDebugLastAutoRetaliateSelection.tick)
                    : null,
                runtimeId: windowRef.__qaCombatDebugLastAutoRetaliateSelection.runtimeId || null,
                enemyId: windowRef.__qaCombatDebugLastAutoRetaliateSelection.enemyId || null,
                displayName: windowRef.__qaCombatDebugLastAutoRetaliateSelection.displayName || null,
                distance: Number.isFinite(windowRef.__qaCombatDebugLastAutoRetaliateSelection.distance)
                    ? Math.floor(windowRef.__qaCombatDebugLastAutoRetaliateSelection.distance)
                    : null,
                combatLevel: Number.isFinite(windowRef.__qaCombatDebugLastAutoRetaliateSelection.combatLevel)
                    ? Math.floor(windowRef.__qaCombatDebugLastAutoRetaliateSelection.combatLevel)
                    : null,
                aggressorOrder: Number.isFinite(windowRef.__qaCombatDebugLastAutoRetaliateSelection.aggressorOrder)
                    ? Math.floor(windowRef.__qaCombatDebugLastAutoRetaliateSelection.aggressorOrder)
                    : null
            }
            : null;

        return {
            tick: Number.isFinite(context.currentTick) ? context.currentTick : 0,
            player: {
                x: Number.isFinite(playerState && playerState.x) ? playerState.x : 0,
                y: Number.isFinite(playerState && playerState.y) ? playerState.y : 0,
                z: Number.isFinite(playerState && playerState.z) ? playerState.z : 0,
                targetX: Number.isFinite(playerState && playerState.targetX) ? playerState.targetX : 0,
                targetY: Number.isFinite(playerState && playerState.targetY) ? playerState.targetY : 0,
                action: String((playerState && playerState.action) || 'IDLE'),
                inCombat: !!(playerState && playerState.inCombat),
                remainingAttackCooldown: Number.isFinite(playerState && playerState.remainingAttackCooldown)
                    ? Math.max(0, Math.floor(playerState.remainingAttackCooldown))
                    : 0,
                lockedTargetId: lockedTargetId || null,
                targetObj: (playerState && playerState.targetObj) || null,
                pathLength: Array.isArray(playerState && playerState.path) ? playerState.path.length : 0,
                lastAttackTick: Number.isFinite(playerState && playerState.lastAttackTick) ? playerState.lastAttackTick : null,
                lastDamagerEnemyId: (playerState && playerState.lastDamagerEnemyId) || null,
                lastClearReason: (typeof windowRef.__qaCombatDebugLastClearReason === 'string' && windowRef.__qaCombatDebugLastClearReason)
                    ? windowRef.__qaCombatDebugLastClearReason
                    : null,
                lastClearTick: Number.isFinite(windowRef.__qaCombatDebugLastClearTick)
                    ? Math.floor(windowRef.__qaCombatDebugLastClearTick)
                    : null
            },
            lastEnemyAttack: windowRef.__qaCombatDebugLastEnemyAttackResult
                ? {
                    tick: Number.isFinite(windowRef.__qaCombatDebugLastEnemyAttackResult.tick)
                        ? Math.floor(windowRef.__qaCombatDebugLastEnemyAttackResult.tick)
                        : null,
                    attackerId: windowRef.__qaCombatDebugLastEnemyAttackResult.attackerId || null,
                    enemyId: windowRef.__qaCombatDebugLastEnemyAttackResult.enemyId || null,
                    landed: !!windowRef.__qaCombatDebugLastEnemyAttackResult.landed,
                    damage: Number.isFinite(windowRef.__qaCombatDebugLastEnemyAttackResult.damage)
                        ? Math.floor(windowRef.__qaCombatDebugLastEnemyAttackResult.damage)
                        : 0,
                    isTrainingDummyAttack: !!windowRef.__qaCombatDebugLastEnemyAttackResult.isTrainingDummyAttack
                }
                : null,
            animation: {
                attackTick: (playerRigRuntime && Number.isFinite(playerRigRuntime.attackTick))
                    ? Math.floor(playerRigRuntime.attackTick)
                    : null,
                attackStartedAtMs: (playerRigRuntime && Number.isFinite(playerRigRuntime.attackAnimationStartedAt))
                    ? Math.floor(playerRigRuntime.attackAnimationStartedAt)
                    : null,
                hitReactionTick: (playerRigRuntime && Number.isFinite(playerRigRuntime.hitReactionTick))
                    ? Math.floor(playerRigRuntime.hitReactionTick)
                    : null,
                hitReactionStartedAtMs: (playerRigRuntime && Number.isFinite(playerRigRuntime.hitReactionStartedAt))
                    ? Math.floor(playerRigRuntime.hitReactionStartedAt)
                    : null,
                controller: animationController
            },
            enemy: lockedEnemy ? {
                runtimeId: String(lockedEnemy.runtimeId || ''),
                enemyId: String(lockedEnemy.enemyId || ''),
                x: Number.isFinite(lockedEnemy.x) ? lockedEnemy.x : 0,
                y: Number.isFinite(lockedEnemy.y) ? lockedEnemy.y : 0,
                z: Number.isFinite(lockedEnemy.z) ? lockedEnemy.z : 0,
                state: String(lockedEnemy.currentState || ''),
                currentHealth: Number.isFinite(lockedEnemy.currentHealth) ? lockedEnemy.currentHealth : null,
                remainingAttackCooldown: Number.isFinite(lockedEnemy.remainingAttackCooldown)
                    ? Math.max(0, Math.floor(lockedEnemy.remainingAttackCooldown))
                    : 0,
                animation: lockedEnemyAnimation
            } : null,
            pursuit: pursuitDebugState,
            autoRetaliate: autoRetaliateDebugState,
            hud: hudSnapshot && typeof hudSnapshot === 'object'
                ? {
                    inCombat: !!hudSnapshot.inCombat,
                    playerRemainingAttackCooldown: Number.isFinite(hudSnapshot.playerRemainingAttackCooldown)
                        ? Math.max(0, Math.floor(hudSnapshot.playerRemainingAttackCooldown))
                        : 0,
                    target: hudSnapshot.target && typeof hudSnapshot.target === 'object'
                        ? {
                            label: String(hudSnapshot.target.label || ''),
                            state: String(hudSnapshot.target.state || ''),
                            distance: Number.isFinite(hudSnapshot.target.distance) ? hudSnapshot.target.distance : null,
                            inMeleeRange: !!hudSnapshot.target.inMeleeRange,
                            currentHealth: Number.isFinite(hudSnapshot.target.currentHealth) ? hudSnapshot.target.currentHealth : null,
                            maxHealth: Number.isFinite(hudSnapshot.target.maxHealth) ? hudSnapshot.target.maxHealth : null,
                            remainingAttackCooldown: Number.isFinite(hudSnapshot.target.remainingAttackCooldown)
                                ? Math.max(0, Math.floor(hudSnapshot.target.remainingAttackCooldown))
                                : 0
                        }
                        : null
                }
                : null
        };
    }

    function getSignature(context = {}, snapshot = null) {
        const state = snapshot && typeof snapshot === 'object' ? snapshot : getSnapshot(context);
        const player = state.player || {};
        const lastEnemyAttack = state.lastEnemyAttack || null;
        const animation = state.animation || {};
        const controller = animation.controller || null;
        const enemy = state.enemy || null;
        const pursuit = state.pursuit || null;
        const autoRetaliate = state.autoRetaliate || null;
        const hudTarget = state.hud && state.hud.target ? state.hud.target : null;
        const hud = state.hud || null;
        return [
            player.action || 'IDLE',
            player.inCombat ? 1 : 0,
            Number.isFinite(player.remainingAttackCooldown) ? player.remainingAttackCooldown : 0,
            player.lockedTargetId || '-',
            player.targetObj || '-',
            Number.isFinite(player.lastAttackTick) ? player.lastAttackTick : -1,
            player.lastDamagerEnemyId || '-',
            player.lastClearReason || '-',
            Number.isFinite(player.lastClearTick) ? player.lastClearTick : -1,
            enemy
                ? `${enemy.runtimeId || '-'}:${enemy.state || '-'}:${Number.isFinite(enemy.currentHealth) ? enemy.currentHealth : '-'}:${enemy.remainingAttackCooldown || 0}:${enemy.animation ? (enemy.animation.useWalkBaseClip ? 1 : 0) : -1}:${enemy.animation && Number.isFinite(enemy.animation.facingYaw) ? enemy.animation.facingYaw.toFixed(2) : '-'}:${enemy.animation && Number.isFinite(enemy.animation.groupRotationY) ? enemy.animation.groupRotationY.toFixed(2) : '-'}`
                : 'none',
            hudTarget
                ? `${hudTarget.state || '-'}:${Number.isFinite(hudTarget.currentHealth) ? hudTarget.currentHealth : '-'}:${Number.isFinite(hudTarget.maxHealth) ? hudTarget.maxHealth : '-'}:${hudTarget.inMeleeRange ? 1 : 0}:${hudTarget.remainingAttackCooldown || 0}`
                : 'none',
            hud ? (hud.inCombat ? 1 : 0) : -1,
            lastEnemyAttack
                ? `${Number.isFinite(lastEnemyAttack.tick) ? lastEnemyAttack.tick : -1}:${lastEnemyAttack.enemyId || '-'}:${lastEnemyAttack.landed ? 1 : 0}:${Number.isFinite(lastEnemyAttack.damage) ? lastEnemyAttack.damage : 0}`
                : 'none',
            pursuit
                ? `${pursuit.state || '-'}:${pursuit.runtimeId || '-'}:${Number.isFinite(pursuit.pathLength) ? pursuit.pathLength : -1}:${Number.isFinite(pursuit.occupancyIgnoredPathLength) ? pursuit.occupancyIgnoredPathLength : -1}`
                : 'none',
            autoRetaliate
                ? `${autoRetaliate.runtimeId || '-'}:${autoRetaliate.enemyId || '-'}:${Number.isFinite(autoRetaliate.distance) ? autoRetaliate.distance : -1}:${Number.isFinite(autoRetaliate.combatLevel) ? autoRetaliate.combatLevel : -1}:${Number.isFinite(autoRetaliate.aggressorOrder) ? autoRetaliate.aggressorOrder : -1}`
                : 'none',
            Number.isFinite(animation.attackTick) ? animation.attackTick : -1,
            Number.isFinite(animation.hitReactionTick) ? animation.hitReactionTick : -1,
            controller
                ? `${controller.baseClipId || '-'}:${controller.actionClipId || '-'}:${controller.winningRequest ? controller.winningRequest.clipId : '-'}:${controller.requestedActions && controller.requestedActions.length ? controller.requestedActions.map((request) => request.clipId).join(',') : '-'}`
                : 'none'
        ].join('|');
    }

    function emitClearHistory(context = {}) {
        const windowRef = getWindowRef(context);
        const clearEvents = Array.isArray(windowRef.__qaCombatDebugClearEvents) ? windowRef.__qaCombatDebugClearEvents : [];
        if (clearEvents.length === 0) {
            addChat(context, '[QA combatdbg] clear history is empty.', 'info');
            return;
        }
        addChat(context, `[QA combatdbg] clear history count=${clearEvents.length}`, 'info');
        const startIndex = Math.max(0, clearEvents.length - 12);
        for (let i = startIndex; i < clearEvents.length; i++) {
            const event = clearEvents[i] || {};
            const tickLabel = Number.isFinite(event.tick) ? event.tick : 'none';
            const reasonLabel = event.reason || 'generic';
            const blockedLabel = event.blocked ? 'yes' : 'no';
            const forcedLabel = event.forced ? 'yes' : 'no';
            const lockLabel = event.lockBeforeClear || 'none';
            const actionLabel = event.action || 'IDLE';
            const pathLabel = Number.isFinite(event.pathLength) ? event.pathLength : 0;
            addChat(
                context,
                `[QA combatdbg] clear#${i + 1} tick=${tickLabel} reason=${reasonLabel} forced=${forcedLabel} blocked=${blockedLabel} lockBefore=${lockLabel} action=${actionLabel} path=${pathLabel}`,
                'info'
            );
        }
    }

    function emitSnapshot(context = {}, reason = 'manual') {
        const snapshot = getSnapshot(context);
        const player = snapshot.player || {};
        const lastEnemyAttack = snapshot.lastEnemyAttack || null;
        const animation = snapshot.animation || {};
        const controller = animation.controller || null;
        const enemy = snapshot.enemy || null;
        const pursuit = snapshot.pursuit || null;
        const autoRetaliate = snapshot.autoRetaliate || null;
        const hud = snapshot.hud || null;
        const hudTarget = hud && hud.target ? hud.target : null;

        addChat(
            context,
            `[QA combatdbg] reason=${reason} tick=${snapshot.tick} action=${player.action || 'IDLE'} inCombat=${player.inCombat ? 'yes' : 'no'} pCD=${Number.isFinite(player.remainingAttackCooldown) ? player.remainingAttackCooldown : 0} lock=${player.lockedTargetId || 'none'} targetObj=${player.targetObj || 'none'} pos=(${player.x},${player.y},${player.z}) target=(${player.targetX},${player.targetY}) path=${Number.isFinite(player.pathLength) ? player.pathLength : 0} lastAtk=${Number.isFinite(player.lastAttackTick) ? player.lastAttackTick : 'none'} lastDamager=${player.lastDamagerEnemyId || 'none'}`,
            'info'
        );
        const includeClearReason =
            !!player.lastClearReason
            && (reason === 'manual' || (Number.isFinite(player.lastClearTick) && player.lastClearTick === snapshot.tick));
        if (includeClearReason) {
            addChat(
                context,
                `[QA combatdbg] clear reason=${player.lastClearReason} atTick=${Number.isFinite(player.lastClearTick) ? player.lastClearTick : 'none'}`,
                'info'
            );
        }
        addChat(
            context,
            `[QA combatdbg] pursuit state=${pursuit && pursuit.state ? pursuit.state : 'none'} lock=${pursuit && pursuit.runtimeId ? pursuit.runtimeId : 'none'} path=${pursuit && Number.isFinite(pursuit.pathLength) ? pursuit.pathLength : 'none'} occIgnored=${pursuit && Number.isFinite(pursuit.occupancyIgnoredPathLength) ? pursuit.occupancyIgnoredPathLength : 'none'}`,
            'info'
        );
        addChat(
            context,
            `[QA combatdbg] autoRetaliate target=${autoRetaliate && autoRetaliate.runtimeId ? autoRetaliate.runtimeId : 'none'} enemy=${autoRetaliate && autoRetaliate.enemyId ? autoRetaliate.enemyId : 'none'} dist=${autoRetaliate && Number.isFinite(autoRetaliate.distance) ? autoRetaliate.distance : 'none'} level=${autoRetaliate && Number.isFinite(autoRetaliate.combatLevel) ? autoRetaliate.combatLevel : 'none'} order=${autoRetaliate && Number.isFinite(autoRetaliate.aggressorOrder) ? autoRetaliate.aggressorOrder : 'none'}`,
            'info'
        );
        addChat(
            context,
            `[QA combatdbg] anim atkTick=${Number.isFinite(animation.attackTick) ? animation.attackTick : 'none'} atkStart=${Number.isFinite(animation.attackStartedAtMs) ? animation.attackStartedAtMs : 'none'} hitTick=${Number.isFinite(animation.hitReactionTick) ? animation.hitReactionTick : 'none'} hitStart=${Number.isFinite(animation.hitReactionStartedAtMs) ? animation.hitReactionStartedAtMs : 'none'} base=${controller && controller.baseClipId ? controller.baseClipId : 'none'} action=${controller && controller.actionClipId ? controller.actionClipId : 'none'} winner=${controller && controller.winningRequest ? controller.winningRequest.clipId : 'none'} requests=${controller && controller.requestedActions && controller.requestedActions.length ? controller.requestedActions.map((request) => `${request.clipId}@p${request.priority}`).join(',') : 'none'}`,
            'info'
        );
        addChat(
            context,
            `[QA combatdbg] lastEnemyAttack tick=${lastEnemyAttack && Number.isFinite(lastEnemyAttack.tick) ? lastEnemyAttack.tick : 'none'} enemy=${lastEnemyAttack && lastEnemyAttack.enemyId ? lastEnemyAttack.enemyId : 'none'} landed=${lastEnemyAttack ? (lastEnemyAttack.landed ? 'yes' : 'no') : 'none'} damage=${lastEnemyAttack && Number.isFinite(lastEnemyAttack.damage) ? lastEnemyAttack.damage : 'none'} dummy=${lastEnemyAttack ? (lastEnemyAttack.isTrainingDummyAttack ? 'yes' : 'no') : 'none'}`,
            'info'
        );
        if (enemy) {
            addChat(
                context,
                `[QA combatdbg] enemy runtime=${enemy.runtimeId || 'none'} type=${enemy.enemyId || 'none'} state=${enemy.state || 'none'} hp=${Number.isFinite(enemy.currentHealth) ? enemy.currentHealth : 'unknown'} eCD=${Number.isFinite(enemy.remainingAttackCooldown) ? enemy.remainingAttackCooldown : 0} ePos=(${enemy.x},${enemy.y},${enemy.z})`,
                'info'
            );
            if (enemy.animation) {
                const enemyAnim = enemy.animation;
                const enemyController = enemyAnim.controller || null;
                addChat(
                    context,
                    `[QA combatdbg] enemy anim preset=${enemyAnim.modelPresetId || 'none'} set=${enemyAnim.animationSetId || 'none'} rig=${enemyAnim.animationRigId || 'none'} walkBase=${enemyAnim.useWalkBaseClip ? 'yes' : 'no'} moving=${enemyAnim.visuallyMoving ? 'yes' : 'no'} moveProgress=${Number.isFinite(enemyAnim.moveProgress) ? enemyAnim.moveProgress.toFixed(2) : 'none'} facing=${Number.isFinite(enemyAnim.facingYaw) ? enemyAnim.facingYaw.toFixed(2) : 'none'} renderYaw=${Number.isFinite(enemyAnim.groupRotationY) ? enemyAnim.groupRotationY.toFixed(2) : 'none'} intentMs=${enemyAnim.locomotionIntent && Number.isFinite(enemyAnim.locomotionIntent.remainingMs) ? enemyAnim.locomotionIntent.remainingMs : 0}`,
                    'info'
                );
                addChat(
                    context,
                    `[QA combatdbg] enemy clips base=${enemyController && enemyController.baseClipId ? enemyController.baseClipId : 'none'} action=${enemyController && enemyController.actionClipId ? enemyController.actionClipId : 'none'} winner=${enemyController && enemyController.winningRequest ? enemyController.winningRequest.clipId : 'none'} requests=${enemyController && enemyController.requestedActions && enemyController.requestedActions.length ? enemyController.requestedActions.map((request) => `${request.clipId}@p${request.priority}`).join(',') : 'none'}`,
                    'info'
                );
            }
        } else {
            addChat(context, '[QA combatdbg] enemy runtime=none', 'info');
        }
        if (hud) {
            addChat(
                context,
                `[QA combatdbg] hud inCombat=${hud.inCombat ? 'yes' : 'no'} pCD=${Number.isFinite(hud.playerRemainingAttackCooldown) ? hud.playerRemainingAttackCooldown : 0} hudTarget=${hudTarget ? hudTarget.label : 'none'} hudState=${hudTarget ? hudTarget.state : 'none'} hudHp=${hudTarget && Number.isFinite(hudTarget.currentHealth) ? hudTarget.currentHealth : 'none'}/${hudTarget && Number.isFinite(hudTarget.maxHealth) ? hudTarget.maxHealth : 'none'} dist=${hudTarget && Number.isFinite(hudTarget.distance) ? hudTarget.distance : 'none'} melee=${hudTarget && hudTarget.inMeleeRange ? 'yes' : 'no'} eCD=${hudTarget && Number.isFinite(hudTarget.remainingAttackCooldown) ? hudTarget.remainingAttackCooldown : 'none'}`,
                'info'
            );
        } else {
            addChat(context, '[QA combatdbg] hud unavailable', 'warn');
        }
        return snapshot;
    }

    window.CombatQaDebugRuntime = {
        getSnapshot,
        getSignature,
        emitClearHistory,
        emitSnapshot
    };
})();
