(function () {
    const SKILL_ID = 'runecrafting';

    const domain = window.RunecraftingDomain || {};
    const TARGETS = domain.TARGETS || { ALTAR_CANDIDATE: 'ALTAR_CANDIDATE' };

    const POUCH_DEFS = {
        small_pouch: { capacity: 6, requiredLevel: 10 },
        medium_pouch: { capacity: 13, requiredLevel: 20 },
        large_pouch: { capacity: 26, requiredLevel: 30 }
    };

    function ensurePouchState(playerState) {
        if (!playerState) return {};
        if (!playerState.runecraftingPouches || typeof playerState.runecraftingPouches !== 'object') {
            playerState.runecraftingPouches = {};
        }

        const state = playerState.runecraftingPouches;
        const ids = Object.keys(POUCH_DEFS);
        for (let i = 0; i < ids.length; i++) {
            const pouchId = ids[i];
            if (!state[pouchId] || typeof state[pouchId] !== 'object') {
                state[pouchId] = { storedEssence: 0 };
            }
            if (!Number.isFinite(state[pouchId].storedEssence) || state[pouchId].storedEssence < 0) {
                state[pouchId].storedEssence = 0;
            }
        }

        return state;
    }

    function tryFillPouchFromInventory(context, sourceItemId, targetItemId) {
        const a = String(sourceItemId || '');
        const b = String(targetItemId || '');
        const pouchId = a === 'rune_essence' ? b : (b === 'rune_essence' ? a : null);
        if (!pouchId || !POUCH_DEFS[pouchId]) return false;

        const pouchDef = POUCH_DEFS[pouchId];
        if (typeof context.requireSkillLevel === 'function' && !context.requireSkillLevel(pouchDef.requiredLevel, { skillId: SKILL_ID, action: 'use that pouch' })) {
            return true;
        }

        const pouchState = ensurePouchState(context.playerState);
        const stored = pouchState[pouchId].storedEssence;
        const remainingCapacity = Math.max(0, pouchDef.capacity - stored);
        if (remainingCapacity <= 0) {
            context.addChatMessage('That pouch is already full.', 'warn');
            return true;
        }

        const essenceCount = context.getInventoryCount('rune_essence');
        if (essenceCount <= 0) {
            context.addChatMessage('You need rune essence to fill that pouch.', 'warn');
            return true;
        }

        const removed = context.removeItemsById('rune_essence', Math.min(essenceCount, remainingCapacity));
        if (removed <= 0) {
            context.addChatMessage('You cannot fill that pouch right now.', 'warn');
            return true;
        }

        pouchState[pouchId].storedEssence += removed;
        context.renderInventory();
        context.addChatMessage(`You fill the pouch with ${removed} rune essence.`, 'game');
        return true;
    }

    function tryEmptyPouchToInventory(context, pouchItemId) {
        if (!POUCH_DEFS[pouchItemId]) return false;

        const pouchDef = POUCH_DEFS[pouchItemId];
        if (typeof context.requireSkillLevel === 'function' && !context.requireSkillLevel(pouchDef.requiredLevel, { skillId: SKILL_ID, action: 'use that pouch' })) {
            return true;
        }

        const pouchState = ensurePouchState(context.playerState);
        const stored = pouchState[pouchItemId].storedEssence;
        if (stored <= 0) {
            context.addChatMessage('That pouch is empty.', 'warn');
            return true;
        }

        const moved = context.giveItemById('rune_essence', stored);
        if (moved <= 0) {
            context.addChatMessage('You do not have inventory space to empty that pouch.', 'warn');
            return true;
        }

        pouchState[pouchItemId].storedEssence = Math.max(0, stored - moved);
        context.renderInventory();
        context.addChatMessage(`You empty ${moved} rune essence from the pouch.`, 'game');
        return true;
    }

    function getPouchStoredEssence(context, pouchItemId) {
        if (!POUCH_DEFS[pouchItemId]) return 0;
        const pouchState = ensurePouchState(context.playerState);
        const stored = pouchState[pouchItemId] ? pouchState[pouchItemId].storedEssence : 0;
        return Number.isFinite(stored) ? Math.max(0, Math.floor(stored)) : 0;
    }

    function tryUsePouchWithAutoMode(context, pouchItemId, forceEmpty = false) {
        if (!POUCH_DEFS[pouchItemId]) return false;

        const stored = getPouchStoredEssence(context, pouchItemId);
        const capacity = POUCH_DEFS[pouchItemId].capacity;
        const essenceCount = context.getInventoryCount('rune_essence');

        // Click behavior:
        // - Empty pouch: fill
        // - Partial pouch: keep filling while possible
        // - Full pouch: empty
        if (!forceEmpty) {
            if (stored <= 0) return tryFillPouchFromInventory(context, 'rune_essence', pouchItemId);
            if (stored < capacity && essenceCount > 0) return tryFillPouchFromInventory(context, 'rune_essence', pouchItemId);
            if (stored >= capacity) return tryEmptyPouchToInventory(context, pouchItemId);
            context.addChatMessage('You need rune essence to fill that pouch.', 'warn');
            return true;
        }

        return tryEmptyPouchToInventory(context, pouchItemId);
    }

    function buildPouchLabel(context, pouchItemId) {
        const def = POUCH_DEFS[pouchItemId];
        const state = ensurePouchState(context.playerState);
        const stored = state[pouchItemId] ? state[pouchItemId].storedEssence : 0;
        return `${pouchItemId.replace(/_/g, ' ')} (${stored}/${def.capacity})`;
    }

    function getRecipeSet(context) {
        return typeof context.getRecipeSet === 'function' ? context.getRecipeSet(SKILL_ID) : null;
    }

    function getRecipeById(context, recipeId) {
        const recipes = getRecipeSet(context);
        if (!recipes || !recipeId) return null;
        return recipes[recipeId] || null;
    }

    function getAltarName(context) {
        if (context && context.hitData && typeof context.hitData.name === 'string' && context.hitData.name.trim()) {
            return context.hitData.name.trim();
        }
        if (context && typeof context.getAltarNameAt === 'function') {
            const byCoord = context.getAltarNameAt(context.targetX, context.targetY, context.targetZ);
            if (typeof byCoord === 'string' && byCoord.trim()) return byCoord.trim();
        }
        const session = context && context.playerState ? context.playerState.runecraftingSession : null;
        if (session && typeof session.altarName === 'string' && session.altarName.trim()) {
            return session.altarName.trim();
        }
        return null;
    }

    function getRecipesForAltar(context, altarName) {
        const recipes = getRecipeSet(context);
        if (!recipes || !altarName) return [];

        const matches = [];
        const ids = Object.keys(recipes);
        for (let i = 0; i < ids.length; i++) {
            const recipeId = ids[i];
            const recipe = recipes[recipeId];
            if (!recipe || recipe.targetObj !== TARGETS.ALTAR_CANDIDATE) continue;
            if (recipe.altarName !== altarName) continue;
            matches.push({ recipeId, recipe });
        }

        return matches;
    }

    function getRequirementFailure(context, recipe) {
        if (!recipe) return 'MISSING_RECIPE';

        const level = typeof context.getSkillLevel === 'function' ? context.getSkillLevel(SKILL_ID) : 1;
        if (level < (recipe.requiredLevel || 1)) return 'LEVEL_TOO_LOW';

        if (recipe.requiresUnlockFlag) {
            const unlocked = typeof context.hasUnlockFlag === 'function'
                ? context.hasUnlockFlag(recipe.requiresUnlockFlag)
                : false;
            if (!unlocked) return 'QUEST_LOCKED';
        }

        return null;
    }

    function computeCraftPlan(context, recipe, essenceCount) {
        if (!recipe || essenceCount <= 0) {
            return { ok: false, reasonCode: 'NO_ESSENCE' };
        }

        const level = typeof context.getSkillLevel === 'function' ? context.getSkillLevel(SKILL_ID) : 1;
        const outputPerEssence = (window.SkillSpecRegistry && typeof SkillSpecRegistry.computeRuneOutputPerEssence === 'function')
            ? SkillSpecRegistry.computeRuneOutputPerEssence(level, recipe.scalingStartLevel)
            : 1;

        if (!recipe.requiresSecondaryRune) {
            return {
                ok: true,
                essenceUsed: essenceCount,
                outputPerEssence,
                totalOutput: essenceCount * outputPerEssence,
                secondaryRuneItemId: null,
                secondaryConsumed: 0
            };
        }

        const secondaryRuneItemId = recipe.secondaryRuneItemId;
        const secondaryCount = secondaryRuneItemId ? context.getInventoryCount(secondaryRuneItemId) : 0;
        const essenceUsed = Math.min(essenceCount, Math.floor(secondaryCount / outputPerEssence));
        const totalOutput = essenceUsed * outputPerEssence;

        if (essenceUsed <= 0 || totalOutput <= 0) {
            return { ok: false, reasonCode: 'MISSING_SECONDARY' };
        }

        return {
            ok: true,
            essenceUsed,
            outputPerEssence,
            totalOutput,
            secondaryRuneItemId,
            secondaryConsumed: totalOutput
        };
    }

    function resolveRecipeIdFromContext(context) {
        if (!context || context.targetObj !== TARGETS.ALTAR_CANDIDATE) return null;

        const altarName = getAltarName(context);
        const candidates = getRecipesForAltar(context, altarName);
        if (candidates.length === 0) {
            rcDebug(context, `resolve: no recipes for altar='${altarName || 'null'}' target=(${context.targetX},${context.targetY},${context.targetZ})`);
            return null;
        }

        const essenceCount = context.getInventoryCount('rune_essence');

        let bestCombo = null;
        let bestComboFallback = null;
        for (let i = 0; i < candidates.length; i++) {
            const candidate = candidates[i];
            const recipe = candidate.recipe;
            if (!recipe.requiresSecondaryRune) continue;
            const firstSlot = typeof context.getFirstInventorySlotByItemId === 'function'
                ? context.getFirstInventorySlotByItemId(recipe.secondaryRuneItemId)
                : -1;
            if (firstSlot < 0) continue;

            if (!bestComboFallback || firstSlot < bestComboFallback.firstSlot) {
                bestComboFallback = { recipeId: candidate.recipeId, recipe, firstSlot };
            }

            if (getRequirementFailure(context, recipe)) continue;
            const plan = computeCraftPlan(context, recipe, essenceCount);
            if (!plan.ok) continue;

            if (!bestCombo
                || firstSlot < bestCombo.firstSlot
                || (firstSlot === bestCombo.firstSlot && plan.totalOutput > bestCombo.plan.totalOutput)) {
                bestCombo = { recipeId: candidate.recipeId, recipe, plan, firstSlot };
            }
        }
        if (bestCombo) {
            rcDebug(context, `resolve: combo recipe='${bestCombo.recipeId}' slot=${bestCombo.firstSlot}`);
            return bestCombo.recipeId;
        }
        if (bestComboFallback) {
            rcDebug(context, `resolve: combo fallback recipe='${bestComboFallback.recipeId}' slot=${bestComboFallback.firstSlot}`);
            return bestComboFallback.recipeId;
        }

        let bestBase = null;
        for (let i = 0; i < candidates.length; i++) {
            const candidate = candidates[i];
            const recipe = candidate.recipe;
            if (recipe.requiresSecondaryRune) continue;

            const requiredLevel = Number.isFinite(recipe.requiredLevel) ? recipe.requiredLevel : 1;
            if (!bestBase || requiredLevel > bestBase.requiredLevel) {
                bestBase = { recipeId: candidate.recipeId, requiredLevel };
            }
        }

        if (bestBase) rcDebug(context, `resolve: base recipe='${bestBase.recipeId}' req=${bestBase.requiredLevel}`);
        else rcDebug(context, 'resolve: no base recipe');
        return bestBase ? bestBase.recipeId : null;
    }

    function clearSession(context) {
        context.playerState.runecraftingSession = null;
    }

    function formatOutputName(itemId) {
        if (!itemId) return 'runes';
        return String(itemId).replace(/_/g, ' ');
    }

    function rcDebug(context, message) {
        if (!window.QA_RC_DEBUG) return;
        if (!context || typeof context.addChatMessage !== 'function') return;
        context.addChatMessage(`[QA rcdbg] ${message}`, 'info');
    }

    function addNoEssenceMessage(context) {
        context.addChatMessage('You need rune essence to craft runes.', 'warn');
    }

    function addComboUnlockMessage(context) {
        context.addChatMessage('You have not unlocked combination runecrafting yet.', 'warn');
    }

    const runecraftingModule = {
        canStart(context) {
            const recipeId = resolveRecipeIdFromContext(context);
            const recipe = getRecipeById(context, recipeId);
            rcDebug(context, `canStart: recipe=${recipe ? recipeId : 'none'}`);
            return !!recipe;
        },

        onUseItem(context) {
            const recipeId = resolveRecipeIdFromContext(context);
            const recipe = getRecipeById(context, recipeId);
            if (!recipe) {
                rcDebug(context, 'onUseItem: no recipe');
                return false;
            }
            if (context.sourceItemId !== recipe.essenceItemId) return false;
            context.queueInteract();
            context.spawnClickMarker(true);
            return true;
        },

        onStart(context) {
            const recipeId = resolveRecipeIdFromContext(context);
            const recipe = getRecipeById(context, recipeId);
            if (!recipe) {
                rcDebug(context, 'onStart: no recipe');
                return false;
            }

            const requirementFailure = getRequirementFailure(context, recipe);
            if (requirementFailure === 'LEVEL_TOO_LOW') {
                rcDebug(context, `onStart: level gate req=${recipe.requiredLevel}`);
                const needed = Number.isFinite(recipe.requiredLevel) ? recipe.requiredLevel : 1;
                context.addChatMessage(`You need to be level ${needed} to bind these runes`, 'warn');
                return false;
            }
            if (requirementFailure === 'QUEST_LOCKED') {
                rcDebug(context, 'onStart: quest gate');
                addComboUnlockMessage(context);
                return false;
            }

            const essenceCount = context.getInventoryCount(recipe.essenceItemId);
            if (essenceCount <= 0) {
                rcDebug(context, 'onStart: no essence');
                addNoEssenceMessage(context);
                return false;
            }

            const skillSpec = typeof context.getSkillSpec === 'function' ? context.getSkillSpec(SKILL_ID) : null;
            const actionTicks = skillSpec && skillSpec.timing && Number.isFinite(skillSpec.timing.actionTicks)
                ? skillSpec.timing.actionTicks
                : 1;

            context.playerState.runecraftingSession = {
                recipeId,
                altarName: getAltarName(context),
                targetObj: context.targetObj,
                targetX: context.targetX,
                targetY: context.targetY,
                targetZ: context.targetZ,
                nextTick: context.currentTick + Math.max(1, actionTicks)
            };

            context.startSkillingAction();
            return true;
        },

        onTick(context) {
            if (context.playerState.action !== 'SKILLING: ALTAR_CANDIDATE') return;
            const session = context.playerState.runecraftingSession;
            if (!session) {
                context.stopAction();
                return;
            }

            if (context.currentTick < (session.nextTick || 0)) return;

            const recipe = getRecipeById(context, session.recipeId);
            if (!recipe) {
                clearSession(context);
                context.stopAction();
                return;
            }

            if (context.targetObj !== TARGETS.ALTAR_CANDIDATE) {
                clearSession(context);
                context.stopAction();
                return;
            }

            const altarName = getAltarName(context);
            if (session.altarName && altarName && altarName !== session.altarName) {
                clearSession(context);
                context.stopAction();
                return;
            }

            const essenceCount = context.getInventoryCount(recipe.essenceItemId);
            if (essenceCount <= 0) {
                rcDebug(context, 'onTick: no essence');
                addNoEssenceMessage(context);
                clearSession(context);
                context.stopAction();
                return;
            }

            const plan = computeCraftPlan(context, recipe, essenceCount);
            if (!plan.ok) {
                clearSession(context);
                context.stopAction();
                return;
            }

            const removedEssence = context.removeItemsById(recipe.essenceItemId, plan.essenceUsed);
            if (removedEssence <= 0) {
                clearSession(context);
                context.stopAction();
                return;
            }

            if (plan.secondaryRuneItemId && plan.secondaryConsumed > 0) {
                const removedSecondary = context.removeItemsById(plan.secondaryRuneItemId, plan.secondaryConsumed);
                if (removedSecondary < plan.secondaryConsumed) {
                    clearSession(context);
                    context.stopAction();
                    return;
                }
            }

            const crafted = context.giveItemById(recipe.outputItemId, plan.totalOutput);
            if (crafted <= 0) {
                clearSession(context);
                context.stopAction();
                return;
            }

            const outputPerEssence = plan.outputPerEssence || 1;
            const actualEssenceUsedForOutput = Math.max(1, Math.floor(crafted / outputPerEssence));
            const xp = actualEssenceUsedForOutput * (recipe.xpPerEssence || 0);
            context.addSkillXp(SKILL_ID, xp);
            context.addChatMessage(`You bind ${actualEssenceUsedForOutput} rune essence into ${crafted} ${formatOutputName(recipe.outputItemId)}.`, 'game');
            context.renderInventory();

            clearSession(context);
            context.stopAction();
        },

        onAnimate() {
            return false;
        },

        getAnimationSuppressEquipmentVisual() {
            return true;
        },

        getTooltip(context) {
            const recipeId = resolveRecipeIdFromContext(context);
            const recipe = getRecipeById(context, recipeId);
            const altarName = getAltarName(context) || (recipe ? recipe.altarName : 'Altar');
            const outputName = recipe ? formatOutputName(recipe.outputItemId) : 'runes';
            return `<span class="text-gray-300">Craft-rune</span> <span class="text-orange-300">${altarName}</span> <span class="text-cyan-300">(${outputName})</span>`;
        },

        getContextMenu(context) {
            const recipeId = resolveRecipeIdFromContext(context);
            const recipe = getRecipeById(context, recipeId);
            const altarName = getAltarName(context) || (recipe ? recipe.altarName : 'Altar');
            return [
                {
                    text: `Craft-rune <span class="text-orange-300">${altarName}</span>`,
                    onSelect: () => {
                        context.queueInteract();
                        context.spawnClickMarker(true);
                    }
                },
                {
                    text: `Examine <span class="text-orange-300">${altarName}</span>`,
                    onSelect: () => (window.ExamineCatalog ? window.ExamineCatalog.examineTarget('ALTAR_CANDIDATE', { name: altarName }, (message, tone) => context.addChatMessage(message, tone)) : context.addChatMessage('An elemental altar humming with energy.', 'game'))
                }
            ];
        }
    };

    window.SkillModules = window.SkillModules || {};
    window.SkillModules[SKILL_ID] = runecraftingModule;

    window.RunecraftingPouchRuntime = {
        tryUseItemOnInventory(context, sourceItemId, targetItemId) {
            return tryFillPouchFromInventory(context, sourceItemId, targetItemId);
        },
        tryUsePouch(context, pouchItemId, options = {}) {
            const forceEmpty = !!(options && options.forceEmpty);
            return tryUsePouchWithAutoMode(context, pouchItemId, forceEmpty);
        },
        getPouchLabel(context, pouchItemId) {
            if (!POUCH_DEFS[pouchItemId]) return null;
            return buildPouchLabel(context, pouchItemId);
        },
        getPouchStoredEssence(context, pouchItemId) {
            return getPouchStoredEssence(context, pouchItemId);
        }
    };
})();


















