(function () {
    const SKILL_ID = 'cooking';

    function getRecipeFromItemId(context, itemId) {
        if (!itemId) return null;
        const recipes = typeof context.getRecipeSet === 'function' ? context.getRecipeSet(SKILL_ID) : null;
        if (!recipes) return null;
        return recipes[itemId] || null;
    }

    function getCookingActionTicks(context) {
        const skillSpec = typeof context.getSkillSpec === 'function' ? context.getSkillSpec(SKILL_ID) : null;
        return skillSpec && skillSpec.timing && Number.isFinite(skillSpec.timing.actionTicks)
            ? Math.max(1, Math.floor(skillSpec.timing.actionTicks))
            : 1;
    }

    function canCookRecipeLevel(context, recipe) {
        if (!recipe) return false;
        if (typeof context.requireSkillLevel !== 'function') return true;
        const requiredLevel = Number.isFinite(recipe.requiredLevel) ? recipe.requiredLevel : 1;
        return context.requireSkillLevel(requiredLevel, {
            skillId: SKILL_ID,
            action: 'cook that',
            message: `You need Cooking level ${requiredLevel} to cook that.`
        });
    }

    function getActiveCookingSession(context) {
        if (!(window.SkillActionResolution && typeof SkillActionResolution.getSkillSession === 'function')) return null;
        const session = SkillActionResolution.getSkillSession(context.playerState, SKILL_ID);
        return session && session.kind === 'processing' ? session : null;
    }

    function isSameFireTarget(sessionTarget, fireTarget) {
        if (!sessionTarget || !fireTarget) return false;
        return sessionTarget.x === fireTarget.x
            && sessionTarget.y === fireTarget.y
            && sessionTarget.z === fireTarget.z;
    }

    function canHotSwapCookingSession(context, session, fireTarget) {
        if (!session || context.playerState.action !== 'SKILLING: FIRE') return false;
        if (!isSameFireTarget(session.target, fireTarget)) return false;

        const dx = Math.abs(fireTarget.x - context.playerState.x);
        const dy = Math.abs(fireTarget.y - context.playerState.y);
        return fireTarget.z === context.playerState.z && dx <= 1 && dy <= 1;
    }

    function hotSwapCookingSession(context, session, recipe, fireTarget) {
        if (!session || !recipe || !fireTarget) return false;
        session.recipeId = recipe.sourceItemId;
        session.target = { x: fireTarget.x, y: fireTarget.y, z: fireTarget.z };
        session.intervalTicks = Number.isFinite(session.intervalTicks) ? Math.max(1, session.intervalTicks) : getCookingActionTicks(context);
        session.nextTick = Number.isFinite(session.nextTick)
            ? Math.max(context.currentTick, session.nextTick)
            : context.currentTick;
        return true;
    }

    function computeBurnChance(context, recipe) {
        const level = typeof context.getSkillLevel === 'function' ? context.getSkillLevel(SKILL_ID) : 1;
        const requiredLevel = Number.isFinite(recipe && recipe.requiredLevel) ? recipe.requiredLevel : 1;
        if (window.SkillSpecRegistry && typeof SkillSpecRegistry.computeCookingBurnChance === 'function') {
            return SkillSpecRegistry.computeCookingBurnChance(level, requiredLevel);
        }

        const delta = Math.max(0, Math.min(30, level - requiredLevel));
        if (delta <= 0) return 0.33;
        if (delta >= 30) return 0;
        const raw = 0.33 - (0.038 * delta) + (0.0018 * delta * delta) - (0.00003 * delta * delta * delta);
        return Math.max(0, Math.min(0.33, raw));
    }

    function cookOne(context, recipe) {
        if (!context.removeOneItemById(recipe.sourceItemId)) {
            return window.SkillActionResolution.createActionResolution('blocked', 'MISSING_INPUT');
        }

        const rollChance = window.SkillSharedUtils && typeof SkillSharedUtils.rollChance === 'function'
            ? SkillSharedUtils.rollChance
            : ((chance, rng) => (typeof rng === 'function' ? rng() : Math.random()) < chance);

        const burnChance = computeBurnChance(context, recipe);
        const burned = rollChance(burnChance, context.random);
        if (burned) {
            context.giveItemById(recipe.burntItemId, 1);
            context.addChatMessage('You accidentally burn the food.', 'warn');
            return window.SkillActionResolution.createActionResolution('success', 'COOK_BURNED', {
                consumed: [{ itemId: recipe.sourceItemId, amount: 1 }],
                produced: [{ itemId: recipe.burntItemId, amount: 1 }],
                xpGained: 0
            });
        }

        if (context.giveItemById(recipe.cookedItemId, 1) > 0) {
            context.addSkillXp(SKILL_ID, recipe.xpPerSuccess || 0);
            context.addChatMessage('You cook the food.', 'game');
            return window.SkillActionResolution.createActionResolution('success', 'COOK_SUCCESS', {
                consumed: [{ itemId: recipe.sourceItemId, amount: 1 }],
                produced: [{ itemId: recipe.cookedItemId, amount: 1 }],
                xpGained: recipe.xpPerSuccess || 0
            });
        }

        context.addChatMessage('You have no inventory space for the cooked food.', 'warn');
        return window.SkillActionResolution.createActionResolution('stopped', 'INVENTORY_FULL');
    }

    function debugCooking(context, message) {
        if (!window.DEBUG_COOKING_USE) return;
        const text = `[cook-debug] ${message}`;
        try { console.log(text); } catch (_) {}
        if (context && typeof context.addChatMessage === 'function') context.addChatMessage(text, 'info');
    }

    const cookingModule = {
        canStart(context) {
            if (!context || context.targetObj !== 'FIRE') return false;
            return !!getRecipeFromItemId(context, context.sourceItemId);
        },

        onUseItem(context) {
            const recipe = getRecipeFromItemId(context, context.sourceItemId);
            if (!recipe) {
                debugCooking(context, `onUseItem rejected: no recipe for sourceItemId=${context.sourceItemId || 'none'}`);
                return false;
            }

            if (!(context.targetObj === 'GROUND' || context.targetObj === 'FIRE')) {
                debugCooking(context, `onUseItem rejected: unsupported targetObj=${context.targetObj || 'none'}`);
                return false;
            }

            const fireTarget = typeof context.resolveFireTargetFromHit === 'function'
                ? context.resolveFireTargetFromHit(context.hitData)
                : null;
            if (!fireTarget) {
                debugCooking(context, 'onUseItem blocked: no active fire target resolved from click.');
                context.addChatMessage('You need an active fire to cook that.', 'warn');
                return true;
            }

            if (!canCookRecipeLevel(context, recipe)) {
                debugCooking(context, `onUseItem blocked: level gate for ${recipe.sourceItemId}`);
                return true;
            }

            const activeSession = getActiveCookingSession(context);
            if (canHotSwapCookingSession(context, activeSession, fireTarget)) {
                if (activeSession.recipeId !== recipe.sourceItemId) {
                    hotSwapCookingSession(context, activeSession, recipe, fireTarget);
                }
                debugCooking(context, `onUseItem hot-swap: source=${recipe.sourceItemId}, fire=(${fireTarget.x},${fireTarget.y},${fireTarget.z})`);
                return true;
            }

            context.playerState.pendingSkillStart = {
                skillId: SKILL_ID,
                targetObj: 'FIRE',
                targetX: fireTarget.x,
                targetY: fireTarget.y,
                targetZ: fireTarget.z,
                sourceInvIndex: context.sourceInvIndex,
                sourceItemId: recipe.sourceItemId
            };
            debugCooking(context, `onUseItem queued: source=${recipe.sourceItemId}, fire=(${fireTarget.x},${fireTarget.y},${fireTarget.z})`);

            if (typeof context.queueInteractAt === 'function') {
                context.queueInteractAt('FIRE', fireTarget.x, fireTarget.y, null);
            } else {
                context.queueInteract();
            }

            return true;
        },

        onStart(context) {
            const recipe = getRecipeFromItemId(context, context.sourceItemId);
            if (!recipe) {
                debugCooking(context, `onStart failed: recipe missing for sourceItemId=${context.sourceItemId || 'none'}`);
                context.addChatMessage('You cannot cook that.', 'warn');
                return false;
            }

            if (!canCookRecipeLevel(context, recipe)) {
                debugCooking(context, `onStart blocked: level gate for ${recipe.sourceItemId}`);
                return false;
            }

            if (context.getInventoryCount(recipe.sourceItemId) <= 0) {
                context.addChatMessage('You do not have anything to cook.', 'warn');
                return false;
            }

            const target = { x: context.targetX, y: context.targetY, z: context.targetZ };
            const dx = Math.abs(target.x - context.playerState.x);
            const dy = Math.abs(target.y - context.playerState.y);
            const samePlane = target.z === context.playerState.z;
            if (!samePlane || dx > 1 || dy > 1) {
                debugCooking(context, `onStart blocked: not adjacent/same plane (player=${context.playerState.x},${context.playerState.y},${context.playerState.z} target=${target.x},${target.y},${target.z})`);
                return false;
            }

            if (!window.SkillActionResolution || typeof SkillActionResolution.startProcessingSession !== 'function') return false;
            const actionTicks = getCookingActionTicks(context);

            SkillActionResolution.startProcessingSession(context, SKILL_ID, {
                recipeId: recipe.sourceItemId,
                target,
                intervalTicks: actionTicks,
                nextTick: context.currentTick + actionTicks
            });

            debugCooking(context, `onStart success: recipe=${recipe.sourceItemId}, intervalTicks=${actionTicks}`);
            context.startSkillingAction();
            return true;
        },

        onTick(context) {
            if (context.playerState.action !== 'SKILLING: FIRE') return;
            if (!window.SkillActionResolution || typeof SkillActionResolution.tickProcessingSession !== 'function') {
                context.stopAction();
                return;
            }

            SkillActionResolution.tickProcessingSession(context, SKILL_ID, (session) => {
                const recipe = getRecipeFromItemId(context, session.recipeId);
                if (!recipe) {
                    return SkillActionResolution.stopSkill(context, SKILL_ID, 'RECIPE_MISSING');
                }

                const target = session.target || { x: context.targetX, y: context.targetY, z: context.targetZ };
                if (!context.hasActiveFireAt(target.x, target.y, target.z)) {
                    debugCooking(context, `onTick stop: fire missing at (${target.x},${target.y},${target.z})`);
                    context.addChatMessage('The fire has gone out.', 'warn');
                    context.renderInventory();
                    return SkillActionResolution.stopSkill(context, SKILL_ID, 'FIRE_GONE');
                }

                if (context.getInventoryCount(recipe.sourceItemId) <= 0) {
                    context.renderInventory();
                    return SkillActionResolution.stopSkill(context, SKILL_ID, 'INPUT_EMPTY');
                }

                const resolution = cookOne(context, recipe);
                context.renderInventory();

                if (resolution.status !== 'success') {
                    debugCooking(context, `onTick stop: resolution=${resolution.status} reason=${resolution.reasonCode || 'FAILED'}`);
                    return SkillActionResolution.stopSkill(context, SKILL_ID, resolution.reasonCode || 'FAILED');
                }

                if (context.getInventoryCount(recipe.sourceItemId) <= 0) {
                    return SkillActionResolution.stopSkill(context, SKILL_ID, 'INPUT_EMPTY');
                }

                session.nextTick = context.currentTick + (session.intervalTicks || 1);
                return resolution;
            });
        },

        onAnimate(context) {
            return false;
        },

        getAnimationSuppressEquipmentVisual(context) {
            return true;
        },

        getTooltip() {
            return '';
        }
    };

    window.SkillModules = window.SkillModules || {};
    window.SkillModules[SKILL_ID] = cookingModule;
})();


