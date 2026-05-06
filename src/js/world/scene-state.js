(function () {
    const MAIN_OVERWORLD_WORLD_ID = 'main_overworld';
    const DEFAULT_SMITHING_HALL_APPROACH = Object.freeze({
        shoreX: 220,
        stairX: 221,
        yStart: 233,
        yEnd: 235
    });

    function getWorldAdapterRuntime() {
        return window.LegacyWorldAdapterRuntime || null;
    }

    function requireWorldPayload(worldId = null) {
        const worldAdapterRuntime = getWorldAdapterRuntime();
        if (!worldAdapterRuntime) {
            throw new Error('LegacyWorldAdapterRuntime is unavailable.');
        }
        if (worldId && typeof worldAdapterRuntime.getWorldPayload === 'function') {
            return worldAdapterRuntime.getWorldPayload(worldId);
        }
        if (typeof worldAdapterRuntime.getCurrentWorldPayload === 'function') {
            return worldAdapterRuntime.getCurrentWorldPayload();
        }
        throw new Error('LegacyWorldAdapterRuntime world payload lookup is unavailable.');
    }

    function normalizeWorldScenePayload(payload) {
        if (!payload || typeof payload !== 'object') {
            throw new Error('Active world payload is unavailable.');
        }
        return Object.assign({}, payload, {
            smithingHallApproach: payload.smithingHallApproach || DEFAULT_SMITHING_HALL_APPROACH,
            islandWater: payload.islandWater || null,
            pathPatches: Array.isArray(payload.pathPatches) ? payload.pathPatches : [],
            fenceLandmarks: Array.isArray(payload.fenceLandmarks) ? payload.fenceLandmarks : [],
            roofLandmarks: Array.isArray(payload.roofLandmarks) ? payload.roofLandmarks : [],
            caveOpeningLandmarks: Array.isArray(payload.caveOpeningLandmarks) ? payload.caveOpeningLandmarks : [],
            decorPropLandmarks: Array.isArray(payload.decorPropLandmarks) ? payload.decorPropLandmarks : []
        });
    }

    function getCurrentWorldScenePayload() {
        return normalizeWorldScenePayload(requireWorldPayload());
    }

    function getWorldScenePayload(worldId) {
        return normalizeWorldScenePayload(requireWorldPayload(worldId));
    }

    function resolveRenderWorldId() {
        if (window.GameSessionRuntime && typeof window.GameSessionRuntime.resolveCurrentWorldId === 'function') {
            return window.GameSessionRuntime.resolveCurrentWorldId();
        }
        if (window.WorldBootstrapRuntime && typeof window.WorldBootstrapRuntime.getCurrentWorldId === 'function') {
            return window.WorldBootstrapRuntime.getCurrentWorldId();
        }
        return MAIN_OVERWORLD_WORLD_ID;
    }

    window.WorldSceneStateRuntime = {
        getCurrentWorldScenePayload,
        getWorldScenePayload,
        resolveRenderWorldId
    };
})();
