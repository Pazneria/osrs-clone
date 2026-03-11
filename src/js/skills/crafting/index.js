(function () {
    const SKILL_ID = 'crafting';
    const INVENTORY_TARGET = 'INVENTORY';

    function getRecipeSet(context) {
        return typeof context.getRecipeSet === 'function' ? context.getRecipeSet(SKILL_ID) : null;
    }

    function getAllRecipes(context) {
        const set = getRecipeSet(context);
        if (!set || typeof set !== 'object') return [];
        const ids = Object.keys(set);
        const out = [];
        for (let i = 0; i < ids.length; i++) {
            const recipeId = ids[i];
            const recipe = set[recipeId];
            if (!recipe || typeof recipe !== 'object') continue;
            out.push(Object.assign({ recipeId }, recipe));
        }
        return out;
    }

    function hasMaterials(context, recipe) {
        const inputs = Array.isArray(recipe && recipe.inputs) ? recipe.inputs : [];
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            const needed = Number.isFinite(input.amount) ? Math.max(1, Math.floor(input.amount)) : 1;
            if ((context.getInventoryCount(input.itemId) || 0) < needed) return false;
        }
        return true;
    }

    function removeMaterials(context, recipe) {
        const inputs = Array.isArray(recipe && recipe.inputs) ? recipe.inputs : [];
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            const needed = Number.isFinite(input.amount) ? Math.max(1, Math.floor(input.amount)) : 1;
            if ((context.getInventoryCount(input.itemId) || 0) < needed) return false;
        }

        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            const needed = Number.isFinite(input.amount) ? Math.max(1, Math.floor(input.amount)) : 1;
            const removed = context.removeItemsById(input.itemId, needed);
            if (removed < needed) return false;
        }

        return true;
    }

    function cloneInventorySlots(context) {
        if (!context || typeof context.getInventorySlotsSnapshot !== 'function') return null;
        const slots = context.getInventorySlotsSnapshot();
        if (!Array.isArray(slots)) return null;
        return slots.map((slot) => {
            if (!slot) return null;
            return {
                itemId: slot.itemId,
                amount: Number.isFinite(slot.amount) ? Math.max(0, Math.floor(slot.amount)) : 0,
                stackable: !!slot.stackable
            };
        });
    }

    function consumeFromSlots(slots, itemId, amount) {
        let remaining = Number.isFinite(amount) ? Math.max(1, Math.floor(amount)) : 1;
        for (let i = 0; i < slots.length && remaining > 0; i++) {
            const slot = slots[i];
            if (!slot || slot.itemId !== itemId) continue;
            const take = Math.min(slot.amount, remaining);
            slot.amount -= take;
            remaining -= take;
            if (slot.amount <= 0) slots[i] = null;
        }
        return remaining <= 0;
    }

    function countEmptySlots(slots) {
        let empty = 0;
        for (let i = 0; i < slots.length; i++) {
            if (!slots[i]) empty++;
        }
        return empty;
    }

    function hasOutputCapacity(context, recipe) {
        if (!recipe || !recipe.output || !recipe.output.itemId) return false;

        const outItemId = recipe.output.itemId;
        const outAmount = Number.isFinite(recipe.output.amount) ? Math.max(1, Math.floor(recipe.output.amount)) : 1;
        const slots = cloneInventorySlots(context);

        if (!slots) {
            if (typeof context.canAcceptItemById !== 'function') return true;
            return context.canAcceptItemById(outItemId, outAmount);
        }

        const inputs = Array.isArray(recipe.inputs) ? recipe.inputs : [];
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            if (!input || !input.itemId) continue;
            const needed = Number.isFinite(input.amount) ? Math.max(1, Math.floor(input.amount)) : 1;
            if (!consumeFromSlots(slots, input.itemId, needed)) return false;
        }

        const outItem = typeof context.getItemDataById === 'function' ? context.getItemDataById(outItemId) : null;
        const isStackable = !!(outItem && outItem.stackable);

        if (isStackable) {
            for (let i = 0; i < slots.length; i++) {
                const slot = slots[i];
                if (slot && slot.itemId === outItemId) return true;
            }
            return countEmptySlots(slots) > 0;
        }

        return countEmptySlots(slots) >= outAmount;
    }

    function resolveInventoryUseData(context) {
        const targetUid = context && typeof context.targetUid === 'object' ? context.targetUid : null;
        const sourceItemId = typeof context.sourceItemId === 'string'
            ? context.sourceItemId
            : (targetUid && typeof targetUid.sourceItemId === 'string' ? targetUid.sourceItemId : null);
        const targetItemId = targetUid && typeof targetUid.targetItemId === 'string' ? targetUid.targetItemId : null;
        return { sourceItemId, targetItemId };
    }

    function getAssemblyRecipes(context) {
        const recipes = getAllRecipes(context);
        return recipes.filter((recipe) => {
            if (!recipe || recipe.recipeFamily !== 'tool_weapon_assembly') return false;
            const inputs = Array.isArray(recipe.inputs) ? recipe.inputs : [];
            return inputs.length === 2;
        });
    }

    function matchesInputPair(recipe, itemA, itemB) {
        const inputs = Array.isArray(recipe && recipe.inputs) ? recipe.inputs : [];
        if (inputs.length !== 2) return false;
        const first = inputs[0] && inputs[0].itemId;
        const second = inputs[1] && inputs[1].itemId;
        return (first === itemA && second === itemB) || (first === itemB && second === itemA);
    }

    function isMetalAssemblyPartItemId(itemId) {
        return /_(sword_blade|axe_head|pickaxe_head)$/.test(String(itemId || ''));
    }

    function isHandleItemId(itemId) {
        return /_handle$/.test(String(itemId || ''));
    }

    function isLogItemId(itemId) {
        const id = String(itemId || '');
        return id === 'logs' || /_logs$/.test(id);
    }

    function resolveInventoryPairRecipe(context) {
        const useData = resolveInventoryUseData(context);
        const sourceItemId = useData.sourceItemId;
        const targetItemId = useData.targetItemId;
        if (!sourceItemId || !targetItemId) return null;

        const recipes = getAssemblyRecipes(context);
        for (let i = 0; i < recipes.length; i++) {
            const recipe = recipes[i];
            if (matchesInputPair(recipe, sourceItemId, targetItemId)) {
                return { recipe, recognized: true, message: '' };
            }
        }

        const metalAndHandle = (isMetalAssemblyPartItemId(sourceItemId) && isHandleItemId(targetItemId))
            || (isMetalAssemblyPartItemId(targetItemId) && isHandleItemId(sourceItemId));
        if (metalAndHandle) {
            return { recipe: null, recognized: true, message: "These don't match." };
        }

        const metalAndLog = (isMetalAssemblyPartItemId(sourceItemId) && isLogItemId(targetItemId))
            || (isMetalAssemblyPartItemId(targetItemId) && isLogItemId(sourceItemId));
        if (metalAndLog) {
            return { recipe: null, recognized: true, message: 'You need a fletched handle for that.' };
        }

        return null;
    }

    function humanizeId(itemId) {
        return String(itemId || '').replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
    }

    function getItemName(context, itemId) {
        if (!itemId) return 'Unknown item';
        const item = (typeof context.getItemDataById === 'function' ? context.getItemDataById(itemId) : null)
            || (window.ITEM_DB && window.ITEM_DB[itemId] ? window.ITEM_DB[itemId] : null);
        return item && item.name ? item.name : humanizeId(itemId);
    }

    function validateImmediateCraft(context, recipe) {
        if (!recipe) {
            context.addChatMessage("These don't match.", 'warn');
            return false;
        }

        if (typeof context.requireSkillLevel === 'function'
            && !context.requireSkillLevel(recipe.requiredLevel || 1, { skillId: SKILL_ID, action: 'assemble that item' })) {
            return false;
        }

        if (!hasMaterials(context, recipe)) {
            context.addChatMessage('You do not have the required materials.', 'warn');
            return false;
        }

        if (!hasOutputCapacity(context, recipe)) {
            context.addChatMessage('You have no inventory space for that crafted output.', 'warn');
            return false;
        }

        return true;
    }

    function craftOne(context, recipe) {
        if (!removeMaterials(context, recipe)) {
            context.addChatMessage('You do not have the required materials.', 'warn');
            return false;
        }

        const outAmount = Number.isFinite(recipe.output && recipe.output.amount) ? Math.max(1, Math.floor(recipe.output.amount)) : 1;
        const outItemId = recipe.output && recipe.output.itemId ? recipe.output.itemId : null;
        if (!outItemId) {
            context.addChatMessage('Crafting output is missing.', 'warn');
            return false;
        }

        const given = context.giveItemById(outItemId, outAmount);
        if (given < outAmount) {
            context.addChatMessage('You have no inventory space for that crafted output.', 'warn');
            return false;
        }

        const xp = Number.isFinite(recipe.xpPerAction) ? recipe.xpPerAction : 0;
        if (xp > 0) context.addSkillXp(SKILL_ID, xp);
        if (typeof context.renderInventory === 'function') context.renderInventory();

        context.addChatMessage(`You assemble the ${getItemName(context, outItemId)}.`, 'game');
        return true;
    }

    const craftingModule = {
        onUseItem(context) {
            if (!context || context.targetObj !== INVENTORY_TARGET) return false;

            const pairUse = resolveInventoryPairRecipe(context);
            if (!pairUse || !pairUse.recognized) return false;

            if (pairUse.recipe) {
                if (!validateImmediateCraft(context, pairUse.recipe)) return true;
                craftOne(context, pairUse.recipe);
                return true;
            }

            if (pairUse.message) context.addChatMessage(pairUse.message, 'warn');
            return true;
        }
    };

    window.SkillModules = window.SkillModules || {};
    window.SkillModules[SKILL_ID] = craftingModule;
})();
