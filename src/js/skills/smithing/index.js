(function () {
    const SKILL_ID = 'smithing';
    const STATION_FURNACE = 'FURNACE';
    const STATION_ANVIL = 'ANVIL';
    const TIER_ORDER = {
        FURNACE: ['bronze', 'iron', 'steel', 'mithril', 'silver', 'adamant', 'gold', 'rune'],
        ANVIL: ['bronze', 'iron', 'steel', 'mithril', 'adamant', 'rune']
    };

    function getRecipeSet(context) {
        return typeof context.getRecipeSet === 'function' ? context.getRecipeSet(SKILL_ID) : null;
    }

    function getAllRecipes(context) {
        const set = getRecipeSet(context);
        if (!set || typeof set !== 'object') return [];
        const ids = Object.keys(set);
        const out = [];
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            const recipe = set[id];
            if (!recipe || typeof recipe !== 'object') continue;
            out.push(Object.assign({ recipeId: id }, recipe));
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

    function restoreMaterials(context, consumed) {
        if (!Array.isArray(consumed) || typeof context.giveItemById !== 'function') return;
        for (let i = 0; i < consumed.length; i++) {
            const entry = consumed[i];
            if (!entry || !entry.itemId || !Number.isFinite(entry.amount) || entry.amount <= 0) continue;
            context.giveItemById(entry.itemId, entry.amount);
        }
    }

    function removeMaterials(context, recipe) {
        const inputs = Array.isArray(recipe && recipe.inputs) ? recipe.inputs : [];
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            const needed = Number.isFinite(input.amount) ? Math.max(1, Math.floor(input.amount)) : 1;
            if ((context.getInventoryCount(input.itemId) || 0) < needed) return null;
        }

        const consumed = [];
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            const needed = Number.isFinite(input.amount) ? Math.max(1, Math.floor(input.amount)) : 1;
            const removed = context.removeItemsById(input.itemId, needed);
            if (removed < needed) {
                if (removed > 0) consumed.push({ itemId: input.itemId, amount: removed });
                restoreMaterials(context, consumed);
                return null;
            }
            consumed.push({ itemId: input.itemId, amount: needed });
        }

        return consumed;
    }

    function hasToolRequirements(context, recipe) {
        const tools = Array.isArray(recipe && recipe.requiredToolIds) ? recipe.requiredToolIds : [];
        for (let i = 0; i < tools.length; i++) {
            if (!context.hasItem(tools[i])) return false;
        }
        return true;
    }

    function hasMouldRequirements(context, recipe) {
        const moulds = Array.isArray(recipe && recipe.requiredMouldIds) ? recipe.requiredMouldIds : [];
        for (let i = 0; i < moulds.length; i++) {
            if (!context.hasItem(moulds[i])) return false;
        }
        return true;
    }


    function hasUnlockRequirement(context, recipe) {
        const unlockFlag = typeof (recipe && recipe.requiredUnlockFlag) === 'string' ? recipe.requiredUnlockFlag : '';
        if (!unlockFlag) return true;
        if (typeof context.hasUnlockFlag !== 'function') return true;
        return context.hasUnlockFlag(unlockFlag);
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

    function stationRecipes(context, stationType) {
        const all = getAllRecipes(context);
        return all.filter((recipe) => recipe.stationType === stationType);
    }

    function sortByPriority(recipes) {
        recipes.sort((a, b) => {
            const ra = Number.isFinite(a.requiredLevel) ? a.requiredLevel : 1;
            const rb = Number.isFinite(b.requiredLevel) ? b.requiredLevel : 1;
            if (rb !== ra) return rb - ra;
            const ai = Array.isArray(a.inputs) ? a.inputs.length : 0;
            const bi = Array.isArray(b.inputs) ? b.inputs.length : 0;
            return ai - bi;
        });
        return recipes;
    }

    function resolveAutoRecipe(context, stationType) {
        const level = typeof context.getSkillLevel === 'function' ? context.getSkillLevel(SKILL_ID) : 1;
        const candidates = stationRecipes(context, stationType).filter((recipe) => {
            const required = Number.isFinite(recipe.requiredLevel) ? recipe.requiredLevel : 1;
            return level >= required
                && hasToolRequirements(context, recipe)
                && hasMouldRequirements(context, recipe)
                && hasUnlockRequirement(context, recipe)
                && hasMaterials(context, recipe)
                && hasOutputCapacity(context, recipe);
        });
        if (!candidates.length) return null;
        return sortByPriority(candidates)[0];
    }

    function resolveRecipeById(context, recipeId) {
        if (!recipeId) return null;
        const set = getRecipeSet(context);
        if (!set) return null;
        const recipe = set[recipeId];
        if (!recipe || typeof recipe !== 'object') return null;
        return Object.assign({ recipeId }, recipe);
    }

    function resolveRecipeForUse(context, stationType, sourceItemId) {
        if (!sourceItemId) return resolveAutoRecipe(context, stationType);
        if (sourceItemId === 'hammer') return resolveAutoRecipe(context, stationType);

        const level = typeof context.getSkillLevel === 'function' ? context.getSkillLevel(SKILL_ID) : 1;
        const candidates = stationRecipes(context, stationType).filter((recipe) => {
            const required = Number.isFinite(recipe.requiredLevel) ? recipe.requiredLevel : 1;
            if (level < required) return false;
            if (!Array.isArray(recipe.inputs)) return false;
            if (!recipe.inputs.some((input) => input && input.itemId === sourceItemId)) return false;
            return hasToolRequirements(context, recipe)
                && hasMouldRequirements(context, recipe)
                && hasUnlockRequirement(context, recipe)
                && hasMaterials(context, recipe)
                && hasOutputCapacity(context, recipe);
        });

        if (!candidates.length) return null;
        return sortByPriority(candidates)[0];
    }

    function describeStation(stationType) {
        return stationType === STATION_FURNACE ? 'furnace' : 'anvil';
    }

    function titleCase(value) {
        const text = String(value || '').trim();
        if (!text) return '';
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }

    function humanizeId(itemId) {
        return String(itemId || '').replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
    }

    function getItemName(context, itemId) {
        if (!itemId) return 'Unknown item';
        const item = (typeof context.getItemDataById === 'function' ? context.getItemDataById(itemId) : null)
            || (window.ITEM_DB && window.ITEM_DB[itemId] ? window.ITEM_DB[itemId] : null);
        return item && item.name ? item.name : humanizeId(itemId);
    }

    function inferTierKey(recipe) {
        if (!recipe || !recipe.output || !recipe.output.itemId) return 'misc';
        const outputId = String(recipe.output.itemId);
        const firstPart = outputId.split('_')[0];
        return firstPart ? firstPart.toLowerCase() : 'misc';
    }

    function summarizeInputs(context, recipe) {
        const inputs = Array.isArray(recipe && recipe.inputs) ? recipe.inputs : [];
        if (!inputs.length) return 'No materials';
        const parts = [];
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            if (!input || !input.itemId) continue;
            const amount = Number.isFinite(input.amount) ? Math.max(1, Math.floor(input.amount)) : 1;
            parts.push(amount + 'x ' + getItemName(context, input.itemId));
        }
        return parts.join(', ');
    }

    function getRecipeIssues(context, recipe) {
        const issues = [];
        const level = typeof context.getSkillLevel === 'function' ? context.getSkillLevel(SKILL_ID) : 1;
        const required = Number.isFinite(recipe && recipe.requiredLevel) ? recipe.requiredLevel : 1;
        if (level < required) issues.push('Requires Smithing ' + required);

        if (!hasToolRequirements(context, recipe)) issues.push('Missing required tool');
        if (!hasMouldRequirements(context, recipe)) issues.push('Missing required mould');
        if (!hasUnlockRequirement(context, recipe)) issues.push('Mould not unlocked');
        if (!hasMaterials(context, recipe)) issues.push('Missing materials');
        if (!hasOutputCapacity(context, recipe)) issues.push('No output space');
        return issues;
    }

    function sortRecipesForMenu(context, recipes) {
        const list = Array.isArray(recipes) ? recipes.slice() : [];
        list.sort((a, b) => {
            const la = Number.isFinite(a.requiredLevel) ? a.requiredLevel : 1;
            const lb = Number.isFinite(b.requiredLevel) ? b.requiredLevel : 1;
            if (la !== lb) return la - lb;
            const na = getItemName(context, a.output && a.output.itemId);
            const nb = getItemName(context, b.output && b.output.itemId);
            return na.localeCompare(nb);
        });
        return list;
    }

    const smithingUiState = {
        open: false,
        stationType: null,
        targetX: 0,
        targetY: 0,
        targetZ: 0,
        tierOrder: [],
        recipesByTier: {},
        selectedTier: null,
        panel: null,
        boundHandlers: false
    };

    function closeSmithingUi() {
        if (!smithingUiState.panel) return;
        smithingUiState.panel.classList.add('hidden');
        smithingUiState.open = false;
    }

    function ensureSmithingUi() {
        if (smithingUiState.panel) return smithingUiState.panel;
        const uiLayer = document.getElementById('ui-layer') || document.body;
        const panel = document.createElement('div');
        panel.id = 'smithing-interface';
        panel.className = 'hidden pointer-events-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[780px] max-w-[calc(100vw-1rem)] max-h-[80vh] bg-[#4a4136] border-[3px] border-[#3e3529] shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-[260] flex flex-col';
        panel.innerHTML = ''
            + '<div class="bg-[#2b251d] text-[#f0e6d2] px-3 py-2 border-b border-[#1d1812] flex items-center justify-between">'
            + '  <div>'
            + '    <div id="smithing-title" class="font-bold tracking-wide">Smithing</div>'
            + '    <div id="smithing-subtitle" class="text-[11px] text-[#c8aa6e]">Choose a station tier, then a recipe.</div>'
            + '  </div>'
            + '  <button id="smithing-close" class="px-2 py-1 border border-[#5d5447] bg-[#1f1a15] hover:bg-[#2a231c] text-[#f0e6d2]">X</button>'
            + '</div>'
            + '<div class="flex min-h-0 flex-1">'
            + '  <div class="w-52 border-r border-[#2b251d] bg-[#3e3529] p-2 flex flex-col min-h-0">'
            + '    <div class="text-[11px] uppercase tracking-wide text-[#c8aa6e] mb-2">Tiers</div>'
            + '    <div id="smithing-tier-list" class="flex-1 overflow-y-auto custom-scrollbar space-y-1"></div>'
            + '  </div>'
            + '  <div class="flex-1 p-2 flex flex-col min-h-0">'
            + '    <div id="smithing-tier-heading" class="text-[11px] uppercase tracking-wide text-[#c8aa6e] mb-2">Recipes</div>'
            + '    <div id="smithing-recipe-list" class="flex-1 overflow-y-auto custom-scrollbar space-y-1"></div>'
            + '  </div>'
            + '</div>';

        uiLayer.appendChild(panel);
        smithingUiState.panel = panel;

        const closeButton = panel.querySelector('#smithing-close');
        if (closeButton) closeButton.addEventListener('click', closeSmithingUi);

        if (!smithingUiState.boundHandlers) {
            smithingUiState.boundHandlers = true;
            document.addEventListener('keydown', (event) => {
                if (!smithingUiState.open) return;
                if (event.key === 'Escape') closeSmithingUi();
            });
            document.addEventListener('mousedown', (event) => {
                if (!smithingUiState.open || !smithingUiState.panel) return;
                if (event.target.closest('#smithing-interface')) return;
                closeSmithingUi();
            });
        }

        return panel;
    }

    function renderSmithingUiTierButtons(context) {
        const panel = smithingUiState.panel;
        if (!panel) return;
        const tierList = panel.querySelector('#smithing-tier-list');
        if (!tierList) return;
        tierList.innerHTML = '';

        for (let i = 0; i < smithingUiState.tierOrder.length; i++) {
            const tierKey = smithingUiState.tierOrder[i];
            const recipes = smithingUiState.recipesByTier[tierKey] || [];
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'w-full text-left px-2 py-1 border text-[12px] bg-[#2a231c] hover:bg-[#342b22]';
            button.classList.add(tierKey === smithingUiState.selectedTier ? 'border-[#c8aa6e]' : 'border-[#5d5447]');
            button.innerHTML = '<span class="text-[#f0e6d2]">' + titleCase(tierKey) + '</span> <span class="text-[#c8aa6e]">(' + recipes.length + ')</span>';
            button.onclick = () => {
                smithingUiState.selectedTier = tierKey;
                renderSmithingUiTierButtons(context);
                renderSmithingUiRecipeList(context);
            };
            tierList.appendChild(button);
        }
    }

    function queueSmithingRecipeSelection(recipeId, quantityMode, quantityCount) {
        if (!recipeId || !smithingUiState.stationType) return;

        const normalizedMode = (typeof quantityMode === 'string' && quantityMode) ? quantityMode : 'all';
        const normalizedCount = Number.isFinite(quantityCount) ? Math.max(1, Math.floor(quantityCount)) : null;
        const pending = {
            skillId: SKILL_ID,
            targetObj: smithingUiState.stationType,
            targetX: smithingUiState.targetX,
            targetY: smithingUiState.targetY,
            targetZ: smithingUiState.targetZ,
            recipeId,
            stationType: smithingUiState.stationType,
            quantityMode: normalizedMode,
            quantityCount: normalizedCount
        };

        closeSmithingUi();

        if (window.SkillRuntime && typeof window.SkillRuntime.queuePendingSkillStart === 'function') {
            window.SkillRuntime.queuePendingSkillStart(pending);
        }

        if (typeof queueAction === 'function') {
            queueAction('INTERACT', smithingUiState.targetX, smithingUiState.targetY, smithingUiState.stationType, {
                skillId: SKILL_ID,
                recipeId,
                stationType: smithingUiState.stationType,
                quantityMode: normalizedMode,
                quantityCount: normalizedCount
            });
        } else if (window.SkillRuntime && typeof window.SkillRuntime.tryStartSkillById === 'function') {
            window.SkillRuntime.tryStartSkillById(SKILL_ID, pending);
        }
    }

    function renderSmithingUiRecipeList(context) {
        const panel = smithingUiState.panel;
        if (!panel) return;
        const heading = panel.querySelector('#smithing-tier-heading');
        const recipeList = panel.querySelector('#smithing-recipe-list');
        if (!recipeList) return;

        const tierKey = smithingUiState.selectedTier;
        const recipes = smithingUiState.recipesByTier[tierKey] || [];
        if (heading) heading.textContent = titleCase(tierKey) + ' Recipes';
        recipeList.innerHTML = '';

        if (!recipes.length) {
            const empty = document.createElement('div');
            empty.className = 'text-[12px] text-[#c8aa6e] px-2 py-3';
            empty.textContent = 'No recipes available in this tier at this station.';
            recipeList.appendChild(empty);
            return;
        }

        for (let i = 0; i < recipes.length; i++) {
            const recipe = recipes[i];
            const issues = getRecipeIssues(context, recipe);
            const outputName = getItemName(context, recipe.output && recipe.output.itemId);
            const reqLevel = Number.isFinite(recipe.requiredLevel) ? recipe.requiredLevel : 1;
            const reqText = summarizeInputs(context, recipe);
            const xp = Number.isFinite(recipe.xpPerAction) ? recipe.xpPerAction : 0;

            const row = document.createElement('div');
            row.className = 'w-full border border-[#5d5447] bg-[#2a231c] px-2 py-2 flex items-center gap-2';

            const info = document.createElement('div');
            info.className = 'flex-1 min-w-0';
            info.innerHTML = ''
                + '<div class="text-[#f0e6d2] text-[13px]">' + outputName + '</div>'
                + '<div class="text-[#c8aa6e] text-[11px]">Lvl ' + reqLevel + ' | ' + xp + ' XP</div>'
                + '<div class="text-[#b9aa95] text-[11px]">' + reqText + '</div>'
                + (issues.length ? '<div class="text-[#f7a9a9] text-[11px] mt-1">' + issues.join(' | ') + '</div>' : '');
            row.appendChild(info);

            const qtyWrap = document.createElement('div');
            qtyWrap.className = 'flex flex-row gap-1 items-center justify-end shrink-0';

            const makeQtyButton = (label, mode, count) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'text-[12px] font-bold leading-5 px-2 py-1 border border-[#7a6a58] bg-[#1f1a15] hover:bg-[#342b22] text-[#f0e6d2] min-w-[34px]';
                btn.textContent = label;
                btn.onclick = (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (!validateRecipeStart(context, recipe)) return;
                    if (mode === 'x') {
                        if (typeof context.promptAmount === 'function') {
                            const opened = context.promptAmount((amt) => {
                                if (!validateRecipeStart(context, recipe)) return;
                                queueSmithingRecipeSelection(recipe.recipeId, 'count', amt);
                            });
                            if (!opened) {
                                const val = parseInt(window.prompt('Enter smithing amount:'), 10);
                                if (Number.isFinite(val) && val > 0) {
                                    if (!validateRecipeStart(context, recipe)) return;
                                    queueSmithingRecipeSelection(recipe.recipeId, 'count', val);
                                }
                            }
                            return;
                        }
                        const val = parseInt(window.prompt('Enter smithing amount:'), 10);
                        if (Number.isFinite(val) && val > 0) {
                            if (!validateRecipeStart(context, recipe)) return;
                            queueSmithingRecipeSelection(recipe.recipeId, 'count', val);
                        }
                        return;
                    }
                    queueSmithingRecipeSelection(recipe.recipeId, mode, count);
                };
                return btn;
            };

            qtyWrap.appendChild(makeQtyButton('1', 'count', 1));
            qtyWrap.appendChild(makeQtyButton('5', 'count', 5));
            qtyWrap.appendChild(makeQtyButton('X', 'x', null));
            qtyWrap.appendChild(makeQtyButton('All', 'all', null));
            row.appendChild(qtyWrap);

            recipeList.appendChild(row);
        }
    }

    function openSmithingUi(context, stationType) {
        if (!context || (stationType !== STATION_FURNACE && stationType !== STATION_ANVIL)) return false;
        const panel = ensureSmithingUi();
        if (!panel) return false;

        const all = sortRecipesForMenu(context, stationRecipes(context, stationType));
        const recipesByTier = {};
        for (let i = 0; i < all.length; i++) {
            const recipe = all[i];
            const tierKey = inferTierKey(recipe);
            recipesByTier[tierKey] = recipesByTier[tierKey] || [];
            recipesByTier[tierKey].push(recipe);
        }

        const orderedKeys = [];
        const preferred = TIER_ORDER[stationType] || [];
        for (let i = 0; i < preferred.length; i++) {
            const key = preferred[i];
            if (!orderedKeys.includes(key)) orderedKeys.push(key);
        }

        const discovered = Object.keys(recipesByTier);
        for (let i = 0; i < discovered.length; i++) {
            const key = discovered[i];
            if (!orderedKeys.includes(key)) orderedKeys.push(key);
        }

        smithingUiState.open = true;
        smithingUiState.stationType = stationType;
        smithingUiState.targetX = context.targetX;
        smithingUiState.targetY = context.targetY;
        smithingUiState.targetZ = context.targetZ;
        smithingUiState.tierOrder = orderedKeys;
        smithingUiState.recipesByTier = recipesByTier;
        smithingUiState.selectedTier = orderedKeys[0] || null;

        const title = panel.querySelector('#smithing-title');
        const subtitle = panel.querySelector('#smithing-subtitle');
        if (title) title.textContent = stationType === STATION_FURNACE ? 'Furnace Smithing' : 'Anvil Smithing';
        if (subtitle) subtitle.textContent = stationType === STATION_FURNACE
            ? 'Select a tier, then choose what to smelt or cast.'
            : 'Select a tier, then choose what to forge.';

        renderSmithingUiTierButtons(context);
        renderSmithingUiRecipeList(context);
        panel.classList.remove('hidden');
        return true;
    }

    function resolveStartRecipe(context) {
        if (context.recipeId) {
            const byId = resolveRecipeById(context, context.recipeId);
            if (byId) return byId;
        }

        const stationType = context.targetObj;
        if (context.sourceItemId) {
            const fromUse = resolveRecipeForUse(context, stationType, context.sourceItemId);
            if (fromUse) return fromUse;
        }

        return resolveAutoRecipe(context, stationType);
    }

    function validateRecipeStart(context, recipe) {
        if (!recipe) {
            context.addChatMessage('You do not have the materials to smith anything here.', 'warn');
            return false;
        }

        if (typeof context.requireSkillLevel === 'function' && !context.requireSkillLevel(recipe.requiredLevel || 1, { skillId: SKILL_ID, action: 'smith that recipe' })) {
            return false;
        }

        if (!hasToolRequirements(context, recipe)) {
            context.addChatMessage('You need the required smithing tool.', 'warn');
            return false;
        }

        if (!hasMouldRequirements(context, recipe)) {
            context.addChatMessage('You need the required mould to smith that.', 'warn');
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
            context.addChatMessage('You have no inventory space for that smithing output.', 'warn');
            return false;
        }

        return true;
    }

    function validateRecipeRuntime(context, recipe, session) {
        if (!recipe) return { ok: false, reasonCode: 'RECIPE_MISSING', message: 'Smithing recipe is missing.' };

        if (session && session.stationType !== context.targetObj) {
            return { ok: false, reasonCode: 'STATION_CHANGED', message: 'You stop smithing at this station.' };
        }

        const target = session && session.target ? session.target : null;
        if (target) {
            const samePlane = target.z === context.playerState.z;
            const dx = Math.abs(target.x - context.playerState.x);
            const dy = Math.abs(target.y - context.playerState.y);
            if (!samePlane || dx > 1 || dy > 1) {
                return { ok: false, reasonCode: 'MOVED_AWAY', message: 'You stop smithing.' };
            }
        }

        if (!hasToolRequirements(context, recipe)) {
            return { ok: false, reasonCode: 'MISSING_TOOL', message: 'You need the required smithing tool.' };
        }

        if (!hasMouldRequirements(context, recipe)) {
            return { ok: false, reasonCode: 'MISSING_MOULD', message: 'You need the required mould to continue.' };
        }

        if (!hasUnlockRequirement(context, recipe)) {
            return { ok: false, reasonCode: 'MISSING_UNLOCK', message: 'You have not unlocked that mould yet.' };
        }

        if (!hasMaterials(context, recipe)) {
            return { ok: false, reasonCode: 'INPUT_EMPTY', message: 'You run out of smithing materials.' };
        }

        if (!hasOutputCapacity(context, recipe)) {
            return { ok: false, reasonCode: 'INVENTORY_FULL', message: 'You have no inventory space for that output.' };
        }

        return { ok: true };
    }

    function craftOne(context, recipe) {
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

        return SkillActionResolution.createActionResolution('success', 'SMITH_SUCCESS', {
            consumed,
            produced: [{ itemId: outItemId, amount: outAmount }],
            xpGained: xp
        });
    }

    const smithingModule = {
        canStart(context) {
            return !!(context && (context.targetObj === STATION_FURNACE || context.targetObj === STATION_ANVIL));
        },

        onUseItem(context) {
            if (!context || (context.targetObj !== STATION_FURNACE && context.targetObj !== STATION_ANVIL)) return false;

            const recipe = resolveRecipeForUse(context, context.targetObj, context.sourceItemId);
            if (!recipe) {
                context.addChatMessage('That item cannot be used here for smithing right now.', 'warn');
                return true;
            }

            context.playerState.pendingSkillStart = {
                skillId: SKILL_ID,
                targetObj: context.targetObj,
                targetX: context.targetX,
                targetY: context.targetY,
                targetZ: context.targetZ,
                sourceInvIndex: Number.isInteger(context.sourceInvIndex) ? context.sourceInvIndex : null,
                sourceItemId: context.sourceItemId,
                recipeId: recipe.recipeId,
                stationType: context.targetObj
            };

            if (typeof context.queueInteractAt === 'function') {
                context.queueInteractAt(context.targetObj, context.targetX, context.targetY, {
                    skillId: SKILL_ID,
                    recipeId: recipe.recipeId,
                    stationType: context.targetObj
                });
            } else {
                context.queueInteract();
            }

            return true;
        },

        onStart(context) {
            if (!context.recipeId) {
                openSmithingUi(context, context.targetObj);
                return false;
            }

            closeSmithingUi();
            const recipe = resolveStartRecipe(context);
            if (!validateRecipeStart(context, recipe)) return false;

            const skillSpec = typeof context.getSkillSpec === 'function' ? context.getSkillSpec(SKILL_ID) : null;
            const actionTicks = Number.isFinite(recipe.actionTicks)
                ? Math.max(1, Math.floor(recipe.actionTicks))
                : (skillSpec && skillSpec.timing && Number.isFinite(skillSpec.timing.actionTicks)
                    ? Math.max(1, Math.floor(skillSpec.timing.actionTicks))
                    : 3);

            const quantityMode = (typeof context.quantityMode === 'string' && context.quantityMode) ? context.quantityMode : 'all';
            const quantityCount = Number.isFinite(context.quantityCount) ? Math.max(1, Math.floor(context.quantityCount)) : null;
            SkillActionResolution.startProcessingSession(context, SKILL_ID, {
                recipeId: recipe.recipeId,
                stationType: context.targetObj,
                target: { x: context.targetX, y: context.targetY, z: context.targetZ },
                quantityMode,
                quantityRemaining: quantityMode === 'count' ? quantityCount : null,
                intervalTicks: actionTicks,
                nextTick: context.currentTick + actionTicks
            });

            context.startSkillingAction();
            context.addChatMessage('You begin smithing at the ' + describeStation(context.targetObj) + '.', 'info');
            return true;
        },

        onTick(context) {
            if (!(context.playerState.action === 'SKILLING: FURNACE' || context.playerState.action === 'SKILLING: ANVIL')) return;
            if (!window.SkillActionResolution || typeof SkillActionResolution.tickProcessingSession !== 'function') {
                context.stopAction();
                return;
            }

            SkillActionResolution.tickProcessingSession(context, SKILL_ID, (session) => {
                const recipe = resolveRecipeById(context, session.recipeId);
                const validation = validateRecipeRuntime(context, recipe, session);
                if (!validation.ok) {
                    if (validation.message) context.addChatMessage(validation.message, 'warn');
                    if (typeof context.renderInventory === 'function') context.renderInventory();
                    return SkillActionResolution.stopSkill(context, SKILL_ID, validation.reasonCode);
                }

                const resolution = craftOne(context, recipe);
                if (resolution.status !== 'success') {
                    if (resolution.reasonCode === 'INPUT_EMPTY') {
                        context.addChatMessage('You run out of smithing materials.', 'info');
                    } else if (resolution.reasonCode === 'INVENTORY_FULL') {
                        context.addChatMessage('You have no inventory space for that output.', 'warn');
                    }
                    return SkillActionResolution.stopSkill(context, SKILL_ID, resolution.reasonCode || 'FAILED');
                }

                if (Number.isFinite(session.quantityRemaining)) {
                    session.quantityRemaining = Math.max(0, session.quantityRemaining - 1);
                    if (session.quantityRemaining <= 0) {
                        return SkillActionResolution.stopSkill(context, SKILL_ID, 'QUANTITY_COMPLETE');
                    }
                }

                const canContinue = validateRecipeRuntime(context, recipe, session);
                if (!canContinue.ok) {
                    if (canContinue.message && canContinue.reasonCode !== 'INPUT_EMPTY') context.addChatMessage(canContinue.message, 'info');
                    return SkillActionResolution.stopSkill(context, SKILL_ID, canContinue.reasonCode);
                }

                session.nextTick = context.currentTick + (session.intervalTicks || 3);
                return resolution;
            });
        },

        onAnimate(context) {
            if (window.SkillSharedAnimations && typeof SkillSharedAnimations.applyCookingStylePose === 'function') {
                SkillSharedAnimations.applyCookingStylePose(context);
            }
        },

        getTooltip(context) {
            if (!context) return '';
            if (context.targetObj === STATION_FURNACE) return '<span class="text-gray-300">Smelt</span> <span class="text-orange-300">Furnace</span>';
            if (context.targetObj === STATION_ANVIL) return '<span class="text-gray-300">Forge</span> <span class="text-slate-300">Anvil</span>';
            return '';
        },

        getContextMenu(context) {
            if (!context) return [];
            if (context.targetObj === STATION_FURNACE) {
                return [
                    {
                        text: 'Open Smithing Furnace',
                        onSelect: () => {
                            openSmithingUi(context, STATION_FURNACE);
                        }
                    },
                    { text: 'Examine Furnace', onSelect: () => (window.ExamineCatalog ? window.ExamineCatalog.examineTarget('FURNACE', {}, (message, tone) => context.addChatMessage(message, tone)) : context.addChatMessage('A roaring smithing furnace.', 'game')) }
                ];
            }

            if (context.targetObj === STATION_ANVIL) {
                return [
                    {
                        text: 'Open Smithing Anvil',
                        onSelect: () => {
                            openSmithingUi(context, STATION_ANVIL);
                        }
                    },
                    { text: 'Examine Anvil', onSelect: () => (window.ExamineCatalog ? window.ExamineCatalog.examineTarget('ANVIL', {}, (message, tone) => context.addChatMessage(message, tone)) : context.addChatMessage('A solid anvil for forging metal.', 'game')) }
                ];
            }

            return [];
        }
    };

    window.SkillModules = window.SkillModules || {};
    window.SkillModules[SKILL_ID] = smithingModule;
})();







