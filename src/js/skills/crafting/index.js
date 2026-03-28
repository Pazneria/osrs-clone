(function () {
    const SKILL_ID = 'crafting';
    const FIRE_TARGET = 'FIRE';
    const INVENTORY_TARGET = 'INVENTORY';
    const WATER_TARGET = 'WATER';
    const DEFAULT_ACTION_TICKS = 3;
    const STRAPPED_HANDLE_TIER_RANKS = Object.freeze({
        wooden_handle_strapped: 0,
        oak_handle_strapped: 1,
        willow_handle_strapped: 2,
        maple_handle_strapped: 3,
        yew_handle_strapped: 4
    });

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

    function resolveRecipeById(context, recipeId) {
        if (!recipeId) return null;
        const set = getRecipeSet(context);
        if (!set || typeof set !== 'object') return null;
        const recipe = set[recipeId];
        if (!recipe || typeof recipe !== 'object') return null;
        return Object.assign({ recipeId }, recipe);
    }

    function normalizeInputAmount(amount) {
        return Number.isFinite(amount) ? Math.max(1, Math.floor(amount)) : 1;
    }

    function shouldConsumeInput(input) {
        return !(input && input.consume === false);
    }

    function buildMaterialRequirements(recipe, options = {}) {
        const inputs = Array.isArray(recipe && recipe.inputs) ? recipe.inputs : [];
        const requirementMap = Object.create(null);
        const orderedItemIds = [];
        const includeNonConsumed = options.includeNonConsumed !== false;

        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            const itemId = input && typeof input.itemId === 'string' ? input.itemId : null;
            if (!itemId) continue;
            if (!includeNonConsumed && !shouldConsumeInput(input)) continue;
            const needed = normalizeInputAmount(input.amount);
            if (!Object.prototype.hasOwnProperty.call(requirementMap, itemId)) {
                requirementMap[itemId] = 0;
                orderedItemIds.push(itemId);
            }
            requirementMap[itemId] += needed;
        }

        const requirements = [];
        for (let i = 0; i < orderedItemIds.length; i++) {
            const itemId = orderedItemIds[i];
            const needed = requirementMap[itemId];
            if (needed > 0) requirements.push({ itemId, amount: needed });
        }
        return requirements;
    }

    function hasMaterials(context, recipe) {
        const requirements = buildMaterialRequirements(recipe, { includeNonConsumed: true });
        for (let i = 0; i < requirements.length; i++) {
            const req = requirements[i];
            if ((context.getInventoryCount(req.itemId) || 0) < req.amount) return false;
        }
        return true;
    }

    function hasToolRequirements(context, recipe) {
        const tools = Array.isArray(recipe && recipe.requiredToolIds) ? recipe.requiredToolIds : [];
        for (let i = 0; i < tools.length; i++) {
            if (!context.hasItem(tools[i])) return false;
        }
        return true;
    }


    function hasUnlockRequirement(context, recipe) {
        const unlockFlag = typeof (recipe && recipe.requiredUnlockFlag) === 'string' ? recipe.requiredUnlockFlag : '';
        if (!unlockFlag) return true;
        if (typeof context.hasUnlockFlag !== 'function') return true;
        return context.hasUnlockFlag(unlockFlag);
    }
    function restoreMaterials(context, consumed) {
        if (!Array.isArray(consumed) || typeof context.giveItemById !== 'function') return;
        for (let i = 0; i < consumed.length; i++) {
            const entry = consumed[i];
            if (!entry || !entry.itemId || !Number.isFinite(entry.amount) || entry.amount <= 0) continue;
            context.giveItemById(entry.itemId, entry.amount);
        }
    }

    function removeMaterials(context, recipe) {
        const requirements = buildMaterialRequirements(recipe, { includeNonConsumed: false });
        for (let i = 0; i < requirements.length; i++) {
            const req = requirements[i];
            if ((context.getInventoryCount(req.itemId) || 0) < req.amount) return null;
        }

        const consumed = [];
        for (let i = 0; i < requirements.length; i++) {
            const req = requirements[i];
            const removed = context.removeItemsById(req.itemId, req.amount);
            if (removed < req.amount) {
                if (removed > 0) consumed.push({ itemId: req.itemId, amount: removed });
                restoreMaterials(context, consumed);
                return null;
            }
            consumed.push({ itemId: req.itemId, amount: req.amount });
        }

        return consumed;
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
            if (!input || !input.itemId || !shouldConsumeInput(input)) continue;
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

    function getImmediatePairRecipes(context) {
        const recipes = getAllRecipes(context);
        return recipes.filter((recipe) => {
            if (!recipe) return false;
            const inputs = Array.isArray(recipe.inputs) ? recipe.inputs : [];
            if (inputs.length !== 2) return false;
            if (recipe.stationType !== INVENTORY_TARGET) return false;
            const actionTicks = Number.isFinite(recipe.actionTicks) ? recipe.actionTicks : 1;
            return actionTicks <= 1;
        });
    }

    function getQueuedPairRecipes(context) {
        const recipes = getAllRecipes(context);
        return recipes.filter((recipe) => {
            if (!recipe) return false;
            const inputs = Array.isArray(recipe.inputs) ? recipe.inputs : [];
            if (inputs.length !== 2) return false;
            if (recipe.stationType !== INVENTORY_TARGET) return false;
            const actionTicks = Number.isFinite(recipe.actionTicks) ? Math.max(1, Math.floor(recipe.actionTicks)) : DEFAULT_ACTION_TICKS;
            return actionTicks > 1;
        });
    }

    function getQueuedToolInputRecipes(context) {
        const recipes = getAllRecipes(context);
        return recipes.filter((recipe) => {
            if (!recipe) return false;
            const inputs = Array.isArray(recipe.inputs) ? recipe.inputs : [];
            const tools = Array.isArray(recipe.requiredToolIds) ? recipe.requiredToolIds : [];
            if (inputs.length !== 1 || tools.length === 0) return false;
            if (recipe.stationType !== INVENTORY_TARGET) return false;
            const actionTicks = Number.isFinite(recipe.actionTicks) ? Math.max(1, Math.floor(recipe.actionTicks)) : DEFAULT_ACTION_TICKS;
            return actionTicks > 1;
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

    function isBaseHandleItemId(itemId) {
        return /_handle$/.test(String(itemId || '')) && !/_handle_strapped$/.test(String(itemId || ''));
    }

    function isStrappedHandleItemId(itemId) {
        return /_handle_strapped$/.test(String(itemId || ''));
    }

    function isLeatherItemId(itemId) {
        return /_leather$/.test(String(itemId || ''));
    }

    function isLogItemId(itemId) {
        const id = String(itemId || '');
        return id === 'logs' || /_logs$/.test(id);
    }

    function isCutGemItemId(itemId) {
        return /^cut_(ruby|sapphire|emerald|diamond)$/.test(String(itemId || ''));
    }

    function isPlainStaffItemId(itemId) {
        return /^plain_staff_(wood|oak|willow|maple|yew)$/.test(String(itemId || ''));
    }

    function isJewelryBaseItemId(itemId) {
        return /^(silver|gold)_(ring|amulet|tiara)$/.test(String(itemId || ''));
    }

    function getStrappedHandleTierRank(itemId) {
        if (!itemId || !Object.prototype.hasOwnProperty.call(STRAPPED_HANDLE_TIER_RANKS, itemId)) return null;
        return STRAPPED_HANDLE_TIER_RANKS[itemId];
    }

    function getToolWeaponAssemblyRecipes(context) {
        return getImmediatePairRecipes(context).filter((recipe) => recipe && recipe.recipeFamily === 'tool_weapon_assembly');
    }

    function getAssemblyPartInputId(recipe) {
        const inputs = Array.isArray(recipe && recipe.inputs) ? recipe.inputs : [];
        const partInput = inputs.find((input) => isMetalAssemblyPartItemId(input && input.itemId));
        return partInput && partInput.itemId ? partInput.itemId : null;
    }

    function getAssemblyHandleInputId(recipe) {
        const inputs = Array.isArray(recipe && recipe.inputs) ? recipe.inputs : [];
        const handleInput = inputs.find((input) => isStrappedHandleItemId(input && input.itemId));
        return handleInput && handleInput.itemId ? handleInput.itemId : null;
    }

    function buildOvertierAssemblyRecipe(context, partItemId, providedHandleItemId) {
        if (!partItemId || !providedHandleItemId) return null;

        const assemblyRecipes = getToolWeaponAssemblyRecipes(context);
        for (let i = 0; i < assemblyRecipes.length; i++) {
            const recipe = assemblyRecipes[i];
            if (getAssemblyPartInputId(recipe) !== partItemId) continue;

            const requiredHandleItemId = getAssemblyHandleInputId(recipe);
            if (!requiredHandleItemId || requiredHandleItemId === providedHandleItemId) return null;

            const requiredRank = getStrappedHandleTierRank(requiredHandleItemId);
            const providedRank = getStrappedHandleTierRank(providedHandleItemId);
            if (!Number.isFinite(requiredRank) || !Number.isFinite(providedRank) || providedRank <= requiredRank) {
                return null;
            }

            return Object.assign({}, recipe, {
                recipeId: `${recipe.recipeId}__overtier__${providedHandleItemId}`,
                inputs: recipe.inputs.map((input) => {
                    if (!input || input.itemId !== requiredHandleItemId) return input ? Object.assign({}, input) : input;
                    return Object.assign({}, input, { itemId: providedHandleItemId });
                }),
                overtierAssembly: {
                    baseRecipeId: recipe.recipeId,
                    requiredHandleItemId,
                    providedHandleItemId
                }
            });
        }

        return null;
    }

    function getSingleInputRecipesForStation(context, stationType) {
        const recipes = getAllRecipes(context);
        return recipes.filter((recipe) => {
            if (!recipe || recipe.stationType !== stationType) return false;
            const inputs = Array.isArray(recipe.inputs) ? recipe.inputs : [];
            return inputs.length === 1;
        });
    }

    function findSingleInputRecipe(context, stationType, sourceItemId) {
        if (!sourceItemId) return null;
        const recipes = getSingleInputRecipesForStation(context, stationType);
        for (let i = 0; i < recipes.length; i++) {
            const recipe = recipes[i];
            const inputItemId = recipe.inputs[0] && recipe.inputs[0].itemId;
            if (inputItemId === sourceItemId) return recipe;
        }
        return null;
    }

    function resolveInventoryPairRecipe(context) {
        const useData = resolveInventoryUseData(context);
        const sourceItemId = useData.sourceItemId;
        const targetItemId = useData.targetItemId;
        if (!sourceItemId || !targetItemId) return null;

        const immediateRecipes = getImmediatePairRecipes(context);
        for (let i = 0; i < immediateRecipes.length; i++) {
            const recipe = immediateRecipes[i];
            if (matchesInputPair(recipe, sourceItemId, targetItemId)) {
                return { recipe, recognized: true, message: '', mode: 'immediate', sourceItemId };
            }
        }

        const metalPartItemId = isMetalAssemblyPartItemId(sourceItemId)
            ? sourceItemId
            : (isMetalAssemblyPartItemId(targetItemId) ? targetItemId : null);
        const strappedHandleItemId = isStrappedHandleItemId(sourceItemId)
            ? sourceItemId
            : (isStrappedHandleItemId(targetItemId) ? targetItemId : null);
        if (metalPartItemId && strappedHandleItemId) {
            const overtierRecipe = buildOvertierAssemblyRecipe(context, metalPartItemId, strappedHandleItemId);
            if (overtierRecipe) {
                return { recipe: overtierRecipe, recognized: true, message: '', mode: 'immediate_confirm', sourceItemId };
            }
        }

        const queuedPairRecipes = getQueuedPairRecipes(context);
        for (let i = 0; i < queuedPairRecipes.length; i++) {
            const recipe = queuedPairRecipes[i];
            if (matchesInputPair(recipe, sourceItemId, targetItemId)) {
                return { recipe, recognized: true, message: '', mode: 'queued', sourceItemId };
            }
        }

        const queuedToolInputRecipes = getQueuedToolInputRecipes(context);
        for (let i = 0; i < queuedToolInputRecipes.length; i++) {
            const recipe = queuedToolInputRecipes[i];
            const inputItemId = recipe.inputs[0] && recipe.inputs[0].itemId;
            const requiredTools = Array.isArray(recipe.requiredToolIds) ? recipe.requiredToolIds : [];
            if (!inputItemId || requiredTools.length === 0) continue;

            const sourceIsTool = requiredTools.includes(sourceItemId) && targetItemId === inputItemId;
            const targetIsTool = requiredTools.includes(targetItemId) && sourceItemId === inputItemId;
            if (sourceIsTool || targetIsTool) {
                const activeSourceItemId = sourceIsTool ? sourceItemId : targetItemId;
                return { recipe, recognized: true, message: '', mode: 'queued', sourceItemId: activeSourceItemId };
            }
        }

        const handleAndLeather = (isBaseHandleItemId(sourceItemId) && isLeatherItemId(targetItemId))
            || (isBaseHandleItemId(targetItemId) && isLeatherItemId(sourceItemId));
        if (handleAndLeather) {
            return { recipe: null, recognized: true, message: "These don't match.", mode: 'none', sourceItemId };
        }

        const metalAndBaseHandle = (isMetalAssemblyPartItemId(sourceItemId) && isBaseHandleItemId(targetItemId))
            || (isMetalAssemblyPartItemId(targetItemId) && isBaseHandleItemId(sourceItemId));
        if (metalAndBaseHandle) {
            return { recipe: null, recognized: true, message: 'You need a strapped handle for that.', mode: 'none', sourceItemId };
        }

        const metalAndLog = (isMetalAssemblyPartItemId(sourceItemId) && isLogItemId(targetItemId))
            || (isMetalAssemblyPartItemId(targetItemId) && isLogItemId(sourceItemId));
        if (metalAndLog) {
            return { recipe: null, recognized: true, message: 'You need a strapped handle for that.', mode: 'none', sourceItemId };
        }

        const metalAndStrappedHandle = (isMetalAssemblyPartItemId(sourceItemId) && isStrappedHandleItemId(targetItemId))
            || (isMetalAssemblyPartItemId(targetItemId) && isStrappedHandleItemId(sourceItemId));
        if (metalAndStrappedHandle) {
            return { recipe: null, recognized: true, message: "These don't match.", mode: 'none', sourceItemId };
        }

        const staffAndGem = (isPlainStaffItemId(sourceItemId) && isCutGemItemId(targetItemId))
            || (isPlainStaffItemId(targetItemId) && isCutGemItemId(sourceItemId));
        if (staffAndGem) {
            return { recipe: null, recognized: true, message: "These don't match.", mode: 'none', sourceItemId };
        }

        const jewelryAndGem = (isJewelryBaseItemId(sourceItemId) && isCutGemItemId(targetItemId))
            || (isJewelryBaseItemId(targetItemId) && isCutGemItemId(sourceItemId));
        if (jewelryAndGem) {
            return { recipe: null, recognized: true, message: "These don't match.", mode: 'none', sourceItemId };
        }

        return null;
    }

    function resolveWorldTargetRecipe(context) {
        if (!context || !context.sourceItemId) return null;

        if (context.targetObj === WATER_TARGET) {
            const recipe = findSingleInputRecipe(context, WATER_TARGET, context.sourceItemId);
            if (!recipe) return null;
            return { recipe, recognized: true, mode: 'immediate' };
        }

        if (!(context.targetObj === 'GROUND' || context.targetObj === FIRE_TARGET)) return null;
        const recipe = findSingleInputRecipe(context, FIRE_TARGET, context.sourceItemId);
        if (!recipe) return null;

        const fireTarget = typeof context.resolveFireTargetFromHit === 'function'
            ? context.resolveFireTargetFromHit(context.hitData)
            : null;
        if (!fireTarget) {
            return {
                recipe,
                recognized: true,
                mode: 'blocked',
                message: 'You need an active fire to finish that mould.'
            };
        }

        return {
            recipe,
            recognized: true,
            mode: 'queued_fire',
            fireTarget
        };
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

    function buildImmediateCraftMessage(context, recipe, outItemId) {
        if (recipe && recipe.recipeFamily === 'soft_clay') return 'You soften the clay.';
        if (recipe && recipe.recipeFamily === 'mould_imprint') return 'You press the borrowed piece into the clay.';
        return `You assemble the ${getItemName(context, outItemId)}.`;
    }

    function requestConfirmation(context, message) {
        if (context && typeof context.confirmAction === 'function') return !!context.confirmAction(message);
        if (typeof window.confirm === 'function') return !!window.confirm(message);
        return false;
    }

    function buildOvertierAssemblyConfirmationMessage(context, recipe) {
        const meta = recipe && recipe.overtierAssembly ? recipe.overtierAssembly : null;
        if (!meta) return '';
        const handleName = getItemName(context, meta.providedHandleItemId);
        const outputItemId = recipe.output && recipe.output.itemId ? recipe.output.itemId : null;
        const outputName = getItemName(context, outputItemId);
        return `Use ${handleName} to assemble ${outputName}? This makes the normal ${outputName} with no stat bonus, and you cannot disassemble it later.`;
    }

    function confirmImmediateCraft(context, recipe) {
        if (!(recipe && recipe.overtierAssembly)) return true;
        const message = buildOvertierAssemblyConfirmationMessage(context, recipe);
        if (requestConfirmation(context, message)) return true;
        context.addChatMessage('You decide not to assemble that with the higher-tier handle.', 'info');
        return false;
    }

    function validateFireTargetRuntime(context, target) {
        if (!target) {
            return { ok: false, reasonCode: 'TARGET_MISSING', message: 'You need an active fire to continue.' };
        }

        if (typeof context.hasActiveFireAt === 'function' && !context.hasActiveFireAt(target.x, target.y, target.z)) {
            return { ok: false, reasonCode: 'FIRE_GONE', message: 'The fire has gone out.' };
        }

        const dx = Math.abs(target.x - context.playerState.x);
        const dy = Math.abs(target.y - context.playerState.y);
        if (target.z !== context.playerState.z || dx > 1 || dy > 1) {
            return { ok: false, reasonCode: 'MOVED_AWAY', message: 'You move away from the fire.' };
        }

        return { ok: true };
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

        if (!hasToolRequirements(context, recipe)) {
            context.addChatMessage('You need the required crafting tool.', 'warn');
            return false;
        }

        if (!hasUnlockRequirement(context, recipe)) {
            context.addChatMessage('You have not unlocked that mould yet.', 'warn');
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

    function validateQueuedCraftStart(context, recipe) {
        if (!recipe) {
            context.addChatMessage('You cannot craft that right now.', 'warn');
            return false;
        }

        if (typeof context.requireSkillLevel === 'function'
            && !context.requireSkillLevel(recipe.requiredLevel || 1, { skillId: SKILL_ID, action: 'craft that recipe' })) {
            return false;
        }

        if (!hasToolRequirements(context, recipe)) {
            context.addChatMessage('You need the required crafting tool.', 'warn');
            return false;
        }

        if (!hasUnlockRequirement(context, recipe)) {
            context.addChatMessage('You have not unlocked that mould yet.', 'warn');
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

    function validateQueuedCraftRuntime(context, recipe) {
        if (!recipe) return { ok: false, reasonCode: 'RECIPE_MISSING', message: 'Crafting recipe is missing.' };

        const requiredLevel = Number.isFinite(recipe.requiredLevel) ? Math.max(1, Math.floor(recipe.requiredLevel)) : 1;
        const level = typeof context.getSkillLevel === 'function' ? context.getSkillLevel(SKILL_ID) : 1;
        if (level < requiredLevel) {
            return { ok: false, reasonCode: 'LEVEL_LOW', message: 'You need a higher Crafting level to continue.' };
        }

        if (!hasToolRequirements(context, recipe)) {
            return { ok: false, reasonCode: 'MISSING_TOOL', message: 'You need the required crafting tool.' };
        }

        if (!hasUnlockRequirement(context, recipe)) {
            return { ok: false, reasonCode: 'MISSING_UNLOCK', message: 'You have not unlocked that mould yet.' };
        }

        if (!hasMaterials(context, recipe)) {
            return { ok: false, reasonCode: 'INPUT_EMPTY', message: 'You run out of crafting materials.' };
        }

        if (!hasOutputCapacity(context, recipe)) {
            return { ok: false, reasonCode: 'INVENTORY_FULL', message: 'You have no inventory space for that crafted output.' };
        }

        return { ok: true };
    }

    function resolveActionTicks(context, recipe) {
        if (Number.isFinite(recipe && recipe.actionTicks)) return Math.max(1, Math.floor(recipe.actionTicks));
        const skillSpec = typeof context.getSkillSpec === 'function' ? context.getSkillSpec(SKILL_ID) : null;
        if (skillSpec && skillSpec.timing && Number.isFinite(skillSpec.timing.actionTicks)) {
            return Math.max(1, Math.floor(skillSpec.timing.actionTicks));
        }
        return DEFAULT_ACTION_TICKS;
    }

    function craftOneImmediate(context, recipe) {
        const consumed = removeMaterials(context, recipe);
        if (!consumed) {
            context.addChatMessage('You do not have the required materials.', 'warn');
            return false;
        }

        const outAmount = Number.isFinite(recipe.output && recipe.output.amount) ? Math.max(1, Math.floor(recipe.output.amount)) : 1;
        const outItemId = recipe.output && recipe.output.itemId ? recipe.output.itemId : null;
        if (!outItemId) {
            restoreMaterials(context, consumed);
            context.addChatMessage('Crafting output is missing.', 'warn');
            return false;
        }

        const given = context.giveItemById(outItemId, outAmount);
        if (given < outAmount) {
            if (given > 0 && typeof context.removeItemsById === 'function') {
                context.removeItemsById(outItemId, given);
            }
            restoreMaterials(context, consumed);
            context.addChatMessage('You have no inventory space for that crafted output.', 'warn');
            return false;
        }

        const xp = Number.isFinite(recipe.xpPerAction) ? recipe.xpPerAction : 0;
        if (xp > 0) context.addSkillXp(SKILL_ID, xp);
        if (typeof context.renderInventory === 'function') context.renderInventory();

        context.addChatMessage(buildImmediateCraftMessage(context, recipe, outItemId), 'game');
        return true;
    }

    function craftOneQueued(context, recipe) {
        const consumed = removeMaterials(context, recipe);
        if (!consumed) {
            return SkillActionResolution.createActionResolution('stopped', 'INPUT_EMPTY');
        }

        const outAmount = Number.isFinite(recipe.output && recipe.output.amount) ? Math.max(1, Math.floor(recipe.output.amount)) : 1;
        const outItemId = recipe.output && recipe.output.itemId ? recipe.output.itemId : null;
        if (!outItemId) {
            restoreMaterials(context, consumed);
            return SkillActionResolution.createActionResolution('stopped', 'OUTPUT_MISSING');
        }

        const given = context.giveItemById(outItemId, outAmount);
        if (given < outAmount) {
            if (given > 0 && typeof context.removeItemsById === 'function') {
                context.removeItemsById(outItemId, given);
            }
            restoreMaterials(context, consumed);
            return SkillActionResolution.createActionResolution('stopped', 'INVENTORY_FULL');
        }

        const xp = Number.isFinite(recipe.xpPerAction) ? recipe.xpPerAction : 0;
        if (xp > 0) context.addSkillXp(SKILL_ID, xp);
        if (typeof context.renderInventory === 'function') context.renderInventory();

        return SkillActionResolution.createActionResolution('success', 'CRAFT_SUCCESS', {
            consumed,
            produced: [{ itemId: outItemId, amount: outAmount }],
            xpGained: xp
        });
    }

    function startQueuedCrafting(context, recipe, quantityMode, quantityCount, sourceItemId) {
        if (!context || !recipe) return false;
        if (!validateQueuedCraftStart(context, recipe)) return true;

        const normalizedMode = (typeof quantityMode === 'string' && quantityMode) ? quantityMode : 'all';
        const normalizedCount = Number.isFinite(quantityCount) ? Math.max(1, Math.floor(quantityCount)) : null;

        if (window.SkillRuntime && typeof window.SkillRuntime.tryStartSkillById === 'function') {
            const started = window.SkillRuntime.tryStartSkillById(SKILL_ID, {
                skillId: SKILL_ID,
                targetObj: INVENTORY_TARGET,
                recipeId: recipe.recipeId,
                sourceItemId: typeof sourceItemId === 'string' ? sourceItemId : null,
                quantityMode: normalizedMode,
                quantityCount: normalizedCount,
                targetX: context.playerState.x,
                targetY: context.playerState.y,
                targetZ: context.playerState.z
            });

            if (!started) {
                context.addChatMessage('You cannot start crafting right now.', 'warn');
            }
            return true;
        }

        context.addChatMessage('You cannot start crafting right now.', 'warn');
        return true;
    }

    function queueFireCrafting(context, recipe, fireTarget) {
        if (!context || !recipe || !fireTarget) return false;
        if (!validateQueuedCraftStart(context, recipe)) return true;

        context.playerState.pendingSkillStart = {
            skillId: SKILL_ID,
            targetObj: FIRE_TARGET,
            targetX: fireTarget.x,
            targetY: fireTarget.y,
            targetZ: fireTarget.z,
            sourceInvIndex: Number.isInteger(context.sourceInvIndex) ? context.sourceInvIndex : null,
            sourceItemId: context.sourceItemId,
            recipeId: recipe.recipeId,
            quantityMode: 'all'
        };

        if (typeof context.queueInteractAt === 'function') {
            context.queueInteractAt(FIRE_TARGET, fireTarget.x, fireTarget.y, {
                skillId: SKILL_ID,
                recipeId: recipe.recipeId,
                quantityMode: 'all'
            });
        } else if (typeof context.queueInteract === 'function') {
            context.queueInteract();
        }

        return true;
    }

    const craftingModule = {
        canStart(context) {
            if (!context) return false;
            return !!context.recipeId && (context.targetObj === INVENTORY_TARGET || context.targetObj === FIRE_TARGET);
        },

        onUseItem(context) {
            if (!context) return false;

            if (context.targetObj === INVENTORY_TARGET) {
                const pairUse = resolveInventoryPairRecipe(context);
                if (!pairUse || !pairUse.recognized) return false;

                if (pairUse.recipe) {
                    if (pairUse.mode === 'immediate' || pairUse.mode === 'immediate_confirm') {
                        if (!validateImmediateCraft(context, pairUse.recipe)) return true;
                        if (!confirmImmediateCraft(context, pairUse.recipe)) return true;
                        craftOneImmediate(context, pairUse.recipe);
                        return true;
                    }

                    return startQueuedCrafting(context, pairUse.recipe, 'all', null, pairUse.sourceItemId);
                }

                if (pairUse.message) context.addChatMessage(pairUse.message, 'warn');
                return true;
            }

            const worldUse = resolveWorldTargetRecipe(context);
            if (!worldUse || !worldUse.recognized) return false;
            if (worldUse.mode === 'blocked') {
                if (worldUse.message) context.addChatMessage(worldUse.message, 'warn');
                return true;
            }
            if (worldUse.mode === 'immediate') {
                if (!validateImmediateCraft(context, worldUse.recipe)) return true;
                craftOneImmediate(context, worldUse.recipe);
                return true;
            }
            if (worldUse.mode === 'queued_fire') {
                return queueFireCrafting(context, worldUse.recipe, worldUse.fireTarget);
            }

            return false;
        },

        onStart(context) {
            const recipe = resolveRecipeById(context, context.recipeId);
            if (!validateQueuedCraftStart(context, recipe)) return false;

            const target = recipe && recipe.stationType === FIRE_TARGET
                ? { x: context.targetX, y: context.targetY, z: context.targetZ }
                : null;
            if (target) {
                const fireValidation = validateFireTargetRuntime(context, target);
                if (!fireValidation.ok) {
                    if (fireValidation.message) context.addChatMessage(fireValidation.message, 'warn');
                    return false;
                }
            }

            const quantityMode = (typeof context.quantityMode === 'string' && context.quantityMode) ? context.quantityMode : 'all';
            const quantityCount = Number.isFinite(context.quantityCount) ? Math.max(1, Math.floor(context.quantityCount)) : null;
            const actionTicks = resolveActionTicks(context, recipe);

            SkillActionResolution.startProcessingSession(context, SKILL_ID, {
                recipeId: recipe.recipeId,
                target,
                quantityMode,
                quantityRemaining: quantityMode === 'count' ? quantityCount : null,
                intervalTicks: actionTicks,
                nextTick: context.currentTick + actionTicks
            });

            context.playerState.action = 'SKILLING: CRAFTING';
            context.addChatMessage(target ? 'You begin firing the mould.' : 'You begin crafting.', 'info');
            return true;
        },

        onTick(context) {
            if (context.playerState.action !== 'SKILLING: CRAFTING') return;

            if (!window.SkillActionResolution || typeof SkillActionResolution.tickProcessingSession !== 'function') {
                context.stopAction();
                return;
            }

            SkillActionResolution.tickProcessingSession(context, SKILL_ID, (session) => {
                const recipe = resolveRecipeById(context, session.recipeId);
                if (recipe && recipe.stationType === FIRE_TARGET) {
                    const fireValidation = validateFireTargetRuntime(context, session.target);
                    if (!fireValidation.ok) {
                        if (fireValidation.message) context.addChatMessage(fireValidation.message, 'warn');
                        if (typeof context.renderInventory === 'function') context.renderInventory();
                        return SkillActionResolution.stopSkill(context, SKILL_ID, fireValidation.reasonCode || 'FIRE_INVALID');
                    }
                }

                const validation = validateQueuedCraftRuntime(context, recipe);
                if (!validation.ok) {
                    if (validation.message) context.addChatMessage(validation.message, validation.reasonCode === 'INPUT_EMPTY' ? 'info' : 'warn');
                    if (typeof context.renderInventory === 'function') context.renderInventory();
                    return SkillActionResolution.stopSkill(context, SKILL_ID, validation.reasonCode);
                }

                const resolution = craftOneQueued(context, recipe);
                if (resolution.status !== 'success') {
                    if (resolution.reasonCode === 'INPUT_EMPTY') {
                        context.addChatMessage('You run out of crafting materials.', 'info');
                    } else if (resolution.reasonCode === 'INVENTORY_FULL') {
                        context.addChatMessage('You have no inventory space for that crafted output.', 'warn');
                    }
                    return SkillActionResolution.stopSkill(context, SKILL_ID, resolution.reasonCode || 'FAILED');
                }

                if (Number.isFinite(session.quantityRemaining)) {
                    session.quantityRemaining = Math.max(0, session.quantityRemaining - 1);
                    if (session.quantityRemaining <= 0) {
                        return SkillActionResolution.stopSkill(context, SKILL_ID, 'QUANTITY_COMPLETE');
                    }
                }

                const canContinue = validateQueuedCraftRuntime(context, recipe);
                if (!canContinue.ok) {
                    if (canContinue.message && canContinue.reasonCode !== 'INPUT_EMPTY') {
                        context.addChatMessage(canContinue.message, 'info');
                    }
                    return SkillActionResolution.stopSkill(context, SKILL_ID, canContinue.reasonCode);
                }
                if (recipe && recipe.stationType === FIRE_TARGET) {
                    const continueFire = validateFireTargetRuntime(context, session.target);
                    if (!continueFire.ok) {
                        if (continueFire.message) context.addChatMessage(continueFire.message, 'warn');
                        return SkillActionResolution.stopSkill(context, SKILL_ID, continueFire.reasonCode || 'FIRE_INVALID');
                    }
                }

                session.nextTick = context.currentTick + (session.intervalTicks || DEFAULT_ACTION_TICKS);
                return resolution;
            });
        },

        onAnimate(context) {
            return false;
        },

        getAnimationSuppressEquipmentVisual() {
            return true;
        }
    };

    window.SkillModules = window.SkillModules || {};
    window.SkillModules[SKILL_ID] = craftingModule;
})();


