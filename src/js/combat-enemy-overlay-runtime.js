(function () {
    const PLAYER_TARGET_ID = 'player';

    function createEnemyHitpointsBarRenderer(options = {}) {
        const documentRef = options.documentRef || (typeof document !== 'undefined' ? document : null);
        if (!documentRef || !documentRef.body || typeof documentRef.createElement !== 'function') return { el: null, fill: null };

        const el = documentRef.createElement('div');
        el.style.position = 'absolute';
        el.style.left = '0px';
        el.style.top = '0px';
        el.style.transform = 'translate(-50%, -135%)';
        el.style.pointerEvents = 'none';
        el.style.zIndex = '1002';
        el.style.display = 'none';
        el.style.filter = 'drop-shadow(0 1px 2px rgba(0,0,0,0.55))';

        const frame = documentRef.createElement('div');
        frame.style.width = '38px';
        frame.style.height = '7px';
        frame.style.padding = '1px';
        frame.style.border = '1px solid rgba(8, 10, 12, 0.95)';
        frame.style.background = 'rgba(34, 14, 14, 0.95)';
        frame.style.borderRadius = '999px';
        frame.style.boxSizing = 'border-box';
        frame.style.overflow = 'hidden';

        const fill = documentRef.createElement('div');
        fill.style.width = '100%';
        fill.style.height = '100%';
        fill.style.borderRadius = '999px';
        fill.style.background = '#52d273';
        fill.style.transition = 'width 80ms linear, background-color 80ms linear';

        frame.appendChild(fill);
        el.appendChild(frame);
        documentRef.body.appendChild(el);
        return { el, fill };
    }

    function removeEnemyHitpointsBarRenderer(renderer) {
        if (!renderer || !renderer.healthBarEl || !renderer.healthBarEl.parentNode) return;
        renderer.healthBarEl.parentNode.removeChild(renderer.healthBarEl);
    }

    function shouldShowEnemyHitpointsBar(options = {}) {
        const enemyState = options.enemyState || null;
        const playerState = options.playerState || null;
        const isEnemyAlive = typeof options.isEnemyAlive === 'function' ? options.isEnemyAlive : () => false;
        const isEnemyPendingDefeat = typeof options.isEnemyPendingDefeat === 'function' ? options.isEnemyPendingDefeat : () => false;
        const isVisibleEnemy = isEnemyAlive(enemyState) || isEnemyPendingDefeat(enemyState);
        if (!isVisibleEnemy) return false;
        if (!playerState || !playerState.inCombat) return false;
        if (enemyState.lockedTargetId === PLAYER_TARGET_ID) return true;
        if (enemyState.lastDamagerId === PLAYER_TARGET_ID) return true;
        if (enemyState.runtimeId === playerState.lockedTargetId) return true;
        if (enemyState.runtimeId === playerState.lastDamagerEnemyId) return true;
        return false;
    }

    function updateEnemyHitpointsBar(options = {}) {
        const enemyState = options.enemyState || null;
        const renderer = options.renderer || null;
        const playerState = options.playerState || null;
        const camera = options.camera || null;
        const windowRef = options.windowRef || (typeof window !== 'undefined' ? window : null);
        if (!renderer || !renderer.healthBarEl || !renderer.healthBarFillEl || !renderer.group || !camera || !windowRef) return;
        const showBar = shouldShowEnemyHitpointsBar({
            enemyState,
            playerState,
            isEnemyAlive: options.isEnemyAlive,
            isEnemyPendingDefeat: options.isEnemyPendingDefeat
        });
        if (!showBar || enemyState.z !== playerState.z) {
            renderer.healthBarEl.style.display = 'none';
            return;
        }

        const maxHealth = Math.max(1, Number.isFinite(renderer.maxHealth) ? Math.floor(renderer.maxHealth) : 1);
        const currentHealth = Math.max(0, Math.min(maxHealth, Number.isFinite(enemyState.currentHealth) ? Math.floor(enemyState.currentHealth) : maxHealth));
        const ratio = Math.max(0, Math.min(1, currentHealth / maxHealth));

        renderer.healthBarFillEl.style.width = `${ratio * 100}%`;
        if (ratio > 0.6) renderer.healthBarFillEl.style.background = '#52d273';
        else if (ratio > 0.3) renderer.healthBarFillEl.style.background = '#f1c453';
        else renderer.healthBarFillEl.style.background = '#ef5555';

        const overheadPos = renderer.group.position.clone();
        overheadPos.y += Number.isFinite(renderer.healthBarYOffset) ? renderer.healthBarYOffset : 1.0;
        overheadPos.project(camera);

        if (overheadPos.z >= 1 || overheadPos.z <= -1) {
            renderer.healthBarEl.style.display = 'none';
            return;
        }

        const screenX = (overheadPos.x * 0.5 + 0.5) * windowRef.innerWidth;
        const screenY = (overheadPos.y * -0.5 + 0.5) * windowRef.innerHeight;
        if (screenX < -64 || screenX > windowRef.innerWidth + 64 || screenY < -32 || screenY > windowRef.innerHeight + 32) {
            renderer.healthBarEl.style.display = 'none';
            return;
        }

        renderer.healthBarEl.style.left = `${screenX}px`;
        renderer.healthBarEl.style.top = `${screenY}px`;
        renderer.healthBarEl.style.display = 'block';
    }

    function updateCombatEnemyOverlays(options = {}) {
        const camera = options.camera || null;
        const renderersById = options.combatEnemyRenderersById || {};
        const stateById = options.combatEnemyStateById || {};
        if (camera && typeof camera.updateMatrixWorld === 'function') camera.updateMatrixWorld();
        const enemyIds = Object.keys(renderersById);
        for (let i = 0; i < enemyIds.length; i++) {
            const enemyId = enemyIds[i];
            const renderer = renderersById[enemyId];
            const enemyState = stateById[enemyId];
            if (!renderer || !enemyState) continue;
            updateEnemyHitpointsBar(Object.assign({}, options, { enemyState, renderer }));
        }
    }

    window.CombatEnemyOverlayRuntime = {
        createEnemyHitpointsBarRenderer,
        removeEnemyHitpointsBarRenderer,
        shouldShowEnemyHitpointsBar,
        updateCombatEnemyOverlays,
        updateEnemyHitpointsBar
    };
})();
