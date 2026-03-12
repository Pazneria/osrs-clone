(function () {
    const SKILL_ID = 'fletching';
    const INVENTORY_TARGET = 'INVENTORY';
    const DEFAULT_ACTION_TICKS = 3;
    const PRIMARY_LOG_GRID_SLOT_ORDER = ['handle', 'longbow_u', 'shafts', 'shortbow_u'];

    const fletchingUiState = {
        open: false,
        panel: null,
        boundHandlers: false,
        logItemId: null,
        recipes: [],
        context: null
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
        if (!set) return null;
        const recipe = set[recipeId];
        if (!recipe || typeof recipe !== 'object') return null;
        return Object.assign({ recipeId }, recipe);
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

    function getRecipeOutputName(context, recipe) {
        const outputItemId = recipe && recipe.output ? recipe.output.itemId : null;
        return getItemName(context, outputItemId);
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

    function hasToolRequirements(context, recipe) {
        const tools = Array.isArray(recipe && recipe.requiredToolIds) ? recipe.requiredToolIds : [];
        for (let i = 0; i < tools.length; i++) {
            if (!context.hasItem(tools[i])) return false;
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

    function inferRecipeMenuPriority(context, recipe) {
        const family = String(recipe && recipe.recipeFamily || '').toLowerCase();
        if (family === 'handle') return 10;
        if (family === 'staff') return 20;
        if (family === 'shafts') return 30;

        if (family === 'bow_unstrung') {
            const outName = getRecipeOutputName(context, recipe).toLowerCase();
            if (outName.includes('longbow')) return 40;
            if (outName.includes('shortbow')) return 50;
            return 45;
        }

        return 100;
    }

    function inferPrimaryGridSlotKey(context, recipe) {
        const family = String(recipe && recipe.recipeFamily || '').toLowerCase();
        if (family === 'handle') return 'handle';
        if (family === 'shafts') return 'shafts';
        if (family !== 'bow_unstrung') return null;

        const outputName = getRecipeOutputName(context, recipe).toLowerCase();
        if (outputName.includes('longbow')) return 'longbow_u';
        if (outputName.includes('shortbow')) return 'shortbow_u';
        return null;
    }

    function getPrimaryGridSlotLabel(slotKey) {
        if (slotKey === 'handle') return 'Handle';
        if (slotKey === 'shafts') return 'Shafts';
        if (slotKey === 'longbow_u') return 'Longbow (u)';
        if (slotKey === 'shortbow_u') return 'Shortbow (u)';
        return 'Fletching Product';
    }

    function isLitLogMenuRecipe(context, recipe) {
        const level = typeof context.getSkillLevel === 'function' ? context.getSkillLevel(SKILL_ID) : 1;
        const required = Number.isFinite(recipe && recipe.requiredLevel) ? recipe.requiredLevel : 1;
        if (level < required) return false;
        return hasMaterials(context, recipe);
    }

    function getUnlitRecipeFeedback(context, recipe) {
        const level = typeof context.getSkillLevel === 'function' ? context.getSkillLevel(SKILL_ID) : 1;
        const required = Number.isFinite(recipe && recipe.requiredLevel) ? recipe.requiredLevel : 1;
        if (level < required) return 'Requires level ' + required + ' Fletching.';
        if (!hasMaterials(context, recipe)) return 'You do not have the required materials.';
        return 'You cannot fletch that right now.';
    }
    function getLogCutRecipes(context, logItemId) {
        const all = getAllRecipes(context);
        const recipes = all.filter((recipe) => {
            if (!recipe || recipe.sourceLogItemId !== logItemId) return false;
            const tools = Array.isArray(recipe.requiredToolIds) ? recipe.requiredToolIds : [];
            return tools.includes('knife');
        });

        recipes.sort((a, b) => {
            const pa = inferRecipeMenuPriority(context, a);
            const pb = inferRecipeMenuPriority(context, b);
            if (pa !== pb) return pa - pb;
            const la = Number.isFinite(a.requiredLevel) ? a.requiredLevel : 1;
            const lb = Number.isFinite(b.requiredLevel) ? b.requiredLevel : 1;
            if (la !== lb) return la - lb;
            return getRecipeOutputName(context, a).localeCompare(getRecipeOutputName(context, b));
        });

        return recipes;
    }

    function validateRecipeStart(context, recipe) {
        if (!recipe) {
            context.addChatMessage('You cannot fletch that right now.', 'warn');
            return false;
        }

        if (typeof context.requireSkillLevel === 'function' && !context.requireSkillLevel(recipe.requiredLevel || 1, { skillId: SKILL_ID, action: 'fletch that recipe' })) {
            return false;
        }

        if (!hasToolRequirements(context, recipe)) {
            context.addChatMessage('You need the required fletching tool.', 'warn');
            return false;
        }

        if (!hasMaterials(context, recipe)) {
            context.addChatMessage('You do not have the required materials.', 'warn');
            return false;
        }

        if (!hasOutputCapacity(context, recipe)) {
            context.addChatMessage('You have no inventory space for that fletching output.', 'warn');
            return false;
        }

        return true;
    }

    function validateRecipeRuntime(context, recipe) {
        if (!recipe) return { ok: false, reasonCode: 'RECIPE_MISSING', message: 'Fletching recipe is missing.' };

        const requiredLevel = Number.isFinite(recipe.requiredLevel) ? Math.max(1, Math.floor(recipe.requiredLevel)) : 1;
        const level = typeof context.getSkillLevel === 'function' ? context.getSkillLevel(SKILL_ID) : 1;
        if (level < requiredLevel) {
            return { ok: false, reasonCode: 'LEVEL_LOW', message: 'You need a higher Fletching level to continue.' };
        }

        if (!hasToolRequirements(context, recipe)) {
            return { ok: false, reasonCode: 'MISSING_TOOL', message: 'You need the required fletching tool.' };
        }

        if (!hasMaterials(context, recipe)) {
            return { ok: false, reasonCode: 'INPUT_EMPTY', message: 'You run out of fletching materials.' };
        }

        if (!hasOutputCapacity(context, recipe)) {
            return { ok: false, reasonCode: 'INVENTORY_FULL', message: 'You have no inventory space for that output.' };
        }

        return { ok: true };
    }

    function craftOne(context, recipe) {
        if (!removeMaterials(context, recipe)) {
            return SkillActionResolution.createActionResolution('stopped', 'INPUT_EMPTY');
        }

        const outAmount = Number.isFinite(recipe.output && recipe.output.amount) ? Math.max(1, Math.floor(recipe.output.amount)) : 1;
        const outItemId = recipe.output && recipe.output.itemId ? recipe.output.itemId : null;
        if (!outItemId) return SkillActionResolution.createActionResolution('stopped', 'OUTPUT_MISSING');

        const given = context.giveItemById(outItemId, outAmount);
        if (given < outAmount) {
            return SkillActionResolution.createActionResolution('stopped', 'INVENTORY_FULL');
        }

        const xp = Number.isFinite(recipe.xpPerAction) ? recipe.xpPerAction : 0;
        if (xp > 0) context.addSkillXp(SKILL_ID, xp);
        if (typeof context.renderInventory === 'function') context.renderInventory();

        return SkillActionResolution.createActionResolution('success', 'FLETCH_SUCCESS', {
            consumed: Array.isArray(recipe.inputs) ? recipe.inputs.map((input) => ({ itemId: input.itemId, amount: input.amount })) : [],
            produced: [{ itemId: outItemId, amount: outAmount }],
            xpGained: xp
        });
    }

    function closeFletchingUi() {
        if (!fletchingUiState.panel) return;
        fletchingUiState.panel.classList.add('hidden');
        fletchingUiState.open = false;
        fletchingUiState.logItemId = null;
        fletchingUiState.recipes = [];
        fletchingUiState.context = null;
    }

    function ensureFletchingUi() {
        if (fletchingUiState.panel) return fletchingUiState.panel;

        const uiLayer = document.getElementById('ui-layer') || document.body;
        const panel = document.createElement('div');
        panel.id = 'fletching-interface';
        panel.className = 'hidden pointer-events-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] max-w-[calc(100vw-1rem)] max-h-[80vh] bg-[#4a4136] border-[3px] border-[#3e3529] shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-[260] flex flex-col';
        panel.innerHTML = ''
            + '<div class="bg-[#2b251d] text-[#f0e6d2] px-3 py-2 border-b border-[#1d1812] flex items-center justify-between">'
            + '  <div>'
            + '    <div id="fletching-title" class="font-bold tracking-wide">Fletching</div>'
            + '    <div id="fletching-subtitle" class="text-[11px] text-[#c8aa6e]">Choose a product and quantity.</div>'
            + '  </div>'
            + '  <button id="fletching-close" class="px-2 py-1 border border-[#5d5447] bg-[#1f1a15] hover:bg-[#2a231c] text-[#f0e6d2]">X</button>'
            + '</div>'
            + '<div id="fletching-log-label" class="px-3 py-2 text-[12px] text-[#c8aa6e] border-b border-[#2b251d]"></div>'
            + '<div id="fletching-recipe-list" class="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2 space-y-1"></div>';

        uiLayer.appendChild(panel);
        fletchingUiState.panel = panel;

        const closeButton = panel.querySelector('#fletching-close');
        if (closeButton) closeButton.addEventListener('click', closeFletchingUi);

        if (!fletchingUiState.boundHandlers) {
            fletchingUiState.boundHandlers = true;
            document.addEventListener('keydown', (event) => {
                if (!fletchingUiState.open) return;
                if (event.key === 'Escape') closeFletchingUi();
            });
            document.addEventListener('mousedown', (event) => {
                if (!fletchingUiState.open || !fletchingUiState.panel) return;
                if (event.button !== 0) return;
                if (event.target.closest('#fletching-interface')) return;
                closeFletchingUi();
            });
        }

        return panel;
    }

    function getRecipeIssues(context, recipe) {
        const issues = [];
        const level = typeof context.getSkillLevel === 'function' ? context.getSkillLevel(SKILL_ID) : 1;
        const required = Number.isFinite(recipe && recipe.requiredLevel) ? recipe.requiredLevel : 1;

        if (level < required) issues.push('Requires Fletching ' + required);
        if (!hasToolRequirements(context, recipe)) issues.push('Missing required tool');
        if (!hasMaterials(context, recipe)) issues.push('Missing materials');
        if (!hasOutputCapacity(context, recipe)) issues.push('No output space');

        return issues;
    }

    function startQueuedFletching(context, recipe, quantityMode, quantityCount, sourceItemId) {
        if (!context || !recipe) return false;
        if (!validateRecipeStart(context, recipe)) return true;

        const normalizedMode = (typeof quantityMode === 'string' && quantityMode) ? quantityMode : 'all';
        const normalizedCount = Number.isFinite(quantityCount) ? Math.max(1, Math.floor(quantityCount)) : null;

        closeFletchingUi();

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
                context.addChatMessage('You cannot start fletching right now.', 'warn');
            }
            return true;
        }

        return false;
    }

    function startFletchingRecipeSelection(context, recipe, quantityMode, quantityCount) {
        const sourceLogItemId = fletchingUiState.logItemId;
        startQueuedFletching(context, recipe, quantityMode, quantityCount, sourceLogItemId);
    }

    function renderFletchingUi(context) {
        const panel = fletchingUiState.panel;
        if (!panel) return;

        const titleEl = panel.querySelector('#fletching-title');
        const subtitleEl = panel.querySelector('#fletching-subtitle');
        const logLabelEl = panel.querySelector('#fletching-log-label');
        const listEl = panel.querySelector('#fletching-recipe-list');
        if (!listEl) return;

        if (titleEl) titleEl.textContent = 'Fletching';
        if (subtitleEl) subtitleEl.textContent = 'Choose a product, then quantity.';
        if (logLabelEl) logLabelEl.textContent = 'Source log: ' + getItemName(context, fletchingUiState.logItemId);

        listEl.innerHTML = '';

        if (!fletchingUiState.recipes.length) {
            const empty = document.createElement('div');
            empty.className = 'text-[12px] text-[#c8aa6e] px-2 py-3';
            empty.textContent = 'No fletching recipes available for that log.';
            listEl.appendChild(empty);
            return;
        }

        const slotRecipes = {};
        for (let i = 0; i < PRIMARY_LOG_GRID_SLOT_ORDER.length; i++) {
            slotRecipes[PRIMARY_LOG_GRID_SLOT_ORDER[i]] = null;
        }
        const extraRecipes = [];

        for (let i = 0; i < fletchingUiState.recipes.length; i++) {
            const recipe = fletchingUiState.recipes[i];
            const slotKey = inferPrimaryGridSlotKey(context, recipe);
            if (slotKey && !slotRecipes[slotKey]) {
                slotRecipes[slotKey] = recipe;
            } else {
                extraRecipes.push(recipe);
            }
        }

        const beginSelection = (recipe, mode, count, isLit, unlitFeedback) => {
            if (!recipe) return;
            if (!isLit) {
                if (unlitFeedback) context.addChatMessage(unlitFeedback, 'warn');
                return;
            }

            if (mode === 'x') {
                if (typeof context.promptAmount === 'function') {
                    const opened = context.promptAmount((amt) => {
                        if (Number.isFinite(amt) && amt > 0) {
                            startFletchingRecipeSelection(context, recipe, 'count', amt);
                        }
                    });
                    if (opened) return;
                }

                const val = parseInt(window.prompt('Enter fletching amount:'), 10);
                if (Number.isFinite(val) && val > 0) {
                    startFletchingRecipeSelection(context, recipe, 'count', val);
                }
                return;
            }

            startFletchingRecipeSelection(context, recipe, mode, count);
        };

        const buildRecipeCard = (recipe, slotKey) => {
            const card = document.createElement('div');
            card.className = 'border px-2 py-2 flex flex-col gap-2 min-h-[122px]';

            if (!recipe) {
                card.classList.add('border-[#4b4338]', 'bg-[#211c16]', 'opacity-80');
                const slotLabel = getPrimaryGridSlotLabel(slotKey);
                card.innerHTML = ''
                    + '<div class="text-[13px] text-[#9b8f7e]">' + slotLabel + '</div>'
                    + '<div class="text-[11px] text-[#75695c]">Unavailable for this log.</div>'
                    + '<div class="mt-auto text-[11px] text-[#75695c]">Locked slot</div>';
                return card;
            }

            const outputName = getRecipeOutputName(context, recipe);
            const reqLevel = Number.isFinite(recipe.requiredLevel) ? recipe.requiredLevel : 1;
            const xp = Number.isFinite(recipe.xpPerAction) ? recipe.xpPerAction : 0;
            const isLit = isLitLogMenuRecipe(context, recipe);
            const unlitFeedback = isLit ? '' : getUnlitRecipeFeedback(context, recipe);
            const issues = getRecipeIssues(context, recipe);
            const miscIssueText = isLit && issues.length ? issues.join(' | ') : '';
            const issueText = !isLit ? unlitFeedback : miscIssueText;

            if (isLit) {
                card.classList.add('border-[#7a6a58]', 'bg-[#2a231c]', 'hover:bg-[#342b22]', 'cursor-pointer');
            } else {
                card.classList.add('border-[#4b4338]', 'bg-[#211c16]', 'cursor-default', 'opacity-80');
            }

            if (!isLit && unlitFeedback) card.title = unlitFeedback;
            card.onclick = () => beginSelection(recipe, 'count', 1, isLit, unlitFeedback);

            const info = document.createElement('div');
            info.className = 'min-w-0';
            info.innerHTML = ''
                + '<div class="' + (isLit ? 'text-[#f0e6d2]' : 'text-[#b6ab9a]') + ' text-[13px]">' + outputName + '</div>'
                + '<div class="text-[#c8aa6e] text-[11px]">Lvl ' + reqLevel + ' | ' + xp + ' XP</div>'
                + (issueText ? '<div class="text-[#f7a9a9] text-[11px] mt-1">' + issueText + '</div>' : '');
            card.appendChild(info);

            const qtyWrap = document.createElement('div');
            qtyWrap.className = 'mt-auto flex flex-row gap-1 items-center justify-end';

            const makeQtyButton = (label, mode, count) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'text-[12px] font-bold leading-5 px-2 py-1 border border-[#7a6a58] bg-[#1f1a15] text-[#f0e6d2] min-w-[34px]';
                btn.textContent = label;
                if (isLit) {
                    btn.classList.add('hover:bg-[#342b22]');
                } else {
                    btn.disabled = true;
                    btn.classList.add('opacity-50', 'cursor-not-allowed');
                }
                btn.onclick = (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    beginSelection(recipe, mode, count, isLit, unlitFeedback);
                };
                return btn;
            };

            qtyWrap.appendChild(makeQtyButton('1', 'count', 1));
            qtyWrap.appendChild(makeQtyButton('5', 'count', 5));
            qtyWrap.appendChild(makeQtyButton('X', 'x', null));
            qtyWrap.appendChild(makeQtyButton('All', 'all', null));
            card.appendChild(qtyWrap);

            return card;
        };

        const primaryGrid = document.createElement('div');
        primaryGrid.className = 'grid grid-cols-1 sm:grid-cols-2 gap-2';
        for (let i = 0; i < PRIMARY_LOG_GRID_SLOT_ORDER.length; i++) {
            const slotKey = PRIMARY_LOG_GRID_SLOT_ORDER[i];
            primaryGrid.appendChild(buildRecipeCard(slotRecipes[slotKey], slotKey));
        }
        listEl.appendChild(primaryGrid);

        if (extraRecipes.length) {
            const extraHeading = document.createElement('div');
            extraHeading.className = 'text-[11px] uppercase tracking-wide text-[#c8aa6e] mt-2 mb-1 px-1';
            extraHeading.textContent = 'Other Products';
            listEl.appendChild(extraHeading);

            const extraGrid = document.createElement('div');
            extraGrid.className = 'grid grid-cols-1 sm:grid-cols-2 gap-2';
            for (let i = 0; i < extraRecipes.length; i++) {
                extraGrid.appendChild(buildRecipeCard(extraRecipes[i], null));
            }
            listEl.appendChild(extraGrid);
        }
    }
    function openFletchingUi(context, logItemId, recipes) {
        const panel = ensureFletchingUi();
        if (!panel) return false;

        fletchingUiState.open = true;
        fletchingUiState.logItemId = logItemId;
        fletchingUiState.recipes = Array.isArray(recipes) ? recipes.slice() : [];
        fletchingUiState.context = context;

        renderFletchingUi(context);
        panel.classList.remove('hidden');
        return true;
    }

    function resolveInventoryUseData(context) {
        const targetUid = context && typeof context.targetUid === 'object' ? context.targetUid : null;
        const sourceItemId = typeof context.sourceItemId === 'string' ? context.sourceItemId : (targetUid && typeof targetUid.sourceItemId === 'string' ? targetUid.sourceItemId : null);
        const targetItemId = targetUid && typeof targetUid.targetItemId === 'string' ? targetUid.targetItemId : null;
        return { sourceItemId, targetItemId };
    }

    function resolveLogForKnifeUse(context) {
        const useData = resolveInventoryUseData(context);
        const sourceItemId = useData.sourceItemId;
        const targetItemId = useData.targetItemId;
        if (!sourceItemId || !targetItemId) return null;

        const sourceIsKnife = sourceItemId === 'knife';
        const targetIsKnife = targetItemId === 'knife';
        if (!sourceIsKnife && !targetIsKnife) return null;

        const logItemId = sourceIsKnife ? targetItemId : sourceItemId;
        const recipes = getLogCutRecipes(context, logItemId);
        if (!recipes.length) return null;

        return { logItemId, recipes, sourceItemId };
    }

    function getInventoryPairRecipes(context) {
        const all = getAllRecipes(context);
        return all.filter((recipe) => {
            const family = String(recipe && recipe.recipeFamily || '').toLowerCase();
            if (!(family === 'bow_strung' || family === 'headless_arrows' || family === 'finished_arrows')) return false;
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

    function isArrowheadsItemId(itemId) {
        return /_arrowheads$/.test(String(itemId || ''));
    }

    function isHeadlessArrowsItemId(itemId) {
        return /_headless_arrows$/.test(String(itemId || ''));
    }

    function isUnstrungBowItemId(itemId) {
        return /_(short|long)bow_u$/.test(String(itemId || ''));
    }

    function isShaftsItemId(itemId) {
        return /_shafts$/.test(String(itemId || ''));
    }

    function resolveInventoryPairRecipe(context) {
        const useData = resolveInventoryUseData(context);
        const sourceItemId = useData.sourceItemId;
        const targetItemId = useData.targetItemId;
        if (!sourceItemId || !targetItemId) return null;

        const recipes = getInventoryPairRecipes(context);
        for (let i = 0; i < recipes.length; i++) {
            const recipe = recipes[i];
            if (matchesInputPair(recipe, sourceItemId, targetItemId)) {
                return { recipe, sourceItemId, recognized: true, message: '' };
            }
        }

        const arrowPair = (isArrowheadsItemId(sourceItemId) && isHeadlessArrowsItemId(targetItemId))
            || (isHeadlessArrowsItemId(sourceItemId) && isArrowheadsItemId(targetItemId));
        if (arrowPair) {
            return { recipe: null, sourceItemId, recognized: true, message: "These don't match." };
        }

        const bowStringPair = (sourceItemId === 'bow_string' && isUnstrungBowItemId(targetItemId))
            || (targetItemId === 'bow_string' && isUnstrungBowItemId(sourceItemId));
        if (bowStringPair) {
            return { recipe: null, sourceItemId, recognized: true, message: "You can't string that bow." };
        }

        const feathersPair = (sourceItemId === 'feathers_bundle' && isShaftsItemId(targetItemId))
            || (targetItemId === 'feathers_bundle' && isShaftsItemId(sourceItemId));
        if (feathersPair) {
            return { recipe: null, sourceItemId, recognized: true, message: "These don't match." };
        }

        return null;
    }

    function resolveActionTicks(context, recipe) {
        if (Number.isFinite(recipe && recipe.actionTicks)) return Math.max(1, Math.floor(recipe.actionTicks));
        const skillSpec = typeof context.getSkillSpec === 'function' ? context.getSkillSpec(SKILL_ID) : null;
        if (skillSpec && skillSpec.timing && Number.isFinite(skillSpec.timing.actionTicks)) {
            return Math.max(1, Math.floor(skillSpec.timing.actionTicks));
        }
        return DEFAULT_ACTION_TICKS;
    }

    const fletchingModule = {
        canStart(context) {
            if (!context) return false;
            if (context.recipeId) return true;
            return context.targetObj === INVENTORY_TARGET;
        },

        onUseItem(context) {
            if (!context || context.targetObj !== INVENTORY_TARGET) return false;

            const knifeUse = resolveLogForKnifeUse(context);
            if (knifeUse) {
                openFletchingUi(context, knifeUse.logItemId, knifeUse.recipes);
                return true;
            }

            const pairUse = resolveInventoryPairRecipe(context);
            if (!pairUse || !pairUse.recognized) return false;

            if (pairUse.recipe) {
                startQueuedFletching(context, pairUse.recipe, 'all', null, pairUse.sourceItemId);
                return true;
            }

            if (pairUse.message) context.addChatMessage(pairUse.message, 'warn');
            return true;
        },

        onStart(context) {
            closeFletchingUi();

            const recipe = resolveRecipeById(context, context.recipeId);
            if (!validateRecipeStart(context, recipe)) return false;

            const quantityMode = (typeof context.quantityMode === 'string' && context.quantityMode) ? context.quantityMode : 'all';
            const quantityCount = Number.isFinite(context.quantityCount) ? Math.max(1, Math.floor(context.quantityCount)) : null;
            const actionTicks = resolveActionTicks(context, recipe);

            SkillActionResolution.startProcessingSession(context, SKILL_ID, {
                recipeId: recipe.recipeId,
                quantityMode,
                quantityRemaining: quantityMode === 'count' ? quantityCount : null,
                intervalTicks: actionTicks,
                nextTick: context.currentTick + actionTicks
            });

            context.playerState.action = 'SKILLING: FLETCHING';
            context.addChatMessage('You begin fletching.', 'info');
            return true;
        },

        onTick(context) {
            if (context.playerState.action !== 'SKILLING: FLETCHING') return;

            if (!window.SkillActionResolution || typeof SkillActionResolution.tickProcessingSession !== 'function') {
                context.stopAction();
                return;
            }

            SkillActionResolution.tickProcessingSession(context, SKILL_ID, (session) => {
                const recipe = resolveRecipeById(context, session.recipeId);
                const validation = validateRecipeRuntime(context, recipe);
                if (!validation.ok) {
                    if (validation.message) context.addChatMessage(validation.message, validation.reasonCode === 'INPUT_EMPTY' ? 'info' : 'warn');
                    if (typeof context.renderInventory === 'function') context.renderInventory();
                    return SkillActionResolution.stopSkill(context, SKILL_ID, validation.reasonCode);
                }

                const resolution = craftOne(context, recipe);
                if (resolution.status !== 'success') {
                    if (resolution.reasonCode === 'INPUT_EMPTY') {
                        context.addChatMessage('You run out of fletching materials.', 'info');
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

                const canContinue = validateRecipeRuntime(context, recipe);
                if (!canContinue.ok) {
                    if (canContinue.message && canContinue.reasonCode !== 'INPUT_EMPTY') {
                        context.addChatMessage(canContinue.message, 'info');
                    }
                    return SkillActionResolution.stopSkill(context, SKILL_ID, canContinue.reasonCode);
                }

                session.nextTick = context.currentTick + (session.intervalTicks || DEFAULT_ACTION_TICKS);
                return resolution;
            });
        },

        onAnimate(context) {
            if (!context || !context.rig || !context.playerRig) return;

            const rig = context.rig;
            if (typeof context.setShoulderPivot === 'function') context.setShoulderPivot(rig);

            rig.leftArm.rotation.set(0, 0, 0);
            rig.rightArm.rotation.set(0, 0, 0);
            rig.leftLowerArm.rotation.set(-0.03, 0, 0);
            rig.rightLowerArm.rotation.set(-0.03, 0, 0);
            rig.leftLeg.rotation.x = 0;
            rig.rightLeg.rotation.x = 0;
            if (rig.leftLowerLeg) rig.leftLowerLeg.rotation.x = 0;
            if (rig.rightLowerLeg) rig.rightLowerLeg.rotation.x = 0;

            if (rig.leftLeg && rig.leftLeg.position) rig.leftLeg.position.set(0.14, 0.7, 0);
            if (rig.rightLeg && rig.rightLeg.position) rig.rightLeg.position.set(-0.14, 0.7, 0);
            if (rig.leftLowerLeg && rig.leftLowerLeg.position) rig.leftLowerLeg.position.set(0, -0.35, 0);
            if (rig.rightLowerLeg && rig.rightLowerLeg.position) rig.rightLowerLeg.position.set(0, -0.35, 0);

            context.playerRig.rotation.x = 0;
            if (Number.isFinite(context.baseVisualY)) context.playerRig.position.y = context.baseVisualY;
        }
    };

    window.SkillModules = window.SkillModules || {};
    window.SkillModules[SKILL_ID] = fletchingModule;
})();

