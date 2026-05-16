(function () {
    const SKILL_ID = 'firemaking';

    function getRecipeSet(context) {
        const recipes = typeof context.getRecipeSet === 'function' ? context.getRecipeSet(SKILL_ID) : null;
        return recipes && typeof recipes === 'object' ? recipes : null;
    }

    function getRecipeEntries(context) {
        const recipes = getRecipeSet(context);
        if (!recipes) return [];

        return Object.keys(recipes)
            .map((recipeId) => recipes[recipeId])
            .filter((recipe) => recipe && typeof recipe === 'object');
    }

    function getRecipeBySourceItemId(context, sourceItemId) {
        if (typeof sourceItemId !== 'string' || !sourceItemId) return null;
        const recipes = getRecipeEntries(context);
        for (let i = 0; i < recipes.length; i++) {
            const recipe = recipes[i];
            if (recipe.sourceItemId === sourceItemId) return recipe;
        }
        return null;
    }

    function getInventoryUseLogItemId(context) {
        if (!context || context.targetObj !== 'INVENTORY') return null;
        const targetUid = context.targetUid && typeof context.targetUid === 'object' ? context.targetUid : null;
        const sourceItemId = typeof context.sourceItemId === 'string' ? context.sourceItemId : '';
        const targetItemId = targetUid && typeof targetUid.targetItemId === 'string' ? targetUid.targetItemId : '';
        const sourceRecipe = getRecipeBySourceItemId(context, sourceItemId);
        const targetRecipe = getRecipeBySourceItemId(context, targetItemId);

        if (sourceItemId === 'tinderbox' && targetRecipe) return targetItemId;
        if (targetItemId === 'tinderbox' && sourceRecipe) return sourceItemId;
        return null;
    }

    function getLogRecipe(context, options = {}) {
        const includeLocked = !!options.includeLocked;
        const level = typeof context.getSkillLevel === 'function' ? context.getSkillLevel(SKILL_ID) : 1;
        const requestedLogItemId = getInventoryUseLogItemId(context)
            || (typeof context.sourceItemId === 'string' ? context.sourceItemId : '');
        const requestedRecipe = getRecipeBySourceItemId(context, requestedLogItemId);
        if (requestedRecipe) {
            if (!includeLocked && level < (requestedRecipe.requiredLevel || 1)) return null;
            return requestedRecipe;
        }

        const recipes = getRecipeEntries(context);
        for (let i = 0; i < recipes.length; i++) {
            const recipe = recipes[i];
            if (!recipe || typeof recipe !== 'object' || typeof recipe.sourceItemId !== 'string') continue;
            if (context.getInventoryCount(recipe.sourceItemId) <= 0) continue;
            if (!includeLocked && level < (recipe.requiredLevel || 1)) continue;
            return recipe;
        }

        return null;
    }

    function isValidFiremakingUse(context) {
        if (!context) return false;
        return context.targetObj === 'INVENTORY' && !!getInventoryUseLogItemId(context);
    }

    function getAttemptInterval(recipe, skillSpec) {
        if (recipe && Number.isFinite(recipe.ignitionAttemptTicks)) return Math.max(1, recipe.ignitionAttemptTicks);
        if (skillSpec && skillSpec.timing && Number.isFinite(skillSpec.timing.ignitionAttemptTicks)) return Math.max(1, skillSpec.timing.ignitionAttemptTicks);
        return 1;
    }

    function startContinuousFiremaking(context, recipe, options = {}) {
        const skillSpec = typeof context.getSkillSpec === 'function' ? context.getSkillSpec(SKILL_ID) : null;
        const attemptInterval = getAttemptInterval(recipe, skillSpec);
        const target = options.target && typeof options.target === 'object'
            ? options.target
            : { x: context.playerState.x, y: context.playerState.y, z: context.playerState.z };
        const standAt = options.standAt && typeof options.standAt === 'object'
            ? options.standAt
            : { x: context.playerState.x, y: context.playerState.y, z: context.playerState.z };

        context.playerState.firemakingSession = {
            phase: 'attempting',
            target: { x: target.x, y: target.y, z: target.z },
            standAt: { x: standAt.x, y: standAt.y, z: standAt.z },
            sourceItemId: recipe.sourceItemId,
            attemptInterval,
            nextAttemptTick: context.currentTick,
            failureFeedbackShown: false
        };

        context.playerState.action = 'SKILLING: FIREMAKING';
        context.playerState.turnLock = false;
        context.playerState.actionVisualReady = true;
        return true;
    }

    function stopFiremaking(context, message, tone = 'info') {
        context.playerState.firemakingSession = null;
        context.playerState.turnLock = false;
        context.playerState.actionVisualReady = true;
        context.stopAction();
        if (message) context.addChatMessage(message, tone);
    }

    function normalizeStepResult(result) {
        if (result && typeof result === 'object' && Object.prototype.hasOwnProperty.call(result, 'stepped')) {
            return {
                stepped: !!result.stepped,
                reason: typeof result.reason === 'string' ? result.reason : null
            };
        }
        return {
            stepped: !!result,
            reason: result ? null : 'blocked_tile'
        };
    }

    function getBlockedStepMessage(reason) {
        if (reason === 'fire_occupied') return 'You stay put because another fire is in the way.';
        if (reason === 'height_mismatch') return 'You stay put because the terrain is too uneven.';
        if (reason === 'out_of_bounds') return 'You stay put because there is no room to move.';
        return 'You stay put because the way forward is blocked.';
    }

    function faceTile(context, tile) {
        if (!context || !tile || typeof tile !== 'object') return;
        const dx = tile.x - context.playerState.x;
        const dy = tile.y - context.playerState.y;
        if (dx === 0 && dy === 0) return;
        context.playerState.targetRotation = Math.atan2(dx, dy);
        context.playerState.turnLock = true;
        context.playerState.actionVisualReady = true;
    }

    function getSupplyFailureMessage(context, recipe) {
        if (context.getInventoryCount('tinderbox') <= 0) return 'You need logs and a tinderbox.';
        if (context.getInventoryCount(recipe.sourceItemId) <= 0) return 'You have run out of logs.';
        return null;
    }

    function scheduleNextFiremakingAttempt(context, session, delayTicks = 0) {
        if (!context || !session) return;
        session.phase = 'attempting';
        session.failureFeedbackShown = false;
        session.finishTick = null;
        session.nextAttemptTick = context.currentTick + Math.max(0, Math.floor(delayTicks));
    }

    function continueFiremakingChain(context, session, recipe) {
        if (!context || !session || !recipe) return false;

        const stepResult = normalizeStepResult(context.tryStepAfterFire());
        if (!stepResult.stepped) {
            stopFiremaking(context, getBlockedStepMessage(stepResult.reason), 'info');
            return false;
        }

        const supplyFailureMessage = getSupplyFailureMessage(context, recipe);
        if (supplyFailureMessage) {
            stopFiremaking(context, supplyFailureMessage, 'warn');
            return false;
        }

        session.target = {
            x: session.standAt.x,
            y: session.standAt.y,
            z: session.standAt.z
        };
        session.standAt = {
            x: context.playerState.x,
            y: context.playerState.y,
            z: context.playerState.z
        };
        scheduleNextFiremakingAttempt(context, session, session.attemptInterval || 1);
        faceTile(context, session.target);
        return true;
    }

    const firemakingModule = {
        canStart(context) {
            const recipe = getLogRecipe(context);
            if (!recipe) return false;
            return context.getInventoryCount('tinderbox') > 0
                && context.getInventoryCount(recipe.sourceItemId) > 0;
        },

        onUseItem(context) {
            if (!isValidFiremakingUse(context)) return false;
            const recipe = getLogRecipe(context, { includeLocked: true });
            if (!recipe) return false;

            if (typeof context.haltMovement === 'function') context.haltMovement();

            return !!context.startSkillById(SKILL_ID, {
                skillId: SKILL_ID,
                targetObj: 'GROUND',
                sourceInvIndex: context.sourceInvIndex,
                sourceItemId: recipe.sourceItemId
            });
        },

        onStart(context) {
            const recipe = getLogRecipe(context, { includeLocked: true });
            if (!recipe) {
                context.addChatMessage('You need logs and a tinderbox.', 'warn');
                return false;
            }
            if (typeof context.requireSkillLevel === 'function' && !context.requireSkillLevel(recipe.requiredLevel || 1, { skillId: SKILL_ID, action: 'light these logs' })) {
                return false;
            }
            if (context.getInventoryCount('tinderbox') <= 0 || context.getInventoryCount(recipe.sourceItemId) <= 0) {
                context.addChatMessage('You need logs and a tinderbox.', 'warn');
                return false;
            }

            context.haltMovement();

            const target = { x: context.playerState.x, y: context.playerState.y, z: context.playerState.z };
            if (context.hasActiveFireAt(target.x, target.y, target.z)) {
                context.addChatMessage('There is already a fire here.', 'warn');
                return false;
            }

            const stepResult = normalizeStepResult(context.tryStepBeforeFiremaking());
            if (!stepResult.stepped) {
                context.addChatMessage(getBlockedStepMessage(stepResult.reason), 'info');
                return false;
            }

            const standAt = { x: context.playerState.x, y: context.playerState.y, z: context.playerState.z };

            context.addChatMessage('You begin trying to light the logs.', 'info');
            const started = startContinuousFiremaking(context, recipe, { target, standAt });
            if (started) faceTile(context, target);
            return started;
        },

        onTick(context) {
            if (context.playerState.action !== 'SKILLING: FIREMAKING') return;
            const session = context.playerState.firemakingSession;
            const recipe = session ? getRecipeBySourceItemId(context, session.sourceItemId) : null;
            if (!recipe || !session) {
                stopFiremaking(context);
                return;
            }

            if (session.phase === 'post_success') {
                if (context.currentTick < (session.finishTick || 0)) return;
                continueFiremakingChain(context, session, recipe);
                return;
            }

            if (context.currentTick < (session.nextAttemptTick || 0)) return;

            const supplyFailureMessage = getSupplyFailureMessage(context, recipe);
            if (supplyFailureMessage) {
                stopFiremaking(context, supplyFailureMessage, 'warn');
                return;
            }

            const target = session.target;
            const standAt = session.standAt || target;
            if (!target || !standAt) {
                stopFiremaking(context, 'You stop lighting the logs.', 'info');
                return;
            }

            if (context.playerState.x !== standAt.x || context.playerState.y !== standAt.y || context.playerState.z !== standAt.z) {
                stopFiremaking(context, 'You stop lighting the logs.', 'info');
                return;
            }

            if (context.hasActiveFireAt(target.x, target.y, target.z)) {
                stopFiremaking(context, 'There is already a fire here.', 'warn');
                return;
            }

            const level = typeof context.getSkillLevel === 'function' ? context.getSkillLevel(SKILL_ID) : 1;
            const successChance = (window.SkillSpecRegistry && typeof SkillSpecRegistry.computeSuccessChanceFromDifficulty === 'function')
                ? SkillSpecRegistry.computeSuccessChanceFromDifficulty(level, recipe.ignitionDifficulty)
                : 0.7;

            const rollChance = window.SkillSharedUtils && typeof SkillSharedUtils.rollChance === 'function'
                ? SkillSharedUtils.rollChance
                : ((chance, rng) => (typeof rng === 'function' ? rng() : Math.random()) < chance);

            session.nextAttemptTick = context.currentTick + Math.max(1, session.attemptInterval || 1);
            faceTile(context, target);

            if (!rollChance(successChance, context.random)) {
                if (!session.failureFeedbackShown) {
                    session.failureFeedbackShown = true;
                    context.addChatMessage('The logs fail to catch.', 'info');
                }
                return;
            }

            if (!context.lightFireAtCurrentTile(target.x, target.y, target.z)) {
                stopFiremaking(context, 'You cannot light a fire here right now.', 'warn');
                return;
            }

            if (!context.removeOneItemById(recipe.sourceItemId)) {
                stopFiremaking(context, 'You have run out of logs.', 'warn');
                return;
            }

            context.addSkillXp(SKILL_ID, recipe.xpPerSuccess || 0);
            context.addChatMessage('You light the logs.', 'game');
            context.renderInventory();

            session.phase = 'post_success';
            session.failureFeedbackShown = false;
            session.finishTick = context.currentTick + 3;
        },

        onAnimate(context) {
            return false;
        },

        getAnimationHeldItemId() {
            return 'tinderbox';
        },

        getAnimationHeldItemSlot() {
            return 'leftHand';
        },

        getAnimationSuppressEquipmentVisual() {
            return true;
        }
    };

    window.SkillModules = window.SkillModules || {};
    window.SkillModules[SKILL_ID] = firemakingModule;
})();
