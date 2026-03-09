(function () {
    function createActionResolution(status, reasonCode, extra = {}) {
        return {
            status: status || 'retry',
            reasonCode: reasonCode || 'UNKNOWN',
            consumed: Array.isArray(extra.consumed) ? extra.consumed : [],
            produced: Array.isArray(extra.produced) ? extra.produced : [],
            xpGained: Number.isFinite(extra.xpGained) ? extra.xpGained : 0,
            nextTick: Number.isFinite(extra.nextTick) ? extra.nextTick : null,
            message: typeof extra.message === 'string' ? extra.message : ''
        };
    }

    function ensureSkillSessionStore(playerState) {
        if (!playerState.skillSessions || typeof playerState.skillSessions !== 'object') {
            playerState.skillSessions = {};
        }
        return playerState.skillSessions;
    }

    function setSkillSession(playerState, skillId, session) {
        const store = ensureSkillSessionStore(playerState);
        store[skillId] = session;
    }

    function getSkillSession(playerState, skillId) {
        const store = ensureSkillSessionStore(playerState);
        return store[skillId] || null;
    }

    function clearSkillSession(playerState, skillId) {
        const store = ensureSkillSessionStore(playerState);
        if (Object.prototype.hasOwnProperty.call(store, skillId)) delete store[skillId];
    }

    function startGatherSession(context, skillId, intervalTicks) {
        const nextTick = context.currentTick;
        setSkillSession(context.playerState, skillId, {
            kind: 'gather',
            nextAttemptTick: nextTick,
            intervalTicks: Math.max(1, intervalTicks || 1)
        });
        return createActionResolution('success', 'SESSION_STARTED', { nextTick });
    }

    function runGatherAttempt(context, skillId, options) {
        const session = getSkillSession(context.playerState, skillId);
        if (!session || session.kind !== 'gather') return createActionResolution('blocked', 'NO_SESSION');

        if (context.currentTick < session.nextAttemptTick) {
            return createActionResolution('retry', 'WAITING', { nextTick: session.nextAttemptTick });
        }

        if (!context.isTargetTile(options.targetTileId)) {
            context.stopAction();
            clearSkillSession(context.playerState, skillId);
            return createActionResolution('stopped', 'TARGET_INVALID');
        }

        session.nextAttemptTick = context.currentTick + Math.max(1, session.intervalTicks);

        const rollChance = window.SkillSharedUtils && typeof SkillSharedUtils.rollChance === 'function'
            ? SkillSharedUtils.rollChance
            : ((chance, rng) => (typeof rng === 'function' ? rng() : Math.random()) < chance);

        if (!rollChance(options.successChance, context.random)) {
            return createActionResolution('retry', 'ATTEMPT_FAILED', { nextTick: session.nextAttemptTick });
        }

        const rewardItemId = typeof options.rewardItemId === 'function' ? options.rewardItemId(context) : options.rewardItemId;
        if (!rewardItemId) {
            context.stopAction();
            clearSkillSession(context.playerState, skillId);
            return createActionResolution('stopped', 'REWARD_MISSING');
        }

        if (typeof context.canAcceptItemById === 'function' && !context.canAcceptItemById(rewardItemId, 1)) {
            context.stopAction();
            clearSkillSession(context.playerState, skillId);
            return createActionResolution('stopped', 'INVENTORY_FULL');
        }

        if (context.giveItemById(rewardItemId, 1) <= 0) {
            context.stopAction();
            clearSkillSession(context.playerState, skillId);
            return createActionResolution('stopped', 'INVENTORY_FULL');
        }

        context.addSkillXp(skillId, options.xpPerSuccess || 0);

        if (typeof options.onSuccess === 'function') options.onSuccess(context, rewardItemId);

        const bagFullAfterGain = typeof context.canAcceptItemById === 'function' && !context.canAcceptItemById(rewardItemId, 1);
        if (bagFullAfterGain) {
            context.stopAction();
            clearSkillSession(context.playerState, skillId);
            return createActionResolution('stopped', 'INVENTORY_FULL_AFTER_GAIN', {
                produced: [{ itemId: rewardItemId, amount: 1 }],
                xpGained: options.xpPerSuccess || 0,
                nextTick: session.nextAttemptTick
            });
        }

        return createActionResolution('success', 'YIELD_GRANTED', {
            produced: [{ itemId: rewardItemId, amount: 1 }],
            xpGained: options.xpPerSuccess || 0,
            nextTick: session.nextAttemptTick
        });
    }

    function startProcessingSession(context, skillId, sessionData = {}) {
        setSkillSession(context.playerState, skillId, Object.assign({
            kind: 'processing',
            nextTick: context.currentTick
        }, sessionData));

        return createActionResolution('success', 'SESSION_STARTED', { nextTick: context.currentTick });
    }

    function tickProcessingSession(context, skillId, handler) {
        const session = getSkillSession(context.playerState, skillId);
        if (!session || session.kind !== 'processing') return createActionResolution('blocked', 'NO_SESSION');
        if (context.currentTick < (session.nextTick || 0)) {
            return createActionResolution('retry', 'WAITING', { nextTick: session.nextTick });
        }
        return handler(session);
    }

    function runOneShotConversion(context, options) {
        if (typeof options.validate === 'function') {
            const validation = options.validate(context);
            if (!validation || validation.ok !== true) {
                return createActionResolution('blocked', validation && validation.reasonCode ? validation.reasonCode : 'INVALID');
            }
        }

        const conversion = typeof options.convert === 'function' ? options.convert(context) : null;
        if (!conversion || conversion.ok !== true) {
            return createActionResolution('blocked', conversion && conversion.reasonCode ? conversion.reasonCode : 'CONVERSION_FAILED');
        }

        return createActionResolution('success', 'CONVERSION_SUCCESS', {
            consumed: conversion.consumed || [],
            produced: conversion.produced || [],
            xpGained: conversion.xpGained || 0,
            nextTick: null
        });
    }

    function stopSkill(context, skillId, reasonCode = 'STOPPED') {
        clearSkillSession(context.playerState, skillId);
        context.stopAction();
        return createActionResolution('stopped', reasonCode);
    }

    window.SkillActionResolution = {
        createActionResolution,
        ensureSkillSessionStore,
        setSkillSession,
        getSkillSession,
        clearSkillSession,
        startGatherSession,
        runGatherAttempt,
        startProcessingSession,
        tickProcessingSession,
        runOneShotConversion,
        stopSkill
    };
})();

