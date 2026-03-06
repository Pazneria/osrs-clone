(function () {
    const SKILL_ID = 'cooking';
    const COOKING_XP = 30;

    function getRecipeFromItemId(itemId) {
        if (!itemId) return null;

        const db = (typeof ITEM_DB !== 'undefined' && ITEM_DB)
            ? ITEM_DB
            : (typeof window !== 'undefined' ? window.ITEM_DB : null);
        if (!db) return null;

        const item = db[itemId];
        if (!item || !item.cookResultId || !item.burnResultId) return null;
        return {
            sourceItemId: itemId,
            cookedItemId: item.cookResultId,
            burntItemId: item.burnResultId,
            burnChance: Number.isFinite(item.burnChance) ? item.burnChance : 0.3
        };
    }

    function cookOne(context, recipe) {
        if (!context.removeOneItemById(recipe.sourceItemId)) return false;

        const rollChance = window.SkillSharedUtils && typeof SkillSharedUtils.rollChance === 'function'
            ? SkillSharedUtils.rollChance
            : ((chance, rng) => (typeof rng === 'function' ? rng() : Math.random()) < chance);

        const burned = rollChance(recipe.burnChance, context.random);
        if (burned) {
            context.giveItemById(recipe.burntItemId, 1);
            context.addChatMessage('You accidentally burn the food.', 'warn');
            return true;
        }

        if (context.giveItemById(recipe.cookedItemId, 1) > 0) {
            context.addSkillXp(SKILL_ID, COOKING_XP);
            context.addChatMessage('You cook the food.', 'game');
            return true;
        }

        context.addChatMessage('You have no inventory space for the cooked food.', 'warn');
        return false;
    }

    function applyFishingAnimation(context) {
        const fishing = window.SkillModules && window.SkillModules.fishing;
        if (fishing && typeof fishing.onAnimate === 'function') {
            fishing.onAnimate(context);
            return;
        }

        // Fallback if fishing module is unavailable.
        if (!context.rig || !context.playerRig || typeof context.setShoulderPivot !== 'function') return;
        const rig = context.rig;
        context.setShoulderPivot(rig);
        rig.axe.visible = false;
        context.playerRig.rotation.x = 0;
        rig.leftArm.rotation.set(-0.55, 0.1, 0.08);
        rig.rightArm.rotation.set(-0.65, -0.1, -0.08);
        rig.leftLowerArm.rotation.set(-0.45, 0, 0);
        rig.rightLowerArm.rotation.set(-0.45, 0, 0);
    }

    const cookingModule = {
        canStart(context) {
            if (!context || context.targetObj !== 'FIRE') {
                if (window.DEBUG_COOKING_USE && context && typeof context.addChatMessage === 'function') {
                    context.addChatMessage('[cook-debug] canStart failed: target is not FIRE', 'info');
                }
                return false;
            }

            const recipe = getRecipeFromItemId(context.sourceItemId);
            if (!recipe && window.DEBUG_COOKING_USE && context && typeof context.addChatMessage === 'function') {
                context.addChatMessage('[cook-debug] canStart failed: no recipe for ' + (context.sourceItemId || 'null'), 'info');
            }
            return !!recipe;
        },

        onStart(context) {
            const recipe = getRecipeFromItemId(context.sourceItemId);
            if (!recipe) {
                context.addChatMessage('You cannot cook that.', 'warn');
                return false;
            }

            if (context.getInventoryCount(recipe.sourceItemId) <= 0) {
                context.addChatMessage('You do not have anything to cook.', 'warn');
                return false;
            }

            context.playerState.cookingSourceItemId = recipe.sourceItemId;
            context.playerState.cookingTarget = { x: context.targetX, y: context.targetY, z: context.targetZ };
            context.startSkillingAction();
            context.playerState.actionUntilTick = context.currentTick + 1;
            return true;
        },

        onTick(context) {
            if (context.playerState.action !== 'SKILLING: FIRE') return;
            const sourceItemId = context.playerState.cookingSourceItemId;
            const recipe = getRecipeFromItemId(sourceItemId);
            if (!recipe) {
                context.playerState.cookingSourceItemId = null;
                context.playerState.cookingTarget = null;
                context.stopAction();
                return;
            }

            if (context.currentTick < context.playerState.actionUntilTick) return;

            const target = context.playerState.cookingTarget || { x: context.targetX, y: context.targetY, z: context.targetZ };
            const hasFire = Array.isArray(activeFires) && activeFires.some((f) => f.x === target.x && f.y === target.y && f.z === target.z);
            if (!hasFire) {
                context.addChatMessage('The fire has gone out.', 'warn');
                context.playerState.cookingSourceItemId = null;
                context.playerState.cookingTarget = null;
                context.stopAction();
                context.renderInventory();
                return;
            }

            if (context.getInventoryCount(recipe.sourceItemId) <= 0) {
                context.playerState.cookingSourceItemId = null;
                context.playerState.cookingTarget = null;
                context.stopAction();
                context.renderInventory();
                return;
            }

            cookOne(context, recipe);
            context.playerState.actionUntilTick = context.currentTick + 1;
            context.renderInventory();

            if (context.getInventoryCount(recipe.sourceItemId) <= 0) {
                context.playerState.cookingSourceItemId = null;
                context.playerState.cookingTarget = null;
                context.stopAction();
            }
        },

        onAnimate(context) {
            applyFishingAnimation(context);
        },

        getTooltip() {
            // Cooking should be item-driven (Use item -> Fire), not a passive fire hover action.
            return '';
        }
    };

    window.SkillModules = window.SkillModules || {};
    window.SkillModules[SKILL_ID] = cookingModule;
})();




