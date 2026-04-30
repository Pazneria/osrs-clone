(function () {
    function getDocumentRef(options = {}) {
        return options.documentRef || (typeof document !== 'undefined' ? document : null);
    }

    function getWindowRef(options = {}) {
        return options.windowRef || (typeof window !== 'undefined' ? window : {});
    }

    function ensureCombatAnimationDebugPanel(options = {}) {
        const documentRef = getDocumentRef(options);
        if (!documentRef || typeof documentRef.getElementById !== 'function' || typeof documentRef.createElement !== 'function') return null;
        let panel = documentRef.getElementById('combat-animation-debug-panel');
        if (panel) return panel;
        panel = documentRef.createElement('pre');
        panel.id = 'combat-animation-debug-panel';
        panel.style.position = 'fixed';
        panel.style.top = '12px';
        panel.style.right = '12px';
        panel.style.zIndex = '450';
        panel.style.minWidth = '320px';
        panel.style.maxWidth = '420px';
        panel.style.padding = '10px 12px';
        panel.style.background = 'rgba(12, 16, 24, 0.88)';
        panel.style.border = '1px solid rgba(255, 255, 255, 0.18)';
        panel.style.borderRadius = '8px';
        panel.style.color = '#d7e3ff';
        panel.style.fontFamily = 'Consolas, Menlo, monospace';
        panel.style.fontSize = '12px';
        panel.style.lineHeight = '1.35';
        panel.style.whiteSpace = 'pre-wrap';
        panel.style.pointerEvents = 'none';
        panel.style.display = 'none';
        if (documentRef.body && typeof documentRef.body.appendChild === 'function') documentRef.body.appendChild(panel);
        return panel;
    }

    function formatCombatAnimationDebugRequest(request) {
        if (!request || typeof request !== 'object') return 'none';
        return `${request.clipId || 'unknown'}@p${Number.isFinite(request.priority) ? request.priority : '?'} start=${Number.isFinite(request.startedAtMs) ? Math.floor(request.startedAtMs) : 'none'}`;
    }

    function isTimedAnimationActive(options = {}, startedAtMs, durationMs, frameNow) {
        return typeof options.isTimedAnimationActive === 'function'
            ? options.isTimedAnimationActive(startedAtMs, durationMs, frameNow)
            : false;
    }

    function updateCombatAnimationDebugPanel(options = {}) {
        const windowRef = getWindowRef(options);
        const rig = options.rig || null;
        const playerRigRef = options.playerRigRef || null;
        const frameNow = Number.isFinite(options.frameNow) ? options.frameNow : Date.now();
        const currentTick = Number.isFinite(options.currentTick) ? options.currentTick : null;
        const playerState = options.playerState || {};
        const animationRuntimeBridge = options.animationRuntimeBridge || windowRef.AnimationRuntimeBridge || null;
        const panel = ensureCombatAnimationDebugPanel(options);
        if (!panel) return null;
        if (!windowRef.QA_COMBAT_DEBUG) {
            panel.style.display = 'none';
            return panel;
        }

        const rigId = (playerRigRef && playerRigRef.userData && playerRigRef.userData.animationRigId)
            ? playerRigRef.userData.animationRigId
            : 'player_humanoid_v1';
        const controllerDebug = (animationRuntimeBridge
            && typeof animationRuntimeBridge.getLegacyControllerDebugState === 'function'
            && playerRigRef)
            ? animationRuntimeBridge.getLegacyControllerDebugState(playerRigRef, rigId, frameNow)
            : null;
        const attackActive = !!(rig && isTimedAnimationActive(options, rig.attackAnimationStartedAt, 1100, frameNow));
        const recoilOnTick = !!(rig && Number.isFinite(rig.hitReactionTick) && rig.hitReactionTick === currentTick);
        const recoilWindowActive = !!(rig && isTimedAnimationActive(options, rig.hitReactionStartedAt, 260, frameNow));
        const recoilRequested = recoilOnTick && recoilWindowActive;
        const requests = controllerDebug && Array.isArray(controllerDebug.requestedActions)
            ? controllerDebug.requestedActions
            : [];
        const lastEnemyAttack = windowRef.__qaCombatDebugLastEnemyAttackResult || null;
        const lockedTargetId = playerState && playerState.lockedTargetId
            ? String(playerState.lockedTargetId)
            : '';
        const enemyDebug = (lockedTargetId && typeof options.getCombatEnemyAnimationDebugState === 'function')
            ? options.getCombatEnemyAnimationDebugState(lockedTargetId, frameNow)
            : null;
        const enemyControllerDebug = enemyDebug && enemyDebug.controller ? enemyDebug.controller : null;
        const winningClipId = controllerDebug && controllerDebug.winningRequest
            ? controllerDebug.winningRequest.clipId
            : 'none';
        const blockedByPriority = attackActive && recoilRequested && winningClipId === 'player/combat_slash';
        const actionAgeMs = (controllerDebug && Number.isFinite(controllerDebug.actionAgeMs))
            ? Math.floor(controllerDebug.actionAgeMs)
            : null;
        const actionDurationMs = (controllerDebug && Number.isFinite(controllerDebug.actionDurationMs))
            ? Math.floor(controllerDebug.actionDurationMs)
            : null;
        panel.textContent = [
            'combat anim debug',
            `tick=${Number.isFinite(currentTick) ? currentTick : 'none'} action=${playerState && playerState.action ? playerState.action : 'IDLE'}`,
            `attack gate=${attackActive ? 'open' : 'closed'} attackTick=${rig && Number.isFinite(rig.attackTick) ? rig.attackTick : 'none'} attackStart=${rig && Number.isFinite(rig.attackAnimationStartedAt) ? Math.floor(rig.attackAnimationStartedAt) : 'none'}`,
            `last enemy attack tick=${lastEnemyAttack && Number.isFinite(lastEnemyAttack.tick) ? lastEnemyAttack.tick : 'none'} enemy=${lastEnemyAttack && lastEnemyAttack.enemyId ? lastEnemyAttack.enemyId : 'none'} landed=${lastEnemyAttack ? (lastEnemyAttack.landed ? 'yes' : 'no') : 'none'} damage=${lastEnemyAttack && Number.isFinite(lastEnemyAttack.damage) ? lastEnemyAttack.damage : 'none'} dummy=${lastEnemyAttack ? (lastEnemyAttack.isTrainingDummyAttack ? 'yes' : 'no') : 'none'}`,
            `recoil gate=${recoilRequested ? 'open' : 'closed'} hitTick=${rig && Number.isFinite(rig.hitReactionTick) ? rig.hitReactionTick : 'none'} currentTickMatch=${recoilOnTick ? 'yes' : 'no'} hitStart=${rig && Number.isFinite(rig.hitReactionStartedAt) ? Math.floor(rig.hitReactionStartedAt) : 'none'} window=${recoilWindowActive ? 'live' : 'dead'}`,
            `base=${controllerDebug && controllerDebug.baseClipId ? controllerDebug.baseClipId : 'none'}`,
            `action=${controllerDebug && controllerDebug.actionClipId ? controllerDebug.actionClipId : 'none'} age=${actionAgeMs !== null ? actionAgeMs : 'none'}/${actionDurationMs !== null ? actionDurationMs : 'none'}`,
            `winner=${winningClipId}`,
            `requests=${requests.length ? requests.map(formatCombatAnimationDebugRequest).join(' | ') : 'none'}`,
            `lastCommit=${controllerDebug && controllerDebug.lastCommittedAction ? formatCombatAnimationDebugRequest(controllerDebug.lastCommittedAction) : 'none'}`,
            `priorityBlock=${blockedByPriority ? 'attack_over_recoil' : 'no'}`,
            `enemy=${enemyDebug ? `${enemyDebug.runtimeId || 'none'} ${enemyDebug.enemyId || 'none'} state=${enemyDebug.currentState || 'none'}` : 'none'}`,
            `enemy yaw facing=${enemyDebug && Number.isFinite(enemyDebug.facingYaw) ? enemyDebug.facingYaw.toFixed(2) : 'none'} render=${enemyDebug && Number.isFinite(enemyDebug.groupRotationY) ? enemyDebug.groupRotationY.toFixed(2) : 'none'}`,
            `enemy move visual=${enemyDebug ? (enemyDebug.visuallyMoving ? 'yes' : 'no') : 'none'} walkBase=${enemyDebug ? (enemyDebug.useWalkBaseClip ? 'yes' : 'no') : 'none'} progress=${enemyDebug && Number.isFinite(enemyDebug.moveProgress) ? enemyDebug.moveProgress.toFixed(2) : 'none'} intentMs=${enemyDebug && enemyDebug.locomotionIntent && Number.isFinite(enemyDebug.locomotionIntent.remainingMs) ? enemyDebug.locomotionIntent.remainingMs : 'none'}`,
            `enemy base=${enemyControllerDebug && enemyControllerDebug.baseClipId ? enemyControllerDebug.baseClipId : 'none'} action=${enemyControllerDebug && enemyControllerDebug.actionClipId ? enemyControllerDebug.actionClipId : 'none'} winner=${enemyControllerDebug && enemyControllerDebug.winningRequest ? enemyControllerDebug.winningRequest.clipId : 'none'}`,
            `enemy requests=${enemyControllerDebug && enemyControllerDebug.requestedActions && enemyControllerDebug.requestedActions.length ? enemyControllerDebug.requestedActions.map(formatCombatAnimationDebugRequest).join(' | ') : 'none'}`
        ].join('\n');
        panel.style.display = 'block';
        return panel;
    }

    window.CombatAnimationDebugPanelRuntime = {
        ensureCombatAnimationDebugPanel,
        formatCombatAnimationDebugRequest,
        updateCombatAnimationDebugPanel
    };
})();
