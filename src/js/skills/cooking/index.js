(function () {
    const SKILL_ID = 'cooking';

    function getRecipeFromItemId(context, itemId) {
        if (!itemId) return null;
        const recipes = typeof context.getRecipeSet === 'function' ? context.getRecipeSet(SKILL_ID) : null;
        if (!recipes) return null;
        return recipes[itemId] || null;
    }

    function computeBurnChance(context, recipe) {
        const level = typeof context.getSkillLevel === 'function' ? context.getSkillLevel(SKILL_ID) : 1;
        const successChance = (window.SkillSpecRegistry && typeof SkillSpecRegistry.computeSuccessChanceFromDifficulty === 'function')
            ? SkillSpecRegistry.computeSuccessChanceFromDifficulty(level, recipe.burnDifficulty)
            : Math.max(0, 1 - (Number.isFinite(recipe.burnChance) ? recipe.burnChance : 0.3));
        return Math.max(0, Math.min(1, 1 - successChance));
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

    function applyCookingAnimation(context) {
        if (window.SkillSharedAnimations && typeof SkillSharedAnimations.applyCookingStylePose === 'function') {
            SkillSharedAnimations.applyCookingStylePose(context);
        }
    }

    const cookingModule = {
        canStart(context) {
            if (!context || context.targetObj !== 'FIRE') return false;
            return !!getRecipeFromItemId(context, context.sourceItemId);
        },

        onUseItem(context) {
            const recipe = getRecipeFromItemId(context, context.sourceItemId);
            if (!recipe) return false;

            if (!(context.targetObj === 'GROUND' || context.targetObj === 'FIRE')) return false;

            const fireTarget = typeof context.resolveFireTargetFromHit === 'function'
                ? context.resolveFireTargetFromHit(context.hitData)
                : null;
            if (!fireTarget) {
                context.addChatMessage('You need an active fire to cook that.', 'warn');
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
                context.addChatMessage('You cannot cook that.', 'warn');
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
                return false;
            }

            if (!window.SkillActionResolution || typeof SkillActionResolution.startProcessingSession !== 'function') return false;

            const skillSpec = typeof context.getSkillSpec === 'function' ? context.getSkillSpec(SKILL_ID) : null;
            const actionTicks = skillSpec && skillSpec.timing && Number.isFinite(skillSpec.timing.actionTicks)
                ? skillSpec.timing.actionTicks
                : 1;

            SkillActionResolution.startProcessingSession(context, SKILL_ID, {
                recipeId: recipe.sourceItemId,
                target,
                intervalTicks: actionTicks,
                nextTick: context.currentTick + actionTicks
            });

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
            applyCookingAnimation(context);
        },

        getTooltip() {
            return '';
        }
    };

    window.SkillModules = window.SkillModules || {};
    window.SkillModules[SKILL_ID] = cookingModule;
})();
