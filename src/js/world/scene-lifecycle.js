(function () {
    function callHook(context, name, ...args) {
        const hook = context && context[name];
        if (typeof hook === 'function') return hook.apply(context, args);
        return undefined;
    }

    function requireHook(context, name) {
        const hook = context && context[name];
        if (typeof hook !== 'function') {
            throw new Error(`World scene lifecycle requires ${name}.`);
        }
        return hook;
    }

    function clearCollection(collection) {
        if (collection && typeof collection.clear === 'function') collection.clear();
    }

    function clearArray(arrayLike) {
        if (Array.isArray(arrayLike)) arrayLike.length = 0;
    }

    function removeClickMarkers(scene, clickMarkers) {
        if (!scene || !Array.isArray(clickMarkers)) return;
        for (let i = 0; i < clickMarkers.length; i++) {
            const marker = clickMarkers[i];
            if (marker && marker.mesh) scene.remove(marker.mesh);
        }
        clearArray(clickMarkers);
    }

    function clearHitsplats(activeHitsplats) {
        if (!Array.isArray(activeHitsplats)) return;
        for (let i = 0; i < activeHitsplats.length; i++) {
            const hitsplat = activeHitsplats[i];
            if (hitsplat && hitsplat.el && typeof hitsplat.el.remove === 'function') hitsplat.el.remove();
        }
        clearArray(activeHitsplats);
    }

    function resetChunkSceneState(context) {
        const loadedChunks = context.loadedChunks;
        if (loadedChunks && typeof loadedChunks[Symbol.iterator] === 'function') {
            Array.from(loadedChunks).forEach((chunkKey) => callHook(context, 'unloadChunk', chunkKey));
        }
        clearCollection(loadedChunks);
        clearCollection(context.loadedChunkInteractionState);
        callHook(context, 'resetChunkGroups');
        callHook(context, 'clearChunkTierGroups');
        callHook(context, 'resetChunkPolicyRevision');
        callHook(context, 'bumpShadowFocusRevision');
    }

    function clearTransientSceneArtifacts(context) {
        removeClickMarkers(context.scene, context.clickMarkers);
        clearHitsplats(context.activeHitsplats);
        clearArray(context.environmentMeshes);
    }

    function refreshScenePresentation(context) {
        callHook(context, 'syncPlayerRigToState');
        callHook(context, 'syncFreeCamTargetToState');
        callHook(context, 'updateMinimapCanvas');
        if (callHook(context, 'hasPlayerRig')) callHook(context, 'manageChunks', true);
        callHook(context, 'updateWorldMapPanel', true);
    }

    function reloadActiveWorldScene(context) {
        const initLogicalMap = requireHook(context, 'initLogicalMap');
        if (!callHook(context, 'hasScene')) {
            initLogicalMap();
            return;
        }

        callHook(context, 'clearCombatEnemyRenderers');
        resetChunkSceneState(context);
        clearTransientSceneArtifacts(context);
        initLogicalMap();
        refreshScenePresentation(context);
    }

    window.WorldSceneLifecycleRuntime = {
        reloadActiveWorldScene,
        resetChunkSceneState,
        clearTransientSceneArtifacts,
        refreshScenePresentation
    };
})();
