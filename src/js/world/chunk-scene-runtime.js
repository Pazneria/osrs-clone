(function () {
    const CHUNK_TIER_NEAR = 'near';
    const CHUNK_TIER_MID = 'mid';
    const CHUNK_TIER_FAR = 'far';
    const CHUNK_AUTO_QUALITY_WINDOW_MS = 3000;
    const CHUNK_AUTO_QUALITY_COOLDOWN_MS = 10000;
    const CHUNK_AUTO_QUALITY_LOW_FPS = 43;
    const CHUNK_AUTO_QUALITY_HIGH_FPS = 48;
    const CHUNK_RENDER_POLICY_PRESETS = Object.freeze({
        high: Object.freeze({
            nearRadius: 2,
            midRadius: 4,
            interactionRadius: 1,
            nearMode: 'square',
            nearMargin: 0,
            farMode: 'window',
            farRadius: 5
        }),
        balanced: Object.freeze({
            nearRadius: 1,
            midRadius: 3,
            interactionRadius: 1,
            nearMode: 'square',
            nearMargin: 0,
            farMode: 'window',
            farRadius: 4
        }),
        safe: Object.freeze({
            nearRadius: 1,
            midRadius: 2,
            interactionRadius: 1,
            nearMode: 'square',
            nearMargin: 0,
            farMode: 'window',
            farRadius: 3
        })
    });
    const CHUNK_RENDER_POLICY_ORDER = Object.freeze(['safe', 'balanced', 'high']);
    const CHUNK_RENDER_DEFAULT_PRESET = 'balanced';
    const CHUNK_STREAMING_NEAR_UNLOAD_GRACE_MS = 2200;
    const CHUNK_STREAMING_FRAME_BUDGET_MS = 6;
    const CHUNK_STREAMING_NEAR_BUILD_INTERVAL_MS = 120;
    const CHUNK_STREAMING_SIMPLIFIED_BUILD_INTERVAL_MS = 40;
    const CHUNK_STREAMING_NEAR_UNLOAD_INTERVAL_MS = 120;

    const nearGroups = {};
    const midGroups = {};
    const farGroups = {};
    const loadedChunks = new Set();
    const loadedChunkInteractionState = new Map();
    const chunkTierStateByKey = new Map();
    const chunkInteractionMeshes = new Map();
    const pendingNearChunkBuilds = new Map();
    const pendingSimplifiedChunkBuilds = new Map();
    const pendingNearChunkUnloads = new Map();
    let pendingNearChunkBuildSequence = 0;
    let pendingSimplifiedChunkBuildSequence = 0;
    let pendingNearChunkUnloadSequence = 0;
    let chunkPolicyDirty = true;
    let lastChunkPolicyCenterX = null;
    let lastChunkPolicyCenterY = null;
    let lastChunkPolicyNearActivationKey = null;
    let lastChunkPolicyRevision = -1;
    let activeChunkRenderPolicyPreset = CHUNK_RENDER_DEFAULT_PRESET;
    let chunkRenderPolicyRevision = 0;
    let lastNearChunkBuildMs = -Infinity;
    let lastSimplifiedChunkBuildMs = -Infinity;
    let lastNearChunkUnloadMs = -Infinity;
    const chunkAutoQualityState = {
        windowStartMs: 0,
        accumulatedFps: 0,
        sampleCount: 0,
        lowWindows: 0,
        highWindows: 0,
        lastPresetChangeMs: 0
    };

    function callHook(context, name, ...args) {
        const hook = context && context[name];
        if (typeof hook === 'function') return hook.apply(context, args);
        return undefined;
    }

    function getNowMs(context = {}) {
        const hookedNow = callHook(context, 'now');
        if (Number.isFinite(hookedNow)) return hookedNow;
        if (typeof performance !== 'undefined' && typeof performance.now === 'function') return performance.now();
        return Date.now();
    }

    function chunkKey(cx, cy) {
        return `${cx},${cy}`;
    }

    function markChunkPolicyDirty() {
        chunkPolicyDirty = true;
        lastChunkPolicyCenterX = null;
        lastChunkPolicyCenterY = null;
        lastChunkPolicyNearActivationKey = null;
    }

    function resolveChunkRenderPolicyPresetName(presetName) {
        if (typeof presetName === 'string' && CHUNK_RENDER_POLICY_PRESETS[presetName]) return presetName;
        if (CHUNK_RENDER_POLICY_PRESETS[CHUNK_RENDER_DEFAULT_PRESET]) return CHUNK_RENDER_DEFAULT_PRESET;
        return 'balanced';
    }

    function getActiveChunkRenderPolicyPreset() {
        return resolveChunkRenderPolicyPresetName(activeChunkRenderPolicyPreset);
    }

    function getChunkRenderPolicy(presetName = null) {
        const resolvedName = resolveChunkRenderPolicyPresetName(presetName || activeChunkRenderPolicyPreset);
        const preset = CHUNK_RENDER_POLICY_PRESETS[resolvedName] || CHUNK_RENDER_POLICY_PRESETS.balanced;
        return {
            preset: resolvedName,
            nearRadius: Math.max(0, Math.floor(Number.isFinite(preset.nearRadius) ? preset.nearRadius : 1)),
            midRadius: Math.max(0, Math.floor(Number.isFinite(preset.midRadius) ? preset.midRadius : 3)),
            interactionRadius: Math.max(0, Math.floor(Number.isFinite(preset.interactionRadius) ? preset.interactionRadius : 1)),
            nearMode: preset.nearMode === 'edge' ? 'edge' : 'square',
            nearMargin: Math.max(0, Math.floor(Number.isFinite(preset.nearMargin) ? preset.nearMargin : 0)),
            farMode: preset.farMode === 'all' ? 'all' : 'window',
            farRadius: Math.max(0, Math.floor(Number.isFinite(preset.farRadius) ? preset.farRadius : ((preset.midRadius || 0) + 1)))
        };
    }

    function getChunkRenderPolicyPresetOrder() {
        return CHUNK_RENDER_POLICY_ORDER.slice();
    }

    function applyChunkRenderPolicyPreset(nextPreset) {
        const resolvedNextPreset = resolveChunkRenderPolicyPresetName(nextPreset);
        if (resolvedNextPreset === activeChunkRenderPolicyPreset) return false;
        activeChunkRenderPolicyPreset = resolvedNextPreset;
        chunkRenderPolicyRevision += 1;
        markChunkPolicyDirty();
        return true;
    }

    function getChunkRenderPolicyRevision() {
        return chunkRenderPolicyRevision;
    }

    function resetAutoQualityWindow() {
        chunkAutoQualityState.windowStartMs = 0;
        chunkAutoQualityState.accumulatedFps = 0;
        chunkAutoQualityState.sampleCount = 0;
        chunkAutoQualityState.lowWindows = 0;
        chunkAutoQualityState.highWindows = 0;
    }

    function removeGroupMapFromScene(groupMap, context) {
        Object.keys(groupMap).forEach((key) => {
            const group = groupMap[key];
            if (group) callHook(context, 'removeChunkGroupFromScene', group);
            delete groupMap[key];
        });
    }

    function clearPendingNearChunkBuilds(key = null) {
        if (typeof key === 'string' && key) {
            pendingNearChunkBuilds.delete(key);
            return;
        }
        pendingNearChunkBuilds.clear();
    }

    function clearPendingSimplifiedChunkBuilds(key = null) {
        if (typeof key === 'string' && key) {
            pendingSimplifiedChunkBuilds.delete(key);
            return;
        }
        pendingSimplifiedChunkBuilds.clear();
    }

    function clearPendingNearChunkUnloads(key = null) {
        if (typeof key === 'string' && key) {
            pendingNearChunkUnloads.delete(key);
            return;
        }
        pendingNearChunkUnloads.clear();
    }

    function resetChunkStreamingCadence() {
        lastNearChunkBuildMs = -Infinity;
        lastSimplifiedChunkBuildMs = -Infinity;
        lastNearChunkUnloadMs = -Infinity;
    }

    function clearPendingChunkStreamingWork(key = null) {
        clearPendingNearChunkBuilds(key);
        clearPendingSimplifiedChunkBuilds(key);
        clearPendingNearChunkUnloads(key);
        if (!key) resetChunkStreamingCadence();
    }

    function clearChunkTierGroups(context = {}) {
        removeGroupMapFromScene(midGroups, context);
        removeGroupMapFromScene(farGroups, context);
        chunkTierStateByKey.clear();
        chunkInteractionMeshes.clear();
        clearPendingChunkStreamingWork();
        resetAutoQualityWindow();
        markChunkPolicyDirty();
    }

    function registerNearChunk(key, group, metadata = {}) {
        if (typeof key !== 'string' || !key) return false;
        nearGroups[key] = group || null;
        loadedChunks.add(key);
        loadedChunkInteractionState.set(key, !!metadata.registerInteraction);
        chunkInteractionMeshes.set(key, Array.isArray(metadata.interactionMeshes) ? metadata.interactionMeshes.slice() : []);
        clearPendingNearChunkUnloads(key);
        return true;
    }

    function unregisterNearChunk(key, context = {}) {
        if (typeof key !== 'string' || !key) return false;
        const group = nearGroups[key] || null;
        const interactionMeshes = chunkInteractionMeshes.get(key) || [];
        if (group) callHook(context, 'unloadNearChunkGroup', key, group, { interactionMeshes });
        delete nearGroups[key];
        loadedChunks.delete(key);
        loadedChunkInteractionState.delete(key);
        chunkInteractionMeshes.delete(key);
        clearPendingNearChunkUnloads(key);
        return true;
    }

    function resetForWorldReload(context = {}) {
        Array.from(loadedChunks).forEach((key) => unregisterNearChunk(key, context));
        loadedChunks.clear();
        loadedChunkInteractionState.clear();
        Object.keys(nearGroups).forEach((key) => delete nearGroups[key]);
        clearPendingChunkStreamingWork();
        clearChunkTierGroups(context);
        lastChunkPolicyRevision = -1;
        callHook(context, 'bumpShadowFocusRevision');
    }

    function getNearChunkGroup(key) {
        return nearGroups[key] || null;
    }

    function getMidChunkGroup(key) {
        return midGroups[key] || null;
    }

    function getFarChunkGroup(key) {
        return farGroups[key] || null;
    }

    function setMidChunkGroup(key, group) {
        if (typeof key !== 'string' || !key) return null;
        midGroups[key] = group || null;
        return midGroups[key];
    }

    function setFarChunkGroup(key, group) {
        if (typeof key !== 'string' || !key) return null;
        farGroups[key] = group || null;
        return farGroups[key];
    }

    function isNearChunkLoaded(key) {
        return loadedChunks.has(key);
    }

    function getChunkInteractionState(key) {
        return loadedChunkInteractionState.has(key) ? !!loadedChunkInteractionState.get(key) : false;
    }

    function setChunkInteractionState(key, shouldRegisterInteraction, context = {}) {
        const targetState = !!shouldRegisterInteraction;
        const currentState = getChunkInteractionState(key);
        if (currentState === targetState) return;

        const interactionMeshes = chunkInteractionMeshes.get(key) || [];
        callHook(context, 'setChunkInteractionMeshesActive', interactionMeshes, targetState);
        loadedChunkInteractionState.set(key, targetState);
    }

    function shouldPromoteEdgeAwareNearChunk(dx, dy, nearOptions = {}) {
        if (dx === 0 && dy === 0) return true;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) return false;
        const chunkSize = Math.max(1, Math.floor(Number.isFinite(nearOptions.chunkSize) ? nearOptions.chunkSize : 1));
        const margin = Math.max(0, Math.min(chunkSize, Math.floor(Number.isFinite(nearOptions.nearMargin) ? nearOptions.nearMargin : 0)));
        const localX = Math.max(0, Math.min(chunkSize - 0.0001, Number.isFinite(nearOptions.localX) ? nearOptions.localX : 0));
        const localY = Math.max(0, Math.min(chunkSize - 0.0001, Number.isFinite(nearOptions.localY) ? nearOptions.localY : 0));
        if (dx < 0 && localX > margin) return false;
        if (dx > 0 && localX < chunkSize - margin) return false;
        if (dy < 0 && localY > margin) return false;
        if (dy > 0 && localY < chunkSize - margin) return false;
        return true;
    }

    function getEdgeAwareNearActivationKey(policy, chunkSize, localX, localY) {
        if (!policy || policy.nearMode !== 'edge') return 'square';
        const resolvedChunkSize = Math.max(1, Math.floor(Number.isFinite(chunkSize) ? chunkSize : 1));
        const margin = Math.max(0, Math.min(resolvedChunkSize, Math.floor(Number.isFinite(policy.nearMargin) ? policy.nearMargin : 0)));
        const safeLocalX = Math.max(0, Math.min(resolvedChunkSize - 0.0001, Number.isFinite(localX) ? localX : 0));
        const safeLocalY = Math.max(0, Math.min(resolvedChunkSize - 0.0001, Number.isFinite(localY) ? localY : 0));
        const horizontal = safeLocalX <= margin ? 'west' : (safeLocalX >= resolvedChunkSize - margin ? 'east' : 'center-x');
        const vertical = safeLocalY <= margin ? 'north' : (safeLocalY >= resolvedChunkSize - margin ? 'south' : 'center-y');
        return `${horizontal}:${vertical}`;
    }

    function collectDesiredChunkTierAssignments(centerChunkX, centerChunkY, nearRadius, midRadius, farRadius, farMode, worldChunksX, worldChunksY, nearOptions = {}) {
        const assignments = new Map();
        const effectiveFarRadius = Math.max(midRadius, Math.floor(Number.isFinite(farRadius) ? farRadius : (midRadius + 1)));
        const shouldAssignFar = farMode === 'all'
            ? () => true
            : (dist) => dist <= effectiveFarRadius;
        const edgeAwareNear = nearOptions.nearMode === 'edge';
        for (let cy = 0; cy < worldChunksY; cy++) {
            for (let cx = 0; cx < worldChunksX; cx++) {
                const dx = cx - centerChunkX;
                const dy = cy - centerChunkY;
                const dist = Math.max(Math.abs(dx), Math.abs(dy));
                let tier = CHUNK_TIER_FAR;
                if (dist <= nearRadius && (!edgeAwareNear || shouldPromoteEdgeAwareNearChunk(dx, dy, nearOptions))) tier = CHUNK_TIER_NEAR;
                else if (dist <= midRadius) tier = CHUNK_TIER_MID;
                else if (!shouldAssignFar(dist)) continue;
                assignments.set(chunkKey(cx, cy), tier);
            }
        }
        return assignments;
    }

    function collectDesiredChunks(centerChunkX, centerChunkY, xMinOffset, xMaxOffset, yMinOffset, yMaxOffset, worldChunksX, worldChunksY) {
        const desired = new Set();
        for (let dy = yMinOffset; dy <= yMaxOffset; dy++) {
            for (let dx = xMinOffset; dx <= xMaxOffset; dx++) {
                const cx = centerChunkX + dx;
                const cy = centerChunkY + dy;
                if (cx < 0 || cy < 0 || cx >= worldChunksX || cy >= worldChunksY) continue;
                desired.add(chunkKey(cx, cy));
            }
        }
        return desired;
    }

    function resolveActiveChunkRenderPolicy(context = {}) {
        const fallback = getChunkRenderPolicy();
        const policy = callHook(context, 'getChunkRenderPolicy') || fallback;
        const policyPresetDefaults = policy && typeof policy.preset === 'string'
            ? getChunkRenderPolicy(policy.preset)
            : fallback;
        const nearRadius = Math.max(0, Math.floor(Number.isFinite(policy && policy.nearRadius) ? policy.nearRadius : fallback.nearRadius));
        const midRadius = Math.max(nearRadius, Math.floor(Number.isFinite(policy && policy.midRadius) ? policy.midRadius : fallback.midRadius));
        const interactionRadius = Math.max(0, Math.min(nearRadius, Math.floor(Number.isFinite(policy && policy.interactionRadius) ? policy.interactionRadius : fallback.interactionRadius)));
        const nearMode = (policy && policy.nearMode === 'edge')
            ? 'edge'
            : ((policy && policy.nearMode === 'square') ? 'square' : policyPresetDefaults.nearMode);
        const nearMargin = Math.max(0, Math.floor(Number.isFinite(policy && policy.nearMargin) ? policy.nearMargin : policyPresetDefaults.nearMargin));
        const farMode = (policy && policy.farMode === 'all') ? 'all' : fallback.farMode;
        const rawFarRadius = Number.isFinite(policy && policy.farRadius) ? policy.farRadius : fallback.farRadius;
        return {
            preset: (policy && typeof policy.preset === 'string') ? policy.preset : fallback.preset,
            nearRadius,
            midRadius,
            interactionRadius,
            nearMode,
            nearMargin,
            farMode,
            farRadius: Math.max(midRadius, Math.floor(Number.isFinite(rawFarRadius) ? rawFarRadius : (midRadius + 1)))
        };
    }

    function getChunkPresetOrder(context = {}) {
        const fallback = getChunkRenderPolicyPresetOrder();
        const order = callHook(context, 'getChunkRenderPolicyPresetOrder') || fallback;
        if (!Array.isArray(order) || order.length === 0) return fallback;
        return order.slice();
    }

    function stepChunkRenderPolicyPreset(direction, nowMs, context = {}) {
        const policy = resolveActiveChunkRenderPolicy(context);
        const order = getChunkPresetOrder(context);
        const currentIndex = order.indexOf(policy.preset);
        if (currentIndex === -1) return false;
        const targetIndex = Math.max(0, Math.min(order.length - 1, currentIndex + direction));
        if (targetIndex === currentIndex) return false;
        const contextChanged = callHook(context, 'applyChunkRenderPolicyPreset', order[targetIndex]);
        const changed = typeof contextChanged === 'boolean'
            ? contextChanged
            : applyChunkRenderPolicyPreset(order[targetIndex]);
        if (changed) {
            chunkAutoQualityState.lastPresetChangeMs = nowMs;
            markChunkPolicyDirty();
        }
        return !!changed;
    }

    function reportChunkPerformanceSample(fps, nowMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()), context = {}) {
        if (!Number.isFinite(fps) || fps <= 0) return;
        const now = Number.isFinite(nowMs) ? nowMs : (typeof performance !== 'undefined' ? performance.now() : Date.now());
        if (!chunkAutoQualityState.windowStartMs) chunkAutoQualityState.windowStartMs = now;
        chunkAutoQualityState.accumulatedFps += fps;
        chunkAutoQualityState.sampleCount += 1;
        if ((now - chunkAutoQualityState.windowStartMs) < CHUNK_AUTO_QUALITY_WINDOW_MS) return;

        const avgFps = chunkAutoQualityState.accumulatedFps / Math.max(1, chunkAutoQualityState.sampleCount);
        chunkAutoQualityState.windowStartMs = now;
        chunkAutoQualityState.accumulatedFps = 0;
        chunkAutoQualityState.sampleCount = 0;

        if (avgFps < CHUNK_AUTO_QUALITY_LOW_FPS) {
            chunkAutoQualityState.lowWindows += 1;
            chunkAutoQualityState.highWindows = 0;
        } else if (avgFps > CHUNK_AUTO_QUALITY_HIGH_FPS) {
            chunkAutoQualityState.highWindows += 1;
            chunkAutoQualityState.lowWindows = 0;
        } else {
            chunkAutoQualityState.lowWindows = 0;
            chunkAutoQualityState.highWindows = 0;
            return;
        }

        if ((now - chunkAutoQualityState.lastPresetChangeMs) < CHUNK_AUTO_QUALITY_COOLDOWN_MS) return;

        if (chunkAutoQualityState.lowWindows >= 2) {
            if (stepChunkRenderPolicyPreset(-1, now, context)) {
                chunkAutoQualityState.lowWindows = 0;
                chunkAutoQualityState.highWindows = 0;
            }
            return;
        }

        const policy = resolveActiveChunkRenderPolicy(context);
        if (chunkAutoQualityState.highWindows >= 3 && policy.preset === 'safe' && stepChunkRenderPolicyPreset(1, now, context)) {
            chunkAutoQualityState.lowWindows = 0;
            chunkAutoQualityState.highWindows = 0;
        }
    }

    function buildCurrentChunkPolicyState(context = {}) {
        const playerPosition = callHook(context, 'getChunkCenterPosition');
        if (!playerPosition) return null;
        const worldChunksX = Math.max(1, Math.floor(Number.isFinite(context.worldChunksX) ? context.worldChunksX : 1));
        const worldChunksY = Math.max(1, Math.floor(Number.isFinite(context.worldChunksY) ? context.worldChunksY : 1));
        const chunkSize = Math.max(1, Math.floor(Number.isFinite(context.chunkSize) ? context.chunkSize : 1));
        const pX = Number.isFinite(playerPosition.x) ? playerPosition.x : 0;
        const pZ = Number.isFinite(playerPosition.z) ? playerPosition.z : 0;
        const centerChunkX = Math.max(0, Math.min(worldChunksX - 1, Math.floor(pX / chunkSize)));
        const centerChunkY = Math.max(0, Math.min(worldChunksY - 1, Math.floor(pZ / chunkSize)));
        const localX = pX - (centerChunkX * chunkSize);
        const localY = pZ - (centerChunkY * chunkSize);
        const policy = resolveActiveChunkRenderPolicy(context);
        const visiblePlane = Number.isFinite(playerPosition.visiblePlane) ? Math.floor(playerPosition.visiblePlane) : 0;
        const nearActivationKey = getEdgeAwareNearActivationKey(policy, chunkSize, localX, localY);
        return {
            centerChunkX,
            centerChunkY,
            visiblePlane,
            policy,
            nearActivationKey,
            desiredTierByKey: collectDesiredChunkTierAssignments(centerChunkX, centerChunkY, policy.nearRadius, policy.midRadius, policy.farRadius, policy.farMode, worldChunksX, worldChunksY, {
                nearMode: policy.nearMode,
                nearMargin: policy.nearMargin,
                chunkSize,
                localX,
                localY
            }),
            desiredInteractionChunks: collectDesiredChunks(
                centerChunkX,
                centerChunkY,
                -policy.interactionRadius,
                policy.interactionRadius,
                -policy.interactionRadius,
                policy.interactionRadius,
                worldChunksX,
                worldChunksY
            )
        };
    }

    function enqueuePendingNearChunkBuild(cx, cy, key, shouldRegisterInteraction, maxVisiblePlane) {
        const existingRequest = pendingNearChunkBuilds.get(key);
        if (existingRequest) {
            existingRequest.shouldRegisterInteraction = !!shouldRegisterInteraction;
            existingRequest.maxVisiblePlane = Number.isFinite(maxVisiblePlane) ? Math.floor(maxVisiblePlane) : 0;
            existingRequest.cx = cx;
            existingRequest.cy = cy;
            return existingRequest;
        }

        const request = {
            key,
            cx,
            cy,
            shouldRegisterInteraction: !!shouldRegisterInteraction,
            maxVisiblePlane: Number.isFinite(maxVisiblePlane) ? Math.floor(maxVisiblePlane) : 0,
            sequence: pendingNearChunkBuildSequence++
        };
        pendingNearChunkBuilds.set(key, request);
        return request;
    }

    function enqueuePendingSimplifiedChunkBuild(cx, cy, key, targetTier, maxVisiblePlane) {
        if (targetTier !== CHUNK_TIER_MID && targetTier !== CHUNK_TIER_FAR) return null;
        const existingRequest = pendingSimplifiedChunkBuilds.get(key);
        if (existingRequest) {
            existingRequest.targetTier = targetTier;
            existingRequest.maxVisiblePlane = Number.isFinite(maxVisiblePlane) ? Math.floor(maxVisiblePlane) : 0;
            existingRequest.cx = cx;
            existingRequest.cy = cy;
            return existingRequest;
        }

        const request = {
            key,
            cx,
            cy,
            targetTier,
            maxVisiblePlane: Number.isFinite(maxVisiblePlane) ? Math.floor(maxVisiblePlane) : 0,
            sequence: pendingSimplifiedChunkBuildSequence++
        };
        pendingSimplifiedChunkBuilds.set(key, request);
        return request;
    }

    function enqueuePendingNearChunkUnload(key, context = {}) {
        if (typeof key !== 'string' || !key || !getNearChunkGroup(key)) return null;
        const now = getNowMs(context);
        const existingRequest = pendingNearChunkUnloads.get(key);
        if (existingRequest) {
            existingRequest.unloadAfterMs = Math.max(existingRequest.unloadAfterMs, now + CHUNK_STREAMING_NEAR_UNLOAD_GRACE_MS);
            return existingRequest;
        }
        const request = {
            key,
            unloadAfterMs: now + CHUNK_STREAMING_NEAR_UNLOAD_GRACE_MS,
            sequence: pendingNearChunkUnloadSequence++
        };
        pendingNearChunkUnloads.set(key, request);
        return request;
    }

    function showPendingNearChunkFallback(cx, cy, key, maxVisiblePlane, context = {}) {
        const midGroup = getMidChunkGroup(key);
        if (midGroup) {
            midGroup.visible = true;
            callHook(context, 'setChunkGroupPlaneVisibility', midGroup, maxVisiblePlane);
            const farGroupForMid = getFarChunkGroup(key);
            if (farGroupForMid) farGroupForMid.visible = false;
            return;
        }

        const farGroup = getFarChunkGroup(key) || callHook(context, 'ensureFarChunkGroup', cx, cy);
        if (!farGroup) return;
        farGroup.visible = true;
        callHook(context, 'setChunkGroupPlaneVisibility', farGroup, maxVisiblePlane);
    }

    function getRequestDistanceFromPolicyCenter(request, policyState) {
        if (!request || !policyState) return Infinity;
        return Math.max(
            Math.abs(request.cx - policyState.centerChunkX),
            Math.abs(request.cy - policyState.centerChunkY)
        );
    }

    function sortStreamingRequestsByDistance(requests, policyState) {
        return requests.sort((left, right) => {
            const leftDistance = getRequestDistanceFromPolicyCenter(left, policyState);
            const rightDistance = getRequestDistanceFromPolicyCenter(right, policyState);
            if (leftDistance !== rightDistance) return leftDistance - rightDistance;
            const leftTierPriority = left && left.targetTier === CHUNK_TIER_MID ? 0 : 1;
            const rightTierPriority = right && right.targetTier === CHUNK_TIER_MID ? 0 : 1;
            if (leftTierPriority !== rightTierPriority) return leftTierPriority - rightTierPriority;
            return (left.sequence || 0) - (right.sequence || 0);
        });
    }

    function isStreamingBudgetSpent(startMs, context = {}) {
        return (getNowMs(context) - startMs) >= CHUNK_STREAMING_FRAME_BUDGET_MS;
    }

    function processNearChunkBuildQueue(context, policyState, buildLimit, frameStartMs, useCadence = true) {
        if (pendingNearChunkBuilds.size === 0) return 0;
        const now = getNowMs(context);
        if (useCadence && now - lastNearChunkBuildMs < CHUNK_STREAMING_NEAR_BUILD_INTERVAL_MS) return 0;

        const requests = sortStreamingRequestsByDistance(Array.from(pendingNearChunkBuilds.values()), policyState);

        let processed = 0;
        for (let i = 0; i < requests.length && processed < buildLimit; i++) {
            if (processed > 0 && isStreamingBudgetSpent(frameStartMs, context)) break;
            const request = requests[i];
            if (!request) continue;

            const key = request.key;
            const existingNearGroup = getNearChunkGroup(key);
            if (existingNearGroup) {
                clearPendingNearChunkBuilds(key);
                clearPendingNearChunkUnloads(key);
                continue;
            }

            const targetTier = policyState.desiredTierByKey.get(key) || CHUNK_TIER_FAR;
            if (targetTier !== CHUNK_TIER_NEAR) {
                clearPendingNearChunkBuilds(key);
                continue;
            }

            const shouldRegisterInteraction = policyState.desiredInteractionChunks.has(key);
            callHook(context, 'loadNearChunk', request.cx, request.cy, shouldRegisterInteraction);

            const loadedNearGroup = getNearChunkGroup(key);
            if (loadedNearGroup) {
                loadedNearGroup.visible = true;
                callHook(context, 'setChunkGroupPlaneVisibility', loadedNearGroup, policyState.visiblePlane);
            }
            const midGroup = getMidChunkGroup(key);
            const farGroup = getFarChunkGroup(key);
            if (midGroup) midGroup.visible = false;
            if (farGroup) farGroup.visible = false;
            setChunkInteractionState(key, shouldRegisterInteraction, context);
            chunkTierStateByKey.set(key, CHUNK_TIER_NEAR);
            clearPendingNearChunkBuilds(key);
            clearPendingSimplifiedChunkBuilds(key);
            clearPendingNearChunkUnloads(key);
            processed += 1;
            lastNearChunkBuildMs = getNowMs(context);
            if (useCadence) break;
        }

        return processed;
    }

    function processPendingSimplifiedChunkBuilds(options = {}) {
        const context = options.context || options;
        const policyState = options.policyState || buildCurrentChunkPolicyState(context);
        const maxBuilds = Math.max(0, Math.floor(Number.isFinite(options.maxBuilds) ? options.maxBuilds : 1));
        const frameStartMs = Number.isFinite(options.frameStartMs) ? options.frameStartMs : getNowMs(context);
        const useCadence = options.useCadence !== false && maxBuilds <= 1;
        if (!policyState || pendingSimplifiedChunkBuilds.size === 0 || maxBuilds <= 0) return 0;
        const now = getNowMs(context);
        if (useCadence && now - lastSimplifiedChunkBuildMs < CHUNK_STREAMING_SIMPLIFIED_BUILD_INTERVAL_MS) return 0;

        const requests = sortStreamingRequestsByDistance(Array.from(pendingSimplifiedChunkBuilds.values()), policyState);
        let processed = 0;
        for (let i = 0; i < requests.length && processed < maxBuilds; i++) {
            if (processed > 0 && isStreamingBudgetSpent(frameStartMs, context)) break;
            const request = requests[i];
            if (!request) continue;
            const key = request.key;
            const desiredTier = policyState.desiredTierByKey.get(key);
            if (!desiredTier || desiredTier === CHUNK_TIER_NEAR || desiredTier !== request.targetTier) {
                clearPendingSimplifiedChunkBuilds(key);
                continue;
            }

            if (request.targetTier === CHUNK_TIER_MID) {
                const midGroup = getMidChunkGroup(key) || callHook(context, 'ensureMidChunkGroup', request.cx, request.cy);
                if (midGroup) {
                    midGroup.visible = true;
                    callHook(context, 'setChunkGroupPlaneVisibility', midGroup, policyState.visiblePlane);
                    const farGroup = getFarChunkGroup(key);
                    if (farGroup) farGroup.visible = false;
                    const nearGroup = getNearChunkGroup(key);
                    if (nearGroup) {
                        nearGroup.visible = false;
                        setChunkInteractionState(key, false, context);
                        enqueuePendingNearChunkUnload(key, context);
                    }
                    chunkTierStateByKey.set(key, CHUNK_TIER_MID);
                    clearPendingSimplifiedChunkBuilds(key);
                    processed += 1;
                    lastSimplifiedChunkBuildMs = getNowMs(context);
                    if (useCadence) break;
                }
                continue;
            }

            const farGroup = getFarChunkGroup(key) || callHook(context, 'ensureFarChunkGroup', request.cx, request.cy);
            if (farGroup) {
                farGroup.visible = true;
                callHook(context, 'setChunkGroupPlaneVisibility', farGroup, policyState.visiblePlane);
                const midGroup = getMidChunkGroup(key);
                const nearGroup = getNearChunkGroup(key);
                if (midGroup) midGroup.visible = false;
                if (nearGroup) {
                    nearGroup.visible = false;
                    setChunkInteractionState(key, false, context);
                    enqueuePendingNearChunkUnload(key, context);
                }
                chunkTierStateByKey.set(key, CHUNK_TIER_FAR);
                clearPendingSimplifiedChunkBuilds(key);
                processed += 1;
                lastSimplifiedChunkBuildMs = getNowMs(context);
                if (useCadence) break;
            }
        }

        return processed;
    }

    function processPendingNearChunkUnloads(options = {}) {
        const context = options.context || options;
        const policyState = options.policyState || buildCurrentChunkPolicyState(context);
        const maxUnloads = Math.max(0, Math.floor(Number.isFinite(options.maxUnloads) ? options.maxUnloads : 1));
        const now = getNowMs(context);
        const useCadence = options.useCadence !== false && maxUnloads <= 1;
        if (!policyState || pendingNearChunkUnloads.size === 0 || maxUnloads <= 0) return 0;
        if (useCadence && now - lastNearChunkUnloadMs < CHUNK_STREAMING_NEAR_UNLOAD_INTERVAL_MS) return 0;

        const requests = Array.from(pendingNearChunkUnloads.values()).sort((left, right) => {
            if (left.unloadAfterMs !== right.unloadAfterMs) return left.unloadAfterMs - right.unloadAfterMs;
            return left.sequence - right.sequence;
        });

        let processed = 0;
        for (let i = 0; i < requests.length && processed < maxUnloads; i++) {
            const request = requests[i];
            if (!request || request.unloadAfterMs > now) break;
            const key = request.key;
            const targetTier = policyState.desiredTierByKey.get(key);
            if (targetTier === CHUNK_TIER_NEAR) {
                clearPendingNearChunkUnloads(key);
                continue;
            }
            if (!getNearChunkGroup(key)) {
                clearPendingNearChunkUnloads(key);
                continue;
            }
            if (targetTier === CHUNK_TIER_MID && !getMidChunkGroup(key)) {
                request.unloadAfterMs = now + 250;
                continue;
            }
            setChunkInteractionState(key, false, context);
            unregisterNearChunk(key, context);
            processed += 1;
            lastNearChunkUnloadMs = getNowMs(context);
            if (useCadence) break;
        }

        return processed;
    }

    function processPendingNearChunkBuilds(options = {}) {
        const context = options.context || options;
        const maxBuilds = Number.isFinite(options.maxBuilds) ? options.maxBuilds : (Number.isFinite(options) ? options : 1);
        if (!callHook(context, 'hasPlayerRig')) return 0;
        const buildLimit = Math.max(0, Math.floor(Number.isFinite(maxBuilds) ? maxBuilds : 1));
        const maxSimplifiedBuilds = Math.max(0, Math.floor(Number.isFinite(options.maxSimplifiedBuilds) ? options.maxSimplifiedBuilds : 1));
        const maxUnloads = Math.max(0, Math.floor(Number.isFinite(options.maxUnloads) ? options.maxUnloads : 1));
        if (buildLimit <= 0 && maxSimplifiedBuilds <= 0 && maxUnloads <= 0) return 0;

        const policyState = buildCurrentChunkPolicyState(context);
        if (!policyState) return 0;
        const frameStartMs = getNowMs(context);
        const useNearBuildCadence = options.useCadence !== false && buildLimit <= 1;
        const hadPendingNearBuilds = pendingNearChunkBuilds.size > 0;
        const nearBuilds = buildLimit > 0
            ? processNearChunkBuildQueue(context, policyState, buildLimit, frameStartMs, useNearBuildCadence)
            : 0;
        const stillPendingNearBuilds = pendingNearChunkBuilds.size > 0;
        const lowerPriorityWorkAllowed = nearBuilds === 0 && !hadPendingNearBuilds && !stillPendingNearBuilds && !isStreamingBudgetSpent(frameStartMs, context);
        const simplifiedBuilds = lowerPriorityWorkAllowed
            ? processPendingSimplifiedChunkBuilds({ context, policyState, maxBuilds: maxSimplifiedBuilds, frameStartMs, useCadence: options.useCadence })
            : 0;
        const nearUnloads = lowerPriorityWorkAllowed && simplifiedBuilds === 0
            ? processPendingNearChunkUnloads({ context, policyState, maxUnloads, useCadence: options.useCadence })
            : 0;
        return nearBuilds + simplifiedBuilds + nearUnloads;
    }

    function applyChunkTierForKey(cx, cy, key, targetTier, shouldRegisterInteraction, maxVisiblePlane, context = {}) {
        const nearGroup = getNearChunkGroup(key);
        const midGroup = getMidChunkGroup(key);
        const farGroup = getFarChunkGroup(key);
        const currentTier = chunkTierStateByKey.get(key);

        if (targetTier === CHUNK_TIER_NEAR) {
            clearPendingSimplifiedChunkBuilds(key);
            clearPendingNearChunkUnloads(key);
            if (nearGroup) {
                clearPendingNearChunkBuilds(key);
                if (midGroup) midGroup.visible = false;
                if (farGroup) farGroup.visible = false;
                nearGroup.visible = true;
                setChunkInteractionState(key, shouldRegisterInteraction, context);
                callHook(context, 'setChunkGroupPlaneVisibility', nearGroup, maxVisiblePlane);
                chunkTierStateByKey.set(key, CHUNK_TIER_NEAR);
                return;
            }

            enqueuePendingNearChunkBuild(cx, cy, key, shouldRegisterInteraction, maxVisiblePlane);
            showPendingNearChunkFallback(cx, cy, key, maxVisiblePlane, context);
            chunkTierStateByKey.set(key, midGroup ? CHUNK_TIER_MID : CHUNK_TIER_FAR);
            return;
        }

        clearPendingNearChunkBuilds(key);

        if (targetTier === CHUNK_TIER_MID) {
            if (nearGroup) {
                nearGroup.visible = false;
                setChunkInteractionState(key, false, context);
                enqueuePendingNearChunkUnload(key, context);
            }
            if (farGroup) farGroup.visible = false;
            const nextMidGroup = midGroup;
            if (nextMidGroup) {
                nextMidGroup.visible = true;
                callHook(context, 'setChunkGroupPlaneVisibility', nextMidGroup, maxVisiblePlane);
                clearPendingSimplifiedChunkBuilds(key);
                chunkTierStateByKey.set(key, CHUNK_TIER_MID);
                return;
            }
            if (farGroup) {
                farGroup.visible = true;
                callHook(context, 'setChunkGroupPlaneVisibility', farGroup, maxVisiblePlane);
            } else {
                enqueuePendingSimplifiedChunkBuild(cx, cy, key, CHUNK_TIER_FAR, maxVisiblePlane);
            }
            enqueuePendingSimplifiedChunkBuild(cx, cy, key, CHUNK_TIER_MID, maxVisiblePlane);
            chunkTierStateByKey.set(key, currentTier === CHUNK_TIER_MID ? CHUNK_TIER_MID : CHUNK_TIER_FAR);
            return;
        }

        if (nearGroup) {
            nearGroup.visible = false;
            setChunkInteractionState(key, false, context);
            enqueuePendingNearChunkUnload(key, context);
        }
        if (midGroup) midGroup.visible = false;
        clearPendingSimplifiedChunkBuilds(key);
        const nextFarGroup = farGroup;
        if (nextFarGroup) {
            nextFarGroup.visible = true;
            callHook(context, 'setChunkGroupPlaneVisibility', nextFarGroup, maxVisiblePlane);
        } else {
            enqueuePendingSimplifiedChunkBuild(cx, cy, key, CHUNK_TIER_FAR, maxVisiblePlane);
        }
        chunkTierStateByKey.set(key, CHUNK_TIER_FAR);
    }

    function deactivateChunkTierForKey(key, context = {}) {
        clearPendingNearChunkBuilds(key);
        clearPendingSimplifiedChunkBuilds(key);
        if (getNearChunkGroup(key)) {
            setChunkInteractionState(key, false, context);
            const nearGroup = getNearChunkGroup(key);
            if (nearGroup) nearGroup.visible = false;
            enqueuePendingNearChunkUnload(key, context);
        }
        const midGroup = getMidChunkGroup(key);
        const farGroup = getFarChunkGroup(key);
        if (midGroup) midGroup.visible = false;
        if (farGroup) farGroup.visible = false;
        chunkTierStateByKey.delete(key);
    }

    function manageChunks(options = {}) {
        const context = options.context || options;
        const forceRefresh = !!options.forceRefresh;
        const policyState = buildCurrentChunkPolicyState(context);
        if (!policyState) return;
        const pCX = policyState.centerChunkX;
        const pCY = policyState.centerChunkY;
        const contextPolicyRevision = callHook(context, 'getChunkRenderPolicyRevision');
        const policyRevision = Number.isFinite(contextPolicyRevision)
            ? contextPolicyRevision
            : getChunkRenderPolicyRevision();
        if (forceRefresh) clearPendingNearChunkBuilds();

        if (
            !forceRefresh
            && !chunkPolicyDirty
            && lastChunkPolicyCenterX === pCX
            && lastChunkPolicyCenterY === pCY
            && lastChunkPolicyNearActivationKey === policyState.nearActivationKey
            && lastChunkPolicyRevision === policyRevision
        ) {
            return;
        }

        if (policyState.policy && policyState.policy.farMode === 'all') {
            callHook(context, 'ensureFarChunkBackdropBuilt');
        }
        const visiblePlane = policyState.visiblePlane;
        const worldChunksX = Math.max(1, Math.floor(Number.isFinite(context.worldChunksX) ? context.worldChunksX : 1));
        const worldChunksY = Math.max(1, Math.floor(Number.isFinite(context.worldChunksY) ? context.worldChunksY : 1));

        for (let cy = 0; cy < worldChunksY; cy++) {
            for (let cx = 0; cx < worldChunksX; cx++) {
                const key = chunkKey(cx, cy);
                const targetTier = policyState.desiredTierByKey.get(key);
                if (!targetTier) {
                    deactivateChunkTierForKey(key, context);
                    continue;
                }
                const shouldRegisterInteraction = targetTier === CHUNK_TIER_NEAR && policyState.desiredInteractionChunks.has(key);
                applyChunkTierForKey(cx, cy, key, targetTier, shouldRegisterInteraction, visiblePlane, context);
            }
        }

        lastChunkPolicyCenterX = pCX;
        lastChunkPolicyCenterY = pCY;
        lastChunkPolicyNearActivationKey = policyState.nearActivationKey;
        lastChunkPolicyRevision = policyRevision;
        chunkPolicyDirty = false;
    }

    function setLoadedChunkPlaneVisibility(maxVisiblePlane, context = {}) {
        Object.values(nearGroups).forEach((group) => callHook(context, 'setChunkGroupPlaneVisibility', group, maxVisiblePlane));
        Object.values(midGroups).forEach((group) => callHook(context, 'setChunkGroupPlaneVisibility', group, maxVisiblePlane));
        Object.values(farGroups).forEach((group) => callHook(context, 'setChunkGroupPlaneVisibility', group, maxVisiblePlane));
    }

    function getChunkStreamingQueueStats() {
        return {
            pendingNearBuilds: pendingNearChunkBuilds.size,
            pendingSimplifiedBuilds: pendingSimplifiedChunkBuilds.size,
            pendingNearUnloads: pendingNearChunkUnloads.size,
            nearGroups: Object.keys(nearGroups).length,
            midGroups: Object.keys(midGroups).length,
            farGroups: Object.keys(farGroups).length
        };
    }

    window.WorldChunkSceneRuntime = {
        CHUNK_TIER_NEAR,
        CHUNK_TIER_MID,
        CHUNK_TIER_FAR,
        getChunkRenderPolicy,
        getActiveChunkRenderPolicyPreset,
        applyChunkRenderPolicyPreset,
        getChunkRenderPolicyRevision,
        getChunkRenderPolicyPresetOrder,
        manageChunks,
        processPendingNearChunkBuilds,
        reportChunkPerformanceSample,
        markChunkPolicyDirty,
        clearPendingNearChunkBuilds,
        resetForWorldReload,
        clearChunkTierGroups,
        registerNearChunk,
        unregisterNearChunk,
        isNearChunkLoaded,
        getChunkInteractionState,
        getNearChunkGroup,
        getMidChunkGroup,
        getFarChunkGroup,
        setMidChunkGroup,
        setFarChunkGroup,
        setChunkInteractionState,
        setLoadedChunkPlaneVisibility,
        getChunkStreamingQueueStats
    };

    window.getChunkRenderPolicy = getChunkRenderPolicy;
    window.getActiveChunkRenderPolicyPreset = getActiveChunkRenderPolicyPreset;
    window.applyChunkRenderPolicyPreset = applyChunkRenderPolicyPreset;
    window.getChunkRenderPolicyRevision = getChunkRenderPolicyRevision;
    window.getChunkRenderPolicyPresetOrder = getChunkRenderPolicyPresetOrder;
})();
